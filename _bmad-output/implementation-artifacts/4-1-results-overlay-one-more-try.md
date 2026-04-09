# Story 4.1: Results Overlay & One More Try

Status: ready-for-dev

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

- [ ] Implement results overlay controller/view for both victory and failure outcomes (AC: #1, #3)
- [ ] Add "One More Try" action path with deterministic game reset and re-entry (AC: #2)
- [ ] Ensure overlay content binds to existing session result/FSM outputs (AC: #3)
- [ ] Apply UX design conventions for glass panel, typography, and responsive layout (AC: #4)
- [ ] Add unit/integration tests for outcome->overlay mapping and replay lifecycle (AC: #6)
- [ ] Run regression tests and manual mobile/desktop smoke (AC: #5, #6)

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

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Completion Notes List

- Story context prepared for implementation handoff.

### File List

- `_bmad-output/implementation-artifacts/4-1-results-overlay-one-more-try.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

**Completion status:** ready-for-dev
