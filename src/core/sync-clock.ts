import type { Ticker } from "pixi.js";

/**
 * SyncClock — aligns Pixi `ticker.speed` with Web Audio `currentTime` for rhythmic precision.
 * Call `sync(ticker)` once per frame from the application ticker (before gameplay logic when possible).
 */
export class SyncClock {
  private static _instance: SyncClock | undefined;

  private _audioContext: AudioContext | null = null;
  private _startTime = 0;
  private _lastAudioTime = 0;
  private _timeScale = 1;
  private _lastDelta = 0;

  private constructor() {}

  public static get instance(): SyncClock {
    if (!SyncClock._instance) {
      SyncClock._instance = new SyncClock();
    }
    return SyncClock._instance;
  }

  /** @internal Test isolation */
  public static resetForTesting(): void {
    SyncClock._instance = undefined;
  }

  /**
   * Calibrate against the game's AudioContext (call once after context is created).
   */
  public calibrate(audioContext: AudioContext): void {
    this._audioContext = audioContext;
    const now = audioContext.currentTime;
    this._startTime = now;
    this._lastAudioTime = now;
    this._lastDelta = 0;
  }

  /**
   * Align ticker speed with audio progression. Uses raw {@link Ticker#elapsedMS} (wall clock)
   * so speed correction is stable.
   */
  public sync(ticker: Ticker): void {
    const wallDeltaSec = ticker.elapsedMS / 1000;
    if (wallDeltaSec <= 0) {
      this._lastDelta = 0;
      return;
    }
    if (!this._audioContext) {
      this._lastDelta = wallDeltaSec * this._timeScale;
      return;
    }

    const audioNow = this._audioContext.currentTime;
    const audioDelta = audioNow - this._lastAudioTime;
    this._lastAudioTime = audioNow;

    // When autoplay policy keeps AudioContext suspended, keep simulation advancing on wall time.
    this._lastDelta =
      audioDelta > 0 ? audioDelta : wallDeltaSec * this._timeScale;

    const targetSpeed = (audioDelta / wallDeltaSec) * this._timeScale;
    // If audio didn't advance this frame, keep prior speed (avoids divide-by-zero / NaN).
    if (Number.isFinite(targetSpeed) && targetSpeed > 0) {
      ticker.speed = targetSpeed;
    }
  }

  /** Last frame's elapsed time in seconds, derived from the audio clock (rhythm-safe delta). */
  public getDelta(): number {
    return this._lastDelta;
  }

  /** Seconds since `calibrate()` using the audio timeline. */
  public getAbsoluteTime(): number {
    return this._audioContext
      ? this._audioContext.currentTime - this._startTime
      : 0;
  }

  public setTimeScale(scale: number): void {
    this._timeScale = scale;
  }

  public get timeScale(): number {
    return this._timeScale;
  }
}
