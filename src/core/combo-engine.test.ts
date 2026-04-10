import { describe, it, expect } from "vitest";
import { ComboTracker, comboMultiplierFromStreak } from "./combo-engine.js";

const STEPS = Object.freeze([2, 4, 8, 16]);

describe("comboMultiplierFromStreak", () => {
  it("returns 1 for non-positive streak", () => {
    expect(comboMultiplierFromStreak(0, STEPS)).toBe(1);
    expect(comboMultiplierFromStreak(-3, STEPS)).toBe(1);
  });

  it("maps streaks to configured steps", () => {
    expect(comboMultiplierFromStreak(1, STEPS)).toBe(2);
    expect(comboMultiplierFromStreak(2, STEPS)).toBe(4);
    expect(comboMultiplierFromStreak(3, STEPS)).toBe(8);
    expect(comboMultiplierFromStreak(4, STEPS)).toBe(16);
  });

  it("caps at the last configured multiplier", () => {
    expect(comboMultiplierFromStreak(10, STEPS)).toBe(16);
  });

  it("returns 1 when multiplier list is empty", () => {
    expect(comboMultiplierFromStreak(3, [])).toBe(1);
  });
});

describe("ComboTracker", () => {
  it("increments x1 → x2 → x4 → x8 on successive hits without reset", () => {
    const c = new ComboTracker(STEPS);
    expect(c.notifySuccessfulDeflection()).toEqual({
      consecutiveSuccessfulHits: 1,
      multiplier: 2,
    });
    expect(c.notifySuccessfulDeflection()).toEqual({
      consecutiveSuccessfulHits: 2,
      multiplier: 4,
    });
    expect(c.notifySuccessfulDeflection()).toEqual({
      consecutiveSuccessfulHits: 3,
      multiplier: 8,
    });
  });

  it("resets to x1 immediately on notifyReset after streak", () => {
    const c = new ComboTracker(STEPS);
    c.notifySuccessfulDeflection();
    c.notifySuccessfulDeflection();
    expect(c.notifyReset()).toEqual({
      consecutiveSuccessfulHits: 0,
      multiplier: 1,
    });
    expect(c.getMultiplier()).toBe(1);
    expect(c.notifyReset()).toBeNull();
  });

  it("notifyReset is a no-op when already at baseline", () => {
    const c = new ComboTracker(STEPS);
    expect(c.notifyReset()).toBeNull();
  });

  it("handles rapid hit then miss ordering like gameplay queue", () => {
    const c = new ComboTracker(STEPS);
    c.notifySuccessfulDeflection();
    c.notifySuccessfulDeflection();
    expect(c.getMultiplier()).toBe(4);
    expect(c.notifyReset()).not.toBeNull();
    expect(c.getMultiplier()).toBe(1);
    const afterMissHit = c.notifySuccessfulDeflection();
    expect(afterMissHit).not.toBeNull();
    expect(afterMissHit!.multiplier).toBe(2);
    expect(afterMissHit!.consecutiveSuccessfulHits).toBe(1);
  });

  it("handles damage then hit in same conceptual frame: reset then increment", () => {
    const c = new ComboTracker(STEPS);
    c.notifySuccessfulDeflection();
    c.notifySuccessfulDeflection();
    expect(c.notifyReset()).toEqual({
      consecutiveSuccessfulHits: 0,
      multiplier: 1,
    });
    expect(c.notifySuccessfulDeflection()!.multiplier).toBe(2);
  });

  it("returns null when streak grows but multiplier stays at cap", () => {
    const c = new ComboTracker(STEPS);
    for (let i = 0; i < 4; i++) {
      expect(c.notifySuccessfulDeflection()).not.toBeNull();
    }
    expect(c.getMultiplier()).toBe(16);
    expect(c.consecutiveSuccessfulHits).toBe(4);
    expect(c.notifySuccessfulDeflection()).toBeNull();
    expect(c.consecutiveSuccessfulHits).toBe(5);
    expect(c.getMultiplier()).toBe(16);
  });

  it("resetSession clears streak without emitting", () => {
    const c = new ComboTracker(STEPS);
    c.notifySuccessfulDeflection();
    expect(c.getMultiplier()).toBe(2);
    c.resetSession();
    expect(c.getMultiplier()).toBe(1);
    expect(c.consecutiveSuccessfulHits).toBe(0);
  });
});
