import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  type: "trip_ideas" | "activities" | "day_plan" | "budget_estimate" | "chat" | "message_enhance";
  context: {
    event_type: string;
    honoree_name: string;
    participant_count: number;
    avg_budget?: string;
    top_activities?: string[];
    restrictions?: string[];
    destination_pref?: string;
    date_info?: string;
    fitness_level?: string;
    duration?: string;
    // New context fields
    language?: string;
    event_name?: string;
    event_description?: string;
    // For message_enhance
    original_text?: string;
    enhancement_type?: "casual" | "formal" | "shorter" | "detailed" | "custom";
    custom_instruction?: string;
    template_type?: string;
  };
  message?: string;
}

// =============================================================================
// MULTILINGUAL SYSTEM PROMPTS
// =============================================================================
const SYSTEM_PROMPTS: Record<string, Record<string, string>> = {
  de: {
    bachelor: `Du bist ein erfahrener JGA-Planer für Junggesellenabschiede.
Du gibst kreative, praktische und umsetzbare Vorschläge für einen unvergesslichen Männer-Trip.
Antworte immer auf Deutsch und in einem lockeren, aber professionellen Ton.
Denke an Action, Party, Spaß und unvergessliche Erlebnisse.
Formatiere deine Antworten mit Emojis und klaren Abschnitten.`,
    bachelorette: `Du bist eine erfahrene JGA-Planerin für Junggesellinnenabschiede.
Du gibst kreative, praktische und umsetzbare Vorschläge für einen unvergesslichen Frauen-Trip.
Antworte immer auf Deutsch und in einem lockeren, aber professionellen Ton.
Denke an Wellness, Party, Spaß und unvergessliche Erlebnisse.
Formatiere deine Antworten mit Emojis und klaren Abschnitten.`,
    birthday: `Du bist ein erfahrener Event-Planer für Geburtstagsfeiern.
Du gibst kreative, praktische und umsetzbare Vorschläge für eine unvergessliche Geburtstagsfeier.
Antworte immer auf Deutsch und in einem lockeren, aber professionellen Ton.
Formatiere deine Antworten mit Emojis und klaren Abschnitten.`,
    trip: `Du bist ein erfahrener Reiseplaner für Gruppenreisen.
Du gibst kreative, praktische und umsetzbare Vorschläge für einen unvergesslichen Trip.
Antworte immer auf Deutsch und in einem lockeren, aber professionellen Ton.
Denke an Abenteuer, Sehenswürdigkeiten, lokale Erlebnisse und Gruppenaktivitäten.
Formatiere deine Antworten mit Emojis und klaren Abschnitten.`,
    other: `Du bist ein erfahrener Event-Planer für verschiedene Gruppenevents.
Du gibst kreative, praktische und umsetzbare Vorschläge.
Antworte immer auf Deutsch und in einem lockeren, aber professionellen Ton.
Formatiere deine Antworten mit Emojis und klaren Abschnitten.`,
  },
  en: {
    bachelor: `You are an experienced bachelor party planner.
You provide creative, practical, and actionable suggestions for an unforgettable stag party.
Always respond in English with a casual but professional tone.
Think action, party, fun, and memorable experiences.
Format your responses with emojis and clear sections.`,
    bachelorette: `You are an experienced bachelorette party planner.
You provide creative, practical, and actionable suggestions for an unforgettable hen party.
Always respond in English with a casual but professional tone.
Think wellness, party, fun, and memorable experiences.
Format your responses with emojis and clear sections.`,
    birthday: `You are an experienced birthday party planner.
You provide creative, practical, and actionable suggestions for an unforgettable celebration.
Always respond in English with a casual but professional tone.
Format your responses with emojis and clear sections.`,
    trip: `You are an experienced group travel planner.
You provide creative, practical, and actionable suggestions for an unforgettable trip.
Always respond in English with a casual but professional tone.
Think adventures, sightseeing, local experiences, and group activities.
Format your responses with emojis and clear sections.`,
    other: `You are an experienced event planner for various group events.
You provide creative, practical, and actionable suggestions.
Always respond in English with a casual but professional tone.
Format your responses with emojis and clear sections.`,
  },
  fr: {
    bachelor: `Tu es un organisateur expérimenté d'enterrements de vie de garçon.
Tu donnes des suggestions créatives, pratiques et réalisables pour une fête inoubliable.
Réponds toujours en français avec un ton décontracté mais professionnel.
Pense action, fête, fun et expériences mémorables.
Formate tes réponses avec des emojis et des sections claires.`,
    bachelorette: `Tu es une organisatrice expérimentée d'enterrements de vie de jeune fille.
Tu donnes des suggestions créatives, pratiques et réalisables pour une fête inoubliable.
Réponds toujours en français avec un ton décontracté mais professionnel.
Pense bien-être, fête, fun et expériences mémorables.
Formate tes réponses avec des emojis et des sections claires.`,
    birthday: `Tu es un organisateur expérimenté de fêtes d'anniversaire.
Tu donnes des suggestions créatives, pratiques et réalisables pour une célébration inoubliable.
Réponds toujours en français avec un ton décontracté mais professionnel.
Formate tes réponses avec des emojis et des sections claires.`,
    trip: `Tu es un organisateur de voyages de groupe expérimenté.
Tu donnes des suggestions créatives, pratiques et réalisables pour un voyage inoubliable.
Réponds toujours en français avec un ton décontracté mais professionnel.
Pense aventures, visites, expériences locales et activités de groupe.
Formate tes réponses avec des emojis et des sections claires.`,
    other: `Tu es un organisateur d'événements expérimenté pour divers événements de groupe.
Tu donnes des suggestions créatives, pratiques et réalisables.
Réponds toujours en français avec un ton décontracté mais professionnel.
Formate tes réponses avec des emojis et des sections claires.`,
  },
  es: {
    bachelor: `Eres un organizador experimentado de despedidas de soltero.
Das sugerencias creativas, prácticas y realizables para una fiesta inolvidable.
Responde siempre en español con un tono relajado pero profesional.
Piensa en acción, fiesta, diversión y experiencias memorables.
Formatea tus respuestas con emojis y secciones claras.`,
    bachelorette: `Eres una organizadora experimentada de despedidas de soltera.
Das sugerencias creativas, prácticas y realizables para una fiesta inolvidable.
Responde siempre en español con un tono relajado pero profesional.
Piensa en bienestar, fiesta, diversión y experiencias memorables.
Formatea tus respuestas con emojis y secciones claras.`,
    birthday: `Eres un organizador experimentado de fiestas de cumpleaños.
Das sugerencias creativas, prácticas y realizables para una celebración inolvidable.
Responde siempre en español con un tono relajado pero profesional.
Formatea tus respuestas con emojis y secciones claras.`,
    trip: `Eres un organizador de viajes en grupo experimentado.
Das sugerencias creativas, prácticas y realizables para un viaje inolvidable.
Responde siempre en español con un tono relajado pero profesional.
Piensa en aventuras, turismo, experiencias locales y actividades grupales.
Formatea tus respuestas con emojis y secciones claras.`,
    other: `Eres un organizador de eventos experimentado para diversos eventos grupales.
Das sugerencias creativas, prácticas y realizables.
Responde siempre en español con un tono relajado pero profesional.
Formatea tus respuestas con emojis y secciones claras.`,
  },
  it: {
    bachelor: `Sei un organizzatore esperto di addii al celibato.
Dai suggerimenti creativi, pratici e realizzabili per una festa indimenticabile.
Rispondi sempre in italiano con un tono rilassato ma professionale.
Pensa ad azione, festa, divertimento ed esperienze memorabili.
Formatta le tue risposte con emoji e sezioni chiare.`,
    bachelorette: `Sei un'organizzatrice esperta di addii al nubilato.
Dai suggerimenti creativi, pratici e realizzabili per una festa indimenticabile.
Rispondi sempre in italiano con un tono rilassato ma professionale.
Pensa a benessere, festa, divertimento ed esperienze memorabili.
Formatta le tue risposte con emoji e sezioni chiare.`,
    birthday: `Sei un organizzatore esperto di feste di compleanno.
Dai suggerimenti creativi, pratici e realizzabili per una celebrazione indimenticabile.
Rispondi sempre in italiano con un tono rilassato ma professionale.
Formatta le tue risposte con emoji e sezioni chiare.`,
    trip: `Sei un organizzatore di viaggi di gruppo esperto.
Dai suggerimenti creativi, pratici e realizzabili per un viaggio indimenticabile.
Rispondi sempre in italiano con un tono rilassato ma professionale.
Pensa ad avventure, visite turistiche, esperienze locali e attività di gruppo.
Formatta le tue risposte con emoji e sezioni chiare.`,
    other: `Sei un organizzatore di eventi esperto per vari eventi di gruppo.
Dai suggerimenti creativi, pratici e realizzabili.
Rispondi sempre in italiano con un tono rilassato ma professionale.
Formatta le tue risposte con emoji e sezioni chiare.`,
  },
  nl: {
    bachelor: `Je bent een ervaren vrijgezellenfeest-organisator.
Je geeft creatieve, praktische en uitvoerbare suggesties voor een onvergetelijk feest.
Antwoord altijd in het Nederlands met een relaxte maar professionele toon.
Denk aan actie, feest, plezier en onvergetelijke ervaringen.
Formatteer je antwoorden met emoji's en duidelijke secties.`,
    bachelorette: `Je bent een ervaren vrijgezellenfeest-organisator voor vrouwen.
Je geeft creatieve, praktische en uitvoerbare suggesties voor een onvergetelijk feest.
Antwoord altijd in het Nederlands met een relaxte maar professionele toon.
Denk aan wellness, feest, plezier en onvergetelijke ervaringen.
Formatteer je antwoorden met emoji's en duidelijke secties.`,
    birthday: `Je bent een ervaren verjaardagsfeest-organisator.
Je geeft creatieve, praktische en uitvoerbare suggesties voor een onvergetelijke viering.
Antwoord altijd in het Nederlands met een relaxte maar professionele toon.
Formatteer je antwoorden met emoji's en duidelijke secties.`,
    trip: `Je bent een ervaren groepsreis-organisator.
Je geeft creatieve, praktische en uitvoerbare suggesties voor een onvergetelijke reis.
Antwoord altijd in het Nederlands met een relaxte maar professionele toon.
Denk aan avonturen, bezienswaardigheden, lokale ervaringen en groepsactiviteiten.
Formatteer je antwoorden met emoji's en duidelijke secties.`,
    other: `Je bent een ervaren evenementenorganisator voor diverse groepsevenementen.
Je geeft creatieve, praktische en uitvoerbare suggesties.
Antwoord altijd in het Nederlands met een relaxte maar professionele toon.
Formatteer je antwoorden met emoji's en duidelijke secties.`,
  },
  pl: {
    bachelor: `Jesteś doświadczonym organizatorem wieczorów kawalerskich.
Dajesz kreatywne, praktyczne i wykonalne sugestie na niezapomnianą imprezę.
Odpowiadaj zawsze po polsku w swobodnym, ale profesjonalnym tonie.
Myśl o akcji, imprezie, zabawie i niezapomnianych przeżyciach.
Formatuj odpowiedzi z emoji i wyraźnymi sekcjami.`,
    bachelorette: `Jesteś doświadczoną organizatorką wieczorów panieńskich.
Dajesz kreatywne, praktyczne i wykonalne sugestie na niezapomnianą imprezę.
Odpowiadaj zawsze po polsku w swobodnym, ale profesjonalnym tonie.
Myśl o wellness, imprezie, zabawie i niezapomnianych przeżyciach.
Formatuj odpowiedzi z emoji i wyraźnymi sekcjami.`,
    birthday: `Jesteś doświadczonym organizatorem przyjęć urodzinowych.
Dajesz kreatywne, praktyczne i wykonalne sugestie na niezapomniane świętowanie.
Odpowiadaj zawsze po polsku w swobodnym, ale profesjonalnym tonie.
Formatuj odpowiedzi z emoji i wyraźnymi sekcjami.`,
    trip: `Jesteś doświadczonym organizatorem wycieczek grupowych.
Dajesz kreatywne, praktyczne i wykonalne sugestie na niezapomnianą podróż.
Odpowiadaj zawsze po polsku w swobodnym, ale profesjonalnym tonie.
Myśl o przygodach, zwiedzaniu, lokalnych doświadczeniach i aktywnościach grupowych.
Formatuj odpowiedzi z emoji i wyraźnymi sekcjami.`,
    other: `Jesteś doświadczonym organizatorem różnych wydarzeń grupowych.
Dajesz kreatywne, praktyczne i wykonalne sugestie.
Odpowiadaj zawsze po polsku w swobodnym, ale profesjonalnym tonie.
Formatuj odpowiedzi z emoji i wyraźnymi sekcjami.`,
  },
  pt: {
    bachelor: `És um organizador experiente de despedidas de solteiro.
Dás sugestões criativas, práticas e realizáveis para uma festa inesquecível.
Responde sempre em português com um tom descontraído mas profissional.
Pensa em ação, festa, diversão e experiências memoráveis.
Formata as tuas respostas com emojis e secções claras.`,
    bachelorette: `És uma organizadora experiente de despedidas de solteira.
Dás sugestões criativas, práticas e realizáveis para uma festa inesquecível.
Responde sempre em português com um tom descontraído mas profissional.
Pensa em bem-estar, festa, diversão e experiências memoráveis.
Formata as tuas respostas com emojis e secções claras.`,
    birthday: `És um organizador experiente de festas de aniversário.
Dás sugestões criativas, práticas e realizáveis para uma celebração inesquecível.
Responde sempre em português com um tom descontraído mas profissional.
Formata as tuas respostas com emojis e secções claras.`,
    trip: `És um organizador de viagens em grupo experiente.
Dás sugestões criativas, práticas e realizáveis para uma viagem inesquecível.
Responde sempre em português com um tom descontraído mas profissional.
Pensa em aventuras, turismo, experiências locais e atividades de grupo.
Formata as tuas respostas com emojis e secções claras.`,
    other: `És um organizador de eventos experiente para diversos eventos de grupo.
Dás sugestões criativas, práticas e realizáveis.
Responde sempre em português com um tom descontraído mas profissional.
Formata as tuas respostas com emojis e secções claras.`,
  },
  tr: {
    bachelor: `Bekarlığa veda partisi organizasyonunda deneyimli bir planlayıcısın.
Unutulmaz bir parti için yaratıcı, pratik ve uygulanabilir öneriler sunuyorsun.
Her zaman Türkçe, rahat ama profesyonel bir tonda cevap ver.
Aksiyon, parti, eğlence ve unutulmaz deneyimler düşün.
Cevaplarını emoji ve net bölümlerle formatla.`,
    bachelorette: `Bekarlığa veda partisi organizasyonunda deneyimli bir planlayıcısın.
Unutulmaz bir parti için yaratıcı, pratik ve uygulanabilir öneriler sunuyorsun.
Her zaman Türkçe, rahat ama profesyonel bir tonda cevap ver.
Wellness, parti, eğlence ve unutulmaz deneyimler düşün.
Cevaplarını emoji ve net bölümlerle formatla.`,
    birthday: `Doğum günü partisi organizasyonunda deneyimli bir planlayıcısın.
Unutulmaz bir kutlama için yaratıcı, pratik ve uygulanabilir öneriler sunuyorsun.
Her zaman Türkçe, rahat ama profesyonel bir tonda cevap ver.
Cevaplarını emoji ve net bölümlerle formatla.`,
    trip: `Grup seyahati organizasyonunda deneyimli bir planlayıcısın.
Unutulmaz bir gezi için yaratıcı, pratik ve uygulanabilir öneriler sunuyorsun.
Her zaman Türkçe, rahat ama profesyonel bir tonda cevap ver.
Maceralar, gezi, yerel deneyimler ve grup aktiviteleri düşün.
Cevaplarını emoji ve net bölümlerle formatla.`,
    other: `Çeşitli grup etkinlikleri için deneyimli bir etkinlik planlayıcısısın.
Yaratıcı, pratik ve uygulanabilir öneriler sunuyorsun.
Her zaman Türkçe, rahat ama profesyonel bir tonda cevap ver.
Cevaplarını emoji ve net bölümlerle formatla.`,
  },
  ar: {
    bachelor: `أنت منظم حفلات وداع العزوبية للرجال ذو خبرة.
تقدم اقتراحات إبداعية وعملية وقابلة للتنفيذ لحفلة لا تُنسى.
أجب دائمًا بالعربية بأسلوب مريح لكن احترافي.
فكر في الحركة والحفلات والمرح والتجارب التي لا تُنسى.
نسق إجاباتك بالرموز التعبيرية والأقسام الواضحة.`,
    bachelorette: `أنت منظمة حفلات وداع العزوبية للنساء ذات خبرة.
تقدمين اقتراحات إبداعية وعملية وقابلة للتنفيذ لحفلة لا تُنسى.
أجيبي دائمًا بالعربية بأسلوب مريح لكن احترافي.
فكري في الاسترخاء والحفلات والمرح والتجارب التي لا تُنسى.
نسقي إجاباتك بالرموز التعبيرية والأقسام الواضحة.`,
    birthday: `أنت منظم حفلات أعياد الميلاد ذو خبرة.
تقدم اقتراحات إبداعية وعملية وقابلة للتنفيذ لاحتفال لا يُنسى.
أجب دائمًا بالعربية بأسلوب مريح لكن احترافي.
نسق إجاباتك بالرموز التعبيرية والأقسام الواضحة.`,
    trip: `أنت منظم رحلات جماعية ذو خبرة.
تقدم اقتراحات إبداعية وعملية وقابلة للتنفيذ لرحلة لا تُنسى.
أجب دائمًا بالعربية بأسلوب مريح لكن احترافي.
فكر في المغامرات ومشاهدة المعالم والتجارب المحلية والأنشطة الجماعية.
نسق إجاباتك بالرموز التعبيرية والأقسام الواضحة.`,
    other: `أنت منظم فعاليات ذو خبرة لمختلف الفعاليات الجماعية.
تقدم اقتراحات إبداعية وعملية وقابلة للتنفيذ.
أجب دائمًا بالعربية بأسلوب مريح لكن احترافي.
نسق إجاباتك بالرموز التعبيرية والأقسام الواضحة.`,
  },
};

// =============================================================================
// MULTILINGUAL USER PROMPT TEMPLATES
// =============================================================================
const USER_PROMPT_TEMPLATES: Record<string, {
  context_header: string;
  event_types: Record<string, string>;
  labels: {
    honoree: string;
    event_name: string;
    participants: string;
    budget: string;
    destination: string;
    activities: string;
    restrictions: string;
    fitness: string;
    duration: string;
    date_info: string;
  };
  prompts: {
    trip_ideas: string;
    activities: string;
    day_plan: string;
    budget_estimate: string;
    chat: string;
    message_enhance: Record<string, string>;
  };
}> = {
  de: {
    context_header: "Event-Kontext:",
    event_types: {
      bachelor: "Junggesellenabschied (JGA)",
      bachelorette: "JGA (Braut)",
      birthday: "Geburtstag",
      trip: "Gruppenreise",
      other: "Event",
    },
    labels: {
      honoree: "Ehrengast",
      event_name: "Event-Name",
      participants: "Teilnehmer",
      budget: "Budget pro Person",
      destination: "Destination-Präferenz",
      activities: "Bevorzugte Aktivitäten",
      restrictions: "Einschränkungen",
      fitness: "Fitness-Level",
      duration: "Dauer",
      date_info: "Zeitraum",
    },
    prompts: {
      trip_ideas: `Schlage 3-4 passende Trip-Ideen vor. Für jede Idee:
1. 🎯 Name/Titel des Trips
2. 📍 Destination/Ort
3. 💡 Kurzbeschreibung (2-3 Sätze)
4. 💰 Geschätzte Kosten pro Person
5. ✅ Warum es passt

Sei kreativ aber realistisch!`,
      activities: `Schlage 5-6 passende Aktivitäten vor. Für jede Aktivität:
1. 🎯 Name der Aktivität
2. ⏱️ Dauer
3. 💰 Kosten pro Person
4. 💪 Fitness-Anforderung
5. 📝 Kurze Beschreibung

Mische verschiedene Arten: Action, Entspannung, Essen/Trinken, Erlebnis.`,
      day_plan: `Erstelle einen detaillierten Tagesablauf:
⏰ Zeitplan mit Uhrzeiten
🚗 Transport zwischen Aktivitäten
🍽️ Essen & Trinken Empfehlungen
💡 Pro-Tipps für die Organisation
⚠️ Was man beachten sollte`,
      budget_estimate: `Erstelle eine detaillierte Budget-Schätzung:
📊 Aufschlüsselung nach Kategorien (Transport, Unterkunft, Aktivitäten, Essen, Extras)
💰 Gesamtkosten pro Person
💡 Spartipps
⚠️ Versteckte Kosten`,
      chat: "Benutzer-Frage: {message}\n\nBeantworte die Frage basierend auf dem Event-Kontext.",
      message_enhance: {
        casual: "Mache den Text lockerer, freundlicher und informeller. Nutze mehr Emojis.",
        formal: "Mache den Text formeller und professioneller. Reduziere Emojis.",
        shorter: "Kürze den Text auf das Wesentliche.",
        detailed: "Füge mehr Details und hilfreiche Informationen hinzu.",
        custom: "{instruction}",
      },
    },
  },
  en: {
    context_header: "Event Context:",
    event_types: {
      bachelor: "Bachelor Party",
      bachelorette: "Bachelorette Party",
      birthday: "Birthday Party",
      trip: "Group Trip",
      other: "Event",
    },
    labels: {
      honoree: "Guest of Honor",
      event_name: "Event Name",
      participants: "Participants",
      budget: "Budget per person",
      destination: "Destination preference",
      activities: "Preferred activities",
      restrictions: "Restrictions",
      fitness: "Fitness level",
      duration: "Duration",
      date_info: "Date range",
    },
    prompts: {
      trip_ideas: `Suggest 3-4 fitting trip ideas. For each idea:
1. 🎯 Trip name/title
2. 📍 Destination/location
3. 💡 Brief description (2-3 sentences)
4. 💰 Estimated cost per person
5. ✅ Why it fits

Be creative but realistic!`,
      activities: `Suggest 5-6 fitting activities. For each activity:
1. 🎯 Activity name
2. ⏱️ Duration
3. 💰 Cost per person
4. 💪 Fitness requirement
5. 📝 Brief description

Mix different types: Action, relaxation, food/drinks, experiences.`,
      day_plan: `Create a detailed day schedule:
⏰ Timeline with times
🚗 Transport between activities
🍽️ Food & drink recommendations
💡 Pro tips for organization
⚠️ Things to consider`,
      budget_estimate: `Create a detailed budget estimate:
📊 Breakdown by category (Transport, accommodation, activities, food, extras)
💰 Total cost per person
💡 Money-saving tips
⚠️ Hidden costs`,
      chat: "User question: {message}\n\nAnswer based on the event context.",
      message_enhance: {
        casual: "Make the text more casual, friendly and informal. Use more emojis.",
        formal: "Make the text more formal and professional. Reduce emojis.",
        shorter: "Shorten the text to the essentials.",
        detailed: "Add more details and helpful information.",
        custom: "{instruction}",
      },
    },
  },
  fr: {
    context_header: "Contexte de l'événement:",
    event_types: {
      bachelor: "Enterrement de vie de garçon",
      bachelorette: "Enterrement de vie de jeune fille",
      birthday: "Anniversaire",
      trip: "Voyage de groupe",
      other: "Événement",
    },
    labels: {
      honoree: "Invité d'honneur",
      event_name: "Nom de l'événement",
      participants: "Participants",
      budget: "Budget par personne",
      destination: "Préférence de destination",
      activities: "Activités préférées",
      restrictions: "Restrictions",
      fitness: "Niveau de forme",
      duration: "Durée",
      date_info: "Période",
    },
    prompts: {
      trip_ideas: `Suggère 3-4 idées de voyage adaptées. Pour chaque idée:
1. 🎯 Nom/titre du voyage
2. 📍 Destination/lieu
3. 💡 Brève description (2-3 phrases)
4. 💰 Coût estimé par personne
5. ✅ Pourquoi ça convient

Sois créatif mais réaliste!`,
      activities: `Suggère 5-6 activités adaptées. Pour chaque activité:
1. 🎯 Nom de l'activité
2. ⏱️ Durée
3. 💰 Coût par personne
4. 💪 Niveau de forme requis
5. 📝 Brève description`,
      day_plan: `Crée un programme détaillé:
⏰ Planning avec horaires
🚗 Transport entre activités
🍽️ Recommandations resto
💡 Conseils d'organisation
⚠️ Points à considérer`,
      budget_estimate: `Crée une estimation budgétaire détaillée:
📊 Répartition par catégorie
💰 Coût total par personne
💡 Astuces économies
⚠️ Coûts cachés`,
      chat: "Question: {message}\n\nRéponds en fonction du contexte.",
      message_enhance: {
        casual: "Rends le texte plus décontracté et amical. Utilise plus d'emojis.",
        formal: "Rends le texte plus formel et professionnel.",
        shorter: "Raccourcis le texte à l'essentiel.",
        detailed: "Ajoute plus de détails.",
        custom: "{instruction}",
      },
    },
  },
  es: {
    context_header: "Contexto del evento:",
    event_types: {
      bachelor: "Despedida de soltero",
      bachelorette: "Despedida de soltera",
      birthday: "Cumpleaños",
      trip: "Viaje en grupo",
      other: "Evento",
    },
    labels: {
      honoree: "Invitado de honor",
      event_name: "Nombre del evento",
      participants: "Participantes",
      budget: "Presupuesto por persona",
      destination: "Preferencia de destino",
      activities: "Actividades preferidas",
      restrictions: "Restricciones",
      fitness: "Nivel de forma física",
      duration: "Duración",
      date_info: "Período",
    },
    prompts: {
      trip_ideas: `Sugiere 3-4 ideas de viaje. Para cada idea:
1. 🎯 Nombre del viaje
2. 📍 Destino
3. 💡 Descripción breve
4. 💰 Costo estimado por persona
5. ✅ Por qué encaja

¡Sé creativo pero realista!`,
      activities: `Sugiere 5-6 actividades. Para cada actividad:
1. 🎯 Nombre
2. ⏱️ Duración
3. 💰 Costo por persona
4. 💪 Nivel de forma requerido
5. 📝 Descripción breve`,
      day_plan: `Crea un horario detallado:
⏰ Programa con horarios
🚗 Transporte entre actividades
🍽️ Recomendaciones de comida
💡 Consejos de organización
⚠️ Cosas a considerar`,
      budget_estimate: `Crea una estimación de presupuesto:
📊 Desglose por categoría
💰 Costo total por persona
💡 Consejos de ahorro
⚠️ Costos ocultos`,
      chat: "Pregunta: {message}\n\nResponde según el contexto.",
      message_enhance: {
        casual: "Hazlo más casual y amigable. Usa más emojis.",
        formal: "Hazlo más formal y profesional.",
        shorter: "Acorta el texto a lo esencial.",
        detailed: "Añade más detalles.",
        custom: "{instruction}",
      },
    },
  },
  it: {
    context_header: "Contesto dell'evento:",
    event_types: {
      bachelor: "Addio al celibato",
      bachelorette: "Addio al nubilato",
      birthday: "Compleanno",
      trip: "Viaggio di gruppo",
      other: "Evento",
    },
    labels: {
      honoree: "Ospite d'onore",
      event_name: "Nome evento",
      participants: "Partecipanti",
      budget: "Budget per persona",
      destination: "Preferenza destinazione",
      activities: "Attività preferite",
      restrictions: "Restrizioni",
      fitness: "Livello fitness",
      duration: "Durata",
      date_info: "Periodo",
    },
    prompts: {
      trip_ideas: `Suggerisci 3-4 idee di viaggio. Per ogni idea:
1. 🎯 Nome del viaggio
2. 📍 Destinazione
3. 💡 Breve descrizione
4. 💰 Costo stimato a persona
5. ✅ Perché è adatto

Sii creativo ma realistico!`,
      activities: `Suggerisci 5-6 attività. Per ogni attività:
1. 🎯 Nome
2. ⏱️ Durata
3. 💰 Costo a persona
4. 💪 Requisito fitness
5. 📝 Breve descrizione`,
      day_plan: `Crea un programma dettagliato:
⏰ Timeline con orari
🚗 Trasporto tra attività
🍽️ Raccomandazioni cibo
💡 Consigli organizzazione
⚠️ Cose da considerare`,
      budget_estimate: `Crea una stima budget:
📊 Suddivisione per categoria
💰 Costo totale a persona
💡 Consigli risparmio
⚠️ Costi nascosti`,
      chat: "Domanda: {message}\n\nRispondi in base al contesto.",
      message_enhance: {
        casual: "Rendilo più casual e amichevole. Usa più emoji.",
        formal: "Rendilo più formale e professionale.",
        shorter: "Accorcia il testo all'essenziale.",
        detailed: "Aggiungi più dettagli.",
        custom: "{instruction}",
      },
    },
  },
  nl: {
    context_header: "Evenement context:",
    event_types: {
      bachelor: "Vrijgezellenfeest (man)",
      bachelorette: "Vrijgezellenfeest (vrouw)",
      birthday: "Verjaardag",
      trip: "Groepsreis",
      other: "Evenement",
    },
    labels: {
      honoree: "Eregast",
      event_name: "Evenement naam",
      participants: "Deelnemers",
      budget: "Budget per persoon",
      destination: "Bestemmingsvoorkeur",
      activities: "Voorkeursactiviteiten",
      restrictions: "Beperkingen",
      fitness: "Fitnessniveau",
      duration: "Duur",
      date_info: "Periode",
    },
    prompts: {
      trip_ideas: `Stel 3-4 passende reisideeën voor. Per idee:
1. 🎯 Naam van de reis
2. 📍 Bestemming
3. 💡 Korte beschrijving
4. 💰 Geschatte kosten per persoon
5. ✅ Waarom het past

Wees creatief maar realistisch!`,
      activities: `Stel 5-6 passende activiteiten voor. Per activiteit:
1. 🎯 Naam
2. ⏱️ Duur
3. 💰 Kosten per persoon
4. 💪 Fitnessvereiste
5. 📝 Korte beschrijving`,
      day_plan: `Maak een gedetailleerd dagprogramma:
⏰ Tijdschema met tijden
🚗 Vervoer tussen activiteiten
🍽️ Eten & drinken aanbevelingen
💡 Organisatietips
⚠️ Aandachtspunten`,
      budget_estimate: `Maak een gedetailleerde budgetschatting:
📊 Uitsplitsing per categorie
💰 Totale kosten per persoon
💡 Bespaartips
⚠️ Verborgen kosten`,
      chat: "Vraag: {message}\n\nBeantwoord op basis van de context.",
      message_enhance: {
        casual: "Maak de tekst informeler en vriendelijker. Gebruik meer emoji's.",
        formal: "Maak de tekst formeler en professioneler.",
        shorter: "Verkort de tekst tot de essentie.",
        detailed: "Voeg meer details toe.",
        custom: "{instruction}",
      },
    },
  },
  pl: {
    context_header: "Kontekst wydarzenia:",
    event_types: {
      bachelor: "Wieczór kawalerski",
      bachelorette: "Wieczór panieński",
      birthday: "Urodziny",
      trip: "Wycieczka grupowa",
      other: "Wydarzenie",
    },
    labels: {
      honoree: "Gość honorowy",
      event_name: "Nazwa wydarzenia",
      participants: "Uczestnicy",
      budget: "Budżet na osobę",
      destination: "Preferowana destynacja",
      activities: "Preferowane aktywności",
      restrictions: "Ograniczenia",
      fitness: "Poziom kondycji",
      duration: "Czas trwania",
      date_info: "Okres",
    },
    prompts: {
      trip_ideas: `Zaproponuj 3-4 pomysły na wyjazd. Dla każdego:
1. 🎯 Nazwa wycieczki
2. 📍 Destynacja
3. 💡 Krótki opis
4. 💰 Szacunkowy koszt na osobę
5. ✅ Dlaczego pasuje

Bądź kreatywny ale realistyczny!`,
      activities: `Zaproponuj 5-6 aktywności. Dla każdej:
1. 🎯 Nazwa
2. ⏱️ Czas trwania
3. 💰 Koszt na osobę
4. 💪 Wymagana kondycja
5. 📝 Krótki opis`,
      day_plan: `Stwórz szczegółowy harmonogram:
⏰ Plan z godzinami
🚗 Transport między aktywnościami
🍽️ Rekomendacje jedzenia
💡 Wskazówki organizacyjne
⚠️ Na co uważać`,
      budget_estimate: `Stwórz szczegółową wycenę:
📊 Podział na kategorie
💰 Całkowity koszt na osobę
💡 Porady oszczędnościowe
⚠️ Ukryte koszty`,
      chat: "Pytanie: {message}\n\nOdpowiedz na podstawie kontekstu.",
      message_enhance: {
        casual: "Zrób tekst bardziej swobodny i przyjazny. Użyj więcej emoji.",
        formal: "Zrób tekst bardziej formalny i profesjonalny.",
        shorter: "Skróć tekst do esencji.",
        detailed: "Dodaj więcej szczegółów.",
        custom: "{instruction}",
      },
    },
  },
  pt: {
    context_header: "Contexto do evento:",
    event_types: {
      bachelor: "Despedida de solteiro",
      bachelorette: "Despedida de solteira",
      birthday: "Aniversário",
      trip: "Viagem em grupo",
      other: "Evento",
    },
    labels: {
      honoree: "Convidado de honra",
      event_name: "Nome do evento",
      participants: "Participantes",
      budget: "Orçamento por pessoa",
      destination: "Preferência de destino",
      activities: "Atividades preferidas",
      restrictions: "Restrições",
      fitness: "Nível de forma física",
      duration: "Duração",
      date_info: "Período",
    },
    prompts: {
      trip_ideas: `Sugere 3-4 ideias de viagem. Para cada uma:
1. 🎯 Nome da viagem
2. 📍 Destino
3. 💡 Descrição breve
4. 💰 Custo estimado por pessoa
5. ✅ Por que encaixa

Sê criativo mas realista!`,
      activities: `Sugere 5-6 atividades. Para cada uma:
1. 🎯 Nome
2. ⏱️ Duração
3. 💰 Custo por pessoa
4. 💪 Requisito de forma física
5. 📝 Descrição breve`,
      day_plan: `Cria um horário detalhado:
⏰ Programa com horários
🚗 Transporte entre atividades
🍽️ Recomendações de comida
💡 Dicas de organização
⚠️ Coisas a considerar`,
      budget_estimate: `Cria uma estimativa de orçamento:
📊 Divisão por categoria
💰 Custo total por pessoa
💡 Dicas de poupança
⚠️ Custos ocultos`,
      chat: "Pergunta: {message}\n\nResponde com base no contexto.",
      message_enhance: {
        casual: "Torna mais casual e amigável. Usa mais emojis.",
        formal: "Torna mais formal e profissional.",
        shorter: "Encurta o texto ao essencial.",
        detailed: "Adiciona mais detalhes.",
        custom: "{instruction}",
      },
    },
  },
  tr: {
    context_header: "Etkinlik bağlamı:",
    event_types: {
      bachelor: "Bekarlığa veda (erkek)",
      bachelorette: "Bekarlığa veda (kadın)",
      birthday: "Doğum günü",
      trip: "Grup gezisi",
      other: "Etkinlik",
    },
    labels: {
      honoree: "Onur konuğu",
      event_name: "Etkinlik adı",
      participants: "Katılımcılar",
      budget: "Kişi başı bütçe",
      destination: "Destinasyon tercihi",
      activities: "Tercih edilen aktiviteler",
      restrictions: "Kısıtlamalar",
      fitness: "Fitness seviyesi",
      duration: "Süre",
      date_info: "Tarih aralığı",
    },
    prompts: {
      trip_ideas: `3-4 uygun gezi fikri öner. Her biri için:
1. 🎯 Gezi adı
2. 📍 Destinasyon
3. 💡 Kısa açıklama
4. 💰 Kişi başı tahmini maliyet
5. ✅ Neden uygun

Yaratıcı ama gerçekçi ol!`,
      activities: `5-6 uygun aktivite öner. Her biri için:
1. 🎯 Ad
2. ⏱️ Süre
3. 💰 Kişi başı maliyet
4. 💪 Fitness gereksinimi
5. 📝 Kısa açıklama`,
      day_plan: `Detaylı bir günlük program oluştur:
⏰ Saatlerle timeline
🚗 Aktiviteler arası ulaşım
🍽️ Yemek önerileri
💡 Organizasyon ipuçları
⚠️ Dikkat edilecekler`,
      budget_estimate: `Detaylı bütçe tahmini oluştur:
📊 Kategorilere göre dağılım
💰 Kişi başı toplam maliyet
💡 Tasarruf ipuçları
⚠️ Gizli maliyetler`,
      chat: "Soru: {message}\n\nBağlama göre cevapla.",
      message_enhance: {
        casual: "Metni daha rahat ve samimi yap. Daha çok emoji kullan.",
        formal: "Metni daha resmi ve profesyonel yap.",
        shorter: "Metni öze indir.",
        detailed: "Daha fazla detay ekle.",
        custom: "{instruction}",
      },
    },
  },
  ar: {
    context_header: "سياق الفعالية:",
    event_types: {
      bachelor: "حفلة وداع العزوبية (رجال)",
      bachelorette: "حفلة وداع العزوبية (نساء)",
      birthday: "عيد ميلاد",
      trip: "رحلة جماعية",
      other: "فعالية",
    },
    labels: {
      honoree: "ضيف الشرف",
      event_name: "اسم الفعالية",
      participants: "المشاركون",
      budget: "الميزانية للشخص",
      destination: "تفضيل الوجهة",
      activities: "الأنشطة المفضلة",
      restrictions: "القيود",
      fitness: "مستوى اللياقة",
      duration: "المدة",
      date_info: "الفترة الزمنية",
    },
    prompts: {
      trip_ideas: `اقترح 3-4 أفكار رحلات. لكل فكرة:
1. 🎯 اسم الرحلة
2. 📍 الوجهة
3. 💡 وصف موجز
4. 💰 التكلفة المقدرة للشخص
5. ✅ لماذا تناسب

كن مبدعاً لكن واقعياً!`,
      activities: `اقترح 5-6 أنشطة. لكل نشاط:
1. 🎯 الاسم
2. ⏱️ المدة
3. 💰 التكلفة للشخص
4. 💪 متطلبات اللياقة
5. 📝 وصف موجز`,
      day_plan: `أنشئ جدول يومي مفصل:
⏰ برنامج بالأوقات
🚗 التنقل بين الأنشطة
🍽️ توصيات الطعام
💡 نصائح التنظيم
⚠️ أمور يجب مراعاتها`,
      budget_estimate: `أنشئ تقدير ميزانية مفصل:
📊 تقسيم حسب الفئة
💰 التكلفة الإجمالية للشخص
💡 نصائح التوفير
⚠️ التكاليف الخفية`,
      chat: "السؤال: {message}\n\nأجب بناءً على السياق.",
      message_enhance: {
        casual: "اجعل النص أكثر وداً وغير رسمي. استخدم المزيد من الرموز التعبيرية.",
        formal: "اجعل النص أكثر رسمية واحترافية.",
        shorter: "اختصر النص للأساسيات.",
        detailed: "أضف المزيد من التفاصيل.",
        custom: "{instruction}",
      },
    },
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
function getSystemPrompt(language: string, eventType: string): string {
  const lang = SYSTEM_PROMPTS[language] ? language : 'en';
  const prompts = SYSTEM_PROMPTS[lang];
  return prompts[eventType] || prompts['other'];
}

function getPromptTemplate(language: string) {
  return USER_PROMPT_TEMPLATES[language] || USER_PROMPT_TEMPLATES['en'];
}

function buildContextInfo(context: RequestBody['context'], language: string): string {
  const template = getPromptTemplate(language);
  const eventTypeName = template.event_types[context.event_type] || template.event_types['other'];
  
  let info = `${template.context_header}\n`;
  
  // Add event name if provided
  if (context.event_name) {
    info += `🎯 ${template.labels.event_name}: ${context.event_name}\n`;
  }
  
  info += `📋 ${eventTypeName}\n`;
  info += `👤 ${template.labels.honoree}: ${context.honoree_name}\n`;
  info += `👥 ${template.labels.participants}: ${context.participant_count}\n`;
  
  if (context.avg_budget) {
    info += `💰 ${template.labels.budget}: ${context.avg_budget}\n`;
  }
  if (context.destination_pref) {
    info += `📍 ${template.labels.destination}: ${context.destination_pref}\n`;
  }
  if (context.top_activities?.length) {
    info += `🎯 ${template.labels.activities}: ${context.top_activities.join(", ")}\n`;
  }
  if (context.restrictions?.length) {
    info += `⚠️ ${template.labels.restrictions}: ${context.restrictions.join(", ")}\n`;
  }
  if (context.fitness_level) {
    info += `💪 ${template.labels.fitness}: ${context.fitness_level}\n`;
  }
  if (context.duration) {
    info += `⏱️ ${template.labels.duration}: ${context.duration}\n`;
  }
  if (context.date_info) {
    info += `📅 ${template.labels.date_info}: ${context.date_info}\n`;
  }
  if (context.event_description) {
    info += `📝 ${context.event_description}\n`;
  }
  
  return info;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RequestBody = await req.json();
    const { type, context, message } = body;
    
    // Determine language from context or default to 'de'
    const language = context.language || 'de';
    const eventType = context.event_type || 'other';

    console.log("AI Assistant request:", { type, language, eventType, event_name: context.event_name });

    // Get localized prompts
    const systemPrompt = getSystemPrompt(language, eventType);
    const promptTemplate = getPromptTemplate(language);
    const contextInfo = buildContextInfo(context, language);

    let userPrompt = "";

    switch (type) {
      case "trip_ideas":
        userPrompt = `${contextInfo}\n\n${promptTemplate.prompts.trip_ideas}`;
        break;

      case "activities":
        userPrompt = `${contextInfo}\n\n${promptTemplate.prompts.activities}`;
        break;

      case "day_plan":
        userPrompt = `${contextInfo}\n\n${promptTemplate.prompts.day_plan}`;
        break;

      case "budget_estimate":
        userPrompt = `${contextInfo}\n\n${promptTemplate.prompts.budget_estimate}`;
        break;

      case "chat":
        userPrompt = `${contextInfo}\n\n${promptTemplate.prompts.chat.replace('{message}', message || '')}`;
        break;

      case "message_enhance":
        const enhanceType = context.enhancement_type || "casual";
        let enhanceInstruction = promptTemplate.prompts.message_enhance[enhanceType] || promptTemplate.prompts.message_enhance.casual;
        
        if (enhanceType === "custom" && context.custom_instruction) {
          enhanceInstruction = enhanceInstruction.replace('{instruction}', context.custom_instruction);
        }
        
        userPrompt = `${contextInfo}

Original text (template: ${context.template_type || 'general'}):
${context.original_text}

Instruction: ${enhanceInstruction}

Return ONLY the improved message without additional explanations. Keep placeholders like {{honoree}}, {{surveyLink}}, {{accessCode}} etc.`;
        break;

      default:
        userPrompt = message || promptTemplate.prompts.chat.replace('{message}', 'How can I help with event planning?');
    }

    console.log("Calling Lovable AI with language:", language);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        const errorMsgs: Record<string, string> = {
          de: "Zu viele Anfragen. Bitte warte einen Moment.",
          en: "Too many requests. Please wait a moment.",
          fr: "Trop de requêtes. Veuillez patienter.",
          es: "Demasiadas solicitudes. Por favor espera.",
          it: "Troppe richieste. Attendi un momento.",
          nl: "Te veel verzoeken. Even geduld.",
          pl: "Za dużo zapytań. Proszę chwilę poczekać.",
          pt: "Muitos pedidos. Por favor aguarde.",
          tr: "Çok fazla istek. Lütfen bekleyin.",
          ar: "طلبات كثيرة جداً. يرجى الانتظار.",
        };
        return new Response(
          JSON.stringify({ success: false, error: errorMsgs[language] || errorMsgs.en }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI quota exceeded" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "No response received.";

    console.log("AI response received successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        response: content,
        type,
        language
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-assistant:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
