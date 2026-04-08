import { Application } from "pixi.js";
import "./style.css";
import { CONFIG } from "./config/config.js";
import { SyncClock } from "./core/sync-clock.js";
import { gameEvents, EVENTS } from "./core/events.js";

/**
 * The Reactive Planet - Entry Point
 */
(async () => {
  try {
    const app = new Application();

    await app.init({
      background: CONFIG.SCREEN.BACKGROUND_COLOR,
      resizeTo: window,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      preference: "webgpu",
    });

    const container = document.getElementById("pixi-container");
    if (container) {
      container.appendChild(app.canvas);
    } else {
      document.body.appendChild(app.canvas);
    }

    const audioCtx = new AudioContext();
    SyncClock.instance.calibrate(audioCtx);
    if (audioCtx.state === "suspended") {
      const resumeAudio = (): void => {
        void audioCtx.resume();
        window.removeEventListener("pointerdown", resumeAudio);
      };
      window.addEventListener("pointerdown", resumeAudio);
    }

    app.ticker.add(() => {
      SyncClock.instance.sync(app.ticker);
    });

    console.log("🚀 The Reactive Planet Initialized", {
      renderer: app.renderer.constructor.name,
      gpu: app.renderer.type,
    });

    gameEvents.emit(EVENTS.GAME_START);

    window.addEventListener("error", (e) => {
      console.error("Critical System Fault:", e.message);
    });
  } catch (error) {
    console.error("Initialization Failed:", error);
  }
})();
