import { describe, it, expect } from "vitest";
import { CONFIG } from "../config/config.js";
import {
  nextBurstParticleCount,
  pickBurstSlotIndicesInto,
} from "./impact-particle-burst.js";

describe("impact particle burst guardrails", () => {
  it("nextBurstParticleCount stays within configured inclusive range", () => {
    const { BURST_MIN, BURST_MAX } = CONFIG.PARTICLE_EJECTION;
    for (let i = 0; i < 200; i++) {
      const r = i / 200;
      const c = nextBurstParticleCount(() => r);
      expect(c).toBeGreaterThanOrEqual(BURST_MIN);
      expect(c).toBeLessThanOrEqual(BURST_MAX);
    }
  });

  it("respects endpoints for deterministic RNG", () => {
    const minC = nextBurstParticleCount(() => 0);
    const maxC = nextBurstParticleCount(() => 0.999999);
    expect(minC).toBe(CONFIG.PARTICLE_EJECTION.BURST_MIN);
    expect(maxC).toBe(CONFIG.PARTICLE_EJECTION.BURST_MAX);
  });

  it("pickBurstSlotIndicesInto prefers dead slots then evicts lowest life", () => {
    const life = new Float32Array(12);
    for (let i = 0; i < 12; i++) {
      life[i] = 999;
    }
    for (let i = 0; i < 5; i++) {
      life[i] = 0;
    }
    life[5] = 0.4;
    life[6] = 0.9;
    life[7] = 0.41;
    const out: number[] = [];
    pickBurstSlotIndicesInto(life, 8, out);
    expect(out.length).toBe(8);
    expect(new Set(out).size).toBe(8);
    for (let i = 0; i < 5; i++) {
      expect(out).toContain(i);
    }
    expect(out).toContain(5);
    expect(out).toContain(7);
    expect(out).toContain(6);
  });
});
