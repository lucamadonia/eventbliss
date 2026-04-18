// EventBliss Expenses v2 — Receipt OCR Edge Function
//
// Contract:
//   POST { expense_id?: string, storage_path: string }
//   → { ocr: ReceiptOcrResult, stored_on_expense: boolean }
//
// Uses OpenAI gpt-4o-mini vision with a strict JSON schema. Cost ≈
// $0.0015 per 1 MP receipt. If expense_id is provided we also persist
// the parsed JSON into expenses.receipt_ocr_json.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const log = (step: string, details?: unknown) => {
  const s = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[OCR-RECEIPT] ${step}${s}`);
};

interface ReceiptOcrResult {
  merchant: string | null;
  total: number | null;
  currency: string | null;
  date: string | null;
  line_items: Array<{ label: string; amount: number; qty?: number }>;
  tax: number | null;
  confidence: number;
  raw_text: string;
}

const OCR_SYSTEM_PROMPT = `You are a receipt-parsing assistant. Given a photo of a receipt, extract structured data. Always return valid JSON matching the provided schema. If a field is not clearly visible, return null for that field. Detect the currency from the symbol or the ISO code printed on the receipt. For the date, return ISO format YYYY-MM-DD. Confidence is 0-1 reflecting how sure you are about the total amount. Line items are optional — return an empty array if you can't reliably itemize. Language of merchant/line_items should match the receipt.`;

const OCR_SCHEMA = {
  name: "receipt_extract",
  strict: true,
  schema: {
    type: "object",
    required: ["merchant", "total", "currency", "date", "line_items", "tax", "confidence", "raw_text"],
    additionalProperties: false,
    properties: {
      merchant: { type: ["string", "null"] },
      total: { type: ["number", "null"] },
      currency: { type: ["string", "null"], description: "ISO-4217 code e.g. EUR, USD, CHF" },
      date: { type: ["string", "null"] },
      line_items: {
        type: "array",
        items: {
          type: "object",
          required: ["label", "amount"],
          additionalProperties: false,
          properties: {
            label: { type: "string" },
            amount: { type: "number" },
            qty: { type: ["number", "null"] },
          },
        },
      },
      tax: { type: ["number", "null"] },
      confidence: { type: "number", minimum: 0, maximum: 1 },
      raw_text: { type: "string" },
    },
  },
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Prefer direct OpenAI, fall back to OpenRouter (same OpenAI-compatible
  // chat-completions schema). Either key unlocks gpt-4o-mini vision.
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
  const apiKey = openaiKey ?? openrouterKey;
  const apiBase = openaiKey
    ? "https://api.openai.com/v1"
    : "https://openrouter.ai/api/v1";
  const model = openaiKey ? "gpt-4o-mini" : "openai/gpt-4o-mini";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!apiKey) {
    return json({ error: "Weder OPENAI_API_KEY noch OPENROUTER_API_KEY konfiguriert" }, 500, corsHeaders);
  }

  try {
    // Auth — scoped client for RLS-verified reads
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Nicht autorisiert" }, 401, corsHeaders);

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Nicht autorisiert" }, 401, corsHeaders);

    const { expense_id, storage_path } = await req.json();
    if (!storage_path || typeof storage_path !== "string") {
      return json({ error: "storage_path fehlt" }, 400, corsHeaders);
    }

    log("Received", { user: user.id, expense_id, storage_path });

    const admin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Signed URL for OpenAI to fetch (short-lived)
    const { data: signed, error: signErr } = await admin.storage
      .from("expense-receipts")
      .createSignedUrl(storage_path, 300);
    if (signErr || !signed?.signedUrl) {
      return json({ error: "Signed URL fehlgeschlagen" }, 500, corsHeaders);
    }

    // Call OpenAI / OpenRouter (same schema).
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    if (!openaiKey) {
      // OpenRouter requires these headers for attribution/referer policy.
      headers["HTTP-Referer"] = "https://event-bliss.com";
      headers["X-Title"] = "EventBliss Expenses OCR";
    }
    const openaiResponse = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_schema", json_schema: OCR_SCHEMA },
        messages: [
          { role: "system", content: OCR_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Parse this receipt and return structured JSON." },
              { type: "image_url", image_url: { url: signed.signedUrl } },
            ],
          },
        ],
        max_tokens: 1500,
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      const provider = openaiKey ? "OpenAI" : "OpenRouter";
      log(`${provider} error`, { status: openaiResponse.status, body: errText });
      return json(
        { error: `${provider}: ${openaiResponse.status}`, detail: errText.slice(0, 400) },
        502,
        corsHeaders,
      );
    }

    const data = await openaiResponse.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return json({ error: "Leere Antwort vom LLM" }, 502, corsHeaders);
    }

    let parsed: ReceiptOcrResult;
    try {
      parsed = JSON.parse(content) as ReceiptOcrResult;
    } catch {
      return json({ error: "LLM-Antwort war kein valides JSON", raw: content.slice(0, 400) }, 502, corsHeaders);
    }

    log("Parsed", {
      total: parsed.total,
      currency: parsed.currency,
      confidence: parsed.confidence,
    });

    // Persist on the expense row if expense_id was provided.
    // Also log activity and (optionally) auto-update amount if confidence is high
    // and the expense is still in its "just-created" window (no paid shares yet).
    let storedOnExpense = false;
    if (expense_id) {
      const updatePayload: Record<string, unknown> = {
        receipt_ocr_json: parsed,
      };
      // If caller trusted us to auto-fill: only do it when confidence >= 0.85
      // AND the expense currently has amount 0 (user didn't know the amount yet).
      const { data: currentExpense } = await admin
        .from("expenses")
        .select("amount, currency")
        .eq("id", expense_id)
        .single();
      if (currentExpense && currentExpense.amount === 0 && parsed.total && parsed.confidence >= 0.85) {
        updatePayload.amount = parsed.total;
        if (parsed.currency) updatePayload.currency = parsed.currency;
      }

      const { error: updErr } = await admin
        .from("expenses")
        .update(updatePayload)
        .eq("id", expense_id);
      if (!updErr) {
        storedOnExpense = true;
        // Activity log — we can't call the trigger from service role, so insert directly
        await admin.from("expense_activity_log").insert({
          event_id: (await admin.from("expenses").select("event_id").eq("id", expense_id).single()).data?.event_id,
          expense_id,
          actor_user_id: user.id,
          action: "expense.receipt_uploaded",
          payload: { confidence: parsed.confidence, total: parsed.total, currency: parsed.currency },
        });
      }
    }

    return json({ ocr: parsed, stored_on_expense: storedOnExpense }, 200, corsHeaders);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log("ERROR", msg);
    return json({ error: msg }, 500, corsHeaders);
  }
});

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
