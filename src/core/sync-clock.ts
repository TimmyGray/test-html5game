import { Ticker } from 'pixi.js';

/**
 * SyncClock
 * 
 * Synchronizes PixiJS ticker with Web Audio API's audioContext.currentTime.
 * This ensures that visual rhythms stay in the pocket even if the frame-rate fluctuates.
 */
export class SyncClock {
    private static _instance: SyncClock;
    private _audioContext: AudioContext | null = null;
    private _startTime: number = 0;
    private _lastAudioTime: number = 0;
    private _timeScale: number = 1.0;
    private _driftThreshold: number = 0.005; // 5ms drift threshold

    private constructor() {}

    public static get instance(): SyncClock {
        if (!SyncClock._instance) {
            SyncClock._instance = new SyncClock();
        }
        return SyncClock._instance;
    }

    /**
     * Calibrate the clock against an AudioContext
     */
    public calibrate(audioContext: AudioContext): void {
        this._audioContext = audioContext;
        this._startTime = audioContext.currentTime;
        this._lastAudioTime = audioContext.currentTime;
        console.log(`[SyncClock] Calibrated against AudioContext at t=${this._startTime}`);
    }

    /**
     * Updates the sync between hardware clocks.
     * Should be called in the Pixi ticker loop.
     */
    public sync(ticker: Ticker): void {
        if (!this._audioContext) return;

        const currentAudioTime = this._audioContext.currentTime;
        const audioDelta = currentAudioTime - this._lastAudioTime;
        
        // Align ticker speed to match audio passage of time
        // If audio has moved more than ticker expected, speed up ticker
        if (audioDelta > 0) {
            ticker.speed = this._timeScale * (audioDelta / (ticker.deltaMS / 1000));
        }

        this._lastAudioTime = currentAudioTime;
    }

    /**
     * Sets the global time scale for effects like Micro-Slow-Mo
     */
    public setTimeScale(scale: number): void {
        this._timeScale = scale;
    }

    /**
     * Get absolute time since calibration (in seconds)
     */
    public get currentTime(): number {
        return this._audioContext ? this._audioContext.currentTime - this._startTime : 0;
    }

    /**
     * Get the current time scale
     */
    public get timeScale(): number {
        return this._timeScale;
    }
}
