import { describe, expect, it, vi } from "vitest";
import { CONFIG } from "../config/config.js";
import {
  CollisionSpectacleController,
  type CollisionSpectacleFilter,
} from "./collision-spectacle-filter.js";

function createMockFilter() {
  return {
    setIdle: vi.fn(),
    setActiveFrame: vi.fn(),
  };
}

describe("CollisionSpectacleController", () => {
  it("does not set active origin when screen size is invalid", () => {
    const f = createMockFilter();
    const c = new CollisionSpectacleController(
      f as unknown as CollisionSpectacleFilter,
    );
    c.triggerImpulse(0, 1, 1, 0, 100);
    c.updateFrame(0);
    expect(f.setActiveFrame).not.toHaveBeenCalled();
  });

  it("last hit wins when multiple triggers occur before update", () => {
    const f = createMockFilter();
    const c = new CollisionSpectacleController(
      f as unknown as CollisionSpectacleFilter,
    );
    const t0 = 0;
    c.triggerImpulse(t0, 10, 20, 100, 100);
    c.triggerImpulse(t0, 30, 40, 100, 100);
    c.updateFrame(t0);
    expect(f.setActiveFrame).toHaveBeenCalled();
    const [ox, oy] = f.setActiveFrame.mock.calls[0]!;
    expect(ox).toBeCloseTo(0.3);
    expect(oy).toBeCloseTo(0.4);
  });

  it("returns to idle after shockwave duration elapses", () => {
    const f = createMockFilter();
    const c = new CollisionSpectacleController(
      f as unknown as CollisionSpectacleFilter,
    );
    const t0 = 2.5;
    const dur = CONFIG.COLLISION_SPECTACLE.SHOCKWAVE_DURATION_SEC;
    c.triggerImpulse(t0, 50, 50, 100, 100);
    f.setIdle.mockClear();
    c.updateFrame(t0 + dur + 0.1);
    expect(f.setIdle).toHaveBeenCalled();
  });
});
