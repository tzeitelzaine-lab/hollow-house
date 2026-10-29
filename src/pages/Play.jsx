import { useCallback, useEffect, useRef, useState } from 'react';
import { CASE, STAGES, EVIDENCE, EVIDENCE_BY_ID, CHARACTERS, STAGE_TASKS, HOTSPOTS } from '../content/story.js';
import { rpc, session, fmt } from '../lib/core.js';
import { Modal, EvidenceDoc, ProfileDoc, Markdown, SoundToggle } from '../components/ui.jsx';
import { EvidenceArt, Portrait } from '../art/Art.jsx';
import { StageView } from './stages.jsx';

const TASK_NAMES = {
  s1_observation: 'the observation report', s2_classify: 'the facts-and-claims task', s3_money: 'the money questions',
  s4_timeline: 'the timeline', s4_alibi: 'the alibi question', s4_contradictions: 'the contradictions', s5_board: 'the evidence board',
};

export default function Play({ go }) {
  const sess = session.get();
  const [state, setState] = useState(null);
  const [syncedAt, setSyncedAt] = useState(0);
  const [fatal, setFatal] = useState('');
  const [offline, setOffline] = useState(false);
  const [unsaved, setUnsaved] = useState('');
  const [view, setView] = useState(null);
  const [modal, setModal] = useState(null); // {type:'evidence'|'profile'|'locker', id}
  const stateRef = useRef(null);

  const apply = (st) => { stateRef.current = st; setState(st); setSyncedAt(Date.now()); };

  const refresh = useCallback(async () => {
    if (!sess) return;
    try {
      apply(await rpc('get_team_state', { p_token: sess.token }));
      setOffline(false); setFatal('');
    } catch (e) {
      if (e.code === 'INVALID_SESSION') { session.clear(); setFatal(e.message); }
      else if (e.network) setOffline(true);
      else if (!stateRef.current) setFatal(e.message);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    const onVis = () => document.visibilityState === 'visible' && refresh();
    window.addEventListener('online', refresh);
    window.addEventListener('offline', () => setOffline(true));
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); window.removeEventListener('online', refresh); document.removeEventListener('visibilitychange', onVis); };
  }, [refresh]);

  const act = useCallback(async (name, args = {}) => {
    try {
      const r = await rpc(name, { p_token: sess.token, ...args });
      setOffline(false); setUnsaved('');
      const st = r && r.state ? r.state : r;
      if (st && st.team) apply(st);
      return r;
    } catch (e) {
      if (e.network) { setOffline(true); setUnsaved('Your last action was not saved. It will not count until you repeat it with a working connection.'); }
      if (e.code === 'INVALID_SESSION') { session.clear(); setFatal(e.message); }
      if (e.code === 'EVENT_PAUSED') refresh();
      throw e;
    }
  }, [refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const loaded = Boolean(state);
  useEffect(() => {
    if (loaded && view == null) setView(stateRef.current.solved ? 'reveal' : Math.min(stateRef.current.stage, 6));
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  const solvedNow = Boolean(state?.solved);
  useEffect(() => { if (solvedNow) setView('reveal'); }, [solvedNow]);
  useEffect(() => { window.scrollTo(0, 0); }, [view]);

  const openEvidence = useCallback((id) => {
    setModal({ type: 'evidence', id });
    const st = stateRef.current;
    const isScene = HOTSPOTS.some((h) => h.id === id);
    if (isScene && st && !st.solved && !st.event.paused && !st.inspected.includes(id)) {
      act('record_inspection', { p_item: id }).catch(() => {});
    }
  }, [act]);

  const openProfile = useCallback((id) => {
    setModal({ type: 'profile', id });
    const st = stateRef.current;
    const key = `profile:${id}`;
    if (st && st.stage >= 2 && !st.solved && !st.event.paused && !st.inspected.includes(key)) {
      act('record_inspection', { p_item: key }).catch(() => {});
    }
  }, [act]);

  if (!sess || (fatal && !state)) {
    return (
      <main id="main" className="center-page">
        <h1 className="page-title">No investigation open</h1>
        <p>{fatal || 'This browser is not connected to a team. Register or resume from the front page.'}</p>
        <button className="btn btn-primary" onClick={() => go('')}>Go to the front page</button>
      </main>
    );
  }
  if (!state) {
    return (
      <main id="main" className="center-page" aria-busy="true">
        <p className="loading">{offline ? 'Cannot reach the game server. Retrying every 15 seconds…' : 'Opening the case file…'}</p>
        {offline && <button className="btn" onClick={refresh}>Retry now</button>}
      </main>
    );
  }

  const banners = (
    <>
      {state.team.is_preview && <div className="banner banner-preview" role="note">Host preview mode. Nothing here is recorded on the leaderboard.</div>}
      {fatal && <div className="banner banner-error" role="alert">{fatal} <button className="btn-quiet" onClick={() => go('')}>Front page</button></div>}
      {(offline || unsaved) && (
        <div className="banner banner-warn" role="alert">
          {offline ? 'Connection lost. Your saved progress and timer are safe on the server. ' : ''}{unsaved}
          <button className="btn-quiet" onClick={refresh}>Reconnect</button>
        </div>
      )}
    </>
  );

  if (!state.started) return <Briefing state={state} act={act} banners={banners} />;

  const current = Math.min(state.stage, 6);
  const shown = view ?? (state.solved ? 'reveal' : current);

  return (
    <div className="game">
      {banners}
      <header className="game-head">
        <div className="gh-title">
          <span className="brand-sm">{CASE.brand}</span>
          <span className="gh-case">{CASE.title}</span>
        </div>
        <div className="gh-team"><span className="label">Team</span> {state.team.name}</div>
        <Timer state={state} syncedAt={syncedAt} />
        <div className="gh-tools">
          <button className="btn" onClick={() => setModal({ type: 'locker' })}>Evidence locker</button>
          <SoundToggle />
        </div>
      </header>

      <div className="game-body">
        <ProgressRail state={state} shown={shown} setView={setView} />
        <main id="main" className="stage-area" tabIndex={-1}>
          {shown === 'reveal'
            ? <Reveal state={state} go={go} />
            : <StageView n={shown} state={state} act={act} openEvidence={openEvidence} openProfile={openProfile} setView={setView} />}
          {shown !== 'reveal' && shown === current && !state.solved && <HintPanel stage={current} state={state} act={act} />}
        </main>
      </div>

      {state.event.paused && (
        <div className="pause-veil" role="alertdialog" aria-modal="true" aria-labelledby="pause-h">
          <div>
            <h2 id="pause-h">The host has paused the event</h2>
            <p>Your timer is frozen for every team. Play continues automatically when the host resumes.</p>
            <button className="btn" onClick={refresh}>Check again</button>
          </div>
        </div>
      )}

      {modal?.type === 'evidence' && (
        <Modal title={EVIDENCE_BY_ID[modal.id].title} onClose={() => setModal(null)}>
          <EvidenceDoc item={EVIDENCE_BY_ID[modal.id]} />
        </Modal>
      )}
      {modal?.type === 'profile' && (
        <Modal title={CHARACTERS.find((c) => c.id === modal.id).name} onClose={() => setModal(null)}>
          <ProfileDoc c={CHARACTERS.find((c) => c.id === modal.id)} />
        </Modal>
      )}
      {modal?.type === 'locker' && (
        <Modal title="Evidence locker" wide onClose={() => setModal(null)}>
          <Locker state={state} openEvidence={(id) => setModal({ type: 'evidence', id })} openProfile={(id) => setModal({ type: 'profile', id })} />
        </Modal>
      )}
    </div>
  );
}

function Briefing({ state, act, banners }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const start = async () => {
    setBusy(true); setErr('');
    try { await act('start_investigation'); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <main id="main" className="briefing">
      {banners}
      <p className="brand">{CASE.brand} · {state.event.name}</p>
      <h1 className="page-title">Briefing for team {state.team.name}</h1>
      {state.team.members?.length > 0 && <p className="members">Investigators: {state.team.members.join(', ')}</p>}
      <div className="brief-grid">
        <section>
          <h2>The case</h2>
          <p>Evelyn Vale, 28, heir to the Vale family fortune, was found dead in Apartment 4B of Hollow House at 9:35 PM on Halloween night. She was supposed to be at her family's charity masquerade. Instead, she was in a small, worn apartment she had rented under another name.</p>
          <p>Some people in this story are lying about the murder. Others are hiding secrets that have nothing to do with it. Your job is to tell them apart.</p>
        </section>
        <section>
          <h2>The rules</h2>
          <ul>
            <li>The captain plays on one screen and shares it on the video call. Talk through every decision together.</li>
            <li>Six stages unlock in order. Each tells you what is still needed before the next one opens.</li>
            <li>Wrong answers in stages 1–5 are free. Try, read the feedback, try again.</li>
            <li>Hints add <strong>2 minutes</strong> each. You will always be asked before one is revealed.</li>
            <li>A wrong final accusation adds <strong>3 minutes</strong>, the clock keeps running, and you must review it before trying again.</li>
            <li>The timer runs on the server. Refreshing or reconnecting does not stop it or reset it.</li>
            <li>Everything you need is in the evidence. No specialist knowledge, no tricks.</li>
          </ul>
        </section>
      </div>
      {err && <p className="fb fb-error" role="alert">{err}</p>}
      <button className="btn btn-primary btn-big" onClick={start} disabled={busy || state.event.paused}>
        {state.event.paused ? 'Waiting for the host to resume' : busy ? 'Starting the clock…' : 'Start investigation'}
      </button>
      <p className="help">The timer starts the moment you press this button.</p>
    </main>
  );
}

function Timer({ state, syncedAt }) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  const running = state.started && !state.solved && !state.event.paused;
  const elapsed = state.elapsed_ms + (running ? Date.now() - syncedAt : 0);
  return (
    <div className="timer" role="timer" aria-live="off">
      <div><span className="label">Elapsed</span><span className="num">{fmt(elapsed)}</span></div>
      <div><span className="label">Penalties</span><span className="num pen">+{fmt(state.penalty_ms)}</span></div>
      <div><span className="label">Adjusted</span><span className="num adj">{fmt(elapsed + state.penalty_ms)}</span></div>
      {state.event.paused && <span className="paused-tag">Paused</span>}
    </div>
  );
}

function ProgressRail({ state, shown, setView }) {
  return (
    <nav className="rail" aria-label="Investigation stages">
      <ol>
        {STAGES.map((s) => {
          const done = state.stage > s.n;
          const cur = state.stage === s.n;
          const locked = state.stage < s.n;
          const prevTasks = STAGE_TASKS[s.n - 1] || [];
          const remaining = prevTasks.filter((t) => !state.completed.includes(t)).map((t) => TASK_NAMES[t]);
          return (
            <li key={s.n} className={`${done ? 'done' : ''} ${cur ? 'cur' : ''} ${locked ? 'locked' : ''} ${shown === s.n ? 'shown' : ''}`}>
              <button onClick={() => !locked && setView(s.n)} disabled={locked} aria-current={shown === s.n ? 'step' : undefined}>
                <span className="rail-n" aria-hidden="true">{done ? '✓' : s.n}</span>
                <span className="rail-t">
                  <span className="rail-title">{s.title}</span>
                  <span className="rail-state">{done ? 'Completed' : cur ? 'In progress' : `Locked — finish Stage ${s.n - 1}${remaining.length ? `: ${remaining.join(', ')}` : ''}`}</span>
                </span>
              </button>
            </li>
          );
        })}
        {state.solved && (
          <li className={`done ${shown === 'reveal' ? 'shown' : ''}`}>
            <button onClick={() => setView('reveal')}><span className="rail-n" aria-hidden="true">★</span><span className="rail-t"><span className="rail-title">Case closed</span><span className="rail-state">Read the full explanation</span></span></button>
          </li>
        )}
      </ol>
    </nav>
  );
}

function HintPanel({ stage, state, act }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const hints = state.hints.filter((h) => h.stage === stage);
  const next = hints.length + 1;
  const reveal = async () => {
    setBusy(true); setErr('');
    try { await act('reveal_hint', { p_stage: stage }); setConfirm(false); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <aside className="hints" aria-labelledby="hints-h">
      <h2 id="hints-h">Hints for this stage</h2>
      {hints.length === 0 && <p className="help">No hints used. Each hint is more direct than the last.</p>}
      <ol>{hints.map((h) => <li key={h.level}><span className="label">Hint {h.level}</span> {h.body}</li>)}</ol>
      {next <= 3 && !confirm && <button className="btn" onClick={() => setConfirm(true)}>Reveal hint {next} of 3</button>}
      {next <= 3 && confirm && (
        <div className="confirm" role="alertdialog" aria-labelledby="hint-confirm">
          <p id="hint-confirm">Hint {next} adds <strong>2 minutes</strong> to your adjusted time. This cannot be undone.</p>
          <button className="btn btn-primary" onClick={reveal} disabled={busy}>{busy ? 'Revealing…' : 'Reveal and add 2 minutes'}</button>
          <button className="btn-quiet" onClick={() => setConfirm(false)}>Cancel</button>
        </div>
      )}
      {next > 3 && <p className="help">All hints for this stage are revealed.</p>}
      {err && <p className="fb fb-error" role="alert">{err}</p>}
    </aside>
  );
}

function Locker({ state, openEvidence, openProfile }) {
  const unlocked = Math.min(state.stage, 6);
  return (
    <div className="locker">
      {state.stage >= 2 && (
        <section>
          <h3>People</h3>
          <div className="mini-grid">
            {CHARACTERS.map((c) => (
              <button key={c.id} className="mini" onClick={() => openProfile(c.id)}>
                <Portrait character={c} className="portrait-sm" /><span>{c.name}<small>{c.role}</small></span>
              </button>
            ))}
          </div>
        </section>
      )}
      {STAGES.filter((s) => s.n <= unlocked && s.n <= 4).map((s) => (
        <section key={s.n}>
          <h3>Stage {s.n}: {s.title}</h3>
          <div className="mini-grid">
            {EVIDENCE.filter((e) => e.stage === s.n).map((e) => (
              <button key={e.id} className="mini" onClick={() => openEvidence(e.id)}>
                <EvidenceArt kind={e.art} label="" /><span>{e.title}<small>{e.kind}</small></span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Reveal({ state, go }) {
  return (
    <article className="reveal">
      <p className="brand">Case closed{state.team.is_preview ? ' (preview — not recorded)' : ''}</p>
      <h1 className="page-title">The truth about Hollow House</h1>
      <div className="result-strip">
        <div><span className="label">Elapsed</span><span className="num">{fmt(state.elapsed_ms)}</span></div>
        <div><span className="label">Penalties</span><span className="num">+{fmt(state.penalty_ms)}</span></div>
        <div><span className="label">Final time</span><span className="num adj">{fmt(state.elapsed_ms + state.penalty_ms)}</span></div>
        {state.rank && <div><span className="label">Current rank</span><span className="num">#{state.rank}</span></div>}
      </div>
      <p className="help">{state.hints_used} hint{state.hints_used === 1 ? '' : 's'} · {state.wrong_accusations} wrong accusation{state.wrong_accusations === 1 ? '' : 's'}</p>
      {state.reveal ? <Markdown text={state.reveal} /> : <p>Loading the full explanation…</p>}
      {!state.team.is_preview && <button className="btn btn-primary" onClick={() => go('leaderboard', state.event.code)}>See the leaderboard</button>}
    </article>
  );
}
