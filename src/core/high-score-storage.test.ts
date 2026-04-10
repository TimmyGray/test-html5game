import { describe, expect, it } from "vitest";
import { CONFIG } from "../config/config.js";
import {
  readStoredHighScore,
  updateHighScoreIfBeat,
} from "./high-score-storage.js";

/** Minimal in-memory Storage for node tests (no DOM). */
function createMemoryStorage(): Pick<Storage, "getItem" | "setItem"> {
  const map = new Map<string, string>();
  return {
    getItem: (key: string): string | null => map.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      map.set(key, value);
    },
  };
}

describe("high-score-storage", () => {
  const key = CONFIG.PERSISTENCE.HIGH_SCORE_LOCAL_STORAGE_KEY;

  it("first run: empty storage reads as 0 and persists a new best", () => {
    const mem = createMemoryStorage();
    expect(readStoredHighScore(mem)).toBe(0);
    const r = updateHighScoreIfBeat(42, mem);
    expect(r.previousBest).toBe(0);
    expect(r.storedBest).toBe(42);
    expect(r.beatPersonalBest).toBe(true);
    expect(readStoredHighScore(mem)).toBe(42);
    expect(mem.getItem(key)).toContain('"best":42');
  });

  it("does not overwrite when session score is lower than stored best", () => {
    const mem = createMemoryStorage();
    mem.setItem(
      key,
      JSON.stringify({
        v: CONFIG.PERSISTENCE.HIGH_SCORE_SCHEMA_VERSION,
        best: 100,
      }),
    );
    const r = updateHighScoreIfBeat(80, mem);
    expect(r.previousBest).toBe(100);
    expect(r.storedBest).toBe(100);
    expect(r.beatPersonalBest).toBe(false);
    expect(mem.getItem(key)).toContain('"best":100');
  });

  it("overwrites when session score exceeds stored best", () => {
    const mem = createMemoryStorage();
    updateHighScoreIfBeat(10, mem);
    const r = updateHighScoreIfBeat(200, mem);
    expect(r.previousBest).toBe(10);
    expect(r.storedBest).toBe(200);
    expect(r.beatPersonalBest).toBe(true);
  });

  it("treats corrupt JSON as 0 and can recover with a valid write", () => {
    const mem = createMemoryStorage();
    mem.setItem(key, "{not-json");
    expect(readStoredHighScore(mem)).toBe(0);
    const r = updateHighScoreIfBeat(5, mem);
    expect(r.storedBest).toBe(5);
    expect(r.beatPersonalBest).toBe(true);
  });

  it("rejects negative or non-finite session scores (no persist bump)", () => {
    const mem = createMemoryStorage();
    expect(updateHighScoreIfBeat(-1, mem).storedBest).toBe(0);
    expect(mem.getItem(key)).toBeNull();
    mem.setItem(
      key,
      JSON.stringify({
        v: CONFIG.PERSISTENCE.HIGH_SCORE_SCHEMA_VERSION,
        best: 50,
      }),
    );
    expect(updateHighScoreIfBeat(Number.NaN, mem).storedBest).toBe(50);
  });

  it("floors fractional scores for stable integer storage", () => {
    const mem = createMemoryStorage();
    updateHighScoreIfBeat(9.7, mem);
    expect(readStoredHighScore(mem)).toBe(9);
  });
});
