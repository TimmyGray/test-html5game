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

  public intersectSegmentsThick(
    flick: Segment2,
    debrisMotion: Segment2,
    hitRadius: number,
    debrisId?: string,
    out?: SegmentHit,
  ): SegmentHit | null {
    return intersectFlickDebrisThick(
      flick,
      debrisMotion,
      hitRadius,
      this._eps,
      debrisId,
      out ?? this._scratchHit,
    );
  }
}

/**
 * Closest point on segment (ax,ay)→(bx,by) to point (px,py); returns param t∈[0,1] on segment and dist².
 */
export function closestPointOnSegmentT(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): { t: number; d2: number } {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const abLenSq = abx * abx + aby * aby;
  let t = abLenSq > 1e-12 ? (apx * abx + apy * aby) / abLenSq : 0;
  t = Math.min(1, Math.max(0, t));
  const qx = ax + t * abx;
  const qy = ay + t * aby;
  const dx = px - qx;
  const dy = py - qy;
  return { t, d2: dx * dx + dy * dy };
}

/**
 * Thin segment intersection first; else debris “capsule”: closest approach between flick and debris motion
 * must be within `hitRadius` (world px). Samples debris motion for grazing hits.
 */
export function intersectFlickDebrisThick(
  flick: Segment2,
  debrisMotion: Segment2,
  hitRadius: number,
  eps: number,
  debrisId: string | undefined,
  out: SegmentHit,
): SegmentHit | null {
  const thin = intersectSegmentsInternal(
    flick,
    debrisMotion,
    eps,
    debrisId,
    out,
  );
  if (thin !== null) {
    return thin;
  }

  const r2 = hitRadius * hitRadius;
  const cx = debrisMotion.x1;
  const cy = debrisMotion.y1;
  const sdx = debrisMotion.x2 - cx;
  const sdy = debrisMotion.y2 - cy;
  const samples = 16;
  const rdx = flick.x2 - flick.x1;
  const rdy = flick.y2 - flick.y1;
  const rLen = Math.hypot(rdx, rdy);
  if (rLen < eps) {
    return null;
  }

  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const px = cx + u * sdx;
    const py = cy + u * sdy;
    const { t, d2 } = closestPointOnSegmentT(
      px,
      py,
      flick.x1,
      flick.y1,
      flick.x2,
      flick.y2,
    );
    if (d2 <= r2) {
      const tClamped = Math.min(1, Math.max(0, t));
      out.hitX = flick.x1 + tClamped * rdx;
      out.hitY = flick.y1 + tClamped * rdy;
      out.tFlick = tClamped;
      out.tDebris = u;
      out.debrisId = debrisId;
      const sLen = Math.hypot(sdx, sdy);
      const invLen = sLen > eps ? 1 / sLen : 0;
      out.normalX = -sdy * invLen;
      out.normalY = sdx * invLen;
      return out;
    }
  }
  return null;
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
