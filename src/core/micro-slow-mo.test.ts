import { describe, it, expect, beforeEach } from "vitest";
import type { Ticker } from "pixi.js";
import { CONFIG } from "../config/config.js";
import { MicroSlowMo } from "./micro-slow-mo.js";
import { SyncClock } from "./sync-clock.js";

function mockTicker(elapsedMS: number, speed: number): Ticker {
  return {
    elapsedMS,
    deltaMS: elapsedMS * speed,
    speed,
  } as Ticker;
}

describe("MicroSlowMo", () => {
  beforeEach(() => {
    SyncClock.resetForTesting();
    MicroSlowMo.resetForTesting();
  });

  it("sets time scale during the window and restores to 1 after duration", () => {
    const clock = SyncClock.instance;
    let audioT = 10;
    const ctx = {
      get currentTime() {
        return audioT;
      },
    } as AudioContext;
    clock.calibrate(ctx);
    const ms = MicroSlowMo.instance;
    ms.notifyHit(clock);
    expect(clock.timeScale).toBe(CONFIG.MICRO_SLOW_MO.TIME_SCALE);

    const dur = CONFIG.MICRO_SLOW_MO.DURATION_SEC;
    audioT += dur + 0.001;
    ms.tick(clock);
    expect(clock.timeScale).toBe(1);
  });

  it("extends the window on rapid successive hits", () => {
    const clock = SyncClock.instance;
    let audioT = 5;
    const ctx = {
      get currentTime() {
        return audioT;
      },
    } as AudioContext;
    clock.calibrate(ctx);
    const ms = MicroSlowMo.instance;
    const dur = CONFIG.MICRO_SLOW_MO.DURATION_SEC;

    ms.notifyHit(clock);
    const endAfterFirst = ms.getWindowEndForTesting();
    audioT += dur * 0.5;
    ms.notifyHit(clock);
    const endAfterSecond = ms.getWindowEndForTesting();
    expect(endAfterSecond).toBeGreaterThan(endAfterFirst);
    expect(endAfterSecond).toBeGreaterThanOrEqual(
      clock.getAbsoluteTime() + dur - 1e-9,
    );
  });

  it("restores timescale even when audio time is stalled", () => {
    const clock = SyncClock.instance;
    const audioT = 2;
    const ctx = {
      get currentTime() {
        return audioT;
      },
    } as AudioContext;
    clock.calibrate(ctx);
    const ms = MicroSlowMo.instance;
    ms.notifyHit(clock);
    expect(clock.timeScale).toBe(CONFIG.MICRO_SLOW_MO.TIME_SCALE);

    const frameMs = 1000 / 60;
    for (let i = 0; i < 10; i++) {
      clock.sync(mockTicker(frameMs, 1));
      ms.tick(clock);
    }
    expect(ms.getRemainingForTesting()).toBe(0);
    expect(clock.timeScale).toBe(1);
  });
});
