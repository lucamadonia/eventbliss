/**
 * Localized display names for the 41 JGA cities and their countries.
 *
 * The city data in `jga-cities.ts` stores only German strings (`name`,
 * `countryName`). This module provides per-language display names so the
 * calculator dropdown, the footer city cluster and any other city list render
 * in the page language instead of always German.
 *
 * Model (see helpers below): German pages use the source `name`; every other
 * language uses an explicit exonym when we have one, otherwise the international
 * (English) name — so a non-German page NEVER shows a German-only spelling
 * ("München", "Köln", "Wien"). Arabic names are provided for all 41 cities.
 */

import { toSeoLang, type SeoLang } from "./seo-routes";

/**
 * City display names keyed by German slug. Per language, list a form ONLY when
 * it differs from the international (`en`) name; the `en` key itself is set only
 * when the English name differs from the German source name. Resolution:
 *   de → source name;  other → [lang] ?? en ?? source name.
 */
export const CITY_NAME_I18N: Record<
  string,
  Partial<Record<SeoLang, string>>
> = {
  berlin:      { ar: "برلين" },
  hamburg:     { es: "Hamburgo", it: "Amburgo", pt: "Hamburgo", ar: "هامبورغ" },
  muenchen:    { en: "Munich", es: "Múnich", it: "Monaco di Baviera", pt: "Munique", nl: "München", pl: "Monachium", tr: "Münih", ar: "ميونخ" },
  koeln:       { en: "Cologne", es: "Colonia", fr: "Cologne", it: "Colonia", pt: "Colónia", nl: "Keulen", pl: "Kolonia", tr: "Köln", ar: "كولونيا" },
  frankfurt:   { ar: "فرانكفورت" },
  stuttgart:   { ar: "شتوتغارت" },
  duesseldorf: { en: "Dusseldorf", nl: "Düsseldorf", ar: "دوسلدورف" },
  wien:        { en: "Vienna", es: "Viena", fr: "Vienne", it: "Vienna", pt: "Viena", nl: "Wenen", pl: "Wiedeń", tr: "Viyana", ar: "فيينا" },
  zuerich:     { en: "Zurich", es: "Zúrich", fr: "Zurich", it: "Zurigo", pt: "Zurique", nl: "Zürich", pl: "Zurych", tr: "Zürih", ar: "زيورخ" },
  hannover:    { en: "Hanover", ar: "هانوفر" },
  mallorca:    { ar: "مايوركا" },
  prag:        { en: "Prague", es: "Praga", fr: "Prague", it: "Praga", pt: "Praga", nl: "Praag", pl: "Praga", tr: "Prag", ar: "براغ" },
  krakau:      { en: "Krakow", es: "Cracovia", fr: "Cracovie", it: "Cracovia", pt: "Cracóvia", nl: "Krakau", pl: "Kraków", tr: "Krakov", ar: "كراكوف" },
  budapest:    { ar: "بودابست" },
  amsterdam:   { ar: "أمستردام" },
  barcelona:   { ar: "برشلونة" },
  paris:       { es: "París", it: "Parigi", pl: "Paryż", ar: "باريس" },
  london:      { es: "Londres", fr: "Londres", it: "Londra", pt: "Londres", pl: "Londyn", tr: "Londra", ar: "لندن" },
  lissabon:    { en: "Lisbon", es: "Lisboa", fr: "Lisbonne", it: "Lisbona", pt: "Lisboa", nl: "Lissabon", pl: "Lizbona", tr: "Lizbon", ar: "لشبونة" },
  istanbul:    { tr: "İstanbul", ar: "إسطنبول" },
  dresden:     { es: "Dresde", fr: "Dresde", ar: "درسدن" },
  leipzig:     { ar: "لايبزيغ" },
  nuernberg:   { en: "Nuremberg", es: "Núremberg", fr: "Nuremberg", it: "Norimberga", pt: "Nuremberga", nl: "Neurenberg", pl: "Norymberga", tr: "Nürnberg", ar: "نورمبرغ" },
  salzburg:    { ar: "زالتسبورغ" },
  madrid:      { ar: "مدريد" },
  valencia:    { it: "Valencia", ar: "فالنسيا" },
  ibiza:       { ar: "إيبيزا" },
  rom:         { en: "Rome", es: "Roma", fr: "Rome", it: "Roma", pt: "Roma", nl: "Rome", pl: "Rzym", tr: "Roma", ar: "روما" },
  mailand:     { en: "Milan", es: "Milán", fr: "Milan", it: "Milano", pt: "Milão", nl: "Milaan", pl: "Mediolan", tr: "Milano", ar: "ميلانو" },
  florenz:     { en: "Florence", es: "Florencia", fr: "Florence", it: "Firenze", pt: "Florença", nl: "Florence", pl: "Florencja", tr: "Floransa", ar: "فلورنسا" },
  dublin:      { es: "Dublín", it: "Dublino", ar: "دبلن" },
  edinburgh:   { es: "Edimburgo", fr: "Édimbourg", it: "Edimburgo", pt: "Edimburgo", pl: "Edynburg", ar: "إدنبرة" },
  porto:       { en: "Porto", fr: "Porto", ar: "بورتو" },
  warschau:    { en: "Warsaw", es: "Varsovia", fr: "Varsovie", it: "Varsavia", pt: "Varsóvia", nl: "Warschau", pl: "Warszawa", tr: "Varşova", ar: "وارسو" },
  athen:       { en: "Athens", es: "Atenas", fr: "Athènes", it: "Atene", pt: "Atenas", nl: "Athene", pl: "Ateny", tr: "Atina", ar: "أثينا" },
  kopenhagen:  { en: "Copenhagen", es: "Copenhague", fr: "Copenhague", it: "Copenaghen", pt: "Copenhaga", nl: "Kopenhagen", pl: "Kopenhaga", tr: "Kopenhag", ar: "كوبنهاغن" },
  stockholm:   { es: "Estocolmo", it: "Stoccolma", pt: "Estocolmo", pl: "Sztokholm", ar: "ستوكهولم" },
  tallinn:     { ar: "تالين" },
  bukarest:    { en: "Bucharest", es: "Bucarest", fr: "Bucarest", it: "Bucarest", pt: "Bucareste", nl: "Boekarest", pl: "Bukareszt", tr: "Bükreş", ar: "بوخارست" },
  bruessel:    { en: "Brussels", es: "Bruselas", fr: "Bruxelles", it: "Bruxelles", pt: "Bruxelas", nl: "Brussel", pl: "Bruksela", tr: "Brüksel", ar: "بروكسل" },
  nizza:       { en: "Nice", es: "Niza", fr: "Nice", it: "Nizza", pt: "Nice", nl: "Nice", pl: "Nicea", tr: "Nice", ar: "نيس" },
};

/** Country display names keyed by ISO code (see `CountryCode` in jga-cities.ts). */
export const COUNTRY_NAME_I18N: Record<
  string,
  Record<SeoLang, string>
> = {
  DE: { de: "Deutschland", en: "Germany", es: "Alemania", fr: "Allemagne", it: "Germania", pt: "Alemanha", nl: "Duitsland", pl: "Niemcy", tr: "Almanya", ar: "ألمانيا" },
  AT: { de: "Österreich", en: "Austria", es: "Austria", fr: "Autriche", it: "Austria", pt: "Áustria", nl: "Oostenrijk", pl: "Austria", tr: "Avusturya", ar: "النمسا" },
  CH: { de: "Schweiz", en: "Switzerland", es: "Suiza", fr: "Suisse", it: "Svizzera", pt: "Suíça", nl: "Zwitserland", pl: "Szwajcaria", tr: "İsviçre", ar: "سويسرا" },
  ES: { de: "Spanien", en: "Spain", es: "España", fr: "Espagne", it: "Spagna", pt: "Espanha", nl: "Spanje", pl: "Hiszpania", tr: "İspanya", ar: "إسبانيا" },
  CZ: { de: "Tschechien", en: "Czechia", es: "Chequia", fr: "Tchéquie", it: "Repubblica Ceca", pt: "Chéquia", nl: "Tsjechië", pl: "Czechy", tr: "Çekya", ar: "التشيك" },
  PL: { de: "Polen", en: "Poland", es: "Polonia", fr: "Pologne", it: "Polonia", pt: "Polónia", nl: "Polen", pl: "Polska", tr: "Polonya", ar: "بولندا" },
  HU: { de: "Ungarn", en: "Hungary", es: "Hungría", fr: "Hongrie", it: "Ungheria", pt: "Hungria", nl: "Hongarije", pl: "Węgry", tr: "Macaristan", ar: "المجر" },
  NL: { de: "Niederlande", en: "Netherlands", es: "Países Bajos", fr: "Pays-Bas", it: "Paesi Bassi", pt: "Países Baixos", nl: "Nederland", pl: "Holandia", tr: "Hollanda", ar: "هولندا" },
  FR: { de: "Frankreich", en: "France", es: "Francia", fr: "France", it: "Francia", pt: "França", nl: "Frankrijk", pl: "Francja", tr: "Fransa", ar: "فرنسا" },
  GB: { de: "Vereinigtes Königreich", en: "United Kingdom", es: "Reino Unido", fr: "Royaume-Uni", it: "Regno Unito", pt: "Reino Unido", nl: "Verenigd Koninkrijk", pl: "Wielka Brytania", tr: "Birleşik Krallık", ar: "المملكة المتحدة" },
  PT: { de: "Portugal", en: "Portugal", es: "Portugal", fr: "Portugal", it: "Portogallo", pt: "Portugal", nl: "Portugal", pl: "Portugalia", tr: "Portekiz", ar: "البرتغال" },
  TR: { de: "Türkei", en: "Turkey", es: "Turquía", fr: "Turquie", it: "Turchia", pt: "Turquia", nl: "Turkije", pl: "Turcja", tr: "Türkiye", ar: "تركيا" },
  IT: { de: "Italien", en: "Italy", es: "Italia", fr: "Italie", it: "Italia", pt: "Itália", nl: "Italië", pl: "Włochy", tr: "İtalya", ar: "إيطاليا" },
  IE: { de: "Irland", en: "Ireland", es: "Irlanda", fr: "Irlande", it: "Irlanda", pt: "Irlanda", nl: "Ierland", pl: "Irlandia", tr: "İrlanda", ar: "أيرلندا" },
  GR: { de: "Griechenland", en: "Greece", es: "Grecia", fr: "Grèce", it: "Grecia", pt: "Grécia", nl: "Griekenland", pl: "Grecja", tr: "Yunanistan", ar: "اليونان" },
  DK: { de: "Dänemark", en: "Denmark", es: "Dinamarca", fr: "Danemark", it: "Danimarca", pt: "Dinamarca", nl: "Denemarken", pl: "Dania", tr: "Danimarka", ar: "الدنمارك" },
  SE: { de: "Schweden", en: "Sweden", es: "Suecia", fr: "Suède", it: "Svezia", pt: "Suécia", nl: "Zweden", pl: "Szwecja", tr: "İsveç", ar: "السويد" },
  EE: { de: "Estland", en: "Estonia", es: "Estonia", fr: "Estonie", it: "Estonia", pt: "Estónia", nl: "Estland", pl: "Estonia", tr: "Estonya", ar: "إستونيا" },
  RO: { de: "Rumänien", en: "Romania", es: "Rumanía", fr: "Roumanie", it: "Romania", pt: "Roménia", nl: "Roemenië", pl: "Rumunia", tr: "Romanya", ar: "رومانيا" },
  BE: { de: "Belgien", en: "Belgium", es: "Bélgica", fr: "Belgique", it: "Belgio", pt: "Bélgica", nl: "België", pl: "Belgia", tr: "Belçika", ar: "بلجيكا" },
};

/** Localized display name for a city. Falls back to en → German source name. */
export function localizedCityName(
  city: { slug: string; name: string },
  code: string,
): string {
  const lang = toSeoLang(code);
  if (!lang || lang === "de") return city.name;
  const o = CITY_NAME_I18N[city.slug];
  return o?.[lang] ?? o?.en ?? city.name;
}

/** Localized country name for an ISO code. Falls back to en → the code itself. */
export function localizedCountryName(countryCode: string, code: string): string {
  const lang = toSeoLang(code) ?? "en";
  const o = COUNTRY_NAME_I18N[countryCode];
  return o?.[lang] ?? o?.en ?? countryCode;
}
