-- =====================================================================
-- Who Unalived the CEO of BlueGreen Insurance? — server-only content
-- Hints, final reveal and host walkthrough. Never shipped to browsers
-- except through the RPCs (hints after a penalty, reveal after solving,
-- walkthrough to authenticated hosts).
-- =====================================================================

delete from private.hints;
insert into private.hints(stage, level, body) values
(1, 1, 'Open all five marked items in Andrew''s office. The questions unlock once every required item has been inspected.'),
(1, 2, 'Read E02 in time order: 08:40, 08:45, 08:47. Then ask what was actually seen in the office versus what was said in the boardroom afterwards.'),
(1, 3, 'Agatha told Amanda, who told Albert. Agatha expected Albert''s support for her VP appointment. The supported claim is only that Allison wanted the role and argued with her father.'),

(2, 1, 'Open all nine profiles, then read E03, E04 and E05 closely. "Possible" in a medical note is not a diagnosis.'),
(2, 2, 'Andrew drank at 09:15, before Allison entered at 09:18, and the lab found no tested toxicant. The code record shows VF; cardiology favors stress cardiomyopathy. Nothing yet shows what Amanda knew about the envelope.'),
(2, 3, 'Contradicted: Allison poisoned the drink; Dr Brown diagnosed poisoning. Supported: cardiac arrest with VF; stress cardiomyopathy; coordinated nursing team. Unverified: Amanda knew whom the recommendation named.'),

(3, 1, 'The sealed recommendation (E01B) and the dictation (E06) answer the first question. Andrew explains the "three weeks" himself.'),
(3, 2, 'E06 ends with a room access record for the suite doorway. For the chart questions, put E08 beside E09 and look for entries with no basis in the authentic plan.'),
(3, 3, 'Allison; the three weeks were his handover deadline; Marigold was at the doorway at 18:08. E08 authorized only continued monitored recovery. The urgent GCH-U17 treatment and the "Dr Veil" prescriber entry are not supported.'),

(4, 1, 'A label is a claim; a laboratory result is evidence. Read E11 before the checklist.'),
(4, 2, 'The audit (E12) and time evidence (E13) separate who typed, who handled, who administered and where Matthew really was at 20:35.'),
(4, 3, 'Only GCH-X41 is proven; the label said GCH-U17. Roles: Mario administered; Marigold enabled the exposure; Matthew was falsely named as the second checker.'),

(5, 1, 'The recovered messages (E14) show who planned and who acted. The payment record (E14B) is context that links them.'),
(5, 2, 'Motive: why the board call mattered (E01B, E06, E07, E14). Method: how the product and record were faked (E09, E11, E12, E13). Link: E14 or E14B.'),
(5, 3, 'Mastermind Amanda, accomplice Marigold. Deductions: the Veil name is not proof; Mario''s lapse is a practice concern, not murder; the two cardiac events were separate.'),

(6, 1, 'Your verdict should match your evidence board: the same two people, why they acted that night, and what was actually given.'),
(6, 2, 'Evidence about the morning collapse (E02 to E05) explains the false accusation against Allison, not the evening killing. Choose evidence about the second event or the motive behind it.'),
(6, 3, 'Mastermind: Amanda. Accomplice: Marigold. Motive: keep Albert in charge and prevent Allison''s review of the charity books. Method: the X41 substitution behind a fake U17 order. Strong evidence: E11, E12, E14.');

insert into private.content(key, body) values ('reveal', $reveal$
## The two events

The morning collapse was a medical emergency. Andrew drank at 09:15, before Allison entered at 09:18. She moved the glass away from the desk edge, which explains her fingerprints. The drink held no tested toxicant. Cardiology found stress cardiomyopathy, complicated by ventricular fibrillation, and the team at Georgia Capital Hospital brought him back at 09:35.

The evening death was a deliberate exposure disguised as a medication error.

## What happened

- 08:40 — Agatha leaks the succession meeting to Amanda in return for a promised VP appointment. Amanda passes it to Albert. Nobody has opened the sealed recommendation.
- 11:03 — Amanda asks Marigold to speak privately: "Albert must not lose what his father promised him."
- 18:05 — Andrew tells Dr Veil he will recommend Allison, and wants the board call at nine the next morning.
- 18:08 — Marigold is at the suite doorway for a scheduled assessment and hears the name.
- 18:11 — Marigold messages Amanda. Amanda leaves the family lounge. By 18:19 she confirms "the agreement stands".
- 18:22 — Dr Veil leaves Allison a voicemail with her father's wishes.
- 20:18 — The record is altered from Marigold's session: an urgent GCH-U17 treatment attributed to Dr Veil.
- 20:21 — Marigold handles the package at the medication station.
- 20:35 — A false second check is recorded in Matthew's name. He is in room 710 from 20:34 to 20:43.
- 20:36 — Marigold hands the package to Mario.
- 20:40 — Mario administers what the label calls GCH-U17. It contains GCH-X41.
- 20:44 — A new unstable arrhythmia. Mario calls the code at once.
- 21:06 — Andrew Sterling is pronounced dead.

## Who did what

Amanda Sterling commissioned the killing. The board call would cost her husband the chair he expected, and Allison as CEO would open the charity books Amanda managed. She did not know the signed recommendation already existed.

Marigold carried it out. She relayed the private decision, altered the record, prepared the falsely labelled product, and pointed at Mario and Matthew.

Mario administered the product without knowing its contents. His failure to clarify a conflicting urgent order is a professional practice concern, not murder. Matthew never performed the check attributed to him.

Allison wanted the job and argued with her father; she did not poison anyone. Albert and Agatha made a corporate bargain, not a murder plot. Agatha was also Andrew's secret lover. Dr Veil's name on the record proves nothing about who typed it, and Dr Brown's provisional differential was good medicine, not an accusation.

## The proof

- The product: the label said GCH-U17; the laboratory found GCH-X41 in the package and in the post-event samples, but not before exposure (E11).
- The record: the alteration and the false check come from Marigold's session, and the claimed Veil authorization fails (E12). Station video and the room 710 code record corroborate it (E13).
- The agreement: the recovered messages connect Amanda and Marigold to a shared purpose (E14). The charity payment adds context (E14B).
- The motive: the recommendation (E01B), the dictation (E06) and the voicemail (E07) show why the next morning's board call mattered.

Allison Sterling wanted her father's job. Albert expected to receive it. Agatha wanted the place Allison would leave behind. Those ambitions were visible, and that made them useful distractions. The most public anger belonged to Allison. The intent to kill belonged elsewhere.
$reveal$)
on conflict (key) do update set body = excluded.body;

insert into private.content(key, body) values ('walkthrough', $walk$
## Solution in one line

Amanda Sterling (mastermind) and Marigold (clinical accomplice) killed Andrew Sterling by substituting GCH-X41 for a falsely ordered GCH-U17. Amanda wanted to keep Albert in charge and prevent Allison's review of the charity books.

## Stage answers

- Stage 1: Inspect the glass, paperweight, envelope, board notice and messages. The chain is Agatha to Amanda to Albert. Agatha expected VP support. The supported claim is that Allison wanted the role and argued.
- Stage 2: Open all nine profiles. Contradicted: Allison poisoned the drink; Dr Brown diagnosed poisoning. Supported: cardiac arrest with VF; stress cardiomyopathy; coordinated nursing team. Unverified: Amanda knew the recommendation.
- Stage 3: Recommend Allison; the three weeks were the handover deadline; Marigold was at the doorway. Authorized: continued monitored recovery only. Unsupported entries: the urgent GCH-U17 treatment and the Dr Veil prescriber entry.
- Stage 4: Only GCH-X41 was proven; the label said GCH-U17. Roles: Mario administered, Marigold enabled, Matthew was falsely named.
- Stage 5: Mastermind Amanda, accomplice Marigold. Motive pin: E01A, E01B, E06, E07, E14 or the lounge log. Method pin: E09, E11, E12, E13 or the second code record. Link pin: E14 or E14B. Deductions: name not proof, practice concern, two separate events.
- Stage 6: Amanda, Marigold, the motive about Albert's control and the charity books, and the X41-for-U17 substitution method. Any three of E01A, E01B, E06, E07, lounge log, E08, E09, E10, E10A, E11, E12, E13, E14, E14B, E15, E16, plus any host evidence marked as supporting.

## Hosting tips

- Each team has a 30-minute limit (change it per event on the dashboard). Teams that run out are ranked after every solved team, by how many tasks they completed.
- A common stall is Stage 4's roles. A free nudge: "Where was Matthew at 20:35?"
- Ordinary stage answers are free to retry. Only hints (+2 min) and wrong verdicts (+3 min) cost time.
- Wrong verdicts report how many of the five parts hold up, but not which ones.
- Closing discussion: which fact first changed your mind? Why must chart attribution be corroborated? What separates an adverse outcome, an error and an intentional act?
$walk$)
on conflict (key) do update set body = excluded.body;
