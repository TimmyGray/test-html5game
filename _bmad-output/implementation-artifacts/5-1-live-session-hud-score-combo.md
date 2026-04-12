# Story 5.1: Live Session HUD (Score + Combo)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Player,  
I want to see score and combo while I am playing,  
so that I can react to performance in real time instead of waiting for results.

## Acceptance Criteria

1. Given a session is in `PLAYING` state, when I successfully deflect debris, then score updates immediately in a visible in-session HUD.
2. Given combo state changes, when streak increases or resets, then combo HUD updates in real time and remains readable over gameplay visuals.
3. HUD layout matches UX intent: score top-left, combo top-right, safe-area aware, and does not overlap results overlay.
4. HUD resets cleanly on replay/session reset and does not leak event listeners across runs.
5. Existing gameplay/VFX behavior remains stable and 60fps target is maintained.
6. Add/extend tests for HUD event wiring and reset behavior.

## Tasks / Subtasks

- [x] Create a dedicated live HUD UI controller in `src/ui` (DOM or Pixi overlay) that owns score/combo state and rendering (AC: #1, #2, #3, #4)
  - [x] Subscribe to `EVENTS.SCORE_AWARDED` for score delta accumulation.
  - [x] Subscribe to `EVENTS.COMBO_CHANGED` for multiplier changes and reset handling.
  - [x] Ensure explicit teardown (`dispose`) removes all listeners.
- [x] Wire HUD lifecycle into the app bootstrap and session flow (AC: #3, #4)
  - [x] Mount HUD during gameplay initialization.
  - [x] Reset HUD state on replay path (`resetSession` trigger path).
  - [x] Ensure HUD visibility behavior does not conflict with `ResultsOverlayController`.
- [x] Implement responsive/safe-area styling and visual polish aligned to UX (AC: #3, #5)
  - [x] Keep text readable against starfield (shadow/glow, contrast).
  - [x] Respect portrait/landscape safe area constraints.
- [x] Add/extend tests in `src/ui` for event updates + cleanup + reset (AC: #6)
  - [x] Verify score accumulates from emitted `SCORE_AWARDED` deltas.
  - [x] Verify combo reacts to `COMBO_CHANGED` increments/resets.
  - [x] Verify dispose/replay does not duplicate listeners.
- [x] Run regression checks (unit + manual smoke) to confirm no gameplay regressions (AC: #5, #6)

## Dev Notes

### Epic Context

- Epic 5 closes the feedback gap found in post-ship review: gameplay needs immediate score/combo feedback, not results-only.
- Story 5.1 is the first save point in Epic 5 and unblocks Story 5.2 audio controls by establishing persistent in-session HUD patterns.

### Relevant Existing Systems and Reuse Targets

- Event bus is already authoritative: `gameEvents` + `EVENTS` in `src/core/events.ts` and `src/config/config.ts`.
- Score emission exists in gameplay loop: `EVENTS.SCORE_AWARDED` emitted from `src/bootstrap-gameplay.ts`.
- Combo tier updates already emit via `EVENTS.COMBO_CHANGED`; note it fires on tier changes/resets, not every hit at max tier.
- Existing UI patterns to mirror:
  - `src/ui/results-overlay.ts` (DOM controller with bus subscriptions and teardown)
  - `src/ui/combo-fireworks-overlay.ts` (Pixi overlay + combo event wiring)
  - `src/main.ts` (`mountHighScoreLandingLabel`, overlay mount order and host selection)

### Architecture & Project Context Guardrails

- Keep communication decoupled via central Event Bus; do not add tight gameplay↔UI coupling.
- Preserve strict no-allocation discipline inside hot tick paths (`bootstrap-gameplay` update loop); HUD should update via events and minimal work.
- Maintain responsive safe-area positioning; avoid absolute hardcoded HUD coordinates.
- Use existing TypeScript strictness and colocated tests (`*.test.ts`).
- Keep implementation lightweight to preserve locked 60fps and single-file payload goals.

### Implementation Guidance

- Preferred approach: create a new UI controller (e.g., `session-hud.ts`) with API:
  - `constructor(hostOrStage, options?)`
  - `mount()`
  - `resetSession()`
  - `dispose()`
- Maintain internal state:
  - `runningScore` (start at 0; add `payload.delta` from `SCORE_AWARDED`)
  - `comboMultiplier` (default x1; update from `COMBO_CHANGED.multiplier`)
- If product requires combo visibility on every successful hit (even when tier unchanged), add a follow-up event extension in Story 5.2/5.3 or emit a dedicated per-hit HUD event from `bootstrap-gameplay`.

### Testing Requirements

- Unit tests for HUD controller:
  - score accumulation from repeated `SCORE_AWARDED` events
  - combo label updates on `COMBO_CHANGED`
  - reset behavior returns UI to initial state
  - dispose removes listeners (no double updates after remount)
- Regression smoke:
  - play session, confirm live score/combo appears during gameplay
  - replay flow resets values
  - results overlay still shows end stats correctly

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-list.md` - Story 5.1]
- [Source: `_bmad-output/planning-artifacts/ux-design.md` - HUD & Interface Layout]
- [Source: `_bmad-output/gdd.md` - Core Gameplay Loop, Scoring and Judgment]
- [Source: `_bmad-output/game-architecture.md` - Event system, project structure]
- [Source: `_bmad-output/project-context.md` - engine/performance/testing/safe-area rules]
- [Source: `src/bootstrap-gameplay.ts` - `SCORE_AWARDED`, `COMBO_CHANGED` emissions]
- [Source: `src/core/events.ts` and `src/config/config.ts` - event payloads/constants]
- [Source: `src/ui/results-overlay.ts` and `src/ui/combo-fireworks-overlay.ts` - UI event patterns]

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- CS workflow run for first backlog story in Epic 5.
- Implemented `SessionHudController` DOM overlay with event-bus wiring (`SCORE_AWARDED`, `COMBO_CHANGED`, `SESSION_ENDED`) and deterministic replay reset path.
- Regression checks: `npm run lint` and `npm test` passing (142 tests).
- Manual smoke (`http://localhost:5143/`): HUD baseline shown, results overlay hides HUD, replay restores HUD baseline.

### Implementation Plan

- Build a standalone HUD controller in `src/ui` with explicit `mount/resetSession/dispose`.
- Keep updates event-driven to avoid any gameplay-loop allocations.
- Wire replay lifecycle through `main.ts` callback so HUD and gameplay reset in lockstep.
- Add jsdom tests covering event updates, reset baseline, and listener cleanup.

### Completion Notes List

- Story context created with explicit implementation guardrails and event wiring guidance.
- Scope intentionally constrained to HUD delivery only (audio/trails handled in Stories 5.2 and 5.3).
- Added `SessionHudController` with safe-area aware score/combo labels (score top-left, combo top-right) and readable starfield contrast styling.
- Hooked HUD into bootstrap lifecycle: mount at startup, hide on `SESSION_ENDED`, reset on replay, dispose on unload.
- Added `src/ui/session-hud.test.ts` to validate score accumulation, combo updates, replay reset, and leak-free remount behavior.
- Validation complete: lint + full Vitest suite green.
- Manual smoke pass: live run confirmed HUD visibility/layout, hide-on-results behavior, and replay reset to score `0` + combo `x1`.

### File List

- `_bmad-output/implementation-artifacts/5-1-live-session-hud-score-combo.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/planning-artifacts/epics/epic-list.md`
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-04-11.md`
- `src/ui/session-hud.ts`
- `src/ui/session-hud.test.ts`
- `src/main.ts`
- `src/style.css`

### Senior Developer Review (AI)

- 2026-04-12 review pass completed against Story 5.1 acceptance criteria and repo git delta.
- Added integration-style replay test coverage in `src/ui/session-hud.test.ts` to verify HUD hide on `SESSION_ENDED` and baseline restore via replay callback.
- File List reconciled with actual changed files to close review traceability drift.
- Outcome: no HIGH/MEDIUM issues remain; residual LOW risk is runtime performance evidence granularity (no dedicated profiler capture attached to this story).

### Change Log

- 2026-04-11: Implemented live in-session HUD (score/combo), integrated lifecycle reset/teardown, added tests, passed lint/test regression, and validated replay UX via browser smoke.
- 2026-04-12: Completed code-review follow-ups, expanded replay integration test coverage, and reconciled story file list with git changes.

---

**Completion status:** done
