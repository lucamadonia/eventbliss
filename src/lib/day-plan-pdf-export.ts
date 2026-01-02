// Day Plan PDF Export - Premium formatted export for AI-generated day plans
import { format } from "date-fns";
import { de, enUS, es, fr, it, nl, pt, pl, tr, ar, Locale } from "date-fns/locale";
import { type ParsedDayPlan, type ParsedDay, type ParsedTimeBlock } from "./ai-response-parser";

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

const TRANSLATIONS = {
  de: {
    dayPlan: "Detaillierter Tagesplan",
    participants: "Teilnehmer",
    days: "Tage",
    activities: "Aktivitäten",
    location: "Ort",
    transport: "Transport",
    cost: "Kosten",
    tip: "Pro-Tipp",
    warning: "Wichtig",
    tips: "Tipps",
    generatedBy: "Erstellt mit EventBliss",
    summary: "Übersicht",
    timeBlocks: "Aktivitäten",
    tag: "TAG",
  },
  en: {
    dayPlan: "Detailed Day Plan",
    participants: "Participants",
    days: "Days",
    activities: "Activities",
    location: "Location",
    transport: "Transport",
    cost: "Cost",
    tip: "Pro Tip",
    warning: "Important",
    tips: "Tips",
    generatedBy: "Created with EventBliss",
    summary: "Summary",
    timeBlocks: "Activities",
    tag: "DAY",
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

export function generateDayPlanHTML(
  dayPlan: ParsedDayPlan,
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
        
        .header .meta span {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        /* Intro */
        .intro {
          background: #f9fafb;
          padding: 15px 20px;
          border-radius: 8px;
          margin-bottom: 25px;
          font-style: italic;
          color: #4b5563;
          border-left: 4px solid #4f46e5;
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
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 16px;
          color: white;
          page-break-after: avoid;
        }
        
        .day-number {
          background: rgba(255,255,255,0.25);
          padding: 4px 12px;
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
          font-size: 20pt;
        }
        
        /* Time Blocks */
        .time-blocks {
          margin-left: 20px;
          border-left: 2px solid #e5e7eb;
          padding-left: 20px;
        }
        
        .time-block {
          position: relative;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 14px 16px;
          margin-bottom: 12px;
          page-break-inside: avoid;
        }
        
        .time-block::before {
          content: '';
          position: absolute;
          left: -26px;
          top: 20px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #4f46e5;
          border: 2px solid #fff;
          box-shadow: 0 0 0 2px #4f46e5;
        }
        
        .time-block-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        
        .time-badge {
          background: #4f46e5;
          color: white;
          padding: 3px 10px;
          border-radius: 4px;
          font-size: 9pt;
          font-weight: 600;
          font-family: 'SF Mono', 'Monaco', monospace;
        }
        
        .block-emoji {
          font-size: 16pt;
        }
        
        .block-title {
          font-size: 11pt;
          font-weight: 600;
          color: #1a1a1a;
        }
        
        .block-details {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 16px;
          margin-bottom: 8px;
        }
        
        .detail-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 9pt;
          color: #4b5563;
        }
        
        .detail-icon {
          font-size: 10pt;
        }
        
        .block-description {
          font-size: 9.5pt;
          color: #6b7280;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #f3f4f6;
        }
        
        /* Tips & Warnings */
        .block-tip {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: #fef3c7;
          padding: 8px 12px;
          border-radius: 6px;
          margin-top: 10px;
          font-size: 9pt;
          border-left: 3px solid #f59e0b;
        }
        
        .block-warning {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: #fee2e2;
          padding: 8px 12px;
          border-radius: 6px;
          margin-top: 10px;
          font-size: 9pt;
          border-left: 3px solid #ef4444;
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
          .time-block { break-inside: avoid; }
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

  // Days
  dayPlan.days.forEach((day, dayIndex) => {
    const color = DAY_COLORS[dayIndex % DAY_COLORS.length];
    const tagNumber = dayIndex + 1;

    html += `
        <div class="day-section">
          <div class="day-header" style="background: linear-gradient(135deg, ${color.primary} 0%, ${color.secondary} 100%);">
            <div class="day-number">${t('tag')} ${tagNumber}</div>
            <div class="day-info">
              <div class="day-name">${day.dayName}</div>
              <div class="day-title">${day.title}</div>
            </div>
            <div class="day-emoji">${day.emoji}</div>
          </div>
          
          <div class="time-blocks">
    `;

    day.timeBlocks.forEach((block) => {
      html += `
            <div class="time-block">
              <div class="time-block-header">
                <span class="time-badge" style="background: ${color.primary};">${block.time}</span>
                <span class="block-emoji">${block.emoji}</span>
                <span class="block-title">${block.title}</span>
              </div>
              
              <div class="block-details">
                ${block.location ? `<span class="detail-item"><span class="detail-icon">📍</span> ${block.location}</span>` : ''}
                ${block.transport ? `<span class="detail-item"><span class="detail-icon">🚗</span> ${block.transport}</span>` : ''}
                ${block.cost ? `<span class="detail-item"><span class="detail-icon">💰</span> ${block.cost}</span>` : ''}
                ${block.duration ? `<span class="detail-item"><span class="detail-icon">⏱️</span> ${block.duration}</span>` : ''}
              </div>
              
              ${block.description ? `<div class="block-description">${block.description.replace(/\n/g, '<br>')}</div>` : ''}
              
              ${block.tips.map(tip => `<div class="block-tip"><span>💡</span><span>${tip}</span></div>`).join('')}
              ${block.warnings.map(warning => `<div class="block-warning"><span>⚠️</span><span>${warning}</span></div>`).join('')}
            </div>
      `;
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

  const link = document.createElement('a');
  link.href = url;
  link.download = `${eventInfo.name.replace(/\s+/g, '-').toLowerCase()}-tagesplan.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
