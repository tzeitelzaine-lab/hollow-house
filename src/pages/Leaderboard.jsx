import { useEffect, useState } from 'react';
import { CASE } from '../content/story.js';
import { rpc, fmt } from '../lib/core.js';

export function LeaderTable({ rows }) {
  if (!rows.length) return <p className="empty">No teams have registered yet. Share the event code to get started.</p>;
  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-label="Leaderboard">
      <table className="lb">
        <thead>
          <tr><th scope="col">Rank</th><th scope="col">Team</th><th scope="col">Status</th><th scope="col">Elapsed</th><th scope="col">Penalty</th><th scope="col">Final adjusted</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.team_name} className={r.rank === 1 ? 'champ' : ''}>
              <td>{r.rank ? `#${r.rank}` : '—'}</td>
              <td>
                {r.team_name}
                {r.rank === 1 && <span className="champ-tag">HighCall VA Multiverse Champions</span>}
              </td>
              <td>{r.status}</td>
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
          <p className="help">{data.event.name} · updates every 10 seconds{data.event.paused ? ' · event paused by host' : ''}. Ranked by final adjusted time; ties go to fewer wrong accusations, then fewer hints, then earlier finish.</p>
          <LeaderTable rows={data.rows} />
        </>
      )}
    </main>
  );
}
