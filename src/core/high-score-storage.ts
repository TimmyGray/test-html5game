import { CONFIG } from "../config/config.js";

/** Narrow storage surface for tests and SSR guards. */
export type HighScoreStorage = Pick<Storage, "getItem" | "setItem">;

/**
 * Purpose: Read persisted best deflection score for UI and comparisons (Story 4.3).
 * Inputs: optional `storage` (defaults to `localStorage` in browser); missing/throws → safe path.
 * Outputs: non-negative integer; corrupt/missing entries yield `0`.
 * Side effects: read-only unless `getItem` mutates (not expected).
 * Failure modes: invalid JSON, wrong schema, or non-numeric `best` → `0`.
 * Security: local-only string; never executed.
 */
export function readStoredHighScore(
  storage: HighScoreStorage | undefined = getDefaultStorage(),
): number {
  const key = CONFIG.PERSISTENCE.HIGH_SCORE_LOCAL_STORAGE_KEY;
  let raw: string | null = null;
  try {
    raw = storage?.getItem(key) ?? null;
  } catch {
    return 0;
  }
  return parseStoredBest(raw);
}

/**
 * Purpose: Persist a new personal best when a session ends, if `sessionScore` beats storage.
 * Inputs: `sessionScore` should match session total (integer-ish); `storage` injectable for tests.
 * Outputs: `{ previousBest, storedBest, beatPersonalBest }` for UI copy.
 * Side effects: may `setItem` JSON `{ v, best }` under configured key.
 * Failure modes: write throws (quota/private mode) → returns previous best, no throw.
 * Security: clamps to non-negative integers; no HTML/script in stored payload.
 */
export function updateHighScoreIfBeat(
  sessionScore: number,
  storage: HighScoreStorage | undefined = getDefaultStorage(),
): {
  previousBest: number;
  storedBest: number;
  beatPersonalBest: boolean;
} {
  const safeScore = sanitizeSessionScore(sessionScore);
  const key = CONFIG.PERSISTENCE.HIGH_SCORE_LOCAL_STORAGE_KEY;
  let raw: string | null = null;
  try {
    raw = storage?.getItem(key) ?? null;
  } catch {
    raw = null;
  }
  const previousBest = parseStoredBest(raw);
  if (safeScore <= previousBest) {
    return {
      previousBest,
      storedBest: previousBest,
      beatPersonalBest: false,
    };
  }
  const payload = JSON.stringify({
    v: CONFIG.PERSISTENCE.HIGH_SCORE_SCHEMA_VERSION,
    best: safeScore,
  });
  try {
    storage?.setItem(key, payload);
  } catch {
    return {
      previousBest,
      storedBest: previousBest,
      beatPersonalBest: false,
    };
  }
  return {
    previousBest,
    storedBest: safeScore,
    beatPersonalBest: true,
  };
}

function getDefaultStorage(): HighScoreStorage | undefined {
  if (typeof globalThis === "undefined") {
    return undefined;
  }
  const ls = (globalThis as unknown as { localStorage?: HighScoreStorage })
    .localStorage;
  return ls;
}

function sanitizeSessionScore(sessionScore: number): number {
  if (!Number.isFinite(sessionScore) || sessionScore < 0) {
    return 0;
  }
  return Math.floor(sessionScore);
}

function parseStoredBest(raw: string | null): number {
  if (raw === null || raw === "") {
    return 0;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "v" in parsed &&
      "best" in parsed
    ) {
      const v = (parsed as { v: unknown }).v;
      if (v !== CONFIG.PERSISTENCE.HIGH_SCORE_SCHEMA_VERSION) {
        return 0;
      }
      const best = Number((parsed as { best: unknown }).best);
      if (Number.isFinite(best) && best >= 0) {
        return Math.floor(best);
      }
    }
  } catch {
    /* fall through */
  }
  const legacy = Number.parseInt(raw, 10);
  if (Number.isFinite(legacy) && legacy >= 0) {
    return Math.floor(legacy);
  }
  return 0;
}
