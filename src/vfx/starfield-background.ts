import { Container, Graphics } from "pixi.js";
import { CONFIG } from "../config/config.js";

const STARFIELD_COUNT = 128;

/** Deterministic [0,1) hash — no `Math.random` (resize path only). */
function hash01(i: number, salt: number): number {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Full-screen starfield behind gameplay. Redraws only on dimension change (no ticker allocations).
 */
export class StarfieldBackground extends Container {
  private readonly _g: Graphics;
  private readonly _nx: Float32Array;
  private readonly _ny: Float32Array;
  private readonly _nr: Float32Array;
  /** Reused on resize redraw only — avoids per-star option object churn */
  private readonly _starFill = { color: 0xccddee, alpha: 0 };
  private _lastW = -1;
  private _lastH = -1;

  public constructor() {
    super();
    this.eventMode = "none";
    this._g = new Graphics();
    this.addChild(this._g);

    const n = STARFIELD_COUNT;
    this._nx = new Float32Array(n);
    this._ny = new Float32Array(n);
    this._nr = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      this._nx[i] = hash01(i, 1.414);
      this._ny[i] = hash01(i, 2.718);
      this._nr[i] = 0.35 + hash01(i, 3.141) * 1.15;
    }
  }

  /** Sync draw to viewport; no-op when width/height unchanged. */
  public syncSize(width: number, height: number): void {
    if (width <= 0 || height <= 0) {
      return;
    }
    if (width === this._lastW && height === this._lastH) {
      return;
    }
    this._lastW = width;
    this._lastH = height;

    const g = this._g;
    g.clear();
    g.rect(0, 0, width, height).fill(CONFIG.SCREEN.BACKGROUND_COLOR);

    const n = STARFIELD_COUNT;
    const nx = this._nx;
    const ny = this._ny;
    const nr = this._nr;
    const fill = this._starFill;
    for (let i = 0; i < n; i++) {
      const cx = nx[i]! * width;
      const cy = ny[i]! * height;
      const r = nr[i]!;
      fill.alpha = 0.35 + hash01(i, 9.87) * 0.55;
      g.circle(cx, cy, r).fill(fill);
    }
  }
}
