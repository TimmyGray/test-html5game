import type { Application } from "pixi.js";
import { CONFIG } from "./config/config.js";
import { gameEvents, EVENTS } from "./core/events.js";
import { SyncClock } from "./core/sync-clock.js";
import { FlickInputManager } from "./systems/input/flick-input-manager.js";
import type { FlickIntent } from "./systems/input/flick-intent.js";
import { DebrisPool } from "./systems/gameplay/debris-pool.js";
import type { DebrisProbe } from "./systems/gameplay/debris-probe.js";
import { DebrisStormSpawner } from "./systems/gameplay/debris-storm-spawner.js";
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

const FLICK_LATENCY_BUDGET_MS = 16;
const PENDING_FLICK_CAPACITY = 8;
const FLICK_LATENCY_WARN_COOLDOWN_MS = 1000;

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
 */
export function initGameplay(app: Application): {
  update: () => void;
  destroy: () => void;
} {
  const intersector = new RayCastIntersector();
  const pool = new DebrisPool();
  pool.mount(app.stage);
  const spawner = new DebrisStormSpawner(pool);
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

  const input = new FlickInputManager(app.stage);
  input.attach();

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
    const planetHitEnabled = CONFIG.ONBOARDING.PLANET_HIT_ENABLED;
    spawnDims.width = w;
    spawnDims.height = h;
    spawner.update(dt, spawnDims);

    const active = pool.activeView();
    const n = pool.activeCount;

    for (let i = 0; i < n; i++) {
      active[i]!.snapshotPrev();
    }
    for (let i = 0; i < n; i++) {
      active[i]!.integrate(dt);
    }

    let ti = 0;
    while (ti < pool.activeCount) {
      const d = active[ti]!;
      if (
        planetHitEnabled &&
        d.tutorialFirstWaveActive &&
        isDebrisPlanetImpact(
          d.x,
          d.y,
          w * 0.5,
          h * 0.5,
          CONFIG.PLANET.RADIUS,
          CONFIG.DEBRIS_PROBE.RADIUS,
        )
      ) {
        d.tutorialFirstWaveActive = false;
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

    const nAfter = pool.activeCount;
    const activeAfter = pool.activeView();

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
        let target: DebrisProbe | null = null;
        for (let j = 0; j < nAfter; j++) {
          const d = activeAfter[j]!;
          if (d.id === hit.debrisId) {
            target = d;
            break;
          }
        }
        if (target !== null) {
          const dirx = pending.velocityX;
          const diry = pending.velocityY;
          const len = Math.hypot(dirx, diry);
          if (len > 1e-6) {
            target.applyImpulse(dirx / len, diry / len);
          } else {
            const sdx = pending.segmentEndX - pending.segmentStartX;
            const sdy = pending.segmentEndY - pending.segmentStartY;
            const sl = Math.hypot(sdx, sdy);
            if (sl > 1e-6) {
              target.applyImpulse(sdx / sl, sdy / sl);
            }
          }
          if (target.tutorialFirstWaveActive) {
            target.tutorialFirstWaveActive = false;
          }
          gameEvents.emit(EVENTS.ASTEROID_HIT, {
            debrisId: hit.debrisId ?? target.id,
            hitX: hit.hitX,
            hitY: hit.hitY,
            tFlick: hit.tFlick,
            tDebris: hit.tDebris,
          });
        }
      }
    }

    for (let i = 0; i < pool.activeCount; i++) {
      activeAfter[i]!.syncGraphicsPosition();
    }
  };

  const destroy = (): void => {
    gameEvents.off(EVENTS.FLICK_COMMIT, onCommit);
    input.detach();
    spawner.reset();
    pool.dispose();
  };

  return { update, destroy };
}
