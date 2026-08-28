import { describe, expect, it } from "vitest";
import { marketplaceFunctionErrorMessage } from "@/lib/marketplace-function-error";

describe("marketplaceFunctionErrorMessage", () => {
  it("shows the useful Edge Function response instead of the generic non-2xx text", async () => {
    const error = {
      message: "Edge Function returned a non-2xx status code",
      context: new Response(
        JSON.stringify({ error: "Für dieses Angebot sind 4 bis 16 Personen möglich." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      ),
    };

    await expect(marketplaceFunctionErrorMessage(error)).resolves.toBe(
      "Für dieses Angebot sind 4 bis 16 Personen möglich.",
    );
  });

  it("uses a stable fallback for gateway responses without JSON", async () => {
    const error = {
      message: "Edge Function returned a non-2xx status code",
      context: new Response("Bad gateway", { status: 502 }),
    };

    await expect(marketplaceFunctionErrorMessage(error, "Bitte versuche es erneut.")).resolves.toBe(
      "Bitte versuche es erneut.",
    );
  });
});
