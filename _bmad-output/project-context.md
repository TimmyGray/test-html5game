---
project_name: 'The Reactive Planet'
user_name: 'Commander'
date: '2026-04-08T04:01:18+03:00'
sections_completed: ['technology_stack', 'engine_rules', 'performance_rules', 'organization_rules', 'testing_rules', 'platform_rules', 'dont_miss_rules']
status: 'complete'
rule_count: 34
optimized_for_llm: true
---

# Project Context: The Reactive Planet

This document contains critical implementation rules and patterns that all AI agents must follow when contributing to "The Reactive Planet."

## Technology Stack & Versions

- **Engine**: PixiJS v8.8.1 (Primary: WebGPU, Fallback: WebGL).
- **Compiler**: TypeScript v5.7.3 (Target: ES2020, strict type checking).
- **Bundler**: Webpack v5.98.0 (Custom setup for hybrid asset inlining).
- **Animations**: AnimeJS (For non-shader based interactive tweens).
- **Logic Patterns**: ES Modules (Type: module), Finite State Machine (FSM).

## Engine-Specific Rules (PixiJS 8)

- **Renderer Preference**: Always initialize PixiJS with `preference: 'webgpu'` to leverage high-performance pipelines.
- **Asset Management**: Use the `Assets` utility (`Assets.load`, `Assets.add`) for all resource loading. Avoid deprecated `PIXI.Loader`.
- **Ticker & Time**: Implementation MUST use the `SyncClock` pattern to align `ticker.speed` with the Windows Web Audio API (`audioContext.currentTime`) for rhythmic precision.
- **Event Bus**: Use the native Pixi `EventEmitter` for system-wide communication. All event names must be defined in a central `EVENTS` constant.
- **Component Lifecycle**: Prioritize the `onTick(delta)` pattern over global listeners to ensure everything stays in the musical pocket.

## Performance Rules

- **Frame Budget**: Target a locked **60fps** (16.6ms budget per frame). Any single system (Physics, VFX) consuming > 2ms must be flagged for optimization.
- **Zero-Allocation Gameplay**: Mandatory **Object Pooling** for all dynamic actors (asteroids, debris, particles). Instantiating new objects during the `PLAYING` state is strictly forbidden.
- **Draw Call Optimization**: Use `ParticleContainer` for debris bursts and ensure all gameplay sprites are batched into a single `SpriteSheet`.
- **Payload Constraint**: The final single-file HTML bundle must remain **< 5MB**. Efficient texture compression (WebP) is required.
- **Shader Performance**: Complex math in the `Uber-Shader` must be optimized for mobile GPUs. Avoid heavy branching in the fragment shader.

## Code Organization Rules

- **Systematic Domain Structure**: All source code must be organized into these primary directories:
    - `/core`: Engine bootstrap, **SyncClock**, and base architectural classes.
    - `/systems`: Physics (Ray-Cast), Input (Flick), and Entity Management (Pooling).
    - `/vfx`: Shaders (**Uber-Shader**) and Particle system configurations.
    - `/ui`: Responsive HUD and Glassmorphism overlay components.
- **Naming Conventions**:
    - **Files**: Use `kebab-case` for all files (e.g., `entity-pool-manager.ts`).
    - **Classes/Interfaces**: Use `PascalCase` (e.g., `class RayCastIntersector`).
- **Decoupled Architecture**: Systems SHOULD communicate via the central **Event Bus** using `EventEmitter` to prevent circular dependencies.
- **Centralized Config**: All gameplay constants (gravity, speeds, colors) MUST be centralized in `src/config/config.js` or a dedicated constants file.

## Testing Rules

- **Core Logic Validation**: All systems driven by state or mathematics (**Ray-Cast**, **Intensity FSM**, **Scoring**) MUST have comprehensive unit tests.
- **Test Conventions**: Use the `[filename].test.ts` naming convention. Tests should live in the same directory as the module they are testing.
- **Interaction Calibration**: The **High-Fidelity Flick** logic must be validated against both Touch and Mouse input simulation to ensure platform-agnostic feels.
- **Visual Assurance**: All **VFX** and **Shader** implementations must pass a "Visual Polish Checklist" (sync precision, displacement intensity, aberration spikes) as defined in the GDD.
- **Performance Profiling**: Any modification to the **Entity Pool** or the **Uber-Shader** requires a mandatory browser profiling session to verify zero frame-drops during peak debris storms.

## Platform & Build Rules

- **Primary Target**: Optimized for **Mobile Safari** and **Google Chrome** (Mobile). WebGPU is preferred; WebGL 2 is the mandatory fallback.
- **Single-File Output**: The build pipeline MUST produce a standalone, self-contained HTML file. Use `html-inline-script-webpack-plugin` to embed all JS/TS and CSS.
- **Hybrid Inlining**: Small assets (< 50KB) must be **Base64 inlined**. Larger textures and audio should be compressed and loaded via the `Assets` utility.
- **Dynamic Responsiveness**: The game must adapt to **Portrait** and **Landscape** orientations in real-time. UI components must stay within the "Safe Area" boundaries.
- **Input Abstraction**: All interactions must be handled by a unified **Input Manager** that translates Touch and Mouse events into common `FlickIntent` objects.

## Critical Don't-Miss Rules

- **Strict No-Alloc Loop**: Any code executed within the `ticker` or `onTick` logic MUST NOT contain `new` keyword instantiations. Use the **Entity Manager**'s pooling system for all dynamic objects.
- **Rhythm Integrity**: DO NOT use `setTimeout`, `setInterval`, or standard `requestAnimationFrame` for gameplay-critical events. All rhythmic timing MUST be quantized via the **SyncClock**.
- **Asset Availability**: Never assume an asset is ready via legacy global paths. Always use the Pixi `Assets` utility and ensure you are working within an `async` context where `await` is respected.
- **Boundary Safety**: Never use absolute pixel values for HUD positioning. Implementation MUST use responsive percentages or respect the **Mobile Safe Area** values to avoid overlap with hardware notches.
- **Audio Guardrail**: All audio triggers MUST be preceded by a call to check the `AudioContext` state to handle browser **Autoplay Restrictions** gracefully.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any game code.
- Follow ALL rules exactly as documented.
- When in doubt, prefer the more restrictive option.
- Update this file if new patterns emerge.

**For Humans:**

- Keep this file lean and focused on agent needs.
- Update when technology stack changes.
- Review quarterly for outdated rules.
- Remove rules that become obvious over time.

Last Updated: 2026-04-08T04:01:18+03:00
