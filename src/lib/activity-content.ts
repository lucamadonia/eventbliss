/**
 * Activity-Content-Framework für /ideen/[activity-slug] SEO/GEO-Landingpages.
 *
 * Strategie: 183 individuell wirkende Pages durch Kombination aus
 *   • kategorie-spezifischen Frameworks (10× — einmalig geschrieben)
 *   • aktivitäts-spezifischen Spezifika (183× — kompakter Datensatz)
 *   • automatischen Cross-Links zu JGA-Städten, die die Aktivität führen
 *
 * Jede Page hat dadurch: einzigartigen H1+Title, eigenen Cost-Range,
 * spezifische Stadtempfehlungen, generierte FAQ mit Aktivitätsnamen,
 * vollständiges JSON-LD (Article + HowTo + FAQPage + Speakable).
 */

import type { ActivityCategory, ActivityItem } from "./activities-library";
import { ACTIVITIES_LIBRARY } from "./activities-library";
import { JGA_CITIES } from "./jga-cities";

export interface CategoryFramework {
  /** Lead-Sentence kontext für AI/User: was zeichnet diese Kategorie aus. */
  hookSentence: string;
  /** Intro-Template: liefert einen kategorie-spezifischen Einstieg. */
  introFor: (a: ActivityItem) => string;
  /** Wann ist diese Aktivität sinnvoll. */
  whenSection: string[];
  /** Welche Crews passen. */
  whoSection: string[];
  /** Standard-Cost-Framework als Erklärtext. */
  costExplain: string;
  /** Typische Fehler / was Crews oft falsch machen. */
  commonMistakes: string[];
  /** 3 wiederverwendbare FAQs mit Aktivitäts-Variable. */
  faqs: (a: ActivityItem) => Array<{ q: string; a: string }>;
}

export interface ActivitySpec {
  /** Kosten pro Person in EUR (typisch). */
  costFrom: number;
  costTo: number;
  /** Optimale Gruppengröße. */
  groupSize: string;
  /** Dauer typisch. */
  duration: string;
  /** Indoor/Outdoor/beides. */
  setting: "indoor" | "outdoor" | "both";
  /** Wetter-abhängig? */
  weatherDependent: boolean;
  /** Difficulty-Level. */
  difficulty: "low" | "medium" | "high";
  /** Spezifische Stadtempfehlung (optional override). */
  cityHighlight?: string;
  /** Aktivitäts-spezifischer Satz für Intro-Customization. */
  flavor?: string;
}

// ──────────────────────────────────────────────────────────────────
// Category Frameworks — einmal pro Kategorie geschrieben
// ──────────────────────────────────────────────────────────────────

export const CATEGORY_FRAMEWORKS: Record<ActivityCategory, CategoryFramework> = {
  action: {
    hookSentence: "Action-Aktivitäten sind das Rückgrat klassischer JGA-Tagesprogramme — Adrenalin, Wettkampf, garantiert Story-Material.",
    introFor: (a) =>
      `${a.label} ist eine der gefragtesten Action-Aktivitäten für JGAs, Junggesellinnenabschiede und Gruppenreisen. Das Format funktioniert über klar definierten Wettkampf, sofortige Erfolgserlebnisse und Gruppendynamik — ideal als Tages-Highlight an Tag 2, wenn die Crew warm ist und vor dem Abend einen Höhepunkt braucht.`,
    whenSection: [
      "Tagesprogramm Tag 2 — wenn die Gruppe warm ist und vor dem Abend Action will",
      "Saubere Trennung zum Party-Programm — Action davor, Bar danach",
      "Bei Regen funktioniert Indoor-Action besser als Outdoor-Programm",
    ],
    whoSection: [
      "Crews ab 6 Personen für gute Team-Dynamik",
      "Bräutigams mit Wettkampfaffinität",
      "Auch für gemischte Sportlichkeit-Level geeignet",
    ],
    costExplain:
      "Action-Aktivitäten liegen typisch zwischen 30 und 90 € pro Person für 1–2 Stunden Programm. Premium-Optionen (Drift-Kurs, Skydiving) gehen über 150 €. Buchungen 4–8 Wochen vorher sichern Slots zur Hauptsaison.",
    commonMistakes: [
      "Zu kurz buchen: 60 Min reichen oft nicht — mind. 90 Min für die volle Erfahrung.",
      "Direkt nach dem Frühstück — Wartezeit zum Verarbeiten der vorigen Nacht einplanen.",
      "Kein Backup für Schlecht-Wetter wenn outdoor — Indoor-Alternative parallel buchbar halten.",
    ],
    faqs: (a) => [
      {
        q: `Was kostet ${a.label} für eine JGA-Gruppe?`,
        a: `${a.label} liegt typisch zwischen 30 und 90 € pro Person für 60–120 Minuten Programm. Bei Gruppenbuchungen ab 8 Personen sind Rabatte von 10–20 % üblich.`,
      },
      {
        q: `Wie viele Personen sind ideal für ${a.label}?`,
        a: `Optimal sind 6–12 Personen. Unter 6 wird die Crew-Dynamik schwach, über 16 wird Logistik schwierig. Größere Gruppen können oft in zwei Slots aufgeteilt werden.`,
      },
      {
        q: `Wie früh sollten wir ${a.label} buchen?`,
        a: `Für Mai–September: 4–8 Wochen Vorlauf. Außerhalb Hochsaison meist 1–2 Wochen ausreichend. Beliebte Slots (Samstagvormittag) sind erste Knappstellen.`,
      },
    ],
  },

  outdoor: {
    hookSentence: "Outdoor-Aktivitäten verbinden Natur-Erlebnis mit Gruppendynamik — von Wasser bis Berg, bei JGAs als Tages-Highlight gesetzt.",
    introFor: (a) =>
      `${a.label} ist eine der beliebtesten Outdoor-JGA-Aktivitäten und funktioniert für Crews jeder Sportlichkeit. Vorteil: Natur als Kulisse für Fotos, frische Luft für die Erholung von Vor-Nacht-Aktivitäten, und die Möglichkeit, ein Picknick oder Bier-Stop einzubauen.`,
    whenSection: [
      "Mai–September als Hauptsaison",
      "Sonntagvormittag als Hangover-Therapie",
      "Tages-Highlight für Crews mit Naturaffinität",
    ],
    whoSection: [
      "Crews mit Naturaffinität und Fotografie-Anspruch",
      "Gemischte Sportlichkeit-Levels (außer bei Hardcore-Adventure-Varianten)",
      "Bräutigams, die zur Hochzeit fit sein wollen",
    ],
    costExplain:
      "Outdoor-Aktivitäten kosten typisch 30–80 € pro Person inkl. Equipment. Bei Boots-Charter und Premium-Optionen 100–250 € pro Person. Wetter ist Hauptrisikofaktor — Stornoversicherung lohnt sich.",
    commonMistakes: [
      "Equipment-Check vergessen — Wetterfeste Kleidung oft nötig.",
      "Kein Wetter-Backup geplant — bei Regen funktioniert die Aktivität meist nicht.",
      "Zeit unterschätzen — Outdoor-Programm dauert mit An-/Abfahrt oft doppelt so lange.",
    ],
    faqs: (a) => [
      {
        q: `Welche Jahreszeit eignet sich am besten für ${a.label}?`,
        a: `Mai bis September für stabile Wetterbedingungen. Im Sommer Hochsaison-Slots früh buchen, im Frühling/Herbst flexiblere Termine und niedrigere Preise.`,
      },
      {
        q: `Brauchen wir Vorerfahrung für ${a.label}?`,
        a: `Nein, die meisten Anbieter bieten Crashkurse für Anfänger ab 30 Minuten. Bei Premium-Varianten (z.B. anspruchsvolle Touren) ist Grunderfahrung sinnvoll.`,
      },
      {
        q: `Was passiert bei schlechtem Wetter?`,
        a: `Die meisten Anbieter haben Stornoregeln oder Umbuchungs-Optionen. Bei JGAs immer Backup-Indoor-Aktivität parallel buchbar halten — Karting, Bouldern oder Escape Room.`,
      },
    ],
  },

  chill: {
    hookSentence: "Chill-Aktivitäten sind die unterschätzte JGA-Klasse — perfekt für Sonntag-Vormittag, Hangover-Recovery oder gemischte Crews.",
    introFor: (a) =>
      `${a.label} funktioniert für JGAs anders als Action-Programme: kein Adrenalin, sondern Entspannung mit Gruppendynamik. Ideal als Sonntag-Vormittag-Programm nach einer langen Bar-Nacht oder als Pre-Hochzeit-Recovery-Slot.`,
    whenSection: [
      "Sonntag-Vormittag als Hangover-Therapie",
      "Pre-Hochzeit-Programm zur Erholung",
      "Mixed-Generation-Crews (mit Schwiegerväter/Eltern dabei)",
    ],
    whoSection: [
      "Crews nach einer harten Vor-Nacht",
      "Gemischte Gruppen mit unterschiedlichen Energie-Levels",
      "Bräutigams die sich vor der Hochzeit erholen wollen",
    ],
    costExplain:
      "Chill-Aktivitäten kosten typisch 25–80 € pro Person. Wellness-Premium-Pakete bis 150 €. Buchbar meist kurzfristig — keine Vorlaufzeit-Engpässe wie bei Action.",
    commonMistakes: [
      "Zu kurz planen — Wellness/Spa braucht 2–3 Stunden für echten Effekt.",
      "Vorher zu viel essen — viele Chill-Programme sind nach dem Mittagessen entspannter.",
      "Erwartungs-Mismatch — manche Crews finden Chill-Programme langweilig, im Vorfeld abklopfen.",
    ],
    faqs: (a) => [
      {
        q: `Funktioniert ${a.label} auch nach einer harten Nacht?`,
        a: `Im Gegenteil — das ist oft der beste Zeitpunkt. ${a.label} hilft Crews, die Vor-Nacht zu verarbeiten und mit Energie in den nächsten Programmpunkt zu gehen.`,
      },
      {
        q: `Welche Gruppengröße ist ideal?`,
        a: `4–10 Personen funktionieren am besten. Größere Gruppen sind logistisch möglich, aber die Atmosphäre verliert an Intimität.`,
      },
      {
        q: `Was kostet ${a.label} pro Person?`,
        a: `Typisch 25–80 € pro Person für 90–180 Minuten Programm. Wellness-Premium-Optionen bis 150 €.`,
      },
    ],
  },

  food: {
    hookSentence: "Food-Aktivitäten verankern JGAs in Essen + Trinken — von Brauerei-Touren bis Kochkurs, beste Erinnerungs-Stoff.",
    introFor: (a) =>
      `${a.label} ist eine der unterschätztesten JGA-Aktivitäten: gemeinsames Erlebnis um Essen oder Trinken herum, das gleichzeitig Programmpunkt und Verpflegung ist. Für Crews, die mehr als Aktivitäten und Bar wollen.`,
    whenSection: [
      "Mittagsprogramm oder frühe Abendslots",
      "Als Verpflegungs-Ersatz bei langen Programmtagen",
      "Sonntag-Brunch-Alternative",
    ],
    whoSection: [
      "Foodie-Crews mit Genussorientierung",
      "Bräutigams die gerne kochen oder essen",
      "Gemischte Crews — Food-Erlebnisse funktionieren für alle Altersgruppen",
    ],
    costExplain:
      "Food-Aktivitäten liegen typisch zwischen 35 und 90 € pro Person. Premium-Optionen (Mehrgang-Menüs, Privat-Chef) ab 120 €. Reservierung 3–6 Wochen vorher empfohlen, vor allem zu Hochsaison.",
    commonMistakes: [
      "Allergien/Vorlieben nicht vorher klären — kann zur Stimmungsbremse werden.",
      "Programmpunkt zu spät planen — wer Hunger hat, ist ungeduldig.",
      "Reservierung vergessen — Spitzenrestaurants haben oft 4–8 Wochen Vorlauf.",
    ],
    faqs: (a) => [
      {
        q: `Wieviel Zeit braucht ${a.label}?`,
        a: `Typisch 2–3 Stunden inklusive Genuss-Zeit. Bei Kochkursen 3–4 Stunden, bei Verkostungs-Touren 2 Stunden.`,
      },
      {
        q: `Können Allergien oder Vegetarier-Wünsche berücksichtigt werden?`,
        a: `Bei Buchung immer angeben. Die meisten Anbieter sind flexibel, aber 1–2 Wochen Vorlauf für Sonderwünsche sind sinnvoll.`,
      },
      {
        q: `Was kostet ${a.label} pro Person?`,
        a: `Typisch 35–90 € pro Person inkl. Verpflegung. Premium-Varianten mit gehobenem Menü ab 120 €.`,
      },
    ],
  },

  entertainment: {
    hookSentence: "Entertainment-Aktivitäten sind die JGA-Joker — schnell zu buchen, immer Gruppen-tauglich, mit eingebautem Story-Effekt.",
    introFor: (a) =>
      `${a.label} ist eine klassische JGA-Entertainment-Aktivität, die ohne Vorerfahrung, mit jeder Crew-Größe und in jeder Stimmung funktioniert. Ideal als Lückenfüller zwischen Hauptprogrammpunkten oder als Abend-Einstieg.`,
    whenSection: [
      "Als Programmblock zwischen Aktivität und Abendessen",
      "Wenn Wetter oder Stimmung andere Pläne kippt — Notfall-Plan-B",
      "Als spontaner Programmpunkt am Tag der JGA",
    ],
    whoSection: [
      "Alle Crew-Konstellationen",
      "Auch für gemischte Generationen",
      "Insbesondere für Bräutigams, die keinen Sport-Fokus wollen",
    ],
    costExplain:
      "Entertainment-Aktivitäten liegen meist zwischen 25 und 65 € pro Person für 60–120 Minuten. Spontan-buchbar in den meisten Städten.",
    commonMistakes: [
      "Zu lange einplanen — 90 Min reichen für die meisten Entertainment-Aktivitäten.",
      "Programmpunkt unterschätzen — manche Aktivitäten brauchen Vorbereitung der Crew.",
      "Solo-Anbieter — bessere Erfahrung bei etablierten Locations mit Gruppen-Routine.",
    ],
    faqs: (a) => [
      {
        q: `Können wir ${a.label} spontan buchen?`,
        a: `Meist ja, vor allem werktags oder außerhalb Hochsaison. Wochenende-Slots im Mai–September 2–4 Wochen vorher sichern.`,
      },
      {
        q: `Wie groß sollte die Gruppe für ${a.label} sein?`,
        a: `Funktioniert ab 4 Personen. Optimum 8–14 für gute Gruppendynamik. Über 20 wird logistisch sportlich.`,
      },
      {
        q: `Was kostet ${a.label}?`,
        a: `Typisch 25–65 € pro Person für 60–120 Minuten Programm.`,
      },
    ],
  },

  creative: {
    hookSentence: "Kreative Aktivitäten überraschen Crews und produzieren das beste Foto-Material — von Pottery bis Painting.",
    introFor: (a) =>
      `${a.label} ist die unterschätzte kreative JGA-Kategorie: Crews stellen etwas her, lernen eine neue Fertigkeit und nehmen meist ein physisches Ergebnis mit nach Hause. Das macht ${a.label} zur längsten Erinnerungs-Quelle nach dem JGA.`,
    whenSection: [
      "Tag 2 als ruhigeres Tagesprogramm",
      "Brunch-Slot mit Mimosen und kreativer Tätigkeit",
      "Pre-Hochzeit-Programm als Stress-Reduktion",
    ],
    whoSection: [
      "Crews mit Foodie- oder Design-Affinität",
      "Bräutigams die Handwerk schätzen",
      "Gemischte Geschlechter / Generationen",
    ],
    costExplain:
      "Kreative Aktivitäten kosten typisch 40–80 € pro Person inkl. Materialien. Premium-Workshops mit Profi-Anleitung bis 120 €. Buchungen 3–5 Wochen vorher empfohlen.",
    commonMistakes: [
      "Crews mit reiner Eskalations-Orientierung mögen kreative Aktivitäten oft nicht.",
      "Workshop-Länge unterschätzen — meist 2–3 Stunden, nicht 1.",
      "Material-Mitnahme-Möglichkeiten nicht abklären.",
    ],
    faqs: (a) => [
      {
        q: `Brauchen wir Vorkenntnisse für ${a.label}?`,
        a: `Nein, Anbieter sind auf Anfänger eingestellt. Crashkurs in den ersten 15 Minuten reicht für Brauchbares.`,
      },
      {
        q: `Wie lange dauert ${a.label} typischerweise?`,
        a: `2–3 Stunden für ein vorzeigbares Ergebnis. Mit Pausen und Verkostung oft 3,5 Stunden Gesamtprogramm.`,
      },
      {
        q: `Was kostet ${a.label} pro Person?`,
        a: `Typisch 40–80 € pro Person inkl. Materialien. Profi-Premium-Workshops bis 120 €.`,
      },
    ],
  },

  sport: {
    hookSentence: "Sport-Aktivitäten sind JGA-Pflicht für aktive Crews — Wettkampf, Fitness, Team-Building in einem Programmpunkt.",
    introFor: (a) =>
      `${a.label} bietet JGAs strukturierten Wettkampf mit klaren Regeln, sofortigem Feedback und Foto-tauglichen Momenten. Funktioniert am besten an Tag 2, wenn die Crew warm ist und vor dem Abend Energie kanalisieren will.`,
    whenSection: [
      "Tag 2 Programmpunkt für aktive Crews",
      "Vormittag-Slot bei Sommer-JGAs",
      "Als Fitness-Vorbereitung vor der Hochzeit",
    ],
    whoSection: [
      "Sportliche Crews mit Wettkampf-DNA",
      "Bräutigams mit Sport-Hintergrund",
      "Crews die im Sommer aktiv sein wollen",
    ],
    costExplain:
      "Sport-Aktivitäten liegen typisch zwischen 25 und 75 € pro Person für 90–180 Minuten. Equipment meist inklusive.",
    commonMistakes: [
      "Sportlichkeit der Crew überschätzen — Anfänger-Optionen prüfen.",
      "Equipment nicht vorher abklären — Schienbeinschoner, Schuhe etc.",
      "Nicht-Sportler im Vorfeld berücksichtigen — Backup-Programm parallel anbieten.",
    ],
    faqs: (a) => [
      {
        q: `Brauchen wir Sport-Erfahrung für ${a.label}?`,
        a: `Nein, ${a.label} hat klare Grundregeln und Anfänger-Anleitung. Sportliche Vorerfahrung ist ein Plus, aber kein Muss.`,
      },
      {
        q: `Welches Equipment ist nötig?`,
        a: `Meist alles inklusive bei der Buchung. Sportkleidung und feste Schuhe mitbringen reicht.`,
      },
      {
        q: `Was kostet ${a.label}?`,
        a: `Typisch 25–75 € pro Person für 90–180 Minuten inkl. Equipment.`,
      },
    ],
  },

  nightlife: {
    hookSentence: "Nightlife-Programme sind das Herzstück jedes JGAs — von kuratierten Bar-Crawls bis VIP-Club-Eintritten.",
    introFor: (a) =>
      `${a.label} ist eines der zentralen Nightlife-Programme bei JGAs und Junggesellinnenabschieden. Die richtige Wahl der Variante (Bar-Crawl, Club, Karaoke) entscheidet über die Stimmung des Abends mehr als jeder andere Programmpunkt.`,
    whenSection: [
      "Hauptabend des JGAs — meistens Samstag",
      "Tag 1 als Anreise-Abend mit Pre-Drinks",
      "Sonntag-Abreise-Abend bei längeren JGAs",
    ],
    whoSection: [
      "Alle Crews die ein klassisches JGA-Erlebnis wollen",
      "Bräutigams die Nightlife schätzen",
      "Auch für reife Crews mit angepasster Tonalität",
    ],
    costExplain:
      "Nightlife-Programme liegen typisch zwischen 40 und 120 € pro Person für 4–6 Stunden Abend. Premium-Optionen (VIP-Club, Bottle-Service) ab 150 € pro Person.",
    commonMistakes: [
      "Pre-Drinks-Slot vergessen — spart Geld und stellt die Stimmung ein.",
      "Türsteher-Strategie ignorieren — reine Männergruppen werden oft abgewiesen.",
      "Kein Backup-Bar wenn die Haupt-Location voll ist.",
    ],
    faqs: (a) => [
      {
        q: `Wie spät sollten wir ${a.label} starten?`,
        a: `Im DACH-Raum 20–22 Uhr für Bars, 23–01 Uhr für Clubs. In Spanien/Italien später (22–24 Uhr für Bars, 01–03 Uhr für Clubs).`,
      },
      {
        q: `Wie schaffen wir es als Männergruppe in gute Clubs?`,
        a: `Reservierung mit Bottle-Service umgeht Türsteher-Risiko. Alternativ mit gemischter Gruppe oder kleineren Subgruppen anstellen.`,
      },
      {
        q: `Was kostet ${a.label} pro Person?`,
        a: `Typisch 40–120 € pro Person für 4–6 Stunden Abend inkl. Eintritten + Getränke.`,
      },
    ],
  },

  culture: {
    hookSentence: "Kultur-Aktivitäten geben JGAs Tiefe — Museum, Stadtführung, historische Tour als Gegengewicht zur Eskalation.",
    introFor: (a) =>
      `${a.label} ist die kulturelle Programm-Säule für JGAs, die mehr als Eskalation wollen. Ein 90-Min-Slot reicht für eine kulturelle Selbstrechtfertigung des Wochenendes und produziert oft die einzigen Fotos, die auch Familie zeigt werden können.`,
    whenSection: [
      "Tagesprogramm mit kulturellem Anspruch",
      "Vormittag-Slot vor der Eskalation",
      "Sonntag-Vormittag-Programm",
    ],
    whoSection: [
      "Crews mit kulturellem Anspruch",
      "Bräutigams mit historischer Affinität",
      "Mixed-Generation-Gruppen mit Eltern dabei",
    ],
    costExplain:
      "Kultur-Aktivitäten kosten typisch 15–40 € pro Person für 90–180 Minuten. Premium-Führungen mit Spezialthemen bis 60 €.",
    commonMistakes: [
      "Zu lange Programme — 2 Stunden reichen für die meisten Crews.",
      "Tickets nicht vorher buchen — Top-Museen haben Slot-Systeme.",
      "Crew-Stimmung nicht abklopfen — Eskalations-Crews mögen oft keine Museen.",
    ],
    faqs: (a) => [
      {
        q: `Wie lange sollte ${a.label} dauern?`,
        a: `90–120 Minuten ist der Sweet Spot. Länger wird für JGA-Crews oft zäh.`,
      },
      {
        q: `Sollten wir Tickets vorher buchen?`,
        a: `Bei beliebten Locations (Museen, geführte Touren) ja, mindestens 1 Woche vorher. Spontan-Tour mit kostenlosem Guide ist meist auch eine Option.`,
      },
      {
        q: `Was kostet ${a.label}?`,
        a: `Typisch 15–40 € pro Person. Premium-Führungen bis 60 €.`,
      },
    ],
  },

  adventure: {
    hookSentence: "Adventure-Aktivitäten sind die XL-Klasse — von Skydiving bis Paragliding, einmalige JGA-Geschichten.",
    introFor: (a) =>
      `${a.label} gehört zur Adventure-Premium-Klasse für JGAs. Diese Aktivitäten produzieren die intensivsten Erinnerungen, brauchen aber Mut, Budget und gute Vorplanung. Nicht für jede Crew, aber wenn passend: Highlight-Programmpunkt schlechthin.`,
    whenSection: [
      "Tag 2 als Hauptprogrammpunkt",
      "Mai–September für Outdoor-Adventure",
      "Buchung 4–8 Wochen vorher zwingend",
    ],
    whoSection: [
      "Risikofreudige Crews mit Adventure-Affinität",
      "Bräutigams die einmal in ihrem Leben skydiven wollen",
      "Crews mit höherem Budget (100–250 € pro Aktivität pro Person)",
    ],
    costExplain:
      "Adventure-Aktivitäten liegen typisch zwischen 100 und 250 € pro Person. Premium-Erlebnisse (Skydiving, Hubschrauber-Touren) ab 250 €. Versicherung beim Anbieter prüfen.",
    commonMistakes: [
      "Versicherung-Klein­ge­druck­tes nicht prüfen — Adventure-Aktivitäten haben oft Sonderregeln.",
      "Wetterabhängigkeit unterschätzen — bei vielen Adventure-Aktivitäten 50% Storno-Wahrscheinlichkeit.",
      "Nicht alle Crew-Mitglieder mitmachen lassen — Backup-Programm für Nicht-Adventure-Crew einplanen.",
    ],
    faqs: (a) => [
      {
        q: `Brauchen wir Vorerfahrung für ${a.label}?`,
        a: `Meist nein, Tandem-Varianten existieren für die meisten Adventure-Aktivitäten. Body-Check und Sicherheits-Einweisung sind Pflicht.`,
      },
      {
        q: `Was passiert bei schlechtem Wetter?`,
        a: `Adventure-Aktivitäten haben Wetter-Sonderregeln. Vor Buchung Storno-Bedingungen klären. Backup-Indoor-Programm parallel buchbar halten.`,
      },
      {
        q: `Was kostet ${a.label} pro Person?`,
        a: `Typisch 100–250 € pro Person. Premium-Erlebnisse darüber.`,
      },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────
// Activity-spezifische Spezifika — Cost-Range + Flavor pro Aktivität
// Standardwert wird über die Kategorie hergeleitet, hier Überschreibungen
// für ausgewählte Top-Aktivitäten.
// ──────────────────────────────────────────────────────────────────

export const ACTIVITY_SPECS: Partial<Record<string, ActivitySpec>> = {
  karting: {
    costFrom: 30,
    costTo: 70,
    groupSize: "6–16 Personen",
    duration: "60–90 Minuten",
    setting: "both",
    weatherDependent: false,
    difficulty: "low",
    flavor: "Indoor-Karts sind nahezu wetterunabhängig, mit Outdoor-Strecken bei Sonne ein Premium-Erlebnis.",
  },
  escape_room: {
    costFrom: 25,
    costTo: 45,
    groupSize: "4–8 Personen pro Raum",
    duration: "60–90 Minuten",
    setting: "indoor",
    weatherDependent: false,
    difficulty: "medium",
    flavor: "Bei größeren Crews zwei Räume parallel buchen und am Ende vergleichen — beste Gruppendynamik.",
  },
  lasertag: {
    costFrom: 25,
    costTo: 45,
    groupSize: "8–24 Personen",
    duration: "60–90 Minuten",
    setting: "indoor",
    weatherDependent: false,
    difficulty: "low",
    flavor: "Beste Wahl bei größeren JGAs — zwei Teams gegeneinander, mehrere Spielrunden, Vest-Punkte zählen.",
  },
  shooting_range: {
    costFrom: 50,
    costTo: 120,
    groupSize: "6–12 Personen",
    duration: "60–120 Minuten",
    setting: "indoor",
    weatherDependent: false,
    difficulty: "medium",
    cityHighlight: "prag",
    flavor: "In DE eingeschränkt — beste Erlebnisse in Prag, Krakau oder Bukarest mit Sonderwaffen-Optionen.",
  },
  sup: {
    costFrom: 25,
    costTo: 60,
    groupSize: "4–14 Personen",
    duration: "90–180 Minuten",
    setting: "outdoor",
    weatherDependent: true,
    difficulty: "low",
    flavor: "Sweet-Spot-Aktivität für gemischte Crews — leicht zu erlernen, foto-genial, in den meisten Städten verfügbar.",
  },
  sailing: {
    costFrom: 80,
    costTo: 200,
    groupSize: "6–10 Personen",
    duration: "3–6 Stunden",
    setting: "outdoor",
    weatherDependent: true,
    difficulty: "low",
    flavor: "Charter-Boote für Crews zwischen 250–500 € — am Mittelmeer oft günstiger als Standard-Touri-Boote.",
  },
  rafting: {
    costFrom: 60,
    costTo: 110,
    groupSize: "6–12 Personen",
    duration: "3–4 Stunden",
    setting: "outdoor",
    weatherDependent: true,
    difficulty: "medium",
    flavor: "Beste Adrenalin-Aktivität für Crews die Wasser-Action wollen — in München (Isar) und Salzburg ideal.",
  },
  axe_throwing: {
    costFrom: 25,
    costTo: 45,
    groupSize: "4–12 Personen",
    duration: "60–90 Minuten",
    setting: "indoor",
    weatherDependent: false,
    difficulty: "low",
    flavor: "Trend-Aktivität der letzten Jahre — kompakt, gruppendynamisch, fototechnisch sehr lohnend.",
  },
  vr_arena: {
    costFrom: 30,
    costTo: 60,
    groupSize: "4–12 Personen",
    duration: "45–90 Minuten",
    setting: "indoor",
    weatherDependent: false,
    difficulty: "low",
    flavor: "Free-Roam-VR-Arenen bieten gemeinsame Spielerlebnisse — beste Variante für 6–8er-Gruppen.",
  },
  paintball: {
    costFrom: 40,
    costTo: 80,
    groupSize: "8–20 Personen",
    duration: "2–4 Stunden",
    setting: "outdoor",
    weatherDependent: true,
    difficulty: "medium",
    flavor: "Klassiker für größere Crews — Tageslicht und genug Platz für gute Spielzüge.",
  },
  indoor_skydiving: {
    costFrom: 50,
    costTo: 100,
    groupSize: "4–10 Personen",
    duration: "30–60 Minuten Aktivität",
    setting: "indoor",
    weatherDependent: false,
    difficulty: "low",
    flavor: "Spektakuläre Foto-Aktivität ohne Wetter-Risiko — pro Person nur 1–2 Minuten im Tunnel, daher kompakt zu planen.",
  },
  bubble_soccer: {
    costFrom: 30,
    costTo: 50,
    groupSize: "8–20 Personen",
    duration: "60–90 Minuten",
    setting: "both",
    weatherDependent: true,
    difficulty: "low",
    flavor: "Beste Lacher-Aktivität — Bräutigam in der Bubble ist Pflicht-Foto.",
  },
  rage_room: {
    costFrom: 30,
    costTo: 60,
    groupSize: "2–8 Personen",
    duration: "30–60 Minuten",
    setting: "indoor",
    weatherDependent: false,
    difficulty: "low",
    flavor: "Stressabbau-Aktivität — Bräutigam zertrümmert symbolisch das Junggesellenleben.",
  },
  climbing: {
    costFrom: 15,
    costTo: 40,
    groupSize: "4–16 Personen",
    duration: "2–3 Stunden",
    setting: "indoor",
    weatherDependent: false,
    difficulty: "medium",
    flavor: "Boulder-Hallen sind in DACH gruppenfreundlich und günstig — ideal als Tagesprogramm.",
  },
  hiking: {
    costFrom: 0,
    costTo: 30,
    groupSize: "4–20 Personen",
    duration: "3–6 Stunden",
    setting: "outdoor",
    weatherDependent: true,
    difficulty: "medium",
    flavor: "Günstigste Outdoor-Aktivität — in den Alpen-Städten (München, Wien, Salzburg, Zürich) Pflicht-Programm.",
  },
  beer_spa: {
    costFrom: 50,
    costTo: 100,
    groupSize: "2–8 Personen",
    duration: "60–90 Minuten",
    setting: "indoor",
    weatherDependent: false,
    difficulty: "low",
    cityHighlight: "prag",
    flavor: "Prag-Spezialität — im warmen Bierbad baden mit Bier in der Hand. Surreal und JGA-Story-Material.",
  },
  brewery_tour: {
    costFrom: 25,
    costTo: 60,
    groupSize: "6–16 Personen",
    duration: "90–180 Minuten",
    setting: "indoor",
    weatherDependent: false,
    difficulty: "low",
    flavor: "Klassische Tagesaktivität für Bier-orientierte Crews — in Köln (Kölsch), Düsseldorf (Alt), München (Helles) ideal.",
  },
  wine_tasting: {
    costFrom: 35,
    costTo: 80,
    groupSize: "4–14 Personen",
    duration: "90–180 Minuten",
    setting: "indoor",
    weatherDependent: false,
    difficulty: "low",
    flavor: "Beste Wahl für gehobene Crews — in Wien, Florenz, Bordeaux oder Stuttgart als Weinregion-Anschluss.",
  },
  cocktail_workshop: {
    costFrom: 50,
    costTo: 90,
    groupSize: "4–14 Personen",
    duration: "2–3 Stunden",
    setting: "indoor",
    weatherDependent: false,
    difficulty: "low",
    flavor: "JGA-Klassiker für JGA und Junggesellinnenabschied — Crews mixen 3–4 Cocktails selbst, mit Verkostung.",
  },
  pottery: {
    costFrom: 40,
    costTo: 70,
    groupSize: "4–10 Personen",
    duration: "2–3 Stunden",
    setting: "indoor",
    weatherDependent: false,
    difficulty: "low",
    flavor: "Bekannt aus 'Ghost' — Pottery-Workshops sind die unterschätzteste kreative JGA-Aktivität.",
  },
};

// ──────────────────────────────────────────────────────────────────
// Default-Spec generieren (für Aktivitäten ohne explizite Definition)
// ──────────────────────────────────────────────────────────────────

const CATEGORY_DEFAULT_SPEC: Record<ActivityCategory, ActivitySpec> = {
  action: { costFrom: 30, costTo: 75, groupSize: "6–14 Personen", duration: "60–120 Minuten", setting: "both", weatherDependent: false, difficulty: "medium" },
  outdoor: { costFrom: 30, costTo: 80, groupSize: "4–16 Personen", duration: "2–4 Stunden", setting: "outdoor", weatherDependent: true, difficulty: "medium" },
  chill: { costFrom: 25, costTo: 70, groupSize: "4–10 Personen", duration: "90–180 Minuten", setting: "indoor", weatherDependent: false, difficulty: "low" },
  food: { costFrom: 35, costTo: 80, groupSize: "6–14 Personen", duration: "2–3 Stunden", setting: "indoor", weatherDependent: false, difficulty: "low" },
  entertainment: { costFrom: 25, costTo: 60, groupSize: "6–14 Personen", duration: "90–120 Minuten", setting: "both", weatherDependent: false, difficulty: "low" },
  creative: { costFrom: 40, costTo: 75, groupSize: "4–12 Personen", duration: "2–3 Stunden", setting: "indoor", weatherDependent: false, difficulty: "low" },
  sport: { costFrom: 25, costTo: 60, groupSize: "6–16 Personen", duration: "90–180 Minuten", setting: "both", weatherDependent: false, difficulty: "medium" },
  nightlife: { costFrom: 50, costTo: 110, groupSize: "all", duration: "4–6 Stunden", setting: "indoor", weatherDependent: false, difficulty: "low" },
  culture: { costFrom: 15, costTo: 40, groupSize: "4–20 Personen", duration: "90–120 Minuten", setting: "both", weatherDependent: false, difficulty: "low" },
  adventure: { costFrom: 80, costTo: 220, groupSize: "4–10 Personen", duration: "2–4 Stunden", setting: "outdoor", weatherDependent: true, difficulty: "high" },
};

export function getActivitySpec(activity: ActivityItem): ActivitySpec {
  return ACTIVITY_SPECS[activity.value] ?? CATEGORY_DEFAULT_SPEC[activity.category];
}

// ──────────────────────────────────────────────────────────────────
// City-Cross-Links: liefere bis zu 6 Städte, die diese Aktivität führen
// ──────────────────────────────────────────────────────────────────

export function getCitiesForActivity(activitySlug: string) {
  return JGA_CITIES.filter((c) => c.topActivitySlugs.includes(activitySlug)).slice(0, 6);
}

export function getActivityBySlug(slug: string): ActivityItem | undefined {
  return ACTIVITIES_LIBRARY.find((a) => a.value === slug);
}
