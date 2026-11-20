import { useCallback, useEffect, useState } from 'react';
import { rpc, hostSession, session, fmt } from '../lib/core.js';
import { Markdown, Modal, EvidenceDoc, customToEvidence } from '../components/ui.jsx';
import { STAGES } from '../content/story.js';
import { LeaderTable } from './Leaderboard.jsx';

function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCsv(detail) {
  const head = ['Rank', 'Team', 'Members', 'Preview', 'Status', 'Stage', 'Hints', 'Wrong accusations', 'Elapsed', 'Penalty', 'Adjusted', 'Elapsed ms', 'Penalty ms', 'Adjusted ms', 'Registered', 'Started', 'Finished'];
  const rows = detail.teams.map((t) => [t.rank ?? '', t.name, (t.members || []).join('; '), t.is_preview ? 'yes' : 'no', t.status, Math.min(t.stage, 6), t.hints_used, t.wrong_accusations,
    fmt(t.elapsed_ms), fmt(t.penalty_ms), fmt(t.adjusted_ms), t.elapsed_ms, t.penalty_ms, t.adjusted_ms, t.registered_at, t.started_at ?? '', t.finished_at ?? '']);
  const csv = [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `bluegreen-case-${detail.event.code}-results.csv`;
  document.body.appendChild(a); a.click(); a.remove();
}

function Confirm({ title, body, expected, actionLabel, onConfirm, onClose }) {
  const [v, setV] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <Modal title={title} onClose={onClose}>
      <p>{body}</p>
      <label className="form">Type <strong>{expected}</strong> to confirm
        <input value={v} onChange={(e) => setV(e.target.value)} autoComplete="off" />
      </label>
      {err && <p className="fb fb-error" role="alert">{err}</p>}
      <div className="task-actions">
        <button className="btn btn-danger" disabled={v !== expected || busy}
          onClick={async () => { setBusy(true); setErr(''); try { await onConfirm(v); onClose(); } catch (e) { setErr(e.message); setBusy(false); } }}>
          {busy ? 'Working…' : actionLabel}
        </button>
        <button className="btn-quiet" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

export default function Host({ go }) {
  const [token, setToken] = useState(hostSession.get());
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [events, setEvents] = useState(null);
  const [code, setCode] = useState('');
  const [detail, setDetail] = useState(null);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [solution, setSolution] = useState(null);
  const [offline, setOffline] = useState(false);
  const [limitMin, setLimitMin] = useState('');

  const call = useCallback(async (name, args = {}) => {
    try { const r = await rpc(name, { p_token: token, ...args }); setOffline(false); return r; }
    catch (e) {
      if (e.code === 'HOST_AUTH') { hostSession.clear(); setToken(null); }
      if (e.network) setOffline(true);
      throw e;
    }
  }, [token]);

  const loadEvents = useCallback(async () => {
    try { setEvents(await call('host_list_events')); } catch (e) { setErr(e.message); }
  }, [call]);

  const loadDetail = useCallback(async () => {
    if (!code) return;
    try { setDetail(await call('host_event_detail', { p_code: code })); } catch (e) { if (!e.network) setErr(e.message); }
  }, [call, code]);

  useEffect(() => { if (token) loadEvents(); }, [token, loadEvents]);
  useEffect(() => {
    if (!token || !code) return;
    setDetail(null); loadDetail();
    const t = setInterval(loadDetail, 8000);
    return () => clearInterval(t);
  }, [token, code, loadDetail]);

  async function login(e) {
    e.preventDefault(); setBusy(true); setErr('');
    try { const r = await rpc('host_login', { p_pass: pass }); hostSession.set(r.token); setToken(r.token); setPass(''); }
    catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  }

  async function run(fn) {
    setErr('');
    try { await fn(); await Promise.all([loadDetail(), loadEvents()]); } catch (e) { setErr(e.message); }
  }

  if (!token) {
    return (
      <main id="main" className="page host-login">
        <h1 className="page-title">Host dashboard</h1>
        <p>Sign in with the host passphrase set in Supabase. This page contains the solution — do not share your screen while it is open.</p>
        <form className="form narrow" onSubmit={login}>
          <label>Host passphrase <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} required autoComplete="current-password" /></label>
          {err && <p className="fb fb-error" role="alert">{err}</p>}
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <button className="btn-quiet" onClick={() => go('')}>Front page</button>
      </main>
    );
  }

  const ev = detail?.event;
  const players = detail?.teams.filter((t) => !t.is_preview) || [];
  const previews = detail?.teams.filter((t) => t.is_preview) || [];
  const active = players.filter((t) => t.status === 'Investigating').length;
  const solved = players.filter((t) => t.status === 'Solved').length;

  return (
    <main id="main" className="page host">
      <div className="host-top">
        <h1 className="page-title">Host dashboard</h1>
        <div>
          <button className="btn-quiet" onClick={() => go('')}>Front page</button>
          <button className="btn-quiet" onClick={async () => { try { await rpc('host_logout', { p_token: token }); } catch { /* ignore */ } hostSession.clear(); setToken(null); }}>Sign out</button>
        </div>
      </div>
      {offline && <p className="banner banner-warn" role="alert">Connection lost. Figures may be out of date; retrying automatically.</p>}
      {err && <p className="fb fb-error" role="alert">{err}</p>}

      <section className="host-events">
        <h2>Events</h2>
        {events == null ? <p className="loading">Loading events…</p> : events.length === 0 ? <p className="empty">No events yet. Create one below.</p> : (
          <ul className="event-list">
            {events.map((e) => (
              <li key={e.code}>
                <button className={`event-btn ${code === e.code ? 'on' : ''}`} onClick={() => setCode(e.code)}>
                  <strong>{e.name}</strong> <span className="code">{e.code}</span>
                  <span className="help">{e.teams} teams, {e.solved} solved{e.paused ? ', paused' : ''}{e.registration_open ? '' : ', registration closed'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <form className="inline-form" onSubmit={(e) => { e.preventDefault(); run(async () => { const r = await call('host_create_event', { p_name: newName, p_code: newCode || null }); setNewName(''); setNewCode(''); setCode(r.code); }); }}>
          <label>New event name <input value={newName} onChange={(e) => setNewName(e.target.value)} required minLength={2} placeholder="HighCall VA Halloween 2026" /></label>
          <label><span>Room code <span className="optional">(optional)</span></span> <input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} maxLength={12} placeholder="Auto" /></label>
          <button className="btn">Create event</button>
        </form>
      </section>

      {code && !detail && <p className="loading">Loading event…</p>}
      {detail && (
        <>
          <section className="host-controls">
            <h2>{ev.name} <span className="code">{ev.code}</span></h2>
            <p className="help">Players join at <strong>{window.location.origin + window.location.pathname}?code={ev.code}</strong>. {players.length} teams registered, {active} investigating, {solved} solved, {players.filter((t) => t.status === 'Time up').length} out of time. Time limit: {Math.round((ev.time_limit_ms || 1800000) / 60000)} minutes per team. Total paused time: {fmt(ev.total_paused_ms)}.</p>
            <div className="control-row">
              <button className="btn" onClick={() => run(() => call('host_set_registration', { p_code: ev.code, p_open: !ev.registration_open }))}>
                {ev.registration_open ? 'Close registration' : 'Reopen registration'}
              </button>
              <button className={`btn ${ev.paused ? 'btn-primary' : ''}`} onClick={() => run(() => call('host_set_paused', { p_code: ev.code, p_paused: !ev.paused }))}>
                {ev.paused ? 'Resume event (restart all clocks)' : 'Pause event (freeze all clocks)'}
              </button>
              <button className="btn" onClick={() => exportCsv(detail)}>Export results (CSV)</button>
              <form className="limit-form" onSubmit={(e) => { e.preventDefault(); run(() => call('host_set_time_limit', { p_code: ev.code, p_minutes: Number(limitMin) })); }}>
                <label>Time limit (minutes)
                  <input type="number" min="5" max="180" value={limitMin || Math.round((ev.time_limit_ms || 1800000) / 60000)} onChange={(e) => setLimitMin(e.target.value)} />
                </label>
                <button className="btn">Save limit</button>
              </form>
              <button className="btn" onClick={() => run(async () => {
                const r = await call('host_create_preview', { p_code: ev.code });
                session.set({ token: r.token, code: r.code, preview: true });
                go('play');
              })}>Open preview mode</button>
              <button className="btn btn-danger" onClick={() => setConfirm({ kind: 'reset' })}>Reset event…</button>
            </div>
            <p className="help">Registration is {ev.registration_open ? 'open' : 'closed'}. {ev.paused ? 'The event is paused: no team can act and no clock is running.' : ''} Preview mode replaces any team session in this browser and is never ranked.</p>
          </section>

          <section>
            <h2>Teams</h2>
            {players.length === 0 ? <p className="empty">No teams yet. Share the join link above.</p> : (
              <div className="table-wrap" tabIndex={0} role="region" aria-label="Team progress">
                <table className="lb">
                  <thead><tr><th>Rank</th><th>Team</th><th>Status</th><th>Stage</th><th>Hints</th><th>Accusations (wrong)</th><th>Elapsed</th><th>Penalty</th><th>Adjusted</th><th>Last activity</th><th><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    {players.map((t) => (
                      <tr key={t.id}>
                        <td>{t.rank ? `#${t.rank}` : '—'}</td>
                        <td>{t.name}{t.members?.length ? <small className="members-sm">{t.members.join(', ')}</small> : null}</td>
                        <td>{t.status}{t.needs_review ? ' (reviewing)' : ''}</td>
                        <td>{t.status === 'Solved' ? 'Done' : `${Math.min(t.stage, 6)} of 6 (${t.tasks_completed}/7)`}</td>
                        <td>{t.hints_used}</td>
                        <td>{t.accusations} ({t.wrong_accusations})</td>
                        <td className="num">{fmt(t.elapsed_ms)}</td>
                        <td className="num">+{fmt(t.penalty_ms)}</td>
                        <td className="num">{fmt(t.adjusted_ms)}</td>
                        <td>{new Date(t.last_activity_at).toLocaleTimeString()}</td>
                        <td><button className="btn-quiet" onClick={() => setConfirm({ kind: 'team', team: t })}>Delete…</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {previews.length > 0 && (
              <p className="help">Preview runs (not ranked): {previews.map((p) => (
                <span key={p.id}>{p.name} — stage {Math.min(p.stage, 6)} <button className="btn-link" onClick={() => setConfirm({ kind: 'team', team: p })}>delete</button>; </span>
              ))}</p>
            )}
          </section>

          <section>
            <h2>Leaderboard as players see it</h2>
            <LeaderTable rows={players.map((t) => ({ ...t, team_name: t.name }))} />
          </section>
        </>
      )}

      <HostEvidence call={call} onError={setErr} />

      <section className="host-solution">
        <h2>Solution and walkthrough</h2>
        <p className="help">Host only. Keep this closed while sharing your screen.</p>
        {!solution ? (
          <button className="btn" onClick={() => run(async () => setSolution(await call('host_solution')))}>Show the solution</button>
        ) : (
          <>
            <button className="btn-quiet" onClick={() => setSolution(null)}>Hide the solution</button>
            <Markdown text={solution.walkthrough} />
            <details><summary>Full reveal text shown to teams</summary><Markdown text={solution.reveal} /></details>
          </>
        )}
      </section>

      {confirm?.kind === 'reset' && (
        <Confirm title="Reset this event?" expected={ev.code} actionLabel="Delete every team and result"
          body="This permanently deletes every team, run, hint, accusation and result for this event. The event and its code remain. This cannot be undone."
          onConfirm={(v) => run(() => call('host_reset_event', { p_code: ev.code, p_confirm_code: v }))} onClose={() => setConfirm(null)} />
      )}
      {confirm?.kind === 'team' && (
        <Confirm title={`Delete ${confirm.team.name}?`} expected={confirm.team.name} actionLabel="Delete this team's run"
          body="This permanently deletes the team, its progress and its result. The team could then register again from scratch."
          onConfirm={(v) => run(() => call('host_delete_team', { p_team_id: confirm.team.id, p_confirm_name: v }))} onClose={() => setConfirm(null)} />
      )}
    </main>
  );
}

const KINDS = ['Hospital record', 'Document', 'Photograph', 'Messages', 'Statement', 'Lab report', 'Financial record', 'Security record'];
const EMPTY = { title: '', kind: 'Hospital record', stage: 2, summary: '', body: '', image_data: '', supports_solution: false, visible: true };

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return reject(new Error('Use a PNG, JPEG, WebP or GIF image.'));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That image could not be read.')); };
    img.src = url;
  });
}

function HostEvidence({ call, onError }) {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(null); // {id?, ...fields, keep_image}
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [del, setDel] = useState(null);
  const [preview, setPreview] = useState(null);

  const load = useCallback(async () => { try { setItems(await call('host_list_evidence')); } catch (e) { onError(e.message); } }, [call, onError]);
  useEffect(() => { load(); }, [load]);

  const edit = (it) => setForm(it ? { ...EMPTY, ...it, image_data: '', keep_image: Boolean(it.image_data), existing_image: it.image_data } : { ...EMPTY });

  async function save(e) {
    e.preventDefault(); setBusy(true); setMsg('');
    try {
      const { id, existing_image, ...data } = form;
      await call('host_save_evidence', { p_id: id || null, p_data: data });
      setMsg(`Saved "${form.title}".`); setForm(null); await load();
    } catch (e2) { setMsg(e2.message); } finally { setBusy(false); }
  }
  async function pickImage(e) {
    const f = e.target.files?.[0]; if (!f) return;
    try { const data = await resizeImage(f); setForm((x) => ({ ...x, image_data: data, keep_image: false })); }
    catch (e2) { setMsg(e2.message); }
  }

  return (
    <section className="host-evidence" aria-labelledby="hev-h">
      <h2 id="hev-h">Extra evidence</h2>
      <p className="help">Add your own clues, records or photos. They appear for every team in the stage you choose, after that stage unlocks, and are kept off the screen until then. Only evidence marked "counts as supporting evidence" is accepted in the final verdict.</p>
      {msg && <p className="fb fb-ok" role="status">{msg}</p>}
      {items == null ? <p className="loading">Loading evidence…</p> : items.length === 0 ? <p className="empty">No extra evidence yet. The built-in case is complete without it.</p> : (
        <div className="table-wrap" tabIndex={0} role="region" aria-label="Extra evidence">
          <table className="lb">
            <thead><tr><th>Title</th><th>Type</th><th>Stage</th><th>Visible</th><th>Counts in verdict</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{items.map((it) => (
              <tr key={it.id}>
                <td>{it.title}{it.image_data && <small className="members-sm">Has image</small>}</td>
                <td>{it.kind}</td><td>{it.stage}</td><td>{it.visible ? 'Yes' : 'Hidden'}</td><td>{it.supports_solution ? 'Yes' : 'No'}</td>
                <td>
                  <button className="btn-quiet" onClick={() => setPreview(customToEvidence({ ...it, id: 'custom:' + it.id, image: it.image_data }))}>Preview</button>
                  <button className="btn-quiet" onClick={() => edit(it)}>Edit</button>
                  <button className="btn-quiet" onClick={() => setDel(it)}>Delete…</button>
                </td>
              </tr>))}
            </tbody>
          </table>
        </div>
      )}
      {!form && <button className="btn btn-primary" onClick={() => edit(null)}>Add evidence</button>}
      {form && (
        <form className="form ev-form" onSubmit={save}>
          <h3 className="panel-title">{form.id ? 'Edit evidence' : 'New evidence'}</h3>
          <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required minLength={2} maxLength={120} /></label>
          <div className="form-row">
            <label>Type<select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select></label>
            <label>Appears in<select value={form.stage} onChange={(e) => setForm({ ...form, stage: Number(e.target.value) })}>
              {STAGES.slice(0, 5).map((s) => <option key={s.n} value={s.n}>Stage {s.n}: {s.title}</option>)}</select></label>
          </div>
          <label>Short summary (shown on the evidence card)<input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} maxLength={300} /></label>
          <label>Full text (leave a blank line between paragraphs)<textarea rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={10000} /></label>
          <label>Image (optional — resized automatically)<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={pickImage} /></label>
          {(form.image_data || (form.keep_image && form.existing_image)) && (
            <div className="img-preview">
              <img src={form.image_data || form.existing_image} alt="Selected evidence image" />
              <button type="button" className="btn-quiet" onClick={() => setForm({ ...form, image_data: '', keep_image: false, existing_image: null })}>Remove image</button>
            </div>
          )}
          <label className="check-row"><input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} /> <span>Visible to teams</span></label>
          <label className="check-row"><input type="checkbox" checked={form.supports_solution} onChange={(e) => setForm({ ...form, supports_solution: e.target.checked })} /> <span>Counts as supporting evidence in the final verdict (only tick this if it points to the real culprits)</span></label>
          <div className="task-actions">
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save evidence'}</button>
            <button type="button" className="btn-quiet" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}
      {preview && <Modal title={preview.title} onClose={() => setPreview(null)}><EvidenceDoc item={preview} /></Modal>}
      {del && (
        <Confirm title={`Delete "${del.title}"?`} expected={del.title} actionLabel="Delete this evidence"
          body="Teams will no longer see it. If a team already cited it in a verdict, that verdict stays as it was scored."
          onConfirm={async (v) => { await call('host_delete_evidence', { p_id: del.id, p_confirm_title: v }); await load(); }} onClose={() => setDel(null)} />
      )}
    </section>
  );
}
