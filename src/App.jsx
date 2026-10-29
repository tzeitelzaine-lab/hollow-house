import { useEffect, useState } from 'react';
import { hashRoute } from './lib/core.js';
import { SoundToggle } from './components/ui.jsx';
import Landing from './pages/Landing.jsx';
import Play from './pages/Play.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Host from './pages/Host.jsx';

export default function App() {
  const [route, setRoute] = useState(hashRoute());
  useEffect(() => {
    const on = () => { setRoute(hashRoute()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = (path, param) => { window.location.hash = `/${path}${param ? `/${encodeURIComponent(param)}` : ''}`; };

  const page = {
    play: <Play go={go} />,
    leaderboard: <Leaderboard code={decodeURIComponent(route.param || '')} go={go} />,
    host: <Host go={go} />,
  }[route.path] || <Landing go={go} />;

  return (
    <>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      {route.path !== 'play' && (
        <div className="topbar">
          <span className="brand-sm">{route.path ? 'HighCall VA Multiverse' : ''}</span>
          <SoundToggle />
        </div>
      )}
      {page}
    </>
  );
}
