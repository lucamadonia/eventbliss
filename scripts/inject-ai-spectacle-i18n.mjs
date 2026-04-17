import fs from "node:fs";
import path from "node:path";

const LOCALES_DIR = path.resolve("src/i18n/locales");

// New keys added under dashboard.ai for the AI Assistant spectacle redesign.
const T = {
  de: {
    recommendServices: "Services empfehlen",
    recommendServicesDesc: "Passende Anbieter vorschlagen",
    yourEvent: "Dein Event-Plan",
    sections: "Abschnitte",
    readyToBook: "Bereit zum Buchen",
    matchedPartners: "Diese Partner-Agenturen passen zu deinem Plan",
    exploreMore: "Alle Services entdecken",
    addAllToPlanner: "Alle zum Planer",
    budgetByDay: "Budget pro Tag",
    bookableIn: "Direkt buchbar in {{city}}",
    bookableHere: "Direkt buchbar",
    realPartnersBadge: "Echte Partner-Agenturen",
    suggestedFor: "Vorgeschlagen für deinen Plan",
    totalEstimate: "Geschätzte Gesamtkosten",
    perDay: "pro Tag",
    perPerson: "pro Person",
    sparkleCta: "Magie entfesseln",
    creditsFuel: "Credits treiben deinen Planer an",
    freshPlan: "Frischer Plan geladen",
    batchAddSuccess: "Alle Aktivitäten wurden deinem Event-Planer hinzugefügt",
    thinking: "Claude plant deinen Tag …",
    quickPrompts: {
      label: "Quick-Ideen",
      weekend: "Plane mir ein episches Wochenende",
      budget: "Budgetfreundlich für 8 Personen",
      outdoor: "Action & Outdoor-Abenteuer",
      culinary: "Kulinarische Highlights",
      luxury: "Luxuriös mit Wow-Effekt",
    },
  },
  en: {
    recommendServices: "Recommend services",
    recommendServicesDesc: "Suggest matching providers",
    yourEvent: "Your event plan",
    sections: "sections",
    readyToBook: "Ready to book",
    matchedPartners: "Partner agencies matched to your plan",
    exploreMore: "Explore all services",
    addAllToPlanner: "Add all to planner",
    budgetByDay: "Budget by day",
    bookableIn: "Bookable in {{city}}",
    bookableHere: "Bookable now",
    realPartnersBadge: "Real partner agencies",
    suggestedFor: "Suggested for your plan",
    totalEstimate: "Total estimate",
    perDay: "per day",
    perPerson: "per person",
    sparkleCta: "Unleash the magic",
    creditsFuel: "Credits fuel your planner",
    freshPlan: "Fresh plan loaded",
    batchAddSuccess: "All activities added to your event planner",
    thinking: "Claude is crafting your plan …",
    quickPrompts: {
      label: "Quick ideas",
      weekend: "Plan me an epic weekend",
      budget: "Budget-friendly for 8 people",
      outdoor: "Action & outdoor adventure",
      culinary: "Culinary highlights",
      luxury: "Luxurious with wow factor",
    },
  },
  es: {
    recommendServices: "Recomendar servicios",
    recommendServicesDesc: "Sugerir proveedores adecuados",
    yourEvent: "Tu plan del evento",
    sections: "secciones",
    readyToBook: "Listo para reservar",
    matchedPartners: "Agencias colaboradoras que encajan con tu plan",
    exploreMore: "Explorar todos los servicios",
    addAllToPlanner: "Añadir todo al planificador",
    budgetByDay: "Presupuesto por día",
    bookableIn: "Reservable en {{city}}",
    bookableHere: "Reservable ahora",
    realPartnersBadge: "Agencias reales",
    suggestedFor: "Sugerido para tu plan",
    totalEstimate: "Coste total estimado",
    perDay: "por día",
    perPerson: "por persona",
    sparkleCta: "Activar la magia",
    creditsFuel: "Los créditos impulsan tu planificador",
    freshPlan: "Plan recién cargado",
    batchAddSuccess: "Todas las actividades añadidas a tu planificador",
  },
  fr: {
    recommendServices: "Recommander des services",
    recommendServicesDesc: "Proposer les bons prestataires",
    yourEvent: "Ton plan d'événement",
    sections: "sections",
    readyToBook: "Prêt à réserver",
    matchedPartners: "Agences partenaires adaptées à ton plan",
    exploreMore: "Explorer tous les services",
    addAllToPlanner: "Tout ajouter au planner",
    budgetByDay: "Budget par jour",
    bookableIn: "Réservable à {{city}}",
    bookableHere: "Réservable maintenant",
    realPartnersBadge: "Vraies agences partenaires",
    suggestedFor: "Suggéré pour ton plan",
    totalEstimate: "Coût total estimé",
    perDay: "par jour",
    perPerson: "par personne",
    sparkleCta: "Libérer la magie",
    creditsFuel: "Les crédits alimentent ton planner",
    freshPlan: "Plan fraîchement chargé",
    batchAddSuccess: "Toutes les activités ajoutées au planner",
  },
  it: {
    recommendServices: "Consiglia servizi",
    recommendServicesDesc: "Suggerisci i fornitori giusti",
    yourEvent: "Il tuo piano evento",
    sections: "sezioni",
    readyToBook: "Pronto a prenotare",
    matchedPartners: "Agenzie partner adatte al tuo piano",
    exploreMore: "Esplora tutti i servizi",
    addAllToPlanner: "Aggiungi tutto al planner",
    budgetByDay: "Budget al giorno",
    bookableIn: "Prenotabile a {{city}}",
    bookableHere: "Prenotabile ora",
    realPartnersBadge: "Agenzie partner reali",
    suggestedFor: "Suggerito per il tuo piano",
    totalEstimate: "Costo totale stimato",
    perDay: "al giorno",
    perPerson: "a persona",
    sparkleCta: "Scatena la magia",
    creditsFuel: "I crediti alimentano il tuo planner",
    freshPlan: "Piano appena caricato",
    batchAddSuccess: "Tutte le attività aggiunte al planner",
  },
  nl: {
    recommendServices: "Diensten aanbevelen",
    recommendServicesDesc: "Passende aanbieders voorstellen",
    yourEvent: "Jouw eventplan",
    sections: "secties",
    readyToBook: "Klaar om te boeken",
    matchedPartners: "Partner-agencies die bij jouw plan passen",
    exploreMore: "Alle diensten bekijken",
    addAllToPlanner: "Alles aan planner toevoegen",
    budgetByDay: "Budget per dag",
    bookableIn: "Boekbaar in {{city}}",
    bookableHere: "Direct boekbaar",
    realPartnersBadge: "Echte partner-agencies",
    suggestedFor: "Voorgesteld voor jouw plan",
    totalEstimate: "Totale kosten schatting",
    perDay: "per dag",
    perPerson: "per persoon",
    sparkleCta: "Magie ontketenen",
    creditsFuel: "Credits drijven je planner aan",
    freshPlan: "Vers plan geladen",
    batchAddSuccess: "Alle activiteiten toegevoegd aan de planner",
  },
  pl: {
    recommendServices: "Polecaj usługi",
    recommendServicesDesc: "Zaproponuj odpowiednich dostawców",
    yourEvent: "Twój plan wydarzenia",
    sections: "sekcje",
    readyToBook: "Gotowe do rezerwacji",
    matchedPartners: "Agencje partnerskie pasujące do Twojego planu",
    exploreMore: "Odkryj wszystkie usługi",
    addAllToPlanner: "Dodaj wszystko do plannera",
    budgetByDay: "Budżet dzienny",
    bookableIn: "Rezerwacja w {{city}}",
    bookableHere: "Teraz rezerwowalne",
    realPartnersBadge: "Prawdziwe agencje partnerskie",
    suggestedFor: "Zasugerowane dla Twojego planu",
    totalEstimate: "Łączny szacowany koszt",
    perDay: "dziennie",
    perPerson: "na osobę",
    sparkleCta: "Uwolnij magię",
    creditsFuel: "Kredyty napędzają Twój planner",
    freshPlan: "Świeży plan załadowany",
    batchAddSuccess: "Wszystkie aktywności dodane do plannera",
  },
  pt: {
    recommendServices: "Recomendar serviços",
    recommendServicesDesc: "Sugerir fornecedores ideais",
    yourEvent: "O teu plano de evento",
    sections: "secções",
    readyToBook: "Pronto a reservar",
    matchedPartners: "Agências parceiras ideais para o teu plano",
    exploreMore: "Explorar todos os serviços",
    addAllToPlanner: "Adicionar tudo ao planner",
    budgetByDay: "Orçamento por dia",
    bookableIn: "Reservável em {{city}}",
    bookableHere: "Reservável agora",
    realPartnersBadge: "Agências parceiras reais",
    suggestedFor: "Sugerido para o teu plano",
    totalEstimate: "Custo total estimado",
    perDay: "por dia",
    perPerson: "por pessoa",
    sparkleCta: "Libertar a magia",
    creditsFuel: "Os créditos impulsionam o teu planner",
    freshPlan: "Plano acabado de carregar",
    batchAddSuccess: "Todas as atividades adicionadas ao planner",
  },
  tr: {
    recommendServices: "Hizmet öner",
    recommendServicesDesc: "Uygun sağlayıcıları öner",
    yourEvent: "Etkinlik planın",
    sections: "bölüm",
    readyToBook: "Rezervasyona hazır",
    matchedPartners: "Planına uygun partner ajanslar",
    exploreMore: "Tüm hizmetleri keşfet",
    addAllToPlanner: "Tümünü plana ekle",
    budgetByDay: "Günlük bütçe",
    bookableIn: "{{city}} için rezervasyon",
    bookableHere: "Hemen rezervasyon",
    realPartnersBadge: "Gerçek partner ajanslar",
    suggestedFor: "Planın için önerilen",
    totalEstimate: "Toplam tahmini maliyet",
    perDay: "gün başına",
    perPerson: "kişi başına",
    sparkleCta: "Büyüyü serbest bırak",
    creditsFuel: "Krediler planlayıcını çalıştırır",
    freshPlan: "Taze plan yüklendi",
    batchAddSuccess: "Tüm aktiviteler plana eklendi",
  },
  ar: {
    recommendServices: "اقتراح الخدمات",
    recommendServicesDesc: "اقترح مزودين مناسبين",
    yourEvent: "خطة حدثك",
    sections: "أقسام",
    readyToBook: "جاهز للحجز",
    matchedPartners: "وكالات شريكة تناسب خطتك",
    exploreMore: "استكشف كل الخدمات",
    addAllToPlanner: "أضف الكل إلى المخطط",
    budgetByDay: "الميزانية اليومية",
    bookableIn: "قابل للحجز في {{city}}",
    bookableHere: "قابل للحجز الآن",
    realPartnersBadge: "وكالات شريكة حقيقية",
    suggestedFor: "مقترح لخطتك",
    totalEstimate: "إجمالي التكلفة المقدرة",
    perDay: "في اليوم",
    perPerson: "للشخص الواحد",
    sparkleCta: "أطلق السحر",
    creditsFuel: "الأرصدة تشغل مخططك",
    freshPlan: "خطة جديدة محملة",
    batchAddSuccess: "تمت إضافة جميع الأنشطة إلى المخطط",
  },
};

const langs = ["de", "en", "es", "fr", "it", "nl", "pl", "pt", "tr", "ar"];

// Recursively merge any missing keys from `source` into `target`.
// Never overwrites keys that already exist in `target`.
function mergeMissing(target, source) {
  let added = 0;
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== "object") {
        target[k] = {};
      }
      added += mergeMissing(target[k], v);
    } else if (!(k in target)) {
      target[k] = v;
      added++;
    }
  }
  return added;
}

for (const lang of langs) {
  const filePath = path.join(LOCALES_DIR, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`! ${lang}.json not found — skipped`);
    continue;
  }
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);

  data.dashboard = data.dashboard || {};
  data.dashboard.ai = data.dashboard.ai || {};

  const existing = data.dashboard.ai;
  // Overlay: curated per-locale first, then fill any holes with English
  const overlay = { ...T.en, ...(T[lang] || {}) };

  const added = mergeMissing(existing, overlay);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`✓ ${lang}.json — ${added} new keys added under dashboard.ai`);
}
