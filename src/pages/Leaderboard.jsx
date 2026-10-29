import { useEffect, useState } from 'react';
import { CASE } from '../content/story.js';
import { rpc, fmt } from '../lib/core.js';

const TOTAL_TASKS = 7;

export function LeaderTable({ rows }) {
  if (!rows.length) return <p className="empty">No teams have registered yet. Share the event code to get started.</p>;
  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-label="Leaderboard">
      <table className="lb">
        <thead>
          <tr><th scope="col">Rank</th><th scope="col">Team</th><th scope="col">Status</th><th scope="col">Progress</th><th scope="col">Elapsed</th><th scope="col">Penalty</th><th scope="col">Final adjusted</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.team_name} className={r.rank === 1 && r.status === 'Solved' ? 'champ' : r.status === 'Time up' ? 'timeup' : ''}>
              <td>{r.rank ? `#${r.rank}` : '—'}</td>
              <td>
                {r.team_name}
                {r.rank === 1 && r.status === 'Solved' && <span className="champ-tag">HighCall VA Multiverse Champions</span>}
              </td>
              <td>{r.status === 'Time up' ? 'Time up (unfinished)' : r.status}</td>
              <td>{r.status === 'Solved' ? 'Case closed' : r.status === 'Registered' ? '—' : `Stage ${r.stage ?? '—'} · ${r.tasks_completed ?? 0}/${TOTAL_TASKS} tasks`}</td>
              <td className="num">{r.status === 'Registered' ? '—' : fmt(r.elapsed_ms)}</td>
              <td className="num">{r.penalty_ms ? `+${fmt(r.penalty_ms)}` : '0:00'}</td>
              <td className="num">{r.rank ? <strong>{fmt(r.adjusted_ms)}</strong> : r.status === 'Investigating' ? <span className="running">running</span> : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Leaderboard({ code, go }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [stale, setStale] = useState(false);
  const [input, setInput] = useState(code || '');

  useEffect(() => {
    if (!code) return;
    let alive = true;
    const load = async () => {
      try { const d = await rpc('get_leaderboard', { p_code: code }); if (alive) { setData(d); setErr(''); setStale(false); } }
      catch (e) { if (!alive) return; if (e.network) setStale(true); else setErr(e.message); }
    };
    setData(null); load();
    const t = setInterval(load, 10000);
    return () => { alive = false; clearInterval(t); };
  }, [code]);

  return (
    <main id="main" className="page lb-page">
      <p className="brand">{CASE.brand}</p>
      <h1 className="page-title">{CASE.title} — leaderboard</h1>
      <form className="inline-form" onSubmit={(e) => { e.preventDefault(); go('leaderboard', input.trim().toUpperCase()); }}>
        <label>Event code <input value={input} onChange={(e) => setInput(e.target.value.toUpperCase())} maxLength={12} /></label>
        <button className="btn">Show</button>
        <button type="button" className="btn-quiet" onClick={() => go('')}>Front page</button>
      </form>
      {!code && <p className="empty">Enter your event code to see the standings.</p>}
      {err && <p className="fb fb-error" role="alert">{err}</p>}
      {stale && <p className="banner banner-warn" role="status">Connection lost. Showing the last standings received; retrying every 10 seconds.</p>}
      {code && !data && !err && <p className="loading" aria-busy="true">Loading standings…</p>}
      {data && (
        <>
          <p className="help">{data.event.name} · {Math.round((data.event.time_limit_ms || 1800000) / 60000)}-minute limit · updates every 10 seconds{data.event.paused ? ' · event paused by host' : ''}. Solved teams rank first by final adjusted time (ties: fewer wrong verdicts, then fewer hints, then earlier finish). Teams whose time ran out rank next, by tasks completed.</p>
          <LeaderTable rows={data.rows} />
        </>
      )}
    </main>
  );
}
