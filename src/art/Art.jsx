import { useId } from 'react';

const C = {
  night: '#0b1322', night2: '#13203a', brick: '#3a2a2c', brick2: '#2c2023', stone: '#4a4650',
  gold: '#c4a464', warm: '#f2c46b', paper: '#eee5d0', ink: '#2a2119', burgundy: '#7a2233', glass: '#7f9bb8',
};

/* ------------------------------------------------------------------ */
/* Hollow House exterior in the rain                                  */
/* ------------------------------------------------------------------ */
export function Building({ className }) {
  const id = useId().replace(/:/g, '');
  const rows = [0, 1, 2, 3, 4];
  const cols = [0, 1, 2];
  return (
    <svg className={className} viewBox="0 0 420 560" role="img" aria-labelledby={`${id}-t`}>
      <title id={`${id}-t`}>Hollow House: a narrow five-storey brick apartment building at night in the rain. One window on the fourth floor glows warm.</title>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#060b15" /><stop offset="1" stopColor="#1a2a46" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.warm} stopOpacity="0.55" /><stop offset="1" stopColor={C.warm} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-lamp`} cx="0.5" cy="0.3" r="0.6">
          <stop offset="0" stopColor="#ffe2a0" stopOpacity="0.45" /><stop offset="1" stopColor="#ffe2a0" stopOpacity="0" />
        </radialGradient>
        <pattern id={`${id}-brick`} width="24" height="12" patternUnits="userSpaceOnUse">
          <rect width="24" height="12" fill={C.brick} />
          <path d="M0 11.5H24M12 0V6M0 6H24M0 6V12M24 6V12" stroke={C.brick2} strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="420" height="560" fill={`url(#${id}-sky)`} />
      {/* moon behind cloud */}
      <circle cx="330" cy="70" r="26" fill="#d9d2bf" opacity="0.18" />
      <path d="M250 80q30-24 70-8q30-20 70 2q24 4 30 20H230q2-12 20-14z" fill="#1b2741" opacity="0.9" />
      {/* neighbour silhouettes */}
      <rect x="0" y="210" width="70" height="350" fill="#0d1628" />
      <rect x="350" y="180" width="70" height="380" fill="#0d1628" />
      <rect x="18" y="240" width="10" height="14" fill="#2a3550" /><rect x="372" y="220" width="10" height="14" fill="#2a3550" />
      {/* building */}
      <rect x="80" y="90" width="260" height="440" fill={`url(#${id}-brick)`} />
      <rect x="72" y="80" width="276" height="16" fill={C.stone} />
      <rect x="66" y="74" width="288" height="8" fill="#5a5560" />
      <text x="210" y="122" textAnchor="middle" fill={C.gold} fontFamily="'IM Fell English', Georgia, serif" fontSize="15" letterSpacing="3" opacity="0.85">HOLLOW HOUSE</text>
      {rows.map((r) =>
        cols.map((c) => {
          const x = 104 + c * 76, y = 140 + r * 74;
          const lit = r === 1 && c === 1; // 4th floor (rows from top: 5,4,3,2,1)
          const dim = (r === 3 && c === 0) || (r === 0 && c === 2);
          return (
            <g key={`${r}-${c}`}>
              {lit && <circle cx={x + 22} cy={y + 24} r="46" fill={`url(#${id}-glow)`} className="flicker" />}
              <rect x={x - 4} y={y - 6} width="52" height="60" fill={C.stone} />
              <rect x={x} y={y} width="44" height="50" fill={lit ? C.warm : dim ? '#3a4058' : '#1a2338'} />
              <path d={`M${x + 22} ${y}V${y + 50}M${x} ${y + 25}H${x + 44}`} stroke={C.stone} strokeWidth="3" />
              {lit && <rect x={x + 4} y={y + 30} width="14" height="20" fill="#2a1d18" opacity="0.6" />}
            </g>
          );
        })
      )}
      {/* fire escape */}
      <g stroke="#15151a" strokeWidth="2.5" fill="none">
        {rows.slice(0, 4).map((r) => (
          <g key={r}>
            <path d={`M262 ${196 + r * 74}H340`} />
            <path d={`M262 ${180 + r * 74}H340M262 ${180 + r * 74}V${196 + r * 74}M340 ${180 + r * 74}V${196 + r * 74}`} />
            <path d={`M272 ${196 + r * 74}L330 ${254 + r * 74}`} />
          </g>
        ))}
      </g>
      {/* entrance */}
      <rect x="180" y="460" width="60" height="70" fill="#1d1416" />
      <path d="M180 460a30 22 0 0 1 60 0" fill={C.stone} />
      <rect x="196" y="476" width="28" height="54" fill="#2c1f1e" />
      <circle cx="218" cy="504" r="2" fill={C.gold} />
      <rect x="168" y="530" width="84" height="8" fill="#4a4650" />
      {/* camera above door */}
      <rect x="244" y="452" width="12" height="7" rx="2" fill="#0e0e12" /><circle cx="244" cy="455.5" r="1.4" fill="#c33" />
      {/* street + lamp */}
      <rect x="0" y="538" width="420" height="22" fill="#0a0f1a" />
      <path d="M0 546H420" stroke="#1f2b44" strokeWidth="1" />
      <ellipse cx="60" cy="548" rx="40" ry="4" fill="#ffe2a0" opacity="0.12" />
      <path d="M58 538V330" stroke="#151821" strokeWidth="5" />
      <path d="M58 334q14-12 26 0" stroke="#151821" strokeWidth="4" fill="none" />
      <circle cx="84" cy="346" r="60" fill={`url(#${id}-lamp)`} />
      <path d="M76 336h16l-3 14h-10z" fill="#ffe7b0" />
      {/* rain */}
      <g className="rain" stroke="#9fb4d6" strokeWidth="1" opacity="0.35">
        {Array.from({ length: 60 }).map((_, i) => {
          const x = (i * 37) % 420, y = (i * 53) % 560;
          return <line key={i} x1={x} y1={y} x2={x - 6} y2={y + 22} />;
        })}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Apartment 4B scene                                                  */
/* ------------------------------------------------------------------ */
export function Apartment({ className }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} viewBox="0 0 800 500" role="img" aria-labelledby={`${id}-t`} preserveAspectRatio="xMidYMid meet">
      <title id={`${id}-t`}>Apartment 4B: a small room with faded green wallpaper. An armchair with a bag on the left, a sofa, a fireplace with one candlestick on the mantel, a broken window with rain outside, a desk with papers on the right, and a rug where a second candlestick lies. Drawers are pulled out on the floor.</title>
      <defs>
        <pattern id={`${id}-wp`} width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#2a3a36" />
          <path d="M20 4c6 8 6 14 0 18c-6-4-6-10 0-18zM0 24c6 8 6 14 0 18M40 24c-6 8-6 14 0 18" fill="#334740" />
        </pattern>
        <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b2a20" /><stop offset="1" stopColor="#24180f" />
        </linearGradient>
        <radialGradient id={`${id}-lamp`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f2c46b" stopOpacity="0.35" /><stop offset="1" stopColor="#f2c46b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="330" fill={`url(#${id}-wp)`} />
      <rect y="318" width="800" height="14" fill="#1d1612" />
      <rect y="330" width="800" height="170" fill={`url(#${id}-floor)`} />
      {/* window (broken) */}
      <rect x="430" y="60" width="140" height="170" fill="#1d1612" />
      <rect x="440" y="70" width="120" height="150" fill="#0f1a2e" />
      <g stroke="#9fb4d6" strokeWidth="1" opacity="0.5" className="rain">
        {Array.from({ length: 14 }).map((_, i) => <line key={i} x1={445 + i * 8} y1={75 + (i * 23) % 120} x2={441 + i * 8} y2={92 + (i * 23) % 120} />)}
      </g>
      <path d="M500 70V220M440 145H560" stroke="#1d1612" strokeWidth="5" />
      <path d="M505 80l20 30l-12 18l30 10l-22 12l14 20M470 95l18 22l-20 10" stroke="#d6e2f0" strokeWidth="1.5" fill="none" opacity="0.8" />
      <path d="M510 85l18 25l-10 15z" fill="#0a1220" />
      <rect x="425" y="226" width="150" height="10" fill="#3a2c22" />
      <path d="M440 232h120" stroke="#7f9bb8" strokeWidth="2" opacity="0.5" />
      {/* fireplace + mantel with one candlestick */}
      <rect x="250" y="190" width="150" height="130" fill="#4a3f3a" />
      <rect x="240" y="180" width="170" height="14" fill="#5c4f48" />
      <rect x="282" y="230" width="86" height="90" fill="#140d0a" />
      <path d="M300 320q10-20 25-6q12-18 25 6z" fill="#2a1a12" />
      <path d="M372 262l16 54" stroke="#222" strokeWidth="4" /><circle cx="371" cy="259" r="4" fill="#333" />
      <g fill={C.gold}>
        <rect x="380" y="172" width="10" height="8" /><rect x="383" y="140" width="4" height="32" /><rect x="379" y="136" width="12" height="5" />
        <rect x="384" y="124" width="2" height="12" fill="#eee5d0" />
      </g>
      <rect x="258" y="174" width="8" height="6" fill={C.gold} opacity="0.4" />
      {/* floor lamp */}
      <circle cx="140" cy="150" r="90" fill={`url(#${id}-lamp)`} />
      <path d="M140 160V320" stroke="#1a1a1a" strokeWidth="4" />
      <path d="M115 160h50l-10-40h-30z" fill="#b89a5a" />
      {/* armchair + bag */}
      <path d="M60 300q0-70 50-70h60q40 0 40 70v60H60z" fill="#5a1f2c" />
      <rect x="50" y="300" width="30" height="70" rx="8" fill="#4a1824" /><rect x="200" y="300" width="30" height="70" rx="8" fill="#4a1824" />
      <rect x="80" y="320" width="120" height="30" fill="#6a2533" />
      <path d="M120 300q24-34 48 0z" fill="none" stroke="#1a1410" strokeWidth="3" />
      <rect x="112" y="298" width="64" height="38" rx="6" fill="#2e2118" />
      <rect x="140" y="306" width="10" height="6" fill={C.gold} />
      {/* sofa */}
      <path d="M230 360q0-40 40-40h160q40 0 40 40v40H230z" fill="#3c4a5e" />
      <rect x="225" y="360" width="250" height="40" rx="10" fill="#33415a" />
      <rect x="235" y="400" width="10" height="18" fill="#1d1612" /><rect x="455" y="400" width="10" height="18" fill="#1d1612" />
      <rect x="230" y="398" width="240" height="8" fill="#000" opacity="0.4" />
      <circle cx="270" cy="410" r="3" fill={C.gold} />
      {/* rug + fallen candlestick */}
      <ellipse cx="400" cy="440" rx="230" ry="42" fill="#5a2a2a" />
      <ellipse cx="400" cy="440" rx="200" ry="32" fill="none" stroke={C.gold} strokeWidth="2" opacity="0.5" />
      <g transform="rotate(-78 380 425)" fill={C.gold}>
        <rect x="370" y="418" width="16" height="12" /><rect x="375" y="380" width="6" height="40" /><rect x="370" y="374" width="16" height="7" />
      </g>
      {/* desk with papers + notepad, drawers on floor */}
      <rect x="590" y="240" width="190" height="14" fill="#5c3f2a" />
      <rect x="600" y="254" width="12" height="80" fill="#4a3220" /><rect x="758" y="254" width="12" height="80" fill="#4a3220" />
      <rect x="610" y="222" width="70" height="20" fill="#2a2e38" /><rect x="616" y="226" width="58" height="12" fill="#3c4a5e" />
      <rect x="690" y="232" width="42" height="10" fill={C.paper} transform="rotate(-4 700 236)" />
      <rect x="740" y="226" width="30" height="16" fill="#f4eccf" />
      <path d="M744 231h22M744 235h18" stroke="#3a2c22" strokeWidth="1" />
      <rect x="580" y="380" width="70" height="30" fill="#5c3f2a" transform="rotate(8 615 395)" />
      <rect x="660" y="400" width="70" height="30" fill="#5c3f2a" transform="rotate(-6 695 415)" />
      <path d="M600 420l20-6l18 8M680 440l24-4" stroke={C.paper} strokeWidth="3" />
      {/* glass fragments inside (few) */}
      <path d="M500 345l6-4l3 6zM520 352l5-2l1 5z" fill="#cfdcec" opacity="0.7" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Character portraits                                                 */
/* ------------------------------------------------------------------ */
export function Portrait({ character, className }) {
  const id = useId().replace(/:/g, '');
  const p = character.portrait;
  const hair = {
    slick: <path d="M48 70q2-34 32-36q32 0 34 34q-10-14-34-16q-20 2-32 18z" fill={p.hair} />,
    messy: <path d="M44 74q-2-40 36-42q38 2 36 42l-6-14l-6 10l-6-14l-8 10l-8-12l-8 12l-8-10l-6 12z" fill={p.hair} />,
    bun: <g fill={p.hair}><circle cx="80" cy="30" r="14" /><path d="M46 76q0-42 34-42t34 42q-6-24-34-26q-28 2-34 26z" /></g>,
    bob: <path d="M42 98q-6-64 38-64t38 64h-10q2-40-28-44q-30 4-28 44z" fill={p.hair} />,
    curls: <g fill={p.hair}>{[[50, 56], [62, 40], [80, 34], [98, 40], [110, 56], [44, 74], [116, 74], [46, 92], [114, 92]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="14" />)}</g>,
    swept: <path d="M46 72q0-38 36-38q34 0 34 30q-30-12-60 14q-4-4-10-6z" fill={p.hair} />,
  }[p.hairStyle];
  const extra = {
    mask: <path d="M54 46q26-12 52 0q-4 8-14 8q-6-4-12 0q-6-4-12 0q-10 0-14-8z" fill={C.gold} opacity="0.9" />,
    strap: <path d="M50 150L118 200" stroke="#1a1a1a" strokeWidth="7" />,
    keys: <g><circle cx="112" cy="176" r="7" fill="none" stroke={C.gold} strokeWidth="2" /><path d="M112 183v10M108 190h4" stroke={C.gold} strokeWidth="2" /></g>,
    pearls: <g fill="#efe8da">{Array.from({ length: 9 }).map((_, i) => <circle key={i} cx={58 + i * 5.5} cy={136 + Math.sin((i / 8) * Math.PI) * 8} r="2.6" />)}</g>,
    scarf: <path d="M56 128q24 14 48 0l4 14q-28 16-56 0z" fill={p.accent} />,
    cape: <g><path d="M20 200q10-70 40-76l-8 76z" fill={C.burgundy} /><path d="M140 200q-10-70-40-76l8 76z" fill={C.burgundy} /><path d="M40 128l20-20l4 24zM120 128l-20-20l-4 24z" fill="#0a0a0a" /></g>,
  }[p.extra];
  return (
    <svg className={className} viewBox="0 0 160 200" role="img" aria-label={`Illustrated portrait of ${character.name}, ${character.role.toLowerCase()}`}>
      <defs>
        <radialGradient id={`${id}-bg`} cx="0.5" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#2a3550" /><stop offset="1" stopColor="#0e1626" />
        </radialGradient>
      </defs>
      <rect width="160" height="200" fill={`url(#${id}-bg)`} />
      {p.extra === 'cape' && extra}
      <path d="M22 200q4-62 58-70q54 8 58 70z" fill={p.coat} />
      <path d="M68 130l12 22l12-22" fill="#e9e2d2" opacity={p.extra === 'cape' || p.extra === 'mask' ? 1 : 0.85} />
      <rect x="70" y="104" width="20" height="26" fill={p.skin} />
      <ellipse cx="80" cy="76" rx="30" ry="36" fill={p.skin} />
      {p.hairStyle === 'curls' ? hair : null}
      <ellipse cx="80" cy="76" rx="30" ry="36" fill={p.skin} opacity={p.hairStyle === 'curls' ? 1 : 0} />
      {p.hairStyle !== 'curls' && hair}
      <path d="M66 74h8M86 74h8" stroke="#1a1410" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M64 66q6-3 11 0M85 66q5-3 11 0" stroke="#1a1410" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M80 78v10l-3 2" stroke="#7a5a44" strokeWidth="1.4" fill="none" />
      <path d="M72 96q8 4 16 0" stroke="#6a3a30" strokeWidth="2" fill="none" strokeLinecap="round" />
      {p.extra !== 'cape' && extra}
      {p.extra === 'mask' && <g><circle cx="58" cy="152" r="3" fill={C.gold} /><circle cx="102" cy="152" r="3" fill={C.gold} /></g>}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Evidence thumbnails / photographs                                   */
/* ------------------------------------------------------------------ */
function Frame({ children, label }) {
  return (
    <svg viewBox="0 0 240 160" role="img" aria-label={label} className="ev-art">
      <rect width="240" height="160" fill="#1a2236" />
      {children}
    </svg>
  );
}

export function EvidenceArt({ kind, label }) {
  switch (kind) {
    case 'lease': case 'registry':
      return <Frame label={label}><g transform="rotate(-3 120 80)"><rect x="60" y="14" width="120" height="134" fill={C.paper} />
        {Array.from({ length: 9 }).map((_, i) => <rect key={i} x="72" y={34 + i * 11} width={i % 3 === 2 ? 60 : 96} height="3" fill="#8a7d68" />)}
        <path d="M120 132q10-8 20 0q8 6 18-4" stroke={C.ink} strokeWidth="1.5" fill="none" />
        {kind === 'registry' && <circle cx="160" cy="34" r="10" fill="none" stroke={C.burgundy} strokeWidth="2" />}</g></Frame>;
    case 'bag':
      return <Frame label={label}><path d="M80 70q40-50 80 0" stroke="#111" strokeWidth="5" fill="none" /><rect x="60" y="66" width="120" height="74" rx="10" fill="#3a2a1e" /><rect x="112" y="80" width="16" height="10" fill={C.gold} /><rect x="150" y="104" width="44" height="28" rx="3" fill="#5a1f2c" transform="rotate(10 170 118)" /></Frame>;
    case 'candlestick':
      return <Frame label={label}><rect x="0" y="110" width="240" height="50" fill="#5a2a2a" />
        <g fill={C.gold}><rect x="92" y="120" width="36" height="22" /><rect x="104" y="40" width="12" height="82" /><rect x="94" y="32" width="32" height="10" /></g>
        <path d="M92 120l8 6l-8 4z" fill="#1a2236" /><path d="M100 60q8 4 0 12M112 90q6 6 0 12" stroke="#fff" strokeWidth="1" opacity="0.35" fill="none" />
        <text x="140" y="138" fill={C.paper} fontSize="10" fontFamily="Atkinson Hyperlegible, sans-serif">dented corner</text></Frame>;
    case 'window':
      return <Frame label={label}><rect x="60" y="14" width="120" height="110" fill="#0b1322" stroke="#3a2c22" strokeWidth="8" /><path d="M120 14v110M60 69h120" stroke="#3a2c22" strokeWidth="5" /><path d="M128 24l18 24l-10 14l24 10" stroke="#d6e2f0" strokeWidth="1.5" fill="none" /><rect x="40" y="126" width="160" height="8" fill="#2a2430" /><g fill="#cfdcec">{[[190, 142], [204, 138], [178, 148], [214, 150]].map(([x, y], i) => <path key={i} d={`M${x} ${y}l7-4l2 7z`} />)}</g><text x="176" y="128" fill={C.paper} fontSize="9" fontFamily="Atkinson Hyperlegible, sans-serif">outside</text></Frame>;
    case 'note':
      return <Frame label={label}><rect x="70" y="16" width="100" height="128" fill="#f4eccf" transform="rotate(2 120 80)" />{Array.from({ length: 7 }).map((_, i) => <path key={i} d={`M82 ${38 + i * 14}q20-4 40 0t36 0`} stroke="#2a3a66" strokeWidth="1.5" fill="none" />)}</Frame>;
    case 'cufflink':
      return <Frame label={label}><circle cx="120" cy="80" r="40" fill={C.gold} /><circle cx="120" cy="80" r="32" fill="none" stroke="#8a6a2a" strokeWidth="2" /><path d="M120 52l6 22l22 6l-22 6l-6 22l-6-22l-22-6l22-6z" fill="#8a6a2a" /><path d="M158 96l22 22" stroke={C.gold} strokeWidth="5" /></Frame>;
    case 'phone':
      return <Frame label={label}><rect x="86" y="12" width="68" height="136" rx="10" fill="#0e0e12" /><rect x="92" y="24" width="56" height="112" fill="#1e2a40" /><rect x="96" y="34" width="40" height="14" rx="6" fill="#3a4a66" /><rect x="104" y="56" width="40" height="18" rx="6" fill={C.burgundy} /><rect x="96" y="82" width="36" height="12" rx="6" fill="#3a4a66" /></Frame>;
    case 'email':
      return <Frame label={label}><rect x="50" y="30" width="140" height="100" fill={C.paper} /><path d="M50 30l70 50l70-50" stroke="#8a7d68" strokeWidth="2" fill="none" /></Frame>;
    case 'statements':
      return <Frame label={label}>{[0, 1, 2].map((i) => <g key={i} transform={`translate(${30 + i * 62} ${26 + (i % 2) * 10})`}><rect width="54" height="100" fill={C.paper} />{Array.from({ length: 7 }).map((_, j) => <rect key={j} x="6" y={12 + j * 12} width={j === 6 ? 24 : 42} height="3" fill="#8a7d68" />)}</g>)}</Frame>;
    case 'ledger':
      return <Frame label={label}><rect x="36" y="18" width="168" height="124" fill={C.paper} />{Array.from({ length: 8 }).map((_, i) => <g key={i}><rect x="44" y={30 + i * 13} width="70" height="3" fill="#8a7d68" /><rect x="160" y={30 + i * 13} width="34" height="3" fill="#8a7d68" /></g>)}{[2, 4, 5].map((i) => <ellipse key={i} cx="120" cy={31 + i * 13} rx="84" ry="6" fill="none" stroke="#666" strokeWidth="1.2" />)}</Frame>;
    case 'camera':
      return <Frame label={label}><rect x="10" y="10" width="220" height="140" fill="#222a22" />        <rect x="90" y="40" width="60" height="110" fill="#111611" /><path d="M118 70q-10 0-10 14v66h24V84q0-14-14-14z" fill="#050805" /><circle cx="120" cy="62" r="9" fill="#050805" /><path d="M110 54q10-8 20 0" stroke={C.gold} strokeWidth="2" fill="none" />
        <text x="18" y="26" fill="#cfe8cf" fontSize="11" fontFamily="Atkinson Hyperlegible, sans-serif">CAM 1  20:47:02</text></Frame>;
    case 'receipt':
      return <Frame label={label}><path d="M90 12h60v130l-6-6l-6 6l-6-6l-6 6l-6-6l-6 6l-6-6l-6 6l-6-6l-6 6z" fill="#f6f2e6" />{Array.from({ length: 6 }).map((_, i) => <rect key={i} x="98" y={28 + i * 14} width={i === 2 ? 30 : 44} height="3" fill="#777" />)}<text x="98" y="122" fontSize="10" fill="#333" fontFamily="Atkinson Hyperlegible, sans-serif">8:32 PM</text></Frame>;
    case 'audio':
      return <Frame label={label}>{Array.from({ length: 40 }).map((_, i) => { const h = 10 + Math.abs(Math.sin(i * 1.7) * 50) + (i % 5) * 4; return <rect key={i} x={20 + i * 5} y={80 - h / 2} width="3" height={h} fill={C.gold} opacity="0.8" />; })}</Frame>;
    case 'photos':
      return <Frame label={label}><g transform="rotate(-5 80 80)"><rect x="24" y="22" width="96" height="110" fill={C.paper} /><rect x="30" y="28" width="84" height="84" fill="#2a2030" /></g><g transform="rotate(6 160 80)"><rect x="120" y="22" width="96" height="110" fill={C.paper} /><rect x="126" y="28" width="84" height="84" fill="#203040" /></g></Frame>;
    case 'photoA':
      return <PartyPhoto variant="A" label={label} />;
    case 'photoB':
      return <PartyPhoto variant="B" label={label} />;
    default:
      return <Frame label={label} />;
  }
}

function PartyPhoto({ variant, label }) {
  const A = variant === 'A';
  return (
    <svg viewBox="0 0 240 180" role="img" aria-label={label} className="ev-art">
      <rect width="240" height="180" fill={A ? '#2a1a26' : '#1a2434'} />
      {A ? <g fill={C.gold}><rect x="30" y="60" width="4" height="70" /><rect x="20" y="56" width="24" height="5" /><rect x="22" y="40" width="3" height="16" /><rect x="40" y="40" width="3" height="16" /><circle cx="23" cy="36" r="4" fill="#ffd27a" /><circle cx="41" cy="36" r="4" fill="#ffd27a" /></g>
        : <g><rect x="150" y="110" width="70" height="70" fill="#3a2a22" /><rect x="150" y="104" width="70" height="8" fill={C.gold} /></g>}
      <path d="M70 180q4-60 50-66q46 6 50 66z" fill="#141a24" />
      <path d="M110 116l10 18l10-18" fill="#e9e2d2" />
      <ellipse cx="120" cy="84" rx="22" ry="27" fill="#d9b08c" />
      <path d="M98 78q2-28 22-30q24 0 24 28q-8-12-24-12q-14 2-22 14z" fill="#2b1d14" />
      <path d="M104 62q16-10 32 0q-3 6-10 6q-6-4-12 0q-7 0-10-6z" fill={C.gold} />
      {/* arms and cuffs */}
      <path d="M78 150q-6-30 10-50" stroke="#141a24" strokeWidth="16" fill="none" strokeLinecap="round" />
      <path d="M162 150q10-24-4-46" stroke="#141a24" strokeWidth="16" fill="none" strokeLinecap="round" />
      <rect x="80" y="92" width="16" height="9" fill="#e9e2d2" transform="rotate(-30 88 96)" />
      <rect x="146" y="96" width="16" height="9" fill="#e9e2d2" transform={`rotate(${A ? 30 : 50} 154 100)`} />
      <circle cx="88" cy="97" r="3.4" fill={C.gold} />
      {A && <circle cx="154" cy="100" r="3.4" fill={C.gold} />}
      {!A && <path d="M150 104q6 8 14 4" stroke="#e9e2d2" strokeWidth="3" fill="none" />}
      {A && <g><path d="M92 92l-4-24h8z" fill="#f2c46b" opacity="0.7" /></g>}
      <text x="8" y="172" fill={C.paper} fontSize="11" fontFamily="Atkinson Hyperlegible, sans-serif">{A ? 'Captured 8:22 PM' : 'Captured 9:26 PM'}</text>
      <text x="232" y="16" textAnchor="end" fill={C.paper} fontSize="10" fontFamily="Atkinson Hyperlegible, sans-serif" opacity="0.8">{A ? 'Left cuff ✓  Right cuff ✓' : 'Left cuff: none  Right cuff ✓'}</text>
    </svg>
  );
}
