import { Container, Sprite, Texture } from "pixi.js";
import { CONFIG } from "../../config/config.js";
import {
  clampDebrisVisualVariantIndex,
  getDebrisTexture,
} from "./gameplay-visual-assets.js";

/**
 * Storm / flick debris body: sprite-backed visual, optional gold rules, comet trail (Story 5.3).
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

  public readonly graphics: Container;
  private readonly _sprite: Sprite;
  private readonly _trailRoot: Container;
  private readonly _trailGlow: Sprite;
  private readonly _trailCore: Sprite;
  private readonly _trailHighlight: Sprite;
  private _visualVariantIndex = 0;
  /** Signed angular velocity for asteroid sprite tumble (rad/s); does not affect collision. */
  private _visualSpinRadPerSec = 0;

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
    this.graphics = new Container();
    this.graphics.eventMode = "none";
    this._trailRoot = new Container();
    this._trailRoot.eventMode = "none";
    this._trailRoot.visible = false;
    this.graphics.addChild(this._trailRoot);
    this._trailGlow = this.createTrailLayer();
    this._trailCore = this.createTrailLayer();
    this._trailHighlight = this.createTrailLayer();
    this._trailRoot.addChild(this._trailGlow);
    this._trailRoot.addChild(this._trailCore);
    this._trailRoot.addChild(this._trailHighlight);
    this._sprite = new Sprite(Texture.WHITE);
    this._sprite.anchor.set(0.5);
    const spriteDiameter = CONFIG.DEBRIS_PROBE.RADIUS * 2;
    this._sprite.width = spriteDiameter;
    this._sprite.height = spriteDiameter;
    this.graphics.addChild(this._sprite);
    this.redraw();
  }

  public snapshotPrev(): void {
    this.prevX = this.x;
    this.prevY = this.y;
  }

  /** @internal tests */
  public get visualVariantIndex(): number {
    return this._visualVariantIndex;
  }

  /** @internal tests */
  public get trailVisible(): boolean {
    return this._trailRoot.visible;
  }

  /** @internal tests */
  public get trailRotationRad(): number {
    return this._trailRoot.rotation;
  }

  /** @internal tests — debris body sprite angle (rad), not velocity trail */
  public get spriteRotationRad(): number {
    return this._sprite.rotation;
  }

  /** @internal tests */
  public get visualSpinRadPerSec(): number {
    return this._visualSpinRadPerSec;
  }

  public integrate(dt: number): void {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this._visualSpinRadPerSec !== 0 && Number.isFinite(dt) && dt > 0) {
      this._sprite.rotation += this._visualSpinRadPerSec * dt;
    }
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
    this._sprite.texture = getDebrisTexture(
      this.goldFragment,
      this._visualVariantIndex,
    );
  }

  public syncGraphicsPosition(): void {
    this.graphics.position.set(this.x, this.y);
    this.updateTrail();
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
   * Storm spawn / pool reuse: identity, motion, variant, optional sprite tumble (rad/s, sign = CCW/CW).
   * Non-finite `visualSpinRadPerSec` becomes 0; sprite angle resets to 0 and advances in `integrate`.
   */
  public setStormState(
    newId: string,
    x: number,
    y: number,
    vx: number,
    vy: number,
    goldFragment = false,
    visualVariantIndex = 0,
    visualSpinRadPerSec = 0,
  ): void {
    this.id = newId;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.prevX = x;
    this.prevY = y;
    this.goldFragment = goldFragment;
    this._visualVariantIndex =
      clampDebrisVisualVariantIndex(visualVariantIndex);
    this._visualSpinRadPerSec = Number.isFinite(visualSpinRadPerSec)
      ? visualSpinRadPerSec
      : 0;
    this._sprite.rotation = 0;
    this.redraw();
    this._trailRoot.visible = false;
  }

  /**
   * Purpose: clear transient sprite/trail state when probe leaves the active pool.
   * Inputs assumptions: called by pool release/dispose paths only.
   * Outputs contract: no active trail geometry remains and default variant is restored.
   * Side effects: mutates display state, does not alter kinematics.
   * Failure modes: none.
   */
  public resetVisualState(): void {
    this._visualVariantIndex = 0;
    this._visualSpinRadPerSec = 0;
    this._sprite.rotation = 0;
    this._trailRoot.visible = false;
    this._trailRoot.rotation = 0;
    this.redraw();
  }

  /**
   * Purpose: render a velocity-aligned comet tail with speed-gated alpha/length falloff.
   * Inputs assumptions: called from `syncGraphicsPosition` each frame on active pooled probes.
   * Outputs contract: trail layers hide below threshold; when active, width/height/alpha/tint follow speed.
   * Side effects: mutates pooled trail `Sprite` transforms only; no collision state changes.
   * Failure modes: none; invalid/near-zero speed safely skips rendering.
   */
  private updateTrail(): void {
    const speed = Math.hypot(this.vx, this.vy);
    const threshold = CONFIG.DEBRIS_PROBE.TRAIL_MIN_SPEED;
    if (speed < threshold) {
      this._trailRoot.visible = false;
      return;
    }

    this._trailRoot.visible = true;
    const maxSpeed = Math.max(
      threshold + 1,
      CONFIG.DEBRIS_PROBE.TRAIL_MAX_SPEED,
    );
    const speed01 = Math.min(1, (speed - threshold) / (maxSpeed - threshold));
    const length =
      CONFIG.DEBRIS_PROBE.TRAIL_MIN_LENGTH +
      speed01 *
        (CONFIG.DEBRIS_PROBE.TRAIL_MAX_LENGTH -
          CONFIG.DEBRIS_PROBE.TRAIL_MIN_LENGTH);
    const width =
      CONFIG.DEBRIS_PROBE.TRAIL_MIN_WIDTH +
      speed01 *
        (CONFIG.DEBRIS_PROBE.TRAIL_MAX_WIDTH -
          CONFIG.DEBRIS_PROBE.TRAIL_MIN_WIDTH);
    const alpha = CONFIG.DEBRIS_PROBE.TRAIL_MAX_ALPHA * (0.3 + speed01 * 0.7);
    const heading = Math.atan2(this.vy, this.vx);
    this._trailRoot.rotation = heading;
    const trailTint = this.goldFragment ? 0xffd27a : 0x91dcff;
    const highlightTint = this.goldFragment ? 0xfff2d9 : 0xdff7ff;

    this._trailGlow.tint = trailTint;
    this._trailCore.tint = trailTint;
    this._trailHighlight.tint = highlightTint;

    this._trailGlow.width = length * 1.15;
    this._trailGlow.height = width * 1.85;
    this._trailGlow.alpha = alpha * 0.25;

    this._trailCore.width = length;
    this._trailCore.height = width;
    this._trailCore.alpha = alpha * 0.62;

    this._trailHighlight.width = length * 0.58;
    this._trailHighlight.height = width * 0.42;
    this._trailHighlight.alpha = alpha;
  }

  private createTrailLayer(): Sprite {
    const layer = new Sprite(Texture.WHITE);
    layer.anchor.set(1, 0.5);
    layer.x = 0;
    layer.y = 0;
    layer.blendMode = "add";
    return layer;
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
