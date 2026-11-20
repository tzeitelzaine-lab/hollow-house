import { useId } from 'react';
import { media, charById } from '../content/story.js';

const C = {
  navy: '#07111f', navy2: '#0d1b2e', steel: '#1d3550', blue: '#2f86e0', blueHi: '#6db3ff',
  green: '#2fbf8a', greenHi: '#6be3b3', white: '#f3f7fb', paper: '#f4f7fa', ink: '#14243a', muted: '#7f93aa',
};

/* --------------------------- photos & icons --------------------------- */
export function Photo({ id, className, alt }) {
  const c = charById[id];
  return <img className={className} src={media(`people/${id}.jpg`)} alt={alt ?? (c ? `Photo of ${c.name}, ${c.role}` : '')} loading="lazy" />;
}

export function LockIcon({ open }) {
  return (
    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="10" rx="1.5" fill="currentColor" />
      <path d={open ? 'M8 10.5V7.5a4 4 0 0 1 7.6-1.7' : 'M8 10.5V7.5a4 4 0 0 1 8 0v3'} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
export function CheckIcon() {
  return <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
export function BackIcon() {
  return <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

export function Emblem({ className }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} viewBox="0 0 120 140" role="img" aria-label="HighCall VA Multiverse investigation badge">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e9f2fb" /><stop offset="1" stopColor="#9fb6cc" />
        </linearGradient>
      </defs>
      <text x="60" y="18" textAnchor="middle" fontFamily="Raleway, sans-serif" fontWeight="700" fontSize="17" letterSpacing="2" fill="#e9f2fb">HCVA</text>
      <path d="M60 26l44 14v34c0 28-20 46-44 56-24-10-44-28-44-56V40z" fill={`url(#${id}-g)`} />
      <path d="M60 34l36 11v29c0 23-16 38-36 47-20-9-36-24-36-47V45z" fill="#0d1b2e" />
      <path d="M53 52h14v14h14v14H67v14H53V80H39V66h14z" fill={C.green} />
      <path d="M28 104l32-26 32 26" fill="none" stroke={C.blueHi} strokeWidth="4" />
    </svg>
  );
}

/* --------------------------- the CEO's office --------------------------- */
export function OfficeScene({ className }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} viewBox="0 0 800 500" role="img" aria-labelledby={`${id}-t`} preserveAspectRatio="xMidYMid meet">
      <title id={`${id}-t`}>Andrew Sterling's corner office at BlueGreen Insurance, 09:40. Floor-to-ceiling windows over the city. A wide desk with a drinking glass, two phones and a cream envelope; a leather chair pushed back; a paperweight on the carpet; a side table with the board notice.</title>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bcd6ee" /><stop offset="1" stopColor="#e8f1f8" /></linearGradient>
        <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2b3f55" /><stop offset="1" stopColor="#16263a" /></linearGradient>
        <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5a3a26" /><stop offset="1" stopColor="#3c2618" /></linearGradient>
      </defs>
      <rect width="800" height="320" fill="#25384e" />
      {/* windows with skyline */}
      <rect x="40" y="30" width="520" height="270" fill={`url(#${id}-sky)`} />
      <g fill="#8fa9c3">
        <rect x="60" y="170" width="40" height="130" /><rect x="110" y="120" width="34" height="180" /><rect x="152" y="190" width="50" height="110" />
        <rect x="214" y="90" width="44" height="210" /><rect x="268" y="150" width="38" height="150" /><rect x="318" y="110" width="56" height="190" />
        <rect x="386" y="180" width="40" height="120" /><rect x="436" y="130" width="46" height="170" /><rect x="492" y="200" width="54" height="100" />
      </g>
      <g fill="#a9c0d6" opacity="0.7">
        <rect x="224" y="110" width="6" height="6" /><rect x="240" y="110" width="6" height="6" /><rect x="224" y="130" width="6" height="6" /><rect x="330" y="130" width="6" height="6" /><rect x="350" y="150" width="6" height="6" />
      </g>
      <g stroke="#1b2c40" strokeWidth="8"><path d="M40 30V300M170 30V300M300 30V300M430 30V300M560 30V300M40 30H560" /></g>
      {/* wall panel + framed award */}
      <rect x="590" y="40" width="180" height="250" fill="#1e3046" />
      <rect x="630" y="70" width="100" height="70" fill="#d7e3ee" stroke="#c9a85e" strokeWidth="4" />
      <path d="M645 120l20-20 15 12 20-24 15 32z" fill="#7aa0c2" />
      {/* floor */}
      <rect y="300" width="800" height="200" fill={`url(#${id}-floor)`} />
      <ellipse cx="400" cy="440" rx="300" ry="40" fill="#1b3a4a" opacity="0.8" />
      {/* chair pushed back */}
      <path d="M560 190h70q12 0 12 12v86h-94v-86q0-12 12-12z" fill="#2a1a12" />
      <rect x="550" y="282" width="104" height="18" rx="6" fill="#3a2418" />
      <path d="M602 300v40M570 345h64" stroke="#111" strokeWidth="6" />
      {/* desk */}
      <rect x="180" y="250" width="440" height="22" fill="#6a4630" />
      <rect x="196" y="272" width="408" height="100" fill={`url(#${id}-wood)`} />
      <rect x="380" y="290" width="40" height="70" fill="#2c1b10" opacity="0.6" />
      {/* items on desk */}
      <rect x="240" y="232" width="90" height="18" rx="3" fill="#20303f" /><rect x="248" y="226" width="74" height="8" fill="#0f1823" />
      <rect x="338" y="236" width="28" height="14" rx="3" fill="#111a24" /><rect x="342" y="239" width="20" height="8" fill="#2f86e0" opacity="0.7" />
      <path d="M432 214h22l-3 36h-16z" fill="#d6ecf7" opacity="0.85" stroke="#9fc4dc" />
      <path d="M435 228h16l-1 20h-14z" fill="#aad7ef" opacity="0.7" />
      <rect x="530" y="228" width="58" height="22" fill="#f1ead8" transform="rotate(-4 559 239)" />
      <path d="M531 229l28 12 28-14" fill="none" stroke="#c9b48e" strokeWidth="1.5" transform="rotate(-4 559 239)" />
      <circle cx="560" cy="240" r="4" fill="#8a2a2a" transform="rotate(-4 559 239)" />
      {/* side table with notice */}
      <rect x="660" y="300" width="110" height="10" fill="#6a4630" /><rect x="672" y="310" width="8" height="70" fill="#3c2618" /><rect x="750" y="310" width="8" height="70" fill="#3c2618" />
      <rect x="676" y="282" width="60" height="18" fill="#f4f7fa" transform="rotate(3 706 291)" />
      <path d="M682 288h40M682 293h30" stroke="#2f86e0" strokeWidth="2" transform="rotate(3 706 291)" />
      {/* paperweight on carpet */}
      <ellipse cx="290" cy="432" rx="22" ry="6" fill="#000" opacity="0.35" />
      <circle cx="290" cy="418" r="18" fill="#bfe3f2" opacity="0.85" /><circle cx="284" cy="412" r="6" fill="#fff" opacity="0.6" />
      {/* soft morning light */}
      <path d="M40 30L330 500H0V30z" fill="#fff" opacity="0.05" />
    </svg>
  );
}

/* --------------------------- evidence art --------------------------- */
function Frame({ children, label, bg = '#0d1b2e' }) {
  return (
    <svg viewBox="0 0 240 160" role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : 'true'} className="ev-art">
      <rect width="240" height="160" fill={bg} />
      {children}
    </svg>
  );
}
const lines = (x, y, n, w = 120, gap = 11, fill = '#8aa0b6') => Array.from({ length: n }).map((_, i) => <rect key={i} x={x} y={y + i * gap} width={i % 3 === 2 ? w * 0.6 : w} height="3" fill={fill} />);

export function EvidenceArt({ kind, label }) {
  switch (kind) {
    case 'glass':
      return <Frame label={label}><rect x="0" y="118" width="240" height="42" fill="#5a3a26" /><path d="M96 40h48l-6 80h-36z" fill="#d6ecf7" opacity="0.85" stroke="#9fc4dc" strokeWidth="2" /><path d="M100 80h40l-3 38h-34z" fill="#aad7ef" opacity="0.7" /><rect x="150" y="60" width="56" height="44" rx="4" fill="#f4f7fa" opacity="0.9" /><text x="178" y="86" textAnchor="middle" fontSize="10" fill="#14243a" fontFamily="Atkinson Hyperlegible, sans-serif">OF-01</text></Frame>;
    case 'paperweight':
      return <Frame label={label} bg="#1b3a4a"><ellipse cx="120" cy="124" rx="44" ry="10" fill="#000" opacity="0.35" /><circle cx="120" cy="90" r="40" fill="#bfe3f2" opacity="0.85" /><circle cx="106" cy="76" r="12" fill="#fff" opacity="0.6" /><path d="M96 98q24 12 48 0" stroke="#2f86e0" strokeWidth="3" fill="none" /></Frame>;
    case 'envelope': case 'letter':
      return <Frame label={label}><rect x="50" y="36" width="140" height="92" fill="#f1ead8" /><path d="M50 36l70 50 70-50" fill="none" stroke="#c9b48e" strokeWidth="2" />{kind === 'envelope' ? <circle cx="120" cy="86" r="11" fill="#8a2a2a" /> : <path d="M70 110q20-14 40 0t40-6" stroke="#14243a" strokeWidth="2" fill="none" />}</Frame>;
    case 'doc':
      return <Frame label={label}><rect x="62" y="16" width="116" height="132" fill="#f4f7fa" /><rect x="62" y="16" width="116" height="16" fill="#2f86e0" />{lines(74, 44, 8, 92)}<rect x="74" y="132" width="40" height="6" fill="#2fbf8a" /></Frame>;
    case 'phone':
      return <Frame label={label}><rect x="86" y="10" width="68" height="140" rx="10" fill="#050b14" /><rect x="92" y="22" width="56" height="116" fill="#13243b" /><rect x="96" y="32" width="40" height="13" rx="6" fill="#2f86e0" /><rect x="104" y="52" width="40" height="17" rx="6" fill="#2fbf8a" /><rect x="96" y="76" width="36" height="12" rx="6" fill="#2f86e0" /><rect x="108" y="96" width="36" height="12" rx="6" fill="#2fbf8a" /></Frame>;
    case 'camera': case 'cctv':
      return <Frame label={label} bg="#1a2a2a"><rect x="0" y="100" width="240" height="60" fill="#22302e" /><rect x="70" y="66" width="100" height="40" fill="#3a2a20" /><path d="M118 52q-10 0-10 12v36h22V64q0-12-12-12z" fill="#0b1210" /><circle cx="119" cy="44" r="8" fill="#0b1210" /><text x="10" y="18" fontSize="11" fill="#cfe8dc" fontFamily="Atkinson Hyperlegible, sans-serif">{kind === 'cctv' ? 'STATION CAM 7' : 'OFFICE CAM 2'} · REC</text><circle cx="230" cy="14" r="4" fill="#e0453a" /></Frame>;
    case 'ehr': case 'audit':
      return <Frame label={label} bg="#0a1525"><rect x="16" y="14" width="208" height="132" rx="4" fill="#f4f7fa" /><rect x="16" y="14" width="208" height="18" rx="4" fill={kind === 'audit' ? '#2fbf8a' : '#2f86e0'} /><text x="24" y="27" fontSize="9" fill="#fff" fontFamily="Atkinson Hyperlegible, sans-serif">{kind === 'audit' ? 'GCH · EHR AUDIT' : 'GCH · PATIENT RECORD'}</text>{Array.from({ length: 6 }).map((_, i) => <g key={i}><rect x="26" y={42 + i * 16} width="34" height="4" fill="#2f86e0" /><rect x="70" y={42 + i * 16} width={i === 3 ? 90 : 140} height="4" fill="#8aa0b6" /></g>)}</Frame>;
    case 'echo':
      return <Frame label={label} bg="#050b14"><path d="M120 30l70 100H50z" fill="#13243b" /><path d="M120 34q-22 40-6 70q24 22 40-10q8-40-34-60z" fill="none" stroke="#6db3ff" strokeWidth="3" /><text x="10" y="150" fontSize="10" fill="#9db0c4" fontFamily="Atkinson Hyperlegible, sans-serif">ECHO · APICAL VIEW</text></Frame>;
    case 'ecg':
      return <Frame label={label} bg="#050b14">{Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M${i * 30} 0V160`} stroke="#13243b" />)}<path d="M0 80h30l6-14 6 28 6-40 6 26h30l6-14 6 28 6-40 6 26h18q4-20 8 0t8 0 8 0 8 0 8 0 8 0 8 0 8 0 8 0 8 0" fill="none" stroke="#6be3b3" strokeWidth="2.5" /><text x="10" y="150" fontSize="10" fill="#9db0c4" fontFamily="Atkinson Hyperlegible, sans-serif">MONITOR · SUITE 701 · 20:44</text></Frame>;
    case 'lab':
      return <Frame label={label} bg="#f4f7fa"><path d="M20 130h200M20 130V20" stroke="#14243a" strokeWidth="1.5" /><path d="M20 128h40l6-4 6 4h30l8-70 8 70h30l5-24 5 24h50" fill="none" stroke="#2f86e0" strokeWidth="2.5" /><text x="112" y="50" fontSize="10" fill="#14243a" fontFamily="Atkinson Hyperlegible, sans-serif">X41</text><rect x="160" y="14" width="66" height="22" rx="3" fill="#2fbf8a" /><text x="193" y="29" textAnchor="middle" fontSize="10" fill="#fff" fontFamily="Atkinson Hyperlegible, sans-serif">ASSAY</text></Frame>;
    case 'audio':
      return <Frame label={label} bg="#0a1525">{Array.from({ length: 40 }).map((_, i) => { const h = 10 + Math.abs(Math.sin(i * 1.7) * 50) + (i % 5) * 4; return <rect key={i} x={20 + i * 5} y={80 - h / 2} width="3" height={h} fill={i % 2 ? '#6db3ff' : '#6be3b3'} />; })}</Frame>;
    case 'statements':
      return <Frame label={label}>{[0, 1, 2].map((i) => <g key={i} transform={`translate(${30 + i * 62} ${26 + (i % 2) * 10})`}><rect width="54" height="100" fill="#f4f7fa" /><rect width="54" height="10" fill="#2f86e0" />{lines(6, 18, 7, 42)}</g>)}</Frame>;
    case 'ledger':
      return <Frame label={label}><rect x="36" y="18" width="168" height="124" fill="#f4f7fa" /><rect x="36" y="18" width="168" height="14" fill="#2fbf8a" />{Array.from({ length: 7 }).map((_, i) => <g key={i}><rect x="44" y={42 + i * 13} width="70" height="3" fill="#8aa0b6" /><rect x="160" y={42 + i * 13} width="34" height="3" fill="#8aa0b6" /></g>)}<ellipse cx="120" cy="82" rx="84" ry="7" fill="none" stroke="#c2410c" strokeWidth="1.5" /></Frame>;
    default:
      return <Frame label={label}><rect x="62" y="16" width="116" height="132" fill="#f4f7fa" /><path d="M120 50v40M100 70h40" stroke="#2fbf8a" strokeWidth="10" /></Frame>;
  }
}
