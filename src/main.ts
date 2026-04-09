import { Application } from "pixi.js";
import "./style.css";
import { CONFIG } from "./config/config.js";
import { MicroSlowMo } from "./core/micro-slow-mo.js";
import { SyncClock } from "./core/sync-clock.js";
import { gameEvents, EVENTS } from "./core/events.js";
import { initGameplay } from "./bootstrap-gameplay.js";

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

/**
 * The Reactive Planet - Entry Point
 */
(async () => {
  try {
    const app = await initPixiApp();

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
        window.removeEventListener("keydown", resumeAudio);
      };
      window.addEventListener("pointerdown", resumeAudio);
      window.addEventListener("keydown", resumeAudio);
    }

    const gameplay = initGameplay(app, { audioContext: audioCtx });

    const onTick = (): void => {
      SyncClock.instance.sync(app.ticker);
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
        gameplay.destroy();
      },
      { once: true },
    );
  } catch (error) {
    console.error("Initialization Failed:", error);
    mountStartupError(error);
  }
})();
