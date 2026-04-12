# The Reactive Planet

A rhythm-driven HTML5 action game where you protect a planet from an escalating debris storm using precise flick controls, combo chaining, and beat-synced reactions.

Built with **PixiJS v8 + TypeScript**, this project emphasizes responsive game feel, deterministic timing, and performance-aware architecture.

## Why this project stands out

- Fast, satisfying loop: flick, deflect, chain combos, survive pressure ramps.
- Strong audiovisual payoff: heartbeat pulse, shockwaves, chromatic hits, micro slow-mo.
- Replay motivation: score chase, rank evaluation, persistent high score, instant retry.

- Demonstrates real-time interaction systems (gesture input + ray-cast validation).
- Uses production-minded game-loop constraints (pooling, no hot-path allocations).
- Includes broad automated test coverage and story-level implementation traceability.

## Gameplay highlights

- **Core objective:** Keep debris from damaging the planet.
- **Input model:** Flick gestures are converted into intents and validated by intersection math.
- **Progression:** Difficulty scales through storm tuning, gold fragments, and intensity stages.
- **Feedback systems:** Combo fireworks, atmospheric health tint, quantized impact SFX, and spectacle filters.
- **Session loop:** Live HUD during play, then results/rank/high-score overlay with one-click replay.

## Quick start

### Requirements

- Node.js (LTS recommended)
- npm
- Modern browser (WebGPU preferred, WebGL 2 fallback supported)

### Run locally

```bash
npm install
npm run dev
```

Dev server runs on **port 5143** (configured in `webpack.config.mjs`).

### Useful commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start development server with source maps |
| `npm test` | Run Vitest suite |
| `npm run lint` | Run ESLint |
| `npm run build` | Lint + production build to `dist/` |

## Technical snapshot

- **Engine:** PixiJS `^8.8.1` (WebGPU-first initialization, WebGL fallback)
- **Language/tooling:** TypeScript `~5.7.3`, Webpack 5, ESLint, Prettier
- **Timing authority:** `SyncClock` (Web Audio time) for beat-sensitive gameplay
- **Performance strategy:** pooled entities/particles + branch-light shader logic
- **Audio stack:** background music director + quantized SFX scheduler

## Quality and testing

- Current automated suite: **159 tests** across **30 files** (`npm test`).
- Coverage includes core timing, input, collision, pooling, VFX envelopes, and UI controllers.
- Some tests may log Pixi asset-cache warnings in test mode; these do not fail the suite.

## Build and deployment notes

- Production build inlines scripts for self-contained output (`html-inline-script-webpack-plugin`).
- HTML is generated from `index.ejs` (there is no root `index.html` source file).
- `TRP_ARCHITECT_NOTES_URL` can be overridden at build time for deploy-specific CTA links.

## Repository structure

| Path | Purpose |
|---|---|
| `src/main.ts` | Application bootstrap and lifecycle |
| `src/bootstrap-gameplay.ts` | Gameplay integration hub |
| `src/config/config.ts` | Central immutable gameplay/config constants |
| `src/core/` | Clock, audio, scoring, state engines, storage |
| `src/systems/input/` | Flick input and velocity buffering |
| `src/systems/physics/` | Ray-cast intersector |
| `src/systems/gameplay/` | Debris pool/spawner/probe and resolution logic |
| `src/vfx/` | Heartbeat, collision spectacle, particle effects |
| `src/ui/` | HUD, results overlay, combo feedback, CTA behaviors |
| `assets/` | Planet/asteroid textures and audio assets |
| `_bmad-output/` | GDD, epics, implementation artifacts, retrospectives |

## Story traceability

Design-to-implementation artifacts are documented under `_bmad-output`:

- Story specs and completion records: `_bmad-output/implementation-artifacts/`
- Sprint status: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Epic plan and story inventory: `_bmad-output/planning-artifacts/epics/epic-list.md`
- Project standards and constraints: `_bmad-output/project-context.md`

This documentation allows reviewers to quickly inspect **what was built**, **why**, and **how it was validated**.

## Current status snapshot

- Epic 1-4: complete
- Epic 5: stories `5-1` to `5-3` implemented; epic status metadata still marked in-progress

## License

Package is currently private (`"private": true` in `package.json`). Add a `LICENSE` file before public distribution.
