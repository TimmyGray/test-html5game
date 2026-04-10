// @vitest-environment jsdom

import { Container, Text } from "pixi.js";
import { afterEach, describe, expect, it } from "vitest";
import { gameEvents, EVENTS } from "../core/events.js";
import { ComboFireworksOverlay } from "./combo-fireworks-overlay.js";

describe("ComboFireworksOverlay", () => {
  let overlay: ComboFireworksOverlay;

  afterEach(() => {
    overlay?.dispose();
  });

  it("resetSession clears tier label and spark state for replay (Story 4.1)", () => {
    const parent = new Container();
    overlay = new ComboFireworksOverlay(() => ({ width: 400, height: 800 }));
    overlay.mount(parent);

    gameEvents.emit(EVENTS.COMBO_CHANGED, {
      consecutiveSuccessfulHits: 2,
      multiplier: 2,
    });
    const label = overlay.root.getChildAt(1) as Text;
    expect(label.alpha).toBeGreaterThan(0);

    overlay.resetSession();
    expect(label.alpha).toBe(0);

    overlay.update(1);
    expect(label.alpha).toBe(0);
  });
});
