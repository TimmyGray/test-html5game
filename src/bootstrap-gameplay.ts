import type { Application } from "pixi.js";
import { Container, Graphics, Sprite } from "pixi.js";
import { CONFIG } from "./config/config.js";
import {
  atmosphereTintFromHealth01,
  atmosphericHealth01,
  smoothAtmosphericDisplay01,
} from "./core/atmospheric-health.js";
import {
  BeatTickTracker,
  samplePlanetHeartbeatInto,
} from "./core/beat-phase.js";
import { ComboTracker } from "./core/combo-engine.js";
import {
  gameEvents,
  EVENTS,
  type AsteroidHitPayload,
  type PlanetImpactPayload,
  type SessionEndedPayload,
} from "./core/events.js";
import { updateHighScoreIfBeat } from "./core/high-score-storage.js";
import { IntensityShatterFsm } from "./core/intensity-shatter-fsm.js";
import { MicroSlowMo } from "./core/micro-slow-mo.js";
import { AudioDirector } from "./core/audio-director.js";
import { QuantizedSfxPlayer } from "./core/quantized-sfx.js";
import { SyncClock } from "./core/sync-clock.js";
import { FlickInputManager } from "./systems/input/flick-input-manager.js";
import type { FlickIntent } from "./systems/input/flick-intent.js";
import { DebrisPool } from "./systems/gameplay/debris-pool.js";
import type { DebrisProbe } from "./systems/gameplay/debris-probe.js";
import { DebrisStormSpawner } from "./systems/gameplay/debris-storm-spawner.js";
import { getPlanetTexture } from "./systems/gameplay/gameplay-visual-assets.js";
import {
  computeDeflectionScoreAward,
  goldImpulseEfficiency,
  isGoldHighVelocityReward,
} from "./systems/gameplay/gold-fragment.js";
import type {
  Segment2,
  SegmentHit,
} from "./systems/physics/ray-cast-intersector.js";
import { RayCastIntersector } from "./systems/physics/ray-cast-intersector.js";
import { pickBestStormHit } from "./systems/gameplay/storm-hit-resolution.js";
import {
  isDebrisPlanetImpact,
  shouldStormRecycleForOob,
} from "./systems/gameplay/tutorial-planet-impact.js";
import {
  CollisionSpectacleController,
  CollisionSpectacleFilter,
} from "./vfx/collision-spectacle-filter.js";
import { ImpactParticleBurst } from "./vfx/impact-particle-burst.js";
import { PlanetHeartbeatFilter } from "./vfx/planet-heartbeat-filter.js";
import { StarfieldBackground } from "./vfx/starfield-background.js";
import { ComboFireworksOverlay } from "./ui/combo-fireworks-overlay.js";

const FLICK_LATENCY_BUDGET_MS = 16;
const PENDING_FLICK_CAPACITY = 8;
const FLICK_LATENCY_WARN_COOLDOWN_MS = 1000;

function createSeededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    // Mulberry32: tiny deterministic RNG for reproducible burst visuals.
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `?heartbeatDebug=1` (or `true`, or bare flag) logs beat ticks; `=0` / `=false` disables */
function isHeartbeatDebug(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const v = new URLSearchParams(window.location.search).get("heartbeatDebug");
  if (v === null) {
    return false;
  }
  const s = v.trim().toLowerCase();
  if (s === "" || s === "1" || s === "true" || s === "yes") {
    return true;
  }
  if (s === "0" || s === "false" || s === "no") {
    return false;
  }
  return false;
}

function isStormOutOfView(
  d: DebrisProbe,
  width: number,
  height: number,
): boolean {
  const rm = CONFIG.DEBRIS_STORM.RECYCLE_MARGIN;
  return d.x < -rm || d.y < -rm || d.x > width + rm || d.y > height + rm;
}

/**
 * Story 1.3: pooled storm debris + Story 1.2 flick / CCD pipeline.
 * Story 4.1: exposes `resetSession` for replay without tearing down Pixi; emits `SESSION_ENDED` on victory/shatter.
 * Story 4.3: persists best session score to localStorage before `SESSION_ENDED`.
 *
 * Purpose: bootstrap all gameplay singletons for one mount lifetime.
 * Inputs: Pixi `Application`, optional `AudioContext` for quantized SFX.
 * Outputs: gameplay loop controls plus audio APIs (`setAudioMuted` / `setMasterVolume` emit bus events).
 * Side effects: registers stage listeners and event-bus handlers until `destroy`.
 * Failure modes: none thrown during init; pool/spawner assume valid renderer dimensions on first tick.
 */
export function initGameplay(
  app: Application,
  opts?: {
    audioContext?: AudioContext;
    getRhythmBpm?: () => number;
    getKickPulseBoost?: () => number;
  },
): {
  update: () => void;
  destroy: () => void;
  resetSession: () => void;
  setAudioMuted: (muted: boolean) => void;
  setMasterVolume: (volume: number) => void;
  getAudioState: () => { muted: boolean; masterVolume: number };
  getAudioOutputNode: () => AudioNode | null;
  /** BGM / bed: skips SFX headroom bus; still uses shared mute + master gain. */
  getMasterInputNode: () => AudioNode | null;
} {
  const heartbeatDebug = isHeartbeatDebug();

  const starfield = new StarfieldBackground();
  const collisionSpectacleFilter = new CollisionSpectacleFilter();
  starfield.filters = [collisionSpectacleFilter];
  const collisionSpectacle = new CollisionSpectacleController(
    collisionSpectacleFilter,
  );
  app.stage.addChildAt(starfield, 0);

  const planetRoot = new Container();
  planetRoot.eventMode = "none";
  const planetBody = new Sprite(getPlanetTexture());
  planetBody.anchor.set(0.5);
  const planetDiameter = CONFIG.PLANET.RADIUS * 2;
  planetBody.width = planetDiameter;
  planetBody.height = planetDiameter;
  const planetRim = new Graphics();
  const planetHeartbeatFilter = new PlanetHeartbeatFilter();
  // Filter the body only; filtering the parent snapshots a full AABB (square halo).
  planetBody.filters = [planetHeartbeatFilter];
  planetRoot.addChild(planetBody);
  planetRoot.addChild(planetRim);
  app.stage.addChildAt(planetRoot, 1);

  const atmosphereTintScratch = { r: 0, g: 0, b: 0 };
  let atmosphericHp: number = CONFIG.ATMOSPHERIC_HEALTH.MAX;
  let atmosphericDisplay01 = 1;
  const comboTracker = new ComboTracker(CONFIG.COMBO.MULTIPLIER_STEPS);
  let sessionScore = 0;
  let maxComboMultiplierSession = 1;

  const impactParticles = new ImpactParticleBurst();
  impactParticles.mount(app.stage, 2);
  const comboFireworks = new ComboFireworksOverlay(() => ({
    width: app.renderer.width,
    height: app.renderer.height,
  }));
  comboFireworks.mount(app.stage, 3);
  const burstRng = createSeededRng(CONFIG.PARTICLE_EJECTION.RNG_SEED);

  const audioDirector =
    opts?.audioContext !== undefined
      ? new AudioDirector(opts.audioContext)
      : null;
  const quantizedSfx =
    opts?.audioContext !== undefined
      ? new QuantizedSfxPlayer(opts.audioContext, audioDirector?.outputNode)
      : null;

  const onAsteroidHit = (payload: AsteroidHitPayload): void => {
    const audioNow = SyncClock.instance.getAbsoluteTime();
    audioDirector?.tryScheduleDeflectionCue(audioNow);
    quantizedSfx?.trySchedulePerfectSmash(payload.flickIntent, audioNow);
  };
  gameEvents.on(EVENTS.ASTEROID_HIT, onAsteroidHit);

  const onPlanetImpact = (): void => {
    audioDirector?.trySchedulePlanetImpactCue(
      SyncClock.instance.getAbsoluteTime(),
    );
  };
  gameEvents.on(EVENTS.PLANET_IMPACT, onPlanetImpact);

  const onPlanetShattered = (): void => {
    audioDirector?.tryScheduleShatterCue(SyncClock.instance.getAbsoluteTime());
  };
  gameEvents.on(EVENTS.PLANET_SHATTERED, onPlanetShattered);

  const onBeat = (): void => {
    audioDirector?.tryScheduleHeartbeatCue(
      SyncClock.instance.getAbsoluteTime(),
    );
  };
  gameEvents.on(EVENTS.BEAT, onBeat);

  const beatTickTracker = new BeatTickTracker();
  const planetHeartbeatSample = { phase: 0, envelope: 0 };

  const intersector = new RayCastIntersector();
  const pool = new DebrisPool();
  pool.mount(app.stage);
  const spawner = new DebrisStormSpawner(pool);
  const intensityFsm = new IntensityShatterFsm();
  let sessionAudioStart = -1;
  let pendingStormPaused = false;
  let pendingSpawnIntervalScale = 1;
  let intensityOscillationMul = 1;
  let intensitySpectacleMul = 1;
  const debugRay = new Graphics();
  debugRay.eventMode = "none";
  app.stage.addChild(debugRay);
  let debugRayTtl = 0;
  let debugRayHit = false;
  let debugRayX1 = 0;
  let debugRayY1 = 0;
  let debugRayX2 = 0;
  let debugRayY2 = 0;
  let debugHitX = 0;
  let debugHitY = 0;
  const spawnDims = { width: 0, height: 0 };
  const flickSegment: Segment2 = { x1: 0, y1: 0, x2: 0, y2: 0 };
  const motionScratch: Segment2 = { x1: 0, y1: 0, x2: 0, y2: 0 };
  const candidateHit: SegmentHit = {
    hitX: 0,
    hitY: 0,
    tFlick: 0,
    tDebris: 0,
    debrisId: undefined,
    normalX: 0,
    normalY: 0,
  };
  const bestHit: SegmentHit = {
    hitX: 0,
    hitY: 0,
    tFlick: 0,
    tDebris: 0,
    debrisId: undefined,
    normalX: 0,
    normalY: 0,
  };

  const input = new FlickInputManager(app.stage, {
    getTapCastCenter: () => ({
      x: app.renderer.width * 0.5,
      y: app.renderer.height * 0.5,
    }),
  });
  app.stage.hitArea = app.screen;
  input.attach();
  /**
   * One input path: pointer-up commits a flick (including tap → synthetic cast toward screen center).
   * Avoid a separate pointerdown “kill” — it removed debris before the ray could resolve on release,
   * so tap felt broken vs swipe. Tap and swipe now share the same hit + VFX + pool.release path.
   */

  const pendingQueue: (FlickIntent | null)[] = new Array(
    PENDING_FLICK_CAPACITY,
  );
  for (let i = 0; i < PENDING_FLICK_CAPACITY; i++) {
    pendingQueue[i] = null;
  }
  let pendingHead = 0;
  let pendingTail = 0;
  let pendingCount = 0;
  /** Wall-clock cooldown so we do not stringify a warn every commit when the queue is hot. */
  let lastLatencyWarnWallMs = -Infinity;

  const onCommit = (intent: FlickIntent): void => {
    if (pendingCount === PENDING_FLICK_CAPACITY) {
      pendingHead = (pendingHead + 1) % PENDING_FLICK_CAPACITY;
      pendingCount--;
    }
    pendingQueue[pendingTail] = intent;
    pendingTail = (pendingTail + 1) % PENDING_FLICK_CAPACITY;
    pendingCount++;
  };
  gameEvents.on(EVENTS.FLICK_COMMIT, onCommit);

  const update = (): void => {
    const dt = SyncClock.instance.getDelta();
    if (dt <= 0) {
      return;
    }

    const w = app.renderer.width;
    const h = app.renderer.height;
    starfield.syncSize(w, h);
    const audioTime = SyncClock.instance.getAbsoluteTime();
    const runtimeBpm = opts?.getRhythmBpm?.() ?? CONFIG.RHYTHM.BPM;
    if (sessionAudioStart < 0) {
      sessionAudioStart = audioTime;
    }
    const elapsedSessionSec = audioTime - sessionAudioStart;

    const planetHitEnabled = CONFIG.ONBOARDING.PLANET_HIT_ENABLED;
    spawnDims.width = w;
    spawnDims.height = h;

    const active = pool.activeView();
    const n = pool.activeCount;

    for (let i = 0; i < n; i++) {
      active[i]!.snapshotPrev();
    }
    for (let i = 0; i < n; i++) {
      active[i]!.integrate(dt);
    }

    /* Planet impact runs before pending flick resolution this tick: debris already overlapping
     * the planet consumes damage + release first; a flick queued for this frame cannot save it. */
    let ti = 0;
    while (ti < pool.activeCount) {
      const d = active[ti]!;
      if (
        planetHitEnabled &&
        isDebrisPlanetImpact(
          d.x,
          d.y,
          w * 0.5,
          h * 0.5,
          CONFIG.PLANET.RADIUS,
          CONFIG.DEBRIS_PROBE.RADIUS,
        )
      ) {
        if (d.tutorialFirstWaveActive) {
          d.tutorialFirstWaveActive = false;
        }
        atmosphericHp = Math.max(
          0,
          atmosphericHp - CONFIG.ATMOSPHERIC_HEALTH.DAMAGE_PER_PLANET_IMPACT,
        );
        const impactPayload: PlanetImpactPayload = {
          damageApplied: CONFIG.ATMOSPHERIC_HEALTH.DAMAGE_PER_PLANET_IMPACT,
          atmosphericHealthAfter: atmosphericHp,
        };
        gameEvents.emit(EVENTS.PLANET_IMPACT, impactPayload);
        const comboReset = comboTracker.notifyReset();
        if (comboReset !== null) {
          gameEvents.emit(EVENTS.COMBO_CHANGED, comboReset);
        }
        pool.release(d);
      } else {
        ti++;
      }
    }

    let oi = 0;
    while (oi < pool.activeCount) {
      const d = active[oi]!;
      const oob = isStormOutOfView(d, w, h);
      if (
        shouldStormRecycleForOob(
          oob,
          d.tutorialFirstWaveActive,
          planetHitEnabled,
        )
      ) {
        pool.release(d);
      } else {
        oi++;
      }
    }

    const intensitySync = intensityFsm.sync(elapsedSessionSec, atmosphericHp);
    pendingStormPaused =
      intensitySync.phase === "shatter" || intensitySync.phase === "victory";
    pendingSpawnIntervalScale = intensitySync.spawnIntervalScale;
    intensityOscillationMul = intensitySync.oscillationIntensity;
    intensitySpectacleMul = intensitySync.spectacleIntensity;
    collisionSpectacle.setSpectacleIntensityMultiplier(intensitySpectacleMul);
    if (intensitySync.stageChanged) {
      gameEvents.emit(EVENTS.INTENSITY_STAGE_CHANGED, {
        stage: intensitySync.stage,
        elapsedSessionSec,
      });
    }
    if (intensitySync.enteredVictory) {
      updateHighScoreIfBeat(sessionScore);
      const ah = CONFIG.ATMOSPHERIC_HEALTH;
      const endedVictory: SessionEndedPayload = {
        outcome: "victory",
        elapsedSessionSec,
        totalScore: sessionScore,
        maxComboMultiplier: maxComboMultiplierSession,
        finalAtmosphericHealth01: atmosphericHp / ah.MAX,
      };
      gameEvents.emit(EVENTS.SESSION_ENDED, endedVictory);
    }
    if (intensitySync.enteredShatter) {
      gameEvents.emit(EVENTS.PLANET_SHATTERED, { elapsedSessionSec });
      updateHighScoreIfBeat(sessionScore);
      const endedShatter: SessionEndedPayload = {
        outcome: "shatter",
        elapsedSessionSec,
        totalScore: sessionScore,
        maxComboMultiplier: maxComboMultiplierSession,
        finalAtmosphericHealth01: 0,
      };
      gameEvents.emit(EVENTS.SESSION_ENDED, endedShatter);
    }

    const nBeforeSpawn = pool.activeCount;
    /* Spawner after FSM so paused / intervalScale match same-frame HP + session time (Story 3.4). */
    spawner.update(dt, spawnDims, {
      paused: pendingStormPaused,
      intervalScale: pendingSpawnIntervalScale,
    });

    const activeAfter = pool.activeView();
    const nAfter = pool.activeCount;
    /* Same-frame motion for pieces spawned this tick (main integrate already ran). */
    for (let i = nBeforeSpawn; i < nAfter; i++) {
      activeAfter[i]!.integrate(dt);
    }

    while (pendingCount > 0) {
      const pending = pendingQueue[pendingHead];
      pendingQueue[pendingHead] = null;
      pendingHead = (pendingHead + 1) % PENDING_FLICK_CAPACITY;
      pendingCount--;
      if (pending === null) {
        continue;
      }

      const queryLatencyMs = performance.now() - pending.committedAt;
      const wallNow = performance.now();
      if (
        queryLatencyMs > FLICK_LATENCY_BUDGET_MS &&
        wallNow - lastLatencyWarnWallMs >= FLICK_LATENCY_WARN_COOLDOWN_MS
      ) {
        lastLatencyWarnWallMs = wallNow;
        console.warn(
          `Flick query latency exceeded 16ms budget: ${queryLatencyMs.toFixed(2)}ms`,
        );
      }
      flickSegment.x1 = pending.segmentStartX;
      flickSegment.y1 = pending.segmentStartY;
      flickSegment.x2 = pending.segmentEndX;
      flickSegment.y2 = pending.segmentEndY;
      if (CONFIG.MOUSE_INTERACTION.DEBUG_RAYCAST_VISUAL) {
        debugRayX1 = flickSegment.x1;
        debugRayY1 = flickSegment.y1;
        debugRayX2 = flickSegment.x2;
        debugRayY2 = flickSegment.y2;
      }
      const hit = pickBestStormHit(
        intersector,
        flickSegment,
        activeAfter,
        nAfter,
        motionScratch,
        candidateHit,
        bestHit,
      );

      if (hit !== null) {
        if (CONFIG.MOUSE_INTERACTION.DEBUG_RAYCAST_VISUAL) {
          debugRayHit = true;
          debugHitX = hit.hitX;
          debugHitY = hit.hitY;
          debugRayTtl = CONFIG.MOUSE_INTERACTION.DEBUG_RAYCAST_FADE_SEC;
        }
        let target: DebrisProbe | null = null;
        for (let j = 0; j < nAfter; j++) {
          const d = activeAfter[j]!;
          if (d.id === hit.debrisId) {
            target = d;
            break;
          }
        }
        if (target !== null) {
          const gd = CONFIG.GOLD_DEBRIS;
          const impulseScale = target.goldFragment
            ? goldImpulseEfficiency(pending.weightMagnitude, gd)
            : 1;
          const dirx = pending.velocityX;
          const diry = pending.velocityY;
          const len = Math.hypot(dirx, diry);
          if (len > 1e-6) {
            target.applyImpulse(dirx / len, diry / len, impulseScale);
          } else {
            const sdx = pending.segmentEndX - pending.segmentStartX;
            const sdy = pending.segmentEndY - pending.segmentStartY;
            const sl = Math.hypot(sdx, sdy);
            if (sl > 1e-6) {
              target.applyImpulse(sdx / sl, sdy / sl, impulseScale);
            }
          }
          if (target.tutorialFirstWaveActive) {
            target.tutorialFirstWaveActive = false;
          }
          const goldReward = isGoldHighVelocityReward(
            target.goldFragment,
            pending.weightMagnitude,
            gd,
          );
          const fragmentKind = target.goldFragment ? "gold" : "normal";
          const comboAfterHit = comboTracker.notifySuccessfulDeflection();
          const comboMult = comboTracker.getMultiplier();
          const scoreAward = computeDeflectionScoreAward(
            gd.BASE_DEFLECTION_SCORE,
            comboMult,
            goldReward,
            gd.SCORE_BONUS_MULTIPLIER,
          );
          const asteroidHitPayload: AsteroidHitPayload = {
            debrisId: hit.debrisId ?? target.id,
            hitX: hit.hitX,
            hitY: hit.hitY,
            tFlick: hit.tFlick,
            tDebris: hit.tDebris,
            flickIntent: pending,
            fragmentKind,
            goldHighVelocityReward: goldReward,
            scoreAward,
          };
          gameEvents.emit(EVENTS.ASTEROID_HIT, asteroidHitPayload);
          if (comboAfterHit !== null) {
            gameEvents.emit(EVENTS.COMBO_CHANGED, comboAfterHit);
          }
          sessionScore += scoreAward;
          maxComboMultiplierSession = Math.max(
            maxComboMultiplierSession,
            comboMult,
          );
          gameEvents.emit(EVENTS.SCORE_AWARDED, {
            delta: scoreAward,
            fragmentKind,
            goldHighVelocityReward: goldReward,
          });
          collisionSpectacle.triggerImpulse(
            audioTime,
            hit.hitX,
            hit.hitY,
            w,
            h,
          );
          MicroSlowMo.instance.notifyHit();
          if (goldReward) {
            impactParticles.burstMetallicAt(hit.hitX, hit.hitY, burstRng);
          } else {
            impactParticles.burstAt(hit.hitX, hit.hitY, burstRng);
          }
          /** Successful trace = destroy piece (pool recycle), same as click — was only applying impulse before. */
          pool.release(target);
        }
      } else {
        const comboAfterMiss = comboTracker.notifyReset();
        if (comboAfterMiss !== null) {
          gameEvents.emit(EVENTS.COMBO_CHANGED, comboAfterMiss);
        }
        if (CONFIG.MOUSE_INTERACTION.DEBUG_RAYCAST_VISUAL) {
          debugRayHit = false;
          debugRayTtl = CONFIG.MOUSE_INTERACTION.DEBUG_RAYCAST_FADE_SEC;
        }
      }
    }

    collisionSpectacle.updateFrame(audioTime);
    impactParticles.update(dt);
    comboFireworks.update(dt);
    if (CONFIG.MOUSE_INTERACTION.DEBUG_RAYCAST_VISUAL && debugRayTtl > 0) {
      debugRayTtl -= dt;
      debugRay.clear();
      debugRay.moveTo(debugRayX1, debugRayY1).lineTo(debugRayX2, debugRayY2);
      debugRay.stroke({
        width: 3,
        color: debugRayHit ? 0x66ff66 : 0xff4455,
        alpha: 0.9,
      });
      if (debugRayHit) {
        debugRay
          .circle(debugHitX, debugHitY, 7)
          .fill({ color: 0xffee55, alpha: 0.95 });
      }
    } else if (debugRayTtl <= 0) {
      debugRay.clear();
    }

    const hb = CONFIG.PLANET_HEARTBEAT;
    samplePlanetHeartbeatInto(audioTime, runtimeBpm, hb, planetHeartbeatSample);
    const env = planetHeartbeatSample.envelope;
    const kickPulseBoost = opts?.getKickPulseBoost?.() ?? 0;
    const pulseEnvelope = Math.min(1.5, env + kickPulseBoost);

    const ah = CONFIG.ATMOSPHERIC_HEALTH;
    atmosphericDisplay01 = smoothAtmosphericDisplay01(
      atmosphericDisplay01,
      atmosphericHealth01(atmosphericHp, ah.MAX),
      dt,
      ah.VISUAL_LERP_TAU_SEC,
    );
    atmosphereTintFromHealth01(
      atmosphericDisplay01,
      ah.HEALTHY_TINT,
      ah.DISTRESS_TINT,
      atmosphereTintScratch,
    );
    planetHeartbeatFilter.setOscillationIntensity(intensityOscillationMul);
    planetHeartbeatFilter.setPulse(pulseEnvelope);
    planetHeartbeatFilter.setGlowTintRgb(
      atmosphereTintScratch.r,
      atmosphereTintScratch.g,
      atmosphereTintScratch.b,
    );

    const scale = 1 + pulseEnvelope * hb.SCALE_GAIN;
    planetRoot.scale.set(scale);
    planetRim.clear();
    if (pulseEnvelope > 0.004) {
      const tr = atmosphereTintScratch.r;
      const tg = atmosphereTintScratch.g;
      const tb = atmosphereTintScratch.b;
      const tintHex =
        (Math.round(tr * 255) << 16) |
        (Math.round(tg * 255) << 8) |
        Math.round(tb * 255);
      planetRim
        .circle(0, 0, CONFIG.PLANET.RADIUS + 4 + pulseEnvelope * 8)
        .stroke({
          width: 2 + pulseEnvelope * 5,
          color: tintHex,
          alpha: Math.min(1, pulseEnvelope * hb.GLOW_GAIN * 1.1),
        });
    }
    planetRoot.position.set(w * 0.5, h * 0.5);

    if (beatTickTracker.consumeBeatTick(audioTime, runtimeBpm)) {
      const beatIndex = Math.floor(audioTime * (runtimeBpm / 60));
      gameEvents.emit(EVENTS.BEAT, { beatIndex, audioTime });
      if (heartbeatDebug) {
        console.debug(
          `[heartbeat] beat=${beatIndex} audioTime=${audioTime.toFixed(4)} window<=${hb.BEAT_WINDOW_SEC}s target`,
        );
      }
    }

    for (let i = 0; i < pool.activeCount; i++) {
      activeAfter[i]!.syncGraphicsPosition();
    }
  };

  const resetSession = (): void => {
    atmosphericHp = CONFIG.ATMOSPHERIC_HEALTH.MAX;
    atmosphericDisplay01 = 1;
    sessionScore = 0;
    maxComboMultiplierSession = 1;
    comboTracker.resetSession();
    comboFireworks.resetSession();
    intensityFsm.reset();
    sessionAudioStart = -1;
    pendingStormPaused = false;
    pendingSpawnIntervalScale = 1;
    intensityOscillationMul = 1;
    intensitySpectacleMul = 1;
    collisionSpectacle.setSpectacleIntensityMultiplier(1);
    collisionSpectacle.dispose();
    spawner.reset();
    pool.releaseAllActive();
    impactParticles.clearBurstState();
    MicroSlowMo.instance.clearSessionWindow();

    pendingHead = 0;
    pendingTail = 0;
    pendingCount = 0;
    for (let i = 0; i < PENDING_FLICK_CAPACITY; i++) {
      pendingQueue[i] = null;
    }

    debugRay.clear();
    debugRayTtl = 0;
  };

  const destroy = (): void => {
    gameEvents.off(EVENTS.FLICK_COMMIT, onCommit);
    gameEvents.off(EVENTS.ASTEROID_HIT, onAsteroidHit);
    gameEvents.off(EVENTS.PLANET_IMPACT, onPlanetImpact);
    gameEvents.off(EVENTS.PLANET_SHATTERED, onPlanetShattered);
    gameEvents.off(EVENTS.BEAT, onBeat);
    input.detach();
    intensityFsm.reset();
    sessionAudioStart = -1;
    pendingStormPaused = false;
    pendingSpawnIntervalScale = 1;
    intensityOscillationMul = 1;
    intensitySpectacleMul = 1;
    collisionSpectacle.setSpectacleIntensityMultiplier(1);
    spawner.reset();
    pool.dispose();
    collisionSpectacle.dispose();
    quantizedSfx?.dispose();
    audioDirector?.dispose();
    impactParticles.dispose();
    comboFireworks.dispose();
    starfield.destroy({ children: true });
    planetRoot.destroy({ children: true });
    debugRay.destroy();
  };

  const setAudioMuted = (muted: boolean): void => {
    audioDirector?.setMuted(muted);
    gameEvents.emit(EVENTS.AUDIO_MUTE_CHANGED, { muted });
  };

  const setMasterVolume = (volume: number): void => {
    audioDirector?.setMasterVolume(volume);
    const v =
      audioDirector?.state.masterVolume ?? CONFIG.AUDIO.DEFAULT_MASTER_VOLUME;
    gameEvents.emit(EVENTS.AUDIO_VOLUME_CHANGED, { volume: v });
  };

  const getAudioState = (): { muted: boolean; masterVolume: number } => {
    if (audioDirector === null) {
      return { muted: false, masterVolume: CONFIG.AUDIO.DEFAULT_MASTER_VOLUME };
    }
    const state = audioDirector.state;
    return { muted: state.muted, masterVolume: state.masterVolume };
  };

  const getAudioOutputNode = (): AudioNode | null => {
    return audioDirector?.outputNode ?? null;
  };

  const getMasterInputNode = (): AudioNode | null => {
    return audioDirector?.masterInputNode ?? null;
  };

  return {
    update,
    destroy,
    resetSession,
    setAudioMuted,
    setMasterVolume,
    getAudioState,
    getAudioOutputNode,
    getMasterInputNode,
  };
}
