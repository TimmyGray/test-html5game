import { describe, it, expect } from "vitest";
import { Container } from "pixi.js";
import { CONFIG } from "../../config/config.js";
import { DebrisPool } from "./debris-pool.js";
import { DebrisStormSpawner } from "./debris-storm-spawner.js";

describe("DebrisStormSpawner", () => {
  it("spawns on edges within margin and aims inward with speed in range", () => {
    const parent = new Container();
    const pool = new DebrisPool(4);
    pool.mount(parent);

    const seq = [0.1, 0.2, 0.3, 0.4, 0.11, 0.12, 0.9, 0.6, 0.7, 0.8];
    let k = 0;
    const rng = (): number => {
      const v = seq[k % seq.length]!;
      k++;
      return v;
    };

    const spawner = new DebrisStormSpawner(pool, rng);
    spawner.update(CONFIG.DEBRIS_STORM.SPAWN_INTERVAL_SEC, {
      width: 800,
      height: 600,
    });

    expect(pool.activeCount).toBe(1);
    const d = pool.activeView()[0]!;
    const m = CONFIG.DEBRIS_STORM.EDGE_MARGIN;
    const w = 800;
    const h = 600;
    const cx = w * 0.5;
    const cy = h * 0.5;

    expect(d.x).toBeCloseTo(cx, 6);
    expect(d.y).toBeCloseTo(-m, 6);
    expect(d.tutorialFirstWaveActive).toBe(true);

    const dx = cx - d.x;
    const dy = cy - d.y;
    const dot = d.vx * dx + d.vy * dy;
    expect(dot).toBeGreaterThan(0);

    const smin = CONFIG.DEBRIS_STORM.SPEED_MIN;
    const smax = CONFIG.DEBRIS_STORM.SPEED_MAX;
    const baseline = smin + 0.1 * Math.max(0, smax - smin);
    const expected = baseline * CONFIG.ONBOARDING.FIRST_WAVE_SPEED_SCALE;
    const speed = Math.hypot(d.vx, d.vy);
    expect(speed).toBeCloseTo(expected, 6);
    expect(Math.abs(d.vx)).toBeLessThan(1e-6);
    expect(d.vy).toBeGreaterThan(0);
    expect(d.goldFragment).toBe(false);
    expect(d.visualVariantIndex).toBe(0);
  });

  it("second spawn uses jitter and full speed range (not tutorial)", () => {
    const parent = new Container();
    const pool = new DebrisPool(4);
    pool.mount(parent);

    const seq = [0.1, 0.2, 0.3, 0.4, 0.11, 0.12, 0.9, 0.6, 0.7, 0.8];
    let k = 0;
    const rng = (): number => {
      const v = seq[k % seq.length]!;
      k++;
      return v;
    };

    const spawner = new DebrisStormSpawner(pool, rng);
    const interval = CONFIG.DEBRIS_STORM.SPAWN_INTERVAL_SEC;
    spawner.update(interval * 2, { width: 800, height: 600 });

    expect(pool.activeCount).toBe(2);
    const d2 = pool.activeView()[1]!;
    expect(d2.tutorialFirstWaveActive).toBe(false);
    const speed2 = Math.hypot(d2.vx, d2.vy);
    expect(speed2).toBeGreaterThanOrEqual(CONFIG.DEBRIS_STORM.SPEED_MIN - 1e-6);
    expect(speed2).toBeLessThanOrEqual(CONFIG.DEBRIS_STORM.SPEED_MAX + 1e-6);
    const cx = 800 * 0.5;
    const cy = 600 * 0.5;
    const tox = cx - d2.x;
    const toy = cy - d2.y;
    const inLen = Math.hypot(tox, toy);
    const ivx = tox / inLen;
    const ivy = toy / inLen;
    const uvx = d2.vx / speed2;
    const uvy = d2.vy / speed2;
    const inwardAlignment = Math.abs(ivx * uvx + ivy * uvy);
    expect(inwardAlignment).toBeLessThan(0.9999);
    expect(d2.visualVariantIndex).toBeGreaterThanOrEqual(0);
    expect(d2.visualVariantIndex).toBeLessThan(4);
  });

  it("procedural spawn rolls gold from rng after fixed tutorial draw sequence", () => {
    const parent = new Container();
    const pool = new DebrisPool(4);
    pool.mount(parent);

    const draws = [
      0.5, // tutorial: base speed draw
      0.25, // tutorial variant
      0.11, // tutorial spin sign (<0.5 → CCW)
      0.5, // tutorial spin magnitude
      0.1, // procedural edge
      0.2, // procedural span axis
      0.3, // procedural jitter
      0.4, // procedural speed
      0.05, // procedural gold roll (< SPAWN_CHANCE)
      0.75, // procedural visual variant
      0.66, // procedural spin sign (≥0.5 → CW)
      0.25, // procedural spin magnitude
    ];
    let qi = 0;
    const rng = (): number => draws[qi++] ?? 0.99;

    const spawner = new DebrisStormSpawner(pool, rng);
    const interval = CONFIG.DEBRIS_STORM.SPAWN_INTERVAL_SEC;
    spawner.update(interval * 2, { width: 800, height: 600 });

    expect(pool.activeCount).toBe(2);
    expect(pool.activeView()[0]!.goldFragment).toBe(false);
    expect(pool.activeView()[1]!.goldFragment).toBe(true);
    expect(pool.activeView()[1]!.visualVariantIndex).toBe(3);
  });

  it("procedural spawn is not gold when final roll exceeds spawn chance", () => {
    const parent = new Container();
    const pool = new DebrisPool(4);
    pool.mount(parent);

    const draws = [
      0.5, // tutorial speed
      0.25, // tutorial variant
      0.11, // tutorial spin sign
      0.5, // tutorial spin magnitude
      0.1, // procedural edge
      0.2, // procedural span axis
      0.3, // procedural jitter
      0.4, // procedural speed
      0.99, // gold roll fails
      0.6, // procedural variant
      0.55, // procedural spin sign
      0.25, // procedural spin magnitude
    ];
    let qi = 0;
    const rng = (): number => draws[qi++] ?? 0.99;

    const spawner = new DebrisStormSpawner(pool, rng);
    const interval = CONFIG.DEBRIS_STORM.SPAWN_INTERVAL_SEC;
    spawner.update(interval * 2, { width: 800, height: 600 });

    expect(pool.activeView()[1]!.goldFragment).toBe(false);
    expect(pool.activeView()[1]!.visualVariantIndex).toBe(2);
  });

  it("does not consume tutorial spawn when pool is exhausted; applies on next acquire", () => {
    const parent = new Container();
    const pool = new DebrisPool(1);
    pool.mount(parent);
    const held = pool.acquire()!;
    expect(pool.acquire()).toBeNull();

    const spawner = new DebrisStormSpawner(pool, Math.random);
    const interval = CONFIG.DEBRIS_STORM.SPAWN_INTERVAL_SEC;
    spawner.update(interval, { width: 400, height: 300 });
    expect(spawner.tutorialFirstSpawnPending).toBe(true);

    pool.release(held);
    spawner.update(interval, { width: 400, height: 300 });
    expect(pool.activeCount).toBe(1);
    expect(spawner.tutorialFirstSpawnPending).toBe(false);
    expect(pool.activeView()[0]!.tutorialFirstWaveActive).toBe(true);
  });

  it("applies intervalScale so smaller scale spawns faster after tutorial", () => {
    const parent = new Container();
    const pool = new DebrisPool(8);
    pool.mount(parent);
    const spawner = new DebrisStormSpawner(pool, () => 0.5);
    const base = CONFIG.DEBRIS_STORM.SPAWN_INTERVAL_SEC;
    const dims = { width: 800, height: 600 };
    spawner.update(base, dims);
    expect(pool.activeCount).toBe(1);
    spawner.update(base, dims, { intervalScale: 0.5 });
    expect(pool.activeCount).toBe(3);
    const parentB = new Container();
    const poolB = new DebrisPool(8);
    poolB.mount(parentB);
    const spawnerB = new DebrisStormSpawner(poolB, () => 0.5);
    spawnerB.update(base, dims);
    spawnerB.update(base, dims);
    expect(poolB.activeCount).toBe(2);
  });

  it("does not advance spawns while paused", () => {
    const parent = new Container();
    const pool = new DebrisPool(4);
    pool.mount(parent);
    const spawner = new DebrisStormSpawner(pool, () => 0.5);
    const base = CONFIG.DEBRIS_STORM.SPAWN_INTERVAL_SEC;
    spawner.update(base, { width: 800, height: 600 });
    expect(pool.activeCount).toBe(1);
    spawner.update(base * 3, { width: 800, height: 600 }, { paused: true });
    expect(pool.activeCount).toBe(1);
    expect(spawner.accumulatedSeconds).toBeCloseTo(0, 5);
  });

  it("defers interval consumption when pool is exhausted", () => {
    const parent = new Container();
    const pool = new DebrisPool(1);
    pool.mount(parent);
    expect(pool.acquire()).not.toBeNull();
    expect(pool.acquire()).toBeNull();

    const spawner = new DebrisStormSpawner(pool);
    const interval = CONFIG.DEBRIS_STORM.SPAWN_INTERVAL_SEC;
    spawner.update(interval * 2, { width: 400, height: 300 });
    expect(spawner.accumulatedSeconds).toBeGreaterThanOrEqual(interval - 1e-9);
    expect(pool.activeCount).toBe(1);
  });
});
