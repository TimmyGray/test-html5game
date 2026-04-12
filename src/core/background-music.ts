import { CONFIG } from "../config/config.js";

const TEMPO_MIN_BPM = 70;
const TEMPO_MAX_BPM = 180;
const KICK_MAX_PULSE_BOOST = 0.3;

export type BackgroundMusicState = {
  detectedBpm: number;
  kickPulseBoost: number;
};

/**
 * Purpose: estimate musical tempo from PCM samples to drive game heartbeat timing.
 * Inputs assumptions: mono PCM data and valid sampleRate from decoded music buffer.
 * Outputs contract: returns bpm clamped to a playable range for pulse synchronization.
 * Failure modes: when peak analysis is inconclusive, returns `fallbackBpm`.
 */
export function estimateTempoFromPcm(
  samples: Float32Array,
  sampleRate: number,
  fallbackBpm: number,
): number {
  if (
    samples.length < 2048 ||
    !Number.isFinite(sampleRate) ||
    sampleRate <= 0
  ) {
    return fallbackBpm;
  }
  const frameSize = 1024;
  const hopSize = 512;
  const energies: number[] = [];
  for (let i = 0; i + frameSize < samples.length; i += hopSize) {
    let energy = 0;
    for (let n = 0; n < frameSize; n++) {
      const v = samples[i + n] ?? 0;
      energy += v * v;
    }
    energies.push(energy / frameSize);
  }
  if (energies.length < 8) {
    return fallbackBpm;
  }
  const sorted = [...energies].sort((a, b) => a - b);
  const threshold =
    sorted[Math.floor(sorted.length * 0.82)] ?? sorted[sorted.length - 1] ?? 0;
  const peaks: number[] = [];
  for (let i = 1; i < energies.length - 1; i++) {
    const e = energies[i] ?? 0;
    if (
      e >= threshold &&
      e > (energies[i - 1] ?? 0) &&
      e >= (energies[i + 1] ?? 0)
    ) {
      peaks.push(i);
    }
  }
  if (peaks.length < 4) {
    return fallbackBpm;
  }

  const histogram = new Map<number, number>();
  for (let i = 0; i < peaks.length - 1; i++) {
    for (let j = i + 1; j < Math.min(i + 9, peaks.length); j++) {
      const intervalFrames = (peaks[j] ?? 0) - (peaks[i] ?? 0);
      if (intervalFrames <= 0) {
        continue;
      }
      const seconds = (intervalFrames * hopSize) / sampleRate;
      if (seconds <= 0) {
        continue;
      }
      const rawBpm = 60 / seconds;
      const normalized = normalizeTempo(rawBpm);
      const key = Math.round(normalized);
      histogram.set(key, (histogram.get(key) ?? 0) + 1);
    }
  }
  let bestBpm = fallbackBpm;
  let bestScore = -1;
  for (const [bpm, score] of histogram.entries()) {
    if (score > bestScore) {
      bestScore = score;
      bestBpm = bpm;
    }
  }
  return normalizeTempo(bestBpm);
}

/**
 * Purpose: own background music playback, tempo detection, and kick pulse extraction.
 * Inputs assumptions: caller provides game `AudioContext` and output node from audio bus.
 * Outputs contract: starts looping decoded music and exposes bpm + kick pulse state.
 * Side effects: creates analyser/source nodes and performs network fetch for audio asset.
 * Failure modes: load/decode failures are swallowed and defaults are preserved.
 */
export class BackgroundMusicDirector {
  private readonly _ctx: AudioContext;
  private readonly _targetOutput: AudioNode;
  private readonly _musicGain: GainNode;
  private readonly _analyser: AnalyserNode;
  private _source: AudioBufferSourceNode | null = null;
  private _detectedBpm = 120;
  private _kickPulseBoost = 0;
  private _kickEnergyAverage = 0;
  private _lastKickAudioTime = -Infinity;
  private readonly _freqScratch: Uint8Array;

  public constructor(
    ctx: AudioContext,
    outputNode: AudioNode,
    fallbackBpm: number,
  ) {
    this._ctx = ctx;
    this._targetOutput = outputNode;
    this._detectedBpm = fallbackBpm;
    this._musicGain = ctx.createGain();
    this._musicGain.gain.value = CONFIG.AUDIO.BGM_GAIN;
    this._analyser = ctx.createAnalyser();
    this._analyser.fftSize = 1024;
    this._analyser.smoothingTimeConstant = 0.82;
    this._freqScratch = new Uint8Array(this._analyser.frequencyBinCount);
    this._musicGain.connect(this._analyser);
    this._analyser.connect(this._targetOutput);
  }

  public get state(): BackgroundMusicState {
    return {
      detectedBpm: this._detectedBpm,
      kickPulseBoost: this._kickPulseBoost,
    };
  }

  public async loadAndPlay(
    trackUrls: string | readonly string[],
  ): Promise<void> {
    const urls = typeof trackUrls === "string" ? [trackUrls] : [...trackUrls];
    for (const url of urls) {
      try {
        const response = await fetch(url);
        const arr = await response.arrayBuffer();
        const decoded = await this._ctx.decodeAudioData(arr.slice(0));
        this._detectedBpm = estimateTempoFromPcm(
          mixToMono(decoded),
          decoded.sampleRate,
          this._detectedBpm,
        );
        this._startLoop(decoded);
        return;
      } catch (error) {
        console.warn(`Background music load failed (${url}):`, error);
      }
    }
  }

  public update(): void {
    this._analyser.getByteFrequencyData(this._freqScratch);
    const nyquist = this._ctx.sampleRate * 0.5;
    const binWidth = nyquist / this._analyser.frequencyBinCount;
    let lowEnergy = 0;
    let bins = 0;
    for (let i = 0; i < this._freqScratch.length; i++) {
      const hz = i * binWidth;
      if (hz > 180) {
        break;
      }
      lowEnergy += this._freqScratch[i] ?? 0;
      bins++;
    }
    const energyNorm = bins > 0 ? lowEnergy / (bins * 255) : 0;
    this._kickEnergyAverage =
      this._kickEnergyAverage * 0.92 + energyNorm * 0.08;
    const audioNow = this._ctx.currentTime;
    if (
      this._ctx.state === "running" &&
      energyNorm > this._kickEnergyAverage * 1.35 &&
      audioNow - this._lastKickAudioTime > 0.11
    ) {
      this._lastKickAudioTime = audioNow;
      this._kickPulseBoost = KICK_MAX_PULSE_BOOST;
    } else {
      this._kickPulseBoost *= 0.86;
      if (this._kickPulseBoost < 0.002) {
        this._kickPulseBoost = 0;
      }
    }
  }

  public dispose(): void {
    if (this._source !== null) {
      try {
        this._source.stop();
      } catch {
        /* ignore */
      }
      this._source.disconnect();
      this._source = null;
    }
    try {
      this._musicGain.disconnect();
      this._analyser.disconnect();
    } catch {
      /* ignore */
    }
  }

  private _startLoop(buffer: AudioBuffer): void {
    if (this._source !== null) {
      try {
        this._source.stop();
      } catch {
        /* ignore */
      }
      this._source.disconnect();
    }
    const src = this._ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(this._musicGain);
    this._source = src;
    if (this._ctx.state === "running") {
      src.start();
      return;
    }
    const startOnResume = (): void => {
      if (this._ctx.state !== "running") {
        return;
      }
      try {
        src.start();
      } catch {
        /* already started */
      }
      window.removeEventListener("pointerdown", startOnResume);
      window.removeEventListener("keydown", startOnResume);
    };
    window.addEventListener("pointerdown", startOnResume);
    window.addEventListener("keydown", startOnResume);
  }
}

function normalizeTempo(rawBpm: number): number {
  if (!Number.isFinite(rawBpm) || rawBpm <= 0) {
    return 120;
  }
  let bpm = rawBpm;
  while (bpm < TEMPO_MIN_BPM) {
    bpm *= 2;
  }
  while (bpm > TEMPO_MAX_BPM) {
    bpm *= 0.5;
  }
  return Math.max(TEMPO_MIN_BPM, Math.min(TEMPO_MAX_BPM, bpm));
}

function mixToMono(buffer: AudioBuffer): Float32Array {
  const channels = Math.max(1, buffer.numberOfChannels);
  const length = buffer.length;
  const mixed = new Float32Array(length);
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) {
      mixed[i] += (data[i] ?? 0) / channels;
    }
  }
  return mixed;
}
