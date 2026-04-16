import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import {
  renderEmail,
  resolveLang,
  type EmailAction,
} from "./templates.ts";

const log = (step: string, details?: unknown) => {
  const suffix = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SEND-EMAIL-HOOK] ${step}${suffix}`);
};

function mapAction(actionType: string): EmailAction | null {
  switch (actionType) {
    case "signup":
      return "signup";
    case "invite":
      return "invite";
    case "magiclink":
      return "magiclink";
    case "recovery":
      return "recovery";
    case "email_change":
    case "email_change_current":
    case "email_change_new":
      return "email_change";
    case "reauthentication":
      return "reauthentication";
    default:
      return null;
  }
}

interface HookPayload {
  user: {
    id: string;
    email: string;
    new_email?: string;
    user_metadata?: Record<string, unknown>;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
    new_email?: string;
  };
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const rawBody = await req.text();

    const hookSecretRaw = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
    if (!hookSecretRaw) throw new Error("SEND_EMAIL_HOOK_SECRET not configured");
    const hookSecret = hookSecretRaw.replace(/^v1,whsec_/, "").replace(/^whsec_/, "");

    const headers: Record<string, string> = {};
    for (const [k, v] of req.headers) headers[k.toLowerCase()] = v;

    const wh = new Webhook(hookSecret);
    const payload = wh.verify(rawBody, headers) as HookPayload;

    const action = mapAction(payload.email_data.email_action_type);
    if (!action) {
      log("Unknown action, skipping", { type: payload.email_data.email_action_type });
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    const lang = resolveLang(payload.user.user_metadata ?? null);

    const rawBase =
      Deno.env.get("SUPABASE_URL") ?? payload.email_data.site_url ?? "";
    const base = rawBase.replace(/\/auth\/v1\/?$/, "").replace(/\/$/, "");
    const confirmationUrl = `${base}/auth/v1/verify?token=${
      payload.email_data.token_hash
    }&type=${payload.email_data.email_action_type}&redirect_to=${
      encodeURIComponent(payload.email_data.redirect_to ?? "")
    }`;

    const newEmail = payload.user.new_email ?? payload.email_data.new_email;

    const { subject, html } = renderEmail(lang, action, {
      confirmationUrl,
      token: payload.email_data.token,
      email: payload.user.email,
      newEmail,
    });

    const recipient =
      payload.email_data.email_action_type === "email_change_new" && newEmail
        ? newEmail
        : payload.user.email;

    const host = Deno.env.get("SMTP_HOST");
    const port = Number(Deno.env.get("SMTP_PORT") ?? "465");
    const user = Deno.env.get("SMTP_USER");
    const pass = Deno.env.get("SMTP_PASS");
    const fromEmail = Deno.env.get("SMTP_FROM") ?? "noreply@event-bliss.com";
    const fromName = Deno.env.get("SMTP_FROM_NAME") ?? "EventBliss";
    if (!host || !user || !pass) throw new Error("SMTP credentials not configured");

    const client = new SMTPClient({
      connection: {
        hostname: host,
        port,
        tls: port === 465,
        auth: { username: user, password: pass },
      },
    });

    await client.send({
      from: `${fromName} <${fromEmail}>`,
      to: recipient,
      subject,
      html,
    });

    await client.close();

    log("Email sent", { action, lang, recipient });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});
