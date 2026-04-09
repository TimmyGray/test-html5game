import { describe, it, expect } from "vitest";
import {
  rollIsGoldFragment,
  goldImpulseEfficiency,
  isGoldHighVelocityReward,
  computeDeflectionScoreAward,
  type GoldDebrisConfigSlice,
} from "./gold-fragment.js";

const testCfg: GoldDebrisConfigSlice = {
  SPAWN_CHANCE: 0.25,
  IMPULSE_REF_WEIGHTED_SPEED_PX: 400,
  MIN_IMPULSE_EFFICIENCY: 0.25,
  HIGH_VELOCITY_REWARD_MIN_WEIGHTED_PX: 420,
  SCORE_BONUS_MULTIPLIER: 5,
  BASE_DEFLECTION_SCORE: 10,
};

describe("gold fragment rarity", () => {
  it("never rolls gold when chance is 0", () => {
    let i = 0;
    const rng = () => (i++ % 10) / 10;
    for (let k = 0; k < 20; k++) {
      expect(rollIsGoldFragment(rng, 0)).toBe(false);
    }
  });

  it("always rolls gold when chance is 1", () => {
    expect(rollIsGoldFragment(() => 0.5, 1)).toBe(true);
  });

  it("uses rng draw against spawn chance", () => {
    expect(rollIsGoldFragment(() => 0.09, 0.1)).toBe(true);
    expect(rollIsGoldFragment(() => 0.11, 0.1)).toBe(false);
  });
});

describe("gold impulse resistance", () => {
  it("gives full efficiency at or above ref speed", () => {
    expect(goldImpulseEfficiency(400, testCfg)).toBe(1);
    expect(goldImpulseEfficiency(800, testCfg)).toBe(1);
  });

  it("dampens weak flicks below ref speed", () => {
    expect(goldImpulseEfficiency(0, testCfg)).toBe(0.25);
    expect(goldImpulseEfficiency(200, testCfg)).toBeCloseTo(0.625, 6);
  });

  it("treats NaN weight as minimum efficiency (defensive)", () => {
    expect(goldImpulseEfficiency(Number.NaN, testCfg)).toBe(
      testCfg.MIN_IMPULSE_EFFICIENCY,
    );
  });
});

describe("gold high-velocity reward gate", () => {
  it("requires gold and weighted speed threshold", () => {
    expect(isGoldHighVelocityReward(false, 500, testCfg)).toBe(false);
    expect(isGoldHighVelocityReward(true, 419, testCfg)).toBe(false);
    expect(isGoldHighVelocityReward(true, 420, testCfg)).toBe(true);
  });
});

describe("deflection score with gold 5x bonus", () => {
  it("applies 5x only when gold reward flag is set", () => {
    expect(computeDeflectionScoreAward(10, 4, false, 5)).toBe(40);
    expect(computeDeflectionScoreAward(10, 4, true, 5)).toBe(200);
  });

  it("composes base × combo × gold multiplier", () => {
    expect(computeDeflectionScoreAward(10, 2, true, 5)).toBe(100);
  });
});
