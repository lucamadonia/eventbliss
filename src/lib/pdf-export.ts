// PDF export for agenda - client-side generation
import { format, parseISO } from "date-fns";
import { de, enUS, es, fr, it, nl, pt, pl, tr, ar, Locale } from "date-fns/locale";

interface Activity {
  id: string;
  title: string;
  description: string | null;
  day_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  estimated_cost: number | null;
  currency?: string;
  category?: string;
}

interface EventInfo {
  name: string;
  id: string;
  event_date: string | null;
}

interface CategoryConfig {
  emoji: string;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  activity: '🎯',
  food: '🍽️',
  transport: '🚗',
  accommodation: '🏨',
  party: '🎉',
  sightseeing: '🏛️',
  relaxation: '🧘',
  other: '📌',
};

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

export function generatePrintableAgenda(
  activities: Activity[],
  event: EventInfo,
  locale: string = 'en'
): string {
  const currentLocale = localeMap[locale] || enUS;
  
  // Group activities by date
  const byDate = activities.reduce((acc, activity) => {
    if (!acc[activity.day_date]) {
      acc[activity.day_date] = [];
    }
    acc[activity.day_date].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);
  
  // Sort dates
  const sortedDates = Object.keys(byDate).sort();
  
  // Calculate totals
  const totalCost = activities.reduce((sum, a) => sum + (a.estimated_cost || 0), 0);
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${event.name} - Agenda</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.5;
          color: #1a1a1a;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e5e5;
        }
        .header h1 {
          font-size: 28px;
          margin-bottom: 8px;
        }
        .header .subtitle {
          color: #666;
          font-size: 14px;
        }
        .day-section {
          margin-bottom: 30px;
        }
        .day-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-weight: 600;
        }
        .activity {
          background: #f9fafb;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
        }
        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        .activity-title {
          font-weight: 600;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .activity-time {
          color: #666;
          font-size: 14px;
          background: #e5e5e5;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .activity-details {
          font-size: 14px;
          color: #666;
        }
        .activity-details p {
          margin: 4px 0;
        }
        .activity-cost {
          font-weight: 600;
          color: #059669;
        }
        .summary {
          margin-top: 40px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
          border: 1px solid #667eea30;
          border-radius: 8px;
        }
        .summary h3 {
          margin-bottom: 12px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e5e5;
        }
        .summary-row:last-child {
          border-bottom: none;
          font-weight: 600;
          font-size: 18px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
        @media print {
          body { padding: 20px; }
          .day-section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📋 ${event.name}</h1>
        <p class="subtitle">Event Agenda</p>
      </div>
  `;
  
  sortedDates.forEach((date) => {
    const dateObj = parseISO(date);
    const formattedDate = format(dateObj, "EEEE, d. MMMM yyyy", { locale: currentLocale });
    const dayActivities = byDate[date].sort((a, b) => {
      if (!a.start_time) return 1;
      if (!b.start_time) return -1;
      return a.start_time.localeCompare(b.start_time);
    });
    
    const dayCost = dayActivities.reduce((sum, a) => sum + (a.estimated_cost || 0), 0);
    
    html += `
      <div class="day-section">
        <div class="day-header">
          📅 ${formattedDate}
        </div>
    `;
    
    dayActivities.forEach((activity) => {
      const emoji = CATEGORY_EMOJIS[activity.category || 'other'] || '📌';
      const timeDisplay = activity.start_time 
        ? activity.end_time 
          ? `${activity.start_time} - ${activity.end_time}`
          : activity.start_time
        : 'Flexible';
      
      html += `
        <div class="activity">
          <div class="activity-header">
            <div class="activity-title">
              <span>${emoji}</span>
              <span>${activity.title}</span>
            </div>
            <span class="activity-time">${timeDisplay}</span>
          </div>
          <div class="activity-details">
            ${activity.description ? `<p>${activity.description}</p>` : ''}
            ${activity.location ? `<p>📍 ${activity.location}</p>` : ''}
            ${activity.estimated_cost ? `<p class="activity-cost">💰 ${activity.estimated_cost.toFixed(2)} ${activity.currency || 'EUR'}</p>` : ''}
          </div>
        </div>
      `;
    });
    
    html += `</div>`;
  });
  
  // Summary
  html += `
    <div class="summary">
      <h3>📊 Summary</h3>
      <div class="summary-row">
        <span>Total Activities</span>
        <span>${activities.length}</span>
      </div>
      <div class="summary-row">
        <span>Days</span>
        <span>${sortedDates.length}</span>
      </div>
      <div class="summary-row">
        <span>Estimated Total Cost</span>
        <span>€ ${totalCost.toFixed(2)}</span>
      </div>
    </div>
    <div class="footer">
      Generated by STAG Event Planner • ${format(new Date(), "PPP", { locale: currentLocale })}
    </div>
    </body>
    </html>
  `;
  
  return html;
}

export function openPrintableAgenda(
  activities: Activity[],
  event: EventInfo,
  locale: string = 'en'
): void {
  const html = generatePrintableAgenda(activities, event, locale);
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }
}

export function downloadAgendaHTML(
  activities: Activity[],
  event: EventInfo,
  locale: string = 'en'
): void {
  const html = generatePrintableAgenda(activities, event, locale);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.name.replace(/\s+/g, '-').toLowerCase()}-agenda.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
