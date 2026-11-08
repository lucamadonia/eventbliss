import { describe, expect, it } from "vitest";
import { extractErrorCode, readFunctionError } from "../../src/lib/function-error";

const httpError = (status: number, body: string) => ({
  name: "FunctionsHttpError",
  message: "Edge Function returned a non-2xx status code",
  context: new Response(body, { status, headers: { "Content-Type": "application/json" } }),
});

describe("extractErrorCode", () => {
  it("prefers an explicit code field", () => {
    expect(extractErrorCode({ code: "ALREADY_REDEEMED", error: "ALREADY_REDEEMED:x" })).toBe("ALREADY_REDEEMED");
  });
  it("parses a CODE: prefix from the error string", () => {
    expect(extractErrorCode({ error: "MAX_REDEMPTIONS:Voucher has reached maximum redemptions" })).toBe("MAX_REDEMPTIONS");
  });
  it("ignores plain error strings", () => {
    expect(extractErrorCode({ error: "Voucher has expired" })).toBeNull();
    expect(extractErrorCode(null)).toBeNull();
  });
});

describe("readFunctionError", () => {
  it("reads status, code and body from a FunctionsHttpError context", async () => {
    const info = await readFunctionError(httpError(409, JSON.stringify({ error: "RESPONSE_EXISTS" })));
    expect(info.status).toBe(409);
    expect(info.body).toEqual({ error: "RESPONSE_EXISTS" });
    expect(info.code).toBe("RESPONSE_EXISTS");
  });
  it("keeps the status when the body is not JSON", async () => {
    const info = await readFunctionError(httpError(413, "Payload Too Large"));
    expect(info).toEqual({ status: 413, code: null, body: null });
  });
  it("returns empty info for non-HTTP errors", async () => {
    expect(await readFunctionError(new Error("network"))).toEqual({ status: null, code: null, body: null });
  });
});
