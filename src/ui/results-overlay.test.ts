// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONFIG } from "../config/config.js";
import { buildGladosEvaluationLine } from "../core/glados-evaluation.js";
import { gameEvents, EVENTS } from "../core/events.js";
import { updateHighScoreIfBeat } from "../core/high-score-storage.js";
import { ResultsOverlayController } from "./results-overlay.js";

describe("ResultsOverlayController", () => {
  let host: HTMLDivElement;
  let ctl: ResultsOverlayController;

  beforeEach(() => {
    const mem = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      },
      removeItem: (k: string) => {
        mem.delete(k);
      },
      clear: () => {
        mem.clear();
      },
    } as Storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    ctl?.dispose();
    host?.remove();
  });

  it("subscribes to SESSION_ENDED and reveals outcome copy", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    let replayCount = 0;
    ctl = new ResultsOverlayController(host, () => {
      replayCount++;
    });

    expect(ctl.isVisibleForTesting).toBe(false);

    localStorage.removeItem(CONFIG.PERSISTENCE.HIGH_SCORE_LOCAL_STORAGE_KEY);
    updateHighScoreIfBeat(1200);
    gameEvents.emit(EVENTS.SESSION_ENDED, {
      outcome: "victory",
      elapsedSessionSec: 30,
      totalScore: 1200,
      maxComboMultiplier: 8,
      finalAtmosphericHealth01: 0.4,
    });
    expect(ctl.isVisibleForTesting).toBe(true);
    expect(host.querySelector(".rp-results-stats")?.textContent).toBe(
      "Run 1,200 · Best 1,200",
    );
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

    updateHighScoreIfBeat(0);
    gameEvents.emit(EVENTS.SESSION_ENDED, {
      outcome: "shatter",
      elapsedSessionSec: 12,
      totalScore: 0,
      maxComboMultiplier: 1,
      finalAtmosphericHealth01: 0,
    });
    expect(host.querySelector(".rp-results-stats")?.textContent).toBe(
      "Run 0 · Best 1,200",
    );
    expect(host.querySelector(".rp-results-title")?.textContent).toContain(
      "Shattered",
    );

    const replay = host.querySelector(
      ".rp-results-cta",
    ) as HTMLButtonElement | null;
    expect(replay).toBeTruthy();

    const architect = host.querySelector(
      ".rp-results-cta-architect",
    ) as HTMLButtonElement | null;
    expect(architect).toBeTruthy();

    const openSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => ({}) as Window);
    architect!.click();
    await vi.waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^https?:\/\//u),
        "_blank",
        "noopener,noreferrer",
      );
    });

    replay!.click();
    expect(ctl.isVisibleForTesting).toBe(false);
    expect(replayCount).toBe(1);
  });

  it("shows architect hint when new tab is blocked (Story 4.4)", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    ctl = new ResultsOverlayController(host, () => {});

    localStorage.removeItem(CONFIG.PERSISTENCE.HIGH_SCORE_LOCAL_STORAGE_KEY);
    gameEvents.emit(EVENTS.SESSION_ENDED, {
      outcome: "victory",
      elapsedSessionSec: 30,
      totalScore: 100,
      maxComboMultiplier: 2,
      finalAtmosphericHealth01: 0.5,
    });

    const hintEl = host.querySelector(
      ".rp-results-architect-hint",
    ) as HTMLParagraphElement | null;
    expect(hintEl).toBeTruthy();
    expect(hintEl!.hidden).toBe(true);

    vi.spyOn(window, "open").mockReturnValue(null);
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText: writeText } });

    const architect = host.querySelector(
      ".rp-results-cta-architect",
    ) as HTMLButtonElement | null;
    expect(architect).toBeTruthy();
    architect!.click();

    await vi.waitFor(() => {
      expect(hintEl!.hidden).toBe(false);
    });
    expect(hintEl!.textContent).toContain("blocked");
    expect(writeText).toHaveBeenCalledWith(CONFIG.RESULTS.ARCHITECT_NOTES_URL);
  });
});
