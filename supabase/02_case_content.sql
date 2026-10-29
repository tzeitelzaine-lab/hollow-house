-- =====================================================================
-- The Heiress of Hollow House — server-only case content
-- Hints, final reveal and host walkthrough. Never shipped to browsers
-- except through the RPCs (hints after a penalty, reveal after solving,
-- walkthrough to authenticated hosts).
-- =====================================================================

delete from private.hints;
insert into private.hints(stage, level, body) values
(1, 1, 'Open every marked spot in the apartment. The observation questions unlock once all five required items have been inspected. The spot under the sofa is optional, but worth a look.'),
(1, 2, 'A real burglar takes things. Look at what is still inside Evelyn''s bag, and at which side of the window most of the glass landed.'),
(1, 3, 'The lease is in the name Eva Reed. The glass fell outward onto the fire escape (so the window was broken from inside) and the wallet''s cash was untouched: those two show the burglary was staged. The dented, wiped brass candlestick is the likely weapon.'),

(2, 1, 'Start with the admissions: who says something that makes themselves look worse? Then read the minor witnesses — they have no stake in the case.'),
(2, 2, 'Adrian''s party alibi and Leo''s identification rest only on their own word so far. Celeste''s alibi is supported by Henrietta Lowe, a guest with no stake in the case.'),
(2, 3, 'Confirmed: Noah went to 4B, Marta knew Eva Reed was Evelyn, Tessa knew about the apartment, Celeste was at the masquerade. Unverified: Adrian was at the masquerade all evening, the man Leo saw was Noah.'),

(3, 1, 'Put the trust''s payment list next to Evelyn''s resident notes. Did the work the trust paid for actually happen?'),
(3, 2, 'Three large payments go to one vendor, and the caretaker says he still patches the old boiler. Find where that vendor is registered, then compare the address with the business cards you have seen.'),
(3, 3, 'Evelyn rented 4B to meet residents and compare their accounts with the trust records. Larkspur Property Services received $112,300 for work never done. It is registered at 410 Pearl Street, Suite 1104 — Adrian Cross''s office — and he approved every Larkspur payment.'),

(4, 1, 'Every card on the timeline has a time somewhere in the Stage 4 evidence: the camera log, the receipt, the messages, the medical report and the photo details.'),
(4, 2, 'Party photo A has two times. "Captured" is when the camera took the picture. "Uploaded" is when Adrian posted it. They belong in two different places on the timeline.'),
(4, 3, 'Order: Noah arrives (8:10), photo A captured (8:22), Noah leaves (8:25), Noah at the market (8:32), voice message (8:40), Adrian enters (8:47), text to auditor (8:51), crash (9:03), Adrian leaves (9:08), photo A uploaded (9:14), photo B (9:26), Marta finds Evelyn (9:35). Adrian''s alibi fails because photo A was captured before he entered Hollow House. Contradictions: camera log; shop footage or Leo''s revised statement; party photo details.'),

(5, 1, 'Motive explains why. Opportunity places someone inside Hollow House during the time of death. Physical evidence ties that person to the room itself.'),
(5, 2, 'The cufflink alone proves nothing. It matters because Evelyn gave Adrian a one-of-a-kind engraved pair, and the 9:26 PM photograph shows one missing. The entrance camera puts him inside from 8:47 to 9:08.'),
(5, 3, 'Suspect: Adrian. Motive: Larkspur payments, vendor registry, resident notes or auditor email. Opportunity: entrance camera log or the 8:51 text. Physical: the cufflink. Deductions: photo A was captured at 8:22 and only uploaded at 9:14; the cufflink matches his pair and one is missing at 9:26; the burglary was staged.'),

(6, 1, 'Your accusation should agree with your evidence board: the same person, the reason they acted that night, and the object used.'),
(6, 2, 'The insurance and the inheritance were real, but neither explains why the killer came that particular night — the night before Evelyn''s 9:00 AM meeting with the auditor.'),
(6, 3, 'Killer: Adrian Cross. Motive: to stop Evelyn exposing his fraud against the housing trust. Weapon: the brass candlestick. Strong supporting evidence: the vendor registry, the entrance camera log, the party photo details, the cufflink.');

insert into private.content(key, body) values ('reveal', $reveal$
## Why Evelyn rented Apartment 4B

Six weeks before Halloween, Evelyn Vale was reading the accounts of her late mother's charity, the Vale Housing Trust. Three large payments stood out: a new boiler, a new roof membrane and an elevator upgrade at Hollow House, all paid to Larkspur Property Services. Together they came to $112,300.

Evelyn rented Apartment 4B as "Eva Reed", paid Marta Bell in cash and asked her to keep the secret. As a neighbor, she could hear what residents would never tell an heiress. They all said the same thing: the old boiler was still being patched every month, the roof still leaked into 5D, and the elevator had not worked since spring. The work had never been done.

Larkspur had no staff and no website. Its registered address was 410 Pearl Street, Suite 1104 — the office of Cross Advisory Group. Every Larkspur payment had been approved by the trust's financial adviser: her fiancé, Adrian Cross.

Evelyn booked a meeting with independent auditor Joanna Okafor for 9:00 the next morning. Her note to herself said what she would do after it: talk to Adrian and return the ring. She told only Tessa, and asked her to keep everything secret until Thursday.

## Halloween night

- 8:10 PM — Noah Mercer arrives to argue about the candid photographs he sold to a gossip site.
- 8:22 PM — At the masquerade, a guest photographs Adrian. Both gold cufflinks are on his cuffs.
- 8:25 PM — Noah leaves, angry.
- 8:32 PM — Noah pays for coffee at Ortiz Corner Market. The market camera shows him at the window counter until 9:14.
- 8:40 PM — Evelyn leaves Tessa a voice message: Noah has gone, and she is fine.
- 8:47 PM — The Hollow House entrance camera records Adrian arriving, his mask pushed up onto his forehead.
- 8:51 PM — Evelyn texts the auditor: Adrian is here, and he was not supposed to know about this place.
- 8:55–9:05 PM — The medical examiner's window for the time of death. Adrian strikes Evelyn once with the heavy brass candlestick from the mantel.
- 9:03 PM — Leo, rehearsing next door, hears the crash.
- Adrian wipes the candlestick, pulls out the desk drawers and breaks the window from the inside, so the glass falls outward. He does not notice that one engraved cufflink has torn loose and rolled under the sofa.
- 9:08 PM — The entrance camera records him leaving, holding his left wrist.
- 9:14 PM — From the car, Adrian posts the 8:22 photo, hoping the upload time will pass as his alibi.
- 9:26 PM — The official event photographer captures Adrian at the auction podium. His left cuff hangs open. One cufflink is missing.
- 9:35 PM — After Leo mentions the crash, Marta knocks, uses her master key, finds Evelyn and calls emergency services.

## How the evidence proves it

- Motive: the trust payments, the residents' accounts and the vendor registry show that Adrian stole $112,300. The auditor email shows the theft would be exposed the next morning.
- Presence: the entrance camera log places him inside Hollow House from 8:47 to 9:08. Evelyn's 8:51 text names him.
- Alibi: photo A was captured at 8:22 PM, before he arrived; 9:14 PM is only when he uploaded it. The verified 9:26 PM photo comes after he left. The time of death, 8:55–9:05, falls inside his visit.
- Scene: the dented candlestick base matches the injury, and the window glass and untouched cash show the burglary was staged. The cufflink matches the one-of-a-kind pair Evelyn gave him, and the 9:26 photo shows him wearing only one. The cufflink matters only because the camera already puts him in the building.

## The secrets that were not murder

- Noah Mercer was angry and was there that evening, but he left at 8:25, Evelyn was alive at 8:40, and the market camera covers the whole time of death. His secret was the photos he sold.
- Leo Finch assumed the man on the stairs was "the photographer". His revised statement describes formal shoes and a long black overcoat, not a denim jacket.
- Celeste Vale feared scandal and losing her seat as trustee, but Henrietta Lowe places her at the auction table all evening, and she approved none of the Larkspur payments.
- Marta Bell hid Evelyn's identity because Evelyn asked her to. Her own secret — reduced rent for the Alvarez family in 2A — is against trust rules but unrelated to the death.
- Tessa Quinn withheld the voice message and Evelyn's private text to keep a promise. She handed both over the next morning.
- The $5 million life insurance made Adrian look greedy, but the policy had existed since the engagement. What brought him to Hollow House that night was the 9:00 AM meeting with the auditor.

Every secret opened another door. Behind the last one was Adrian Cross.
$reveal$)
on conflict (key) do update set body = excluded.body;

insert into private.content(key, body) values ('walkthrough', $walk$
## Solution in one line

Adrian Cross killed Evelyn Vale with the brass candlestick to stop her exposing his fraud against the Vale Housing Trust.

## Stage answers

- Stage 1 — Inspect bag, lease, candlestick, window and note (cufflink optional). Alias: Eva Reed. Staged-burglary signs: glass fell outward AND cash left in the wallet. Weapon: the brass candlestick.
- Stage 2 — Open all six profiles. Confirmed: Noah went to 4B; Marta knew; Tessa knew; Celeste was at the masquerade. Unverified: Adrian at the masquerade all evening; the man Leo saw was Noah.
- Stage 3 — Purpose: meet residents and compare their accounts with trust records. Suspicious payee: Larkspur Property Services. Connected person: Adrian Cross.
- Stage 4 — Timeline: Noah arrives, photo A captured, Noah leaves, Noah at market, voice message, Adrian enters, text to auditor, crash, Adrian leaves, photo A uploaded, photo B captured, Marta finds Evelyn. Failing alibi: Adrian, because photo A was captured before he entered (9:14 is the upload). Contradictions: Adrian "never left" → entrance camera; Leo "it was Noah" → market footage or Leo's revised statement; "photo shows me at 9:14" → party photo details.
- Stage 5 — Suspect Adrian; motive: payments, registry, resident notes or auditor email; opportunity: entrance camera or 8:51 text; physical: cufflink. Deductions: capture before visit; cufflink matches his pair and one is missing at 9:26; burglary staged.
- Stage 6 — Killer Adrian Cross; motive: stop exposure of trust fraud; weapon: brass candlestick; any three of: trust payments, resident notes, vendor registry, auditor email, entrance camera, 8:51 text, party photos, medical report, cufflink, Leo's revised statement.

## Hosting tips

- Teams that stall in Stage 4 usually have photo A's upload time in the wrong place. Remind everyone, without a penalty, that capture time and upload time are different.
- Ordinary stage answers are free to retry. Only hints (+2 min) and wrong final accusations (+3 min) cost time.
- Pausing the event freezes every active team's clock. Use it for technical problems that affect everyone.
- Wrong accusations report how many of the four parts hold up, but not which ones.
$walk$)
on conflict (key) do update set body = excluded.body;
