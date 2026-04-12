import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "pixi.js";
import { CONFIG } from "../../config/config.js";
import { DebrisPool } from "./debris-pool.js";

describe("DebrisPool", () => {
  let parent: Container;

  beforeEach(() => {
    parent = new Container();
  });

  it("acquires until exhausted then returns null", () => {
    const cap = Math.min(
      CONFIG.DEBRIS_POOL.SIZE,
      CONFIG.DEBRIS_POOL.MAX_ACTIVE,
    );
    const pool = new DebrisPool(cap);
    pool.mount(parent);
    const seen = new Set<string>();
    for (let i = 0; i < cap; i++) {
      const d = pool.acquire();
      expect(d).not.toBeNull();
      seen.add(d!.id);
    }
    expect(seen.size).toBe(cap);
    expect(pool.acquire()).toBeNull();
  });

  it("does not duplicate active references after recycle", () => {
    const pool = new DebrisPool(3);
    pool.mount(parent);
    const a = pool.acquire()!;
    const b = pool.acquire()!;
    expect(pool.activeCount).toBe(2);
    pool.release(a);
    expect(pool.activeCount).toBe(1);
    const c = pool.acquire()!;
    expect(pool.activeCount).toBe(2);
    const view = pool.activeView();
    expect(view[0]).toBe(b);
    expect(view[1]).toBe(c);
    expect(view[0]).not.toBe(view[1]);
  });

  it("resets visual variant state on release", () => {
    const pool = new DebrisPool(1);
    pool.mount(parent);
    const d = pool.acquire()!;
    d.setStormState(d.id, 10, 12, 100, 0, true, 3);
    expect(d.visualVariantIndex).toBe(3);
    pool.release(d);

    const reused = pool.acquire()!;
    expect(reused).toBe(d);
    expect(reused.visualVariantIndex).toBe(0);
  });
});
