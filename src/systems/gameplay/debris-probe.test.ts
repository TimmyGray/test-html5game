import { describe, it, expect } from "vitest";
import { CONFIG } from "../../config/config.js";
import { DebrisProbe } from "./debris-probe.js";

describe("DebrisProbe", () => {
  it("wraps on both X and Y bounds", () => {
    const probe = new DebrisProbe(0, 0);
    const margin = CONFIG.DEBRIS_PROBE.RADIUS * 2;

    probe.x = -margin - 1;
    probe.y = 100;
    probe.ensureLoopWrap(800, 600);
    expect(probe.x).toBe(800 + margin);

    probe.x = 100;
    probe.y = 600 + margin + 1;
    probe.ensureLoopWrap(800, 600);
    expect(probe.y).toBe(-margin);
  });

  it("clamps applied impulse magnitude by MAX_IMPULSE", () => {
    const probe = new DebrisProbe(0, 0);
    probe.vx = 0;
    probe.vy = 0;

    probe.applyImpulse(10_000, 0);
    expect(Math.hypot(probe.vx, probe.vy)).toBeLessThanOrEqual(
      CONFIG.FLICK.MAX_IMPULSE + 1e-6,
    );
  });

  it("scales impulse by impulseScale (gold resistance path)", () => {
    const probe = new DebrisProbe(0, 0);
    probe.vx = 0;
    probe.vy = 0;
    probe.applyImpulse(1, 0, 1);
    const full = Math.hypot(probe.vx, probe.vy);
    probe.vx = 0;
    probe.vy = 0;
    probe.applyImpulse(1, 0, 0.25);
    const quarter = Math.hypot(probe.vx, probe.vy);
    expect(quarter).toBeCloseTo(full * 0.25, 5);
  });
});
