// Player-visible case content for "Who Unalived the CEO of BlueGreen Insurance?"
// Built from the BlueGreen Insurance Mystery Case File. Contains NO answer keys:
// all checking happens in Postgres (supabase/01_schema.sql).

const BASE = import.meta.env.BASE_URL || './';
export const media = (p) => `${BASE}media/${p}`;

export const TIME_LIMIT_MINUTES = 30; // default; hosts can change it per event

export const CASE = {
  brand: 'HighCall VA Multiverse',
  company: 'HighCall VA',
  code: 'CASE BG-0917',
  title: 'Who Unalived the CEO of BlueGreen Insurance?',
  shortTitle: 'The BlueGreen Case',
  tagline: 'A cancelled succession announcement. Two cardiac arrests. One hospital record that tells the wrong story.',
  intro:
    'Andrew Sterling, the 72-year-old billionaire CEO of BlueGreen Insurance, survives a collapse after an argument with his daughter. ' +
    'Hours later, he dies in a private intensive care suite at Georgia Capital Hospital. Separate the first medical emergency from the later homicide — and prove it.',
  disclaimer: 'All people, organizations, events, records and dialogue are fictional. GCH-U17 and GCH-X41 are invented game compounds.',
};

export const STAGES = [
  { n: 1, title: 'The Unannounced Visit', short: 'The boardroom, the argument and the collapse.' },
  { n: 2, title: 'The Emergency Department', short: 'Hospital records from the first cardiac arrest.' },
  { n: 3, title: 'The Successor Nobody Expected', short: 'A private decision, a voicemail and two versions of the chart.' },
  { n: 4, title: 'The Second Code', short: 'Statements, the lab report and the audit.' },
  { n: 5, title: 'The Hidden Agreement', short: 'Recovered messages and the evidence board.' },
  { n: 6, title: 'Final Verdict', short: 'Name who planned it, who carried it out, and prove it.' },
];

// Scene narratives (player-safe), shown at the top of each stage.
export const SCENES = {
  1: [
    'At 08:30 the directors of BlueGreen Insurance begin arriving for a meeting Andrew Sterling has called without an agenda. His chief of staff, Agatha, places a sealed envelope beside the chairman\'s seat.',
    'At 08:40 Agatha privately tells Amanda the meeting concerns succession. Amanda passes the news to her husband, Albert, who asks her to prepare a celebration. At 08:50 Allison lands from Los Angeles; by 09:10 she is demanding five minutes with her father. Agatha refuses.',
    'At 09:18 Allison pushes into Andrew\'s office. A paperweight hits the carpet. She moves a drinking glass away from the edge of the desk as she strikes the desktop. "Why does being your daughter matter more than being qualified?" At 09:23 Andrew collapses. Allison calls for help and stays beside him. At 09:29, in the ambulance, he loses his pulse.',
    'Within minutes a story reaches the boardroom: Allison threatened him, touched his drink, and watched him fall. The envelope goes into counsel\'s custody. The meeting is cancelled.',
  ],
  2: [
    'At 09:31 Andrew arrives at Georgia Capital Hospital during active resuscitation. Dr Bobby Brown — Allison\'s stepfather — leads. Mario, Matthew and Marigold work as a coordinated team. At 09:35 a pulse returns.',
    'Amanda arrives at 10:02, cries, and thanks every nurse by name. Albert arrives at 10:11 and confronts Allison: "You could not wait one more day?" — "I called the ambulance. What did you do? Order balloons?"',
    'At 11:30 Dr Victor Veil returns from abroad carrying a secret: Andrew has Stage III prostate cancer. By afternoon, cardiology favors stress cardiomyopathy. Andrew is moved to ICU suite 701.',
  ],
  3: [
    'At 18:05 Andrew asks Dr Veil to close the door. With permission, Veil records a short care-planning dictation. Andrew says he will recommend Allison, and he wants the board call tomorrow at nine.',
    'A nurse approaches the doorway for a scheduled assessment. At 18:11 Amanda receives a message and steps away from the family lounge. At 18:22 Dr Veil leaves Allison a voicemail.',
    'The authentic care plan stays conservative. A later display of the medication record tells a different story.',
  ],
  4: [
    'At 20:36 Marigold hands the medication task to Mario. The label reads GCH-U17. At 20:40 he administers it. At 20:44 Andrew becomes acutely unwell; Mario calls the code at once.',
    '"Mario gave it," Marigold says. "Matthew checked it. It is all in the chart." Matthew says he was never there. At 21:06 Andrew is pronounced dead.',
    'Amanda, in the chapel corridor, asks whether the doctors have documented a medication error. Security preserves the materials, audit records and video. Samples are examined over the following days.',
  ],
  5: [
    'Investigators obtain proper authority for personal devices and financial records. Deleted messages are recovered and corroborated. Two people make admissions. An independent review separates the two cardiac events.',
  ],
  6: [
    'Someone saved Andrew Sterling in the morning. Someone made sure that rescue would not last until the next morning\'s board meeting.',
  ],
};

export const CHARACTERS = [
  { id: 'andrew', name: 'Andrew Sterling', role: 'The CEO (victim)', victim: true,
    summary: '72, divorced billionaire CEO of BlueGreen Insurance. Unwilling to surrender control.',
    background: ['Called an unexpected board meeting about succession.', 'Collapsed at 09:23 during an argument with his daughter; resuscitated at Georgia Capital Hospital.', 'Pronounced dead at 21:06 the same day in ICU suite 701.'],
    statement: 'Recorded at 18:05 (care-planning dictation): "Allison has already been doing the job. I was going to recommend her this morning."' },
  { id: 'allison', name: 'Allison Sterling', role: 'The daughter · VP',
    summary: 'Eldest child. Technology expert, summa cum laude, two MBAs. Repeatedly passed over.',
    background: ['Landed from Los Angeles at 08:50 after resolving a major network failure.', 'Entered her father\'s office unannounced at 09:18. Their argument carried into the corridor.', 'Called for help when he collapsed and stayed beside him.'],
    statement: '"I keep this company standing. I moved his glass because I hit the desk — I didn\'t want it to fall. I didn\'t put anything in it. I called the ambulance."' },
  { id: 'albert', name: 'Albert Sterling', role: 'The son · COO',
    summary: 'Younger child. Charismatic, married, three children. Already behaving as if the CEO role is his.',
    background: ['Would become interim executive if Andrew became unable to act.', 'Asked Amanda to prepare a celebration after hearing the meeting was about succession.'],
    statement: '"Amanda told me today was the handover. I assumed it was me — everyone did. I said I would look after Agatha. That is business, not murder."' },
  { id: 'amanda', name: 'Amanda Sterling', role: 'Albert\'s wife · Charity lead',
    summary: 'Wealthy, educated, gentle in public. Leads the company\'s charity programs.',
    background: ['Arrived at the hospital first, at 10:02, and thanked every nurse by name.', 'Kept the family calm in the waiting area.', 'Manages the charitable accounts of the BlueGreen Foundation.'],
    statement: '"I only wanted the family together. When they told me he had died, I asked what anyone would ask — whether it was a mistake by the hospital."' },
  { id: 'agatha', name: 'Agatha', role: 'Chief of staff',
    summary: '32. Controls Andrew\'s schedule and access to the succession documents.',
    background: ['Placed the sealed envelope beside the chairman\'s seat.', 'Refused Allison\'s request for a meeting at 09:10.'],
    statement: '"I never opened the final letter. I told Amanda the meeting was about succession. I hoped Albert would remember who helped him."' },
  { id: 'veil', name: 'Dr Victor Veil', role: 'Personal physician · Medical chief',
    summary: 'Andrew\'s personal physician and the hospital\'s medical chief. Held a confidential diagnosis.',
    background: ['Returned from an international trip at 11:30.', 'Recorded Andrew\'s care-planning dictation at 18:05 and left Allison a voicemail at 18:22.'],
    statement: '"The plan I wrote was conservative: monitored recovery, reconcile his cancer medicines, nothing new without review. I did not order an urgent treatment that night."' },
  { id: 'brown', name: 'Dr Bobby Brown', role: 'Emergency attending · Stepfather',
    summary: 'Led the first resuscitation. Married to Andrew\'s former wife; Allison\'s stepfather.',
    background: ['Directed defibrillation for ventricular fibrillation; pulse returned at 09:35.', 'Listed possible toxic exposure as a cause to investigate after hearing about the glass.'],
    statement: '"I wrote that toxic exposure was possible and not established. That is what a differential is. I never diagnosed poisoning."' },
  { id: 'mario', name: 'Mario', role: 'Bedside nurse',
    summary: 'Performed compressions in the first code. Recorded as administering the evening medication.',
    background: ['Received the medication task from Marigold at 20:36.', 'Administered the labelled product at 20:40; called the code at 20:44.'],
    statement: '"The label and the record both said GCH-U17. Marigold told me the order had been updated. I should have clarified why it was now urgent. I did not know it contained anything else."' },
  { id: 'matthew', name: 'Matthew', role: 'Critical care nurse',
    summary: 'Supported ventilation and defibrillation in the first code. Named as the second checker.',
    background: ['A disputed entry says he verified the medication at 20:35.', 'Returned to suite 701 when he heard the second code.'],
    statement: '"I did not check that medication. From 20:34 to 20:43 I was helping with an emergency in room 710. There were other staff with me."' },
  { id: 'marigold', name: 'Marigold', role: 'Coordinating nurse',
    summary: 'Experienced nurse coordinating the three-person primary team for the VIP admission.',
    background: ['Ran monitoring, task confirmation and documentation in the first code.', 'Scheduled to assess Andrew around the time of his 18:05 conversation.'],
    statement: '"I coordinated the coverage. Mario administered it and Matthew verified it. I followed what was on the chart."' },
];
export const SUSPECT_IDS = ['allison', 'albert', 'amanda', 'agatha', 'veil', 'brown', 'mario', 'matthew', 'marigold'];
export const charById = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));

// Evidence block types: p, meta, table, hand, messages, audio, note, statement, record (EHR rows).
export const EVIDENCE = [
  // ---------------- Stage 1 ----------------
  { id: 'obj_glass', code: 'S1-A', stage: 1, title: 'Office drinking glass', kind: 'Object', art: 'glass', blurb: 'Bagged at the scene. Lab report sealed until Stage 2.',
    blocks: [
      { type: 'p', text: 'A crystal tumbler from Andrew\'s desk, about one-third full of water. Allison\'s fingerprints are on its side.' },
      { type: 'meta', rows: [['Collected', '10:40 by building security, sealed in bag OF-01'], ['Seen at', 'Back edge of the desk after the argument'], ['Lab report', 'Pending — released in Stage 2 (E03)']] },
      { type: 'note', text: 'Fingerprints show a hand touched the glass. They do not show what anyone put in it.' } ] },
  { id: 'obj_paperweight', code: 'S1-B', stage: 1, title: 'Paperweight on the carpet', kind: 'Object', art: 'paperweight', blurb: 'Knocked off the desk during the argument.',
    blocks: [ { type: 'p', text: 'A heavy glass globe engraved "BlueGreen Insurance — 40 years". It fell during the argument. Undamaged; nobody was struck.' } ] },
  { id: 'obj_envelope', code: 'S1-C', stage: 1, title: 'The sealed envelope', kind: 'Object', art: 'envelope', blurb: 'Taken into company counsel\'s custody.',
    blocks: [
      { type: 'p', text: 'A cream envelope placed beside the chairman\'s seat at 08:30. Sealed with Andrew\'s initials across the flap.' },
      { type: 'meta', rows: [['Custody', 'Company counsel, from 09:52'], ['Contents', 'Withheld until opened in the presence of investigators (Stage 3, E01B)']] } ] },
  { id: 'e01a', code: 'E01A', stage: 1, title: 'Board notice and interim succession rules', kind: 'Corporate record', art: 'doc', blurb: 'The cancelled meeting notice and the company\'s standing rules.',
    blocks: [
      { type: 'meta', rows: [['Meeting', 'Special board meeting — succession. Called by Andrew Sterling. Cancelled 09:40.'], ['Sealed envelope', 'Taken into documented custody by company counsel']] },
      { type: 'p', text: 'Corporate extract: if the CEO is incapacitated, Albert Sterling acts as interim executive until the board decides otherwise. Permanent appointment is a board decision.' },
      { type: 'p', text: 'A separate estate memorandum does not assign the family fortune to whoever becomes CEO.' } ] },
  { id: 'e02', code: 'E02', stage: 1, title: 'Messages before the collapse', kind: 'Messages', art: 'phone', blurb: 'Recovered from company and personal phones.',
    blocks: [
      { type: 'messages', items: [
        { from: 'Agatha → Amanda', time: '08:40', text: 'Today is succession. I have not opened the final letter. You know what he has always said about Albert. Please remember our VP agreement.' },
        { from: 'Amanda → Albert', time: '08:45', text: 'Agatha says today is the handover. She expects your support for VP. I will prepare something at home.' },
        { from: 'Albert → Amanda', time: '08:47', text: 'Finally. Keep the celebration small until it is official. I will look after Agatha.' },
        { from: 'Allison (call transcript)', time: '09:10', text: 'I need five minutes with my father. I have just landed. You cannot refuse to tell him I am here.' } ] },
      { type: 'note', text: 'These messages show a leak and a corporate bargain. On their own they do not show that anyone knew about a plan to kill.' } ] },

  // ---------------- Stage 2: hospital records ----------------
  { id: 'e03', code: 'E03', stage: 2, title: 'The office glass: camera and lab report', kind: 'Camera + lab', art: 'camera', blurb: 'Office camera stills, reception log and the drink analysis.',
    blocks: [
      { type: 'table', head: ['Time', 'Office camera / reception'], rows: [
        ['09:15', 'Andrew drinks from the glass at his desk. He is alone.'],
        ['09:18', 'Allison enters past Agatha.'],
        ['09:20', 'Allison moves the glass away from the desk edge as she strikes the desktop. Nothing is added to the drink.'],
        ['09:23', 'Andrew collapses. Allison kneels beside him and calls for help.'] ] },
      { type: 'p', text: 'Laboratory report: no tested toxicant in the drink, and no matching exposure in Andrew\'s baseline hospital samples. A negative panel cannot exclude every possible poison — but here the video, the timing and the medical findings together contradict the drink-poisoning allegation.' } ] },
  { id: 'e04', code: 'E04', stage: 2, title: 'EMS handover and emergency code record', kind: 'Hospital record', art: 'ehr', blurb: 'Georgia Capital Hospital — Emergency Department.',
    blocks: [
      { type: 'record', header: 'GCH-ED · CODE RECORD · STERLING, ANDREW · 72 M', rows: [
        ['09:23', 'Office collapse after chest pain, breathlessness and sweating; initially responsive to voice.'],
        ['09:29', 'During transport: unresponsive, no normal breathing, no definite pulse. EMS begins resuscitation.'],
        ['09:31', 'ED handover: ongoing CPR. Ventricular fibrillation (VF) confirmed on monitor.'],
        ['09:31–09:35', 'Team CPR, supported ventilation, rhythm checks, defibrillation for VF, immediate return to compressions.'],
        ['09:35', 'Return of spontaneous circulation (ROSC). Monitored post-arrest care begins.'] ] },
      { type: 'meta', rows: [['Team lead', 'Dr Bobby Brown'], ['Compressions', 'Mario'], ['Ventilation / defibrillator readiness', 'Matthew'], ['Monitoring, task confirmation, documentation', 'Marigold']] },
      { type: 'statement', who: 'Dr Brown\'s initial note', text: '"Unexplained arrest following acute distress. Evaluate cardiac causes; possible toxic exposure raised by witness account, not established."' } ] },
  { id: 'e05', code: 'E05', stage: 2, title: 'Confidential history and cardiology addendum', kind: 'Hospital record', art: 'echo', blurb: 'Released to treating clinicians after Dr Veil returned at 11:30.',
    blocks: [
      { type: 'record', header: 'GCH · CONFIDENTIAL CLINICAL HISTORY', rows: [
        ['Oncology', 'Biopsy-confirmed Stage III prostate cancer. No distant metastases documented. Existing androgen-deprivation treatment recorded. Oncology to review the plan after cardiac stabilization.'],
        ['Prognosis', 'The record contains no finding that establishes a three-week life expectancy.'],
        ['Cardiology', 'Imaging pattern compatible with stress cardiomyopathy. Angiography: no acute blocked coronary artery. Severe emotional stress supports this working explanation.'],
        ['Toxic exposure', 'Raised early as a provisional possibility. Not established.'] ] },
      { type: 'note', text: 'Working conclusion: the first event was a non-criminal cardiac emergency — stress cardiomyopathy complicated by ventricular fibrillation.' } ] },

  // ---------------- Stage 3 ----------------
  { id: 'e01b', code: 'E01B', stage: 3, title: 'The sealed recommendation', kind: 'Corporate record', art: 'letter', blurb: 'Opened in the presence of counsel and investigators.',
    blocks: [
      { type: 'hand', text: 'I recommend Allison Sterling as the next\nChief Executive Officer, subject to the\nboard\'s approval. Albert will remain Chief\nOperating Officer during the transition.\n— Andrew Sterling', transcript: '"I recommend Allison Sterling as the next Chief Executive Officer, subject to the board\'s approval. Albert will remain Chief Operating Officer during the transition." Signed by Andrew Sterling.' },
      { type: 'meta', rows: [['Signed', 'The evening before the collapse'], ['Corroboration', 'Counsel\'s email confirms receiving a draft before the office argument']] } ] },
  { id: 'e06', code: 'E06', stage: 3, title: 'Care-planning dictation, 18:05', kind: 'Audio', art: 'audio', blurb: 'Recorded by Dr Veil with Andrew\'s permission.',
    blocks: [
      { type: 'audio', label: 'Dictation — ICU suite 701 — 18:05 — consent and device metadata preserved',
        transcript: 'VEIL: "We need to protect your recovery and arrange the oncology review. You cannot keep putting the company ahead of your care." ANDREW: "I set three weeks for the handover. After this morning, I want the recommendation heard tomorrow." VEIL: "Who do you want the board to consider?" ANDREW: "Allison. I let being a man count in Albert\'s favor when it should not have counted at all. I was wrong. She is ready." VEIL: "May I tell her you want her on the call?" ANDREW: "Yes. Tell her she was always capable."' },
      { type: 'record', header: 'SUITE 701 · ROOM ACCESS RECORD', rows: [['18:08', 'Marigold at the suite doorway for a scheduled nursing assessment, near the end of the discussion.']] },
      { type: 'note', text: 'Andrew is documented as alert and oriented. The dictation is evidence of his intent — not a board resolution.' } ] },
  { id: 'lounge', code: 'S3-L', stage: 3, title: 'Family lounge log', kind: 'Visitor record', art: 'doc', blurb: 'Who came and went from the family lounge.',
    blocks: [
      { type: 'table', head: ['Time', 'Observation'], rows: [
        ['18:11', 'Amanda receives a message and steps out of the family lounge. Sender and content not yet available.'],
        ['18:24', 'Allison listens to a voicemail and cries. She asks counsel what her father must do to make the recommendation official.'],
        ['18:40', 'Amanda returns.'] ] } ] },
  { id: 'e07', code: 'E07', stage: 3, title: 'Voicemail to Allison, 18:22', kind: 'Audio', art: 'audio', blurb: 'Saved by Allison; matches the phone record.',
    blocks: [
      { type: 'audio', label: 'Voicemail from Dr Victor Veil to Allison Sterling — 18:22',
        transcript: 'Allison, it is Dr Veil. Your father asked me to tell you that he intends to recommend you as CEO. He wants you at tomorrow\'s nine o\'clock board call. The appointment still requires the board\'s approval. Please speak with him when we can arrange it. He wants to make this right himself.' },
      { type: 'note', text: 'The news gives Allison every reason to want her father alive for the morning call. It is not, on its own, an alibi.' } ] },
  { id: 'e08', code: 'E08', stage: 3, title: 'Authentic prescriber plan (14:10)', kind: 'Hospital record', art: 'ehr', blurb: 'The plan as authorized in the prescribing system.',
    blocks: [
      { type: 'record', header: 'GCH-ICU · PRESCRIBER PLAN · SUITE 701 · AUTHENTICATED 14:10', rows: [
        ['Bicalutamide', 'Existing oral cancer treatment. Temporarily held pending reconciliation and oncology review.'],
        ['Leuprolide acetate depot', 'Prior outpatient treatment documented. No dose scheduled for this evening.'],
        ['GCH-U17', 'Fictional supportive product for urinary discomfort. Proposed only. NOT authorized for new administration this evening.'],
        ['GCH-X41', 'No order. No indication. No consent. Invented research compound.'] ] },
      { type: 'p', text: 'Instruction: continue monitored cardiac recovery. No new non-urgent treatment until reconciliation is complete. Any change must go through prescriber and pharmacy verification.' },
      { type: 'meta', rows: [['Observations at 20:30', 'Awake. Pulse 84, BP 118/72, resp. rate 18, SpO₂ 96%. No new chest pain.']] } ] },
  { id: 'e09', code: 'E09', stage: 3, title: 'Disputed bedside display', kind: 'Hospital record', art: 'ehr', blurb: 'A later version of the bedside medication record.',
    blocks: [
      { type: 'record', header: 'GCH-ICU · BEDSIDE MEDICATION DISPLAY · STERLING, ANDREW · SUITE 701', rows: [
        ['Treatment', 'GCH-U17 — URGENT oncology replacement. Due 20:40.'],
        ['Prescriber shown', 'Dr Victor Veil'],
        ['Assigned administrator', 'Mario'],
        ['Second checker shown', 'Matthew — completed 20:35'],
        ['Administration entry', 'Mario, 20:40. Label scanned: GCH-U17.'] ] },
      { type: 'note', text: 'A name on a screen is not proof that its owner prescribed, verified or changed anything.' } ] },

  // ---------------- Stage 4 ----------------
  { id: 'e10', code: 'E10', stage: 4, title: 'Separate nursing statements', kind: 'Statements', art: 'statements', blurb: 'Taken separately the next morning.',
    blocks: [
      { type: 'statement', who: 'Mario', text: '"The label and the record both said GCH-U17. Marigold told me the order had been updated. I checked his identity. I should have clarified why it was now urgent and confirmed the new authorization. I did not know it contained anything else. When he deteriorated, I called for the code immediately."' },
      { type: 'statement', who: 'Matthew', text: '"I did not check that medication. From 20:34 to 20:43 I was helping with an emergency in room 710. There were other staff with me. I will give you my notes and the witnesses\' names."' },
      { type: 'statement', who: 'Marigold', text: '"I coordinated the coverage. Mario administered it and Matthew verified it. I followed what was on the chart."' },
      { type: 'note', text: 'Mario admits a verification concern. Matthew gives a testable account. Marigold points at others without explaining the handover or the record changes. None of these alone proves intent.' } ] },
  { id: 'code2', code: 'E10A', stage: 4, title: 'Second code record', kind: 'Hospital record', art: 'ecg', blurb: 'ICU suite 701, evening.',
    blocks: [
      { type: 'record', header: 'GCH-ICU · CODE RECORD · SUITE 701', rows: [
        ['20:40', 'Labelled product administered (Mario).'],
        ['20:44', 'Acute deterioration. New unstable ventricular arrhythmia on monitor. Mario activates the emergency response.'],
        ['20:45', 'Matthew returns from room 710 and begins resuscitation with Mario. Marigold joins and points to the medication record.'],
        ['21:06', 'Pronounced dead despite resuscitation.'] ] },
      { type: 'statement', who: 'Chaplain\'s corridor note, 21:10', text: 'Mrs Amanda Sterling covered her mouth, asked about her husband, and then asked whether the doctors had documented a medication error.' } ] },
  { id: 'e11', code: 'E11', stage: 4, title: 'Pharmacy examination and assay', kind: 'Lab report', art: 'lab', blurb: 'Retained package, comparison stock and samples.',
    blocks: [
      { type: 'meta', rows: [
        ['Pharmacy authorization', 'None for the newly displayed administration'],
        ['Label on retained package', 'GCH-U17'],
        ['Contents identified', 'GCH-X41'],
        ['Post-event samples', 'Same fictional compound (GCH-X41) present'],
        ['Pre-exposure sample', 'GCH-X41 not present'],
        ['Fictional formulary', 'GCH-X41 can produce severe cardiac toxicity. No role in prostate cancer care or Andrew\'s recovery plan.'] ] },
      { type: 'table', head: ['Custody', 'Event'], rows: [
        ['21:14', 'Charge nurse R. Hayes collects the retained product, seals it as CS-701-01.'],
        ['21:28', 'Transferred to security.'],
        ['Day 3, 09:12', 'Laboratory logs receipt; seal intact.'] ] },
      { type: 'note', text: 'Timing links the product to the fatal deterioration; the assay and independent clinical review corroborate it. Charge nurse Hayes is not a suspect.' } ] },
  { id: 'e12', code: 'E12', stage: 4, title: 'Independent audit examination', kind: 'Hospital record', art: 'audit', blurb: 'Authenticated order history and application audit.',
    blocks: [
      { type: 'record', header: 'GCH · EHR AUDIT · AUTHENTICATED FINDINGS', rows: [
        ['14:10', 'Authentic plan contains no authorized GCH-U17 administration for the evening.'],
        ['20:18', 'A later alteration adds the urgent treatment display. The claimed Dr Veil authorization does not validate against the prescribing record.'],
        ['20:18', 'The activity is tied to a session attributed to Marigold. Workstation and access evidence corroborate her presence.'],
        ['20:35', 'The displayed Matthew verification has no matching authentic verification event from him. It belongs to the same altered record sequence.'],
        ['20:40', 'Mario\'s administration entry is genuine and records what he believed the labelled product to be.'] ] },
      { type: 'note', text: 'An account name alone would not identify who used it. Here, independent workstation and access evidence corroborate it.' } ] },
  { id: 'e13', code: 'E13', stage: 4, title: 'Synchronized time and access evidence', kind: 'Security record', art: 'cctv', blurb: 'Door records, station video and room 710.',
    blocks: [
      { type: 'table', head: ['Time', 'Source', 'Observation'], rows: [
        ['18:08', 'Suite doorway record', 'Marigold near the end of the private succession discussion'],
        ['20:18', 'Workstation and access', 'Marigold present at the station used for the alteration'],
        ['20:21', 'Medication station video', 'Marigold handles the package later passed to Mario (contents not visible)'],
        ['20:34–20:43', 'Room 710 code record and witnesses', 'Matthew at another bedside during the disputed 20:35 "verification"'],
        ['20:36', 'Handover video and statements', 'The package passes from Marigold to Mario'],
        ['20:38–20:46', 'Family lounge and chapel records', 'Allison and Albert in the lounge; Amanda near the chapel'] ] },
      { type: 'note', text: 'Clock offsets reconciled. Video of a package establishes opportunity, not contents or intent. Being elsewhere at 20:40 does not rule out planning earlier.' } ] },

  // ---------------- Stage 5 ----------------
  { id: 'e14', code: 'E14', stage: 5, title: 'Recovered messages: Amanda and Marigold', kind: 'Messages', art: 'phone', blurb: 'Authorized device examination; corroborated on both devices.',
    blocks: [
      { type: 'messages', items: [
        { from: 'Amanda', time: '11:03', text: 'I need to speak privately. Albert must not lose what his father promised him.' },
        { from: 'Marigold', time: '18:11', text: 'He told Veil it is Allison. Board call at nine tomorrow. He wants it official.' },
        { from: 'Amanda', time: '18:13', text: 'Then we do not have until the handover. If he makes that call, Albert loses the chair and Allison opens the charity books.' },
        { from: 'Marigold', time: '18:16', text: 'You promised the payment and protection. I am not taking this risk for nothing.' },
        { from: 'Amanda', time: '18:19', text: 'You agreed to make his death look like a treatment error. The agreement stands.' },
        { from: 'Amanda', time: '21:12', text: 'You said there would be no reason to look at us.' },
        { from: 'Marigold', time: '21:14', text: 'They are looking at the records now. Stop messaging me.' } ] } ] },
  { id: 'e14b', code: 'E14B', stage: 5, title: 'Charitable account payment', kind: 'Financial record', art: 'ledger', blurb: 'From the BlueGreen Foundation accounts.',
    blocks: [
      { type: 'meta', rows: [
        ['Paying account', 'BlueGreen Foundation community fund — signatory: Amanda Sterling'],
        ['Recipient', 'A wellness consultancy registered to Marigold'],
        ['Description', '"Nurse wellbeing program — consultancy"'],
        ['Status', 'No contract, deliverables or board approval on file'] ] },
      { type: 'note', text: 'Suspicious context, not proof of homicide by itself.' } ] },
  { id: 'e15', code: 'E15', stage: 5, title: 'Two secrets that explain the misdirection', kind: 'Admissions', art: 'statements', blurb: 'Agatha and Albert explain the bargain.',
    blocks: [
      { type: 'statement', who: 'Agatha', text: 'Admits she was Andrew\'s secret lover; earlier personal correspondence corroborates it. She feared losing access when he retired and sought the VP bargain as protection. She leaked the meeting\'s purpose without seeing the recommendation.' },
      { type: 'statement', who: 'Albert', text: 'Admits accepting the succession tip and agreeing to support Agatha for VP. He did not know Andrew intended to recommend Allison. Nothing shows he knew about, approved or commissioned the killing.' },
      { type: 'note', text: 'Amanda did not know the signed recommendation already existed. She believed silencing Andrew would keep Albert in interim control and delay scrutiny of her charity accounts.' } ] },
  { id: 'e16', code: 'E16', stage: 5, title: 'Independent cause review', kind: 'Hospital record', art: 'echo', blurb: 'Forensic review of both cardiac events.',
    blocks: [
      { type: 'p', text: 'The review separates the survived morning event from the fatal evening exposure. It concludes that unauthorized GCH-X41 exposure caused the fatal deterioration and that the evidence supports deliberate substitution. Stage III prostate cancer and the earlier argument do not explain the second event.' },
      { type: 'p', text: 'Mario\'s administration record is genuine. The claimed authorization and the Matthew verification are not.' } ] },
];
export const EVIDENCE_BY_ID = Object.fromEntries(EVIDENCE.map((e) => [e.id, e]));

// Office scene hotspots (percent positions over the illustration).
export const HOTSPOTS = [
  { id: 'obj_glass', label: 'Drinking glass on the desk', x: 55.5, y: 36, required: true },
  { id: 'obj_paperweight', label: 'Paperweight on the carpet', x: 36.3, y: 72, required: true },
  { id: 'obj_envelope', label: 'Sealed envelope from the boardroom', x: 70, y: 36, required: true },
  { id: 'e01a', label: 'Board notice on the side table', x: 88, y: 47, required: true },
  { id: 'e02', label: 'Phones and message log', x: 37, y: 37, required: true },
];

export const STAGE_TASKS = {
  1: ['s1_round1'],
  2: ['s2_records'],
  3: ['s3_successor', 's3_compare'],
  4: ['s4_substance', 's4_roles'],
  5: ['s5_board'],
};

export const Q = {
  s1: {
    chain: { prompt: 'How did Albert learn the meeting was about succession?', options: [
      ['andrew', 'Andrew told him directly'], ['agatha_amanda', 'Agatha told Amanda, who told Albert'],
      ['envelope', 'He read the sealed envelope'], ['allison', 'Allison told him in the corridor']] },
    exchange: { prompt: 'What did Agatha expect in return?', options: [
      ['money', 'A cash bonus'], ['board', 'A seat on the board'],
      ['vp', 'Albert\'s support for her appointment as VP, replacing Allison'], ['nothing', 'Nothing']] },
    claim: { prompt: 'Which statement about Allison does the Stage 1 evidence support?', options: [
      ['threatened', 'She threatened to kill her father'], ['poisoned', 'She put something in his drink'],
      ['wanted_role', 'She wanted the CEO role and argued with her father']] },
  },
  s2: {
    intro: 'Judge each claim against the hospital records. Supported: the records confirm it. Contradicted: the records show it is wrong. Unverified: nothing yet confirms or rules it out.',
    choices: [['supported', 'Supported'], ['contradicted', 'Contradicted'], ['unverified', 'Unverified']],
    claims: [
      ['poisoned_drink', 'Allison poisoned her father\'s drink.'],
      ['cardiac_arrest', 'Andrew suffered a cardiac arrest with ventricular fibrillation.'],
      ['brown_diagnosed', 'Dr Brown diagnosed poisoning.'],
      ['stress_cm', 'Cardiology findings favor stress cardiomyopathy for the first event.'],
      ['amanda_knew', 'Amanda knew whom the sealed recommendation named.'],
      ['nurses_team', 'Mario, Matthew and Marigold worked as a coordinated team in the first code.'],
    ],
  },
  s3: {
    recommend: { prompt: 'Whom did Andrew intend to recommend as CEO?', options: [
      ['albert', 'Albert Sterling'], ['allison', 'Allison Sterling'], ['agatha', 'Agatha'], ['undecided', 'He had not decided']] },
    three_weeks: { prompt: 'What do the "three weeks" refer to?', options: [
      ['prognosis', 'His cancer prognosis'], ['deadline', 'The deadline he had set for his leadership handover'],
      ['treatment', 'When his cancer treatment would start'], ['vote', 'The time until the board vote']] },
    doorway: { prompt: 'Who was at the suite doorway near the end of the 18:05 conversation?', options: [
      ['mario', 'Mario'], ['matthew', 'Matthew'], ['marigold', 'Marigold'], ['amanda', 'Amanda']] },
    authorized: { prompt: 'According to the authentic plan (E08), what was authorized for that evening?', options: [
      ['u17', 'An urgent dose of GCH-U17'], ['leuprolide', 'A leuprolide depot injection'],
      ['monitoring', 'Continued monitored cardiac recovery — nothing new without review'], ['x41', 'GCH-X41 under a research protocol']] },
    unsupported: { prompt: 'Which entries on the bedside display (E09) are NOT supported by the authentic plan? Choose two.', options: [
      ['treatment', 'Treatment: GCH-U17, urgent oncology replacement'], ['prescriber', 'Prescriber shown: Dr Victor Veil'],
      ['patient', 'Patient: Andrew Sterling, suite 701'], ['observations', 'Observations at 20:30: awake, pulse 84']] },
  },
  s4: {
    proven: { prompt: 'Medication checklist: which substance is proven to have been wrongfully administered at 20:40?', options: [
      ['bicalutamide', 'Bicalutamide'], ['leuprolide', 'Leuprolide acetate depot'], ['u17', 'GCH-U17'], ['x41', 'GCH-X41']] },
    label: { prompt: 'What name was on the label?', options: [['u17', 'GCH-U17'], ['x41', 'GCH-X41'], ['bicalutamide', 'Bicalutamide']] },
    roles: [
      ['administered', 'Who physically administered the product?'],
      ['enabled', 'Who deliberately enabled the exposure?'],
      ['false_checker', 'Who was falsely recorded as the second checker?'],
    ],
    roleOptions: ['mario', 'matthew', 'marigold', 'veil', 'brown'],
  },
  s5: {
    d1: { prompt: 'Dr Veil\'s name on the urgent order…', options: [
      ['proves_veil', '…proves he ordered the treatment.'],
      ['name_not_proof', '…does not prove he prescribed it: the authorization fails against the prescribing record and the change came from Marigold\'s session.'],
      ['proves_brown', '…shows Dr Brown changed the record.']] },
    d2: { prompt: 'Mario…', options: [
      ['knew', '…knowingly gave a poison.'],
      ['practice_concern', '…gave the product without knowing its contents; failing to clarify the conflicting order is a practice concern, not murder.'],
      ['faultless', '…did nothing that needs review.']] },
    d3: { prompt: 'The two cardiac events…', options: [
      ['both_drink', '…were both caused by poison in the drink.'],
      ['both_cancer', '…were both caused by his cancer.'],
      ['two_events', '…were separate: the morning arrest fits stress cardiomyopathy with VF; the evening death followed GCH-X41 exposure.']] },
  },
  s6: {
    motive: [
      ['insurance', 'To collect an insurance payout'],
      ['control_audit', 'To protect Albert\'s expected control and stop Allison opening the charity accounts Amanda managed'],
      ['vp', 'To secure Agatha\'s VP appointment'],
      ['revenge', 'Revenge over the divorce']],
    method: [
      ['drink', 'Poison in the office drinking glass'],
      ['x41_as_u17', 'GCH-X41 disguised as GCH-U17 through a falsified record'],
      ['leuprolide', 'An unscheduled leuprolide injection'],
      ['u17', 'GCH-U17 itself']],
  },
};
