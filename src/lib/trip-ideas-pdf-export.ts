// Trip Ideas PDF Export - Premium formatted export for AI-generated trip ideas
import { format } from "date-fns";
import { de, enUS, es, fr, it, nl, pt, pl, tr, ar, Locale } from "date-fns/locale";
import { type ParsedTripIdeasResponse, type ParsedTripIdea } from "./ai-response-parser";

interface EventInfo {
  name: string;
  participantCount?: number;
}

const localeMap: Record<string, Locale> = {
  de: de,
  en: enUS,
  es: es,
  fr: fr,
  it: it,
  nl: nl,
  pt: pt,
  pl: pl,
  tr: tr,
  ar: ar,
};

const TRANSLATIONS: Record<string, {
  tripIdeas: string;
  participants: string;
  destination: string;
  cost: string;
  travelTime: string;
  whyPerfect: string;
  highlights: string;
  tips: string;
  generatedBy: string;
  idea: string;
  topPick: string;
}> = {
  de: { tripIdeas: "Reiseideen", participants: "Teilnehmer", destination: "Ziel", cost: "Budget", travelTime: "Reisezeit", whyPerfect: "Warum perfekt", highlights: "Highlights", tips: "Reisetipps", generatedBy: "Erstellt mit EventBliss", idea: "IDEE", topPick: "Top Pick" },
  en: { tripIdeas: "Trip Ideas", participants: "Participants", destination: "Destination", cost: "Budget", travelTime: "Travel Time", whyPerfect: "Why Perfect", highlights: "Highlights", tips: "Travel Tips", generatedBy: "Created with EventBliss", idea: "IDEA", topPick: "Top Pick" },
  es: { tripIdeas: "Ideas de viaje", participants: "Participantes", destination: "Destino", cost: "Presupuesto", travelTime: "Duración", whyPerfect: "Por qué perfecto", highlights: "Destacados", tips: "Consejos de viaje", generatedBy: "Creado con EventBliss", idea: "IDEA", topPick: "Mejor opción" },
  fr: { tripIdeas: "Idées de voyage", participants: "Participants", destination: "Destination", cost: "Budget", travelTime: "Durée", whyPerfect: "Pourquoi parfait", highlights: "Points forts", tips: "Conseils voyage", generatedBy: "Créé avec EventBliss", idea: "IDÉE", topPick: "Meilleur choix" },
  it: { tripIdeas: "Idee di viaggio", participants: "Partecipanti", destination: "Destinazione", cost: "Budget", travelTime: "Durata", whyPerfect: "Perché perfetto", highlights: "Punti salienti", tips: "Consigli viaggio", generatedBy: "Creato con EventBliss", idea: "IDEA", topPick: "Scelta top" },
  nl: { tripIdeas: "Reisideeën", participants: "Deelnemers", destination: "Bestemming", cost: "Budget", travelTime: "Reistijd", whyPerfect: "Waarom perfect", highlights: "Hoogtepunten", tips: "Reistips", generatedBy: "Gemaakt met EventBliss", idea: "IDEE", topPick: "Topkeuze" },
  pl: { tripIdeas: "Pomysły na podróż", participants: "Uczestnicy", destination: "Cel", cost: "Budżet", travelTime: "Czas podróży", whyPerfect: "Dlaczego idealne", highlights: "Najważniejsze", tips: "Wskazówki", generatedBy: "Utworzono z EventBliss", idea: "POMYSŁ", topPick: "Najlepszy wybór" },
  pt: { tripIdeas: "Ideias de viagem", participants: "Participantes", destination: "Destino", cost: "Orçamento", travelTime: "Duração", whyPerfect: "Por que perfeito", highlights: "Destaques", tips: "Dicas de viagem", generatedBy: "Criado com EventBliss", idea: "IDEIA", topPick: "Melhor escolha" },
  tr: { tripIdeas: "Seyahat fikirleri", participants: "Katılımcılar", destination: "Hedef", cost: "Bütçe", travelTime: "Süre", whyPerfect: "Neden mükemmel", highlights: "Öne çıkanlar", tips: "Seyahat ipuçları", generatedBy: "EventBliss ile oluşturuldu", idea: "FİKİR", topPick: "En iyi seçim" },
  ar: { tripIdeas: "أفكار السفر", participants: "المشاركون", destination: "الوجهة", cost: "الميزانية", travelTime: "المدة", whyPerfect: "لماذا مثالي", highlights: "أبرز الميزات", tips: "نصائح السفر", generatedBy: "تم الإنشاء بواسطة EventBliss", idea: "فكرة", topPick: "الخيار الأفضل" },
};

function getTranslation<K extends keyof typeof TRANSLATIONS.en>(locale: string, key: K): string {
  const lang = locale.substring(0, 2) as keyof typeof TRANSLATIONS;
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key];
}

// Idea colors
const IDEA_COLORS = [
  { primary: '#d97706', secondary: '#f59e0b', light: '#fffbeb' }, // Amber (Top Pick)
  { primary: '#0891b2', secondary: '#06b6d4', light: '#ecfeff' }, // Cyan
  { primary: '#7c3aed', secondary: '#8b5cf6', light: '#f5f3ff' }, // Violet
  { primary: '#059669', secondary: '#10b981', light: '#ecfdf5' }, // Emerald
  { primary: '#e11d48', secondary: '#f43f5e', light: '#fff1f2' }, // Rose
];

export function generateTripIdeasHTML(
  tripIdeasData: ParsedTripIdeasResponse,
  eventInfo: EventInfo,
  locale: string = 'de'
): string {
  const currentLocale = localeMap[locale] || de;
  const t = (key: keyof typeof TRANSLATIONS.en) => getTranslation(locale, key);

  let html = `
    <!DOCTYPE html>
    <html lang="${locale}">
    <head>
      <meta charset="utf-8">
      <title>${eventInfo.name} - ${t('tripIdeas')}</title>
      <style>
        @page { size: A4; margin: 15mm 20mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
          line-height: 1.5;
          color: #1a1a1a;
          background: #fff;
          font-size: 11pt;
        }
        .container { max-width: 800px; margin: 0 auto; }
        
        .header {
          text-align: center;
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 3px solid #4f46e5;
        }
        .header h1 { font-size: 24pt; color: #1a1a1a; margin-bottom: 8px; font-weight: 700; }
        .header .subtitle { font-size: 14pt; color: #4f46e5; font-weight: 600; }
        .header .meta { display: flex; justify-content: center; gap: 20px; margin-top: 12px; font-size: 10pt; color: #666; }
        
        .intro {
          background: #f9fafb;
          padding: 15px 20px;
          border-radius: 8px;
          margin-bottom: 25px;
          font-style: italic;
          color: #4b5563;
          border-left: 4px solid #4f46e5;
        }
        
        .idea-card {
          margin-bottom: 20px;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          page-break-inside: avoid;
        }
        .idea-header {
          padding: 12px 16px;
          color: white;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .idea-number {
          background: rgba(255,255,255,0.25);
          padding: 4px 12px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 9pt;
          letter-spacing: 1px;
        }
        .idea-info { flex: 1; }
        .idea-title { font-size: 14pt; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .idea-destination { font-size: 10pt; opacity: 0.9; margin-top: 4px; }
        .idea-emoji { font-size: 24pt; }
        .top-pick-badge {
          background: rgba(255,255,255,0.3);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 8pt;
          font-weight: 600;
        }
        
        .idea-body { padding: 16px; background: #fff; }
        .idea-meta { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
        .meta-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 9pt;
          font-weight: 500;
          background: #f3f4f6;
          color: #374151;
        }
        .idea-description { font-size: 10pt; color: #4b5563; margin-bottom: 12px; line-height: 1.6; }
        
        .why-perfect-box {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
        }
        .why-perfect-title { font-size: 10pt; font-weight: 600; color: #059669; margin-bottom: 8px; }
        .why-perfect-list { list-style: none; }
        .why-perfect-list li { font-size: 9pt; color: #047857; padding: 3px 0; }
        .why-perfect-list li::before { content: "✓ "; color: #10b981; font-weight: bold; }
        
        .highlights-box {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 12px;
        }
        .highlights-title { font-size: 10pt; font-weight: 600; color: #2563eb; margin-bottom: 8px; }
        .highlights-list { list-style: none; }
        .highlights-list li { font-size: 9pt; color: #1d4ed8; padding: 3px 0; }
        .highlights-list li::before { content: "• "; color: #3b82f6; }
        
        .tips-section {
          margin-top: 25px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 10px;
          padding: 16px 20px;
        }
        .tips-header { font-size: 11pt; font-weight: 600; color: #92400e; margin-bottom: 10px; }
        .tips-list { list-style: none; }
        .tips-list li { padding: 5px 0; font-size: 9.5pt; color: #78350f; border-bottom: 1px dashed #fde68a; }
        .tips-list li:last-child { border-bottom: none; }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #9ca3af;
          font-size: 9pt;
        }
        
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .idea-card { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌍 ${eventInfo.name}</h1>
          <div class="subtitle">${t('tripIdeas')}</div>
          <div class="meta">
            <span>✈️ ${tripIdeasData.ideas.length} ${t('tripIdeas')}</span>
            ${eventInfo.participantCount ? `<span>👥 ${eventInfo.participantCount} ${t('participants')}</span>` : ''}
          </div>
        </div>
  `;

  if (tripIdeasData.intro) {
    html += `<div class="intro">${tripIdeasData.intro}</div>`;
  }

  tripIdeasData.ideas.forEach((idea, index) => {
    const color = IDEA_COLORS[index % IDEA_COLORS.length];
    const isTopPick = index === 0;

    html += `
        <div class="idea-card">
          <div class="idea-header" style="background: linear-gradient(135deg, ${color.primary} 0%, ${color.secondary} 100%);">
            <div class="idea-number">${t('idea')} ${index + 1}</div>
            <div class="idea-info">
              <div class="idea-title">
                ${idea.title}
                ${isTopPick ? `<span class="top-pick-badge">⭐ ${t('topPick')}</span>` : ''}
              </div>
              <div class="idea-destination">📍 ${idea.destination}</div>
            </div>
            <div class="idea-emoji">${idea.emoji}</div>
          </div>
          <div class="idea-body">
            <div class="idea-meta">
              ${idea.cost ? `<span class="meta-badge">💰 ${idea.cost}</span>` : ''}
              ${idea.travelTime ? `<span class="meta-badge">🗓️ ${idea.travelTime}</span>` : ''}
            </div>
            ${idea.description ? `<div class="idea-description">${idea.description}</div>` : ''}
            ${idea.whyPerfect && idea.whyPerfect.length > 0 ? `
              <div class="why-perfect-box">
                <div class="why-perfect-title">💡 ${t('whyPerfect')}</div>
                <ul class="why-perfect-list">
                  ${idea.whyPerfect.map(w => `<li>${w}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            ${idea.highlights && idea.highlights.length > 0 ? `
              <div class="highlights-box">
                <div class="highlights-title">🎯 ${t('highlights')}</div>
                <ul class="highlights-list">
                  ${idea.highlights.map(h => `<li>${h}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
    `;
  });

  if (tripIdeasData.tips.length > 0) {
    html += `
        <div class="tips-section">
          <div class="tips-header">💡 ${t('tips')}</div>
          <ul class="tips-list">
            ${tripIdeasData.tips.map(tip => `<li>${tip}</li>`).join('')}
          </ul>
        </div>
    `;
  }

  html += `
        <div class="footer">
          ${t('generatedBy')} • ${format(new Date(), "PPP", { locale: currentLocale })}
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

export function openTripIdeasPrint(
  tripIdeasData: ParsedTripIdeasResponse,
  eventInfo: EventInfo,
  locale: string = 'de'
): void {
  const html = generateTripIdeasHTML(tripIdeasData, eventInfo, locale);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }
}

export function downloadTripIdeasHTML(
  tripIdeasData: ParsedTripIdeasResponse,
  eventInfo: EventInfo,
  locale: string = 'de'
): void {
  const html = generateTripIdeasHTML(tripIdeasData, eventInfo, locale);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${eventInfo.name.replace(/\s+/g, '-')}-trip-ideas.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
