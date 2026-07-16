/**
 * Budget-Kalkulator — multilingual stand-alone tool für SEO/GEO Top-of-Funnel.
 *
 * 9 Sprachen via URL-Detection. Modern UI, lokalisierte Labels, JSON-LD und
 * FAQ pro Sprache. Cross-Linking zu allen anderen Sprach-Versionen via
 * sichtbarem Switcher + hreflang.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wallet,
  Users,
  Calendar,
  Hotel,
  Beer,
  Activity,
  Plane,
  MapPin,
  ArrowRight,
  Calculator,
  Sparkles,
  Info,
  Globe,
} from "lucide-react";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { AuroraText } from "@/components/ui/AuroraText";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { useSEO } from "@/hooks/useSEO";
import { JGA_CITIES } from "@/lib/jga-cities";
import { localizedCityName, localizedCountryName } from "@/lib/city-names-i18n";

const SITE_URL = "https://event-bliss.com";

type CalcLang = "de" | "en" | "es" | "fr" | "it" | "pt" | "nl" | "pl" | "tr" | "ar";

const ROUTE_BY_LANG: Record<CalcLang, string> = {
  de: "/jga/kalkulator",
  en: "/stag-do/calculator",
  es: "/despedida/calculadora",
  fr: "/evg/calculatrice",
  it: "/addio/calcolatore",
  pt: "/despedida-de-solteiro/calculadora",
  nl: "/vrijgezellenfeest/calculator",
  pl: "/wieczor-kawalerski/kalkulator",
  tr: "/bekarliga-veda/hesaplayici",
  ar: "/wadaa-azubiya/hasiba",
};

const LOCALE_BY_LANG: Record<CalcLang, string> = {
  de: "de_DE", en: "en_GB", es: "es_ES", fr: "fr_FR", it: "it_IT",
  pt: "pt_PT", nl: "nl_NL", pl: "pl_PL", tr: "tr_TR", ar: "ar_AR",
};
const HTML_LANG_BY_LANG: Record<CalcLang, string> = {
  de: "de-DE", en: "en-GB", es: "es-ES", fr: "fr-FR", it: "it-IT",
  pt: "pt-PT", nl: "nl-NL", pl: "pl-PL", tr: "tr-TR", ar: "ar",
};
const INTL_LOCALE_FORMAT: Record<CalcLang, string> = {
  de: "de-DE", en: "en-GB", es: "es-ES", fr: "fr-FR", it: "it-IT",
  pt: "pt-PT", nl: "nl-NL", pl: "pl-PL", tr: "tr-TR", ar: "ar",
};

// ──────────────────────────────────────────────────────────────────
// COPY per language — every label localized
// ──────────────────────────────────────────────────────────────────

interface CalcCopy {
  badge: string;
  h1Prefix: string;
  h1Highlight: string;
  intro: string;
  inputsTitle: string;
  inputs: {
    city: string;
    people: string;
    nights: string;
    activities: string;
    partyNights: string;
    hotel: string;
    travel: string;
    travelHintAbroad: string;
    travelHintDomestic: string;
  };
  hotelOptions: { hostel: string; airbnb: string; midrange: string; premium: string };
  cityGroups: { dach: string; intl: string };
  resultPrefix: string;
  perPerson: string;
  total: string;
  rows: { travel: string; hotel: string; activities: string; party: string; food: string };
  ctas: { createEvent: string; viewCityGuide: string };
  disclaimer: string;
  infoHeading: string;
  infoBody: string;
  faqHead: string;
  faqs: Array<{ q: string; a: string }>;
  finalH2Prefix: string;
  finalH2Highlight: string;
  finalText: string;
  finalCta: string;
  title: string;
  description: string;
  keywords: string;
  jsonLdName: string;
  jsonLdDescription: string;
}

const COPY: Record<CalcLang, CalcCopy> = {
  de: {
    badge: "Kostenloses Tool · Keine Anmeldung",
    h1Prefix: "JGA-",
    h1Highlight: "Budget-Rechner",
    intro: "Was kostet euer Junggesellenabschied wirklich? Stadt wählen, Crew-Größe eingeben, Programm anhaken — Kosten pro Person sofort kalkuliert. Mit Daten aus 41 europäischen JGA-Städten.",
    inputsTitle: "Deine JGA-Eckdaten",
    inputs: {
      city: "Stadt / Destination",
      people: "Personen",
      nights: "Übernachtungen",
      activities: "Aktivitäten",
      partyNights: "Party-Abende",
      hotel: "Unterkunft",
      travel: "Anreise mit einkalkulieren",
      travelHintAbroad: "Auslandsflug-Schätzung",
      travelHintDomestic: "Bahn / Auto-Kostenanteil",
    },
    hotelOptions: {
      hostel: "Hostel / Mehrbettzimmer",
      airbnb: "AirBnB / Wohnung (Gruppe)",
      midrange: "Mittelklasse-Hotel",
      premium: "Premium / 4–5 Sterne",
    },
    cityGroups: { dach: "DACH", intl: "International" },
    resultPrefix: "JGA für",
    perPerson: "pro Person",
    total: "Gesamtbudget",
    rows: { travel: "Anreise", hotel: "Unterkunft", activities: "Aktivitäten", party: "Party-Abende", food: "Verpflegung" },
    ctas: { createEvent: "Event jetzt anlegen", viewCityGuide: "Stadt-Guide ansehen" },
    disclaimer: "Schätzwerte basierend auf Mittelwerten — euer reales Budget kann je nach Saison, Wochentag und Stil 20–30 % abweichen.",
    infoHeading: "So rechnet der Kalkulator",
    infoBody: "Werte basieren auf realen Preis-Ranges aus den EventBliss-Stadt-Guides. Hotel-Preise sind pro Person pro Nacht, Aktivitäten als Mittelwert der Stadt-Optionen, Party-Abende inklusive Eintritte und 4–6 Drinks. F&B 35 € pro Person und Tag.",
    faqHead: "Häufige Fragen zum JGA-Budget",
    faqs: [
      { q: "Was kostet ein Junggesellenabschied pro Person im Schnitt?", a: "Ein Wochenende-JGA kostet zwischen 230 € (günstige Stadt) und 1000 € (Premium-Destinationen). Für eine typische DACH-Großstadt liegt der Mittelwert bei 350–550 € pro Person." },
      { q: "Welche JGA-Stadt ist am günstigsten in Europa?", a: "Bukarest, Tallinn, Krakau und Warschau ab 180 € pro Person für 3 Nächte inkl. Flug. In Deutschland: Leipzig, Dresden, Hannover ab 220 €." },
      { q: "Wieviel Vorlauf brauche ich für die Budget-Planung?", a: "Hochsaison (Mai–September) 8–12 Wochen, Volksfest-Termine (Wiesn, Schützenfest, Karneval) 6–9 Monate." },
      { q: "Wie spalten wir die Kosten fair zwischen allen?", a: "EventBliss splittet automatisch alle Ausgaben gerecht zwischen allen Teilnehmern. Kein 'Wer schuldet wem was'-Chaos." },
      { q: "Hotel oder AirBnB für eine JGA-Crew?", a: "Ab 6 Personen ist AirBnB fast immer wirtschaftlicher: eigene Pre-Party-Location, keine Sperrstunde, halber Hotel-Preis." },
    ],
    finalH2Prefix: "Plant euren ",
    finalH2Highlight: "JGA",
    finalText: "Budget ist nur der erste Schritt. EventBliss organisiert eure Crew, splittet automatisch alle Kosten und liefert 24+ Spiele.",
    finalCta: "Event kostenlos erstellen",
    title: "JGA-Budget-Rechner — Kosten pro Person berechnen | EventBliss",
    description: "Wie viel kostet ein JGA wirklich? Kostenloser Rechner für 41 europäische Städte. Personen, Hotel, Aktivitäten — Kosten pro Person sofort berechnet.",
    keywords: "JGA Budget Rechner, Junggesellenabschied Kosten, JGA Kostenrechner",
    jsonLdName: "JGA-Budget-Rechner",
    jsonLdDescription: "Kostenloser Rechner für Junggesellenabschied-Budget. Stadt, Personen, Programm wählen — Kosten pro Person und insgesamt.",
  },
  en: {
    badge: "Free tool · No sign-up",
    h1Prefix: "Stag Do ",
    h1Highlight: "Budget Calculator",
    intro: "What does your stag do really cost? Pick a city, set crew size, check the programme — per-person cost calculated instantly. Powered by data from 41 European stag-do cities.",
    inputsTitle: "Your stag basics",
    inputs: {
      city: "City / Destination",
      people: "People",
      nights: "Nights",
      activities: "Activities",
      partyNights: "Party nights",
      hotel: "Accommodation",
      travel: "Include travel cost",
      travelHintAbroad: "International flight estimate",
      travelHintDomestic: "Train / car cost share",
    },
    hotelOptions: {
      hostel: "Hostel / dorm",
      airbnb: "AirBnB / apartment (group)",
      midrange: "Mid-range hotel",
      premium: "Premium / 4–5 stars",
    },
    cityGroups: { dach: "DACH (Germany, Austria, Switzerland)", intl: "International" },
    resultPrefix: "Stag do in",
    perPerson: "per person",
    total: "Total budget",
    rows: { travel: "Travel", hotel: "Accommodation", activities: "Activities", party: "Party nights", food: "Food & drink" },
    ctas: { createEvent: "Create event now", viewCityGuide: "View city guide" },
    disclaimer: "Estimates based on averages — your real budget can vary 20–30% depending on season, weekday and style.",
    infoHeading: "How the calculator works",
    infoBody: "Values based on real price ranges from EventBliss city guides. Hotel prices per person per night, activities at average city option price, party nights including entries and 4–6 drinks. Food & drink €35 per person per day.",
    faqHead: "FAQ — stag budget",
    faqs: [
      { q: "What does a stag do cost per person on average?", a: "A weekend stag costs between €230 (cheap city) and €1000 (premium destinations). DACH average lands at €350–550 per head." },
      { q: "Which European stag city is cheapest?", a: "Bucharest, Tallinn, Krakow and Warsaw from €180 per person for 3 nights including flight." },
      { q: "How much lead time for budget planning?", a: "Peak season (May–September) 8–12 weeks, festival dates (Oktoberfest, Karneval) 6–9 months." },
      { q: "How do we split costs fairly?", a: "EventBliss automatically splits all expenses fairly across all participants. No 'who owes who' chaos." },
      { q: "Hotel or AirBnB for a stag crew?", a: "From 6+ people, AirBnB almost always wins: own pre-party location, no curfew, half the hotel price." },
    ],
    finalH2Prefix: "Plan your ",
    finalH2Highlight: "stag",
    finalText: "Budget is just the first step. EventBliss organises your crew, splits costs automatically and packs 24+ party games.",
    finalCta: "Create event free",
    title: "Stag Do Budget Calculator — Cost Per Person | EventBliss",
    description: "What does a stag do really cost? Free calculator for 41 European cities. People, hotel tier, activities — per-person cost calculated instantly.",
    keywords: "stag do budget calculator, stag party cost calculator, bachelor party budget tool",
    jsonLdName: "Stag Do Budget Calculator",
    jsonLdDescription: "Free calculator for stag-do budget. Pick city, people, programme — per-person and total cost instantly.",
  },
  es: {
    badge: "Herramienta gratuita · Sin registro",
    h1Prefix: "Calculadora de ",
    h1Highlight: "Despedida",
    intro: "¿Cuánto cuesta tu despedida de soltero realmente? Elige ciudad, número de personas, programa — coste por persona calculado al instante. Con datos de 41 ciudades europeas.",
    inputsTitle: "Datos de tu despedida",
    inputs: {
      city: "Ciudad / Destino",
      people: "Personas",
      nights: "Noches",
      activities: "Actividades",
      partyNights: "Noches de fiesta",
      hotel: "Alojamiento",
      travel: "Incluir coste de viaje",
      travelHintAbroad: "Estimación vuelo internacional",
      travelHintDomestic: "Coste compartido de tren/coche",
    },
    hotelOptions: {
      hostel: "Hostal / dormitorio",
      airbnb: "AirBnB / piso (grupo)",
      midrange: "Hotel medio",
      premium: "Premium / 4–5 estrellas",
    },
    cityGroups: { dach: "DACH", intl: "Internacional" },
    resultPrefix: "Despedida en",
    perPerson: "por persona",
    total: "Presupuesto total",
    rows: { travel: "Viaje", hotel: "Alojamiento", activities: "Actividades", party: "Noches de fiesta", food: "Comida y bebida" },
    ctas: { createEvent: "Crear evento ya", viewCityGuide: "Ver guía de ciudad" },
    disclaimer: "Estimaciones basadas en promedios — tu presupuesto real puede variar 20–30 % según temporada, día y estilo.",
    infoHeading: "Cómo funciona la calculadora",
    infoBody: "Valores basados en rangos reales de las guías EventBliss. Hotel por persona y noche, actividades como promedio, noches de fiesta con entradas y 4–6 copas. Comida 35 € por persona y día.",
    faqHead: "Preguntas frecuentes — presupuesto despedida",
    faqs: [
      { q: "¿Cuánto cuesta una despedida por persona en promedio?", a: "Un fin de semana cuesta entre 230 € (ciudad barata) y 1000 € (premium). Media DACH: 350–550 € por persona." },
      { q: "¿Qué ciudad europea de despedida es la más barata?", a: "Bucarest, Tallin, Cracovia y Varsovia desde 180 € por persona, 3 noches con vuelo." },
      { q: "¿Cuánta antelación para planificar el presupuesto?", a: "Temporada alta (mayo–septiembre) 8–12 semanas, fechas de festival 6–9 meses." },
      { q: "¿Cómo dividimos los costes de forma justa?", a: "EventBliss divide automáticamente todos los gastos entre todos los participantes. Sin caos de '¿quién debe qué?'" },
      { q: "¿Hotel o AirBnB para un grupo de despedida?", a: "Desde 6 personas, AirBnB casi siempre gana: pre-party propio, sin horario, mitad del precio del hotel." },
    ],
    finalH2Prefix: "Planifica tu ",
    finalH2Highlight: "despedida",
    finalText: "El presupuesto es solo el primer paso. EventBliss organiza tu grupo, divide costes automáticamente y trae 24+ juegos de fiesta.",
    finalCta: "Crear evento gratis",
    title: "Calculadora de Despedida de Soltero — Coste por Persona | EventBliss",
    description: "¿Cuánto cuesta una despedida realmente? Calculadora gratuita para 41 ciudades europeas. Personas, hotel, actividades — coste por persona al instante.",
    keywords: "calculadora despedida soltero, coste despedida, presupuesto despedida soltero",
    jsonLdName: "Calculadora de Despedida de Soltero",
    jsonLdDescription: "Calculadora gratuita para presupuesto de despedida. Ciudad, personas, programa — coste por persona y total instantáneamente.",
  },
  fr: {
    badge: "Outil gratuit · Sans inscription",
    h1Prefix: "Calculateur ",
    h1Highlight: "EVG",
    intro: "Combien coûte vraiment votre EVG ? Choisissez la ville, la taille de l'équipe, le programme — coût par personne calculé instantanément. Avec les données de 41 villes européennes.",
    inputsTitle: "Vos données EVG",
    inputs: {
      city: "Ville / Destination",
      people: "Personnes",
      nights: "Nuits",
      activities: "Activités",
      partyNights: "Soirées",
      hotel: "Hébergement",
      travel: "Inclure le coût du transport",
      travelHintAbroad: "Estimation vol international",
      travelHintDomestic: "Part du coût train / voiture",
    },
    hotelOptions: {
      hostel: "Auberge / dortoir",
      airbnb: "AirBnB / appartement (groupe)",
      midrange: "Hôtel milieu de gamme",
      premium: "Premium / 4–5 étoiles",
    },
    cityGroups: { dach: "DACH", intl: "International" },
    resultPrefix: "EVG à",
    perPerson: "par personne",
    total: "Budget total",
    rows: { travel: "Transport", hotel: "Hébergement", activities: "Activités", party: "Soirées", food: "Restauration" },
    ctas: { createEvent: "Créer un événement", viewCityGuide: "Voir le guide ville" },
    disclaimer: "Estimations sur la base de moyennes — votre budget réel peut varier de 20–30 % selon saison, jour et style.",
    infoHeading: "Comment fonctionne le calculateur",
    infoBody: "Valeurs basées sur des fourchettes réelles des guides EventBliss. Hôtel par personne par nuit, activités en moyenne de ville, soirées avec entrées et 4–6 boissons. Restauration 35 € par jour par personne.",
    faqHead: "FAQ — budget EVG",
    faqs: [
      { q: "Combien coûte un EVG par personne en moyenne ?", a: "Un weekend EVG coûte entre 230 € (ville bon marché) et 1000 € (destinations premium). Moyenne DACH : 350–550 € par tête." },
      { q: "Quelle ville EVG est la moins chère en Europe ?", a: "Bucarest, Tallinn, Cracovie et Varsovie dès 180 € par personne pour 3 nuits avec vol." },
      { q: "Combien d'avance pour planifier le budget ?", a: "Haute saison (mai–septembre) 8–12 semaines, dates festival 6–9 mois." },
      { q: "Comment partager les coûts équitablement ?", a: "EventBliss répartit automatiquement toutes les dépenses entre les participants. Pas de chaos 'qui doit à qui'." },
      { q: "Hôtel ou AirBnB pour un EVG ?", a: "Dès 6 personnes, AirBnB gagne presque toujours : pre-party à soi, pas d'heure de fermeture, moitié du prix d'un hôtel." },
    ],
    finalH2Prefix: "Planifiez votre ",
    finalH2Highlight: "EVG",
    finalText: "Le budget n'est qu'une première étape. EventBliss organise votre équipe, partage les frais automatiquement et inclut 24+ jeux de soirée.",
    finalCta: "Créer un événement gratuit",
    title: "Calculateur EVG — Coût par Personne | EventBliss",
    description: "Combien coûte un EVG vraiment ? Calculateur gratuit pour 41 villes européennes. Personnes, hôtel, activités — coût par personne calculé instantanément.",
    keywords: "calculateur EVG, budget EVG, coût enterrement de vie de garçon",
    jsonLdName: "Calculateur EVG",
    jsonLdDescription: "Calculateur gratuit pour budget EVG. Ville, personnes, programme — coût par personne et total instantanément.",
  },
  it: {
    badge: "Strumento gratuito · Senza registrazione",
    h1Prefix: "Calcolatore ",
    h1Highlight: "Addio al Celibato",
    intro: "Quanto costa davvero il vostro addio al celibato? Scegli città, dimensione del crew, programma — costo a persona calcolato istantaneamente. Con dati di 41 città europee.",
    inputsTitle: "I tuoi dati addio",
    inputs: {
      city: "Città / Destinazione",
      people: "Persone",
      nights: "Notti",
      activities: "Attività",
      partyNights: "Serate",
      hotel: "Alloggio",
      travel: "Includere il costo del viaggio",
      travelHintAbroad: "Stima volo internazionale",
      travelHintDomestic: "Quota di treno / auto",
    },
    hotelOptions: {
      hostel: "Ostello / dormitorio",
      airbnb: "AirBnB / appartamento (gruppo)",
      midrange: "Hotel medio",
      premium: "Premium / 4–5 stelle",
    },
    cityGroups: { dach: "DACH", intl: "Internazionale" },
    resultPrefix: "Addio a",
    perPerson: "a persona",
    total: "Budget totale",
    rows: { travel: "Viaggio", hotel: "Alloggio", activities: "Attività", party: "Serate", food: "Cibo e bevande" },
    ctas: { createEvent: "Crea evento ora", viewCityGuide: "Vedi guida città" },
    disclaimer: "Stime basate su medie — il vostro budget reale può variare 20–30 % a seconda di stagione, giorno e stile.",
    infoHeading: "Come funziona il calcolatore",
    infoBody: "Valori basati su fasce reali dalle guide EventBliss. Hotel a persona a notte, attività come media città, serate con ingressi e 4–6 drink. Cibo e bevande 35 € a persona al giorno.",
    faqHead: "Domande frequenti — budget addio",
    faqs: [
      { q: "Quanto costa un addio al celibato a persona in media?", a: "Un weekend costa tra 230 € (città economica) e 1000 € (premium). Media DACH: 350–550 € a testa." },
      { q: "Qual è la città di addio più economica in Europa?", a: "Bucarest, Tallinn, Cracovia e Varsavia da 180 € a persona per 3 notti con volo." },
      { q: "Quanto anticipo per pianificare il budget?", a: "Alta stagione (maggio–settembre) 8–12 settimane, date di festival 6–9 mesi." },
      { q: "Come dividiamo i costi equamente?", a: "EventBliss divide automaticamente tutte le spese tra tutti i partecipanti. Niente caos 'chi deve a chi'." },
      { q: "Hotel o AirBnB per un crew di addio?", a: "Dai 6 in su AirBnB vince quasi sempre: pre-party propria, niente coprifuoco, metà prezzo dell'hotel." },
    ],
    finalH2Prefix: "Pianifica il tuo ",
    finalH2Highlight: "addio",
    finalText: "Il budget è solo il primo passo. EventBliss organizza il crew, divide automaticamente i costi e include 24+ giochi.",
    finalCta: "Crea evento gratis",
    title: "Calcolatore Addio al Celibato — Costo a Persona | EventBliss",
    description: "Quanto costa davvero un addio al celibato? Calcolatore gratuito per 41 città europee. Persone, hotel, attività — costo a persona istantaneo.",
    keywords: "calcolatore addio al celibato, budget addio celibato, costo addio celibato",
    jsonLdName: "Calcolatore Addio al Celibato",
    jsonLdDescription: "Calcolatore gratuito per budget addio al celibato. Città, persone, programma — costo a persona e totale istantaneamente.",
  },
  pt: {
    badge: "Ferramenta grátis · Sem registo",
    h1Prefix: "Calculadora ",
    h1Highlight: "Despedida",
    intro: "Quanto custa realmente a vossa despedida de solteiro? Escolham cidade, tamanho do grupo, programa — custo por pessoa calculado instantaneamente. Com dados de 41 cidades europeias.",
    inputsTitle: "Os teus dados de despedida",
    inputs: {
      city: "Cidade / Destino",
      people: "Pessoas",
      nights: "Noites",
      activities: "Atividades",
      partyNights: "Noites de festa",
      hotel: "Alojamento",
      travel: "Incluir custo de viagem",
      travelHintAbroad: "Estimativa de voo internacional",
      travelHintDomestic: "Parte do custo de comboio/carro",
    },
    hotelOptions: {
      hostel: "Hostel / dormitório",
      airbnb: "AirBnB / apartamento (grupo)",
      midrange: "Hotel médio",
      premium: "Premium / 4–5 estrelas",
    },
    cityGroups: { dach: "DACH", intl: "Internacional" },
    resultPrefix: "Despedida em",
    perPerson: "por pessoa",
    total: "Orçamento total",
    rows: { travel: "Viagem", hotel: "Alojamento", activities: "Atividades", party: "Noites de festa", food: "Comida e bebida" },
    ctas: { createEvent: "Criar evento agora", viewCityGuide: "Ver guia da cidade" },
    disclaimer: "Estimativas baseadas em médias — o vosso orçamento real pode variar 20–30 % conforme época, dia e estilo.",
    infoHeading: "Como funciona a calculadora",
    infoBody: "Valores baseados em intervalos reais dos guias EventBliss. Hotel por pessoa por noite, atividades como média da cidade, noites de festa com entradas e 4–6 bebidas. Comida 35 € por pessoa por dia.",
    faqHead: "Perguntas frequentes — orçamento despedida",
    faqs: [
      { q: "Quanto custa uma despedida por pessoa em média?", a: "Um fim de semana custa entre 230 € (cidade barata) e 1000 € (premium). Média DACH: 350–550 € por pessoa." },
      { q: "Qual é a cidade de despedida mais barata na Europa?", a: "Bucareste, Tallinn, Cracóvia e Varsóvia desde 180 € por pessoa para 3 noites com voo." },
      { q: "Quanta antecedência para planear o orçamento?", a: "Época alta (maio–setembro) 8–12 semanas, datas de festival 6–9 meses." },
      { q: "Como dividimos custos de forma justa?", a: "EventBliss divide automaticamente todas as despesas entre todos os participantes. Sem o caos do 'quem deve a quem'." },
      { q: "Hotel ou AirBnB para um grupo?", a: "Desde 6 pessoas, AirBnB quase sempre vence: pre-party próprio, sem horário, metade do preço do hotel." },
    ],
    finalH2Prefix: "Planeia a tua ",
    finalH2Highlight: "despedida",
    finalText: "O orçamento é só o primeiro passo. EventBliss organiza o grupo, divide automaticamente os custos e inclui 24+ jogos.",
    finalCta: "Criar evento grátis",
    title: "Calculadora de Despedida de Solteiro — Custo por Pessoa | EventBliss",
    description: "Quanto custa uma despedida realmente? Calculadora grátis para 41 cidades europeias. Pessoas, hotel, atividades — custo por pessoa instantâneo.",
    keywords: "calculadora despedida solteiro, custo despedida, orçamento despedida solteiro",
    jsonLdName: "Calculadora de Despedida de Solteiro",
    jsonLdDescription: "Calculadora grátis para orçamento de despedida. Cidade, pessoas, programa — custo por pessoa e total instantâneo.",
  },
  nl: {
    badge: "Gratis tool · Geen registratie",
    h1Prefix: "Vrijgezellenfeest-",
    h1Highlight: "Calculator",
    intro: "Wat kost jullie vrijgezellenfeest echt? Kies stad, groepsgrootte, programma — kosten per persoon direct berekend. Met data uit 41 Europese steden.",
    inputsTitle: "Jullie vrijgezellen-basics",
    inputs: {
      city: "Stad / Bestemming",
      people: "Personen",
      nights: "Nachten",
      activities: "Activiteiten",
      partyNights: "Feestavonden",
      hotel: "Accommodatie",
      travel: "Reiskosten meerekenen",
      travelHintAbroad: "Buitenlandse vlucht-schatting",
      travelHintDomestic: "Trein / auto-kostenaandeel",
    },
    hotelOptions: {
      hostel: "Hostel / slaapzaal",
      airbnb: "AirBnB / appartement (groep)",
      midrange: "Middenklasse hotel",
      premium: "Premium / 4–5 sterren",
    },
    cityGroups: { dach: "DACH", intl: "Internationaal" },
    resultPrefix: "Vrijgezellenfeest in",
    perPerson: "per persoon",
    total: "Totaal budget",
    rows: { travel: "Reis", hotel: "Accommodatie", activities: "Activiteiten", party: "Feestavonden", food: "Eten & drinken" },
    ctas: { createEvent: "Maak event aan", viewCityGuide: "Bekijk stadsgids" },
    disclaimer: "Schattingen op basis van gemiddelden — jullie echte budget kan 20–30 % afwijken afhankelijk van seizoen, dag en stijl.",
    infoHeading: "Zo werkt de calculator",
    infoBody: "Waarden op basis van echte prijsranges uit de EventBliss-stadsgidsen. Hotel per persoon per nacht, activiteiten als stadsgemiddelde, feestavonden inclusief entrees en 4–6 drankjes. Eten 35 € per persoon per dag.",
    faqHead: "FAQ — vrijgezellenbudget",
    faqs: [
      { q: "Wat kost een vrijgezellenfeest per persoon gemiddeld?", a: "Een weekend kost tussen 230 € (goedkope stad) en 1000 € (premium). DACH-gemiddelde: 350–550 € per persoon." },
      { q: "Welke vrijgezellenstad in Europa is het goedkoopst?", a: "Boekarest, Tallinn, Krakau en Warschau vanaf 180 € per persoon voor 3 nachten met vlucht." },
      { q: "Hoeveel voorbereidingstijd voor budgetplanning?", a: "Hoogseizoen (mei–september) 8–12 weken, festivaldata 6–9 maanden." },
      { q: "Hoe verdelen we de kosten eerlijk?", a: "EventBliss splitst automatisch alle uitgaven over alle deelnemers. Geen 'wie is wie wat schuldig'-chaos." },
      { q: "Hotel of AirBnB voor een crew?", a: "Vanaf 6+ personen wint AirBnB bijna altijd: eigen pre-party, geen sluitingstijd, halve hotelprijs." },
    ],
    finalH2Prefix: "Plan jullie ",
    finalH2Highlight: "vrijgezellenfeest",
    finalText: "Budget is pas de eerste stap. EventBliss organiseert de crew, splitst automatisch alle kosten en heeft 24+ feestspellen.",
    finalCta: "Gratis event aanmaken",
    title: "Vrijgezellenfeest-Calculator — Kosten per Persoon | EventBliss",
    description: "Wat kost een vrijgezellenfeest echt? Gratis calculator voor 41 Europese steden. Personen, hotel, activiteiten — kosten per persoon direct.",
    keywords: "vrijgezellenfeest calculator, vrijgezellenfeest kosten, budget vrijgezellenfeest",
    jsonLdName: "Vrijgezellenfeest-Calculator",
    jsonLdDescription: "Gratis calculator voor vrijgezellenfeest-budget. Stad, personen, programma — kosten per persoon en totaal direct.",
  },
  pl: {
    badge: "Darmowe narzędzie · Bez rejestracji",
    h1Prefix: "Kalkulator ",
    h1Highlight: "Wieczoru Kawalerskiego",
    intro: "Ile naprawdę kosztuje wasz wieczór kawalerski? Wybierz miasto, wielkość ekipy, program — koszt na osobę natychmiast obliczony. Z danymi z 41 europejskich miast.",
    inputsTitle: "Wasze dane wieczoru",
    inputs: {
      city: "Miasto / Cel",
      people: "Osoby",
      nights: "Noce",
      activities: "Atrakcje",
      partyNights: "Wieczory imprezowe",
      hotel: "Nocleg",
      travel: "Uwzględnij koszt dojazdu",
      travelHintAbroad: "Szacunek lotu zagranicznego",
      travelHintDomestic: "Udział kosztu pociągu/auta",
    },
    hotelOptions: {
      hostel: "Hostel / pokój zbiorowy",
      airbnb: "AirBnB / mieszkanie (grupa)",
      midrange: "Hotel średni",
      premium: "Premium / 4–5 gwiazdek",
    },
    cityGroups: { dach: "DACH", intl: "Międzynarodowo" },
    resultPrefix: "Wieczór kawalerski w",
    perPerson: "na osobę",
    total: "Budżet całkowity",
    rows: { travel: "Podróż", hotel: "Nocleg", activities: "Atrakcje", party: "Wieczory imprezowe", food: "Jedzenie i picie" },
    ctas: { createEvent: "Utwórz wydarzenie", viewCityGuide: "Zobacz przewodnik miasta" },
    disclaimer: "Szacunki na podstawie średnich — wasz prawdziwy budżet może odbiegać o 20–30 % zależnie od sezonu, dnia i stylu.",
    infoHeading: "Jak działa kalkulator",
    infoBody: "Wartości oparte na realnych przedziałach z przewodników EventBliss. Hotel na osobę na noc, atrakcje jako średnia miasta, wieczory imprezowe z wstępami i 4–6 drinkami. Jedzenie 35 € na osobę dziennie.",
    faqHead: "FAQ — budżet wieczoru kawalerskiego",
    faqs: [
      { q: "Ile kosztuje wieczór kawalerski na osobę średnio?", a: "Weekend kosztuje 230 € (tanie miasto) do 1000 € (premium). Średnia DACH: 350–550 € na osobę." },
      { q: "Które miasto na wieczór kawalerski jest najtańsze w Europie?", a: "Bukareszt, Tallinn, Kraków i Warszawa od 180 € na osobę za 3 noce z lotem." },
      { q: "Z jakim wyprzedzeniem planować budżet?", a: "Sezon (maj–wrzesień) 8–12 tygodni, daty festiwali 6–9 miesięcy." },
      { q: "Jak dzielić koszty sprawiedliwie?", a: "EventBliss automatycznie dzieli wszystkie wydatki między uczestników. Bez chaosu 'kto komu winien'." },
      { q: "Hotel czy AirBnB dla ekipy?", a: "Od 6 osób AirBnB prawie zawsze wygrywa: własna pre-party, brak godziny zamknięcia, połowa ceny hotelu." },
    ],
    finalH2Prefix: "Zaplanuj wasz ",
    finalH2Highlight: "wieczór",
    finalText: "Budżet to tylko pierwszy krok. EventBliss organizuje ekipę, automatycznie dzieli koszty i daje 24+ gier imprezowych.",
    finalCta: "Utwórz wydarzenie za darmo",
    title: "Kalkulator Wieczoru Kawalerskiego — Koszt na Osobę | EventBliss",
    description: "Ile naprawdę kosztuje wieczór kawalerski? Darmowy kalkulator dla 41 miast europejskich. Osoby, hotel, atrakcje — koszt na osobę natychmiast.",
    keywords: "kalkulator wieczoru kawalerskiego, koszt wieczoru kawalerskiego, budżet wieczoru kawalerskiego",
    jsonLdName: "Kalkulator Wieczoru Kawalerskiego",
    jsonLdDescription: "Darmowy kalkulator budżetu wieczoru kawalerskiego. Miasto, osoby, program — koszt na osobę i całkowity natychmiast.",
  },
  tr: {
    badge: "Ücretsiz araç · Kayıt yok",
    h1Prefix: "Bekarlığa Veda ",
    h1Highlight: "Bütçe Hesaplayıcısı",
    intro: "Bekarlığa veda partiniz gerçekten ne kadara mal oluyor? Şehir seç, ekip büyüklüğünü gir, programı işaretle — kişi başı maliyet anında hesaplanır. 41 Avrupa şehrinden veri ile.",
    inputsTitle: "Bekarlığa veda bilgileriniz",
    inputs: {
      city: "Şehir / Destinasyon",
      people: "Kişi",
      nights: "Gece",
      activities: "Aktiviteler",
      partyNights: "Parti geceleri",
      hotel: "Konaklama",
      travel: "Seyahat maliyetini dahil et",
      travelHintAbroad: "Uluslararası uçuş tahmini",
      travelHintDomestic: "Tren / araba maliyet payı",
    },
    hotelOptions: {
      hostel: "Hostel / yatakhane",
      airbnb: "AirBnB / daire (grup)",
      midrange: "Orta sınıf otel",
      premium: "Premium / 4–5 yıldız",
    },
    cityGroups: { dach: "DACH", intl: "Uluslararası" },
    resultPrefix: "Bekarlığa veda",
    perPerson: "kişi başı",
    total: "Toplam bütçe",
    rows: { travel: "Seyahat", hotel: "Konaklama", activities: "Aktiviteler", party: "Parti geceleri", food: "Yiyecek-İçecek" },
    ctas: { createEvent: "Etkinlik oluştur", viewCityGuide: "Şehir rehberini gör" },
    disclaimer: "Tahminler ortalamalara dayanır — gerçek bütçeniz sezona, güne ve stile göre %20–30 değişebilir.",
    infoHeading: "Hesaplayıcı nasıl çalışır",
    infoBody: "Değerler EventBliss şehir rehberlerinden gerçek fiyat aralıklarına dayanır. Otel kişi başı gece, aktiviteler şehir ortalaması, parti geceleri giriş ve 4–6 içkiyle. Yiyecek 35 €/kişi/gün.",
    faqHead: "SSS — bekarlığa veda bütçesi",
    faqs: [
      { q: "Bekarlığa veda kişi başı ortalama ne kadar?", a: "Hafta sonu 230 € (ucuz şehir) ile 1000 € (premium) arası. DACH ortalaması: kişi başı 350–550 €." },
      { q: "Avrupa'nın en ucuz bekarlığa veda şehri?", a: "Bükreş, Tallinn, Krakov ve Varşova uçuşla 3 gece kişi başı 180 €'dan." },
      { q: "Bütçe planlaması için ne kadar erken?", a: "Yoğun sezon (Mayıs–Eylül) 8–12 hafta, festival tarihleri 6–9 ay." },
      { q: "Maliyetleri adil nasıl bölersiniz?", a: "EventBliss tüm harcamaları katılımcılar arasında otomatik adil böler. 'Kim kime borçlu' kaosu yok." },
      { q: "Ekip için otel mi AirBnB mi?", a: "6+ kişiden AirBnB neredeyse her zaman kazanır: kendi pre-party, kapanış saati yok, otel fiyatının yarısı." },
    ],
    finalH2Prefix: "Planla ",
    finalH2Highlight: "bekarlığa vedanı",
    finalText: "Bütçe sadece ilk adım. EventBliss ekibinizi organize eder, maliyetleri otomatik böler ve 24+ parti oyunu sunar.",
    finalCta: "Ücretsiz etkinlik oluştur",
    title: "Bekarlığa Veda Bütçe Hesaplayıcısı — Kişi Başı Maliyet | EventBliss",
    description: "Bekarlığa veda gerçekten ne kadara mal olur? 41 Avrupa şehri için ücretsiz hesaplayıcı. Kişi, otel, aktivite — kişi başı maliyet anında.",
    keywords: "bekarlığa veda bütçe hesaplayıcı, bekarlığa veda maliyeti, bekarlığa veda bütçesi",
    jsonLdName: "Bekarlığa Veda Bütçe Hesaplayıcısı",
    jsonLdDescription: "Ücretsiz bekarlığa veda bütçesi hesaplayıcısı. Şehir, kişi, program — kişi başı ve toplam maliyet anında.",
  },
  ar: {
    badge: "أداة مجانية · بدون تسجيل",
    h1Prefix: "حاسبة ميزانية ",
    h1Highlight: "وداع العزوبية",
    intro: "كم تكلّف حفلة وداع العزوبية فعليًا؟ اختر المدينة، أدخل عدد الأشخاص، حدّد البرنامج — التكلفة لكل شخص تُحتسب فورًا. ببيانات من 41 مدينة أوروبية.",
    inputsTitle: "تفاصيل حفلتك الأساسية",
    inputs: {
      city: "المدينة / الوجهة",
      people: "عدد الأشخاص",
      nights: "عدد الليالي",
      activities: "الأنشطة",
      partyNights: "ليالي السهر",
      hotel: "الإقامة",
      travel: "احتساب تكلفة السفر",
      travelHintAbroad: "تقدير رحلة طيران دولية",
      travelHintDomestic: "حصة تكلفة القطار / السيارة",
    },
    hotelOptions: {
      hostel: "نُزل / غرفة مشتركة",
      airbnb: "AirBnB / شقة (للمجموعة)",
      midrange: "فندق متوسط",
      premium: "فاخر / 4–5 نجوم",
    },
    cityGroups: { dach: "ألمانيا والنمسا وسويسرا", intl: "دولي" },
    resultPrefix: "وداع العزوبية في",
    perPerson: "لكل شخص",
    total: "إجمالي الميزانية",
    rows: { travel: "السفر", hotel: "الإقامة", activities: "الأنشطة", party: "ليالي السهر", food: "الطعام والشراب" },
    ctas: { createEvent: "أنشئ فعالية الآن", viewCityGuide: "عرض دليل المدينة" },
    disclaimer: "تقديرات مبنية على متوسطات — قد تختلف ميزانيتك الفعلية بنسبة 20–30٪ حسب الموسم واليوم والأسلوب.",
    infoHeading: "كيف تحسب الأداة",
    infoBody: "القيم مبنية على نطاقات أسعار حقيقية من أدلة مدن EventBliss. أسعار الفنادق لكل شخص لكل ليلة، الأنشطة بمتوسط خيارات المدينة، ليالي السهر تشمل الدخول و4–6 مشروبات. الطعام والشراب 35 € لكل شخص يوميًا.",
    faqHead: "أسئلة شائعة حول ميزانية وداع العزوبية",
    faqs: [
      { q: "كم تكلّف حفلة وداع العزوبية لكل شخص في المتوسط؟", a: "تتراوح عطلة نهاية الأسبوع بين 230 € (مدينة اقتصادية) و1000 € (وجهات فاخرة). المتوسط في ألمانيا والنمسا وسويسرا 350–550 € للشخص." },
      { q: "ما أرخص مدينة لوداع العزوبية في أوروبا؟", a: "بوخارست، تالين، كراكوف ووارسو ابتداءً من 180 € للشخص لثلاث ليالٍ شاملة الطيران." },
      { q: "كم من الوقت أحتاج للتخطيط للميزانية؟", a: "موسم الذروة (مايو–سبتمبر) 8–12 أسبوعًا، ومواعيد المهرجانات 6–9 أشهر." },
      { q: "كيف نقسّم التكاليف بإنصاف بين الجميع؟", a: "يقسّم EventBliss جميع المصاريف تلقائيًا بإنصاف بين كل المشاركين — دون فوضى 'من يدين لمن'." },
      { q: "فندق أم AirBnB لمجموعة وداع العزوبية؟", a: "ابتداءً من 6 أشخاص يكون AirBnB أوفر دائمًا تقريبًا: مكان خاص لما قبل الحفلة، دون وقت إغلاق، ونصف سعر الفندق." },
    ],
    finalH2Prefix: "خطّطوا لـ",
    finalH2Highlight: "وداع العزوبية",
    finalText: "الميزانية مجرد خطوة أولى. ينظّم EventBliss مجموعتكم، ويقسّم كل التكاليف تلقائيًا، ويوفّر أكثر من 24 لعبة.",
    finalCta: "أنشئ فعالية مجانًا",
    title: "حاسبة ميزانية وداع العزوبية — التكلفة لكل شخص | EventBliss",
    description: "كم تكلّف حفلة وداع العزوبية فعليًا؟ حاسبة مجانية لـ41 مدينة أوروبية. الأشخاص، الفندق، الأنشطة — التكلفة لكل شخص فورًا.",
    keywords: "حاسبة ميزانية وداع العزوبية, تكلفة حفلة العزوبية, حاسبة تكاليف وداع العزوبية",
    jsonLdName: "حاسبة ميزانية وداع العزوبية",
    jsonLdDescription: "حاسبة مجانية لميزانية وداع العزوبية. اختر المدينة والأشخاص والبرنامج — التكلفة لكل شخص والإجمالي فورًا.",
  },
};

// ──────────────────────────────────────────────────────────────────
// Cost model (currency-agnostic; values in EUR)
// ──────────────────────────────────────────────────────────────────

const HOTEL_MULTIPLIER: Record<string, number> = {
  hostel: 0.55,
  airbnb: 0.85,
  midrange: 1.0,
  premium: 1.6,
};

function avgActivityCost(citySlug: string): number {
  const expensive = ["zuerich", "london", "kopenhagen", "stockholm", "paris", "dublin", "edinburgh", "nizza"];
  const mid = ["berlin", "hamburg", "muenchen", "amsterdam", "barcelona", "wien", "mailand", "rom", "florenz", "salzburg", "bruessel"];
  if (expensive.includes(citySlug)) return 90;
  if (mid.includes(citySlug)) return 55;
  return 40;
}
function avgPartyCost(citySlug: string): number {
  const expensive = ["zuerich", "london", "kopenhagen", "stockholm", "paris", "dublin", "edinburgh", "nizza", "ibiza"];
  const mid = ["berlin", "hamburg", "muenchen", "amsterdam", "barcelona", "wien", "mailand", "rom", "florenz", "duesseldorf"];
  if (expensive.includes(citySlug)) return 95;
  if (mid.includes(citySlug)) return 60;
  return 40;
}
function avgHotelPerNight(citySlug: string): number {
  const expensive = ["zuerich", "london", "kopenhagen", "stockholm", "paris", "dublin", "edinburgh", "nizza", "ibiza", "amsterdam"];
  const mid = ["berlin", "hamburg", "muenchen", "barcelona", "wien", "mailand", "rom", "florenz", "salzburg", "bruessel", "duesseldorf", "frankfurt", "stuttgart", "mallorca"];
  if (expensive.includes(citySlug)) return 95;
  if (mid.includes(citySlug)) return 65;
  return 45;
}
function travelEstimate(citySlug: string, isAbroad: boolean | undefined): number {
  if (!isAbroad) return 30;
  const expensive = ["zuerich", "london", "kopenhagen", "stockholm", "edinburgh", "dublin"];
  const farther = ["istanbul", "athen", "lissabon", "porto", "ibiza", "valencia"];
  if (expensive.includes(citySlug)) return 180;
  if (farther.includes(citySlug)) return 140;
  return 100;
}

// ──────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────

function detectLang(pathname: string): CalcLang {
  if (pathname.startsWith("/stag-do/calculator")) return "en";
  if (pathname.startsWith("/despedida/calculadora")) return "es";
  if (pathname.startsWith("/evg/calculatrice")) return "fr";
  if (pathname.startsWith("/addio/calcolatore")) return "it";
  if (pathname.startsWith("/despedida-de-solteiro/calculadora")) return "pt";
  if (pathname.startsWith("/vrijgezellenfeest/calculator")) return "nl";
  if (pathname.startsWith("/wieczor-kawalerski/kalkulator")) return "pl";
  if (pathname.startsWith("/bekarliga-veda/hesaplayici")) return "tr";
  if (pathname.startsWith("/wadaa-azubiya/hasiba")) return "ar";
  return "de";
}

export default function JgaCalculator() {
  const location = useLocation();
  const lang = detectLang(location.pathname);
  const t = COPY[lang];

  const [citySlug, setCitySlug] = useState("berlin");
  const [people, setPeople] = useState(8);
  const [nights, setNights] = useState(2);
  const [activities, setActivities] = useState(2);
  const [partyNights, setPartyNights] = useState(2);
  const [hotelTier, setHotelTier] = useState("airbnb");
  const [includeTravel, setIncludeTravel] = useState(true);

  const selectedCity = useMemo(
    () => JGA_CITIES.find((c) => c.slug === citySlug) ?? JGA_CITIES[0],
    [citySlug]
  );

  const result = useMemo(() => {
    const hotelPerNight = avgHotelPerNight(citySlug) * HOTEL_MULTIPLIER[hotelTier];
    const hotelPerPerson = hotelPerNight * nights;
    const activityPerPerson = avgActivityCost(citySlug) * activities;
    const partyPerPerson = avgPartyCost(citySlug) * partyNights;
    const foodPerPerson = 35 * (nights + 1);
    const travelPerPerson = includeTravel ? travelEstimate(citySlug, selectedCity.isAbroad) : 0;
    const perPerson = hotelPerPerson + activityPerPerson + partyPerPerson + foodPerPerson + travelPerPerson;
    const grandTotal = perPerson * people;
    return {
      travelTotal: travelPerPerson * people,
      hotelTotal: hotelPerPerson * people,
      activityTotal: activityPerPerson * people,
      partyTotal: partyPerPerson * people,
      foodTotal: foodPerPerson * people,
      perPerson,
      grandTotal,
    };
  }, [citySlug, people, nights, activities, partyNights, hotelTier, includeTravel, selectedCity]);

  const fmt = (n: number) =>
    new Intl.NumberFormat(INTL_LOCALE_FORMAT[lang], {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(Math.round(n));

  // hreflang injection
  useEffect(() => {
    const head = document.head;
    const links: HTMLLinkElement[] = [];
    const langs: CalcLang[] = ["de", "en", "es", "fr", "it", "pt", "nl", "pl", "tr"];
    for (const l of langs) {
      const link = document.createElement("link");
      link.setAttribute("rel", "alternate");
      link.setAttribute("hreflang", HTML_LANG_BY_LANG[l]);
      link.setAttribute("href", `${SITE_URL}${ROUTE_BY_LANG[l]}`);
      link.setAttribute("data-calc-hreflang", "true");
      head.appendChild(link);
      links.push(link);
    }
    const xDef = document.createElement("link");
    xDef.setAttribute("rel", "alternate");
    xDef.setAttribute("hreflang", "x-default");
    xDef.setAttribute("href", `${SITE_URL}${ROUTE_BY_LANG.en}`);
    xDef.setAttribute("data-calc-hreflang", "true");
    head.appendChild(xDef);
    links.push(xDef);
    return () => {
      links.forEach((l) => l.remove());
    };
  }, []);

  const url = `${SITE_URL}${ROUTE_BY_LANG[lang]}`;

  const jsonLd = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: t.jsonLdName,
        url,
        description: t.jsonLdDescription,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        inLanguage: HTML_LANG_BY_LANG[lang],
        featureList: [
          "41 European cities",
          "Person, night and activity selection",
          "Hotel tiers (hostel to premium)",
          "Per-person and total budget",
          "DACH and international",
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        inLanguage: HTML_LANG_BY_LANG[lang],
        mainEntity: t.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
    [t, lang, url]
  );

  useSEO({
    title: t.title,
    description: t.description,
    canonical: url,
    ogImage: `${SITE_URL}/og-image.png`,
    ogType: "website",
    locale: LOCALE_BY_LANG[lang],
    htmlLang: HTML_LANG_BY_LANG[lang],
    dir: lang === "ar" ? "rtl" : "ltr",
    keywords: t.keywords,
    jsonLd,
  });

  const langLinks = (
    Object.entries(ROUTE_BY_LANG) as Array<[CalcLang, string]>
  )
    .filter(([l]) => l !== lang)
    .map(([l, path]) => ({
      lang: l,
      url: path,
      label: { de: "Deutsch", en: "English", es: "Español", fr: "Français", it: "Italiano", pt: "Português", nl: "Nederlands", pl: "Polski", tr: "Türkçe", ar: "العربية" }[l],
    }));

  const dachCities = JGA_CITIES.filter((c) => !c.isAbroad);
  const intlCities = JGA_CITIES.filter((c) => c.isAbroad);

  return (
    <div className="min-h-screen bg-background" dir={lang === "ar" ? "rtl" : "ltr"}>
      <LandingHeader />

      {/* HERO */}
      <section className="relative pt-32 pb-12 overflow-hidden">
        <AuroraBackground className="absolute inset-0 -z-0" intensity="normal" spotlight grain />
        <div className="container max-w-4xl mx-auto px-4 relative z-10 text-center">
          <Badge className="mb-6 px-4 py-2" variant="secondary">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {t.badge}
          </Badge>

          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 leading-tight">
            {t.h1Prefix}<AuroraText>{t.h1Highlight}</AuroraText>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">{t.intro}</p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
            <Globe className="w-4 h-4 text-muted-foreground" />
            {langLinks.map((l) => (
              <Link key={l.lang} to={l.url} className="text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CALCULATOR */}
      <section className="py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* INPUTS */}
            <div className="lg:col-span-3 space-y-6">
              <GlassCard padding="lg">
                <div className="flex items-center gap-3 mb-6">
                  <Calculator className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-display font-semibold">{t.inputsTitle}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <Label className="mb-2 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      {t.inputs.city}
                    </Label>
                    <Select value={citySlug} onValueChange={setCitySlug}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                          {t.cityGroups.dach}
                        </div>
                        {dachCities.map((c) => (
                          <SelectItem key={c.slug} value={c.slug}>
                            {localizedCityName(c, lang)} ({localizedCountryName(c.country, lang)})
                          </SelectItem>
                        ))}
                        <div className="px-2 py-1.5 mt-2 text-xs font-semibold text-muted-foreground uppercase">
                          {t.cityGroups.intl}
                        </div>
                        {intlCities.map((c) => (
                          <SelectItem key={c.slug} value={c.slug}>
                            {localizedCityName(c, lang)} ({localizedCountryName(c.country, lang)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-2 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-primary" />
                      {t.inputs.people}: <strong>{people}</strong>
                    </Label>
                    <Slider value={[people]} min={2} max={30} step={1} onValueChange={(v) => setPeople(v[0])} />
                  </div>

                  <div>
                    <Label className="mb-2 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary" />
                      {t.inputs.nights}: <strong>{nights}</strong>
                    </Label>
                    <Slider value={[nights]} min={1} max={5} step={1} onValueChange={(v) => setNights(v[0])} />
                  </div>

                  <div>
                    <Label className="mb-2 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-primary" />
                      {t.inputs.activities}: <strong>{activities}</strong>
                    </Label>
                    <Slider value={[activities]} min={0} max={5} step={1} onValueChange={(v) => setActivities(v[0])} />
                  </div>

                  <div>
                    <Label className="mb-2 flex items-center gap-1.5">
                      <Beer className="w-4 h-4 text-primary" />
                      {t.inputs.partyNights}: <strong>{partyNights}</strong>
                    </Label>
                    <Slider value={[partyNights]} min={0} max={5} step={1} onValueChange={(v) => setPartyNights(v[0])} />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="mb-2 flex items-center gap-1.5">
                      <Hotel className="w-4 h-4 text-primary" />
                      {t.inputs.hotel}
                    </Label>
                    <Select value={hotelTier} onValueChange={setHotelTier}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(t.hotelOptions) as Array<[keyof typeof t.hotelOptions, string]>).map(
                          ([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={includeTravel}
                        onChange={(e) => setIncludeTravel(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <Plane className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">
                        {t.inputs.travel}
                        <span className="text-xs text-muted-foreground block mt-0.5">
                          {selectedCity.isAbroad ? t.inputs.travelHintAbroad : t.inputs.travelHintDomestic}
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              </GlassCard>

              <GlassCard padding="md" variant="hover">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="text-foreground font-medium">{t.infoHeading}</p>
                    <p>{t.infoBody}</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* RESULT */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24 space-y-4">
                <GlassCard padding="lg" variant="glow">
                  <div className="text-center mb-6">
                    <p className="text-sm text-muted-foreground mb-1">
                      {t.resultPrefix} {localizedCityName(selectedCity, lang)} · {people}
                    </p>
                    <p className="text-5xl font-display font-bold mb-2">
                      <AuroraText>{fmt(result.perPerson)}</AuroraText>
                    </p>
                    <p className="text-sm text-muted-foreground">{t.perPerson}</p>
                    <div className="mt-4 pt-4 border-t border-border/40">
                      <p className="text-2xl font-display font-semibold">{fmt(result.grandTotal)}</p>
                      <p className="text-xs text-muted-foreground">{t.total}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    {result.travelTotal > 0 && (
                      <CostRow icon={<Plane className="w-4 h-4" />} label={t.rows.travel} amount={fmt(result.travelTotal)} />
                    )}
                    <CostRow icon={<Hotel className="w-4 h-4" />} label={t.rows.hotel} amount={fmt(result.hotelTotal)} />
                    <CostRow icon={<Activity className="w-4 h-4" />} label={t.rows.activities} amount={fmt(result.activityTotal)} />
                    <CostRow icon={<Beer className="w-4 h-4" />} label={t.rows.party} amount={fmt(result.partyTotal)} />
                    <CostRow icon={<Wallet className="w-4 h-4" />} label={t.rows.food} amount={fmt(result.foodTotal)} />
                  </div>

                  <Link to="/create" className="block mb-3">
                    <GradientButton size="md" icon={<Sparkles className="w-4 h-4" />} className="w-full">
                      {t.ctas.createEvent}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </GradientButton>
                  </Link>
                  <Link to={`/jga/${selectedCity.slug}`} className="block">
                    <GradientButton variant="outline" size="md" className="w-full">
                      {t.ctas.viewCityGuide}
                    </GradientButton>
                  </Link>
                </GlassCard>

                <p className="text-xs text-muted-foreground text-center px-4">{t.disclaimer}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-card/20">
        <div className="container max-w-3xl mx-auto px-4">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-10 text-center">{t.faqHead}</h2>
          </ScrollReveal>

          <div className="space-y-6">
            {t.faqs.map((f, i) => (
              <GlassCard key={i} padding="md" variant="hover">
                <h3 className="font-display font-semibold text-lg mb-2">{f.q}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.a}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <AuroraBackground className="absolute inset-0 -z-0" intensity="intense" grain />
        <div className="container max-w-3xl mx-auto px-4 relative z-10 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-display font-bold mb-6"
          >
            {t.finalH2Prefix}<AuroraText>{t.finalH2Highlight}</AuroraText>
          </motion.h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">{t.finalText}</p>
          <Link to="/create">
            <GradientButton size="lg" icon={<Sparkles className="w-5 h-5" />}>
              {t.finalCta}
              <ArrowRight className="w-5 h-5 ml-1" />
            </GradientButton>
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

function CostRow({ icon, label, amount }: { icon: React.ReactNode; label: string; amount: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-semibold">{amount}</span>
    </div>
  );
}
