import { Graphics } from "pixi.js";
import { CONFIG } from "../../config/config.js";

/**
 * Single non-pooled debris body for Story 1.2 harness (Graphics circle + velocity).
 */
export class DebrisProbe {
  public id: string;
  public readonly poolSlotIndex: number;
  public poolActiveIndex = -1;
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public prevX: number;
  public prevY: number;
  /** True while this probe is the session’s unresolved first-wave tutorial piece */
  public tutorialFirstWaveActive = false;
  /** Heavy fragment: damped impulse + optional high-velocity reward path (Story 3.3) */
  public goldFragment = false;

  public readonly graphics: Graphics;

  public constructor(
    initialX?: number,
    initialY?: number,
    id: string = "debris-probe-1",
    poolSlotIndex: number = -1,
  ) {
    const d = CONFIG.DEBRIS_PROBE;
    this.id = id;
    this.poolSlotIndex = poolSlotIndex;
    this.x = initialX ?? d.INITIAL_X;
    this.y = initialY ?? d.INITIAL_Y;
    this.vx = d.INITIAL_VX;
    this.vy = d.INITIAL_VY;
    this.prevX = this.x;
    this.prevY = this.y;
    this.graphics = new Graphics();
    this.graphics.eventMode = "none";
    this.redraw();
  }

  public snapshotPrev(): void {
    this.prevX = this.x;
    this.prevY = this.y;
  }

  public integrate(dt: number): void {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  /**
   * Apply impulse from flick (clamped). Mass = 1.
   * @param impulseScale extra dampening (e.g. gold resistance); default 1
   */
  public applyImpulse(ix: number, iy: number, impulseScale = 1): void {
    const max = CONFIG.FLICK.MAX_IMPULSE;
    const s =
      impulseScale > 0 && Number.isFinite(impulseScale) ? impulseScale : 0;
    const nx = ix * CONFIG.FLICK.IMPULSE_SCALE * s;
    const ny = iy * CONFIG.FLICK.IMPULSE_SCALE * s;
    const m = Math.hypot(nx, ny);
    if (m > max && m > 0) {
      const clamp = max / m;
      this.vx += nx * clamp;
      this.vy += ny * clamp;
    } else {
      this.vx += nx;
      this.vy += ny;
    }
  }

  public redraw(): void {
    const r = CONFIG.DEBRIS_PROBE.RADIUS;
    const g = this.graphics;
    g.clear();
    g.circle(0, 0, r);
    const fill = this.goldFragment
      ? CONFIG.GOLD_DEBRIS.COLOR
      : CONFIG.DEBRIS_PROBE.COLOR;
    g.fill({ color: fill, alpha: 1 });
  }

  public syncGraphicsPosition(): void {
    this.graphics.position.set(this.x, this.y);
  }

  public writeMotionSegment(out: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }): void {
    out.x1 = this.prevX;
    out.y1 = this.prevY;
    out.x2 = this.x;
    out.y2 = this.y;
  }

  /**
   * Storm spawn / pool reuse: set identity, position, and velocity without allocating.
   */
  public setStormState(
    newId: string,
    x: number,
    y: number,
    vx: number,
    vy: number,
    goldFragment = false,
  ): void {
    this.id = newId;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.prevX = x;
    this.prevY = y;
    this.goldFragment = goldFragment;
    this.redraw();
  }

  public ensureLoopWrap(width: number, height: number): void {
    const margin = CONFIG.DEBRIS_PROBE.RADIUS * 2;
    if (this.x < -margin) {
      this.x = width + margin;
    }
    if (this.x > width + margin) {
      this.x = -margin;
    }
    if (this.y < -margin) {
      this.y = height + margin;
    }
    if (this.y > height + margin) {
      this.y = -margin;
    }
  }
}
