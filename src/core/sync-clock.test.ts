import { describe, it, expect, beforeEach } from "vitest";
import type { Ticker } from "pixi.js";
import { SyncClock } from "./sync-clock.js";

function mockTicker(elapsedMS: number, speed: number): Ticker {
  return {
    elapsedMS,
    deltaMS: elapsedMS * speed,
    speed,
  } as Ticker;
}

describe("SyncClock", () => {
  beforeEach(() => {
    SyncClock.resetForTesting();
  });

  it("calibrates so getAbsoluteTime tracks audio since start", () => {
    const clock = SyncClock.instance;
    let audioT = 100;
    const ctx = {
      get currentTime() {
        return audioT;
      },
    } as AudioContext;
    clock.calibrate(ctx);
    expect(clock.getAbsoluteTime()).toBe(0);
    audioT += 2.5;
    expect(clock.getAbsoluteTime()).toBe(2.5);
  });

  it("sync sets ticker speed to align audio delta with wall time", () => {
    const clock = SyncClock.instance;
    let audioT = 0;
    const ctx = {
      get currentTime() {
        return audioT;
      },
    } as AudioContext;
    clock.calibrate(ctx);
    const wallMs = 1000 / 60;
    audioT += wallMs / 1000;
    const ticker = mockTicker(wallMs, 1);
    clock.sync(ticker);
    expect(ticker.speed).toBeCloseTo(1, 5);
  });

  it("falls back to wall-time delta when audio currentTime does not advance", () => {
    const clock = SyncClock.instance;
    const audioT = 1.0;
    const ctx = {
      get currentTime() {
        return audioT;
      },
    } as AudioContext;
    clock.calibrate(ctx);
    const ticker = mockTicker(1000 / 60, 1);
    clock.sync(ticker);
    clock.sync(ticker);
    expect(clock.getDelta()).toBeCloseTo(1000 / 60 / 1000, 6);
  });

  it("getDelta returns last audio delta in seconds", () => {
    const clock = SyncClock.instance;
    let audioT = 0;
    const ctx = {
      get currentTime() {
        return audioT;
      },
    } as AudioContext;
    clock.calibrate(ctx);
    const step = 0.01;
    audioT += step;
    clock.sync(mockTicker(step * 1000, 1));
    expect(clock.getDelta()).toBeCloseTo(step, 6);
  });

  /**
   * Wall clock stays at 60fps while audio advances with sinusoidal skew vs wall —
   * exercises non-1.0 ticker.speed without blowing the 5ms/minute budget.
   */
  it("keeps cumulative drift under 5ms per simulated minute with audio/wall skew", () => {
    const clock = SyncClock.instance;
    let audioT = 0;
    const ctx = {
      get currentTime() {
        return audioT;
      },
    } as AudioContext;
    clock.calibrate(ctx);

    const wallMs = 1000 / 60;
    const frames = 60 * 60;
    let sumDelta = 0;
    for (let i = 0; i < frames; i++) {
      const wallSec = wallMs / 1000;
      const skew = 1 + 0.02 * Math.sin(i * 0.17);
      audioT += wallSec * skew;
      const ticker = mockTicker(wallMs, 1);
      clock.sync(ticker);
      sumDelta += clock.getDelta();
    }

    const absolute = clock.getAbsoluteTime();
    const driftSec = Math.abs(sumDelta - absolute);
    expect(driftSec).toBeLessThan(5 / 1000);
  });

  /**
   * AC: drift between visual ticker integration and audio clock &lt; 5ms per minute.
   * Baseline: one minute at 60fps with perfect audio/wall alignment.
   */
  it("keeps cumulative drift under 5ms per simulated minute (aligned clocks)", () => {
    const clock = SyncClock.instance;
    let audioT = 0;
    const ctx = {
      get currentTime() {
        return audioT;
      },
    } as AudioContext;
    clock.calibrate(ctx);

    const wallMs = 1000 / 60;
    const frames = 60 * 60;
    let sumDelta = 0;
    for (let i = 0; i < frames; i++) {
      audioT += wallMs / 1000;
      const ticker = mockTicker(wallMs, 1);
      clock.sync(ticker);
      sumDelta += clock.getDelta();
    }

    const absolute = clock.getAbsoluteTime();
    const driftSec = Math.abs(sumDelta - absolute);
    expect(driftSec).toBeLessThan(5 / 1000);
  });
});
