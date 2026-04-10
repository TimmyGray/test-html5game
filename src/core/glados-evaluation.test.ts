import { describe, expect, it } from "vitest";
import { CONFIG } from "../config/config.js";
import { GLADOS_EVALUATION_CATALOG } from "../content/glados-evaluation-catalog.js";
import {
  assignPerformanceTier,
  buildGladosEvaluationLine,
  compositePerformanceScore,
  variantIndexDeterministic,
} from "./glados-evaluation.js";
import type { SessionEndedPayload } from "./events.js";

function payload(
  partial: Partial<SessionEndedPayload> & Pick<SessionEndedPayload, "outcome">,
): SessionEndedPayload {
  return {
    elapsedSessionSec: 10,
    totalScore: 0,
    maxComboMultiplier: 1,
    finalAtmosphericHealth01: 1,
    ...partial,
  };
}

describe("compositePerformanceScore", () => {
  it("adds combo-weighted multiplier to total score", () => {
    const w = CONFIG.GLADOS_EVALUATION.COMBO_WEIGHT;
    expect(
      compositePerformanceScore(
        payload({ outcome: "victory", totalScore: 100, maxComboMultiplier: 2 }),
        w,
      ),
    ).toBe(100 + 2 * w);
  });
});

describe("assignPerformanceTier", () => {
  const b = CONFIG.GLADOS_EVALUATION.TIER_BOUNDARIES;

  it("returns 0 below first boundary", () => {
    expect(assignPerformanceTier(b[0]! - 1, b)).toBe(0);
  });

  it("returns 1 at first boundary", () => {
    expect(assignPerformanceTier(b[0]!, b)).toBe(1);
  });

  it("returns 2 from second boundary through one below top", () => {
    expect(assignPerformanceTier(b[1]!, b)).toBe(2);
    expect(assignPerformanceTier(b[2]! - 1, b)).toBe(2);
  });

  it("returns 3 at or above top boundary", () => {
    expect(assignPerformanceTier(b[2]!, b)).toBe(3);
  });
});

describe("variantIndexDeterministic", () => {
  it("is stable for identical stats", () => {
    const s = payload({
      outcome: "victory",
      totalScore: 444,
      maxComboMultiplier: 4,
    });
    expect(variantIndexDeterministic(s, 5)).toBe(
      variantIndexDeterministic(s, 5),
    );
  });
});

describe("buildGladosEvaluationLine", () => {
  it("picks victory copy for victory outcome", () => {
    const p = payload({
      outcome: "victory",
      totalScore: 2000,
      maxComboMultiplier: 16,
      finalAtmosphericHealth01: 0.9,
    });
    const line = buildGladosEvaluationLine(p);
    const tier = assignPerformanceTier(compositePerformanceScore(p));
    const pool = GLADOS_EVALUATION_CATALOG.victory[tier].normal;
    expect(pool.includes(line)).toBe(true);
  });

  it("uses barely pool when victory health is at or below threshold", () => {
    const p = payload({
      outcome: "victory",
      totalScore: 2000,
      maxComboMultiplier: 16,
      finalAtmosphericHealth01:
        CONFIG.GLADOS_EVALUATION.LOW_HEALTH_VICTORY_THRESHOLD,
    });
    const line = buildGladosEvaluationLine(p);
    const tier = assignPerformanceTier(compositePerformanceScore(p));
    const pool = GLADOS_EVALUATION_CATALOG.victory[tier].barely;
    expect(pool.includes(line)).toBe(true);
  });

  it("picks shatter copy for shatter outcome", () => {
    const p = payload({
      outcome: "shatter",
      totalScore: 500,
      maxComboMultiplier: 4,
      finalAtmosphericHealth01: 0,
    });
    const line = buildGladosEvaluationLine(p);
    const tier = assignPerformanceTier(compositePerformanceScore(p));
    const pool = GLADOS_EVALUATION_CATALOG.shatter[tier];
    expect(pool.includes(line)).toBe(true);
  });

  it("matches same input to same output (deterministic)", () => {
    const p = payload({
      outcome: "shatter",
      totalScore: 777,
      maxComboMultiplier: 8,
      finalAtmosphericHealth01: 0,
    });
    expect(buildGladosEvaluationLine(p)).toBe(buildGladosEvaluationLine(p));
  });
});
