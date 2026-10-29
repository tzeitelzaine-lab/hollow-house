import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CASE, STAGES, EVIDENCE, EVIDENCE_BY_ID, CHARACTERS, STAGE_TASKS, HOTSPOTS, charById, media } from '../content/story.js';
import { rpc, session, fmt } from '../lib/core.js';
import { Modal, EvidenceDoc, ProfileDoc, Markdown, SoundToggle, customToEvidence } from '../components/ui.jsx';
import { EvidenceArt, Photo, Emblem, LockIcon, CheckIcon } from '../art/Art.jsx';
import { StageView } from './stages.jsx';

const TASK_NAMES = {
  s1_round1: 'the boardroom questions', s2_records: 'the records check', s3_successor: 'the successor questions', s3_compare: 'the chart comparison',
  s4_substance: 'the medication checklist', s4_roles: 'the roles', s5_board: 'the evidence board',
};
const ALL_TASKS = Object.values(STAGE_TASKS).flat();

export default function Play({ go }) {
  const sess = session.get();
  const [state, setState] = useState(null);
  const [syncedAt, setSyncedAt] = useState(0);
  const [fatal, setFatal] = useState('');
  const [offline, setOffline] = useState(false);
  const [unsaved, setUnsaved] = useState('');
  const [view, setView] = useState(null);
  const [modal, setModal] = useState(null);
  const [custom, setCustom] = useState([]);
  const stateRef = useRef(null);

  const apply = (st) => { stateRef.current = st; setState(st); setSyncedAt(Date.now()); };

  const loadCustom = useCallback(async () => {
    if (!sess) return;
    try { setCustom((await rpc('get_custom_evidence', { p_token: sess.token })).map(customToEvidence)); } catch { /* keep last list */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(async () => {
    if (!sess) return;
    try {
      apply(await rpc('get_team_state', { p_token: sess.token }));
      setOffline(false); setFatal('');
      loadCustom();
    } catch (e) {
      if (e.code === 'INVALID_SESSION') { session.clear(); setFatal(e.message); }
      else if (e.network) setOffline(true);
      else if (!stateRef.current) setFatal(e.message);
    }
  }, [loadCustom]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    const onVis = () => document.visibilityState === 'visible' && refresh();
    const onOff = () => setOffline(true);
    window.addEventListener('online', refresh);
    window.addEventListener('offline', onOff);
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); window.removeEventListener('online', refresh); window.removeEventListener('offline', onOff); document.removeEventListener('visibilitychange', onVis); };
  }, [refresh]);

  const act = useCallback(async (name, args = {}) => {
    try {
      const r = await rpc(name, { p_token: sess.token, ...args });
      setOffline(false); setUnsaved('');
      const st = r && r.state ? r.state : r;
      if (st && st.team) { const advanced = stateRef.current && st.stage !== stateRef.current.stage; apply(st); if (advanced) loadCustom(); }
      return r;
    } catch (e) {
      if (e.network) { setOffline(true); setUnsaved('Your last action was not saved. It will not count until you repeat it with a working connection.'); }
      if (e.code === 'INVALID_SESSION') { session.clear(); setFatal(e.message); }
      if (e.code === 'EVENT_PAUSED' || e.code === 'TIME_UP') refresh();
      throw e;
    }
  }, [refresh, loadCustom]); // eslint-disable-line react-hooks/exhaustive-deps

  const allEvidence = useMemo(() => [...EVIDENCE, ...custom], [custom]);
  const byId = useMemo(() => ({ ...EVIDENCE_BY_ID, ...Object.fromEntries(custom.map((c) => [c.id, c])) }), [custom]);

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
    if (HOTSPOTS.some((h) => h.id === id) && st && !st.solved && !st.event.paused && !st.inspected.includes(id)) {
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
      <main id="main" className="center-page" tabIndex={-1}>
        <h1 className="display-sm">No investigation open</h1>
        <p>{fatal || 'This browser is not connected to a team. Register or resume from the front page.'}</p>
        <button className="btn btn-primary" onClick={() => go('')}>Go to the front page</button>
      </main>
    );
  }
  if (!state) {
    return (
      <main id="main" className="center-page" aria-busy="true" tabIndex={-1}>
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
  const over = state.expired && !state.solved;
  const shown = over ? 'over' : view ?? (state.solved ? 'reveal' : current);
  const doneTasks = state.completed.length + (state.solved ? 1 : 0);
  const totalTasks = ALL_TASKS.length + 1;

  return (
    <div className="game" style={{ '--backdrop': `url(${media('hospital-poster.jpg')})` }}>
      {banners}
      <div className="game-body">
        <aside className="rail" aria-label="Case progress">
          <div className="rail-top">
            <span className="rail-brand"><Emblem className="rail-logo" /><span className="brand-sm">{CASE.brand}</span></span>
            <span className="rail-case">{CASE.shortTitle}</span>
            <span className="bar" aria-hidden="true" />
          </div>
          <ProgressRail state={state} shown={shown} setView={setView} />
          <div className="rail-tools">
            <button className="btn btn-block" onClick={() => setModal({ type: 'locker' })}>Evidence locker</button>
            <SoundToggle />
          </div>
        </aside>

        <div className="game-main">
          <header className="hud-bar">
            <div className="gh-team"><span className="hud-k">Team</span><span className="hud-team">{state.team.name}</span></div>
            <Timer state={state} syncedAt={syncedAt} onExpire={refresh} />
            <div className="hud-progress">
              <span className="hud-k">Progress</span><span className="hud-v">{doneTasks}/{totalTasks}</span>
              <span className="meter"><span style={{ width: `${Math.round((doneTasks / totalTasks) * 100)}%` }} /></span>
            </div>
          </header>
          <main id="main" className="stage-area" tabIndex={-1}>
            {shown === 'over'
              ? <GameOver state={state} go={go} openLocker={() => setModal({ type: 'locker' })} />
              : shown === 'reveal'
              ? <Reveal state={state} go={go} />
              : <StageView n={shown} state={state} act={act} openEvidence={openEvidence} openProfile={openProfile} setView={setView} custom={custom} allEvidence={allEvidence} byId={byId} />}
            {shown !== 'reveal' && shown !== 'over' && shown === current && !state.solved && <HintPanel stage={current} state={state} act={act} />}
          </main>
        </div>
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

      {modal?.type === 'evidence' && byId[modal.id] && (
        <Modal title={byId[modal.id].title} onClose={() => setModal(null)}><EvidenceDoc item={byId[modal.id]} /></Modal>
      )}
      {modal?.type === 'profile' && (
        <Modal title={charById[modal.id].name} onClose={() => setModal(null)}><ProfileDoc c={charById[modal.id]} /></Modal>
      )}
      {modal?.type === 'locker' && (
        <Modal title="Evidence locker" wide onClose={() => setModal(null)}>
          <Locker state={state} evidence={allEvidence} openEvidence={(id) => setModal({ type: 'evidence', id })} openProfile={(id) => setModal({ type: 'profile', id })} />
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
    <main id="main" className="briefing" tabIndex={-1} style={{ '--backdrop': `url(${media('hospital-poster.jpg')})` }}>
      {banners}
      <div className="briefing-inner">
        <p className="kicker">{CASE.brand} · {state.event.name}</p>
        <h1 className="display">Briefing for team {state.team.name}</h1>
        <span className="bar" aria-hidden="true" />
        {state.team.members?.length > 0 && <p className="members">Investigators: {state.team.members.join(', ')}</p>}
        <div className="brief-grid">
          <section>
            <h2 className="panel-title">The case</h2>
            <p>{CASE.intro}</p>
            <p>Some people are lying about murder. Others are hiding secrets that have nothing to do with it. Your job is to tell them apart.</p>
          </section>
          <section>
            <h2 className="panel-title">The rules</h2>
            <ul>
              <li>The captain plays on one screen and shares it on the call. Decide everything together.</li>
              <li>Six stages unlock in order. Each tells you what is still needed.</li>
              <li>Wrong answers in stages 1–5 are free. Read the feedback and try again.</li>
              <li>You have <strong>{Math.round((state.time_limit_ms || 1800000) / 60000)} minutes</strong>. When time runs out the game ends, your progress is recorded, and you are ranked after every team that solved the case.</li>
              <li>Hints add <strong>2 minutes</strong> each. You will always be asked first.</li>
              <li>A wrong final verdict adds <strong>3 minutes</strong>, the clock keeps running, and you must review it before trying again.</li>
              <li>The timer runs on the server. Refreshing or reconnecting does not stop or reset it.</li>
              <li>Everything you need is in the evidence. No medical knowledge required.</li>
            </ul>
          </section>
        </div>
        {err && <p className="fb fb-error" role="alert">{err}</p>}
        <button className="btn btn-primary btn-big" onClick={start} disabled={busy || state.event.paused}>
          {state.event.paused ? 'Waiting for the host to resume' : busy ? 'Starting the clock…' : 'Start investigation'}
        </button>
        <p className="help">The timer starts the moment you press this button.</p>
      </div>
    </main>
  );
}

function Timer({ state, syncedAt, onExpire }) {
  const [, tick] = useState(0);
  const fired = useRef(false);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  const limit = state.time_limit_ms || 1800000;
  const running = state.started && !state.solved && !state.expired && !state.event.paused;
  const elapsed = Math.min(limit, state.elapsed_ms + (running ? Date.now() - syncedAt : 0));
  const left = Math.max(0, limit - elapsed);
  useEffect(() => {
    if (running && left <= 0 && !fired.current) { fired.current = true; setTimeout(onExpire, 600); }
    if (left > 0) fired.current = false;
  }, [running, left, onExpire]);
  const low = !state.solved && left <= 5 * 60000;
  return (
    <div className="timer" role="timer" aria-live="off">
      <div className={`time-left ${low ? 'low' : ''}`}><span className="hud-k">Time left</span><span className="num">{state.solved ? '—' : fmt(left)}</span></div>
      <div><span className="hud-k">Elapsed</span><span className="num">{fmt(elapsed)}</span></div>
      <div><span className="hud-k">Penalties</span><span className="num pen">+{fmt(state.penalty_ms)}</span></div>
      <div><span className="hud-k">Adjusted</span><span className="num adj">{fmt(elapsed + state.penalty_ms)}</span></div>
      {state.event.paused && <span className="paused-tag">Paused</span>}
      {low && !state.expired && left > 0 && <span className="sr-only" role="status">Less than five minutes left.</span>}
    </div>
  );
}

function ProgressRail({ state, shown, setView }) {
  return (
    <nav aria-label="Investigation stages">
      <ol className="case-menu stage-menu">
        {STAGES.map((s) => {
          const done = state.stage > s.n;
          const cur = state.stage === s.n;
          const locked = state.stage < s.n;
          const remaining = (STAGE_TASKS[s.n - 1] || []).filter((t) => !state.completed.includes(t)).map((t) => TASK_NAMES[t]);
          return (
            <li key={s.n}>
              <button className={`menu-row ${shown === s.n ? 'selected' : ''} ${locked ? 'locked' : ''}`} onClick={() => !locked && setView(s.n)}
                disabled={locked} aria-current={shown === s.n ? 'step' : undefined}>
                <span className="menu-label"><span className="menu-n">{String(s.n).padStart(2, '0')}</span>{s.title}</span>
                <span className="menu-meta">{done ? <>Solved <CheckIcon /></> : cur ? 'Active' : <>Locked <LockIcon /></>}</span>
                <span className="menu-sub">{done ? 'Completed' : cur ? s.short : `Finish Stage ${s.n - 1}${remaining.length ? `: ${remaining.join(', ')}` : ''}`}</span>
              </button>
            </li>
          );
        })}
        {state.solved && (
          <li>
            <button className={`menu-row ${shown === 'reveal' ? 'selected' : ''}`} onClick={() => setView('reveal')}>
              <span className="menu-label"><span className="menu-n">✦</span>Case closed</span>
              <span className="menu-meta">Read</span>
              <span className="menu-sub">The full explanation</span>
            </button>
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
      <h2 id="hints-h" className="panel-title">Hints</h2>
      {hints.length === 0 && <p className="help">No hints used for this stage. Each one is more direct than the last.</p>}
      <ol>{hints.map((h) => <li key={h.level}><span className="hud-k">Hint {h.level}</span> {h.body}</li>)}</ol>
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

function Locker({ state, evidence, openEvidence, openProfile }) {
  const unlocked = Math.min(state.stage, 6);
  return (
    <div className="locker">
      {state.stage >= 2 && (
        <section>
          <h3 className="panel-title">People</h3>
          <div className="mini-grid">
            {CHARACTERS.map((c) => (
              <button key={c.id} className="mini" onClick={() => openProfile(c.id)}>
                <Photo id={c.id} className="portrait-sm" alt="" /><span>{c.name}<small>{c.role}</small></span>
              </button>
            ))}
          </div>
        </section>
      )}
      {STAGES.filter((s) => s.n <= unlocked && s.n <= 5).map((s) => {
        const items = evidence.filter((e) => e.stage === s.n);
        if (!items.length) return null;
        return (
          <section key={s.n}>
            <h3 className="panel-title">Stage {s.n}: {s.title}</h3>
            <div className="mini-grid">
              {items.map((e) => (
                <button key={e.id} className="mini" onClick={() => openEvidence(e.id)}>
                  {e.image ? <img src={e.image} alt="" className="mini-img" /> : <EvidenceArt kind={e.art} label="" />}
                  <span>{e.code && <small className="code-tag">{e.code}</small>}{e.title}<small>{e.kind}</small></span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Reveal({ state, go }) {
  return (
    <article className="reveal">
      <p className="kicker">Case closed{state.team.is_preview ? ' (preview — not recorded)' : ''}</p>
      <h1 className="display">The truth about BlueGreen</h1>
      <span className="bar" aria-hidden="true" />
      <div className="result-strip">
        <div><span className="hud-k">Elapsed</span><span className="num">{fmt(state.elapsed_ms)}</span></div>
        <div><span className="hud-k">Penalties</span><span className="num">+{fmt(state.penalty_ms)}</span></div>
        <div><span className="hud-k">Final time</span><span className="num adj">{fmt(state.elapsed_ms + state.penalty_ms)}</span></div>
        {state.rank && <div><span className="hud-k">Current rank</span><span className="num">#{state.rank}</span></div>}
      </div>
      <p className="help">{state.hints_used} hint{state.hints_used === 1 ? '' : 's'} · {state.wrong_accusations} wrong verdict{state.wrong_accusations === 1 ? '' : 's'}</p>
      {state.reveal ? <Markdown text={state.reveal} /> : <p>Loading the full explanation…</p>}
      {!state.team.is_preview && <button className="btn btn-primary" onClick={() => go('leaderboard', state.event.code)}>See the leaderboard</button>}
    </article>
  );
}

function GameOver({ state, go, openLocker }) {
  const total = ALL_TASKS.length;
  return (
    <article className="reveal game-over" aria-labelledby="go-h">
      <p className="kicker">Time is up</p>
      <h1 id="go-h" className="display">Game over</h1>
      <span className="bar" aria-hidden="true" />
      <p className="lede">The clock ran out before your team reached a verdict. Your progress has been recorded{state.team.is_preview ? ' (preview — not ranked)' : ' and ranked after every team that solved the case'}.</p>
      <div className="result-strip">
        <div><span className="hud-k">Progress</span><span className="num">{state.tasks_completed}/{total} tasks</span></div>
        <div><span className="hud-k">Reached</span><span className="num">Stage {Math.min(state.stage, 6)}</span></div>
        <div><span className="hud-k">Penalties</span><span className="num">+{fmt(state.penalty_ms)}</span></div>
        {state.rank && <div><span className="hud-k">Current rank</span><span className="num">#{state.rank}</span></div>}
      </div>
      <p>The full solution stays sealed until the host reveals it, so other teams can still finish. You can still read the evidence you unlocked.</p>
      <div className="task-actions">
        {!state.team.is_preview && <button className="btn btn-primary" onClick={() => go('leaderboard', state.event.code)}>See the leaderboard</button>}
        <button className="btn" onClick={openLocker}>Open the evidence locker</button>
      </div>
    </article>
  );
}
