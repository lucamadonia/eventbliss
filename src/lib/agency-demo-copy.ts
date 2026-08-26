/**
 * Texte der Agentur-Demoseite — Deutsch und Englisch.
 *
 * WARUM HIER UND NICHT IN DEN LOCALE-JSONS: diese Seite ist Akquise-Text, kein
 * Produkttext. Sie folgt einem eigenen Briefing, das bestimmte Formulierungen
 * ausdruecklich verbietet — "Mehrwert", "innovativ", "spannend", Feature-Listen,
 * Preise, Mengenversprechen. Solche Regeln ueberleben nur, wenn der Text an
 * einem Ort steht, an dem sie danebenstehen.
 *
 * Zwei Sprachen, nicht zehn: Deutsch fuer DACH, Englisch fuer alles andere. Ein
 * halb uebersetzter Akquisetext ist schlimmer als ein englischer — und die
 * Locale-Dateien fallen bei fehlenden Schluesseln auf DEUTSCH zurueck, was
 * einer franzoesischen Agentur eine deutsche Seite zeigen wuerde.
 *
 * LEITPLANKEN (aus dem Briefing):
 * - 10 Sprachen, Web + iOS + Android — belegt
 * - 171 Agenturen in 9 Laendern — aktueller Stand des Verzeichnisses
 * - "ueber 160 Laender" ist Store-Verfuegbarkeit, deshalb vorsichtig formuliert
 * - KEIN Preis, KEINE Laufzeit, KEINE Anfrage-Stueckzahl
 */

export type DemoLang = "de" | "en";

export interface AgencyDemoCopy {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  headline: (agency?: string) => string;
  lead: (city?: string) => string;
  previewTitle: string;
  previewHint: string;
  /** Beispieltext im Profil, wenn die Agentur keine Beschreibung hinterlegt hat. */
  previewFallbackDescription: (city: string) => string;
  previewRequestButton: string;
  requestTitle: string;
  requestHint: string;
  requestFields: { label: string; value: string }[];
  stepsTitle: string;
  steps: { title: string; body: string }[];
  factsTitle: string;
  facts: string[];
  termsTitle: string;
  terms: string[];
  termsFootnote: string;
  ctaTitle: (agency?: string) => string;
  ctaBody: string;
  ctaButton: string;
  ctaSecondary: string;
  contactTitle: string;
  contactBody: string;
  agreementLabel: string;
  imprintLabel: string;
}

const de: AgencyDemoCopy = {
  metaTitle: "Für Agenturen — EventBliss",
  metaDescription:
    "So sieht euer Profil bei EventBliss aus: Gruppen, die in eurer Stadt planen, sehen euch im Planungsmoment und fragen mit einem Klick an.",
  eyebrow: "Für Event- und JGA-Agenturen",
  headline: (agency) =>
    agency ? `So würde ${agency} bei EventBliss aussehen` : "So sieht euer Profil bei EventBliss aus",
  lead: (city) =>
    city
      ? `Eine Gruppe plant ihren Junggesellenabschied in ${city}. Das Datum steht, die Teilnehmerzahl steht, das Budget steht. Genau in diesem Moment seht ihr so aus — und einen Klick später liegt die vollständige Anfrage in eurem Postfach.`
      : "Eine Gruppe plant ihren Junggesellenabschied. Das Datum steht, die Teilnehmerzahl steht, das Budget steht. Genau in diesem Moment seht ihr so aus — und einen Klick später liegt die vollständige Anfrage in eurem Postfach.",
  previewTitle: "Euer Profil in der App",
  previewHint: "Vorschau — noch nicht öffentlich sichtbar",
  previewFallbackDescription: (city) =>
    `Erlebnisse und Programme für Gruppen in ${city}. Diesen Text schreibt ihr selbst — oder wir übernehmen ihn von eurer Website.`,
  previewRequestButton: "Anfrage senden",
  requestTitle: "Was bei euch ankommt",
  requestHint: "Beispiel einer Anfrage, wie sie in eurem Postfach liegt",
  requestFields: [
    { label: "Anlass", value: "Junggesellenabschied" },
    { label: "Datum", value: "Samstag, 12. September" },
    { label: "Gruppe", value: "11 Personen" },
    { label: "Budget", value: "80–120 € pro Person" },
    { label: "Wunsch", value: "Etwas mit Bewegung am Nachmittag, danach Essen" },
  ],
  stepsTitle: "Wie es abläuft",
  steps: [
    {
      title: "Die Gruppe plant",
      body: "Termine, Budget, Kostenteilung, Ideen — das hält die Gruppe ohnehin in der App fest. Ort, Datum und Teilnehmerzahl stehen also längst, bevor jemand nach einem Anbieter sucht.",
    },
    {
      title: "Ihr steht unter ihrem Ort",
      body: "Wer in eurer Stadt plant, sieht euch mit Namen, Angebot und Kontakt. Kein Werbeplatz, den man kaufen muss — eine Liste der Anbieter vor Ort.",
    },
    {
      title: "Die Anfrage kommt zu euch",
      body: "Ein Klick, und ihr habt Anlass, Datum, Teilnehmerzahl und Budgetrahmen im Postfach. Oder die Gruppe ruft direkt an. Ab da läuft alles zwischen euch und der Gruppe.",
    },
  ],
  factsTitle: "Der Hintergrund, kurz",
  facts: [
    "Über zwei Jahre Entwicklung, seit Kurzem für iOS und Android erschienen — dazu die Web-App.",
    "Zehn Sprachen, international in den App Stores verfügbar.",
    "171 Agenturen in neun Ländern stehen im Verzeichnis; wir bauen es Stadt für Stadt weiter aus.",
    "Planung, Kostenteilung, Ideen und Party-Spiele in einem Produkt — deshalb sind die Gruppen schon da, wenn sie einen Anbieter suchen.",
  ],
  termsTitle: "Die Bedingungen",
  terms: [
    "Der Pilot kostet euch nichts.",
    "Keine Vertragsbindung, keine Exklusivität — ihr könnt jederzeit raus.",
    "Keine automatische Verlängerung und keine Kosten ohne euer ausdrückliches Ja.",
    "Kein Aufwand: Wir legen das Profil an, ihr schaut einmal drüber.",
  ],
  termsFootnote:
    "Am Ende des Piloten schauen wir gemeinsam auf die Ergebnisse und besprechen offen, wie es weitergehen kann.",
  ctaTitle: (agency) => (agency ? `${agency} vervollständigen` : "Profil vervollständigen"),
  ctaBody:
    "Ihr tragt ein, was stimmen soll — Beschreibung, Angebot, Kontakt — und wir schalten das Profil unter eurer Stadt frei. Wenn ihr Fragen habt oder vorher etwas besprechen wollt: schreibt uns, wir freuen uns auf den Austausch.",
  ctaButton: "Profil vervollständigen",
  ctaSecondary: "App ansehen",
  contactTitle: "Wer dahintersteht",
  contactBody:
    "Svitlana Kapinos betreut bei EventBliss die Partner-Agenturen. EventBliss ist ein Produkt der MYFAMBLISS GROUP LTD, Paphos, Zypern.",
  agreementLabel: "Partnervertrag",
  imprintLabel: "Impressum",
};

const en: AgencyDemoCopy = {
  metaTitle: "For agencies — EventBliss",
  metaDescription:
    "This is how your profile looks on EventBliss: groups planning in your city see you while they plan and send a complete request with one tap.",
  eyebrow: "For event, stag and hen agencies",
  headline: (agency) =>
    agency ? `This is how ${agency} would look on EventBliss` : "This is how your profile looks on EventBliss",
  lead: (city) =>
    city
      ? `A group is planning a stag do in ${city}. The date is set, the headcount is set, the budget is set. That is the moment they see you — and one tap later the full request is in your inbox.`
      : "A group is planning a stag do. The date is set, the headcount is set, the budget is set. That is the moment they see you — and one tap later the full request is in your inbox.",
  previewTitle: "Your profile in the app",
  previewHint: "Preview — not public yet",
  previewFallbackDescription: (city) =>
    `Experiences and programmes for groups in ${city}. You write this text yourself — or we take it from your website.`,
  previewRequestButton: "Send request",
  requestTitle: "What reaches you",
  requestHint: "Example of a request as it arrives in your inbox",
  requestFields: [
    { label: "Occasion", value: "Stag do" },
    { label: "Date", value: "Saturday, 12 September" },
    { label: "Group", value: "11 people" },
    { label: "Budget", value: "€80–120 per person" },
    { label: "Asking for", value: "Something active in the afternoon, dinner after" },
  ],
  stepsTitle: "How it works",
  steps: [
    {
      title: "The group plans",
      body: "Dates, budget, cost splitting, ideas — the group keeps all of it in the app anyway. So the city, the date and the headcount exist long before anyone looks for a supplier.",
    },
    {
      title: "You are listed under their city",
      body: "Whoever plans in your city sees your name, what you offer and how to reach you. Not an ad slot you buy — a list of the providers on the ground.",
    },
    {
      title: "The request comes to you",
      body: "One tap and you have the occasion, date, headcount and budget range in your inbox. Or the group simply calls. From there it is between you and them.",
    },
  ],
  factsTitle: "The background, briefly",
  facts: [
    "More than two years of development; recently released for iOS and Android, alongside the web app.",
    "Ten languages, available internationally in the app stores.",
    "171 agencies across nine countries are in the directory; we keep building it city by city.",
    "Planning, cost splitting, ideas and party games in one product — which is why the groups are already there when they look for a supplier.",
  ],
  termsTitle: "The terms",
  terms: [
    "The pilot costs you nothing.",
    "No contract, no exclusivity — you can leave at any time.",
    "No automatic renewal and no charges without your explicit yes.",
    "No work on your side: we set the profile up, you look it over once.",
  ],
  termsFootnote:
    "At the end of the pilot we look at the results together and talk openly about where to go from there.",
  ctaTitle: (agency) => (agency ? `Complete ${agency}` : "Complete your profile"),
  ctaBody:
    "You fill in what should be right — description, offering, contact — and we publish the profile under your city. If you have questions or want to talk something through first, write to us; we are glad to hear from you.",
  ctaButton: "Complete profile",
  ctaSecondary: "Look at the app",
  contactTitle: "Who is behind this",
  contactBody:
    "Svitlana Kapinos looks after the partner agencies at EventBliss. EventBliss is a product of MYFAMBLISS GROUP LTD, Paphos, Cyprus.",
  agreementLabel: "Partner agreement",
  imprintLabel: "Imprint",
};

const COPY: Record<DemoLang, AgencyDemoCopy> = { de, en };

/** Deutsch nur fuer Deutsch — jede andere Sprache bekommt Englisch. */
export function agencyDemoCopy(lang: string | null | undefined): AgencyDemoCopy {
  return COPY[lang === "de" ? "de" : "en"];
}
