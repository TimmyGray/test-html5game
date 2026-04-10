# Story 4.4: The Architect's Funnel (Technical CTA)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Recruiter,  
I want to easily find the technical documentation for this project,  
so that I can evaluate the developer's engineering depth.

## Acceptance Criteria

1. Given results overlay is active, when "Architect's Notes" CTA is clicked/tapped, then application opens technical documentation/portfolio target in a new tab.
2. CTA is discoverable, readable, and accessible in both victory and failure result contexts.
3. URL target is configurable and validated to avoid broken navigation behavior.
4. CTA action does not disrupt existing replay flow or results state logic.
5. Existing gameplay and UI systems remain stable after integration.
6. Add tests for CTA availability and action wiring; run full suite.

## Tasks / Subtasks

- [x] Add configurable CTA target in centralized config/environment constants (AC: #1, #3)
- [x] Implement CTA button/action in results overlay components (AC: #1, #2)
- [x] Ensure open-in-new-tab behavior and safe fallback for blocked popups as applicable (AC: #1, #3)
- [x] Verify replay flow and state transitions are unaffected (AC: #4)
- [x] Add unit/integration tests for CTA rendering and click behavior (AC: #6)
- [x] Run regression suite and manual end-to-end smoke (AC: #5, #6)

## Dev Notes

### Epic Context

- Story 4.4 is the final recruitment funnel bridge from gameplay to technical deep-dive.
- Implementation should be simple, robust, and clearly measurable.

### Previous Story Intelligence

- Story 4.1 controls results overlay entry points; Story 4.2/4.3 enrich content there.
- CTA should plug into the same overlay architecture with minimal additional coupling.

### Architecture & Project Context Guardrails

- Keep configuration centralized and environment-safe.
- Maintain responsive safe-area positioning and UX consistency.
- Avoid dependency bloat for simple navigation behavior.

### Testing Requirements

- Unit: CTA visible in intended overlay states.
- Unit/integration: click opens configured target via new-tab behavior.
- Regression: no disruption to replay/reset and results display.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-list.md` - Story 4.4]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR14]
- [Source: `_bmad-output/gdd.md` - Portfolio funnel CTA]
- [Source: `_bmad-output/planning-artifacts/ux-design.md`]
- [Source: `_bmad-output/project-context.md`]

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log

- Webpack `EnvironmentPlugin` exposes `TRP_ARCHITECT_NOTES_URL` for deploy-time override; validated http(s) resolution in `architect-notes-url.ts`.
- Code review (CR): added overlay integration test for blocked-popup hint path in `results-overlay.test.ts`.

### Completion Notes List

- Added `CONFIG.RESULTS.ARCHITECT_NOTES_URL` (validated) and secondary “Architect's Notes” button in `ResultsOverlayController`; `window.open` with `noopener,noreferrer`; clipboard + status hint when popup blocked.
- Tests: `architect-notes-url.test.ts`, `open-architect-notes.test.ts`, extended `results-overlay.test.ts` (including blocked-tab hint wiring). `npm test`, `npm run lint`, `npm run build` green (2026-04-11).

### Implementation Plan

1. Centralize URL resolution + validation; webpack default + env override.
2. Stack replay (primary) and Architect (secondary) CTAs; no overlay close on Architect click.
3. Test URL wiring and popup path.

### File List

- `src/config/architect-notes-url.ts`
- `src/config/architect-notes-url.test.ts`
- `src/config/config.ts`
- `src/global.d.ts`
- `src/style.css`
- `src/ui/open-architect-notes.ts`
- `src/ui/open-architect-notes.test.ts`
- `src/ui/results-overlay.ts`
- `src/ui/results-overlay.test.ts`
- `webpack.config.mjs`
- `_bmad-output/implementation-artifacts/4-4-the-architects-funnel-technical-cta.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- Story 4.4: Architect's Notes technical CTA, configurable validated URL, tests, build verified (2026-04-11).
- Story 4.4: post-review — `results-overlay.test.ts` asserts blocked-popup hint + clipboard URL (2026-04-11).

---

**Completion status:** done
