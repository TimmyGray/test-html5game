/**
 * Atmospheric health → planet tint (Story 3.1). Pure helpers; gameplay holds authoritative current/max.
 */

export type Rgb01 = { r: number; g: number; b: number };

/** Normalized health in [0, 1] from current hit points. */
export function atmosphericHealth01(current: number, max: number): number {
  if (max <= 0) {
    return 0;
  }
  const t = current / max;
  return t <= 0 ? 0 : t >= 1 ? 1 : t;
}

/**
 * Linear RGB tint: full health → `healthy`, zero health → `distress`.
 * `health01` is clamped to [0, 1] for continuity.
 */
export function atmosphereTintFromHealth01(
  health01: number,
  healthy: Readonly<Rgb01>,
  distress: Readonly<Rgb01>,
  out: Rgb01,
): void {
  const t = health01 <= 0 ? 0 : health01 >= 1 ? 1 : health01;
  const s = 1 - t;
  out.r = healthy.r * t + distress.r * s;
  out.g = healthy.g * t + distress.g * s;
  out.b = healthy.b * t + distress.b * s;
}

/**
 * Exponential ease toward `target` (game-loop smoothing; no timers).
 * `tauSec` is time constant; smaller = snappier.
 */
export function smoothAtmosphericDisplay01(
  current: number,
  target: number,
  dtSec: number,
  tauSec: number,
): number {
  if (tauSec <= 0 || dtSec <= 0) {
    return target;
  }
  const alpha = 1 - Math.exp(-dtSec / tauSec);
  return current + (target - current) * alpha;
}
