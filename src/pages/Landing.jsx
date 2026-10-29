import { useState } from 'react';
import { Building } from '../art/Art.jsx';
import { CASE } from '../content/story.js';
import { rpc, session, configured } from '../lib/core.js';

function initialCode() {
  const q = new URLSearchParams(window.location.search).get('code');
  return (q || session.get()?.code || '').toUpperCase();
}

export default function Landing({ go }) {
  const existing = session.get();
  const [mode, setMode] = useState('register');
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState('');
  const [members, setMembers] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [boardCode, setBoardCode] = useState(initialCode);

  async function submit(e) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const res = mode === 'register'
        ? await rpc('register_team', { p_code: code, p_name: name, p_members: members.split(/[,\n]/).map((s) => s.trim()).filter(Boolean), p_pin: pin })
        : await rpc('resume_team', { p_code: code, p_name: name, p_pin: pin });
      session.set({ token: res.token, code: res.state.event.code });
      go('play');
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  return (
    <main id="main" className="landing">
      <section className="hero">
        <div className="hero-art"><Building className="building" /></div>
        <div className="hero-copy">
          <p className="brand">{CASE.brand}</p>
          <h1 className="case-title">The Heiress<span> of Hollow House</span></h1>
          <p className="tagline">{CASE.tagline}</p>
          <p className="intro">{CASE.intro}</p>

          {existing && (
            <div className="resume-card">
              <p>This browser has an investigation in progress for event {existing.code}.</p>
              <button className="btn" onClick={() => go('play')}>Return to the investigation</button>
            </div>
          )}

          {!configured && (
            <p className="fb fb-error" role="alert">The game server is not configured. Hosts: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then rebuild (see README).</p>
          )}

          <div className="entry">
            <div className="tabs" role="tablist" aria-label="Enter the case">
              <button role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'on' : ''} onClick={() => { setMode('register'); setError(''); }}>Register a new team</button>
              <button role="tab" aria-selected={mode === 'resume'} className={mode === 'resume' ? 'on' : ''} onClick={() => { setMode('resume'); setError(''); }}>Resume our investigation</button>
            </div>
            <form onSubmit={submit} className="form" aria-describedby="entry-help">
              <label>Event code
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required autoComplete="off" maxLength={12} placeholder="From your host" />
              </label>
              <label>Team name
                <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={40} autoComplete="off" />
              </label>
              {mode === 'register' && (
                <label><span>Team members <span className="optional">(optional)</span></span>
                  <textarea value={members} onChange={(e) => setMembers(e.target.value)} rows={2} placeholder="Separate names with commas" />
                </label>
              )}
              <label>{mode === 'register' ? 'Choose a team PIN' : 'Team PIN'}
                <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} required inputMode="numeric" pattern="[0-9]{4,8}" minLength={4} maxLength={8} autoComplete="off" />
              </label>
              <p id="entry-help" className="help">
                {mode === 'register'
                  ? 'Your captain plays on one screen and shares it on the video call. The PIN (4–8 digits) lets you resume on another device. Share it only with your team.'
                  : 'Use the same event code, team name and PIN you registered with. Your timer and penalties continue where they were.'}
              </p>
              {error && <p className="fb fb-error" role="alert">{error}</p>}
              <button className="btn btn-primary" disabled={busy}>{busy ? 'Opening the case file…' : mode === 'register' ? 'Enter the investigation' : 'Resume the investigation'}</button>
            </form>
          </div>
        </div>
      </section>

      <section className="howto" aria-labelledby="howto-h">
        <h2 id="howto-h">How to play</h2>
        <div className="howto-cols">
          <div>
            <h3>Play as a team</h3>
            <p>Teams of 3–6. One captain operates the game and shares their screen on the company video call. Everyone reads, argues and decides together.</p>
          </div>
          <div>
            <h3>Six stages, in order</h3>
            <p>Each stage unlocks the next. Evidence you have found stays in your evidence locker, so you can return to it at any time.</p>
          </div>
          <div>
            <h3>Fastest fair solution wins</h3>
            <p>The timer starts when your captain presses Start Investigation. Hints add 2 minutes. A wrong final accusation adds 3 minutes. Ordinary wrong answers along the way cost nothing.</p>
          </div>
        </div>
        <p className="fineprint">A fictional story about fictional people and organizations. It contains a death but no graphic images, and nothing jumps out at you. Sound is off unless you turn it on.</p>
      </section>

      <section className="board-link" aria-labelledby="lb-h">
        <h2 id="lb-h">Leaderboard</h2>
        <form className="inline-form" onSubmit={(e) => { e.preventDefault(); if (boardCode) go('leaderboard', boardCode.trim().toUpperCase()); }}>
          <label>Event code <input value={boardCode} onChange={(e) => setBoardCode(e.target.value.toUpperCase())} maxLength={12} /></label>
          <button className="btn">View leaderboard</button>
        </form>
        <p className="help"><a href="#/host">Host dashboard</a></p>
      </section>
    </main>
  );
}
