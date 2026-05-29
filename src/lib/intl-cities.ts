/**
 * Multilingual ES/FR/IT city overlays for /despedida/:ciudad, /evg/:ville,
 * and /addio/:citta routes. Base data comes from JGA_CITIES; this file
 * provides language-specific intro, FAQs and tips per (city × language).
 */

import { JGA_CITIES, type JgaCity } from "./jga-cities";

export type IntlLang = "es" | "fr" | "it" | "pt" | "nl" | "pl" | "tr";

export interface IntlCopy {
  intro: string;
  tip: string;
  faqs: Array<{ q: string; a: string }>;
}

export interface IntlCityEntry {
  slug: string; // shared anglicised slug (matches /stag-do/[city])
  es: IntlCopy;
  fr: IntlCopy;
  it: IntlCopy;
  pt: IntlCopy;
  nl: IntlCopy;
  pl: IntlCopy;
  tr: IntlCopy;
}

// ──────────────────────────────────────────────────────────────────
// Per-language route metadata
// ──────────────────────────────────────────────────────────────────

export const LANG_META = {
  es: {
    path: "/despedida/",
    label: "Despedida de Soltero",
    locale: "es_ES",
    htmlLang: "es-ES",
    titleTpl: (n: string) => `Despedida de Soltero en ${n} — Guía Completa | EventBliss`,
    descriptionTpl: (n: string) =>
      `Despedida de soltero en ${n}: actividades, bares, barrios, presupuesto y consejos. Planifica con EventBliss en minutos.`,
    h1Prefix: "Despedida de Soltero en",
    introHeader: (n: string) => `¿Por qué una despedida en ${n}?`,
    activitiesHeader: (n: string) => `Mejores actividades en ${n}`,
    neighborhoodsHeader: "Dónde salir",
    budgetHeader: "Presupuesto",
    seasonHeader: "Mejor época",
    tipsHeader: "Consejos locales",
    faqHeader: "Preguntas frecuentes",
    ctaHeader: (n: string) => `¿Listo para tu despedida en ${n}?`,
    ctaText: "Crea un evento en 30 segundos, invita a tu crew, vota actividades y divide costes — todo en una sola app.",
    ctaButton: "Crear evento gratis",
    plan: "Planificar despedida",
    games: "Ver juegos de fiesta",
    otherCities: "¿Despedida en otra ciudad?",
  },
  fr: {
    path: "/evg/",
    label: "EVG",
    locale: "fr_FR",
    htmlLang: "fr-FR",
    titleTpl: (n: string) => `EVG à ${n} — Guide Complet | EventBliss`,
    descriptionTpl: (n: string) =>
      `EVG (enterrement de vie de garçon) à ${n} : activités, bars, quartiers, budget et conseils. Organisez avec EventBliss en quelques minutes.`,
    h1Prefix: "EVG à",
    introHeader: (n: string) => `Pourquoi un EVG à ${n} ?`,
    activitiesHeader: (n: string) => `Top activités à ${n}`,
    neighborhoodsHeader: "Où sortir",
    budgetHeader: "Budget",
    seasonHeader: "Meilleure saison",
    tipsHeader: "Conseils d'initiés",
    faqHeader: "FAQ",
    ctaHeader: (n: string) => `Prêt pour ton EVG à ${n} ?`,
    ctaText: "Crée un événement en 30 secondes, invite ton équipe, vote pour les activités et partage les frais — tout dans une seule app.",
    ctaButton: "Créer un événement",
    plan: "Planifier l'EVG",
    games: "Voir les jeux",
    otherCities: "EVG dans une autre ville ?",
  },
  it: {
    path: "/addio/",
    label: "Addio al Celibato",
    locale: "it_IT",
    htmlLang: "it-IT",
    titleTpl: (n: string) => `Addio al Celibato a ${n} — Guida Completa | EventBliss`,
    descriptionTpl: (n: string) =>
      `Addio al celibato a ${n}: attività, bar, quartieri, budget e consigli. Organizza con EventBliss in pochi minuti.`,
    h1Prefix: "Addio al Celibato a",
    introHeader: (n: string) => `Perché un addio al celibato a ${n}?`,
    activitiesHeader: (n: string) => `Top attività a ${n}`,
    neighborhoodsHeader: "Dove uscire",
    budgetHeader: "Budget",
    seasonHeader: "Periodo migliore",
    tipsHeader: "Consigli locali",
    faqHeader: "Domande frequenti",
    ctaHeader: (n: string) => `Pronti per l'addio al celibato a ${n}?`,
    ctaText: "Crea un evento in 30 secondi, invita il crew, vota le attività e dividi i costi — tutto in un'unica app.",
    ctaButton: "Crea evento gratis",
    plan: "Pianifica addio",
    games: "Vedi giochi",
    otherCities: "Addio in un'altra città?",
  },
  pt: {
    path: "/despedida-de-solteiro/",
    label: "Despedida de Solteiro",
    locale: "pt_PT",
    htmlLang: "pt-PT",
    titleTpl: (n: string) => `Despedida de Solteiro em ${n} — Guia Completo | EventBliss`,
    descriptionTpl: (n: string) =>
      `Despedida de solteiro em ${n}: atividades, bares, bairros, orçamento e dicas. Organiza com EventBliss em minutos.`,
    h1Prefix: "Despedida de Solteiro em",
    introHeader: (n: string) => `Porquê uma despedida em ${n}?`,
    activitiesHeader: (n: string) => `Melhores atividades em ${n}`,
    neighborhoodsHeader: "Onde sair",
    budgetHeader: "Orçamento",
    seasonHeader: "Melhor altura",
    tipsHeader: "Dicas locais",
    faqHeader: "Perguntas frequentes",
    ctaHeader: (n: string) => `Prontos para a despedida em ${n}?`,
    ctaText: "Cria um evento em 30 segundos, convida o teu grupo, vota nas atividades e divide os custos — tudo numa só app.",
    ctaButton: "Criar evento grátis",
    plan: "Planear despedida",
    games: "Ver jogos de festa",
    otherCities: "Despedida noutra cidade?",
  },
  nl: {
    path: "/vrijgezellenfeest/",
    label: "Vrijgezellenfeest",
    locale: "nl_NL",
    htmlLang: "nl-NL",
    titleTpl: (n: string) => `Vrijgezellenfeest ${n} — Complete Gids | EventBliss`,
    descriptionTpl: (n: string) =>
      `Vrijgezellenfeest in ${n}: activiteiten, bars, wijken, budget en tips. Plan met EventBliss in minuten.`,
    h1Prefix: "Vrijgezellenfeest",
    introHeader: (n: string) => `Waarom een vrijgezellenfeest in ${n}?`,
    activitiesHeader: (n: string) => `Top activiteiten in ${n}`,
    neighborhoodsHeader: "Waar uitgaan",
    budgetHeader: "Budget",
    seasonHeader: "Beste tijd",
    tipsHeader: "Insider tips",
    faqHeader: "Veelgestelde vragen",
    ctaHeader: (n: string) => `Klaar voor je vrijgezellenfeest in ${n}?`,
    ctaText: "Maak in 30 seconden een event, nodig je crew uit, stem over activiteiten en deel de kosten — alles in één app.",
    ctaButton: "Maak gratis event",
    plan: "Plan vrijgezellenfeest",
    games: "Bekijk feestspellen",
    otherCities: "Vrijgezellenfeest in een andere stad?",
  },
  pl: {
    path: "/wieczor-kawalerski/",
    label: "Wieczór Kawalerski",
    locale: "pl_PL",
    htmlLang: "pl-PL",
    titleTpl: (n: string) => `Wieczór Kawalerski w ${n} — Kompletny Przewodnik | EventBliss`,
    descriptionTpl: (n: string) =>
      `Wieczór kawalerski w ${n}: atrakcje, bary, dzielnice, budżet i wskazówki. Zaplanuj z EventBliss w kilka minut.`,
    h1Prefix: "Wieczór Kawalerski w",
    introHeader: (n: string) => `Dlaczego wieczór kawalerski w ${n}?`,
    activitiesHeader: (n: string) => `Najlepsze atrakcje w ${n}`,
    neighborhoodsHeader: "Gdzie wyjść",
    budgetHeader: "Budżet",
    seasonHeader: "Najlepszy czas",
    tipsHeader: "Wskazówki lokalne",
    faqHeader: "Najczęstsze pytania",
    ctaHeader: (n: string) => `Gotowi na wieczór kawalerski w ${n}?`,
    ctaText: "Utwórz wydarzenie w 30 sekund, zaproś ekipę, głosujcie nad atrakcjami i dzielcie koszty — wszystko w jednej aplikacji.",
    ctaButton: "Utwórz wydarzenie",
    plan: "Zaplanuj wieczór",
    games: "Zobacz gry imprezowe",
    otherCities: "Wieczór kawalerski w innym mieście?",
  },
  tr: {
    path: "/bekarliga-veda/",
    label: "Bekarlığa Veda",
    locale: "tr_TR",
    htmlLang: "tr-TR",
    titleTpl: (n: string) => `${n}'de Bekarlığa Veda — Eksiksiz Rehber | EventBliss`,
    descriptionTpl: (n: string) =>
      `${n}'de bekarlığa veda: aktiviteler, barlar, mahalleler, bütçe ve ipuçları. EventBliss ile dakikalar içinde planlayın.`,
    h1Prefix: "Bekarlığa Veda",
    introHeader: (n: string) => `Neden ${n}'de bekarlığa veda?`,
    activitiesHeader: (n: string) => `${n}'de en iyi aktiviteler`,
    neighborhoodsHeader: "Nereye çıkılır",
    budgetHeader: "Bütçe",
    seasonHeader: "En iyi zaman",
    tipsHeader: "Yerel ipuçları",
    faqHeader: "Sık sorulan sorular",
    ctaHeader: (n: string) => `${n}'de bekarlığa veda için hazır mısınız?`,
    ctaText: "30 saniyede etkinlik oluştur, ekibini davet et, aktiviteleri oyla ve maliyetleri böl — hepsi tek bir uygulamada.",
    ctaButton: "Ücretsiz etkinlik oluştur",
    plan: "Planı oluştur",
    games: "Parti oyunlarını gör",
    otherCities: "Başka şehirde bekarlığa veda?",
  },
} as const satisfies Record<IntlLang, Record<string, unknown>>;

// ──────────────────────────────────────────────────────────────────
// English slug → German JGA city slug mapping (for data lookup)
// ──────────────────────────────────────────────────────────────────

const EN_TO_DE: Record<string, string> = {
  munich: "muenchen",
  cologne: "koeln",
  dusseldorf: "duesseldorf",
  vienna: "wien",
  zurich: "zuerich",
  nuremberg: "nuernberg",
  krakow: "krakau",
  prague: "prag",
  lisbon: "lissabon",
  rome: "rom",
  milan: "mailand",
  florence: "florenz",
  warsaw: "warschau",
  athens: "athen",
  copenhagen: "kopenhagen",
  bucharest: "bukarest",
  brussels: "bruessel",
  nice: "nizza",
};

export function getJgaCityByEnSlug(enSlug: string): JgaCity | undefined {
  const deSlug = EN_TO_DE[enSlug.toLowerCase()] ?? enSlug.toLowerCase();
  return JGA_CITIES.find((c) => c.slug === deSlug);
}

// ──────────────────────────────────────────────────────────────────
// City-specific copy in ES / FR / IT (compact tier-3 content per city)
// ──────────────────────────────────────────────────────────────────

export const INTL_CITIES: IntlCityEntry[] = [
  {
    slug: "berlin",
    es: {
      intro: "Berlín es la capital europea de la despedida sin filtros: sin horario de cierre, cada subcultura a un U-Bahn de distancia, y bares para tres viajes sin repetir.",
      tip: "Un crawl de Spätis por Neukölln es más barato y divertido que cualquier pub crawl comercial — cada uno paga una ronda.",
      faqs: [
        { q: "¿Cuánto cuesta una despedida en Berlín?", a: "300–550 € por persona para un fin de semana con alojamiento, dos actividades y una noche de clubes. Con AirBnB y Spätis baja a 250 €." },
        { q: "¿Cómo entrar al Berghain en grupo?", a: "Casi imposible con 10 personas. Mejor Renate, Sisyphos o RSO — clubs más accesibles para grupos." },
      ],
    },
    fr: {
      intro: "Berlin est la capitale européenne de l'EVG sans filtre : pas d'heure de fermeture, chaque sous-culture à un U-Bahn, et assez de bars pour trois weekends sans répétition.",
      tip: "Un crawl de Spätis à Neukölln coûte un tiers d'un pub crawl commercial — chacun paie une tournée.",
      faqs: [
        { q: "Combien coûte un EVG à Berlin ?", a: "300–550 € par personne pour un weekend avec hôtel, deux activités et une nuit en club. AirBnB + Spätis fait baisser à 250 €." },
        { q: "Comment entrer au Berghain en groupe ?", a: "Quasi impossible à 10. Préférez Renate, Sisyphos ou RSO — clubs plus ouverts aux groupes." },
      ],
    },
    it: {
      intro: "Berlino è la capitale europea dell'addio al celibato senza filtri: nessun orario di chiusura, ogni sottocultura a una fermata della U-Bahn, e bar per tre viaggi diversi.",
      tip: "Un giro di Späti a Neukölln costa un terzo di un pub crawl commerciale — uno paga il giro a turno.",
      faqs: [
        { q: "Quanto costa un addio al celibato a Berlino?", a: "300–550 € a persona per un weekend con hotel, due attività e una serata in club. Con AirBnB e Späti scende a 250 €." },
        { q: "Come entrare al Berghain in gruppo?", a: "Quasi impossibile in 10. Meglio Renate, Sisyphos o RSO — club più accessibili." },
      ],
    },
    pt: {
      intro: "Berlim é a capital europeia da despedida sem filtros: sem hora de encerramento, cada subcultura a um U-Bahn de distância e bares para três fins de semana sem repetir.",
      tip: "Um crawl pelos Spätis de Neukölln custa um terço de um pub crawl comercial — cada um paga uma rodada.",
      faqs: [
        { q: "Quanto custa uma despedida em Berlim?", a: "300–550 € por pessoa para um fim de semana com hotel, duas atividades e uma noite de clube. Com AirBnB e Spätis desce para 250 €." },
        { q: "Como entrar no Berghain em grupo?", a: "Quase impossível com 10 pessoas. Melhor Renate, Sisyphos ou RSO — clubes mais acessíveis para grupos." },
      ],
    },
    nl: {
      intro: "Berlijn is de Europese hoofdstad van het vrijgezellenfeest zonder filter: geen sluitingstijd, elke subcultuur op een U-Bahn afstand en bars voor drie weekends zonder herhaling.",
      tip: "Een Späti-crawl in Neukölln kost een derde van een commerciële pub crawl — iedereen betaalt een rondje.",
      faqs: [
        { q: "Wat kost een vrijgezellenfeest in Berlijn?", a: "300–550 € per persoon voor een weekend met hotel, twee activiteiten en een clubnacht. Met AirBnB en Spätis zakt het naar 250 €." },
        { q: "Hoe kom je met een groep in Berghain?", a: "Vrijwel onmogelijk met 10. Beter Renate, Sisyphos of RSO — clubs die groepen makkelijker binnenlaten." },
      ],
    },
    pl: {
      intro: "Berlin to europejska stolica wieczorów kawalerskich bez filtra: brak godziny zamknięcia, każda subkultura w zasięgu U-Bahn, dość barów na trzy wyjazdy bez powtórek.",
      tip: "Crawl po Spätich w Neukölln kosztuje jedną trzecią komercyjnego pub crawl — każdy stawia kolejkę.",
      faqs: [
        { q: "Ile kosztuje wieczór kawalerski w Berlinie?", a: "300–550 € od osoby za weekend z hotelem, dwoma atrakcjami i nocą w klubie. Z AirBnB i Spätim spada do 250 €." },
        { q: "Jak wejść do Berghain w grupie?", a: "Niemal niemożliwe w 10 osób. Lepiej Renate, Sisyphos albo RSO — kluby przyjazne grupom." },
      ],
    },
    tr: {
      intro: "Berlin filtresiz bekarlığa veda partilerinin Avrupa başkentidir: kapanış saati yok, her alt kültür bir U-Bahn uzaklıkta, üç hafta sonu tekrarsız bar listesi.",
      tip: "Neukölln'de Späti turu, ticari pub crawl'un üçte birine mal olur — herkes sırayla içki ısmarlar.",
      faqs: [
        { q: "Berlin'de bekarlığa veda ne kadara mal olur?", a: "Hafta sonu, otel, iki aktivite ve bir kulüp gecesiyle kişi başı 300–550 €. AirBnB ve Späti ile 250 €'ya iner." },
        { q: "Grup olarak Berghain'a nasıl girilir?", a: "10 kişiyle neredeyse imkânsız. Renate, Sisyphos veya RSO daha gruba uygun kulüplerdir." },
      ],
    },
  },
  {
    slug: "barcelona",
    es: {
      intro: "Barcelona combina lo mejor de la despedida mediterránea: playa en la ciudad, tapas, Gaudí y clubes hasta el amanecer en el Port Olímpic.",
      tip: "Reserva las entradas para la Sagrada Família online — evita 2 horas de cola por la mañana.",
      faqs: [
        { q: "¿Cuánto cuesta una despedida en Barcelona?", a: "320–600 € por persona, 3 noches con vuelo y hotel medio. Con AirBnB para 8 personas baja a 280 €." },
        { q: "¿Cuándo empieza la noche en España?", a: "Tapas 19–23h, bares 22–02h, clubes 00–06h. Antes de medianoche estás solo." },
      ],
    },
    fr: {
      intro: "Barcelone combine le meilleur de l'EVG méditerranéen : plage en ville, tapas, Gaudí et clubs jusqu'à l'aube au Port Olímpic.",
      tip: "Réservez les billets Sagrada Família en ligne — évitez 2 heures de queue le matin.",
      faqs: [
        { q: "Combien coûte un EVG à Barcelone ?", a: "320–600 € par personne, 3 nuits avec vol et hôtel moyen. AirBnB pour 8 fait baisser à 280 €." },
        { q: "Quand commence la nuit en Espagne ?", a: "Tapas 19–23h, bars 22h–2h, clubs 0h–6h. Avant minuit vous êtes seul." },
      ],
    },
    it: {
      intro: "Barcellona unisce il meglio dell'addio mediterraneo: spiaggia in città, tapas, Gaudí e club fino all'alba al Port Olímpic.",
      tip: "Prenota i biglietti Sagrada Família online — eviti 2 ore di fila la mattina.",
      faqs: [
        { q: "Quanto costa un addio a Barcellona?", a: "320–600 € a persona, 3 notti con volo e hotel medio. AirBnB per 8 scende a 280 €." },
        { q: "A che ora inizia la notte in Spagna?", a: "Tapas 19–23, bar 22–02, club 00–06. Prima di mezzanotte si è soli." },
      ],
    },
    pt: {
      intro: "Barcelona combina o melhor da despedida mediterrânica: praia na cidade, tapas, Gaudí e clubes até de madrugada no Port Olímpic.",
      tip: "Reserva os bilhetes da Sagrada Família online — evita 2 horas de fila pela manhã.",
      faqs: [
        { q: "Quanto custa uma despedida em Barcelona?", a: "320–600 € por pessoa, 3 noites com voo e hotel médio. Com AirBnB para 8 desce para 280 €." },
        { q: "Quando começa a noite em Espanha?", a: "Tapas 19–23h, bares 22–02h, clubes 00–06h. Antes da meia-noite estás sozinho." },
      ],
    },
    nl: {
      intro: "Barcelona combineert het beste van het mediterrane vrijgezellenfeest: strand in de stad, tapas, Gaudí en clubs tot zonsopgang bij Port Olímpic.",
      tip: "Reserveer Sagrada Família-tickets online — vermijd 2 uur wachtrij in de ochtend.",
      faqs: [
        { q: "Wat kost een vrijgezellenfeest in Barcelona?", a: "320–600 € per persoon, 3 nachten met vlucht en middenklasse hotel. AirBnB voor 8 verlaagt het naar 280 €." },
        { q: "Wanneer begint het nachtleven in Spanje?", a: "Tapas 19–23u, bars 22–02u, clubs 00–06u. Vóór middernacht ben je alleen." },
      ],
    },
    pl: {
      intro: "Barcelona łączy to, co najlepsze w śródziemnomorskim wieczorze kawalerskim: plaża w mieście, tapas, Gaudí i kluby do rana w Port Olímpic.",
      tip: "Bilety do Sagrada Família zarezerwuj online — unikniesz 2 godzin kolejki rano.",
      faqs: [
        { q: "Ile kosztuje wieczór kawalerski w Barcelonie?", a: "320–600 € od osoby, 3 noce z lotem i hotelem średnim. AirBnB dla 8 osób obniża do 280 €." },
        { q: "Kiedy zaczyna się noc w Hiszpanii?", a: "Tapas 19–23, bary 22–02, kluby 00–06. Przed północą jesteś sam." },
      ],
    },
    tr: {
      intro: "Barselona Akdeniz bekarlığa veda partilerinin en iyilerini bir araya getirir: şehirde plaj, tapas, Gaudí ve Port Olímpic'te şafağa kadar kulüpler.",
      tip: "Sagrada Família biletlerini online rezerve et — sabahları 2 saatlik kuyruktan kurtulursun.",
      faqs: [
        { q: "Barselona'da bekarlığa veda ne kadara mal olur?", a: "Uçuş ve orta sınıf otelle 3 gece kişi başı 320–600 €. 8 kişi için AirBnB ile 280 €'ya iner." },
        { q: "İspanya'da gece kaçta başlar?", a: "Tapas 19–23, bar 22–02, kulüp 00–06. Gece yarısından önce yalnızsın." },
      ],
    },
  },
  {
    slug: "amsterdam",
    es: {
      intro: "Ámsterdam es el clásico internacional: canales, coffeeshops, distrito rojo, y un centro compacto con cientos de bares en 2 km.",
      tip: "Charter privado de canales con bebidas propias: 200 € por 2 horas para 12 personas — mejor que cualquier tour comercial.",
      faqs: [
        { q: "¿Cuánto cuesta Ámsterdam?", a: "380–680 € por persona con vuelo y hotel medio. Caro pero único." },
        { q: "¿Qué hay legal con el cannabis?", a: "Legal en coffeeshops hasta 5g por persona. Fuera de coffeeshops oficialmente prohibido pero tolerado." },
      ],
    },
    fr: {
      intro: "Amsterdam est le classique international : canaux, coffeeshops, quartier rouge, et un centre compact avec des centaines de bars dans 2 km.",
      tip: "Charter privé de canal avec ses propres boissons : 200 € pour 2 heures à 12 personnes — meilleur que tout tour commercial.",
      faqs: [
        { q: "Combien coûte Amsterdam ?", a: "380–680 € par personne avec vol et hôtel moyen. Cher mais unique." },
        { q: "Que dit la loi sur le cannabis ?", a: "Légal dans les coffeeshops jusqu'à 5g. Dans la rue officiellement interdit mais toléré." },
      ],
    },
    it: {
      intro: "Amsterdam è il classico internazionale: canali, coffeeshop, quartiere rosso, e un centro compatto con centinaia di bar in 2 km.",
      tip: "Charter privato sui canali con bevande proprie: 200 € per 2 ore con 12 persone — meglio di qualsiasi tour commerciale.",
      faqs: [
        { q: "Quanto costa Amsterdam?", a: "380–680 € a persona con volo e hotel medio. Caro ma unico." },
        { q: "Cosa è legale per la cannabis?", a: "Legale nei coffeeshop fino a 5g. Per strada vietato ufficialmente ma tollerato." },
      ],
    },
    pt: {
      intro: "Amesterdão é o clássico internacional: canais, coffeeshops, bairro vermelho e centro compacto com centenas de bares em 2 km.",
      tip: "Charter privado de canal com bebidas próprias: 200 € por 2 horas para 12 pessoas — melhor que qualquer tour comercial.",
      faqs: [
        { q: "Quanto custa Amesterdão?", a: "380–680 € por pessoa com voo e hotel médio. Caro mas único." },
        { q: "O que é legal com cannabis?", a: "Legal nos coffeeshops até 5g por pessoa. Fora deles oficialmente proibido mas tolerado." },
      ],
    },
    nl: {
      intro: "Amsterdam is de internationale klassieker: grachten, coffeeshops, Wallen en een compact centrum met honderden bars in 2 km.",
      tip: "Privé grachtenrondvaart met eigen drank: 200 € voor 2 uur voor 12 personen — beter dan elke commerciële tour.",
      faqs: [
        { q: "Wat kost Amsterdam?", a: "380–680 € per persoon met vlucht en middenklasse hotel. Duur maar uniek." },
        { q: "Wat mag met cannabis?", a: "Legaal in coffeeshops tot 5g per persoon. Buiten coffeeshops officieel verboden maar getolereerd." },
      ],
    },
    pl: {
      intro: "Amsterdam to międzynarodowy klasyk: kanały, coffeeshopy, dzielnica czerwonych latarni i zwarte centrum z setkami barów w 2 km.",
      tip: "Prywatny rejs po kanałach z własnym alkoholem: 200 € za 2 godziny dla 12 osób — lepiej niż każda komercyjna wycieczka.",
      faqs: [
        { q: "Ile kosztuje Amsterdam?", a: "380–680 € od osoby z lotem i hotelem średnim. Drogo, ale wyjątkowo." },
        { q: "Co jest legalne z marihuaną?", a: "Legalne w coffeeshopach do 5g na osobę. Poza nimi oficjalnie zakazane, ale tolerowane." },
      ],
    },
    tr: {
      intro: "Amsterdam uluslararası klasiktir: kanallar, coffeeshop'lar, kırmızı fener bölgesi ve 2 km'de yüzlerce barı olan kompakt merkez.",
      tip: "Kendi içkilerinle özel kanal kiralama: 12 kişi için 2 saat 200 € — herhangi bir ticari turdan iyi.",
      faqs: [
        { q: "Amsterdam ne kadara mal olur?", a: "Uçuş ve orta sınıf otelle kişi başı 380–680 €. Pahalı ama eşsiz." },
        { q: "Esrar konusunda yasal nedir?", a: "Coffeeshop'larda kişi başı 5g'a kadar yasal. Dışında resmi olarak yasak ama göz yumulur." },
      ],
    },
  },
  {
    slug: "prague",
    es: {
      intro: "Praga es el destino más reservado para despedidas en Europa: precios mitad de Berlín, casco antiguo precioso y vuelos directos desde toda Europa.",
      tip: "Beer Spa: 60 minutos en bañera de cerveza con Pilsner sin límite. Surreal, icónico, material de historia garantizado.",
      faqs: [
        { q: "¿Cuánto cuesta una despedida en Praga?", a: "190–400 € por persona con vuelo, hotel y dos actividades. Imposible de batir en Europa." },
        { q: "¿Por qué Praga es tan barata?", a: "Cerveza Pilsner 2–3 €, hotel en casco antiguo desde 50 €, actividades a mitad de precio que en DACH." },
      ],
    },
    fr: {
      intro: "Prague est la destination EVG la plus réservée d'Europe : prix moitié de Berlin, vieille ville magnifique et vols directs partout.",
      tip: "Beer Spa : 60 minutes dans une baignoire de bière avec Pilsner illimité. Surréaliste, iconique, matériel d'histoire garanti.",
      faqs: [
        { q: "Combien coûte un EVG à Prague ?", a: "190–400 € par personne avec vol, hôtel et deux activités. Imbattable en Europe." },
        { q: "Pourquoi Prague est si bon marché ?", a: "Bière Pilsner 2–3 €, hôtel en vieille ville dès 50 €, activités à moitié prix par rapport à l'Allemagne." },
      ],
    },
    it: {
      intro: "Praga è la meta più prenotata in Europa per addii al celibato: prezzi metà di Berlino, centro storico bellissimo e voli diretti ovunque.",
      tip: "Beer Spa: 60 minuti in vasca di birra con Pilsner illimitato. Surreale, iconico, storia garantita.",
      faqs: [
        { q: "Quanto costa un addio a Praga?", a: "190–400 € a persona con volo, hotel e due attività. Imbattibile in Europa." },
        { q: "Perché Praga è così economica?", a: "Birra Pilsner 2–3 €, hotel nel centro storico da 50 €, attività a metà prezzo rispetto alla Germania." },
      ],
    },
    pt: {
      intro: "Praga é o destino mais reservado para despedidas na Europa: preços de metade de Berlim, cidade antiga linda e voos diretos de toda a Europa.",
      tip: "Beer Spa: 60 minutos em banheira de cerveja com Pilsner ilimitada. Surreal, icónico, material de história garantido.",
      faqs: [
        { q: "Quanto custa uma despedida em Praga?", a: "190–400 € por pessoa com voo, hotel e duas atividades. Imbatível na Europa." },
        { q: "Porque é Praga tão barata?", a: "Cerveja Pilsner 2–3 €, hotel no centro histórico a partir de 50 €, atividades a metade do preço da Alemanha." },
      ],
    },
    nl: {
      intro: "Praag is de meest geboekte vrijgezellenbestemming in Europa: half zo duur als Berlijn, prachtige oude stad en directe vluchten vanuit heel Europa.",
      tip: "Beer Spa: 60 minuten in een bad van bier met onbeperkt Pilsner. Surrealistisch, iconisch, gegarandeerd verhaalmateriaal.",
      faqs: [
        { q: "Wat kost een vrijgezellenfeest in Praag?", a: "190–400 € per persoon met vlucht, hotel en twee activiteiten. Onverslaanbaar in Europa." },
        { q: "Waarom is Praag zo goedkoop?", a: "Pilsner 2–3 €, hotel in de oude stad vanaf 50 €, activiteiten voor de helft van Duitsland." },
      ],
    },
    pl: {
      intro: "Praga to najczęściej rezerwowany cel wieczorów kawalerskich w Europie: ceny o połowę niższe niż w Berlinie, piękna starówka i bezpośrednie loty z całej Europy.",
      tip: "Beer Spa: 60 minut w wannie pełnej piwa z nieograniczonym Pilsnerem. Surrealistyczne, kultowe, gwarantowany materiał na anegdotę.",
      faqs: [
        { q: "Ile kosztuje wieczór kawalerski w Pradze?", a: "190–400 € od osoby z lotem, hotelem i dwoma atrakcjami. Niepokonane w Europie." },
        { q: "Dlaczego Praga jest tak tania?", a: "Pilsner 2–3 €, hotel na starówce od 50 €, atrakcje za pół ceny w porównaniu do Niemiec." },
      ],
    },
    tr: {
      intro: "Prag, Avrupa'nın en çok rezervasyon yapılan bekarlığa veda destinasyonudur: Berlin'in yarı fiyatı, muhteşem eski şehir ve Avrupa'nın her yerinden direkt uçuşlar.",
      tip: "Beer Spa: sınırsız Pilsner ile 60 dakika bira küvetinde banyo. Sürreal, ikonik, garantili hikâye malzemesi.",
      faqs: [
        { q: "Prag'da bekarlığa veda ne kadara mal olur?", a: "Uçuş, otel ve iki aktivite dahil kişi başı 190–400 €. Avrupa'da rakipsiz." },
        { q: "Prag neden bu kadar ucuz?", a: "Pilsner birası 2–3 €, eski şehirde otel 50 €'dan, aktiviteler Almanya'nın yarı fiyatına." },
      ],
    },
  },
  {
    slug: "london",
    es: {
      intro: "Londres es la capital europea de los cócteles: bares de clase mundial, Soho, Shoreditch y experiencias de despedida desde el Sky Garden hasta el Támesis.",
      tip: "Sky Garden en el piso 35 — gratis con reserva online, mejor vista panorámica de Londres, foto obligatoria.",
      faqs: [
        { q: "¿Cuánto cuesta una despedida en Londres?", a: "480–900 € por persona con vuelo. Pinta 6–8 £, cóctel 12–18 £. Una de las opciones más caras de Europa." },
        { q: "¿Cómo entrar a clubes con grupo de hombres?", a: "Reservas con bottle service evitan la selección. O dividir en grupos pequeños de 3–4." },
      ],
    },
    fr: {
      intro: "Londres est la capitale européenne du cocktail : bars de classe mondiale, Soho, Shoreditch et expériences EVG du Sky Garden à la Tamise.",
      tip: "Sky Garden au 35e étage — gratuit avec réservation en ligne, meilleure vue panoramique de Londres, photo obligatoire.",
      faqs: [
        { q: "Combien coûte un EVG à Londres ?", a: "480–900 € par personne avec vol. Pinte 6–8 £, cocktail 12–18 £. Une des options les plus chères d'Europe." },
        { q: "Comment entrer en boîte à plusieurs hommes ?", a: "Réservations avec bottle service évitent la sélection. Ou diviser en groupes de 3–4." },
      ],
    },
    it: {
      intro: "Londra è la capitale europea dei cocktail: bar di classe mondiale, Soho, Shoreditch ed esperienze d'addio dallo Sky Garden al Tamigi.",
      tip: "Sky Garden al 35° piano — gratis con prenotazione online, miglior vista panoramica di Londra, foto obbligatoria.",
      faqs: [
        { q: "Quanto costa un addio a Londra?", a: "480–900 € a persona con volo. Birra 6–8 £, cocktail 12–18 £. Una delle opzioni più care d'Europa." },
        { q: "Come entrare in club con gruppo maschile?", a: "Prenotazioni con bottle service evitano la selezione. O dividere in gruppi da 3–4." },
      ],
    },
    pt: {
      intro: "Londres é a capital europeia dos cocktails: bares de classe mundial, Soho, Shoreditch e experiências de despedida do Sky Garden ao Tamisa.",
      tip: "Sky Garden no piso 35 — gratuito com reserva online, melhor vista panorâmica de Londres, foto obrigatória.",
      faqs: [
        { q: "Quanto custa uma despedida em Londres?", a: "480–900 € por pessoa com voo. Pint 6–8 £, cocktail 12–18 £. Uma das opções mais caras da Europa." },
        { q: "Como entrar em clubes com grupo masculino?", a: "Reservas com bottle service evitam a seleção. Ou dividir em grupos de 3–4." },
      ],
    },
    nl: {
      intro: "Londen is de Europese hoofdstad van cocktails: bars van wereldklasse, Soho, Shoreditch en vrijgezellenfeesten van Sky Garden tot de Theems.",
      tip: "Sky Garden op de 35e verdieping — gratis met online reservering, beste panorama van Londen, verplichte foto.",
      faqs: [
        { q: "Wat kost een vrijgezellenfeest in Londen?", a: "480–900 € per persoon met vlucht. Pint 6–8 £, cocktail 12–18 £. Een van de duurste opties in Europa." },
        { q: "Hoe kom je in clubs met een mannelijke groep?", a: "Reserveringen met bottle service omzeilen de selectie. Of splits op in groepjes van 3–4." },
      ],
    },
    pl: {
      intro: "Londyn to europejska stolica koktajli: bary światowej klasy, Soho, Shoreditch i wieczory kawalerskie od Sky Garden po Tamizę.",
      tip: "Sky Garden na 35. piętrze — bezpłatny z rezerwacją online, najlepsza panorama Londynu, obowiązkowe zdjęcie.",
      faqs: [
        { q: "Ile kosztuje wieczór kawalerski w Londynie?", a: "480–900 € od osoby z lotem. Pinta 6–8 £, koktajl 12–18 £. Jedna z najdroższych opcji w Europie." },
        { q: "Jak wejść do klubów z męską ekipą?", a: "Rezerwacje z bottle service omijają selekcję. Albo dzielcie się na grupki po 3–4." },
      ],
    },
    tr: {
      intro: "Londra Avrupa'nın kokteyl başkentidir: dünya çapında barlar, Soho, Shoreditch ve Sky Garden'dan Thames'e bekarlığa veda deneyimleri.",
      tip: "35. kattaki Sky Garden — online rezervasyonla ücretsiz, Londra'nın en iyi panoramik manzarası, zorunlu fotoğraf noktası.",
      faqs: [
        { q: "Londra'da bekarlığa veda ne kadara mal olur?", a: "Uçuşla kişi başı 480–900 €. Pinta 6–8 £, kokteyl 12–18 £. Avrupa'nın en pahalı seçeneklerinden biri." },
        { q: "Erkek grup olarak kulüplere nasıl girilir?", a: "Bottle service ile rezervasyon kapı seçimini aşar. Ya da 3–4 kişilik küçük gruplara bölün." },
      ],
    },
  },
  {
    slug: "paris",
    es: {
      intro: "París es para crews que quieren elegancia y escalación: vino en lugar de cerveza, cócteles top en Le Marais, Pigalle como parada obligatoria.",
      tip: "TGV/ICE desde Frankfurt o Colonia llega al centro en 4–6 horas — más relajado que volar y misma tarifa desde 80 €.",
      faqs: [
        { q: "¿Cuánto cuesta una despedida en París?", a: "500–900 € por persona con viaje, hotel medio y dos noches de bares. AirBnB en Le Marais reduce a 380 €." },
        { q: "¿París para crews puramente masculinas?", a: "Difícil con los porteros. Reservar con bottle service o ir a bares en lugar de clubes top." },
      ],
    },
    fr: {
      intro: "Paris est pour les crews qui veulent élégance et escalade : vin plutôt que bière, cocktails top à Le Marais, Pigalle en arrêt obligatoire.",
      tip: "TGV depuis Francfort ou Cologne arrive au centre en 4–6 heures — plus reposant que l'avion et tarif identique dès 80 €.",
      faqs: [
        { q: "Combien coûte un EVG à Paris ?", a: "500–900 € par personne avec transport, hôtel moyen et deux soirées en bar. AirBnB au Marais réduit à 380 €." },
        { q: "Paris pour crew 100 % masculine ?", a: "Difficile avec les videurs. Réservez avec bottle service ou restez dans les bars plutôt que clubs top." },
      ],
    },
    it: {
      intro: "Parigi è per crew che vogliono eleganza ed escalation: vino anziché birra, cocktail top a Le Marais, Pigalle come tappa obbligata.",
      tip: "TGV da Francoforte o Colonia arriva al centro in 4–6 ore — più rilassante del volo e stesso prezzo da 80 €.",
      faqs: [
        { q: "Quanto costa un addio a Parigi?", a: "500–900 € a persona con viaggio, hotel medio e due serate. AirBnB nel Marais scende a 380 €." },
        { q: "Parigi per crew tutta maschile?", a: "Difficile con i buttafuori. Prenota con bottle service o resta nei bar invece dei top club." },
      ],
    },
    pt: {
      intro: "Paris é para grupos que querem elegância e escalada: vinho em vez de cerveja, cocktails top em Le Marais, Pigalle como paragem obrigatória.",
      tip: "TGV/ICE de Frankfurt ou Colónia chega ao centro em 4–6 horas — mais relaxado que voar e mesmo preço desde 80 €.",
      faqs: [
        { q: "Quanto custa uma despedida em Paris?", a: "500–900 € por pessoa com viagem, hotel médio e duas noites de bares. AirBnB no Marais reduz para 380 €." },
        { q: "Paris para grupos só masculinos?", a: "Difícil com os porteiros. Reservar com bottle service ou ficar em bares em vez de clubes top." },
      ],
    },
    nl: {
      intro: "Parijs is voor crews die elegantie en escalatie willen: wijn in plaats van bier, topcocktails in Le Marais, Pigalle als verplichte stop.",
      tip: "TGV/ICE vanuit Frankfurt of Keulen bereikt het centrum in 4–6 uur — relaxter dan vliegen en zelfde tarief vanaf 80 €.",
      faqs: [
        { q: "Wat kost een vrijgezellenfeest in Parijs?", a: "500–900 € per persoon met reis, middenklasse hotel en twee baravonden. AirBnB in Marais brengt het naar 380 €." },
        { q: "Parijs voor pure mannengroep?", a: "Lastig met portiers. Boek met bottle service of blijf in bars in plaats van topclubs." },
      ],
    },
    pl: {
      intro: "Paryż jest dla ekip chcących elegancji i imprezy: wino zamiast piwa, topowe koktajle w Le Marais, Pigalle jako obowiązkowy przystanek.",
      tip: "TGV/ICE z Frankfurtu lub Kolonii dociera do centrum w 4–6 godzin — wygodniej niż lot i ta sama cena od 80 €.",
      faqs: [
        { q: "Ile kosztuje wieczór kawalerski w Paryżu?", a: "500–900 € od osoby z dojazdem, hotelem średnim i dwoma wieczorami w barach. AirBnB w Marais zbija do 380 €." },
        { q: "Paryż dla czysto męskiej ekipy?", a: "Trudno z bramkarzami. Rezerwacja z bottle service albo siedźcie w barach zamiast topowych klubów." },
      ],
    },
    tr: {
      intro: "Paris zarafet ve eğlence isteyen ekipler içindir: bira yerine şarap, Le Marais'de üst seviye kokteyller, Pigalle zorunlu durak.",
      tip: "Frankfurt veya Köln'den TGV/ICE merkeze 4–6 saatte ulaşır — uçuştan rahat, 80 €'dan başlayan aynı fiyat.",
      faqs: [
        { q: "Paris'te bekarlığa veda ne kadara mal olur?", a: "Ulaşım, orta sınıf otel ve iki bar gecesi dahil kişi başı 500–900 €. Marais'de AirBnB ile 380 €'ya iner." },
        { q: "Tamamen erkek ekip için Paris?", a: "Fedailerle zor. Bottle service'li rezervasyon yap ya da top kulüpler yerine barlarda kal." },
      ],
    },
  },
  {
    slug: "dublin",
    es: {
      intro: "Dublín perfeccionó la despedida: Temple Bar como eje, Guinness Storehouse obligatorio, y una cultura de pub que trata los grupos como inventario estándar.",
      tip: "St. Patrick's Day (17 marzo) es la fecha legendaria — pero hoteles triplican precio, reserva 6 meses antes.",
      faqs: [
        { q: "¿Cuánto cuesta Dublín?", a: "480–800 € por persona con vuelo. Pinta 7–9 €, hotel desde 130 €. Caro pero único." },
        { q: "¿Temple Bar todavía vale la pena?", a: "Sí como visita obligatoria, pero precios el doble que en Camden Street. Una pinta y a otro sitio." },
      ],
    },
    fr: {
      intro: "Dublin a perfectionné l'EVG : Temple Bar comme axe central, Guinness Storehouse obligatoire, et une culture de pub qui traite les groupes comme du standard.",
      tip: "St. Patrick's Day (17 mars) est la date légendaire — mais les hôtels triplent, réservez 6 mois avant.",
      faqs: [
        { q: "Combien coûte Dublin ?", a: "480–800 € par personne avec vol. Pinte 7–9 €, hôtel dès 130 €. Cher mais unique." },
        { q: "Temple Bar vaut encore le coup ?", a: "Oui en visite obligatoire, mais prix doubles par rapport à Camden Street. Une pinte et on bouge." },
      ],
    },
    it: {
      intro: "Dublino ha perfezionato l'addio al celibato: Temple Bar come asse centrale, Guinness Storehouse obbligatorio, e una cultura del pub che tratta i gruppi come inventario.",
      tip: "St. Patrick's Day (17 marzo) è la data leggendaria — ma gli hotel triplicano, prenota 6 mesi prima.",
      faqs: [
        { q: "Quanto costa Dublino?", a: "480–800 € a persona con volo. Pinta 7–9 €, hotel da 130 €. Caro ma unico." },
        { q: "Temple Bar ne vale ancora la pena?", a: "Sì come visita obbligata, ma prezzi doppi rispetto a Camden Street. Una pinta e si va oltre." },
      ],
    },
    pt: {
      intro: "Dublin aperfeiçoou a despedida: Temple Bar como eixo, Guinness Storehouse obrigatório e uma cultura de pub que trata grupos como inventário standard.",
      tip: "St. Patrick's Day (17 março) é a data lendária — mas os hotéis triplicam de preço, reserva 6 meses antes.",
      faqs: [
        { q: "Quanto custa Dublin?", a: "480–800 € por pessoa com voo. Pint 7–9 €, hotel desde 130 €. Caro mas único." },
        { q: "Temple Bar ainda vale a pena?", a: "Sim como visita obrigatória, mas preços duplos comparado com Camden Street. Uma pint e seguir caminho." },
      ],
    },
    nl: {
      intro: "Dublin heeft het vrijgezellenfeest geperfectioneerd: Temple Bar als hoofdader, Guinness Storehouse verplicht en een pubcultuur die groepen als standaard ziet.",
      tip: "St. Patrick's Day (17 maart) is de legendarische datum — maar hotels verdrievoudigen in prijs, boek 6 maanden vooraf.",
      faqs: [
        { q: "Wat kost Dublin?", a: "480–800 € per persoon met vlucht. Pint 7–9 €, hotel vanaf 130 €. Duur maar uniek." },
        { q: "Temple Bar nog steeds de moeite waard?", a: "Ja als verplichte stop, maar prijzen dubbel zo hoog als Camden Street. Eén pint en door." },
      ],
    },
    pl: {
      intro: "Dublin udoskonalił wieczór kawalerski: Temple Bar jako oś, Guinness Storehouse obowiązkowe, kultura pubów traktująca grupy jak standardowy inwentarz.",
      tip: "Dzień św. Patryka (17 marca) to legendarna data — ale hotele potrajają ceny, rezerwuj 6 miesięcy wcześniej.",
      faqs: [
        { q: "Ile kosztuje Dublin?", a: "480–800 € od osoby z lotem. Pinta 7–9 €, hotel od 130 €. Drogo, ale wyjątkowo." },
        { q: "Czy Temple Bar wciąż się opłaca?", a: "Tak jako obowiązkowy punkt, ale ceny dwukrotnie wyższe niż na Camden Street. Jedna pinta i dalej." },
      ],
    },
    tr: {
      intro: "Dublin bekarlığa vedayı mükemmelleştirdi: merkez Temple Bar, zorunlu Guinness Storehouse ve grupları standart envanter olarak gören pub kültürü.",
      tip: "St. Patrick's Day (17 Mart) efsanevi tarihtir — ama oteller fiyatları üçe katlar, 6 ay önce rezervasyon yap.",
      faqs: [
        { q: "Dublin ne kadara mal olur?", a: "Uçuşla kişi başı 480–800 €. Pinta 7–9 €, otel 130 €'dan. Pahalı ama eşsiz." },
        { q: "Temple Bar hâlâ değer mi?", a: "Zorunlu uğrak olarak evet, ama fiyatlar Camden Street'in iki katı. Bir pinta sonra devam edin." },
      ],
    },
  },
  {
    slug: "rome",
    es: {
      intro: "Roma combina escenario antiguo con cultura del aperitivo: Coliseo de día, Trastevere y Monti de noche para cócteles y pasta auténtica.",
      tip: "Aperitivo 19–21h: cóctel de 8–12 € con buffet gratis. Mejor pre-drink de Europa.",
      faqs: [
        { q: "¿Cuánto cuesta una despedida en Roma?", a: "380–650 € por persona con vuelo. Más cara que Milán, más barata que París." },
        { q: "¿Qué es exactamente un aperitivo?", a: "Tradición italiana: cóctel a las 19–21h con buffet gratis (salami, queso, pasta). El mejor pre-drink europeo." },
      ],
    },
    fr: {
      intro: "Rome combine décor antique et culture de l'apéritif : Colisée le jour, Trastevere et Monti la nuit pour cocktails et pâtes authentiques.",
      tip: "Apéritif 19–21h : cocktail à 8–12 € avec buffet gratuit. Meilleur pre-drink d'Europe.",
      faqs: [
        { q: "Combien coûte un EVG à Rome ?", a: "380–650 € par personne avec vol. Plus cher que Milan, moins cher que Paris." },
        { q: "C'est quoi exactement l'apéritif ?", a: "Tradition italienne : cocktail à 19–21h avec buffet gratuit (saucisson, fromage, pâtes). Meilleur pre-drink européen." },
      ],
    },
    it: {
      intro: "Roma unisce scenario antico e cultura dell'aperitivo: Colosseo di giorno, Trastevere e Monti di notte per cocktail e pasta autentica.",
      tip: "Aperitivo 19–21: cocktail a 8–12 € con buffet gratis. Miglior pre-drink d'Europa.",
      faqs: [
        { q: "Quanto costa un addio a Roma?", a: "380–650 € a persona con volo. Più caro di Milano, meno caro di Parigi." },
        { q: "Cos'è esattamente l'aperitivo?", a: "Tradizione italiana: cocktail alle 19–21 con buffet gratis (salame, formaggio, pasta). Miglior pre-drink europeo." },
      ],
    },
    pt: {
      intro: "Roma combina cenário antigo com cultura do aperitivo: Coliseu de dia, Trastevere e Monti à noite para cocktails e pasta autêntica.",
      tip: "Aperitivo das 19–21h: cocktail 8–12 € com buffet gratuito. Melhor pre-drink da Europa.",
      faqs: [
        { q: "Quanto custa uma despedida em Roma?", a: "380–650 € por pessoa com voo. Mais caro que Milão, mais barato que Paris." },
        { q: "O que é exatamente um aperitivo?", a: "Tradição italiana: cocktail às 19–21h com buffet gratuito (salame, queijo, pasta). Melhor pre-drink europeu." },
      ],
    },
    nl: {
      intro: "Rome combineert antiek decor met aperitivo-cultuur: Colosseum overdag, Trastevere en Monti 's avonds voor cocktails en authentieke pasta.",
      tip: "Aperitivo 19–21u: cocktail 8–12 € met gratis buffet. Beste pre-drink van Europa.",
      faqs: [
        { q: "Wat kost een vrijgezellenfeest in Rome?", a: "380–650 € per persoon met vlucht. Duurder dan Milaan, goedkoper dan Parijs." },
        { q: "Wat is een aperitivo precies?", a: "Italiaanse traditie: cocktail van 19–21u met gratis buffet (salami, kaas, pasta). Beste pre-drink van Europa." },
      ],
    },
    pl: {
      intro: "Rzym łączy starożytną scenografię z kulturą aperitivo: Koloseum w dzień, Trastevere i Monti wieczorem na koktajle i autentyczną pastę.",
      tip: "Aperitivo 19–21: koktajl 8–12 € z darmowym bufetem. Najlepszy pre-drink w Europie.",
      faqs: [
        { q: "Ile kosztuje wieczór kawalerski w Rzymie?", a: "380–650 € od osoby z lotem. Drożej niż Mediolan, taniej niż Paryż." },
        { q: "Czym dokładnie jest aperitivo?", a: "Włoska tradycja: koktajl o 19–21 z darmowym bufetem (salami, ser, pasta). Najlepszy europejski pre-drink." },
      ],
    },
    tr: {
      intro: "Roma antik dekoru aperitivo kültürüyle birleştirir: gündüz Kolezyum, gece Trastevere ve Monti'de kokteyl ve otantik pasta.",
      tip: "19–21 arası aperitivo: 8–12 € kokteyl + ücretsiz büfe. Avrupa'nın en iyi pre-drink seçeneği.",
      faqs: [
        { q: "Roma'da bekarlığa veda ne kadara mal olur?", a: "Uçuşla kişi başı 380–650 €. Milano'dan pahalı, Paris'ten ucuz." },
        { q: "Aperitivo tam olarak nedir?", a: "İtalyan geleneği: 19–21 arası kokteyl + ücretsiz büfe (salam, peynir, pasta). Avrupa'nın en iyi pre-drink'i." },
      ],
    },
  },
  {
    slug: "milan",
    es: {
      intro: "Milán es elegancia y cócteles: Navigli como eje de aperitivos, Brera para bares sofisticados, Lago di Como a 45 minutos en tren.",
      tip: "Aperitivo en Naviglio Grande: Spritz 8 € + buffet gratis. Una hora ahí cubre la cena.",
      faqs: [
        { q: "¿Milán o Roma para despedida?", a: "Milán para cócteles y estilo. Roma para historia y pasta. Milán más caro pero más compacto." },
        { q: "¿Vale la pena Como?", a: "Sí, ferry desde Como o Bellagio en 45 minutos de tren. Foto obligatoria de villa George Clooney." },
      ],
    },
    fr: {
      intro: "Milan est élégance et cocktails : Navigli comme axe d'apéritif, Brera pour bars sophistiqués, Lac de Côme à 45 minutes en train.",
      tip: "Apéritif au Naviglio Grande : Spritz 8 € + buffet gratuit. Une heure couvre le dîner.",
      faqs: [
        { q: "Milan ou Rome pour EVG ?", a: "Milan pour cocktails et style. Rome pour histoire et pâtes. Milan plus cher mais plus compact." },
        { q: "Le Lac de Côme vaut-il le coup ?", a: "Oui, ferry depuis Côme ou Bellagio en 45 minutes de train. Photo obligatoire de la villa George Clooney." },
      ],
    },
    it: {
      intro: "Milano è eleganza e cocktail: Navigli come asse dell'aperitivo, Brera per bar sofisticati, Lago di Como a 45 minuti in treno.",
      tip: "Aperitivo sul Naviglio Grande: Spritz 8 € + buffet gratis. Un'ora copre la cena.",
      faqs: [
        { q: "Milano o Roma per addio?", a: "Milano per cocktail e stile. Roma per storia e pasta. Milano più caro ma più compatto." },
        { q: "Il Lago di Como vale la pena?", a: "Sì, traghetto da Como o Bellagio a 45 minuti in treno. Foto obbligatoria villa George Clooney." },
      ],
    },
    pt: {
      intro: "Milão é elegância e cocktails: Navigli como eixo de aperitivos, Brera para bares sofisticados, Lago di Como a 45 minutos de comboio.",
      tip: "Aperitivo no Naviglio Grande: Spritz 8 € + buffet gratuito. Uma hora cobre o jantar.",
      faqs: [
        { q: "Milão ou Roma para despedida?", a: "Milão para cocktails e estilo. Roma para história e pasta. Milão mais cara mas mais compacta." },
        { q: "Vale a pena Como?", a: "Sim, ferry de Como ou Bellagio a 45 minutos de comboio. Foto obrigatória da villa George Clooney." },
      ],
    },
    nl: {
      intro: "Milaan is elegantie en cocktails: Navigli als aperitivo-as, Brera voor verfijnde bars, Comomeer op 45 minuten met de trein.",
      tip: "Aperitivo op Naviglio Grande: Spritz 8 € + gratis buffet. Een uur dekt het diner.",
      faqs: [
        { q: "Milaan of Rome voor vrijgezellenfeest?", a: "Milaan voor cocktails en stijl. Rome voor geschiedenis en pasta. Milaan duurder maar compacter." },
        { q: "Is het Comomeer de moeite waard?", a: "Ja, veerboot vanuit Como of Bellagio op 45 minuten met de trein. Verplichte foto van George Clooney's villa." },
      ],
    },
    pl: {
      intro: "Mediolan to elegancja i koktajle: Navigli jako oś aperitivo, Brera dla wyrafinowanych barów, Lago di Como 45 minut pociągiem.",
      tip: "Aperitivo na Naviglio Grande: Spritz 8 € + darmowy bufet. Godzina pokrywa kolację.",
      faqs: [
        { q: "Mediolan czy Rzym na wieczór kawalerski?", a: "Mediolan dla koktajli i stylu. Rzym dla historii i pasty. Mediolan droższy, ale bardziej zwarty." },
        { q: "Czy warto pojechać nad Como?", a: "Tak, prom z Como lub Bellagio, 45 minut pociągiem. Obowiązkowe zdjęcie willi George'a Clooneya." },
      ],
    },
    tr: {
      intro: "Milano zarafet ve kokteyldir: aperitivo ekseni Navigli, sofistike barlar için Brera, trenle 45 dakika uzakta Como Gölü.",
      tip: "Naviglio Grande'de aperitivo: Spritz 8 € + ücretsiz büfe. Bir saat akşam yemeğini karşılar.",
      faqs: [
        { q: "Bekarlığa veda için Milano mu Roma mı?", a: "Kokteyl ve stil için Milano. Tarih ve pasta için Roma. Milano daha pahalı ama daha kompakt." },
        { q: "Como Gölü değer mi?", a: "Evet, trenle 45 dakika sonra Como veya Bellagio'dan ferry. Zorunlu George Clooney villası fotoğrafı." },
      ],
    },
  },
  {
    slug: "florence",
    es: {
      intro: "Florencia es para crews refinadas: Chianti a 45 minutos, Renacimiento como telón, bares en Oltrarno para escapar del turismo.",
      tip: "Tour Chianti de medio día con almuerzo y 4 vinos: 80–120 € por persona — mejor recuerdo italiano.",
      faqs: [
        { q: "¿Florencia demasiado pequeña?", a: "Justa con dos noches; tres ideal con tour Chianti. Cuatro noches arrastra." },
        { q: "¿Cuánto cuesta Florencia?", a: "400–650 € por persona, 3 noches con vuelo. Más cara en temporada alta." },
      ],
    },
    fr: {
      intro: "Florence est pour les crews raffinées : Chianti à 45 minutes, Renaissance comme décor, bars à Oltrarno pour fuir le tourisme.",
      tip: "Tour Chianti demi-journée avec déjeuner et 4 vins : 80–120 € par personne — meilleur souvenir italien.",
      faqs: [
        { q: "Florence trop petite ?", a: "Juste avec deux nuits ; trois idéal avec tour Chianti. Quatre nuits traîne." },
        { q: "Combien coûte Florence ?", a: "400–650 € par personne, 3 nuits avec vol. Plus cher en haute saison." },
      ],
    },
    it: {
      intro: "Firenze è per crew raffinate: Chianti a 45 minuti, Rinascimento come sfondo, bar a Oltrarno per sfuggire al turismo.",
      tip: "Tour Chianti mezza giornata con pranzo e 4 vini: 80–120 € a persona — miglior ricordo italiano.",
      faqs: [
        { q: "Firenze troppo piccola?", a: "Giusta con due notti; tre ideali con tour Chianti. Quattro notti pesano." },
        { q: "Quanto costa Firenze?", a: "400–650 € a persona, 3 notti con volo. Più cara in alta stagione." },
      ],
    },
    pt: {
      intro: "Florença é para grupos refinados: Chianti a 45 minutos, Renascimento como pano de fundo, bares em Oltrarno para escapar do turismo.",
      tip: "Tour Chianti meio-dia com almoço e 4 vinhos: 80–120 € por pessoa — melhor memória italiana.",
      faqs: [
        { q: "Florença pequena demais?", a: "Justa com duas noites; três ideal com tour Chianti. Quatro noites arrastam-se." },
        { q: "Quanto custa Florença?", a: "400–650 € por pessoa, 3 noites com voo. Mais cara em época alta." },
      ],
    },
    nl: {
      intro: "Florence is voor verfijnde crews: Chianti op 45 minuten, Renaissance als decor, bars in Oltrarno om het toerisme te ontvluchten.",
      tip: "Halfdagse Chianti-tour met lunch en 4 wijnen: 80–120 € per persoon — beste Italiaanse herinnering.",
      faqs: [
        { q: "Florence te klein?", a: "Krap met twee nachten; drie ideaal met Chianti-tour. Vier nachten worden taai." },
        { q: "Wat kost Florence?", a: "400–650 € per persoon, 3 nachten met vlucht. Duurder in hoogseizoen." },
      ],
    },
    pl: {
      intro: "Florencja jest dla wyrafinowanych ekip: Chianti 45 minut, Renesans w tle, bary w Oltrarno z dala od turystów.",
      tip: "Półdniowy tour po Chianti z lunchem i 4 winami: 80–120 € od osoby — najlepsze włoskie wspomnienie.",
      faqs: [
        { q: "Czy Florencja jest za mała?", a: "Wystarczy na dwie noce; trzy idealne z turem Chianti. Cztery noce się dłużą." },
        { q: "Ile kosztuje Florencja?", a: "400–650 € od osoby, 3 noce z lotem. Droższa w sezonie." },
      ],
    },
    tr: {
      intro: "Floransa zarif ekipler içindir: 45 dakikada Chianti, fonda Rönesans, turizmden kaçmak için Oltrarno'da barlar.",
      tip: "Öğle yemekli ve 4 şarapla yarım gün Chianti turu: kişi başı 80–120 € — en iyi İtalya hatırası.",
      faqs: [
        { q: "Floransa çok mu küçük?", a: "İki gece için yeterli; Chianti turuyla üç gece ideal. Dört gece sıkar." },
        { q: "Floransa ne kadara mal olur?", a: "Uçuşla 3 gece kişi başı 400–650 €. Yüksek sezonda daha pahalı." },
      ],
    },
  },
  {
    slug: "madrid",
    es: {
      intro: "Madrid es la despedida española auténtica sin filtro turístico: tapas hasta las 23h, bares hasta las 03h, clubes hasta las 06h.",
      tip: "Tour de tapas por La Latina un domingo por la mañana: programa tradicional, despedidas pasan desapercibidas.",
      faqs: [
        { q: "¿Madrid o Barcelona?", a: "Madrid para vida nocturna española auténtica sin turistas. Barcelona para playa y crowd internacional." },
        { q: "¿Cuánto cuesta Madrid?", a: "300–550 € por persona con vuelo. Comparable a Barcelona, a menudo más barata." },
      ],
    },
    fr: {
      intro: "Madrid est l'EVG espagnol authentique sans filtre touristique : tapas jusqu'à 23h, bars jusqu'à 3h, clubs jusqu'à 6h.",
      tip: "Tour de tapas à La Latina un dimanche matin : programme traditionnel, EVG passent inaperçus.",
      faqs: [
        { q: "Madrid ou Barcelone ?", a: "Madrid pour vie nocturne espagnole authentique sans touristes. Barcelone pour plage et crowd international." },
        { q: "Combien coûte Madrid ?", a: "300–550 € par personne avec vol. Comparable à Barcelone, souvent moins cher." },
      ],
    },
    it: {
      intro: "Madrid è l'addio spagnolo autentico senza filtro turistico: tapas fino alle 23, bar fino alle 3, club fino alle 6.",
      tip: "Tour di tapas a La Latina di domenica mattina: programma tradizionale, addii passano inosservati.",
      faqs: [
        { q: "Madrid o Barcellona?", a: "Madrid per vita notturna spagnola autentica senza turisti. Barcellona per spiaggia e crowd internazionale." },
        { q: "Quanto costa Madrid?", a: "300–550 € a persona con volo. Paragonabile a Barcellona, spesso più economico." },
      ],
    },
    pt: {
      intro: "Madrid é a despedida espanhola autêntica sem filtro turístico: tapas até às 23h, bares até às 03h, clubes até às 06h.",
      tip: "Tour de tapas por La Latina ao domingo de manhã: programa tradicional, despedidas passam despercebidas.",
      faqs: [
        { q: "Madrid ou Barcelona?", a: "Madrid para vida noturna espanhola autêntica sem turistas. Barcelona para praia e crowd internacional." },
        { q: "Quanto custa Madrid?", a: "300–550 € por pessoa com voo. Comparável a Barcelona, frequentemente mais barata." },
      ],
    },
    nl: {
      intro: "Madrid is het authentieke Spaanse vrijgezellenfeest zonder toeristisch filter: tapas tot 23u, bars tot 3u, clubs tot 6u.",
      tip: "Tapas-tour door La Latina op zondagochtend: traditioneel programma, vrijgezellenfeesten vallen niet op.",
      faqs: [
        { q: "Madrid of Barcelona?", a: "Madrid voor authentiek Spaans nachtleven zonder toeristen. Barcelona voor strand en internationale crowd." },
        { q: "Wat kost Madrid?", a: "300–550 € per persoon met vlucht. Vergelijkbaar met Barcelona, vaak goedkoper." },
      ],
    },
    pl: {
      intro: "Madryt to autentyczny hiszpański wieczór kawalerski bez turystycznego filtra: tapas do 23, bary do 3, kluby do 6.",
      tip: "Tour po tapas po La Latina w niedzielę rano: tradycyjny program, wieczory kawalerskie wtapiają się.",
      faqs: [
        { q: "Madryt czy Barcelona?", a: "Madryt dla autentycznego hiszpańskiego nocnego życia bez turystów. Barcelona dla plaży i międzynarodowego klimatu." },
        { q: "Ile kosztuje Madryt?", a: "300–550 € od osoby z lotem. Porównywalnie z Barceloną, często taniej." },
      ],
    },
    tr: {
      intro: "Madrid turist filtresiz otantik İspanyol bekarlığa vedasıdır: tapas 23'e, bar 03'e, kulüp 06'ya kadar.",
      tip: "Pazar sabahı La Latina'da tapas turu: geleneksel program, bekarlığa veda partileri fark edilmez.",
      faqs: [
        { q: "Madrid mi Barselona mı?", a: "Turistsiz otantik İspanyol gece hayatı için Madrid. Plaj ve uluslararası kalabalık için Barselona." },
        { q: "Madrid ne kadara mal olur?", a: "Uçuşla kişi başı 300–550 €. Barselona ile karşılaştırılabilir, çoğunlukla daha ucuz." },
      ],
    },
  },
  {
    slug: "ibiza",
    es: {
      intro: "Ibiza es despedida premium para fans de música electrónica: Pacha, Amnesia, Ushuaïa, Sunset Strip y barco a Formentera.",
      tip: "Charter de barco a Formentera para 8–10 personas: 400–700 € por 6h — el mejor por persona del viaje.",
      faqs: [
        { q: "¿Ibiza vale el dinero?", a: "Solo para crews de música electrónica con presupuesto >700 € por persona. Para despedida estándar, Mallorca mejor." },
        { q: "¿Cuánto cuesta una noche en Pacha?", a: "Entrada 60–80 €, copa 18–22 €, total 200 € por persona. Calcula realista." },
      ],
    },
    fr: {
      intro: "Ibiza est EVG premium pour fans de musique électronique : Pacha, Amnesia, Ushuaïa, Sunset Strip et bateau pour Formentera.",
      tip: "Charter bateau Formentera pour 8–10 personnes : 400–700 € pour 6h — meilleur par personne du voyage.",
      faqs: [
        { q: "Ibiza vaut-il le prix ?", a: "Seulement pour crews électro avec budget >700 € par personne. Pour EVG standard, Mallorca mieux." },
        { q: "Combien coûte une nuit au Pacha ?", a: "Entrée 60–80 €, verre 18–22 €, total 200 € par personne. Calcul réaliste." },
      ],
    },
    it: {
      intro: "Ibiza è addio premium per fan della musica elettronica: Pacha, Amnesia, Ushuaïa, Sunset Strip e barca a Formentera.",
      tip: "Charter barca Formentera per 8–10 persone: 400–700 € per 6h — miglior costo a persona del viaggio.",
      faqs: [
        { q: "Ibiza vale i soldi?", a: "Solo per crew elettronica con budget >700 € a persona. Per addio standard, Mallorca meglio." },
        { q: "Quanto costa una serata al Pacha?", a: "Ingresso 60–80 €, drink 18–22 €, totale 200 € a persona. Calcola realisticamente." },
      ],
    },
    pt: {
      intro: "Ibiza é despedida premium para fãs de música eletrónica: Pacha, Amnesia, Ushuaïa, Sunset Strip e barco até Formentera.",
      tip: "Charter de barco para Formentera para 8–10 pessoas: 400–700 € por 6h — melhor custo por pessoa da viagem.",
      faqs: [
        { q: "Ibiza vale o preço?", a: "Só para grupos de música eletrónica com orçamento >700 € por pessoa. Para despedida normal, Maiorca é melhor." },
        { q: "Quanto custa uma noite no Pacha?", a: "Entrada 60–80 €, bebida 18–22 €, total 200 € por pessoa. Calcula realisticamente." },
      ],
    },
    nl: {
      intro: "Ibiza is een premium vrijgezellenfeest voor liefhebbers van elektronische muziek: Pacha, Amnesia, Ushuaïa, Sunset Strip en boot naar Formentera.",
      tip: "Boot charteren naar Formentera voor 8–10 personen: 400–700 € voor 6 uur — beste prijs per persoon van de reis.",
      faqs: [
        { q: "Is Ibiza zijn geld waard?", a: "Alleen voor crews met electronic affiniteit en budget >700 € per persoon. Voor standaard vrijgezellenfeest is Mallorca beter." },
        { q: "Wat kost een avond in Pacha?", a: "Entree 60–80 €, drankje 18–22 €, totaal 200 € per persoon. Reken realistisch." },
      ],
    },
    pl: {
      intro: "Ibiza to premium wieczór kawalerski dla fanów muzyki elektronicznej: Pacha, Amnesia, Ushuaïa, Sunset Strip i łódź do Formentery.",
      tip: "Czarter łodzi do Formentery dla 8–10 osób: 400–700 € za 6h — najlepszy koszt na osobę całego wyjazdu.",
      faqs: [
        { q: "Czy Ibiza warta swojej ceny?", a: "Tylko dla ekip elektronicznych z budżetem >700 € od osoby. Dla standardowego wieczoru, Majorka lepsza." },
        { q: "Ile kosztuje wieczór w Pacha?", a: "Wstęp 60–80 €, drink 18–22 €, łącznie 200 € od osoby. Licz realnie." },
      ],
    },
    tr: {
      intro: "Ibiza elektronik müzik hayranları için premium bekarlığa vedadır: Pacha, Amnesia, Ushuaïa, Sunset Strip ve Formentera'ya tekne.",
      tip: "8–10 kişi için Formentera'ya tekne kirala: 6 saatte 400–700 € — yolculuğun kişi başı en iyi ücreti.",
      faqs: [
        { q: "Ibiza paraya değer mi?", a: "Sadece kişi başı bütçesi >700 € olan elektronik ekipler için. Standart bekarlığa veda için Mallorca daha iyi." },
        { q: "Pacha'da bir gece ne kadara mal olur?", a: "Giriş 60–80 €, içki 18–22 €, kişi başı toplam 200 €. Gerçekçi hesapla." },
      ],
    },
  },
  {
    slug: "lisbon",
    es: {
      intro: "Lisboa es la despedida menos clichada: barrios con cuesta, Bairro Alto como zona-bar abierta, Atlántico a 30 minutos en tren.",
      tip: "En Bairro Alto se compra la copa y se bebe en la calle — tradición local, mucho más barato.",
      faqs: [
        { q: "¿Lisboa o Barcelona?", a: "Barcelona más conocida y ruidosa. Lisboa más auténtica con Atlántico y surf como bonus." },
        { q: "¿Cuánto cuesta Lisboa?", a: "280–500 € por persona, 3 noches con vuelo. Una de las opciones más baratas de Europa Occidental." },
      ],
    },
    fr: {
      intro: "Lisbonne est l'EVG moins cliché : quartiers en pente, Bairro Alto comme zone-bar ouverte, Atlantique à 30 minutes en train.",
      tip: "Au Bairro Alto on achète le verre et on boit dans la rue — tradition locale, beaucoup moins cher.",
      faqs: [
        { q: "Lisbonne ou Barcelone ?", a: "Barcelone plus connue et bruyante. Lisbonne plus authentique avec Atlantique et surf en bonus." },
        { q: "Combien coûte Lisbonne ?", a: "280–500 € par personne, 3 nuits avec vol. Une des options les moins chères d'Europe occidentale." },
      ],
    },
    it: {
      intro: "Lisbona è l'addio meno cliché: quartieri in salita, Bairro Alto come zona-bar aperta, Atlantico a 30 minuti in treno.",
      tip: "Al Bairro Alto compri il drink e bevi in strada — tradizione locale, molto più economico.",
      faqs: [
        { q: "Lisbona o Barcellona?", a: "Barcellona più conosciuta e rumorosa. Lisbona più autentica con Atlantico e surf in più." },
        { q: "Quanto costa Lisbona?", a: "280–500 € a persona, 3 notti con volo. Una delle opzioni più economiche dell'Europa occidentale." },
      ],
    },
    pt: {
      intro: "Lisboa é a despedida menos clichada: bairros íngremes, Bairro Alto como zona de bares aberta, Atlântico a 30 minutos de comboio.",
      tip: "No Bairro Alto compra-se a bebida e bebe-se na rua — tradição local, muito mais barato.",
      faqs: [
        { q: "Lisboa ou Barcelona?", a: "Barcelona mais conhecida e barulhenta. Lisboa mais autêntica com Atlântico e surf como bónus." },
        { q: "Quanto custa Lisboa?", a: "280–500 € por pessoa, 3 noites com voo. Uma das opções mais baratas da Europa Ocidental." },
      ],
    },
    nl: {
      intro: "Lissabon is het minst clichématige vrijgezellenfeest: heuvelachtige wijken, Bairro Alto als open barzone, Atlantische Oceaan op 30 minuten met de trein.",
      tip: "In Bairro Alto koop je je drankje en drink je op straat — lokale traditie, veel goedkoper.",
      faqs: [
        { q: "Lissabon of Barcelona?", a: "Barcelona bekender en luider. Lissabon authentieker met Atlantische Oceaan en surf als bonus." },
        { q: "Wat kost Lissabon?", a: "280–500 € per persoon, 3 nachten met vlucht. Een van de goedkoopste opties in West-Europa." },
      ],
    },
    pl: {
      intro: "Lizbona to najmniej oklepany wieczór kawalerski: strome dzielnice, Bairro Alto jako otwarta strefa barów, Atlantyk 30 minut pociągiem.",
      tip: "W Bairro Alto kupuje się drinka i pije na ulicy — lokalna tradycja, dużo taniej.",
      faqs: [
        { q: "Lizbona czy Barcelona?", a: "Barcelona bardziej znana i głośna. Lizbona bardziej autentyczna z Atlantykiem i surfingiem w bonusie." },
        { q: "Ile kosztuje Lizbona?", a: "280–500 € od osoby, 3 noce z lotem. Jedna z najtańszych opcji w Europie Zachodniej." },
      ],
    },
    tr: {
      intro: "Lizbon en az klişe bekarlığa vedasıdır: yokuşlu mahalleler, açık bar bölgesi Bairro Alto, trenle 30 dakika uzakta Atlantik.",
      tip: "Bairro Alto'da içkini al, sokakta iç — yerel gelenek, çok daha ucuz.",
      faqs: [
        { q: "Lizbon mu Barselona mı?", a: "Barselona daha tanınmış ve gürültülü. Lizbon daha otantik, Atlantik ve sörf bonusu." },
        { q: "Lizbon ne kadara mal olur?", a: "Uçuşla 3 gece kişi başı 280–500 €. Batı Avrupa'nın en ucuz seçeneklerinden." },
      ],
    },
  },
  {
    slug: "edinburgh",
    es: {
      intro: "Edimburgo es la versión escocesa de Dublín: casco medieval con castillo, whisky en lugar de Guinness, eje de pubs en Cowgate.",
      tip: "Tour Highlands de 12 horas con Rabbie's o Heart of Scotland: 60–80 € por persona — programa obligatorio.",
      faqs: [
        { q: "¿Edimburgo o Dublín?", a: "Dublín para tradición Guinness y stag-do. Edimburgo para whisky, castillo y Highlands. Ambas caras." },
        { q: "¿Cuánto cuesta Edimburgo?", a: "440–780 € por persona con vuelo. Similar a Dublín." },
      ],
    },
    fr: {
      intro: "Édimbourg est la version écossaise de Dublin : centre médiéval avec château, whisky au lieu de Guinness, axe de pubs à Cowgate.",
      tip: "Tour Highlands 12 heures avec Rabbie's ou Heart of Scotland : 60–80 € par personne — programme obligatoire.",
      faqs: [
        { q: "Édimbourg ou Dublin ?", a: "Dublin pour tradition Guinness et stag-do. Édimbourg pour whisky, château et Highlands. Tous deux chers." },
        { q: "Combien coûte Édimbourg ?", a: "440–780 € par personne avec vol. Similaire à Dublin." },
      ],
    },
    it: {
      intro: "Edimburgo è la versione scozzese di Dublino: centro medievale con castello, whisky invece di Guinness, asse di pub a Cowgate.",
      tip: "Tour Highlands 12 ore con Rabbie's o Heart of Scotland: 60–80 € a persona — programma obbligatorio.",
      faqs: [
        { q: "Edimburgo o Dublino?", a: "Dublino per tradizione Guinness e stag-do. Edimburgo per whisky, castello e Highlands. Entrambi cari." },
        { q: "Quanto costa Edimburgo?", a: "440–780 € a persona con volo. Simile a Dublino." },
      ],
    },
    pt: {
      intro: "Edimburgo é a versão escocesa de Dublin: centro medieval com castelo, whisky em vez de Guinness, eixo de pubs em Cowgate.",
      tip: "Tour Highlands de 12 horas com Rabbie's ou Heart of Scotland: 60–80 € por pessoa — programa obrigatório.",
      faqs: [
        { q: "Edimburgo ou Dublin?", a: "Dublin para tradição Guinness e stag-do. Edimburgo para whisky, castelo e Highlands. Ambas caras." },
        { q: "Quanto custa Edimburgo?", a: "440–780 € por pessoa com voo. Similar a Dublin." },
      ],
    },
    nl: {
      intro: "Edinburgh is de Schotse versie van Dublin: middeleeuws centrum met kasteel, whisky in plaats van Guinness, pubas in Cowgate.",
      tip: "12-uurs Highlands-tour met Rabbie's of Heart of Scotland: 60–80 € per persoon — verplicht programma.",
      faqs: [
        { q: "Edinburgh of Dublin?", a: "Dublin voor Guinness-traditie en stag-do. Edinburgh voor whisky, kasteel en Highlands. Beide duur." },
        { q: "Wat kost Edinburgh?", a: "440–780 € per persoon met vlucht. Vergelijkbaar met Dublin." },
      ],
    },
    pl: {
      intro: "Edynburg to szkocka wersja Dublina: średniowieczne centrum z zamkiem, whisky zamiast Guinnessa, oś pubów w Cowgate.",
      tip: "12-godzinny tour po Highlands z Rabbie's lub Heart of Scotland: 60–80 € od osoby — obowiązkowy program.",
      faqs: [
        { q: "Edynburg czy Dublin?", a: "Dublin dla tradycji Guinness i stag-do. Edynburg dla whisky, zamku i Highlands. Oba drogie." },
        { q: "Ile kosztuje Edynburg?", a: "440–780 € od osoby z lotem. Podobnie do Dublina." },
      ],
    },
    tr: {
      intro: "Edinburgh, Dublin'in İskoç versiyonudur: kale ile ortaçağ merkezi, Guinness yerine viski, Cowgate'te pub ekseni.",
      tip: "Rabbie's veya Heart of Scotland ile 12 saatlik Highlands turu: kişi başı 60–80 € — zorunlu program.",
      faqs: [
        { q: "Edinburgh mu Dublin mi?", a: "Guinness geleneği ve stag-do için Dublin. Viski, kale ve Highlands için Edinburgh. İkisi de pahalı." },
        { q: "Edinburgh ne kadara mal olur?", a: "Uçuşla kişi başı 440–780 €. Dublin'e benzer." },
      ],
    },
  },
  {
    slug: "krakow",
    es: {
      intro: "Cracovia es la hermana polaca de Praga: precios similares, casco antiguo bellísimo, escena de bares en Kazimierz.",
      tip: "Cata de vodka en bar polaco: 8–10 variedades con explicación por 13 €.",
      faqs: [
        { q: "¿Cracovia o Praga?", a: "Praga más vida nocturna y reconocimiento. Cracovia más auténtica con mina de sal y Auschwitz como excursiones." },
        { q: "¿Cuánto cuesta Cracovia?", a: "180–380 € por persona, 3 noches con vuelo. Una de las despedidas más baratas en Europa." },
      ],
    },
    fr: {
      intro: "Cracovie est la sœur polonaise de Prague : prix similaires, vieille ville magnifique, scène de bars à Kazimierz.",
      tip: "Dégustation vodka en bar polonais : 8–10 variétés avec explication pour 13 €.",
      faqs: [
        { q: "Cracovie ou Prague ?", a: "Prague plus de vie nocturne et reconnaissance. Cracovie plus authentique avec mine de sel et Auschwitz en excursions." },
        { q: "Combien coûte Cracovie ?", a: "180–380 € par personne, 3 nuits avec vol. Un des EVG les moins chers d'Europe." },
      ],
    },
    it: {
      intro: "Cracovia è la sorella polacca di Praga: prezzi simili, centro storico bellissimo, scena di bar a Kazimierz.",
      tip: "Degustazione vodka in bar polacco: 8–10 varietà con spiegazione per 13 €.",
      faqs: [
        { q: "Cracovia o Praga?", a: "Praga più vita notturna e riconoscibilità. Cracovia più autentica con miniera di sale e Auschwitz come escursioni." },
        { q: "Quanto costa Cracovia?", a: "180–380 € a persona, 3 notti con volo. Uno degli addii più economici in Europa." },
      ],
    },
    pt: {
      intro: "Cracóvia é a irmã polaca de Praga: preços semelhantes, cidade antiga lindíssima, cena de bares em Kazimierz.",
      tip: "Prova de vodka em bar polaco: 8–10 variedades com explicação por 13 €.",
      faqs: [
        { q: "Cracóvia ou Praga?", a: "Praga com mais vida noturna e reconhecimento. Cracóvia mais autêntica com mina de sal e Auschwitz como excursões." },
        { q: "Quanto custa Cracóvia?", a: "180–380 € por pessoa, 3 noites com voo. Uma das despedidas mais baratas da Europa." },
      ],
    },
    nl: {
      intro: "Krakau is de Poolse zus van Praag: vergelijkbare prijzen, prachtige oude stad, barscène in Kazimierz.",
      tip: "Wodka-proeverij in Poolse bar: 8–10 soorten met uitleg voor 13 €.",
      faqs: [
        { q: "Krakau of Praag?", a: "Praag levendiger en bekender. Krakau authentieker met zoutmijn en Auschwitz als excursies." },
        { q: "Wat kost Krakau?", a: "180–380 € per persoon, 3 nachten met vlucht. Een van de goedkoopste vrijgezellenfeesten in Europa." },
      ],
    },
    pl: {
      intro: "Kraków to polska siostra Pragi: podobne ceny, przepiękna starówka, scena barowa na Kazimierzu.",
      tip: "Degustacja wódki w polskim barze: 8–10 odmian z opisem za 13 €.",
      faqs: [
        { q: "Kraków czy Praga?", a: "Praga z większym życiem nocnym i rozpoznawalnością. Kraków bardziej autentyczny z kopalnią soli i Auschwitz." },
        { q: "Ile kosztuje Kraków?", a: "180–380 € od osoby, 3 noce z lotem. Jeden z najtańszych wieczorów kawalerskich w Europie." },
      ],
    },
    tr: {
      intro: "Krakov, Prag'ın Polonyalı kız kardeşidir: benzer fiyatlar, muhteşem eski şehir, Kazimierz'de bar sahnesi.",
      tip: "Polonya barında votka tadımı: açıklamalı 8–10 çeşit, 13 €.",
      faqs: [
        { q: "Krakov mu Prag mı?", a: "Daha çok gece hayatı ve tanınırlık için Prag. Tuz madeni ve Auschwitz gezisiyle daha otantik için Krakov." },
        { q: "Krakov ne kadara mal olur?", a: "Uçuşla 3 gece kişi başı 180–380 €. Avrupa'nın en ucuz bekarlığa veda seçeneklerinden." },
      ],
    },
  },
  {
    slug: "budapest",
    es: {
      intro: "Budapest tiene baños termales como zona de despedida, ruin pubs como bares únicos en Europa y crucero por el Danubio.",
      tip: "Széchenyi en sábado por la noche para Sparty (fiesta con DJ en el termal, desde 50 €): icónico.",
      faqs: [
        { q: "¿Qué son los ruin pubs?", a: "Bares en patios y edificios abandonados del Distrito 7. Múltiples bares por complejo, único en Europa." },
        { q: "¿Cuánto cuesta Budapest?", a: "200–400 € por persona, 3 días con vuelo. Una de las mejores relaciones precio-experiencia de Europa." },
      ],
    },
    fr: {
      intro: "Budapest a des bains thermaux comme zone EVG, ruin pubs comme bars uniques en Europe et croisière sur le Danube.",
      tip: "Széchenyi samedi soir pour la Sparty (fête DJ dans le thermal, dès 50 €) : iconique.",
      faqs: [
        { q: "Qu'est-ce qu'un ruin pub ?", a: "Bars dans des cours et bâtiments abandonnés du 7e arrondissement. Plusieurs bars par complexe, unique en Europe." },
        { q: "Combien coûte Budapest ?", a: "200–400 € par personne, 3 jours avec vol. Un des meilleurs rapports prix-expérience d'Europe." },
      ],
    },
    it: {
      intro: "Budapest ha terme come zona d'addio, ruin pub come bar unici in Europa e crociera sul Danubio.",
      tip: "Széchenyi sabato sera per Sparty (festa con DJ in terma, da 50 €): iconico.",
      faqs: [
        { q: "Cosa sono i ruin pub?", a: "Bar in cortili e palazzi abbandonati del 7° distretto. Più bar per complesso, unici in Europa." },
        { q: "Quanto costa Budapest?", a: "200–400 € a persona, 3 giorni con volo. Uno dei migliori rapporti prezzo-esperienza d'Europa." },
      ],
    },
    pt: {
      intro: "Budapeste tem banhos termais como zona de despedida, ruin pubs como bares únicos na Europa e cruzeiro pelo Danúbio.",
      tip: "Széchenyi ao sábado à noite para Sparty (festa com DJ no termal, desde 50 €): icónico.",
      faqs: [
        { q: "O que são os ruin pubs?", a: "Bares em pátios e edifícios abandonados do 7º distrito. Vários bares por complexo, único na Europa." },
        { q: "Quanto custa Budapeste?", a: "200–400 € por pessoa, 3 dias com voo. Uma das melhores relações preço-experiência da Europa." },
      ],
    },
    nl: {
      intro: "Boedapest heeft thermale baden als feestzone, ruin pubs als unieke bars in Europa en cruise op de Donau.",
      tip: "Széchenyi op zaterdagavond voor Sparty (DJ-feest in het thermaalbad, vanaf 50 €): iconisch.",
      faqs: [
        { q: "Wat zijn ruin pubs?", a: "Bars in verlaten binnenplaatsen en gebouwen in district 7. Meerdere bars per complex, uniek in Europa." },
        { q: "Wat kost Boedapest?", a: "200–400 € per persoon, 3 dagen met vlucht. Een van de beste prijs-ervaring verhoudingen in Europa." },
      ],
    },
    pl: {
      intro: "Budapeszt ma kąpiele termalne jako strefę imprezy, ruin puby jako wyjątkowe w Europie i rejs po Dunaju.",
      tip: "Széchenyi w sobotę wieczorem na Sparty (impreza z DJ-em w termie, od 50 €): kultowe.",
      faqs: [
        { q: "Czym są ruin puby?", a: "Bary w opuszczonych podwórkach i budynkach 7. dzielnicy. Wiele barów na jeden kompleks, unikalne w Europie." },
        { q: "Ile kosztuje Budapeszt?", a: "200–400 € od osoby, 3 dni z lotem. Jeden z najlepszych stosunków cena-doświadczenie w Europie." },
      ],
    },
    tr: {
      intro: "Budapeşte parti bölgesi olarak kaplıcalara, Avrupa'da eşi olmayan ruin pub'lara ve Tuna teknesine sahip.",
      tip: "Cumartesi gecesi Sparty için Széchenyi (kaplıcada DJ partisi, 50 €'dan): ikonik.",
      faqs: [
        { q: "Ruin pub nedir?", a: "7. bölgenin terk edilmiş avlu ve binalarındaki barlar. Kompleks başına birden fazla bar, Avrupa'da eşsiz." },
        { q: "Budapeşte ne kadara mal olur?", a: "Uçuşla 3 gün kişi başı 200–400 €. Avrupa'nın en iyi fiyat-deneyim oranlarından." },
      ],
    },
  },
  {
    slug: "mallorca",
    es: {
      intro: "Mallorca es la madre de las despedidas: vuelos directos baratos, hoteles que aman grupos, Ballermann como bulevar de escalada calibrado.",
      tip: "Charter de barco con patrón desde Palma: 250–400 € por 6h con 8 personas — mejor que cualquier discoteca.",
      faqs: [
        { q: "¿Mallorca sigue siendo relevante?", a: "Sí, para crews que quieren escalar y dormir en la playa. La opción más eficiente de Europa." },
        { q: "¿Cuánto cuesta Mallorca?", a: "350–650 € por persona, 4 días con vuelo. Julio/agosto duplican el precio." },
      ],
    },
    fr: {
      intro: "Majorque est la mère des EVG : vols directs bon marché, hôtels qui adorent les groupes, Ballermann comme boulevard d'escalade calibré.",
      tip: "Charter bateau avec skipper depuis Palma : 250–400 € pour 6h à 8 personnes — meilleur que toute discothèque.",
      faqs: [
        { q: "Mallorca est-elle toujours pertinente ?", a: "Oui, pour crews qui veulent escalader et dormir sur la plage. Option la plus efficace d'Europe." },
        { q: "Combien coûte Mallorca ?", a: "350–650 € par personne, 4 jours avec vol. Juillet/août doublent le prix." },
      ],
    },
    it: {
      intro: "Maiorca è la madre degli addii al celibato: voli diretti economici, hotel che amano gruppi, Ballermann come boulevard di escalation calibrato.",
      tip: "Charter barca con skipper da Palma: 250–400 € per 6h con 8 persone — meglio di qualsiasi discoteca.",
      faqs: [
        { q: "Maiorca è ancora rilevante?", a: "Sì, per crew che vogliono escalare e dormire in spiaggia. L'opzione più efficiente d'Europa." },
        { q: "Quanto costa Maiorca?", a: "350–650 € a persona, 4 giorni con volo. Luglio/agosto raddoppiano il prezzo." },
      ],
    },
    pt: {
      intro: "Maiorca é a mãe das despedidas: voos diretos baratos, hotéis que adoram grupos, Ballermann como bulevar de escalada calibrado.",
      tip: "Charter de barco com skipper desde Palma: 250–400 € por 6h com 8 pessoas — melhor que qualquer discoteca.",
      faqs: [
        { q: "Maiorca continua relevante?", a: "Sim, para grupos que querem escalar e dormir na praia. A opção mais eficiente da Europa." },
        { q: "Quanto custa Maiorca?", a: "350–650 € por pessoa, 4 dias com voo. Julho/agosto duplicam o preço." },
      ],
    },
    nl: {
      intro: "Mallorca is de moeder van alle vrijgezellenfeesten: goedkope directe vluchten, hotels die groepen waarderen, Ballermann als gekalibreerde escalatie-boulevard.",
      tip: "Boot charteren met schipper vanuit Palma: 250–400 € voor 6 uur met 8 personen — beter dan elke discotheek.",
      faqs: [
        { q: "Is Mallorca nog relevant?", a: "Ja, voor crews die willen escaleren en op het strand uitslapen. De meest efficiënte optie in Europa." },
        { q: "Wat kost Mallorca?", a: "350–650 € per persoon, 4 dagen met vlucht. Juli/augustus verdubbelen de prijs." },
      ],
    },
    pl: {
      intro: "Majorka to matka wszystkich wieczorów kawalerskich: tanie loty bezpośrednie, hotele lubiące grupy, Ballermann jako wykalibrowany bulwar imprezy.",
      tip: "Czarter łodzi ze sternikiem z Palmy: 250–400 € za 6h dla 8 osób — lepiej niż jakakolwiek dyskoteka.",
      faqs: [
        { q: "Czy Majorka jest nadal aktualna?", a: "Tak, dla ekip chcących zaszaleć i przespać się na plaży. Najefektywniejsza opcja w Europie." },
        { q: "Ile kosztuje Majorka?", a: "350–650 € od osoby, 4 dni z lotem. Lipiec/sierpień podwajają cenę." },
      ],
    },
    tr: {
      intro: "Mallorca tüm bekarlığa veda partilerinin anasıdır: ucuz direkt uçuşlar, grupları seven oteller, kalibre edilmiş eğlence bulvarı Ballermann.",
      tip: "Palma'dan kaptanlı tekne kiralama: 8 kişi için 6 saat 250–400 € — herhangi bir diskodan iyi.",
      faqs: [
        { q: "Mallorca hâlâ geçerli mi?", a: "Evet, eğlenip plajda uyumak isteyen ekipler için. Avrupa'nın en verimli seçeneği." },
        { q: "Mallorca ne kadara mal olur?", a: "Uçuşla 4 gün kişi başı 350–650 €. Temmuz/ağustos fiyatları ikiye katlar." },
      ],
    },
  },
  {
    slug: "vienna",
    es: {
      intro: "Viena es la despedida más infravalorada en germanoparlante: compacta, culturalmente densa, con bares creativos y precios moderados.",
      tip: "Heuriger en Grinzing un domingo + Loos American Bar por la noche = clásico vienés perfecto.",
      faqs: [
        { q: "¿Viena o Múnich?", a: "Viena más barata, culturalmente densa, mejor cocteleria. Múnich tiene Wiesn y biergartens." },
        { q: "¿Cuánto cuesta Viena?", a: "280–500 € por persona, 3 noches. Una de las capitales DACH más asequibles." },
      ],
    },
    fr: {
      intro: "Vienne est l'EVG le plus sous-estimé en germanophonie : compacte, culturellement dense, avec bars créatifs et prix modérés.",
      tip: "Heuriger à Grinzing un dimanche + Loos American Bar le soir = classique viennois parfait.",
      faqs: [
        { q: "Vienne ou Munich ?", a: "Vienne moins chère, plus dense culturellement, meilleure mixologie. Munich a Wiesn et brasseries." },
        { q: "Combien coûte Vienne ?", a: "280–500 € par personne, 3 nuits. Une des capitales DACH les plus abordables." },
      ],
    },
    it: {
      intro: "Vienna è l'addio più sottovalutato in area germanofona: compatta, culturalmente densa, con bar creativi e prezzi moderati.",
      tip: "Heuriger a Grinzing una domenica + Loos American Bar la sera = classico viennese perfetto.",
      faqs: [
        { q: "Vienna o Monaco?", a: "Vienna meno cara, culturalmente più densa, miglior mixology. Monaco ha Wiesn e biergarten." },
        { q: "Quanto costa Vienna?", a: "280–500 € a persona, 3 notti. Una delle capitali DACH più accessibili." },
      ],
    },
    pt: {
      intro: "Viena é a despedida mais subestimada no espaço germanófono: compacta, culturalmente densa, com bares criativos e preços moderados.",
      tip: "Heuriger em Grinzing ao domingo + Loos American Bar à noite = clássico vienense perfeito.",
      faqs: [
        { q: "Viena ou Munique?", a: "Viena mais barata, culturalmente densa, melhor mixologia. Munique tem Wiesn e biergartens." },
        { q: "Quanto custa Viena?", a: "280–500 € por pessoa, 3 noites. Uma das capitais DACH mais acessíveis." },
      ],
    },
    nl: {
      intro: "Wenen is het meest onderschatte vrijgezellenfeest in het Duitstalige gebied: compact, cultureel dicht, creatieve bars en gematigde prijzen.",
      tip: "Heuriger in Grinzing op zondag + Loos American Bar 's avonds = perfecte Weense klassieker.",
      faqs: [
        { q: "Wenen of München?", a: "Wenen goedkoper, cultureel dichter, betere mixologie. München heeft Wiesn en biergartens." },
        { q: "Wat kost Wenen?", a: "280–500 € per persoon, 3 nachten. Een van de toegankelijkste DACH-hoofdsteden." },
      ],
    },
    pl: {
      intro: "Wiedeń to najbardziej niedoceniany wieczór kawalerski w obszarze niemieckojęzycznym: zwarty, kulturowo gęsty, kreatywne bary i umiarkowane ceny.",
      tip: "Heuriger w Grinzing w niedzielę + Loos American Bar wieczorem = idealny wiedeński klasyk.",
      faqs: [
        { q: "Wiedeń czy Monachium?", a: "Wiedeń tańszy, kulturowo gęstszy, lepsza miksologia. Monachium ma Wiesn i biergarteny." },
        { q: "Ile kosztuje Wiedeń?", a: "280–500 € od osoby, 3 noce. Jedna z najtańszych stolic DACH." },
      ],
    },
    tr: {
      intro: "Viyana Almanca konuşulan bölgenin en hafife alınmış bekarlığa veda şehridir: kompakt, kültürel açıdan yoğun, yaratıcı barlar ve makul fiyatlar.",
      tip: "Pazar günü Grinzing'de Heuriger + akşam Loos American Bar = kusursuz Viyana klasiği.",
      faqs: [
        { q: "Viyana mı Münih mi?", a: "Daha ucuz, kültürel açıdan yoğun, daha iyi miksoloji için Viyana. Wiesn ve birahane için Münih." },
        { q: "Viyana ne kadara mal olur?", a: "3 gece kişi başı 280–500 €. DACH'ın en uygun başkentlerinden." },
      ],
    },
  },
  {
    slug: "zurich",
    es: {
      intro: "Zúrich es despedida premium suiza: lago en la ciudad, Alpes a 30 minutos, casco antiguo compacto y bar street en Langstrasse.",
      tip: "Bañarse en el río Limmat en verano: gratis, 3 km de corriente que te lleva por la ciudad — icónico suizo.",
      faqs: [
        { q: "¿Zúrich es demasiado caro?", a: "Para presupuestos lean sí. Para premium con lago, Alpes y gastronomía suiza, inmejorable." },
        { q: "¿Cuánto cuesta Zúrich?", a: "500–1000 € por persona, 3 noches con vuelo. La capital DACH más cara." },
      ],
    },
    fr: {
      intro: "Zurich est EVG premium suisse : lac en ville, Alpes à 30 minutes, vieille ville compacte et bar street à Langstrasse.",
      tip: "Se baigner dans la Limmat en été : gratuit, 3 km de courant qui vous porte à travers la ville — iconique suisse.",
      faqs: [
        { q: "Zurich trop cher ?", a: "Pour budgets serrés oui. Pour premium avec lac, Alpes et gastronomie suisse, imbattable." },
        { q: "Combien coûte Zurich ?", a: "500–1000 € par personne, 3 nuits avec vol. Capitale DACH la plus chère." },
      ],
    },
    it: {
      intro: "Zurigo è addio premium svizzero: lago in città, Alpi a 30 minuti, centro storico compatto e bar street a Langstrasse.",
      tip: "Bagnarsi nella Limmat d'estate: gratis, 3 km di corrente che ti porta in città — iconico svizzero.",
      faqs: [
        { q: "Zurigo troppo cara?", a: "Per budget contenuti sì. Per premium con lago, Alpi e cucina svizzera, imbattibile." },
        { q: "Quanto costa Zurigo?", a: "500–1000 € a persona, 3 notti con volo. Capitale DACH più cara." },
      ],
    },
    pt: {
      intro: "Zurique é despedida premium suíça: lago na cidade, Alpes a 30 minutos, cidade antiga compacta e bar street em Langstrasse.",
      tip: "Banhar-se no rio Limmat no verão: grátis, 3 km de corrente que te leva pela cidade — icónico suíço.",
      faqs: [
        { q: "Zurique demasiado cara?", a: "Para orçamentos apertados sim. Para premium com lago, Alpes e gastronomia suíça, imbatível." },
        { q: "Quanto custa Zurique?", a: "500–1000 € por pessoa, 3 noites com voo. Capital DACH mais cara." },
      ],
    },
    nl: {
      intro: "Zürich is een Zwitsers premium vrijgezellenfeest: meer in de stad, Alpen op 30 minuten, compacte oude stad en barstraat Langstrasse.",
      tip: "Zwemmen in de Limmat in de zomer: gratis, 3 km stroming die je door de stad voert — Zwitserse iconisch.",
      faqs: [
        { q: "Is Zürich te duur?", a: "Voor krappe budgetten ja. Voor premium met meer, Alpen en Zwitserse gastronomie onverslaanbaar." },
        { q: "Wat kost Zürich?", a: "500–1000 € per persoon, 3 nachten met vlucht. Duurste DACH-hoofdstad." },
      ],
    },
    pl: {
      intro: "Zurych to szwajcarski premium wieczór kawalerski: jezioro w mieście, Alpy 30 minut, zwarte stare miasto i bar street na Langstrasse.",
      tip: "Pływanie w rzece Limmat latem: za darmo, 3 km prądu unosi cię przez miasto — szwajcarski klasyk.",
      faqs: [
        { q: "Czy Zurych jest za drogi?", a: "Dla skromnych budżetów tak. Dla premium z jeziorem, Alpami i gastronomią szwajcarską niepokonany." },
        { q: "Ile kosztuje Zurych?", a: "500–1000 € od osoby, 3 noce z lotem. Najdroższa stolica DACH." },
      ],
    },
    tr: {
      intro: "Zürih premium İsviçre bekarlığa vedasıdır: şehirde göl, 30 dakikalık Alpler, kompakt eski şehir ve Langstrasse'de bar caddesi.",
      tip: "Yazın Limmat nehrinde yüzme: ücretsiz, 3 km'lik akıntı seni şehirden geçirir — İsviçre simgesi.",
      faqs: [
        { q: "Zürih çok mu pahalı?", a: "Kısıtlı bütçe için evet. Göl, Alpler ve İsviçre mutfağıyla premium için rakipsiz." },
        { q: "Zürih ne kadara mal olur?", a: "Uçuşla 3 gece kişi başı 500–1000 €. En pahalı DACH başkenti." },
      ],
    },
  },
  {
    slug: "munich",
    es: {
      intro: "Múnich es lo opuesto a Berlín: cuidada, estructurada, con cerveza tradicional y los Alpes como excursión.",
      tip: "Eisbach surf en el Englischer Garten — gratis, foto obligatoria de la despedida.",
      faqs: [
        { q: "¿Múnich durante el Oktoberfest?", a: "Espectacular pero caro. Reserva mesa con 12 meses de antelación, hoteles se duplican." },
        { q: "¿Cuánto cuesta Múnich?", a: "380–650 € por persona. La ciudad alemana más cara para despedidas." },
      ],
    },
    fr: {
      intro: "Munich est l'opposé de Berlin : soignée, structurée, avec bière traditionnelle et les Alpes en excursion.",
      tip: "Eisbach surf au Englischer Garten — gratuit, photo obligatoire de l'EVG.",
      faqs: [
        { q: "Munich pendant l'Oktoberfest ?", a: "Spectaculaire mais cher. Réservez table 12 mois à l'avance, hôtels doublent." },
        { q: "Combien coûte Munich ?", a: "380–650 € par personne. Ville allemande la plus chère pour EVG." },
      ],
    },
    it: {
      intro: "Monaco è l'opposto di Berlino: curata, strutturata, con birra tradizionale e le Alpi come gita.",
      tip: "Eisbach surf nell'Englischer Garten — gratis, foto obbligatoria dell'addio.",
      faqs: [
        { q: "Monaco durante l'Oktoberfest?", a: "Spettacolare ma caro. Prenota tavolo 12 mesi prima, hotel raddoppiano." },
        { q: "Quanto costa Monaco?", a: "380–650 € a persona. Città tedesca più cara per addii." },
      ],
    },
    pt: {
      intro: "Munique é o oposto de Berlim: cuidada, estruturada, com cerveja tradicional e os Alpes como excursão.",
      tip: "Eisbach surf no Englischer Garten — grátis, foto obrigatória da despedida.",
      faqs: [
        { q: "Munique durante o Oktoberfest?", a: "Espetacular mas caro. Reserva mesa com 12 meses de antecedência, hotéis duplicam." },
        { q: "Quanto custa Munique?", a: "380–650 € por pessoa. Cidade alemã mais cara para despedidas." },
      ],
    },
    nl: {
      intro: "München is het tegenovergestelde van Berlijn: verzorgd, gestructureerd, met traditioneel bier en de Alpen als uitstapje.",
      tip: "Eisbach-surfen in de Englischer Garten — gratis, verplichte vrijgezellenfeest-foto.",
      faqs: [
        { q: "München tijdens Oktoberfest?", a: "Spectaculair maar duur. Reserveer tafel 12 maanden vooraf, hotels verdubbelen." },
        { q: "Wat kost München?", a: "380–650 € per persoon. Duurste Duitse stad voor vrijgezellenfeesten." },
      ],
    },
    pl: {
      intro: "Monachium to przeciwieństwo Berlina: zadbane, uporządkowane, z tradycyjnym piwem i Alpami jako wycieczką.",
      tip: "Eisbach surf w Englischer Garten — za darmo, obowiązkowe zdjęcie wieczoru kawalerskiego.",
      faqs: [
        { q: "Monachium podczas Oktoberfest?", a: "Spektakularnie ale drogo. Rezerwacja stolika 12 miesięcy wcześniej, hotele podwajają ceny." },
        { q: "Ile kosztuje Monachium?", a: "380–650 € od osoby. Najdroższe niemieckie miasto na wieczór kawalerski." },
      ],
    },
    tr: {
      intro: "Münih, Berlin'in zıttıdır: bakımlı, yapılandırılmış, geleneksel bira ve Alpler bir gezi olarak.",
      tip: "Englischer Garten'da Eisbach sörfü — ücretsiz, zorunlu bekarlığa veda fotoğrafı.",
      faqs: [
        { q: "Oktoberfest sırasında Münih?", a: "Görkemli ama pahalı. 12 ay önceden masa rezerve et, oteller fiyat ikiye katlar." },
        { q: "Münih ne kadara mal olur?", a: "Kişi başı 380–650 €. Bekarlığa veda için en pahalı Alman şehri." },
      ],
    },
  },
  {
    slug: "hamburg",
    es: {
      intro: "Hamburgo es el campeón silencioso: menos hype que Berlín, casco antiguo compacto, Reeperbahn como prueba de fuego probada.",
      tip: "Barca privada por el puerto con bebidas propias: 250–450 € por 2 horas — mejor que tour comercial.",
      faqs: [
        { q: "¿La Reeperbahn aún vale la pena?", a: "Sí, selectivamente. Karaoke y bares de música en vivo funcionan, las discos comerciales no." },
        { q: "¿Cuánto cuesta Hamburgo?", a: "320–580 € por persona con alojamiento. Una de las grandes ciudades alemanas más accesibles." },
      ],
    },
    fr: {
      intro: "Hambourg est le champion silencieux : moins de hype que Berlin, centre compact, Reeperbahn comme test de feu éprouvé.",
      tip: "Barque privée dans le port avec ses propres boissons : 250–450 € pour 2h — mieux que tour commercial.",
      faqs: [
        { q: "La Reeperbahn vaut-elle toujours le coup ?", a: "Oui, sélectivement. Karaoké et bars musicaux fonctionnent, discos commerciales non." },
        { q: "Combien coûte Hambourg ?", a: "320–580 € par personne avec hébergement. Une des grandes villes allemandes les plus abordables." },
      ],
    },
    it: {
      intro: "Amburgo è il campione silenzioso: meno hype di Berlino, centro compatto, Reeperbahn come prova del fuoco collaudata.",
      tip: "Barca privata nel porto con bevande proprie: 250–450 € per 2h — meglio di tour commerciale.",
      faqs: [
        { q: "La Reeperbahn vale ancora la pena?", a: "Sì, selettivamente. Karaoke e bar di musica live funzionano, discoteche commerciali no." },
        { q: "Quanto costa Amburgo?", a: "320–580 € a persona con alloggio. Una delle grandi città tedesche più accessibili." },
      ],
    },
    pt: {
      intro: "Hamburgo é o campeão silencioso: menos hype que Berlim, centro compacto, Reeperbahn como teste de fogo comprovado.",
      tip: "Barco privado pelo porto com bebidas próprias: 250–450 € por 2 horas — melhor que tour comercial.",
      faqs: [
        { q: "A Reeperbahn ainda vale a pena?", a: "Sim, seletivamente. Karaoke e bares de música ao vivo funcionam, discos comerciais não." },
        { q: "Quanto custa Hamburgo?", a: "320–580 € por pessoa com alojamento. Uma das grandes cidades alemãs mais acessíveis." },
      ],
    },
    nl: {
      intro: "Hamburg is de stille kampioen: minder hype dan Berlijn, compact centrum, Reeperbahn als beproefde vuurproef.",
      tip: "Privéboot door de haven met eigen drank: 250–450 € voor 2 uur — beter dan een commerciële tour.",
      faqs: [
        { q: "Is de Reeperbahn nog de moeite waard?", a: "Ja, selectief. Karaoke en livemuziek werken, commerciële disco's niet." },
        { q: "Wat kost Hamburg?", a: "320–580 € per persoon met accommodatie. Een van de toegankelijkste grote Duitse steden." },
      ],
    },
    pl: {
      intro: "Hamburg to cichy zwycięzca: mniej hype niż Berlin, zwarte centrum, Reeperbahn jako sprawdzona próba ognia.",
      tip: "Prywatna łódź po porcie z własnym alkoholem: 250–450 € za 2 godziny — lepiej niż komercyjna wycieczka.",
      faqs: [
        { q: "Czy Reeperbahn nadal się opłaca?", a: "Tak, selektywnie. Karaoke i bary z muzyką na żywo działają, komercyjne dyskoteki nie." },
        { q: "Ile kosztuje Hamburg?", a: "320–580 € od osoby z noclegiem. Jedno z najtańszych niemieckich dużych miast." },
      ],
    },
    tr: {
      intro: "Hamburg sessiz şampiyondur: Berlin'den daha az hype, kompakt merkez, kanıtlanmış ateş çemberi Reeperbahn.",
      tip: "Kendi içkilerinle limanda özel tekne: 2 saat 250–450 € — ticari turdan daha iyi.",
      faqs: [
        { q: "Reeperbahn hâlâ değer mi?", a: "Evet, seçici olarak. Karaoke ve canlı müzik barları çalışıyor, ticari diskolar değil." },
        { q: "Hamburg ne kadara mal olur?", a: "Konaklamayla kişi başı 320–580 €. Almanya'nın en uygun büyük şehirlerinden." },
      ],
    },
  },
  {
    slug: "cologne",
    es: {
      intro: "Colonia es la ciudad más simpática para despedidas: nadie se queja de grupos ruidosos, Karneval como despedida colectiva.",
      tip: "Tour por 4 brauhäuser en la Altstadt — sin reservas, todos a 800 metros. Más barato y mejor que crawl comercial.",
      faqs: [
        { q: "¿Carnaval para despedida?", a: "Espectacular pero caótico. Hoteles triplican, reserva 9 meses antes. Sin separación garantizada." },
        { q: "¿Cuánto cuesta Colonia?", a: "280–500 € por persona. Una de las despedidas alemanas más baratas." },
      ],
    },
    fr: {
      intro: "Cologne est la ville la plus sympathique pour les EVG : personne ne se plaint des groupes bruyants, Karneval comme EVG collectif.",
      tip: "Tour par 4 brasseries dans l'Altstadt — sans réservation, toutes à 800m. Moins cher et mieux qu'un crawl commercial.",
      faqs: [
        { q: "Carnaval pour EVG ?", a: "Spectaculaire mais chaotique. Hôtels triplent, réservez 9 mois à l'avance. Séparation garantie." },
        { q: "Combien coûte Cologne ?", a: "280–500 € par personne. Un des EVG allemands les moins chers." },
      ],
    },
    it: {
      intro: "Colonia è la città più simpatica per gli addii: nessuno si lamenta dei gruppi rumorosi, Karneval come addio collettivo.",
      tip: "Tour di 4 brauhäuser nell'Altstadt — senza prenotazione, tutti a 800m. Più economico e migliore di crawl commerciale.",
      faqs: [
        { q: "Carnevale per addio?", a: "Spettacolare ma caotico. Hotel triplicano, prenota 9 mesi prima. Separazione garantita." },
        { q: "Quanto costa Colonia?", a: "280–500 € a persona. Uno degli addii tedeschi più economici." },
      ],
    },
    pt: {
      intro: "Colónia é a cidade mais simpática para despedidas: ninguém se queixa de grupos barulhentos, Karneval como despedida coletiva.",
      tip: "Tour por 4 brauhäuser na Altstadt — sem reservas, todos a 800 metros. Mais barato e melhor que crawl comercial.",
      faqs: [
        { q: "Karneval para despedida?", a: "Espetacular mas caótico. Hotéis triplicam, reserva 9 meses antes. Sem separação garantida." },
        { q: "Quanto custa Colónia?", a: "280–500 € por pessoa. Uma das despedidas alemãs mais baratas." },
      ],
    },
    nl: {
      intro: "Keulen is de meest sympathieke vrijgezellenstad: niemand klaagt over luidruchtige groepen, Karneval als collectief vrijgezellenfeest.",
      tip: "Tour door 4 brouwerijen in de Altstadt — geen reserveringen, allemaal binnen 800 meter. Goedkoper en beter dan commerciële crawl.",
      faqs: [
        { q: "Karneval voor vrijgezellenfeest?", a: "Spectaculair maar chaotisch. Hotels verdrievoudigen, boek 9 maanden vooraf. Scheiding gegarandeerd." },
        { q: "Wat kost Keulen?", a: "280–500 € per persoon. Een van de goedkoopste Duitse vrijgezellenfeesten." },
      ],
    },
    pl: {
      intro: "Kolonia to najbardziej przyjazne miasto na wieczór kawalerski: nikt nie narzeka na hałaśliwe grupy, Karneval jako zbiorowy wieczór kawalerski.",
      tip: "Tour po 4 browarach w Altstadt — bez rezerwacji, wszystkie w promieniu 800 metrów. Taniej i lepiej niż komercyjny crawl.",
      faqs: [
        { q: "Karneval na wieczór kawalerski?", a: "Spektakularnie ale chaotycznie. Hotele potrajają ceny, rezerwuj 9 miesięcy wcześniej. Rozdzielenie gwarantowane." },
        { q: "Ile kosztuje Kolonia?", a: "280–500 € od osoby. Jeden z najtańszych niemieckich wieczorów kawalerskich." },
      ],
    },
    tr: {
      intro: "Köln bekarlığa veda için en sempatik şehirdir: kimse gürültülü gruplardan şikayetçi olmaz, Karneval kolektif bekarlığa vedadır.",
      tip: "Altstadt'ta 4 brauhaus turu — rezervasyonsuz, hepsi 800 metre içinde. Ticari crawl'dan ucuz ve daha iyi.",
      faqs: [
        { q: "Bekarlığa veda için Karneval?", a: "Görkemli ama kaotik. Oteller üçe katlar, 9 ay önce rezervasyon yap. Ayrılma garantili." },
        { q: "Köln ne kadara mal olur?", a: "Kişi başı 280–500 €. En ucuz Alman bekarlığa veda şehirlerinden." },
      ],
    },
  },
  {
    slug: "frankfurt",
    es: {
      intro: "Fráncfort sorprende: la ciudad alemana más compacta, con skyline de bancos y Apfelwein en Sachsenhausen.",
      tip: "SkyLounge del Main Tower — 9 € entrada, mejor foto de skyline alemán para grupos de despedida.",
      faqs: [
        { q: "¿Fráncfort suficiente para 2 noches?", a: "Justo. Tres con excursión a Heidelberg o Mainz. Cuatro arrastra." },
        { q: "¿Cuánto cuesta Fráncfort?", a: "300–520 € por persona. Bien comunicada por avión desde toda Europa." },
      ],
    },
    fr: {
      intro: "Francfort surprend : la ville allemande la plus compacte, avec skyline de banques et Apfelwein à Sachsenhausen.",
      tip: "SkyLounge de la Main Tower — 9 € entrée, meilleure photo skyline allemand pour groupes EVG.",
      faqs: [
        { q: "Francfort suffisant pour 2 nuits ?", a: "Juste. Trois avec excursion à Heidelberg ou Mayence. Quatre traîne." },
        { q: "Combien coûte Francfort ?", a: "300–520 € par personne. Bien desservie par avion depuis toute l'Europe." },
      ],
    },
    it: {
      intro: "Francoforte sorprende: la città tedesca più compatta, con skyline di banche e Apfelwein a Sachsenhausen.",
      tip: "SkyLounge della Main Tower — 9 € ingresso, miglior foto skyline tedesco per gruppi di addio.",
      faqs: [
        { q: "Francoforte basta per 2 notti?", a: "Giusto. Tre con escursione a Heidelberg o Magonza. Quattro pesano." },
        { q: "Quanto costa Francoforte?", a: "300–520 € a persona. Ben servita da voli da tutta Europa." },
      ],
    },
    pt: {
      intro: "Frankfurt surpreende: a cidade alemã mais compacta, com skyline de bancos e Apfelwein em Sachsenhausen.",
      tip: "SkyLounge da Main Tower — 9 € entrada, melhor foto de skyline alemão para grupos de despedida.",
      faqs: [
        { q: "Frankfurt suficiente para 2 noites?", a: "Apenas. Três com excursão a Heidelberg ou Mainz. Quatro arrastam-se." },
        { q: "Quanto custa Frankfurt?", a: "300–520 € por pessoa. Bem servida por voos de toda a Europa." },
      ],
    },
    nl: {
      intro: "Frankfurt verrast: de meest compacte Duitse stad, met bankenskyline en Apfelwein in Sachsenhausen.",
      tip: "Main Tower SkyLounge — 9 € entree, beste Duitse skylinefoto voor vrijgezellenfeestgroepen.",
      faqs: [
        { q: "Frankfurt genoeg voor 2 nachten?", a: "Net. Drie met uitstapje naar Heidelberg of Mainz. Vier nachten worden taai." },
        { q: "Wat kost Frankfurt?", a: "300–520 € per persoon. Goed bereikbaar met vluchten uit heel Europa." },
      ],
    },
    pl: {
      intro: "Frankfurt zaskakuje: najbardziej zwarte niemieckie miasto, z bankową panoramą i Apfelwein w Sachsenhausen.",
      tip: "SkyLounge Main Tower — 9 € wstęp, najlepsze zdjęcie niemieckiej panoramy dla grup wieczoru kawalerskiego.",
      faqs: [
        { q: "Frankfurt wystarczy na 2 noce?", a: "Ledwo. Trzy z wycieczką do Heidelberga lub Moguncji. Cztery się dłużą." },
        { q: "Ile kosztuje Frankfurt?", a: "300–520 € od osoby. Dobrze skomunikowany lotami z całej Europy." },
      ],
    },
    tr: {
      intro: "Frankfurt şaşırtıyor: en kompakt Alman şehri, banka silüeti ve Sachsenhausen'da Apfelwein ile.",
      tip: "Main Tower SkyLounge — 9 € giriş, bekarlığa veda grupları için en iyi Alman silüet fotoğrafı.",
      faqs: [
        { q: "Frankfurt 2 gece için yeterli mi?", a: "Sınırda. Heidelberg veya Mainz gezisiyle üç gece. Dört gece uzar." },
        { q: "Frankfurt ne kadara mal olur?", a: "Kişi başı 300–520 €. Avrupa'nın her yerinden uçuşla iyi bağlantılı." },
      ],
    },
  },
  {
    slug: "stuttgart",
    es: {
      intro: "Stuttgart es despedida secreta del sur alemán: Cannstatter Volksfest como alternativa al Oktoberfest a mitad de precio.",
      tip: "Tour por viñedos en Untertürkheim: 3–5 bodegas en medio día con 8–12 vinos del Württemberg.",
      faqs: [
        { q: "¿Cannstatter Volksfest o Oktoberfest?", a: "Cannstatter más barato, menos saturado, misma atmósfera de carpa. Mejor para primera experiencia." },
        { q: "¿Cuánto cuesta Stuttgart?", a: "280–500 € por persona fuera de Volksfest. En temporada se duplica." },
      ],
    },
    fr: {
      intro: "Stuttgart est EVG secret du sud allemand : Cannstatter Volksfest comme alternative à l'Oktoberfest à moitié prix.",
      tip: "Tour viticole à Untertürkheim : 3–5 caves en demi-journée avec 8–12 vins du Württemberg.",
      faqs: [
        { q: "Cannstatter Volksfest ou Oktoberfest ?", a: "Cannstatter moins cher, moins saturé, même ambiance de tente. Mieux pour première expérience." },
        { q: "Combien coûte Stuttgart ?", a: "280–500 € par personne hors Volksfest. Pendant la saison ça double." },
      ],
    },
    it: {
      intro: "Stoccarda è addio segreto del sud tedesco: Cannstatter Volksfest come alternativa all'Oktoberfest a metà prezzo.",
      tip: "Tour vinicolo a Untertürkheim: 3–5 cantine in mezza giornata con 8–12 vini del Württemberg.",
      faqs: [
        { q: "Cannstatter Volksfest o Oktoberfest?", a: "Cannstatter più economico, meno saturo, stessa atmosfera di tenda. Meglio per prima esperienza." },
        { q: "Quanto costa Stoccarda?", a: "280–500 € a persona fuori Volksfest. In stagione raddoppia." },
      ],
    },
    pt: {
      intro: "Stuttgart é despedida secreta do sul alemão: Cannstatter Volksfest como alternativa à Oktoberfest a metade do preço.",
      tip: "Tour por vinhedos em Untertürkheim: 3–5 quintas em meio dia com 8–12 vinhos do Württemberg.",
      faqs: [
        { q: "Cannstatter Volksfest ou Oktoberfest?", a: "Cannstatter mais barato, menos saturado, mesma atmosfera de tenda. Melhor para primeira experiência." },
        { q: "Quanto custa Stuttgart?", a: "280–500 € por pessoa fora do Volksfest. Em época duplica." },
      ],
    },
    nl: {
      intro: "Stuttgart is het geheime Zuid-Duitse vrijgezellenfeest: Cannstatter Volksfest als half zo dure Oktoberfest-alternatief.",
      tip: "Wijngaardtour in Untertürkheim: 3–5 wijnhuizen in een halve dag met 8–12 Württemberg-wijnen.",
      faqs: [
        { q: "Cannstatter Volksfest of Oktoberfest?", a: "Cannstatter goedkoper, minder vol, zelfde tentsfeer. Beter voor eerste ervaring." },
        { q: "Wat kost Stuttgart?", a: "280–500 € per persoon buiten het Volksfest. In seizoen verdubbelt het." },
      ],
    },
    pl: {
      intro: "Stuttgart to tajny południowoniemiecki wieczór kawalerski: Cannstatter Volksfest jako alternatywa Oktoberfest za pół ceny.",
      tip: "Tour po winnicach w Untertürkheim: 3–5 winnic w pół dnia z 8–12 winami Württembergu.",
      faqs: [
        { q: "Cannstatter Volksfest czy Oktoberfest?", a: "Cannstatter tańszy, mniej tłoczny, ta sama atmosfera namiotu. Lepsze na pierwszy raz." },
        { q: "Ile kosztuje Stuttgart?", a: "280–500 € od osoby poza Volksfest. W sezonie podwaja się." },
      ],
    },
    tr: {
      intro: "Stuttgart Güney Almanya'nın gizli bekarlığa vedasıdır: yarı fiyatına Oktoberfest alternatifi Cannstatter Volksfest.",
      tip: "Untertürkheim'da bağ turu: yarım günde 3–5 şarap evi ve 8–12 Württemberg şarabı.",
      faqs: [
        { q: "Cannstatter Volksfest mi Oktoberfest mi?", a: "Cannstatter daha ucuz, daha tenha, aynı çadır atmosferi. İlk deneyim için daha iyi." },
        { q: "Stuttgart ne kadara mal olur?", a: "Volksfest dışında kişi başı 280–500 €. Sezonda ikiye katlanır." },
      ],
    },
  },
  {
    slug: "dusseldorf",
    es: {
      intro: "Düsseldorf es la hermana elegante de Colonia: Altbier en lugar de Kölsch, la barra más larga del mundo, Medienhafen para fotos.",
      tip: "Tour de 4 brauereien Altbier — Uerige, Schumacher, Füchschen, Schlüssel. Sin reserva, en 1 km.",
      faqs: [
        { q: "¿Düsseldorf o Colonia?", a: "Düsseldorf más elegante con mejores cócteles. Colonia más ruidosa con tradición Karneval. Ambas a 25 min ICE." },
        { q: "¿Cuánto cuesta Düsseldorf?", a: "310–560 € por persona. Algo más cara que Colonia." },
      ],
    },
    fr: {
      intro: "Düsseldorf est la sœur élégante de Cologne : Altbier au lieu de Kölsch, le bar le plus long du monde, Medienhafen pour les photos.",
      tip: "Tour de 4 brasseries Altbier — Uerige, Schumacher, Füchschen, Schlüssel. Sans réservation, en 1 km.",
      faqs: [
        { q: "Düsseldorf ou Cologne ?", a: "Düsseldorf plus élégante avec meilleurs cocktails. Cologne plus bruyante avec tradition Karneval. Les deux à 25 min ICE." },
        { q: "Combien coûte Düsseldorf ?", a: "310–560 € par personne. Un peu plus cher que Cologne." },
      ],
    },
    it: {
      intro: "Düsseldorf è la sorella elegante di Colonia: Altbier invece di Kölsch, il bar più lungo del mondo, Medienhafen per foto.",
      tip: "Tour di 4 brauerei Altbier — Uerige, Schumacher, Füchschen, Schlüssel. Senza prenotazione, in 1 km.",
      faqs: [
        { q: "Düsseldorf o Colonia?", a: "Düsseldorf più elegante con cocktail migliori. Colonia più rumorosa con tradizione Karneval. Entrambe a 25 min ICE." },
        { q: "Quanto costa Düsseldorf?", a: "310–560 € a persona. Un po' più cara di Colonia." },
      ],
    },
    pt: {
      intro: "Düsseldorf é a irmã elegante de Colónia: Altbier em vez de Kölsch, o bar mais longo do mundo, Medienhafen para fotos.",
      tip: "Tour por 4 cervejarias Altbier — Uerige, Schumacher, Füchschen, Schlüssel. Sem reserva, em 1 km.",
      faqs: [
        { q: "Düsseldorf ou Colónia?", a: "Düsseldorf mais elegante com melhores cocktails. Colónia mais barulhenta com tradição Karneval. Ambas a 25 min ICE." },
        { q: "Quanto custa Düsseldorf?", a: "310–560 € por pessoa. Um pouco mais cara que Colónia." },
      ],
    },
    nl: {
      intro: "Düsseldorf is de elegante zus van Keulen: Altbier in plaats van Kölsch, langste bar ter wereld, Medienhafen voor foto's.",
      tip: "Tour door 4 Altbier-brouwerijen — Uerige, Schumacher, Füchschen, Schlüssel. Geen reservering, binnen 1 km.",
      faqs: [
        { q: "Düsseldorf of Keulen?", a: "Düsseldorf eleganter met betere cocktails. Keulen luidruchtiger met Karneval-traditie. Beide op 25 min ICE." },
        { q: "Wat kost Düsseldorf?", a: "310–560 € per persoon. Iets duurder dan Keulen." },
      ],
    },
    pl: {
      intro: "Düsseldorf to elegancka siostra Kolonii: Altbier zamiast Kölscha, najdłuższy bar świata, Medienhafen do zdjęć.",
      tip: "Tour po 4 browarach Altbier — Uerige, Schumacher, Füchschen, Schlüssel. Bez rezerwacji, w 1 km.",
      faqs: [
        { q: "Düsseldorf czy Kolonia?", a: "Düsseldorf elegantszy z lepszymi koktajlami. Kolonia głośniejsza z tradycją Karneval. Obie 25 min ICE." },
        { q: "Ile kosztuje Düsseldorf?", a: "310–560 € od osoby. Trochę droższy niż Kolonia." },
      ],
    },
    tr: {
      intro: "Düsseldorf, Köln'ün şık kız kardeşidir: Kölsch yerine Altbier, dünyanın en uzun barı, fotoğraflar için Medienhafen.",
      tip: "4 Altbier brauerei turu — Uerige, Schumacher, Füchschen, Schlüssel. Rezervasyonsuz, 1 km içinde.",
      faqs: [
        { q: "Düsseldorf mu Köln mü?", a: "Daha şık ve iyi kokteyller için Düsseldorf. Daha gürültülü Karneval geleneği için Köln. İkisi de 25 dakika ICE." },
        { q: "Düsseldorf ne kadara mal olur?", a: "Kişi başı 310–560 €. Köln'den biraz daha pahalı." },
      ],
    },
  },
  {
    slug: "hannover",
    es: {
      intro: "Hannover es honesta y barata: Steintor como eje de bares, Schützenfest como festival más grande del mundo en julio.",
      tip: "Schützenfest a finales de junio/principios de julio — calidad Oktoberfest a mitad de precio, despedidas son inventario.",
      faqs: [
        { q: "¿Cuánto cuesta Hannover?", a: "240–450 € por persona. Una de las grandes ciudades alemanas más baratas." },
        { q: "¿Suficiente para 3 días?", a: "Con Schützenfest o excursión a Steinhuder Meer, sí. Estándar dos noches." },
      ],
    },
    fr: {
      intro: "Hanovre est honnête et bon marché : Steintor comme axe de bars, Schützenfest comme plus grand festival du monde en juillet.",
      tip: "Schützenfest fin juin/début juillet — qualité Oktoberfest à moitié prix, EVG sont du standard.",
      faqs: [
        { q: "Combien coûte Hanovre ?", a: "240–450 € par personne. Une des grandes villes allemandes les moins chères." },
        { q: "Suffisant pour 3 jours ?", a: "Avec Schützenfest ou excursion à Steinhuder Meer, oui. Standard deux nuits." },
      ],
    },
    it: {
      intro: "Hannover è onesta ed economica: Steintor come asse di bar, Schützenfest come festival più grande del mondo a luglio.",
      tip: "Schützenfest fine giugno/inizio luglio — qualità Oktoberfest a metà prezzo, addii sono standard.",
      faqs: [
        { q: "Quanto costa Hannover?", a: "240–450 € a persona. Una delle grandi città tedesche più economiche." },
        { q: "Basta per 3 giorni?", a: "Con Schützenfest o escursione a Steinhuder Meer, sì. Standard due notti." },
      ],
    },
    pt: {
      intro: "Hannover é honesta e barata: Steintor como eixo de bares, Schützenfest como maior festival do mundo em julho.",
      tip: "Schützenfest no final de junho/início de julho — qualidade Oktoberfest a metade do preço, despedidas são inventário.",
      faqs: [
        { q: "Quanto custa Hannover?", a: "240–450 € por pessoa. Uma das grandes cidades alemãs mais baratas." },
        { q: "Suficiente para 3 dias?", a: "Com Schützenfest ou excursão ao Steinhuder Meer, sim. Standard duas noites." },
      ],
    },
    nl: {
      intro: "Hannover is eerlijk en goedkoop: Steintor als barstraat, Schützenfest als grootste festival ter wereld in juli.",
      tip: "Schützenfest eind juni/begin juli — Oktoberfest-kwaliteit voor halve prijs, vrijgezellenfeesten zijn standaard.",
      faqs: [
        { q: "Wat kost Hannover?", a: "240–450 € per persoon. Een van de goedkoopste Duitse grote steden." },
        { q: "Genoeg voor 3 dagen?", a: "Met Schützenfest of uitstap naar Steinhuder Meer, ja. Standaard twee nachten." },
      ],
    },
    pl: {
      intro: "Hanower jest uczciwy i tani: Steintor jako oś barów, Schützenfest jako największy festyn świata w lipcu.",
      tip: "Schützenfest pod koniec czerwca/początek lipca — jakość Oktoberfest za pół ceny, wieczory kawalerskie to standard.",
      faqs: [
        { q: "Ile kosztuje Hanower?", a: "240–450 € od osoby. Jedno z najtańszych dużych niemieckich miast." },
        { q: "Wystarczy na 3 dni?", a: "Z Schützenfest lub wycieczką do Steinhuder Meer, tak. Standard dwie noce." },
      ],
    },
    tr: {
      intro: "Hannover dürüst ve ucuzdur: bar ekseni Steintor, temmuzda dünyanın en büyük festivali Schützenfest.",
      tip: "Haziran sonu/temmuz başı Schützenfest — yarı fiyatına Oktoberfest kalitesi, bekarlığa veda partileri standart.",
      faqs: [
        { q: "Hannover ne kadara mal olur?", a: "Kişi başı 240–450 €. En ucuz büyük Alman şehirlerinden." },
        { q: "3 gün için yeterli mi?", a: "Schützenfest veya Steinhuder Meer gezisi varsa, evet. Standart iki gece." },
      ],
    },
  },
  {
    slug: "dresden",
    es: {
      intro: "Dresde es mezcla de Barroco y bar scene alternativo: Frauenkirche de día, Neustadt con 200 bares en 1 km² de noche.",
      tip: "Bunte Republik Neustadt en junio — festival de calle con toda la milla de bares como festival outdoor.",
      faqs: [
        { q: "¿Dresde o Leipzig?", a: "Dresde culturalmente más densa con Neustadt como eje. Leipzig más hipster e indie. Ambas baratas." },
        { q: "¿Cuánto cuesta Dresde?", a: "230–420 € por persona. Más barato que Berlín o Múnich." },
      ],
    },
    fr: {
      intro: "Dresde est un mélange de Baroque et de scène bar alternative : Frauenkirche de jour, Neustadt avec 200 bars dans 1 km² la nuit.",
      tip: "Bunte Republik Neustadt en juin — festival de rue avec tout le mile de bars comme festival outdoor.",
      faqs: [
        { q: "Dresde ou Leipzig ?", a: "Dresde culturellement plus dense avec Neustadt comme axe. Leipzig plus hipster et indie. Toutes deux bon marché." },
        { q: "Combien coûte Dresde ?", a: "230–420 € par personne. Moins cher que Berlin ou Munich." },
      ],
    },
    it: {
      intro: "Dresda è mix di Barocco e scena bar alternativa: Frauenkirche di giorno, Neustadt con 200 bar in 1 km² di notte.",
      tip: "Bunte Republik Neustadt a giugno — festival di strada con tutta la zona di bar come festival outdoor.",
      faqs: [
        { q: "Dresda o Lipsia?", a: "Dresda culturalmente più densa con Neustadt come asse. Lipsia più hipster e indie. Entrambe economiche." },
        { q: "Quanto costa Dresda?", a: "230–420 € a persona. Più economica di Berlino o Monaco." },
      ],
    },
    pt: {
      intro: "Dresden é mistura de Barroco e cena de bares alternativa: Frauenkirche de dia, Neustadt com 200 bares em 1 km² à noite.",
      tip: "Bunte Republik Neustadt em junho — festival de rua com toda a milha de bares como festival outdoor.",
      faqs: [
        { q: "Dresden ou Leipzig?", a: "Dresden culturalmente mais densa com Neustadt como eixo. Leipzig mais hipster e indie. Ambas baratas." },
        { q: "Quanto custa Dresden?", a: "230–420 € por pessoa. Mais barata que Berlim ou Munique." },
      ],
    },
    nl: {
      intro: "Dresden is een mix van Barok en alternatieve barscène: Frauenkirche overdag, Neustadt met 200 bars in 1 km² 's nachts.",
      tip: "Bunte Republik Neustadt in juni — straatfestival met de hele barstraat als openluchtfeest.",
      faqs: [
        { q: "Dresden of Leipzig?", a: "Dresden cultureel dichter met Neustadt als kern. Leipzig hipster en indie. Beide goedkoop." },
        { q: "Wat kost Dresden?", a: "230–420 € per persoon. Goedkoper dan Berlijn of München." },
      ],
    },
    pl: {
      intro: "Drezno to mieszanka Baroku i alternatywnej sceny barowej: Frauenkirche w dzień, Neustadt z 200 barami na 1 km² w nocy.",
      tip: "Bunte Republik Neustadt w czerwcu — festyn uliczny z całą barową milą jako outdoorowy festiwal.",
      faqs: [
        { q: "Drezno czy Lipsk?", a: "Drezno gęstsze kulturowo z Neustadt jako osią. Lipsk bardziej hipster i indie. Oba tanie." },
        { q: "Ile kosztuje Drezno?", a: "230–420 € od osoby. Taniej niż Berlin czy Monachium." },
      ],
    },
    tr: {
      intro: "Dresden Barok ile alternatif bar sahnesinin karışımıdır: gündüz Frauenkirche, gece 1 km²'de 200 bar olan Neustadt.",
      tip: "Haziran'da Bunte Republik Neustadt — açık hava festivali olarak tüm bar caddesini kapsayan sokak festivali.",
      faqs: [
        { q: "Dresden mi Leipzig mi?", a: "Neustadt ekseniyle daha kültürel yoğun için Dresden. Daha hipster ve indie için Leipzig. İkisi de ucuz." },
        { q: "Dresden ne kadara mal olur?", a: "Kişi başı 230–420 €. Berlin ve Münih'ten ucuz." },
      ],
    },
  },
  {
    slug: "leipzig",
    es: {
      intro: "Leipzig es la versión más barata e hipster de Berlín: Karli y Plagwitz como ejes, lagos a 30 min para SUP.",
      tip: "SUP en Cospudener See (antigua mina de carbón ahora 4 km² de agua) + brunch en Plagwitz.",
      faqs: [
        { q: "¿Leipzig vale la pena?", a: "Sí para crews que quieren vibe Berlín sin precios Berlín. Algo menos denso pero más relajado." },
        { q: "¿Cuánto cuesta Leipzig?", a: "220–400 € por persona. Una de las opciones más baratas en Alemania Oriental." },
      ],
    },
    fr: {
      intro: "Leipzig est la version moins chère et plus hipster de Berlin : Karli et Plagwitz comme axes, lacs à 30 min pour SUP.",
      tip: "SUP sur le Cospudener See (ancienne mine de charbon devenue 4 km² d'eau) + brunch à Plagwitz.",
      faqs: [
        { q: "Leipzig vaut le coup ?", a: "Oui pour crews qui veulent l'ambiance Berlin sans les prix. Moins dense mais plus relax." },
        { q: "Combien coûte Leipzig ?", a: "220–400 € par personne. Une des options les moins chères en Allemagne de l'Est." },
      ],
    },
    it: {
      intro: "Lipsia è la versione più economica e hipster di Berlino: Karli e Plagwitz come assi, laghi a 30 min per SUP.",
      tip: "SUP al Cospudener See (ex miniera di carbone ora 4 km² d'acqua) + brunch a Plagwitz.",
      faqs: [
        { q: "Lipsia vale la pena?", a: "Sì per crew che vogliono vibe Berlino senza prezzi Berlino. Meno densa ma più rilassata." },
        { q: "Quanto costa Lipsia?", a: "220–400 € a persona. Una delle opzioni più economiche in Germania orientale." },
      ],
    },
    pt: {
      intro: "Leipzig é a versão mais barata e hipster de Berlim: Karli e Plagwitz como eixos, lagos a 30 min para SUP.",
      tip: "SUP em Cospudener See (antiga mina de carvão agora 4 km² de água) + brunch em Plagwitz.",
      faqs: [
        { q: "Leipzig vale a pena?", a: "Sim para grupos que querem vibe Berlim sem preços Berlim. Menos densa mas mais relaxada." },
        { q: "Quanto custa Leipzig?", a: "220–400 € por pessoa. Uma das opções mais baratas na Alemanha Oriental." },
      ],
    },
    nl: {
      intro: "Leipzig is de goedkopere en hippere versie van Berlijn: Karli en Plagwitz als assen, meren op 30 min voor SUP.",
      tip: "SUP op Cospudener See (voormalige bruinkoolmijn nu 4 km² water) + brunch in Plagwitz.",
      faqs: [
        { q: "Is Leipzig de moeite waard?", a: "Ja voor crews die Berlijn-sfeer willen zonder Berlijn-prijzen. Minder dicht maar relaxter." },
        { q: "Wat kost Leipzig?", a: "220–400 € per persoon. Een van de goedkoopste opties in Oost-Duitsland." },
      ],
    },
    pl: {
      intro: "Lipsk to tańsza i bardziej hipsterska wersja Berlina: Karli i Plagwitz jako osie, jeziora 30 min na SUP.",
      tip: "SUP na Cospudener See (była kopalnia węgla, dziś 4 km² wody) + brunch w Plagwitz.",
      faqs: [
        { q: "Czy Lipsk się opłaca?", a: "Tak dla ekip chcących klimatu Berlina bez berlińskich cen. Mniej gęste, ale luźniejsze." },
        { q: "Ile kosztuje Lipsk?", a: "220–400 € od osoby. Jedna z najtańszych opcji we wschodnich Niemczech." },
      ],
    },
    tr: {
      intro: "Leipzig, Berlin'in daha ucuz ve daha hipster versiyonudur: eksenler Karli ve Plagwitz, SUP için 30 dakika uzakta göller.",
      tip: "Cospudener See'de SUP (eski kömür madeni, şimdi 4 km² su) + Plagwitz'te brunch.",
      faqs: [
        { q: "Leipzig değer mi?", a: "Berlin fiyatları olmadan Berlin atmosferi isteyen ekipler için evet. Daha az yoğun ama daha rahat." },
        { q: "Leipzig ne kadara mal olur?", a: "Kişi başı 220–400 €. Doğu Almanya'nın en ucuz seçeneklerinden." },
      ],
    },
  },
  {
    slug: "nuremberg",
    es: {
      intro: "Núremberg es la alternativa franconia a Múnich: más barata, casco antiguo medieval, escena de bares en Gostenhof.",
      tip: "Drei-im-Weggla: tres salchichas en panecillo por 4–5 € — snack obligatorio entre bares.",
      faqs: [
        { q: "¿Núremberg o Múnich?", a: "Núremberg más compacta, mucho más barata, menos turística. Múnich más actividades y Wiesn." },
        { q: "¿Cuánto cuesta Núremberg?", a: "240–420 € por persona. Una de las ciudades del sur de Alemania más baratas." },
      ],
    },
    fr: {
      intro: "Nuremberg est l'alternative franconienne à Munich : moins chère, centre médiéval, scène de bars à Gostenhof.",
      tip: "Drei-im-Weggla : trois saucisses dans un petit pain pour 4–5 € — snack obligatoire entre bars.",
      faqs: [
        { q: "Nuremberg ou Munich ?", a: "Nuremberg plus compacte, beaucoup moins chère, moins touristique. Munich plus d'activités et Wiesn." },
        { q: "Combien coûte Nuremberg ?", a: "240–420 € par personne. Une des villes du sud de l'Allemagne les moins chères." },
      ],
    },
    it: {
      intro: "Norimberga è l'alternativa francone a Monaco: più economica, centro medievale, scena bar a Gostenhof.",
      tip: "Drei-im-Weggla: tre salsicce in panino per 4–5 € — snack obbligatorio tra bar.",
      faqs: [
        { q: "Norimberga o Monaco?", a: "Norimberga più compatta, molto più economica, meno turistica. Monaco più attività e Wiesn." },
        { q: "Quanto costa Norimberga?", a: "240–420 € a persona. Una delle città del sud della Germania più economiche." },
      ],
    },
    pt: {
      intro: "Nuremberga é a alternativa franconiana a Munique: mais barata, cidade antiga medieval, cena de bares em Gostenhof.",
      tip: "Drei-im-Weggla: três salsichas num pãozinho por 4–5 € — snack obrigatório entre bares.",
      faqs: [
        { q: "Nuremberga ou Munique?", a: "Nuremberga mais compacta, muito mais barata, menos turística. Munique mais atividades e Wiesn." },
        { q: "Quanto custa Nuremberga?", a: "240–420 € por pessoa. Uma das cidades do sul da Alemanha mais baratas." },
      ],
    },
    nl: {
      intro: "Neurenberg is het Frankisch alternatief voor München: goedkoper, middeleeuws centrum, barscène in Gostenhof.",
      tip: "Drei-im-Weggla: drie worstjes in een broodje voor 4–5 € — verplichte snack tussen bars.",
      faqs: [
        { q: "Neurenberg of München?", a: "Neurenberg compacter, veel goedkoper, minder toeristisch. München meer activiteiten en Wiesn." },
        { q: "Wat kost Neurenberg?", a: "240–420 € per persoon. Een van de goedkoopste Zuid-Duitse steden." },
      ],
    },
    pl: {
      intro: "Norymberga to frankońska alternatywa dla Monachium: tańsza, średniowieczna starówka, scena barowa w Gostenhof.",
      tip: "Drei-im-Weggla: trzy kiełbaski w bułce za 4–5 € — obowiązkowy snack między barami.",
      faqs: [
        { q: "Norymberga czy Monachium?", a: "Norymberga zwartsza, dużo tańsza, mniej turystyczna. Monachium więcej atrakcji i Wiesn." },
        { q: "Ile kosztuje Norymberga?", a: "240–420 € od osoby. Jedno z najtańszych miast południowych Niemiec." },
      ],
    },
    tr: {
      intro: "Nürnberg, Münih'in Frankonyalı alternatifidir: daha ucuz, ortaçağ eski şehir, Gostenhof'ta bar sahnesi.",
      tip: "Drei-im-Weggla: 4–5 €'ya bir simitte üç sosis — barlar arası zorunlu atıştırmalık.",
      faqs: [
        { q: "Nürnberg mi Münih mi?", a: "Daha kompakt, çok daha ucuz, daha az turistik için Nürnberg. Daha çok aktivite ve Wiesn için Münih." },
        { q: "Nürnberg ne kadara mal olur?", a: "Kişi başı 240–420 €. Güney Almanya'nın en ucuz şehirlerinden." },
      ],
    },
  },
  {
    slug: "salzburg",
    es: {
      intro: "Salzburgo es la despedida austriaca compacta: ciudad de Mozart, fortaleza Hohensalzburg, lagos Salzkammergut a 30 minutos.",
      tip: "Excursión al Wolfgangsee con barco + brunch en St. Wolfgang en 45 min — el día premium.",
      faqs: [
        { q: "¿Salzburgo para despedida?", a: "Para crews culturales que quieren montañas + ciudad, ideal. Para escalación pura, mejor Viena." },
        { q: "¿Cuánto cuesta Salzburgo?", a: "320–550 € por persona fuera del Festival. Durante el Festival se duplica." },
      ],
    },
    fr: {
      intro: "Salzbourg est l'EVG autrichien compact : ville de Mozart, forteresse Hohensalzburg, lacs Salzkammergut à 30 minutes.",
      tip: "Excursion au Wolfgangsee avec bateau + brunch à St. Wolfgang en 45 min — le jour premium.",
      faqs: [
        { q: "Salzbourg pour EVG ?", a: "Pour crews culturelles qui veulent montagnes + ville, idéal. Pour pure escalade, mieux Vienne." },
        { q: "Combien coûte Salzbourg ?", a: "320–550 € par personne hors Festival. Pendant Festival ça double." },
      ],
    },
    it: {
      intro: "Salisburgo è l'addio austriaco compatto: città di Mozart, fortezza Hohensalzburg, laghi Salzkammergut a 30 minuti.",
      tip: "Escursione al Wolfgangsee con barca + brunch a St. Wolfgang in 45 min — la giornata premium.",
      faqs: [
        { q: "Salisburgo per addio?", a: "Per crew culturali che vogliono montagna + città, ideale. Per pura escalation, meglio Vienna." },
        { q: "Quanto costa Salisburgo?", a: "320–550 € a persona fuori dal Festival. Durante il Festival raddoppia." },
      ],
    },
    pt: {
      intro: "Salzburgo é a despedida austríaca compacta: cidade de Mozart, fortaleza Hohensalzburg, lagos Salzkammergut a 30 minutos.",
      tip: "Excursão ao Wolfgangsee com barco + brunch em St. Wolfgang em 45 min — o dia premium.",
      faqs: [
        { q: "Salzburgo para despedida?", a: "Para grupos culturais que querem montanhas + cidade, ideal. Para pura escalada, melhor Viena." },
        { q: "Quanto custa Salzburgo?", a: "320–550 € por pessoa fora do Festival. Durante o Festival duplica." },
      ],
    },
    nl: {
      intro: "Salzburg is het compacte Oostenrijkse vrijgezellenfeest: Mozartstad, vesting Hohensalzburg, Salzkammergut-meren op 30 minuten.",
      tip: "Uitstap Wolfgangsee met boot + brunch in St. Wolfgang in 45 min — de premium dag.",
      faqs: [
        { q: "Salzburg voor vrijgezellenfeest?", a: "Voor culturele crews die bergen + stad willen, ideaal. Voor pure escalatie, beter Wenen." },
        { q: "Wat kost Salzburg?", a: "320–550 € per persoon buiten Festival. Tijdens Festival verdubbelt." },
      ],
    },
    pl: {
      intro: "Salzburg to zwarty austriacki wieczór kawalerski: miasto Mozarta, twierdza Hohensalzburg, jeziora Salzkammergut 30 minut.",
      tip: "Wycieczka na Wolfgangsee z łodzią + brunch w St. Wolfgang w 45 min — premium dzień.",
      faqs: [
        { q: "Salzburg na wieczór kawalerski?", a: "Dla kulturalnych ekip chcących gór + miasta, idealne. Dla czystej imprezy lepiej Wiedeń." },
        { q: "Ile kosztuje Salzburg?", a: "320–550 € od osoby poza Festiwalem. W Festiwalu podwaja się." },
      ],
    },
    tr: {
      intro: "Salzburg kompakt Avusturya bekarlığa vedasıdır: Mozart şehri, Hohensalzburg kalesi, 30 dakikalık Salzkammergut gölleri.",
      tip: "Wolfgangsee tekne gezisi + St. Wolfgang'da brunch 45 dakikada — premium gün.",
      faqs: [
        { q: "Bekarlığa veda için Salzburg?", a: "Dağ + şehir isteyen kültürel ekipler için ideal. Saf eğlence için Viyana daha iyi." },
        { q: "Salzburg ne kadara mal olur?", a: "Festival dışında kişi başı 320–550 €. Festival sırasında ikiye katlanır." },
      ],
    },
  },
  {
    slug: "istanbul",
    es: {
      intro: "Estambul es despedida única en dos continentes: Bosforo, bazar, hamam y bares europeos en Beyoğlu.",
      tip: "Yacht charter por el Bósforo para 6–10 personas: 150 € — mejor tour de la ciudad.",
      faqs: [
        { q: "¿Estambul seguro?", a: "Distritos turísticos muy seguros. Precauciones estándar como en cualquier metrópoli." },
        { q: "¿Cuánto cuesta Estambul?", a: "250–500 € por persona con vuelo. Con la lira débil, una de las mejores ofertas de Europa." },
      ],
    },
    fr: {
      intro: "Istanbul est un EVG unique sur deux continents : Bosphore, bazar, hammam et bars européens à Beyoğlu.",
      tip: "Yacht charter sur le Bosphore pour 6–10 personnes : 150 € — meilleur tour de la ville.",
      faqs: [
        { q: "Istanbul est sûre ?", a: "Quartiers touristiques très sûrs. Précautions standard comme dans toute métropole." },
        { q: "Combien coûte Istanbul ?", a: "250–500 € par personne avec vol. Avec la lire faible, une des meilleures affaires d'Europe." },
      ],
    },
    it: {
      intro: "Istanbul è un addio unico in due continenti: Bosforo, bazar, hammam e bar europei a Beyoğlu.",
      tip: "Yacht charter sul Bosforo per 6–10 persone: 150 € — miglior tour della città.",
      faqs: [
        { q: "Istanbul è sicura?", a: "Quartieri turistici molto sicuri. Precauzioni standard come in ogni metropoli." },
        { q: "Quanto costa Istanbul?", a: "250–500 € a persona con volo. Con la lira debole, uno dei migliori affari d'Europa." },
      ],
    },
    pt: {
      intro: "Istambul é uma despedida única em dois continentes: Bósforo, bazar, hammam e bares europeus em Beyoğlu.",
      tip: "Charter de iate pelo Bósforo para 6–10 pessoas: 150 € — melhor tour da cidade.",
      faqs: [
        { q: "Istambul é seguro?", a: "Bairros turísticos muito seguros. Precauções standard como em qualquer metrópole." },
        { q: "Quanto custa Istambul?", a: "250–500 € por pessoa com voo. Com a lira fraca, uma das melhores ofertas da Europa." },
      ],
    },
    nl: {
      intro: "Istanbul is een uniek vrijgezellenfeest op twee continenten: Bosporus, bazaar, hamam en Europese bars in Beyoğlu.",
      tip: "Privé-jacht over de Bosporus voor 6–10 personen: 150 € — beste stadstour.",
      faqs: [
        { q: "Is Istanbul veilig?", a: "Toeristische wijken zeer veilig. Standaard voorzorgsmaatregelen zoals in elke metropool." },
        { q: "Wat kost Istanbul?", a: "250–500 € per persoon met vlucht. Met zwakke lira een van de beste deals in Europa." },
      ],
    },
    pl: {
      intro: "Stambuł to wyjątkowy wieczór kawalerski na dwóch kontynentach: Bosfor, bazar, hammam i europejskie bary w Beyoğlu.",
      tip: "Czarter jachtu po Bosforze dla 6–10 osób: 150 € — najlepszy tour po mieście.",
      faqs: [
        { q: "Czy Stambuł jest bezpieczny?", a: "Dzielnice turystyczne bardzo bezpieczne. Standardowe środki ostrożności jak w każdej metropolii." },
        { q: "Ile kosztuje Stambuł?", a: "250–500 € od osoby z lotem. Przy słabej lirze jedna z najlepszych okazji w Europie." },
      ],
    },
    tr: {
      intro: "İstanbul iki kıtada eşsiz bir bekarlığa veda deneyimidir: Boğaz, kapalıçarşı, hamam ve Beyoğlu'nda Avrupai barlar.",
      tip: "6–10 kişi için Boğaz'da yat kiralama: 150 € — şehrin en iyi turu.",
      faqs: [
        { q: "İstanbul güvenli mi?", a: "Turistik bölgeler çok güvenli. Her metropolde olduğu gibi standart önlemler." },
        { q: "İstanbul ne kadara mal olur?", a: "Uçuşla kişi başı 250–500 €. Zayıf lira ile Avrupa'nın en iyi fırsatlarından." },
      ],
    },
  },
  {
    slug: "valencia",
    es: {
      intro: "Valencia es Barcelona sin presión turística: 7 km de playa urbana, Paella es de aquí, El Cabanyal como zona de bares.",
      tip: "Curso de cocina de paella valenciana auténtica: 40 € por persona, 4h con tour de mercado.",
      faqs: [
        { q: "¿Valencia o Barcelona?", a: "Valencia más tranquila, más barata, mejor playa, más auténtica. Barcelona más viva." },
        { q: "¿Cuánto cuesta Valencia?", a: "260–460 € por persona con vuelo. Una de las playas más baratas en Europa Occidental." },
      ],
    },
    fr: {
      intro: "Valence est Barcelone sans pression touristique : 7 km de plage urbaine, paella d'ici, El Cabanyal comme zone bars.",
      tip: "Cours de cuisine de paella valencienne authentique : 40 € par personne, 4h avec tour de marché.",
      faqs: [
        { q: "Valence ou Barcelone ?", a: "Valence plus calme, moins chère, meilleure plage, plus authentique. Barcelone plus vivante." },
        { q: "Combien coûte Valence ?", a: "260–460 € par personne avec vol. Une des plages les moins chères d'Europe occidentale." },
      ],
    },
    it: {
      intro: "Valencia è Barcellona senza pressione turistica: 7 km di spiaggia urbana, paella è di qui, El Cabanyal come zona bar.",
      tip: "Corso di cucina di paella valenciana autentica: 40 € a persona, 4h con tour di mercato.",
      faqs: [
        { q: "Valencia o Barcellona?", a: "Valencia più tranquilla, più economica, miglior spiaggia, più autentica. Barcellona più viva." },
        { q: "Quanto costa Valencia?", a: "260–460 € a persona con volo. Una delle spiagge più economiche dell'Europa occidentale." },
      ],
    },
    pt: {
      intro: "Valência é Barcelona sem pressão turística: 7 km de praia urbana, paella daqui, El Cabanyal como zona de bares.",
      tip: "Aula de cozinha de paella valenciana autêntica: 40 € por pessoa, 4h com tour de mercado.",
      faqs: [
        { q: "Valência ou Barcelona?", a: "Valência mais calma, mais barata, melhor praia, mais autêntica. Barcelona mais animada." },
        { q: "Quanto custa Valência?", a: "260–460 € por pessoa com voo. Uma das praias mais baratas da Europa Ocidental." },
      ],
    },
    nl: {
      intro: "Valencia is Barcelona zonder toeristendruk: 7 km stadsstrand, paella komt hiervandaan, El Cabanyal als barzone.",
      tip: "Authentieke Valenciaanse paella-kookles: 40 € per persoon, 4u met markttour.",
      faqs: [
        { q: "Valencia of Barcelona?", a: "Valencia rustiger, goedkoper, beter strand, authentieker. Barcelona levendiger." },
        { q: "Wat kost Valencia?", a: "260–460 € per persoon met vlucht. Een van de goedkoopste stranden in West-Europa." },
      ],
    },
    pl: {
      intro: "Walencja to Barcelona bez presji turystycznej: 7 km miejskiej plaży, paella stąd, El Cabanyal jako strefa barowa.",
      tip: "Autentyczny kurs gotowania paelli walencjańskiej: 40 € od osoby, 4h z turem po targu.",
      faqs: [
        { q: "Walencja czy Barcelona?", a: "Walencja spokojniejsza, tańsza, lepsza plaża, bardziej autentyczna. Barcelona żywsza." },
        { q: "Ile kosztuje Walencja?", a: "260–460 € od osoby z lotem. Jedna z najtańszych plaż w Europie Zachodniej." },
      ],
    },
    tr: {
      intro: "Valensiya turist baskısı olmayan Barselona'dır: 7 km şehir plajı, paella buradan, bar bölgesi El Cabanyal.",
      tip: "Otantik Valensiya paella yemek kursu: kişi başı 40 €, pazar turuyla 4 saat.",
      faqs: [
        { q: "Valensiya mı Barselona mı?", a: "Valensiya daha sakin, daha ucuz, daha iyi plaj, daha otantik. Barselona daha hareketli." },
        { q: "Valensiya ne kadara mal olur?", a: "Uçuşla kişi başı 260–460 €. Batı Avrupa'nın en ucuz plajlarından." },
      ],
    },
  },
  {
    slug: "porto",
    es: {
      intro: "Oporto es la hermana auténtica de Lisboa: bodegas de vino del Puerto, río Douro, escena de bares en Galerias de Paris.",
      tip: "Tour de 3 bodegas de Oporto en una tarde — Cálem, Sandeman, Taylor's. 15–25 € entrada con cata.",
      faqs: [
        { q: "¿Oporto o Lisboa?", a: "Lisboa más grande y vibrante. Oporto más auténtica con Oporto como distintivo. Primera Portugal: Lisboa." },
        { q: "¿Cuánto cuesta Oporto?", a: "280–500 € por persona con vuelo. Una de las opciones más baratas del oeste europeo." },
      ],
    },
    fr: {
      intro: "Porto est la sœur authentique de Lisbonne : caves de vin de Porto, fleuve Douro, scène de bars à Galerias de Paris.",
      tip: "Tour de 3 caves de Porto en un après-midi — Cálem, Sandeman, Taylor's. 15–25 € entrée avec dégustation.",
      faqs: [
        { q: "Porto ou Lisbonne ?", a: "Lisbonne plus grande et animée. Porto plus authentique avec Porto comme distinctif. Premier Portugal : Lisbonne." },
        { q: "Combien coûte Porto ?", a: "280–500 € par personne avec vol. Une des options les moins chères d'Europe occidentale." },
      ],
    },
    it: {
      intro: "Porto è la sorella autentica di Lisbona: cantine di vino Porto, fiume Douro, scena di bar a Galerias de Paris.",
      tip: "Tour di 3 cantine di Porto in un pomeriggio — Cálem, Sandeman, Taylor's. 15–25 € ingresso con degustazione.",
      faqs: [
        { q: "Porto o Lisbona?", a: "Lisbona più grande e viva. Porto più autentica con Porto come distintivo. Primo Portogallo: Lisbona." },
        { q: "Quanto costa Porto?", a: "280–500 € a persona con volo. Una delle opzioni più economiche dell'Europa occidentale." },
      ],
    },
    pt: {
      intro: "Porto é a irmã autêntica de Lisboa: caves de Vinho do Porto, rio Douro, cena de bares em Galerias de Paris.",
      tip: "Tour de 3 caves do Porto numa tarde — Cálem, Sandeman, Taylor's. 15–25 € entrada com prova.",
      faqs: [
        { q: "Porto ou Lisboa?", a: "Lisboa maior e mais vibrante. Porto mais autêntica com Vinho do Porto como distintivo. Primeiro Portugal: Lisboa." },
        { q: "Quanto custa Porto?", a: "280–500 € por pessoa com voo. Uma das opções mais baratas do oeste europeu." },
      ],
    },
    nl: {
      intro: "Porto is de authentieke zus van Lissabon: portwijnkelders, de Douro, barscène in Galerias de Paris.",
      tip: "Tour van 3 portwijnkelders in één middag — Cálem, Sandeman, Taylor's. 15–25 € entree met proeverij.",
      faqs: [
        { q: "Porto of Lissabon?", a: "Lissabon groter en levendiger. Porto authentieker met port als kenmerk. Eerste Portugal: Lissabon." },
        { q: "Wat kost Porto?", a: "280–500 € per persoon met vlucht. Een van de goedkoopste West-Europese opties." },
      ],
    },
    pl: {
      intro: "Porto to autentyczna siostra Lizbony: piwnice porto, rzeka Douro, scena barowa w Galerias de Paris.",
      tip: "Tour po 3 piwnicach porto w jedno popołudnie — Cálem, Sandeman, Taylor's. 15–25 € wstęp z degustacją.",
      faqs: [
        { q: "Porto czy Lizbona?", a: "Lizbona większa i bardziej żywa. Porto bardziej autentyczne z porto jako wyróżnikiem. Pierwsza Portugalia: Lizbona." },
        { q: "Ile kosztuje Porto?", a: "280–500 € od osoby z lotem. Jedna z najtańszych opcji w Europie Zachodniej." },
      ],
    },
    tr: {
      intro: "Porto, Lizbon'un otantik kız kardeşidir: Porto şarabı mahzenleri, Douro nehri, Galerias de Paris'te bar sahnesi.",
      tip: "Bir öğleden sonra 3 Porto şarap mahzeni turu — Cálem, Sandeman, Taylor's. Tadımla 15–25 € giriş.",
      faqs: [
        { q: "Porto mu Lizbon mu?", a: "Lizbon daha büyük ve canlı. Porto, ayırt edici Porto şarabıyla daha otantik. İlk Portekiz: Lizbon." },
        { q: "Porto ne kadara mal olur?", a: "Uçuşla kişi başı 280–500 €. Batı Avrupa'nın en ucuz seçeneklerinden." },
      ],
    },
  },
  {
    slug: "warsaw",
    es: {
      intro: "Varsovia es la versión más grande y moderna de Cracovia: barrio Praga como bares, casco antiguo reconstruido UNESCO.",
      tip: "Pijalnia Wódki i Piwa: chupito vodka 1,50 €, cerveza 1,50 €, snacks polacos. Estándar de despedida.",
      faqs: [
        { q: "¿Varsovia o Cracovia?", a: "Cracovia más compacta y cultural. Varsovia más vida nocturna densa y barata." },
        { q: "¿Cuánto cuesta Varsovia?", a: "180–400 € por persona, 3 noches con vuelo. Una de las capitales europeas más baratas." },
      ],
    },
    fr: {
      intro: "Varsovie est la version plus grande et moderne de Cracovie : quartier Praga comme bars, vieille ville reconstruite UNESCO.",
      tip: "Pijalnia Wódki i Piwa : shot de vodka 1,50 €, bière 1,50 €, snacks polonais. Standard EVG.",
      faqs: [
        { q: "Varsovie ou Cracovie ?", a: "Cracovie plus compacte et culturelle. Varsovie plus de vie nocturne dense et bon marché." },
        { q: "Combien coûte Varsovie ?", a: "180–400 € par personne, 3 nuits avec vol. Une des capitales européennes les moins chères." },
      ],
    },
    it: {
      intro: "Varsavia è la versione più grande e moderna di Cracovia: quartiere Praga come bar, centro storico ricostruito UNESCO.",
      tip: "Pijalnia Wódki i Piwa: shot di vodka 1,50 €, birra 1,50 €, snack polacchi. Standard addio.",
      faqs: [
        { q: "Varsavia o Cracovia?", a: "Cracovia più compatta e culturale. Varsavia più vita notturna densa ed economica." },
        { q: "Quanto costa Varsavia?", a: "180–400 € a persona, 3 notti con volo. Una delle capitali europee più economiche." },
      ],
    },
    pt: {
      intro: "Varsóvia é a versão maior e mais moderna de Cracóvia: bairro Praga como bares, cidade antiga reconstruída UNESCO.",
      tip: "Pijalnia Wódki i Piwa: shot de vodka 1,50 €, cerveja 1,50 €, snacks polacos. Standard de despedida.",
      faqs: [
        { q: "Varsóvia ou Cracóvia?", a: "Cracóvia mais compacta e cultural. Varsóvia mais vida noturna densa e barata." },
        { q: "Quanto custa Varsóvia?", a: "180–400 € por pessoa, 3 noites com voo. Uma das capitais europeias mais baratas." },
      ],
    },
    nl: {
      intro: "Warschau is de grotere en modernere versie van Krakau: wijk Praga als barzone, herbouwde UNESCO-oude stad.",
      tip: "Pijalnia Wódki i Piwa: wodka-shot 1,50 €, bier 1,50 €, Poolse snacks. Vrijgezellenstandaard.",
      faqs: [
        { q: "Warschau of Krakau?", a: "Krakau compacter en cultureler. Warschau dichter nachtleven en goedkoper." },
        { q: "Wat kost Warschau?", a: "180–400 € per persoon, 3 nachten met vlucht. Een van de goedkoopste Europese hoofdsteden." },
      ],
    },
    pl: {
      intro: "Warszawa to większa i nowocześniejsza wersja Krakowa: Praga jako bary, odbudowana starówka UNESCO.",
      tip: "Pijalnia Wódki i Piwa: shot wódki 1,50 €, piwo 1,50 €, polskie przekąski. Standard wieczoru kawalerskiego.",
      faqs: [
        { q: "Warszawa czy Kraków?", a: "Kraków zwartszy i bardziej kulturalny. Warszawa gęstsze życie nocne i taniej." },
        { q: "Ile kosztuje Warszawa?", a: "180–400 € od osoby, 3 noce z lotem. Jedna z najtańszych europejskich stolic." },
      ],
    },
    tr: {
      intro: "Varşova, Krakov'un daha büyük ve modern versiyonudur: bar bölgesi Praga, yeniden inşa edilmiş UNESCO eski şehri.",
      tip: "Pijalnia Wódki i Piwa: 1,50 € votka shotu, 1,50 € bira, Polonya atıştırmalıkları. Bekarlığa veda standardı.",
      faqs: [
        { q: "Varşova mı Krakov mı?", a: "Krakov daha kompakt ve kültürel. Varşova daha yoğun gece hayatı ve daha ucuz." },
        { q: "Varşova ne kadara mal olur?", a: "Uçuşla 3 gece kişi başı 180–400 €. Avrupa'nın en ucuz başkentlerinden." },
      ],
    },
  },
  {
    slug: "athens",
    es: {
      intro: "Atenas es la despedida mediterránea infravalorada: Acrópolis como decorado gratuito, Psiri y Gazi como bares hasta las 4 am.",
      tip: "Excursión a islas Sarónicas (Aegina, Poros, Hidra) en un día en ferry: 90 € por persona.",
      faqs: [
        { q: "¿Atenas en verano?", a: "Evitar. Julio/agosto 40°C+, ciudad medio vacía, locales huyen. Mejor mayo-junio o septiembre." },
        { q: "¿Cuánto cuesta Atenas?", a: "280–500 € por persona con vuelo. Una de las capitales mediterráneas más baratas." },
      ],
    },
    fr: {
      intro: "Athènes est l'EVG méditerranéen sous-estimé : Acropole comme décor gratuit, Psiri et Gazi comme bars jusqu'à 4h.",
      tip: "Excursion aux îles Saroniques (Égine, Poros, Hydra) en une journée en ferry : 90 € par personne.",
      faqs: [
        { q: "Athènes en été ?", a: "À éviter. Juillet/août 40°C+, ville semi-vide, locaux fuient. Mieux mai-juin ou septembre." },
        { q: "Combien coûte Athènes ?", a: "280–500 € par personne avec vol. Une des capitales méditerranéennes les moins chères." },
      ],
    },
    it: {
      intro: "Atene è l'addio mediterraneo sottovalutato: Acropoli come scenario gratis, Psiri e Gazi come bar fino alle 4.",
      tip: "Escursione alle isole Saroniche (Egina, Poros, Idra) in un giorno in ferry: 90 € a persona.",
      faqs: [
        { q: "Atene in estate?", a: "Evitare. Luglio/agosto 40°C+, città semi-vuota, locali fuggono. Meglio maggio-giugno o settembre." },
        { q: "Quanto costa Atene?", a: "280–500 € a persona con volo. Una delle capitali mediterranee più economiche." },
      ],
    },
    pt: {
      intro: "Atenas é a despedida mediterrânica subestimada: Acrópole como cenário gratuito, Psiri e Gazi como bares até às 4 da manhã.",
      tip: "Excursão às ilhas Sarônicas (Egina, Poros, Hidra) num dia em ferry: 90 € por pessoa.",
      faqs: [
        { q: "Atenas no verão?", a: "Evitar. Julho/agosto 40°C+, cidade meio vazia, locais fogem. Melhor maio-junho ou setembro." },
        { q: "Quanto custa Atenas?", a: "280–500 € por pessoa com voo. Uma das capitais mediterrânicas mais baratas." },
      ],
    },
    nl: {
      intro: "Athene is het onderschatte mediterrane vrijgezellenfeest: Akropolis als gratis decor, Psiri en Gazi als bars tot 4 uur 's nachts.",
      tip: "Dagtocht naar de Saronische eilanden (Aegina, Poros, Hydra) met veerboot: 90 € per persoon.",
      faqs: [
        { q: "Athene in de zomer?", a: "Vermijden. Juli/augustus 40°C+, stad half leeg, locals vluchten. Beter mei-juni of september." },
        { q: "Wat kost Athene?", a: "280–500 € per persoon met vlucht. Een van de goedkoopste mediterrane hoofdsteden." },
      ],
    },
    pl: {
      intro: "Ateny to niedoceniany śródziemnomorski wieczór kawalerski: Akropol jako darmowa sceneria, Psiri i Gazi jako bary do 4 rano.",
      tip: "Wycieczka na Wyspy Sarońskie (Egina, Poros, Hydra) jednodniowo promem: 90 € od osoby.",
      faqs: [
        { q: "Ateny latem?", a: "Unikać. Lipiec/sierpień 40°C+, miasto wpół puste, mieszkańcy uciekają. Lepiej maj-czerwiec lub wrzesień." },
        { q: "Ile kosztują Ateny?", a: "280–500 € od osoby z lotem. Jedna z najtańszych śródziemnomorskich stolic." },
      ],
    },
    tr: {
      intro: "Atina hafife alınmış Akdeniz bekarlığa vedasıdır: ücretsiz dekor Akropolis, sabah 4'e kadar barlar Psiri ve Gazi.",
      tip: "Saronik adalarına (Aegina, Poros, Hidra) bir günlük ferry gezisi: kişi başı 90 €.",
      faqs: [
        { q: "Yazın Atina?", a: "Kaçının. Temmuz/ağustos 40°C+, şehir yarı boş, yerli halk kaçar. Mayıs-haziran veya eylül daha iyi." },
        { q: "Atina ne kadara mal olur?", a: "Uçuşla kişi başı 280–500 €. Akdeniz başkentlerinin en ucuzlarından." },
      ],
    },
  },
  {
    slug: "copenhagen",
    es: {
      intro: "Copenhague es despedida escandinava elegante: Nyhavn como decorado, Vesterbro como zona de bares, escena craft beer top mundial.",
      tip: "Tour Mikkeller (imperio danés del craft beer) — 5+ locales en Copenhague, programa obligatorio.",
      faqs: [
        { q: "¿Copenhague vale el precio?", a: "Para crews con presupuesto >600 € por persona y afinidad por craft beer/cócteles, sí." },
        { q: "¿Cuánto cuesta Copenhague?", a: "550–900 € por persona, 3 noches con vuelo. Una de las opciones más caras de Europa." },
      ],
    },
    fr: {
      intro: "Copenhague est EVG scandinave élégant : Nyhavn comme décor, Vesterbro comme zone bars, scène craft beer top mondiale.",
      tip: "Tour Mikkeller (empire danois du craft beer) — 5+ locaux à Copenhague, programme obligatoire.",
      faqs: [
        { q: "Copenhague vaut le prix ?", a: "Pour crews avec budget >600 € par personne et affinité craft beer/cocktails, oui." },
        { q: "Combien coûte Copenhague ?", a: "550–900 € par personne, 3 nuits avec vol. Une des options les plus chères d'Europe." },
      ],
    },
    it: {
      intro: "Copenaghen è addio scandinavo elegante: Nyhavn come scenario, Vesterbro come zona bar, scena craft beer top mondiale.",
      tip: "Tour Mikkeller (impero danese del craft beer) — 5+ locali a Copenaghen, programma obbligatorio.",
      faqs: [
        { q: "Copenaghen vale il prezzo?", a: "Per crew con budget >600 € a persona e affinità craft beer/cocktail, sì." },
        { q: "Quanto costa Copenaghen?", a: "550–900 € a persona, 3 notti con volo. Una delle opzioni più care d'Europa." },
      ],
    },
    pt: {
      intro: "Copenhaga é despedida escandinava elegante: Nyhavn como cenário, Vesterbro como zona de bares, cena craft beer de topo mundial.",
      tip: "Tour Mikkeller (império dinamarquês da craft beer) — 5+ locais em Copenhaga, programa obrigatório.",
      faqs: [
        { q: "Copenhaga vale o preço?", a: "Para grupos com orçamento >600 € por pessoa e afinidade por craft beer/cocktails, sim." },
        { q: "Quanto custa Copenhaga?", a: "550–900 € por pessoa, 3 noites com voo. Uma das opções mais caras da Europa." },
      ],
    },
    nl: {
      intro: "Kopenhagen is een elegant Scandinavisch vrijgezellenfeest: Nyhavn als decor, Vesterbro als barzone, wereldklasse craft beer.",
      tip: "Mikkeller-tour (Deens craft-beer-imperium) — 5+ locaties in Kopenhagen, verplicht programma.",
      faqs: [
        { q: "Is Kopenhagen de prijs waard?", a: "Voor crews met >600 € per persoon en affiniteit voor craft beer/cocktails, ja." },
        { q: "Wat kost Kopenhagen?", a: "550–900 € per persoon, 3 nachten met vlucht. Een van de duurste opties in Europa." },
      ],
    },
    pl: {
      intro: "Kopenhaga to elegancki skandynawski wieczór kawalerski: Nyhavn jako sceneria, Vesterbro jako strefa barowa, światowej klasy craft beer.",
      tip: "Tour Mikkeller (duńskie imperium craft beer) — 5+ lokali w Kopenhadze, obowiązkowy program.",
      faqs: [
        { q: "Czy Kopenhaga warta swojej ceny?", a: "Dla ekip z budżetem >600 € od osoby i zamiłowaniem do craft beer/koktajli, tak." },
        { q: "Ile kosztuje Kopenhaga?", a: "550–900 € od osoby, 3 noce z lotem. Jedna z najdroższych opcji w Europie." },
      ],
    },
    tr: {
      intro: "Kopenhag zarif İskandinav bekarlığa vedasıdır: dekor olarak Nyhavn, bar bölgesi Vesterbro, dünya çapında craft bira sahnesi.",
      tip: "Mikkeller turu (Danimarka'nın craft bira imparatorluğu) — Kopenhag'da 5+ lokasyon, zorunlu program.",
      faqs: [
        { q: "Kopenhag fiyatına değer mi?", a: "Kişi başı >600 € bütçeli ve craft bira/kokteyl tutkunu ekipler için, evet." },
        { q: "Kopenhag ne kadara mal olur?", a: "Uçuşla 3 gece kişi başı 550–900 €. Avrupa'nın en pahalı seçeneklerinden." },
      ],
    },
  },
  {
    slug: "stockholm",
    es: {
      intro: "Estocolmo es premium escandinava: 14 islas, archipiélago como excursión, Södermalm hipster y Stureplan elegante.",
      tip: "Tour de archipiélago a Vaxholm: 1h ferry al noreste, isla-hopping, foto en rocas junto al mar.",
      faqs: [
        { q: "¿Estocolmo o Copenhague?", a: "Estocolmo tiene archipiélago como bonus único. Copenhague más compacta con mejor craft beer. Precios similares." },
        { q: "¿Cuánto cuesta Estocolmo?", a: "600–1000 € por persona, 3 noches con vuelo. Una de las opciones más caras de Europa." },
      ],
    },
    fr: {
      intro: "Stockholm est premium scandinave : 14 îles, archipel en excursion, Södermalm hipster et Stureplan élégant.",
      tip: "Tour de l'archipel à Vaxholm : 1h ferry au nord-est, island-hopping, photo sur rochers au bord de la mer.",
      faqs: [
        { q: "Stockholm ou Copenhague ?", a: "Stockholm a l'archipel comme bonus unique. Copenhague plus compacte avec meilleur craft beer. Prix similaires." },
        { q: "Combien coûte Stockholm ?", a: "600–1000 € par personne, 3 nuits avec vol. Une des options les plus chères d'Europe." },
      ],
    },
    it: {
      intro: "Stoccolma è premium scandinava: 14 isole, arcipelago come escursione, Södermalm hipster e Stureplan elegante.",
      tip: "Tour dell'arcipelago a Vaxholm: 1h ferry a nord-est, island-hopping, foto su rocce in riva al mare.",
      faqs: [
        { q: "Stoccolma o Copenaghen?", a: "Stoccolma ha arcipelago come bonus unico. Copenaghen più compatta con miglior craft beer. Prezzi simili." },
        { q: "Quanto costa Stoccolma?", a: "600–1000 € a persona, 3 notti con volo. Una delle opzioni più care d'Europa." },
      ],
    },
    pt: {
      intro: "Estocolmo é escandinava premium: 14 ilhas, arquipélago como excursão, Södermalm hipster e Stureplan elegante.",
      tip: "Tour de arquipélago a Vaxholm: 1h ferry para nordeste, island-hopping, foto em rochas junto ao mar.",
      faqs: [
        { q: "Estocolmo ou Copenhaga?", a: "Estocolmo tem arquipélago como bónus único. Copenhaga mais compacta com melhor craft beer. Preços semelhantes." },
        { q: "Quanto custa Estocolmo?", a: "600–1000 € por pessoa, 3 noites com voo. Uma das opções mais caras da Europa." },
      ],
    },
    nl: {
      intro: "Stockholm is premium Scandinavisch: 14 eilanden, archipel als uitstap, Södermalm hipster en Stureplan chic.",
      tip: "Archipeltour naar Vaxholm: 1u veerboot noordoost, eilandhoppen, foto op rotsen aan zee.",
      faqs: [
        { q: "Stockholm of Kopenhagen?", a: "Stockholm heeft de archipel als unieke bonus. Kopenhagen compacter met betere craft beer. Vergelijkbare prijzen." },
        { q: "Wat kost Stockholm?", a: "600–1000 € per persoon, 3 nachten met vlucht. Een van de duurste opties in Europa." },
      ],
    },
    pl: {
      intro: "Sztokholm to premium skandynawski: 14 wysp, archipelag jako wycieczka, hipsterski Södermalm i elegancki Stureplan.",
      tip: "Tour po archipelagu do Vaxholm: 1h promem na północny wschód, island-hopping, zdjęcie na skałach nad morzem.",
      faqs: [
        { q: "Sztokholm czy Kopenhaga?", a: "Sztokholm ma archipelag jako unikalny bonus. Kopenhaga zwartsza z lepszym craft beer. Podobne ceny." },
        { q: "Ile kosztuje Sztokholm?", a: "600–1000 € od osoby, 3 noce z lotem. Jedna z najdroższych opcji w Europie." },
      ],
    },
    tr: {
      intro: "Stockholm premium İskandinavyalıdır: 14 ada, gezi olarak takımadalar, hipster Södermalm ve şık Stureplan.",
      tip: "Vaxholm'a takımadalar turu: kuzeydoğuya 1 saat ferry, ada atlama, deniz kenarındaki kayalarda fotoğraf.",
      faqs: [
        { q: "Stockholm mu Kopenhag mı?", a: "Stockholm'un eşsiz bonusu takımadalar. Kopenhag daha kompakt ve daha iyi craft bira. Fiyatlar benzer." },
        { q: "Stockholm ne kadara mal olur?", a: "Uçuşla 3 gece kişi başı 600–1000 €. Avrupa'nın en pahalı seçeneklerinden." },
      ],
    },
  },
  {
    slug: "tallinn",
    es: {
      intro: "Tallin es el secreto báltico: casco medieval UNESCO, distrito hipster Telliskivi, sauna estonia tradicional.",
      tip: "Sauna Suitsusaun (sauna de humo tradicional): único en Europa como programa de despedida.",
      faqs: [
        { q: "¿Tallin para despedida?", a: "Sí, uno de los secretos europeos. Precios Cracovia, calidad de bar Copenhague, tradición sauna única." },
        { q: "¿Cuánto cuesta Tallin?", a: "230–420 € por persona, 3 noches con vuelo. Una de las capitales más baratas de Europa." },
      ],
    },
    fr: {
      intro: "Tallinn est le secret balte : vieille ville médiévale UNESCO, quartier hipster Telliskivi, sauna estonien traditionnel.",
      tip: "Sauna Suitsusaun (sauna fumée traditionnel) : unique en Europe comme programme EVG.",
      faqs: [
        { q: "Tallinn pour EVG ?", a: "Oui, un des secrets européens. Prix Cracovie, qualité bar Copenhague, tradition sauna unique." },
        { q: "Combien coûte Tallinn ?", a: "230–420 € par personne, 3 nuits avec vol. Une des capitales les moins chères d'Europe." },
      ],
    },
    it: {
      intro: "Tallinn è il segreto baltico: centro medievale UNESCO, quartiere hipster Telliskivi, sauna estone tradizionale.",
      tip: "Sauna Suitsusaun (sauna a fumo tradizionale): unica in Europa come programma di addio.",
      faqs: [
        { q: "Tallinn per addio?", a: "Sì, uno dei segreti europei. Prezzi Cracovia, qualità bar Copenaghen, tradizione sauna unica." },
        { q: "Quanto costa Tallinn?", a: "230–420 € a persona, 3 notti con volo. Una delle capitali più economiche d'Europa." },
      ],
    },
    pt: {
      intro: "Tallinn é o segredo báltico: cidade medieval UNESCO, bairro hipster Telliskivi, sauna estoniana tradicional.",
      tip: "Sauna Suitsusaun (sauna de fumo tradicional): única na Europa como programa de despedida.",
      faqs: [
        { q: "Tallinn para despedida?", a: "Sim, um dos segredos europeus. Preços de Cracóvia, qualidade de bar de Copenhaga, tradição de sauna única." },
        { q: "Quanto custa Tallinn?", a: "230–420 € por pessoa, 3 noites com voo. Uma das capitais mais baratas da Europa." },
      ],
    },
    nl: {
      intro: "Tallinn is het Baltische geheim: middeleeuwse UNESCO-stad, hipster Telliskivi, traditionele Estse sauna.",
      tip: "Suitsusaun (traditionele rookzauna): uniek in Europa als vrijgezellenprogramma.",
      faqs: [
        { q: "Tallinn voor vrijgezellenfeest?", a: "Ja, een van de Europese geheimen. Krakauprijzen, Kopenhagenkwaliteit, unieke saunatraditie." },
        { q: "Wat kost Tallinn?", a: "230–420 € per persoon, 3 nachten met vlucht. Een van de goedkoopste Europese hoofdsteden." },
      ],
    },
    pl: {
      intro: "Tallinn to bałtycka tajemnica: średniowieczne miasto UNESCO, hipsterska dzielnica Telliskivi, tradycyjna estońska sauna.",
      tip: "Suitsusaun (tradycyjna sauna dymna): unikalna w Europie jako program wieczoru kawalerskiego.",
      faqs: [
        { q: "Tallinn na wieczór kawalerski?", a: "Tak, jedna z europejskich tajemnic. Ceny Krakowa, jakość barów Kopenhagi, unikalna tradycja sauny." },
        { q: "Ile kosztuje Tallinn?", a: "230–420 € od osoby, 3 noce z lotem. Jedna z najtańszych stolic Europy." },
      ],
    },
    tr: {
      intro: "Tallinn Baltık'ın sırrıdır: UNESCO ortaçağ şehri, hipster Telliskivi, geleneksel Estonya saunası.",
      tip: "Suitsusaun (geleneksel duman sauna): Avrupa'da eşsiz bekarlığa veda programı.",
      faqs: [
        { q: "Bekarlığa veda için Tallinn?", a: "Evet, Avrupa'nın gizli incilerinden. Krakov fiyatları, Kopenhag bar kalitesi, eşsiz sauna geleneği." },
        { q: "Tallinn ne kadara mal olur?", a: "Uçuşla 3 gece kişi başı 230–420 €. Avrupa'nın en ucuz başkentlerinden." },
      ],
    },
  },
  {
    slug: "bucharest",
    es: {
      intro: "Bucarest es la despedida creciente de Europa del Este: Lipscani Old Town como zona de bares, mejor stand de tiro que Praga.",
      tip: "Therme București: 16 piscinas wellness 30 min fuera ciudad, 35 € entrada de día.",
      faqs: [
        { q: "¿Bucarest segura?", a: "Distritos turísticos sí. Precauciones estándar como en cualquier metrópoli." },
        { q: "¿Cuánto cuesta Bucarest?", a: "180–380 € por persona, 3 noches con vuelo. Una de las capitales más baratas de Europa." },
      ],
    },
    fr: {
      intro: "Bucarest est l'EVG en croissance d'Europe de l'Est : Lipscani Old Town comme zone bars, meilleur stand de tir que Prague.",
      tip: "Therme București : 16 piscines wellness 30 min hors ville, 35 € entrée journée.",
      faqs: [
        { q: "Bucarest sûre ?", a: "Quartiers touristiques oui. Précautions standard comme dans toute métropole." },
        { q: "Combien coûte Bucarest ?", a: "180–380 € par personne, 3 nuits avec vol. Une des capitales les moins chères d'Europe." },
      ],
    },
    it: {
      intro: "Bucarest è l'addio in crescita dell'Est Europa: Lipscani Old Town come zona bar, miglior poligono di tiro di Praga.",
      tip: "Therme București: 16 piscine wellness 30 min fuori città, 35 € ingresso giornaliero.",
      faqs: [
        { q: "Bucarest sicura?", a: "Quartieri turistici sì. Precauzioni standard come in ogni metropoli." },
        { q: "Quanto costa Bucarest?", a: "180–380 € a persona, 3 notti con volo. Una delle capitali più economiche d'Europa." },
      ],
    },
    pt: {
      intro: "Bucareste é a despedida emergente da Europa do Leste: Lipscani Old Town como zona de bares, melhor stand de tiro que Praga.",
      tip: "Therme București: 16 piscinas wellness a 30 min da cidade, 35 € entrada de dia.",
      faqs: [
        { q: "Bucareste segura?", a: "Bairros turísticos sim. Precauções standard como em qualquer metrópole." },
        { q: "Quanto custa Bucareste?", a: "180–380 € por pessoa, 3 noites com voo. Uma das capitais mais baratas da Europa." },
      ],
    },
    nl: {
      intro: "Boekarest is het opkomende Oost-Europese vrijgezellenfeest: Lipscani Old Town als barzone, beter schietterrein dan Praag.",
      tip: "Therme București: 16 wellnessbaden 30 min buiten de stad, 35 € dagentree.",
      faqs: [
        { q: "Boekarest veilig?", a: "Toeristische wijken ja. Standaard voorzorgsmaatregelen zoals in elke metropool." },
        { q: "Wat kost Boekarest?", a: "180–380 € per persoon, 3 nachten met vlucht. Een van de goedkoopste Europese hoofdsteden." },
      ],
    },
    pl: {
      intro: "Bukareszt to wschodzący wieczór kawalerski Europy Wschodniej: Lipscani Old Town jako strefa barów, lepsza strzelnica niż Praga.",
      tip: "Therme București: 16 basenów wellness 30 min od miasta, 35 € wstęp dzienny.",
      faqs: [
        { q: "Bukareszt bezpieczny?", a: "Dzielnice turystyczne tak. Standardowe środki ostrożności jak w każdej metropolii." },
        { q: "Ile kosztuje Bukareszt?", a: "180–380 € od osoby, 3 noce z lotem. Jedna z najtańszych europejskich stolic." },
      ],
    },
    tr: {
      intro: "Bükreş, Doğu Avrupa'nın yükselen bekarlığa veda şehridir: bar bölgesi Lipscani Old Town, Prag'dan iyi atış poligonu.",
      tip: "Therme București: şehrin 30 dakika dışında 16 wellness havuzu, 35 € günlük giriş.",
      faqs: [
        { q: "Bükreş güvenli mi?", a: "Turistik bölgeler evet. Her metropolde olduğu gibi standart önlemler." },
        { q: "Bükreş ne kadara mal olur?", a: "Uçuşla 3 gece kişi başı 180–380 €. Avrupa'nın en ucuz başkentlerinden." },
      ],
    },
  },
  {
    slug: "brussels",
    es: {
      intro: "Bruselas es despedida de cerveza: Delirium Café con 2000+ variedades, tradición de cerveza de monasterio.",
      tip: "Excursión a Brujas: 1h tren, una de las ciudades más bellas de Europa — perfecto domingo brunch.",
      faqs: [
        { q: "¿Bruselas o Ámsterdam para cerveza?", a: "Bruselas para cervezas de monasterio. Ámsterdam para mezcla general cerveza + coffeeshops." },
        { q: "¿Cuánto cuesta Bruselas?", a: "320–560 € por persona, 3 noches. Precios medios europeos." },
      ],
    },
    fr: {
      intro: "Bruxelles est EVG de bière : Delirium Café avec 2000+ variétés, tradition de bière monastique.",
      tip: "Excursion à Bruges : 1h train, une des plus belles villes d'Europe — parfait pour brunch dimanche.",
      faqs: [
        { q: "Bruxelles ou Amsterdam pour bière ?", a: "Bruxelles pour bières monastiques. Amsterdam pour mix général bière + coffeeshops." },
        { q: "Combien coûte Bruxelles ?", a: "320–560 € par personne, 3 nuits. Prix moyens européens." },
      ],
    },
    it: {
      intro: "Bruxelles è addio di birra: Delirium Café con 2000+ varietà, tradizione di birra monastica.",
      tip: "Escursione a Bruges: 1h treno, una delle città più belle d'Europa — perfetto domenica brunch.",
      faqs: [
        { q: "Bruxelles o Amsterdam per birra?", a: "Bruxelles per birre monastiche. Amsterdam per mix generale birra + coffeeshop." },
        { q: "Quanto costa Bruxelles?", a: "320–560 € a persona, 3 notti. Prezzi medi europei." },
      ],
    },
    pt: {
      intro: "Bruxelas é despedida de cerveja: Delirium Café com 2000+ variedades, tradição de cerveja de mosteiro.",
      tip: "Excursão a Bruges: 1h de comboio, uma das cidades mais bonitas da Europa — perfeito brunch de domingo.",
      faqs: [
        { q: "Bruxelas ou Amesterdão para cerveja?", a: "Bruxelas para cervejas de mosteiro. Amesterdão para mistura geral cerveja + coffeeshops." },
        { q: "Quanto custa Bruxelas?", a: "320–560 € por pessoa, 3 noites. Preços médios europeus." },
      ],
    },
    nl: {
      intro: "Brussel is een biervrijgezellenfeest: Delirium Café met 2000+ soorten, kloosterbiertraditie.",
      tip: "Uitstap naar Brugge: 1u trein, een van de mooiste steden van Europa — perfecte zondagbrunch.",
      faqs: [
        { q: "Brussel of Amsterdam voor bier?", a: "Brussel voor kloosterbieren. Amsterdam voor algemene mix bier + coffeeshops." },
        { q: "Wat kost Brussel?", a: "320–560 € per persoon, 3 nachten. Gemiddelde Europese prijzen." },
      ],
    },
    pl: {
      intro: "Bruksela to piwny wieczór kawalerski: Delirium Café z 2000+ odmianami, tradycja piwa klasztornego.",
      tip: "Wycieczka do Brugii: 1h pociągiem, jedno z najpiękniejszych miast Europy — idealny niedzielny brunch.",
      faqs: [
        { q: "Bruksela czy Amsterdam dla piwa?", a: "Bruksela dla piw klasztornych. Amsterdam dla ogólnej mieszanki piwo + coffeeshopy." },
        { q: "Ile kosztuje Bruksela?", a: "320–560 € od osoby, 3 noce. Średnie europejskie ceny." },
      ],
    },
    tr: {
      intro: "Brüksel bira bekarlığa vedasıdır: 2000+ çeşitli Delirium Café, manastır birası geleneği.",
      tip: "Bruges gezisi: 1 saat tren, Avrupa'nın en güzel şehirlerinden — mükemmel pazar brunch'ı.",
      faqs: [
        { q: "Bira için Brüksel mi Amsterdam mı?", a: "Manastır biraları için Brüksel. Genel bira + coffeeshop karışımı için Amsterdam." },
        { q: "Brüksel ne kadara mal olur?", a: "3 gece kişi başı 320–560 €. Avrupa ortalama fiyatları." },
      ],
    },
  },
  {
    slug: "nice",
    es: {
      intro: "Niza es despedida glamour Riviera: Promenade des Anglais, Mónaco y Cannes como excursiones, Vieux Nice como zona bares.",
      tip: "Excursión a Mónaco: 25 min tren, foto casino obligatoria, paseo por puerto deportivo.",
      faqs: [
        { q: "¿Niza o Barcelona?", a: "Barcelona más barata y viva. Niza tiene glamour Riviera con Mónaco y Cannes de bonus." },
        { q: "¿Cuánto cuesta Niza?", a: "450–800 € por persona, 3 noches con vuelo. Una de las playas más caras de Europa." },
      ],
    },
    fr: {
      intro: "Nice est EVG glamour Riviera : Promenade des Anglais, Monaco et Cannes en excursion, Vieux Nice comme zone bars.",
      tip: "Excursion à Monaco : 25 min train, photo casino obligatoire, balade au port de plaisance.",
      faqs: [
        { q: "Nice ou Barcelone ?", a: "Barcelone moins chère et plus vivante. Nice a le glamour Riviera avec Monaco et Cannes en bonus." },
        { q: "Combien coûte Nice ?", a: "450–800 € par personne, 3 nuits avec vol. Une des plages les plus chères d'Europe." },
      ],
    },
    it: {
      intro: "Nizza è addio glamour Riviera: Promenade des Anglais, Monaco e Cannes come escursioni, Vieux Nice come zona bar.",
      tip: "Escursione a Monaco: 25 min treno, foto casinò obbligatoria, passeggiata al porto turistico.",
      faqs: [
        { q: "Nizza o Barcellona?", a: "Barcellona più economica e viva. Nizza ha glamour Riviera con Monaco e Cannes in più." },
        { q: "Quanto costa Nizza?", a: "450–800 € a persona, 3 notti con volo. Una delle spiagge più care d'Europa." },
      ],
    },
    pt: {
      intro: "Nice é despedida glamour Riviera: Promenade des Anglais, Mónaco e Cannes como excursões, Vieux Nice como zona de bares.",
      tip: "Excursão a Mónaco: 25 min de comboio, foto do casino obrigatória, passeio pelo porto desportivo.",
      faqs: [
        { q: "Nice ou Barcelona?", a: "Barcelona mais barata e animada. Nice tem glamour Riviera com Mónaco e Cannes como bónus." },
        { q: "Quanto custa Nice?", a: "450–800 € por pessoa, 3 noites com voo. Uma das praias mais caras da Europa." },
      ],
    },
    nl: {
      intro: "Nice is een glamour Riviera-vrijgezellenfeest: Promenade des Anglais, Monaco en Cannes als uitstapjes, Vieux Nice als barzone.",
      tip: "Uitstap naar Monaco: 25 min trein, verplichte casinofoto, wandeling langs de jachthaven.",
      faqs: [
        { q: "Nice of Barcelona?", a: "Barcelona goedkoper en levendiger. Nice heeft Riviera-glamour met Monaco en Cannes als bonus." },
        { q: "Wat kost Nice?", a: "450–800 € per persoon, 3 nachten met vlucht. Een van de duurste stranden in Europa." },
      ],
    },
    pl: {
      intro: "Nicea to glamour wieczór kawalerski Riviery: Promenade des Anglais, Monako i Cannes jako wycieczki, Vieux Nice jako strefa barów.",
      tip: "Wycieczka do Monako: 25 min pociągiem, obowiązkowe zdjęcie kasyna, spacer po porcie jachtowym.",
      faqs: [
        { q: "Nicea czy Barcelona?", a: "Barcelona tańsza i bardziej żywa. Nicea ma glamour Riviery z Monako i Cannes w bonusie." },
        { q: "Ile kosztuje Nicea?", a: "450–800 € od osoby, 3 noce z lotem. Jedna z najdroższych plaż w Europie." },
      ],
    },
    tr: {
      intro: "Nice glamour Riviera bekarlığa vedasıdır: Promenade des Anglais, geziler için Monaco ve Cannes, bar bölgesi Vieux Nice.",
      tip: "Monaco gezisi: 25 dakika tren, zorunlu kumarhane fotoğrafı, yat limanında yürüyüş.",
      faqs: [
        { q: "Nice mi Barselona mı?", a: "Barselona daha ucuz ve canlı. Nice'in Monaco ve Cannes bonusuyla Riviera çekiciliği var." },
        { q: "Nice ne kadara mal olur?", a: "Uçuşla 3 gece kişi başı 450–800 €. Avrupa'nın en pahalı plajlarından." },
      ],
    },
  },
];

export function getIntlCity(slug: string): IntlCityEntry | undefined {
  return INTL_CITIES.find((c) => c.slug === slug.toLowerCase());
}

export function getAllIntlSlugs(): string[] {
  return INTL_CITIES.map((c) => c.slug);
}
