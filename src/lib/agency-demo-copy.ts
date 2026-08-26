/**
 * Texte der Agentur-Demoseite — alle zehn Sprachen der App.
 *
 * WARUM HIER UND NICHT IN DEN LOCALE-JSONS: diese Seite ist Akquise-Text, kein
 * Produkttext. Sie folgt einem eigenen Briefing, das bestimmte Formulierungen
 * ausdruecklich verbietet — "Mehrwert", "innovativ", "spannend", Feature-Listen,
 * Preise, Mengenversprechen. Solche Regeln ueberleben nur, wenn der Text an
 * einem Ort steht, an dem sie danebenstehen. Der zweite Grund ist haerter: die
 * Locale-Dateien fallen bei fehlenden Schluesseln auf DEUTSCH zurueck. Ein
 * fehlender Schluessel waere hier kein Schoenheitsfehler, sondern ein deutscher
 * Satz mitten in einer spanischen Kaltansprache.
 *
 * WARUM ZEHN UND NICHT ZWEI: das Verzeichnis fuehrt heute Agenturen in
 * Deutschland (43), Spanien (30), Frankreich (25), Oesterreich (17), der
 * Schweiz (16), den Niederlanden (16), Belgien (13), Italien (10) und Portugal
 * (9). Englisch fuer alle waere also fuer die Mehrheit der Angeschriebenen die
 * Fremdsprache. Polnisch, Tuerkisch und Arabisch stehen hier, weil die
 * SEO-Seiten sie bereits bedienen und die naechsten Wellen dorthin gehen.
 *
 * LEITPLANKEN (aus dem Briefing):
 * - 10 Sprachen, Web + iOS + Android — belegt
 * - 171 Agenturen in 9 Laendern — aktueller Stand des Verzeichnisses
 * - "ueber 160 Laender" ist Store-Verfuegbarkeit, deshalb vorsichtig formuliert
 * - KEIN Preis, KEINE Laufzeit, KEINE Anfrage-Stueckzahl
 */
import type { SeoLang } from "@/lib/seo-routes";

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
  /** Platzhalter im Telefonrahmen, solange keine Agentur geladen ist. */
  yourAgency: string;
  yourCity: string;
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
  privacyLabel: string;
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
  yourAgency: "Eure Agentur",
  yourCity: "Eure Stadt",
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
  privacyLabel: "Datenschutz",
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
  yourAgency: "Your agency",
  yourCity: "Your city",
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
  privacyLabel: "Privacy",
};

const es: AgencyDemoCopy = {
  metaTitle: "Para agencias — EventBliss",
  metaDescription:
    "Así se ve vuestro perfil en EventBliss: los grupos que organizan su despedida en vuestra ciudad os ven mientras planifican y os escriben con un clic.",
  eyebrow: "Para agencias de eventos y despedidas",
  headline: (agency) =>
    agency ? `Así se vería ${agency} en EventBliss` : "Así se ve vuestro perfil en EventBliss",
  lead: (city) =>
    city
      ? `Un grupo organiza su despedida de soltero en ${city}. La fecha está fijada, el número de personas también, y el presupuesto igual. Ese es el momento en el que os ven — y un clic después la solicitud completa está en vuestro correo.`
      : "Un grupo organiza su despedida de soltero. La fecha está fijada, el número de personas también, y el presupuesto igual. Ese es el momento en el que os ven — y un clic después la solicitud completa está en vuestro correo.",
  previewTitle: "Vuestro perfil en la app",
  previewHint: "Vista previa — todavía no es público",
  previewFallbackDescription: (city) =>
    `Experiencias y programas para grupos en ${city}. Este texto lo escribís vosotros — o lo tomamos de vuestra web.`,
  previewRequestButton: "Enviar solicitud",
  yourAgency: "Vuestra agencia",
  yourCity: "Vuestra ciudad",
  requestTitle: "Lo que os llega",
  requestHint: "Ejemplo de una solicitud tal como aparece en vuestro correo",
  requestFields: [
    { label: "Motivo", value: "Despedida de soltero" },
    { label: "Fecha", value: "Sábado, 12 de septiembre" },
    { label: "Grupo", value: "11 personas" },
    { label: "Presupuesto", value: "80–120 € por persona" },
    { label: "Piden", value: "Algo activo por la tarde y después cena" },
  ],
  stepsTitle: "Cómo funciona",
  steps: [
    {
      title: "El grupo planifica",
      body: "Fechas, presupuesto, reparto de gastos, ideas — el grupo ya lo tiene todo en la app. La ciudad, la fecha y el número de personas existen mucho antes de que alguien busque un proveedor.",
    },
    {
      title: "Aparecéis en vuestra ciudad",
      body: "Quien organiza algo en vuestra ciudad os ve con nombre, oferta y contacto. No es un espacio publicitario que haya que comprar: es la lista de los proveedores locales.",
    },
    {
      title: "La solicitud llega a vosotros",
      body: "Un clic y tenéis el motivo, la fecha, el número de personas y el presupuesto en el correo. O el grupo llama directamente. A partir de ahí todo ocurre entre vosotros y el grupo.",
    },
  ],
  factsTitle: "El contexto, en breve",
  facts: [
    "Más de dos años de desarrollo; publicada hace poco para iOS y Android, además de la versión web.",
    "Diez idiomas, disponible internacionalmente en las tiendas de aplicaciones.",
    "En el directorio hay 171 agencias en nueve países; lo ampliamos ciudad a ciudad.",
    "Planificación, reparto de gastos, ideas y juegos de fiesta en un solo producto — por eso los grupos ya están ahí cuando buscan proveedor.",
  ],
  termsTitle: "Las condiciones",
  terms: [
    "El piloto no os cuesta nada.",
    "Sin contrato y sin exclusividad — podéis salir cuando queráis.",
    "Sin renovación automática y sin ningún coste sin vuestro sí expreso.",
    "Sin trabajo por vuestra parte: creamos el perfil y vosotros le echáis un vistazo.",
  ],
  termsFootnote:
    "Al final del piloto miramos juntos los resultados y hablamos con franqueza de cómo seguir.",
  ctaTitle: (agency) => (agency ? `Completar ${agency}` : "Completar vuestro perfil"),
  ctaBody:
    "Indicáis lo que debe constar — descripción, oferta, contacto — y publicamos el perfil en vuestra ciudad. Si tenéis preguntas o preferís hablarlo antes, escribidnos: nos alegra tener noticias vuestras.",
  ctaButton: "Completar perfil",
  ctaSecondary: "Ver la app",
  contactTitle: "Quién está detrás",
  contactBody:
    "Svitlana Kapinos se ocupa de las agencias asociadas en EventBliss. EventBliss es un producto de MYFAMBLISS GROUP LTD, Pafos, Chipre.",
  agreementLabel: "Contrato de colaboración",
  imprintLabel: "Aviso legal",
  privacyLabel: "Privacidad",
};

const fr: AgencyDemoCopy = {
  metaTitle: "Pour les agences — EventBliss",
  metaDescription:
    "Voici à quoi ressemble votre profil sur EventBliss : les groupes qui organisent leur EVG dans votre ville vous voient pendant qu'ils planifient et vous écrivent en un clic.",
  eyebrow: "Pour les agences d'événements et d'EVG/EVJF",
  headline: (agency) =>
    agency ? `Voici à quoi ressemblerait ${agency} sur EventBliss` : "Voici à quoi ressemble votre profil sur EventBliss",
  lead: (city) =>
    city
      ? `Un groupe organise son EVG à ${city}. La date est fixée, le nombre de participants aussi, le budget également. C'est à ce moment-là qu'il vous voit — et un clic plus tard, la demande complète est dans votre boîte mail.`
      : "Un groupe organise son EVG. La date est fixée, le nombre de participants aussi, le budget également. C'est à ce moment-là qu'il vous voit — et un clic plus tard, la demande complète est dans votre boîte mail.",
  previewTitle: "Votre profil dans l'application",
  previewHint: "Aperçu — pas encore public",
  previewFallbackDescription: (city) =>
    `Expériences et programmes pour groupes à ${city}. Ce texte, vous l'écrivez vous-mêmes — ou nous le reprenons de votre site.`,
  previewRequestButton: "Envoyer la demande",
  yourAgency: "Votre agence",
  yourCity: "Votre ville",
  requestTitle: "Ce qui vous arrive",
  requestHint: "Exemple de demande telle qu'elle arrive dans votre boîte mail",
  requestFields: [
    { label: "Occasion", value: "Enterrement de vie de garçon" },
    { label: "Date", value: "Samedi 12 septembre" },
    { label: "Groupe", value: "11 personnes" },
    { label: "Budget", value: "80–120 € par personne" },
    { label: "Demande", value: "Quelque chose d'actif l'après-midi, puis un dîner" },
  ],
  stepsTitle: "Comment ça se passe",
  steps: [
    {
      title: "Le groupe planifie",
      body: "Dates, budget, partage des frais, idées — le groupe note tout cela dans l'application de toute façon. La ville, la date et le nombre de participants existent donc bien avant qu'on cherche un prestataire.",
    },
    {
      title: "Vous apparaissez dans leur ville",
      body: "Celui qui organise quelque chose dans votre ville vous voit avec votre nom, votre offre et vos coordonnées. Pas un espace publicitaire à acheter : la liste des prestataires sur place.",
    },
    {
      title: "La demande vous parvient",
      body: "Un clic, et vous avez l'occasion, la date, le nombre de participants et le budget dans votre boîte mail. Ou le groupe appelle directement. Ensuite, tout se passe entre vous et le groupe.",
    },
  ],
  factsTitle: "Le contexte, en bref",
  facts: [
    "Plus de deux ans de développement ; sortie récemment sur iOS et Android, en plus de la version web.",
    "Dix langues, disponible à l'international sur les stores.",
    "Le répertoire compte 171 agences dans neuf pays ; nous l'élargissons ville par ville.",
    "Organisation, partage des frais, idées et jeux de soirée dans un seul produit — c'est pourquoi les groupes sont déjà là quand ils cherchent un prestataire.",
  ],
  termsTitle: "Les conditions",
  terms: [
    "Le pilote ne vous coûte rien.",
    "Aucun engagement, aucune exclusivité — vous pouvez partir quand vous voulez.",
    "Aucun renouvellement automatique et aucun frais sans votre accord explicite.",
    "Aucun travail de votre côté : nous créons le profil, vous y jetez un œil.",
  ],
  termsFootnote:
    "À la fin du pilote, nous regardons ensemble les résultats et parlons ouvertement de la suite.",
  ctaTitle: (agency) => (agency ? `Compléter ${agency}` : "Compléter votre profil"),
  ctaBody:
    "Vous indiquez ce qui doit figurer — description, offre, contact — et nous publions le profil dans votre ville. Si vous avez des questions ou préférez en parler d'abord : écrivez-nous, nous serons ravis d'échanger.",
  ctaButton: "Compléter le profil",
  ctaSecondary: "Voir l'application",
  contactTitle: "Qui est derrière",
  contactBody:
    "Svitlana Kapinos s'occupe des agences partenaires chez EventBliss. EventBliss est un produit de MYFAMBLISS GROUP LTD, Paphos, Chypre.",
  agreementLabel: "Contrat de partenariat",
  imprintLabel: "Mentions légales",
  privacyLabel: "Confidentialité",
};

const it: AgencyDemoCopy = {
  metaTitle: "Per le agenzie — EventBliss",
  metaDescription:
    "Ecco come appare il vostro profilo su EventBliss: i gruppi che organizzano l'addio al celibato nella vostra città vi vedono mentre pianificano e vi scrivono con un clic.",
  eyebrow: "Per agenzie di eventi e addii al celibato",
  headline: (agency) =>
    agency ? `Ecco come apparirebbe ${agency} su EventBliss` : "Ecco come appare il vostro profilo su EventBliss",
  lead: (city) =>
    city
      ? `Un gruppo sta organizzando l'addio al celibato a ${city}. La data c'è, il numero di partecipanti c'è, il budget pure. È in quel momento che vi vedono — e un clic dopo la richiesta completa è nella vostra posta.`
      : "Un gruppo sta organizzando l'addio al celibato. La data c'è, il numero di partecipanti c'è, il budget pure. È in quel momento che vi vedono — e un clic dopo la richiesta completa è nella vostra posta.",
  previewTitle: "Il vostro profilo nell'app",
  previewHint: "Anteprima — non ancora pubblica",
  previewFallbackDescription: (city) =>
    `Esperienze e programmi per gruppi a ${city}. Questo testo lo scrivete voi — oppure lo riprendiamo dal vostro sito.`,
  previewRequestButton: "Invia richiesta",
  yourAgency: "La vostra agenzia",
  yourCity: "La vostra città",
  requestTitle: "Cosa vi arriva",
  requestHint: "Esempio di una richiesta così come arriva nella vostra posta",
  requestFields: [
    { label: "Occasione", value: "Addio al celibato" },
    { label: "Data", value: "Sabato 12 settembre" },
    { label: "Gruppo", value: "11 persone" },
    { label: "Budget", value: "80–120 € a persona" },
    { label: "Richiesta", value: "Qualcosa di attivo nel pomeriggio, poi cena" },
  ],
  stepsTitle: "Come funziona",
  steps: [
    {
      title: "Il gruppo pianifica",
      body: "Date, budget, divisione delle spese, idee — il gruppo tiene tutto nell'app comunque. Città, data e numero di partecipanti esistono quindi molto prima che si cerchi un fornitore.",
    },
    {
      title: "Comparite nella loro città",
      body: "Chi organizza qualcosa nella vostra città vi vede con nome, offerta e contatti. Non uno spazio pubblicitario da comprare: l'elenco dei fornitori del posto.",
    },
    {
      title: "La richiesta arriva a voi",
      body: "Un clic e avete occasione, data, numero di partecipanti e budget nella posta. Oppure il gruppo chiama direttamente. Da lì in poi è una cosa tra voi e il gruppo.",
    },
  ],
  factsTitle: "Il contesto, in breve",
  facts: [
    "Oltre due anni di sviluppo; da poco uscita per iOS e Android, oltre alla versione web.",
    "Dieci lingue, disponibile a livello internazionale negli app store.",
    "Nell'elenco ci sono 171 agenzie in nove paesi; lo ampliamo città per città.",
    "Organizzazione, divisione delle spese, idee e giochi di gruppo in un solo prodotto — per questo i gruppi ci sono già quando cercano un fornitore.",
  ],
  termsTitle: "Le condizioni",
  terms: [
    "Il progetto pilota non vi costa nulla.",
    "Nessun vincolo, nessuna esclusiva — potete uscire quando volete.",
    "Nessun rinnovo automatico e nessun costo senza un vostro sì esplicito.",
    "Nessun lavoro da parte vostra: il profilo lo creiamo noi, voi date un'occhiata.",
  ],
  termsFootnote:
    "Alla fine del pilota guardiamo insieme i risultati e parliamo apertamente di come proseguire.",
  ctaTitle: (agency) => (agency ? `Completare ${agency}` : "Completare il vostro profilo"),
  ctaBody:
    "Indicate cosa deve esserci — descrizione, offerta, contatti — e pubblichiamo il profilo nella vostra città. Se avete domande o preferite parlarne prima: scriveteci, ci fa piacere sentirvi.",
  ctaButton: "Completare il profilo",
  ctaSecondary: "Guarda l'app",
  contactTitle: "Chi c'è dietro",
  contactBody:
    "Svitlana Kapinos segue le agenzie partner di EventBliss. EventBliss è un prodotto di MYFAMBLISS GROUP LTD, Paphos, Cipro.",
  agreementLabel: "Contratto di partnership",
  imprintLabel: "Note legali",
  privacyLabel: "Privacy",
};

const pt: AgencyDemoCopy = {
  metaTitle: "Para agências — EventBliss",
  metaDescription:
    "É assim que o vosso perfil aparece no EventBliss: os grupos que organizam a despedida na vossa cidade veem-vos enquanto planeiam e contactam-vos com um clique.",
  eyebrow: "Para agências de eventos e despedidas de solteiro",
  headline: (agency) =>
    agency ? `É assim que ${agency} apareceria no EventBliss` : "É assim que o vosso perfil aparece no EventBliss",
  lead: (city) =>
    city
      ? `Um grupo está a organizar a despedida de solteiro em ${city}. A data está definida, o número de pessoas também, o orçamento igualmente. É nesse momento que vos veem — e um clique depois o pedido completo está na vossa caixa de correio.`
      : "Um grupo está a organizar a despedida de solteiro. A data está definida, o número de pessoas também, o orçamento igualmente. É nesse momento que vos veem — e um clique depois o pedido completo está na vossa caixa de correio.",
  previewTitle: "O vosso perfil na aplicação",
  previewHint: "Pré-visualização — ainda não é público",
  previewFallbackDescription: (city) =>
    `Experiências e programas para grupos em ${city}. Este texto escrevem-no vocês — ou retiramo-lo do vosso site.`,
  previewRequestButton: "Enviar pedido",
  yourAgency: "A vossa agência",
  yourCity: "A vossa cidade",
  requestTitle: "O que vos chega",
  requestHint: "Exemplo de um pedido tal como chega à vossa caixa de correio",
  requestFields: [
    { label: "Ocasião", value: "Despedida de solteiro" },
    { label: "Data", value: "Sábado, 12 de setembro" },
    { label: "Grupo", value: "11 pessoas" },
    { label: "Orçamento", value: "80–120 € por pessoa" },
    { label: "Pedido", value: "Algo ativo à tarde e depois jantar" },
  ],
  stepsTitle: "Como funciona",
  steps: [
    {
      title: "O grupo planeia",
      body: "Datas, orçamento, divisão de despesas, ideias — o grupo guarda tudo isso na aplicação de qualquer forma. A cidade, a data e o número de pessoas existem muito antes de alguém procurar um fornecedor.",
    },
    {
      title: "Aparecem na cidade deles",
      body: "Quem organiza algo na vossa cidade vê-vos com nome, oferta e contacto. Não é um espaço publicitário que se compra: é a lista dos fornecedores locais.",
    },
    {
      title: "O pedido chega a vocês",
      body: "Um clique e têm a ocasião, a data, o número de pessoas e o orçamento na caixa de correio. Ou o grupo liga diretamente. A partir daí é entre vocês e o grupo.",
    },
  ],
  factsTitle: "O contexto, em resumo",
  facts: [
    "Mais de dois anos de desenvolvimento; lançada há pouco para iOS e Android, além da versão web.",
    "Dez idiomas, disponível internacionalmente nas lojas de aplicações.",
    "O diretório tem 171 agências em nove países; continuamos a alargá-lo cidade a cidade.",
    "Planeamento, divisão de despesas, ideias e jogos de festa num só produto — por isso os grupos já lá estão quando procuram um fornecedor.",
  ],
  termsTitle: "As condições",
  terms: [
    "O piloto não vos custa nada.",
    "Sem contrato e sem exclusividade — podem sair quando quiserem.",
    "Sem renovação automática e sem custos sem o vosso sim explícito.",
    "Sem trabalho do vosso lado: criamos o perfil, vocês só confirmam.",
  ],
  termsFootnote:
    "No fim do piloto olhamos juntos para os resultados e falamos abertamente sobre como continuar.",
  ctaTitle: (agency) => (agency ? `Completar ${agency}` : "Completar o vosso perfil"),
  ctaBody:
    "Indicam o que deve constar — descrição, oferta, contacto — e publicamos o perfil na vossa cidade. Se tiverem perguntas ou preferirem falar primeiro: escrevam-nos, teremos todo o gosto.",
  ctaButton: "Completar perfil",
  ctaSecondary: "Ver a aplicação",
  contactTitle: "Quem está por trás",
  contactBody:
    "Svitlana Kapinos acompanha as agências parceiras na EventBliss. EventBliss é um produto da MYFAMBLISS GROUP LTD, Pafos, Chipre.",
  agreementLabel: "Contrato de parceria",
  imprintLabel: "Ficha técnica",
  privacyLabel: "Privacidade",
};

const nl: AgencyDemoCopy = {
  metaTitle: "Voor bureaus — EventBliss",
  metaDescription:
    "Zo ziet jullie profiel eruit op EventBliss: groepen die een vrijgezellenfeest in jullie stad plannen zien jullie tijdens het plannen en sturen met één klik een aanvraag.",
  eyebrow: "Voor evenementen- en vrijgezellenfeestbureaus",
  headline: (agency) =>
    agency ? `Zo zou ${agency} eruitzien op EventBliss` : "Zo ziet jullie profiel eruit op EventBliss",
  lead: (city) =>
    city
      ? `Een groep plant een vrijgezellenfeest in ${city}. De datum staat vast, het aantal deelnemers staat vast, het budget ook. Precies op dat moment zien ze jullie — en één klik later ligt de volledige aanvraag in jullie mailbox.`
      : "Een groep plant een vrijgezellenfeest. De datum staat vast, het aantal deelnemers staat vast, het budget ook. Precies op dat moment zien ze jullie — en één klik later ligt de volledige aanvraag in jullie mailbox.",
  previewTitle: "Jullie profiel in de app",
  previewHint: "Voorbeeld — nog niet openbaar",
  previewFallbackDescription: (city) =>
    `Ervaringen en programma's voor groepen in ${city}. Deze tekst schrijven jullie zelf — of wij nemen hem over van jullie website.`,
  previewRequestButton: "Aanvraag versturen",
  yourAgency: "Jullie bureau",
  yourCity: "Jullie stad",
  requestTitle: "Wat er bij jullie binnenkomt",
  requestHint: "Voorbeeld van een aanvraag zoals die in jullie mailbox ligt",
  requestFields: [
    { label: "Aanleiding", value: "Vrijgezellenfeest" },
    { label: "Datum", value: "Zaterdag 12 september" },
    { label: "Groep", value: "11 personen" },
    { label: "Budget", value: "€ 80–120 per persoon" },
    { label: "Wens", value: "Iets actiefs in de middag, daarna eten" },
  ],
  stepsTitle: "Hoe het werkt",
  steps: [
    {
      title: "De groep plant",
      body: "Data, budget, kosten delen, ideeën — de groep houdt dat toch al bij in de app. Stad, datum en aantal deelnemers staan dus allang vast voordat iemand een aanbieder zoekt.",
    },
    {
      title: "Jullie staan onder hun stad",
      body: "Wie in jullie stad iets plant, ziet jullie met naam, aanbod en contact. Geen advertentieplek die je moet kopen — een lijst van de aanbieders ter plaatse.",
    },
    {
      title: "De aanvraag komt bij jullie",
      body: "Eén klik en jullie hebben aanleiding, datum, aantal deelnemers en budget in de mailbox. Of de groep belt gewoon. Vanaf dat moment gaat het tussen jullie en de groep.",
    },
  ],
  factsTitle: "De achtergrond, kort",
  facts: [
    "Ruim twee jaar ontwikkeling; onlangs verschenen voor iOS en Android, naast de webversie.",
    "Tien talen, internationaal beschikbaar in de app stores.",
    "In het overzicht staan 171 bureaus in negen landen; we bouwen het stad voor stad verder uit.",
    "Plannen, kosten delen, ideeën en feestspellen in één product — daarom zijn de groepen er al als ze een aanbieder zoeken.",
  ],
  termsTitle: "De voorwaarden",
  terms: [
    "De pilot kost jullie niets.",
    "Geen contract, geen exclusiviteit — jullie kunnen er altijd uit.",
    "Geen automatische verlenging en geen kosten zonder jullie uitdrukkelijke ja.",
    "Geen werk aan jullie kant: wij maken het profiel aan, jullie kijken het één keer na.",
  ],
  termsFootnote:
    "Aan het eind van de pilot kijken we samen naar de resultaten en bespreken we open hoe het verder kan.",
  ctaTitle: (agency) => (agency ? `${agency} aanvullen` : "Profiel aanvullen"),
  ctaBody:
    "Jullie vullen in wat moet kloppen — omschrijving, aanbod, contact — en wij zetten het profiel live onder jullie stad. Vragen, of eerst even overleggen? Schrijf ons, we horen graag van jullie.",
  ctaButton: "Profiel aanvullen",
  ctaSecondary: "Bekijk de app",
  contactTitle: "Wie erachter zit",
  contactBody:
    "Svitlana Kapinos begeleidt de partnerbureaus bij EventBliss. EventBliss is een product van MYFAMBLISS GROUP LTD, Paphos, Cyprus.",
  agreementLabel: "Partnerovereenkomst",
  imprintLabel: "Colofon",
  privacyLabel: "Privacy",
};

const pl: AgencyDemoCopy = {
  metaTitle: "Dla agencji — EventBliss",
  metaDescription:
    "Tak wygląda Wasz profil w EventBliss: grupy planujące wieczór kawalerski w Waszym mieście widzą Was w trakcie planowania i wysyłają zapytanie jednym kliknięciem.",
  eyebrow: "Dla agencji eventowych i organizatorów wieczorów kawalerskich",
  headline: (agency) =>
    agency ? `Tak wyglądałaby ${agency} w EventBliss` : "Tak wygląda Wasz profil w EventBliss",
  lead: (city) =>
    city
      ? `Grupa planuje wieczór kawalerski w mieście ${city}. Data ustalona, liczba osób ustalona, budżet też. Właśnie w tym momencie Was widzą — a kliknięcie później kompletne zapytanie leży w Waszej skrzynce.`
      : "Grupa planuje wieczór kawalerski. Data ustalona, liczba osób ustalona, budżet też. Właśnie w tym momencie Was widzą — a kliknięcie później kompletne zapytanie leży w Waszej skrzynce.",
  previewTitle: "Wasz profil w aplikacji",
  previewHint: "Podgląd — jeszcze nie jest publiczny",
  previewFallbackDescription: (city) =>
    `Atrakcje i programy dla grup w mieście ${city}. Ten tekst piszecie sami — albo przejmiemy go z Waszej strony.`,
  previewRequestButton: "Wyślij zapytanie",
  yourAgency: "Wasza agencja",
  yourCity: "Wasze miasto",
  requestTitle: "Co do Was trafia",
  requestHint: "Przykład zapytania w takiej postaci, w jakiej trafia do skrzynki",
  requestFields: [
    { label: "Okazja", value: "Wieczór kawalerski" },
    { label: "Termin", value: "Sobota, 12 września" },
    { label: "Grupa", value: "11 osób" },
    { label: "Budżet", value: "80–120 € na osobę" },
    { label: "Oczekiwania", value: "Coś aktywnego po południu, potem kolacja" },
  ],
  stepsTitle: "Jak to działa",
  steps: [
    {
      title: "Grupa planuje",
      body: "Terminy, budżet, podział kosztów, pomysły — grupa i tak trzyma to wszystko w aplikacji. Miasto, data i liczba osób istnieją więc na długo przed szukaniem wykonawcy.",
    },
    {
      title: "Jesteście widoczni w ich mieście",
      body: "Kto planuje coś w Waszym mieście, widzi Was z nazwą, ofertą i kontaktem. To nie miejsce reklamowe do kupienia, tylko lista lokalnych wykonawców.",
    },
    {
      title: "Zapytanie trafia do Was",
      body: "Jedno kliknięcie i macie okazję, termin, liczbę osób i widełki budżetowe w skrzynce. Albo grupa po prostu dzwoni. Od tej chwili wszystko dzieje się między Wami a grupą.",
    },
  ],
  factsTitle: "Krótko o tle",
  facts: [
    "Ponad dwa lata rozwoju; niedawno premiera na iOS i Androida, obok wersji przeglądarkowej.",
    "Dziesięć języków, dostępna międzynarodowo w sklepach z aplikacjami.",
    "W katalogu jest 171 agencji w dziewięciu krajach; rozbudowujemy go miasto po mieście.",
    "Planowanie, podział kosztów, pomysły i gry imprezowe w jednym produkcie — dlatego grupy już tam są, gdy szukają wykonawcy.",
  ],
  termsTitle: "Warunki",
  terms: [
    "Pilotaż nic Was nie kosztuje.",
    "Bez umowy i bez wyłączności — możecie zrezygnować w każdej chwili.",
    "Bez automatycznego przedłużenia i bez kosztów bez Waszej wyraźnej zgody.",
    "Bez pracy po Waszej stronie: profil zakładamy my, Wy tylko go przeglądacie.",
  ],
  termsFootnote:
    "Na koniec pilotażu wspólnie patrzymy na wyniki i otwarcie rozmawiamy o tym, co dalej.",
  ctaTitle: (agency) => (agency ? `Uzupełnij profil: ${agency}` : "Uzupełnijcie profil"),
  ctaBody:
    "Wpisujecie to, co ma się zgadzać — opis, ofertę, kontakt — a my publikujemy profil w Waszym mieście. Jeśli macie pytania albo wolicie najpierw porozmawiać: napiszcie do nas, chętnie się odezwiemy.",
  ctaButton: "Uzupełnij profil",
  ctaSecondary: "Zobacz aplikację",
  contactTitle: "Kto za tym stoi",
  contactBody:
    "Svitlana Kapinos opiekuje się agencjami partnerskimi w EventBliss. EventBliss jest produktem MYFAMBLISS GROUP LTD, Pafos, Cypr.",
  agreementLabel: "Umowa partnerska",
  imprintLabel: "Nota prawna",
  privacyLabel: "Prywatność",
};

const tr: AgencyDemoCopy = {
  metaTitle: "Ajanslar için — EventBliss",
  metaDescription:
    "Profiliniz EventBliss'te böyle görünüyor: şehrinizde bekarlığa veda planlayan gruplar sizi tam planlama anında görüyor ve tek dokunuşla talep gönderiyor.",
  eyebrow: "Etkinlik ve bekarlığa veda ajansları için",
  headline: (agency) =>
    agency ? `${agency} EventBliss'te böyle görünürdü` : "Profiliniz EventBliss'te böyle görünüyor",
  lead: (city) =>
    city
      ? `Bir grup ${city} şehrinde bekarlığa veda partisi planlıyor. Tarih belli, kişi sayısı belli, bütçe de belli. Sizi tam o anda görüyorlar — ve bir dokunuş sonra eksiksiz talep gelen kutunuzda oluyor.`
      : "Bir grup bekarlığa veda partisi planlıyor. Tarih belli, kişi sayısı belli, bütçe de belli. Sizi tam o anda görüyorlar — ve bir dokunuş sonra eksiksiz talep gelen kutunuzda oluyor.",
  previewTitle: "Uygulamadaki profiliniz",
  previewHint: "Önizleme — henüz yayında değil",
  previewFallbackDescription: (city) =>
    `${city} şehrindeki gruplar için deneyimler ve programlar. Bu metni siz yazarsınız — ya da biz web sitenizden alırız.`,
  previewRequestButton: "Talep gönder",
  yourAgency: "Ajansınız",
  yourCity: "Şehriniz",
  requestTitle: "Size ne ulaşıyor",
  requestHint: "Gelen kutunuza düşen bir talebin örneği",
  requestFields: [
    { label: "Vesile", value: "Bekarlığa veda" },
    { label: "Tarih", value: "12 Eylül Cumartesi" },
    { label: "Grup", value: "11 kişi" },
    { label: "Bütçe", value: "Kişi başı 80–120 €" },
    { label: "İstek", value: "Öğleden sonra hareketli bir şey, ardından yemek" },
  ],
  stepsTitle: "Nasıl işliyor",
  steps: [
    {
      title: "Grup planlıyor",
      body: "Tarihler, bütçe, masraf paylaşımı, fikirler — grup bunları zaten uygulamada tutuyor. Yani şehir, tarih ve kişi sayısı, kimse tedarikçi aramadan çok önce belli oluyor.",
    },
    {
      title: "Onların şehrinde görünüyorsunuz",
      body: "Şehrinizde bir şey planlayan kişi sizi adınız, hizmetiniz ve iletişim bilgilerinizle görür. Satın alınan bir reklam alanı değil — yerel tedarikçilerin listesi.",
    },
    {
      title: "Talep size geliyor",
      body: "Tek dokunuş ve vesile, tarih, kişi sayısı ve bütçe aralığı gelen kutunuzda. Ya da grup doğrudan arar. Oradan sonrası sizinle grup arasında.",
    },
  ],
  factsTitle: "Kısaca arka plan",
  facts: [
    "İki yılı aşkın geliştirme; web sürümünün yanında kısa süre önce iOS ve Android için yayınlandı.",
    "On dil, uygulama mağazalarında uluslararası olarak mevcut.",
    "Dizinde dokuz ülkeden 171 ajans var; şehir şehir büyütmeye devam ediyoruz.",
    "Planlama, masraf paylaşımı, fikirler ve parti oyunları tek üründe — bu yüzden gruplar tedarikçi ararken zaten oradalar.",
  ],
  termsTitle: "Koşullar",
  terms: [
    "Pilot size hiçbir şeye mal olmuyor.",
    "Sözleşme yok, münhasırlık yok — istediğiniz zaman çıkabilirsiniz.",
    "Otomatik yenileme yok; açık onayınız olmadan hiçbir ücret yok.",
    "Sizin tarafınızda iş yok: profili biz oluşturuyoruz, siz bir kez göz atıyorsunuz.",
  ],
  termsFootnote:
    "Pilotun sonunda sonuçlara birlikte bakıyor ve nasıl devam edileceğini açıkça konuşuyoruz.",
  ctaTitle: (agency) => (agency ? `${agency} profilini tamamlayın` : "Profilinizi tamamlayın"),
  ctaBody:
    "Doğru olması gerekenleri yazıyorsunuz — açıklama, hizmetler, iletişim — ve biz profili şehrinizde yayına alıyoruz. Sorunuz varsa ya da önce konuşmak isterseniz: bize yazın, görüşmekten memnuniyet duyarız.",
  ctaButton: "Profili tamamla",
  ctaSecondary: "Uygulamaya göz at",
  contactTitle: "Arkasında kim var",
  contactBody:
    "Svitlana Kapinos, EventBliss'te partner ajanslarla ilgileniyor. EventBliss, MYFAMBLISS GROUP LTD (Baf, Kıbrıs) ürünüdür.",
  agreementLabel: "Ortaklık sözleşmesi",
  imprintLabel: "Künye",
  privacyLabel: "Gizlilik",
};

const ar: AgencyDemoCopy = {
  metaTitle: "للوكالات — EventBliss",
  metaDescription:
    "هكذا يظهر ملفكم في EventBliss: المجموعات التي تخطط لحفل وداع العزوبية في مدينتكم تراكم أثناء التخطيط وترسل طلبها بنقرة واحدة.",
  eyebrow: "لوكالات الفعاليات وحفلات وداع العزوبية",
  headline: (agency) =>
    agency ? `هكذا ستظهر ${agency} في EventBliss` : "هكذا يظهر ملفكم في EventBliss",
  lead: (city) =>
    city
      ? `مجموعة تخطط لحفل وداع العزوبية في ${city}. التاريخ محدد، وعدد المشاركين محدد، والميزانية كذلك. في تلك اللحظة بالذات تظهرون لهم — وبنقرة واحدة يصل الطلب كاملاً إلى بريدكم.`
      : "مجموعة تخطط لحفل وداع العزوبية. التاريخ محدد، وعدد المشاركين محدد، والميزانية كذلك. في تلك اللحظة بالذات تظهرون لهم — وبنقرة واحدة يصل الطلب كاملاً إلى بريدكم.",
  previewTitle: "ملفكم داخل التطبيق",
  previewHint: "معاينة — غير منشور بعد",
  previewFallbackDescription: (city) =>
    `تجارب وبرامج للمجموعات في ${city}. هذا النص تكتبونه بأنفسكم — أو نأخذه من موقعكم.`,
  previewRequestButton: "إرسال الطلب",
  yourAgency: "وكالتكم",
  yourCity: "مدينتكم",
  requestTitle: "ما الذي يصلكم",
  requestHint: "مثال على طلب كما يصل إلى بريدكم",
  requestFields: [
    { label: "المناسبة", value: "وداع العزوبية" },
    { label: "التاريخ", value: "السبت، 12 سبتمبر" },
    { label: "المجموعة", value: "11 شخصاً" },
    { label: "الميزانية", value: "80–120 يورو للشخص" },
    { label: "المطلوب", value: "نشاط حركي بعد الظهر، ثم العشاء" },
  ],
  stepsTitle: "كيف تسير الأمور",
  steps: [
    {
      title: "المجموعة تخطط",
      body: "المواعيد والميزانية وتقسيم التكاليف والأفكار — كل ذلك تحفظه المجموعة في التطبيق على أي حال. أي أن المدينة والتاريخ وعدد المشاركين موجودة قبل وقت طويل من البحث عن مزوّد.",
    },
    {
      title: "تظهرون ضمن مدينتهم",
      body: "من يخطط لشيء في مدينتكم يراكم بالاسم والخدمات ووسائل التواصل. ليست مساحة إعلانية تُشترى، بل قائمة بمزوّدي الخدمة في المكان.",
    },
    {
      title: "الطلب يصل إليكم",
      body: "نقرة واحدة، ويصلكم في البريد نوع المناسبة والتاريخ وعدد المشاركين ونطاق الميزانية. أو تتصل بكم المجموعة مباشرة. بعد ذلك يبقى الأمر بينكم وبينها.",
    },
  ],
  factsTitle: "الخلفية باختصار",
  facts: [
    "أكثر من عامين من التطوير؛ صدر أخيراً لنظامي iOS وأندرويد، إلى جانب نسخة الويب.",
    "عشر لغات، ومتاح دولياً في متاجر التطبيقات.",
    "يضم الدليل 171 وكالة في تسع دول، ونوسّعه مدينةً تلو الأخرى.",
    "التخطيط وتقسيم التكاليف والأفكار وألعاب الحفلات في منتج واحد — لذلك تكون المجموعات موجودة أصلاً حين تبحث عن مزوّد.",
  ],
  termsTitle: "الشروط",
  terms: [
    "المرحلة التجريبية لا تكلفكم شيئاً.",
    "بلا عقد وبلا حصرية — يمكنكم الانسحاب في أي وقت.",
    "بلا تجديد تلقائي وبلا أي تكلفة دون موافقتكم الصريحة.",
    "بلا عبء عليكم: نحن ننشئ الملف وأنتم تراجعونه مرة واحدة.",
  ],
  termsFootnote:
    "في نهاية المرحلة التجريبية ننظر معاً في النتائج ونتحدث بصراحة عن كيفية المتابعة.",
  ctaTitle: (agency) => (agency ? `استكمال ملف ${agency}` : "استكمال ملفكم"),
  ctaBody:
    "تكتبون ما يجب أن يكون صحيحاً — الوصف والخدمات ووسائل التواصل — وننشر الملف ضمن مدينتكم. إن كانت لديكم أسئلة أو رغبتم بالحديث أولاً: راسلونا، يسعدنا التواصل.",
  ctaButton: "استكمال الملف",
  ctaSecondary: "استعراض التطبيق",
  contactTitle: "من وراء ذلك",
  contactBody:
    "تتولى سفيتلانا كابينوس متابعة الوكالات الشريكة في EventBliss. وEventBliss منتج تابع لشركة MYFAMBLISS GROUP LTD في بافوس، قبرص.",
  agreementLabel: "اتفاقية الشراكة",
  imprintLabel: "بيانات الناشر",
  privacyLabel: "الخصوصية",
};

const COPY: Record<SeoLang, AgencyDemoCopy> = { de, en, es, fr, it, pt, nl, pl, tr, ar };

/**
 * Text zur Sprache. Unbekanntes faellt auf Englisch zurueck — NICHT auf
 * Deutsch, anders als der Rest der App: eine spanische Agentur soll im
 * Zweifelsfall Englisch lesen, nicht Deutsch.
 */
export function agencyDemoCopy(lang: string | null | undefined): AgencyDemoCopy {
  return (lang && COPY[lang as SeoLang]) || en;
}
