// @vitest-environment jsdom

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CONFIG } from "../config/config.js";

const METALLIC_TINTS = new Set<number>([0xffe066, 0xcfd8dc, 0xffb74d]);
const STANDARD_TINTS = new Set<number>([0xffcc88, 0xaaeeff, 0xffffff]);

describe("ImpactParticleBurst canvas paths (Pixi texture bootstrap)", () => {
  let origGetContext: typeof HTMLCanvasElement.prototype.getContext;
  let burstMod: typeof import("./impact-particle-burst.js");

  beforeAll(async () => {
    origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type?: string,
    ) {
      if (type === "2d") {
        return {
          fillStyle: "",
          fillRect: () => {},
        } as unknown as CanvasRenderingContext2D;
      }
      return null;
    };
    burstMod = await import("./impact-particle-burst.js");
  });

  afterAll(() => {
    HTMLCanvasElement.prototype.getContext = origGetContext;
  });

  it("burstMetallicAt activates shards using the metallic tint palette", () => {
    const burst = new burstMod.ImpactParticleBurst();
    const rng = (): number => 0.5;
    const want = burstMod.nextBurstParticleCount(rng);
    const expected = Math.min(want, CONFIG.PARTICLE_EJECTION.MAX_NEW_PER_BURST);
    burst.burstMetallicAt(120, 240, rng);
    let active = 0;
    for (const p of burst.particles) {
      if (p.alpha >= 0.99 && p.x > -9000) {
        active++;
        expect(METALLIC_TINTS.has(p.color as number)).toBe(true);
      }
    }
    expect(active).toBe(expected);
  });

  it("burstAt uses non-metallic tint palette for the same constant rng", () => {
    const burst = new burstMod.ImpactParticleBurst();
    const rng = (): number => 0.5;
    burst.burstAt(120, 240, rng);
    let sawStandard = false;
    for (const p of burst.particles) {
      if (p.alpha >= 0.99 && p.x > -9000) {
        expect(METALLIC_TINTS.has(p.color as number)).toBe(false);
        expect(STANDARD_TINTS.has(p.color as number)).toBe(true);
        sawStandard = true;
      }
    }
    expect(sawStandard).toBe(true);
  });
});
