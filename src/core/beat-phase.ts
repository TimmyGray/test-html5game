import { CONFIG } from "../config/config.js";

/** Beats per second from BPM */
export function beatsPerSecond(bpm: number): number {
  return bpm / 60;
}

/**
 * Beat phase in [0, 1) — 0 on each beat boundary.
 * `audioTimeSec` must come from SyncClock (audio timeline).
 */
export function getBeatPhase(audioTimeSec: number, bpm: number): number {
  const bps = beatsPerSecond(bpm);
  const beats = audioTimeSec * bps;
  return beats - Math.floor(beats);
}

/**
 * Heartbeat envelope: attack then decay within one beat cycle.
 * Uses config-style attack/decay as fractions of one beat [0, 1).
 */
export function heartbeatEnvelope(
  phase: number,
  attackFrac: number,
  decayFrac: number,
  pulseAmplitude: number,
): number {
  const a = Math.max(0, attackFrac);
  const d = Math.max(0, decayFrac);
  const amp = Math.max(0, pulseAmplitude);

  if (amp <= 0) {
    return 0;
  }

  if (a <= 1e-9) {
    if (d <= 1e-9) {
      return 0;
    }
    if (phase < d) {
      return (1 - phase / d) * amp;
    }
    return 0;
  }

  if (phase < a) {
    return (phase / a) * amp;
  }
  if (phase < a + d) {
    return Math.max(0, (1 - (phase - a) / d) * amp);
  }
  return 0;
}

/** Reusable beat index tracker — no per-frame allocation */
export class BeatTickTracker {
  private _lastIndex = -1;

  /**
   * Returns true when the integer beat index advances since the last call.
   * The first call seeds internal state and returns false (no spurious tick at t≈0).
   */
  public consumeBeatTick(audioTimeSec: number, bpm: number): boolean {
    const idx = Math.floor(audioTimeSec * beatsPerSecond(bpm));
    if (this._lastIndex === -1) {
      this._lastIndex = idx;
      return false;
    }
    if (idx > this._lastIndex) {
      this._lastIndex = idx;
      return true;
    }
    if (idx < this._lastIndex) {
      // Rewinds/seeks should not emit synthetic beat ticks; just re-seed tracker.
      this._lastIndex = idx;
      return false;
    }
    return false;
  }

  /** @internal */
  public resetForTesting(): void {
    this._lastIndex = -1;
  }
}

/** Mutable out-struct for {@link samplePlanetHeartbeatInto} (ticker path: reuse one instance). */
export type PlanetHeartbeatSample = {
  phase: number;
  envelope: number;
};

/**
 * Writes phase + envelope into `out` — **no allocation** (use from gameplay ticker).
 */
export function samplePlanetHeartbeatInto(
  audioTimeSec: number,
  bpm: number,
  hb: typeof CONFIG.PLANET_HEARTBEAT,
  out: PlanetHeartbeatSample,
): void {
  out.phase = getBeatPhase(audioTimeSec, bpm);
  out.envelope = heartbeatEnvelope(
    out.phase,
    hb.ATTACK_BEAT_FRAC,
    hb.DECAY_BEAT_FRAC,
    hb.PULSE_AMPLITUDE,
  );
}

/**
 * Full heartbeat sample for rendering: phase + envelope using {@link CONFIG.PLANET_HEARTBEAT}.
 * Allocates a new object — prefer {@link samplePlanetHeartbeatInto} on hot paths.
 */
export function samplePlanetHeartbeat(
  audioTimeSec: number,
  bpm: number,
  hb: typeof CONFIG.PLANET_HEARTBEAT,
): { phase: number; envelope: number } {
  const phase = getBeatPhase(audioTimeSec, bpm);
  const envelope = heartbeatEnvelope(
    phase,
    hb.ATTACK_BEAT_FRAC,
    hb.DECAY_BEAT_FRAC,
    hb.PULSE_AMPLITUDE,
  );
  return { phase, envelope };
}
