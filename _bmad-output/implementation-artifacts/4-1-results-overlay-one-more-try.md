# Story 4.1: Results Overlay & One More Try

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Player,  
I want a clear, polished results overlay and immediate replay option,  
so that every session ends with strong payoff and zero-friction re-engagement.

## Acceptance Criteria

1. Given a completed session (victory or failure), when end-state transition occurs, then a results overlay appears with the appropriate state messaging.
2. Overlay includes a prominent "One More Try" action that resets gameplay and starts a fresh session quickly.
3. Overlay state and messaging are wired to authoritative session outcome (victory vs failure/shatter) and not duplicated logic.
4. UI follows glassmorphism and responsive-safe-area constraints across target browsers/devices.
5. End-state transition does not regress performance or break existing gameplay loops.
6. Add tests for overlay visibility/state mapping and replay reset behavior; run full suite.

## Tasks / Subtasks

- [x] Implement results overlay controller/view for both victory and failure outcomes (AC: #1, #3)
- [x] Add "One More Try" action path with deterministic game reset and re-entry (AC: #2)
- [x] Ensure overlay content binds to existing session result/FSM outputs (AC: #3)
- [x] Apply UX design conventions for glass panel, typography, and responsive layout (AC: #4)
- [x] Add unit/integration tests for outcome->overlay mapping and replay lifecycle (AC: #6)
- [x] Run regression tests and manual mobile/desktop smoke (AC: #5, #6)

## Dev Notes

### Epic Context

- Sprint key `4-1-results-overlay-one-more-try` is treated as the consolidated implementation story for end-session overlay + replay loop.
- It subsumes practical delivery of success/failure results presentation needed for Epic 4 funnel.

### Previous Story Intelligence

- Story 3.4 outputs the decisive outcome transitions (`victory`/`shatter`) that should drive this overlay.
- Keep single source of truth for end-state; UI must subscribe rather than infer.

### Architecture & Project Context Guardrails

- Use centralized FSM/event flow for state transitions.
- Maintain responsive/safe-area layout and avoid hardcoded absolute pixel anchoring.
- Keep build/payload discipline intact for single-file output goals.

### Testing Requirements

- Unit/integration: end-state to overlay-mode mapping.
- Unit/integration: replay action resets key systems/state and returns to playable loop.
- Regression: no failures in existing rhythm/gameplay/vfx tests.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-list.md` - Story 4.1a, 4.1b context]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR14, FR19, FR10]
- [Source: `_bmad-output/planning-artifacts/ux-design.md` - Glassmorphism overlays]
- [Source: `_bmad-output/gdd.md` - Meta loop and replay funnel]
- [Source: `_bmad-output/game-architecture.md`]
- [Source: `_bmad-output/project-context.md`]

## Senior Developer Review (AI)

**Outcome:** Approve

**Summary:** Acceptance criteria verified in code. Code review follow-up: replay path now calls `ComboFireworksOverlay.resetSession()` so delayed combo bursts, sparks, and multiplier label do not leak into the next run after “One More Try”. Added `src/ui/combo-fireworks-overlay.test.ts`. Full `npm test` and `npm run lint` green.

_Reviewer: Commander (AI) on 2026-04-11_

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Completion Notes List

- Victory: `IntensityShatterFsm` latches `victory` when `elapsedSessionSec >= CONFIG.INTENSITY_STAGES.VICTORY_AT_ELAPSED_SEC` (30s) with HP > 0; failure remains `shatter` on HP ≤ 0 (health wins over victory on the same frame).
- Authoritative bus: `SESSION_ENDED` with `{ outcome: 'victory' | 'shatter', elapsedSessionSec }`; `PLANET_SHATTERED` unchanged for shatter. `ResultsOverlayController` listens only to `SESSION_ENDED`.
- Replay: `initGameplay` returns `resetSession()` — pool release-all, spawner reset, FSM reset, combo `resetSession`, **`comboFireworks.resetSession()`** (sparks + delayed burst + label), impact burst clear, micro slow-mo clear, flick queue clear, HP/visual baseline restored.
- Styles: `src/style.css` — glass panel, safe-area padding, responsive `clamp` typography.
- Tests: FSM victory/idempotence; `results-overlay.test.ts` + `combo-fireworks-overlay.test.ts` (jsdom); `ComboTracker.resetSession`; full `npm test` + `npm run lint` + production build green.

### File List

- `src/config/config.ts`
- `src/core/events.ts`
- `src/core/intensity-shatter-fsm.ts`
- `src/core/intensity-shatter-fsm.test.ts`
- `src/core/combo-engine.ts`
- `src/core/combo-engine.test.ts`
- `src/core/micro-slow-mo.ts`
- `src/bootstrap-gameplay.ts`
- `src/main.ts`
- `src/style.css`
- `src/systems/gameplay/debris-pool.ts`
- `src/vfx/impact-particle-burst.ts`
- `src/ui/combo-fireworks-overlay.ts`
- `src/ui/combo-fireworks-overlay.test.ts`
- `src/ui/results-overlay.ts`
- `src/ui/results-overlay.test.ts`
- `src/vfx/impact-particle-burst.canvas.test.ts` (lint: remove unused stub param)
- `_bmad-output/implementation-artifacts/4-1-results-overlay-one-more-try.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-04-11: Implemented results overlay, `SESSION_ENDED`, victory FSM latch, `resetSession` replay path, tests, and marked story ready for review.
- 2026-04-11: Code review fixes — `ComboFireworksOverlay.resetSession()` + test; story approved and marked done.

---

**Completion status:** done
