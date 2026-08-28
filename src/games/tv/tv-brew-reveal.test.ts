import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("TVBrewView ingredient reveal", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/games/tv/games/TVBrewView.tsx"), "utf8");

  it("does not restart the hide timer for every repeated TV state object", () => {
    expect(source).not.toContain("[drawnCard, reduce]");
    expect(source).toContain("[drawId, drawOutcome, drawSeq, reduce]");
  });

  it("hides the large ingredient again after less than two seconds", () => {
    expect(source).toMatch(/setTimeout\(\(\) => setShowDraw\(null\), reduce \? 420 : 1800\)/);
  });
});
