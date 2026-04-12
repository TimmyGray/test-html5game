// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { gameEvents, EVENTS } from "../core/events.js";
import { ResultsOverlayController } from "./results-overlay.js";
import { SessionHudController } from "./session-hud.js";

describe("SessionHudController", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("tracks score/combo events and resets cleanly", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const hud = new SessionHudController(host);
    hud.mount();

    expect(hud.scoreTextForTesting).toBe("0");
    expect(hud.comboTextForTesting).toBe("x1");
    expect(hud.isVisibleForTesting).toBe(true);

    gameEvents.emit(EVENTS.SCORE_AWARDED, {
      delta: 120,
      fragmentKind: "normal",
      goldHighVelocityReward: false,
    });
    gameEvents.emit(EVENTS.SCORE_AWARDED, {
      delta: 30,
      fragmentKind: "gold",
      goldHighVelocityReward: true,
    });
    gameEvents.emit(EVENTS.COMBO_CHANGED, {
      consecutiveSuccessfulHits: 3,
      multiplier: 4,
    });

    expect(hud.scoreTextForTesting).toBe("150");
    expect(hud.comboTextForTesting).toBe("x4");

    gameEvents.emit(EVENTS.SESSION_ENDED, {
      outcome: "victory",
      elapsedSessionSec: 30,
      totalScore: 150,
      maxComboMultiplier: 4,
      finalAtmosphericHealth01: 0.2,
    });
    expect(hud.isVisibleForTesting).toBe(false);

    hud.resetSession();
    expect(hud.scoreTextForTesting).toBe("0");
    expect(hud.comboTextForTesting).toBe("x1");
    expect(hud.isVisibleForTesting).toBe(true);

    hud.dispose();
  });

  it("removes listeners on dispose to avoid duplicate updates across remounts", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const first = new SessionHudController(host);
    first.mount();
    gameEvents.emit(EVENTS.SCORE_AWARDED, {
      delta: 10,
      fragmentKind: "normal",
      goldHighVelocityReward: false,
    });
    expect(first.scoreTextForTesting).toBe("10");
    first.dispose();

    const second = new SessionHudController(host);
    second.mount();
    gameEvents.emit(EVENTS.SCORE_AWARDED, {
      delta: 5,
      fragmentKind: "normal",
      goldHighVelocityReward: false,
    });
    expect(second.scoreTextForTesting).toBe("5");
    second.dispose();
  });

  it("hides on session end and restores baseline through replay callback", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const hud = new SessionHudController(host);
    hud.mount();
    const overlay = new ResultsOverlayController(host, () => {
      hud.resetSession();
    });

    gameEvents.emit(EVENTS.SCORE_AWARDED, {
      delta: 250,
      fragmentKind: "gold",
      goldHighVelocityReward: true,
    });
    gameEvents.emit(EVENTS.COMBO_CHANGED, {
      consecutiveSuccessfulHits: 5,
      multiplier: 6,
    });
    expect(hud.scoreTextForTesting).toBe("250");
    expect(hud.comboTextForTesting).toBe("x6");

    gameEvents.emit(EVENTS.SESSION_ENDED, {
      outcome: "victory",
      elapsedSessionSec: 42,
      totalScore: 250,
      maxComboMultiplier: 6,
      finalAtmosphericHealth01: 0.45,
    });
    expect(hud.isVisibleForTesting).toBe(false);
    expect(overlay.isVisibleForTesting).toBe(true);

    const replayBtn = host.querySelector<HTMLButtonElement>(".rp-results-cta");
    expect(replayBtn).not.toBeNull();
    replayBtn?.click();

    expect(hud.isVisibleForTesting).toBe(true);
    expect(hud.scoreTextForTesting).toBe("0");
    expect(hud.comboTextForTesting).toBe("x1");
    expect(overlay.isVisibleForTesting).toBe(false);

    overlay.dispose();
    hud.dispose();
  });

  it("renders audio controls and invokes callbacks for mute + volume", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    let muted = false;
    let volume = 0.5;
    const hud = new SessionHudController(host, {
      initialMuted: false,
      initialVolume: 0.5,
      onMuteChange: (nextMuted: boolean): void => {
        muted = nextMuted;
      },
      onVolumeChange: (nextVolume: number): void => {
        volume = nextVolume;
      },
    });
    hud.mount();

    expect(hud.muteTextForTesting).toBe("Mute");
    expect(hud.volumeTextForTesting).toBe("50%");

    const muteButton = host.querySelector<HTMLButtonElement>(
      ".rp-session-hud-audio-mute",
    );
    expect(muteButton).not.toBeNull();
    muteButton?.click();
    expect(muted).toBe(true);
    expect(hud.muteTextForTesting).toBe("Unmute");

    const volumeInput = host.querySelector<HTMLInputElement>(
      ".rp-session-hud-audio-volume input[type='range']",
    );
    expect(volumeInput).not.toBeNull();
    if (volumeInput !== null) {
      volumeInput.value = "0.72";
      volumeInput.dispatchEvent(new Event("input"));
    }
    expect(volume).toBeCloseTo(0.72, 2);
    expect(hud.volumeTextForTesting).toBe("72%");

    hud.dispose();
  });
});
