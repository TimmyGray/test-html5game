# Story 1.2: High-Fidelity Flick (Ray-Cast Intersector)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Player,
I want to flick debris with my finger or mouse,
so that I can deflect threats from the planetoid with frame-perfect precision.

## Acceptance Criteria

1. **Unified input → `FlickIntent`**: Pointer down / move / up (touch and mouse) are normalized through a single **Input Manager** that produces `FlickIntent` objects (screen-space positions in Pixi logical coordinates, timestamps, and a resolved swipe segment for the frame). [Source: project-context.md § Input Abstraction]
2. **Weighted Velocity Buffer**: The manager maintains a **small, fixed-size ring buffer** of recent pointer deltas (or displacements over known dt). On pointer up (or at commit time), it computes a **weighted** combined velocity vector used as the flick impulse direction/magnitude (weights favor more recent samples). No per-frame `new` in the ticker path—preallocate buffers. [Source: requirements FR3; game-architecture.md § Vector-Based CCD]
3. **`RayCastIntersector`**: A dedicated, testable module **`RayCastIntersector`** implements **2D ray/segment intersection** between:
   - the user’s flick segment (start/end in world/screen space aligned with the stage), and  
   - the debris motion segment for the **current frame** (previous position → current position), i.e. **swept segment / CCD** so fast debris cannot tunnel through a thin swipe. [Source: epic-list Story 1.2; game-architecture.md § Interaction]
4. **Hit resolution**: When an intersection exists, the intersector returns a deterministic hit result (at minimum: hit point, debris id or reference, and normals/t along segments) so gameplay can apply impulse. **Frame-rate independence**: correctness must not depend on a fixed 60fps assumption—use actual motion segments per frame. [Source: epic-list Story 1.2 **Then** clause]
5. **Impulse application (minimal)**: On hit, apply a **physically plausible** 2D impulse to the debris: direction derived from the weighted flick velocity, magnitude clamped using config constants; debris velocity updates in a way that can be observed in a dev harness (see Tasks). Full polish, scoring, and combo are **out of scope** for this story.
6. **Latency**: End-to-end path from last pointer sample to intersector query stays within the **under-16ms** interaction budget on desktop dev builds (no artificial sleeps); document any known browser limitations. [Source: NFR2, ux-design.md § Technical]
7. **Tests**:  
   - Unit tests for `RayCastIntersector` (segment–segment hit/miss, parallel, collinear edge cases, degenerate zero-length segments guarded).  
   - Unit tests for **Weighted Velocity Buffer** (known weights vs hand-calculated expected vector).  
   - Tests that **mouse and touch** paths both produce equivalent `FlickIntent` shapes when fed the same coordinate stream (simulate via plain objects / dispatch). [Source: project-context.md § Interaction Calibration]

## Tasks / Subtasks

- [x] **Scaffold & config** (AC: #1–2, #7)
  - [x] Add `src/systems/input/` with kebab-case modules per project layout; extend `CONFIG` with flick/buffer/intersection tuning constants (buffer size, weights, min swipe length, max impulse).
  - [x] Add any new `EVENTS` keys in `src/config/config.ts` (e.g. flick started/committed/hit) and wire through `gameEvents` only where needed—avoid duplicate string literals.

- [x] **`FlickIntent` + Input Manager** (AC: #1, #2, #6, #7)
  - [x] Define `FlickIntent` (types/interfaces) and an **Input Manager** that attaches to the Pixi `stage` (or canvas) using pointer events, maps to stage coordinates, and builds the flick segment for the current frame.
  - [x] Implement **Weighted Velocity Buffer** with preallocated storage; document weighting scheme in Dev Notes.
  - [x] Ensure hot paths avoid allocations (reuse vectors/points as fields or pooled structs if needed).

- [x] **`RayCastIntersector`** (AC: #3, #4)
  - [x] Implement `RayCastIntersector` class in `src/systems/physics/` or `src/systems/input/` (choose one domain and stay consistent with `project-context.md`—physics vs input; prefer **physics** for pure math, **input** for orchestration).
  - [x] API accepts two segments (flick + debris motion) and returns optional hit data; handle degenerate segments without NaNs.

- [x] **Dev harness / minimal debris** (AC: #4, #5)
  - [x] Introduce a **minimal movable debris probe** (e.g. one `Graphics` circle or `Sprite` placeholder) with position + velocity updated in `ticker` using `SyncClock.getDelta()` for motion—**not** full pooling (Story 1.3).
  - [x] On successful hit, update debris velocity from flick impulse; optional `gameEvents.emit(EVENTS.ASTEROID_HIT)` or dedicated event for debugging.

- [x] **Main integration** (AC: #1, #6)
  - [x] Wire Input Manager + intersector into `src/main.ts` (or a thin `bootstrap-gameplay.ts`) after Pixi init; ensure `SyncClock` remains the rhythm authority—flick uses the same clock for motion deltas where applicable.

- [x] **Validation** (AC: #7)
  - [x] Add `*.test.ts` files colocated with modules: `ray-cast-intersector.test.ts`, `weighted-velocity-buffer.test.ts` (or equivalent names), `flick-input.test.ts` if valuable.
  - [x] `npm test` and `npm run build` pass.

## Dev Notes

### Architecture & scope

- **Depends on Story 1.1**: `SyncClock`, `gameEvents`/`EVENTS`, Pixi `Application` bootstrap, WebGPU preference—**do not regress** these. [Source: `1-1-the-rhythmic-core-syncclock.md`]
- **In scope**: Input abstraction, velocity buffer, ray-cast/CCD hit detection, minimal impulse + one test debris body.
- **Explicitly later**: Object pooling & storm spawning (Epic 1 Story 1.3), onboarding tuning (1.4), Micro-Slow-Mo / shockwave VFX (Epic 2), combo scoring.

### Technical approach (guidance for implementer)

- **Segment–segment test**: Implement robust 2D segment intersection (parametric or cross-product method); use epsilon for floating-point compares.
- **CCD**: For each frame, debris sweeps from `pos - velocity * dt` to `pos` (or store `previousPosition` updated each tick). Flick segment is the polyline of the active swipe for that frame or the final segment from last move to release—**document the chosen rule** in code comments so Story 1.3+ stays consistent.
- **Weighted buffer**: Example pattern—exponential decay weights `w_i = pow(λ, n-i-1)` normalized, or fixed weights `[0.1, 0.15, 0.25, 0.5]` for last 4 samples; must be **config-driven**.
- **Performance**: Intersection work runs only when a flick is active and at least one debris exists; no unbounded loops on ticker.

### Project Structure Notes

- **Target layout** (align with [Source: project-context.md]):
  - `src/systems/input/` — `flick-intent.ts`, `flick-input-manager.ts`, `weighted-velocity-buffer.ts` (names may vary; keep **kebab-case** files, **PascalCase** classes).
  - `src/systems/physics/` — `ray-cast-intersector.ts` (`class RayCastIntersector`).
- **Reuse**: `gameEvents` + `EVENTS` from `src/core/events.ts`; do not add a second global bus.

### Project Context Rules

- **PixiJS**: v8.8.1 per `package.json`; use stage/screen transforms for pointer → world space consistently with `resizeTo` / `autoDensity`. [Source: project-context.md § Engine]
- **Strict No-Alloc Loop**: No `new` in per-frame ticker callbacks for gameplay/input hot paths; preallocate in constructors or module scope. [Source: project-context.md § Critical Don't-Miss]
- **Rhythm**: Do not use `setTimeout`/`setInterval`/`requestAnimationFrame` for gameplay timing—use `SyncClock` + ticker. [Source: project-context.md]
- **Testing**: Colocated `*.test.ts`, Vitest; core math/input must be unit-tested. [Source: project-context.md § Testing Rules]
- **Cross-platform input**: Single code path to `FlickIntent` for touch and mouse. [Source: project-context.md § Input Abstraction]

### UX alignment (implementation-facing)

- **Swipe trail / glow (200ms)**: Optional for this story; if implemented, use a `PIXI.Graphics` trail per [Source: ux-design.md § High-Fidelity Flick]. If scope-risky, defer visual trail to a follow-up and keep **functional** flick+raycast first.
- **Sub-16ms feel**: Prioritize low-latency pointer handling and minimal work per event. [Source: ux-design.md]

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-list.md` — Story 1.2]
- [Source: `_bmad-output/game-architecture.md` — Input Intersector, Vector-Based CCD]
- [Source: `_bmad-output/planning-artifacts/ux-design.md` — §3 Interaction Model]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` — FR1–FR3]
- [Source: `_bmad-output/project-context.md` — Code Organization, Testing, Platform]
- [Source: `_bmad-output/implementation-artifacts/1-1-the-rhythmic-core-syncclock.md` — prior deliverables]

### Latest technical notes (Pixi 8)

- Use **Pointer Events** / Pixi’s interaction model compatible with v8 (`event.global`, `stage` hit areas). Verify against installed `pixi.js@^8.8.1` types—avoid APIs removed in v8.

### Weighting scheme (implementation)

- `CONFIG.FLICK.WEIGHTS` is ordered **oldest → newest** sample; `WeightedVelocityBuffer` aligns the last `count` weights when the buffer is partially filled.

## Dev Agent Record

### Agent Model Used

Claude (Cursor Agent)

### Implementation Plan

- Config: `FLICK`, `DEBRIS_PROBE`, `EVENTS.FLICK_*`; epsilon for segment tests.
- Input: `FlickInputManager` on `stage` (`eventMode: static`), `FlickIntent`, `WeightedVelocityBuffer` (Float32 ring), final pointer-up delta pushed before weighted average.
- Physics: `RayCastIntersector` + `intersectSegmentsInternal` for tests; parallel/degenerate → null.
- Gameplay: `DebrisProbe` + `initGameplay` — ticker: `snapshotPrev` → `integrate(SyncClock.getDelta())` → resolve `FLICK_COMMIT` vs swept segment → impulse + `ASTEROID_HIT`.
- AC6: file header comment on synchronous pointer path; real sub-16ms depends on browser.

### Debug Log References

### Completion Notes List

- All tasks and ACs addressed; `npm test` (15 tests) and `npm run build` pass.
- Flick segment rule: pointer-down → pointer-up in stage space (`flick-input-manager.ts`).
- AC4 tightened: intersector hit now carries `debrisId` (optional) and unit normal plus segment params.
- AC6 instrumentation: runtime latency probe added from commit timestamp to intersector query, warns when budget exceeds 16ms.
- AC7 tightened: explicit collinear overlapping-segment test added for intersector.

### File List

- `src/config/config.ts`
- `src/main.ts`
- `src/bootstrap-gameplay.ts`
- `src/systems/input/flick-intent.ts`
- `src/systems/input/weighted-velocity-buffer.ts`
- `src/systems/input/weighted-velocity-buffer.test.ts`
- `src/systems/input/flick-input-manager.ts`
- `src/systems/input/flick-input-manager.test.ts`
- `src/systems/physics/ray-cast-intersector.ts`
- `src/systems/physics/ray-cast-intersector.test.ts`
- `src/systems/gameplay/debris-probe.ts`
- `src/systems/gameplay/debris-probe.test.ts`
- `src/core/sync-clock.ts`
- `src/core/sync-clock.test.ts`
- `src/style.css`
- `webpack.config.mjs`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-08: Story created — ultimate context engine analysis completed - comprehensive developer guide created
- 2026-04-08: Implemented flick input, velocity buffer, ray-cast intersector, debris probe harness, tests; status **review**
- 2026-04-08: Review findings resolved (AC4/AC6/AC7 updates); status set to **done**
