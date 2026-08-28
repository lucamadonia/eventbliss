export async function marketplaceFunctionErrorMessage(
  error: unknown,
  fallback = "Die Buchung konnte nicht abgeschlossen werden.",
): Promise<string> {
  const context = error && typeof error === "object" && "context" in error
    ? (error as { context?: unknown }).context
    : null;

  if (context instanceof Response) {
    try {
      const payload = await context.clone().json() as { error?: unknown; message?: unknown };
      if (typeof payload.error === "string" && payload.error.trim()) return payload.error;
      if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
    } catch {
      // A non-JSON gateway response falls through to the stable user message.
    }
  }

  if (error instanceof Error && error.message && !error.message.includes("non-2xx")) {
    return error.message;
  }
  return fallback;
}
