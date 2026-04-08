import { describe, it, expect } from "vitest";
import { CONFIG } from "../../config/config.js";
import {
  isDebrisPlanetImpact,
  shouldStormRecycleForOob,
} from "./tutorial-planet-impact.js";

describe("tutorial-planet-impact", () => {
  it("detects impact when debris center is within combined radii", () => {
    const pr = CONFIG.PLANET.RADIUS;
    const dr = CONFIG.DEBRIS_PROBE.RADIUS;
    expect(isDebrisPlanetImpact(400, 300, 400, 300, pr, dr)).toBe(true);
    expect(isDebrisPlanetImpact(400 + pr + dr + 1, 300, 400, 300, pr, dr)).toBe(
      false,
    );
  });

  it("skips OOB recycle while tutorial piece is active", () => {
    expect(shouldStormRecycleForOob(true, true)).toBe(false);
    expect(shouldStormRecycleForOob(true, false)).toBe(true);
    expect(shouldStormRecycleForOob(false, true)).toBe(false);
  });

  it("allows OOB recycle for active tutorial when planet resolution is disabled", () => {
    expect(shouldStormRecycleForOob(true, true, false)).toBe(true);
  });
});
