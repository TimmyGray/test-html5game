import { describe, expect, it, vi } from "vitest";
import { CONFIG } from "../config/config.js";
import {
  QuantizedSfxPlayer,
  computeQuantizedStartRel,
  isPerfectSmashFlick,
  pickQuantizedPlaybackRate,
  subdivisionDurationSec,
} from "./quantized-sfx.js";
import { createFlickIntentFromLocals } from "../systems/input/flick-input-manager.js";

describe("subdivisionDurationSec", () => {
  it("is one sixteenth of a beat at 120 BPM", () => {
    expect(subdivisionDurationSec(120, 16)).toBeCloseTo(60 / (120 * 16), 9);
    expect(subdivisionDurationSec(120, 16)).toBeCloseTo(0.03125, 9);
  });
});

describe("computeQuantizedStartRel", () => {
  const bpm = 120;
  const sub = 16;
  const subLen = 60 / (bpm * sub);

  it("snaps to nearest sixteenth boundary (half-up tie)", () => {
    expect(computeQuantizedStartRel(0, bpm, sub, 1e-4)).toBe(0);
    expect(computeQuantizedStartRel(subLen * 0.5, bpm, sub, 1e-4)).toBeCloseTo(
      subLen,
      9,
    );
    expect(
      computeQuantizedStartRel(subLen * 0.5 - 1e-12, bpm, sub, 1e-4),
    ).toBeCloseTo(subLen, 9);
  });

  it("advances to next subdivision when rounded quantum is in the past", () => {
    const t = subLen * 0.05;
    expect(computeQuantizedStartRel(t, bpm, sub, 1e-4)).toBeCloseTo(subLen, 9);
  });

  it("leaves future nearest grid unchanged", () => {
    const t = subLen * 0.9;
    expect(computeQuantizedStartRel(t, bpm, sub, 1e-4)).toBeCloseTo(subLen, 9);
  });
});

describe("pickQuantizedPlaybackRate", () => {
  it("cycles pentatonic offsets by beat index at 120 BPM", () => {
    const bpm = 120;
    const offs = CONFIG.QUANTIZED_SFX.PITCH_SEMITONE_OFFSETS;
    expect(pickQuantizedPlaybackRate(0, bpm, offs)).toBeCloseTo(1, 6);
    const tBeat1 = 0.5;
    expect(pickQuantizedPlaybackRate(tBeat1, bpm, offs)).toBeCloseTo(
      Math.pow(2, offs[1]! / 12),
      6,
    );
  });
});

describe("isPerfectSmashFlick", () => {
  const min = CONFIG.QUANTIZED_SFX.PERFECT_SMASH_MIN_WEIGHTED_SPEED_PX;

  it("accepts high weighted speed", () => {
    const hi = createFlickIntentFromLocals(
      0,
      0,
      1,
      1,
      1,
      0,
      min + 1,
      1,
      "mouse",
      0,
    );
    expect(isPerfectSmashFlick(hi, min)).toBe(true);
  });

  it("rejects below threshold", () => {
    const lo = createFlickIntentFromLocals(
      0,
      0,
      1,
      1,
      1,
      0,
      min - 1,
      1,
      "mouse",
      0,
    );
    expect(isPerfectSmashFlick(lo, min)).toBe(false);
  });
});

describe("QuantizedSfxPlayer", () => {
  function perfectFlick(): ReturnType<typeof createFlickIntentFromLocals> {
    return createFlickIntentFromLocals(
      0,
      0,
      1,
      1,
      1,
      0,
      CONFIG.QUANTIZED_SFX.PERFECT_SMASH_MIN_WEIGHTED_SPEED_PX + 10,
      1,
      "mouse",
      0,
    );
  }

  it("does not schedule when context is not running", () => {
    const ctx = {
      state: "suspended",
      sampleRate: 48000,
      currentTime: 10,
      createBuffer: (channels: number, length: number, sampleRate: number) => {
        void channels;
        void sampleRate;
        return {
          getChannelData: () => new Float32Array(length),
        } as unknown as AudioBuffer;
      },
      createBufferSource: vi.fn(),
      createGain: () =>
        ({
          gain: { value: 1 },
          connect: vi.fn(),
          disconnect: vi.fn(),
        }) as unknown as GainNode,
      destination: {} as AudioDestinationNode,
    } as unknown as AudioContext;

    const p = new QuantizedSfxPlayer(ctx);
    p.trySchedulePerfectSmash(perfectFlick(), 1);
    expect(ctx.createBufferSource).not.toHaveBeenCalled();
    p.dispose();
  });

  it("does not schedule when audio timeline is non-finite or negative", () => {
    const createBufferSource = vi.fn();
    const ctx = {
      state: "running",
      sampleRate: 48000,
      currentTime: 50,
      createBuffer: (channels: number, length: number, sampleRate: number) => {
        void channels;
        void sampleRate;
        return {
          getChannelData: () => new Float32Array(length),
        } as unknown as AudioBuffer;
      },
      createBufferSource,
      createGain: () =>
        ({
          gain: { value: 1 },
          connect: vi.fn(),
          disconnect: vi.fn(),
        }) as unknown as GainNode,
      destination: {} as AudioDestinationNode,
    } as unknown as AudioContext;

    const p = new QuantizedSfxPlayer(ctx);
    p.trySchedulePerfectSmash(perfectFlick(), Number.NaN);
    p.trySchedulePerfectSmash(perfectFlick(), -1);
    expect(createBufferSource).not.toHaveBeenCalled();
    p.dispose();
  });

  it("schedules BufferSource.start(when) on running context with quantized when and rate", () => {
    const acNow = 100;
    const audioRel = 0.2;
    const q = CONFIG.QUANTIZED_SFX;
    const bpm = CONFIG.RHYTHM.BPM;
    const startRel = computeQuantizedStartRel(
      audioRel,
      bpm,
      q.SUBDIVISIONS_PER_BEAT,
      q.SCHEDULE_TOLERANCE_SEC,
    );
    const expectedRate = pickQuantizedPlaybackRate(
      startRel,
      bpm,
      q.PITCH_SEMITONE_OFFSETS,
    );
    const expectedWhen = Math.max(acNow + (startRel - audioRel), acNow);

    const startSpy = vi.fn();
    const mockSrc = {
      buffer: null as AudioBuffer | null,
      playbackRate: { value: 1 },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: startSpy,
      onended: null as (() => void) | null,
    };
    const createBufferSource = vi.fn(
      () => mockSrc as unknown as AudioBufferSourceNode,
    );

    const ctx = {
      state: "running" as AudioContextState,
      sampleRate: 48000,
      currentTime: acNow,
      createBuffer: (channels: number, length: number, sampleRate: number) => {
        void channels;
        void sampleRate;
        return {
          getChannelData: () => new Float32Array(length),
        } as unknown as AudioBuffer;
      },
      createBufferSource,
      createGain: () =>
        ({
          gain: { value: 1 },
          connect: vi.fn(),
          disconnect: vi.fn(),
        }) as unknown as GainNode,
      destination: {} as AudioDestinationNode,
    } as unknown as AudioContext;

    const p = new QuantizedSfxPlayer(ctx);
    p.trySchedulePerfectSmash(perfectFlick(), audioRel);

    expect(createBufferSource).toHaveBeenCalledOnce();
    expect(startSpy).toHaveBeenCalledWith(expectedWhen);
    expect(mockSrc.playbackRate.value).toBeCloseTo(expectedRate, 5);
    p.dispose();
  });
});
