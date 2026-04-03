import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// Credit limits per plan type
const AI_CREDIT_LIMITS: Record<string, number> = {
  free: 0,
  monthly: 50,
  yearly: 100,
  lifetime: 75,
};

interface RequestBody {
  type: "trip_ideas" | "activities" | "day_plan" | "budget_estimate" | "chat" | "message_enhance" | "voxtral_tts";
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
    // For day_plan
    target_days?: number;
  };
  message?: string;
  eventId?: string;
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
    fitness: string;
    duration: string;
    description: string;
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
    context_header: "📋 EVENT-KONTEXT",
    event_types: {
      bachelor: "Junggesellenabschied (Männer)",
      bachelorette: "Junggesellinnenabschied (Frauen)",
      birthday: "Geburtstagsfeier",
      trip: "Gruppenreise",
      other: "Gruppen-Event",
    },
    labels: {
      honoree: "Ehrengast",
      event_name: "Event-Name",
      participants: "Teilnehmer",
      budget: "Budget pro Person",
      destination: "Reiseziel-Präferenz",
      activities: "Beliebte Aktivitäten",
      fitness: "Fitness-Level",
      duration: "Dauer",
      description: "Beschreibung",
    },
    prompts: {
      trip_ideas: `Generiere 5 kreative und detaillierte Reiseziel-Ideen für dieses Event.
      
Für jedes Ziel gib an:
- 🌍 Zielort (Stadt/Region)
- ✨ Warum es perfekt passt
- 🏠 Unterkunfts-Empfehlung
- 🎯 Top 3 Aktivitäten vor Ort
- 💰 Geschätztes Budget (Transport + Unterkunft + Aktivitäten)
- 🗓️ Beste Reisezeit

Formatiere alles übersichtlich mit Emojis und klaren Abschnitten.`,
      activities: `Generiere 10 passende Aktivitäten für dieses Event.

**WICHTIG: Formatiere JEDE Aktivität exakt so (mit Nummer am Anfang):**

### 1. 🎯 [Aktivitätsname]
📝 **Beschreibung:** [2-3 Sätze die beschreiben was man macht und warum es Spaß macht]
⏱️ **Dauer:** [z.B. 2-3 Stunden]
💰 **Kosten:** [z.B. ca. 30-50€ pro Person]
💪 **Fitness:** [Leicht/Normal/Anspruchsvoll]
📍 **Ort:** [Möglicher Standort oder Anbieter]
🎯 **Kategorie:** [Action/Food/Wellness/Party/Sightseeing/Adventure]

---

### 2. 🍽️ [Nächste Aktivität]
...

Mische actionreiche und entspannte Aktivitäten. Jede Aktivität MUSS eine Nummer haben!`,
      day_plan: `Erstelle einen detaillierten Tagesplan für dieses Event.

**STRIKT EINZUHALTENDES FORMAT - BITTE GENAU SO AUSGEBEN:**

Beginne JEDEN Tag mit diesem exakten Header-Format:
## [Wochentag]: [Kurztitel] [Emojis]

Dann für JEDEN Zeitblock dieses Format verwenden:

### [HH:MM] [Emoji] [Aktivitäts-Titel]
📍 **Ort:** [Genauer Ort/Adresse]
💰 **Kosten:** [ca. XX€ pro Person]
⏱️ **Dauer:** [X Stunden]
📝 **Beschreibung:** [2-3 Sätze was man macht]
💡 **Tipp:** [Praktischer Hinweis]

---

**BEISPIEL (genau so formatieren!):**

## Freitag: Ankunft & Willkommen! ✈️🎉

### 17:00 ✈️ Ankunft am Flughafen
📍 **Ort:** Las Vegas McCarran International Airport
💰 **Kosten:** ca. 30€ für Taxi zum Hotel
⏱️ **Dauer:** 1-2 Stunden
📝 **Beschreibung:** Ankunft in Vegas, Gepäck abholen und Transfer zum Hotel.
💡 **Tipp:** Uber/Lyft ist oft günstiger als Taxis.

---

### 19:00 🍽️ Willkommens-Dinner
📍 **Ort:** Gordon Ramsay Burger, Planet Hollywood
💰 **Kosten:** ca. 40-60€ pro Person
⏱️ **Dauer:** 2 Stunden
📝 **Beschreibung:** Gemeinsames Abendessen zum Einstimmen auf das Wochenende.
💡 **Tipp:** Reservierung empfohlen für große Gruppen.

---

### 22:00 🎰 Casino Night
📍 **Ort:** Bellagio Casino Floor
💰 **Kosten:** Eigenes Spielbudget mitbringen
⏱️ **Dauer:** 2-3 Stunden
📝 **Beschreibung:** Erstes Casino-Feeling mit klassischen Spielen.
💡 **Tipp:** Setze dir ein festes Limit vor dem Spielen.

---

## Samstag: Action & Abenteuer! 🏎️🌃

### 09:00 ☀️ Frühstück
...

**REGELN:**
1. Jeder Tag MUSS mit ## [Wochentag]: [Titel] [Emojis] beginnen
2. Jeder Zeitblock MUSS mit ### [HH:MM] [Emoji] [Titel] beginnen
3. JEDES Feld (Ort, Kosten, Dauer, Beschreibung, Tipp) MUSS auf eigener Zeile stehen
4. Zwischen Zeitblöcken IMMER --- als Trenner
5. KEINE Bullet-Points oder verschachtelten Listen
6. Verwende konkrete Uhrzeiten im Format HH:MM`,
      budget_estimate: `Erstelle eine detaillierte Budgetschätzung für dieses Event.

Kategorien:
- 🏠 Unterkunft (pro Nacht, pro Person)
- 🚗 Transport (Anreise + vor Ort)
- 🎯 Aktivitäten (alle geplanten)
- 🍽️ Verpflegung (Frühstück, Mittag, Abend, Snacks)
- 🍻 Getränke/Party
- 🎁 Sonstiges (Deko, Überraschungen, etc.)

Gib für jede Kategorie:
- Minimum-Budget
- Empfohlenes Budget
- Premium-Budget

Erstelle am Ende eine Gesamtübersicht.`,
      chat: `Der Nutzer fragt: {message}

Beantworte die Frage hilfreich und im Kontext des Events. 
Gib praktische, umsetzbare Tipps.`,
      message_enhance: {
        casual: "Mache diese Nachricht freundlicher und lockerer, aber behalte alle wichtigen Informationen bei.",
        formal: "Mache diese Nachricht professioneller und formeller, aber behalte alle wichtigen Informationen bei.",
        shorter: "Kürze diese Nachricht auf das Wesentliche, ohne wichtige Informationen zu verlieren.",
        detailed: "Erweitere diese Nachricht mit mehr Details und hilfreichen Informationen.",
        custom: "Passe diese Nachricht an nach folgender Anweisung: {instruction}",
      },
    },
  },
  en: {
    context_header: "📋 EVENT CONTEXT",
    event_types: {
      bachelor: "Bachelor Party (Stag)",
      bachelorette: "Bachelorette Party (Hen)",
      birthday: "Birthday Celebration",
      trip: "Group Trip",
      other: "Group Event",
    },
    labels: {
      honoree: "Guest of Honor",
      event_name: "Event Name",
      participants: "Participants",
      budget: "Budget per Person",
      destination: "Destination Preference",
      activities: "Popular Activities",
      fitness: "Fitness Level",
      duration: "Duration",
      description: "Description",
    },
    prompts: {
      trip_ideas: `Generate 5 creative and detailed destination ideas for this event.

For each destination include:
- 🌍 Destination (City/Region)
- ✨ Why it's perfect for this group
- 🏠 Accommodation recommendation
- 🎯 Top 3 activities there
- 💰 Estimated budget (transport + accommodation + activities)
- 🗓️ Best time to visit

Format everything clearly with emojis and sections.`,
      activities: `Generate 10 suitable activities for this event.

**IMPORTANT: Format EACH activity exactly like this (with number at the start):**

### 1. 🎯 [Activity Name]
📝 **Description:** [2-3 sentences describing what you do and why it's fun]
⏱️ **Duration:** [e.g., 2-3 hours]
💰 **Cost:** [e.g., approx. $30-50 per person]
💪 **Fitness:** [Easy/Normal/Challenging]
📍 **Location:** [Possible venue or provider]
🎯 **Category:** [Action/Food/Wellness/Party/Sightseeing/Adventure]

---

### 2. 🍽️ [Next Activity]
...

Mix action-packed and relaxing activities. Each activity MUST have a number!`,
      day_plan: `Create a detailed day plan for this event.

**STRICT FORMAT - FOLLOW EXACTLY:**

Start EVERY day with this exact header format:
## [Weekday]: [Short Title] [Emojis]

Then for EACH time block use this format:

### [HH:MM] [Emoji] [Activity Title]
📍 **Location:** [Exact place/address]
💰 **Cost:** [approx. $XX per person]
⏱️ **Duration:** [X hours]
📝 **Description:** [2-3 sentences about what you do]
💡 **Tip:** [Practical hint]

---

**EXAMPLE (format exactly like this!):**

## Friday: Arrival & Welcome! ✈️🎉

### 17:00 ✈️ Arrival at Airport
📍 **Location:** Las Vegas McCarran International Airport
💰 **Cost:** approx. $30 for taxi to hotel
⏱️ **Duration:** 1-2 hours
📝 **Description:** Arrive in Vegas, grab luggage and transfer to hotel.
💡 **Tip:** Uber/Lyft is often cheaper than taxis.

---

### 19:00 🍽️ Welcome Dinner
📍 **Location:** Gordon Ramsay Burger, Planet Hollywood
💰 **Cost:** approx. $40-60 per person
⏱️ **Duration:** 2 hours
📝 **Description:** Group dinner to kick off the weekend together.
💡 **Tip:** Make a reservation for large groups.

---

### 22:00 🎰 Casino Night
📍 **Location:** Bellagio Casino Floor
💰 **Cost:** Bring your own gambling budget
⏱️ **Duration:** 2-3 hours
📝 **Description:** First taste of casino vibes with classic games.
💡 **Tip:** Set a fixed limit before you start playing.

---

## Saturday: Action & Adventure! 🏎️🌃

### 09:00 ☀️ Breakfast
...

**RULES:**
1. Every day MUST start with ## [Weekday]: [Title] [Emojis]
2. Every time block MUST start with ### [HH:MM] [Emoji] [Title]
3. EVERY field (Location, Cost, Duration, Description, Tip) MUST be on its own line
4. ALWAYS use --- as separator between time blocks
5. NO bullet points or nested lists
6. Use concrete times in HH:MM format`,
      budget_estimate: `Create a detailed budget estimate for this event.

Categories:
- 🏠 Accommodation (per night, per person)
- 🚗 Transport (getting there + local)
- 🎯 Activities (all planned)
- 🍽️ Food (breakfast, lunch, dinner, snacks)
- 🍻 Drinks/Party
- 🎁 Miscellaneous (decorations, surprises, etc.)

For each category provide:
- Minimum budget
- Recommended budget
- Premium budget

Include a total summary at the end.`,
      chat: `The user asks: {message}

Answer the question helpfully in the context of the event.
Provide practical, actionable tips.`,
      message_enhance: {
        casual: "Make this message friendlier and more casual, keeping all important information.",
        formal: "Make this message more professional and formal, keeping all important information.",
        shorter: "Shorten this message to the essentials without losing important information.",
        detailed: "Expand this message with more details and helpful information.",
        custom: "Adapt this message according to the following instruction: {instruction}",
      },
    },
  },
  fr: {
    context_header: "📋 CONTEXTE DE L'ÉVÉNEMENT",
    event_types: {
      bachelor: "Enterrement de vie de garçon",
      bachelorette: "Enterrement de vie de jeune fille",
      birthday: "Fête d'anniversaire",
      trip: "Voyage de groupe",
      other: "Événement de groupe",
    },
    labels: {
      honoree: "Invité d'honneur",
      event_name: "Nom de l'événement",
      participants: "Participants",
      budget: "Budget par personne",
      destination: "Préférence de destination",
      activities: "Activités populaires",
      fitness: "Niveau de forme",
      duration: "Durée",
      description: "Description",
    },
    prompts: {
      trip_ideas: `Génère 5 idées de destinations créatives et détaillées pour cet événement.

Pour chaque destination, indique:
- 🌍 Destination (Ville/Région)
- ✨ Pourquoi c'est parfait
- 🏠 Recommandation d'hébergement
- 🎯 Top 3 activités sur place
- 💰 Budget estimé (transport + hébergement + activités)
- 🗓️ Meilleure période

Formate tout clairement avec des emojis et des sections.`,
      activities: `Génère 10 activités adaptées pour cet événement.

**IMPORTANT: Formate CHAQUE activité exactement ainsi (avec numéro au début):**

### 1. 🎯 [Nom de l'activité]
📝 **Description:** [2-3 phrases décrivant l'activité et pourquoi c'est amusant]
⏱️ **Durée:** [ex: 2-3 heures]
💰 **Coût:** [ex: environ 30-50€ par personne]
💪 **Fitness:** [Facile/Normal/Difficile]
📍 **Lieu:** [Lieu ou prestataire possible]
🎯 **Catégorie:** [Action/Food/Wellness/Party/Sightseeing/Adventure]

---

### 2. 🍽️ [Activité suivante]
...

Mélange activités dynamiques et détente. Chaque activité DOIT avoir un numéro!`,
      day_plan: `Crée un programme détaillé pour cet événement.

**FORMAT STRICT - SUIVRE EXACTEMENT:**

Commence CHAQUE jour avec ce format d'en-tête:
## [Jour]: [Titre Court] [Emojis]

Puis pour CHAQUE créneau horaire utilise ce format:

### [HH:MM] [Emoji] [Titre de l'Activité]
📍 **Lieu:** [Adresse exacte]
💰 **Coût:** [env. XX€ par personne]
⏱️ **Durée:** [X heures]
📝 **Description:** [2-3 phrases décrivant l'activité]
💡 **Conseil:** [Astuce pratique]

---

**EXEMPLE (formatez exactement ainsi!):**

## Vendredi: Arrivée & Bienvenue! ✈️🎉

### 17:00 ✈️ Arrivée à l'aéroport
📍 **Lieu:** Aéroport International de Las Vegas
💰 **Coût:** env. 30€ pour le taxi vers l'hôtel
⏱️ **Durée:** 1-2 heures
📝 **Description:** Arrivée à Vegas, récupération des bagages et transfert vers l'hôtel.
💡 **Conseil:** Uber/Lyft est souvent moins cher que les taxis.

---

**RÈGLES:**
1. Chaque jour DOIT commencer par ## [Jour]: [Titre] [Emojis]
2. Chaque créneau DOIT commencer par ### [HH:MM] [Emoji] [Titre]
3. CHAQUE champ (Lieu, Coût, Durée, Description, Conseil) DOIT être sur sa propre ligne
4. TOUJOURS utiliser --- comme séparateur entre créneaux
5. PAS de listes à puces imbriquées
6. Utiliser des heures concrètes au format HH:MM`,
      budget_estimate: `Crée une estimation détaillée du budget pour cet événement.

Catégories:
- 🏠 Hébergement (par nuit, par personne)
- 🚗 Transport (aller + sur place)
- 🎯 Activités (toutes prévues)
- 🍽️ Repas (petit-déj, déjeuner, dîner, snacks)
- 🍻 Boissons/Fête
- 🎁 Divers (déco, surprises, etc.)

Pour chaque catégorie:
- Budget minimum
- Budget recommandé
- Budget premium

Inclus un résumé total à la fin.`,
      chat: `L'utilisateur demande: {message}

Réponds de manière utile dans le contexte de l'événement.
Donne des conseils pratiques et applicables.`,
      message_enhance: {
        casual: "Rends ce message plus amical et décontracté, en gardant toutes les informations importantes.",
        formal: "Rends ce message plus professionnel et formel, en gardant toutes les informations importantes.",
        shorter: "Raccourcis ce message à l'essentiel sans perdre les informations importantes.",
        detailed: "Développe ce message avec plus de détails et d'informations utiles.",
        custom: "Adapte ce message selon l'instruction suivante: {instruction}",
      },
    },
  },
  es: {
    context_header: "📋 CONTEXTO DEL EVENTO",
    event_types: {
      bachelor: "Despedida de soltero",
      bachelorette: "Despedida de soltera",
      birthday: "Fiesta de cumpleaños",
      trip: "Viaje en grupo",
      other: "Evento grupal",
    },
    labels: {
      honoree: "Invitado de honor",
      event_name: "Nombre del evento",
      participants: "Participantes",
      budget: "Presupuesto por persona",
      destination: "Preferencia de destino",
      activities: "Actividades populares",
      fitness: "Nivel de fitness",
      duration: "Duración",
      description: "Descripción",
    },
    prompts: {
      trip_ideas: `Genera 5 ideas de destinos creativos y detallados para este evento.

Para cada destino incluye:
- 🌍 Destino (Ciudad/Región)
- ✨ Por qué es perfecto
- 🏠 Recomendación de alojamiento
- 🎯 Top 3 actividades allí
- 💰 Presupuesto estimado (transporte + alojamiento + actividades)
- 🗓️ Mejor época para visitar

Formatea todo claramente con emojis y secciones.`,
      activities: `Genera 10 actividades adecuadas para este evento.

**IMPORTANTE: Formatea CADA actividad exactamente así (con número al inicio):**

### 1. 🎯 [Nombre de la Actividad]
📝 **Descripción:** [2-3 frases describiendo qué haces y por qué es divertido]
⏱️ **Duración:** [ej: 2-3 horas]
💰 **Costo:** [ej: aprox. 30-50€ por persona]
💪 **Fitness:** [Fácil/Normal/Desafiante]
📍 **Lugar:** [Ubicación o proveedor posible]
🎯 **Categoría:** [Action/Food/Wellness/Party/Sightseeing/Adventure]

---

### 2. 🍽️ [Siguiente Actividad]
...

Mezcla actividades dinámicas y relajantes. ¡Cada actividad DEBE tener un número!`,
      day_plan: `Crea un plan detallado para este evento.

**FORMATO ESTRICTO - SEGUIR EXACTAMENTE:**

Comienza CADA día con este formato de encabezado:
## [Día]: [Título Corto] [Emojis]

Luego para CADA bloque horario usa este formato:

### [HH:MM] [Emoji] [Título de Actividad]
📍 **Lugar:** [Dirección exacta]
💰 **Costo:** [aprox. XX€ por persona]
⏱️ **Duración:** [X horas]
📝 **Descripción:** [2-3 frases describiendo la actividad]
💡 **Consejo:** [Consejo práctico]

---

**EJEMPLO (formatear exactamente así!):**

## Viernes: Llegada y Bienvenida! ✈️🎉

### 17:00 ✈️ Llegada al Aeropuerto
📍 **Lugar:** Aeropuerto Internacional de Las Vegas
💰 **Costo:** aprox. 30€ para taxi al hotel
⏱️ **Duración:** 1-2 horas
📝 **Descripción:** Llegada a Vegas, recoger equipaje y traslado al hotel.
💡 **Consejo:** Uber/Lyft suele ser más barato que los taxis.

---

**REGLAS:**
1. Cada día DEBE empezar con ## [Día]: [Título] [Emojis]
2. Cada bloque DEBE empezar con ### [HH:MM] [Emoji] [Título]
3. CADA campo (Lugar, Costo, Duración, Descripción, Consejo) DEBE estar en su propia línea
4. SIEMPRE usar --- como separador entre bloques
5. SIN listas con viñetas anidadas
6. Usar horarios concretos en formato HH:MM`,
      budget_estimate: `Crea una estimación detallada del presupuesto para este evento.

Categorías:
- 🏠 Alojamiento (por noche, por persona)
- 🚗 Transporte (ida + local)
- 🎯 Actividades (todas las planeadas)
- 🍽️ Comida (desayuno, almuerzo, cena, snacks)
- 🍻 Bebidas/Fiesta
- 🎁 Varios (decoración, sorpresas, etc.)

Para cada categoría:
- Presupuesto mínimo
- Presupuesto recomendado
- Presupuesto premium

Incluye un resumen total al final.`,
      chat: `El usuario pregunta: {message}

Responde de manera útil en el contexto del evento.
Da consejos prácticos y aplicables.`,
      message_enhance: {
        casual: "Haz este mensaje más amigable y casual, manteniendo toda la información importante.",
        formal: "Haz este mensaje más profesional y formal, manteniendo toda la información importante.",
        shorter: "Acorta este mensaje a lo esencial sin perder información importante.",
        detailed: "Expande este mensaje con más detalles e información útil.",
        custom: "Adapta este mensaje según la siguiente instrucción: {instruction}",
      },
    },
  },
  it: {
    context_header: "📋 CONTESTO DELL'EVENTO",
    event_types: {
      bachelor: "Addio al celibato",
      bachelorette: "Addio al nubilato",
      birthday: "Festa di compleanno",
      trip: "Viaggio di gruppo",
      other: "Evento di gruppo",
    },
    labels: {
      honoree: "Ospite d'onore",
      event_name: "Nome evento",
      participants: "Partecipanti",
      budget: "Budget per persona",
      destination: "Preferenza destinazione",
      activities: "Attività popolari",
      fitness: "Livello fitness",
      duration: "Durata",
      description: "Descrizione",
    },
    prompts: {
      trip_ideas: `Genera 5 idee di destinazioni creative e dettagliate per questo evento.

Per ogni destinazione includi:
- 🌍 Destinazione (Città/Regione)
- ✨ Perché è perfetta
- 🏠 Raccomandazione alloggio
- 🎯 Top 3 attività sul posto
- 💰 Budget stimato (trasporto + alloggio + attività)
- 🗓️ Periodo migliore per visitare

Formatta tutto chiaramente con emoji e sezioni.`,
      activities: `Genera 10 attività adatte per questo evento.

**IMPORTANTE: Formatta OGNI attività esattamente così (con numero all'inizio):**

### 1. 🎯 [Nome Attività]
📝 **Descrizione:** [2-3 frasi che descrivono cosa fai e perché è divertente]
⏱️ **Durata:** [es: 2-3 ore]
💰 **Costo:** [es: circa 30-50€ a persona]
💪 **Fitness:** [Facile/Normale/Impegnativo]
📍 **Luogo:** [Luogo o fornitore possibile]
🎯 **Categoria:** [Action/Food/Wellness/Party/Sightseeing/Adventure]

---

### 2. 🍽️ [Prossima Attività]
...

Mescola attività dinamiche e rilassanti. Ogni attività DEVE avere un numero!`,
      day_plan: `Crea un piano dettagliato per questo evento.

**FORMATO RIGOROSO - SEGUIRE ESATTAMENTE:**

Inizia OGNI giorno con questo formato di intestazione:
## [Giorno]: [Titolo Breve] [Emoji]

Poi per OGNI blocco orario usa questo formato:

### [HH:MM] [Emoji] [Titolo Attività]
📍 **Luogo:** [Indirizzo esatto]
💰 **Costo:** [circa XX€ a persona]
⏱️ **Durata:** [X ore]
📝 **Descrizione:** [2-3 frasi che descrivono l'attività]
💡 **Consiglio:** [Suggerimento pratico]

---

**ESEMPIO (formattare esattamente così!):**

## Venerdì: Arrivo e Benvenuto! ✈️🎉

### 17:00 ✈️ Arrivo all'aeroporto
📍 **Luogo:** Aeroporto Internazionale di Las Vegas
💰 **Costo:** circa 30€ per taxi all'hotel
⏱️ **Durata:** 1-2 ore
📝 **Descrizione:** Arrivo a Vegas, ritiro bagagli e trasferimento in hotel.
💡 **Consiglio:** Uber/Lyft è spesso più economico dei taxi.

---

**REGOLE:**
1. Ogni giorno DEVE iniziare con ## [Giorno]: [Titolo] [Emoji]
2. Ogni blocco DEVE iniziare con ### [HH:MM] [Emoji] [Titolo]
3. OGNI campo (Luogo, Costo, Durata, Descrizione, Consiglio) DEVE essere su propria riga
4. SEMPRE usare --- come separatore tra blocchi
5. NIENTE elenchi puntati annidati
6. Usare orari concreti in formato HH:MM`,
      budget_estimate: `Crea una stima dettagliata del budget per questo evento.

Categorie:
- 🏠 Alloggio (per notte, per persona)
- 🚗 Trasporto (andata + locale)
- 🎯 Attività (tutte pianificate)
- 🍽️ Cibo (colazione, pranzo, cena, snack)
- 🍻 Bevande/Festa
- 🎁 Varie (decorazioni, sorprese, ecc.)

Per ogni categoria:
- Budget minimo
- Budget raccomandato
- Budget premium

Includi un riepilogo totale alla fine.`,
      chat: `L'utente chiede: {message}

Rispondi in modo utile nel contesto dell'evento.
Dai consigli pratici e applicabili.`,
      message_enhance: {
        casual: "Rendi questo messaggio più amichevole e informale, mantenendo tutte le informazioni importanti.",
        formal: "Rendi questo messaggio più professionale e formale, mantenendo tutte le informazioni importanti.",
        shorter: "Accorcia questo messaggio all'essenziale senza perdere informazioni importanti.",
        detailed: "Espandi questo messaggio con più dettagli e informazioni utili.",
        custom: "Adatta questo messaggio secondo la seguente istruzione: {instruction}",
      },
    },
  },
  nl: {
    context_header: "📋 EVENEMENT CONTEXT",
    event_types: {
      bachelor: "Vrijgezellenfeest (mannen)",
      bachelorette: "Vrijgezellenfeest (vrouwen)",
      birthday: "Verjaardagsfeest",
      trip: "Groepsreis",
      other: "Groepsevenement",
    },
    labels: {
      honoree: "Eregast",
      event_name: "Evenementnaam",
      participants: "Deelnemers",
      budget: "Budget per persoon",
      destination: "Bestemmingsvoorkeur",
      activities: "Populaire activiteiten",
      fitness: "Fitnessniveau",
      duration: "Duur",
      description: "Beschrijving",
    },
    prompts: {
      trip_ideas: `Genereer 5 creatieve en gedetailleerde bestemmingsideeën voor dit evenement.

Voor elke bestemming, vermeld:
- 🌍 Bestemming (Stad/Regio)
- ✨ Waarom het perfect is
- 🏠 Accommodatie-aanbeveling
- 🎯 Top 3 activiteiten ter plaatse
- 💰 Geschat budget (vervoer + accommodatie + activiteiten)
- 🗓️ Beste reistijd

Formatteer alles duidelijk met emoji's en secties.`,
      activities: `Genereer 10 geschikte activiteiten voor dit evenement.

**BELANGRIJK: Formatteer ELKE activiteit precies zo (met nummer aan het begin):**

### 1. 🎯 [Activiteitsnaam]
📝 **Beschrijving:** [2-3 zinnen die beschrijven wat je doet en waarom het leuk is]
⏱️ **Duur:** [bijv: 2-3 uur]
💰 **Kosten:** [bijv: ca. €30-50 per persoon]
💪 **Fitness:** [Makkelijk/Normaal/Uitdagend]
📍 **Locatie:** [Mogelijke locatie of aanbieder]
🎯 **Categorie:** [Action/Food/Wellness/Party/Sightseeing/Adventure]

---

### 2. 🍽️ [Volgende Activiteit]
...

Mix actieve en ontspannende activiteiten. Elke activiteit MOET een nummer hebben!`,
      day_plan: `Maak een gedetailleerd plan voor dit evenement.

**STRIKT FORMAAT - VOLG EXACT:**

Begin ELKE dag met dit header-formaat:
## [Dag]: [Korte Titel] [Emoji's]

Gebruik dan voor ELK tijdblok dit formaat:

### [HH:MM] [Emoji] [Activiteitstitel]
📍 **Locatie:** [Exact adres]
💰 **Kosten:** [ca. €XX per persoon]
⏱️ **Duur:** [X uur]
📝 **Beschrijving:** [2-3 zinnen over de activiteit]
💡 **Tip:** [Praktische tip]

---

**VOORBEELD (formatteer precies zo!):**

## Vrijdag: Aankomst & Welkom! ✈️🎉

### 17:00 ✈️ Aankomst op luchthaven
📍 **Locatie:** Las Vegas McCarran International Airport
💰 **Kosten:** ca. €30 voor taxi naar hotel
⏱️ **Duur:** 1-2 uur
📝 **Beschrijving:** Aankomst in Vegas, bagage ophalen en transfer naar hotel.
💡 **Tip:** Uber/Lyft is vaak goedkoper dan taxi's.

---

**REGELS:**
1. Elke dag MOET beginnen met ## [Dag]: [Titel] [Emoji's]
2. Elk tijdblok MOET beginnen met ### [HH:MM] [Emoji] [Titel]
3. ELK veld (Locatie, Kosten, Duur, Beschrijving, Tip) MOET op eigen regel staan
4. ALTIJD --- als scheidingsteken tussen blokken
5. GEEN geneste opsommingstekens
6. Gebruik concrete tijden in HH:MM formaat`,
      budget_estimate: `Maak een gedetailleerde budgetschatting voor dit evenement.

Categorieën:
- 🏠 Accommodatie (per nacht, per persoon)
- 🚗 Vervoer (heen + lokaal)
- 🎯 Activiteiten (alle geplande)
- 🍽️ Eten (ontbijt, lunch, diner, snacks)
- 🍻 Drinken/Feest
- 🎁 Overig (decoratie, verrassingen, etc.)

Voor elke categorie:
- Minimum budget
- Aanbevolen budget
- Premium budget

Voeg een totaaloverzicht toe aan het einde.`,
      chat: `De gebruiker vraagt: {message}

Beantwoord de vraag behulpzaam in de context van het evenement.
Geef praktische, uitvoerbare tips.`,
      message_enhance: {
        casual: "Maak dit bericht vriendelijker en informeler, met behoud van alle belangrijke informatie.",
        formal: "Maak dit bericht professioneler en formeler, met behoud van alle belangrijke informatie.",
        shorter: "Verkort dit bericht tot de essentie zonder belangrijke informatie te verliezen.",
        detailed: "Breid dit bericht uit met meer details en nuttige informatie.",
        custom: "Pas dit bericht aan volgens de volgende instructie: {instruction}",
      },
    },
  },
  pl: {
    context_header: "📋 KONTEKST WYDARZENIA",
    event_types: {
      bachelor: "Wieczór kawalerski",
      bachelorette: "Wieczór panieński",
      birthday: "Przyjęcie urodzinowe",
      trip: "Wycieczka grupowa",
      other: "Wydarzenie grupowe",
    },
    labels: {
      honoree: "Gość honorowy",
      event_name: "Nazwa wydarzenia",
      participants: "Uczestnicy",
      budget: "Budżet na osobę",
      destination: "Preferowana destynacja",
      activities: "Popularne aktywności",
      fitness: "Poziom sprawności",
      duration: "Czas trwania",
      description: "Opis",
    },
    prompts: {
      trip_ideas: `Wygeneruj 5 kreatywnych i szczegółowych pomysłów na cele podróży dla tego wydarzenia.

Dla każdej destynacji podaj:
- 🌍 Destynacja (Miasto/Region)
- ✨ Dlaczego jest idealna
- 🏠 Rekomendacja zakwaterowania
- 🎯 Top 3 aktywności na miejscu
- 💰 Szacowany budżet (transport + zakwaterowanie + aktywności)
- 🗓️ Najlepszy czas na wizytę

Sformatuj wszystko czytelnie z emoji i sekcjami.`,
      activities: `Wygeneruj 10 odpowiednich aktywności dla tego wydarzenia.

**WAŻNE: Sformatuj KAŻDĄ aktywność dokładnie tak (z numerem na początku):**

### 1. 🎯 [Nazwa Aktywności]
📝 **Opis:** [2-3 zdania opisujące co robisz i dlaczego jest to fajne]
⏱️ **Czas:** [np: 2-3 godziny]
💰 **Koszt:** [np: ok. 100-200 zł na osobę]
💪 **Kondycja:** [Łatwy/Normalny/Wymagający]
📍 **Miejsce:** [Możliwa lokalizacja lub organizator]
🎯 **Kategoria:** [Action/Food/Wellness/Party/Sightseeing/Adventure]

---

### 2. 🍽️ [Następna Aktywność]
...

Połącz aktywności dynamiczne i relaksacyjne. Każda aktywność MUSI mieć numer!`,
      day_plan: `Stwórz szczegółowy plan dla tego wydarzenia.

**ŚCISŁY FORMAT - POSTĘPUJ DOKŁADNIE:**

Rozpocznij KAŻDY dzień od tego formatu nagłówka:
## [Dzień tygodnia]: [Krótki tytuł] [Emoji]

Następnie dla KAŻDEGO bloku czasowego użyj tego formatu:

### [GG:MM] [Emoji] [Tytuł aktywności]
📍 **Miejsce:** [Dokładny adres]
💰 **Koszt:** [ok. XX zł na osobę]
⏱️ **Czas:** [X godzin]
📝 **Opis:** [2-3 zdania opisujące aktywność]
💡 **Wskazówka:** [Praktyczna rada]

---

**PRZYKŁAD (formatuj dokładnie tak!):**

## Piątek: Przyjazd i powitanie! ✈️🎉

### 17:00 ✈️ Przylot na lotnisko
📍 **Miejsce:** Międzynarodowe lotnisko w Las Vegas
💰 **Koszt:** ok. 120 zł za taxi do hotelu
⏱️ **Czas:** 1-2 godziny
📝 **Opis:** Przylot do Vegas, odbiór bagażu i transfer do hotelu.
💡 **Wskazówka:** Uber/Lyft jest często tańszy od taksówek.

---

**ZASADY:**
1. Każdy dzień MUSI zaczynać się od ## [Dzień]: [Tytuł] [Emoji]
2. Każdy blok MUSI zaczynać się od ### [GG:MM] [Emoji] [Tytuł]
3. KAŻDE pole (Miejsce, Koszt, Czas, Opis, Wskazówka) MUSI być w osobnej linii
4. ZAWSZE używaj --- jako separatora między blokami
5. BEZ zagnieżdżonych list
6. Używaj konkretnych godzin w formacie GG:MM`,
      budget_estimate: `Stwórz szczegółową szacunkową kalkulację budżetu dla tego wydarzenia.

Kategorie:
- 🏠 Zakwaterowanie (za noc, na osobę)
- 🚗 Transport (dojazd + lokalny)
- 🎯 Aktywności (wszystkie zaplanowane)
- 🍽️ Jedzenie (śniadanie, obiad, kolacja, przekąski)
- 🍻 Napoje/Impreza
- 🎁 Różne (dekoracje, niespodzianki, itp.)

Dla każdej kategorii:
- Minimalny budżet
- Zalecany budżet
- Budżet premium

Dołącz podsumowanie całkowite na końcu.`,
      chat: `Użytkownik pyta: {message}

Odpowiedz pomocnie w kontekście wydarzenia.
Daj praktyczne, wykonalne wskazówki.`,
      message_enhance: {
        casual: "Uczyń tę wiadomość bardziej przyjazną i swobodną, zachowując wszystkie ważne informacje.",
        formal: "Uczyń tę wiadomość bardziej profesjonalną i formalną, zachowując wszystkie ważne informacje.",
        shorter: "Skróć tę wiadomość do najważniejszych rzeczy bez utraty ważnych informacji.",
        detailed: "Rozwiń tę wiadomość o więcej szczegółów i pomocnych informacji.",
        custom: "Dostosuj tę wiadomość zgodnie z następującą instrukcją: {instruction}",
      },
    },
  },
  pt: {
    context_header: "📋 CONTEXTO DO EVENTO",
    event_types: {
      bachelor: "Despedida de solteiro",
      bachelorette: "Despedida de solteira",
      birthday: "Festa de aniversário",
      trip: "Viagem em grupo",
      other: "Evento de grupo",
    },
    labels: {
      honoree: "Convidado de honra",
      event_name: "Nome do evento",
      participants: "Participantes",
      budget: "Orçamento por pessoa",
      destination: "Preferência de destino",
      activities: "Atividades populares",
      fitness: "Nível de fitness",
      duration: "Duração",
      description: "Descrição",
    },
    prompts: {
      trip_ideas: `Gera 5 ideias de destinos criativos e detalhados para este evento.

Para cada destino inclui:
- 🌍 Destino (Cidade/Região)
- ✨ Porque é perfeito
- 🏠 Recomendação de alojamento
- 🎯 Top 3 atividades lá
- 💰 Orçamento estimado (transporte + alojamento + atividades)
- 🗓️ Melhor altura para visitar

Formata tudo claramente com emojis e secções.`,
      activities: `Gera 10 atividades adequadas para este evento.

**IMPORTANTE: Formata CADA atividade exatamente assim (com número no início):**

### 1. 🎯 [Nome da Atividade]
📝 **Descrição:** [2-3 frases descrevendo o que fazes e porque é divertido]
⏱️ **Duração:** [ex: 2-3 horas]
💰 **Custo:** [ex: aprox. 30-50€ por pessoa]
💪 **Fitness:** [Fácil/Normal/Desafiante]
📍 **Local:** [Local ou fornecedor possível]
🎯 **Categoria:** [Action/Food/Wellness/Party/Sightseeing/Adventure]

---

### 2. 🍽️ [Próxima Atividade]
...

Mistura atividades dinâmicas e relaxantes. Cada atividade DEVE ter um número!`,
      day_plan: `Cria um plano detalhado para este evento.

**FORMATO RIGOROSO - SEGUE EXATAMENTE:**

Começa CADA dia com este formato de cabeçalho:
## [Dia da semana]: [Título Curto] [Emojis]

Depois para CADA bloco horário usa este formato:

### [HH:MM] [Emoji] [Título da Atividade]
📍 **Local:** [Endereço exato]
💰 **Custo:** [aprox. XX€ por pessoa]
⏱️ **Duração:** [X horas]
📝 **Descrição:** [2-3 frases a descrever a atividade]
💡 **Dica:** [Sugestão prática]

---

**EXEMPLO (formatar exatamente assim!):**

## Sexta-feira: Chegada e Boas-vindas! ✈️🎉

### 17:00 ✈️ Chegada ao aeroporto
📍 **Local:** Aeroporto Internacional de Las Vegas
💰 **Custo:** aprox. 30€ para táxi até ao hotel
⏱️ **Duração:** 1-2 horas
📝 **Descrição:** Chegada a Vegas, recolha de bagagem e transfer para o hotel.
💡 **Dica:** Uber/Lyft costuma ser mais barato que táxis.

---

**REGRAS:**
1. Cada dia DEVE começar com ## [Dia]: [Título] [Emojis]
2. Cada bloco DEVE começar com ### [HH:MM] [Emoji] [Título]
3. CADA campo (Local, Custo, Duração, Descrição, Dica) DEVE estar na sua própria linha
4. SEMPRE usar --- como separador entre blocos
5. SEM listas aninhadas com marcadores
6. Usar horários concretos no formato HH:MM`,
      budget_estimate: `Cria uma estimativa detalhada do orçamento para este evento.

Categorias:
- 🏠 Alojamento (por noite, por pessoa)
- 🚗 Transporte (ida + local)
- 🎯 Atividades (todas planeadas)
- 🍽️ Comida (pequeno-almoço, almoço, jantar, snacks)
- 🍻 Bebidas/Festa
- 🎁 Diversos (decoração, surpresas, etc.)

Para cada categoria:
- Orçamento mínimo
- Orçamento recomendado
- Orçamento premium

Inclui um resumo total no final.`,
      chat: `O utilizador pergunta: {message}

Responde de forma útil no contexto do evento.
Dá conselhos práticos e aplicáveis.`,
      message_enhance: {
        casual: "Torna esta mensagem mais amigável e casual, mantendo toda a informação importante.",
        formal: "Torna esta mensagem mais profissional e formal, mantendo toda a informação importante.",
        shorter: "Encurta esta mensagem para o essencial sem perder informação importante.",
        detailed: "Expande esta mensagem com mais detalhes e informação útil.",
        custom: "Adapta esta mensagem de acordo com a seguinte instrução: {instruction}",
      },
    },
  },
  tr: {
    context_header: "📋 ETKİNLİK BAĞLAMI",
    event_types: {
      bachelor: "Bekarlığa veda (erkek)",
      bachelorette: "Bekarlığa veda (kadın)",
      birthday: "Doğum günü partisi",
      trip: "Grup gezisi",
      other: "Grup etkinliği",
    },
    labels: {
      honoree: "Onur konuğu",
      event_name: "Etkinlik adı",
      participants: "Katılımcılar",
      budget: "Kişi başı bütçe",
      destination: "Destinasyon tercihi",
      activities: "Popüler aktiviteler",
      fitness: "Fitness seviyesi",
      duration: "Süre",
      description: "Açıklama",
    },
    prompts: {
      trip_ideas: `Bu etkinlik için 5 yaratıcı ve detaylı destinasyon fikri üret.

Her destinasyon için:
- 🌍 Destinasyon (Şehir/Bölge)
- ✨ Neden mükemmel
- 🏠 Konaklama önerisi
- 🎯 Oradaki en iyi 3 aktivite
- 💰 Tahmini bütçe (ulaşım + konaklama + aktiviteler)
- 🗓️ Ziyaret için en iyi zaman

Her şeyi emoji ve bölümlerle düzenle.`,
      activities: `Bu etkinlik için 10 uygun aktivite üret.

**ÖNEMLİ: HER aktiviteyi tam olarak şu şekilde formatla (başta numara ile):**

### 1. 🎯 [Aktivite Adı]
📝 **Açıklama:** [Ne yaptığını ve neden eğlenceli olduğunu anlatan 2-3 cümle]
⏱️ **Süre:** [örn: 2-3 saat]
💰 **Maliyet:** [örn: kişi başı yaklaşık 500-800₺]
💪 **Fitness:** [Kolay/Normal/Zorlu]
📍 **Yer:** [Olası konum veya sağlayıcı]
🎯 **Kategori:** [Action/Food/Wellness/Party/Sightseeing/Adventure]

---

### 2. 🍽️ [Sonraki Aktivite]
...

Dinamik ve rahatlatıcı aktiviteleri karıştır. Her aktivite MUTLAKA bir numara içermeli!`,
      day_plan: `Bu etkinlik için detaylı bir plan oluştur.

**SIKI FORMAT - TAM OLARAK UYGULA:**

HER günü bu başlık formatıyla başlat:
## [Gün]: [Kısa Başlık] [Emojiler]

Sonra HER zaman bloğu için bu formatı kullan:

### [SS:DD] [Emoji] [Aktivite Başlığı]
📍 **Yer:** [Tam adres]
💰 **Maliyet:** [yaklaşık XX₺ kişi başı]
⏱️ **Süre:** [X saat]
📝 **Açıklama:** [2-3 cümle aktiviteyi anlatan]
💡 **İpucu:** [Pratik öneri]

---

**ÖRNEK (tam olarak böyle formatla!):**

## Cuma: Varış ve Hoş Geldin! ✈️🎉

### 17:00 ✈️ Havalimanına varış
📍 **Yer:** Las Vegas Uluslararası Havalimanı
💰 **Maliyet:** yaklaşık 500₺ otele taksi
⏱️ **Süre:** 1-2 saat
📝 **Açıklama:** Vegas'a varış, bagaj alma ve otele transfer.
💡 **İpucu:** Uber/Lyft genellikle taksilerden daha ucuz.

---

**KURALLAR:**
1. Her gün MUTLAKA ## [Gün]: [Başlık] [Emojiler] ile başlamalı
2. Her blok MUTLAKA ### [SS:DD] [Emoji] [Başlık] ile başlamalı
3. HER alan (Yer, Maliyet, Süre, Açıklama, İpucu) kendi satırında OLMALI
4. Bloklar arasında HER ZAMAN --- ayırıcı kullan
5. İç içe madde işaretleri YOK
6. SS:DD formatında somut saatler kullan`,
      budget_estimate: `Bu etkinlik için detaylı bir bütçe tahmini oluştur.

Kategoriler:
- 🏠 Konaklama (gece başı, kişi başı)
- 🚗 Ulaşım (gidiş + yerel)
- 🎯 Aktiviteler (tüm planlananlar)
- 🍽️ Yemek (kahvaltı, öğle, akşam, atıştırmalık)
- 🍻 İçecekler/Parti
- 🎁 Diğer (dekorasyon, sürprizler, vb.)

Her kategori için:
- Minimum bütçe
- Önerilen bütçe
- Premium bütçe

Sonunda toplam özet ekle.`,
      chat: `Kullanıcı soruyor: {message}

Etkinlik bağlamında yararlı bir şekilde cevap ver.
Pratik, uygulanabilir ipuçları ver.`,
      message_enhance: {
        casual: "Bu mesajı tüm önemli bilgileri koruyarak daha samimi ve rahat yap.",
        formal: "Bu mesajı tüm önemli bilgileri koruyarak daha profesyonel ve resmi yap.",
        shorter: "Bu mesajı önemli bilgileri kaybetmeden özüne indir.",
        detailed: "Bu mesajı daha fazla detay ve yararlı bilgiyle genişlet.",
        custom: "Bu mesajı şu talimata göre uyarla: {instruction}",
      },
    },
  },
  ar: {
    context_header: "📋 سياق الفعالية",
    event_types: {
      bachelor: "حفلة وداع العزوبية (رجال)",
      bachelorette: "حفلة وداع العزوبية (نساء)",
      birthday: "حفلة عيد ميلاد",
      trip: "رحلة جماعية",
      other: "فعالية جماعية",
    },
    labels: {
      honoree: "ضيف الشرف",
      event_name: "اسم الفعالية",
      participants: "المشاركون",
      budget: "الميزانية للشخص",
      destination: "تفضيل الوجهة",
      activities: "الأنشطة الشائعة",
      fitness: "مستوى اللياقة",
      duration: "المدة",
      description: "الوصف",
    },
    prompts: {
      trip_ideas: `أنشئ 5 أفكار وجهات إبداعية ومفصلة لهذه الفعالية.

لكل وجهة اذكر:
- 🌍 الوجهة (المدينة/المنطقة)
- ✨ لماذا هي مثالية
- 🏠 توصية الإقامة
- 🎯 أفضل 3 أنشطة هناك
- 💰 الميزانية المقدرة (النقل + الإقامة + الأنشطة)
- 🗓️ أفضل وقت للزيارة

نسق كل شيء بوضوح مع الرموز التعبيرية والأقسام.`,
      activities: `أنشئ 10 أنشطة مناسبة لهذه الفعالية.

**مهم: نسق كل نشاط بالضبط هكذا (مع رقم في البداية):**

### 1. 🎯 [اسم النشاط]
📝 **الوصف:** [2-3 جمل تصف ماذا تفعل ولماذا هو ممتع]
⏱️ **المدة:** [مثال: 2-3 ساعات]
💰 **التكلفة:** [مثال: حوالي 100-150 ريال للشخص]
💪 **اللياقة:** [سهل/عادي/صعب]
📍 **الموقع:** [الموقع أو المزود المحتمل]
🎯 **الفئة:** [Action/Food/Wellness/Party/Sightseeing/Adventure]

---

### 2. 🍽️ [النشاط التالي]
...

امزج الأنشطة النشطة والاسترخائية. كل نشاط يجب أن يحتوي على رقم!`,
      day_plan: `أنشئ خطة مفصلة لهذه الفعالية.

**تنسيق صارم - اتبعه بالضبط:**

ابدأ كل يوم بهذا التنسيق:
## [اليوم]: [عنوان قصير] [رموز تعبيرية]

ثم لكل فترة زمنية استخدم هذا التنسيق:

### [SS:DD] [رمز] [عنوان النشاط]
📍 **الموقع:** [العنوان الدقيق]
💰 **التكلفة:** [حوالي XX ريال للشخص]
⏱️ **المدة:** [X ساعات]
📝 **الوصف:** [2-3 جمل تصف النشاط]
💡 **نصيحة:** [اقتراح عملي]

---

**مثال (نسق بالضبط هكذا!):**

## الجمعة: الوصول والترحيب! ✈️🎉

### 17:00 ✈️ الوصول للمطار
📍 **الموقع:** مطار لاس فيغاس الدولي
💰 **التكلفة:** حوالي 100 ريال للتاكسي
⏱️ **المدة:** 1-2 ساعة
📝 **الوصف:** الوصول لفيغاس واستلام الحقائب والانتقال للفندق.
💡 **نصيحة:** أوبر/ليفت عادة أرخص من التاكسي.

---

**القواعد:**
1. كل يوم يجب أن يبدأ بـ ## [اليوم]: [العنوان] [الرموز]
2. كل فترة يجب أن تبدأ بـ ### [SS:DD] [رمز] [العنوان]
3. كل حقل (الموقع، التكلفة، المدة، الوصف، النصيحة) يجب أن يكون في سطر منفصل
4. استخدم --- دائماً كفاصل بين الفترات
5. لا قوائم متداخلة
6. استخدم أوقات محددة بتنسيق SS:DD`,
      budget_estimate: `أنشئ تقديراً مفصلاً للميزانية لهذه الفعالية.

الفئات:
- 🏠 الإقامة (لليلة، للشخص)
- 🚗 النقل (الذهاب + المحلي)
- 🎯 الأنشطة (كل المخطط لها)
- 🍽️ الطعام (فطور، غداء، عشاء، وجبات خفيفة)
- 🍻 المشروبات/الحفلة
- 🎁 متفرقات (ديكور، مفاجآت، إلخ)

لكل فئة:
- الحد الأدنى للميزانية
- الميزانية الموصى بها
- الميزانية المميزة

أضف ملخصاً إجمالياً في النهاية.`,
      chat: `المستخدم يسأل: {message}

أجب بشكل مفيد في سياق الفعالية.
قدم نصائح عملية وقابلة للتنفيذ.`,
      message_enhance: {
        casual: "اجعل هذه الرسالة أكثر ودية وعفوية مع الحفاظ على كل المعلومات المهمة.",
        formal: "اجعل هذه الرسالة أكثر احترافية ورسمية مع الحفاظ على كل المعلومات المهمة.",
        shorter: "اختصر هذه الرسالة إلى الأساسيات دون فقدان المعلومات المهمة.",
        detailed: "وسع هذه الرسالة بمزيد من التفاصيل والمعلومات المفيدة.",
        custom: "عدل هذه الرسالة وفقاً للتعليمات التالية: {instruction}",
      },
    },
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getSystemPrompt(language: string, eventType: string): string {
  const langPrompts = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.en;
  return langPrompts[eventType] || langPrompts.other;
}

function getPromptTemplate(language: string) {
  return USER_PROMPT_TEMPLATES[language] || USER_PROMPT_TEMPLATES.en;
}

function buildContextInfo(context: RequestBody['context'], language: string): string {
  const template = getPromptTemplate(language);
  const eventTypeName = template.event_types[context.event_type] || template.event_types.other;
  
  let contextLines = [
    template.context_header,
    `${template.labels.event_name}: ${context.event_name || 'Event'}`,
    `Event-Typ: ${eventTypeName}`,
    `${template.labels.honoree}: ${context.honoree_name}`,
    `${template.labels.participants}: ${context.participant_count}`,
  ];

  if (context.event_description) {
    contextLines.push(`${template.labels.description}: ${context.event_description}`);
  }
  if (context.avg_budget) {
    contextLines.push(`${template.labels.budget}: €${context.avg_budget}`);
  }
  if (context.destination_pref) {
    contextLines.push(`${template.labels.destination}: ${context.destination_pref}`);
  }
  if (context.top_activities && context.top_activities.length > 0) {
    contextLines.push(`${template.labels.activities}: ${context.top_activities.join(', ')}`);
  }
  if (context.fitness_level) {
    contextLines.push(`${template.labels.fitness}: ${context.fitness_level}`);
  }
  if (context.duration) {
    contextLines.push(`${template.labels.duration}: ${context.duration}`);
  }

  return contextLines.join('\n');
}

// Helper to determine plan type from subscription
function determinePlanType(sub: { plan: string; expires_at: string | null; stripe_subscription_id: string | null } | null): string {
  if (!sub || sub.plan !== 'premium') return 'free';
  
  // Lifetime: premium without expiry or subscription id
  if (!sub.expires_at && !sub.stripe_subscription_id) return 'lifetime';
  
  // Check days until expiry to determine yearly vs monthly
  if (sub.expires_at) {
    const daysUntilExpiry = Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 32 ? 'yearly' : 'monthly';
  }
  
  return 'monthly';
}

// Get start of current month
function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

// Get next month reset date
function getNextMonthReset(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

// Rate limit: max requests per minute
const RATE_LIMIT_PER_MINUTE = 10;

// =============================================================================
// DYNAMIC DAY PLAN PROMPTS WITH TARGET DAYS
// =============================================================================
function getDayPlanPromptWithDays(language: string, targetDays: number): string {
  const daysText: Record<string, string> = {
    de: `Erstelle einen detaillierten ${targetDays}-Tage-Plan für dieses Event.`,
    en: `Create a detailed ${targetDays}-day plan for this event.`,
    fr: `Crée un plan détaillé de ${targetDays} jours pour cet événement.`,
    es: `Crea un plan detallado de ${targetDays} días para este evento.`,
    it: `Crea un piano dettagliato di ${targetDays} giorni per questo evento.`,
    nl: `Maak een gedetailleerd ${targetDays}-dagenplan voor dit evenement.`,
    pl: `Stwórz szczegółowy plan ${targetDays}-dniowy dla tego wydarzenia.`,
    pt: `Cria um plano detalhado de ${targetDays} dias para este evento.`,
    tr: `Bu etkinlik için detaylı bir ${targetDays} günlük plan oluştur.`,
    ar: `أنشئ خطة تفصيلية لمدة ${targetDays} أيام لهذا الحدث.`,
  };

  const promptTemplate = getPromptTemplate(language);
  const basePrompt = promptTemplate.prompts.day_plan;
  
  // Replace generic "day plan" text with specific days count
  const daysIntro = daysText[language] || daysText.en;
  
  return `${daysIntro}\n\n${basePrompt}`;
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    // Skip LOVABLE_API_KEY check for TTS requests — they only need MISTRAL_API_KEY
    const bodyForTypeCheck = await req.clone().json().catch(() => ({}));
    const requestType = typeof bodyForTypeCheck?.type === 'string' ? bodyForTypeCheck.type : '';
    if (!LOVABLE_API_KEY && requestType !== "voxtral_tts") {
      console.error("AI service configuration error");
      return new Response(
        JSON.stringify({ success: false, error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role for credit tracking
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from authorization header
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      userId = user?.id || null;
      if (authError) {
        console.log("Auth error (user may not be logged in):", authError.message);
      }
    }
    
    console.log("AI request - userId present:", !!userId);

    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof body !== 'object' || body === null) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawBody = body as Record<string, unknown>;
    
    // Validate type field
    const validTypes = ["trip_ideas", "activities", "day_plan", "budget_estimate", "chat", "message_enhance", "voxtral_tts"];
    const type = typeof rawBody.type === 'string' && validTypes.includes(rawBody.type) 
      ? rawBody.type as RequestBody['type'] 
      : null;
    
    if (!type) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or missing type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate context object
    if (typeof rawBody.context !== 'object' || rawBody.context === null) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or missing context" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawContext = rawBody.context as Record<string, unknown>;
    
    // Sanitize context fields
    const context: RequestBody['context'] = {
      event_type: typeof rawContext.event_type === 'string' ? rawContext.event_type.slice(0, 50) : 'other',
      honoree_name: typeof rawContext.honoree_name === 'string' ? rawContext.honoree_name.slice(0, 200) : '',
      participant_count: typeof rawContext.participant_count === 'number' ? Math.min(rawContext.participant_count, 1000) : 0,
      avg_budget: typeof rawContext.avg_budget === 'string' ? rawContext.avg_budget.slice(0, 50) : undefined,
      top_activities: Array.isArray(rawContext.top_activities) 
        ? rawContext.top_activities.filter((a): a is string => typeof a === 'string').slice(0, 20).map(a => a.slice(0, 100))
        : undefined,
      restrictions: Array.isArray(rawContext.restrictions)
        ? rawContext.restrictions.filter((r): r is string => typeof r === 'string').slice(0, 20).map(r => r.slice(0, 200))
        : undefined,
      destination_pref: typeof rawContext.destination_pref === 'string' ? rawContext.destination_pref.slice(0, 200) : undefined,
      date_info: typeof rawContext.date_info === 'string' ? rawContext.date_info.slice(0, 100) : undefined,
      fitness_level: typeof rawContext.fitness_level === 'string' ? rawContext.fitness_level.slice(0, 50) : undefined,
      duration: typeof rawContext.duration === 'string' ? rawContext.duration.slice(0, 50) : undefined,
      language: typeof rawContext.language === 'string' ? rawContext.language.slice(0, 5) : undefined,
      event_name: typeof rawContext.event_name === 'string' ? rawContext.event_name.slice(0, 200) : undefined,
      event_description: typeof rawContext.event_description === 'string' ? rawContext.event_description.slice(0, 1000) : undefined,
      original_text: typeof rawContext.original_text === 'string' ? rawContext.original_text.slice(0, 5000) : undefined,
      enhancement_type: typeof rawContext.enhancement_type === 'string' 
        ? rawContext.enhancement_type.slice(0, 20) as "casual" | "formal" | "shorter" | "detailed" | "custom"
        : undefined,
      custom_instruction: typeof rawContext.custom_instruction === 'string' ? rawContext.custom_instruction.slice(0, 500) : undefined,
      template_type: typeof rawContext.template_type === 'string' ? rawContext.template_type.slice(0, 100) : undefined,
      target_days: typeof rawContext.target_days === 'number' ? Math.min(Math.max(rawContext.target_days, 1), 14) : undefined,
    };

    const message = typeof rawBody.message === 'string' ? rawBody.message.slice(0, 2000) : undefined;
    const eventId = typeof rawBody.eventId === 'string' && /^[0-9a-f-]{36}$/i.test(rawBody.eventId) 
      ? rawBody.eventId 
      : undefined;
    
    // Determine language from context or default to 'de'
    const language = context.language || 'de';
    const eventType = context.event_type || 'other';

    console.log("AI Assistant request:", { type, language, eventType });

    // =========================================================================
    // RATE LIMITING (only for authenticated users)
    // =========================================================================
    if (userId) {
      const oneMinuteAgo = new Date(Date.now() - 60000);
      const { count: recentRequests, error: rateLimitError } = await supabase
        .from('ai_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', oneMinuteAgo.toISOString());

      if (!rateLimitError && recentRequests && recentRequests >= RATE_LIMIT_PER_MINUTE) {
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
          JSON.stringify({ 
            success: false, 
            error: 'RATE_LIMIT_EXCEEDED',
            message: errorMsgs[language] || errorMsgs.en 
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // =========================================================================
    // VOXTRAL TTS HANDLER (early return - no AI credits needed)
    // =========================================================================
    if (type === "voxtral_tts") {
      const ttsText = typeof rawBody.tts_text === 'string' ? rawBody.tts_text.slice(0, 2000) : '';
      const ttsVoice = typeof rawBody.tts_voice === 'string' ? rawBody.tts_voice.slice(0, 50) : 'c69964a6-ab8b-4f8a-9465-ec0925096ec8';
      const ttsSpeed = typeof rawBody.tts_speed === 'number' ? Math.min(Math.max(rawBody.tts_speed, 0.5), 2.0) : 1.0;

      if (!ttsText) {
        return new Response(
          JSON.stringify({ success: false, error: "Text ist erforderlich" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");
      if (!mistralApiKey) {
        console.error("MISTRAL_API_KEY not configured");
        return new Response(
          JSON.stringify({ success: false, error: "TTS-Service nicht konfiguriert" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Voxtral TTS request:", { textLength: ttsText.length, voice: ttsVoice });

      const ttsResponse = await fetch("https://api.mistral.ai/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${mistralApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "voxtral-mini-tts-2603",
          input: ttsText,
          voice: ttsVoice,
          speed: ttsSpeed,
        }),
      });

      if (!ttsResponse.ok) {
        const errText = await ttsResponse.text();
        console.error("Mistral TTS error:", ttsResponse.status, errText);
        return new Response(
          JSON.stringify({ success: false, error: "TTS-Generierung fehlgeschlagen" }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const audioData = await ttsResponse.arrayBuffer();
      return new Response(audioData, {
        headers: {
          ...corsHeaders,
          "Content-Type": "audio/mpeg",
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    // =========================================================================
    // CREDIT CHECK (only for authenticated users)
    // =========================================================================
    if (userId) {
      // Get subscription info
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan, expires_at, stripe_subscription_id')
        .eq('user_id', userId)
        .maybeSingle();

      const planType = determinePlanType(sub);
      const creditLimit = AI_CREDIT_LIMITS[planType] || 0;

      console.log("User plan check completed");

      // Skip credit check for free users (they shouldn't have access anyway via premium check)
      if (creditLimit > 0) {
        // Get current month usage
        const startOfMonth = getStartOfMonth();
        
        const { count: usedCredits, error: countError } = await supabase
          .from('ai_usage')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', startOfMonth.toISOString());

        if (countError) {
          console.error("Error counting credits");
        }

        const used = usedCredits || 0;
        console.log("Credit check completed");

        // Check if limit reached
        if (used >= creditLimit) {
          const errorMsgs: Record<string, string> = {
            de: "Du hast dein monatliches AI-Credit-Limit erreicht. Credits werden am 1. des nächsten Monats zurückgesetzt.",
            en: "You've reached your monthly AI credit limit. Credits reset on the 1st of next month.",
            fr: "Vous avez atteint votre limite mensuelle de crédits IA. Les crédits se réinitialisent le 1er du mois prochain.",
            es: "Has alcanzado tu límite mensual de créditos de IA. Los créditos se reinician el 1 del próximo mes.",
            it: "Hai raggiunto il limite mensile di crediti IA. I crediti si azzerano il 1° del mese prossimo.",
            nl: "Je hebt je maandelijkse AI-credit limiet bereikt. Credits worden gereset op de 1e van de volgende maand.",
            pl: "Osiągnąłeś miesięczny limit kredytów AI. Kredyty resetują się 1. dnia następnego miesiąca.",
            pt: "Atingiste o teu limite mensal de créditos IA. Os créditos são repostos no dia 1 do próximo mês.",
            tr: "Aylık AI kredi limitinize ulaştınız. Krediler bir sonraki ayın 1'inde sıfırlanır.",
            ar: "لقد وصلت إلى حد رصيد الذكاء الاصطناعي الشهري. يتم إعادة تعيين الرصيد في الأول من الشهر القادم.",
          };

          return new Response(
            JSON.stringify({
              success: false,
              error: 'CREDIT_LIMIT_REACHED',
              message: errorMsgs[language] || errorMsgs.en,
              credits_used: used,
              credits_limit: creditLimit,
              resets_at: getNextMonthReset().toISOString(),
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

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
        // Get target days from context (default to 3 for weekend)
        const targetDays = context.target_days || 3;
        const dayPlanPromptWithDays = getDayPlanPromptWithDays(language, targetDays);
        userPrompt = `${contextInfo}\n\n${dayPlanPromptWithDays}`;
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

    // =========================================================================
    // TRACK USAGE (only for authenticated users)
    // =========================================================================
    if (userId) {
      const { error: insertError } = await supabase
        .from('ai_usage')
        .insert({
          user_id: userId,
          event_id: eventId || null,
          request_type: type,
          tokens_used: 1,
        });

      if (insertError) {
        console.error("Error tracking AI usage:", insertError);
      } else {
        console.log("AI usage tracked successfully");
      }
    }

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
