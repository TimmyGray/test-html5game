import { describe, expect, it } from "vitest";
import { estimateTempoFromPcm } from "./background-music.js";

function synthPulseTrain(
  bpm: number,
  seconds: number,
  sampleRate: number,
): Float32Array {
  const total = Math.floor(seconds * sampleRate);
  const data = new Float32Array(total);
  const interval = Math.floor((60 / bpm) * sampleRate);
  const pulseLen = Math.floor(0.02 * sampleRate);
  for (let i = 0; i < total; i += interval) {
    for (let p = 0; p < pulseLen && i + p < total; p++) {
      const t = p / Math.max(1, pulseLen);
      data[i + p] = (1 - t) * 0.9;
    }
  }
  return data;
}

describe("estimateTempoFromPcm", () => {
  it("detects 120 BPM pulse train", () => {
    const sr = 44100;
    const pcm = synthPulseTrain(120, 18, sr);
    const bpm = estimateTempoFromPcm(pcm, sr, 120);
    expect(bpm).toBeGreaterThanOrEqual(116);
    expect(bpm).toBeLessThanOrEqual(124);
  });

  it("detects 96 BPM pulse train", () => {
    const sr = 44100;
    const pcm = synthPulseTrain(96, 18, sr);
    const bpm = estimateTempoFromPcm(pcm, sr, 120);
    expect(bpm).toBeGreaterThanOrEqual(92);
    expect(bpm).toBeLessThanOrEqual(100);
  });

  it("falls back for tiny buffers", () => {
    const bpm = estimateTempoFromPcm(new Float32Array(256), 44100, 128);
    expect(bpm).toBe(128);
  });
});
