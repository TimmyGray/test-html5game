/**
 * Pointer handlers run synchronously; no artificial sleeps in this path.
 * Sub-16ms end-to-end depends on browser/OS scheduling (Story 1.2 AC6).
 */
import { Container, Point, type FederatedPointerEvent } from "pixi.js";
import { CONFIG } from "../../config/config.js";
import { gameEvents, EVENTS } from "../../core/events.js";
import type { FlickIntent } from "./flick-intent.js";
import { WeightedVelocityBuffer } from "./weighted-velocity-buffer.js";

/** Build intent from resolved locals — used for tests (mouse vs touch parity). */
export function createFlickIntentFromLocals(
  localStartX: number,
  localStartY: number,
  localEndX: number,
  localEndY: number,
  velocityX: number,
  velocityY: number,
  weightMagnitude: number,
  pointerId: number,
  pointerType: string,
  committedAt: number,
): FlickIntent {
  return {
    segmentStartX: localStartX,
    segmentStartY: localStartY,
    segmentEndX: localEndX,
    segmentEndY: localEndY,
    velocityX,
    velocityY,
    weightMagnitude,
    pointerId,
    pointerType,
    committedAt,
  };
}

/**
 * Pointer → stage-local flick. Single active pointer; uses WeightedVelocityBuffer (no ticker allocations).
 * Flick segment rule: pointer-down position → pointer-up position (documented for Story 1.3+).
 */
export class FlickInputManager {
  private readonly _stage: Container;
  private readonly _buffer = new WeightedVelocityBuffer();
  private readonly _scratch = new Point();
  private readonly _weighted = { x: 0, y: 0 };

  private _activePointerId: number | null = null;
  private _startX = 0;
  private _startY = 0;
  private _lastX = 0;
  private _lastY = 0;

  private readonly _onDown = (e: FederatedPointerEvent): void => {
    this.onPointerDown(e);
  };
  private readonly _onMove = (e: FederatedPointerEvent): void => {
    this.onPointerMove(e);
  };
  private readonly _onUp = (e: FederatedPointerEvent): void => {
    this.onPointerUp(e);
  };

  public constructor(stage: Container) {
    this._stage = stage;
    stage.eventMode = "static";
  }

  public attach(): void {
    this._stage.on("pointerdown", this._onDown);
    this._stage.on("pointermove", this._onMove);
    this._stage.on("pointerup", this._onUp);
    this._stage.on("pointerupoutside", this._onUp);
    this._stage.on("pointercancel", this._onUp);
  }

  public detach(): void {
    this._stage.off("pointerdown", this._onDown);
    this._stage.off("pointermove", this._onMove);
    this._stage.off("pointerup", this._onUp);
    this._stage.off("pointerupoutside", this._onUp);
    this._stage.off("pointercancel", this._onUp);
  }

  private mapLocal(e: FederatedPointerEvent, out: Point): void {
    e.getLocalPosition(this._stage, out);
  }

  private onPointerDown(e: FederatedPointerEvent): void {
    if (this._activePointerId !== null) {
      return;
    }
    this._activePointerId = e.pointerId;
    this._buffer.reset();
    this.mapLocal(e, this._scratch);
    this._startX = this._scratch.x;
    this._startY = this._scratch.y;
    this._lastX = this._startX;
    this._lastY = this._startY;
    gameEvents.emit(EVENTS.FLICK_START, {
      pointerId: e.pointerId,
      pointerType: e.pointerType,
    });
  }

  private onPointerMove(e: FederatedPointerEvent): void {
    if (e.pointerId !== this._activePointerId) {
      return;
    }
    this.mapLocal(e, this._scratch);
    const dx = this._scratch.x - this._lastX;
    const dy = this._scratch.y - this._lastY;
    this._buffer.push(dx, dy);
    this._lastX = this._scratch.x;
    this._lastY = this._scratch.y;
  }

  private onPointerUp(e: FederatedPointerEvent): void {
    if (e.pointerId !== this._activePointerId) {
      return;
    }
    this._activePointerId = null;
    this.mapLocal(e, this._scratch);
    const endX = this._scratch.x;
    const endY = this._scratch.y;

    const dx = endX - this._startX;
    const dy = endY - this._startY;
    const dist = Math.hypot(dx, dy);
    if (dist < CONFIG.FLICK.MIN_SWIPE_PX) {
      return;
    }

    const fdx = endX - this._lastX;
    const fdy = endY - this._lastY;
    this._buffer.push(fdx, fdy);

    this._buffer.getWeightedDelta(this._weighted);
    const wmag = Math.hypot(this._weighted.x, this._weighted.y);

    const intent = createFlickIntentFromLocals(
      this._startX,
      this._startY,
      endX,
      endY,
      this._weighted.x,
      this._weighted.y,
      wmag,
      e.pointerId,
      e.pointerType,
      performance.now(),
    );

    gameEvents.emit(EVENTS.FLICK_COMMIT, intent);
  }
}
