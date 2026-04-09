import { describe, expect, it } from "vitest";
import {
  aberrationEnvelope,
  shockwaveEnvelope,
  spectacleWavePhase,
} from "./collision-spectacle-envelope.js";

describe("shockwaveEnvelope", () => {
  it("is zero for negative age or non-positive duration", () => {
    expect(shockwaveEnvelope(-0.1, 0.4)).toBe(0);
    expect(shockwaveEnvelope(0, 0)).toBe(0);
    expect(shockwaveEnvelope(0.1, -1)).toBe(0);
  });

  it("peaks at impact and decays to zero by duration", () => {
    expect(shockwaveEnvelope(0, 1)).toBe(1);
    expect(shockwaveEnvelope(0.5, 1)).toBeCloseTo(0.25, 6);
    expect(shockwaveEnvelope(1, 1)).toBe(0);
    expect(shockwaveEnvelope(2, 1)).toBe(0);
  });

  it("scales with duration (same normalized time)", () => {
    const a = shockwaveEnvelope(0.1, 0.5);
    const b = shockwaveEnvelope(0.2, 1);
    expect(a).toBeCloseTo(b, 6);
  });
});

describe("aberrationEnvelope", () => {
  it("matches shockwave shape for valid inputs (short punch)", () => {
    expect(aberrationEnvelope(0, 0.05)).toBe(1);
    expect(aberrationEnvelope(0.05, 0.05)).toBe(0);
    expect(aberrationEnvelope(0.025, 0.05)).toBeCloseTo(0.25, 6);
  });

  it("is zero when duration is invalid", () => {
    expect(aberrationEnvelope(0, 0)).toBe(0);
  });
});

describe("spectacleWavePhase", () => {
  it("accumulates with age and speed", () => {
    expect(spectacleWavePhase(0, 32)).toBe(0);
    expect(spectacleWavePhase(0.5, 10)).toBe(5);
  });

  it("is zero when speed is non-positive", () => {
    expect(spectacleWavePhase(1, 0)).toBe(0);
    expect(spectacleWavePhase(1, -1)).toBe(0);
  });

  it("is zero for negative age", () => {
    expect(spectacleWavePhase(-0.1, 32)).toBe(0);
  });
});
