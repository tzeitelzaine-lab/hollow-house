# Who Unalived the CEO of BlueGreen Insurance?

**HighCall VA Multiverse** · *A cancelled succession announcement. Two cardiac arrests. One hospital record that tells the wrong story.*

A team murder-mystery game for an online Halloween party. Teams of 3–6 investigate the death of a fictional CEO at Georgia Capital Hospital through six stages built from the BlueGreen case file (evidence E01A–E16). Times run on the server and results go to a shared, live leaderboard.

- Players: 30 minutes (time limit, adjustable per event).
- Host setup: about 20 minutes.

> **Spoiler warning.** `supabase/02_case_content.sql` and `HOST_GUIDE.md` contain the solution. Do not share this repository with players.

---

## What you need

- A free [Supabase](https://supabase.com) project. It provides the database and API.
- Node.js 18 or newer, to build the site.
- Any static web host: Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3 or your own server.

---

## Setup

### 1. Create the database

1. Create a new Supabase project.
2. Open **SQL Editor → New query**.
3. Paste the whole of `supabase/01_schema.sql` and press **Run**.
4. Paste the whole of `supabase/02_case_content.sql` and press **Run**.

Both files are safe to re-run. Re-running replaces the functions and case text without deleting teams or results.

### 2. Set the host passphrase

Run this in the SQL Editor, using your own passphrase of at least 10 characters:

```sql
select private.set_host_passphrase('choose-a-long-passphrase-here');
```

Run it again any time to change the passphrase. Doing so signs out every host session.

### 3. Configure the site

Copy `.env.example` to `.env` and fill in two values from **Project Settings → API**:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

The anon key is meant to be public. It can only call the game's functions, which validate everything.

### 4. Build and deploy

```bash
npm install
npm run build          # outputs to dist/
npm run check-bundle   # confirms no solution text is in the browser bundle
```

Upload the contents of `dist/` to any static host. The site uses hash routing (`#/play`, `#/host`), so no server rewrite rules are needed.

To try it locally first, run `npm run dev` and open the address it prints.

### 5. Create your event

1. Open `https://your-site/#/host` and sign in with the passphrase.
2. Create an event. Leave the room code blank to generate one, or choose your own, such as `HOWL26`.
3. Share the join link the dashboard shows. It looks like `https://your-site/?code=HOWL26` and pre-fills the code.
4. Click **Open preview mode** to play through once yourself. Preview runs are never ranked.

---


## Upgrading from The Heiress of Hollow House

If you already deployed the earlier Hollow House version:

1. In the Supabase SQL Editor, run `supabase/01_schema.sql` again, then `supabase/02_case_content.sql`. This replaces the case logic and adds the `custom_evidence` table. Your events, host passphrase and settings are kept.
2. Old teams' progress belongs to the old case. On the host dashboard, use **Reset event…** for each old event, or create a new event.
3. Run `notify pgrst, 'reload schema';` in the SQL Editor.
4. Replace your project files with this version, then commit and push (Vercel redeploys), or run `npx vercel --prod`.

---

## Extra evidence (host)

The host dashboard has an **Extra evidence** section. Hosts can add clues, records or photos without touching code:

- **Fields:** each item has a title, type, stage (1–5), short summary, full text and an optional image. Images are resized in the browser before saving.
- **When teams see it:** an item appears for every team once its stage unlocks. The server never sends it earlier.
- **Hiding:** **Visible to teams** can be switched off to hide an item without deleting it.
- **Counting in the verdict:** **Counts as supporting evidence in the final verdict** lets teams cite the item as one of their three pieces of evidence. Only tick this for evidence that genuinely points to the real culprits.
- **Deleting:** deleting needs the item's title typed as confirmation.

---

## How it works

### Security model

- **Locked tables.** Every table has row-level security enabled, has no policies and no direct grants. The browser cannot read or write any table.
- **Server functions only.** All access goes through `SECURITY DEFINER` functions in the `public` schema. Each one validates its input and the caller's token.
- **Server-only content.** Answer keys, hints, the final reveal and the walkthrough live in a `private` schema. The Supabase API does not expose that schema.
- **When content is released.** Hints arrive only after the time penalty is recorded. The reveal arrives only after a correct accusation. The walkthrough is available only to signed-in hosts.
- **Team tokens.** Each team gets a random 256-bit token at registration. Only its SHA-256 hash is stored, and every action is keyed to that token, so one team cannot touch another team's run.
- **Team PINs.** PINs are stored with bcrypt. Eight wrong PINs lock resume for 10 minutes.
- **Host sessions.** Host sign-in issues a 12-hour session token. Failed sign-ins are slowed down.
- **Bundle check.** `npm run check-bundle` scans the built JavaScript for any server-only text and fails if it finds some.

### Timing and scoring

- **Server clock.** Start, finish and pause times all use the database clock, never the browser's. Refreshing, closing or switching devices does not affect the timer.
- **Formula.** Adjusted time = elapsed + 2 minutes per hint + 3 minutes per wrong final accusation.
- **Pausing.** When the host pauses, every active team's clock stops and all team actions are rejected until play resumes. The paused interval is subtracted from each team's elapsed time.
- **Finishing.** A team's elapsed time is frozen at the moment of its correct accusation.
- **Ranking.** Teams are ranked by adjusted time. Ties go to fewer wrong accusations, then fewer hints, then the earlier finish. Only solved, non-preview teams receive a rank.

### Time limit

- **The limit:** each team has 30 minutes of play, measured by the server from **Start investigation**. Host pauses are excluded. Hosts can change the limit per event (5–180 minutes) on the dashboard.
- **When time runs out:** the team sees **Game over**, every further action is refused by the server, and their elapsed time is frozen at the limit.
- **Ranking:** solved teams always rank first, by fastest adjusted time. Teams that ran out of time rank after them, by tasks completed, then by lowest adjusted time. Only a solved team can be named HighCall VA Multiverse Champions.
- **The solution:** it stays sealed for unfinished teams, so the host can reveal it at the end.

### Resuming and identity

- **One identity per name.** Team names are unique per event, ignoring capitals. Registering an existing name is refused and the player is directed to **Resume**.
- **Resuming.** Event code + team name + PIN restores the same run, with the same timer and penalties, on any device.
- **Closed registration.** Closing registration blocks new teams, but existing teams can still resume.

### Connection problems

- The game re-syncs with the server every 15 seconds, when the tab becomes visible again, and when the network returns.
- If an action fails to reach the server, a banner explains that it was not saved and offers **Reconnect**.
- Unsubmitted answers are kept as drafts in the browser tab, so a refresh does not lose them.

---

## Project layout

| Path | Purpose |
| --- | --- |
| `supabase/01_schema.sql` | Tables, security, timing, answer checking, player and host functions |
| `supabase/02_case_content.sql` | Hints, final reveal, host walkthrough (server-only) |
| `src/content/story.js` | Scenes, characters, evidence E01A–E16 and questions players see (no answers) |
| `src/art/Art.jsx` | Office scene, badge, icons and evidence illustrations (SVG) |
| `public/media/` | Character photos (resized) and the hospital background video |
| `src/fonts.js` | Bundled fonts (no Google Fonts request) |
| `src/pages/` | Landing, game, stages, leaderboard and host dashboard |
| `scripts/check-bundle.mjs` | Fails the build check if server-only text leaks into the bundle |
| `HOST_GUIDE.md` | Event-day run sheet and solution (spoilers) |
| `supabase/01_schema.sql` → `custom_evidence` | Host-added evidence, stored in the database |

---

## Accessibility

- **Keyboard.** Every interaction works by keyboard. The office hotspots also have a plain list beneath the picture. Dialogs trap focus and return it when closed. The timeline can be reordered with Earlier and Later buttons as well as by dragging.
- **Reading and audio.** Documents have their own text-size control and also follow browser zoom. Handwritten notes come with typed transcripts. The voice message has a full transcript and an optional read-aloud button.
- **Motion and sound.** With *reduce motion* switched on, the rain, flicker and transitions stop. Sound is generated rain only, and it plays only when someone switches it on. The landing video is muted, has a pause button, and does not autoplay when reduce motion is on. There are no jump scares and no flashing.
- **Not color alone.** Status is always written in words as well as shown in color.
- **Devices.** Layouts are tested on desktop (1360px) and tablet (834px). Phones work, but the evidence board scrolls sideways there.

---

## Troubleshooting

| Message | Fix |
| --- | --- |
| "The game server is not configured" | `.env` was missing at build time. Add it and run `npm run build` again. |
| "No host passphrase has been set" | Run `select private.set_host_passphrase('…');` in the SQL Editor. |
| "Could not find the function … in the schema cache" | In Supabase, go to **Settings → API** and reload the schema, or wait a minute after running the SQL. |
| A team's session became invalid | The host deleted the team or reset the event. The team registers again. |
| Fonts look plain | Fonts (Cinzel, Cormorant Garamond, Source Serif 4, Kalam) are bundled with the app, so no external font service is needed. Run `npm install` after updating so they are included. |

---

## What was tested

- **Database logic.** The full game logic ran against real PostgreSQL 16 using Supabase's `anon` role:
  - stage gating and prerequisites;
  - penalty arithmetic;
  - wrong accusations that name the right killer with the wrong reasoning;
  - review-before-resubmit;
  - exact pause exclusion;
  - finish-time freezing;
  - preview exclusion and confirmation guards.

  The same tests confirmed that the `anon` role cannot read any table or the `private` schema.
- **Browser playthrough.** A complete run went through PostgREST (Supabase's API layer) in Chromium:
  - registration and refresh mid-game;
  - hints and all six stages;
  - a wrong then correct accusation;
  - the reveal, the leaderboard and the duplicate-name block;
  - keyboard dialogs and document zoom;
  - host pause and resume, closed registration, second-device resume, preview mode and CSV export.
