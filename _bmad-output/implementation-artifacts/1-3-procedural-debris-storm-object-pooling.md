# Story 1.3: Procedural Debris Storm (Object Pooling)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Player,  
I want a consistent storm of orbits to interact with,  
so that the game maintains a high-energy intensity without performance drops.

## Acceptance Criteria

1. **Procedural storm spawn:** Given the game scene is active, when the procedural spawn timer triggers, then debris objects spawn from screen edges with randomized trajectories toward the planet center. [Source: `_bmad-output/planning-artifacts/epics/epic-list.md` Story 1.3]
2. **Object pooling required:** Debris objects are managed through a reusable object pool (no runtime object creation churn in active gameplay). [Source: `_bmad-output/planning-artifacts/epics/epic-list.md` Story 1.3; `_bmad-output/project-context.md` Performance Rules]
3. **No-allocation hot path:** Per-frame update and spawn loop avoid new allocations while playing. [Source: `_bmad-output/project-context.md` Critical Don't-Miss Rules]
4. **Timing integrity:** Spawn cadence is driven through frame/ticker time derived from `SyncClock`-aligned gameplay flow, not `setTimeout`/`setInterval`. [Source: `_bmad-output/project-context.md` Rhythm Integrity]
5. **Regression-safe integration:** Existing Story 1.2 flick pipeline (`FlickInputManager` -> `FLICK_COMMIT` -> `RayCastIntersector` -> impulse) continues to function with multiple active debris instances.
6. **Tests:** Pooling and spawning logic include colocated unit tests for edge/boundary behavior.

## Tasks / Subtasks

- [x] **Add pool + storm config constants** (AC: #1, #2, #3, #4)
  - [x] Extend `src/config/config.ts` with `DEBRIS_STORM` and `DEBRIS_POOL` constants (spawn interval, pool size, speed ranges, edge margin, max active).
  - [x] Keep constants immutable (`Object.freeze`) and centralized with existing `CONFIG` patterns.

- [x] **Implement pooled debris system** (AC: #2, #3, #5)
  - [x] Add `src/systems/gameplay/debris-pool.ts` with preallocated instances and explicit `acquire`/`release`.
  - [x] Keep active/free collections deterministic and free of per-tick allocations.
  - [x] Preserve per-entity data needed by ray-cast (`id`, `snapshotPrev()`, `motionSegment()`, `integrate()`).

- [x] **Implement procedural storm spawner** (AC: #1, #4)
  - [x] Add `src/systems/gameplay/debris-storm-spawner.ts` to spawn from stage edges with randomized inward trajectories.
  - [x] Accumulate elapsed `dt` in update loop and spawn on interval thresholds.
  - [x] Use renderer dimensions (`app.renderer.width/height`) instead of fixed screen coordinates.

- [x] **Integrate in gameplay bootstrap** (AC: #1, #2, #5)
  - [x] Refactor `src/bootstrap-gameplay.ts` to update and render multiple pooled debris.
  - [x] For each pending flick, query intersections against active debris motion segments and resolve hit on the correct `debrisId`.
  - [x] Keep `gameEvents.emit(EVENTS.ASTEROID_HIT, ...)` payload shape compatible with existing listeners.

- [x] **Lifecycle and cleanup** (AC: #2, #3, #5)
  - [x] Recycle out-of-bounds or inactive debris back into the pool.
  - [x] Ensure `destroy()` detaches input/events and releases graphics/entities cleanly.

- [x] **Validation tests** (AC: #6)
  - [x] Add `src/systems/gameplay/debris-pool.test.ts`.
  - [x] Add `src/systems/gameplay/debris-storm-spawner.test.ts`.
  - [x] Keep Story 1.2 tests green (`flick-input-manager`, `weighted-velocity-buffer`, `ray-cast-intersector`, `debris-probe`).

## Dev Notes

### Previous Story Intelligence (1.2 -> 1.3)

- Story 1.2 introduced the working interaction spine: `FlickInputManager`, `WeightedVelocityBuffer`, `RayCastIntersector`, and `bootstrap-gameplay` orchestration.
- Collision checks currently operate on a single `DebrisProbe`; Story 1.3 should generalize to N active debris without changing event contracts.
- Existing tests already cover key math/input guarantees. Keep those contracts stable while adding pooling/storm tests.
- Current code uses `CONFIG` in `config.ts` and `gameEvents` from `src/core/events.ts`; continue these patterns (no parallel event system).

### Architecture Compliance Guardrails

- Maintain PixiJS 8 + WebGPU-first app initialization and current game loop ownership in `main.ts`.
- Keep gameplay timing `SyncClock`-aligned; do not introduce alternate timing loops.
- Continue vector-based CCD assumptions from architecture: ray-cast against swept motion segment per debris.
- Preserve codebase organization: gameplay logic under `src/systems/gameplay`, input under `src/systems/input`, physics math under `src/systems/physics`.

### Implementation Guidance

- Prefer reusing/extending `DebrisProbe` shape contract (`snapshotPrev`, `integrate`, `motionSegment`, `applyImpulse`) for pooled entities to reduce regression risk.
- Spawner should produce inward velocity vectors from edge positions toward center with bounded random variation to avoid identical trajectories.
- Keep hit resolution deterministic when multiple debris intersect a flick (for example: nearest by `tDebris` or first valid in stable iteration order). Document chosen policy in code comments.
- Consider a lightweight active-list iteration strategy to avoid filter/map allocations inside ticker updates.

### Project Structure Notes

- **New files expected:**
  - `src/systems/gameplay/debris-pool.ts`
  - `src/systems/gameplay/debris-storm-spawner.ts`
  - `src/systems/gameplay/debris-pool.test.ts`
  - `src/systems/gameplay/debris-storm-spawner.test.ts`
- **Likely modified files:**
  - `src/bootstrap-gameplay.ts`
  - `src/config/config.ts`
  - `src/systems/gameplay/debris-probe.ts` (only if adapting for pooled reuse)

### Project Context Rules

- Use **PixiJS `EventEmitter`** (`gameEvents`) and centralized `EVENTS` constants for system communication.
- **Mandatory object pooling** for dynamic actors in active gameplay; avoid runtime allocations in frame loop.
- Keep `*.test.ts` files colocated with modules.
- Build remains single-file optimized and performance-focused; avoid introducing heavy dependencies.
- Keep input abstraction unified (mouse/touch -> `FlickIntent`) and do not fork input paths in gameplay systems.

### Testing Requirements

- Pool tests:
  - Acquire/release semantics and cap handling.
  - No duplicate active references after repeated recycle.
- Spawner tests:
  - Spawn positions are on valid edges within margin rules.
  - Velocity points inward and speed range remains within config bounds.
  - Correct behavior when pool is exhausted (skip/defer spawn deterministically).
- Integration-oriented tests:
  - Multi-debris hit identifies expected `debrisId`.
  - Existing Story 1.2 unit tests remain passing.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-list.md` - Story 1.3]
- [Source: `_bmad-output/project-context.md` - Performance Rules, Critical Don't-Miss Rules, Code Organization, Testing Rules]
- [Source: `_bmad-output/game-architecture.md` - Vector-Based CCD, Object Pooling pattern, project structure]
- [Source: `_bmad-output/implementation-artifacts/1-2-high-fidelity-flick-ray-cast-intersector.md` - prior implementation and regression contracts]
- [Source: `src/bootstrap-gameplay.ts`]
- [Source: `src/systems/gameplay/debris-probe.ts`]
- [Source: `src/systems/input/flick-input-manager.ts`]
- [Source: `src/systems/physics/ray-cast-intersector.ts`]

## Dev Agent Record

### Agent Model Used

GPT-5.3 Codex

### Debug Log References

- N/A (story creation phase)

### Completion Notes List

- Implemented `DEBRIS_POOL` / `DEBRIS_STORM` in `config.ts`; `DebrisPool` + `DebrisStormSpawner` with SyncClock `dt` accumulation; bootstrap integrates multi-debris CCD via `pickBestStormHit` (earliest `tFlick`, then `tDebris`, then `debrisId`).
- Extended `DebrisProbe` with mutable `id` and `setStormState` for pool reuse; OOB recycling returns slots without per-frame allocations in the hot loop.
- Added colocated tests (`debris-pool`, `debris-storm-spawner`, `storm-hit-resolution`); full `npm test` and `npm run lint` pass.
- **Code review (2026-04-08):** Documented viewport-centered storm aim in `debris-storm-spawner.ts`; flick latency `console.warn` cooldown now uses wall-clock `performance.now()` in `bootstrap-gameplay.ts`; story File List completed with ticker/build wiring files.

### File List

- `_bmad-output/implementation-artifacts/1-3-procedural-debris-storm-object-pooling.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `index.ejs`
- `webpack.config.mjs`
- `src/main.ts`
- `src/style.css`
- `src/core/sync-clock.ts`
- `src/core/sync-clock.test.ts`
- `src/config/config.ts`
- `src/bootstrap-gameplay.ts`
- `src/systems/gameplay/debris-probe.ts`
- `src/systems/gameplay/debris-pool.ts`
- `src/systems/gameplay/debris-pool.test.ts`
- `src/systems/gameplay/debris-storm-spawner.ts`
- `src/systems/gameplay/debris-storm-spawner.test.ts`
- `src/systems/gameplay/storm-hit-resolution.ts`
- `src/systems/gameplay/storm-hit-resolution.test.ts`

## Change Log

- 2026-04-08: Story created and set to **ready-for-dev** with implementation guardrails and anti-regression guidance.
- 2026-04-08: Implemented procedural storm + pooling; status **review**; sprint status updated.
- 2026-04-08: Code review follow-ups applied; status **done**; sprint status **done** for this story.
