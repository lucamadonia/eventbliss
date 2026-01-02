// Activities PDF Export - Premium formatted export for AI-generated activities
import { format } from "date-fns";
import { de, enUS, es, fr, it, nl, pt, pl, tr, ar, Locale } from "date-fns/locale";
import { type ParsedActivitiesResponse, type ParsedActivityExtended } from "./ai-response-parser";

interface EventInfo {
  name: string;
  participantCount?: number;
  budget?: string;
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
  activities: string;
  participants: string;
  budget: string;
  duration: string;
  cost: string;
  fitness: string;
  highlights: string;
  tips: string;
  generatedBy: string;
  activity: string;
  fitnessEasy: string;
  fitnessNormal: string;
  fitnessChallenging: string;
}> = {
  de: { activities: "Aktivitäts-Vorschläge", participants: "Teilnehmer", budget: "Budget", duration: "Dauer", cost: "Kosten", fitness: "Fitness", highlights: "Highlights", tips: "Tipps", generatedBy: "Erstellt mit EventBliss", activity: "AKTIVITÄT", fitnessEasy: "Leicht", fitnessNormal: "Normal", fitnessChallenging: "Anspruchsvoll" },
  en: { activities: "Activity Suggestions", participants: "Participants", budget: "Budget", duration: "Duration", cost: "Cost", fitness: "Fitness", highlights: "Highlights", tips: "Tips", generatedBy: "Created with EventBliss", activity: "ACTIVITY", fitnessEasy: "Easy", fitnessNormal: "Normal", fitnessChallenging: "Challenging" },
  es: { activities: "Sugerencias de actividades", participants: "Participantes", budget: "Presupuesto", duration: "Duración", cost: "Coste", fitness: "Forma física", highlights: "Destacados", tips: "Consejos", generatedBy: "Creado con EventBliss", activity: "ACTIVIDAD", fitnessEasy: "Fácil", fitnessNormal: "Normal", fitnessChallenging: "Exigente" },
  fr: { activities: "Suggestions d'activités", participants: "Participants", budget: "Budget", duration: "Durée", cost: "Coût", fitness: "Forme", highlights: "Points forts", tips: "Conseils", generatedBy: "Créé avec EventBliss", activity: "ACTIVITÉ", fitnessEasy: "Facile", fitnessNormal: "Normal", fitnessChallenging: "Exigeant" },
  it: { activities: "Suggerimenti attività", participants: "Partecipanti", budget: "Budget", duration: "Durata", cost: "Costo", fitness: "Forma fisica", highlights: "Punti salienti", tips: "Consigli", generatedBy: "Creato con EventBliss", activity: "ATTIVITÀ", fitnessEasy: "Facile", fitnessNormal: "Normale", fitnessChallenging: "Impegnativo" },
  nl: { activities: "Activiteitsuggesties", participants: "Deelnemers", budget: "Budget", duration: "Duur", cost: "Kosten", fitness: "Fitness", highlights: "Hoogtepunten", tips: "Tips", generatedBy: "Gemaakt met EventBliss", activity: "ACTIVITEIT", fitnessEasy: "Makkelijk", fitnessNormal: "Normaal", fitnessChallenging: "Uitdagend" },
  pl: { activities: "Sugestie aktywności", participants: "Uczestnicy", budget: "Budżet", duration: "Czas", cost: "Koszt", fitness: "Kondycja", highlights: "Najważniejsze", tips: "Wskazówki", generatedBy: "Utworzono z EventBliss", activity: "AKTYWNOŚĆ", fitnessEasy: "Łatwe", fitnessNormal: "Normalne", fitnessChallenging: "Wymagające" },
  pt: { activities: "Sugestões de atividades", participants: "Participantes", budget: "Orçamento", duration: "Duração", cost: "Custo", fitness: "Forma física", highlights: "Destaques", tips: "Dicas", generatedBy: "Criado com EventBliss", activity: "ATIVIDADE", fitnessEasy: "Fácil", fitnessNormal: "Normal", fitnessChallenging: "Desafiante" },
  tr: { activities: "Aktivite önerileri", participants: "Katılımcılar", budget: "Bütçe", duration: "Süre", cost: "Maliyet", fitness: "Fitness", highlights: "Öne çıkanlar", tips: "İpuçları", generatedBy: "EventBliss ile oluşturuldu", activity: "AKTİVİTE", fitnessEasy: "Kolay", fitnessNormal: "Normal", fitnessChallenging: "Zorlu" },
  ar: { activities: "اقتراحات الأنشطة", participants: "المشاركون", budget: "الميزانية", duration: "المدة", cost: "التكلفة", fitness: "اللياقة", highlights: "أبرز الميزات", tips: "نصائح", generatedBy: "تم الإنشاء بواسطة EventBliss", activity: "نشاط", fitnessEasy: "سهل", fitnessNormal: "عادي", fitnessChallenging: "صعب" },
};

function getTranslation<K extends keyof typeof TRANSLATIONS.en>(locale: string, key: K): string {
  const lang = locale.substring(0, 2) as keyof typeof TRANSLATIONS;
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key];
}

// Activity category colors
const CATEGORY_COLORS: Record<string, { primary: string; secondary: string; light: string }> = {
  action: { primary: '#dc2626', secondary: '#ef4444', light: '#fef2f2' },
  food: { primary: '#ea580c', secondary: '#f97316', light: '#fff7ed' },
  wellness: { primary: '#059669', secondary: '#10b981', light: '#ecfdf5' },
  party: { primary: '#db2777', secondary: '#ec4899', light: '#fdf2f8' },
  sightseeing: { primary: '#2563eb', secondary: '#3b82f6', light: '#eff6ff' },
  adventure: { primary: '#7c3aed', secondary: '#8b5cf6', light: '#f5f3ff' },
  other: { primary: '#475569', secondary: '#64748b', light: '#f8fafc' },
};

export function generateActivitiesHTML(
  activitiesData: ParsedActivitiesResponse,
  eventInfo: EventInfo,
  locale: string = 'de'
): string {
  const currentLocale = localeMap[locale] || de;
  const t = (key: keyof typeof TRANSLATIONS.en) => getTranslation(locale, key);

  const getFitnessLabel = (fitness: string) => {
    switch (fitness) {
      case 'easy': return t('fitnessEasy');
      case 'challenging': return t('fitnessChallenging');
      default: return t('fitnessNormal');
    }
  };

  const getFitnessColor = (fitness: string) => {
    switch (fitness) {
      case 'easy': return '#10b981';
      case 'challenging': return '#f97316';
      default: return '#3b82f6';
    }
  };

  let html = `
    <!DOCTYPE html>
    <html lang="${locale}">
    <head>
      <meta charset="utf-8">
      <title>${eventInfo.name} - ${t('activities')}</title>
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
        
        .activity-card {
          margin-bottom: 20px;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          page-break-inside: avoid;
        }
        .activity-header {
          padding: 12px 16px;
          color: white;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .activity-number {
          background: rgba(255,255,255,0.25);
          padding: 4px 12px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 9pt;
          letter-spacing: 1px;
        }
        .activity-title { font-size: 14pt; font-weight: 700; flex: 1; }
        .activity-emoji { font-size: 24pt; }
        
        .activity-body { padding: 16px; background: #fff; }
        .activity-meta { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
        .meta-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 9pt;
          font-weight: 500;
        }
        .activity-description { font-size: 10pt; color: #4b5563; margin-bottom: 12px; line-height: 1.6; }
        
        .highlights-box {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 8px;
          padding: 12px;
        }
        .highlights-title { font-size: 10pt; font-weight: 600; color: #059669; margin-bottom: 8px; }
        .highlights-list { list-style: none; }
        .highlights-list li { font-size: 9pt; color: #047857; padding: 3px 0; }
        .highlights-list li::before { content: "✓ "; color: #10b981; font-weight: bold; }
        
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
          .activity-card { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 ${eventInfo.name}</h1>
          <div class="subtitle">${t('activities')}</div>
          <div class="meta">
            <span>🎲 ${activitiesData.activities.length} ${t('activities')}</span>
            ${eventInfo.participantCount ? `<span>👥 ${eventInfo.participantCount} ${t('participants')}</span>` : ''}
            ${eventInfo.budget ? `<span>💰 ${eventInfo.budget}</span>` : ''}
          </div>
        </div>
  `;

  if (activitiesData.intro) {
    html += `<div class="intro">${activitiesData.intro}</div>`;
  }

  activitiesData.activities.forEach((activity, index) => {
    const color = CATEGORY_COLORS[activity.category?.toLowerCase()] || CATEGORY_COLORS.other;
    const fitnessColor = getFitnessColor(activity.fitness);

    html += `
        <div class="activity-card">
          <div class="activity-header" style="background: linear-gradient(135deg, ${color.primary} 0%, ${color.secondary} 100%);">
            <div class="activity-number">${t('activity')} ${index + 1}</div>
            <div class="activity-title">${activity.title}</div>
            <div class="activity-emoji">${activity.emoji}</div>
          </div>
          <div class="activity-body">
            <div class="activity-meta">
              ${activity.duration ? `<span class="meta-badge" style="background: #f3f4f6; color: #374151;">⏱️ ${activity.duration}</span>` : ''}
              ${activity.cost ? `<span class="meta-badge" style="background: #f3f4f6; color: #374151;">💰 ${activity.cost}</span>` : ''}
              <span class="meta-badge" style="background: ${fitnessColor}20; color: ${fitnessColor};">💪 ${getFitnessLabel(activity.fitness)}</span>
              ${activity.location ? `<span class="meta-badge" style="background: #f3f4f6; color: #374151;">📍 ${activity.location}</span>` : ''}
            </div>
            ${activity.description ? `<div class="activity-description">${activity.description}</div>` : ''}
            ${activity.highlights && activity.highlights.length > 0 ? `
              <div class="highlights-box">
                <div class="highlights-title">✅ ${t('highlights')}</div>
                <ul class="highlights-list">
                  ${activity.highlights.map(h => `<li>${h}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
    `;
  });

  if (activitiesData.tips.length > 0) {
    html += `
        <div class="tips-section">
          <div class="tips-header">💡 ${t('tips')}</div>
          <ul class="tips-list">
            ${activitiesData.tips.map(tip => `<li>${tip}</li>`).join('')}
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

export function openActivitiesPrint(
  activitiesData: ParsedActivitiesResponse,
  eventInfo: EventInfo,
  locale: string = 'de'
): void {
  const html = generateActivitiesHTML(activitiesData, eventInfo, locale);
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

export function downloadActivitiesHTML(
  activitiesData: ParsedActivitiesResponse,
  eventInfo: EventInfo,
  locale: string = 'de'
): void {
  const html = generateActivitiesHTML(activitiesData, eventInfo, locale);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${eventInfo.name.replace(/\s+/g, '-')}-activities.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
