/**
 * Die Inhalte des Demo-Ereignisses in zehn Sprachen.
 *
 * WARUM ES DAS BRAUCHT: `_seed.mjs` legt EIN deutsches Ereignis an. Der
 * Aufnahmelauf schaltet danach nur die Oberflaeche um — die Eintraege bleiben
 * deutsch. In den englischen Store-Bildern steht deshalb "Welcome-BBQ an der
 * Finca" unter englischen Reitern, und in den tuerkischen dasselbe. Wer ein
 * Bild ansieht, sieht eine App, die ihre eigene Sprache nicht kann.
 *
 * DIE SCHLUESSEL SIND UHRZEIT UND BETRAG, nicht der deutsche Text. Das ist der
 * entscheidende Punkt: nach der ersten Umstellung GIBT es den deutschen Text
 * nicht mehr. Ein Abgleich ueber die Beschreibung funktionierte genau einmal
 * und danach nie wieder — der zweite Lauf haette stillschweigend nichts
 * geaendert. Uhrzeit und Betrag sind im Demo-Ereignis eindeutig und in jeder
 * Sprache dieselben.
 *
 * ORTSNAMEN BLEIBEN STEHEN. "Finca Es Verger", "Karting Magaluf", "Port
 * d'Andratx" heissen ueberall so; sie zu uebersetzen waere falsch, nicht
 * gruendlich. Auch die Namen der Gaeste bleiben.
 */

/** Reihenfolge wie in _seed.mjs — die Uhrzeit ist der Schluessel. */
const SCHEDULE_TIMES = ["14:00", "19:00", "10:00", "16:30", "20:00"];

/** Betraege wie in _seed.mjs — der Betrag ist der Schluessel. */
const EXPENSE_AMOUNTS = [1280, 640, 320, 410, 540, 180];

const RAW = {
  de: {
    name: "Max' JGA Mallorca",
    description: "Das legendäre Wochenende für Max — Sonne, Boot und Beachclub.",
    schedule: [
      "Anreise & Check-in Finca",
      "Welcome-BBQ an der Finca",
      "Bootstour & Schnorcheln",
      "Karting Grand Prix",
      "Dinner & Beachclub",
    ],
    expenses: [
      "Finca / Airbnb (2 Nächte)",
      "Bootstour mit Skipper",
      "Karting Grand Prix",
      "Dinner am Hafen",
      "Beachclub Bottle Service",
      "Flughafen-Transfer (Van)",
    ],
  },
  en: {
    name: "Max's Stag Do Mallorca",
    description: "The big weekend for Max — sun, boat and beach club.",
    schedule: [
      "Arrival & check-in at the finca",
      "Welcome BBQ at the finca",
      "Boat trip & snorkelling",
      "Karting Grand Prix",
      "Dinner & beach club",
    ],
    expenses: [
      "Finca / Airbnb (2 nights)",
      "Boat trip with skipper",
      "Karting Grand Prix",
      "Dinner at the harbour",
      "Beach club bottle service",
      "Airport transfer (van)",
    ],
  },
  es: {
    name: "Despedida de soltero de Max — Mallorca",
    description: "El fin de semana grande para Max: sol, barco y beach club.",
    schedule: [
      "Llegada y check-in en la finca",
      "Barbacoa de bienvenida en la finca",
      "Paseo en barco y snorkel",
      "Gran Premio de karting",
      "Cena y beach club",
    ],
    expenses: [
      "Finca / Airbnb (2 noches)",
      "Paseo en barco con patrón",
      "Gran Premio de karting",
      "Cena en el puerto",
      "Servicio de botellas en el beach club",
      "Traslado al aeropuerto (furgoneta)",
    ],
  },
  fr: {
    name: "EVG de Max à Majorque",
    description: "Le grand week-end pour Max — soleil, bateau et beach club.",
    schedule: [
      "Arrivée et check-in à la finca",
      "Barbecue de bienvenue à la finca",
      "Sortie en bateau et snorkeling",
      "Grand Prix de karting",
      "Dîner et beach club",
    ],
    expenses: [
      "Finca / Airbnb (2 nuits)",
      "Sortie en bateau avec skipper",
      "Grand Prix de karting",
      "Dîner au port",
      "Service bouteilles au beach club",
      "Transfert aéroport (van)",
    ],
  },
  it: {
    name: "Addio al celibato di Max — Maiorca",
    description: "Il weekend per Max — sole, barca e beach club.",
    schedule: [
      "Arrivo e check-in alla finca",
      "Barbecue di benvenuto alla finca",
      "Gita in barca e snorkeling",
      "Gran Premio di karting",
      "Cena e beach club",
    ],
    expenses: [
      "Finca / Airbnb (2 notti)",
      "Gita in barca con skipper",
      "Gran Premio di karting",
      "Cena al porto",
      "Bottle service al beach club",
      "Transfer aeroporto (van)",
    ],
  },
  pt: {
    name: "Despedida de solteiro do Max — Maiorca",
    description: "O fim de semana para o Max — sol, barco e beach club.",
    schedule: [
      "Chegada e check-in na finca",
      "Churrasco de boas-vindas na finca",
      "Passeio de barco e snorkeling",
      "Grande Prémio de karting",
      "Jantar e beach club",
    ],
    expenses: [
      "Finca / Airbnb (2 noites)",
      "Passeio de barco com skipper",
      "Grande Prémio de karting",
      "Jantar no porto",
      "Serviço de garrafas no beach club",
      "Transfer do aeroporto (van)",
    ],
  },
  nl: {
    name: "Max' vrijgezellenfeest Mallorca",
    description: "Het weekend voor Max — zon, boot en beachclub.",
    schedule: [
      "Aankomst & check-in finca",
      "Welkomst-BBQ bij de finca",
      "Boottocht & snorkelen",
      "Karting Grand Prix",
      "Diner & beachclub",
    ],
    expenses: [
      "Finca / Airbnb (2 nachten)",
      "Boottocht met schipper",
      "Karting Grand Prix",
      "Diner aan de haven",
      "Bottle service beachclub",
      "Luchthaventransfer (busje)",
    ],
  },
  pl: {
    name: "Wieczór kawalerski Maxa — Majorka",
    description: "Weekend dla Maxa — słońce, łódź i beach club.",
    schedule: [
      "Przyjazd i zameldowanie w fince",
      "Powitalny grill przy fince",
      "Rejs łodzią i snorkeling",
      "Grand Prix gokartów",
      "Kolacja i beach club",
    ],
    expenses: [
      "Finca / Airbnb (2 noce)",
      "Rejs ze sternikiem",
      "Grand Prix gokartów",
      "Kolacja w porcie",
      "Bottle service w beach clubie",
      "Transfer z lotniska (van)",
    ],
  },
  tr: {
    name: "Max'in bekarlığa veda partisi — Mayorka",
    description: "Max için o hafta sonu — güneş, tekne ve beach club.",
    schedule: [
      "Varış ve fincaya giriş",
      "Fincada karşılama barbeküsü",
      "Tekne turu ve şnorkel",
      "Karting Grand Prix",
      "Akşam yemeği ve beach club",
    ],
    expenses: [
      "Finca / Airbnb (2 gece)",
      "Kaptanlı tekne turu",
      "Karting Grand Prix",
      "Limanda akşam yemeği",
      "Beach club şişe servisi",
      "Havalimanı transferi (minibüs)",
    ],
  },
  ar: {
    name: "حفل وداع عزوبية ماكس — مايوركا",
    description: "عطلة نهاية الأسبوع لماكس — شمس وقارب ونادٍ شاطئي.",
    schedule: [
      "الوصول وتسجيل الدخول في الفينكا",
      "حفل شواء الترحيب في الفينكا",
      "جولة بحرية وغطس بالأنبوب",
      "سباق الكارتينغ",
      "العشاء والنادي الشاطئي",
    ],
    expenses: [
      "فينكا / إير بي إن بي (ليلتان)",
      "جولة بحرية مع ربان",
      "سباق الكارتينغ",
      "عشاء في الميناء",
      "خدمة الزجاجات في النادي الشاطئي",
      "نقل من المطار (فان)",
    ],
  },
};

export const DEMO_LANGS = Object.keys(RAW);

/**
 * Die Inhalte einer Sprache, fertig nach Uhrzeit und Betrag geschluesselt.
 *
 * Wirft bei unbekannter Sprache, statt still Deutsch zu liefern: ein
 * Aufnahmelauf, der unbemerkt deutsche Bilder in den englischen Ordner legt,
 * ist genau der Fehler, den dieses Modul beheben soll.
 */
export function demoContent(lang) {
  const raw = RAW[lang];
  if (!raw) throw new Error(`Keine Demo-Inhalte fuer "${lang}" — bekannt: ${DEMO_LANGS.join(", ")}`);
  if (raw.schedule.length !== SCHEDULE_TIMES.length) {
    throw new Error(`${lang}: ${raw.schedule.length} Programmpunkte, erwartet ${SCHEDULE_TIMES.length}`);
  }
  if (raw.expenses.length !== EXPENSE_AMOUNTS.length) {
    throw new Error(`${lang}: ${raw.expenses.length} Ausgaben, erwartet ${EXPENSE_AMOUNTS.length}`);
  }
  return {
    lang,
    name: raw.name,
    description: raw.description,
    schedule: Object.fromEntries(SCHEDULE_TIMES.map((time, i) => [time, raw.schedule[i]])),
    expenses: Object.fromEntries(EXPENSE_AMOUNTS.map((amount, i) => [amount, raw.expenses[i]])),
  };
}

export { SCHEDULE_TIMES, EXPENSE_AMOUNTS };
