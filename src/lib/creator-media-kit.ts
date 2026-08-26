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

/**
 * Ein Beispieltext mit Format und Einsatzhinweis.
 *
 * WARUM NEUN STATT DREI: drei Texte sind ein Beleg, dass es Texte gibt. Neun —
 * je drei fuer Reel, Story und Beitrag — sind eine Auswahl, aus der man
 * tatsaechlich etwas nimmt. Jeder hat einen Anfang, der neugierig macht, eine
 * Mitte, in der etwas passiert, und einen Schluss, der nicht bettelt.
 */
export interface MediaKitCaption {
  format: string;
  hint: string;
  text: string;
}

/** Eine fertige Story-Kachel im Hochformat. Erzeugt von scripts/generate-story-tiles.mjs. */
export interface StoryTile {
  key: string;
  label: string;
}

/**
 * Die Adresse einer Story-Kachel.
 *
 * BEWUSST RELATIV: die Kacheln sollen in der Vorschau auch dann erscheinen,
 * wenn der Bereich lokal oder in einer Vorschau-Bereitstellung laeuft. Die
 * uebrigen Bilder stehen absolut, weil man deren Adresse weitergibt — eine
 * Kachel laedt man herunter.
 */
export function storyTileUrl(lang: "de" | "en", key: string): string {
  return `/press/story/${lang}/${key}.png`;
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
  captions: MediaKitCaption[];
  storyTiles: StoryTile[];
  personalTitle: string;
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

  captionsTitle: "Texte zum Kopieren",
  captionsHint:
    "Neun Texte, drei je Format. Gedacht zum Antippen, Einfügen und Umschreiben — in deinen Worten wirkt jeder davon besser als hier.",
  captions: [
    {
      format: "Reel",
      hint: "Vorher-Nachher, ~20 Sekunden",
      text:
        "Zehn Leute. Drei Gruppenchats. Und bis Dienstag hatte niemand irgendetwas entschieden.\n\n" +
        "Diesmal haben wir alles an einen Ort gelegt: Termin, Ideen, Budget. Zwei Tage später stand das Wochenende — ohne dass einer 200 Nachrichten nachlesen musste.\n\n" +
        "Wenn ihr gerade selbst zu zehnt etwas plant: der Link ist oben. #Werbung",
    },
    {
      format: "Reel",
      hint: "Die Abrechnung, der Teil den alle kennen",
      text:
        "Der Moment, über den nach jeder Gruppenreise keiner reden will: Wer hat eigentlich was bezahlt?\n\n" +
        "Ich hab jede Ausgabe eingetragen. Auch die, bei denen nicht alle dabei waren — dann wird eben ungleich geteilt. Am Ende stand da einfach: wer wem was schuldet.\n\n" +
        "Zum ersten Mal ohne diese komische Stimmung am letzten Abend. #Werbung",
    },
    {
      format: "Reel",
      hint: "Der Spieleabend, mit echten Reaktionen",
      text:
        "Wir haben den Abend mit einem Spiel auf dem Fernseher gestartet. Gespielt haben alle am eigenen Handy.\n\n" +
        "Keine Karten, keine Regeln zum Vorlesen, niemand musste etwas installieren. Es gibt 22 davon — wir haben drei geschafft, dann war es zwei Uhr.\n\n" +
        "Ab Minute zwei ist da nichts mehr gestellt. #Werbung",
    },
    {
      format: "Story",
      hint: "Frage-Sticker, holt Antworten",
      text: "Plant ihr gerade auch zu zehnt in drei verschiedenen Chats? 🙃\nWir haben's diesmal anders gemacht — Link oben. #Werbung",
    },
    {
      format: "Story",
      hint: "Direkt vor oder nach der Abrechnung",
      text: "Ehrliche Frage: Wer rechnet bei euch nach einer Gruppenreise ab? 👀\nBei uns macht das jetzt die App — inklusive „wer schuldet wem\". #Werbung",
    },
    {
      format: "Story",
      hint: "Am Abend selbst, mit Bildschirmaufnahme",
      text: "Spieleabend-Trick: Das Spiel läuft auf dem Fernseher, alle spielen am eigenen Handy mit. 22 Stück zur Auswahl, nichts zu installieren. #Werbung",
    },
    {
      format: "Beitrag",
      hint: "Karussell, längere Fassung",
      text:
        "Zehn Leute, ein Wochenende — und am Anfang drei Gruppenchats.\n\n" +
        "Wir haben den JGA diesmal komplett an einem Ort geplant. Termin abstimmen, Ideen sammeln, Budget festhalten. Alle sehen dasselbe, keiner muss etwas weiterleiten.\n\n" +
        "Am meisten überrascht hat mich der langweiligste Teil: die Abrechnung. Ausgaben rein, aufteilen, fertig — auch ungleich, wenn nicht alle bei allem dabei waren.\n\n" +
        "Und für den Abend selbst gibt es 22 Spiele, bei denen alle am Handy mitspielen und das Spiel auf dem Fernseher läuft.\n\n" +
        "Planen kostet nichts. Link in der Bio. #Werbung",
    },
    {
      format: "Beitrag",
      hint: "Persönlich, für Profile mit engem Publikum",
      text:
        "Ich empfehle selten etwas, weil ich selbst wenig benutze, das ich nicht sowieso brauche.\n\n" +
        "Das hier benutze ich. Wir planen unsere Wochenenden damit — und was mich überzeugt hat, war nicht irgendeine Funktion, sondern dass nach dem Wochenende niemand mehr rechnen musste.\n\n" +
        "Wenn ihr euch fragt, ob das für eure Gruppe was ist: Planen ist kostenlos, ihr könnt es einfach zu zweit ausprobieren, bevor ihr die anderen dazuholt. #Werbung",
    },
    {
      format: "Beitrag",
      hint: "Liste, funktioniert auch ohne Video",
      text:
        "Vier Dinge, die bei unserer Gruppenreise dieses Mal nicht passiert sind:\n\n" +
        "1. Niemand musste 200 Nachrichten nachlesen, um den Stand zu kennen.\n" +
        "2. Keine drei Termin-Umfragen in drei verschiedenen Chats.\n" +
        "3. Niemand ist auf 180 € sitzen geblieben, weil man es „später klärt\".\n" +
        "4. Der Abend musste nicht mit „und was machen wir jetzt?\" anfangen — 22 Spiele, alle am Handy.\n\n" +
        "Alles an einem Ort. Link in der Bio. #Werbung",
    },
  ],

  storyTiles: [
    { key: "chaos", label: "Drei Chats" },
    { key: "planning", label: "Alles an einem Ort" },
    { key: "split", label: "Wer schuldet wem" },
    { key: "games", label: "22 Spiele" },
    { key: "ideas", label: "Ideen sammeln" },
    { key: "code", label: "Dein Code" },
  ],

  personalTitle: "Nur für dich hinterlegt",

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

  captionsTitle: "Copy-ready captions",
  captionsHint:
    "Nine captions, three per format. Made to be tapped, pasted and rewritten — in your own words every one of them lands better than it does here.",
  captions: [
    {
      format: "Reel",
      hint: "Before and after, ~20 seconds",
      text:
        "Ten people. Three group chats. And by Tuesday nobody had decided anything.\n\n" +
        "This time we put it all in one place: date, ideas, budget. Two days later the weekend was booked — without anyone scrolling back through 200 messages.\n\n" +
        "If you are planning something with a group right now, the link is above. #ad",
    },
    {
      format: "Reel",
      hint: "The settlement — everyone knows this one",
      text:
        "The moment nobody wants to bring up after a group trip: who actually paid for what?\n\n" +
        "I entered every expense. Including the ones not everyone joined — those just get split unevenly. At the end it simply said who owes whom.\n\n" +
        "First trip without that weird mood on the last night. #ad",
    },
    {
      format: "Reel",
      hint: "Game night, real reactions",
      text:
        "We started the evening with a game running on the TV. Everyone played from their own phone.\n\n" +
        "No cards, no rules to read out, nothing to install. There are 22 of them — we managed three before it was 2am.\n\n" +
        "From minute two, none of it is staged. #ad",
    },
    {
      format: "Story",
      hint: "With a question sticker, gets replies",
      text: "Are you also planning with ten people across three chats right now? 🙃\nWe did it differently this time — link above. #ad",
    },
    {
      format: "Story",
      hint: "Right before or after the settlement",
      text: "Honest question: who does the maths after a group trip in your circle? 👀\nOurs is done by the app now — including who owes whom. #ad",
    },
    {
      format: "Story",
      hint: "During the evening, with a screen recording",
      text: "Game night trick: the game runs on the TV, everyone plays from their own phone. 22 to choose from, nothing to install. #ad",
    },
    {
      format: "Post",
      hint: "Carousel, longer version",
      text:
        "Ten people, one weekend — and three group chats to start with.\n\n" +
        "This time we planned the whole stag do in one place. Agreeing the date, collecting ideas, keeping the budget. Everyone sees the same thing, nobody forwards anything.\n\n" +
        "What surprised me most was the dullest part: the settlement. Expenses in, split, done — unevenly too, when not everyone joined everything.\n\n" +
        "And for the evening itself there are 22 games everyone joins from their phone while the game runs on the TV.\n\n" +
        "Planning is free. Link in bio. #ad",
    },
    {
      format: "Post",
      hint: "Personal, for accounts with a close audience",
      text:
        "I rarely recommend anything, because I barely use things I do not already need.\n\n" +
        "This one I use. We plan our weekends with it — and what convinced me was not a feature, it was that after the weekend nobody had to do any maths.\n\n" +
        "If you are wondering whether it suits your group: planning is free, so you can try it with one other person before pulling everyone in. #ad",
    },
    {
      format: "Post",
      hint: "List, works without video too",
      text:
        "Four things that did not happen on our group trip this time:\n\n" +
        "1. Nobody had to read back 200 messages to know where things stood.\n" +
        "2. No three separate date polls in three separate chats.\n" +
        "3. Nobody was left £150 out of pocket because we would \"sort it later\".\n" +
        "4. The evening did not have to start with \"so what now?\" — 22 games, everyone on their phone.\n\n" +
        "All in one place. Link in bio. #ad",
    },
  ],

  storyTiles: [
    { key: "chaos", label: "Three chats" },
    { key: "planning", label: "All in one place" },
    { key: "split", label: "Who owes whom" },
    { key: "games", label: "22 games" },
    { key: "ideas", label: "Collecting ideas" },
    { key: "code", label: "Your code" },
  ],

  personalTitle: "Kept just for you",

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
