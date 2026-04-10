// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { buildGladosEvaluationLine } from "../core/glados-evaluation.js";
import { gameEvents, EVENTS } from "../core/events.js";
import { ResultsOverlayController } from "./results-overlay.js";

describe("ResultsOverlayController", () => {
  let host: HTMLDivElement;
  let ctl: ResultsOverlayController;

  afterEach(() => {
    ctl?.dispose();
    host?.remove();
  });

  it("subscribes to SESSION_ENDED and reveals outcome copy", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    let replayCount = 0;
    ctl = new ResultsOverlayController(host, () => {
      replayCount++;
    });

    expect(ctl.isVisibleForTesting).toBe(false);

    gameEvents.emit(EVENTS.SESSION_ENDED, {
      outcome: "victory",
      elapsedSessionSec: 30,
      totalScore: 1200,
      maxComboMultiplier: 8,
      finalAtmosphericHealth01: 0.4,
    });
    expect(ctl.isVisibleForTesting).toBe(true);
    expect(host.querySelector(".rp-results-title")?.textContent).toContain(
      "Victory",
    );
    const vPayload = {
      outcome: "victory" as const,
      elapsedSessionSec: 30,
      totalScore: 1200,
      maxComboMultiplier: 8,
      finalAtmosphericHealth01: 0.4,
    };
    expect(host.querySelector(".rp-results-glados")?.textContent).toBe(
      buildGladosEvaluationLine(vPayload),
    );

    gameEvents.emit(EVENTS.SESSION_ENDED, {
      outcome: "shatter",
      elapsedSessionSec: 12,
      totalScore: 0,
      maxComboMultiplier: 1,
      finalAtmosphericHealth01: 0,
    });
    expect(host.querySelector(".rp-results-title")?.textContent).toContain(
      "Shattered",
    );

    const btn = host.querySelector(
      ".rp-results-cta",
    ) as HTMLButtonElement | null;
    expect(btn).toBeTruthy();
    btn!.click();
    expect(ctl.isVisibleForTesting).toBe(false);
    expect(replayCount).toBe(1);
  });
});
