import { useEffect, useRef, useState } from 'react';
import { CASE, media } from '../content/story.js';
import { rpc, session, configured, fmt, ambient } from '../lib/core.js';
import { Ornament, BookIcon, ClockIcon, PulseIcon, TrophyIcon, ArrowIcon, SpeakerIcon, CaseFolderArt, MonitorArt, Photo, Emblem } from '../art/Art.jsx';

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

function HeroVideo() {
  const ref = useRef(null);
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [playing, setPlaying] = useState(!reduce);
  useEffect(() => { const v = ref.current; if (!v) return; if (playing) v.play?.().catch(() => setPlaying(false)); else v.pause?.(); }, [playing]);
  return (
    <>
      <div className="lp-hero-bg" aria-hidden="true" style={{ backgroundImage: `url(${media('hospital-poster.jpg')})` }} />
      <video ref={ref} className="lp-video" src={media('hospital.mp4')} poster={media('hospital-poster.jpg')}
        muted loop playsInline autoPlay={!reduce} preload="metadata" aria-hidden="true" />
      <button className="lp-video-toggle" onClick={() => setPlaying(!playing)} aria-pressed={!playing}>
        {playing ? 'Pause video' : 'Play video'}
      </button>
    </>
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
    <aside className="lp-board" aria-labelledby="fd-h" id="leaderboard">
      <div className="lp-board-head"><TrophyIcon /><div><h2 id="fd-h">Fastest detectives</h2><p className="lp-small-caps">{data ? data.event.name : 'Live standings'}</p></div></div>
      {!code && <p className="lp-board-empty">Enter your event code above to see your event's live standings.</p>}
      {code && !data && !err && <p className="lp-board-empty">No event found for {code} yet.</p>}
      {err && <p className="lp-board-empty">{err}</p>}
      {data && top.length === 0 && <p className="lp-board-empty">No team has closed the case yet. The first correct verdict takes the top spot.</p>}
      {top.length > 0 && (
        <ol className="lp-ranks">
          {top.map((r) => (
            <li key={r.team_name}><span className={`medal m${r.rank}`}>{r.rank}</span><span className="lp-team">{r.team_name}</span><span className="lp-time">{fmt(r.adjusted_ms)}</span></li>
          ))}
        </ol>
      )}
      <button className="lp-btn-outline" onClick={() => code && go('leaderboard', code)} disabled={!code}>View full leaderboard <ArrowIcon /></button>
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
    { n: '01', title: 'Examine the evidence', text: 'Hospital records, camera stills, lab reports and recovered messages reveal a deeper story.', art: <CaseFolderArt /> },
    { n: '02', title: 'Question the people', text: 'A family, a chief of staff, two doctors and three nurses. Not everyone is telling the truth.',
      art: (
        <div className="card-collage" aria-hidden="true">
          {['allison', 'amanda', 'veil', 'marigold'].map((id, i) => <Photo key={id} id={id} className={`polaroid p${i}`} alt="" />)}
        </div>
      ) },
    { n: '03', title: 'Prove who did it', text: 'Separate a medical emergency from a homicide, then name who planned it and who carried it out.', art: <MonitorArt /> },
  ];

  return (
    <div className="lp">
      <header className="lp-nav">
        <span className="lp-brand"><Emblem className="lp-logo" /><span>{CASE.brand}</span></span>
        <nav aria-label="Page sections" className="lp-links">
          <button onClick={() => scrollTo('case-files')}>The Case</button>
          <button onClick={() => scrollTo('how')}>How to Play</button>
          <button onClick={() => scrollTo('leaderboard')}>Leaderboard</button>
          <button onClick={() => go('host')}>Host</button>
        </nav>
        <SoundSwitch />
      </header>

      <main id="main" tabIndex={-1}>
        <section className="lp-hero" aria-labelledby="lp-title">
          <HeroVideo />
          <div className="lp-hero-copy">
            <p className="lp-kicker">A HighCall VA Halloween mystery <span aria-hidden="true" className="kicker-rule" /></p>
            <h1 id="lp-title" className="lp-title">
              <span className="t1">Who Unalived</span>
              <span className="t2">the CEO of</span>
              <span className="t3">BlueGreen Insurance?</span>
            </h1>
            <Ornament className="lp-ornament" />
            <p className="lp-tagline">{CASE.tagline}</p>

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
              <button className="lp-cta" disabled={busy}>{busy ? 'Opening the case file…' : mode === 'register' ? 'Enter the investigation' : 'Resume the investigation'} <ArrowIcon /></button>
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
        </section>

        <section className="lp-files" id="case-files" aria-labelledby="cf-h">
          <div className="lp-files-main">
            <div className="lp-section-head">
              <h2 id="cf-h">The case files</h2>
              <span className="head-rule" aria-hidden="true" />
              <p className="lp-small-caps">Read the records. Connect the times. Name the truth.</p>
            </div>
            <div className="lp-cards">
              {cards.map((c) => (
                <button key={c.n} className="lp-card" onClick={() => scrollTo('enter')}>
                  <span className="lp-card-art">{c.art}</span>
                  <span className="lp-card-n">{c.n}</span>
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

        <section className="lp-how" id="how" aria-labelledby="how-h">
          <div className="lp-section-head"><h2 id="how-h">How to play</h2><span className="head-rule" aria-hidden="true" /></div>
          <ol className="lp-how-list">
            <li><span className="lp-card-n">I</span><h3>Gather your team</h3><p>Teams of 3–6. One captain operates the game and shares their screen on the company call.</p></li>
            <li><span className="lp-card-n">II</span><h3>Unlock six stages</h3><p>Each stage opens the next. Evidence stays in your locker so you can return to it at any time.</p></li>
            <li><span className="lp-card-n">III</span><h3>Race the clock</h3><p>You have 30 minutes. Hints add 2 minutes and a wrong verdict adds 3. When time runs out, the game ends and your progress is ranked.</p></li>
            <li><span className="lp-card-n">IV</span><h3>Close the case</h3><p>The fastest correct verdict becomes the HighCall VA Multiverse Champions.</p></li>
          </ol>
          <p className="fineprint">{CASE.disclaimer} No graphic images and no jump scares. Sound stays off unless you turn it on.</p>
        </section>
      </main>
    </div>
  );
}
