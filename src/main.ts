import { Application } from "pixi.js";
import "./style.css";
import { CONFIG } from "./config/config.js";
import { MicroSlowMo } from "./core/micro-slow-mo.js";
import { SyncClock } from "./core/sync-clock.js";
import { gameEvents, EVENTS } from "./core/events.js";
import { readStoredHighScore } from "./core/high-score-storage.js";
import { BackgroundMusicDirector } from "./core/background-music.js";
import { initGameplay } from "./bootstrap-gameplay.js";
import { ensureGameplayVisualAssetsLoaded } from "./systems/gameplay/gameplay-visual-assets.js";
import { ResultsOverlayController } from "./ui/results-overlay.js";
import { SessionHudController } from "./ui/session-hud.js";
import bgmTrack128 from "../assets/Cosmic Freeway-128k.mp3";
import bgmTrackAlt128 from "../assets/Cosmic Freeway (1)-128k.mp3";

const makeInitOptions = (preference: "webgpu" | "webgl") => ({
  backgroundColor: CONFIG.SCREEN.BACKGROUND_COLOR,
  backgroundAlpha: 1,
  resizeTo: window,
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  preference,
});

async function initPixiApp(): Promise<Application> {
  try {
    const app = new Application();
    await app.init(makeInitOptions("webgpu"));
    return app;
  } catch (webgpuError) {
    console.warn("WebGPU init failed, falling back to WebGL.", webgpuError);
    const app = new Application();
    await app.init(makeInitOptions("webgl"));
    return app;
  }
}

/**
 * Purpose: Fixed “landing” label for personal best (Story 4.3); refreshes after each session end.
 * Inputs: DOM host (usually `#app`).
 * Outputs: disposer to remove node + listener on teardown.
 * Side effects: inserts a node; subscribes to `SESSION_ENDED`.
 * Failure modes: none thrown.
 */
function mountHighScoreLandingLabel(host: HTMLElement): () => void {
  const el = document.createElement("div");
  el.className = "rp-high-score-landing";
  el.setAttribute("aria-live", "polite");
  const refresh = (): void => {
    el.textContent = `Best ${readStoredHighScore().toLocaleString("en-US")}`;
  };
  refresh();
  host.insertBefore(el, host.firstChild);
  gameEvents.on(EVENTS.SESSION_ENDED, refresh);
  return () => {
    gameEvents.off(EVENTS.SESSION_ENDED, refresh);
    el.remove();
  };
}

function mountStartupError(error: unknown): void {
  const host = document.getElementById("pixi-container") ?? document.body;
  const panel = document.createElement("pre");
  panel.style.margin = "16px";
  panel.style.padding = "12px";
  panel.style.whiteSpace = "pre-wrap";
  panel.style.border = "1px solid #aa3333";
  panel.style.background = "#220909";
  panel.style.color = "#ffb3b3";
  panel.style.fontFamily = "Consolas, monospace";
  const details =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  panel.textContent = `Initialization failed.\n${details}`;
  host.appendChild(panel);
}

type StoredAudioPrefs = {
  muted: boolean;
  masterVolume: number;
};

/**
 * Purpose: read persisted audio control state so HUD and audio bus start aligned.
 * Inputs assumptions: localStorage may be unavailable or contain malformed JSON.
 * Outputs contract: always returns a safe mute/volume object within expected ranges.
 * Side effects: none.
 * Failure modes: storage/parse failures are swallowed and defaults are returned.
 */
function readStoredAudioPrefs(): StoredAudioPrefs {
  const fallback: StoredAudioPrefs = {
    muted: false,
    masterVolume: CONFIG.AUDIO.DEFAULT_MASTER_VOLUME,
  };
  try {
    const raw = window.localStorage.getItem(CONFIG.AUDIO.PLAYER_PREFS_KEY);
    if (raw === null) {
      return fallback;
    }
    const parsed = JSON.parse(raw) as Partial<StoredAudioPrefs>;
    return {
      muted: Boolean(parsed.muted),
      masterVolume: clamp01(parsed.masterVolume),
    };
  } catch {
    return fallback;
  }
}

/**
 * Purpose: persist player audio controls between sessions/dev reloads.
 * Inputs assumptions: prefs are normalized by caller.
 * Outputs contract: best-effort write only; gameplay flow must not depend on success.
 * Side effects: writes localStorage entry.
 * Failure modes: storage quota/privacy errors ignored to avoid gameplay interruption.
 */
function writeStoredAudioPrefs(prefs: StoredAudioPrefs): void {
  try {
    window.localStorage.setItem(
      CONFIG.AUDIO.PLAYER_PREFS_KEY,
      JSON.stringify(prefs),
    );
  } catch {
    /* ignore localStorage failures */
  }
}

function clamp01(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return CONFIG.AUDIO.DEFAULT_MASTER_VOLUME;
  }
  return Math.max(
    CONFIG.AUDIO.MASTER_VOLUME_MIN,
    Math.min(CONFIG.AUDIO.MASTER_VOLUME_MAX, value),
  );
}

/**
 * The Reactive Planet - Entry Point
 */
(async () => {
  try {
    const app = await initPixiApp();
    await ensureGameplayVisualAssetsLoaded();

    const container = document.getElementById("pixi-container");
    if (container) {
      container.appendChild(app.canvas);
    } else {
      document.body.appendChild(app.canvas);
    }

    const audioCtx = new AudioContext();
    SyncClock.instance.calibrate(audioCtx);
    let runtimeRhythmBpm = CONFIG.RHYTHM.BPM;
    let runtimeKickPulseBoost = 0;
    if (audioCtx.state === "suspended") {
      const resumeAudio = (): void => {
        void audioCtx.resume();
        window.removeEventListener("pointerdown", resumeAudio);
        window.removeEventListener("keydown", resumeAudio);
      };
      window.addEventListener("pointerdown", resumeAudio);
      window.addEventListener("keydown", resumeAudio);
    }

    const gameplay = initGameplay(app, {
      audioContext: audioCtx,
      getRhythmBpm: () => runtimeRhythmBpm,
      getKickPulseBoost: () => runtimeKickPulseBoost,
    });
    const bgmDirector = new BackgroundMusicDirector(
      audioCtx,
      gameplay.getMasterInputNode() ?? audioCtx.destination,
      runtimeRhythmBpm,
    );
    void bgmDirector.loadAndPlay([bgmTrack128, bgmTrackAlt128]);
    const storedAudioPrefs = readStoredAudioPrefs();
    gameplay.setAudioMuted(storedAudioPrefs.muted);
    gameplay.setMasterVolume(storedAudioPrefs.masterVolume);

    const appHost = document.getElementById("app") ?? document.body;
    const disposeHighScoreLanding = mountHighScoreLandingLabel(appHost);
    const sessionHud = new SessionHudController(appHost, {
      initialMuted: storedAudioPrefs.muted,
      initialVolume: storedAudioPrefs.masterVolume,
      onMuteChange: (muted: boolean): void => {
        gameplay.setAudioMuted(muted);
        const audioState = gameplay.getAudioState();
        writeStoredAudioPrefs({
          muted: audioState.muted,
          masterVolume: audioState.masterVolume,
        });
      },
      onVolumeChange: (volume: number): void => {
        gameplay.setMasterVolume(volume);
        const audioState = gameplay.getAudioState();
        writeStoredAudioPrefs({
          muted: audioState.muted,
          masterVolume: audioState.masterVolume,
        });
      },
    });
    sessionHud.mount();
    const resultsOverlay = new ResultsOverlayController(appHost, () => {
      gameplay.resetSession();
      sessionHud.resetSession();
    });

    const onTick = (): void => {
      SyncClock.instance.sync(app.ticker);
      bgmDirector.update();
      runtimeRhythmBpm = bgmDirector.state.detectedBpm;
      runtimeKickPulseBoost = bgmDirector.state.kickPulseBoost;
      gameplay.update();
      MicroSlowMo.instance.tick();
    };
    app.ticker.add(onTick);

    console.log("🚀 The Reactive Planet Initialized", {
      renderer: app.renderer.constructor.name,
      gpu: app.renderer.type,
    });

    gameEvents.emit(EVENTS.GAME_START);

    window.addEventListener("error", (e) => {
      console.error("Critical System Fault:", e.message);
    });
    window.addEventListener(
      "beforeunload",
      () => {
        app.ticker.remove(onTick);
        disposeHighScoreLanding();
        sessionHud.dispose();
        resultsOverlay.dispose();
        gameplay.destroy();
        bgmDirector.dispose();
      },
      { once: true },
    );
  } catch (error) {
    console.error("Initialization Failed:", error);
    mountStartupError(error);
  }
})();
