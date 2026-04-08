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
    FLICK_START: "flick_start",
    FLICK_COMMIT: "flick_commit",
  },
  /** Flick input, velocity buffer, ray-cast (Story 1.2) */
  FLICK: {
    BUFFER_SIZE: 8,
    /** Per-sample weights (oldest → newest); must match BUFFER_SIZE; sum ≈ 1 for full buffer */
    WEIGHTS: Object.freeze([0.02, 0.03, 0.05, 0.08, 0.1, 0.15, 0.22, 0.35]),
    MIN_SWIPE_PX: 12,
    MAX_IMPULSE: 800,
    IMPULSE_SCALE: 1.2,
    SEGMENT_EPSILON: 1e-7,
  },
  DEBRIS_PROBE: {
    RADIUS: 18,
    INITIAL_X: 520,
    INITIAL_Y: 360,
    INITIAL_VX: -140,
    INITIAL_VY: 0,
    COLOR: 0x66ccff,
  },
  /** Procedural storm + pooling (Story 1.3) */
  DEBRIS_POOL: Object.freeze({
    /** Preallocated debris instances (graphics + motion state) */
    SIZE: 40,
    /** Hard cap on simultaneously active storm debris */
    MAX_ACTIVE: 40,
  }),
  DEBRIS_STORM: Object.freeze({
    /** Seconds between spawn attempts while under max active */
    SPAWN_INTERVAL_SEC: 0.35,
    SPEED_MIN: 90,
    SPEED_MAX: 240,
    /** Padding from raw screen edge for spawn positions (px) */
    EDGE_MARGIN: 28,
    /** Recycle when this far outside the view (px past edge) */
    RECYCLE_MARGIN: 96,
  }),
  /** First storm piece tutorial (Story 1.4) */
  ONBOARDING: Object.freeze({
    FIRST_WAVE_SPEED_SCALE: 0.5,
    /** Max perpendicular aim deviation; 0 = straight toward center (same scale idea as storm jitter) */
    FIRST_WAVE_JITTER: 0,
    PLANET_HIT_ENABLED: true,
  }),
});
