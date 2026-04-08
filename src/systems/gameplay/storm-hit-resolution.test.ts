import { describe, it, expect } from "vitest";
import { RayCastIntersector } from "../physics/ray-cast-intersector.js";
import { DebrisProbe } from "./debris-probe.js";
import { pickBestStormHit } from "./storm-hit-resolution.js";

describe("pickBestStormHit", () => {
  it("selects the earliest flick hit and resolves ties deterministically", () => {
    const intersector = new RayCastIntersector(1e-7);
    const flick = { x1: 0, y1: 0, x2: 100, y2: 0 };
    const motionScratch = { x1: 0, y1: 0, x2: 0, y2: 0 };
    const candidateScratch = {
      hitX: 0,
      hitY: 0,
      tFlick: 0,
      tDebris: 0,
      debrisId: undefined,
      normalX: 0,
      normalY: 0,
    };
    const bestOut = {
      hitX: 0,
      hitY: 0,
      tFlick: 0,
      tDebris: 0,
      debrisId: undefined,
      normalX: 0,
      normalY: 0,
    };

    const a = new DebrisProbe(0, 0, "storm-debris-a");
    const b = new DebrisProbe(0, 0, "storm-debris-b");
    a.prevX = 50;
    a.prevY = -10;
    a.x = 50;
    a.y = 10;
    b.prevX = 80;
    b.prevY = -10;
    b.x = 80;
    b.y = 10;

    const hit = pickBestStormHit(
      intersector,
      flick,
      [a, b],
      2,
      motionScratch,
      candidateScratch,
      bestOut,
    );
    expect(hit).not.toBeNull();
    expect(hit!.debrisId).toBe(a.id);
  });
});
