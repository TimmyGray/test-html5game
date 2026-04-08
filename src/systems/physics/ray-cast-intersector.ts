import { CONFIG } from "../../config/config.js";

export interface Segment2 {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Hit data for segment–segment (CCD) intersection */
export interface SegmentHit {
  hitX: number;
  hitY: number;
  /** Param on flick segment [0,1] */
  tFlick: number;
  /** Param on debris motion segment [0,1] */
  tDebris: number;
  /** Stable debris identity, when provided by caller. */
  debrisId?: string;
  /** Unit normal derived from debris motion segment. */
  normalX: number;
  normalY: number;
}

/**
 * 2D segment–segment intersection for flick vs swept debris motion (Story 1.2).
 * Degenerate (near-zero length) segments return null without NaNs.
 */
export class RayCastIntersector {
  private readonly _eps: number;
  private readonly _scratchHit: SegmentHit;

  public constructor(epsilon = CONFIG.FLICK.SEGMENT_EPSILON) {
    this._eps = epsilon;
    this._scratchHit = {
      hitX: 0,
      hitY: 0,
      tFlick: 0,
      tDebris: 0,
      debrisId: undefined,
      normalX: 0,
      normalY: 0,
    };
  }

  public intersectSegments(
    flick: Segment2,
    debrisMotion: Segment2,
    debrisId?: string,
    out?: SegmentHit,
  ): SegmentHit | null {
    return intersectSegmentsInternal(
      flick,
      debrisMotion,
      this._eps,
      debrisId,
      out ?? this._scratchHit,
    );
  }
}

export function intersectSegmentsInternal(
  flick: Segment2,
  debrisMotion: Segment2,
  eps: number,
  debrisId?: string,
  out?: SegmentHit,
): SegmentHit | null {
  const ax = flick.x1;
  const ay = flick.y1;
  const bx = flick.x2;
  const by = flick.y2;
  const cx = debrisMotion.x1;
  const cy = debrisMotion.y1;
  const dx = debrisMotion.x2;
  const dy = debrisMotion.y2;

  const rdx = bx - ax;
  const rdy = by - ay;
  const sdx = dx - cx;
  const sdy = dy - cy;

  const rLen = Math.hypot(rdx, rdy);
  const sLen = Math.hypot(sdx, sdy);
  if (rLen < eps || sLen < eps) {
    return null;
  }

  const denom = rdx * sdy - rdy * sdx;
  if (Math.abs(denom) < eps) {
    // Parallel or collinear — no stable single hit for gameplay; treat as miss
    return null;
  }

  const qpx = cx - ax;
  const qpy = cy - ay;

  const t = (qpx * sdy - qpy * sdx) / denom;
  const u = (qpx * rdy - qpy * rdx) / denom;

  if (t < -eps || t > 1 + eps || u < -eps || u > 1 + eps) {
    return null;
  }

  const tClamped = Math.min(1, Math.max(0, t));
  const hitX = ax + tClamped * rdx;
  const hitY = ay + tClamped * rdy;
  const invLen = 1 / sLen;
  const normalX = -sdy * invLen;
  const normalY = sdx * invLen;

  if (out) {
    out.hitX = hitX;
    out.hitY = hitY;
    out.tFlick = tClamped;
    out.tDebris = Math.min(1, Math.max(0, u));
    out.debrisId = debrisId;
    out.normalX = normalX;
    out.normalY = normalY;
    return out;
  }

  return {
    hitX,
    hitY,
    tFlick: tClamped,
    tDebris: Math.min(1, Math.max(0, u)),
    debrisId,
    normalX,
    normalY,
  };
}
