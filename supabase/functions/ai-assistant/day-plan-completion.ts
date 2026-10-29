/** Reserve enough output for every requested day instead of the old fixed 2,000 tokens. */
export function dayPlanTokenBudget(days: number): number {
  return Math.min(16_000, 1_800 + Math.max(1, Math.min(days, 14)) * 1_200);
}

/** A partial plan must never be presented or charged as a finished plan. */
export function isCompleteDayPlan(response: string, days: number, finishReason?: string): boolean {
  if (!response || finishReason === "length" || finishReason === "max_tokens") return false;
  const headers = [...response.matchAll(/^###\s*[^\n]*?(?:Tag|Day|Jour|D[ií]a|Giorno|Dag|Dzień|Gün|يوم)\s*([0-9]+)[^\n]*$/gimu)];
  const sections = new Map<number, string>();
  headers.forEach((header, index) => {
    const number = Number(header[1]);
    const start = (header.index ?? 0) + header[0].length;
    const end = index + 1 < headers.length ? headers[index + 1].index ?? response.length : response.length;
    sections.set(number, response.slice(start, end));
  });
  return Array.from({ length: days }, (_, index) => index + 1).every((number) => {
    const section = sections.get(number);
    return section !== undefined && [...section.matchAll(/^(?:\*\*|###\s*)\d{1,2}:\d{2}/gm)].length >= 2;
  });
}
