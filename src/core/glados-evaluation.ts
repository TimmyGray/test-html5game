import { CONFIG } from "../config/config.js";
import type { SessionEndedPayload } from "./events.js";
import {
  GLADOS_EVALUATION_CATALOG,
  type GladosTierIndex,
} from "../content/glados-evaluation-catalog.js";

/**
 * Purpose: deterministic GLaDOS performance tier + line selection for Story 4.2 results overlay.
 * Inputs: `SessionEndedPayload` must include `totalScore`, `maxComboMultiplier`, `finalAtmosphericHealth01`.
 * Outputs: single evaluation string; same inputs always yield same line (no RNG).
 * Side effects: none.
 * Failure modes: none thrown for valid payloads; clamp health to [0,1] if needed.
 * Security: string output only from static catalog — no user-controlled format injection.
 */

export type GladosEvaluationInputs = Pick<
  SessionEndedPayload,
  "outcome" | "totalScore" | "maxComboMultiplier" | "finalAtmosphericHealth01"
>;

/**
 * Composite score for tier mapping: configurable combo weight rewards streak tier without randomness.
 */
export function compositePerformanceScore(
  stats: GladosEvaluationInputs,
  comboWeight: number = CONFIG.GLADOS_EVALUATION.COMBO_WEIGHT,
): number {
  return stats.totalScore + stats.maxComboMultiplier * comboWeight;
}

/**
 * Assigns tier 0..3 by strict-less-than walks on ascending `boundaries`:
 * below `boundaries[0]` → 0; then each step compares to `boundaries[1]` and `boundaries[2]`; at/above the third → 3.
 */
export function assignPerformanceTier(
  composite: number,
  boundaries: readonly number[] = CONFIG.GLADOS_EVALUATION.TIER_BOUNDARIES,
): GladosTierIndex {
  const b0 = boundaries[0] ?? 350;
  const b1 = boundaries[1] ?? 900;
  const b2 = boundaries[2] ?? 1800;
  if (composite < b0) {
    return 0;
  }
  if (composite < b1) {
    return 1;
  }
  if (composite < b2) {
    return 2;
  }
  return 3;
}

/**
 * Deterministic index into a variant list (no Math.random).
 */
export function variantIndexDeterministic(
  stats: GladosEvaluationInputs,
  length: number,
): number {
  if (length <= 1) {
    return 0;
  }
  const h = Math.floor(stats.totalScore) * 31 + stats.maxComboMultiplier * 17;
  const idx = Math.abs(h) % length;
  return idx;
}

function clamp01(x: number): number {
  if (x <= 0) {
    return 0;
  }
  if (x >= 1) {
    return 1;
  }
  return x;
}

/**
 * Builds the GLaDOS evaluation line for the results overlay.
 */
export function buildGladosEvaluationLine(
  payload: SessionEndedPayload,
  catalog = GLADOS_EVALUATION_CATALOG,
): string {
  const stats: GladosEvaluationInputs = {
    outcome: payload.outcome,
    totalScore: payload.totalScore,
    maxComboMultiplier: payload.maxComboMultiplier,
    finalAtmosphericHealth01: clamp01(payload.finalAtmosphericHealth01),
  };

  const composite = compositePerformanceScore(stats);
  const tier = assignPerformanceTier(composite);

  if (stats.outcome === "victory") {
    const block = catalog.victory[tier];
    const low =
      stats.finalAtmosphericHealth01 <=
      CONFIG.GLADOS_EVALUATION.LOW_HEALTH_VICTORY_THRESHOLD;
    const pool = low ? block.barely : block.normal;
    const i = variantIndexDeterministic(stats, pool.length);
    return pool[i] ?? pool[0] ?? "";
  }

  const pool = catalog.shatter[tier];
  const i = variantIndexDeterministic(stats, pool.length);
  return pool[i] ?? pool[0] ?? "";
}
