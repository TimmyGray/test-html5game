import { describe, expect, it } from "vitest";
import {
  RayCastIntersector,
  intersectFlickDebrisThick,
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

  it("thick hit when parallel segments are within debris radius", () => {
    const intersector = new RayCastIntersector(1e-7);
    const flick = { x1: 0, y1: 50, x2: 100, y2: 50 };
    const debris = { x1: 50, y1: -20, x2: 50, y2: 20 };
    expect(intersector.intersectSegments(flick, debris)).toBeNull();
    const hit = intersector.intersectSegmentsThick(flick, debris, 46, "d1");
    expect(hit).not.toBeNull();
    expect(hit!.debrisId).toBe("d1");
  });

  it("thick wrapper returns null when too far", () => {
    const scratch = {
      hitX: 0,
      hitY: 0,
      tFlick: 0,
      tDebris: 0,
      debrisId: undefined as string | undefined,
      normalX: 0,
      normalY: 0,
    };
    const flick = { x1: 0, y1: 0, x2: 10, y2: 0 };
    const debris = { x1: 100, y1: 100, x2: 100, y2: 200 };
    expect(
      intersectFlickDebrisThick(flick, debris, 10, 1e-7, "x", scratch),
    ).toBeNull();
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
