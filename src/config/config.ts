/**
 * Game Configuration
 * Immutable constants for The Reactive Planet
 */

/** Full-health planet cyan: heartbeat glow + atmospheric tint (Stories 2.1, 3.1). */
const PLANET_HEALTHY_RGB = Object.freeze({ r: 0.35, g: 0.75, b: 1 });

/**
 * Weighted flick speed (px) for perfect-smash SFX and gold high-velocity reward (Stories 2.4, 3.3).
 * Single source of truth so the gates cannot drift.
 */
const FLICK_HIGH_INTENSITY_MIN_WEIGHTED_SPEED_PX = 420;

export const CONFIG = Object.freeze({
  SCREEN: {
    BACKGROUND_COLOR: 0x050505,
    TARGET_FPS: 60,
  },
  PLANET: {
    RADIUS: 100,
    PULSE_SPEED: 0.05,
  },
  /** Beat-synced planet pulse / Uber-Shader slice (Story 2.1) */
  PLANET_HEARTBEAT: Object.freeze({
    /** Peak pulse strength (envelope max) */
    PULSE_AMPLITUDE: 1,
    /** Attack portion of one beat phase [0,1) */
    ATTACK_BEAT_FRAC: 0.06,
    /** Decay portion after attack within same beat */
    DECAY_BEAT_FRAC: 0.28,
    /** Additive glow multiplier (shader) */
    GLOW_GAIN: 0.65,
    /** UV radial scale excursion: scale = 1 + envelope * SCALE_GAIN */
    SCALE_GAIN: 0.07,
    /** Beat alignment window for diagnostics (seconds, ~16ms) */
    BEAT_WINDOW_SEC: 0.016,
    /** Planet fill tint (RGB 0–1); shared object with `ATMOSPHERIC_HEALTH.HEALTHY_TINT`. */
    GLOW_COLOR: PLANET_HEALTHY_RGB,
  }),
  /** Planet damage + distress tint (Story 3.1) */
  ATMOSPHERIC_HEALTH: Object.freeze({
    MAX: 100,
    DAMAGE_PER_PLANET_IMPACT: 12,
    /**
     * Visual tint eases toward actual health each frame (seconds).
     * Game loop only — no setTimeout/setInterval.
     */
    VISUAL_LERP_TAU_SEC: 0.22,
    /** Neon Cyan at full health; shared object with `PLANET_HEARTBEAT.GLOW_COLOR`. */
    HEALTHY_TINT: PLANET_HEALTHY_RGB,
    /** Distress Red at zero health */
    DISTRESS_TINT: Object.freeze({ r: 0.92, g: 0.18, b: 0.22 }),
  }),
  /** Collision spectacle: shockwave + chromatic aberration on starfield (Story 2.2) */
  /** Micro slow-mo on confirmed deflection (Story 2.3) */
  MICRO_SLOW_MO: Object.freeze({
    /** Global time scale while the hit-stop window is active */
    TIME_SCALE: 0.2,
    /** Window length on the audio timeline (seconds) */
    DURATION_SEC: 0.1,
  }),
  /** Impact shard burst — ParticleContainer pool (Story 2.3) */
  PARTICLE_EJECTION: Object.freeze({
    BURST_MIN: 20,
    BURST_MAX: 30,
    /** Deterministic burst RNG seed for reproducible regression runs */
    RNG_SEED: 0x23c6_9bd1,
    /** Preallocated shard slots (no runtime grow) */
    POOL_SIZE: 64,
    /** Hard cap on shards activated by a single burst (≤ pool) */
    MAX_NEW_PER_BURST: 30,
    SPEED_MIN: 160,
    SPEED_MAX: 440,
    LIFE_SEC: 0.5,
    SPIN_MAX_RAD_PER_SEC: 9,
  }),
  COLLISION_SPECTACLE: Object.freeze({
    /** Overall fade window for the displacement ripple (seconds) */
    SHOCKWAVE_DURATION_SEC: 0.42,
    /** ~50ms UX spike for RGB separation (seconds) */
    ABERRATION_DURATION_SEC: 0.05,
    /** Radial wave animation speed (rad/s), drives `sin(r·k − phase)`) */
    WAVE_PHASE_SPEED_RAD_PER_SEC: 32,
    /** Spatial frequency of ripple rings (higher = tighter rings) */
    RING_SCALE: 38,
    /** Max UV displacement strength (scaled by `uShock` envelope in shader) */
    DISPLACEMENT_GAIN: 0.038,
    /** Max chromatic UV offset (scaled by `uAberration` envelope) */
    ABERRATION_MAX_UV: 0.0085,
    /** Attenuate ripple amplitude at distance from impact */
    RADIAL_FALLOFF: 3.2,
    /**
     * Supported in this pass: 1 (single origin / last-hit-wins). Values > 1 reserved for future multi-impulse.
     */
    MAX_SIMULTANEOUS_IMPULSES: 1,
  }),
  RHYTHM: {
    BPM: 120,
  },
  /**
   * Session pacing + shatter latch (Story 3.4). Elapsed = SyncClock audio seconds since gameplay session start.
   * Spawn: `effectiveInterval = DEBRIS_STORM.SPAWN_INTERVAL_SEC * SPAWN_INTERVAL_SCALE` (lower scale → faster spawns).
   */
  INTENSITY_STAGES: Object.freeze({
    FLOW_AT_ELAPSED_SEC: 5,
    CLIMAX_AT_ELAPSED_SEC: 20,
    /** Design reference for a full pressure cycle (balance / docs). */
    SESSION_DESIGN_SEC: 30,
    ARRIVAL: Object.freeze({
      SPAWN_INTERVAL_SCALE: 1,
      OSCILLATION_INTENSITY: 1,
      SPECTACLE_INTENSITY: 1,
    }),
    FLOW: Object.freeze({
      SPAWN_INTERVAL_SCALE: 0.72,
      OSCILLATION_INTENSITY: 1.2,
      SPECTACLE_INTENSITY: 1.12,
    }),
    CLIMAX: Object.freeze({
      SPAWN_INTERVAL_SCALE: 0.5,
      OSCILLATION_INTENSITY: 1.45,
      SPECTACLE_INTENSITY: 1.28,
    }),
  }),
  /** Streak multipliers after consecutive successful deflections (Story 3.2) */
  COMBO: Object.freeze({
    /**
     * Streak 1 → index 0 (e.g. x2), streak 2 → x4, … Capped at last entry for higher streaks.
     */
    MULTIPLIER_STEPS: Object.freeze([2, 4, 8, 16]),
  }),
  /** Combo milestone VFX: sparks + multiplier word (feeds on `COMBO_CHANGED`) */
  COMBO_FIREWORKS: Object.freeze({
    POOL_SIZE: 64,
    SPARK_MIN: 20,
    SPARK_MAX: 32,
    SPARK_LIFE_SEC: 0.55,
    SPEED_MIN: 100,
    SPEED_MAX: 320,
    SPIN_MAX_RAD_PER_SEC: 11,
    UPWARD_BIAS_PX_PER_SEC: 40,
    BURST_JITTER_PX: 14,
    SPARK_SCALE_MIN: 0.45,
    SPARK_SCALE_MAX: 0.95,
    SECOND_BURST_DELAY_SEC: 0.07,
    SECOND_BURST_SPEED_SCALE: 0.62,
    /** Burst anchor Y as fraction of view height (0 = top) */
    ANCHOR_Y_FRAC: 0.22,
    LABEL_FONT_PX: 52,
    LABEL_DURATION_SEC: 0.88,
    LABEL_OFFSET_Y_PX: 8,
    LABEL_DRIFT_PX_PER_SEC: -28,
  }),
  /** Rhythmic hit SFX: 1/16 grid + key-quantized pitch (Story 2.4) */
  QUANTIZED_SFX: Object.freeze({
    /** Subdivisions of one quarter note / beat (16 = sixteenth notes) */
    SUBDIVISIONS_PER_BEAT: 16,
    /**
     * If nearest grid time lies before current audio time by more than this (seconds),
     * schedule the next subdivision instead (missed-quantum guard).
     */
    SCHEDULE_TOLERANCE_SEC: 1e-4,
    /**
     * GDD "high intensity" gate: weighted flick speed (px) must meet or exceed this
     * for a hit to count as Perfect Smash for quantized SFX.
     */
    PERFECT_SMASH_MIN_WEIGHTED_SPEED_PX:
      FLICK_HIGH_INTENSITY_MIN_WEIGHTED_SPEED_PX,
    /** Peak sample amplitude for the one-shot buffer (linear) */
    BUFFER_AMPLITUDE: 0.12,
    /** One-shot tone frequency (Hz) before pitch quantization */
    BASE_FREQUENCY_HZ: 220,
    /** Buffer length (seconds); short click to stay cheap */
    BUFFER_DURATION_SEC: 0.04,
    /**
     * Equal-temperament semitone offsets from {@link BASE_FREQUENCY_HZ} forming the playable key.
     * C minor pentatonic: C, Eb, F, G, Bb
     */
    PITCH_SEMITONE_OFFSETS: Object.freeze([0, 3, 5, 7, 10]),
    /**
     * Gain after the one-shot buffer (linear). Keeps stacked perfect-smash hits from clipping
     * the destination when several sources overlap briefly.
     */
    MASTER_GAIN: 0.35,
  }),
  EVENTS: {
    GAME_START: "game_start",
    GAME_OVER: "game_over",
    BEAT: "beat",
    ASTEROID_HIT: "asteroid_hit",
    COMBO_CHANGED: "combo_changed",
    FLICK_START: "flick_start",
    FLICK_COMMIT: "flick_commit",
    /** Base deflection points (Story 3.3); HUD / results can listen */
    SCORE_AWARDED: "score_awarded",
    /** Story 3.4: arrival → flow → climax (session time thresholds) */
    INTENSITY_STAGE_CHANGED: "intensity_stage_changed",
    /** Story 3.4: one-shot when atmosphere hits zero (Epic 4 overlays) */
    PLANET_SHATTERED: "planet_shattered",
  },
  /** Flick input, velocity buffer, ray-cast (Story 1.2) */
  FLICK: {
    BUFFER_SIZE: 8,
    /** Per-sample weights (oldest → newest); must match BUFFER_SIZE; sum ≈ 1 for full buffer */
    WEIGHTS: Object.freeze([0.02, 0.03, 0.05, 0.08, 0.1, 0.15, 0.22, 0.35]),
    /** Below this, pointer-up is treated as a tap and cast toward screen center (see TAP_CAST_LENGTH_PX) */
    MIN_SWIPE_PX: 4,
    /** Synthetic segment length for taps / micro-moves (world px) */
    TAP_CAST_LENGTH_PX: 72,
    MAX_IMPULSE: 800,
    IMPULSE_SCALE: 1.2,
    SEGMENT_EPSILON: 1e-7,
    /**
     * Extra radius beyond `DEBRIS_PROBE.RADIUS` for hit tests (ray vs center-line was far too strict).
     */
    HIT_EXTRA_RADIUS_PX: 28,
  },
  MOUSE_INTERACTION: Object.freeze({
    /** Show latest cast segment and hit marker */
    DEBUG_RAYCAST_VISUAL: false,
    /** Seconds to keep cast debug visible */
    DEBUG_RAYCAST_FADE_SEC: 0.22,
  }),
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
    SIZE: 19,
    /** Hard cap on simultaneously active storm debris */
    MAX_ACTIVE: 19,
  }),
  DEBRIS_STORM: Object.freeze({
    /** Seconds between spawn attempts while under max active */
    SPAWN_INTERVAL_SEC: 0.77,
    SPEED_MIN: 81,
    SPEED_MAX: 212,
    /** Padding from raw screen edge for spawn positions (px) */
    EDGE_MARGIN: 28,
    /** Recycle when this far outside the view (px past edge) */
    RECYCLE_MARGIN: 96,
  }),
  /** Rare heavy “gold” debris: resistance + high-velocity reward (Story 3.3) */
  GOLD_DEBRIS: Object.freeze({
    SPAWN_CHANCE: 0.08,
    IMPULSE_REF_WEIGHTED_SPEED_PX: 400,
    /** At zero weighted speed, gold still moves slightly (weak flicks are weaker, not null). */
    MIN_IMPULSE_EFFICIENCY: 0.22,
    /**
     * Metallic VFX + score bonus multiplier when weighted flick meets this.
     * Same threshold as `QUANTIZED_SFX.PERFECT_SMASH_MIN_WEIGHTED_SPEED_PX` (shared constant above).
     */
    HIGH_VELOCITY_REWARD_MIN_WEIGHTED_PX:
      FLICK_HIGH_INTENSITY_MIN_WEIGHTED_SPEED_PX,
    SCORE_BONUS_MULTIPLIER: 5,
    BASE_DEFLECTION_SCORE: 10,
    /** Fill for pooled Graphics circle */
    COLOR: 0xffcc33,
  }),
  /** First storm piece tutorial (Story 1.4) */
  ONBOARDING: Object.freeze({
    FIRST_WAVE_SPEED_SCALE: 0.5,
    /** Max perpendicular aim deviation; 0 = straight toward center (same scale idea as storm jitter) */
    FIRST_WAVE_JITTER: 0,
    PLANET_HIT_ENABLED: true,
  }),
});
