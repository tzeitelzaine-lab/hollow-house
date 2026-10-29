import { useState } from 'react';
import { STAGES, EVIDENCE, EVIDENCE_BY_ID, CHARACTERS, HOTSPOTS, Q, SUSPECT_IDS } from '../content/story.js';
import { Apartment, EvidenceArt, Portrait } from '../art/Art.jsx';
import { ChoiceGroup, Feedback, useDraft } from '../components/ui.jsx';

const charById = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));

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

function Shelf({ ids, openEvidence, seen = [] }) {
  return (
    <ul className="shelf">
      {ids.map((id) => {
        const e = EVIDENCE_BY_ID[id];
        return (
          <li key={id}>
            <button className="ev-card" onClick={() => openEvidence(id)}>
              <EvidenceArt kind={e.art} label="" />
              <span className="ev-title">{e.title}{seen.includes(id) && <span className="seen"> · inspected</span>}</span>
              <span className="ev-blurb">{e.blurb}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function TaskBox({ title, done, children, onSubmit, busy, result, blocked, label = 'Submit answer' }) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return (
    <section className={`task ${done ? 'task-done' : ''}`} aria-labelledby={`t-${slug}`}>
      <h3 id={`t-${slug}`}>{title} {done && <span className="done-tag">Solved</span>}</h3>
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
      <p className="stage-n">Stage {n} of 6</p>
      <h1 className="page-title">{s.title}</h1>
      <p className="stage-sub">{s.short}</p>
    </header>
  );
}

/* --------------------------- Stage 1 --------------------------- */
function Stage1({ state, act, openEvidence }) {
  const done = state.completed.includes('s1_observation');
  const required = HOTSPOTS.filter((h) => h.required);
  const missing = required.filter((h) => !state.inspected.includes(h.id));
  const [a, setA] = useDraft('s1', { alias: '', staged: [], weapon: '' });
  const t = useTask(act, 's1_observation');
  return (
    <>
      <StageHeader n={1} />
      <p className="lede">Apartment 4B, 9:50 PM. Officers have secured the room. Select each marked spot to inspect it. You can also use the list below the picture.</p>
      <div className="scene">
        <Apartment className="scene-art" />
        {HOTSPOTS.map((h, i) => (
          <button key={h.id} className={`hotspot ${state.inspected.includes(h.id) ? 'hs-seen' : ''} ${h.required ? '' : 'hs-opt'}`}
            style={{ left: `${h.x}%`, top: `${h.y}%` }} onClick={() => openEvidence(h.id)}
            aria-label={`${h.label}${state.inspected.includes(h.id) ? ' (inspected)' : ''}${h.required ? '' : ' (optional)'}`}>
            <span aria-hidden="true">{i + 1}</span>
          </button>
        ))}
      </div>
      <ol className="hs-list">
        {HOTSPOTS.map((h, i) => (
          <li key={h.id}>
            <button className="btn-link" onClick={() => openEvidence(h.id)}>{i + 1}. {h.label}</button>
            <span className="hs-status">{state.inspected.includes(h.id) ? 'Inspected' : h.required ? 'Not yet inspected' : 'Optional'}</span>
          </li>
        ))}
      </ol>
      <TaskBox title="Observation report" done={done} busy={t.busy} result={t.result}
        blocked={missing.length ? `Inspect first: ${missing.map((m) => m.label.toLowerCase()).join(', ')}.` : ''}
        onSubmit={() => t.submit(a)}>
        <ChoiceGroup name="alias" {...Q.s1.alias} value={a.alias} onChange={(v) => setA({ ...a, alias: v })} disabled={done} />
        <ChoiceGroup name="staged" {...Q.s1.staged} multi value={a.staged} onChange={(v) => setA({ ...a, staged: v })} disabled={done} />
        <ChoiceGroup name="weapon" {...Q.s1.weapon} value={a.weapon} onChange={(v) => setA({ ...a, weapon: v })} disabled={done} />
      </TaskBox>
    </>
  );
}

/* --------------------------- Stage 2 --------------------------- */
function Stage2({ state, act, openEvidence, openProfile }) {
  const done = state.completed.includes('s2_classify');
  const [a, setA] = useDraft('s2', {});
  const t = useTask(act, 's2_classify');
  const unseen = SUSPECT_IDS.filter((id) => !state.inspected.includes(`profile:${id}`));
  const unanswered = Q.s2.claims.filter(([k]) => !a[k]).length;
  return (
    <>
      <StageHeader n={2} />
      <p className="lede">Six people were close to Evelyn or close to Apartment 4B. Open each profile to read their statement. Other witnesses and messages are below.</p>
      <ul className="suspects">
        {CHARACTERS.map((c) => (
          <li key={c.id}>
            <button className="suspect" onClick={() => openProfile(c.id)}>
              <Portrait character={c} className="portrait" />
              <span className="s-name">{c.name}</span>
              <span className="s-role">{c.role}{state.inspected.includes(`profile:${c.id}`) && ' · read'}</span>
            </button>
          </li>
        ))}
      </ul>
      <Shelf ids={['noah_msg', 'tessa_private', 'minor_witnesses']} openEvidence={openEvidence} />
      <TaskBox title="Facts or claims?" done={done} busy={t.busy} result={t.result}
        blocked={unseen.length ? `Open every profile first (${unseen.length} still unread).` : unanswered ? `Mark all six claims (${unanswered} left).` : ''}
        onSubmit={() => t.submit(a)}>
        <p className="help">{Q.s2.intro}</p>
        <div className="classify">
          {Q.s2.claims.map(([k, text]) => (
            <fieldset key={k} disabled={done}>
              <legend>{text}</legend>
              {[['confirmed', 'Confirmed'], ['unverified', 'Unverified']].map(([v, l]) => (
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
function Stage3({ state, act, openEvidence }) {
  const done = state.completed.includes('s3_money');
  const [a, setA] = useDraft('s3', { purpose: '', payee: '', link: '' });
  const t = useTask(act, 's3_money');
  return (
    <>
      <StageHeader n={3} />
      <p className="lede">Evelyn's mother founded the Vale Housing Trust to keep buildings like Hollow House affordable and in good repair. Compare what the trust paid for with what people in the building actually saw.</p>
      <Shelf ids={['payments', 'survey', 'registry', 'auditor_email', 'insurance', 'inheritance']} openEvidence={openEvidence} />
      <TaskBox title="What the money shows" done={done} busy={t.busy} result={t.result}
        blocked={!a.purpose || !a.payee || !a.link ? 'Answer all three questions.' : ''} onSubmit={() => t.submit(a)}>
        <ChoiceGroup name="purpose" {...Q.s3.purpose} value={a.purpose} onChange={(v) => setA({ ...a, purpose: v })} disabled={done} />
        <ChoiceGroup name="payee" {...Q.s3.payee} value={a.payee} onChange={(v) => setA({ ...a, payee: v })} disabled={done} />
        <ChoiceGroup name="link" {...Q.s3.link} value={a.link} onChange={(v) => setA({ ...a, link: v })} disabled={done} />
      </TaskBox>
    </>
  );
}

/* --------------------------- Stage 4 --------------------------- */
function Timeline({ order, setOrder, disabled }) {
  const [drag, setDrag] = useState(null);
  const label = Object.fromEntries(Q.s4.timeline);
  const move = (i, d) => {
    const j = i + d; if (j < 0 || j >= order.length) return;
    const n = [...order]; [n[i], n[j]] = [n[j], n[i]]; setOrder(n);
  };
  return (
    <ol className="timeline" aria-label="Events in order, earliest first">
      {order.map((id, i) => (
        <li key={id} draggable={!disabled}
          onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()}
          onDrop={() => { if (drag == null || drag === i) return; const n = [...order]; const [x] = n.splice(drag, 1); n.splice(i, 0, x); setOrder(n); setDrag(null); }}
          className={drag === i ? 'dragging' : ''}>
          <span className="tl-pos" aria-hidden="true">{i + 1}</span>
          <span className="tl-text">{label[id]}</span>
          {!disabled && (
            <span className="tl-moves">
              <button type="button" className="btn-quiet" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move "${label[id]}" earlier`}>Earlier</button>
              <button type="button" className="btn-quiet" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label={`Move "${label[id]}" later`}>Later</button>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function Stage4({ state, act, openEvidence }) {
  const has = (k) => state.completed.includes(k);
  const [order, setOrder] = useDraft('s4-order', Q.s4.timeline.map(([id]) => id));
  const [al, setAl] = useDraft('s4-alibi', { alibi: '', reason: '' });
  const [cx, setCx] = useDraft('s4-cx', {});
  const tl = useTask(act, 's4_timeline');
  const ab = useTask(act, 's4_alibi');
  const ct = useTask(act, 's4_contradictions');
  return (
    <>
      <StageHeader n={4} />
      <p className="lede">Camera logs, receipts, phones and photographs all keep time. Put the evening in order. Every event below has a time somewhere in this stage's evidence.</p>
      <Shelf ids={['camera', 'shop_footage', 'voice_msg', 'msg_851', 'party_photos', 'medical', 'leo_revised']} openEvidence={openEvidence} />
      <div className="s4-grid">
        <TaskBox title="Order the evening" done={has('s4_timeline')} busy={tl.busy} result={tl.result} onSubmit={() => tl.submit({ order })} label="Check the timeline">
          <p className="help">Earliest at the top. Drag cards, or use Earlier and Later.</p>
          <Timeline order={order} setOrder={setOrder} disabled={has('s4_timeline')} />
        </TaskBox>
        <div>
          <TaskBox title="The alibi that fails" done={has('s4_alibi')} busy={ab.busy} result={ab.result}
            blocked={!al.alibi || !al.reason ? 'Answer both questions.' : ''} onSubmit={() => ab.submit(al)}>
            <ChoiceGroup name="alibi" {...Q.s4.alibi} value={al.alibi} onChange={(v) => setAl({ ...al, alibi: v })} disabled={has('s4_alibi')} />
            <ChoiceGroup name="reason" {...Q.s4.reason} value={al.reason} onChange={(v) => setAl({ ...al, reason: v })} disabled={has('s4_alibi')} />
          </TaskBox>
          <TaskBox title="Match each claim to the evidence that contradicts it" done={has('s4_contradictions')} busy={ct.busy} result={ct.result}
            blocked={Q.s4.contradictions.some(([k]) => !cx[k]) ? 'Choose evidence for all three claims.' : ''} onSubmit={() => ct.submit(cx)}>
            {Q.s4.contradictions.map(([k, claim]) => (
              <label key={k} className="match">
                <span>{claim}</span>
                <select value={cx[k] || ''} onChange={(e) => setCx({ ...cx, [k]: e.target.value })} disabled={has('s4_contradictions')}>
                  <option value="">Choose evidence…</option>
                  {Q.s4.contradictionOptions.map((id) => <option key={id} value={id}>{EVIDENCE_BY_ID[id].title}</option>)}
                </select>
              </label>
            ))}
          </TaskBox>
        </div>
      </div>
    </>
  );
}

/* --------------------------- Stage 5 --------------------------- */
const SLOT_X = { motive: 18, opportunity: 50, physical: 82 };
const SUS_X = (i) => 9 + i * 16.4;

function Stage5({ state, act, openEvidence }) {
  const done = state.completed.includes('s5_board');
  const [b, setB] = useDraft('s5', { suspect: '', motive: '', opportunity: '', physical: '', d1: '', d2: '', d3: '' });
  const t = useTask(act, 's5_board');
  const pool = EVIDENCE.filter((e) => e.stage <= 4);
  const si = SUSPECT_IDS.indexOf(b.suspect);
  const slots = [
    ['motive', 'Motive', 'Why did they need Evelyn silenced?'],
    ['opportunity', 'Opportunity', 'What places them in Hollow House at the time of death?'],
    ['physical', 'Physical evidence', 'What ties them to the room itself?'],
  ];
  const incomplete = !b.suspect || slots.some(([k]) => !b[k]) || !b.d1 || !b.d2 || !b.d3;
  return (
    <>
      <StageHeader n={5} />
      <p className="lede">Pin one suspect to the board, then connect them to a motive, an opportunity and a piece of physical evidence. Finish the three deductions underneath.</p>
      <TaskBox title="Evidence board" done={done} busy={t.busy} result={t.result} onSubmit={() => t.submit(b)}
        blocked={incomplete ? 'Choose a suspect, fill all three pins and complete all three deductions.' : ''} label="Submit our deduction">
        <div className="board-scroll" tabIndex={-1}><div className="board">
          <svg className="threads" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {si >= 0 && slots.filter(([k]) => b[k]).map(([k]) => (
              <line key={k} x1={SUS_X(si)} y1="30" x2={SLOT_X[k]} y2="62" />
            ))}
          </svg>
          <fieldset className="board-suspects" disabled={done}>
            <legend className="sr-only">Suspect</legend>
            {SUSPECT_IDS.map((id, i) => (
              <label key={id} className={`pin-suspect ${b.suspect === id ? 'chosen' : ''}`} style={{ left: `${SUS_X(i)}%` }}>
                <input type="radio" name="suspect" className="sr-only" checked={b.suspect === id} onChange={() => setB({ ...b, suspect: id })} />
                <Portrait character={charById[id]} className="portrait-sm" />
                <span>{charById[id].name}</span>
              </label>
            ))}
          </fieldset>
          {slots.map(([k, title, help]) => (
            <div key={k} className={`pin-slot ${b[k] ? 'filled' : ''}`} style={{ left: `${SLOT_X[k]}%` }}>
              <label>
                <span className="slot-title">{title}</span>
                <span className="slot-help">{help}</span>
                <select value={b[k]} onChange={(e) => setB({ ...b, [k]: e.target.value })} disabled={done}>
                  <option value="">Pin evidence…</option>
                  {pool.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </label>
              {b[k] && <button type="button" className="btn-link" onClick={() => openEvidence(b[k])}>Open</button>}
            </div>
          ))}
        </div></div>
        <div className="deductions">
          {['d1', 'd2', 'd3'].map((k) => (
            <ChoiceGroup key={k} name={k} {...Q.s5[k]} value={b[k]} onChange={(v) => setB({ ...b, [k]: v })} disabled={done} />
          ))}
        </div>
      </TaskBox>
    </>
  );
}

/* --------------------------- Stage 6 --------------------------- */
function Stage6({ state, act, openEvidence }) {
  const [a, setA] = useDraft('s6', { killer: '', motive: '', weapon: '', evidence: [] });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const pool = EVIDENCE.filter((e) => e.stage <= 4);
  const titleOf = (id) => EVIDENCE_BY_ID[id]?.title || id;
  const label = (list, v) => (list.find(([k]) => k === v) || [, v])[1];

  if (state.solved) return <p className="lede">Your accusation was correct. Open "Case closed" in the stage list to read the full explanation.</p>;

  const submit = async () => {
    setBusy(true); setResult(null);
    try {
      const r = await act('submit_accusation', { p_accusation: a });
      setResult(r.correct ? null : { wrong: true, parts: r.parts_correct });
    } catch (e) { setResult({ error: e.message }); } finally { setBusy(false); setConfirming(false); }
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
          <h2 id="rev-h">Your accusation did not hold up</h2>
          <p><strong>{la.parts_correct} of 4</strong> parts of it hold up (killer, motive, weapon, supporting evidence). <strong>3 minutes</strong> have been added and your clock is still running.</p>
          <dl className="meta">
            <div><dt>Killer</dt><dd>{charById[la.killer]?.name || '—'}</dd></div>
            <div><dt>Motive</dt><dd>{label(Q.s6.motive, la.motive)}</dd></div>
            <div><dt>Weapon</dt><dd>{label(Q.s6.weapon, la.weapon)}</dd></div>
            <div><dt>Evidence</dt><dd>{(la.evidence || []).map(titleOf).join('; ')}</dd></div>
          </dl>
          <p>Talk it through as a team. Does each part agree with your evidence board? Does every piece of evidence point at the person you named?</p>
          <button className="btn btn-primary" onClick={review} disabled={busy}>We have reviewed it — let us try again</button>
          {result?.error && <p className="fb fb-error" role="alert">{result.error}</p>}
        </section>
      </>
    );
  }

  const ready = a.killer && a.motive && a.weapon && a.evidence.length === 3;
  return (
    <>
      <StageHeader n={6} />
      <p className="lede">This is final. A wrong accusation adds 3 minutes and must be reviewed before you try again. A right killer with the wrong reasons is still wrong.</p>
      <form className="accuse" onSubmit={(e) => { e.preventDefault(); if (ready) setConfirming(true); }}>
        <fieldset className="choice">
          <legend>Who killed Evelyn Vale?</legend>
          <div className="accuse-suspects">
            {SUSPECT_IDS.map((id) => (
              <label key={id} className={`acc-s ${a.killer === id ? 'chosen' : ''}`}>
                <input type="radio" name="killer" className="sr-only" checked={a.killer === id} onChange={() => setA({ ...a, killer: id })} />
                <Portrait character={charById[id]} className="portrait-sm" /><span>{charById[id].name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <ChoiceGroup name="motive" prompt="What was the primary motive?" options={Q.s6.motive} value={a.motive} onChange={(v) => setA({ ...a, motive: v })} />
        <ChoiceGroup name="weapon" prompt="What was the weapon?" options={Q.s6.weapon} value={a.weapon} onChange={(v) => setA({ ...a, weapon: v })} />
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
                    <span>{e.title}</span>
                  </label>
                  <button type="button" className="btn-link" onClick={() => openEvidence(e.id)} aria-label={`Open ${e.title}`}>open</button>
                </div>
              );
            })}
          </div>
        </fieldset>
        {!confirming && <button className="btn btn-primary btn-big" disabled={!ready}>Review our accusation</button>}
        {!ready && <p className="help">Choose a killer, a motive, a weapon and exactly three pieces of evidence.</p>}
        {confirming && (
          <div className="confirm" role="alertdialog" aria-labelledby="acc-confirm">
            <p id="acc-confirm">You accuse <strong>{charById[a.killer].name}</strong>, motive: {label(Q.s6.motive, a.motive).toLowerCase()}, weapon: {label(Q.s6.weapon, a.weapon).toLowerCase()}, supported by {a.evidence.map(titleOf).join('; ')}.</p>
            <button type="button" className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Make the accusation'}</button>
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
          <h2>Stage {n} solved</h2>
          <p>Stage {n + 1}, {STAGES[n].title.toLowerCase()}, is now unlocked. Everything you found here stays in your evidence locker.</p>
          <button className="btn btn-primary" onClick={() => setView(n + 1)}>Continue to Stage {n + 1}: {STAGES[n].title}</button>
        </section>
      )}
    </div>
  );
}
