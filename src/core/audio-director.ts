import { CONFIG } from "../config/config.js";

type AudioCueKind = "deflection" | "impact" | "shatter" | "heartbeat";

export type AudioDirectorState = {
  muted: boolean;
  masterVolume: number;
  effectiveGain: number;
};

function buildNoiseBurstBuffer(
  ctx: AudioContext,
  durationSec: number,
): AudioBuffer {
  const rate = ctx.sampleRate;
  const frames = Math.max(1, Math.floor(durationSec * rate));
  const buf = ctx.createBuffer(1, frames, rate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    const t = i / Math.max(1, frames - 1);
    const env = Math.sin(Math.PI * t);
    data[i] = (Math.random() * 2 - 1) * env * 0.85;
  }
  return buf;
}

/**
 * Purpose: own global gameplay audio bus and lightweight routed cue scheduling.
 * Inputs assumptions: receives a live `AudioContext`; callers provide SyncClock-relative times.
 * Outputs contract: exposes an SFX sub-bus (`outputNode`) + mute/volume on the shared master.
 * Side effects: creates Web Audio nodes; cues may be scheduled while suspended and play after resume.
 * Failure modes: invalid schedule times no-op; disconnect errors swallowed on dispose.
 * Security notes: procedural buffers only; no external URL fetch in this module.
 */
export class AudioDirector {
  private readonly _ctx: AudioContext;
  private readonly _masterGain: GainNode;
  private readonly _sfxBus: GainNode;
  private _masterVolume: number = CONFIG.AUDIO.DEFAULT_MASTER_VOLUME;
  private _muted = false;
  private _noiseBurst: AudioBuffer | null = null;

  public constructor(ctx: AudioContext) {
    this._ctx = ctx;
    this._masterGain = ctx.createGain();
    this._masterGain.connect(ctx.destination);
    this._sfxBus = ctx.createGain();
    this._sfxBus.gain.value = CONFIG.AUDIO.SFX_BUS_HEADROOM;
    this._sfxBus.connect(this._masterGain);
    this._applyEffectiveGain();
  }

  /** Connect quantized SFX and procedural cues here (includes `CONFIG.AUDIO.SFX_BUS_HEADROOM`). */
  public get outputNode(): AudioNode {
    return this._sfxBus;
  }

  /**
   * Purpose: attach background music after the SFX headroom stage so BGM level is independent of gameplay boost.
   * Inputs assumptions: caller owns decoded music chain; connects output of that chain here (not to `outputNode`).
   * Outputs contract: same mute/master path as SFX (`_sfxBus` also feeds this node’s input).
   * Side effects: none by read; mixing occurs when sources connect.
   * Failure modes: none.
   * Security notes: same as overall Web Audio graph.
   */
  public get masterInputNode(): AudioNode {
    return this._masterGain;
  }

  public get state(): AudioDirectorState {
    const effectiveGain = this._muted ? 0 : this._masterVolume;
    return {
      muted: this._muted,
      masterVolume: this._masterVolume,
      effectiveGain,
    };
  }

  public setMuted(nextMuted: boolean): void {
    this._muted = Boolean(nextMuted);
    this._applyEffectiveGain();
  }

  public setMasterVolume(nextVolume: number): void {
    this._masterVolume = clamp01(nextVolume);
    this._applyEffectiveGain();
  }

  public tryScheduleDeflectionCue(audioRelNow: number): void {
    void audioRelNow;
    this._tryScheduleNoiseBurst(CONFIG.AUDIO.DEFLECTION_NOISE_GAIN, 0.045);
    this._tryScheduleCue(
      "deflection",
      audioRelNow,
      CONFIG.AUDIO.DEFLECTION_DURATION_SEC,
    );
  }

  public trySchedulePlanetImpactCue(audioRelNow: number): void {
    this._tryScheduleNoiseBurst(CONFIG.AUDIO.IMPACT_GAIN * 0.55, 0.06);
    this._tryScheduleCue(
      "impact",
      audioRelNow,
      CONFIG.AUDIO.IMPACT_DURATION_SEC,
    );
  }

  public tryScheduleShatterCue(audioRelNow: number): void {
    this._tryScheduleNoiseBurst(CONFIG.AUDIO.SHATTER_GAIN * 0.5, 0.14);
    this._tryScheduleCue(
      "shatter",
      audioRelNow,
      CONFIG.AUDIO.SHATTER_DURATION_SEC,
    );
  }

  public tryScheduleHeartbeatCue(audioRelNow: number): void {
    this._tryScheduleCue(
      "heartbeat",
      audioRelNow,
      CONFIG.AUDIO.HEARTBEAT_DURATION_SEC,
    );
  }

  public dispose(): void {
    try {
      this._sfxBus.disconnect();
      this._masterGain.disconnect();
    } catch {
      /* ignore */
    }
  }

  private _applyEffectiveGain(): void {
    this._masterGain.gain.value = this._muted ? 0 : this._masterVolume;
  }

  private _noiseBuffer(): AudioBuffer {
    if (this._noiseBurst === null) {
      this._noiseBurst = buildNoiseBurstBuffer(this._ctx, 0.2);
    }
    return this._noiseBurst;
  }

  /**
   * Purpose: one-shot filtered noise for impact/explosion body without loading assets.
   * Inputs assumptions: context timeline valid; peakGain in linear 0..1 range.
   * Outputs contract: schedules BufferSource into SFX bus; no-op if scheduling throws.
   */
  private _tryScheduleNoiseBurst(peakGain: number, durationSec: number): void {
    if (!Number.isFinite(peakGain) || peakGain <= 0) {
      return;
    }
    const acNow = this._ctx.currentTime;
    const when = Number.isFinite(acNow) ? acNow : 0;
    const g = this._ctx.createGain();
    const src = this._ctx.createBufferSource();
    src.buffer = this._noiseBuffer();
    const end = when + Math.max(0.02, durationSec);
    src.connect(g);
    g.connect(this._sfxBus);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(Math.min(1, peakGain), when + 0.004);
    g.gain.linearRampToValueAtTime(0.0001, end);
    try {
      src.start(when, 0, end - when);
    } catch {
      src.disconnect();
      g.disconnect();
      return;
    }
    src.onended = (): void => {
      src.disconnect();
      g.disconnect();
    };
  }

  private _tryScheduleCue(
    kind: AudioCueKind,
    audioRelNow: number,
    durationSec: number,
  ): void {
    if (!Number.isFinite(audioRelNow) || audioRelNow < 0) {
      return;
    }
    const acNow = this._ctx.currentTime;
    const when = Number.isFinite(acNow) ? acNow : 0;
    const cueGain = this._ctx.createGain();
    const osc = this._ctx.createOscillator();
    cueGain.gain.value = 0;
    osc.type = pickOscillator(kind);
    osc.frequency.value = pickFrequencyHz(kind, audioRelNow);
    osc.connect(cueGain);
    cueGain.connect(this._sfxBus);
    const peak = pickCueGain(kind);
    const attackEnd = when + 0.006;
    const releaseEnd = when + Math.max(durationSec, 0.014);
    cueGain.gain.setValueAtTime(0.0001, when);
    cueGain.gain.linearRampToValueAtTime(peak, attackEnd);
    cueGain.gain.linearRampToValueAtTime(0.0001, releaseEnd);
    try {
      osc.start(when);
      osc.stop(releaseEnd);
    } catch {
      osc.disconnect();
      cueGain.disconnect();
      return;
    }
    osc.onended = (): void => {
      osc.disconnect();
      cueGain.disconnect();
    };
  }
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) {
    return CONFIG.AUDIO.DEFAULT_MASTER_VOLUME;
  }
  return Math.max(
    CONFIG.AUDIO.MASTER_VOLUME_MIN,
    Math.min(CONFIG.AUDIO.MASTER_VOLUME_MAX, v),
  );
}

function pickOscillator(kind: AudioCueKind): OscillatorType {
  if (kind === "shatter") {
    return "sawtooth";
  }
  if (kind === "impact") {
    return "triangle";
  }
  return "sine";
}

function pickFrequencyHz(kind: AudioCueKind, audioRelNow: number): number {
  if (kind === "heartbeat") {
    return CONFIG.AUDIO.HEARTBEAT_FREQUENCY_HZ;
  }
  if (kind === "impact") {
    return 72;
  }
  if (kind === "shatter") {
    return 55;
  }
  const bpm = CONFIG.RHYTHM.BPM;
  const beatIndex = Math.floor(audioRelNow * (bpm / 60));
  const offsets = CONFIG.QUANTIZED_SFX.PITCH_SEMITONE_OFFSETS;
  const deg = ((beatIndex % offsets.length) + offsets.length) % offsets.length;
  const semitone = offsets[deg] ?? 0;
  return CONFIG.QUANTIZED_SFX.BASE_FREQUENCY_HZ * Math.pow(2, semitone / 12);
}

function pickCueGain(kind: AudioCueKind): number {
  if (kind === "heartbeat") {
    return CONFIG.AUDIO.HEARTBEAT_GAIN;
  }
  if (kind === "impact") {
    return CONFIG.AUDIO.IMPACT_GAIN;
  }
  if (kind === "shatter") {
    return CONFIG.AUDIO.SHATTER_GAIN;
  }
  return CONFIG.AUDIO.DEFLECTION_GAIN;
}
