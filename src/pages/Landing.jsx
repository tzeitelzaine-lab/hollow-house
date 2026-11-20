import { useEffect, useRef, useState } from 'react';
import { CASE, CHARACTERS, media } from '../content/story.js';
import { rpc, session, configured, fmt, ambient } from '../lib/core.js';
import { BookIcon, ClockIcon, PulseIcon, TrophyIcon, ArrowIcon, SpeakerIcon, CaseFolderArt, MonitorArt, Photo, Emblem } from '../art/Art.jsx';
import { Modal } from '../components/ui.jsx';

function initialCode() {
  const q = new URLSearchParams(window.location.search).get('code');
  return (q || session.get()?.code || '').toUpperCase();
}
const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

function SoundSwitch() {
  const [on, setOn] = useState(ambient.on);
  return (
    <button className="lp-sound" role="switch" aria-checked={on} aria-label="Rain sound" onClick={() => { on ? ambient.stop() : ambient.start(); setOn(!on); }}>
      <SpeakerIcon /><span className="switch" aria-hidden="true"><span>{on ? 'On' : 'Off'}</span></span>
    </button>
  );
}

// The heartbeat strip from the teaser: decorative, so screen readers skip it.
export function EcgStrip({ hr = 72, className = '' }) {
  return (
    <div className={`ecg-strip ${className}`} aria-hidden="true">
      <svg viewBox="0 0 600 40" preserveAspectRatio="none"><path d="M0 24 H90 l8 -6 l8 6 h10 l6 -20 l8 34 l6 -22 l6 8 h80 l8 -6 l8 6 h10 l6 -20 l8 34 l6 -22 l6 8 h80 l8 -6 l8 6 h10 l6 -20 l8 34 l6 -22 l6 8 H600" /></svg>
      <span className="ecg-hr"><small>HR</small>{hr}</span>
    </div>
  );
}

function HeroVideo() {
  const ref = useRef(null);
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [playing, setPlaying] = useState(!reduce);
  useEffect(() => { const v = ref.current; if (!v) return; if (playing) v.play?.().catch(() => setPlaying(false)); else v.pause?.(); }, [playing]);
  return (
    <figure className="cx-panel cx-video-panel">
      <video ref={ref} className="cx-video" src={media('hospital.mp4')} poster={media('hospital-poster.jpg')}
        muted loop playsInline autoPlay={!reduce} preload="metadata" aria-hidden="true" />
      <figcaption className="cx-caption cx-caption-tl">Georgia Capital Hospital. A little after nine…</figcaption>
      <p className="cx-bubble cx-bubble-shout" aria-hidden="true">Code Blue! Suite 701!</p>
      <button className="lp-video-toggle" onClick={() => setPlaying(!playing)} aria-pressed={!playing}>
        {playing ? 'Pause video' : 'Play video'}
      </button>
      <EcgStrip />
    </figure>
  );
}

function FastestDetectives({ code, go }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (!code || !configured) { setData(null); return; }
    let alive = true;
    const load = () => rpc('get_leaderboard', { p_code: code }).then((d) => alive && (setData(d), setErr(''))).catch((e) => alive && setErr(e.code === 'EVENT_NOT_FOUND' ? '' : e.message));
    load(); const t = setInterval(load, 20000);
    return () => { alive = false; clearInterval(t); };
  }, [code]);
  const top = (data?.rows || []).filter((r) => r.rank).slice(0, 3);
  return (
    <aside className="cx-panel lp-board" aria-labelledby="fd-h" id="leaderboard">
      <div className="lp-board-head"><TrophyIcon /><div><h2 id="fd-h">Fastest detectives</h2><p className="lp-small-caps">{data ? data.event.name : 'Live standings'}</p></div></div>
      {!code && <p className="lp-board-empty">Enter your event code above to see your event's live standings.</p>}
      {code && !data && !err && <p className="lp-board-empty">No event found for {code} yet.</p>}
      {err && <p className="lp-board-empty">{err}</p>}
      {data && top.length === 0 && <p className="lp-board-empty">No team has closed the case yet. The first correct verdict takes the top spot.</p>}
      {top.length > 0 && (
        <ol className="lp-ranks">
          {top.map((r) => (
            <li key={r.team_name}><span className={`medal m${r.rank}`}>{r.rank}</span><span className="lp-team">{r.team_name}</span><span className="lp-time">{r.status === 'Solved' ? fmt(r.adjusted_ms) : 'Time up'}</span></li>
          ))}
        </ol>
      )}
      <button className="btn btn-block" onClick={() => code && go('leaderboard', code)} disabled={!code}>View full leaderboard <ArrowIcon /></button>
    </aside>
  );
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
  const [teaser, setTeaser] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const res = mode === 'register'
        ? await rpc('register_team', { p_code: code, p_name: name, p_members: members.split(/[,\n]/).map((s) => s.trim()).filter(Boolean), p_pin: pin })
        : await rpc('resume_team', { p_code: code, p_name: name, p_pin: pin });
      session.set({ token: res.token, code: res.state.event.code });
      go('play');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  const cards = [
    { n: '1', title: 'Examine the evidence', text: 'Hospital records, camera stills, lab reports and recovered messages reveal a deeper story.', art: <CaseFolderArt /> },
    { n: '2', title: 'Question the people', text: 'A family, a chief of staff, two doctors and three nurses. Not everyone is telling the truth.',
      art: <div className="card-collage" aria-hidden="true">{['allison', 'amanda', 'veil', 'marigold'].map((id, i) => <Photo key={id} id={id} className={`polaroid p${i}`} alt="" />)}</div> },
    { n: '3', title: 'Prove who did it', text: 'Separate a medical emergency from a homicide, then name who planned it and who carried it out.', art: <MonitorArt /> },
  ];

  return (
    <div className="lp cx-page">
      <header className="lp-nav">
        <span className="lp-brand"><Emblem className="lp-logo" /><span>{CASE.brand}</span></span>
        <nav aria-label="Page sections" className="lp-links">
          <button onClick={() => scrollTo('case-files')}>The Case</button>
          <button onClick={() => scrollTo('suspects')}>Suspects</button>
          <button onClick={() => scrollTo('how')}>How to Play</button>
          <button onClick={() => scrollTo('leaderboard')}>Leaderboard</button>
          <button onClick={() => go('host')}>Host</button>
        </nav>
        <SoundSwitch />
      </header>

      <main id="main" tabIndex={-1}>
        <section className="cx-hero" aria-labelledby="lp-title">
          <div className="cx-panel cx-title-panel">
            <div className="cx-rays" aria-hidden="true" />
            <p className="cx-tag cx-tag-lime">{CASE.brand}</p>
            <h1 id="lp-title" className="cx-title"><span className="ct1">Code Blue</span><span className="ct2">at Georgia Capital</span></h1>
            <p className="cx-tag cx-tag-dark">{CASE.genre}</p>

            <div className="cx-challenge">
              <span className="cx-caption">The challenge</span>
              <p className="cx-bubble cx-bubble-big">{CASE.challenge}</p>
            </div>

            {existing && (
              <p className="lp-resume-note">Investigation in progress for event {existing.code}. <button className="lp-link" onClick={() => go('play')}>Return to it</button></p>
            )}
            {!configured && <p className="fb fb-error" role="alert">The game server is not configured. Hosts: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then rebuild (see README).</p>}

            <form className="lp-form" onSubmit={submit} id="enter" aria-label={mode === 'register' ? 'Register your team' : 'Resume your investigation'}>
              <div className="lp-row">
                <label>Event code<input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required autoComplete="off" maxLength={12} placeholder="From your host" /></label>
                <label>Your team name<input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={40} autoComplete="off" placeholder="e.g. The Night Shift" /></label>
              </div>
              <div className="lp-row">
                <label>{mode === 'register' ? 'Choose a team PIN' : 'Team PIN'}<input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} required inputMode="numeric" pattern="[0-9]{4,8}" minLength={4} maxLength={8} autoComplete="off" placeholder="4–8 digits" /></label>
                {mode === 'register' && <label><span>Team members <span className="optional">(optional)</span></span><input value={members} onChange={(e) => setMembers(e.target.value)} placeholder="Ana, Ben, Chidi" /></label>}
              </div>
              {error && <p className="fb fb-error" role="alert">{error}</p>}
              <button className="btn btn-primary btn-big lp-cta" disabled={busy}>{busy ? 'Opening the case file…' : mode === 'register' ? 'Enter the investigation' : 'Resume the investigation'} <ArrowIcon /></button>
              <p className="lp-switch">
                {mode === 'register'
                  ? <>Already registered? <button type="button" className="lp-link" onClick={() => { setMode('resume'); setError(''); }}>Resume with your PIN</button></>
                  : <>New team? <button type="button" className="lp-link" onClick={() => { setMode('register'); setError(''); }}>Register instead</button></>}
              </p>
            </form>

            <ul className="lp-stats">
              <li><BookIcon /> 6 stages</li>
              <li><ClockIcon /> 30-minute limit</li>
              <li><PulseIcon /> Two cardiac arrests</li>
            </ul>
          </div>

          <div className="cx-side">
            <HeroVideo />
            <button className="cx-panel cx-teaser-btn" onClick={() => setTeaser(true)}>
              <img src={media('teaser-poster.jpg')} alt="" />
              <span className="cx-play" aria-hidden="true">▶</span>
              <span className="cx-caption">Watch the teaser</span>
            </button>
          </div>
        </section>

        <section className="cx-section" id="suspects" aria-labelledby="sus-h">
          <div className="lp-section-head"><h2 id="sus-h">Nine people. Every one is hiding something.</h2></div>
          <ul className="cx-lineup">
            {CHARACTERS.filter((c) => !c.victim).map((c, i) => (
              <li key={c.id} className="cx-panel cx-mug" style={{ '--tilt': `${(i % 3) - 1}deg` }}>
                <Photo id={c.id} className="cx-mug-photo" alt={`Comic portrait of ${c.name}`} />
                <span className="cx-caption">{c.name}</span>
                <span className="cx-mug-role">{c.role}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="lp-files cx-section" id="case-files" aria-labelledby="cf-h">
          <div className="lp-files-main">
            <div className="lp-section-head"><h2 id="cf-h">The case files</h2></div>
            <div className="lp-cards">
              {cards.map((c) => (
                <button key={c.n} className="cx-panel lp-card" onClick={() => scrollTo('enter')}>
                  <span className="lp-card-art">{c.art}</span>
                  <span className="cx-num">{c.n}</span>
                  <span className="lp-card-body">
                    <span className="lp-card-title">{c.title} <ArrowIcon /></span>
                    <span className="lp-card-text">{c.text}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <FastestDetectives code={code.trim()} go={go} />
        </section>

        <section className="cx-section lp-how" id="how" aria-labelledby="how-h">
          <div className="lp-section-head"><h2 id="how-h">How to play</h2></div>
          <ol className="lp-how-list">
            <li className="cx-panel"><span className="cx-num">1</span><h3>Gather your team</h3><p>Teams of 3–6. One captain operates the game and shares their screen on the company call.</p></li>
            <li className="cx-panel"><span className="cx-num">2</span><h3>Unlock six stages</h3><p>Each stage opens the next. Evidence stays in your locker so you can return to it at any time.</p></li>
            <li className="cx-panel"><span className="cx-num">3</span><h3>Race the clock</h3><p>You have 30 minutes. Hints add 2 minutes and a wrong verdict adds 3. When time runs out, the game ends and your progress is ranked.</p></li>
            <li className="cx-panel"><span className="cx-num">4</span><h3>Close the case</h3><p>The fastest correct verdict becomes the HighCall VA Multiverse Champions.</p></li>
          </ol>
          <p className="fineprint">{CASE.disclaimer} No graphic images and no jump scares. Sound stays off unless you turn it on.</p>
        </section>
      </main>

      {teaser && (
        <Modal title="Code Blue at Georgia Capital — teaser" wide onClose={() => setTeaser(false)}>
          <video className="cx-teaser-video" src={media('teaser.mp4')} poster={media('teaser-poster.jpg')} controls autoPlay playsInline />
        </Modal>
      )}
    </div>
  );
}
