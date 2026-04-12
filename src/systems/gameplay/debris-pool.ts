import type { Container } from "pixi.js";
import { CONFIG } from "../../config/config.js";
import { DebrisProbe } from "./debris-probe.js";

/**
 * Fixed-size pool of `DebrisProbe` instances for storm debris. No runtime churn:
 * instances and bookkeeping arrays are allocated once at construction.
 */
export class DebrisPool {
  private readonly _slots: DebrisProbe[];
  /** Indices into `_slots` available for acquire */
  private readonly _free: number[];
  /** Active storm debris in stable iteration order (slice length = activeCount) */
  private readonly _active: DebrisProbe[];
  private _activeCount = 0;

  public constructor(poolSize: number = CONFIG.DEBRIS_POOL.SIZE) {
    const n = Math.min(poolSize, CONFIG.DEBRIS_POOL.MAX_ACTIVE);
    this._slots = new Array(n);
    this._free = [];
    this._active = new Array(n);

    for (let i = 0; i < n; i++) {
      const id = `storm-debris-${i}`;
      const d = new DebrisProbe(-10_000, -10_000, id, i);
      d.graphics.visible = false;
      this._slots[i] = d;
      this._free.push(i);
    }
  }

  /** Add all pooled graphics to the stage once (hidden until acquired). */
  public mount(parent: Container): void {
    const n = this._slots.length;
    for (let i = 0; i < n; i++) {
      parent.addChild(this._slots[i]!.graphics);
    }
  }

  /** Number of storm debris currently active */
  public get activeCount(): number {
    return this._activeCount;
  }

  /** In-place view of active debris (indices [0, activeCount)); do not retain across frames */
  public activeView(): readonly DebrisProbe[] {
    return this._active;
  }

  /**
   * Take a pooled instance or return null if at capacity.
   */
  public acquire(): DebrisProbe | null {
    if (this._free.length === 0) {
      return null;
    }
    const slot = this._free.pop()!;
    const d = this._slots[slot];
    d.graphics.visible = true;
    d.poolActiveIndex = this._activeCount;
    this._active[this._activeCount++] = d;
    return d;
  }

  /**
   * Return a live instance to the pool. No-op if not currently active (caller bug).
   */
  /**
   * Purpose: return every active storm piece to the free list (Story 4.1 session reset).
   * Inputs: none; uses `activeView` order.
   * Outputs: `activeCount` becomes 0; no allocations.
   */
  public releaseAllActive(): void {
    while (this._activeCount > 0) {
      const d = this._active[0]!;
      this.release(d);
    }
  }

  public release(debris: DebrisProbe): void {
    const idx = debris.poolActiveIndex;
    if (idx < 0) {
      return;
    }
    const last = this._activeCount - 1;
    if (idx !== last) {
      const swapped = this._active[last]!;
      this._active[idx] = swapped;
      swapped.poolActiveIndex = idx;
    }
    this._active[last] = debris;
    debris.poolActiveIndex = -1;
    this._activeCount--;

    debris.tutorialFirstWaveActive = false;
    debris.goldFragment = false;
    debris.resetVisualState();
    debris.graphics.visible = false;
    this._free.push(debris.poolSlotIndex);
  }

  /** Remove graphics from stage and destroy Pixi resources (game teardown). */
  public dispose(): void {
    this._activeCount = 0;
    this._free.length = 0;
    const n = this._slots.length;
    for (let i = 0; i < n; i++) {
      this._slots[i]!.poolActiveIndex = -1;
      this._slots[i]!.resetVisualState();
      this._free.push(i);
      const g = this._slots[i]!.graphics;
      g.parent?.removeChild(g);
      g.destroy();
    }
  }
}
