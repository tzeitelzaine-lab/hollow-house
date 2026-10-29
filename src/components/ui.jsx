import { useEffect, useRef, useState } from 'react';
import { EvidenceArt, Portrait } from '../art/Art.jsx';
import { parseMarkdown, ambient } from '../lib/core.js';

export function Modal({ title, onClose, children, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('modal-open'); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1} ref={ref}>
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button className="btn-quiet" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function ReadAloud({ text }) {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const toggle = () => {
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95; u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u); setSpeaking(true);
  };
  return <button className="btn-quiet" onClick={toggle}>{speaking ? 'Stop reading' : 'Read transcript aloud'}</button>;
}

function Block({ b }) {
  switch (b.type) {
    case 'p': return <p>{b.text}</p>;
    case 'note': return <p className="inv-note"><span>Investigator’s note:</span> {b.text}</p>;
    case 'meta':
      return <dl className="meta">{b.rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>;
    case 'table':
      return (
        <div className="table-wrap" tabIndex={0} role="region" aria-label="Table">
          <table><thead><tr>{b.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table>
        </div>
      );
    case 'hand':
      return (
        <figure className="hand">
          <div className="hand-text" aria-hidden="true">{b.text}</div>
          <figcaption><strong>Typed transcript:</strong> {b.transcript}</figcaption>
        </figure>
      );
    case 'messages':
      return <ol className="msgs">{b.items.map((m, i) => <li key={i}><div className="msg-meta"><strong>{m.from}</strong> <span>{m.time}</span></div><p>{m.text}</p></li>)}</ol>;
    case 'statement':
      return <blockquote className="statement"><p>{b.text}</p><cite>{b.who}</cite></blockquote>;
    case 'audio':
      return (
        <div className="audio">
          <EvidenceArt kind="audio" label="Waveform of the voicemail" />
          <p className="audio-label">{b.label}</p>
          <p className="transcript"><strong>Transcript:</strong> {b.transcript}</p>
          <ReadAloud text={b.transcript} />
        </div>
      );
    case 'photos':
      return (
        <div className="photo-pair">
          {b.items.map((ph) => (
            <figure key={ph.label} className="photo">
              <EvidenceArt kind={ph.art} label={`${ph.label}. ${ph.caption}`} />
              <figcaption>
                <strong>{ph.label}</strong>
                <p>{ph.caption}</p>
                <dl className="meta">{ph.meta.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
              </figcaption>
            </figure>
          ))}
        </div>
      );
    default: return null;
  }
}

export function EvidenceDoc({ item }) {
  const [scale, setScale] = useState(1);
  return (
    <article className="doc" style={{ '--doc-scale': scale }}>
      <div className="doc-tools">
        <span className="tag">{item.kind}</span>
        <div className="zoom" role="group" aria-label="Text size">
          <button className="btn-quiet" onClick={() => setScale((s) => Math.max(0.9, +(s - 0.15).toFixed(2)))} aria-label="Smaller text">A−</button>
          <button className="btn-quiet" onClick={() => setScale((s) => Math.min(1.75, +(s + 0.15).toFixed(2)))} aria-label="Larger text">A+</button>
        </div>
      </div>
      {item.art && !['audio'].includes(item.art) && !item.blocks.some((b) => b.type === 'photos' || b.type === 'audio') && (
        <div className="doc-art"><EvidenceArt kind={item.art} label={`Illustration: ${item.title}`} /></div>
      )}
      <div className="paper">{item.blocks.map((b, i) => <Block key={i} b={b} />)}</div>
    </article>
  );
}

export function ProfileDoc({ c }) {
  return (
    <article className="profile">
      <div className="profile-top">
        <Portrait character={c} className="portrait-lg" />
        <div>
          <p className="role">{c.role} · {c.age}</p>
          <p>{c.summary}</p>
          {c.card && (
            <div className="bizcard" aria-label="Business card">
              {c.card.map((l, i) => <span key={i} className={i === 0 ? 'bc-firm' : ''}>{l}</span>)}
            </div>
          )}
        </div>
      </div>
      <h3>Background</h3>
      <ul>{c.background.map((b) => <li key={b}>{b}</li>)}</ul>
      <h3>Statement</h3>
      <blockquote className="statement"><p>{c.statement}</p><cite>{c.name}</cite></blockquote>
    </article>
  );
}

export function ChoiceGroup({ name, prompt, options, value, onChange, multi, disabled, status }) {
  const toggle = (v) => {
    if (multi) onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    else onChange(v);
  };
  return (
    <fieldset className={`choice ${status || ''}`} disabled={disabled}>
      <legend>{prompt}</legend>
      {options.map(([v, label]) => (
        <label key={v} className="opt">
          <input type={multi ? 'checkbox' : 'radio'} name={name} value={v}
            checked={multi ? value.includes(v) : value === v} onChange={() => toggle(v)} />
          <span>{label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function Markdown({ text }) {
  return (
    <div className="md">
      {parseMarkdown(text).map((b, i) =>
        b.t === 'h' ? <h3 key={i}>{b.text}</h3>
          : b.t === 'ul' ? <ul key={i}>{b.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
            : <p key={i}>{b.text}</p>)}
    </div>
  );
}

export function SoundToggle() {
  const [on, setOn] = useState(ambient.on);
  return (
    <button className="btn-quiet sound" aria-pressed={on} onClick={() => { on ? ambient.stop() : ambient.start(); setOn(!on); }}>
      {on ? 'Rain sound: on' : 'Rain sound: off'}
    </button>
  );
}

export function Feedback({ result }) {
  if (!result) return null;
  if (result.error) return <p className="fb fb-error" role="alert">{result.error}</p>;
  if (result.correct) return <p className="fb fb-ok" role="status">{result.message || 'Correct. Saved.'}</p>;
  const entries = Object.values(result.feedback || {});
  return (
    <div className="fb fb-wrong" role="alert">
      <p>{result.message || 'Not quite yet. No time penalty — look again:'}</p>
      {entries.length > 0 && <ul>{entries.map((t) => <li key={t}>{t}</li>)}</ul>}
    </div>
  );
}

export function useDraft(key, initial) {
  const [v, setV] = useState(() => {
    try { const s = sessionStorage.getItem(`draft:${key}`); return s ? JSON.parse(s) : initial; } catch { return initial; }
  });
  useEffect(() => { try { sessionStorage.setItem(`draft:${key}`, JSON.stringify(v)); } catch { /* ignore */ } }, [key, v]);
  return [v, setV];
}
