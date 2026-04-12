import { CONFIG } from "../config/config.js";
import { beatsPerSecond } from "./beat-phase.js";
import type { FlickIntent } from "../systems/input/flick-intent.js";

/** Length of one rhythmic subdivision in seconds (e.g. 1/16 note at BPM). */
export function subdivisionDurationSec(
  bpm: number,
  subdivisionsPerBeat: number,
): number {
  const spb = Math.max(1, subdivisionsPerBeat);
  return 60 / (bpm * spb);
}

/**
 * Nearest grid time on the SyncClock-relative timeline, never before `audioNowRel`
 * by more than `toleranceSec` (schedule next subdivision if the rounded quantum was missed).
 * Tie-break at exact midpoints: rounds half-up (0.5 → next integer index).
 */
export function computeQuantizedStartRel(
  audioNowRel: number,
  bpm: number,
  subdivisionsPerBeat: number,
  toleranceSec: number,
): number {
  if (!(audioNowRel >= 0) || !Number.isFinite(audioNowRel)) {
    return 0;
  }
  const subLen = subdivisionDurationSec(bpm, subdivisionsPerBeat);
  if (!(subLen > 0) || !Number.isFinite(subLen)) {
    return audioNowRel;
  }
  const ratio = audioNowRel / subLen;
  let k = Math.floor(ratio + 0.5);
  let t = k * subLen;
  const tol = Math.max(0, toleranceSec);
  if (t + tol < audioNowRel) {
    k = Math.floor(ratio) + 1;
    t = k * subLen;
  }
  return t;
}

/**
 * Playback rate for quantized pitch: maps **beat index** → scale degree (deterministic).
 * The procedural buffer uses `CONFIG.QUANTIZED_SFX.BASE_FREQUENCY_HZ`; if you swap in a
 * sampled one-shot, add a separate base-semitone (or source-rate) argument so “intent pitch”
 * can be snapped into this key.
 */
export function pickQuantizedPlaybackRate(
  audioTimeRelSec: number,
  bpm: number,
  semitoneOffsets: readonly number[],
): number {
  if (semitoneOffsets.length === 0) {
    return 1;
  }
  const bps = beatsPerSecond(bpm);
  const beatIdx = Math.floor(audioTimeRelSec * bps);
  const deg =
    ((beatIdx % semitoneOffsets.length) + semitoneOffsets.length) %
    semitoneOffsets.length;
  const semi = semitoneOffsets[deg]!;
  return Math.pow(2, semi / 12);
}

/** GDD-aligned Perfect Smash gate: high-intensity weighted flick only. */
export function isPerfectSmashFlick(
  intent: FlickIntent,
  minWeightedSpeed: number,
): boolean {
  return intent.weightMagnitude >= minWeightedSpeed;
}

function buildOneShotBuffer(
  ctx: AudioContext,
  durationSec: number,
  frequencyHz: number,
  amplitude: number,
): AudioBuffer {
  const rate = ctx.sampleRate;
  const frames = Math.max(1, Math.floor(durationSec * rate));
  const buf = ctx.createBuffer(1, frames, rate);
  const data = buf.getChannelData(0);
  const twoPiF = (2 * Math.PI * frequencyHz) / rate;
  const amp = Math.min(1, Math.max(0, amplitude));
  for (let i = 0; i < frames; i++) {
    const env = 1 - i / frames;
    data[i] = amp * env * Math.sin(twoPiF * i);
  }
  return buf;
}

/**
 * Schedules one-shot quantized SFX on the Web Audio clock (no setTimeout).
 * One AudioBufferSourceNode per trigger (required by the API for replay).
 *
 * Manual QA: after `AudioContext.resume()` from a gesture, confirm hits feel on-grid in WebGPU
 * and again with WebGL fallback (`npm run dev` / renderer fallback path).
 */
export class QuantizedSfxPlayer {
  private readonly _ctx: AudioContext;
  private readonly _buffer: AudioBuffer;
  private readonly _gain: GainNode;

  /**
   * Purpose: create quantized hit SFX player routed through caller-provided output bus.
   * Inputs assumptions: valid AudioContext and an output node connected to destination path.
   * Outputs contract: internal gain set to effect-level master and connected to output node.
   * Side effects: allocates one reusable one-shot buffer and one GainNode.
   * Failure modes: if output node is disconnected externally, scheduling is silent but safe.
   */
  public constructor(audioContext: AudioContext, outputNode?: AudioNode) {
    this._ctx = audioContext;
    const q = CONFIG.QUANTIZED_SFX;
    this._buffer = buildOneShotBuffer(
      audioContext,
      q.BUFFER_DURATION_SEC,
      q.BASE_FREQUENCY_HZ,
      q.BUFFER_AMPLITUDE,
    );
    this._gain = audioContext.createGain();
    this._gain.gain.value = q.MASTER_GAIN;
    this._gain.connect(outputNode ?? audioContext.destination);
  }

  /**
   * Perfect-smash-only: safe no-op when gated out or timeline invalid; may schedule while
   * context is suspended so playback begins after resume.
   */
  public trySchedulePerfectSmash(
    flick: FlickIntent,
    audioRelNow: number,
  ): void {
    const q = CONFIG.QUANTIZED_SFX;
    if (!isPerfectSmashFlick(flick, q.PERFECT_SMASH_MIN_WEIGHTED_SPEED_PX)) {
      return;
    }
    if (!Number.isFinite(audioRelNow) || audioRelNow < 0) {
      return;
    }
    const bpm = CONFIG.RHYTHM.BPM;
    const startRel = computeQuantizedStartRel(
      audioRelNow,
      bpm,
      q.SUBDIVISIONS_PER_BEAT,
      q.SCHEDULE_TOLERANCE_SEC,
    );
    const rate = pickQuantizedPlaybackRate(
      startRel,
      bpm,
      q.PITCH_SEMITONE_OFFSETS,
    );
    const acNow = this._ctx.currentTime;
    const whenRaw = acNow + (startRel - audioRelNow);
    const when = Number.isFinite(whenRaw) ? Math.max(whenRaw, acNow) : acNow;
    const src = this._ctx.createBufferSource();
    src.buffer = this._buffer;
    src.playbackRate.value = rate;
    src.connect(this._gain);
    try {
      src.start(when);
    } catch {
      src.disconnect();
    }
    src.onended = (): void => {
      src.disconnect();
    };
  }

  public dispose(): void {
    try {
      this._gain.disconnect();
    } catch {
      /* ignore */
    }
  }
}
