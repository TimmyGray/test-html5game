# Story 3.4: Intensity Stages & The Shatter (FSM)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Player,  
I want the game to build to a climatic finish,  
so that I experience the full technical "flex" of the project.

## Acceptance Criteria

1. Given a session duration of 30 seconds, when time passes 5s and 20s thresholds, then intensity stage transitions follow `Arrival -> Flow -> Climax`.
2. Stage transitions increase spawn frequency and shader oscillation intensity according to configured values.
3. Given atmospheric health reaches zero, then FSM transitions into the Professional Physics Shatter state.
4. FSM transitions are deterministic and use existing synchronized time/event systems (no ad-hoc timers for critical state).
5. Existing gameplay systems (input, hit logic, combo, gold fragments) remain compatible.
6. Add tests for stage thresholds and shatter transition behavior; run full suite.

## Tasks / Subtasks

- [x] Define/centralize intensity stage configuration and threshold constants (AC: #1, #2)
- [x] Implement or extend FSM for stage progression and shatter transition (AC: #1, #3, #4)
- [x] Wire stage outputs into spawn-rate and shader-intensity controls via existing systems (AC: #2)
- [x] Trigger shatter transition from authoritative health depletion path (AC: #3)
- [x] Add tests for threshold boundaries and transition ordering (AC: #6)
- [x] Run regression + manual pass through full 30s cycle (AC: #5, #6)

## Dev Notes

### Epic Context

- Story 3.4 is the culmination of Epic 3: progression pacing + fail-state bridge to end-of-session experience.
- Keep transition semantics explicit and deterministic; this state machine gates Epic 4 overlays.

### Previous Story Intelligence

- Stories 3.1-3.3 define health, combo, and heavy-fragment pressure; 3.4 orchestrates these into temporal progression.
- Reuse existing clock and event architecture rather than introducing parallel loop controllers.

### Architecture & Project Context Guardrails

- Quantize critical timing through core rhythm/time systems.
- Use event-driven decoupling for state changes affecting rendering/gameplay.
- Respect performance constraints and no-allocation loop rules.

### Testing Requirements

- Unit: stage selection at `<5s`, `>=5s && <20s`, `>=20s`.
- Unit: health->shatter transition priority and idempotence.
- Regression: no breakage in prior story modules and tests.
- Manual: verify clear, escalating intensity and correct shatter entry.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-list.md` - Story 3.4]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR10, FR13]
- [Source: `_bmad-output/gdd.md` - Intensity stages and failure state]
- [Source: `_bmad-output/game-architecture.md` - FSM and timing patterns]
- [Source: `_bmad-output/project-context.md`]

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Completion Notes List

- Story context prepared for implementation handoff.
- Added `CONFIG.INTENSITY_STAGES` (5s / 20s thresholds, 30s design ref) with per-stage spawn interval scale, heartbeat oscillation gain, and collision-spectacle gain multipliers.
- Implemented `IntensityShatterFsm` + helpers in `src/core/intensity-shatter-fsm.ts`; session elapsed uses `SyncClock` audio time anchored at first gameplay tick.
- Wired `bootstrap-gameplay`: `DebrisStormSpawner.update` runs immediately after `IntensityShatterFsm.sync` so `intervalScale` / `paused` match same-frame HP and session time; new storm slots get a follow-up `integrate(dt)` so motion matches the pre-reorder tick; `PlanetHeartbeatFilter.setOscillationIntensity`; `CollisionSpectacleController.setSpectacleIntensityMultiplier`; emits `INTENSITY_STAGE_CHANGED` and `PLANET_SHATTERED`.
- Unit tests: `intensity-shatter-fsm.test.ts` (incl. `spectacleIntensity` parity), extended `debris-storm-spawner.test.ts`. Full Vitest suite green.
- Manual: run the build / dev server and observe faster spawns + stronger pulse past 5s / 20s; let planet HP hit zero to freeze storm spawns and receive `PLANET_SHATTERED` (Epic 4 can subscribe).

### File List

- `_bmad-output/implementation-artifacts/3-4-intensity-stages-the-shatter-fsm.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/config/config.ts`
- `src/core/events.ts`
- `src/core/intensity-shatter-fsm.ts`
- `src/core/intensity-shatter-fsm.test.ts`
- `src/bootstrap-gameplay.ts`
- `src/systems/gameplay/debris-storm-spawner.ts`
- `src/systems/gameplay/debris-storm-spawner.test.ts`
- `src/vfx/planet-heartbeat-filter.ts`
- `src/vfx/collision-spectacle-filter.ts`

## Change Log

- 2026-04-09: Story 3.4 — intensity FSM, shatter latch, spawn/shader/spectacle wiring, tests, events.
- 2026-04-09: Post-review — spawner ordering vs FSM sync; spectacle intensity unit assertions; story marked done.

---

**Completion status:** done
