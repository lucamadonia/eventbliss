// Day Plan PDF Export - Premium formatted export for AI-generated day plans
import { format } from "date-fns";
import { de, enUS, es, fr, it, nl, pt, pl, tr, ar, Locale } from "date-fns/locale";
import { 
  type ParsedDayPlan, 
  type ParsedDay, 
  type ParsedTimeBlock,
  type TimeOfDay,
  groupTimeBlocksByPeriod,
} from "./ai-response-parser";

interface EventInfo {
  name: string;
  participantCount?: number;
  dateRange?: string;
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
  dayPlan: string;
  participants: string;
  days: string;
  activities: string;
  location: string;
  transport: string;
  cost: string;
  duration: string;
  tip: string;
  warning: string;
  tips: string;
  generatedBy: string;
  tag: string;
  morning: string;
  noon: string;
  evening: string;
  night: string;
  noActivities: string;
}> = {
  de: {
    dayPlan: "Detaillierter Tagesplan",
    participants: "Teilnehmer",
    days: "Tage",
    activities: "Aktivitäten",
    location: "Ort",
    transport: "Transport",
    cost: "Kosten",
    duration: "Dauer",
    tip: "Pro-Tipp",
    warning: "Wichtig",
    tips: "Tipps",
    generatedBy: "Erstellt mit EventBliss",
    tag: "TAG",
    morning: "Morgens",
    noon: "Mittags",
    evening: "Abends",
    night: "Nachts",
    noActivities: "Keine Aktivitäten",
  },
  en: {
    dayPlan: "Detailed Day Plan",
    participants: "Participants",
    days: "Days",
    activities: "Activities",
    location: "Location",
    transport: "Transport",
    cost: "Cost",
    duration: "Duration",
    tip: "Pro Tip",
    warning: "Important",
    tips: "Tips",
    generatedBy: "Created with EventBliss",
    tag: "DAY",
    morning: "Morning",
    noon: "Noon",
    evening: "Evening",
    night: "Night",
    noActivities: "No activities",
  },
  es: {
    dayPlan: "Plan Detallado del Día",
    participants: "Participantes",
    days: "Días",
    activities: "Actividades",
    location: "Ubicación",
    transport: "Transporte",
    cost: "Costo",
    duration: "Duración",
    tip: "Consejo",
    warning: "Importante",
    tips: "Consejos",
    generatedBy: "Creado con EventBliss",
    tag: "DÍA",
    morning: "Mañana",
    noon: "Mediodía",
    evening: "Tarde",
    night: "Noche",
    noActivities: "Sin actividades",
  },
  fr: {
    dayPlan: "Plan Détaillé de la Journée",
    participants: "Participants",
    days: "Jours",
    activities: "Activités",
    location: "Lieu",
    transport: "Transport",
    cost: "Coût",
    duration: "Durée",
    tip: "Conseil",
    warning: "Important",
    tips: "Conseils",
    generatedBy: "Créé avec EventBliss",
    tag: "JOUR",
    morning: "Matin",
    noon: "Midi",
    evening: "Soir",
    night: "Nuit",
    noActivities: "Aucune activité",
  },
  it: {
    dayPlan: "Piano Giornaliero Dettagliato",
    participants: "Partecipanti",
    days: "Giorni",
    activities: "Attività",
    location: "Luogo",
    transport: "Trasporto",
    cost: "Costo",
    duration: "Durata",
    tip: "Consiglio",
    warning: "Importante",
    tips: "Consigli",
    generatedBy: "Creato con EventBliss",
    tag: "GIORNO",
    morning: "Mattina",
    noon: "Mezzogiorno",
    evening: "Sera",
    night: "Notte",
    noActivities: "Nessuna attività",
  },
  nl: {
    dayPlan: "Gedetailleerd Dagplan",
    participants: "Deelnemers",
    days: "Dagen",
    activities: "Activiteiten",
    location: "Locatie",
    transport: "Vervoer",
    cost: "Kosten",
    duration: "Duur",
    tip: "Tip",
    warning: "Belangrijk",
    tips: "Tips",
    generatedBy: "Gemaakt met EventBliss",
    tag: "DAG",
    morning: "Ochtend",
    noon: "Middag",
    evening: "Avond",
    night: "Nacht",
    noActivities: "Geen activiteiten",
  },
  pl: {
    dayPlan: "Szczegółowy Plan Dnia",
    participants: "Uczestnicy",
    days: "Dni",
    activities: "Aktywności",
    location: "Lokalizacja",
    transport: "Transport",
    cost: "Koszt",
    duration: "Czas trwania",
    tip: "Wskazówka",
    warning: "Ważne",
    tips: "Wskazówki",
    generatedBy: "Utworzono z EventBliss",
    tag: "DZIEŃ",
    morning: "Rano",
    noon: "Południe",
    evening: "Wieczór",
    night: "Noc",
    noActivities: "Brak aktywności",
  },
  pt: {
    dayPlan: "Plano Detalhado do Dia",
    participants: "Participantes",
    days: "Dias",
    activities: "Atividades",
    location: "Local",
    transport: "Transporte",
    cost: "Custo",
    duration: "Duração",
    tip: "Dica",
    warning: "Importante",
    tips: "Dicas",
    generatedBy: "Criado com EventBliss",
    tag: "DIA",
    morning: "Manhã",
    noon: "Tarde",
    evening: "Noite",
    night: "Madrugada",
    noActivities: "Sem atividades",
  },
  tr: {
    dayPlan: "Detaylı Günlük Plan",
    participants: "Katılımcılar",
    days: "Gün",
    activities: "Aktiviteler",
    location: "Konum",
    transport: "Ulaşım",
    cost: "Maliyet",
    duration: "Süre",
    tip: "İpucu",
    warning: "Önemli",
    tips: "İpuçları",
    generatedBy: "EventBliss ile oluşturuldu",
    tag: "GÜN",
    morning: "Sabah",
    noon: "Öğle",
    evening: "Akşam",
    night: "Gece",
    noActivities: "Aktivite yok",
  },
  ar: {
    dayPlan: "الخطة اليومية المفصلة",
    participants: "المشاركون",
    days: "أيام",
    activities: "الأنشطة",
    location: "الموقع",
    transport: "النقل",
    cost: "التكلفة",
    duration: "المدة",
    tip: "نصيحة",
    warning: "مهم",
    tips: "نصائح",
    generatedBy: "تم الإنشاء بواسطة EventBliss",
    tag: "اليوم",
    morning: "صباحاً",
    noon: "ظهراً",
    evening: "مساءً",
    night: "ليلاً",
    noActivities: "لا توجد أنشطة",
  },
};

function getTranslation(locale: string, key: keyof typeof TRANSLATIONS.en): string {
  const lang = locale.substring(0, 2) as keyof typeof TRANSLATIONS;
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key];
}

// Day colors for visual distinction
const DAY_COLORS = [
  { primary: '#4f46e5', secondary: '#6366f1', light: '#eef2ff' }, // Indigo
  { primary: '#059669', secondary: '#10b981', light: '#ecfdf5' }, // Emerald
  { primary: '#ea580c', secondary: '#f97316', light: '#fff7ed' }, // Orange
  { primary: '#7c3aed', secondary: '#8b5cf6', light: '#f5f3ff' }, // Violet
  { primary: '#dc2626', secondary: '#ef4444', light: '#fef2f2' }, // Red
  { primary: '#0891b2', secondary: '#06b6d4', light: '#ecfeff' }, // Cyan
];

// Time period colors and emojis
const TIME_PERIOD_STYLES: Record<TimeOfDay, { bg: string; border: string; emoji: string }> = {
  morning: { bg: '#fef3c7', border: '#f59e0b', emoji: '🌅' },
  noon: { bg: '#fef9c3', border: '#eab308', emoji: '☀️' },
  evening: { bg: '#ffedd5', border: '#f97316', emoji: '🌆' },
  night: { bg: '#e0e7ff', border: '#6366f1', emoji: '🌙' },
};

function renderTimePeriod(
  period: TimeOfDay,
  blocks: ParsedTimeBlock[],
  t: (key: keyof typeof TRANSLATIONS.en) => string,
  color: typeof DAY_COLORS[0]
): string {
  if (blocks.length === 0) return '';

  const style = TIME_PERIOD_STYLES[period];
  const periodName = t(period as keyof typeof TRANSLATIONS.en);

  let html = `
    <div class="time-period" style="background: ${style.bg}; border-left: 4px solid ${style.border}; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
      <div class="period-header" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-weight: 700; font-size: 11pt; color: #1a1a1a;">
        <span style="font-size: 16pt;">${style.emoji}</span>
        <span style="text-transform: uppercase; letter-spacing: 1px;">${periodName}</span>
        <span style="margin-left: auto; font-size: 9pt; font-weight: 500; color: #666;">${blocks.length} ${t('activities')}</span>
      </div>
      <div class="period-blocks">
  `;

  blocks.forEach((block) => {
    html += `
      <div class="time-block" style="background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
        <div class="time-block-header" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span class="time-badge" style="background: ${color.primary}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 9pt; font-weight: 600; font-family: monospace;">${block.time}</span>
          <span style="font-size: 14pt;">${block.emoji}</span>
          <span style="font-weight: 600; font-size: 10pt;">${block.title}</span>
        </div>
        <div class="block-details" style="display: flex; flex-wrap: wrap; gap: 8px 16px; font-size: 9pt; color: #4b5563;">
          ${block.location ? `<span>📍 ${block.location}</span>` : ''}
          ${block.transport ? `<span>🚗 ${block.transport}</span>` : ''}
          ${block.cost ? `<span>💰 ${block.cost}</span>` : ''}
          ${block.duration ? `<span>⏱️ ${block.duration}</span>` : ''}
        </div>
        ${block.description ? `<div style="font-size: 9pt; color: #6b7280; margin-top: 8px; padding-top: 8px; border-top: 1px solid #f3f4f6;">${block.description.replace(/\n/g, '<br>')}</div>` : ''}
        ${block.tips.map(tip => `<div style="display: flex; align-items: flex-start; gap: 6px; background: #fef3c7; padding: 6px 10px; border-radius: 4px; margin-top: 8px; font-size: 8.5pt; border-left: 2px solid #f59e0b;"><span>💡</span><span>${tip}</span></div>`).join('')}
        ${block.warnings.map(warning => `<div style="display: flex; align-items: flex-start; gap: 6px; background: #fee2e2; padding: 6px 10px; border-radius: 4px; margin-top: 8px; font-size: 8.5pt; border-left: 2px solid #ef4444;"><span>⚠️</span><span>${warning}</span></div>`).join('')}
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  return html;
}

export function generateDayPlanHTML(
  dayPlan: ParsedDayPlan,
  eventInfo: EventInfo,
  locale: string = 'de'
): string {
  const currentLocale = localeMap[locale] || de;
  const t = (key: keyof typeof TRANSLATIONS.en) => getTranslation(locale, key);
  const isRTL = locale === 'ar';

  let html = `
    <!DOCTYPE html>
    <html lang="${locale}" dir="${isRTL ? 'rtl' : 'ltr'}">
    <head>
      <meta charset="utf-8">
      <title>${eventInfo.name} - ${t('dayPlan')}</title>
      <style>
        @page { 
          size: A4; 
          margin: 15mm 20mm; 
        }
        
        * { 
          box-sizing: border-box; 
          margin: 0; 
          padding: 0; 
        }
        
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
          line-height: 1.5;
          color: #1a1a1a;
          background: #fff;
          font-size: 11pt;
          direction: ${isRTL ? 'rtl' : 'ltr'};
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0;
        }
        
        /* Header */
        .header {
          text-align: center;
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 3px solid #4f46e5;
        }
        
        .header h1 {
          font-size: 24pt;
          color: #1a1a1a;
          margin-bottom: 8px;
          font-weight: 700;
        }
        
        .header .subtitle {
          font-size: 14pt;
          color: #4f46e5;
          font-weight: 600;
        }
        
        .header .meta {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 12px;
          font-size: 10pt;
          color: #666;
        }
        
        /* Intro */
        .intro {
          background: #f9fafb;
          padding: 15px 20px;
          border-radius: 8px;
          margin-bottom: 25px;
          font-style: italic;
          color: #4b5563;
          border-${isRTL ? 'right' : 'left'}: 4px solid #4f46e5;
        }
        
        /* Day Section */
        .day-section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        .day-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 10px;
          margin-bottom: 16px;
          color: white;
          page-break-after: avoid;
        }
        
        .day-number {
          background: rgba(255,255,255,0.25);
          padding: 6px 14px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 10pt;
          letter-spacing: 1px;
        }
        
        .day-info {
          flex: 1;
        }
        
        .day-name {
          font-size: 14pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .day-title {
          font-size: 10pt;
          opacity: 0.9;
        }
        
        .day-emoji {
          font-size: 24pt;
        }
        
        /* General Tips */
        .tips-section {
          margin-top: 30px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 10px;
          padding: 16px 20px;
          page-break-inside: avoid;
        }
        
        .tips-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11pt;
          font-weight: 600;
          color: #92400e;
          margin-bottom: 12px;
        }
        
        .tips-list {
          list-style: none;
          padding: 0;
        }
        
        .tips-list li {
          padding: 6px 0;
          font-size: 9.5pt;
          color: #78350f;
          border-bottom: 1px dashed #fde68a;
        }
        
        .tips-list li:last-child {
          border-bottom: none;
        }
        
        /* Footer */
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #9ca3af;
          font-size: 9pt;
        }
        
        /* Print optimizations */
        @media print {
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
          }
          .day-section { break-inside: avoid; }
          .time-period { break-inside: avoid; }
          .tips-section { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 ${eventInfo.name}</h1>
          <div class="subtitle">${t('dayPlan')}</div>
          <div class="meta">
            <span>📅 ${dayPlan.days.length} ${t('days')}</span>
            ${eventInfo.participantCount ? `<span>👥 ${eventInfo.participantCount} ${t('participants')}</span>` : ''}
            ${eventInfo.dateRange ? `<span>🗓️ ${eventInfo.dateRange}</span>` : ''}
          </div>
        </div>
  `;

  // Intro section
  if (dayPlan.intro) {
    html += `
        <div class="intro">
          ${dayPlan.intro}
        </div>
    `;
  }

  // Days with time period grouping
  dayPlan.days.forEach((day, dayIndex) => {
    const color = DAY_COLORS[dayIndex % DAY_COLORS.length];
    const tagNumber = dayIndex + 1;
    const blocksByPeriod = day.blocksByPeriod || groupTimeBlocksByPeriod(day.timeBlocks);
    const periods: TimeOfDay[] = ['morning', 'noon', 'evening', 'night'];

    html += `
        <div class="day-section">
          <div class="day-header" style="background: linear-gradient(135deg, ${color.primary} 0%, ${color.secondary} 100%);">
            <div class="day-number">${t('tag')} ${tagNumber}</div>
            <div class="day-info">
              <div class="day-name">${day.dayName}</div>
              <div class="day-title">${day.title} • ${day.timeBlocks.length} ${t('activities')}</div>
            </div>
            <div class="day-emoji">${day.emoji}</div>
          </div>
          
          <div class="day-content">
    `;

    // Render each time period
    periods.forEach(period => {
      html += renderTimePeriod(period, blocksByPeriod[period], t, color);
    });

    html += `
          </div>
        </div>
    `;
  });

  // General tips
  if (dayPlan.generalTips.length > 0) {
    html += `
        <div class="tips-section">
          <div class="tips-header">
            <span>💡</span>
            <span>${t('tips')}</span>
          </div>
          <ul class="tips-list">
            ${dayPlan.generalTips.map(tip => `<li>${tip}</li>`).join('')}
          </ul>
        </div>
    `;
  }

  // Footer
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

export function openDayPlanPrint(
  dayPlan: ParsedDayPlan,
  eventInfo: EventInfo,
  locale: string = 'de'
): void {
  const html = generateDayPlanHTML(dayPlan, eventInfo, locale);

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

export function downloadDayPlanHTML(
  dayPlan: ParsedDayPlan,
  eventInfo: EventInfo,
  locale: string = 'de'
): void {
  const html = generateDayPlanHTML(dayPlan, eventInfo, locale);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${eventInfo.name.replace(/\s+/g, '-')}-tagesplan.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
