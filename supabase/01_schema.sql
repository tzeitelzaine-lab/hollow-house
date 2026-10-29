-- =====================================================================
-- Who Unalived the CEO of BlueGreen Insurance? — HighCall VA Multiverse
-- 01_schema.sql : tables, security, timing, game logic, host tools
-- Run this first in the Supabase SQL editor, then 02_case_content.sql.
-- Safe to re-run: functions are replaced, tables are created if missing.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;

-- ---------------------------------------------------------------------
-- Tables (public schema, but locked: RLS on, no policies, no grants).
-- Browsers can only reach data through the RPC functions below.
-- ---------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  registration_open boolean not null default true,
  paused_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.events add column if not exists time_limit_ms bigint not null default 1800000;

create table if not exists public.event_pauses (
  id bigserial primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  name_key text not null,
  members text[] not null default '{}',
  pin_hash text not null,
  pin_failures int not null default 0,
  pin_locked_until timestamptz,
  is_preview boolean not null default false,
  stage int not null default 1,                -- highest unlocked stage; 7 = solved
  completed text[] not null default '{}',      -- completed task ids
  inspected text[] not null default '{}',      -- required inspections done
  hints_used int not null default 0,
  wrong_accusations int not null default 0,
  needs_review boolean not null default false,
  registered_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  final_elapsed_ms bigint,
  last_activity_at timestamptz not null default now(),
  unique (event_id, name_key)
);

create table if not exists public.team_sessions (
  token_hash text primary key,
  team_id uuid not null references public.teams(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.hints_revealed (
  team_id uuid not null references public.teams(id) on delete cascade,
  stage int not null,
  level int not null,
  revealed_at timestamptz not null default now(),
  primary key (team_id, stage, level)
);

create table if not exists public.stage_attempts (
  id bigserial primary key,
  team_id uuid not null references public.teams(id) on delete cascade,
  task text not null,
  answer jsonb not null,
  correct boolean not null,
  submitted_at timestamptz not null default now()
);

create table if not exists public.accusations (
  id bigserial primary key,
  team_id uuid not null references public.teams(id) on delete cascade,
  payload jsonb not null,
  correct boolean not null,
  parts_correct int not null,
  submitted_at timestamptz not null default now()
);

-- Host-added evidence (shared by every event). Image stored as a small data URL.
create table if not exists public.custom_evidence (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null default 'Document',
  stage int not null check (stage between 1 and 5),
  summary text not null default '',
  body text not null default '',
  image_data text,
  supports_solution boolean not null default false,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Private tables: never exposed through the API.
create table if not exists private.hints (
  stage int not null, level int not null, body text not null,
  primary key (stage, level)
);
create table if not exists private.content (key text primary key, body text not null);
create table if not exists private.host_config (
  id int primary key default 1 check (id = 1),
  pass_hash text not null
);
create table if not exists private.host_sessions (
  token_hash text primary key,
  expires_at timestamptz not null
);

create index if not exists teams_event_idx on public.teams(event_id);
create index if not exists sessions_team_idx on public.team_sessions(team_id);
create index if not exists pauses_event_idx on public.event_pauses(event_id);

do $$
declare t text;
begin
  foreach t in array array['events','event_pauses','teams','team_sessions','hints_revealed','stage_attempts','accusations','custom_evidence'] loop
    execute format('alter table public.%I enable row level security', t);
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke all on public.%I from anon, authenticated', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Private helpers
-- ---------------------------------------------------------------------
create or replace function private.hash_token(p text) returns text
language sql immutable as $$ select encode(extensions.digest(p, 'sha256'), 'hex') $$;

create or replace function private.new_token() returns text
language sql volatile as $$ select encode(extensions.gen_random_bytes(32), 'hex') $$;

create or replace function private.random_code(n int default 6) returns text
language plpgsql volatile as $$
declare chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; result text := ''; b bytea := extensions.gen_random_bytes(n); i int;
begin
  for i in 0..n-1 loop
    result := result || substr(chars, (get_byte(b, i) % length(chars)) + 1, 1);
  end loop;
  return result;
end $$;

create or replace function private.set_host_passphrase(p_pass text) returns text
language plpgsql as $$
begin
  if p_pass is null or length(p_pass) < 10 then
    raise exception 'Host passphrase must be at least 10 characters';
  end if;
  insert into private.host_config(id, pass_hash) values (1, extensions.crypt(p_pass, extensions.gen_salt('bf', 10)))
  on conflict (id) do update set pass_hash = excluded.pass_hash;
  delete from private.host_sessions;
  return 'Host passphrase set';
end $$;

-- Paused time (ms) for an event overlapping [p_from, p_to].
create or replace function private.paused_ms(p_event uuid, p_from timestamptz, p_to timestamptz) returns bigint
language sql stable as $$
  select coalesce(sum(greatest(0,
           extract(epoch from (least(coalesce(p.ended_at, now()), p_to) - greatest(p.started_at, p_from))) * 1000
         )), 0)::bigint
  from public.event_pauses p
  where p.event_id = p_event and p.started_at < p_to and coalesce(p.ended_at, now()) > p_from
$$;

create or replace function private.limit_ms(p_event uuid) returns bigint
language sql stable as $$ select coalesce((select time_limit_ms from public.events where id = p_event), 1800000) $$;

-- Uncapped play time (pauses excluded).
create or replace function private.raw_elapsed_ms(t public.teams) returns bigint
language sql stable as $$
  select case when t.started_at is null then 0::bigint
    else greatest(0, (extract(epoch from (now() - t.started_at)) * 1000)::bigint
                     - private.paused_ms(t.event_id, t.started_at, now())) end
$$;

-- Time is up: started, not solved, and the event's limit has been reached.
create or replace function private.is_expired(t public.teams) returns boolean
language sql stable as $$
  select t.started_at is not null and t.finished_at is null
     and private.raw_elapsed_ms(t) >= private.limit_ms(t.event_id)
$$;

-- Elapsed time used for scoring: frozen at finish, capped at the time limit.
create or replace function private.elapsed_ms(t public.teams) returns bigint
language sql stable as $$
  select case
    when t.started_at is null then 0::bigint
    when t.final_elapsed_ms is not null then t.final_elapsed_ms
    else least(private.raw_elapsed_ms(t), private.limit_ms(t.event_id))
  end
$$;

create or replace function private.penalty_ms(t public.teams) returns bigint
language sql immutable as $$ select (t.hints_used * 120000 + t.wrong_accusations * 180000)::bigint $$;

-- Ranking: solved teams first (fastest adjusted time), then teams whose time ran out
-- (most tasks completed, then lowest adjusted time). Teams still playing are unranked.
create or replace function private.ranked(p_event uuid) returns table(team_id uuid, rank int)
language sql stable as $$
  select t.id, (row_number() over (order by
      (t.finished_at is null),
      case when t.finished_at is not null then t.final_elapsed_ms + private.penalty_ms(t) end,
      case when t.finished_at is null then -cardinality(t.completed) end,
      private.elapsed_ms(t) + private.penalty_ms(t), t.wrong_accusations, t.hints_used,
      coalesce(t.finished_at, t.started_at)))::int
  from public.teams t
  where t.event_id = p_event and not t.is_preview and (t.finished_at is not null or private.is_expired(t))
$$;

create or replace function private.team_status(t public.teams) returns text
language sql stable as $$
  select case when t.finished_at is not null then 'Solved'
              when private.is_expired(t) then 'Time up'
              when t.started_at is not null then 'Investigating'
              else 'Registered' end
$$;

create or replace function private.team_for(p_token text, p_lock boolean default false) returns public.teams
language plpgsql as $$
declare t public.teams;
begin
  if p_token is null or length(p_token) < 32 then
    raise exception 'INVALID_SESSION' using errcode = 'P0001';
  end if;
  if p_lock then
    select tm.* into t from public.team_sessions s join public.teams tm on tm.id = s.team_id
    where s.token_hash = private.hash_token(p_token) for update of tm;
  else
    select tm.* into t from public.team_sessions s join public.teams tm on tm.id = s.team_id
    where s.token_hash = private.hash_token(p_token);
  end if;
  if t.id is null then raise exception 'INVALID_SESSION' using errcode = 'P0001'; end if;
  return t;
end $$;

create or replace function private.require_active(t public.teams) returns void
language plpgsql as $$
declare v_paused timestamptz;
begin
  if t.started_at is null then raise exception 'NOT_STARTED' using errcode = 'P0001'; end if;
  if t.finished_at is not null then raise exception 'ALREADY_SOLVED' using errcode = 'P0001'; end if;
  select e.paused_at into v_paused from public.events e where e.id = t.event_id;
  if private.is_expired(t) then raise exception 'TIME_UP' using errcode = 'P0001'; end if;
  if v_paused is not null then raise exception 'EVENT_PAUSED' using errcode = 'P0001'; end if;
end $$;

create or replace function private.stage_tasks(p_stage int) returns text[]
language sql immutable as $$
  select case p_stage
    when 1 then array['s1_round1']
    when 2 then array['s2_records']
    when 3 then array['s3_successor','s3_compare']
    when 4 then array['s4_substance','s4_roles']
    when 5 then array['s5_board']
    else array[]::text[] end
$$;

create or replace function private.task_stage(p_task text) returns int
language sql immutable as $$
  select case
    when p_task = 's1_round1' then 1
    when p_task = 's2_records' then 2
    when p_task in ('s3_successor','s3_compare') then 3
    when p_task in ('s4_substance','s4_roles') then 4
    when p_task = 's5_board' then 5
    else null end
$$;

-- Items whose inspection is recorded (scene hotspots in Stage 1, profiles in Stage 2).
create or replace function private.inspection_stage(p_item text) returns int
language sql immutable as $$
  select case
    when p_item in ('obj_glass','obj_paperweight','obj_envelope','e01a','e02') then 1
    when p_item in ('profile:allison','profile:albert','profile:amanda','profile:agatha','profile:veil',
                    'profile:brown','profile:mario','profile:matthew','profile:marigold','profile:andrew') then 2
    else null end
$$;

-- Keep only feedback entries whose part is wrong.
create or replace function private.wrong_feedback(p_parts jsonb, p_fb jsonb) returns jsonb
language sql immutable as $$
  select coalesce(jsonb_object_agg(k, v), '{}'::jsonb)
  from jsonb_each(p_fb) as f(k, v)
  where coalesce((p_parts ->> k)::boolean, false) = false
$$;

create or replace function private.text_set(p jsonb) returns text[]
language sql immutable as $$
  select coalesce(array_agg(distinct x order by x), '{}')
  from jsonb_array_elements_text(case when jsonb_typeof(p) = 'array' then p else '[]'::jsonb end) x
$$;

-- ---------------------------------------------------------------------
-- Answer checking (solution keys live only here, on the server)
-- ---------------------------------------------------------------------
create or replace function private.check_task(p_task text, p jsonb) returns jsonb
language plpgsql immutable as $$
declare parts jsonb; fb jsonb; v_correct boolean; v_order text[]; v_expected text[]; v_in_place int := 0; i int;
begin
  if p_task = 's1_round1' then
    parts := jsonb_build_object(
      'chain',    coalesce(p->>'chain' = 'agatha_amanda', false),
      'exchange', coalesce(p->>'exchange' = 'vp', false),
      'claim',    coalesce(p->>'claim' = 'wanted_role', false));
    fb := jsonb_build_object(
      'chain',    'Read E02 in time order. Who wrote to whom between 08:40 and 08:47?',
      'exchange', 'Agatha''s 08:40 message mentions an agreement. What was it?',
      'claim',    'Separate what was seen and recorded from what was said in the boardroom afterwards.');

  elsif p_task = 's2_records' then
    parts := jsonb_build_object(
      'poisoned_drink',  coalesce(p->>'poisoned_drink' = 'contradicted', false),
      'cardiac_arrest',  coalesce(p->>'cardiac_arrest' = 'supported', false),
      'brown_diagnosed', coalesce(p->>'brown_diagnosed' = 'contradicted', false),
      'stress_cm',       coalesce(p->>'stress_cm' = 'supported', false),
      'amanda_knew',     coalesce(p->>'amanda_knew' = 'unverified', false),
      'nurses_team',     coalesce(p->>'nurses_team' = 'supported', false));
    fb := jsonb_build_object(
      'poisoned_drink',  'Compare the camera times in E03 with when Allison entered, and read the lab result.',
      'cardiac_arrest',  'What does the code record (E04) say the monitor showed at 09:31?',
      'brown_diagnosed', 'Read Dr Brown''s exact words at the end of E04. Is "possible" the same as a diagnosis?',
      'stress_cm',       'Look at the cardiology line in E05.',
      'amanda_knew',     'Does any record so far show what Amanda knew about the envelope''s contents?',
      'nurses_team',     'E04 lists each nurse''s role in the first code.');

  elsif p_task = 's3_successor' then
    parts := jsonb_build_object(
      'recommend',   coalesce(p->>'recommend' = 'allison', false),
      'three_weeks', coalesce(p->>'three_weeks' = 'deadline', false),
      'doorway',     coalesce(p->>'doorway' = 'marigold', false));
    fb := jsonb_build_object(
      'recommend',   'Read the sealed recommendation (E01B) and the 18:05 dictation (E06).',
      'three_weeks', 'Andrew uses the phrase himself in E06. Is he talking about his health or his company?',
      'doorway',     'E06 includes a room access record for suite 701.');

  elsif p_task = 's3_compare' then
    parts := jsonb_build_object(
      'authorized',  coalesce(p->>'authorized' = 'monitoring', false),
      'unsupported', private.text_set(p->'unsupported') = array['prescriber','treatment']);
    fb := jsonb_build_object(
      'authorized',  'Read the instruction under the table in E08.',
      'unsupported', 'Put E08 and E09 side by side. Which two display entries have no basis in the authentic plan?');

  elsif p_task = 's4_substance' then
    parts := jsonb_build_object(
      'proven', private.text_set(p->'proven') = array['x41'],
      'label',  coalesce(p->>'label' = 'u17', false));
    fb := jsonb_build_object(
      'proven', 'Select only what the laboratory actually found (E11). A label is a claim, not a result.',
      'label',  'What did the retained package''s label say?');

  elsif p_task = 's4_timeline' then
    v_expected := array['plan_1410','dictation_1805','doorway_1808','message_1811','voicemail_1822','alteration_2018',
                        'package_2021','fakecheck_2035','handover_2036','admin_2040','deterioration_2044','death_2106'];
    select coalesce(array_agg(x order by ord), '{}') into v_order
    from jsonb_array_elements_text(case when jsonb_typeof(p->'order') = 'array' then p->'order' else '[]'::jsonb end) with ordinality as a(x, ord);
    for i in 1..array_length(v_expected, 1) loop
      if i <= coalesce(array_length(v_order, 1), 0) and v_order[i] = v_expected[i] then v_in_place := v_in_place + 1; end if;
    end loop;
    v_correct := v_order = v_expected;
    return jsonb_build_object('correct', v_correct, 'parts', jsonb_build_object('order', v_correct),
      'in_place', v_in_place, 'total', array_length(v_expected, 1),
      'feedback', case when v_correct then '{}'::jsonb else jsonb_build_object('order',
        format('%s of %s events are in the right position. Every event has a time in E06, E08, E12, E13 or the code record.', v_in_place, array_length(v_expected, 1))) end);

  elsif p_task = 's4_roles' then
    parts := jsonb_build_object(
      'administered',  coalesce(p->>'administered' = 'mario', false),
      'enabled',       coalesce(p->>'enabled' = 'marigold', false),
      'false_checker', coalesce(p->>'false_checker' = 'matthew', false));
    fb := jsonb_build_object(
      'administered',  'Whose administration entry does the audit (E12) call genuine?',
      'enabled',       'Whose session made the 20:18 alteration, and who handled the package at 20:21?',
      'false_checker', 'Whose name appears in the second-check field, and where was that person at 20:35?');

  elsif p_task = 's5_board' then
    parts := jsonb_build_object(
      'mastermind', coalesce(p->>'mastermind' = 'amanda', false),
      'accomplice', coalesce(p->>'accomplice' = 'marigold', false),
      'motive',     coalesce(p->>'motive' in ('e01a','e01b','e06','e07','e14','lounge'), false),
      'method',     coalesce(p->>'method' in ('e09','e11','e12','e13','code2'), false),
      'link',       coalesce(p->>'link' in ('e14','e14b'), false),
      'd1',         coalesce(p->>'d1' = 'name_not_proof', false),
      'd2',         coalesce(p->>'d2' = 'practice_concern', false),
      'd3',         coalesce(p->>'d3' = 'two_events', false));
    fb := jsonb_build_object(
      'mastermind', 'Who planned it from a distance? Read the recovered messages (E14).',
      'accomplice', 'Who was at the bedside end of the plan? Compare E12, E13 and E14.',
      'motive',     'Motive evidence should show why stopping the next morning''s board call mattered.',
      'method',     'Method evidence should show how the fatal product and the false record came about.',
      'link',       'Link evidence should connect your two people to each other.',
      'd1',         'Does a name on a screen prove who typed it? See E09 and E12.',
      'd2',         'Separate not knowing the contents from not checking a conflicting order.',
      'd3',         'Compare E05 (morning) with E11 and E16 (evening).');
  else
    raise exception 'UNKNOWN_TASK' using errcode = 'P0001';
  end if;

  v_correct := not exists (select 1 from jsonb_each(parts) where value <> 'true'::jsonb);
  return jsonb_build_object('correct', v_correct, 'parts', parts, 'feedback', private.wrong_feedback(parts, fb));
end $$;

create or replace function private.check_accusation(p jsonb) returns jsonb
language plpgsql stable as $$
declare v_ev text[] := private.text_set(p->'evidence');
        v_valid text[] := array['e01a','e01b','e06','e07','lounge','e08','e09','e10','code2','e11','e12','e13','e14','e14b','e15','e16'];
        x text; ok boolean := true; a boolean; b boolean; m boolean; w boolean; e boolean; n int;
begin
  a := coalesce(p->>'mastermind' = 'amanda', false);
  b := coalesce(p->>'accomplice' = 'marigold', false);
  m := coalesce(p->>'motive' = 'control_audit', false);
  w := coalesce(p->>'method' = 'x41_as_u17', false);
  if coalesce(array_length(v_ev, 1), 0) <> 3 then ok := false; end if;
  foreach x in array v_ev loop
    if not (x = any(v_valid) or (x like 'custom:%' and exists (
        select 1 from public.custom_evidence c where 'custom:' || c.id::text = x and c.supports_solution and c.visible))) then
      ok := false;
    end if;
  end loop;
  e := ok;
  n := a::int + b::int + m::int + w::int + e::int;
  return jsonb_build_object('correct', n = 5, 'parts_correct', n, 'parts_total', 5);
end $$;

-- Unlock every stage whose required tasks are all complete. Self-heals teams
-- whose progress was saved under an older version of the stage rules.
create or replace function private.sync_stage(p_team uuid) returns void
language plpgsql volatile as $$
declare v_stage int; v_completed text[]; v_new int;
begin
  select stage, completed into v_stage, v_completed from public.teams where id = p_team and finished_at is null for update;
  if v_stage is null then return; end if;
  v_new := v_stage;
  while v_new <= 5 and cardinality(private.stage_tasks(v_new)) > 0 and v_completed @> private.stage_tasks(v_new) loop
    v_new := v_new + 1;
  end loop;
  if v_new <> v_stage then update public.teams set stage = v_new where id = p_team; end if;
end $$;

create or replace function private.team_state(p_team uuid) returns jsonb
language plpgsql stable as $$
declare t public.teams; e public.events; v_rank int; v_hints jsonb; v_last jsonb;
begin
  select * into t from public.teams where id = p_team;
  select * into e from public.events where id = t.event_id;
  select coalesce(jsonb_agg(jsonb_build_object('stage', h.stage, 'level', h.level, 'body', ph.body) order by h.stage, h.level), '[]'::jsonb)
    into v_hints
  from public.hints_revealed h join private.hints ph on ph.stage = h.stage and ph.level = h.level
  where h.team_id = t.id;
  select a.payload || jsonb_build_object('parts_correct', a.parts_correct, 'correct', a.correct) into v_last
  from public.accusations a where a.team_id = t.id order by a.submitted_at desc, a.id desc limit 1;
  if (t.finished_at is not null or private.is_expired(t)) and not t.is_preview then
    select r.rank into v_rank from private.ranked(t.event_id) r where r.team_id = t.id;
  end if;
  return jsonb_build_object(
    'team', jsonb_build_object('name', t.name, 'members', to_jsonb(t.members), 'is_preview', t.is_preview),
    'event', jsonb_build_object('code', e.code, 'name', e.name, 'paused', e.paused_at is not null),
    'stage', t.stage,
    'completed', to_jsonb(t.completed),
    'inspected', to_jsonb(t.inspected),
    'hints', v_hints,
    'hints_used', t.hints_used,
    'wrong_accusations', t.wrong_accusations,
    'needs_review', t.needs_review,
    'last_accusation', v_last,
    'started', t.started_at is not null,
    'solved', t.finished_at is not null,
    'expired', private.is_expired(t),
    'time_limit_ms', private.limit_ms(t.event_id),
    'tasks_completed', cardinality(t.completed),
    'elapsed_ms', private.elapsed_ms(t),
    'penalty_ms', private.penalty_ms(t),
    'server_now', now(),
    'rank', v_rank,
    'reveal', case when t.finished_at is not null then (select body from private.content where key = 'reveal') end
  );
end $$;

-- ---------------------------------------------------------------------
-- Public RPCs for players (SECURITY DEFINER; the only way in)
-- ---------------------------------------------------------------------
create or replace function public.event_info(p_code text) returns jsonb
language plpgsql stable security definer set search_path = public, private, extensions as $$
declare e public.events;
begin
  select * into e from public.events where code = upper(btrim(coalesce(p_code, '')));
  if e.id is null then raise exception 'EVENT_NOT_FOUND' using errcode = 'P0001'; end if;
  return jsonb_build_object('code', e.code, 'name', e.name, 'registration_open', e.registration_open, 'paused', e.paused_at is not null);
end $$;

create or replace function public.register_team(p_code text, p_name text, p_members text[], p_pin text) returns jsonb
language plpgsql volatile security definer set search_path = public, private, extensions as $$
declare e public.events; v_name text; v_members text[]; v_id uuid; v_token text;
begin
  select * into e from public.events where code = upper(btrim(coalesce(p_code, '')));
  if e.id is null then raise exception 'EVENT_NOT_FOUND' using errcode = 'P0001'; end if;
  if not e.registration_open then raise exception 'REGISTRATION_CLOSED' using errcode = 'P0001'; end if;
  v_name := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  if length(v_name) < 2 or length(v_name) > 40 then raise exception 'INVALID_TEAM_NAME' using errcode = 'P0001'; end if;
  if coalesce(p_pin, '') !~ '^[0-9]{4,8}$' then raise exception 'INVALID_PIN' using errcode = 'P0001'; end if;
  select coalesce(array_agg(m), '{}') into v_members
  from (select left(btrim(x), 40) m from unnest(coalesce(p_members, '{}'::text[])) x where btrim(x) <> '' limit 8) s;
  if exists (select 1 from public.teams where event_id = e.id and name_key = lower(v_name)) then
    raise exception 'TEAM_EXISTS' using errcode = 'P0001';
  end if;
  insert into public.teams(event_id, name, name_key, members, pin_hash)
  values (e.id, v_name, lower(v_name), v_members, extensions.crypt(p_pin, extensions.gen_salt('bf', 8)))
  returning id into v_id;
  v_token := private.new_token();
  insert into public.team_sessions(token_hash, team_id) values (private.hash_token(v_token), v_id);
  return jsonb_build_object('token', v_token, 'state', private.team_state(v_id));
exception when unique_violation then
  raise exception 'TEAM_EXISTS' using errcode = 'P0001';
end $$;

-- Returns {error} instead of raising so that PIN failure counts are saved.
create or replace function public.resume_team(p_code text, p_name text, p_pin text) returns jsonb
language plpgsql volatile security definer set search_path = public, private, extensions as $$
declare e public.events; t public.teams; v_token text;
begin
  select * into e from public.events where code = upper(btrim(coalesce(p_code, '')));
  if e.id is null then return jsonb_build_object('error', 'EVENT_NOT_FOUND'); end if;
  select * into t from public.teams
  where event_id = e.id and name_key = lower(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'))) and not is_preview
  for update;
  if t.id is null then return jsonb_build_object('error', 'TEAM_NOT_FOUND'); end if;
  if t.pin_locked_until is not null and t.pin_locked_until > now() then
    return jsonb_build_object('error', 'PIN_LOCKED');
  end if;
  if extensions.crypt(coalesce(p_pin, ''), t.pin_hash) <> t.pin_hash then
    update public.teams set
      pin_locked_until = case when pin_failures + 1 >= 8 then now() + interval '10 minutes' else pin_locked_until end,
      pin_failures = case when pin_failures + 1 >= 8 then 0 else pin_failures + 1 end
    where id = t.id;
    return jsonb_build_object('error', 'WRONG_PIN');
  end if;
  update public.teams set pin_failures = 0, pin_locked_until = null where id = t.id;
  v_token := private.new_token();
  insert into public.team_sessions(token_hash, team_id) values (private.hash_token(v_token), t.id);
  return jsonb_build_object('token', v_token, 'state', private.team_state(t.id));
end $$;

create or replace function public.get_team_state(p_token text) returns jsonb
language plpgsql volatile security definer set search_path = public, private, extensions as $$
declare t public.teams;
begin
  t := private.team_for(p_token);
  perform private.sync_stage(t.id);
  return private.team_state(t.id);
end $$;

create or replace function public.start_investigation(p_token text) returns jsonb
language plpgsql volatile security definer set search_path = public, private, extensions as $$
declare t public.teams; v_paused timestamptz;
begin
  t := private.team_for(p_token, true);
  if t.started_at is null then
    select paused_at into v_paused from public.events where id = t.event_id;
    if v_paused is not null then raise exception 'EVENT_PAUSED' using errcode = 'P0001'; end if;
    update public.teams set started_at = now(), last_activity_at = now() where id = t.id;
  end if;
  return private.team_state(t.id);
end $$;

create or replace function public.record_inspection(p_token text, p_item text) returns jsonb
language plpgsql volatile security definer set search_path = public, private, extensions as $$
declare t public.teams; v_stage int;
begin
  t := private.team_for(p_token, true);
  perform private.require_active(t);
  v_stage := private.inspection_stage(p_item);
  if v_stage is null then raise exception 'UNKNOWN_ITEM' using errcode = 'P0001'; end if;
  if v_stage > t.stage then raise exception 'STAGE_LOCKED' using errcode = 'P0001'; end if;
  if not (p_item = any(t.inspected)) then
    update public.teams set inspected = array_append(inspected, p_item), last_activity_at = now() where id = t.id;
  end if;
  return private.team_state(t.id);
end $$;

create or replace function public.submit_stage(p_token text, p_task text, p_answer jsonb) returns jsonb
language plpgsql volatile security definer set search_path = public, private, extensions as $$
declare t public.teams; v_stage int; r jsonb; v_completed text[];
begin
  t := private.team_for(p_token, true);
  perform private.require_active(t);
  v_stage := private.task_stage(p_task);
  if v_stage is null then raise exception 'UNKNOWN_TASK' using errcode = 'P0001'; end if;
  if v_stage > t.stage then raise exception 'STAGE_LOCKED' using errcode = 'P0001'; end if;
  if p_task = any(t.completed) then
    perform private.sync_stage(t.id);
    return jsonb_build_object('correct', true, 'already', true, 'state', private.team_state(t.id));
  end if;
  if p_task = 's1_round1' and not (t.inspected @> array['obj_glass','obj_paperweight','obj_envelope','e01a','e02']) then
    raise exception 'INSPECT_FIRST' using errcode = 'P0001';
  end if;
  if p_task = 's2_records' and not (t.inspected @> array['profile:allison','profile:albert','profile:amanda','profile:agatha','profile:veil','profile:brown','profile:mario','profile:matthew','profile:marigold']) then
    raise exception 'PROFILES_FIRST' using errcode = 'P0001';
  end if;

  r := private.check_task(p_task, coalesce(p_answer, '{}'::jsonb));
  insert into public.stage_attempts(team_id, task, answer, correct) values (t.id, p_task, coalesce(p_answer, '{}'::jsonb), (r->>'correct')::boolean);

  if (r->>'correct')::boolean then
    v_completed := array_append(t.completed, p_task);
    update public.teams set completed = v_completed, last_activity_at = now() where id = t.id;
    perform private.sync_stage(t.id);
  else
    update public.teams set last_activity_at = now() where id = t.id;
  end if;
  return r || jsonb_build_object('state', private.team_state(t.id));
end $$;

create or replace function public.reveal_hint(p_token text, p_stage int) returns jsonb
language plpgsql volatile security definer set search_path = public, private, extensions as $$
declare t public.teams; v_level int;
begin
  t := private.team_for(p_token, true);
  perform private.require_active(t);
  if p_stage <> t.stage then raise exception 'HINT_STAGE' using errcode = 'P0001'; end if;
  select coalesce(max(level), 0) + 1 into v_level from public.hints_revealed where team_id = t.id and stage = p_stage;
  if v_level > 3 then raise exception 'NO_MORE_HINTS' using errcode = 'P0001'; end if;
  insert into public.hints_revealed(team_id, stage, level) values (t.id, p_stage, v_level);
  update public.teams set hints_used = hints_used + 1, last_activity_at = now() where id = t.id;
  return private.team_state(t.id);
end $$;

create or replace function public.submit_accusation(p_token text, p_accusation jsonb) returns jsonb
language plpgsql volatile security definer set search_path = public, private, extensions as $$
declare t public.teams; r jsonb; v_payload jsonb;
begin
  t := private.team_for(p_token, true);
  perform private.require_active(t);
  if t.stage < 6 then raise exception 'STAGE_LOCKED' using errcode = 'P0001'; end if;
  if t.needs_review then raise exception 'REVIEW_REQUIRED' using errcode = 'P0001'; end if;
  v_payload := jsonb_build_object(
    'mastermind', p_accusation->>'mastermind', 'accomplice', p_accusation->>'accomplice',
    'motive', p_accusation->>'motive', 'method', p_accusation->>'method',
    'evidence', to_jsonb(private.text_set(p_accusation->'evidence')));
  r := private.check_accusation(v_payload);
  insert into public.accusations(team_id, payload, correct, parts_correct)
  values (t.id, v_payload, (r->>'correct')::boolean, (r->>'parts_correct')::int);

  if (r->>'correct')::boolean then
    update public.teams set
      final_elapsed_ms = private.elapsed_ms(t),
      finished_at = now(), stage = 7, last_activity_at = now()
    where id = t.id;
  else
    update public.teams set wrong_accusations = wrong_accusations + 1, needs_review = true, last_activity_at = now()
    where id = t.id;
  end if;
  return r || jsonb_build_object('state', private.team_state(t.id));
end $$;

create or replace function public.acknowledge_review(p_token text) returns jsonb
language plpgsql volatile security definer set search_path = public, private, extensions as $$
declare t public.teams;
begin
  t := private.team_for(p_token, true);
  update public.teams set needs_review = false, last_activity_at = now() where id = t.id;
  return private.team_state(t.id);
end $$;

create or replace function public.get_leaderboard(p_code text) returns jsonb
language plpgsql stable security definer set search_path = public, private, extensions as $$
declare e public.events; v_rows jsonb;
begin
  select * into e from public.events where code = upper(btrim(coalesce(p_code, '')));
  if e.id is null then raise exception 'EVENT_NOT_FOUND' using errcode = 'P0001'; end if;
  select coalesce(jsonb_agg(row_to_json(x) order by x.rank nulls last, x.adjusted_ms, x.team_name), '[]'::jsonb) into v_rows
  from (
    select r.rank, t.name as team_name,
      private.team_status(t) as status, least(t.stage, 6) as stage, cardinality(t.completed) as tasks_completed,
      private.elapsed_ms(t) as elapsed_ms, private.penalty_ms(t) as penalty_ms,
      private.elapsed_ms(t) + private.penalty_ms(t) as adjusted_ms
    from public.teams t left join private.ranked(e.id) r on r.team_id = t.id
    where t.event_id = e.id and not t.is_preview
  ) x;
  return jsonb_build_object('event', jsonb_build_object('code', e.code, 'name', e.name, 'paused', e.paused_at is not null,
                              'time_limit_ms', e.time_limit_ms), 'rows', v_rows, 'server_now', now());
end $$;

-- ---------------------------------------------------------------------
-- Host RPCs (passphrase -> short-lived session token)
-- ---------------------------------------------------------------------
create or replace function private.host_require(p_token text) returns void
language plpgsql as $$
begin
  if p_token is null or not exists (select 1 from private.host_sessions where token_hash = private.hash_token(p_token) and expires_at > now()) then
    raise exception 'HOST_AUTH' using errcode = 'P0001';
  end if;
end $$;

create or replace function private.host_event(p_code text) returns public.events
language plpgsql as $$
declare e public.events;
begin
  select * into e from public.events where code = upper(btrim(coalesce(p_code, ''))) for update;
  if e.id is null then raise exception 'EVENT_NOT_FOUND' using errcode = 'P0001'; end if;
  return e;
end $$;

create or replace function public.host_login(p_pass text) returns jsonb
language plpgsql volatile security definer set search_path = public, private, extensions as $$
declare v_hash text; v_token text;
begin
  select pass_hash into v_hash from private.host_config where id = 1;
  if v_hash is null then raise exception 'HOST_NOT_CONFIGURED' using errcode = 'P0001'; end if;
  if extensions.crypt(coalesce(p_pass, ''), v_hash) <> v_hash then
    perform pg_sleep(1);
    raise exception 'HOST_AUTH' using errcode = 'P0001';
  end if;
  delete from private.host_sessions where expires_at < now();
  v_token := private.new_token();
  insert into private.host_sessions(token_hash, expires_at) values (private.hash_token(v_token), now() + interval '12 hours');
  return jsonb_build_object('token', v_token);
end $$;

create or replace function public.host_logout(p_token text) returns void
language sql volatile security definer set search_path = public, private, extensions as $$
  delete from private.host_sessions where token_hash = private.hash_token(coalesce(p_token, ''))
$$;

create or replace function public.host_list_events(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public, private, extensions as $$
begin
  perform private.host_require(p_token);
  return coalesce((select jsonb_agg(jsonb_build_object(
      'code', e.code, 'name', e.name, 'registration_open', e.registration_open, 'paused', e.paused_at is not null,
      'created_at', e.created_at,
      'teams', (select count(*) from public.teams t where t.event_id = e.id and not t.is_preview),
      'solved', (select count(*) from public.teams t where t.event_id = e.id and not t.is_preview and t.finished_at is not null))
    order by e.created_at desc) from public.events e), '[]'::jsonb);
end $$;

create or replace function public.host_create_event(p_token text, p_name text, p_code text default null) returns jsonb
language plpgsql volatile security definer set search_path = public, private, extensions as $$
declare v_code text := upper(btrim(coalesce(p_code, ''))); v_name text := btrim(coalesce(p_name, ''));
begin
  perform private.host_require(p_token);
  if length(v_name) < 2 then raise exception 'INVALID_EVENT_NAME' using errcode = 'P0001'; end if;
  if v_code = '' then
    loop
      v_code := private.random_code(6);
      exit when not exists (select 1 from public.events where code = v_code);
    end loop;
  elsif v_code !~ '^[A-Z0-9]{4,12}$' then
    raise exception 'INVALID_EVENT_CODE' using errcode = 'P0001';
  elsif exists (select 1 from public.events where code = v_code) then
    raise exception 'EVENT_CODE_TAKEN' using errcode = 'P0001';
  end if;
  insert into public.events(code, name) values (v_code, left(v_name, 80));
  return jsonb_build_object('code', v_code);
end $$;

create or replace function public.host_event_detail(p_token text, p_code text) returns jsonb
language plpgsql stable security definer set search_path = public, private, extensions as $$
declare e public.events; v_teams jsonb;
begin
  perform private.host_require(p_token);
  select * into e from public.events where code = upper(btrim(coalesce(p_code, '')));
  if e.id is null then raise exception 'EVENT_NOT_FOUND' using errcode = 'P0001'; end if;
  select coalesce(jsonb_agg(row_to_json(x) order by x.is_preview, x.rank nulls last, x.registered_at), '[]'::jsonb) into v_teams
  from (
    select t.id, t.name, t.members, t.is_preview, t.stage, t.hints_used, t.wrong_accusations, t.needs_review,
      cardinality(t.completed) as tasks_completed,
      (select count(*) from public.accusations a where a.team_id = t.id) as accusations,
      (select count(*) from public.stage_attempts s where s.team_id = t.id and not s.correct) as wrong_stage_answers,
      t.registered_at, t.started_at, t.finished_at, t.last_activity_at,
      private.team_status(t) as status,
      private.elapsed_ms(t) as elapsed_ms, private.penalty_ms(t) as penalty_ms,
      private.elapsed_ms(t) + private.penalty_ms(t) as adjusted_ms, r.rank
    from public.teams t left join private.ranked(e.id) r on r.team_id = t.id
    where t.event_id = e.id
  ) x;
  return jsonb_build_object('event', jsonb_build_object('code', e.code, 'name', e.name,
      'registration_open', e.registration_open, 'paused', e.paused_at is not null, 'paused_at', e.paused_at,
      'time_limit_ms', e.time_limit_ms,
      'total_paused_ms', private.paused_ms(e.id, e.created_at, now())),
    'teams', v_teams, 'server_now', now());
end $$;

create or replace function public.host_set_registration(p_token text, p_code text, p_open boolean) returns jsonb
language plpgsql volatile security definer set search_path = public, private, extensions as $$
declare e public.events;
begin
  perform private.host_require(p_token);
  e := private.host_event(p_code);
  update public.events set registration_open = coalesce(p_open, false) where id = e.id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.host_set_paused(p_token text, p_code text, p_paused boolean) returns jsonb
language plpgsql volatile security definer set search_path = public, private, extensions as $$
declare e public.events;
begin
  perform private.host_require(p_token);
  e := private.host_event(p_code);
  if p_paused and e.paused_at is null then
    update public.events set paused_at = now() where id = e.id;
    insert into public.event_pauses(event_id, started_at) values (e.id, now());
  elsif not p_paused and e.paused_at is not null then
    update public.event_pauses set ended_at = now() where event_id = e.id and ended_at is null;
    update public.events set paused_at = null where id = e.id;
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.host_set_time_limit(p_token text, p_code text, p_minutes int) returns jsonb
language plpgsql volatile security definer set search_path = public, private, extensions as $$
declare e public.events;
begin
  perform private.host_require(p_token);
  e := private.host_event(p_code);
  if p_minutes is null or p_minutes < 5 or p_minutes > 180 then raise exception 'INVALID_TIME_LIMIT' using errcode = 'P0001'; end if;
  update public.events set time_limit_ms = p_minutes::bigint * 60000 where id = e.id;
  return jsonb_build_object('ok', true, 'time_limit_ms', p_minutes::bigint * 60000);
end $$;

create or replace function public.host_create_preview(p_token text, p_code text) returns jsonb
language plpgsql volatile security definer set search_path = public, private, extensions as $$
declare e public.events; v_id uuid; v_token text;
begin
  perform private.host_require(p_token);
  e := private.host_event(p_code);
  insert into public.teams(event_id, name, name_key, pin_hash, is_preview)
  values (e.id, 'Host preview ' || to_char(now(), 'HH24:MI:SS'), 'preview:' || gen_random_uuid(),
          extensions.crypt(private.new_token(), extensions.gen_salt('bf', 6)), true)
  returning id into v_id;
  v_token := private.new_token();
  insert into public.team_sessions(token_hash, team_id) values (private.hash_token(v_token), v_id);
  return jsonb_build_object('token', v_token, 'code', e.code);
end $$;

create or replace function public.host_delete_team(p_token text, p_team_id uuid, p_confirm_name text) returns jsonb
language plpgsql volatile security definer set search_path = public, private, extensions as $$
declare t public.teams;
begin
  perform private.host_require(p_token);
  select * into t from public.teams where id = p_team_id;
  if t.id is null then raise exception 'TEAM_NOT_FOUND' using errcode = 'P0001'; end if;
  if coalesce(p_confirm_name, '') <> t.name then raise exception 'CONFIRMATION_MISMATCH' using errcode = 'P0001'; end if;
  delete from public.teams where id = t.id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.host_reset_event(p_token text, p_code text, p_confirm_code text) returns jsonb
language plpgsql volatile security definer set search_path = public, private, extensions as $$
declare e public.events;
begin
  perform private.host_require(p_token);
  e := private.host_event(p_code);
  if upper(btrim(coalesce(p_confirm_code, ''))) <> e.code then raise exception 'CONFIRMATION_MISMATCH' using errcode = 'P0001'; end if;
  delete from public.teams where event_id = e.id;
  delete from public.event_pauses where event_id = e.id;
  update public.events set paused_at = null where id = e.id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.host_delete_event(p_token text, p_code text, p_confirm_code text) returns jsonb
language plpgsql volatile security definer set search_path = public, private, extensions as $$
declare e public.events;
begin
  perform private.host_require(p_token);
  e := private.host_event(p_code);
  if upper(btrim(coalesce(p_confirm_code, ''))) <> e.code then raise exception 'CONFIRMATION_MISMATCH' using errcode = 'P0001'; end if;
  delete from public.events where id = e.id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.host_solution(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public, private, extensions as $$
begin
  perform private.host_require(p_token);
  return jsonb_build_object(
    'walkthrough', (select body from private.content where key = 'walkthrough'),
    'reveal', (select body from private.content where key = 'reveal'));
end $$;


-- ---------------------------------------------------------------------
-- Host-added evidence
-- ---------------------------------------------------------------------
create or replace function public.get_custom_evidence(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public, private, extensions as $$
declare t public.teams;
begin
  t := private.team_for(p_token);
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', 'custom:' || c.id::text, 'title', c.title, 'kind', c.kind, 'stage', c.stage,
      'summary', c.summary, 'body', c.body, 'image', c.image_data) order by c.stage, c.created_at)
    from public.custom_evidence c where c.visible and c.stage <= least(t.stage, 6)), '[]'::jsonb);
end $$;

create or replace function public.host_list_evidence(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public, private, extensions as $$
begin
  perform private.host_require(p_token);
  return coalesce((select jsonb_agg(to_jsonb(c) order by c.stage, c.created_at) from public.custom_evidence c), '[]'::jsonb);
end $$;

create or replace function public.host_save_evidence(p_token text, p_id uuid, p_data jsonb) returns jsonb
language plpgsql volatile security definer set search_path = public, private, extensions as $$
declare v_title text := btrim(coalesce(p_data->>'title', '')); v_stage int; v_img text := nullif(p_data->>'image_data', ''); v_id uuid;
begin
  perform private.host_require(p_token);
  if length(v_title) < 2 or length(v_title) > 120 then raise exception 'INVALID_EVIDENCE' using errcode = 'P0001'; end if;
  v_stage := coalesce((p_data->>'stage')::int, 0);
  if v_stage < 1 or v_stage > 5 then raise exception 'INVALID_EVIDENCE' using errcode = 'P0001'; end if;
  if length(coalesce(p_data->>'body', '')) > 10000 or length(coalesce(p_data->>'summary', '')) > 300 then
    raise exception 'INVALID_EVIDENCE' using errcode = 'P0001'; end if;
  if v_img is not null and (v_img !~ '^data:image/(png|jpeg|webp|gif);base64,' or length(v_img) > 3000000) then
    raise exception 'INVALID_IMAGE' using errcode = 'P0001'; end if;
  if p_id is null then
    insert into public.custom_evidence(title, kind, stage, summary, body, image_data, supports_solution, visible)
    values (v_title, left(coalesce(nullif(btrim(p_data->>'kind'), ''), 'Document'), 40), v_stage,
            coalesce(p_data->>'summary', ''), coalesce(p_data->>'body', ''), v_img,
            coalesce((p_data->>'supports_solution')::boolean, false), coalesce((p_data->>'visible')::boolean, true))
    returning id into v_id;
  else
    update public.custom_evidence set title = v_title,
      kind = left(coalesce(nullif(btrim(p_data->>'kind'), ''), 'Document'), 40), stage = v_stage,
      summary = coalesce(p_data->>'summary', ''), body = coalesce(p_data->>'body', ''),
      image_data = case when coalesce((p_data->>'keep_image')::boolean, false) then image_data else v_img end,
      supports_solution = coalesce((p_data->>'supports_solution')::boolean, false),
      visible = coalesce((p_data->>'visible')::boolean, true), updated_at = now()
    where id = p_id returning id into v_id;
    if v_id is null then raise exception 'EVIDENCE_NOT_FOUND' using errcode = 'P0001'; end if;
  end if;
  return jsonb_build_object('id', v_id);
end $$;

create or replace function public.host_delete_evidence(p_token text, p_id uuid, p_confirm_title text) returns jsonb
language plpgsql volatile security definer set search_path = public, private, extensions as $$
declare v_title text;
begin
  perform private.host_require(p_token);
  select title into v_title from public.custom_evidence where id = p_id;
  if v_title is null then raise exception 'EVIDENCE_NOT_FOUND' using errcode = 'P0001'; end if;
  if coalesce(p_confirm_title, '') <> v_title then raise exception 'CONFIRMATION_MISMATCH' using errcode = 'P0001'; end if;
  delete from public.custom_evidence where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

-- ---------------------------------------------------------------------
-- Grants: browsers may only execute the public RPCs.
-- ---------------------------------------------------------------------
revoke all on all functions in schema private from public;
do $$
declare f text;
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    foreach f in array array[
      'event_info(text)','register_team(text,text,text[],text)','resume_team(text,text,text)','get_team_state(text)',
      'start_investigation(text)','record_inspection(text,text)','submit_stage(text,text,jsonb)','reveal_hint(text,int)',
      'submit_accusation(text,jsonb)','acknowledge_review(text)','get_leaderboard(text)',
      'host_login(text)','host_logout(text)','host_list_events(text)','host_create_event(text,text,text)',
      'host_event_detail(text,text)','host_set_registration(text,text,boolean)','host_set_paused(text,text,boolean)',
      'host_create_preview(text,text)','host_delete_team(text,uuid,text)','host_reset_event(text,text,text)',
      'host_delete_event(text,text,text)','host_solution(text)',
      'get_custom_evidence(text)','host_list_evidence(text)','host_save_evidence(text,uuid,jsonb)','host_delete_evidence(text,uuid,text)','host_set_time_limit(text,text,int)'] loop
      execute format('revoke all on function public.%s from public', f);
      execute format('grant execute on function public.%s to anon, authenticated', f);
    end loop;
  end if;
end $$;
