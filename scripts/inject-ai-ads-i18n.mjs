import fs from "node:fs";
import path from "node:path";

const LOCALES_DIR = path.resolve("src/i18n/locales");

const T = {
  de: {
    admin: {
      aiAds: {
        navLabel: "KI-Werbung",
        hero: {
          badge: "Letzte 30 Tage",
          title: "KI-Werbung Performance",
          subtitle: "Wie viele AI-gestützte Service-Empfehlungen werden ausgespielt, geklickt und in Buchungen konvertiert.",
        },
        kpi: {
          impressions: "Impressions",
          clicks: "Clicks",
          ctr: "CTR",
          revenue: "Attribuierter Umsatz",
          bookings: "{{count}} Buchungen",
        },
        sections: {
          timeline: "Verlauf 30 Tage",
          topServices: "Top 10 Services",
          topAgencies: "Top 10 Agenturen",
          requestBreakdown: "Nach Request-Typ",
          tierCtr: "CTR nach Agentur-Tier",
          recentEvents: "Jüngste Ereignisse",
        },
        noData: "Noch keine Daten — sobald AI-Empfehlungen angezeigt werden, füllt sich diese Ansicht.",
      },
    },
    agency: {
      aiPerformance: {
        navLabel: "KI-Performance",
        heroTitle: "KI-Performance",
        heroSubtitle: "Hier siehst du wie deine Services über die KI empfohlen und gebucht werden.",
        kpi: {
          impressions: "Impressions",
          clicks: "Clicks",
          ctr: "Click-Through-Rate",
          revenue: "Attribuierter Umsatz",
          bookings: "{{count}} zugeordnete Buchungen",
        },
        perServiceTitle: "Performance pro Service",
        recentFeedTitle: "Letzte Empfehlungen",
        recentFeedItem: "Dein Service wurde am {{date}} in einem {{eventType}}-Event{{city}} empfohlen (via {{requestType}})",
        topKeywordsTitle: "Top Keywords",
        noData: "Noch keine Daten — sobald deine Services über die KI empfohlen werden, erscheinen hier deine Stats.",
        upsellHeadline: "KI-Performance freischalten",
        upsellBody: "Upgrade auf Enterprise um zu sehen wie oft deine Services empfohlen, geklickt und gebucht werden.",
        upsellCta: "Enterprise freischalten",
      },
    },
  },
  en: {
    admin: {
      aiAds: {
        navLabel: "AI Advertising",
        hero: {
          badge: "Last 30 days",
          title: "AI Advertising Performance",
          subtitle: "How many AI-powered service recommendations are shown, clicked, and converted into bookings.",
        },
        kpi: {
          impressions: "Impressions",
          clicks: "Clicks",
          ctr: "CTR",
          revenue: "Attributed Revenue",
          bookings: "{{count}} bookings",
        },
        sections: {
          timeline: "30-day timeline",
          topServices: "Top 10 services",
          topAgencies: "Top 10 agencies",
          requestBreakdown: "By request type",
          tierCtr: "CTR by agency tier",
          recentEvents: "Recent events",
        },
        noData: "No data yet — stats will appear once AI recommendations are shown to users.",
      },
    },
    agency: {
      aiPerformance: {
        navLabel: "AI Performance",
        heroTitle: "AI Performance",
        heroSubtitle: "See how your services are recommended and booked through the AI assistant.",
        kpi: {
          impressions: "Impressions",
          clicks: "Clicks",
          ctr: "Click-through rate",
          revenue: "Attributed revenue",
          bookings: "{{count}} attributed bookings",
        },
        perServiceTitle: "Performance per service",
        recentFeedTitle: "Recent recommendations",
        recentFeedItem: "Your service was shown on {{date}} in a {{eventType}} event{{city}} (via {{requestType}})",
        topKeywordsTitle: "Top keywords",
        noData: "No data yet — stats will appear once your services are recommended through the AI.",
        upsellHeadline: "Unlock AI Performance",
        upsellBody: "Upgrade to Enterprise to see how often your services are recommended, clicked, and booked.",
        upsellCta: "Unlock Enterprise",
      },
    },
  },
};

const langs = ["de", "en", "es", "fr", "it", "nl", "pl", "pt", "tr", "ar"];

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

  // Merge curated per-locale, then fill holes with English
  const overlay = lang === "de" ? T.de : lang === "en" ? T.en : T.en;

  data.admin = data.admin || {};
  data.agency = data.agency || {};

  const added =
    mergeMissing(data.admin, overlay.admin) +
    mergeMissing(data.agency, overlay.agency);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`✓ ${lang}.json — ${added} new keys added (admin.aiAds + agency.aiPerformance)`);
}
