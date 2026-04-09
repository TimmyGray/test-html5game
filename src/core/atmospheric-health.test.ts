import { describe, expect, it } from "vitest";
import {
  atmosphereTintFromHealth01,
  atmosphericHealth01,
  smoothAtmosphericDisplay01,
} from "./atmospheric-health.js";
import { CONFIG } from "../config/config.js";

describe("atmosphericHealth01", () => {
  it("maps midpoint", () => {
    expect(atmosphericHealth01(50, 100)).toBeCloseTo(0.5, 6);
  });

  it("clamps to [0, 1]", () => {
    expect(atmosphericHealth01(-10, 100)).toBe(0);
    expect(atmosphericHealth01(200, 100)).toBe(1);
    expect(atmosphericHealth01(0, 100)).toBe(0);
    expect(atmosphericHealth01(100, 100)).toBe(1);
  });

  it("returns 0 when max is non-positive", () => {
    expect(atmosphericHealth01(10, 0)).toBe(0);
    expect(atmosphericHealth01(10, -5)).toBe(0);
  });
});

describe("atmosphereTintFromHealth01", () => {
  const h = CONFIG.ATMOSPHERIC_HEALTH.HEALTHY_TINT;
  const d = CONFIG.ATMOSPHERIC_HEALTH.DISTRESS_TINT;
  const out = { r: 0, g: 0, b: 0 };

  it("at 100% matches healthy tint", () => {
    atmosphereTintFromHealth01(1, h, d, out);
    expect(out.r).toBeCloseTo(h.r, 6);
    expect(out.g).toBeCloseTo(h.g, 6);
    expect(out.b).toBeCloseTo(h.b, 6);
  });

  it("at 0% matches distress tint", () => {
    atmosphereTintFromHealth01(0, h, d, out);
    expect(out.r).toBeCloseTo(d.r, 6);
    expect(out.g).toBeCloseTo(d.g, 6);
    expect(out.b).toBeCloseTo(d.b, 6);
  });

  it("at midpoint is halfway in RGB space", () => {
    atmosphereTintFromHealth01(0.5, h, d, out);
    expect(out.r).toBeCloseTo((h.r + d.r) * 0.5, 6);
    expect(out.g).toBeCloseTo((h.g + d.g) * 0.5, 6);
    expect(out.b).toBeCloseTo((h.b + d.b) * 0.5, 6);
  });

  it("clamps overshoot inputs for smooth continuity", () => {
    atmosphereTintFromHealth01(1.5, h, d, out);
    expect(out.r).toBeCloseTo(h.r, 6);
    atmosphereTintFromHealth01(-0.25, h, d, out);
    expect(out.r).toBeCloseTo(d.r, 6);
  });
});

describe("smoothAtmosphericDisplay01", () => {
  it("reaches target when tau is zero", () => {
    expect(smoothAtmosphericDisplay01(0.2, 0.8, 0.016, 0)).toBe(0.8);
  });

  it("reaches target when dt is zero", () => {
    expect(smoothAtmosphericDisplay01(0.2, 0.8, 0, 0.2)).toBe(0.8);
  });

  it("moves toward target for positive tau and dt", () => {
    const next = smoothAtmosphericDisplay01(1, 0, 0.1, 0.1);
    expect(next).toBeLessThan(1);
    expect(next).toBeGreaterThan(0);
    // alpha = 1 - exp(-dt/tau) = 1 - e^-1 → next = 1 - alpha = e^-1
    expect(next).toBeCloseTo(Math.exp(-1), 5);
  });
});
