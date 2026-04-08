import { describe, expect, it } from "vitest";
import { WeightedVelocityBuffer } from "./weighted-velocity-buffer.js";
import { CONFIG } from "../../config/config.js";

describe("WeightedVelocityBuffer", () => {
  it("matches hand-calculated weighted average for three samples", () => {
    const buf = new WeightedVelocityBuffer();
    buf.push(1, 0);
    buf.push(2, 0);
    buf.push(3, 0);
    const out = { x: 0, y: 0 };
    buf.getWeightedDelta(out);
    const w = CONFIG.FLICK.WEIGHTS;
    const start = w.length - 3;
    const sw = w[start] + w[start + 1] + w[start + 2];
    const ex = (1 * w[start] + 2 * w[start + 1] + 3 * w[start + 2]) / sw;
    expect(out.x).toBeCloseTo(ex, 6);
    expect(out.y).toBeCloseTo(0, 6);
  });

  it("resets to empty", () => {
    const buf = new WeightedVelocityBuffer();
    buf.push(1, 1);
    buf.reset();
    const out = { x: 0, y: 0 };
    buf.getWeightedDelta(out);
    expect(out.x).toBe(0);
    expect(out.y).toBe(0);
  });
});
