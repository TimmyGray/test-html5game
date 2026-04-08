import { describe, expect, it } from "vitest";
import {
  RayCastIntersector,
  intersectSegmentsInternal,
} from "./ray-cast-intersector.js";

describe("RayCastIntersector", () => {
  const intersector = new RayCastIntersector(1e-7);

  it("detects crossing segments", () => {
    const flick = { x1: 0, y1: 0, x2: 10, y2: 10 };
    const debris = { x1: 0, y1: 10, x2: 10, y2: 0 };
    const hit = intersector.intersectSegments(flick, debris, "d1");
    expect(hit).not.toBeNull();
    expect(hit!.hitX).toBeCloseTo(5, 5);
    expect(hit!.hitY).toBeCloseTo(5, 5);
    expect(hit!.debrisId).toBe("d1");
    expect(Math.hypot(hit!.normalX, hit!.normalY)).toBeCloseTo(1, 6);
  });

  it("returns null on miss", () => {
    const flick = { x1: 0, y1: 0, x2: 5, y2: 0 };
    const debris = { x1: 10, y1: 5, x2: 20, y2: 5 };
    expect(intersector.intersectSegments(flick, debris)).toBeNull();
  });

  it("returns null for parallel segments", () => {
    const flick = { x1: 0, y1: 0, x2: 10, y2: 0 };
    const debris = { x1: 0, y1: 1, x2: 10, y2: 1 };
    expect(intersector.intersectSegments(flick, debris)).toBeNull();
  });

  it("returns null for collinear overlapping segments", () => {
    const flick = { x1: 0, y1: 0, x2: 10, y2: 0 };
    const debris = { x1: 4, y1: 0, x2: 8, y2: 0 };
    expect(intersector.intersectSegments(flick, debris)).toBeNull();
  });

  it("returns null for degenerate flick segment", () => {
    const flick = { x1: 2, y1: 2, x2: 2, y2: 2 };
    const debris = { x1: 0, y1: 0, x2: 4, y2: 4 };
    expect(intersector.intersectSegments(flick, debris)).toBeNull();
  });

  it("returns null for degenerate debris segment", () => {
    const flick = { x1: 0, y1: 0, x2: 4, y2: 4 };
    const debris = { x1: 2, y1: 2, x2: 2, y2: 2 };
    expect(intersector.intersectSegments(flick, debris)).toBeNull();
  });

  it("uses shared internal helper without NaN", () => {
    const hit = intersectSegmentsInternal(
      { x1: 0, y1: 0, x2: 1, y2: 1 },
      { x1: 1, y1: 0, x2: 0, y2: 1 },
      1e-9,
    );
    expect(hit).not.toBeNull();
    expect(Number.isFinite(hit!.hitX)).toBe(true);
    expect(Number.isFinite(hit!.hitY)).toBe(true);
  });
});
