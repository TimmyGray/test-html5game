/**
 * Combo multiplier from consecutive successful deflections (Story 3.2).
 * No per-tick allocations — tracker is constructed once at bootstrap.
 */

/** Multiplier for current streak: streak 0 → 1; streak k≥1 → `multipliers[k-1]` capped by last step. */
export function comboMultiplierFromStreak(
  consecutiveSuccessfulHits: number,
  multipliers: readonly number[],
): number {
  if (consecutiveSuccessfulHits <= 0) {
    return 1;
  }
  if (multipliers.length === 0) {
    return 1;
  }
  const idx = Math.min(consecutiveSuccessfulHits - 1, multipliers.length - 1);
  return multipliers[idx]!;
}

export type ComboChangedPayload = {
  /** Successful deflections in the current streak (0 after reset). */
  consecutiveSuccessfulHits: number;
  /** Display/scoring multiplier (1 = base). */
  multiplier: number;
};

/**
 * Authoritative combo state: increments only on confirmed hits; resets on planet damage or flick miss.
 */
export class ComboTracker {
  private streak = 0;

  constructor(private readonly multipliers: readonly number[]) {}

  get consecutiveSuccessfulHits(): number {
    return this.streak;
  }

  getMultiplier(): number {
    return comboMultiplierFromStreak(this.streak, this.multipliers);
  }

  /**
   * Call once per confirmed asteroid deflection (same path as `ASTEROID_HIT` emit).
   * Streak always increments; returns a payload only when the **multiplier tier** changes
   * (so callers can emit `COMBO_CHANGED` without spam while capped at the last step).
   */
  notifySuccessfulDeflection(): ComboChangedPayload | null {
    const prevMultiplier = comboMultiplierFromStreak(
      this.streak,
      this.multipliers,
    );
    this.streak++;
    const multiplier = comboMultiplierFromStreak(this.streak, this.multipliers);
    if (multiplier === prevMultiplier) {
      return null;
    }
    return { consecutiveSuccessfulHits: this.streak, multiplier };
  }

  /**
   * Call on planet damage or flick miss (no ray hit).
   * @returns payload only when state actually changed (avoids duplicate emits).
   */
  notifyReset(): ComboChangedPayload | null {
    if (this.streak === 0) {
      return null;
    }
    this.streak = 0;
    return { consecutiveSuccessfulHits: 0, multiplier: 1 };
  }

  /**
   * Purpose: deterministic new-run baseline without emitting `COMBO_CHANGED` (Story 4.1 replay).
   * Inputs: none; assumes caller owns HUD/overlay reset.
   * Outputs: streak forced to 0; no side effects on event bus.
   */
  resetSession(): void {
    this.streak = 0;
  }
}
