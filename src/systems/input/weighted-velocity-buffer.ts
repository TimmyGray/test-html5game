import { CONFIG } from "../../config/config.js";

/**
 * Ring buffer of recent pointer deltas (dx, dy). Weighted average favors recent samples
 * via CONFIG.FLICK.WEIGHTS (oldest → newest slot alignment).
 */
export class WeightedVelocityBuffer {
  private readonly _cap: number;
  private readonly _dx: Float32Array;
  private readonly _dy: Float32Array;
  private readonly _weights: readonly number[];
  private _next = 0;
  private _count = 0;

  constructor() {
    this._cap = CONFIG.FLICK.BUFFER_SIZE;
    this._dx = new Float32Array(this._cap);
    this._dy = new Float32Array(this._cap);
    this._weights = CONFIG.FLICK.WEIGHTS;
    if (this._weights.length !== this._cap) {
      throw new Error("CONFIG.FLICK.WEIGHTS length must equal BUFFER_SIZE");
    }
  }

  public reset(): void {
    this._next = 0;
    this._count = 0;
  }

  /** Push one displacement sample (no allocation). */
  public push(dx: number, dy: number): void {
    this._dx[this._next] = dx;
    this._dy[this._next] = dy;
    this._next = (this._next + 1) % this._cap;
    if (this._count < this._cap) {
      this._count++;
    }
  }

  public get count(): number {
    return this._count;
  }

  /**
   * Weighted average of stored deltas into `out`.
   * Uses the last `_count` entries of `_weights` (normalized) so recent samples get higher weights.
   */
  public getWeightedDelta(out: { x: number; y: number }): void {
    if (this._count === 0) {
      out.x = 0;
      out.y = 0;
      return;
    }
    const w = this._weights;
    const start = w.length - this._count;
    let sw = 0;
    out.x = 0;
    out.y = 0;
    for (let i = 0; i < this._count; i++) {
      const idx = (this._next - this._count + i + this._cap * 2) % this._cap;
      const wi = w[start + i];
      out.x += this._dx[idx] * wi;
      out.y += this._dy[idx] * wi;
      sw += wi;
    }
    if (sw > 0) {
      out.x /= sw;
      out.y /= sw;
    }
  }
}
