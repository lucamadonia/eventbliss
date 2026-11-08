/**
 * Helpers for reading structured errors from `supabase.functions.invoke`.
 *
 * On a non-2xx response supabase-js returns a generic FunctionsHttpError
 * ("Edge Function returned a non-2xx status code") and `data` is null. The
 * real JSON body is still available on `error.context` (a fetch Response).
 */

export interface FunctionErrorInfo {
  /** HTTP status of the edge function response, if known. */
  status: number | null;
  /** Machine-readable code: `body.code`, or `body.error` when it is `CODE` or `CODE:text`. */
  code: string | null;
  /** Parsed JSON body, if the response was JSON. */
  body: Record<string, unknown> | null;
}

const CODE_PREFIX = /^([A-Z][A-Z0-9_]{2,})(?::|$)/;

/** Extracts a code from `{ code }` or an `"ERROR_CODE:human text"` error string. */
export function extractErrorCode(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (typeof record.code === "string" && record.code.trim()) return record.code.trim();
  if (typeof record.error === "string") {
    const match = CODE_PREFIX.exec(record.error.trim());
    if (match) return match[1];
  }
  return null;
}

export async function readFunctionError(error: unknown): Promise<FunctionErrorInfo> {
  const context =
    error && typeof error === "object" && "context" in error
      ? (error as { context?: unknown }).context
      : null;

  if (!(context instanceof Response)) {
    return { status: null, code: null, body: null };
  }

  let body: Record<string, unknown> | null = null;
  try {
    const parsed = await context.clone().json();
    if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>;
  } catch {
    // Non-JSON gateway response (e.g. 413 from the proxy) — status still helps.
  }
  return { status: context.status, code: extractErrorCode(body), body };
}
