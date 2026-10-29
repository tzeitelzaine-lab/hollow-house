// Verifies that no server-only text (hints, reveal, walkthrough, answer keys)
// ended up in the built browser bundle. Run after `npm run build`.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const sql = readFileSync('supabase/02_case_content.sql', 'utf8') + readFileSync('supabase/01_schema.sql', 'utf8');
const phrases = new Set();
for (const m of sql.matchAll(/'([^']{30,})'/g)) phrases.add(m[1].replace(/''/g, "'").slice(0, 60));
for (const line of sql.split('\n')) {
  const t = line.replace(/^- /, '').trim();
  if (t.length > 50 && !t.startsWith('--') && !/[(){};=]/.test(t)) phrases.add(t.slice(0, 60));
}
const dir = 'dist/assets';
const bundle = readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
const leaks = [...phrases].filter((p) => bundle.includes(p));
if (leaks.length) { console.error('Server-only text found in bundle:\n' + leaks.join('\n')); process.exit(1); }
console.log(`OK: checked ${phrases.size} server-only phrases; none are in the browser bundle.`);
