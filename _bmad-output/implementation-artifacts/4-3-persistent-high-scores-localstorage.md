# Story 4.3: Persistent High Scores (LocalStorage)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Player,  
I want the game to remember my best score,  
so that I have a personal goal to beat in future sessions.

## Acceptance Criteria

1. Given a completed session score, when score exceeds stored best, then `localStorage` high score is updated.
2. Given score does not exceed stored best, existing stored value remains unchanged.
3. High score value is displayed on landing/results UI elements where specified.
4. Persistence logic handles empty/corrupt/missing storage values safely.
5. Existing results/gameplay flow remains stable and performant.
6. Add tests for read/write/update/fallback behavior and run full suite.

## Tasks / Subtasks

- [ ] Add/extend high-score storage utility with validation and safe parse defaults (AC: #1, #2, #4)
- [ ] Integrate update call at session completion path (AC: #1, #2)
- [ ] Wire displayed high score into landing/results UI components (AC: #3)
- [ ] Keep key naming/versioning consistent and centralized in config/constants (AC: #4)
- [ ] Add unit tests for first-run, overwrite, non-overwrite, and corrupt-data fallback (AC: #6)
- [ ] Run regression tests and manual browser persistence smoke test (AC: #5, #6)

## Dev Notes

### Epic Context

- Story 4.3 establishes lightweight persistence to support replay motivation and portfolio polish.
- Storage scope is local-only (`localStorage`) with no backend dependency.

### Previous Story Intelligence

- Story 4.1/4.2 define the results flow and evaluation context where high score should appear.
- Keep persistence side effects isolated and deterministic for reliable tests.

### Architecture & Project Context Guardrails

- Respect platform/browser constraints and autoplay/input guardrails.
- Keep implementation lightweight to preserve payload/performance goals.
- Use strict TypeScript and colocated tests.

### Testing Requirements

- Unit: storage initialization on empty state.
- Unit: update only when new score is higher.
- Unit: resilience against malformed storage values.
- Integration: UI surfaces reflect stored high score across sessions.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-list.md` - Story 4.3]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR16]
- [Source: `_bmad-output/gdd.md` - Progression and persistence]
- [Source: `_bmad-output/game-architecture.md` - Native localStorage decision]
- [Source: `_bmad-output/project-context.md`]

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Completion Notes List

- Story context prepared for implementation handoff.

### File List

- `_bmad-output/implementation-artifacts/4-3-persistent-high-scores-localstorage.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

**Completion status:** ready-for-dev
