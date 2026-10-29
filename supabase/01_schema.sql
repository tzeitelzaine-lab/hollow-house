-- =====================================================================
-- The Heiress of Hollow House — HighCall VA Multiverse
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
  foreach t in array array['events','event_pauses','teams','team_sessions','hints_revealed','stage_attempts','accusations'] loop
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

create or replace function private.elapsed_ms(t public.teams) returns bigint
language sql stable as $$
  select case
    when t.started_at is null then 0::bigint
    when t.final_elapsed_ms is not null then t.final_elapsed_ms
    else greatest(0, (extract(epoch from (now() - t.started_at)) * 1000)::bigint
                     - private.paused_ms(t.event_id, t.started_at, now()))
  end
$$;

create or replace function private.penalty_ms(t public.teams) returns bigint
language sql immutable as $$ select (t.hints_used * 120000 + t.wrong_accusations * 180000)::bigint $$;

create or replace function private.ranked(p_event uuid) returns table(team_id uuid, rank int)
language sql stable as $$
  select t.id,
         (row_number() over (order by t.final_elapsed_ms + private.penalty_ms(t), t.wrong_accusations, t.hints_used, t.finished_at))::int
  from public.teams t
  where t.event_id = p_event and t.finished_at is not null and not t.is_preview
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
  if v_paused is not null then raise exception 'EVENT_PAUSED' using errcode = 'P0001'; end if;
end $$;

create or replace function private.stage_tasks(p_stage int) returns text[]
language sql immutable as $$
  select case p_stage
    when 1 then array['s1_observation']
    when 2 then array['s2_classify']
    when 3 then array['s3_money']
    when 4 then array['s4_timeline','s4_alibi','s4_contradictions']
    when 5 then array['s5_board']
    else array[]::text[] end
$$;

create or replace function private.task_stage(p_task text) returns int
language sql immutable as $$
  select case
    when p_task = 's1_observation' then 1
    when p_task = 's2_classify' then 2
    when p_task = 's3_money' then 3
    when p_task in ('s4_timeline','s4_alibi','s4_contradictions') then 4
    when p_task = 's5_board' then 5
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
  if p_task = 's1_observation' then
    parts := jsonb_build_object(
      'alias',  coalesce(p->>'alias' = 'eva_reed', false),
      'staged', private.text_set(p->'staged') = array['cash_left','glass_outside'],
      'weapon', coalesce(p->>'weapon' = 'candlestick', false));
    fb := jsonb_build_object(
      'alias',  'Check whose name is written on the lease, not who the tenant really was.',
      'staged', 'Pick exactly the two observations that a real burglary would not leave behind. Re-read the bag and the window.',
      'weapon', 'Which object in the room is heavy, out of place and has been wiped?');

  elsif p_task = 's2_classify' then
    parts := jsonb_build_object(
      'noah_visit',    coalesce(p->>'noah_visit' = 'confirmed', false),
      'adrian_party',  coalesce(p->>'adrian_party' = 'unverified', false),
      'marta_knew',    coalesce(p->>'marta_knew' = 'confirmed', false),
      'leo_noah',      coalesce(p->>'leo_noah' = 'unverified', false),
      'tessa_knew',    coalesce(p->>'tessa_knew' = 'confirmed', false),
      'celeste_party', coalesce(p->>'celeste_party' = 'confirmed', false));
    fb := jsonb_build_object(
      'noah_visit',    'Does anyone besides Noah support this, or does Noah admit something that hurts him?',
      'adrian_party',  'Who, other than Adrian himself, says this? Check the minor witnesses.',
      'marta_knew',    'Re-read Marta''s statement and the note on the lease.',
      'leo_noah',      'Leo says he is sure. Is his certainty supported by anything else yet?',
      'tessa_knew',    'Compare Tessa''s statement with the private message she handed over.',
      'celeste_party', 'Someone at the masquerade talks about where Celeste was.');

  elsif p_task = 's3_money' then
    parts := jsonb_build_object(
      'purpose', coalesce(p->>'purpose' = 'residents', false),
      'payee',   coalesce(p->>'payee' = 'larkspur', false),
      'link',    coalesce(p->>'link' = 'adrian', false));
    fb := jsonb_build_object(
      'purpose', 'Evelyn''s handwritten resident notes show what she was doing in the building.',
      'payee',   'Compare what the trust paid for with what residents and the caretaker say actually happened.',
      'link',    'Look at who approved the suspicious payments and where the vendor is registered.');

  elsif p_task = 's4_timeline' then
    v_expected := array['noah_arrives','photo_a_taken','noah_leaves','noah_shop','voice_msg','adrian_enters',
                        'msg_851','crash','adrian_leaves','photo_a_upload','photo_b','discovery'];
    select coalesce(array_agg(x order by ord), '{}') into v_order
    from jsonb_array_elements_text(case when jsonb_typeof(p->'order') = 'array' then p->'order' else '[]'::jsonb end) with ordinality as a(x, ord);
    for i in 1..array_length(v_expected, 1) loop
      if i <= coalesce(array_length(v_order, 1), 0) and v_order[i] = v_expected[i] then v_in_place := v_in_place + 1; end if;
    end loop;
    v_correct := v_order = v_expected;
    return jsonb_build_object('correct', v_correct, 'parts', jsonb_build_object('order', v_correct),
      'in_place', v_in_place, 'total', array_length(v_expected, 1),
      'feedback', case when v_correct then '{}'::jsonb else jsonb_build_object('order',
        format('%s of %s events are in the right position. Every event has a time in the Stage 4 evidence — and Party photo A has two different times.', v_in_place, array_length(v_expected, 1))) end);

  elsif p_task = 's4_alibi' then
    parts := jsonb_build_object(
      'alibi',  coalesce(p->>'alibi' = 'adrian', false),
      'reason', coalesce(p->>'reason' = 'capture_before', false));
    fb := jsonb_build_object(
      'alibi',  'Which alibi depends on a single piece of evidence that does not mean what its owner says it means?',
      'reason', 'Read the photo metadata carefully: what does each timestamp actually measure?');

  elsif p_task = 's4_contradictions' then
    parts := jsonb_build_object(
      'c_adrian_never_left', coalesce(p->>'c_adrian_never_left' = 'camera', false),
      'c_leo_noah',          coalesce(p->>'c_leo_noah' in ('shop_footage','leo_revised'), false),
      'c_photo_914',         coalesce(p->>'c_photo_914' = 'party_photos', false));
    fb := jsonb_build_object(
      'c_adrian_never_left', 'Which record shows who came in and out of Hollow House, with exact times?',
      'c_leo_noah',          'Where was Noah when Leo heard the crash? Or: what did Leo say once he thought again?',
      'c_photo_914',         'Which evidence shows when Photo A was actually taken?');

  elsif p_task = 's5_board' then
    parts := jsonb_build_object(
      'suspect',     coalesce(p->>'suspect' = 'adrian', false),
      'motive',      coalesce(p->>'motive' in ('payments','registry','survey','auditor_email'), false),
      'opportunity', coalesce(p->>'opportunity' in ('camera','msg_851'), false),
      'physical',    coalesce(p->>'physical' = 'cufflink', false),
      'd1',          coalesce(p->>'d1' = 'capture_before', false),
      'd2',          coalesce(p->>'d2' = 'matches_missing', false),
      'd3',          coalesce(p->>'d3' = 'staged', false));
    fb := jsonb_build_object(
      'suspect',     'Whose story fails on motive, presence and alibi all at once?',
      'motive',      'Motive evidence should show why your suspect needed Evelyn silenced that week.',
      'opportunity', 'Opportunity evidence should place your suspect inside Hollow House during the time of death.',
      'physical',    'Physical evidence should tie your suspect to the room itself, not just to the victim.',
      'd1',          'Revisit the difference between capture time and upload time.',
      'd2',          'A matching object alone proves little. What else makes it point to one person?',
      'd3',          'Remember what you found at the window and in the bag in Stage 1.');
  else
    raise exception 'UNKNOWN_TASK' using errcode = 'P0001';
  end if;

  v_correct := not exists (select 1 from jsonb_each(parts) where value <> 'true'::jsonb);
  return jsonb_build_object('correct', v_correct, 'parts', parts, 'feedback', private.wrong_feedback(parts, fb));
end $$;

create or replace function private.check_accusation(p jsonb) returns jsonb
language plpgsql immutable as $$
declare v_ev text[] := private.text_set(p->'evidence');
        v_valid text[] := array['payments','survey','registry','auditor_email','camera','msg_851','party_photos','medical','cufflink','leo_revised'];
        k boolean; m boolean; w boolean; e boolean; n int;
begin
  k := coalesce(p->>'killer' = 'adrian', false);
  m := coalesce(p->>'motive' = 'fraud', false);
  w := coalesce(p->>'weapon' = 'candlestick', false);
  e := coalesce(array_length(v_ev, 1), 0) = 3 and v_ev <@ v_valid;
  n := k::int + m::int + w::int + e::int;
  return jsonb_build_object('correct', n = 4, 'parts_correct', n);
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
  if t.finished_at is not null and not t.is_preview then
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
language plpgsql stable security definer set search_path = public, private, extensions as $$
declare t public.teams;
begin
  t := private.team_for(p_token);
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
  v_stage := case
    when p_item in ('bag','lease','candlestick','window','note','cufflink') then 1
    when p_item in ('profile:adrian','profile:noah','profile:marta','profile:celeste','profile:tessa','profile:leo') then 2
    else null end;
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
    return jsonb_build_object('correct', true, 'already', true, 'state', private.team_state(t.id));
  end if;
  if p_task = 's1_observation' and not (t.inspected @> array['bag','lease','candlestick','window','note']) then
    raise exception 'INSPECT_FIRST' using errcode = 'P0001';
  end if;
  if p_task = 's2_classify' and not (t.inspected @> array['profile:adrian','profile:noah','profile:marta','profile:celeste','profile:tessa','profile:leo']) then
    raise exception 'PROFILES_FIRST' using errcode = 'P0001';
  end if;

  r := private.check_task(p_task, coalesce(p_answer, '{}'::jsonb));
  insert into public.stage_attempts(team_id, task, answer, correct) values (t.id, p_task, coalesce(p_answer, '{}'::jsonb), (r->>'correct')::boolean);

  if (r->>'correct')::boolean then
    v_completed := array_append(t.completed, p_task);
    update public.teams set completed = v_completed,
      stage = case when v_completed @> private.stage_tasks(t.stage) then t.stage + 1 else t.stage end,
      last_activity_at = now()
    where id = t.id;
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
    'killer', p_accusation->>'killer', 'motive', p_accusation->>'motive', 'weapon', p_accusation->>'weapon',
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
      case when t.finished_at is not null then 'Solved' when t.started_at is not null then 'Investigating' else 'Registered' end as status,
      private.elapsed_ms(t) as elapsed_ms, private.penalty_ms(t) as penalty_ms,
      private.elapsed_ms(t) + private.penalty_ms(t) as adjusted_ms
    from public.teams t left join private.ranked(e.id) r on r.team_id = t.id
    where t.event_id = e.id and not t.is_preview
  ) x;
  return jsonb_build_object('event', jsonb_build_object('code', e.code, 'name', e.name, 'paused', e.paused_at is not null),
                            'rows', v_rows, 'server_now', now());
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
      case when t.finished_at is not null then 'Solved' when t.started_at is not null then 'Investigating' else 'Registered' end as status,
      private.elapsed_ms(t) as elapsed_ms, private.penalty_ms(t) as penalty_ms,
      private.elapsed_ms(t) + private.penalty_ms(t) as adjusted_ms, r.rank
    from public.teams t left join private.ranked(e.id) r on r.team_id = t.id
    where t.event_id = e.id
  ) x;
  return jsonb_build_object('event', jsonb_build_object('code', e.code, 'name', e.name,
      'registration_open', e.registration_open, 'paused', e.paused_at is not null, 'paused_at', e.paused_at,
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
      'host_delete_event(text,text,text)','host_solution(text)'] loop
      execute format('revoke all on function public.%s from public', f);
      execute format('grant execute on function public.%s to anon, authenticated', f);
    end loop;
  end if;
end $$;
