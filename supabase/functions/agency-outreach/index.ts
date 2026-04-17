import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const log = (step: string, details?: unknown) => {
  const suffix = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[AGENCY-OUTREACH] ${step}${suffix}`);
};

// ---------------------------------------------------------------------------
// Sender signatures
// ---------------------------------------------------------------------------

const SENDER_SIGNATURES: Record<string, string> = {
  "partner@event-bliss.com": `
    <div style="border-top:1px solid rgba(255,255,255,0.15);padding-top:20px;margin-top:32px;">
      <table cellpadding="0" cellspacing="0" style="font-family:'Segoe UI',Roboto,sans-serif;">
        <tr>
          <td style="padding-right:16px;vertical-align:top;">
            <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#ec4899);display:flex;align-items:center;justify-content:center;">
              <span style="font-size:20px;font-weight:900;color:#fff;">E</span>
            </div>
          </td>
          <td>
            <strong style="color:#fff;font-size:14px;">Das EventBliss Partnerschafts-Team</strong><br>
            <span style="color:#94a3b8;font-size:12px;">MYFAMBLISS GROUP LTD · Investor-Backed</span><br>
            <span style="color:#94a3b8;font-size:12px;">📍 Zypern · 🌐 <a href="https://event-bliss.com" style="color:#a855f7;text-decoration:none;">event-bliss.com</a></span>
          </td>
        </tr>
      </table>
    </div>`,
  "svitlana@event-bliss.com": `
    <div style="border-top:1px solid rgba(255,255,255,0.15);padding-top:20px;margin-top:32px;">
      <table cellpadding="0" cellspacing="0" style="font-family:'Segoe UI',Roboto,sans-serif;">
        <tr>
          <td style="padding-right:16px;vertical-align:top;">
            <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#ec4899,#f59e0b);display:flex;align-items:center;justify-content:center;">
              <span style="font-size:20px;font-weight:900;color:#fff;">S</span>
            </div>
          </td>
          <td>
            <strong style="color:#fff;font-size:14px;">Svitlana</strong><br>
            <span style="color:#94a3b8;font-size:12px;">Head of Partnerships · EventBliss</span><br>
            <span style="color:#94a3b8;font-size:12px;">📧 svitlana@event-bliss.com</span><br>
            <span style="color:#94a3b8;font-size:12px;">🌐 <a href="https://event-bliss.com" style="color:#a855f7;text-decoration:none;">event-bliss.com</a></span>
          </td>
        </tr>
      </table>
    </div>`,
  "rebecca@event-bliss.com": `
    <div style="border-top:1px solid rgba(255,255,255,0.15);padding-top:20px;margin-top:32px;">
      <table cellpadding="0" cellspacing="0" style="font-family:'Segoe UI',Roboto,sans-serif;">
        <tr>
          <td style="padding-right:16px;vertical-align:top;">
            <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#06b6d4,#a855f7);display:flex;align-items:center;justify-content:center;">
              <span style="font-size:20px;font-weight:900;color:#fff;">R</span>
            </div>
          </td>
          <td>
            <strong style="color:#fff;font-size:14px;">Rebecca</strong><br>
            <span style="color:#94a3b8;font-size:12px;">Partnership Manager · EventBliss</span><br>
            <span style="color:#94a3b8;font-size:12px;">📧 rebecca@event-bliss.com</span><br>
            <span style="color:#94a3b8;font-size:12px;">🌐 <a href="https://event-bliss.com" style="color:#a855f7;text-decoration:none;">event-bliss.com</a></span>
          </td>
        </tr>
      </table>
    </div>`,
};

function getSignature(senderEmail: string): string {
  return SENDER_SIGNATURES[senderEmail] ?? SENDER_SIGNATURES["partner@event-bliss.com"];
}

// ---------------------------------------------------------------------------
// Email wrapper
// ---------------------------------------------------------------------------

function isPlainTextTemplate(body: string): boolean {
  // Plain-text templates only use <p>, <br/>, <a> — no <div style=, <h2 style=, gradients
  return !body.includes('style="background') && !body.includes('border-radius') && !body.includes('<h2 style=');
}

function wrapEmailHtml(body: string, signature: string): string {
  const isPlain = isPlainTextTemplate(body);

  if (isPlain) {
    // Minimal wrapper — looks like a personal email, not marketing
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="font-size:15px;line-height:1.7;color:#333333;">
    ${body}
    ${signature.replace(/color:#fff/g, 'color:#333').replace(/color:#94a3b8/g, 'color:#666').replace(/color:#a855f7/g, 'color:#7c3aed')}
  </div>
  <p style="margin-top:32px;font-size:10px;color:#999;">
    Kein Interesse? Antworten Sie einfach mit "Stop" und wir entfernen Sie sofort.
  </p>
</div>
</body></html>`;
  }

  // Full branded HTML wrapper for marketing templates
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#070012;font-family:'Segoe UI',Roboto,sans-serif;">
<div style="max-width:640px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#a855f7,#ec4899,#f59e0b);padding:14px 28px;border-radius:16px;">
      <span style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-0.5px;">EventBliss</span>
    </div>
  </div>
  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:36px;color:#e2e8f0;">
    ${body}
    ${signature}
  </div>
  <p style="text-align:center;margin-top:32px;font-size:11px;color:#475569;">
    © ${new Date().getFullYear()} EventBliss · MYFAMBLISS GROUP LTD · Zypern<br>
    <a href="https://event-bliss.com" style="color:#64748b;text-decoration:none;">event-bliss.com</a>
  </p>
  <p style="text-align:center;margin-top:16px;font-size:10px;color:#374151;">
    Sie erhalten diese E-Mail weil Ihr Unternehmen im EventBliss-Verzeichnis gelistet ist.<br>
    Kein Interesse? Antworten Sie einfach mit "Stop" und wir entfernen Sie sofort.
  </p>
</div>
</body></html>`;
}

// ---------------------------------------------------------------------------
// Template interpolation
// ---------------------------------------------------------------------------

function interpolate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value || "");
  }
  return result;
}

// ---------------------------------------------------------------------------
// SMTP sender
// ---------------------------------------------------------------------------

async function sendOutreachEmail(
  to: string,
  subject: string,
  html: string,
  senderEmail: string,
  senderName: string,
) {
  const host = Deno.env.get("SMTP_HOST") ?? "w0208d95.kasserver.com";
  const port = 465;

  // Lookup sender-specific credentials, fallback to default SMTP
  const prefixMap: Record<string, string> = {
    "partner@event-bliss.com": "PARTNER",
    "svitlana@event-bliss.com": "SVITLANA",
    "rebecca@event-bliss.com": "REBECCA",
  };
  const prefix = prefixMap[senderEmail];
  const user = prefix
    ? (Deno.env.get(`${prefix}_SMTP_USER`) ?? senderEmail)
    : (Deno.env.get("SMTP_USER") ?? senderEmail);
  const pass = prefix
    ? (Deno.env.get(`${prefix}_SMTP_PASSWORD`) ?? Deno.env.get("SMTP_PASS") ?? "")
    : (Deno.env.get("SMTP_PASS") ?? "");

  if (!pass) throw new Error(`No SMTP password for ${senderEmail}`);

  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: true,
      auth: { username: user, password: pass },
    },
  });

  await client.send({
    from: `${senderName} <${senderEmail}>`,
    to,
    subject,
    html,
  });

  await client.close();
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const body = await req.json();
    const mode: string = body.type ?? "send_batch";

    // ===================================================================
    // MODE: send_batch — Autopilot engine (called by pg_cron daily)
    // ===================================================================
    if (mode === "send_batch") {
      // Pick pending queue items where scheduled_at <= now
      const { data: pending } = await (supabase as any)
        .from("agency_outreach_queue")
        .select("*, agency_directory!inner(name, email, city, country, contact_person, website)")
        .eq("status", "pending")
        .lte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(30); // slightly above drip_rate to handle multi-campaign

      const rows = (pending as any[]) ?? [];
      if (rows.length === 0) {
        log("No pending items");
        return new Response(JSON.stringify({ success: true, sent: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Group by campaign to get templates + sender
      const campaignIds = [...new Set(rows.map((r: any) => r.campaign_id))];
      const { data: campaigns } = await (supabase as any)
        .from("agency_outreach_campaigns")
        .select("*")
        .in("id", campaignIds)
        .eq("status", "active");

      const campaignMap = new Map<string, any>();
      for (const c of (campaigns as any[]) ?? []) {
        campaignMap.set(c.id, c);
      }

      let sent = 0;
      const FOLLOW_UP_DELAYS: Record<string, { nextStage: string; days: number } | null> = {
        stage_1: { nextStage: "stage_2", days: 3 },
        stage_2: { nextStage: "stage_3", days: 4 },
        stage_3: null, // no more follow-ups
      };

      for (const item of rows) {
        const campaign = campaignMap.get(item.campaign_id);
        if (!campaign) {
          log("Campaign not active, skipping", { id: item.campaign_id });
          await (supabase as any).from("agency_outreach_queue")
            .update({ status: "skipped" })
            .eq("id", item.id);
          continue;
        }

        const agency = item.agency_directory;
        if (!agency?.email) {
          await (supabase as any).from("agency_outreach_queue")
            .update({ status: "skipped" })
            .eq("id", item.id);
          continue;
        }

        // Resolve template for this stage
        const stageNum = item.stage.replace("stage_", "");
        const subjectTpl = item.personalized_subject
          ?? (campaign[`template_stage${stageNum}_subject`] || campaign.template_stage1_subject);
        const bodyTpl = item.personalized_body
          ?? (campaign[`template_stage${stageNum}_body`] || campaign.template_stage1_body);

        const inviteToken = item.invite_token || crypto.randomUUID().slice(0, 12);
        const signupUrl = `https://event-bliss.com/agency-apply?invite=${inviteToken}`;

        const vars: Record<string, string> = {
          agency_name: agency.name || "",
          city: agency.city || "",
          country: agency.country || "",
          contact_name: agency.contact_person || agency.name || "",
          website: agency.website || "",
          signup_url: signupUrl,
          sender_name: campaign.sender_name || "EventBliss",
        };

        const subject = interpolate(subjectTpl, vars);
        const rawBody = interpolate(bodyTpl, vars);
        const signature = getSignature(campaign.sender_email);
        const html = wrapEmailHtml(rawBody, signature);

        try {
          await sendOutreachEmail(
            agency.email,
            subject,
            html,
            campaign.sender_email,
            campaign.sender_name,
          );

          // Update queue item
          await (supabase as any).from("agency_outreach_queue")
            .update({ status: "sent", sent_at: new Date().toISOString(), invite_token: inviteToken })
            .eq("id", item.id);

          // Update agency_directory status
          const statusMap: Record<string, string> = {
            stage_1: "contacted",
            stage_2: "follow_up_1",
            stage_3: "follow_up_2",
          };
          await (supabase as any).from("agency_directory")
            .update({
              outreach_status: statusMap[item.stage] || "contacted",
              last_outreach_at: new Date().toISOString(),
              invite_token: inviteToken,
              outreach_campaign_id: campaign.id,
            })
            .eq("id", item.directory_id);

          // Log activity
          await (supabase as any).from("agency_outreach_activity").insert({
            directory_id: item.directory_id,
            action: "email_sent",
            stage: item.stage,
            details: { subject, campaign_name: campaign.name, sender: campaign.sender_email },
          });

          // Schedule next follow-up
          const next = FOLLOW_UP_DELAYS[item.stage];
          if (next) {
            const scheduledAt = new Date();
            scheduledAt.setDate(scheduledAt.getDate() + next.days);
            await (supabase as any).from("agency_outreach_queue").upsert({
              campaign_id: campaign.id,
              directory_id: item.directory_id,
              stage: next.nextStage,
              status: "pending",
              scheduled_at: scheduledAt.toISOString(),
              invite_token: inviteToken,
            }, { onConflict: "campaign_id,directory_id,stage" });
          }

          sent++;
          log("Email sent", { to: agency.email, stage: item.stage, campaign: campaign.name });
        } catch (err) {
          log("Send failed", { to: agency.email, error: String(err) });
          await (supabase as any).from("agency_outreach_queue")
            .update({ status: "bounced" })
            .eq("id", item.id);
        }
      }

      // Update campaign stats
      for (const [cid] of campaignMap) {
        const { count } = await (supabase as any).from("agency_outreach_queue")
          .select("*", { count: "exact", head: true })
          .eq("campaign_id", cid)
          .eq("status", "sent");
        await (supabase as any).from("agency_outreach_campaigns")
          .update({ stats_contacted: count || 0, updated_at: new Date().toISOString() })
          .eq("id", cid);
      }

      return new Response(JSON.stringify({ success: true, sent, total: rows.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===================================================================
    // MODE: personalize — KI writes custom pitch for one agency
    // ===================================================================
    if (mode === "personalize") {
      const directoryId: number = body.directory_id;
      const campaignId: string = body.campaign_id;
      const stage: string = body.stage ?? "stage_1";
      if (!directoryId || !campaignId) throw new Error("directory_id + campaign_id required");

      const { data: agency } = await (supabase as any).from("agency_directory")
        .select("*")
        .eq("id", directoryId)
        .single();

      if (!agency) throw new Error("Agency not found");

      const { data: campaign } = await (supabase as any).from("agency_outreach_campaigns")
        .select("sender_name, sender_email")
        .eq("id", campaignId)
        .single();

      const apiKey = Deno.env.get("OPENROUTER_API_KEY");
      const model = Deno.env.get("OPENROUTER_MODEL_FAST") ?? "anthropic/claude-haiku-4.5";
      if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

      const prompt = `Du bist ein Outreach-Spezialist für EventBliss, eine investor-geförderte Event-Tech-Plattform.
Schreibe eine personalisierte Akquise-Mail an die folgende Agentur. Ziel: sie davon überzeugen, sich kostenlos auf EventBliss listen zu lassen.

Agentur-Daten:
- Name: ${agency.name}
- Stadt: ${agency.city}, ${agency.country}
- Website: ${agency.website || "nicht bekannt"}
- Kategorie: ${agency.description || "Event-Agentur"}
- Ansprechperson: ${agency.contact_person || "nicht bekannt"}

Core-Messaging:
- Die ersten 150 Agenturen listen wir komplett kostenlos
- Investor-geförderte Company (MYFAMBLISS GROUP LTD)
- Mission: Event-Game auf ein neues Level bringen
- KI empfiehlt ihre Services automatisch an 100.000+ Event-Planer
- Kein Risiko, unverbindlich, sofort live

Schreibe:
1. Einen kurzen, knackigen Betreff (max 60 Zeichen)
2. Den Mail-Body als HTML (nur den inneren Content, kein DOCTYPE/body/head)

Format: JSON mit exakt diesen Keys: {"subject": "...", "body": "<p>...</p>"}
Antworte NUR mit dem JSON, kein Markdown drumherum.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://event-bliss.com",
          "X-Title": "EventBliss Outreach",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`AI error: ${response.status} ${err}`);
      }

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content || "";

      // Parse JSON from AI response
      let personalized: { subject: string; body: string };
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        personalized = JSON.parse(jsonMatch?.[0] || content);
      } catch {
        throw new Error("AI returned invalid JSON");
      }

      // Save to queue
      await (supabase as any).from("agency_outreach_queue").upsert({
        campaign_id: campaignId,
        directory_id: directoryId,
        stage,
        personalized_subject: personalized.subject,
        personalized_body: personalized.body,
        status: "pending",
        scheduled_at: new Date().toISOString(),
      }, { onConflict: "campaign_id,directory_id,stage" });

      log("Personalized", { directoryId, subject: personalized.subject });

      return new Response(JSON.stringify({ success: true, ...personalized }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown mode" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
