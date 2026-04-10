import { CONFIG } from "../config/config.js";
import { SyncClock } from "./sync-clock.js";

/**
 * Brief hit-stop window driven by {@link SyncClock#getAbsoluteTime} (audio timeline).
 * Call {@link MicroSlowMo.tick} once per frame **after** gameplay `update()` (and after {@link SyncClock#sync})
 * so `notifyHit()` during flick resolution updates the window before the next frame’s scale is applied.
 */
export class MicroSlowMo {
  private static _instance: MicroSlowMo | undefined;

  private windowEndSec = Number.NEGATIVE_INFINITY;
  private remainingSec = 0;
  private lastAudioNowSec = Number.NEGATIVE_INFINITY;

  private constructor() {}

  public static get instance(): MicroSlowMo {
    if (!MicroSlowMo._instance) {
      MicroSlowMo._instance = new MicroSlowMo();
    }
    return MicroSlowMo._instance;
  }

  /** @internal Test isolation */
  public static resetForTesting(): void {
    MicroSlowMo._instance = undefined;
  }

  /**
   * Register a confirmed deflection hit; extends the slow-mo window so rapid hits keep the effect alive.
   */
  public notifyHit(clock: SyncClock = SyncClock.instance): void {
    const now = clock.getAbsoluteTime();
    const dur = CONFIG.MICRO_SLOW_MO.DURATION_SEC;
    this.windowEndSec = Math.max(this.windowEndSec, now + dur);
    this.remainingSec = Math.max(this.remainingSec, dur);
    this.apply(clock);
  }

  /**
   * Apply time scale for the next simulation step. Run once per frame after gameplay `update()`.
   */
  public tick(clock: SyncClock = SyncClock.instance): void {
    this.apply(clock);
  }

  /** @internal Tests */
  public getWindowEndForTesting(): number {
    return this.windowEndSec;
  }

  /** @internal Tests */
  public getRemainingForTesting(): number {
    return this.remainingSec;
  }

  /**
   * Purpose: restore normal time scale when starting a fresh session (Story 4.1 replay).
   * Inputs: clock defaults to `SyncClock.instance`.
   * Outputs: clears hit-stop window; `clock` time scale set to 1.
   */
  public clearSessionWindow(clock: SyncClock = SyncClock.instance): void {
    this.windowEndSec = Number.NEGATIVE_INFINITY;
    this.remainingSec = 0;
    clock.setTimeScale(1);
  }

  private apply(clock: SyncClock): void {
    const now = clock.getAbsoluteTime();
    const audioRemaining = Math.max(0, this.windowEndSec - now);
    const audioAdvanced = now > this.lastAudioNowSec + 1e-9;
    this.lastAudioNowSec = now;

    // Keep fallback tracker in lock-step with audio when audio advances.
    if (audioAdvanced) {
      this.remainingSec = Math.max(this.remainingSec, audioRemaining);
    } else {
      // Audio stalled/suspended: advance fallback by approx wall-time (undo active timescale).
      const dt = clock.getDelta();
      const scale = Math.max(1e-6, clock.timeScale);
      const wallApprox = dt > 0 ? dt / scale : 0;
      if (wallApprox > 0 && this.remainingSec > 0) {
        this.remainingSec = Math.max(0, this.remainingSec - wallApprox);
      }
    }

    const cfg = CONFIG.MICRO_SLOW_MO;
    const audioActive = audioRemaining > 0;
    const fallbackActive = this.remainingSec > 0;
    if (audioActive && fallbackActive) {
      clock.setTimeScale(cfg.TIME_SCALE);
    } else {
      clock.setTimeScale(1);
      this.remainingSec = 0;
    }
  }
}
