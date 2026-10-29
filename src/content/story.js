// Player-visible case content. Contains NO answer keys: all checking happens
// in Postgres (supabase/01_schema.sql). Every fact here is something players
// are meant to read.

export const CASE = {
  brand: 'HighCall VA Multiverse',
  company: 'HighCall VA',
  title: 'The Heiress of Hollow House',
  tagline: 'Every secret opens another door.',
  intro:
    'Halloween night, New York. While the Vale family hosts its charity masquerade uptown, the guest of honor never arrives. ' +
    'Twenty-eight-year-old heiress Evelyn Vale is found in Apartment 4B of Hollow House, a tired old building where nobody knew her real name. ' +
    'Why was she there, and who followed her?',
};

export const STAGES = [
  { n: 1, title: 'Secure the scene', short: 'Search Apartment 4B and record what you see.' },
  { n: 2, title: 'Meet the suspects', short: 'Read every statement and separate facts from claims.' },
  { n: 3, title: 'Follow the money', short: 'Find out why Evelyn rented 4B, and who it threatened.' },
  { n: 4, title: 'Reconstruct the night', short: 'Put the evening in order and find the alibi that fails.' },
  { n: 5, title: 'Connect the evidence', short: 'Build the case on the evidence board.' },
  { n: 6, title: 'Make the accusation', short: 'Name the killer, the motive, the weapon and your proof.' },
];

export const CHARACTERS = [
  {
    id: 'adrian', name: 'Adrian Cross', role: 'The fiancé', age: 34,
    portrait: { skin: '#d9b08c', hair: '#2b1d14', hairStyle: 'slick', coat: '#1d2433', accent: '#c4a464', extra: 'mask' },
    summary: 'Charming, polished and financially sophisticated. Helps manage Evelyn\'s charitable affairs.',
    background: [
      'Principal of Cross Advisory Group, a small investment advisory firm.',
      'External financial adviser to the Vale Housing Trust since last year, with authority to approve vendor payments above $10,000.',
      'Beneficiary of Evelyn\'s life insurance policy.',
      'Always wears the gold compass-rose cufflinks Evelyn gave him at their engagement, engraved "E & A".',
    ],
    card: ['Cross Advisory Group', 'Adrian Cross, Principal', '410 Pearl Street, Suite 1104', 'New York, NY'],
    statement:
      '"I was at the masquerade at the Aldridge Hotel all evening. I posted a photo at 9:14 — you can see it on my page. ' +
      'Evelyn told me she had a migraine and would skip the party. I had no idea she had an apartment anywhere. Why would she need one?"',
  },
  {
    id: 'noah', name: 'Noah Mercer', role: 'The ex-boyfriend', age: 30,
    portrait: { skin: '#c48f6a', hair: '#5a3a22', hairStyle: 'messy', coat: '#36506e', accent: '#8a6a3a', extra: 'strap' },
    summary: 'Freelance photographer. Recently argued with Evelyn and sent her an angry message.',
    background: [
      'Dated Evelyn for two years; they separated last spring.',
      'Evelyn recently discovered he had sold candid photos of her to a gossip website and demanded he have them removed.',
      'Admits he visited Apartment 4B on Halloween evening.',
    ],
    statement:
      '"Yes, I went over. She\'d found out about the photos and wanted them pulled. We shouted at each other. I left at about twenty past eight, maybe twenty-five past. ' +
      'I went to get coffee and calm down. She was alive when I left. Furious, but alive."',
  },
  {
    id: 'marta', name: 'Marta Bell', role: 'The landlady', age: 61,
    portrait: { skin: '#e2c2a4', hair: '#9a9590', hairStyle: 'bun', coat: '#4a3b38', accent: '#a8443e', extra: 'keys' },
    summary: 'Has managed Hollow House for 22 years. Holds the master key. Fiercely protective of her residents.',
    background: [
      'Lives on the ground floor and installed the entrance camera in September after a run of package thefts.',
      'Rented 4B to "Eva Reed" and signed the lease.',
      'Found Evelyn and called emergency services.',
    ],
    statement:
      '"Yes, I knew who she was. She asked me not to tell anyone and paid three months in cash. She said she wanted to hear the residents\' side of things, and I protect my residents. ' +
      'At about half past nine Leo told me he\'d heard a crash. I knocked, no answer, so I used my key. I called 911 at 9:35. ' +
      'And since we\'re being honest: I\'ve been letting the Alvarez family in 2A pay less than the listed rent. That\'s against trust rules. It has nothing to do with this."',
  },
  {
    id: 'celeste', name: 'Celeste Vale', role: 'The aunt', age: 58,
    portrait: { skin: '#ecd0b8', hair: '#c9c1b3', hairStyle: 'bob', coat: '#5a1f2c', accent: '#e8e2d4', extra: 'pearls' },
    summary: 'Family trustee of the Vale Housing Trust. Worried about changes to the inheritance and about Evelyn\'s audit.',
    background: [
      'Has served as a trustee of the Vale Housing Trust for eleven years.',
      'Evelyn planned to replace the family trustees with an independent board when she turned thirty.',
      'Spent the evening at the masquerade auction.',
    ],
    statement:
      '"I was at the auction table all evening — ask anyone. Yes, Evelyn and I disagreed. She wanted to hand the family\'s trusts to strangers, and her so-called audit would have embarrassed us all. ' +
      'Disagreement is not murder."',
  },
  {
    id: 'tessa', name: 'Tessa Quinn', role: 'The friend', age: 28,
    portrait: { skin: '#8d5a3b', hair: '#1c1410', hairStyle: 'curls', coat: '#2f5148', accent: '#d8c08a', extra: 'scarf' },
    summary: 'Evelyn\'s closest friend since school, and the only person who knew about the secret apartment.',
    background: [
      'Helped Evelyn choose her engagement gift for Adrian: custom gold compass-rose cufflinks engraved "E & A". The jeweler called them "one pair in the world".',
      'Received a voice message from Evelyn on Halloween night.',
    ],
    statement:
      '"I knew about 4B — she told me in September. She made me promise to keep everything secret until Thursday. She left me a voice message at 8:40 that night; I didn\'t listen to it until after I heard the news. ' +
      'I should have handed it over straight away. I\'m handing it over now."',
  },
  {
    id: 'leo', name: 'Leo Finch', role: 'The neighbor', age: 26,
    portrait: { skin: '#f0d3bd', hair: '#d9a441', hairStyle: 'swept', coat: '#141414', accent: '#7a2233', extra: 'cape' },
    summary: 'Aspiring actor in 4A, rehearsing a pop-up Dracula show in full costume on Halloween night.',
    background: [
      'Lives across the hall from 4B.',
      'Heard a crash and saw someone on the stairs.',
      'Told Marta about the crash at about 9:30.',
    ],
    statement:
      '"Around nine I heard a crash in 4B, and a few minutes later I saw the photographer guy leaving. Tall, dark coat. I\'m sure it was him. ' +
      'I was rehearsing — I\'m playing Dracula, that\'s why I\'m in the cape."',
  },
];

// Evidence block types: p, meta, table, hand (handwriting + transcript),
// messages, audio (transcript), note (investigator note), card, photos.
export const EVIDENCE = [
  // ---------- Stage 1 ----------
  {
    id: 'lease', stage: 1, title: 'Lease for Apartment 4B', kind: 'Document', art: 'lease',
    blurb: 'Thrown on the floor with the desk drawers.',
    blocks: [
      { type: 'meta', rows: [
        ['Property', 'Hollow House, 17 Ashgrove Street, New York'],
        ['Unit', '4B — one furnished room'],
        ['Tenant', 'Eva Reed'],
        ['Term', 'Month to month, from September 14'],
        ['Rent', '$1,450 per month, paid in cash, three months in advance'],
        ['Landlord\'s agent', 'Marta Bell'],
      ] },
      { type: 'hand', text: 'ID not copied — tenant asked.  M.B.', transcript: 'ID not copied — tenant asked. M.B.' },
      { type: 'note', text: 'The photo stapled to the tenant card is clearly Evelyn Vale.' },
    ],
  },
  {
    id: 'bag', stage: 1, title: 'Evelyn\'s shoulder bag', kind: 'Object', art: 'bag',
    blurb: 'Found on the armchair, closed.',
    blocks: [
      { type: 'table', head: ['Item', 'Notes'], rows: [
        ['Wallet', '$340 in cash and three credit cards, all present'],
        ['Keys', 'Two keys: Apartment 4B and the Hollow House front door'],
        ['Masquerade invitation', 'Vale Foundation masquerade, The Aldridge Hotel, 8 PM — unused'],
        ['Folded printout', 'A list of Hollow House payments with three lines circled in pencil'],
        ['Umbrella, reading glasses, lip balm', 'Ordinary items'],
      ] },
      { type: 'note', text: 'Her phone was found separately, under the sofa cushions. Its messages are reviewed in later stages.' },
    ],
  },
  {
    id: 'candlestick', stage: 1, title: 'Brass candlestick', kind: 'Photograph', art: 'candlestick',
    blurb: 'Lying on the rug near the sofa.',
    blocks: [
      { type: 'p', text: 'One of a matching pair that normally stands on the mantel. Its twin is still there. This one was lying on the rug near the sofa.' },
      { type: 'meta', rows: [
        ['Height / weight', '38 cm, about 2.1 kg — heavy'],
        ['Base', 'Square, with one corner dented'],
        ['Surface', 'Wiped: cloth smears, no fingerprints'],
        ['Inventory tag', '"Hollow House — 4B furnishings" (it belongs to the apartment)'],
      ] },
    ],
  },
  {
    id: 'window', stage: 1, title: 'Broken window', kind: 'Scene', art: 'window',
    blurb: 'The window onto the fire escape.',
    blocks: [
      { type: 'p', text: 'The window onto the fire escape is broken. Most of the glass lies outside on the fire escape. Only a few small fragments are on the floor inside.' },
      { type: 'p', text: 'Rain has soaked the sill. Two desk drawers have been pulled out and emptied onto the floor. Evelyn\'s laptop and a small television are still in the room.' },
      { type: 'note', text: 'No footprints on the wet fire escape.' },
    ],
  },
  {
    id: 'note', stage: 1, title: 'Handwritten note', kind: 'Note', art: 'note',
    blurb: 'Top page of a notepad on the desk.',
    blocks: [
      { type: 'hand',
        text: 'Thurs 9:00 — J. Okafor\n(Okafor & Lindqvist, independent audit)\nBring: ledger copies, Larkspur invoices,\nstatements from 2A, 4C, 5D\nAfter — talk to A. Return the ring.',
        transcript: 'Thursday 9:00 — J. Okafor (Okafor & Lindqvist, independent audit). Bring: ledger copies, Larkspur invoices, statements from 2A, 4C, 5D. After — talk to A. Return the ring.' },
      { type: 'note', text: 'Thursday is the morning after Halloween.' },
    ],
  },
  {
    id: 'cufflink', stage: 1, title: 'Gold cufflink', kind: 'Object', art: 'cufflink', optional: true,
    blurb: 'Found under the sofa.',
    blocks: [
      { type: 'p', text: 'Found under the sofa, about a meter from where Evelyn was found. Round, gold, engraved with a compass rose. The back is engraved "E & A". The clasp is bent open, as if it was pulled loose.' },
      { type: 'note', text: 'A cufflink proves nothing on its own. What matters is whose pair it belongs to, and when it was lost.' },
    ],
  },

  // ---------- Stage 2 ----------
  {
    id: 'noah_msg', stage: 2, title: 'Noah\'s angry message', kind: 'Messages', art: 'phone',
    blurb: 'Text messages from Evelyn\'s phone, Halloween evening.',
    blocks: [
      { type: 'messages', items: [
        { from: 'Noah Mercer', time: '6:58 PM', text: 'You don\'t get to just disappear on me again. I\'m coming over tonight whether you like it or not. We\'re finishing this.' },
        { from: 'Evelyn', time: '7:03 PM', text: 'Come if you must. I\'m not changing my mind about the photos.' },
        { from: 'Noah Mercer', time: '7:04 PM', text: 'Fine.' },
      ] },
    ],
  },
  {
    id: 'tessa_private', stage: 2, title: 'Evelyn\'s private message to Tessa', kind: 'Messages', art: 'phone',
    blurb: 'Handed over by Tessa the morning after.',
    blocks: [
      { type: 'messages', items: [
        { from: 'Evelyn', time: 'Oct 27, 11:12 PM', text: 'I\'m sure now. The numbers don\'t match anything the residents tell me. Please keep 4B and all of this between us until Thursday — not even Adrian. Especially not Adrian. If I\'m wrong about him I couldn\'t forgive myself for saying it out loud.' },
        { from: 'Tessa Quinn', time: 'Oct 27, 11:15 PM', text: 'I promise. Be careful.' },
      ] },
      { type: 'note', text: 'Tessa, when asked why she waited: "I made a promise. I sat with it all night before I understood that keeping it couldn\'t protect her anymore."' },
    ],
  },
  {
    id: 'minor_witnesses', stage: 2, title: 'Other witnesses', kind: 'Statements', art: 'statements',
    blurb: 'Caretaker, delivery rider and a masquerade guest.',
    blocks: [
      { type: 'statement', who: 'Walt Doyle, building caretaker',
        text: '"The back door\'s been chained and alarmed since September, after the package thefts. If you come in, you come in the front, past Marta\'s camera. I saw a young fellow with a camera bag buzz up a bit after eight. The rest of the night I was fighting that boiler again — I patch it every month."' },
      { type: 'statement', who: 'Rui Santos, delivery rider',
        text: '"I dropped noodles at 3A just before nine — 8:58 on my app. The hallway lights upstairs were flickering; they always do in that building. I heard a man\'s voice upstairs, low and angry. Couldn\'t make out the words."' },
      { type: 'statement', who: 'Henrietta Lowe, masquerade guest',
        text: '"Celeste sat beside me at the auction table from eight until we left at a quarter to ten. She only stood up to bid on the Hopper print, and she lost. Adrian kept slipping out — calls from Zurich, he said. He was gone a long while before the auction."' },
    ],
  },

  // ---------- Stage 3 ----------
  {
    id: 'payments', stage: 3, title: 'Trust payment records', kind: 'Document', art: 'ledger',
    blurb: 'Vale Housing Trust payments for Hollow House, last 12 months.',
    blocks: [
      { type: 'table', head: ['Date', 'Payee', 'Description', 'Amount', 'Approved by'], rows: [
        ['Jan 9', 'City Water Board', 'Water and sewer, annual', '$3,400', 'C. Vale'],
        ['Feb 14', 'Hudson Boiler Co.', 'Boiler service and patch repair', '$1,200', 'C. Vale'],
        ['Mar 3', 'Larkspur Property Services', 'Boiler replacement, complete', '$48,000', 'A. Cross'],
        ['Apr 22', 'Bell Maintenance (petty cash)', 'Bulbs, locks, cleaning supplies — receipts attached', '$410', 'C. Vale'],
        ['Jun 18', 'Larkspur Property Services', 'Roof membrane replacement', '$36,500', 'A. Cross'],
        ['Aug 5', 'Larkspur Property Services', 'Elevator modernization', '$27,800', 'A. Cross'],
        ['Sep 30', 'City Water Board', 'Quarterly adjustment', '$620', 'C. Vale'],
      ] },
      { type: 'note', text: 'Larkspur total: $112,300. The pencil circles on the printout in Evelyn\'s bag mark the three Larkspur lines.' },
    ],
  },
  {
    id: 'survey', stage: 3, title: 'Evelyn\'s resident notes', kind: 'Note', art: 'note',
    blurb: 'Handwritten notes from conversations with residents.',
    blocks: [
      { type: 'hand',
        text: '2A (Mrs. Alvarez) — boiler is "the same old monster".\nWalt patches it every month.\n4C (Mr. Hollis) — no roofers in 6 years.\nBucket under the skylight.\n5D (Ms. Osei) — elevator dead since spring.\nNobody ever came.\nSo what did Larkspur do for $112k??',
        transcript: '2A (Mrs. Alvarez): the boiler is "the same old monster"; Walt patches it every month. 4C (Mr. Hollis): no roofers in six years; a bucket under the skylight. 5D (Ms. Osei): the elevator has not worked since spring; nobody ever came. So what did Larkspur do for $112,000?' },
    ],
  },
  {
    id: 'registry', stage: 3, title: 'Vendor registry extract', kind: 'Document', art: 'registry',
    blurb: 'Public business registration record.',
    blocks: [
      { type: 'meta', rows: [
        ['Business name', 'Larkspur Property Services LLC'],
        ['Formed', 'February 2 of this year'],
        ['Registered address', '410 Pearl Street, Suite 1104, New York, NY'],
        ['Organizer', 'AC Holdings LLC'],
        ['Employees listed', 'None'],
        ['Website / phone', 'None listed'],
      ] },
      { type: 'note', text: 'Larkspur was formed one month before its first $48,000 payment.' },
    ],
  },
  {
    id: 'auditor_email', stage: 3, title: 'Auditor correspondence', kind: 'Email', art: 'email',
    blurb: 'Emails between Evelyn and an independent auditor.',
    blocks: [
      { type: 'messages', items: [
        { from: 'Evelyn Vale → Joanna Okafor', time: 'Oct 28, 7:40 AM', text: 'Ms. Okafor, thank you for agreeing to an independent review of the Vale Housing Trust. I have evidence that one vendor was paid for work that was never done at Hollow House. The approvals come from someone close to me, so I would rather explain in person, with the documents. Thursday at 9:00 at your office?' },
        { from: 'Joanna Okafor → Evelyn Vale', time: 'Oct 28, 10:05 AM', text: 'Thursday at 9:00 is confirmed. Please bring copies of everything, and do not alert the person concerned before we meet. — J. Okafor, Okafor & Lindqvist' },
      ] },
    ],
  },
  {
    id: 'insurance', stage: 3, title: 'Life insurance summary', kind: 'Document', art: 'registry',
    blurb: 'Halvorsen Mutual policy summary.',
    blocks: [
      { type: 'meta', rows: [
        ['Insured', 'Evelyn Vale'],
        ['Type', 'Term life'],
        ['Benefit', '$5,000,000'],
        ['Beneficiary', 'Adrian Cross (fiancé) — revocable'],
        ['Contingent beneficiary', 'Vale Foundation'],
        ['Issued', '14 months ago, at the engagement, as part of the couple\'s pre-marriage financial agreement'],
        ['Last change', 'None'],
      ] },
      { type: 'note', text: 'During a homicide investigation, payment is held until the beneficiary is cleared.' },
    ],
  },
  {
    id: 'inheritance', stage: 3, title: 'Celeste\'s letter to the family attorney', kind: 'Letter', art: 'email',
    blurb: 'Dated October 20.',
    blocks: [
      { type: 'p', text: '"Graham — Evelyn tells me that on her thirtieth birthday she intends to replace the family trustees with an independent board, and she has started an \'audit\' of her mother\'s housing trust. I have served that trust for eleven years. I will not be pushed aside, and I will not watch her drag the Vale name through the newspapers over a few repair bills. Please tell me what we can do to slow this down. — Celeste"' },
      { type: 'note', text: 'Celeste approved routine payments only. None of the Larkspur payments carry her approval.' },
    ],
  },

  // ---------- Stage 4 ----------
  {
    id: 'camera', stage: 4, title: 'Entrance camera log', kind: 'Camera stills', art: 'camera',
    blurb: 'Hollow House front door camera. Clock synced to network time.',
    blocks: [
      { type: 'table', head: ['Time', 'Direction', 'What the frame shows'], rows: [
        ['8:10:14 PM', 'In', 'Man in a denim jacket with a camera bag (Noah Mercer — he confirms)'],
        ['8:25:40 PM', 'Out', 'Same man, walking fast'],
        ['8:47:02 PM', 'In', 'Man in a long black overcoat and polished formal shoes. Feathered half-mask pushed up onto his forehead; face clearly visible: Adrian Cross'],
        ['8:57:20 PM', 'In', 'Delivery rider with an insulated bag, buzzed in by 3A'],
        ['9:00:05 PM', 'Out', 'Delivery rider'],
        ['9:08:31 PM', 'Out', 'Same man in the black overcoat, mask down, collar up, right hand pressed over his left wrist'],
      ] },
      { type: 'note', text: 'No other non-residents entered between 8:00 and 9:40 PM. The rear door is chained and alarmed.' },
    ],
  },
  {
    id: 'shop_footage', stage: 4, title: 'Market receipt and footage', kind: 'Receipt', art: 'receipt',
    blurb: 'Ortiz Corner Market, four blocks from Hollow House.',
    blocks: [
      { type: 'meta', rows: [
        ['Receipt time', '8:32 PM'],
        ['Items', 'Large coffee, egg sandwich — $9.75'],
        ['Card', 'Ending 4471 (Noah Mercer)'],
      ] },
      { type: 'p', text: 'Footage summary: the market camera shows Noah entering at 8:31 PM and paying at 8:32. He then sits at the window counter, editing photos on his laptop, until he leaves at 9:14 PM. He never leaves the frame.' },
      { type: 'statement', who: 'Luis Ortiz, cashier', text: '"Kid looked like somebody broke his heart. Sat there forty minutes nursing one coffee."' },
    ],
  },
  {
    id: 'voice_msg', stage: 4, title: 'Evelyn\'s voice message to Tessa', kind: 'Audio', art: 'audio',
    blurb: 'Voicemail, 8:40 PM, 38 seconds.',
    blocks: [
      { type: 'audio', label: 'Voicemail from Evelyn Vale to Tessa Quinn — 8:40 PM, 0:38',
        transcript: 'Tess, it\'s me. Noah came by, we yelled, he\'s gone — I\'m fine, honestly. I\'m just so tired of people who think I owe them something. Anyway. Tomorrow at nine, Okafor. Keep it between us until then, okay? Love you. Bye.' },
      { type: 'note', text: 'Phone records confirm the call was made from Evelyn\'s phone at 8:40 PM.' },
    ],
  },
  {
    id: 'msg_851', stage: 4, title: 'Evelyn\'s text to the auditor', kind: 'Messages', art: 'phone',
    blurb: 'Provided by Joanna Okafor.',
    blocks: [
      { type: 'messages', items: [
        { from: 'Evelyn Vale', time: '8:51 PM', text: 'Adrian is here. He wasn\'t supposed to know about this place. I\'ll call you after.' },
        { from: 'Joanna Okafor', time: '8:52 PM', text: 'Are you safe? Call me.' },
      ] },
      { type: 'note', text: 'Evelyn never replied.' },
    ],
  },
  {
    id: 'party_photos', stage: 4, title: 'Masquerade photographs', kind: 'Photographs', art: 'photos',
    blurb: 'Two photos of Adrian at the Aldridge Hotel.',
    blocks: [
      { type: 'photos', items: [
        { label: 'Photo A — posted by Adrian', art: 'photoA',
          caption: 'Adrian raises a glass beside a candelabra. Both shirt cuffs are visible, each with a gold cufflink.',
          meta: [['Captured', '8:22 PM (camera time, read from the original file)'], ['Uploaded', '9:14 PM (when the post went online)']] },
        { label: 'Photo B — official event photographer', art: 'photoB',
          caption: 'Adrian at the auction podium. His left shirt cuff hangs open with no cufflink. His right cuff still has a gold cufflink.',
          meta: [['Captured', '9:26 PM'], ['Verified', 'Photographer\'s camera clock checked against the event livestream, which shows the same moment at 9:26 PM']] },
      ] },
      { type: 'note', text: 'Capture time is when the camera took the picture. Upload time is when the file was posted online. A photo can be uploaded long after it was taken.' },
    ],
  },
  {
    id: 'medical', stage: 4, title: 'Medical examiner\'s summary', kind: 'Report', art: 'registry',
    blurb: 'Plain-language summary for investigators.',
    blocks: [
      { type: 'meta', rows: [
        ['Estimated time of death', 'Between 8:55 and 9:05 PM'],
        ['Cause', 'A single blow to the head from a heavy object with a square edge'],
        ['Object', 'The dented corner of the brass candlestick base matches the injury'],
        ['Other', 'No sign that Evelyn was moved after she fell'],
      ] },
    ],
  },
  {
    id: 'leo_revised', stage: 4, title: 'Leo\'s second statement', kind: 'Statement', art: 'statements',
    blurb: 'Given the next morning.',
    blocks: [
      { type: 'statement', who: 'Leo Finch, neighbor',
        text: '"I said it was the photographer. I\'d seen him on the stairs earlier, so when I saw a tall man in a dark coat I just filled in the rest. Honestly? I heard the crash at 9:03 — I know because my scene runs eleven minutes and I\'d just started it. A couple of minutes later I saw his back going down the stairs. A long black overcoat. Shiny shoes, like for a wedding. Something feathery in his hand. Not denim. No camera bag."' },
    ],
  },
];

export const EVIDENCE_BY_ID = Object.fromEntries(EVIDENCE.map((e) => [e.id, e]));

// Apartment hotspots (percent positions over the scene illustration).
export const HOTSPOTS = [
  { id: 'bag', label: 'Shoulder bag on the armchair', x: 18, y: 62, required: true },
  { id: 'lease', label: 'Papers from the emptied desk drawers', x: 79, y: 80, required: true },
  { id: 'note', label: 'Notepad on the desk', x: 94, y: 45, required: true },
  { id: 'candlestick', label: 'Candlestick on the rug', x: 47, y: 83, required: true },
  { id: 'window', label: 'Broken window', x: 61, y: 27, required: true },
  { id: 'cufflink', label: 'Something under the sofa', x: 34, y: 76, required: false },
];

export const STAGE_TASKS = {
  1: ['s1_observation'],
  2: ['s2_classify'],
  3: ['s3_money'],
  4: ['s4_timeline', 's4_alibi', 's4_contradictions'],
  5: ['s5_board'],
};

export const Q = {
  s1: {
    alias: { prompt: 'Under what name did Evelyn rent Apartment 4B?', options: [
      ['eva_reed', 'Eva Reed'], ['evelyn', 'Evelyn Vale'], ['marta', 'Marta Bell'], ['e_cross', 'E. Cross']] },
    staged: { prompt: 'Which two observations suggest the burglary was staged? Choose two.', options: [
      ['glass_outside', 'Most of the window glass fell outside, onto the fire escape'],
      ['cash_left', 'The wallet still holds $340 and all of its cards'],
      ['drawers', 'Two desk drawers were pulled out and emptied'],
      ['rain', 'Rain had soaked the windowsill'],
      ['invitation', 'The masquerade invitation was unused']] },
    weapon: { prompt: 'Which object was most likely used as the weapon?', options: [
      ['candlestick', 'The brass candlestick on the rug'], ['glass', 'A piece of window glass'],
      ['umbrella', 'Evelyn\'s umbrella'], ['laptop', 'The laptop']] },
  },
  s2: {
    intro: 'Mark each claim. Confirmed means something other than the speaker\'s own word supports it: a document, an independent witness, or an admission that makes the speaker look worse. Unverified means it rests only on the speaker\'s word so far.',
    claims: [
      ['noah_visit', 'Noah went to Apartment 4B that evening.'],
      ['adrian_party', 'Adrian was at the masquerade all evening.'],
      ['marta_knew', 'Marta knew that "Eva Reed" was Evelyn Vale.'],
      ['leo_noah', 'The man Leo saw leaving after the crash was Noah.'],
      ['tessa_knew', 'Tessa knew about the secret apartment.'],
      ['celeste_party', 'Celeste was at the masquerade all evening.'],
    ],
  },
  s3: {
    purpose: { prompt: 'Why did Evelyn rent Apartment 4B?', options: [
      ['hide', 'To hide from Noah'], ['residents', 'To meet residents and compare their accounts with the trust\'s records'],
      ['escape', 'To avoid the family masquerade'], ['buy', 'To inspect the building before buying it']] },
    payee: { prompt: 'Which payee is suspicious?', options: [
      ['city_water', 'City Water Board'], ['hudson', 'Hudson Boiler Co.'], ['larkspur', 'Larkspur Property Services'], ['bell', 'Bell Maintenance (petty cash)']] },
    link: { prompt: 'Who is connected to that payee?', options: [
      ['adrian', 'Adrian Cross'], ['celeste', 'Celeste Vale'], ['marta', 'Marta Bell'], ['noah', 'Noah Mercer']] },
  },
  s4: {
    timeline: [
      ['discovery', 'Marta finds Evelyn and calls emergency services'],
      ['voice_msg', 'Evelyn leaves Tessa a voice message'],
      ['adrian_leaves', 'Adrian leaves Hollow House'],
      ['noah_arrives', 'Noah arrives at Hollow House'],
      ['photo_b', 'Party photo B is captured at the auction podium'],
      ['msg_851', 'Evelyn texts the auditor'],
      ['noah_shop', 'Noah pays for coffee at Ortiz Corner Market'],
      ['photo_a_upload', 'Adrian posts party photo A online'],
      ['crash', 'Leo hears a crash'],
      ['photo_a_taken', 'Party photo A is captured at the masquerade'],
      ['adrian_enters', 'Adrian enters Hollow House'],
      ['noah_leaves', 'Noah leaves Hollow House'],
    ],
    alibi: { prompt: 'Whose alibi fails?', options: [
      ['noah', 'Noah — at Ortiz Corner Market'], ['adrian', 'Adrian — at the masquerade'],
      ['celeste', 'Celeste — at the auction table'], ['marta', 'Marta — at home on the ground floor']] },
    reason: { prompt: 'Why does it fail?', options: [
      ['capture_before', 'The photo was captured at 8:22 PM, before he entered Hollow House. 9:14 PM is only when it was uploaded.'],
      ['blurry', 'The photo is too dark to identify him.'],
      ['wrong_party', 'The photo was taken at a different party.'],
      ['edited', 'The photo has been digitally edited.']] },
    contradictions: [
      ['c_adrian_never_left', 'Adrian: "I never left the masquerade."'],
      ['c_leo_noah', 'Leo (first statement): "The man on the stairs after the crash was Noah."'],
      ['c_photo_914', 'Adrian: "My photo shows I was at the party at 9:14."'],
    ],
    contradictionOptions: ['camera', 'msg_851', 'shop_footage', 'party_photos', 'medical', 'voice_msg', 'leo_revised'],
  },
  s5: {
    d1: { prompt: 'The photo Adrian offered as his alibi…', options: [
      ['edited', '…was digitally edited to place him at the party.'],
      ['capture_before', '…was captured at 8:22 PM, before he entered Hollow House. Only the upload was at 9:14 PM.'],
      ['other_party', '…was taken at a different event.']] },
    d2: { prompt: 'The cufflink under the sofa…', options: [
      ['proves_alone', '…proves who the killer is by itself, because it is gold.'],
      ['noah', '…belongs to Noah, who photographs jewelry.'],
      ['matches_missing', '…matches the engraved pair Evelyn gave Adrian, and one is missing in the 9:26 PM photo.']] },
    d3: { prompt: 'The burglary…', options: [
      ['real', '…was real; the burglar escaped by the fire escape.'],
      ['staged', '…was staged: the glass fell outward and the cash was left behind.'],
      ['earlier', '…happened earlier in the week.']] },
  },
  s6: {
    motive: [
      ['insurance', 'To collect the $5 million life insurance'],
      ['fraud', 'To stop Evelyn exposing fraud against the housing trust'],
      ['jealousy', 'Jealousy after the end of a relationship'],
      ['inheritance', 'To keep control of the family trusts and inheritance']],
    weapon: [
      ['candlestick', 'Brass candlestick'], ['glass', 'Window glass'], ['poker', 'Fireplace poker']],
  },
};

export const SUSPECT_IDS = ['adrian', 'noah', 'marta', 'celeste', 'tessa', 'leo'];
