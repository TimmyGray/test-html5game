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
});
