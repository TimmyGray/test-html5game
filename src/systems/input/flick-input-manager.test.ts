import { describe, expect, it } from "vitest";
import { createFlickIntentFromLocals } from "./flick-input-manager.js";

describe("FlickIntent parity (mouse vs touch)", () => {
  it("produces identical geometry and velocity when locals match", () => {
    const t = 42;
    const mouse = createFlickIntentFromLocals(
      10,
      20,
      100,
      200,
      3,
      4,
      5,
      1,
      "mouse",
      t,
    );
    const touch = createFlickIntentFromLocals(
      10,
      20,
      100,
      200,
      3,
      4,
      5,
      1,
      "touch",
      t,
    );
    expect(mouse.segmentStartX).toBe(touch.segmentStartX);
    expect(mouse.segmentEndY).toBe(touch.segmentEndY);
    expect(mouse.velocityX).toBe(touch.velocityX);
    expect(mouse.weightMagnitude).toBe(touch.weightMagnitude);
    expect(mouse.pointerType).not.toBe(touch.pointerType);
  });
});
