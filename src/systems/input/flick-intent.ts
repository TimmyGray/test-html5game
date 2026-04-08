/**
 * Normalized flick payload after pointer commit (Pixi stage space).
 */
export interface FlickIntent {
  /** Segment start (pointer-down) */
  segmentStartX: number;
  segmentStartY: number;
  /** Segment end (pointer-up / commit) */
  segmentEndX: number;
  segmentEndY: number;
  /** Weighted combined displacement sample (px per sample window), not normalized */
  velocityX: number;
  velocityY: number;
  weightMagnitude: number;
  pointerId: number;
  /** `performance.now()` at commit */
  committedAt: number;
  pointerType: string;
}
