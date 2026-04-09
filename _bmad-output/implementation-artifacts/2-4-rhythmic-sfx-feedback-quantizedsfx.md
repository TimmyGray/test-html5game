# Story 2.4: Rhythmic SFX Feedback (QuantizedSFX)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Player,  
I want my interactions to sound like they are part of the music,  
so that the game feels like a reactive musical instrument.

## Acceptance Criteria

1. **Pitch quantization:** Given a successful "Perfect Smash" detection, when interaction SFX is triggered, then playback pitch is quantized to the track's musical key.
2. **Time quantization:** Given a successful "Perfect Smash" detection, when interaction SFX is triggered, then playback start is quantized to the nearest 1/16th note according to `SyncClock`.
3. **Correct trigger path:** Quantized SFX triggers only from confirmed successful deflection flow and never on miss, near-miss, or non-hit pointer interactions.
4. **Rhythm integrity:** No `setTimeout`/`setInterval` or wall-clock timing for gameplay-critical quantization; timing is derived from synchronized rhythm systems.
5. **Performance safety:** Audio scheduling and hit-event handling introduce no avoidable allocations in hot gameplay paths and preserve frame budget.
6. **Regression safety:** Existing gameplay behavior for Stories 1.1-1.4 and 2.1-2.3 remains stable and deterministic.
7. **Verification:** Add/extend automated tests for quantization math and trigger guards, then run full test suite and a short manual smoke in both WebGPU and WebGL fallback.

## Tasks / Subtasks

- [x] **Define quantization config and guardrails** (AC: #1, #2, #4, #5)
  - [x] Add immutable config entries for rhythmic quantization behavior (grid division = 1/16, allowed pitch set/key map, scheduling tolerance window).
  - [x] Keep constants centralized in `src/config/config.ts` and avoid hardcoded values in runtime systems.

- [x] **Implement quantized SFX core logic** (AC: #1, #2, #4)
  - [x] Add a focused rhythm-audio helper/module to compute nearest 1/16 note trigger time from `SyncClock`/beat phase.
  - [x] Add pitch quantization helper that maps "Perfect Smash" SFX playback rate/pitch to allowed key tones.
  - [x] Handle edge cases around beat boundary (just-before/just-after tick) deterministically.

- [x] **Wire into gameplay hit pipeline** (AC: #2, #3, #6)
  - [x] Trigger quantized audio only on confirmed successful deflection/perfect-smash path already used by collision spectacle.
  - [x] Reuse existing event bus and payload flow; do not duplicate collision detection or create parallel hit classification logic.
  - [x] Preserve current gameplay side effects (impulse, VFX, pooling lifecycle) while adding SFX.

- [x] **Audio context and browser safety** (AC: #4, #5)
  - [x] Ensure playback path respects AudioContext state guardrails before scheduling/triggering.
  - [x] Provide safe fallback behavior when audio context is suspended/unavailable (fail silent without crashing gameplay).

- [x] **Tests and verification** (AC: #1, #2, #3, #7)
  - [x] Add unit tests for time quantization math (nearest 1/16 note, tie-break behavior, boundary cases).
  - [x] Add unit tests for pitch quantization mapping and "perfect hit only" trigger constraints.
  - [x] Run full automated test suite and verify no regressions in existing core/gameplay/vfx tests.
  - [x] Perform quick manual checks for rhythm feel and sync in WebGPU and WebGL fallback.

## Dev Notes

### Epic Context (Epic 2)

- Epic 2 goal is the "Dopamine Payload": high-impact visual and auditory feedback layered on top of the core flick loop.
- Story 2.4 specifically closes FR17 by making hit SFX musically integrated through pitch and temporal quantization.
- This story must extend, not replace, existing Story 2.2/2.3 hit spectacle flow.

### Previous Story Intelligence (2.3 -> 2.4)

- Story 2.3 completed the confirmed-hit pipeline for micro-slow-mo and particle ejection and reinforced "single trigger path" discipline.
- 2.3 dev notes emphasize reusing `EVENTS.ASTEROID_HIT` payload and avoiding duplicate detection logic; 2.4 should follow this same event-first integration pattern.
- 2.3 follow-up fixes hardened audio-time stall behavior and monotonic beat progression logic; 2.4 quantization should build on those assumptions instead of bypassing them.
- Prior implementation emphasized deterministic behavior and test coverage for timing edge cases; continue this standard for quantized audio math.

### Architecture Compliance Guardrails

- Keep rhythm-critical timing anchored to `SyncClock` and the calibrated hybrid clock strategy.
- Use existing typed Event Bus (`EventEmitter` + centralized constants) for communication between gameplay and audio/rhythm logic.
- Preserve PixiJS 8 WebGPU-first compatibility with WebGL fallback; no engine or framework swaps.
- Maintain strict no-allocation discipline in ticker-driven gameplay loops.

### Implementation Guidance

- Prefer introducing a dedicated module under `src/core/` or `src/systems/` for quantization calculations so behavior stays testable and deterministic.
- Keep "perfect smash" gating explicit and centralized; reject all non-perfect hits before any scheduling/pitch work.
- If scheduling to nearest 1/16 would target a time already missed in current frame, apply a consistent rule (e.g., schedule to next valid subdivision) and codify it in tests.
- Treat pitch quantization as a pure mapping layer (input pitch intent -> allowed key tone) to simplify tests and future tuning.

### Project Structure Notes

- **Likely modified files:**
  - `src/bootstrap-gameplay.ts`
  - `src/config/config.ts`
  - `src/core/beat-phase.ts` (or equivalent rhythm utility, if needed)
  - `src/core/sync-clock.ts` (only if small helper exposure is required)
- **Likely new files:**
  - `src/core/quantized-sfx.ts` (or `src/systems/audio/quantized-sfx.ts`)
  - `src/core/quantized-sfx.test.ts` (or colocated tests by module path)

### Project Context Rules

- Use PixiJS 8 patterns and keep `SyncClock` as the canonical rhythm source.
- Use centralized `EVENTS` and avoid direct cross-system coupling.
- Do not use `setTimeout`, `setInterval`, or non-quantized wall-clock scheduling for gameplay-critical audio timing.
- Keep all gameplay/audio constants centralized in config.
- Respect audio autoplay restrictions by checking AudioContext state before playback.
- Keep tests colocated with modules using `[filename].test.ts` conventions.

### Testing Requirements

- **Unit (required):**
  - nearest 1/16 quantization math across beat boundaries
  - deterministic tie-break behavior for midpoint timing
  - pitch quantization mapping for configured key/scale
  - trigger guard: only successful perfect-smash path emits quantized SFX
- **Regression (required):**
  - existing hit-resolution, micro-slow-mo, collision spectacle, and intersector tests stay green
- **Manual smoke (required):**
  - confirm SFX feels on-grid with beat pulse in WebGPU and WebGL fallback

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-list.md` - Story 2.4]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR17, NFR1, NFR2, NFR5, NFR7]
- [Source: `_bmad-output/gdd.md` - Rhythm Specific Design, Audio Integration]
- [Source: `_bmad-output/game-architecture.md` - Calibrated Hybrid Clock, Typed Event Bus, PixiJS 8 stack]
- [Source: `_bmad-output/planning-artifacts/ux-design.md` - Interaction feedback and rhythmic UX expectations]
- [Source: `_bmad-output/project-context.md`]
- [Source: `_bmad-output/implementation-artifacts/2-3-micro-slow-mo-particle-ejection.md`]

### Latest Technical Notes

- Current repository context already targets PixiJS 8 + TypeScript strict workflow; no dependency changes are required for this story.

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- Story context generated from epic, requirements inventory, GDD, architecture, UX, project context, previous story intelligence, and recent git pattern review.
- Story status set to `ready-for-dev` for immediate handoff to `dev-story`.
- Scope boundary clarified: implement quantized SFX by extending existing confirmed-hit pipeline without replacing prior spectacle mechanics.
- Implemented `CONFIG.QUANTIZED_SFX` (1/16 grid, tolerance, Perfect Smash weighted-speed gate, C minor pentatonic pitch offsets, buffer params).
- Added `src/core/quantized-sfx.ts`: `computeQuantizedStartRel`, `pickQuantizedPlaybackRate`, `isPerfectSmashFlick`, `QuantizedSfxPlayer` (Web Audio `start(when)` from SyncClock-relative quantization; no timers).
- Wired `QuantizedSfxPlayer` from `initGameplay` after `AudioContext` calibration in `main.ts`; schedules on `EVENTS.ASTEROID_HIT` via `AsteroidHitPayload.flickIntent` (event-first path); `isPerfectSmashFlick` gate unchanged.
- Tests: `quantized-sfx.test.ts` (grid math, pitch cycle, perfect gate, suspended + running schedule assertions, non-finite time guard). Full `npm test` + `npm run lint` green.
- Code review follow-up: `MASTER_GAIN`, `Math.max(when, acNow)` scheduling, timeline validation on `trySchedulePerfectSmash`.
- **Manual smoke (Commander):** After `audioContext.resume()` via first gesture, confirm short click on strong swipes feels on-grid; repeat with WebGPU primary and WebGL fallback (`npm run dev`).

### File List

- `src/config/config.ts`
- `src/core/events.ts`
- `src/core/quantized-sfx.ts`
- `src/core/quantized-sfx.test.ts`
- `src/bootstrap-gameplay.ts`
- `src/main.ts`
- `_bmad-output/implementation-artifacts/2-4-rhythmic-sfx-feedback-quantizedsfx.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-04-09: Story 2.4 created and marked ready-for-dev.
- 2026-04-09: Story 2.4 implemented — quantized rhythmic SFX + tests; status → review.
- 2026-04-09: Code review fixes merged; Commander manual smoke passed; status → done.

---

**Completion status:** done — Story 2.4 complete.
