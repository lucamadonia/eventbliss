/**
 * Resolves WHERE marketplace services may come from for an AI planning answer.
 *
 * Rule: services are only shown when we know the destination (city or
 * country). A JGA plan for Spain must never surface an agency from Freiburg.
 * If nothing can be resolved we return null and the caller shows no services.
 *
 * Kept dependency-free and small on purpose (jga-cities.ts is a 2.5k-line
 * SEO content file and must not be pulled into the dashboard bundle).
 */

export interface ServiceLocation {
  /** Spellings of the destination city to match against location_city (any of). */
  cities: string[];
  /** ISO-3166 alpha-2, matched against location_country when no city is known. */
  country?: string;
}

interface CityEntry {
  country: string;
  /** First entry = canonical name; the rest are aliases in other languages. */
  names: string[];
}

const CITIES: CityEntry[] = [
  // Germany
  { country: "DE", names: ["Berlin"] },
  { country: "DE", names: ["Hamburg"] },
  { country: "DE", names: ["München", "Munich", "Monaco di Baviera", "Múnich", "Munique", "Monachium", "Münih"] },
  { country: "DE", names: ["Köln", "Cologne", "Colonia", "Keulen", "Kolonia", "Colónia"] },
  { country: "DE", names: ["Frankfurt", "Francfort", "Francoforte", "Fráncfort"] },
  { country: "DE", names: ["Stuttgart", "Stoccarda"] },
  { country: "DE", names: ["Düsseldorf"] },
  { country: "DE", names: ["Hannover", "Hanover", "Hanovre"] },
  { country: "DE", names: ["Dresden", "Dresde", "Drezno"] },
  { country: "DE", names: ["Leipzig", "Lipsia", "Lipsk"] },
  { country: "DE", names: ["Nürnberg", "Nuremberg", "Norimberga", "Núremberg", "Norymberga"] },
  { country: "DE", names: ["Freiburg"] },
  { country: "DE", names: ["Bremen", "Brema"] },
  { country: "DE", names: ["Münster"] },
  { country: "DE", names: ["Heidelberg"] },
  { country: "DE", names: ["Mainz", "Mayence", "Magonza"] },
  { country: "DE", names: ["Mannheim"] },
  { country: "DE", names: ["Karlsruhe"] },
  { country: "DE", names: ["Dortmund"] },
  { country: "DE", names: ["Bonn"] },
  { country: "DE", names: ["Augsburg"] },
  { country: "DE", names: ["Regensburg"] },
  { country: "DE", names: ["Würzburg"] },
  { country: "DE", names: ["Rostock"] },
  { country: "DE", names: ["Kiel"] },
  { country: "DE", names: ["Konstanz"] },
  // Austria / Switzerland
  { country: "AT", names: ["Wien", "Vienna", "Vienne", "Viena", "Wenen", "Wiedeń", "Viyana"] },
  { country: "AT", names: ["Salzburg", "Salisburgo", "Salzburgo"] },
  { country: "AT", names: ["Innsbruck"] },
  { country: "AT", names: ["Graz"] },
  { country: "CH", names: ["Zürich", "Zurich", "Zurigo", "Zúrich", "Zurique", "Zurych"] },
  { country: "CH", names: ["Basel", "Bâle", "Basilea"] },
  { country: "CH", names: ["Bern", "Berne", "Berna"] },
  { country: "CH", names: ["Genf", "Genève", "Geneva", "Ginevra", "Ginebra", "Genebra", "Genewa", "Cenevre"] },
  { country: "CH", names: ["Luzern", "Lucerne", "Lucerna"] },
  // Spain
  { country: "ES", names: ["Barcelona", "Barcelone", "Barcellona", "Barselona"] },
  { country: "ES", names: ["Madrid", "Madryt"] },
  { country: "ES", names: ["Valencia", "Valence", "Valência", "Walencja"] },
  { country: "ES", names: ["Mallorca", "Majorque", "Maiorca", "Majorka", "Palma"] },
  { country: "ES", names: ["Ibiza", "Eivissa"] },
  { country: "ES", names: ["Sevilla", "Seville", "Séville", "Siviglia", "Sewilla"] },
  { country: "ES", names: ["Málaga"] },
  { country: "ES", names: ["Marbella"] },
  // Portugal
  { country: "PT", names: ["Lissabon", "Lisbon", "Lisboa", "Lisbonne", "Lisbona", "Lizbona", "Lizbon"] },
  { country: "PT", names: ["Porto", "Oporto"] },
  // Rest of Europe
  { country: "CZ", names: ["Prag", "Prague", "Praga", "Praag", "Prah"] },
  { country: "PL", names: ["Krakau", "Kraków", "Cracovie", "Cracovia"] },
  { country: "PL", names: ["Warschau", "Warsaw", "Warszawa", "Varsovie", "Varsavia", "Varsovia", "Varşova"] },
  { country: "HU", names: ["Budapest", "Budapeszt", "Budapeste", "Boedapest", "Budapeşte"] },
  { country: "NL", names: ["Amsterdam", "Amsterdão", "Ámsterdam"] },
  { country: "FR", names: ["Paris", "Parigi", "París", "Paryż"] },
  { country: "FR", names: ["Nizza", "Niza"] },
  { country: "GB", names: ["London", "Londres", "Londra", "Londyn", "Londen"] },
  { country: "GB", names: ["Edinburgh", "Édimbourg", "Edimburgo", "Edynburg"] },
  { country: "IE", names: ["Dublin", "Dublino", "Dublín"] },
  { country: "TR", names: ["Istanbul", "İstanbul", "Estambul", "Istambul", "Stambuł"] },
  { country: "IT", names: ["Rom", "Rome", "Roma", "Rzym"] },
  { country: "IT", names: ["Mailand", "Milan", "Milano", "Milán", "Milão", "Mediolan"] },
  { country: "IT", names: ["Florenz", "Florence", "Firenze", "Florencia", "Florença", "Florencja"] },
  { country: "GR", names: ["Athen", "Athens", "Athènes", "Atene", "Atenas", "Ateny", "Atina"] },
  { country: "DK", names: ["Kopenhagen", "Copenhagen", "Copenhague", "Copenaghen", "Kopenhaga", "Kopenhag"] },
  { country: "SE", names: ["Stockholm", "Stoccolma", "Estocolmo", "Sztokholm"] },
  { country: "EE", names: ["Tallinn"] },
  { country: "RO", names: ["Bukarest", "Bucharest", "Bucarest", "Bucareste", "Bukareszt", "Bükreş"] },
  { country: "BE", names: ["Brüssel", "Brussels", "Bruxelles", "Bruselas", "Bruxelas", "Brussel", "Bruksela", "Brüksel"] },
  { country: "HR", names: ["Zagreb"] },
];

const COUNTRIES: Record<string, string[]> = {
  DE: ["Deutschland", "Germany", "Allemagne", "Germania", "Alemania", "Alemanha", "Duitsland", "Niemcy", "Almanya", "ألمانيا"],
  AT: ["Österreich", "Austria", "Autriche", "Áustria", "Oostenrijk", "Avusturya", "النمسا"],
  CH: ["Schweiz", "Switzerland", "Suisse", "Svizzera", "Suiza", "Suíça", "Zwitserland", "Szwajcaria", "İsviçre", "سويسرا"],
  ES: ["Spanien", "Spain", "Espagne", "Spagna", "España", "Espanha", "Spanje", "Hiszpania", "İspanya", "إسبانيا"],
  PT: ["Portugal", "Portogallo", "Portugalia", "Portekiz", "البرتغال"],
  FR: ["Frankreich", "France", "Francia", "França", "Frankrijk", "Francja", "Fransa", "فرنسا"],
  IT: ["Italien", "Italy", "Italie", "Italia", "Itália", "Italië", "Włochy", "İtalya", "إيطاليا"],
  NL: ["Niederlande", "Holland", "Netherlands", "Pays-Bas", "Paesi Bassi", "Países Bajos", "Países Baixos", "Nederland", "Holandia", "Hollanda", "هولندا"],
  PL: ["Polen", "Poland", "Pologne", "Polonia", "Polónia", "Polska", "Polonya", "بولندا"],
  GB: ["England", "Großbritannien", "United Kingdom", "Great Britain", "Schottland", "Scotland", "Royaume-Uni", "Regno Unito", "Reino Unido", "Verenigd Koninkrijk", "Wielka Brytania", "İngiltere", "بريطانيا"],
  IE: ["Irland", "Ireland", "Irlande", "Irlanda", "Ierland", "Irlandia", "İrlanda", "أيرلندا"],
  CZ: ["Tschechien", "Czechia", "Czech Republic", "Tchéquie", "Repubblica Ceca", "Chequia", "Tsjechië", "Czechy", "Çekya", "التشيك"],
  HU: ["Ungarn", "Hungary", "Hongrie", "Ungheria", "Hungría", "Hungria", "Hongarije", "Węgry", "Macaristan", "المجر"],
  TR: ["Türkei", "Turkey", "Turquie", "Turchia", "Turquía", "Turquia", "Turkije", "Turcja", "Türkiye", "تركيا"],
  BE: ["Belgien", "Belgium", "Belgique", "Belgio", "Bélgica", "België", "Belgia", "Belçika", "بلجيكا"],
  DK: ["Dänemark", "Denmark", "Danemark", "Danimarca", "Dinamarca", "Denemarken", "Dania", "Danimarka", "الدنمارك"],
  SE: ["Schweden", "Sweden", "Suède", "Svezia", "Suecia", "Suécia", "Zweden", "Szwecja", "İsveç", "السويد"],
  GR: ["Griechenland", "Greece", "Grèce", "Grecia", "Grécia", "Griekenland", "Grecja", "Yunanistan", "اليونان"],
  RO: ["Rumänien", "Romania", "Roumanie", "Rumanía", "Roménia", "Roemenië", "Rumunia", "Romanya", "رومانيا"],
  EE: ["Estland", "Estonia", "Estonie", "Estónia", "Estonya", "إستونيا"],
  HR: ["Kroatien", "Croatia", "Croatie", "Croazia", "Croacia", "Croácia", "Kroatië", "Chorwacja", "Hırvatistan", "كرواتيا"],
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const reCache = new Map<string, RegExp>();
function wordRe(name: string, flags = "u"): RegExp {
  const key = `${flags}|${name}`;
  let re = reCache.get(key);
  if (!re) {
    re = new RegExp(`(^|[^\\p{L}])${escapeRe(normalize(name))}(?=$|[^\\p{L}])`, flags);
    reCache.set(key, re);
  }
  re.lastIndex = 0;
  return re;
}

function containsWord(haystackNorm: string, name: string): boolean {
  return wordRe(name).test(haystackNorm);
}

/** 🇪🇸 → "ES" */
function countryFromFlag(s: string): string | undefined {
  const m = s.match(/([\u{1F1E6}-\u{1F1FF}])([\u{1F1E6}-\u{1F1FF}])/u);
  if (!m) return undefined;
  const code = String.fromCharCode(
    m[1].codePointAt(0)! - 0x1f1e6 + 65,
    m[2].codePointAt(0)! - 0x1f1e6 + 65,
  );
  return code in COUNTRIES ? code : undefined;
}

function findCountry(textNorm: string): string | undefined {
  for (const [code, names] of Object.entries(COUNTRIES)) {
    if (names.some((n) => containsWord(textNorm, n))) return code;
  }
  return undefined;
}

/** Most-mentioned known city in free text, optionally restricted to a country. */
function dominantCity(textNorm: string, country?: string): CityEntry | undefined {
  let best: { entry: CityEntry; hits: number } | undefined;
  for (const entry of CITIES) {
    if (country && entry.country !== country) continue;
    const hits = entry.names.reduce((acc, n) => acc + (textNorm.match(wordRe(n, "gu"))?.length ?? 0), 0);
    if (hits > 0 && (!best || hits > best.hits)) best = { entry, hits };
  }
  return best?.entry;
}

const toLocation = (entry: CityEntry): ServiceLocation => ({ cities: entry.names, country: entry.country });

const NO_PREFERENCE = /^(either|egal|any|anywhere|no preference|keine praferenz|flexibel)\b/;

/**
 * @param destination survey destination (raw slug or resolved label, e.g.
 *   "barcelona", "Barcelona 🇪🇸", "de_city", "Großstadt in Deutschland", "Spanien")
 * @param responseText AI answer — used only to narrow a known country to a
 *   city, or as last resort when the destination is "no preference"/empty.
 */
export function resolveServiceLocation(
  destination: string | null | undefined,
  responseText = "",
): ServiceLocation | null {
  const responseNorm = normalize(responseText);
  const raw = (destination ?? "").trim();
  const isDeCitySlug = /^de_city$/i.test(raw);
  const dest = raw.replace(/^(?:de|en|es|fr|it|nl|pl|pt|tr|ar)_/i, "").replace(/_+/g, " ").trim();
  const destNorm = normalize(dest);
  const destPlain = destNorm.replace(/[^\p{L}\s-]/gu, "").trim();

  const narrowToCountry = (country: string): ServiceLocation => {
    const city = dominantCity(responseNorm, country);
    return city ? toLocation(city) : { cities: [], country };
  };

  if (isDeCitySlug) return narrowToCountry("DE");

  if (destPlain && !NO_PREFERENCE.test(destPlain) && destPlain !== "city") {
    const city = CITIES.find((c) => c.names.some((n) => containsWord(destNorm, n)));
    if (city) return toLocation(city);

    const country = countryFromFlag(dest) ?? findCountry(destNorm);
    if (country) return narrowToCountry(country);

    // Unknown custom destination (e.g. a small town): match it literally.
    const literal = sanitizeIlikeValue(dest);
    return literal.length >= 3 ? { cities: [literal] } : null;
  }

  // No preference / no survey data: trust only a clearly named city in the answer.
  const fromText = dominantCity(responseNorm);
  return fromText ? toLocation(fromText) : null;
}

/** Defensive client-side check that a fetched service really is at the destination. */
export function serviceMatchesLocation(
  loc: ServiceLocation,
  service: { city?: string | null; country?: string | null },
): boolean {
  if (loc.cities.length > 0) {
    const cityNorm = normalize(service.city ?? "");
    if (!cityNorm) return false;
    return loc.cities.some((c) => cityNorm === normalize(c) || containsWord(cityNorm, c));
  }
  if (loc.country) return (service.country ?? "").toUpperCase() === loc.country;
  return false;
}

/** Safe value for PostgREST `or=(…ilike…)` filters (no commas, parens, wildcards). */
export function sanitizeIlikeValue(s: string): string {
  return s.replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, " ").trim();
}
