import { useState } from 'react';
import { STAGES, SCENES, EVIDENCE, EVIDENCE_BY_ID, CHARACTERS, HOTSPOTS, Q, SUSPECT_IDS, charById } from '../content/story.js';
import { OfficeScene, EvidenceArt, Photo } from '../art/Art.jsx';
import { ChoiceGroup, Feedback, useDraft } from '../components/ui.jsx';

function useTask(act, task) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const submit = async (answer) => {
    setBusy(true); setResult(null);
    try {
      const r = await act('submit_stage', { p_task: task, p_answer: answer });
      setResult(r.correct ? { correct: true, message: r.already ? 'Already solved.' : 'Correct. Saved to your case file.' } : r);
    } catch (e) { setResult({ error: e.message }); } finally { setBusy(false); }
  };
  return { submit, busy, result };
}

function Shelf({ ids, openEvidence, seen = [], custom = [], stage }) {
  const items = [...ids.map((id) => EVIDENCE_BY_ID[id]), ...custom.filter((c) => c.stage === stage)];
  return (
    <ul className="shelf">
      {items.map((e) => (
        <li key={e.id}>
          <button className="ev-card" onClick={() => openEvidence(e.id)}>
            {e.image ? <img src={e.image} alt="" className="ev-img" /> : <EvidenceArt kind={e.art} label="" />}
            <span className="ev-code">{e.code}{e.custom && ' · added by host'}</span>
            <span className="ev-title">{e.title}{seen.includes(e.id) && <span className="seen"> · inspected</span>}</span>
            <span className="ev-blurb">{e.blurb}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function TaskBox({ title, done, children, onSubmit, busy, result, blocked, label = 'Submit answer' }) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return (
    <section className={`task ${done ? 'task-done' : ''}`} aria-labelledby={`t-${slug}`}>
      <h3 id={`t-${slug}`} className="task-title">{title} {done && <span className="done-tag">Solved</span>}</h3>
      <form onSubmit={(e) => { e.preventDefault(); if (!done) onSubmit(); }}>
        {children}
        {!done && (
          <div className="task-actions">
            <button className="btn btn-primary" disabled={busy || Boolean(blocked)}>{busy ? 'Checking…' : label}</button>
            {blocked && <span className="help">{blocked}</span>}
          </div>
        )}
      </form>
      <Feedback result={result} />
    </section>
  );
}

function StageHeader({ n }) {
  const s = STAGES[n - 1];
  return (
    <header className="stage-head">
      <p className="kicker">Stage {n} of 6</p>
      <h1 className="display">{s.title}</h1>
      <span className="bar" aria-hidden="true" />
      <div className="scene-text">{SCENES[n].map((p, i) => <p key={i}>{p}</p>)}</div>
    </header>
  );
}

function PersonSelect({ label, value, onChange, ids = SUSPECT_IDS, disabled }) {
  return (
    <label className="person-select">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        <option value="">Choose a person…</option>
        {ids.map((id) => <option key={id} value={id}>{charById[id].name}</option>)}
      </select>
    </label>
  );
}

/* --------------------------- Stage 1 --------------------------- */
function Stage1({ state, act, openEvidence, custom }) {
  const done = state.completed.includes('s1_round1');
  const missing = HOTSPOTS.filter((h) => h.required && !state.inspected.includes(h.id));
  const [a, setA] = useDraft('bg-s1', { chain: '', exchange: '', claim: '' });
  const t = useTask(act, 's1_round1');
  return (
    <>
      <StageHeader n={1} />
      <p className="lede">Andrew's office, 09:40. Security has secured the room. Select each marked item to inspect it, or use the list below the picture.</p>
      <div className="scene">
        <OfficeScene className="scene-art" />
        {HOTSPOTS.map((h, i) => (
          <button key={h.id} className={`hotspot ${state.inspected.includes(h.id) ? 'hs-seen' : ''}`} style={{ left: `${h.x}%`, top: `${h.y}%` }}
            onClick={() => openEvidence(h.id)} aria-label={`${h.label}${state.inspected.includes(h.id) ? ' (inspected)' : ''}`}>
            <span aria-hidden="true">{i + 1}</span>
          </button>
        ))}
      </div>
      <ol className="hs-list">
        {HOTSPOTS.map((h, i) => (
          <li key={h.id}>
            <button className="btn-link" onClick={() => openEvidence(h.id)}>{i + 1}. {h.label}</button>
            <span className="hs-status">{state.inspected.includes(h.id) ? 'Inspected' : 'Not yet inspected'}</span>
          </li>
        ))}
      </ol>
      {custom.some((c) => c.stage === 1) && <Shelf ids={[]} custom={custom} stage={1} openEvidence={openEvidence} />}
      <TaskBox title="What really happened this morning?" done={done} busy={t.busy} result={t.result}
        blocked={missing.length ? `Inspect first: ${missing.map((m) => m.label.toLowerCase()).join(', ')}.` : (!a.chain || !a.exchange || !a.claim) ? 'Answer all three questions.' : ''}
        onSubmit={() => t.submit(a)}>
        <ChoiceGroup name="chain" {...Q.s1.chain} value={a.chain} onChange={(v) => setA({ ...a, chain: v })} disabled={done} />
        <ChoiceGroup name="exchange" {...Q.s1.exchange} value={a.exchange} onChange={(v) => setA({ ...a, exchange: v })} disabled={done} />
        <ChoiceGroup name="claim" {...Q.s1.claim} value={a.claim} onChange={(v) => setA({ ...a, claim: v })} disabled={done} />
      </TaskBox>
    </>
  );
}

/* --------------------------- Stage 2 --------------------------- */
function Stage2({ state, act, openEvidence, openProfile, custom }) {
  const done = state.completed.includes('s2_records');
  const [a, setA] = useDraft('bg-s2', {});
  const t = useTask(act, 's2_records');
  const unseen = SUSPECT_IDS.filter((id) => !state.inspected.includes(`profile:${id}`));
  const unanswered = Q.s2.claims.filter(([k]) => !a[k]).length;
  return (
    <>
      <StageHeader n={2} />
      <h2 className="section-title">The people</h2>
      <p className="lede">Open every profile to read each person's background and statement.</p>
      <ul className="suspects">
        {CHARACTERS.map((c) => (
          <li key={c.id}>
            <button className={`suspect ${c.victim ? 'victim' : ''}`} onClick={() => openProfile(c.id)}>
              <Photo id={c.id} className="portrait" alt="" />
              <span className="s-name">{c.name}</span>
              <span className="s-role">{c.role}{state.inspected.includes(`profile:${c.id}`) && ' · read'}</span>
            </button>
          </li>
        ))}
      </ul>
      <h2 className="section-title">Hospital records</h2>
      <Shelf ids={['e03', 'e04', 'e05']} openEvidence={openEvidence} custom={custom} stage={2} />
      <TaskBox title="Records or rumours?" done={done} busy={t.busy} result={t.result}
        blocked={unseen.length ? `Open every profile first (${unseen.length} still unread).` : unanswered ? `Judge all six claims (${unanswered} left).` : ''}
        onSubmit={() => t.submit(a)}>
        <p className="help">{Q.s2.intro}</p>
        <div className="classify">
          {Q.s2.claims.map(([k, text]) => (
            <fieldset key={k} disabled={done}>
              <legend>{text}</legend>
              {Q.s2.choices.map(([v, l]) => (
                <label key={v} className="pill"><input type="radio" name={k} checked={a[k] === v} onChange={() => setA({ ...a, [k]: v })} /> <span>{l}</span></label>
              ))}
            </fieldset>
          ))}
        </div>
      </TaskBox>
    </>
  );
}

/* --------------------------- Stage 3 --------------------------- */
function RecordColumn({ id, tone }) {
  const e = EVIDENCE_BY_ID[id];
  const rec = e.blocks.find((b) => b.type === 'record');
  return (
    <div className={`compare-col ${tone}`}>
      <p className="ev-code">{e.code}</p>
      <h4>{e.title}</h4>
      <dl>{rec.rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
    </div>
  );
}

function Stage3({ state, act, openEvidence, custom }) {
  const has = (k) => state.completed.includes(k);
  const [a, setA] = useDraft('bg-s3a', { recommend: '', three_weeks: '', doorway: '' });
  const [b, setB] = useDraft('bg-s3b', { authorized: '', unsupported: [] });
  const ta = useTask(act, 's3_successor');
  const tb = useTask(act, 's3_compare');
  return (
    <>
      <StageHeader n={3} />
      <Shelf ids={['e01b', 'e06', 'lounge', 'e07', 'e08', 'e09']} openEvidence={openEvidence} custom={custom} stage={3} />
      <TaskBox title="The successor" done={has('s3_successor')} busy={ta.busy} result={ta.result}
        blocked={!a.recommend || !a.three_weeks || !a.doorway ? 'Answer all three questions.' : ''} onSubmit={() => ta.submit(a)}>
        <ChoiceGroup name="recommend" {...Q.s3.recommend} value={a.recommend} onChange={(v) => setA({ ...a, recommend: v })} disabled={has('s3_successor')} />
        <ChoiceGroup name="three_weeks" {...Q.s3.three_weeks} value={a.three_weeks} onChange={(v) => setA({ ...a, three_weeks: v })} disabled={has('s3_successor')} />
        <ChoiceGroup name="doorway" {...Q.s3.doorway} value={a.doorway} onChange={(v) => setA({ ...a, doorway: v })} disabled={has('s3_successor')} />
      </TaskBox>
      <TaskBox title="Two versions of the chart" done={has('s3_compare')} busy={tb.busy} result={tb.result}
        blocked={!b.authorized || b.unsupported.length !== 2 ? 'Answer the first question and choose exactly two entries.' : ''} onSubmit={() => tb.submit(b)}>
        <div className="compare" role="group" aria-label="Authentic plan and bedside display side by side">
          <RecordColumn id="e08" tone="authentic" />
          <RecordColumn id="e09" tone="disputed" />
        </div>
        <ChoiceGroup name="authorized" {...Q.s3.authorized} value={b.authorized} onChange={(v) => setB({ ...b, authorized: v })} disabled={has('s3_compare')} />
        <ChoiceGroup name="unsupported" {...Q.s3.unsupported} multi value={b.unsupported} onChange={(v) => setB({ ...b, unsupported: v })} disabled={has('s3_compare')} />
      </TaskBox>
    </>
  );
}

/* --------------------------- Stage 4 --------------------------- */
function Stage4({ state, act, openEvidence, custom }) {
  const has = (k) => state.completed.includes(k);
  const [m, setM] = useDraft('bg-s4m', { proven: [], label: '' });
  const [r, setR] = useDraft('bg-s4r', {});
  const tm = useTask(act, 's4_substance');
  const tr = useTask(act, 's4_roles');
  return (
    <>
      <StageHeader n={4} />
      <Shelf ids={['e10', 'code2', 'e11', 'e12', 'e13']} openEvidence={openEvidence} custom={custom} stage={4} />
      <div className="s4-grid">
        <TaskBox title="Medication checklist" done={has('s4_substance')} busy={tm.busy} result={tm.result}
          blocked={!m.proven.length || !m.label ? 'Tick at least one substance and choose the label name.' : ''} onSubmit={() => tm.submit(m)}>
          <ChoiceGroup name="proven" {...Q.s4.proven} multi value={m.proven} onChange={(v) => setM({ ...m, proven: v })} disabled={has('s4_substance')} />
          <ChoiceGroup name="label" {...Q.s4.label} value={m.label} onChange={(v) => setM({ ...m, label: v })} disabled={has('s4_substance')} />
        </TaskBox>
        <TaskBox title="Who did what at the bedside?" done={has('s4_roles')} busy={tr.busy} result={tr.result}
          blocked={Q.s4.roles.some(([k]) => !r[k]) ? 'Choose a person for all three roles.' : ''} onSubmit={() => tr.submit(r)}>
          {Q.s4.roles.map(([k, prompt]) => (
            <PersonSelect key={k} label={prompt} value={r[k] || ''} onChange={(v) => setR({ ...r, [k]: v })} ids={Q.s4.roleOptions} disabled={has('s4_roles')} />
          ))}
        </TaskBox>
      </div>
    </>
  );
}

/* --------------------------- Stage 5 --------------------------- */
const SLOT_X = { motive: 18, method: 50, link: 82 };
const PERSON_X = { mastermind: 30, accomplice: 70 };

function Stage5({ state, act, openEvidence, custom }) {
  const done = state.completed.includes('s5_board');
  const [b, setB] = useDraft('bg-s5', { mastermind: '', accomplice: '', motive: '', method: '', link: '', d1: '', d2: '', d3: '' });
  const t = useTask(act, 's5_board');
  const pool = EVIDENCE.filter((e) => e.stage <= 5 && !e.id.startsWith('obj_'));
  const slots = [
    ['motive', 'Motive', 'Why did the next morning\'s board call matter?'],
    ['method', 'Method', 'How were the product and the record faked?'],
    ['link', 'Link', 'What connects your two people?'],
  ];
  const incomplete = !b.mastermind || !b.accomplice || slots.some(([k]) => !b[k]) || !b.d1 || !b.d2 || !b.d3;
  return (
    <>
      <StageHeader n={5} />
      <Shelf ids={['e14', 'e14b', 'e15', 'e16']} openEvidence={openEvidence} custom={custom} stage={5} />
      <TaskBox title="Evidence board" done={done} busy={t.busy} result={t.result} onSubmit={() => t.submit(b)}
        blocked={incomplete ? 'Pin both people, all three pieces of evidence, and complete the three deductions.' : ''} label="Submit our deduction">
        <div className="board-scroll"><div className="board">
          <svg className="threads" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {['mastermind', 'accomplice'].filter((p) => b[p]).flatMap((p) => slots.filter(([k]) => b[k]).map(([k]) => (
              <line key={p + k} x1={PERSON_X[p]} y1="34" x2={SLOT_X[k]} y2="60" className={p} />
            )))}
          </svg>
          {['mastermind', 'accomplice'].map((p) => (
            <div key={p} className={`pin-person ${b[p] ? 'filled' : ''}`} style={{ left: `${PERSON_X[p]}%` }}>
              {b[p] ? <Photo id={b[p]} className="pin-photo" alt="" /> : <div className="pin-photo empty" aria-hidden="true">?</div>}
              <PersonSelect label={p === 'mastermind' ? 'Mastermind' : 'Clinical accomplice'} value={b[p]} onChange={(v) => setB({ ...b, [p]: v })} disabled={done} />
            </div>
          ))}
          {slots.map(([k, title, help]) => (
            <div key={k} className={`pin-slot ${b[k] ? 'filled' : ''}`} style={{ left: `${SLOT_X[k]}%` }}>
              <label>
                <span className="slot-title">{title}</span>
                <span className="slot-help">{help}</span>
                <select value={b[k]} onChange={(e) => setB({ ...b, [k]: e.target.value })} disabled={done}>
                  <option value="">Pin evidence…</option>
                  {pool.map((e) => <option key={e.id} value={e.id}>{e.code} · {e.title}</option>)}
                </select>
              </label>
              {b[k] && <button type="button" className="btn-link" onClick={() => openEvidence(b[k])}>Open</button>}
            </div>
          ))}
        </div></div>
        <div className="deductions">
          {['d1', 'd2', 'd3'].map((k) => <ChoiceGroup key={k} name={k} {...Q.s5[k]} value={b[k]} onChange={(v) => setB({ ...b, [k]: v })} disabled={done} />)}
        </div>
      </TaskBox>
    </>
  );
}

/* --------------------------- Stage 6 --------------------------- */
function PersonGrid({ name, legend, value, onChange }) {
  return (
    <fieldset className="choice">
      <legend>{legend}</legend>
      <div className="accuse-suspects">
        {SUSPECT_IDS.map((id) => (
          <label key={id} className={`acc-s ${value === id ? 'chosen' : ''}`}>
            <input type="radio" name={name} className="sr-only" checked={value === id} onChange={() => onChange(id)} />
            <Photo id={id} className="portrait-sm" alt="" /><span>{charById[id].name}<small>{charById[id].role}</small></span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Stage6({ state, act, openEvidence, allEvidence, byId }) {
  const [a, setA] = useDraft('bg-s6', { mastermind: '', accomplice: '', motive: '', method: '', evidence: [] });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const pool = allEvidence.filter((e) => e.stage <= 5 && !e.id.startsWith('obj_'));
  const titleOf = (id) => byId[id] ? `${byId[id].code} ${byId[id].title}` : id;
  const label = (list, v) => (list.find(([k]) => k === v) || [null, v])[1];

  if (state.solved) return <p className="lede">Your verdict was correct. Open "Case closed" in the stage list to read the full explanation.</p>;

  const submit = async () => {
    setBusy(true); setResult(null);
    try { await act('submit_accusation', { p_accusation: a }); } catch (e) { setResult({ error: e.message }); } finally { setBusy(false); setConfirming(false); }
  };
  const review = async () => {
    setBusy(true);
    try { await act('acknowledge_review'); setResult(null); } catch (e) { setResult({ error: e.message }); } finally { setBusy(false); }
  };

  if (state.needs_review && state.last_accusation) {
    const la = state.last_accusation;
    return (
      <>
        <StageHeader n={6} />
        <section className="review" aria-labelledby="rev-h">
          <h2 id="rev-h" className="panel-title">Your verdict did not hold up</h2>
          <p><strong>{la.parts_correct} of 5</strong> parts hold up (mastermind, accomplice, motive, method, supporting evidence). <strong>3 minutes</strong> have been added and your clock is still running.</p>
          <dl className="meta">
            <div><dt>Mastermind</dt><dd>{charById[la.mastermind]?.name || '—'}</dd></div>
            <div><dt>Accomplice</dt><dd>{charById[la.accomplice]?.name || '—'}</dd></div>
            <div><dt>Motive</dt><dd>{label(Q.s6.motive, la.motive)}</dd></div>
            <div><dt>Method</dt><dd>{label(Q.s6.method, la.method)}</dd></div>
            <div><dt>Evidence</dt><dd>{(la.evidence || []).map(titleOf).join('; ')}</dd></div>
          </dl>
          <p>Talk it through. Does each part agree with your evidence board? Does every piece of evidence concern the evening killing or the motive behind it?</p>
          <button className="btn btn-primary" onClick={review} disabled={busy}>We have reviewed it — let us try again</button>
          {result?.error && <p className="fb fb-error" role="alert">{result.error}</p>}
        </section>
      </>
    );
  }

  const ready = a.mastermind && a.accomplice && a.motive && a.method && a.evidence.length === 3;
  return (
    <>
      <StageHeader n={6} />
      <p className="lede">This is final. A wrong verdict adds 3 minutes and must be reviewed before you try again. The right people with the wrong reasons is still wrong.</p>
      <form className="accuse" onSubmit={(e) => { e.preventDefault(); if (ready) setConfirming(true); }}>
        <PersonGrid name="mastermind" legend="Who planned the killing? (mastermind)" value={a.mastermind} onChange={(v) => setA({ ...a, mastermind: v })} />
        <PersonGrid name="accomplice" legend="Who carried it out at the bedside? (clinical accomplice)" value={a.accomplice} onChange={(v) => setA({ ...a, accomplice: v })} />
        <ChoiceGroup name="motive" prompt="What was the primary motive?" options={Q.s6.motive} value={a.motive} onChange={(v) => setA({ ...a, motive: v })} />
        <ChoiceGroup name="method" prompt="What actually killed Andrew?" options={Q.s6.method} value={a.method} onChange={(v) => setA({ ...a, method: v })} />
        <fieldset className="choice">
          <legend>Choose exactly three pieces of supporting evidence ({a.evidence.length} of 3)</legend>
          <div className="ev-checks">
            {pool.map((e) => {
              const on = a.evidence.includes(e.id);
              return (
                <div key={e.id} className={`ev-check ${on ? 'on' : ''}`}>
                  <label>
                    <input type="checkbox" checked={on} disabled={!on && a.evidence.length >= 3}
                      onChange={() => setA({ ...a, evidence: on ? a.evidence.filter((x) => x !== e.id) : [...a.evidence, e.id] })} />
                    <span><span className="code-tag">{e.code}</span> {e.title}</span>
                  </label>
                  <button type="button" className="btn-link" onClick={() => openEvidence(e.id)} aria-label={`Open ${e.title}`}>open</button>
                </div>
              );
            })}
          </div>
        </fieldset>
        {!confirming && <button className="btn btn-primary btn-big" disabled={!ready}>Review our verdict</button>}
        {!ready && <p className="help">Choose both people, a motive, a method and exactly three pieces of evidence.</p>}
        {confirming && (
          <div className="confirm" role="alertdialog" aria-labelledby="acc-confirm">
            <p id="acc-confirm">Mastermind <strong>{charById[a.mastermind].name}</strong>, accomplice <strong>{charById[a.accomplice].name}</strong>. Motive: {label(Q.s6.motive, a.motive).toLowerCase()}. Method: {label(Q.s6.method, a.method)}. Evidence: {a.evidence.map(titleOf).join('; ')}.</p>
            <button type="button" className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit the verdict'}</button>
            <button type="button" className="btn-quiet" onClick={() => setConfirming(false)}>Go back</button>
          </div>
        )}
        {result?.error && <p className="fb fb-error" role="alert">{result.error}</p>}
      </form>
    </>
  );
}

export function StageView({ n, setView, ...p }) {
  const C = { 1: Stage1, 2: Stage2, 3: Stage3, 4: Stage4, 5: Stage5, 6: Stage6 }[n];
  if (!C) return null;
  const solved = p.state.stage > n && n < 6;
  return (
    <div className="stage" key={n}>
      <C {...p} />
      {solved && (
        <section className="stage-complete" role="status" aria-live="polite">
          <h2 className="panel-title">Stage {n} solved</h2>
          <p>Stage {n + 1}, {STAGES[n].title}, is now unlocked. Everything you found here stays in your evidence locker.</p>
          <button className="btn btn-primary" onClick={() => setView(n + 1)}>Continue to Stage {n + 1}: {STAGES[n].title}</button>
        </section>
      )}
    </div>
  );
}
