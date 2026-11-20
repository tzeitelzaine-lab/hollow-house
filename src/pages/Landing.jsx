import { useEffect, useRef, useState } from 'react';
import { CASE, media } from '../content/story.js';
import { rpc, session, configured } from '../lib/core.js';
import { Emblem, LockIcon } from '../art/Art.jsx';
import { SoundToggle } from '../components/ui.jsx';

function initialCode() {
  const q = new URLSearchParams(window.location.search).get('code');
  return (q || session.get()?.code || '').toUpperCase();
}

const MENU = [
  { id: 'register', label: 'Register a team', meta: 'New case' },
  { id: 'resume', label: 'Resume investigation', meta: 'PIN', locked: true },
  { id: 'howto', label: 'How to play', meta: '6 stages' },
  { id: 'leaderboard', label: 'Leaderboard', meta: 'Live' },
  { id: 'host', label: 'Host dashboard', meta: 'Protected', locked: true },
];

function HeroVideo() {
  const ref = useRef(null);
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [playing, setPlaying] = useState(!reduce);
  useEffect(() => { const v = ref.current; if (!v) return; if (playing) v.play?.().catch(() => setPlaying(false)); else v.pause?.(); }, [playing]);
  return (
    <>
      <video ref={ref} className="hero-video" src={media('hospital.mp4')} poster={media('hospital-poster.jpg')}
        muted loop playsInline autoPlay={!reduce} preload="metadata" aria-hidden="true" />
      <button className="video-toggle btn-quiet" onClick={() => setPlaying(!playing)} aria-pressed={!playing}>
        {playing ? 'Pause background video' : 'Play background video'}
      </button>
    </>
  );
}

export default function Landing({ go }) {
  const existing = session.get();
  const [active, setActive] = useState('register');
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState('');
  const [members, setMembers] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = (id) => {
    setError('');
    if (id === 'host') return go('host');
    setActive(id);
  };

  async function submit(e) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const res = active === 'register'
        ? await rpc('register_team', { p_code: code, p_name: name, p_members: members.split(/[,\n]/).map((s) => s.trim()).filter(Boolean), p_pin: pin })
        : await rpc('resume_team', { p_code: code, p_name: name, p_pin: pin });
      session.set({ token: res.token, code: res.state.event.code });
      go('play');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <main id="main" className="split" tabIndex={-1}>
      <section className="split-left" aria-labelledby="case-title">
        <div className="split-top">
          <span className="brand-sm">{CASE.brand}</span>
          <SoundToggle />
        </div>
        <p className="kicker">{CASE.code} · Georgia Capital Hospital</p>
        <h1 id="case-title" className="display">Who unalived the CEO of BlueGreen Insurance?</h1>
        <span className="bar" aria-hidden="true" />
        <p className="tagline">{CASE.tagline}</p>

        {existing && (
          <div className="resume-card">
            <p>This browser has an investigation in progress for event {existing.code}.</p>
            <button className="btn btn-primary" onClick={() => go('play')}>Return to the investigation</button>
          </div>
        )}
        {!configured && <p className="fb fb-error" role="alert">The game server is not configured. Hosts: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then rebuild (see README).</p>}

        <nav aria-label="Case menu">
          <ul className="case-menu">
            {MENU.map((m) => (
              <li key={m.id}>
                <button className={`menu-row ${active === m.id ? 'selected' : ''}`} aria-current={active === m.id ? 'true' : undefined} onClick={() => pick(m.id)}>
                  <span className="menu-label">{m.label}</span>
                  <span className="menu-meta">{m.meta}{m.locked && <LockIcon />}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <span className="bar bar-bottom" aria-hidden="true" />
        <p className="fineprint">{CASE.disclaimer} No graphic images and no jump scares. Sound stays off unless you turn it on.</p>
      </section>

      <section className="split-right" aria-label="Case details">
        <HeroVideo />
        <div className="hud" aria-hidden="false">
          <div className="hud-stats">
            <div><span className="hud-k">Team size</span><span className="hud-v">3–6</span><span className="meter"><span style={{ width: '60%' }} /></span></div>
            <div><span className="hud-k">Play time</span><span className="hud-v">30–45 min</span><span className="meter"><span style={{ width: '45%' }} /></span></div>
          </div>
          <Emblem className="emblem" />
        </div>

        <div className="glass-panel">
          {(active === 'register' || active === 'resume') && (
            <form onSubmit={submit} className="form" aria-labelledby="entry-h">
              <h2 id="entry-h" className="panel-title">{active === 'register' ? 'Register your team' : 'Resume your investigation'}</h2>
              <label>Event code<input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required autoComplete="off" maxLength={12} placeholder="From your host" /></label>
              <label>Team name<input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={40} autoComplete="off" /></label>
              {active === 'register' && (
                <label><span>Team members <span className="optional">(optional)</span></span>
                  <input value={members} onChange={(e) => setMembers(e.target.value)} placeholder="Separate names with commas" /></label>
              )}
              <label>{active === 'register' ? 'Choose a team PIN (4–8 digits)' : 'Team PIN'}
                <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} required inputMode="numeric" pattern="[0-9]{4,8}" minLength={4} maxLength={8} autoComplete="off" />
              </label>
              <p className="help">{active === 'register'
                ? 'One captain plays and shares their screen on the call. The PIN lets your team resume on another device.'
                : 'Use the same event code, team name and PIN. Your timer and penalties continue where they were.'}</p>
              {error && <p className="fb fb-error" role="alert">{error}</p>}
              <button className="btn btn-primary btn-big" disabled={busy}>{busy ? 'Opening the case file…' : active === 'register' ? 'Open the case file' : 'Resume the investigation'}</button>
            </form>
          )}
          {active === 'howto' && (
            <div>
              <h2 className="panel-title">How to play</h2>
              <ol className="howto-list">
                <li><strong>Play as a team.</strong> Teams of 3–6. The captain operates the game and shares their screen on the company call.</li>
                <li><strong>Six stages, in order.</strong> Each unlocks the next. Evidence stays in your evidence locker so you can revisit it any time.</li>
                <li><strong>Two events, one killing.</strong> Separate the morning medical emergency from the evening homicide.</li>
                <li><strong>Time is the score.</strong> Hints add 2 minutes. A wrong final verdict adds 3. Other wrong answers are free.</li>
                <li><strong>Win.</strong> The fastest correct verdict becomes the HighCall VA Multiverse Champions.</li>
              </ol>
            </div>
          )}
          {active === 'leaderboard' && (
            <form className="form" onSubmit={(e) => { e.preventDefault(); if (code) go('leaderboard', code.trim().toUpperCase()); }}>
              <h2 className="panel-title">Leaderboard</h2>
              <label>Event code<input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={12} required /></label>
              <button className="btn btn-primary">View standings</button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
