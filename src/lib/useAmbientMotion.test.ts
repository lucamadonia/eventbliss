import { describe, expect, it } from "vitest";
import { isTVDisplayPath, shouldUseAmbientMotion } from "./useAmbientMotion";

describe("ambient motion policy", () => {
  it.each(["/tv", "/tv/ABC234", "/tv/room/ABC234"])(
    "disables permanent decoration on TV path %s",
    (pathname) => {
      expect(shouldUseAmbientMotion({ native: false, reducedMotion: false, pathname })).toBe(false);
      expect(isTVDisplayPath(pathname)).toBe(true);
    },
  );

  it("keeps ambient motion for a normal desktop game route", () => {
    expect(shouldUseAmbientMotion({ native: false, reducedMotion: false, pathname: "/games/brew" })).toBe(true);
  });

  it("still respects native and reduced-motion environments", () => {
    expect(shouldUseAmbientMotion({ native: true, reducedMotion: false, pathname: "/games" })).toBe(false);
    expect(shouldUseAmbientMotion({ native: false, reducedMotion: true, pathname: "/games" })).toBe(false);
  });
});
