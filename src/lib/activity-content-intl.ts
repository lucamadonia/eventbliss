/**
 * Multilingual activity-content framework for ES/FR/IT/PT/NL/PL/TR.
 *
 * Per language: 10 category frameworks (action, outdoor, chill, food,
 * entertainment, creative, sport, nightlife, culture, adventure) — each
 * with hookSentence, introFor template, when/who sections, cost framework,
 * commonMistakes and 3 FAQs.
 *
 * Page template (src/pages/ActivityIntl.tsx) detects language from URL
 * pattern and selects the right framework block.
 */

import type { ActivityCategory, ActivityItem } from "./activities-library";

export type ActivityIntlLang = "es" | "fr" | "it" | "pt" | "nl" | "pl" | "tr";

export interface CategoryFrameworkIntl {
  hookSentence: string;
  introFor: (a: ActivityItem) => string;
  whenSection: string[];
  whoSection: string[];
  costExplain: string;
  commonMistakes: string[];
  faqs: (a: ActivityItem) => Array<{ q: string; a: string }>;
}

// ──────────────────────────────────────────────────────────────────
// Per-language route metadata
// ──────────────────────────────────────────────────────────────────

export const ACTIVITY_LANG_META = {
  es: {
    path: "/actividades/",
    label: "Actividades para Despedida",
    locale: "es_ES",
    htmlLang: "es-ES",
    titleTpl: (n: string) => `${n} para Despedida de Soltero — Ideas y Costes | EventBliss`,
    descriptionTpl: (n: string) => `${n} como actividad para despedida: coste por persona, grupo ideal, mejores ciudades. Planifica con EventBliss.`,
    activityFor: "como actividad de despedida",
    factsHeader: (n: string) => `Datos sobre ${n}`,
    whenHeader: (n: string) => `¿Cuándo merece la pena ${n}?`,
    whoHeader: "¿Para qué grupos?",
    costHeader: (n: string) => `Cómo calcular ${n}`,
    citiesHeader: (n: string) => `Mejores ciudades para ${n}`,
    mistakesHeader: (n: string) => `Errores comunes con ${n}`,
    faqHeader: (n: string) => `Preguntas sobre ${n}`,
    ctaHeader: (n: string) => `Planificar despedida con ${n}`,
    ctaText: "Crea evento en 30 segundos, invita al grupo, vota actividades y divide costes — todo en una app.",
    ctaButton: "Crear evento",
    relatedHeader: (cat: string) => `Más actividades ${cat}`,
    cityCtaLabel: "Ver guía de ciudad",
    bestForCount: 6,
    weatherDep: "⚠️ Depende del clima — ten un plan B interior",
    weatherInd: "✓ Independiente del clima — sin plan B necesario",
    difficultyLabel: "Dificultad",
    difficulty: { low: "Fácil (todos los niveles)", medium: "Media", high: "Exigente" },
    settingLabel: "Lugar",
    setting: { indoor: "Interior", outdoor: "Exterior", both: "Interior + Exterior" },
    factsLabels: {
      cost: "Coste por persona",
      group: "Tamaño del grupo",
      duration: "Duración",
      setting: "Lugar",
    },
    calcLink: "Usar la calculadora completa de presupuesto",
  },
  fr: {
    path: "/activites/",
    label: "Activités EVG",
    locale: "fr_FR",
    htmlLang: "fr-FR",
    titleTpl: (n: string) => `${n} pour EVG — Idées et Prix | EventBliss`,
    descriptionTpl: (n: string) => `${n} comme activité EVG : prix par personne, taille de groupe idéale, meilleures villes. Organise avec EventBliss.`,
    activityFor: "comme activité EVG",
    factsHeader: (n: string) => `Infos ${n}`,
    whenHeader: (n: string) => `Quand choisir ${n} ?`,
    whoHeader: "Pour quelles crews ?",
    costHeader: (n: string) => `Calculer ${n}`,
    citiesHeader: (n: string) => `Meilleures villes pour ${n}`,
    mistakesHeader: (n: string) => `Erreurs fréquentes avec ${n}`,
    faqHeader: (n: string) => `FAQ ${n}`,
    ctaHeader: (n: string) => `Organiser un EVG avec ${n}`,
    ctaText: "Crée un événement en 30 secondes, invite l'équipe, vote les activités et partage les frais — tout dans une seule app.",
    ctaButton: "Créer un événement",
    relatedHeader: (cat: string) => `Plus d'activités ${cat}`,
    cityCtaLabel: "Voir le guide ville",
    bestForCount: 6,
    weatherDep: "⚠️ Dépend de la météo — prévoir un plan B intérieur",
    weatherInd: "✓ Indépendant de la météo — pas de plan B",
    difficultyLabel: "Difficulté",
    difficulty: { low: "Facile (tous niveaux)", medium: "Moyenne", high: "Exigeante" },
    settingLabel: "Lieu",
    setting: { indoor: "Intérieur", outdoor: "Extérieur", both: "Intérieur + Extérieur" },
    factsLabels: {
      cost: "Prix par personne",
      group: "Taille du groupe",
      duration: "Durée",
      setting: "Lieu",
    },
    calcLink: "Utiliser le calculateur de budget complet",
  },
  it: {
    path: "/attivita/",
    label: "Attività Addio al Celibato",
    locale: "it_IT",
    htmlLang: "it-IT",
    titleTpl: (n: string) => `${n} per Addio al Celibato — Idee e Prezzi | EventBliss`,
    descriptionTpl: (n: string) => `${n} come attività per addio: prezzo a persona, gruppo ideale, migliori città. Organizza con EventBliss.`,
    activityFor: "come attività di addio al celibato",
    factsHeader: (n: string) => `Info su ${n}`,
    whenHeader: (n: string) => `Quando scegliere ${n}?`,
    whoHeader: "Per quali crew?",
    costHeader: (n: string) => `Calcolare ${n}`,
    citiesHeader: (n: string) => `Migliori città per ${n}`,
    mistakesHeader: (n: string) => `Errori comuni con ${n}`,
    faqHeader: (n: string) => `Domande su ${n}`,
    ctaHeader: (n: string) => `Organizza un addio con ${n}`,
    ctaText: "Crea un evento in 30 secondi, invita il crew, vota le attività e dividi i costi — tutto in un'unica app.",
    ctaButton: "Crea evento",
    relatedHeader: (cat: string) => `Altre attività ${cat}`,
    cityCtaLabel: "Vedi guida città",
    bestForCount: 6,
    weatherDep: "⚠️ Dipende dal meteo — prevedere un piano B al chiuso",
    weatherInd: "✓ Indipendente dal meteo — nessun piano B necessario",
    difficultyLabel: "Difficoltà",
    difficulty: { low: "Facile (tutti i livelli)", medium: "Media", high: "Impegnativa" },
    settingLabel: "Ambiente",
    setting: { indoor: "Al chiuso", outdoor: "All'aperto", both: "Chiuso + Aperto" },
    factsLabels: {
      cost: "Prezzo a persona",
      group: "Dimensione gruppo",
      duration: "Durata",
      setting: "Ambiente",
    },
    calcLink: "Usa il calcolatore di budget completo",
  },
  pt: {
    path: "/atividades/",
    label: "Atividades para Despedida",
    locale: "pt_PT",
    htmlLang: "pt-PT",
    titleTpl: (n: string) => `${n} para Despedida de Solteiro — Ideias e Preços | EventBliss`,
    descriptionTpl: (n: string) => `${n} como atividade de despedida: preço por pessoa, grupo ideal, melhores cidades. Organiza com EventBliss.`,
    activityFor: "como atividade de despedida",
    factsHeader: (n: string) => `Sobre ${n}`,
    whenHeader: (n: string) => `Quando vale a pena ${n}?`,
    whoHeader: "Para que grupos?",
    costHeader: (n: string) => `Como calcular ${n}`,
    citiesHeader: (n: string) => `Melhores cidades para ${n}`,
    mistakesHeader: (n: string) => `Erros comuns com ${n}`,
    faqHeader: (n: string) => `Perguntas sobre ${n}`,
    ctaHeader: (n: string) => `Organizar despedida com ${n}`,
    ctaText: "Cria evento em 30 segundos, convida o grupo, vota nas atividades e divide os custos — tudo numa app.",
    ctaButton: "Criar evento",
    relatedHeader: (cat: string) => `Mais atividades ${cat}`,
    cityCtaLabel: "Ver guia da cidade",
    bestForCount: 6,
    weatherDep: "⚠️ Depende do clima — prepara plano B interior",
    weatherInd: "✓ Independente do clima — sem plano B necessário",
    difficultyLabel: "Dificuldade",
    difficulty: { low: "Fácil (todos os níveis)", medium: "Média", high: "Exigente" },
    settingLabel: "Local",
    setting: { indoor: "Interior", outdoor: "Exterior", both: "Interior + Exterior" },
    factsLabels: {
      cost: "Preço por pessoa",
      group: "Tamanho do grupo",
      duration: "Duração",
      setting: "Local",
    },
    calcLink: "Usar a calculadora de orçamento completa",
  },
  nl: {
    path: "/activiteiten/",
    label: "Vrijgezellen-Activiteiten",
    locale: "nl_NL",
    htmlLang: "nl-NL",
    titleTpl: (n: string) => `${n} voor Vrijgezellenfeest — Ideeën en Prijzen | EventBliss`,
    descriptionTpl: (n: string) => `${n} als vrijgezellenactiviteit: prijs per persoon, ideale groepsgrootte, beste steden. Plan met EventBliss.`,
    activityFor: "als vrijgezellenactiviteit",
    factsHeader: (n: string) => `Feiten over ${n}`,
    whenHeader: (n: string) => `Wanneer past ${n}?`,
    whoHeader: "Voor welke crews?",
    costHeader: (n: string) => `${n} budgetteren`,
    citiesHeader: (n: string) => `Topsteden voor ${n}`,
    mistakesHeader: (n: string) => `Veelgemaakte fouten bij ${n}`,
    faqHeader: (n: string) => `FAQ over ${n}`,
    ctaHeader: (n: string) => `Vrijgezellenfeest plannen met ${n}`,
    ctaText: "Maak een event in 30 seconden, nodig de crew uit, stem over activiteiten en deel kosten — alles in één app.",
    ctaButton: "Event aanmaken",
    relatedHeader: (cat: string) => `Meer ${cat}-activiteiten`,
    cityCtaLabel: "Bekijk stadsgids",
    bestForCount: 6,
    weatherDep: "⚠️ Weersafhankelijk — heb een indoor plan B",
    weatherInd: "✓ Weersonafhankelijk — geen plan B nodig",
    difficultyLabel: "Moeilijkheid",
    difficulty: { low: "Makkelijk (elk niveau)", medium: "Gemiddeld", high: "Uitdagend" },
    settingLabel: "Locatie",
    setting: { indoor: "Binnen", outdoor: "Buiten", both: "Binnen + Buiten" },
    factsLabels: {
      cost: "Prijs per persoon",
      group: "Groepsgrootte",
      duration: "Duur",
      setting: "Locatie",
    },
    calcLink: "Gebruik de volledige budgetcalculator",
  },
  pl: {
    path: "/atrakcje/",
    label: "Atrakcje na Wieczór Kawalerski",
    locale: "pl_PL",
    htmlLang: "pl-PL",
    titleTpl: (n: string) => `${n} na Wieczór Kawalerski — Pomysły i Ceny | EventBliss`,
    descriptionTpl: (n: string) => `${n} jako atrakcja wieczoru kawalerskiego: cena za osobę, idealna grupa, najlepsze miasta. Planuj z EventBliss.`,
    activityFor: "jako atrakcja wieczoru kawalerskiego",
    factsHeader: (n: string) => `Fakty o ${n}`,
    whenHeader: (n: string) => `Kiedy warto ${n}?`,
    whoHeader: "Dla jakich ekip?",
    costHeader: (n: string) => `Jak skalkulować ${n}`,
    citiesHeader: (n: string) => `Najlepsze miasta na ${n}`,
    mistakesHeader: (n: string) => `Częste błędy z ${n}`,
    faqHeader: (n: string) => `Pytania o ${n}`,
    ctaHeader: (n: string) => `Zaplanuj wieczór z ${n}`,
    ctaText: "Utwórz wydarzenie w 30 sekund, zaproś ekipę, głosujcie nad atrakcjami i dzielcie koszty — wszystko w jednej aplikacji.",
    ctaButton: "Utwórz wydarzenie",
    relatedHeader: (cat: string) => `Więcej atrakcji ${cat}`,
    cityCtaLabel: "Zobacz przewodnik miasta",
    bestForCount: 6,
    weatherDep: "⚠️ Zależne od pogody — miej plan B w pomieszczeniu",
    weatherInd: "✓ Niezależne od pogody — bez planu B",
    difficultyLabel: "Trudność",
    difficulty: { low: "Łatwe (każdy poziom)", medium: "Średnie", high: "Wymagające" },
    settingLabel: "Miejsce",
    setting: { indoor: "Wewnątrz", outdoor: "Na zewnątrz", both: "Wewnątrz + Na zewnątrz" },
    factsLabels: {
      cost: "Cena za osobę",
      group: "Wielkość grupy",
      duration: "Czas trwania",
      setting: "Miejsce",
    },
    calcLink: "Użyj pełnego kalkulatora budżetu",
  },
  tr: {
    path: "/aktiviteler/",
    label: "Bekarlığa Veda Aktiviteleri",
    locale: "tr_TR",
    htmlLang: "tr-TR",
    titleTpl: (n: string) => `Bekarlığa Veda için ${n} — Fikirler ve Fiyatlar | EventBliss`,
    descriptionTpl: (n: string) => `Bekarlığa veda aktivitesi olarak ${n}: kişi başı fiyat, ideal grup, en iyi şehirler. EventBliss ile planlayın.`,
    activityFor: "bekarlığa veda aktivitesi olarak",
    factsHeader: (n: string) => `${n} hakkında bilgiler`,
    whenHeader: (n: string) => `${n} ne zaman uygun?`,
    whoHeader: "Hangi ekipler için?",
    costHeader: (n: string) => `${n} maliyetini hesaplama`,
    citiesHeader: (n: string) => `${n} için en iyi şehirler`,
    mistakesHeader: (n: string) => `${n} ile sık hatalar`,
    faqHeader: (n: string) => `${n} SSS`,
    ctaHeader: (n: string) => `${n} ile bekarlığa veda planla`,
    ctaText: "30 saniyede etkinlik oluştur, ekibini davet et, aktiviteleri oyla ve maliyetleri böl — hepsi tek bir uygulamada.",
    ctaButton: "Etkinlik oluştur",
    relatedHeader: (cat: string) => `Daha fazla ${cat} aktivitesi`,
    cityCtaLabel: "Şehir rehberini gör",
    bestForCount: 6,
    weatherDep: "⚠️ Hava bağımlı — kapalı plan B hazırla",
    weatherInd: "✓ Havadan bağımsız — plan B gerekmez",
    difficultyLabel: "Zorluk",
    difficulty: { low: "Kolay (her seviye)", medium: "Orta", high: "Zorlu" },
    settingLabel: "Yer",
    setting: { indoor: "Kapalı", outdoor: "Açık", both: "Kapalı + Açık" },
    factsLabels: {
      cost: "Kişi başı fiyat",
      group: "Grup boyutu",
      duration: "Süre",
      setting: "Yer",
    },
    calcLink: "Tam bütçe hesaplayıcıyı kullan",
  },
} as const;

// ──────────────────────────────────────────────────────────────────
// Category frameworks per language — 10 categories × 7 languages
// ──────────────────────────────────────────────────────────────────

// Helper: build a framework with consistent shape
const fw = (data: {
  hookSentence: string;
  introTpl: (label: string) => string;
  whenSection: string[];
  whoSection: string[];
  costExplain: string;
  commonMistakes: string[];
  faqsTpl: (label: string) => Array<{ q: string; a: string }>;
}): CategoryFrameworkIntl => ({
  hookSentence: data.hookSentence,
  introFor: (a) => data.introTpl(a.label),
  whenSection: data.whenSection,
  whoSection: data.whoSection,
  costExplain: data.costExplain,
  commonMistakes: data.commonMistakes,
  faqs: (a) => data.faqsTpl(a.label),
});

// ──────────────────────────────────────────────────────────────────
// ESPAÑOL
// ──────────────────────────────────────────────────────────────────
const ES: Record<ActivityCategory, CategoryFrameworkIntl> = {
  action: fw({
    hookSentence: "Las actividades de acción son la columna vertebral de toda despedida — adrenalina, competición, material de anécdotas garantizado.",
    introTpl: (l) => `${l} es una de las actividades de acción más solicitadas para despedidas de soltero, despedidas de soltera y viajes de grupo. Funciona por competición clara, éxitos inmediatos y dinámica de grupo — ideal como highlight del Día 2.`,
    whenSection: [
      "Programa de Día 2 cuando el grupo está caliente y quiere acción antes de la noche",
      "Separación limpia de la fiesta — acción antes, bar después",
      "Con lluvia las opciones indoor superan a las outdoor",
    ],
    whoSection: [
      "Grupos de 6+ personas para buena dinámica",
      "Novios con espíritu competitivo",
      "Funciona con niveles de forma física mixtos",
    ],
    costExplain: "Las actividades de acción cuestan típicamente entre 30 y 90 € por persona para 1–2 horas. Opciones premium (drift, skydiving) superan los 150 €. Reservar 4–8 semanas antes asegura slots en temporada alta.",
    commonMistakes: [
      "Reservar muy corto: 60 min no bastan — mínimo 90 min para la experiencia completa.",
      "Justo después del desayuno — deja tiempo para procesar la noche anterior.",
      "Sin plan B para mal tiempo si es exterior — ten alternativa indoor reservable.",
    ],
    faqsTpl: (l) => [
      { q: `¿Cuánto cuesta ${l} para un grupo?`, a: `${l} cuesta típicamente 30–90 € por persona para 60–120 minutos. Reservas en grupo de 8+ suelen tener descuentos del 10–20 %.` },
      { q: `¿Cuántas personas son ideales para ${l}?`, a: `Óptimo 6–12 personas. Menos de 6 la dinámica se pierde, más de 16 la logística se complica. Grupos grandes se pueden dividir en dos slots.` },
      { q: `¿Con cuánta antelación reservar ${l}?`, a: `Para mayo–septiembre: 4–8 semanas. Fuera de temporada 1–2 semanas. Slots populares (sábado mañana) son los primeros en llenarse.` },
    ],
  }),
  outdoor: fw({
    hookSentence: "Las actividades al aire libre combinan naturaleza y dinámica de grupo — del agua a la montaña, fijo en programas de despedida.",
    introTpl: (l) => `${l} es una de las actividades outdoor más populares para despedidas y funciona para cualquier nivel físico. Naturaleza como fondo de fotos, aire fresco para recuperarse de la noche, opción de picnic o cerveza.`,
    whenSection: [
      "Mayo–septiembre como temporada principal",
      "Domingo por la mañana como terapia anti-resaca",
      "Highlight diurno para grupos con afinidad por la naturaleza",
    ],
    whoSection: [
      "Grupos con cámara y amor por la naturaleza",
      "Niveles de forma física mixtos (excepto variantes hardcore)",
      "Novios que quieren llegar en forma a la boda",
    ],
    costExplain: "Las actividades outdoor cuestan típicamente 30–80 € por persona con equipo. Charter de barco y premium 100–250 €. El clima es el factor de riesgo principal — un seguro de cancelación vale la pena.",
    commonMistakes: [
      "Olvidar revisión del equipo — ropa para clima frecuentemente necesaria.",
      "Sin plan B para lluvia — la mayoría de actividades no funcionan mojadas.",
      "Subestimar el tiempo — outdoor con desplazamiento dobla la duración.",
    ],
    faqsTpl: (l) => [
      { q: `¿Mejor época para ${l}?`, a: `Mayo a septiembre para clima estable. En verano slots de temporada alta van temprano, primavera/otoño más flexibles y baratos.` },
      { q: `¿Necesitamos experiencia previa para ${l}?`, a: `No, la mayoría de operadores ofrecen cursos rápidos de 30 minutos para principiantes. Variantes premium pueden requerir base.` },
      { q: `¿Qué pasa si llueve?`, a: `La mayoría de operadores tienen reglas de cancelación o reprogramación. Para despedidas siempre mantén plan B indoor — karts, búlder, escape room.` },
    ],
  }),
  chill: fw({
    hookSentence: "Las actividades chill son la categoría subestimada de despedida — perfectas para domingo, recuperación o grupos mixtos.",
    introTpl: (l) => `${l} funciona diferente del programa de acción: sin adrenalina, sino relajación con dinámica de grupo. Ideal como programa de domingo tras una noche larga o como slot pre-boda.`,
    whenSection: [
      "Domingo por la mañana como terapia anti-resaca",
      "Programa pre-boda para descansar",
      "Grupos mixtos con suegros o familiares",
    ],
    whoSection: [
      "Crews tras una noche dura",
      "Grupos mixtos con energías diversas",
      "Novios que quieren descansar antes de la boda",
    ],
    costExplain: "Las actividades chill cuestan típicamente 25–80 € por persona. Premium wellness hasta 150 €. Reservables a corto plazo — sin presión de antelación como acción.",
    commonMistakes: [
      "Demasiado corto — wellness/spa necesita 2–3 horas para efecto real.",
      "Comer demasiado antes — muchos programas chill van mejor después del almuerzo.",
      "Expectativas no alineadas — algunos grupos encuentran chill aburrido, comprobar antes.",
    ],
    faqsTpl: (l) => [
      { q: `¿${l} funciona tras una noche dura?`, a: `Al contrario — suele ser el mejor momento. ${l} ayuda al grupo a procesar la noche anterior y recargar energía.` },
      { q: `¿Tamaño ideal de grupo?`, a: `4–10 personas funcionan mejor. Grupos más grandes son posibles pero pierden intimidad.` },
      { q: `¿Cuánto cuesta ${l} por persona?`, a: `Típicamente 25–80 € por persona para 90–180 minutos. Wellness premium hasta 150 €.` },
    ],
  }),
  food: fw({
    hookSentence: "Las actividades food anclan despedidas en comida y bebida — de tour de cervecería a clase de cocina, el mejor material de recuerdo.",
    introTpl: (l) => `${l} es una de las actividades de despedida más infravaloradas: experiencia compartida alrededor de comida o bebida que es a la vez programa y catering. Para grupos que quieren más que actividades y bar.`,
    whenSection: [
      "Programa de mediodía o slot de tarde temprana",
      "Sustituto de catering en días largos",
      "Alternativa de brunch dominical",
    ],
    whoSection: [
      "Crews foodies con orientación al disfrute",
      "Novios que cocinan o comen bien",
      "Grupos mixtos — experiencias gastronómicas funcionan en todas las edades",
    ],
    costExplain: "Actividades food cuestan típicamente 35–90 € por persona. Premium (menús degustación, chef privado) desde 120 €. Reserva 3–6 semanas antes recomendada, especialmente en temporada alta.",
    commonMistakes: [
      "No aclarar alergias/preferencias antes — puede ser freno de ambiente.",
      "Programar muy tarde — quien tiene hambre se impacienta.",
      "Olvidar reservar — restaurantes top tienen 4–8 semanas de antelación.",
    ],
    faqsTpl: (l) => [
      { q: `¿Cuánto tiempo necesita ${l}?`, a: `Típicamente 2–3 horas con tiempo de disfrute. Clases de cocina 3–4 horas, tours de cata 2 horas.` },
      { q: `¿Se pueden adaptar alergias o vegetarianismo?`, a: `Indica al reservar. La mayoría son flexibles, pero 1–2 semanas de antelación para peticiones especiales es sensato.` },
      { q: `¿Cuánto cuesta ${l}?`, a: `Típicamente 35–90 € por persona con comida. Variantes premium con menú elaborado desde 120 €.` },
    ],
  }),
  entertainment: fw({
    hookSentence: "Las actividades entertainment son los comodines de despedida — rápidas de reservar, siempre aptas para grupos, con efecto historia integrado.",
    introTpl: (l) => `${l} es una actividad clásica de despedida que funciona sin experiencia previa, con cualquier tamaño de grupo y en cualquier ambiente. Ideal como filler entre programas principales o como apertura nocturna.`,
    whenSection: [
      "Bloque entre actividad y cena",
      "Cuando el clima o ambiente cambia los planes — plan B de emergencia",
      "Programa espontáneo el mismo día",
    ],
    whoSection: [
      "Todo tipo de configuración de grupo",
      "También para generaciones mixtas",
      "Especialmente para novios sin enfoque deportivo",
    ],
    costExplain: "Las actividades entertainment suelen costar 25–65 € por persona para 60–120 minutos. Reservables a corto plazo en la mayoría de ciudades.",
    commonMistakes: [
      "Planificar demasiado largo — 90 min bastan para la mayoría.",
      "Subestimar la preparación — algunas requieren briefing del grupo.",
      "Operadores aislados — mejor locales establecidos con rutina de grupos.",
    ],
    faqsTpl: (l) => [
      { q: `¿Podemos reservar ${l} de un día para otro?`, a: `Generalmente sí, sobre todo días laborables o fuera de temporada. Slots de finde mayo–septiembre 2–4 semanas antes.` },
      { q: `¿Tamaño ideal de grupo para ${l}?`, a: `Funciona desde 4 personas. Óptimo 8–14 para buena dinámica. Más de 20 la logística se complica.` },
      { q: `¿Cuánto cuesta ${l}?`, a: `Típicamente 25–65 € por persona para 60–120 minutos de programa.` },
    ],
  }),
  creative: fw({
    hookSentence: "Las actividades creativas sorprenden a los grupos y producen el mejor material de fotos — de cerámica a pintura.",
    introTpl: (l) => `${l} es la categoría creativa infravalorada de despedida: el grupo crea algo, aprende una nueva habilidad y suele llevarse un resultado físico. Eso convierte a ${l} en la fuente de recuerdos más duradera.`,
    whenSection: [
      "Día 2 como programa más tranquilo",
      "Slot de brunch con mimosas y actividad creativa",
      "Programa pre-boda como reducción de estrés",
    ],
    whoSection: [
      "Crews con afinidad foodie o design",
      "Novios que aprecian la artesanía",
      "Géneros / generaciones mixtas",
    ],
    costExplain: "Actividades creativas cuestan típicamente 40–80 € por persona con materiales. Workshops premium con profesional hasta 120 €. Reservar 3–5 semanas antes.",
    commonMistakes: [
      "Grupos puramente de escalada suelen no disfrutar creativas.",
      "Subestimar duración del workshop — suelen ser 2–3 horas, no 1.",
      "No aclarar posibilidades de llevarse el material.",
    ],
    faqsTpl: (l) => [
      { q: `¿Necesitamos conocimientos previos para ${l}?`, a: `No, los operadores están preparados para principiantes. Crashkurs de 15 min al inicio basta para algo presentable.` },
      { q: `¿Cuánto dura ${l} típicamente?`, a: `2–3 horas para un resultado presentable. Con pausas y degustación a menudo 3,5 horas totales.` },
      { q: `¿Cuánto cuesta ${l} por persona?`, a: `Típicamente 40–80 € por persona con materiales. Workshops premium hasta 120 €.` },
    ],
  }),
  sport: fw({
    hookSentence: "Las actividades de deporte son fijos para crews activas — competición, fitness, team-building en un solo bloque.",
    introTpl: (l) => `${l} da a la despedida competición estructurada con reglas claras, feedback inmediato y momentos foto-genéticos. Funciona mejor en Día 2 cuando el grupo está caliente.`,
    whenSection: [
      "Programa de Día 2 para crews activas",
      "Slot de mañana en despedidas de verano",
      "Como preparación fitness pre-boda",
    ],
    whoSection: [
      "Crews deportivas con ADN competitivo",
      "Novios con background deportivo",
      "Crews que quieren ser activas en verano",
    ],
    costExplain: "Actividades de deporte 25–75 € por persona para 90–180 minutos. Equipo normalmente incluido.",
    commonMistakes: [
      "Sobreestimar nivel deportivo — comprobar opciones principiantes.",
      "No aclarar equipo antes — espinilleras, zapatos.",
      "No considerar no-deportistas — ofrecer programa B paralelo.",
    ],
    faqsTpl: (l) => [
      { q: `¿Necesitamos experiencia deportiva para ${l}?`, a: `No, ${l} tiene reglas básicas e instrucción para principiantes. Experiencia previa es un plus, no requisito.` },
      { q: `¿Qué equipo se necesita?`, a: `Normalmente todo incluido en la reserva. Basta con ropa deportiva y zapatos cerrados.` },
      { q: `¿Cuánto cuesta ${l}?`, a: `Típicamente 25–75 € por persona para 90–180 minutos con equipo.` },
    ],
  }),
  nightlife: fw({
    hookSentence: "Los programas de nightlife son el corazón de toda despedida — de bar-crawls curados a entradas VIP de club.",
    introTpl: (l) => `${l} es uno de los programas centrales de nightlife en despedidas. La elección correcta de variante (bar-crawl, club, karaoke) decide el ambiente de la noche más que ningún otro programa.`,
    whenSection: [
      "Noche principal de la despedida — normalmente sábado",
      "Día 1 como noche de llegada con pre-drinks",
      "Domingo en despedidas largas",
    ],
    whoSection: [
      "Toda crew que quiere experiencia clásica de despedida",
      "Novios que valoran el nightlife",
      "También crews maduras con tono adaptado",
    ],
    costExplain: "Programas de nightlife 40–120 € por persona para 4–6 horas. Premium (VIP, bottle service) desde 150 €.",
    commonMistakes: [
      "Olvidar slot de pre-drinks — ahorra dinero y calibra el ambiente.",
      "Ignorar estrategia de porteros — crews masculinas suelen ser rechazadas.",
      "Sin bar de backup si el principal está lleno.",
    ],
    faqsTpl: (l) => [
      { q: `¿A qué hora empezar ${l}?`, a: `En DACH 20–22h para bares, 23–01h para clubes. En España/Italia más tarde (22–24h bares, 01–03h clubes).` },
      { q: `¿Cómo entrar como grupo masculino a buenos clubes?`, a: `Reservas con bottle service evitan la selección. Alternativa con grupo mixto o subgrupos pequeños.` },
      { q: `¿Cuánto cuesta ${l} por persona?`, a: `Típicamente 40–120 € por persona para 4–6 horas con entradas y bebidas.` },
    ],
  }),
  culture: fw({
    hookSentence: "Las actividades de cultura dan profundidad a las despedidas — museo, tour guiado, ruta histórica como contrapeso a la escalada.",
    introTpl: (l) => `${l} es el pilar cultural para despedidas que quieren más que escalar. 90 minutos bastan para justificarse culturalmente y producen las fotos que se pueden enseñar a la familia.`,
    whenSection: [
      "Programa diurno con ambición cultural",
      "Slot matinal antes de escalar",
      "Programa de domingo por la mañana",
    ],
    whoSection: [
      "Crews con ambición cultural",
      "Novios con afinidad histórica",
      "Grupos mixtos con padres incluidos",
    ],
    costExplain: "Actividades de cultura 15–40 € por persona para 90–180 minutos. Tours premium temáticos hasta 60 €.",
    commonMistakes: [
      "Programas demasiado largos — 2 horas bastan para la mayoría.",
      "No reservar entradas antes — museos top usan slots.",
      "No comprobar ánimo del grupo — crews de escalada suelen no querer museos.",
    ],
    faqsTpl: (l) => [
      { q: `¿Cuánto debe durar ${l}?`, a: `90–120 minutos es el sweet spot. Más largo suele aburrir a crews de despedida.` },
      { q: `¿Reservamos entradas antes?`, a: `En sitios populares (museos, tours guiados) sí, mín. 1 semana antes. Tour gratuito espontáneo suele ser opción.` },
      { q: `¿Cuánto cuesta ${l}?`, a: `Típicamente 15–40 € por persona. Tours premium hasta 60 €.` },
    ],
  }),
  adventure: fw({
    hookSentence: "Las actividades de aventura son la clase XL — de skydiving a parapente, historias de despedida únicas.",
    introTpl: (l) => `${l} pertenece a la clase premium adventure. Producen los recuerdos más intensos pero requieren coraje, presupuesto y planificación. No para toda crew, pero cuando encaja: highlight absoluto.`,
    whenSection: [
      "Día 2 como programa principal",
      "Mayo–septiembre para aventuras outdoor",
      "Reserva 4–8 semanas antes obligatoria",
    ],
    whoSection: [
      "Crews dispuestas al riesgo con afinidad adventure",
      "Novios que quieren saltar una vez en su vida",
      "Crews con presupuesto alto (100–250 € por persona por actividad)",
    ],
    costExplain: "Actividades adventure 100–250 € por persona. Premium (skydiving, helicóptero) desde 250 €. Comprueba el seguro del operador.",
    commonMistakes: [
      "No leer letra pequeña del seguro — adventure tiene reglas especiales.",
      "Subestimar dependencia del clima — muchas tienen 50 % de probabilidad de cancelación.",
      "No incluir crews no-adventure — planificar programa B paralelo.",
    ],
    faqsTpl: (l) => [
      { q: `¿Necesitamos experiencia previa para ${l}?`, a: `Normalmente no, hay variantes tándem para la mayoría. Body-check y briefing de seguridad son obligatorios.` },
      { q: `¿Qué pasa con mal tiempo?`, a: `Adventure tiene reglas especiales. Antes de reservar aclara condiciones de cancelación. Plan B indoor reservable paralelo.` },
      { q: `¿Cuánto cuesta ${l} por persona?`, a: `Típicamente 100–250 € por persona. Experiencias premium por encima.` },
    ],
  }),
};

// ──────────────────────────────────────────────────────────────────
// FRANÇAIS
// ──────────────────────────────────────────────────────────────────
const FR: Record<ActivityCategory, CategoryFrameworkIntl> = {
  action: fw({
    hookSentence: "Les activités action sont la colonne vertébrale de tout EVG — adrénaline, compétition, matériel d'anecdotes garanti.",
    introTpl: (l) => `${l} est l'une des activités action les plus demandées pour EVG, EVJF et voyages de groupe. Le format fonctionne via compétition claire, succès immédiats et dynamique de groupe — idéal en highlight de Jour 2.`,
    whenSection: [
      "Programme Jour 2 quand l'équipe est chaude et veut de l'action avant la soirée",
      "Séparation propre du programme fête — action avant, bar après",
      "Sous la pluie l'indoor bat l'outdoor",
    ],
    whoSection: [
      "Crews de 6+ pour bonne dynamique",
      "Futurs mariés avec esprit compétitif",
      "Fonctionne avec niveaux de forme mixtes",
    ],
    costExplain: "Les activités action coûtent typiquement 30–90 € par personne pour 1–2 heures. Options premium (drift, skydiving) >150 €. Réserver 4–8 semaines avant assure les créneaux en haute saison.",
    commonMistakes: [
      "Réserver trop court : 60 min ne suffisent pas — minimum 90 min pour l'expérience complète.",
      "Juste après le petit-déjeuner — laissez du temps pour digérer la veille.",
      "Pas de plan B météo en outdoor — gardez une alternative indoor réservable.",
    ],
    faqsTpl: (l) => [
      { q: `Combien coûte ${l} pour un EVG ?`, a: `${l} coûte typiquement 30–90 € par personne pour 60–120 minutes. Réservations de groupe à 8+ donnent souvent 10–20 % de réduction.` },
      { q: `Combien de personnes idéal pour ${l} ?`, a: `Optimum 6–12 personnes. Moins de 6 la dynamique se perd, plus de 16 la logistique devient lourde. Grands groupes peuvent splitter en deux créneaux.` },
      { q: `Avec combien d'avance réserver ${l} ?`, a: `Pour mai–septembre : 4–8 semaines. Hors saison 1–2 semaines suffisent. Créneaux populaires (samedi matin) partent en premier.` },
    ],
  }),
  outdoor: fw({
    hookSentence: "Les activités outdoor combinent nature et dynamique de groupe — de l'eau à la montagne, incontournables en EVG.",
    introTpl: (l) => `${l} est l'une des activités outdoor les plus populaires en EVG et fonctionne pour toute crew quelle que soit sa forme. Nature en fond pour photos, air frais pour récupérer de la veille, option pique-nique ou stop bière.`,
    whenSection: [
      "Mai–septembre comme haute saison",
      "Dimanche matin comme thérapie post-cuite",
      "Highlight diurne pour crews amoureuses de la nature",
    ],
    whoSection: [
      "Crews avec affinité nature et photo",
      "Niveaux de forme mixtes (sauf variantes hardcore)",
      "Futurs mariés voulant être en forme pour le mariage",
    ],
    costExplain: "Activités outdoor coûtent typiquement 30–80 € par personne avec équipement. Charter bateau et premium 100–250 €. La météo est le facteur de risque — une assurance annulation vaut le coup.",
    commonMistakes: [
      "Oublier le check équipement — vêtements adaptés souvent nécessaires.",
      "Pas de plan B pluie — la plupart des activités ne fonctionnent pas sous la pluie.",
      "Sous-estimer le temps — outdoor avec trajet double souvent en durée.",
    ],
    faqsTpl: (l) => [
      { q: `Meilleure saison pour ${l} ?`, a: `Mai à septembre pour météo stable. En été créneaux à réserver tôt, printemps/automne plus flexibles et moins chers.` },
      { q: `Faut-il de l'expérience pour ${l} ?`, a: `Non, la plupart des opérateurs proposent un crash-cours de 30 minutes pour débutants. Les variantes premium demandent une base.` },
      { q: `Et s'il pleut ?`, a: `La plupart des opérateurs ont des règles d'annulation ou de report. Pour un EVG gardez toujours un plan B indoor — karts, escalade, escape room.` },
    ],
  }),
  chill: fw({
    hookSentence: "Les activités chill sont la catégorie EVG sous-estimée — parfaites pour dimanche matin, récupération post-cuite ou crews mixtes.",
    introTpl: (l) => `${l} fonctionne différemment d'un programme action : pas d'adrénaline mais relaxation avec dynamique de groupe. Idéal en programme du dimanche après une longue nuit ou en créneau de récupération pré-mariage.`,
    whenSection: [
      "Dimanche matin comme thérapie post-cuite",
      "Programme pré-mariage pour souffler",
      "Crews mixtes (avec beaux-parents)",
    ],
    whoSection: [
      "Crews après une nuit dure",
      "Groupes mixtes avec énergies différentes",
      "Futurs mariés voulant se reposer avant le mariage",
    ],
    costExplain: "Activités chill coûtent typiquement 25–80 € par personne. Wellness premium jusqu'à 150 €. Réservables tardivement — pas de pression d'anticipation comme en action.",
    commonMistakes: [
      "Trop court — wellness/spa demande 2–3 heures pour un effet réel.",
      "Manger trop avant — beaucoup de programmes chill sont mieux après le déjeuner.",
      "Décalage d'attentes — certaines crews trouvent chill ennuyeux, vérifier avant.",
    ],
    faqsTpl: (l) => [
      { q: `${l} fonctionne-t-il après une nuit dure ?`, a: `Au contraire — c'est souvent le meilleur moment. ${l} aide la crew à digérer la veille et à repartir avec de l'énergie.` },
      { q: `Taille idéale du groupe ?`, a: `4–10 personnes marchent le mieux. Plus grand logistiquement possible mais l'ambiance perd en intimité.` },
      { q: `Combien coûte ${l} par personne ?`, a: `Typiquement 25–80 € par personne pour 90–180 minutes. Premium wellness jusqu'à 150 €.` },
    ],
  }),
  food: fw({
    hookSentence: "Les activités food ancrent un EVG dans le manger et le boire — de la tour brasserie au cours de cuisine, le meilleur matériel de souvenirs.",
    introTpl: (l) => `${l} est l'une des activités EVG les plus sous-estimées : expérience partagée autour de bouffe ou boisson qui fait office de programme + restauration. Pour crews qui veulent plus qu'activités et bar.`,
    whenSection: [
      "Programme déjeuner ou créneau début soirée",
      "Remplacement restauration sur journées longues",
      "Alternative brunch dominical",
    ],
    whoSection: [
      "Crews foodies orientées plaisir",
      "Futurs mariés qui cuisinent ou aiment manger",
      "Crews mixtes — food fonctionne pour tous âges",
    ],
    costExplain: "Activités food 35–90 € par personne. Premium (menu dégustation, chef privé) dès 120 €. Réservation 3–6 semaines avant recommandée, surtout en haute saison.",
    commonMistakes: [
      "Pas clarifier les allergies avant — peut casser l'ambiance.",
      "Programmer trop tard — qui a faim s'impatiente.",
      "Oublier de réserver — restaurants top ont 4–8 semaines d'attente.",
    ],
    faqsTpl: (l) => [
      { q: `Combien de temps prend ${l} ?`, a: `Typiquement 2–3 heures avec temps de dégustation. Cours de cuisine 3–4 heures, dégustations 2 heures.` },
      { q: `Allergies et régimes spéciaux pris en compte ?`, a: `Indiquez à la réservation. La plupart sont flexibles, 1–2 semaines d'avance pour demandes spéciales.` },
      { q: `Combien coûte ${l} ?`, a: `Typiquement 35–90 € par personne avec repas. Premium menu élaboré dès 120 €.` },
    ],
  }),
  entertainment: fw({
    hookSentence: "Les activités entertainment sont les jokers EVG — vite réservables, toujours adaptées aux groupes, effet histoire intégré.",
    introTpl: (l) => `${l} est une activité EVG classique qui fonctionne sans expérience préalable, à n'importe quelle taille et ambiance. Idéal en filler entre programmes principaux ou en lancement de soirée.`,
    whenSection: [
      "Bloc entre activité et dîner",
      "Quand météo ou ambiance flingue le plan — plan B d'urgence",
      "Programme spontané le jour J",
    ],
    whoSection: [
      "Toute configuration de crew",
      "Aussi pour générations mixtes",
      "Notamment futurs mariés sans focus sport",
    ],
    costExplain: "Activités entertainment 25–65 € par personne pour 60–120 minutes. Réservables tard dans la plupart des villes.",
    commonMistakes: [
      "Prévoir trop long — 90 min suffisent pour la majorité.",
      "Sous-estimer la préparation — certaines demandent un briefing.",
      "Opérateur isolé — préférez des lieux établis habitués aux groupes.",
    ],
    faqsTpl: (l) => [
      { q: `Peut-on réserver ${l} au dernier moment ?`, a: `Souvent oui, surtout en semaine ou hors saison. Créneaux weekend mai–septembre 2–4 semaines avant.` },
      { q: `Taille de groupe pour ${l} ?`, a: `Marche dès 4 personnes. Optimum 8–14 pour bonne dynamique. Plus de 20 la logistique devient sport.` },
      { q: `Combien coûte ${l} ?`, a: `Typiquement 25–65 € par personne pour 60–120 minutes.` },
    ],
  }),
  creative: fw({
    hookSentence: "Les activités créatives surprennent les crews et produisent le meilleur matériel photo — de la poterie à la peinture.",
    introTpl: (l) => `${l} est la catégorie créative EVG sous-estimée : la crew fabrique quelque chose, apprend une compétence et repart souvent avec un résultat physique. ${l} produit le souvenir le plus durable.`,
    whenSection: [
      "Jour 2 comme programme plus posé",
      "Créneau brunch avec mimosas et création",
      "Programme pré-mariage anti-stress",
    ],
    whoSection: [
      "Crews avec affinité foodie ou design",
      "Futurs mariés qui apprécient l'artisanat",
      "Genres / générations mixtes",
    ],
    costExplain: "Activités créatives coûtent 40–80 € par personne avec matériel. Workshops premium avec pro jusqu'à 120 €. Réservation 3–5 semaines avant.",
    commonMistakes: [
      "Crews orientées pure escalation n'aiment souvent pas le créatif.",
      "Sous-estimer la durée — 2–3 heures, pas 1.",
      "Pas clarifier les conditions pour emporter le matériel.",
    ],
    faqsTpl: (l) => [
      { q: `Faut-il des connaissances pour ${l} ?`, a: `Non, les opérateurs gèrent les débutants. Crash-cours de 15 min au début suffit pour un résultat présentable.` },
      { q: `Combien dure ${l} ?`, a: `2–3 heures pour un résultat présentable. Avec pauses et dégustation souvent 3,5 heures total.` },
      { q: `Combien coûte ${l} par personne ?`, a: `Typiquement 40–80 € par personne avec matériel. Workshops pro premium jusqu'à 120 €.` },
    ],
  }),
  sport: fw({
    hookSentence: "Les activités sport sont obligatoires pour crews actives — compétition, fitness, team-building en un bloc.",
    introTpl: (l) => `${l} offre à l'EVG compétition structurée avec règles claires, feedback immédiat et moments photo-friendly. Marche mieux en Jour 2 quand la crew est chaude.`,
    whenSection: [
      "Programme Jour 2 pour crews actives",
      "Créneau matinal en EVG estival",
      "Préparation fitness pré-mariage",
    ],
    whoSection: [
      "Crews sportives à ADN compétitif",
      "Futurs mariés avec background sport",
      "Crews qui veulent être actives en été",
    ],
    costExplain: "Activités sport 25–75 € par personne pour 90–180 minutes. Équipement généralement inclus.",
    commonMistakes: [
      "Surestimer le niveau de la crew — vérifier les options débutants.",
      "Pas clarifier l'équipement avant — protège-tibias, chaussures.",
      "Oublier les non-sportifs — proposer un plan B en parallèle.",
    ],
    faqsTpl: (l) => [
      { q: `Faut-il de l'expérience sportive pour ${l} ?`, a: `Non, ${l} a des règles de base et une introduction débutant. Expérience est un plus, pas un must.` },
      { q: `Quel équipement nécessaire ?`, a: `Généralement tout inclus dans la résa. Vêtements de sport et chaussures fermées suffisent.` },
      { q: `Combien coûte ${l} ?`, a: `Typiquement 25–75 € par personne pour 90–180 minutes avec équipement.` },
    ],
  }),
  nightlife: fw({
    hookSentence: "Les programmes nightlife sont le cœur de tout EVG — du pub-crawl curé aux entrées VIP de club.",
    introTpl: (l) => `${l} est l'un des programmes nightlife centraux en EVG. Le bon choix de variante (bar-crawl, club, karaoké) décide de l'ambiance plus que n'importe quel autre programme.`,
    whenSection: [
      "Soirée principale — généralement samedi",
      "Jour 1 comme soirée d'arrivée avec pre-drinks",
      "Dimanche pour EVG longs",
    ],
    whoSection: [
      "Toutes les crews qui veulent du classique EVG",
      "Futurs mariés qui aiment sortir",
      "Aussi crews matures avec ton adapté",
    ],
    costExplain: "Programmes nightlife 40–120 € par personne pour 4–6h. Premium (VIP, bottle service) dès 150 €.",
    commonMistakes: [
      "Oublier le créneau pre-drinks — économise et cadre l'ambiance.",
      "Ignorer la stratégie videurs — groupes 100% mecs souvent refusés.",
      "Pas de bar de backup si le principal est plein.",
    ],
    faqsTpl: (l) => [
      { q: `À quelle heure démarrer ${l} ?`, a: `En DACH 20–22h pour bars, 23h–1h pour clubs. En Espagne/Italie plus tard (22h–24h bars, 1h–3h clubs).` },
      { q: `Comment entrer en club en groupe d'hommes ?`, a: `Réservation bottle service évite la sélection. Sinon groupe mixte ou sous-groupes plus petits.` },
      { q: `Combien coûte ${l} par personne ?`, a: `Typiquement 40–120 € par personne pour 4–6h avec entrées et boissons.` },
    ],
  }),
  culture: fw({
    hookSentence: "Les activités culture donnent de la profondeur à l'EVG — musée, visite guidée, tour historique en contrepoids à l'escalade.",
    introTpl: (l) => `${l} est le pilier culturel pour EVG qui veulent plus que l'escalade. 90 min suffisent pour se justifier culturellement et produire les seules photos montrables à la famille.`,
    whenSection: [
      "Programme diurne avec ambition culturelle",
      "Créneau matinal avant l'escalade",
      "Programme dominical matinal",
    ],
    whoSection: [
      "Crews avec ambition culturelle",
      "Futurs mariés avec affinité historique",
      "Groupes mixtes avec parents",
    ],
    costExplain: "Activités culture 15–40 € par personne pour 90–180 minutes. Visites premium thématiques jusqu'à 60 €.",
    commonMistakes: [
      "Programmes trop longs — 2 heures suffisent pour la plupart.",
      "Pas réserver de tickets avant — musées top ont des systèmes de créneaux.",
      "Pas vérifier l'humeur — crews escalation n'aiment souvent pas les musées.",
    ],
    faqsTpl: (l) => [
      { q: `Combien de temps doit durer ${l} ?`, a: `90–120 minutes c'est le sweet spot. Plus long souvent traîne pour les crews EVG.` },
      { q: `Faut-il pré-réserver ?`, a: `Pour lieux populaires (musées, tours guidés) oui, au moins 1 semaine avant. Tour gratuit spontané est souvent une option aussi.` },
      { q: `Combien coûte ${l} ?`, a: `Typiquement 15–40 € par personne. Visites premium jusqu'à 60 €.` },
    ],
  }),
  adventure: fw({
    hookSentence: "Les activités aventure sont la classe XL — du skydiving au parapente, histoires d'EVG uniques.",
    introTpl: (l) => `${l} appartient à la classe premium aventure. Ces activités produisent les souvenirs les plus intenses mais demandent courage, budget et bonne préparation. Pas pour toute crew, mais quand ça colle : highlight absolu.`,
    whenSection: [
      "Jour 2 comme programme principal",
      "Mai–septembre pour aventures outdoor",
      "Réservation 4–8 semaines avant impérative",
    ],
    whoSection: [
      "Crews tolérantes au risque",
      "Futurs mariés qui veulent sauter une fois dans leur vie",
      "Crews avec budget plus élevé (100–250 € par activité par personne)",
    ],
    costExplain: "Activités aventure 100–250 € par personne. Expériences premium (skydiving, hélico) dès 250 €. Vérifier l'assurance opérateur.",
    commonMistakes: [
      "Pas lire les petits caractères de l'assurance — aventure a des règles spéciales.",
      "Sous-estimer la dépendance météo — beaucoup ont 50% de probabilité d'annulation.",
      "Pas inclure les non-aventureux — prévoir un plan B parallèle.",
    ],
    faqsTpl: (l) => [
      { q: `Faut-il de l'expérience pour ${l} ?`, a: `Généralement non, des variantes tandem existent. Body-check et briefing sécurité sont obligatoires.` },
      { q: `Et si la météo est mauvaise ?`, a: `L'aventure a des règles spéciales. Avant de réserver clarifiez les conditions d'annulation. Plan B indoor en parallèle.` },
      { q: `Combien coûte ${l} par personne ?`, a: `Typiquement 100–250 € par personne. Premium au-delà.` },
    ],
  }),
};

// ──────────────────────────────────────────────────────────────────
// ITALIANO
// ──────────────────────────────────────────────────────────────────
const IT: Record<ActivityCategory, CategoryFrameworkIntl> = {
  action: fw({
    hookSentence: "Le attività d'azione sono la spina dorsale di ogni addio al celibato — adrenalina, competizione, storie garantite.",
    introTpl: (l) => `${l} è una delle attività action più richieste per addii, addii al nubilato e viaggi di gruppo. Funziona tramite competizione chiara, successi immediati e dinamica di gruppo — ideale come highlight di Giorno 2.`,
    whenSection: [
      "Programma di Giorno 2 quando il crew è caldo e vuole azione prima della serata",
      "Separazione netta dalla festa — azione prima, bar dopo",
      "Con la pioggia l'indoor batte l'outdoor",
    ],
    whoSection: [
      "Crew di 6+ persone per buona dinamica",
      "Futuri sposi con spirito competitivo",
      "Funziona con livelli di forma misti",
    ],
    costExplain: "Le attività action costano tipicamente 30–90 € a persona per 1–2 ore. Opzioni premium (drift, skydiving) superano i 150 €. Prenotare 4–8 settimane prima assicura slot in alta stagione.",
    commonMistakes: [
      "Prenotare troppo corto: 60 min non bastano — minimo 90 min per l'esperienza completa.",
      "Subito dopo colazione — lascia tempo per digerire la sera prima.",
      "Senza piano B per maltempo se outdoor — tieni un'alternativa indoor prenotabile.",
    ],
    faqsTpl: (l) => [
      { q: `Quanto costa ${l} per un gruppo?`, a: `${l} costa tipicamente 30–90 € a persona per 60–120 minuti. Prenotazioni di gruppo da 8+ spesso 10–20% di sconto.` },
      { q: `Quante persone ideale per ${l}?`, a: `Ottimale 6–12 persone. Sotto 6 la dinamica si perde, oltre 16 la logistica si complica. Gruppi grandi possono dividersi in due slot.` },
      { q: `Quanto in anticipo prenotare ${l}?`, a: `Maggio–settembre: 4–8 settimane. Fuori stagione 1–2 settimane. Slot popolari (sabato mattina) vanno via per primi.` },
    ],
  }),
  outdoor: fw({
    hookSentence: "Le attività outdoor combinano natura e dinamica di gruppo — dall'acqua alla montagna, fisse nei programmi di addio.",
    introTpl: (l) => `${l} è una delle attività outdoor più popolari per addii e funziona per qualsiasi crew. Natura come sfondo per le foto, aria fresca per recuperare dalla sera prima, opzione picnic o pausa birra.`,
    whenSection: [
      "Maggio–settembre come stagione principale",
      "Domenica mattina come terapia anti-sbornia",
      "Highlight diurno per crew amanti della natura",
    ],
    whoSection: [
      "Crew con affinità natura e fotografia",
      "Livelli di forma misti (eccetto varianti hardcore)",
      "Futuri sposi che vogliono essere in forma per il matrimonio",
    ],
    costExplain: "Attività outdoor 30–80 € a persona con attrezzatura. Charter barca e premium 100–250 €. Il meteo è il rischio principale — un'assicurazione cancellazione vale la pena.",
    commonMistakes: [
      "Dimenticare il check attrezzatura — abbigliamento adeguato spesso richiesto.",
      "Senza piano B per la pioggia — la maggior parte non funziona bagnata.",
      "Sottovalutare i tempi — outdoor con trasferimento spesso raddoppia.",
    ],
    faqsTpl: (l) => [
      { q: `Migliore stagione per ${l}?`, a: `Maggio–settembre per meteo stabile. In estate slot da prenotare presto, primavera/autunno più flessibili ed economici.` },
      { q: `Serve esperienza per ${l}?`, a: `No, la maggior parte degli operatori offre corsi rapidi di 30 minuti per principianti. Varianti premium richiedono base.` },
      { q: `Cosa succede se piove?`, a: `La maggior parte ha regole di cancellazione o riprogrammazione. Per addii tieni sempre un piano B indoor — kart, arrampicata, escape room.` },
    ],
  }),
  chill: fw({
    hookSentence: "Le attività chill sono la categoria sottovalutata di addio — perfette per domenica mattina, recupero post-sbornia o crew miste.",
    introTpl: (l) => `${l} funziona diversamente da un programma action: niente adrenalina ma rilassamento con dinamica di gruppo. Ideale come programma domenicale dopo una notte lunga o come slot di recupero pre-matrimonio.`,
    whenSection: [
      "Domenica mattina come terapia anti-sbornia",
      "Programma pre-matrimonio per riposare",
      "Crew miste con suoceri o parenti",
    ],
    whoSection: [
      "Crew dopo una nottataccia",
      "Gruppi misti con energie diverse",
      "Futuri sposi che vogliono recuperare prima del matrimonio",
    ],
    costExplain: "Attività chill 25–80 € a persona. Wellness premium fino a 150 €. Prenotabili tardi — nessuna pressione di anticipo come in action.",
    commonMistakes: [
      "Troppo corto — wellness/spa serve 2–3 ore per effetto reale.",
      "Mangiare troppo prima — molti programmi chill vanno meglio dopo pranzo.",
      "Aspettative non allineate — alcune crew trovano chill noioso, verifica prima.",
    ],
    faqsTpl: (l) => [
      { q: `${l} funziona dopo una nottataccia?`, a: `Al contrario — è spesso il momento migliore. ${l} aiuta il crew a smaltire la sera prima e ricaricare energia.` },
      { q: `Dimensione ideale del gruppo?`, a: `4–10 persone funzionano meglio. Gruppi più grandi possibili ma perdono intimità.` },
      { q: `Quanto costa ${l} a persona?`, a: `Tipicamente 25–80 € a persona per 90–180 minuti. Wellness premium fino a 150 €.` },
    ],
  }),
  food: fw({
    hookSentence: "Le attività food ancorano l'addio al mangiare e bere — da tour birrificio a corso di cucina, miglior materiale di ricordi.",
    introTpl: (l) => `${l} è una delle attività di addio più sottovalutate: esperienza condivisa attorno a cibo o bevande che è programma e ristorazione insieme. Per crew che vogliono più di attività e bar.`,
    whenSection: [
      "Programma pranzo o slot serata presto",
      "Sostituto ristorazione su giornate lunghe",
      "Alternativa brunch domenicale",
    ],
    whoSection: [
      "Crew foodie orientate al piacere",
      "Futuri sposi che cucinano o amano mangiare",
      "Crew miste — food funziona a tutte le età",
    ],
    costExplain: "Attività food 35–90 € a persona. Premium (menu degustazione, chef privato) da 120 €. Prenotazione 3–6 settimane prima consigliata, specie in alta stagione.",
    commonMistakes: [
      "Non chiarire allergie prima — può rovinare l'atmosfera.",
      "Programmare troppo tardi — chi ha fame si spazientisce.",
      "Dimenticare di prenotare — ristoranti top hanno 4–8 settimane di attesa.",
    ],
    faqsTpl: (l) => [
      { q: `Quanto tempo serve ${l}?`, a: `Tipicamente 2–3 ore con tempo di degustazione. Corsi cucina 3–4 ore, tour degustazione 2 ore.` },
      { q: `Allergie e vegetariani gestiti?`, a: `Indica al momento della prenotazione. Quasi tutti sono flessibili, 1–2 settimane di anticipo per richieste speciali.` },
      { q: `Quanto costa ${l}?`, a: `Tipicamente 35–90 € a persona con cibo. Premium con menu elaborato da 120 €.` },
    ],
  }),
  entertainment: fw({
    hookSentence: "Le attività entertainment sono i jolly degli addii — veloci da prenotare, sempre adatte ai gruppi, effetto storia integrato.",
    introTpl: (l) => `${l} è una classica attività di addio che funziona senza esperienza, con qualsiasi dimensione di gruppo e qualsiasi umore. Ideale come riempitivo tra programmi principali o come apertura serata.`,
    whenSection: [
      "Blocco tra attività e cena",
      "Quando meteo o umore stravolge i piani — piano B d'emergenza",
      "Programma spontaneo nel giorno stesso",
    ],
    whoSection: [
      "Tutte le configurazioni di crew",
      "Anche generazioni miste",
      "Specie futuri sposi senza focus sport",
    ],
    costExplain: "Attività entertainment 25–65 € a persona per 60–120 minuti. Prenotabili tardi in molte città.",
    commonMistakes: [
      "Programmare troppo lungo — 90 min bastano per la maggioranza.",
      "Sottovalutare la preparazione — alcune richiedono briefing.",
      "Operatori singoli — meglio locali consolidati con routine di gruppo.",
    ],
    faqsTpl: (l) => [
      { q: `Possiamo prenotare ${l} all'ultimo?`, a: `Spesso sì, specie infrasettimanale o fuori stagione. Slot weekend maggio–settembre 2–4 settimane prima.` },
      { q: `Dimensione di gruppo per ${l}?`, a: `Funziona da 4 persone. Ottimale 8–14 per buona dinamica. Oltre 20 la logistica diventa sport.` },
      { q: `Quanto costa ${l}?`, a: `Tipicamente 25–65 € a persona per 60–120 minuti.` },
    ],
  }),
  creative: fw({
    hookSentence: "Le attività creative sorprendono le crew e producono il miglior materiale fotografico — dalla ceramica alla pittura.",
    introTpl: (l) => `${l} è la categoria creativa sottovalutata: il crew costruisce qualcosa, impara una nuova abilità e spesso porta a casa un risultato fisico. Questo rende ${l} la fonte di ricordi più duratura.`,
    whenSection: [
      "Giorno 2 come programma più tranquillo",
      "Slot brunch con mimose e attività creativa",
      "Programma pre-matrimonio anti-stress",
    ],
    whoSection: [
      "Crew con affinità foodie o design",
      "Futuri sposi che apprezzano l'artigianato",
      "Generi / generazioni miste",
    ],
    costExplain: "Attività creative 40–80 € a persona con materiali. Workshop premium con professionista fino a 120 €. Prenotazione 3–5 settimane prima.",
    commonMistakes: [
      "Crew con sola escalation spesso non amano il creativo.",
      "Sottovalutare la durata — 2–3 ore, non 1.",
      "Non chiarire la possibilità di portare a casa il materiale.",
    ],
    faqsTpl: (l) => [
      { q: `Servono conoscenze per ${l}?`, a: `No, gli operatori sono attrezzati per principianti. Crash-corso di 15 min all'inizio basta per qualcosa di presentabile.` },
      { q: `Quanto dura ${l}?`, a: `2–3 ore per un risultato presentabile. Con pause e degustazione spesso 3,5 ore totali.` },
      { q: `Quanto costa ${l} a persona?`, a: `Tipicamente 40–80 € a persona con materiali. Workshop pro premium fino a 120 €.` },
    ],
  }),
  sport: fw({
    hookSentence: "Le attività sport sono obbligatorie per crew attive — competizione, fitness, team-building in un blocco.",
    introTpl: (l) => `${l} offre all'addio competizione strutturata con regole chiare, feedback immediato e momenti foto-friendly. Funziona meglio al Giorno 2 quando il crew è caldo.`,
    whenSection: [
      "Programma di Giorno 2 per crew attive",
      "Slot mattutino in addii estivi",
      "Preparazione fitness pre-matrimonio",
    ],
    whoSection: [
      "Crew sportive con DNA competitivo",
      "Futuri sposi con background sportivo",
      "Crew che vogliono essere attive in estate",
    ],
    costExplain: "Attività sport 25–75 € a persona per 90–180 minuti. Attrezzatura solitamente inclusa.",
    commonMistakes: [
      "Sovrastimare il livello del crew — controllare opzioni principianti.",
      "Non chiarire l'attrezzatura prima — parastinchi, scarpe.",
      "Non considerare non-sportivi — offrire piano B parallelo.",
    ],
    faqsTpl: (l) => [
      { q: `Serve esperienza sportiva per ${l}?`, a: `No, ${l} ha regole base e introduzione per principianti. L'esperienza è un plus, non un must.` },
      { q: `Che attrezzatura serve?`, a: `Solitamente tutto incluso nella prenotazione. Abbigliamento sportivo e scarpe chiuse bastano.` },
      { q: `Quanto costa ${l}?`, a: `Tipicamente 25–75 € a persona per 90–180 minuti con attrezzatura.` },
    ],
  }),
  nightlife: fw({
    hookSentence: "I programmi nightlife sono il cuore di ogni addio — da pub-crawl curati a ingressi VIP in club.",
    introTpl: (l) => `${l} è uno dei programmi nightlife centrali in addii. La scelta giusta (bar-crawl, club, karaoke) decide l'atmosfera della serata più di qualsiasi altro programma.`,
    whenSection: [
      "Serata principale dell'addio — di solito sabato",
      "Giorno 1 come serata d'arrivo con pre-drink",
      "Domenica in addii lunghi",
    ],
    whoSection: [
      "Tutte le crew che vogliono classico addio",
      "Futuri sposi che amano il nightlife",
      "Anche crew mature con tono adattato",
    ],
    costExplain: "Programmi nightlife 40–120 € a persona per 4–6 ore. Premium (VIP, bottle service) da 150 €.",
    commonMistakes: [
      "Dimenticare slot pre-drink — risparmia soldi e calibra l'atmosfera.",
      "Ignorare la strategia buttafuori — crew solo maschili spesso rifiutate.",
      "Senza bar di backup se il principale è pieno.",
    ],
    faqsTpl: (l) => [
      { q: `A che ora iniziare ${l}?`, a: `In DACH 20–22 per bar, 23–01 per club. In Spagna/Italia più tardi (22–24 bar, 01–03 club).` },
      { q: `Come entrare in club come gruppo maschile?`, a: `Prenotazione con bottle service evita la selezione. Alternativa con gruppo misto o sottogruppi piccoli.` },
      { q: `Quanto costa ${l} a persona?`, a: `Tipicamente 40–120 € a persona per 4–6 ore con ingressi e drink.` },
    ],
  }),
  culture: fw({
    hookSentence: "Le attività culturali danno profondità agli addii — museo, visita guidata, tour storico come contrappeso all'escalation.",
    introTpl: (l) => `${l} è il pilastro culturale per addii che vogliono più dell'escalation. 90 min bastano per giustificarsi culturalmente e produrre le uniche foto mostrabili in famiglia.`,
    whenSection: [
      "Programma diurno con ambizione culturale",
      "Slot mattutino prima dell'escalation",
      "Programma domenicale mattutino",
    ],
    whoSection: [
      "Crew con ambizione culturale",
      "Futuri sposi con affinità storica",
      "Gruppi misti con genitori",
    ],
    costExplain: "Attività culturali 15–40 € a persona per 90–180 minuti. Tour premium tematici fino a 60 €.",
    commonMistakes: [
      "Programmi troppo lunghi — 2 ore bastano per la maggioranza.",
      "Non prenotare biglietti prima — musei top usano sistemi di slot.",
      "Non controllare l'umore del crew — escalation crew spesso non amano musei.",
    ],
    faqsTpl: (l) => [
      { q: `Quanto deve durare ${l}?`, a: `90–120 minuti è lo sweet spot. Più lungo spesso trascina per crew di addio.` },
      { q: `Prenotiamo biglietti prima?`, a: `Per location popolari (musei, tour guidati) sì, almeno 1 settimana prima. Tour gratuito spontaneo è spesso un'opzione.` },
      { q: `Quanto costa ${l}?`, a: `Tipicamente 15–40 € a persona. Tour premium fino a 60 €.` },
    ],
  }),
  adventure: fw({
    hookSentence: "Le attività avventura sono la classe XL — dal skydiving al parapendio, storie di addio uniche.",
    introTpl: (l) => `${l} appartiene alla classe premium adventure. Queste attività producono i ricordi più intensi ma richiedono coraggio, budget e pianificazione. Non per ogni crew, ma quando si adatta: highlight assoluto.`,
    whenSection: [
      "Giorno 2 come programma principale",
      "Maggio–settembre per avventura outdoor",
      "Prenotazione 4–8 settimane prima obbligatoria",
    ],
    whoSection: [
      "Crew tolleranti al rischio con affinità adventure",
      "Futuri sposi che vogliono saltare una volta nella vita",
      "Crew con budget più alto (100–250 € per attività a persona)",
    ],
    costExplain: "Attività adventure 100–250 € a persona. Esperienze premium (skydiving, elicottero) da 250 €. Verificare l'assicurazione dell'operatore.",
    commonMistakes: [
      "Non leggere il piccolo dell'assicurazione — adventure ha regole speciali.",
      "Sottovalutare la dipendenza dal meteo — molte hanno 50% di probabilità di cancellazione.",
      "Non includere crew non-adventure — pianificare piano B parallelo.",
    ],
    faqsTpl: (l) => [
      { q: `Serve esperienza per ${l}?`, a: `Solitamente no, varianti tandem esistono per la maggior parte. Body-check e briefing di sicurezza sono obbligatori.` },
      { q: `Cosa succede con il maltempo?`, a: `Adventure ha regole speciali. Prima di prenotare chiarire condizioni di cancellazione. Piano B indoor parallelo prenotabile.` },
      { q: `Quanto costa ${l} a persona?`, a: `Tipicamente 100–250 € a persona. Esperienze premium oltre.` },
    ],
  }),
};

// ──────────────────────────────────────────────────────────────────
// PORTUGUÊS
// ──────────────────────────────────────────────────────────────────
const PT: Record<ActivityCategory, CategoryFrameworkIntl> = {
  action: fw({
    hookSentence: "As atividades de ação são a espinha dorsal de toda despedida — adrenalina, competição, material de histórias garantido.",
    introTpl: (l) => `${l} é uma das atividades de ação mais procuradas para despedidas de solteiro, despedidas de solteira e viagens de grupo. Funciona por competição clara, sucessos imediatos e dinâmica de grupo — ideal como highlight do Dia 2.`,
    whenSection: [
      "Programa de Dia 2 quando o grupo está aquecido e quer ação antes da noite",
      "Separação limpa da festa — ação primeiro, bar depois",
      "Com chuva indoor bate outdoor",
    ],
    whoSection: [
      "Grupos de 6+ para boa dinâmica",
      "Noivos com espírito competitivo",
      "Funciona com níveis de forma mistos",
    ],
    costExplain: "Atividades de ação custam tipicamente 30–90 € por pessoa para 1–2 horas. Opções premium (drift, skydiving) >150 €. Reservar 4–8 semanas antes garante slots na época alta.",
    commonMistakes: [
      "Reservar muito curto: 60 min não chegam — mínimo 90 min para experiência completa.",
      "Logo após o pequeno-almoço — deixar tempo para digerir a noite anterior.",
      "Sem plano B para chuva no exterior — ter alternativa interior reservável.",
    ],
    faqsTpl: (l) => [
      { q: `Quanto custa ${l} para um grupo?`, a: `${l} custa tipicamente 30–90 € por pessoa para 60–120 minutos. Reservas de grupo 8+ costumam ter descontos de 10–20%.` },
      { q: `Quantas pessoas ideais para ${l}?`, a: `Ótimo 6–12 pessoas. Menos de 6 a dinâmica perde-se, mais de 16 a logística complica. Grupos grandes podem dividir em dois slots.` },
      { q: `Com quanta antecedência reservar ${l}?`, a: `Maio–setembro: 4–8 semanas. Fora de época 1–2 semanas chegam. Slots populares (sábado de manhã) esgotam primeiro.` },
    ],
  }),
  outdoor: fw({
    hookSentence: "Atividades outdoor combinam natureza com dinâmica de grupo — da água à montanha, fixas em programas de despedida.",
    introTpl: (l) => `${l} é uma das atividades outdoor mais populares e funciona para qualquer crew. Natureza como fundo de fotos, ar fresco para recuperar da noite anterior, opção piquenique ou pausa cerveja.`,
    whenSection: [
      "Maio–setembro como época principal",
      "Domingo de manhã como terapia anti-ressaca",
      "Highlight diurno para grupos amantes da natureza",
    ],
    whoSection: [
      "Grupos com afinidade natureza e fotografia",
      "Níveis de forma mistos (exceto variantes hardcore)",
      "Noivos a quererem ficar em forma para o casamento",
    ],
    costExplain: "Atividades outdoor 30–80 € por pessoa com equipamento. Charter barco e premium 100–250 €. O clima é o risco principal — seguro de cancelamento vale a pena.",
    commonMistakes: [
      "Esquecer revisão de equipamento — roupa adequada frequentemente necessária.",
      "Sem plano B para chuva — a maioria não funciona molhada.",
      "Subestimar o tempo — outdoor com transporte dobra a duração.",
    ],
    faqsTpl: (l) => [
      { q: `Melhor época para ${l}?`, a: `Maio a setembro para clima estável. No verão slots de época alta vão cedo, primavera/outono mais flexíveis e baratos.` },
      { q: `Precisamos de experiência para ${l}?`, a: `Não, a maioria oferece curso rápido de 30 minutos para principiantes. Variantes premium podem exigir base.` },
      { q: `E se chover?`, a: `A maioria tem regras de cancelamento ou remarcação. Para despedidas mantém sempre plano B indoor — karts, escalada, escape room.` },
    ],
  }),
  chill: fw({
    hookSentence: "Atividades chill são a categoria subestimada de despedida — perfeitas para domingo de manhã, recuperação ou grupos mistos.",
    introTpl: (l) => `${l} funciona diferente de um programa action: sem adrenalina, mas relaxamento com dinâmica de grupo. Ideal como programa de domingo após uma noite longa ou como slot pré-casamento.`,
    whenSection: [
      "Domingo de manhã como terapia anti-ressaca",
      "Programa pré-casamento para descansar",
      "Grupos mistos com sogros ou familiares",
    ],
    whoSection: [
      "Crews depois de uma noite dura",
      "Grupos mistos com energias diferentes",
      "Noivos que querem descansar antes do casamento",
    ],
    costExplain: "Atividades chill 25–80 € por pessoa. Wellness premium até 150 €. Reserváveis a curto prazo — sem pressão de antecedência como em action.",
    commonMistakes: [
      "Muito curto — wellness/spa precisa 2–3 horas para efeito real.",
      "Comer demais antes — muitos programas chill são melhores após almoço.",
      "Expectativas desalinhadas — algumas crews acham chill aborrecido, verificar antes.",
    ],
    faqsTpl: (l) => [
      { q: `${l} funciona após uma noite dura?`, a: `Pelo contrário — costuma ser o melhor momento. ${l} ajuda o grupo a digerir a noite anterior e recarregar energia.` },
      { q: `Tamanho ideal do grupo?`, a: `4–10 pessoas funcionam melhor. Grupos maiores possíveis mas perdem intimidade.` },
      { q: `Quanto custa ${l} por pessoa?`, a: `Tipicamente 25–80 € por pessoa para 90–180 minutos. Wellness premium até 150 €.` },
    ],
  }),
  food: fw({
    hookSentence: "Atividades food ancoram despedidas em comer e beber — de tour cervejeiro a aula de cozinha, melhor material de recordação.",
    introTpl: (l) => `${l} é uma das atividades de despedida mais subestimadas: experiência partilhada à volta de comida ou bebida que é simultaneamente programa e refeição. Para grupos que querem mais que atividades e bar.`,
    whenSection: [
      "Programa de almoço ou slot início da noite",
      "Substituto de refeição em dias longos",
      "Alternativa de brunch dominical",
    ],
    whoSection: [
      "Crews foodies orientadas para o prazer",
      "Noivos que cozinham ou gostam de comer",
      "Grupos mistos — food funciona em todas as idades",
    ],
    costExplain: "Atividades food 35–90 € por pessoa. Premium (menus de degustação, chef privado) desde 120 €. Reserva 3–6 semanas antes recomendada, especialmente em época alta.",
    commonMistakes: [
      "Não esclarecer alergias antes — pode quebrar o ambiente.",
      "Programar muito tarde — quem tem fome impacienta-se.",
      "Esquecer de reservar — restaurantes top têm 4–8 semanas de espera.",
    ],
    faqsTpl: (l) => [
      { q: `Quanto tempo leva ${l}?`, a: `Tipicamente 2–3 horas com tempo de degustação. Aulas de cozinha 3–4 horas, tours de prova 2 horas.` },
      { q: `Alergias ou vegetarianos podem ser acomodados?`, a: `Indica na reserva. A maioria é flexível, 1–2 semanas de antecedência para pedidos especiais.` },
      { q: `Quanto custa ${l}?`, a: `Tipicamente 35–90 € por pessoa com comida. Premium com menu elaborado desde 120 €.` },
    ],
  }),
  entertainment: fw({
    hookSentence: "Atividades entertainment são os jokers das despedidas — rápidos de reservar, sempre adequados a grupos, efeito história integrado.",
    introTpl: (l) => `${l} é uma atividade clássica de despedida que funciona sem experiência prévia, com qualquer tamanho de grupo e qualquer ambiente. Ideal como filler entre programas principais ou como abertura da noite.`,
    whenSection: [
      "Bloco entre atividade e jantar",
      "Quando o clima ou ambiente derruba o plano — plano B de emergência",
      "Programa espontâneo no mesmo dia",
    ],
    whoSection: [
      "Toda configuração de crew",
      "Também gerações mistas",
      "Especialmente noivos sem foco em desporto",
    ],
    costExplain: "Atividades entertainment 25–65 € por pessoa para 60–120 minutos. Reserváveis a curto prazo na maioria das cidades.",
    commonMistakes: [
      "Planear demasiado longo — 90 min chegam para a maioria.",
      "Subestimar a preparação — algumas exigem briefing do grupo.",
      "Operadores isolados — preferir locais estabelecidos com rotina de grupos.",
    ],
    faqsTpl: (l) => [
      { q: `Podemos reservar ${l} à última?`, a: `Geralmente sim, sobretudo em semana ou fora de época. Slots de fim de semana maio–setembro 2–4 semanas antes.` },
      { q: `Tamanho de grupo para ${l}?`, a: `Funciona a partir de 4 pessoas. Ótimo 8–14 para boa dinâmica. Mais de 20 a logística complica.` },
      { q: `Quanto custa ${l}?`, a: `Tipicamente 25–65 € por pessoa para 60–120 minutos.` },
    ],
  }),
  creative: fw({
    hookSentence: "Atividades criativas surpreendem grupos e produzem o melhor material fotográfico — de cerâmica a pintura.",
    introTpl: (l) => `${l} é a categoria criativa subestimada de despedida: o grupo cria algo, aprende uma nova habilidade e costuma levar um resultado físico. Isso faz de ${l} a fonte de recordações mais duradoura.`,
    whenSection: [
      "Dia 2 como programa mais calmo",
      "Slot de brunch com mimosas e atividade criativa",
      "Programa pré-casamento anti-stress",
    ],
    whoSection: [
      "Crews com afinidade foodie ou design",
      "Noivos que apreciam artesanato",
      "Géneros / gerações mistas",
    ],
    costExplain: "Atividades criativas 40–80 € por pessoa com materiais. Workshops premium com profissional até 120 €. Reserva 3–5 semanas antes.",
    commonMistakes: [
      "Crews focadas em escalada não gostam de criativas.",
      "Subestimar a duração — 2–3 horas, não 1.",
      "Não esclarecer se se pode levar o material.",
    ],
    faqsTpl: (l) => [
      { q: `Precisamos de conhecimentos prévios para ${l}?`, a: `Não, os operadores estão preparados para principiantes. Crash-course de 15 min ao início chega para algo apresentável.` },
      { q: `Quanto dura ${l}?`, a: `2–3 horas para resultado apresentável. Com pausas e degustação muitas vezes 3,5 horas no total.` },
      { q: `Quanto custa ${l} por pessoa?`, a: `Tipicamente 40–80 € por pessoa com materiais. Workshops profissionais premium até 120 €.` },
    ],
  }),
  sport: fw({
    hookSentence: "Atividades de desporto são obrigatórias para crews ativas — competição, fitness, team-building num só bloco.",
    introTpl: (l) => `${l} oferece à despedida competição estruturada com regras claras, feedback imediato e momentos fotografáveis. Funciona melhor no Dia 2 quando o grupo está aquecido.`,
    whenSection: [
      "Programa de Dia 2 para crews ativas",
      "Slot de manhã em despedidas de verão",
      "Como preparação fitness pré-casamento",
    ],
    whoSection: [
      "Crews desportivas com ADN competitivo",
      "Noivos com background desportivo",
      "Crews que querem ser ativas no verão",
    ],
    costExplain: "Atividades de desporto 25–75 € por pessoa para 90–180 minutos. Equipamento normalmente incluído.",
    commonMistakes: [
      "Sobreestimar o nível desportivo — verificar opções principiantes.",
      "Não esclarecer equipamento antes — caneleiras, sapatos.",
      "Não considerar não-desportistas — oferecer programa B paralelo.",
    ],
    faqsTpl: (l) => [
      { q: `Precisamos de experiência desportiva para ${l}?`, a: `Não, ${l} tem regras básicas e introdução para principiantes. Experiência prévia é um plus, não obrigatório.` },
      { q: `Que equipamento é preciso?`, a: `Normalmente tudo incluído na reserva. Roupa desportiva e sapatos fechados chegam.` },
      { q: `Quanto custa ${l}?`, a: `Tipicamente 25–75 € por pessoa para 90–180 minutos com equipamento.` },
    ],
  }),
  nightlife: fw({
    hookSentence: "Programas de nightlife são o coração de toda despedida — de pub-crawls curados a entradas VIP em clubes.",
    introTpl: (l) => `${l} é um dos programas centrais de nightlife em despedidas. A escolha certa da variante (bar-crawl, clube, karaoke) decide o ambiente da noite mais que qualquer outro programa.`,
    whenSection: [
      "Noite principal da despedida — normalmente sábado",
      "Dia 1 como noite de chegada com pre-drinks",
      "Domingo em despedidas longas",
    ],
    whoSection: [
      "Toda crew que quer experiência clássica de despedida",
      "Noivos que valorizam nightlife",
      "Também crews maduras com tom adaptado",
    ],
    costExplain: "Programas de nightlife 40–120 € por pessoa para 4–6 horas. Premium (VIP, bottle service) desde 150 €.",
    commonMistakes: [
      "Esquecer slot de pre-drinks — poupa dinheiro e calibra o ambiente.",
      "Ignorar a estratégia de porteiros — crews só masculinas costumam ser rejeitadas.",
      "Sem bar de backup se o principal está cheio.",
    ],
    faqsTpl: (l) => [
      { q: `Que horas começar ${l}?`, a: `Em DACH 20–22h para bares, 23–01h para clubes. Em Espanha/Itália mais tarde (22–24h bares, 01–03h clubes).` },
      { q: `Como entrar em clubes como grupo masculino?`, a: `Reservas com bottle service evitam a seleção. Alternativa com grupo misto ou subgrupos pequenos.` },
      { q: `Quanto custa ${l} por pessoa?`, a: `Tipicamente 40–120 € por pessoa para 4–6 horas com entradas e bebidas.` },
    ],
  }),
  culture: fw({
    hookSentence: "Atividades de cultura dão profundidade a despedidas — museu, tour guiado, rota histórica como contrapeso à escalada.",
    introTpl: (l) => `${l} é o pilar cultural para despedidas que querem mais que escalar. 90 min chegam para justificar culturalmente e produzir as fotos que se podem mostrar à família.`,
    whenSection: [
      "Programa diurno com ambição cultural",
      "Slot da manhã antes de escalar",
      "Programa de domingo de manhã",
    ],
    whoSection: [
      "Crews com ambição cultural",
      "Noivos com afinidade histórica",
      "Grupos mistos com pais",
    ],
    costExplain: "Atividades culturais 15–40 € por pessoa para 90–180 minutos. Tours premium temáticos até 60 €.",
    commonMistakes: [
      "Programas demasiado longos — 2 horas chegam para a maioria.",
      "Não reservar bilhetes antes — museus top usam slots.",
      "Não verificar humor do grupo — crews de escalada costumam não querer museus.",
    ],
    faqsTpl: (l) => [
      { q: `Quanto deve durar ${l}?`, a: `90–120 minutos é o sweet spot. Mais longo costuma arrastar em crews de despedida.` },
      { q: `Reservamos bilhetes antes?`, a: `Para locais populares (museus, tours guiados) sim, pelo menos 1 semana antes. Tour gratuito espontâneo é frequentemente uma opção.` },
      { q: `Quanto custa ${l}?`, a: `Tipicamente 15–40 € por pessoa. Tours premium até 60 €.` },
    ],
  }),
  adventure: fw({
    hookSentence: "Atividades adventure são a classe XL — de skydiving a parapente, histórias de despedida únicas.",
    introTpl: (l) => `${l} pertence à classe premium adventure. Estas atividades produzem as memórias mais intensas mas exigem coragem, orçamento e planeamento. Não para qualquer crew, mas quando encaixa: highlight absoluto.`,
    whenSection: [
      "Dia 2 como programa principal",
      "Maio–setembro para adventure outdoor",
      "Reserva 4–8 semanas antes obrigatória",
    ],
    whoSection: [
      "Crews com tolerância ao risco e afinidade adventure",
      "Noivos que querem saltar uma vez na vida",
      "Crews com orçamento mais alto (100–250 € por atividade por pessoa)",
    ],
    costExplain: "Atividades adventure 100–250 € por pessoa. Experiências premium (skydiving, helicóptero) desde 250 €. Verificar seguro do operador.",
    commonMistakes: [
      "Não ler as letras pequenas do seguro — adventure tem regras especiais.",
      "Subestimar a dependência climática — muitas têm 50% de probabilidade de cancelamento.",
      "Não incluir crew não-adventure — planear plano B paralelo.",
    ],
    faqsTpl: (l) => [
      { q: `Precisamos de experiência para ${l}?`, a: `Normalmente não, existem variantes tandem para a maioria. Body-check e briefing de segurança são obrigatórios.` },
      { q: `E com mau tempo?`, a: `Adventure tem regras especiais. Antes de reservar esclarecer condições de cancelamento. Plano B indoor paralelo reservável.` },
      { q: `Quanto custa ${l} por pessoa?`, a: `Tipicamente 100–250 € por pessoa. Experiências premium acima.` },
    ],
  }),
};

// ──────────────────────────────────────────────────────────────────
// NEDERLANDS
// ──────────────────────────────────────────────────────────────────
const NL: Record<ActivityCategory, CategoryFrameworkIntl> = {
  action: fw({
    hookSentence: "Actie-activiteiten zijn de ruggengraat van elk vrijgezellenfeest — adrenaline, competitie, gegarandeerd verhaalmateriaal.",
    introTpl: (l) => `${l} is een van de meest gevraagde actie-activiteiten voor vrijgezellenfeesten, bachelorettes en groepsreizen. Werkt via duidelijke competitie, directe successen en groepsdynamiek — ideaal als Dag-2 highlight.`,
    whenSection: [
      "Dag-2 programma als de crew warm is en actie wil voor de avond",
      "Schone scheiding van het feestprogramma — actie eerst, bar daarna",
      "Bij regen verslaat indoor outdoor",
    ],
    whoSection: [
      "Crews van 6+ voor goede dynamiek",
      "Bruidegoms met competitief karakter",
      "Werkt bij gemengde fitness-niveaus",
    ],
    costExplain: "Actie-activiteiten kosten doorgaans 30–90 € per persoon voor 1–2 uur. Premium (drift, skydiving) >150 €. 4–8 weken vooraf boeken verzekert slots in hoogseizoen.",
    commonMistakes: [
      "Te kort boeken: 60 min is niet genoeg — minimaal 90 min voor de volle ervaring.",
      "Direct na het ontbijt — geef tijd om de vorige avond te verwerken.",
      "Geen plan B voor slecht weer bij outdoor — houd indoor-alternatief boekbaar.",
    ],
    faqsTpl: (l) => [
      { q: `Wat kost ${l} voor een groep?`, a: `${l} kost doorgaans 30–90 € per persoon voor 60–120 minuten. Groepsboekingen vanaf 8 geven vaak 10–20% korting.` },
      { q: `Ideale groepsgrootte voor ${l}?`, a: `Optimaal 6–12 personen. Onder 6 verliest de dynamiek, boven 16 wordt logistiek lastig. Grotere groepen splitsen in twee slots.` },
      { q: `Hoe vroeg ${l} boeken?`, a: `Mei–september: 4–8 weken vooraf. Buiten seizoen 1–2 weken. Populaire slots (zaterdagochtend) raken eerst vol.` },
    ],
  }),
  outdoor: fw({
    hookSentence: "Outdoor-activiteiten combineren natuur en groepsdynamiek — van water tot berg, vast onderdeel van vrijgezellenprogramma's.",
    introTpl: (l) => `${l} is een van de populairste outdoor-vrijgezellenactiviteiten en werkt voor crews van elk niveau. Natuur als foto-decor, frisse lucht om te herstellen, picknick- of bierstop als optie.`,
    whenSection: [
      "Mei–september als hoofdseizoen",
      "Zondagochtend als kater-therapie",
      "Dagprogramma voor crews met natuurliefde",
    ],
    whoSection: [
      "Crews met natuur- en fotografieaffiniteit",
      "Gemengde fitness-niveaus (behalve hardcore varianten)",
      "Bruidegoms die fit willen zijn op de bruiloft",
    ],
    costExplain: "Outdoor-activiteiten 30–80 € per persoon inclusief uitrusting. Boot-charter en premium 100–250 €. Weer is de grootste risicofactor — annuleringsverzekering loont.",
    commonMistakes: [
      "Uitrustingscheck vergeten — weerbestendige kleding vaak nodig.",
      "Geen weer-back-up gepland — meeste activiteiten werken niet in regen.",
      "Tijd onderschatten — outdoor met reistijd verdubbelt vaak.",
    ],
    faqsTpl: (l) => [
      { q: `Beste seizoen voor ${l}?`, a: `Mei tot september voor stabiel weer. In de zomer slots vroeg boeken, lente/herfst flexibeler en goedkoper.` },
      { q: `Voorervaring nodig voor ${l}?`, a: `Nee, meeste aanbieders bieden 30-minuten crashcursus voor beginners. Premium varianten profiteren van basiservaring.` },
      { q: `Wat gebeurt bij slecht weer?`, a: `Meeste aanbieders hebben annulering- of omboekregels. Voor vrijgezellenfeesten altijd indoor back-up boekbaar houden — karts, klimmen, escape room.` },
    ],
  }),
  chill: fw({
    hookSentence: "Chill-activiteiten zijn de onderschatte vrijgezellenklas — perfect voor zondag, kater-recovery of gemengde crews.",
    introTpl: (l) => `${l} werkt anders dan een actieprogramma: geen adrenaline, maar ontspanning met groepsdynamiek. Ideaal als zondagochtend-programma na een lange nacht of als pre-bruiloft-recovery-slot.`,
    whenSection: [
      "Zondagochtend als kater-therapie",
      "Pre-bruiloft programma voor herstel",
      "Gemengde groepen met schoonfamilie",
    ],
    whoSection: [
      "Crews na een zware vorige avond",
      "Gemengde groepen met verschillende energie-niveaus",
      "Bruidegoms die voor de bruiloft willen uitrusten",
    ],
    costExplain: "Chill-activiteiten 25–80 € per persoon. Premium wellness tot 150 €. Doorgaans op korte termijn boekbaar — geen booking-window-druk zoals bij actie.",
    commonMistakes: [
      "Te kort plannen — wellness/spa heeft 2–3 uur nodig voor echt effect.",
      "Te veel eten vooraf — veel chill-programma's gaan beter na lunch.",
      "Verwachtingsverschil — sommige crews vinden chill saai, vooraf checken.",
    ],
    faqsTpl: (l) => [
      { q: `Werkt ${l} na een zware nacht?`, a: `Integendeel — vaak het beste moment. ${l} helpt crews de vorige avond te verwerken en met energie verder te gaan.` },
      { q: `Ideale groepsgrootte?`, a: `4–10 personen werkt het beste. Grotere groepen kunnen, maar verliezen intimiteit.` },
      { q: `Wat kost ${l} per persoon?`, a: `Doorgaans 25–80 € per persoon voor 90–180 minuten. Premium wellness tot 150 €.` },
    ],
  }),
  food: fw({
    hookSentence: "Food-activiteiten verankeren vrijgezellenfeesten in eten en drinken — van brouwerijtour tot kookworkshop, beste herinneringsmateriaal.",
    introTpl: (l) => `${l} is een van de meest onderschatte vrijgezellenactiviteiten: een gezamenlijke ervaring rond eten of drinken die tegelijk programma en catering is. Voor crews die meer willen dan activiteiten en bar.`,
    whenSection: [
      "Lunchprogramma of vroege avondslot",
      "Catering-vervanging op lange programmadagen",
      "Zondag-brunch alternatief",
    ],
    whoSection: [
      "Foodie-crews gericht op genot",
      "Bruidegoms die graag koken of eten",
      "Gemengde crews — food werkt voor alle leeftijden",
    ],
    costExplain: "Food-activiteiten 35–90 € per persoon. Premium (degustatiemenu's, privéchef) vanaf 120 €. Reserveren 3–6 weken vooraf aanbevolen, vooral in hoogseizoen.",
    commonMistakes: [
      "Allergieën/voorkeuren niet vooraf uitvragen — kan stemmingsremmer worden.",
      "Te laat plannen — wie honger heeft, wordt ongeduldig.",
      "Vergeten te reserveren — topspots hebben 4–8 weken wachtlijst.",
    ],
    faqsTpl: (l) => [
      { q: `Hoeveel tijd kost ${l}?`, a: `Doorgaans 2–3 uur met genietstijd. Kookworkshops 3–4 uur, proeverijen 2 uur.` },
      { q: `Kunnen allergieën of vegetariërs worden meegenomen?`, a: `Geef bij boeking aan. De meeste zijn flexibel, 1–2 weken vooraf voor speciale wensen.` },
      { q: `Wat kost ${l}?`, a: `Doorgaans 35–90 € per persoon inclusief eten. Premium met uitgewerkt menu vanaf 120 €.` },
    ],
  }),
  entertainment: fw({
    hookSentence: "Entertainment-activiteiten zijn de jokers van het vrijgezellenfeest — snel te boeken, altijd groepsgeschikt, ingebakken verhaalwaarde.",
    introTpl: (l) => `${l} is een klassieke vrijgezellenactiviteit die werkt zonder voorervaring, met elke groepsgrootte en in elke stemming. Ideaal als opvulling tussen hoofdprogramma's of als avond-opener.`,
    whenSection: [
      "Programmablok tussen activiteit en diner",
      "Als weer of stemming plannen vergaat — noodplan B",
      "Spontaan programma op de dag zelf",
    ],
    whoSection: [
      "Elke crew-configuratie",
      "Ook voor gemengde generaties",
      "Vooral voor bruidegoms zonder sportfocus",
    ],
    costExplain: "Entertainment-activiteiten 25–65 € per persoon voor 60–120 minuten. Doorgaans op korte termijn boekbaar.",
    commonMistakes: [
      "Te lang plannen — 90 min volstaat voor de meeste.",
      "Voorbereiding onderschatten — sommige vereisen briefing.",
      "Solo-aanbieders — beter gevestigde locaties met groepsroutine.",
    ],
    faqsTpl: (l) => [
      { q: `Kunnen we ${l} spontaan boeken?`, a: `Vaak ja, vooral doordeweeks of buiten hoogseizoen. Weekend-slots mei–september 2–4 weken vooraf.` },
      { q: `Hoe groot moet de groep voor ${l} zijn?`, a: `Werkt vanaf 4 personen. Optimum 8–14 voor goede dynamiek. Boven 20 wordt logistiek sportief.` },
      { q: `Wat kost ${l}?`, a: `Doorgaans 25–65 € per persoon voor 60–120 minuten programma.` },
    ],
  }),
  creative: fw({
    hookSentence: "Creatieve activiteiten verrassen crews en leveren het beste fotomateriaal op — van pottenbakken tot schilderen.",
    introTpl: (l) => `${l} is de onderschatte creatieve vrijgezellencategorie: crews maken iets, leren een vaardigheid en nemen vaak een fysiek resultaat mee. Dat maakt ${l} tot de duurzaamste herinneringsbron.`,
    whenSection: [
      "Dag 2 als rustiger dagprogramma",
      "Brunchslot met mimosa en creatieve activiteit",
      "Pre-bruiloft programma als stressverlaging",
    ],
    whoSection: [
      "Crews met foodie- of design-affiniteit",
      "Bruidegoms die ambacht waarderen",
      "Gemengde geslachten / generaties",
    ],
    costExplain: "Creatieve activiteiten 40–80 € per persoon inclusief materialen. Premium workshops met pro tot 120 €. Reserveren 3–5 weken vooraf.",
    commonMistakes: [
      "Crews met puur escalatie-focus houden vaak niet van creatief.",
      "Workshop-duur onderschatten — vaak 2–3 uur, niet 1.",
      "Materiaal-meeneem-mogelijkheden niet uitvragen.",
    ],
    faqsTpl: (l) => [
      { q: `Voorkennis nodig voor ${l}?`, a: `Nee, aanbieders zijn op beginners ingesteld. Crashcursus van 15 min aan het begin is genoeg voor iets presentabels.` },
      { q: `Hoe lang duurt ${l} doorgaans?`, a: `2–3 uur voor een presentabel resultaat. Met pauzes en proeverij vaak 3,5 uur totaal.` },
      { q: `Wat kost ${l} per persoon?`, a: `Doorgaans 40–80 € per persoon inclusief materialen. Pro-premium workshops tot 120 €.` },
    ],
  }),
  sport: fw({
    hookSentence: "Sport-activiteiten zijn vrijgezellenplicht voor actieve crews — competitie, fitness, teambuilding in één programmablok.",
    introTpl: (l) => `${l} biedt het vrijgezellenfeest gestructureerde competitie met duidelijke regels, directe feedback en foto-waardige momenten. Werkt het best op Dag 2 als de crew warm is.`,
    whenSection: [
      "Dag 2-programma voor actieve crews",
      "Ochtendslot bij zomer-vrijgezellenfeesten",
      "Als fitness-voorbereiding pre-bruiloft",
    ],
    whoSection: [
      "Sportieve crews met competitief DNA",
      "Bruidegoms met sportachtergrond",
      "Crews die in de zomer actief willen zijn",
    ],
    costExplain: "Sport-activiteiten 25–75 € per persoon voor 90–180 minuten. Uitrusting meestal inbegrepen.",
    commonMistakes: [
      "Sportiviteit overschatten — beginnersopties checken.",
      "Uitrusting vooraf niet uitvragen — scheenbeschermers, schoenen.",
      "Niet-sporters niet meenemen — back-up programma parallel aanbieden.",
    ],
    faqsTpl: (l) => [
      { q: `Sportervaring nodig voor ${l}?`, a: `Nee, ${l} heeft basisregels en beginnersinstructie. Voorervaring is een plus, geen must.` },
      { q: `Welke uitrusting nodig?`, a: `Doorgaans alles inclusief bij boeking. Sportkleding en stevige schoenen meenemen volstaat.` },
      { q: `Wat kost ${l}?`, a: `Doorgaans 25–75 € per persoon voor 90–180 minuten inclusief uitrusting.` },
    ],
  }),
  nightlife: fw({
    hookSentence: "Nightlife-programma's zijn het hart van elk vrijgezellenfeest — van gecureerde bar-crawls tot VIP-club-entrees.",
    introTpl: (l) => `${l} is een van de centrale nightlife-programma's bij vrijgezellenfeesten. De juiste keuze (bar-crawl, club, karaoke) bepaalt de avondsfeer meer dan welk ander programma ook.`,
    whenSection: [
      "Hoofdavond — meestal zaterdag",
      "Dag 1 als aankomstavond met pre-drinks",
      "Zondag bij langere vrijgezellenfeesten",
    ],
    whoSection: [
      "Alle crews die klassiek vrijgezellenfeest willen",
      "Bruidegoms die nightlife waarderen",
      "Ook volwassen crews met aangepaste toon",
    ],
    costExplain: "Nightlife-programma's 40–120 € per persoon voor een 4–6 uur avond. Premium (VIP-club, bottle service) vanaf 150 €.",
    commonMistakes: [
      "Pre-drinks-slot vergeten — bespaart geld en zet de stemming.",
      "Portier-strategie negeren — alleen-mannelijke groepen vaak afgewezen.",
      "Geen back-up-bar als de hoofdlocatie vol is.",
    ],
    faqsTpl: (l) => [
      { q: `Hoe laat ${l} starten?`, a: `In DACH 20–22u voor bars, 23–01u voor clubs. In Spanje/Italië later (22–24u bars, 01–03u clubs).` },
      { q: `Hoe komen we als mannengroep in goede clubs?`, a: `Reservering met bottle service omzeilt portier-risico. Anders met gemengde groep of kleinere subgroepen.` },
      { q: `Wat kost ${l} per persoon?`, a: `Doorgaans 40–120 € per persoon voor 4–6 uur avond inclusief entrees + drankjes.` },
    ],
  }),
  culture: fw({
    hookSentence: "Cultuur-activiteiten geven vrijgezellenfeesten diepte — museum, stadswandeling, historische tour als tegenwicht voor de escalatie.",
    introTpl: (l) => `${l} is de culturele programmapeiler voor vrijgezellenfeesten die meer willen dan escalatie. Een 90-min-slot volstaat voor culturele zelfrechtvaardiging en levert vaak de enige foto's op die ook aan familie te tonen zijn.`,
    whenSection: [
      "Dagprogramma met culturele ambitie",
      "Ochtendslot voor de escalatie",
      "Zondagochtend-programma",
    ],
    whoSection: [
      "Crews met culturele ambitie",
      "Bruidegoms met historische affiniteit",
      "Mixed-generatie groepen met ouders erbij",
    ],
    costExplain: "Cultuur-activiteiten 15–40 € per persoon voor 90–180 minuten. Premium themadrondleidingen tot 60 €.",
    commonMistakes: [
      "Te lange programma's — 2 uur volstaat voor de meeste crews.",
      "Tickets niet vooraf boeken — topmusea gebruiken slot-systemen.",
      "Crew-stemming niet uitvragen — escalatie-crews willen vaak geen musea.",
    ],
    faqsTpl: (l) => [
      { q: `Hoe lang moet ${l} duren?`, a: `90–120 minuten is de sweet spot. Langer wordt voor vrijgezellen-crews vaak taai.` },
      { q: `Moeten we tickets vooraf boeken?`, a: `Bij populaire locaties (musea, geleide tours) ja, minstens 1 week vooraf. Spontane gratis-gids-tour is meestal ook een optie.` },
      { q: `Wat kost ${l}?`, a: `Doorgaans 15–40 € per persoon. Premium tours tot 60 €.` },
    ],
  }),
  adventure: fw({
    hookSentence: "Adventure-activiteiten zijn de XL-klasse — van skydiving tot paragliding, unieke vrijgezellenverhalen.",
    introTpl: (l) => `${l} hoort tot de adventure-premium-klasse. Deze activiteiten leveren de intensste herinneringen op, maar vereisen moed, budget en goede planning. Niet voor elke crew, maar als het past: hét highlight.`,
    whenSection: [
      "Dag 2 als hoofdprogrammapunt",
      "Mei–september voor outdoor-adventure",
      "Boeken 4–8 weken vooraf dwingend",
    ],
    whoSection: [
      "Risicobereide crews met adventure-affiniteit",
      "Bruidegoms die ooit in hun leven willen skydiven",
      "Crews met hoger budget (100–250 € per activiteit per persoon)",
    ],
    costExplain: "Adventure-activiteiten 100–250 € per persoon. Premium-belevenissen (skydiving, helikoptertour) vanaf 250 €. Verzekering bij operator nakijken.",
    commonMistakes: [
      "Kleine letters van verzekering niet lezen — adventure heeft vaak speciale regels.",
      "Weersafhankelijkheid onderschatten — bij veel adventure 50 % annuleringskans.",
      "Niet alle crew-leden meelaten doen — back-up-programma voor niet-adventure-crew plannen.",
    ],
    faqsTpl: (l) => [
      { q: `Voorervaring nodig voor ${l}?`, a: `Meestal nee, tandem-varianten bestaan voor de meeste adventure-activiteiten. Body-check en veiligheidsinstructie zijn verplicht.` },
      { q: `Wat gebeurt bij slecht weer?`, a: `Adventure-activiteiten hebben weersspeciale regels. Voor boeking annuleringsvoorwaarden uitklaren. Indoor-back-up parallel boekbaar houden.` },
      { q: `Wat kost ${l} per persoon?`, a: `Doorgaans 100–250 € per persoon. Premium daarboven.` },
    ],
  }),
};

// ──────────────────────────────────────────────────────────────────
// POLSKI
// ──────────────────────────────────────────────────────────────────
const PL: Record<ActivityCategory, CategoryFrameworkIntl> = {
  action: fw({
    hookSentence: "Atrakcje akcji to kręgosłup każdego wieczoru kawalerskiego — adrenalina, rywalizacja, gwarantowany materiał na historie.",
    introTpl: (l) => `${l} to jedna z najczęściej rezerwowanych atrakcji akcji na wieczory kawalerskie, panieńskie i wyjazdy grupowe. Działa przez jasną rywalizację, natychmiastowe sukcesy i dynamikę grupy — idealne jako highlight Dnia 2.`,
    whenSection: [
      "Program Dnia 2 gdy ekipa jest rozgrzana i chce akcji przed wieczorem",
      "Czyste oddzielenie od programu imprezowego — akcja przed, bar po",
      "W deszczu wnętrza biją plener",
    ],
    whoSection: [
      "Ekipy 6+ osób dla dobrej dynamiki",
      "Panowie młodzi z duchem rywalizacji",
      "Działa z mieszanymi poziomami sprawności",
    ],
    costExplain: "Atrakcje akcji kosztują zwykle 30–90 € od osoby za 1–2 godziny. Opcje premium (drift, skydiving) powyżej 150 €. Rezerwacja 4–8 tygodni wcześniej zapewnia sloty w sezonie.",
    commonMistakes: [
      "Za krótka rezerwacja: 60 min nie wystarczy — minimum 90 min dla pełnego doświadczenia.",
      "Tuż po śniadaniu — daj czas na przetworzenie poprzedniej nocy.",
      "Brak planu B na zły pogodę przy plenerze — miej alternatywę indoor do rezerwacji.",
    ],
    faqsTpl: (l) => [
      { q: `Ile kosztuje ${l} dla grupy?`, a: `${l} kosztuje zwykle 30–90 € od osoby za 60–120 minut. Rezerwacje grupowe 8+ często mają rabaty 10–20%.` },
      { q: `Ile osób idealnych do ${l}?`, a: `Optymalnie 6–12 osób. Poniżej 6 dynamika słabnie, powyżej 16 logistyka się komplikuje. Większe grupy można podzielić na dwa sloty.` },
      { q: `Z jakim wyprzedzeniem rezerwować ${l}?`, a: `Maj–wrzesień: 4–8 tygodni. Poza sezonem 1–2 tygodnie. Popularne sloty (sobotni poranek) wychodzą pierwsze.` },
    ],
  }),
  outdoor: fw({
    hookSentence: "Atrakcje plenerowe łączą naturę z dynamiką grupy — od wody po góry, stałe punkty programu wieczorów kawalerskich.",
    introTpl: (l) => `${l} to jedna z najpopularniejszych plenerowych atrakcji wieczoru kawalerskiego i działa dla ekip każdej sprawności. Natura jako tło dla zdjęć, świeże powietrze do regeneracji, opcja pikniku lub przystanku na piwo.`,
    whenSection: [
      "Maj–wrzesień jako sezon główny",
      "Niedzielny poranek jako terapia na kaca",
      "Highlight dnia dla ekip z miłością do natury",
    ],
    whoSection: [
      "Ekipy z afinią do natury i fotografii",
      "Mieszane poziomy sprawności (poza wariantami hardcore)",
      "Panowie młodzi chcący być w formie na ślub",
    ],
    costExplain: "Atrakcje plenerowe 30–80 € od osoby ze sprzętem. Czarter łodzi i premium 100–250 €. Pogoda to główny czynnik ryzyka — ubezpieczenie od rezygnacji się opłaca.",
    commonMistakes: [
      "Zapomnienie o sprawdzeniu sprzętu — odzież pogodowa często wymagana.",
      "Brak planu B na deszcz — większość atrakcji nie działa w deszczu.",
      "Niedoszacowanie czasu — plener z dojazdem często podwaja się.",
    ],
    faqsTpl: (l) => [
      { q: `Najlepszy sezon na ${l}?`, a: `Maj do września dla stabilnej pogody. Latem sloty wysokiego sezonu wcześnie, wiosna/jesień elastyczniej i taniej.` },
      { q: `Potrzebne doświadczenie do ${l}?`, a: `Nie, większość organizatorów oferuje 30-minutowy crash-course dla początkujących. Warianty premium wymagają podstawy.` },
      { q: `Co przy złej pogodzie?`, a: `Większość organizatorów ma zasady odwołania lub przebukowania. Dla wieczoru kawalerskiego zawsze miej plan B indoor — karting, boulder, escape room.` },
    ],
  }),
  chill: fw({
    hookSentence: "Atrakcje chill to niedoceniana klasa wieczoru kawalerskiego — idealne na niedzielę, regenerację lub mieszane ekipy.",
    introTpl: (l) => `${l} działa inaczej niż program akcji: bez adrenaliny, ale relaks z dynamiką grupy. Idealne jako niedzielny program po długiej nocy lub slot przedślubny.`,
    whenSection: [
      "Niedzielny poranek jako terapia na kaca",
      "Program przedślubny dla odpoczynku",
      "Mieszane ekipy z teściami lub rodziną",
    ],
    whoSection: [
      "Ekipy po ciężkiej nocy",
      "Mieszane grupy z różnymi energiami",
      "Panowie młodzi chcący odpocząć przed ślubem",
    ],
    costExplain: "Atrakcje chill 25–80 € od osoby. Premium wellness do 150 €. Rezerwowalne krótkoterminowo — bez presji wcześniejszego planowania jak w akcji.",
    commonMistakes: [
      "Za krótko planowane — wellness/spa potrzebuje 2–3 godzin na prawdziwy efekt.",
      "Za dużo jedzenia przed — wiele programów chill jest lepszych po obiedzie.",
      "Niezgodność oczekiwań — niektóre ekipy uznają chill za nudny, sprawdź wcześniej.",
    ],
    faqsTpl: (l) => [
      { q: `Czy ${l} działa po ciężkiej nocy?`, a: `Wręcz przeciwnie — często to najlepszy moment. ${l} pomaga ekipie przetrawić poprzednią noc i naładować energię.` },
      { q: `Idealna wielkość grupy?`, a: `4–10 osób działa najlepiej. Większe grupy logistycznie możliwe, ale tracą intymność.` },
      { q: `Ile kosztuje ${l} od osoby?`, a: `Zwykle 25–80 € od osoby za 90–180 minut. Premium wellness do 150 €.` },
    ],
  }),
  food: fw({
    hookSentence: "Atrakcje food zakotwiczają wieczór kawalerski w jedzeniu i piciu — od browarów po lekcje gotowania, najlepszy materiał na wspomnienia.",
    introTpl: (l) => `${l} to jedna z najbardziej niedocenianych atrakcji wieczoru kawalerskiego: wspólne doświadczenie wokół jedzenia lub picia, które jest jednocześnie programem i wyżywieniem. Dla ekip chcących więcej niż atrakcji i baru.`,
    whenSection: [
      "Program obiadowy lub wczesnowieczorny",
      "Zamiennik wyżywienia w długie dni programu",
      "Niedzielna alternatywa brunchu",
    ],
    whoSection: [
      "Ekipy foodie zorientowane na przyjemność",
      "Panowie młodzi gotujący lub kochający jeść",
      "Mieszane ekipy — food działa w każdym wieku",
    ],
    costExplain: "Atrakcje food 35–90 € od osoby. Premium (menu degustacyjne, prywatny szef) od 120 €. Rezerwacja 3–6 tygodni wcześniej zalecana, szczególnie w sezonie.",
    commonMistakes: [
      "Niewyjaśnienie alergii/preferencji wcześniej — może zepsuć nastrój.",
      "Planowanie za późno — kto głodny, ten niecierpliwy.",
      "Zapomnienie o rezerwacji — topowe restauracje mają 4–8 tygodni czekania.",
    ],
    faqsTpl: (l) => [
      { q: `Ile czasu zajmuje ${l}?`, a: `Zwykle 2–3 godziny z czasem na degustację. Lekcje gotowania 3–4 godziny, tury degustacyjne 2 godziny.` },
      { q: `Czy alergie lub wegetariańscy są obsługiwani?`, a: `Wskaż przy rezerwacji. Większość jest elastyczna, ale 1–2 tygodnie wcześniej dla specjalnych próśb.` },
      { q: `Ile kosztuje ${l}?`, a: `Zwykle 35–90 € od osoby z jedzeniem. Premium z opracowanym menu od 120 €.` },
    ],
  }),
  entertainment: fw({
    hookSentence: "Atrakcje entertainment to jokerzy wieczoru kawalerskiego — szybkie do rezerwacji, zawsze odpowiednie dla grup, wbudowany efekt historii.",
    introTpl: (l) => `${l} to klasyczna atrakcja wieczoru kawalerskiego, która działa bez wcześniejszego doświadczenia, z dowolnym rozmiarem grupy i w każdym nastroju. Idealne jako wypełniacz między głównymi programami lub jako otwarcie wieczoru.`,
    whenSection: [
      "Blok między atrakcją a kolacją",
      "Gdy pogoda lub nastrój wywraca plany — awaryjny plan B",
      "Spontaniczny program w dniu wieczoru",
    ],
    whoSection: [
      "Każda konfiguracja ekipy",
      "Również dla mieszanych pokoleń",
      "Szczególnie panowie młodzi bez nacisku na sport",
    ],
    costExplain: "Atrakcje entertainment 25–65 € od osoby za 60–120 minut. Rezerwowalne krótkoterminowo w większości miast.",
    commonMistakes: [
      "Planowanie za długo — 90 min wystarcza dla większości.",
      "Niedoszacowanie przygotowania — niektóre wymagają briefingu ekipy.",
      "Pojedynczy organizatorzy — lepiej ugruntowane lokale z rutyną grup.",
    ],
    faqsTpl: (l) => [
      { q: `Czy możemy zarezerwować ${l} z dnia na dzień?`, a: `Zwykle tak, szczególnie w tygodniu lub poza sezonem. Sloty weekendowe maj–wrzesień 2–4 tygodnie wcześniej.` },
      { q: `Jak duża grupa do ${l}?`, a: `Działa od 4 osób. Optymalnie 8–14 dla dobrej dynamiki. Powyżej 20 logistyka się komplikuje.` },
      { q: `Ile kosztuje ${l}?`, a: `Zwykle 25–65 € od osoby za 60–120 minut programu.` },
    ],
  }),
  creative: fw({
    hookSentence: "Atrakcje kreatywne zaskakują ekipy i dają najlepszy materiał fotograficzny — od ceramiki po malowanie.",
    introTpl: (l) => `${l} to niedoceniana kreatywna kategoria wieczoru kawalerskiego: ekipa tworzy coś, uczy się nowej umiejętności i zazwyczaj zabiera fizyczny rezultat. To czyni ${l} najtrwalszym źródłem wspomnień.`,
    whenSection: [
      "Dzień 2 jako spokojniejszy program",
      "Slot brunchu z mimozami i kreatywną atrakcją",
      "Program przedślubny jako redukcja stresu",
    ],
    whoSection: [
      "Ekipy z afinią foodie lub design",
      "Panowie młodzi ceniący rzemiosło",
      "Mieszane płcie / pokolenia",
    ],
    costExplain: "Atrakcje kreatywne 40–80 € od osoby z materiałami. Warsztaty premium z profesjonalistą do 120 €. Rezerwacja 3–5 tygodni wcześniej.",
    commonMistakes: [
      "Ekipy czysto imprezowe często nie lubią kreatywnych.",
      "Niedoszacowanie długości warsztatu — zwykle 2–3 godziny, nie 1.",
      "Niewyjaśnienie możliwości zabrania materiału.",
    ],
    faqsTpl: (l) => [
      { q: `Potrzebne podstawy do ${l}?`, a: `Nie, organizatorzy są przygotowani na początkujących. Crash-course 15 min na początku wystarczy na coś prezentowalnego.` },
      { q: `Ile trwa ${l} zwykle?`, a: `2–3 godziny na prezentowalny rezultat. Z przerwami i degustacją często 3,5 godziny łącznie.` },
      { q: `Ile kosztuje ${l} od osoby?`, a: `Zwykle 40–80 € od osoby z materiałami. Warsztaty pro premium do 120 €.` },
    ],
  }),
  sport: fw({
    hookSentence: "Atrakcje sportowe to obowiązek wieczoru kawalerskiego dla aktywnych ekip — rywalizacja, fitness, team-building w jednym bloku.",
    introTpl: (l) => `${l} oferuje wieczorowi kawalerskiemu ustrukturyzowaną rywalizację z jasnymi zasadami, natychmiastowym feedbackiem i fotogenicznymi momentami. Działa najlepiej w Dniu 2 gdy ekipa jest rozgrzana.`,
    whenSection: [
      "Program Dnia 2 dla aktywnych ekip",
      "Poranny slot w letnich wieczorach kawalerskich",
      "Jako fitnessowe przygotowanie przedślubne",
    ],
    whoSection: [
      "Sportowe ekipy z konkurencyjnym DNA",
      "Panowie młodzi ze sportowym background",
      "Ekipy chcące być aktywne latem",
    ],
    costExplain: "Atrakcje sportowe 25–75 € od osoby za 90–180 minut. Sprzęt zwykle wliczony.",
    commonMistakes: [
      "Przecenianie sprawności ekipy — sprawdź opcje dla początkujących.",
      "Niewyjaśnienie sprzętu wcześniej — ochraniacze, buty.",
      "Niezauważenie nie-sportowców — zaoferuj plan B równolegle.",
    ],
    faqsTpl: (l) => [
      { q: `Potrzebne doświadczenie sportowe do ${l}?`, a: `Nie, ${l} ma podstawowe zasady i instrukcję dla początkujących. Doświadczenie to plus, ale nie konieczność.` },
      { q: `Jaki sprzęt potrzebny?`, a: `Zwykle wszystko wliczone w rezerwację. Wystarczy odzież sportowa i zamknięte buty.` },
      { q: `Ile kosztuje ${l}?`, a: `Zwykle 25–75 € od osoby za 90–180 minut ze sprzętem.` },
    ],
  }),
  nightlife: fw({
    hookSentence: "Programy nightlife to serce każdego wieczoru kawalerskiego — od kuratorowanych pub-crawl po VIP-owe wejścia do klubów.",
    introTpl: (l) => `${l} to jeden z centralnych programów nightlife w wieczorach kawalerskich. Właściwy wybór wariantu (bar-crawl, klub, karaoke) decyduje o nastroju wieczoru bardziej niż jakikolwiek inny program.`,
    whenSection: [
      "Główny wieczór — zazwyczaj sobota",
      "Dzień 1 jako wieczór przyjazdu z pre-drinkami",
      "Niedziela w dłuższych wieczorach kawalerskich",
    ],
    whoSection: [
      "Wszystkie ekipy chcące klasycznego doświadczenia",
      "Panowie młodzi ceniący nightlife",
      "Również dojrzałe ekipy z dostosowanym tonem",
    ],
    costExplain: "Programy nightlife 40–120 € od osoby za 4–6 godzin. Premium (VIP, bottle service) od 150 €.",
    commonMistakes: [
      "Zapomnienie slotu pre-drinków — oszczędza pieniądze i ustawia nastrój.",
      "Ignorowanie strategii bramkarzy — czysto męskie ekipy często odrzucane.",
      "Brak backup baru gdy główny pełny.",
    ],
    faqsTpl: (l) => [
      { q: `O której zacząć ${l}?`, a: `W DACH 20–22 dla barów, 23–01 dla klubów. W Hiszpanii/Włoszech później (22–24 bary, 01–03 kluby).` },
      { q: `Jak wejść do klubów jako męska grupa?`, a: `Rezerwacja z bottle service omija selekcję. Alternatywa z mieszaną grupą lub mniejszymi podgrupami.` },
      { q: `Ile kosztuje ${l} od osoby?`, a: `Zwykle 40–120 € od osoby za 4–6 godzin wieczoru z wejściami i drinkami.` },
    ],
  }),
  culture: fw({
    hookSentence: "Atrakcje kulturalne nadają wieczorom kawalerskim głębi — muzeum, zwiedzanie, trasa historyczna jako przeciwwaga dla imprezy.",
    introTpl: (l) => `${l} to kulturowy filar wieczorów kawalerskich, które chcą więcej niż imprezy. Slot 90 min wystarcza na kulturalne usprawiedliwienie weekendu i daje zdjęcia, które można pokazać rodzinie.`,
    whenSection: [
      "Program dnia z kulturową ambicją",
      "Poranny slot przed imprezą",
      "Niedzielny poranny program",
    ],
    whoSection: [
      "Ekipy z kulturową ambicją",
      "Panowie młodzi z afinią historyczną",
      "Mieszane grupy z rodzicami w składzie",
    ],
    costExplain: "Atrakcje kulturalne 15–40 € od osoby za 90–180 minut. Premium tematyczne zwiedzania do 60 €.",
    commonMistakes: [
      "Za długie programy — 2 godziny wystarczą większości.",
      "Brak rezerwacji biletów wcześniej — topowe muzea używają slotów.",
      "Niezbadanie nastroju ekipy — imprezowe ekipy często nie chcą muzeów.",
    ],
    faqsTpl: (l) => [
      { q: `Jak długo powinno trwać ${l}?`, a: `90–120 minut to sweet spot. Dłużej często się dłuży dla ekip kawalerskich.` },
      { q: `Czy rezerwować bilety wcześniej?`, a: `Przy popularnych lokalizacjach (muzea, zwiedzanie z przewodnikiem) tak, co najmniej 1 tydzień wcześniej. Spontaniczne darmowe zwiedzanie też często opcja.` },
      { q: `Ile kosztuje ${l}?`, a: `Zwykle 15–40 € od osoby. Premium do 60 €.` },
    ],
  }),
  adventure: fw({
    hookSentence: "Atrakcje adventure to klasa XL — od skydivingu po paralotniarstwo, wyjątkowe historie z wieczoru kawalerskiego.",
    introTpl: (l) => `${l} należy do premium klasy adventure. Te atrakcje dają najintensywniejsze wspomnienia, ale wymagają odwagi, budżetu i dobrego planowania. Nie dla każdej ekipy, ale gdy pasuje: highlight programu.`,
    whenSection: [
      "Dzień 2 jako główny program",
      "Maj–wrzesień dla plenerowego adventure",
      "Rezerwacja 4–8 tygodni wcześniej obowiązkowa",
    ],
    whoSection: [
      "Ekipy tolerujące ryzyko z afinią adventure",
      "Panowie młodzi chcący raz w życiu skoczyć ze spadochronem",
      "Ekipy z większym budżetem (100–250 € na atrakcję na osobę)",
    ],
    costExplain: "Atrakcje adventure 100–250 € od osoby. Premium doświadczenia (skydiving, helikopter) od 250 €. Sprawdź ubezpieczenie organizatora.",
    commonMistakes: [
      "Nieczytanie drobnego druku ubezpieczenia — adventure ma specjalne zasady.",
      "Niedoszacowanie zależności od pogody — wiele ma 50% prawdopodobieństwo odwołania.",
      "Niewłączenie ekipy nie-adventure — zaplanuj plan B równolegle.",
    ],
    faqsTpl: (l) => [
      { q: `Potrzebne doświadczenie do ${l}?`, a: `Zwykle nie, warianty tandem istnieją dla większości. Body-check i instruktaż bezpieczeństwa obowiązkowe.` },
      { q: `Co przy złej pogodzie?`, a: `Adventure ma specjalne zasady. Przed rezerwacją wyjaśnij warunki anulowania. Plan B indoor równolegle do rezerwacji.` },
      { q: `Ile kosztuje ${l} od osoby?`, a: `Zwykle 100–250 € od osoby. Premium doświadczenia powyżej.` },
    ],
  }),
};

// ──────────────────────────────────────────────────────────────────
// TÜRKÇE
// ──────────────────────────────────────────────────────────────────
const TR: Record<ActivityCategory, CategoryFrameworkIntl> = {
  action: fw({
    hookSentence: "Aksiyon aktiviteleri her bekarlığa veda partisinin omurgasıdır — adrenalin, rekabet, garantili hikâye malzemesi.",
    introTpl: (l) => `${l} bekarlığa veda, kız bekarlığa veda partileri ve grup gezileri için en çok talep edilen aksiyon aktivitelerinden biridir. Net rekabet, anlık başarı ve grup dinamiğiyle çalışır — Gün 2 zirvesi için ideal.`,
    whenSection: [
      "Ekip ısınmışken ve akşamdan önce aksiyon istediğinde Gün 2 programı",
      "Parti programından temiz ayrım — önce aksiyon, sonra bar",
      "Yağmurda iç mekân dış mekânı yener",
    ],
    whoSection: [
      "İyi dinamik için 6+ kişilik ekipler",
      "Rekabetçi ruhlu damatlar",
      "Karma fitness seviyeleriyle çalışır",
    ],
    costExplain: "Aksiyon aktiviteleri 1–2 saat için kişi başı tipik olarak 30–90 €'dur. Premium seçenekler (drift, skydiving) 150 €'yu aşar. 4–8 hafta önceden rezervasyon sezon yoğunluğunda slotları garanti eder.",
    commonMistakes: [
      "Çok kısa rezervasyon: 60 dakika yetmez — tam deneyim için en az 90 dakika.",
      "Kahvaltıdan hemen sonra — bir önceki geceyi sindirmek için zaman bırak.",
      "Açık hava için kötü hava planı B yok — kapalı bir alternatif rezerve edilebilir tut.",
    ],
    faqsTpl: (l) => [
      { q: `${l} bir grup için ne kadara mal olur?`, a: `${l} 60–120 dakika için tipik olarak kişi başı 30–90 €'dur. 8+ kişilik grup rezervasyonlarında genellikle %10–20 indirim olur.` },
      { q: `${l} için ideal kişi sayısı?`, a: `Optimum 6–12 kişi. 6'nın altında dinamik kaybolur, 16'nın üstünde lojistik karmaşıklaşır. Büyük gruplar iki slota bölünebilir.` },
      { q: `${l} ne kadar önceden rezerve edilmeli?`, a: `Mayıs–Eylül için: 4–8 hafta. Sezon dışında 1–2 hafta. Popüler slotlar (Cumartesi sabahı) önce dolar.` },
    ],
  }),
  outdoor: fw({
    hookSentence: "Açık hava aktiviteleri doğa ile grup dinamiğini birleştirir — sudan dağa, bekarlığa veda programlarının sabit unsurudur.",
    introTpl: (l) => `${l} en popüler açık hava bekarlığa veda aktivitelerinden biridir ve her zindelik düzeyindeki ekipler için çalışır. Fotoğraflar için arka plan olarak doğa, önceki gecenin yorgunluğunu atmak için temiz hava, piknik veya bira molası seçeneği.`,
    whenSection: [
      "Mayıs–Eylül ana sezon olarak",
      "Akşamdan kalma terapisi olarak Pazar sabahı",
      "Doğa tutkunu ekipler için gün highlight'ı",
    ],
    whoSection: [
      "Doğa ve fotoğraf tutkunu ekipler",
      "Karma fitness seviyeleri (hardcore varyantlar hariç)",
      "Düğüne formda olmak isteyen damatlar",
    ],
    costExplain: "Açık hava aktiviteleri ekipman dahil kişi başı tipik 30–80 €. Tekne kiralama ve premium 100–250 €. Hava ana risk faktörü — iptal sigortası değer.",
    commonMistakes: [
      "Ekipman kontrolünü unutmak — hava koşullarına uygun giyim genellikle gerekli.",
      "Hava yedek planı yok — çoğu aktivite ıslakken çalışmaz.",
      "Süreyi hafife almak — ulaşımla açık hava genellikle iki katına çıkar.",
    ],
    faqsTpl: (l) => [
      { q: `${l} için en iyi sezon?`, a: `İstikrarlı hava için Mayıs–Eylül. Yazın yoğun sezon slotları erken gider, ilkbahar/sonbahar daha esnek ve ucuz.` },
      { q: `${l} için tecrübe gerekli mi?`, a: `Hayır, çoğu operatör başlangıç seviyesi için 30 dakikalık crash-kurs sunar. Premium varyantlar temel deneyim gerektirir.` },
      { q: `Kötü havada ne olur?`, a: `Çoğu operatörün iptal veya yeniden rezervasyon kuralları vardır. Bekarlığa veda partileri için her zaman kapalı alanda B planı tut — karting, tırmanma, escape room.` },
    ],
  }),
  chill: fw({
    hookSentence: "Chill aktiviteler hafife alınmış bekarlığa veda sınıfıdır — Pazar sabahı, akşamdan kalma toparlanması veya karma ekipler için mükemmeldir.",
    introTpl: (l) => `${l} bir aksiyon programından farklı çalışır: adrenalin yok ama grup dinamiğiyle rahatlama. Uzun bir gecenin ardından Pazar sabahı programı veya düğün öncesi toparlanma slotu olarak ideal.`,
    whenSection: [
      "Akşamdan kalma terapisi olarak Pazar sabahı",
      "Dinlenmek için düğün öncesi program",
      "Kayınvalide/baba veya akrabalarla karma gruplar",
    ],
    whoSection: [
      "Zor bir geceden sonraki ekipler",
      "Farklı enerji seviyelerine sahip karma gruplar",
      "Düğünden önce dinlenmek isteyen damatlar",
    ],
    costExplain: "Chill aktiviteler kişi başı 25–80 €. Premium wellness 150 €'ya kadar. Kısa sürede rezerve edilebilir — aksiyon gibi rezervasyon penceresi baskısı yok.",
    commonMistakes: [
      "Çok kısa planlamak — wellness/spa gerçek etki için 2–3 saat gerektirir.",
      "Önceden çok yemek — birçok chill program öğle yemeğinden sonra daha iyidir.",
      "Beklenti uyuşmazlığı — bazı ekipler chill'i sıkıcı bulur, önceden kontrol et.",
    ],
    faqsTpl: (l) => [
      { q: `${l} zor bir gecenin ardından işe yarar mı?`, a: `Aksine — genellikle en iyi zaman. ${l} ekibin önceki geceyi sindirmesine ve enerji toplamasına yardım eder.` },
      { q: `İdeal grup büyüklüğü?`, a: `4–10 kişi en iyi çalışır. Büyük gruplar lojistik olarak mümkün ama samimiyetini kaybeder.` },
      { q: `${l} kişi başı ne kadara mal olur?`, a: `90–180 dakika için kişi başı tipik 25–80 €. Premium wellness 150 €'ya kadar.` },
    ],
  }),
  food: fw({
    hookSentence: "Food aktiviteleri bekarlığa vedayı yemek ve içmeye bağlar — bira turundan yemek dersine, en iyi anı malzemesi.",
    introTpl: (l) => `${l} en hafife alınmış bekarlığa veda aktivitelerinden biridir: yemek veya içecek etrafında paylaşılan, hem program hem de yemek olan bir deneyim. Aktivite ve bardan fazlasını isteyen ekipler için.`,
    whenSection: [
      "Öğle programı veya erken akşam slotu",
      "Uzun program günlerinde yemek yerine geçer",
      "Pazar brunch alternatifi",
    ],
    whoSection: [
      "Keyif odaklı foodie ekipler",
      "Yemek pişirmeyi veya yemeyi seven damatlar",
      "Karma ekipler — gastronomik deneyimler her yaşta çalışır",
    ],
    costExplain: "Food aktiviteleri kişi başı 35–90 €. Premium (degüstasyon menüsü, özel şef) 120 €'dan başlar. Özellikle yoğun sezonda 3–6 hafta önceden rezervasyon önerilir.",
    commonMistakes: [
      "Alerjileri önceden netleştirmemek — atmosferi bozabilir.",
      "Çok geç planlamak — açken sabırsızlanır.",
      "Rezervasyonu unutmak — top restoranların 4–8 haftalık bekleme süresi olur.",
    ],
    faqsTpl: (l) => [
      { q: `${l} ne kadar zaman alır?`, a: `Tadım süresi dahil tipik 2–3 saat. Yemek kursları 3–4 saat, tadım turları 2 saat.` },
      { q: `Alerji veya vejetaryen istekleri karşılanabilir mi?`, a: `Rezervasyonda belirt. Çoğu esnektir, özel istekler için 1–2 hafta önceden bildirim mantıklı.` },
      { q: `${l} ne kadara mal olur?`, a: `Yemek dahil kişi başı tipik 35–90 €. Detaylı menülü premium 120 €'dan başlar.` },
    ],
  }),
  entertainment: fw({
    hookSentence: "Entertainment aktiviteleri bekarlığa vedanın jokerleridir — hızla rezerve edilir, her zaman grup dostudur, dahili hikâye etkisi vardır.",
    introTpl: (l) => `${l} önceden deneyim, herhangi bir grup büyüklüğü ve her ruh haliyle çalışan klasik bir bekarlığa veda aktivitesidir. Ana programlar arasında dolgu veya akşam başlangıcı olarak ideal.`,
    whenSection: [
      "Aktivite ile akşam yemeği arasında program bloğu",
      "Hava veya ruh hali planı bozduğunda — acil plan B",
      "Aynı gün spontan program",
    ],
    whoSection: [
      "Her ekip yapılandırması",
      "Karma nesiller için de",
      "Özellikle spor odağı olmayan damatlar",
    ],
    costExplain: "Entertainment aktiviteleri 60–120 dakika için kişi başı 25–65 €. Çoğu şehirde kısa sürede rezerve edilebilir.",
    commonMistakes: [
      "Çok uzun planlamak — çoğu için 90 dakika yeter.",
      "Hazırlığı hafife almak — bazıları ekip brifingi gerektirir.",
      "Tek başına operatörler — grup rutinine sahip yerleşik mekânlar daha iyidir.",
    ],
    faqsTpl: (l) => [
      { q: `${l} kısa sürede rezerve edilebilir mi?`, a: `Çoğunlukla evet, özellikle hafta içi veya sezon dışında. Mayıs–Eylül hafta sonu slotları 2–4 hafta önceden.` },
      { q: `${l} için grup büyüklüğü?`, a: `4 kişiden itibaren çalışır. İyi grup dinamiği için optimum 8–14. 20'nin üstünde lojistik zorlaşır.` },
      { q: `${l} ne kadara mal olur?`, a: `60–120 dakika program için kişi başı tipik 25–65 €.` },
    ],
  }),
  creative: fw({
    hookSentence: "Yaratıcı aktiviteler ekipleri şaşırtır ve en iyi fotoğraf malzemesini üretir — çömlekçilikten resme.",
    introTpl: (l) => `${l} hafife alınmış yaratıcı bekarlığa veda kategorisidir: ekip bir şey üretir, yeni bir beceri öğrenir ve genellikle fiziksel bir sonuç götürür. Bu da ${l}'yi en kalıcı anı kaynağı yapar.`,
    whenSection: [
      "Daha sakin gün programı olarak Gün 2",
      "Mimoza ve yaratıcı aktiviteyle brunch slotu",
      "Stres azaltma olarak düğün öncesi program",
    ],
    whoSection: [
      "Foodie veya tasarım ilgili ekipler",
      "El sanatlarına değer veren damatlar",
      "Karma cinsiyetler / nesiller",
    ],
    costExplain: "Yaratıcı aktiviteler malzeme dahil kişi başı 40–80 €. Profesyonel yönlendirmeli premium atölyeler 120 €'ya kadar. 3–5 hafta önceden rezervasyon.",
    commonMistakes: [
      "Sırf eğlence odaklı ekipler genellikle yaratıcıyı sevmez.",
      "Atölye süresini hafife almak — genellikle 2–3 saat, 1 değil.",
      "Malzeme götürme imkânlarını netleştirmemek.",
    ],
    faqsTpl: (l) => [
      { q: `${l} için önceden bilgi gerekli mi?`, a: `Hayır, operatörler başlangıç seviyesi için hazırdır. İlk 15 dakikalık crash-kurs sunulabilir bir şey için yeterli.` },
      { q: `${l} tipik olarak ne kadar sürer?`, a: `Sunulabilir bir sonuç için 2–3 saat. Aralar ve tadımla genellikle toplam 3,5 saat.` },
      { q: `${l} kişi başı ne kadara mal olur?`, a: `Malzeme dahil kişi başı tipik 40–80 €. Profesyonel premium atölyeler 120 €'ya kadar.` },
    ],
  }),
  sport: fw({
    hookSentence: "Spor aktiviteleri aktif ekipler için bekarlığa veda zorunluluğudur — tek blokta rekabet, fitness, ekip oluşturma.",
    introTpl: (l) => `${l} bekarlığa vedaya net kurallarla yapılandırılmış rekabet, anlık geri bildirim ve fotoğraflanabilir anlar sunar. Ekip ısındığında Gün 2'de en iyi çalışır.`,
    whenSection: [
      "Aktif ekipler için Gün 2 programı",
      "Yaz bekarlığa veda partilerinde sabah slotu",
      "Düğün öncesi fitness hazırlığı olarak",
    ],
    whoSection: [
      "Rekabetçi DNA'lı sporcu ekipler",
      "Spor geçmişi olan damatlar",
      "Yazın aktif olmak isteyen ekipler",
    ],
    costExplain: "Spor aktiviteleri 90–180 dakika için kişi başı 25–75 €. Ekipman genellikle dahil.",
    commonMistakes: [
      "Ekibin sporcu seviyesini abartmak — başlangıç seçeneklerini kontrol et.",
      "Ekipmanı önceden netleştirmemek — tekmelik, ayakkabı.",
      "Sporcu olmayanları düşünmemek — paralel B programı sun.",
    ],
    faqsTpl: (l) => [
      { q: `${l} için spor deneyimi gerekli mi?`, a: `Hayır, ${l}'nin temel kuralları ve başlangıç seviyesi talimatları var. Önceki deneyim artı, zorunluluk değil.` },
      { q: `Hangi ekipman gerekli?`, a: `Genellikle rezervasyonda her şey dahildir. Spor kıyafeti ve kapalı ayakkabı yeterli.` },
      { q: `${l} ne kadara mal olur?`, a: `Ekipman dahil 90–180 dakika için kişi başı tipik 25–75 €.` },
    ],
  }),
  nightlife: fw({
    hookSentence: "Gece hayatı programları her bekarlığa vedanın kalbidir — küratörlü pub-crawl'lardan VIP kulüp girişlerine.",
    introTpl: (l) => `${l} bekarlığa vedalarda merkezi gece hayatı programlarından biridir. Doğru varyant seçimi (bar-crawl, kulüp, karaoke) gece atmosferini başka her programdan daha çok belirler.`,
    whenSection: [
      "Ana gece — genellikle Cumartesi",
      "Pre-drink ile varış akşamı olarak Gün 1",
      "Uzun bekarlığa vedalarda Pazar",
    ],
    whoSection: [
      "Klasik bekarlığa veda deneyimi isteyen tüm ekipler",
      "Gece hayatına değer veren damatlar",
      "Uyarlanmış tonla olgun ekipler",
    ],
    costExplain: "Gece hayatı programları 4–6 saat için kişi başı 40–120 €. Premium (VIP, bottle service) 150 €'dan.",
    commonMistakes: [
      "Pre-drink slotunu unutmak — para tasarrufu sağlar ve atmosferi ayarlar.",
      "Fedai stratejisini görmezden gelmek — tamamen erkek ekipler genellikle reddedilir.",
      "Ana mekan dolduğunda yedek bar yok.",
    ],
    faqsTpl: (l) => [
      { q: `${l}'ye saat kaçta başlamalı?`, a: `DACH'ta barlar için 20–22, kulüpler için 23–01. İspanya/İtalya'da daha geç (barlar 22–24, kulüpler 01–03).` },
      { q: `Erkek grup olarak iyi kulüplere nasıl girilir?`, a: `Bottle service'li rezervasyon seçimi atlar. Alternatif karma grup veya küçük alt gruplar.` },
      { q: `${l} kişi başı ne kadara mal olur?`, a: `Girişler ve içkiler dahil 4–6 saat için kişi başı tipik 40–120 €.` },
    ],
  }),
  culture: fw({
    hookSentence: "Kültür aktiviteleri bekarlığa vedalara derinlik katar — eğlenceye karşı denge olarak müze, rehberli tur, tarihi rota.",
    introTpl: (l) => `${l} eğlenceden fazlasını isteyen bekarlığa vedalar için kültürel program sütunudur. 90 dakikalık slot kültürel öz haklılaştırma için yeterlidir ve aileye gösterilebilecek tek fotoğrafları üretir.`,
    whenSection: [
      "Kültürel iddialı gün programı",
      "Eğlenceden önce sabah slotu",
      "Pazar sabahı programı",
    ],
    whoSection: [
      "Kültürel iddiası olan ekipler",
      "Tarihsel ilgisi olan damatlar",
      "Ebeveynli karma nesil grupları",
    ],
    costExplain: "Kültür aktiviteleri 90–180 dakika için kişi başı 15–40 €. Özel temalı premium turlar 60 €'ya kadar.",
    commonMistakes: [
      "Çok uzun programlar — çoğu ekip için 2 saat yeter.",
      "Önceden bilet ayırmamak — top müzeler slot sistemi kullanır.",
      "Ekibin ruh halini kontrol etmemek — eğlence odaklı ekipler genellikle müze istemez.",
    ],
    faqsTpl: (l) => [
      { q: `${l} ne kadar sürmeli?`, a: `90–120 dakika sweet spot. Daha uzun bekarlığa veda ekipleri için sıkıcı olur.` },
      { q: `Önceden bilet rezerve edelim mi?`, a: `Popüler yerlerde (müzeler, rehberli turlar) evet, en az 1 hafta önceden. Spontan ücretsiz tur da genellikle bir seçenek.` },
      { q: `${l} ne kadara mal olur?`, a: `Kişi başı tipik 15–40 €. Premium turlar 60 €'ya kadar.` },
    ],
  }),
  adventure: fw({
    hookSentence: "Macera aktiviteleri XL sınıftır — skydiving'den yamaç paraşütüne, eşsiz bekarlığa veda hikâyeleri.",
    introTpl: (l) => `${l} adventure premium sınıfına aittir. Bu aktiviteler en yoğun anıları üretir ama cesaret, bütçe ve iyi planlama gerektirir. Her ekip için değil ama uyduğunda: mutlak highlight.`,
    whenSection: [
      "Gün 2 ana program olarak",
      "Açık hava macerası için Mayıs–Eylül",
      "4–8 hafta önceden rezervasyon zorunlu",
    ],
    whoSection: [
      "Riske toleranslı macera tutkunu ekipler",
      "Hayatında bir kez skydiving yapmak isteyen damatlar",
      "Daha yüksek bütçeli ekipler (aktivite başına kişi başı 100–250 €)",
    ],
    costExplain: "Macera aktiviteleri kişi başı 100–250 €. Premium deneyimler (skydiving, helikopter) 250 €'dan. Operatör sigortasını kontrol et.",
    commonMistakes: [
      "Sigortanın küçük yazısını okumamak — macera genellikle özel kuralları vardır.",
      "Hava bağımlılığını hafife almak — birçok macerada %50 iptal olasılığı.",
      "Tüm ekip üyelerini katmamak — macera olmayan ekip için yedek program planla.",
    ],
    faqsTpl: (l) => [
      { q: `${l} için deneyim gerekli mi?`, a: `Genellikle hayır, çoğu macera aktivitesi için tandem varyantları vardır. Sağlık kontrolü ve güvenlik brifingi zorunlu.` },
      { q: `Kötü havada ne olur?`, a: `Macera aktiviteleri özel kurallara sahiptir. Rezervasyondan önce iptal koşullarını netleştir. Paralel kapalı yedek program rezerve edilebilir tut.` },
      { q: `${l} kişi başı ne kadara mal olur?`, a: `Kişi başı tipik 100–250 €. Premium üstü.` },
    ],
  }),
};

// ──────────────────────────────────────────────────────────────────
// Export consolidated
// ──────────────────────────────────────────────────────────────────

export const CATEGORY_FRAMEWORKS_INTL: Record<ActivityIntlLang, Record<ActivityCategory, CategoryFrameworkIntl>> = {
  es: ES,
  fr: FR,
  it: IT,
  pt: PT,
  nl: NL,
  pl: PL,
  tr: TR,
};
