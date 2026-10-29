import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configured = Boolean(url && key);
export const supabase = configured ? createClient(url, key, { auth: { persistSession: false } }) : null;

const MESSAGES = {
  NOT_CONFIGURED: 'The game server is not configured yet. The host needs to add the Supabase settings (see README).',
  NETWORK: 'Could not reach the game server. Your last action was not saved. Check your connection and try again.',
  EVENT_NOT_FOUND: 'No event uses that code. Check the code with your host.',
  REGISTRATION_CLOSED: 'Registration for this event is closed. If your team already registered, use "Resume our investigation".',
  INVALID_TEAM_NAME: 'Team names must be 2–40 characters.',
  INVALID_PIN: 'The team PIN must be 4–8 digits.',
  TEAM_EXISTS: 'A team with this name is already registered for this event. If it is yours, use "Resume our investigation" with your PIN.',
  TEAM_NOT_FOUND: 'No team with that name is registered for this event.',
  WRONG_PIN: 'That PIN does not match this team.',
  PIN_LOCKED: 'Too many incorrect PINs. Try again in 10 minutes, or ask the host for help.',
  INVALID_SESSION: 'This browser\'s team session is no longer valid. The run may have been reset by the host. Resume with your team name and PIN.',
  NOT_STARTED: 'Start the investigation first.',
  ALREADY_SOLVED: 'Your team has already solved the case.',
  EVENT_PAUSED: 'The host has paused the event. Your timer is frozen; play resumes when the host continues.',
  STAGE_LOCKED: 'That stage is still locked. Complete the current stage first.',
  INSPECT_FIRST: 'Inspect all five required items in the apartment before submitting.',
  PROFILES_FIRST: 'Open all six suspect profiles before submitting.',
  HINT_STAGE: 'Hints are only available for your current stage.',
  NO_MORE_HINTS: 'You have used every hint for this stage.',
  REVIEW_REQUIRED: 'Review your previous accusation before submitting another.',
  UNKNOWN_TASK: 'That task does not exist.',
  UNKNOWN_ITEM: 'That item does not exist.',
  HOST_AUTH: 'Host sign-in failed or expired. Check the passphrase and sign in again.',
  HOST_NOT_CONFIGURED: 'No host passphrase has been set. Run private.set_host_passphrase in the Supabase SQL editor (see README).',
  INVALID_EVENT_NAME: 'Event names need at least 2 characters.',
  INVALID_EVENT_CODE: 'Event codes use 4–12 letters or digits.',
  EVENT_CODE_TAKEN: 'That event code is already in use.',
  INVALID_EVIDENCE: 'Evidence needs a title (2–120 characters), a stage from 1 to 5, and a body under 10,000 characters.',
  INVALID_IMAGE: 'That image could not be saved. Use a PNG, JPEG, WebP or GIF image.',
  EVIDENCE_NOT_FOUND: 'That evidence item no longer exists. Refresh the list.',
  TIME_UP: 'Time is up. Your progress has been recorded and ranked.',
  INVALID_TIME_LIMIT: 'The time limit must be between 5 and 180 minutes.',
  CONFIRMATION_MISMATCH: 'The confirmation text did not match, so nothing was changed.',
};

export class ApiError extends Error {
  constructor(code, message, network = false) { super(message); this.code = code; this.network = network; }
}

export async function rpc(name, args = {}) {
  if (!supabase) throw new ApiError('NOT_CONFIGURED', MESSAGES.NOT_CONFIGURED);
  let res;
  try {
    res = await supabase.rpc(name, args);
  } catch {
    throw new ApiError('NETWORK', MESSAGES.NETWORK, true);
  }
  if (res.error) {
    const raw = res.error.message || '';
    if (MESSAGES[raw]) throw new ApiError(raw, MESSAGES[raw]);
    const network = !raw || /fetch|network|timeout|Failed to/i.test(raw) || res.status === 0 || res.status >= 502;
    throw new ApiError(network ? 'NETWORK' : 'SERVER', network ? MESSAGES.NETWORK : `The server could not complete this: ${raw}`, network);
  }
  if (res.data && typeof res.data === 'object' && res.data.error && MESSAGES[res.data.error]) {
    throw new ApiError(res.data.error, MESSAGES[res.data.error]);
  }
  return res.data;
}

/* ---- team session (this browser) ---- */
const SESSION_KEY = 'bluegreen-case:team-session';
// Unsubmitted answers ("drafts") belong to one team session only.
export function clearDrafts() {
  try {
    for (const store of [sessionStorage, localStorage]) {
      Object.keys(store).filter((k) => k.startsWith('draft:')).forEach((k) => store.removeItem(k));
    }
  } catch { /* storage blocked */ }
}
export const session = {
  get() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } },
  set(v) {
    const prev = this.get();
    if (!prev || prev.token !== v.token) clearDrafts(); // a different team or a new preview: start with blank answers
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(v)); } catch { /* storage blocked */ }
  },
  clear() { clearDrafts(); try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ } },
  draftScope() { const t = this.get()?.token; return t ? t.slice(0, 16) : 'none'; },
};
const HOST_KEY = 'bluegreen-case:host';
export const hostSession = {
  get() { try { return sessionStorage.getItem(HOST_KEY); } catch { return null; } },
  set(v) { try { sessionStorage.setItem(HOST_KEY, v); } catch { /* ignore */ } },
  clear() { try { sessionStorage.removeItem(HOST_KEY); } catch { /* ignore */ } },
};

/* ---- time formatting ---- */
export function fmt(ms) {
  if (ms == null) return '—';
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0'), ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/* ---- ambient rain (generated, opt-in only) ---- */
let audio = null;
export const ambient = {
  get on() { return Boolean(audio); },
  start() {
    if (audio) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2 + w * 0.04; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
    const gain = ctx.createGain(); gain.gain.value = 0; gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 2);
    src.connect(lp).connect(gain).connect(ctx.destination); src.start();
    audio = { ctx, gain };
  },
  stop() {
    if (!audio) return;
    const a = audio; audio = null;
    a.gain.gain.linearRampToValueAtTime(0, a.ctx.currentTime + 0.6);
    setTimeout(() => a.ctx.close(), 700);
  },
};

/* ---- tiny markdown (##, -, paragraphs) for server text ---- */
export function parseMarkdown(text = '') {
  const blocks = [];
  let list = null;
  for (const raw of text.trim().split('\n')) {
    const line = raw.trim();
    if (!line) { list = null; continue; }
    if (line.startsWith('## ')) { list = null; blocks.push({ t: 'h', text: line.slice(3) }); }
    else if (line.startsWith('- ')) { if (!list) { list = { t: 'ul', items: [] }; blocks.push(list); } list.items.push(line.slice(2)); }
    else { list = null; blocks.push({ t: 'p', text: line }); }
  }
  return blocks;
}

export function hashRoute() {
  const h = window.location.hash.replace(/^#\/?/, '');
  const [path, ...rest] = h.split('/');
  return { path: path || '', param: rest.join('/') };
}
