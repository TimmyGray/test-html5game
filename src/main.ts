import { Application } from "pixi.js";
import "./style.css";
import { CONFIG } from "./config/config.js";

/**
 * The Reactive Planet - Entry Point
 */
(async () => {
    try {
        const app = new Application();

        // Initialize PixiJS 8 with WebGPU/WebGL hybrid pipeline
        await app.init({
            background: CONFIG.SCREEN.BACKGROUND_COLOR,
            resizeTo: window,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
        });

        // Append canvas to the container defined in index.html (scaffolded as pixi-container)
        const container = document.getElementById("pixi-container");
        if (container) {
            container.appendChild(app.canvas);
        } else {
            document.body.appendChild(app.canvas);
        }

        console.log("🚀 The Reactive Planet Initialized", {
            version: "PIXI " + app.renderer.rendererLog,
            gpu: app.renderer.type
        });

        // Global Error Handler for "Professional Physics Shatter" (placeholder)
        window.addEventListener('error', (e) => {
            console.error("Critical System Fault:", e.message);
            // Trigger emergency visual state here
        });

    } catch (error) {
        console.error("Initialization Failed:", error);
    }
})();
