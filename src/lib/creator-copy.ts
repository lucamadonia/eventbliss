/**
 * Die Texte des persoenlichen Influencer-Bereichs.
 *
 * WARUM NEU GESCHRIEBEN: die erste Fassung war Verwaltungssprache — "Hier
 * steht, was vereinbart ist, was ansteht und wie du deinen Zugang einloest."
 * Das erklaert eine Oberflaeche und gibt einem Menschen keinen einzigen Grund,
 * ueber EventBliss zu sprechen. Es fehlte der ganze erste Schritt.
 *
 * DIE DRAMATURGIE steht fest und ist absichtlich in dieser Reihenfolge:
 *
 *   1. DAS THEMA  — dein Publikum kennt dieses Chaos. Du musst nichts
 *                   erklaeren, nur zeigen.
 *   2. DIE NAEHE  — wir bauen gerade auf. Deine Stimme zaehlt hier mehr als
 *                   bei einer Marke mit Marketingabteilung.
 *   3. WAS DU BEKOMMST — erst hier Premium, Provision, Honorar.
 *
 * Mit der Verguetung anzufangen waere der Fehler: austauschbar, und ohne
 * Zahlen wirkt es duenn. Mit dem Thema anzufangen traegt, weil das Thema
 * ohnehin funktioniert.
 *
 * HANDWERK: zweite Person, Alltagssprache, kurze Saetze neben langen. Keine
 * Zahl, die nicht nachgezaehlt ist (22 Spiele ja, Nutzerzahlen nein). Kein
 * "innovativ", "einzigartig", "Mehrwert". Jeder Abschnitt endet konkret.
 */

export interface CreatorCopy {
  metaTitle: string;
  metaDescription: string;

  tabStart: string;
  tabBriefing: string;
  tabTasks: string;
  tabMaterial: string;
  tabTemplates: string;

  greeting: (name: string) => string;
  greetingSub: string;

  /* 1. Das Thema */
  themeKicker: string;
  themeTitle: string;
  themeBody: string[];
  themePoints: { title: string; body: string }[];
  themeClose: string;

  /* 2. Die Naehe */
  closeKicker: string;
  closeTitle: string;
  closeBody: string[];

  /* 3. Was du bekommst */
  rewardKicker: string;
  rewardTitle: string;
  rewardIntro: string;
  noDeal: string;
  trial: (m: number) => string;
  unlimited: string;
  commission: (r: number) => string;
  fee: string;
  accessActive: string;
  accessUnlimited: string;
  accessUntil: (d: string) => string;
  codeTitle: string;
  codeHint: string;
  redeem: string;

  /* Briefing */
  briefingTitle: string;
  briefingEmpty: string;
  message: string;
  dos: string;
  donts: string;
  linking: string;
  disclosure: string;
  disclosureHint: (x: string) => string;
  approval: string;
  window: string;

  /* Aufgaben */
  tasksTitle: string;
  tasksIntro: string;
  noTasks: string;
  due: string;
  submit: string;
  submitted: string;
  approved: string;
  proofPlaceholder: string;
  thanks: string;

  /* Material */
  materialTitle: string;
  materialIntro: string;
  storyTilesTitle: string;
  storyTilesHint: string;

  /* Vorlagen */
  templatesTitle: string;
  templatesHint: string;

  contact: string;
  invalid: string;
  copied: string;
}

const de: CreatorCopy = {
  metaTitle: "Dein Bereich — EventBliss",
  metaDescription: "Was vereinbart ist, was ansteht, und das Material dazu.",

  tabStart: "Start",
  tabBriefing: "Briefing",
  tabTasks: "Aufgaben",
  tabMaterial: "Material",
  tabTemplates: "Vorlagen",

  greeting: (name) => `Hallo ${name}`,
  greetingSub: "Schön, dass du da bist. Drei Minuten, dann weißt du, worum es geht.",

  themeKicker: "Warum das funktioniert",
  themeTitle: "Dein Publikum kennt dieses Chaos",
  themeBody: [
    "Zehn Leute, drei Gruppenchats, niemand entscheidet. Einer legt aus, zwei vergessen es, am Ende rechnet keiner nach. Jeder, der schon mal etwas mit einer Gruppe geplant hat, kennt genau diesen Ablauf.",
    "Das ist der Punkt: Du musst hier kein Produkt erklären. Du zeigst eine Situation, die dein Publikum sofort wiedererkennt — und daneben, wie sie aussieht, wenn sie an einem Ort stattfindet statt in drei Chats.",
  ],
  themePoints: [
    {
      title: "Das Vorher-Nachher",
      body: "Screenshot vom eigenen Gruppenchat, daneben die Planung mit Termin, Ideen und Budget. Mehr braucht es nicht.",
    },
    {
      title: "Die Abrechnung",
      body: "Ausgaben eintragen, aufteilen — gleichmäßig oder nach Anteilen — und am Ende steht, wer wem was schuldet. Der unangenehmste Teil jeder Gruppenreise, in dreißig Sekunden erzählt.",
    },
    {
      title: "Der Abend selbst",
      body: "22 Party-Spiele, alle spielen am eigenen Handy mit, das Spiel läuft auf dem Fernseher. Echte Reaktionen, kein Schnittgewitter nötig.",
    },
  ],
  themeClose:
    "Drei Blickwinkel, drei Beiträge. Und keiner davon klingt nach Werbung, weil in allen dreien etwas passiert.",

  closeKicker: "Warum jetzt",
  closeTitle: "Du bist früh dabei — und das merkt man",
  closeBody: [
    "Wir bauen gerade auf. Was du uns sagst, landet nicht in einer Marketingabteilung, sondern direkt bei den Leuten, die die App bauen. Wenn dir eine Funktion fehlt oder etwas im Weg steht, kann das in wenigen Wochen drin sein.",
    "Bei einer großen Marke bist du eine Zeile im Mediaplan. Hier bist du einer von wenigen, die das Programm mitprägen — und das ist der Unterschied, den man deinen Beiträgen ansieht.",
    "Dafür erwarten wir keine Begeisterung, die du nicht hast. Wenn dir etwas nicht gefällt, sag es uns. Das ist uns lieber als ein Beitrag, dem man das Bemühen ansieht.",
  ],

  rewardKicker: "Deine Seite",
  rewardTitle: "Was du bekommst",
  rewardIntro: "Das hier ist unsere Vereinbarung — schwarz auf weiß, damit es keine Missverständnisse gibt.",
  noDeal:
    "Noch ist nichts vereinbart. Sobald wir uns einig sind, steht hier genau, was du bekommst und bis wann.",
  trial: (m) => `${m} Monate Premium`,
  unlimited: "Premium, unbegrenzt",
  commission: (r) => `${r} % Provision je Neukunde`,
  fee: "Honorar vereinbart",
  accessActive: "Dein Zugang ist aktiv",
  accessUnlimited: "Premium ohne Ablaufdatum. Du musst nichts einlösen.",
  accessUntil: (d) => `Premium bis ${d}. Läuft bereits — du musst nichts tun.`,
  codeTitle: "Dein Zugangscode",
  codeHint:
    "Anmelden, Code eingeben, fertig. Die Laufzeit beginnt erst mit dem Einlösen — du kannst dir also Zeit lassen. Der Code selbst gilt 60 Tage.",
  redeem: "Jetzt einlösen",

  briefingTitle: "Dein Briefing",
  briefingEmpty: "Noch kein Briefing hinterlegt. Sobald wir wissen, worauf du Lust hast, steht es hier.",
  message: "Darum geht es",
  dos: "Das trägt",
  donts: "Das lieber nicht",
  linking: "Verlinkung",
  disclosure: "Kennzeichnung",
  disclosureHint: (x) =>
    `Bitte als „${x}" kennzeichnen. Das ist Pflicht, sobald du eine Gegenleistung bekommst — und es schützt in erster Linie dich.`,
  approval: "Vor der Veröffentlichung schauen wir einmal kurz drauf.",
  window: "Veröffentlichung",

  tasksTitle: "Was ansteht",
  tasksIntro:
    "Wenn eine Frist nicht passt, sag vorher Bescheid. Verschieben ist einfach — Schweigen ist das Problem.",
  noTasks: "Noch keine Aufgaben.",
  due: "fällig",
  submit: "Link einreichen",
  submitted: "Eingereicht",
  approved: "Freigegeben",
  proofPlaceholder: "Link zum Beitrag",
  thanks: "Danke — wir schauen es uns an.",

  materialTitle: "Material",
  materialIntro:
    "Alles fertig zum Mitnehmen: Texte zum Kopieren, Bilder, Story-Kacheln. Nichts davon musst du verwenden — es soll dir nur die Arbeit abnehmen, die keine Arbeit sein muss.",
  storyTilesTitle: "Story-Kacheln",
  storyTilesHint:
    "Fertig im Hochformat, direkt zum Hochladen. Wenn du deinen eigenen Code hast, schreib ihn darüber.",

  templatesTitle: "Alle Vorlagen",
  templatesHint:
    "Zum Stöbern. Du musst dich an keine halten — sie zeigen nur, was bei anderen funktioniert hat.",

  contact: "Fragen? Schreib an",
  invalid: "Dieser Link ist nicht (mehr) gültig.",
  copied: "Kopiert",
};

const en: CreatorCopy = {
  metaTitle: "Your area — EventBliss",
  metaDescription: "What we agreed, what is coming up, and the material for it.",

  tabStart: "Start",
  tabBriefing: "Brief",
  tabTasks: "Tasks",
  tabMaterial: "Material",
  tabTemplates: "Templates",

  greeting: (name) => `Hi ${name}`,
  greetingSub: "Good to have you here. Three minutes and you will know what this is about.",

  themeKicker: "Why this works",
  themeTitle: "Your audience knows this chaos",
  themeBody: [
    "Ten people, three group chats, nobody deciding. One person fronts the money, two forget, and at the end nobody adds it up. Anyone who has ever planned something with a group knows exactly this.",
    "That is the point: you do not have to explain a product here. You show a situation your audience recognises instantly — and next to it, what it looks like when it happens in one place instead of three chats.",
  ],
  themePoints: [
    {
      title: "The before and after",
      body: "A screenshot of your own group chat, next to the planning with date, ideas and budget. Nothing else needed.",
    },
    {
      title: "The settlement",
      body: "Enter expenses, split them — evenly or by shares — and at the end it shows who owes whom. The most awkward part of any group trip, told in thirty seconds.",
    },
    {
      title: "The evening itself",
      body: "22 party games, everyone plays from their own phone, the game runs on the TV. Real reactions, no fast cuts required.",
    },
  ],
  themeClose:
    "Three angles, three posts. And none of them sounds like an ad, because in all three something actually happens.",

  closeKicker: "Why now",
  closeTitle: "You are early — and it shows",
  closeBody: [
    "We are still building. What you tell us does not land in a marketing department; it lands with the people who build the app. If something is missing or in your way, it can be in there within weeks.",
    "At a large brand you are a line in a media plan. Here you are one of a few people shaping the programme — and that difference is visible in what you post.",
    "In return we do not expect enthusiasm you do not have. If you dislike something, tell us. We prefer that to a post that visibly took effort.",
  ],

  rewardKicker: "Your side",
  rewardTitle: "What you get",
  rewardIntro: "This is our agreement, in writing, so there is nothing to misremember.",
  noDeal: "Nothing agreed yet. Once we are, this will say exactly what you get and until when.",
  trial: (m) => `${m} months of Premium`,
  unlimited: "Premium, unlimited",
  commission: (r) => `${r}% commission per new customer`,
  fee: "Fee agreed",
  accessActive: "Your access is active",
  accessUnlimited: "Premium with no end date. Nothing to redeem.",
  accessUntil: (d) => `Premium until ${d}. Already running — nothing to do.`,
  codeTitle: "Your access code",
  codeHint:
    "Sign up, enter the code, done. The period starts when you redeem it, so there is no rush. The code itself is valid for 60 days.",
  redeem: "Redeem now",

  briefingTitle: "Your brief",
  briefingEmpty: "No brief yet. Once we know what you fancy doing, it will show up here.",
  message: "What it is about",
  dos: "This carries",
  donts: "Better avoided",
  linking: "Tagging",
  disclosure: "Disclosure",
  disclosureHint: (x) =>
    `Please label it "${x}". That is required as soon as you receive anything in return — and it protects you first of all.`,
  approval: "We will take a quick look before you publish.",
  window: "Publishing window",

  tasksTitle: "What is coming up",
  tasksIntro: "If a deadline does not work, tell us beforehand. Moving it is easy — silence is the problem.",
  noTasks: "No tasks yet.",
  due: "due",
  submit: "Submit link",
  submitted: "Submitted",
  approved: "Approved",
  proofPlaceholder: "Link to the post",
  thanks: "Thank you — we will take a look.",

  materialTitle: "Material",
  materialIntro:
    "Everything ready to take with you: copy-ready text, images, story tiles. None of it is required — it is here to remove the work that does not need to be work.",
  storyTilesTitle: "Story tiles",
  storyTilesHint:
    "Ready in portrait format, straight to upload. If you have your own code, write it across the top.",

  templatesTitle: "All templates",
  templatesHint:
    "To browse. You are not bound to any of them — they only show what has worked for others.",

  contact: "Questions? Write to",
  invalid: "This link is no longer valid.",
  copied: "Copied",
};

export function creatorCopy(lang: string | null | undefined): CreatorCopy {
  return lang === "de" ? de : en;
}
