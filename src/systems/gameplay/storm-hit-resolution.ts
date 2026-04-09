import { CONFIG } from "../../config/config.js";
import type { DebrisProbe } from "./debris-probe.js";
import type {
  RayCastIntersector,
  Segment2,
  SegmentHit,
} from "../physics/ray-cast-intersector.js";

const hitRadius = CONFIG.DEBRIS_PROBE.RADIUS + CONFIG.FLICK.HIT_EXTRA_RADIUS_PX;

/**
 * Earliest flick hit; tie-break by debris segment param, then stable `debrisId` (lexicographic).
 */
export function pickBestStormHit(
  intersector: RayCastIntersector,
  flick: Segment2,
  active: readonly DebrisProbe[],
  count: number,
  motionScratch: Segment2,
  candidateScratch: SegmentHit,
  bestOut: SegmentHit,
): SegmentHit | null {
  let hasBest = false;
  for (let i = 0; i < count; i++) {
    const d = active[i]!;
    d.writeMotionSegment(motionScratch);
    const hit = intersector.intersectSegmentsThick(
      flick,
      motionScratch,
      hitRadius,
      d.id,
      candidateScratch,
    );
    if (hit === null) {
      continue;
    }
    if (!hasBest) {
      copyHit(bestOut, hit);
      hasBest = true;
      continue;
    }
    if (
      hit.tFlick < bestOut.tFlick - 1e-9 ||
      (Math.abs(hit.tFlick - bestOut.tFlick) <= 1e-9 &&
        (hit.tDebris < bestOut.tDebris - 1e-9 ||
          (Math.abs(hit.tDebris - bestOut.tDebris) <= 1e-9 &&
            (hit.debrisId ?? "") < (bestOut.debrisId ?? ""))))
    ) {
      copyHit(bestOut, hit);
    }
  }
  return hasBest ? bestOut : null;
}

function copyHit(target: SegmentHit, source: SegmentHit): void {
  target.hitX = source.hitX;
  target.hitY = source.hitY;
  target.tFlick = source.tFlick;
  target.tDebris = source.tDebris;
  target.debrisId = source.debrisId;
  target.normalX = source.normalX;
  target.normalY = source.normalY;
}
