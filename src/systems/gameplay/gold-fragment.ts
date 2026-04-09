/**
 * Heavy / gold debris: spawn rarity, flick resistance, high-velocity reward gate (Story 3.3).
 * Pure functions — no allocations — safe for hot paths and unit tests.
 */

export type GoldDebrisConfigSlice = {
  readonly SPAWN_CHANCE: number;
  /**
   * Weighted flick speed (px) at which gold accepts full impulse scaling.
   * Below this, impulse scales linearly between {@link MIN_IMPULSE_EFFICIENCY} and 1.
   */
  readonly IMPULSE_REF_WEIGHTED_SPEED_PX: number;
  /** Efficiency at zero flick weight (0–1]. Weak flicks stay effective but damped. */
  readonly MIN_IMPULSE_EFFICIENCY: number;
  /** Same gate as perfect smash / quantized SFX “high intensity” (px, weighted). */
  readonly HIGH_VELOCITY_REWARD_MIN_WEIGHTED_PX: number;
  readonly SCORE_BONUS_MULTIPLIER: number;
  readonly BASE_DEFLECTION_SCORE: number;
};

/**
 * Roll whether this spawn should be a gold (heavy) fragment.
 * `spawnChance` in [0, 1]; out-of-range values clamp.
 */
export function rollIsGoldFragment(
  rng: () => number,
  spawnChance: number,
): boolean {
  const p = spawnChance <= 0 ? 0 : spawnChance >= 1 ? 1 : spawnChance;
  return rng() < p;
}

/**
 * Impulse efficiency for gold: weak weighted flicks are less effective than strong ones.
 * @param weightMagnitudePx — `FlickIntent.weightMagnitude`
 */
export function goldImpulseEfficiency(
  weightMagnitudePx: number,
  cfg: GoldDebrisConfigSlice,
): number {
  if (Number.isNaN(weightMagnitudePx)) {
    return cfg.MIN_IMPULSE_EFFICIENCY;
  }
  const ref = cfg.IMPULSE_REF_WEIGHTED_SPEED_PX;
  if (ref <= 1e-9) {
    return 1;
  }
  const w = weightMagnitudePx;
  if (w >= ref) {
    return 1;
  }
  const t = Math.max(0, w / ref);
  const lo = cfg.MIN_IMPULSE_EFFICIENCY;
  return lo + (1 - lo) * t;
}

/** True when gold deflection earns metallic VFX + score bonus multiplier. */
export function isGoldHighVelocityReward(
  isGold: boolean,
  weightMagnitudePx: number,
  cfg: GoldDebrisConfigSlice,
): boolean {
  return (
    isGold && weightMagnitudePx >= cfg.HIGH_VELOCITY_REWARD_MIN_WEIGHTED_PX
  );
}

/**
 * Points for one confirmed deflection after combo and optional gold bonus.
 * `comboMultiplier` is the active streak tier (≥1).
 */
export function computeDeflectionScoreAward(
  baseScore: number,
  comboMultiplier: number,
  goldRewardApplied: boolean,
  goldScoreMultiplier: number,
): number {
  let m = comboMultiplier;
  if (m < 1 || !Number.isFinite(m)) {
    m = 1;
  }
  let g = goldRewardApplied ? goldScoreMultiplier : 1;
  if (g < 1 || !Number.isFinite(g)) {
    g = 1;
  }
  const raw = baseScore * m * g;
  return Math.max(0, Math.round(raw));
}
