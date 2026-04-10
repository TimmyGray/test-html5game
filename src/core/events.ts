import { EventEmitter } from "pixi.js";
import { CONFIG } from "../config/config.js";
import type { ComboChangedPayload } from "./combo-engine.js";
import type { FlickIntent } from "../systems/input/flick-intent.js";

/** System-wide event bus — all gameplay systems emit/listen here */
export const gameEvents = new EventEmitter();

/** Event name strings (single source of truth; use with `gameEvents`) */
export const EVENTS = CONFIG.EVENTS;

/** Payload for {@link EVENTS.ASTEROID_HIT} — confirmed ray hit / deflection */
export type AsteroidHitPayload = {
  debrisId: string;
  hitX: number;
  hitY: number;
  tFlick: number;
  tDebris: number;
  flickIntent: FlickIntent;
  fragmentKind: "normal" | "gold";
  /** Metallic VFX + score multiplier tier (Story 3.3) */
  goldHighVelocityReward: boolean;
  /** Points for this hit after combo × gold bonus */
  scoreAward: number;
};

/** Payload for {@link EVENTS.SCORE_AWARDED} */
export type ScoreAwardedPayload = {
  delta: number;
  fragmentKind: "normal" | "gold";
  goldHighVelocityReward: boolean;
};

/** Story 3.4: session intensity stage (time thresholds). */
export type IntensityStageChangedPayload = {
  stage: "arrival" | "flow" | "climax";
  elapsedSessionSec: number;
};

/** Story 3.4: atmosphere depleted — bridge to Epic 4 results / shatter VFX. */
export type PlanetShatteredPayload = {
  elapsedSessionSec: number;
};

/** Story 4.1: single emission when the run resolves (victory or shatter). */
export type SessionEndedPayload = {
  outcome: "victory" | "shatter";
  elapsedSessionSec: number;
};

export type { ComboChangedPayload };
