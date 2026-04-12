import { describe, expect, it, vi } from "vitest";
import { AudioDirector } from "./audio-director.js";
import { CONFIG } from "../config/config.js";

type MockGainNode = GainNode & {
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
};

function makeAudioContext(state: AudioContextState = "running"): AudioContext {
  const createGain = vi.fn(() => {
    const gainValue = {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    };
    return {
      gain: gainValue,
      connect: vi.fn(),
      disconnect: vi.fn(),
    } as unknown as GainNode;
  });
  const createOscillator = vi.fn(() => {
    return {
      type: "sine" as OscillatorType,
      frequency: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null as (() => void) | null,
    } as unknown as OscillatorNode;
  });
  const createBufferSource = vi.fn(() => {
    return {
      buffer: null as AudioBuffer | null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null as (() => void) | null,
    } as unknown as AudioBufferSourceNode;
  });
  const createBuffer = vi.fn(
    (channels: number, length: number, sampleRate: number) => {
      void channels;
      void sampleRate;
      return {
        getChannelData: () => new Float32Array(length),
      } as unknown as AudioBuffer;
    },
  );
  return {
    state,
    currentTime: 24,
    destination: {} as AudioDestinationNode,
    createGain,
    createOscillator,
    createBuffer,
    createBufferSource,
  } as unknown as AudioContext;
}

describe("AudioDirector", () => {
  it("connects master gain to destination and applies default gain", () => {
    const ctx = makeAudioContext("running");
    const director = new AudioDirector(ctx);
    const masterGain = (ctx.createGain as ReturnType<typeof vi.fn>).mock
      .results[0]?.value as MockGainNode;
    expect(masterGain.connect).toHaveBeenCalledWith(ctx.destination);
    expect(director.masterInputNode).toBe(masterGain);
    expect(masterGain.gain.value).toBeCloseTo(
      CONFIG.AUDIO.DEFAULT_MASTER_VOLUME,
      6,
    );
    director.dispose();
  });

  it("clamps master volume and supports mute toggle state", () => {
    const ctx = makeAudioContext("running");
    const director = new AudioDirector(ctx);
    director.setMasterVolume(2);
    expect(director.state.masterVolume).toBe(1);
    director.setMuted(true);
    expect(director.state.effectiveGain).toBe(0);
    director.setMuted(false);
    expect(director.state.effectiveGain).toBe(1);
    director.dispose();
  });

  it("schedules deflection cue even when context is suspended (plays after resume)", () => {
    const ctx = makeAudioContext("suspended");
    const director = new AudioDirector(ctx);
    director.tryScheduleDeflectionCue(1);
    expect(ctx.createOscillator).toHaveBeenCalled();
    director.dispose();
  });

  it("schedules routed heartbeat cue when context is running", () => {
    const ctx = makeAudioContext("running");
    const director = new AudioDirector(ctx);
    director.tryScheduleHeartbeatCue(2.5);
    expect(ctx.createOscillator).toHaveBeenCalledOnce();
    const osc = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock
      .results[0]?.value as OscillatorNode;
    expect(osc.frequency.value).toBe(CONFIG.AUDIO.HEARTBEAT_FREQUENCY_HZ);
    director.dispose();
  });
});
