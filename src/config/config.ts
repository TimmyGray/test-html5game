/**
 * Game Configuration
 * Immutable constants for The Reactive Planet
 */
export const CONFIG = Object.freeze({
  SCREEN: {
    BACKGROUND_COLOR: 0x050505,
    TARGET_FPS: 60,
  },
  PLANET: {
    RADIUS: 100,
    PULSE_SPEED: 0.05,
  },
  RHYTHM: {
    BPM: 120,
  },
  EVENTS: {
    GAME_START: "game_start",
    GAME_OVER: "game_over",
    BEAT: "beat",
    ASTEROID_HIT: "asteroid_hit",
  },
});
