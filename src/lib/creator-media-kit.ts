/**
 * Das Media-Kit im persoenlichen Influencer-Bereich.
 *
 * Steht JEDEM Influencer mit gueltigem Token zur Verfuegung — auch bevor ein
 * Deal aktiv ist. Wer angeschrieben wird, soll nachsehen koennen, worum es
 * geht, ohne zu fragen: Beschreibungstexte zum Kopieren, belegbare Zahlen,
 * Beispieltexte, Hashtags, Bilder.
 *
 * ALLE ZAHLEN SIND CODE-VERIFIZIERT (Stand 2026-08-26):
 *   22 Party-Spiele  — Zaehlung aus src/pages/GamesHub.tsx
 *   10 Sprachen      — SEO_LANGS in src/lib/seo-routes.ts
 *   Web, iOS, Android; TV-Modus; Kostenteilung; Agentur-Marktplatz
 *
 * KEINE STORE-LINKS: im Code stehen nur Konto- und AGB-Adressen der Stores,
 * keine Produktseiten. Erfundene Links waeren schlimmer als gar keine —
 * verlinkt wird deshalb event-bliss.com.
 *
 * KEINE NUTZERZAHLEN: nicht verifiziert, also nicht behauptet. Ein Influencer,
 * der eine erfundene Zahl weitertraegt, steht damit allein da.
 *
 * DIE BILDER LIEGEN UNTER /press/ und stammen aus src/assets — dieselben
 * Dateien, die die App selbst benutzt. Sie wurden dorthin kopiert, weil
 * gebuendelte Assets eine Adresse mit Hash bekommen, die sich bei jedem Build
 * aendert; ein Media-Kit braucht Adressen, die morgen noch gelten.
 */

export interface MediaKitAsset {
  label: string;
  url: string;
  hint: string;
}

export interface MediaKit {
  title: string;
  intro: string;
  boilerplateTitle: string;
  boilerplateShort: string;
  boilerplateLong: string;
  factsTitle: string;
  facts: string[];
  captionsTitle: string;
  captionsHint: string;
  captions: string[];
  hashtagsTitle: string;
  hashtagSets: { label: string; tags: string[] }[];
  linksTitle: string;
  links: { label: string; url: string }[];
  brandTitle: string;
  brandColors: { label: string; value: string }[];
  assetsTitle: string;
  assets: MediaKitAsset[];
  screenshotTitle: string;
  screenshotHint: string;
  rulesTitle: string;
  rules: string[];
  copy: string;
}

const SITE = "https://event-bliss.com";

const de: MediaKit = {
  title: "Media-Kit",
  intro:
    "Alles, was du brauchst, ohne nachzufragen: Texte zum Kopieren, belegbare Zahlen, Hashtags und Bilder. Nichts davon musst du verwenden — es soll dir nur Arbeit sparen.",

  boilerplateTitle: "Beschreibung zum Kopieren",
  boilerplateShort:
    "EventBliss ist die App, in der Gruppen ihren Junggesellenabschied, Geburtstag oder Städtetrip gemeinsam planen — Termine, Ideen, Budget, Kostenteilung und 22 Party-Spiele an einem Ort.",
  boilerplateLong:
    "EventBliss bündelt, was bei Gruppenplanung sonst in drei Chats auseinanderfällt: Termin abstimmen, Ideen sammeln, Budget festhalten, Ausgaben eintragen und am Ende sehen, wer wem was schuldet. Dazu 22 Party-Spiele, bei denen alle am eigenen Handy mitspielen — auf Wunsch mit dem Fernseher als Spielfeld. Die App gibt es für iPhone, Android und im Browser, in zehn Sprachen. Planen ist kostenlos.",

  factsTitle: "Zahlen, die stimmen",
  facts: [
    "22 Party-Spiele, alle ohne Installation im Browser spielbar",
    "TV-Modus: das Spiel läuft auf dem Fernseher, gespielt wird am Handy",
    "Zehn Sprachen: Deutsch, Englisch, Spanisch, Französisch, Italienisch, Portugiesisch, Niederländisch, Polnisch, Türkisch, Arabisch",
    "Für iPhone, Android und im Browser",
    "Kostenteilung mit gleichmäßiger Aufteilung, Anteilen und mehreren Zahlern",
    "Planung ist kostenlos; Premium ist optional",
  ],

  captionsTitle: "Beispieltexte",
  captionsHint:
    "Als Ausgangspunkt gedacht, nicht zum Abschreiben. In deinen Worten wirkt es immer besser.",
  captions: [
    "Zehn Leute, drei Gruppenchats, keiner entscheidet. Wir haben den JGA diesmal in einer App geplant — Termin, Ideen, Budget, und am Ende stand da, wer wem was schuldet. Link ist oben. #Werbung",
    "Wir haben den Abend mit einem Spiel gestartet, das auf dem Fernseher lief und bei dem alle am Handy mitgespielt haben. Es gibt 22 davon. #Werbung",
    "Der unangenehme Teil jeder Gruppenreise: die Abrechnung. Ich habe alle Ausgaben eingetragen und die App hat aufgeteilt — auch ungleich, wenn nicht alle bei allem dabei waren. #Werbung",
  ],

  hashtagsTitle: "Hashtags",
  hashtagSets: [
    { label: "JGA", tags: ["#jga", "#junggesellenabschied", "#jgaplanung", "#eventbliss"] },
    { label: "Spiele", tags: ["#partyspiele", "#spieleabend", "#gruppenspiele", "#eventbliss"] },
    { label: "Reise", tags: ["#gruppenreise", "#städtetrip", "#reiseplanung", "#eventbliss"] },
    { label: "Feiern", tags: ["#geburtstagsparty", "#hochzeitsplanung", "#eventbliss"] },
  ],

  linksTitle: "Links",
  links: [
    { label: "Website", url: SITE },
    { label: "Spiele-Übersicht", url: `${SITE}/games` },
    { label: "Anbieter-Marktplatz", url: `${SITE}/marketplace` },
    { label: "Datenschutz", url: `${SITE}/legal/privacy` },
  ],

  brandTitle: "Farben",
  brandColors: [
    { label: "Violett", value: "#A855F7" },
    { label: "Pink", value: "#EC4899" },
    { label: "Grün", value: "#10B981" },
    { label: "Dunkel", value: "#0B0B12" },
  ],

  assetsTitle: "Bilder und Logos",
  assets: [
    { label: "Logo", url: `${SITE}/press/eventbliss-logo.png`, hint: "Wortmarke, freigestellt" },
    { label: "App-Symbol", url: `${SITE}/press/eventbliss-icon.png`, hint: "Quadratisch, für Profilbilder und Sticker" },
    { label: "Titelbild", url: `${SITE}/press/hero-image.png`, hint: "Großes Motiv für Titel und Vorschau" },
    { label: "Geräte-Ansicht", url: `${SITE}/press/multi-device-mockup.png`, hint: "App auf Handy und Fernseher" },
    { label: "Planung", url: `${SITE}/press/feature-planning.png`, hint: "Termine und Programm" },
    { label: "Abstimmung", url: `${SITE}/press/feature-voting.png`, hint: "Die Gruppe entscheidet gemeinsam" },
    { label: "Kostenteilung", url: `${SITE}/press/feature-bill-splitting.png`, hint: "Wer schuldet wem" },
    { label: "Ausgaben", url: `${SITE}/press/feature-expense-tracking.png`, hint: "Ausgaben eintragen und behalten" },
    { label: "Teilen-Bild (1200 × 630)", url: `${SITE}/og-image.png`, hint: "Für Vorschaubilder und Thumbnails" },
    { label: "App-Symbol (512 × 512)", url: `${SITE}/pwa-512x512.png`, hint: "Kleinere Fassung, etwa für Stories" },
  ],

  screenshotTitle: "Bildschirmfotos",
  screenshotHint:
    "Nimm sie am besten selbst aus der App auf — echte Planung mit euren Namen wirkt stärker als jedes gestellte Werbebild. Achte darauf, dass keine fremden Namen, Adressen oder Beträge zu sehen sind.",

  rulesTitle: "Was wir uns wünschen",
  rules: [
    "Kennzeichne den Beitrag als Werbung — das ist Pflicht, nicht Höflichkeit.",
    "Zeig die App im Gebrauch, statt sie zu beschreiben.",
    "Nenne keine Nutzer- oder Downloadzahlen; wir geben keine heraus, weil sie nicht geprüft sind.",
    "Sag nicht, die App plane von allein — sie hält zusammen, was die Gruppe entscheidet.",
    "Kein Schlechtreden anderer Anbieter.",
  ],

  copy: "Kopiert",
};

const en: MediaKit = {
  title: "Media kit",
  intro:
    "Everything you need without having to ask: copy-ready text, facts we can back up, hashtags and images. None of it is mandatory — it is here to save you work.",

  boilerplateTitle: "Description to copy",
  boilerplateShort:
    "EventBliss is the app where groups plan a stag do, birthday or city trip together — dates, ideas, budget, cost splitting and 22 party games in one place.",
  boilerplateLong:
    "EventBliss holds together what usually falls apart across three group chats: agreeing a date, collecting ideas, keeping the budget, entering expenses and finally seeing who owes whom. Plus 22 party games everyone joins from their own phone — with the TV as the board if there is one. Available on iPhone, Android and in the browser, in ten languages. Planning is free.",

  factsTitle: "Facts we can back up",
  facts: [
    "22 party games, all playable in the browser without installing anything",
    "TV mode: the game runs on the TV, everyone plays from their phone",
    "Ten languages: German, English, Spanish, French, Italian, Portuguese, Dutch, Polish, Turkish, Arabic",
    "Available on iPhone, Android and in the browser",
    "Cost splitting with even splits, shares and multiple payers",
    "Planning is free; Premium is optional",
  ],

  captionsTitle: "Example captions",
  captionsHint: "A starting point, not a script. Your own words always work better.",
  captions: [
    "Ten people, three group chats, nobody deciding. This time we planned the stag do in one app — date, ideas, budget, and at the end it showed who owed whom. Link above. #ad",
    "We started the evening with a game running on the TV while everyone played from their phone. There are 22 of them. #ad",
    "The awkward part of every group trip: the settlement. I entered every expense and the app split it — unevenly too, when not everyone joined everything. #ad",
  ],

  hashtagsTitle: "Hashtags",
  hashtagSets: [
    { label: "Stag & hen", tags: ["#stagdo", "#hendo", "#bacheloretteparty", "#eventbliss"] },
    { label: "Games", tags: ["#partygames", "#gamenight", "#groupgames", "#eventbliss"] },
    { label: "Travel", tags: ["#grouptrip", "#citytrip", "#travelplanning", "#eventbliss"] },
    { label: "Celebrations", tags: ["#birthdayparty", "#weddingplanning", "#eventbliss"] },
  ],

  linksTitle: "Links",
  links: [
    { label: "Website", url: SITE },
    { label: "All games", url: `${SITE}/games` },
    { label: "Provider marketplace", url: `${SITE}/marketplace` },
    { label: "Privacy", url: `${SITE}/legal/privacy` },
  ],

  brandTitle: "Colours",
  brandColors: [
    { label: "Purple", value: "#A855F7" },
    { label: "Pink", value: "#EC4899" },
    { label: "Green", value: "#10B981" },
    { label: "Dark", value: "#0B0B12" },
  ],

  assetsTitle: "Images and logos",
  assets: [
    { label: "Logo", url: `${SITE}/press/eventbliss-logo.png`, hint: "Wordmark, transparent" },
    { label: "App icon", url: `${SITE}/press/eventbliss-icon.png`, hint: "Square, for profile pictures and stickers" },
    { label: "Hero image", url: `${SITE}/press/hero-image.png`, hint: "Large visual for covers and previews" },
    { label: "Devices", url: `${SITE}/press/multi-device-mockup.png`, hint: "The app on phone and TV" },
    { label: "Planning", url: `${SITE}/press/feature-planning.png`, hint: "Dates and programme" },
    { label: "Voting", url: `${SITE}/press/feature-voting.png`, hint: "The group decides together" },
    { label: "Cost splitting", url: `${SITE}/press/feature-bill-splitting.png`, hint: "Who owes whom" },
    { label: "Expenses", url: `${SITE}/press/feature-expense-tracking.png`, hint: "Entering and keeping expenses" },
    { label: "Share image (1200 × 630)", url: `${SITE}/og-image.png`, hint: "For preview images and thumbnails" },
    { label: "App icon (512 × 512)", url: `${SITE}/pwa-512x512.png`, hint: "Smaller version, e.g. for stories" },
  ],

  screenshotTitle: "Screenshots",
  screenshotHint:
    "Best taken by you inside the app — real planning with your own names beats any staged marketing shot. Just make sure no other people's names, addresses or amounts are visible.",

  rulesTitle: "What we ask for",
  rules: [
    "Label the post as advertising — that is a requirement, not politeness.",
    "Show the app in use rather than describing it.",
    "Do not quote user or download numbers; we do not publish any, because they are not verified.",
    "Do not say the app plans by itself — it holds together what the group decides.",
    "No knocking other providers.",
  ],

  copy: "Copied",
};

export function creatorMediaKit(lang: string | null | undefined): MediaKit {
  return lang === "de" ? de : en;
}
