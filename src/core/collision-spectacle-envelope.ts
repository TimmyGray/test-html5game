/**
 * Pure time envelopes for collision spectacle VFX (Story 2.2).
 * Drives shader uniforms from SyncClock age — no wall-clock timers.
 */

/** Shared (1−t)² decay for shockwave + aberration envelopes — single tuning point. */
function quadraticDecayEnvelope(ageSec: number, durationSec: number): number {
  if (ageSec < 0 || durationSec <= 0) {
    return 0;
  }
  const t = ageSec / durationSec;
  if (t >= 1) {
    return 0;
  }
  const oneMinus = 1 - t;
  return oneMinus * oneMinus;
}

/**
 * Smooth shockwave visibility: peak at impact, decays over `durationSec`.
 * Returns [0, 1].
 */
export function shockwaveEnvelope(ageSec: number, durationSec: number): number {
  return quadraticDecayEnvelope(ageSec, durationSec);
}

/**
 * Brief chromatic spike (~50ms class): peak at impact, decays over `durationSec`.
 * Returns [0, 1].
 */
export function aberrationEnvelope(
  ageSec: number,
  durationSec: number,
): number {
  return quadraticDecayEnvelope(ageSec, durationSec);
}

/**
 * Wave phase for expanding ripple: `sin(r * k - phase)` in the fragment shader.
 */
export function spectacleWavePhase(
  ageSec: number,
  phaseSpeedRadPerSec: number,
): number {
  if (ageSec < 0 || phaseSpeedRadPerSec <= 0) {
    return 0;
  }
  return ageSec * phaseSpeedRadPerSec;
}
