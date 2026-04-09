import { CONFIG } from "../../config/config.js";
import type { DebrisPool } from "./debris-pool.js";
import type { DebrisProbe } from "./debris-probe.js";
import { rollIsGoldFragment } from "./gold-fragment.js";

export interface StormSpawnDims {
  width: number;
  height: number;
}

export type StormSpawnOpts = {
  /** When true, storm progression freezes (Story 3.4 shatter / cutscenes). */
  paused?: boolean;
  /** Multiplies base spawn interval; lower = faster spawns (Story 3.4 intensity). */
  intervalScale?: number;
};

/**
 * Procedural inward storm spawns driven by accumulated `dt` (SyncClock gameplay delta).
 * Inward aim uses the **viewport center** (renderer w/h). That matches a centered planet
 * until a dedicated planet transform exists in the scene graph.
 * When the pool is exhausted, intervals are **not** consumed so spawns catch up once slots free.
 */
export class DebrisStormSpawner {
  private readonly _pool: DebrisPool;
  private readonly _rng: () => number;
  private _accum = 0;
  /** Until the first successful tutorial spawn, the next acquired debris uses the first-wave path */
  private _tutorialFirstSpawnPending = true;

  public constructor(pool: DebrisPool, rng: () => number = Math.random) {
    this._pool = pool;
    this._rng = rng;
  }

  /** @internal tests */
  public get accumulatedSeconds(): number {
    return this._accum;
  }

  /** @internal tests — true until the first successful tutorial spawn completes */
  public get tutorialFirstSpawnPending(): boolean {
    return this._tutorialFirstSpawnPending;
  }

  public reset(): void {
    this._accum = 0;
    this._tutorialFirstSpawnPending = true;
  }

  /**
   * Attempt spawns for elapsed time. Uses renderer dimensions for edge positions and center target.
   */
  public update(dt: number, dims: StormSpawnDims, opts?: StormSpawnOpts): void {
    if (dt <= 0) {
      return;
    }
    if (opts?.paused) {
      return;
    }
    const base = CONFIG.DEBRIS_STORM.SPAWN_INTERVAL_SEC;
    if (base <= 0) {
      return;
    }
    const scale = opts?.intervalScale ?? 1;
    const interval = Math.max(1e-9, base * scale);

    this._accum += dt;
    const { width: w, height: h } = dims;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const m = CONFIG.DEBRIS_STORM.EDGE_MARGIN;

    while (this._accum >= interval) {
      const d = this._pool.acquire();
      if (d === null) {
        break;
      }
      this._accum -= interval;
      this._spawnOne(d, w, h, cx, cy, m);
    }
  }

  private _spawnOne(
    debris: DebrisProbe,
    w: number,
    h: number,
    cx: number,
    cy: number,
    m: number,
  ): void {
    if (this._tutorialFirstSpawnPending) {
      this._spawnTutorialFirstWave(debris, cx, cy, m);
      return;
    }

    const rng = this._rng;
    const edge = Math.floor(rng() * 4);
    const spanX = Math.max(0, w - 2 * m);
    const spanY = Math.max(0, h - 2 * m);
    let x = 0;
    let y = 0;

    switch (edge) {
      case 0: // top
        x = m + rng() * spanX;
        y = -m;
        break;
      case 1: // right
        x = w + m;
        y = m + rng() * spanY;
        break;
      case 2: // bottom
        x = m + rng() * spanX;
        y = h + m;
        break;
      default: // left
        x = -m;
        y = m + rng() * spanY;
        break;
    }

    const dx = cx - x;
    const dy = cy - y;
    const len = Math.hypot(dx, dy);
    const nx = len > 1e-6 ? dx / len : 1;
    const ny = len > 1e-6 ? dy / len : 0;

    const jitter = (rng() - 0.5) * 0.35;
    const px = -ny;
    const py = nx;
    const jx = nx + px * jitter;
    const jy = ny + py * jitter;
    const jLen = Math.hypot(jx, jy);
    const fx = jLen > 1e-6 ? jx / jLen : nx;
    const fy = jLen > 1e-6 ? jy / jLen : ny;

    const smin = CONFIG.DEBRIS_STORM.SPEED_MIN;
    const smax = CONFIG.DEBRIS_STORM.SPEED_MAX;
    const speed = smin + rng() * Math.max(0, smax - smin);

    const id = debris.id;
    debris.tutorialFirstWaveActive = false;
    const gold = rollIsGoldFragment(rng, CONFIG.GOLD_DEBRIS.SPAWN_CHANCE);
    debris.setStormState(id, x, y, fx * speed, fy * speed, gold);
  }

  /**
   * Top-center spawn; angular deviation from `CONFIG.ONBOARDING.FIRST_WAVE_JITTER` (0 = straight).
   * Speed = scale × same RNG draw as a normal spawn.
   */
  private _spawnTutorialFirstWave(
    debris: DebrisProbe,
    cx: number,
    cy: number,
    m: number,
  ): void {
    this._tutorialFirstSpawnPending = false;
    const rng = this._rng;
    const x = cx;
    const y = -m;

    const dx = cx - x;
    const dy = cy - y;
    const len = Math.hypot(dx, dy);
    const nx = len > 1e-6 ? dx / len : 0;
    const ny = len > 1e-6 ? dy / len : 1;

    const jw = CONFIG.ONBOARDING.FIRST_WAVE_JITTER;
    let fx = nx;
    let fy = ny;
    if (jw > 1e-9) {
      const jitter = (rng() - 0.5) * jw;
      const px = -ny;
      const py = nx;
      const jx = nx + px * jitter;
      const jy = ny + py * jitter;
      const jLen = Math.hypot(jx, jy);
      fx = jLen > 1e-6 ? jx / jLen : nx;
      fy = jLen > 1e-6 ? jy / jLen : ny;
    }

    const smin = CONFIG.DEBRIS_STORM.SPEED_MIN;
    const smax = CONFIG.DEBRIS_STORM.SPEED_MAX;
    const baseSpeed = smin + rng() * Math.max(0, smax - smin);
    const speed = baseSpeed * CONFIG.ONBOARDING.FIRST_WAVE_SPEED_SCALE;

    const id = debris.id;
    debris.tutorialFirstWaveActive = true;
    debris.setStormState(id, x, y, fx * speed, fy * speed, false);
  }
}
