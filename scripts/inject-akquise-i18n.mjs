import fs from "node:fs";
import path from "node:path";

const LOCALES_DIR = path.resolve("src/i18n/locales");

const T = {
  de: {
    admin: {
      akquise: {
        navLabel: "Akquise",
        heroTitle: "Agentur-Akquise",
        heroSubtitle: "Kontaktiere Agenturen automatisch, überzeuge sie vom Mehrwert und gewinne neue Partner.",
        tabs: {
          dashboard: "Dashboard",
          pipeline: "Pipeline",
          campaigns: "Kampagnen",
          table: "Agenturen",
        },
        kpi: {
          total: "Pipeline gesamt",
          contacted: "Kontaktiert",
          responded: "Antworten",
          interested: "Interessiert",
          onboarded: "Onboarded",
          declined: "Abgelehnt",
        },
        pipeline: {
          new: "Neu",
          contacted: "Kontaktiert",
          followup1: "Follow-Up 1",
          followup2: "Follow-Up 2",
          responded: "Geantwortet",
          interested: "Interessiert",
          onboarded: "Onboarded",
          declined: "Abgelehnt",
          moveToStatus: "Verschieben nach",
          lastAction: "Letzte Aktion",
          noAgencies: "Keine Agenturen in dieser Stufe",
        },
        campaigns: {
          title: "Kampagnen",
          newCampaign: "Neue Kampagne",
          name: "Kampagnenname",
          sender: "Absender",
          senderName: "Absendername",
          dripRate: "Mails pro Tag",
          stage1: "Erste Kontaktaufnahme",
          stage2: "Follow-Up 1 (Tag +3)",
          stage3: "Follow-Up 2 (Tag +7)",
          subject: "Betreff",
          body: "Inhalt (HTML)",
          create: "Kampagne erstellen",
          update: "Speichern",
          pause: "Pausieren",
          resume: "Fortsetzen",
          delete: "Löschen",
          progress: "Fortschritt",
          noCampaigns: "Noch keine Kampagnen erstellt",
          templateVars: "Platzhalter: {{agency_name}}, {{city}}, {{contact_name}}, {{signup_url}}, {{sender_name}}",
          defaultSubject: "{{agency_name}} — kostenlos an 100.000+ Event-Planer empfohlen werden? 🚀",
        },
        detail: {
          contactPerson: "Ansprechperson",
          contactRole: "Rolle",
          phone: "Telefon",
          website: "Website",
          size: "Unternehmensgröße",
          budget: "Geschätztes Budget",
          goals: "Ziele",
          tags: "Tags",
          campaign: "Kampagne",
          inviteToken: "Invite-Token",
          copyLink: "Link kopieren",
          addNote: "Notiz hinzufügen",
          logResponse: "Antwort loggen",
          logCall: "Anruf loggen",
          aiPersonalize: "KI personalisieren",
          sentiment: "Stimmung",
          positive: "Positiv",
          neutral: "Neutral",
          negative: "Negativ",
          activityTitle: "Aktivitäten",
          noActivity: "Noch keine Aktivitäten",
          nextSteps: "Nächste Schritte",
          save: "Speichern",
        },
        table: {
          search: "Name, Stadt oder E-Mail suchen...",
          selectAll: "Alle auswählen",
          bulkStatus: "Status ändern",
          bulkPriority: "Priorität setzen",
          bulkCampaign: "Zur Kampagne",
          bulkDelete: "Löschen",
          csvImport: "CSV Import",
          csvExport: "CSV Export",
          loadMore: "Mehr laden",
          selected: "{{count}} ausgewählt",
        },
        activity: {
          email_sent: "E-Mail gesendet",
          note_added: "Notiz hinzugefügt",
          status_changed: "Status geändert",
          call_logged: "Anruf geloggt",
          response_received: "Antwort erhalten",
          link_clicked: "Invite-Link geklickt",
        },
        emptyState: "Noch keine Agenturen im System. Importiere eine CSV-Datei oder warte auf den Autopilot.",
        freeSlotsCounter: "{{count}} von 150 Gratis-Plätzen verfügbar",
      },
    },
  },
  en: {
    admin: {
      akquise: {
        navLabel: "Acquisition",
        heroTitle: "Agency Acquisition",
        heroSubtitle: "Automatically contact agencies, demonstrate value, and win new partners.",
        tabs: {
          dashboard: "Dashboard",
          pipeline: "Pipeline",
          campaigns: "Campaigns",
          table: "Agencies",
        },
        kpi: {
          total: "Total pipeline",
          contacted: "Contacted",
          responded: "Responded",
          interested: "Interested",
          onboarded: "Onboarded",
          declined: "Declined",
        },
        pipeline: {
          new: "New",
          contacted: "Contacted",
          followup1: "Follow-Up 1",
          followup2: "Follow-Up 2",
          responded: "Responded",
          interested: "Interested",
          onboarded: "Onboarded",
          declined: "Declined",
          moveToStatus: "Move to",
          lastAction: "Last action",
          noAgencies: "No agencies in this stage",
        },
        campaigns: {
          title: "Campaigns",
          newCampaign: "New Campaign",
          name: "Campaign name",
          sender: "Sender",
          senderName: "Sender name",
          dripRate: "Emails per day",
          stage1: "Initial outreach",
          stage2: "Follow-Up 1 (Day +3)",
          stage3: "Follow-Up 2 (Day +7)",
          subject: "Subject",
          body: "Content (HTML)",
          create: "Create campaign",
          update: "Save",
          pause: "Pause",
          resume: "Resume",
          delete: "Delete",
          progress: "Progress",
          noCampaigns: "No campaigns created yet",
          templateVars: "Variables: {{agency_name}}, {{city}}, {{contact_name}}, {{signup_url}}, {{sender_name}}",
          defaultSubject: "{{agency_name}} — get recommended to 100,000+ event planners for free? 🚀",
        },
        detail: {
          contactPerson: "Contact person",
          contactRole: "Role",
          phone: "Phone",
          website: "Website",
          size: "Company size",
          budget: "Estimated budget",
          goals: "Goals",
          tags: "Tags",
          campaign: "Campaign",
          inviteToken: "Invite token",
          copyLink: "Copy link",
          addNote: "Add note",
          logResponse: "Log response",
          logCall: "Log call",
          aiPersonalize: "AI personalize",
          sentiment: "Sentiment",
          positive: "Positive",
          neutral: "Neutral",
          negative: "Negative",
          activityTitle: "Activity",
          noActivity: "No activity yet",
          nextSteps: "Next steps",
          save: "Save",
        },
        table: {
          search: "Search name, city or email...",
          selectAll: "Select all",
          bulkStatus: "Change status",
          bulkPriority: "Set priority",
          bulkCampaign: "Add to campaign",
          bulkDelete: "Delete",
          csvImport: "CSV Import",
          csvExport: "CSV Export",
          loadMore: "Load more",
          selected: "{{count}} selected",
        },
        activity: {
          email_sent: "Email sent",
          note_added: "Note added",
          status_changed: "Status changed",
          call_logged: "Call logged",
          response_received: "Response received",
          link_clicked: "Invite link clicked",
        },
        emptyState: "No agencies in the system yet. Import a CSV file or wait for autopilot.",
        freeSlotsCounter: "{{count}} of 150 free slots available",
      },
    },
  },
};

const langs = ["de", "en", "es", "fr", "it", "nl", "pl", "pt", "tr", "ar"];

function mergeMissing(target, source) {
  let added = 0;
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== "object") target[k] = {};
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
  if (!fs.existsSync(filePath)) { console.warn(`! ${lang}.json not found`); continue; }
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  data.admin = data.admin || {};
  const overlay = lang === "de" ? T.de : lang === "en" ? T.en : T.en;
  const added = mergeMissing(data.admin, overlay.admin);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`✓ ${lang}.json — ${added} new keys (admin.akquise)`);
}
