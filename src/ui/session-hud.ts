import { type ComboChangedPayload } from "../core/combo-engine.js";
import { CONFIG } from "../config/config.js";
import {
  gameEvents,
  EVENTS,
  type AudioMuteChangedPayload,
  type AudioVolumeChangedPayload,
  type ScoreAwardedPayload,
} from "../core/events.js";

export type SessionHudAudioControlOptions = {
  initialMuted: boolean;
  initialVolume: number;
  onMuteChange: (muted: boolean) => void;
  onVolumeChange: (volume: number) => void;
};

/**
 * Purpose: Story 5.1+5.2 in-session HUD for score/combo and player audio controls.
 * Inputs: DOM host node; score/combo/session lifecycle events from central event bus.
 * Outputs: safe-area aware HUD labels kept in sync with gameplay events.
 * Side effects: mutates DOM and registers/removes event listeners in mount/dispose.
 * Failure modes: missing host throws from constructor to surface integration errors early.
 */
export class SessionHudController {
  private readonly _host: HTMLElement;
  private readonly _root: HTMLDivElement;
  private readonly _scoreValue: HTMLSpanElement;
  private readonly _comboValue: HTMLSpanElement;
  private readonly _audioRoot: HTMLDivElement;
  private readonly _muteToggle: HTMLButtonElement;
  private readonly _volumeInput: HTMLInputElement;
  private readonly _volumeValue: HTMLSpanElement;
  private _mounted = false;
  private _runningScore = 0;
  private _comboMultiplier = 1;
  private _muted = false;
  private _masterVolume: number = CONFIG.AUDIO.DEFAULT_MASTER_VOLUME;
  private readonly _audioControlOptions: SessionHudAudioControlOptions | null;

  private readonly _onScoreAwarded = (payload: ScoreAwardedPayload): void => {
    this._runningScore += payload.delta;
    this._render();
  };

  private readonly _onComboChanged = (payload: ComboChangedPayload): void => {
    this._comboMultiplier = payload.multiplier;
    this._render();
  };

  private readonly _onSessionEnded = (): void => {
    this._root.hidden = true;
  };

  private readonly _onAudioMuteChanged = (
    payload: AudioMuteChangedPayload,
  ): void => {
    this._muted = payload.muted;
    this._syncAudioUi();
  };

  private readonly _onAudioVolumeChanged = (
    payload: AudioVolumeChangedPayload,
  ): void => {
    this._masterVolume = clamp01(payload.volume);
    this._syncAudioUi();
  };

  /**
   * Purpose: build HUD shell and optional player audio controls for Story 5.2.
   * Inputs assumptions: host exists; audio callbacks are optional for non-audio environments.
   * Outputs contract: ready-to-mount controller with score/combo and controls baseline state.
   * Side effects: creates DOM nodes only (no listeners until `mount`).
   * Failure modes: throws when host is missing to surface wiring errors during startup.
   */
  public constructor(
    host: HTMLElement,
    audioControlOptions?: SessionHudAudioControlOptions,
  ) {
    if (!host) {
      throw new Error("SessionHudController requires a valid host element");
    }
    this._host = host;
    this._audioControlOptions = audioControlOptions ?? null;
    if (this._audioControlOptions !== null) {
      this._muted = this._audioControlOptions.initialMuted;
      this._masterVolume = clamp01(this._audioControlOptions.initialVolume);
    }

    const scoreLabel = document.createElement("div");
    scoreLabel.className = "rp-session-hud-score";
    const scoreTitle = document.createElement("span");
    scoreTitle.className = "rp-session-hud-title";
    scoreTitle.textContent = "Score";
    this._scoreValue = document.createElement("span");
    this._scoreValue.className = "rp-session-hud-value";
    scoreLabel.appendChild(scoreTitle);
    scoreLabel.appendChild(this._scoreValue);

    const comboLabel = document.createElement("div");
    comboLabel.className = "rp-session-hud-combo";
    const comboTitle = document.createElement("span");
    comboTitle.className = "rp-session-hud-title";
    comboTitle.textContent = "Combo";
    this._comboValue = document.createElement("span");
    this._comboValue.className = "rp-session-hud-value";
    comboLabel.appendChild(comboTitle);
    comboLabel.appendChild(this._comboValue);

    this._audioRoot = document.createElement("div");
    this._audioRoot.className = "rp-session-hud-audio";
    this._muteToggle = document.createElement("button");
    this._muteToggle.className = "rp-session-hud-audio-mute";
    this._muteToggle.type = "button";
    this._muteToggle.addEventListener("click", () => {
      this._muted = !this._muted;
      this._publishAudioState();
      this._syncAudioUi();
    });
    const volumeRow = document.createElement("label");
    volumeRow.className = "rp-session-hud-audio-volume";
    volumeRow.textContent = "Vol";
    this._volumeInput = document.createElement("input");
    this._volumeInput.type = "range";
    this._volumeInput.min = String(CONFIG.AUDIO.MASTER_VOLUME_MIN);
    this._volumeInput.max = String(CONFIG.AUDIO.MASTER_VOLUME_MAX);
    this._volumeInput.step = "0.01";
    this._volumeInput.addEventListener("input", () => {
      this._masterVolume = clamp01(Number(this._volumeInput.value));
      this._publishAudioState();
      this._syncAudioUi();
    });
    this._volumeValue = document.createElement("span");
    this._volumeValue.className = "rp-session-hud-audio-value";
    volumeRow.appendChild(this._volumeInput);
    volumeRow.appendChild(this._volumeValue);
    this._audioRoot.appendChild(this._muteToggle);
    this._audioRoot.appendChild(volumeRow);

    this._root = document.createElement("div");
    this._root.className = "rp-session-hud-root";
    this._root.hidden = true;
    this._root.appendChild(scoreLabel);
    this._root.appendChild(comboLabel);
    this._root.appendChild(this._audioRoot);

    this._render();
    this._syncAudioUi();
  }

  /**
   * Purpose: attach HUD DOM + event subscriptions once for current app lifetime.
   * Inputs assumptions: host is alive and mounted in document.
   * Outputs contract: HUD becomes visible and reactive to score/combo/session events.
   * Side effects: appends root node and registers event listeners.
   */
  public mount(): void {
    if (this._mounted) {
      return;
    }
    this._mounted = true;
    this._host.appendChild(this._root);
    this._root.hidden = false;
    gameEvents.on(EVENTS.SCORE_AWARDED, this._onScoreAwarded);
    gameEvents.on(EVENTS.COMBO_CHANGED, this._onComboChanged);
    gameEvents.on(EVENTS.SESSION_ENDED, this._onSessionEnded);
    gameEvents.on(EVENTS.AUDIO_MUTE_CHANGED, this._onAudioMuteChanged);
    gameEvents.on(EVENTS.AUDIO_VOLUME_CHANGED, this._onAudioVolumeChanged);
  }

  /**
   * Purpose: reset display for replay/session restart without recreating controller.
   * Inputs assumptions: may be called whether HUD is currently visible or hidden.
   * Outputs contract: score=0 and combo=x1 baseline rendered, HUD visible for next run.
   * Side effects: mutates internal state and DOM text.
   */
  public resetSession(): void {
    this._runningScore = 0;
    this._comboMultiplier = 1;
    this._render();
    this._root.hidden = false;
  }

  public dispose(): void {
    if (!this._mounted) {
      return;
    }
    this._mounted = false;
    gameEvents.off(EVENTS.SCORE_AWARDED, this._onScoreAwarded);
    gameEvents.off(EVENTS.COMBO_CHANGED, this._onComboChanged);
    gameEvents.off(EVENTS.SESSION_ENDED, this._onSessionEnded);
    gameEvents.off(EVENTS.AUDIO_MUTE_CHANGED, this._onAudioMuteChanged);
    gameEvents.off(EVENTS.AUDIO_VOLUME_CHANGED, this._onAudioVolumeChanged);
    this._root.remove();
  }

  /** @internal tests */
  public get scoreTextForTesting(): string {
    return this._scoreValue.textContent ?? "";
  }

  /** @internal tests */
  public get comboTextForTesting(): string {
    return this._comboValue.textContent ?? "";
  }

  /** @internal tests */
  public get isVisibleForTesting(): boolean {
    return !this._root.hidden;
  }

  /** @internal tests */
  public get muteTextForTesting(): string {
    return this._muteToggle.textContent ?? "";
  }

  /** @internal tests */
  public get volumeTextForTesting(): string {
    return this._volumeValue.textContent ?? "";
  }

  private _render(): void {
    this._scoreValue.textContent = this._runningScore.toLocaleString("en-US");
    this._comboValue.textContent = `x${this._comboMultiplier}`;
  }

  private _syncAudioUi(): void {
    this._muteToggle.textContent = this._muted ? "Unmute" : "Mute";
    this._volumeInput.value = this._masterVolume.toFixed(2);
    this._volumeValue.textContent = `${Math.round(this._masterVolume * 100)}%`;
    this._volumeInput.disabled = this._muted;
    this._audioRoot.hidden = this._audioControlOptions === null;
  }

  private _publishAudioState(): void {
    if (this._audioControlOptions === null) {
      gameEvents.emit(EVENTS.AUDIO_MUTE_CHANGED, { muted: this._muted });
      gameEvents.emit(EVENTS.AUDIO_VOLUME_CHANGED, {
        volume: this._masterVolume,
      });
      return;
    }
    this._audioControlOptions.onMuteChange(this._muted);
    this._audioControlOptions.onVolumeChange(this._masterVolume);
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return CONFIG.AUDIO.DEFAULT_MASTER_VOLUME;
  }
  return Math.max(
    CONFIG.AUDIO.MASTER_VOLUME_MIN,
    Math.min(CONFIG.AUDIO.MASTER_VOLUME_MAX, value),
  );
}
