# Story 3.2: The Combo Engine (Multipliers)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Player,  
I want to be rewarded for my rhythmic accuracy and streaks,  
so that I have a reason to master the flick interactions.

## Acceptance Criteria

1. Given multiple successful flick interactions in a row, when no hit results in planet damage, then combo multiplier increments (`x2`, `x4`, `x8`, ... as defined by config/rules).
2. Given any damage to the planet, combo multiplier resets to `x1`.
3. Combo state updates only from authoritative hit/miss outcomes in existing gameplay flow.
4. Combo display/event output remains synchronized with rhythm feedback expectations (player-visible feedback on tier changes; see Dev Notes for GDD shader HUD follow-up).
5. No regression to existing stories 1.1-3.1 behaviors.
6. Add tests for increment/reset sequences and edge cases; run full suite.

## Tasks / Subtasks

- [x] Define combo progression constants/rules in centralized config (AC: #1, #2)
- [x] Implement combo state machine/manager with deterministic transitions (AC: #1, #2, #3)
- [x] Wire to confirmed hit/miss event path; avoid duplicate classification logic (AC: #3)
- [x] Expose combo output for UI/rhythm feedback integration (AC: #4)
- [x] Ship first-pass combo celebration: pooled spark “fireworks” + floating `xN` label on `COMBO_CHANGED` when `multiplier > 1` (`ComboFireworksOverlay`, `CONFIG.COMBO_FIREWORKS`) (AC: #4)
- [x] Add unit tests for streak growth, reset-on-damage, and rapid-event ordering (AC: #6)
- [x] Run regression tests and manual gameplay sanity pass (AC: #5, #6)

## Dev Notes

### Epic Context

- Story 3.2 establishes the progression reward loop that feeds Epic 3 tension and mastery.
- **Delivered:** combo logic + `COMBO_CHANGED` **and** in-game **celebration VFX** (fireworks + multiplier words) so players see tier-ups immediately.
- **Later (GDD):** shader-animated combo element **pulse-locked to the atmospheric heartbeat** is still optional polish; not required to close 3.2 acceptance.

### Previous Story Intelligence

- Story 3.1 introduced health-driven consequences; combo reset must key off the same damage authority path.
- Earlier epic work reinforced deterministic, test-first timing and event ordering discipline.

### Architecture & Project Context Guardrails

- Use typed event bus with centralized `EVENTS` constants.
- Keep TypeScript strictness and colocated test conventions.
- Avoid per-frame allocations in update/ticker paths.
- Maintain responsive behavior and cross-platform input consistency.

### Testing Requirements

- Unit: incremental chain (`x1 -> x2 -> ...`) based on configured rules.
- Unit: immediate reset to `x1` on damage.
- Unit: ordering edge cases under rapid hit/miss event sequences.
- Regression: no failures in existing physics/rhythm/vfx/gameplay tests.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-list.md` - Story 3.2]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR11, FR9]
- [Source: `_bmad-output/gdd.md` - Scoring and judgment]
- [Source: `_bmad-output/game-architecture.md`]
- [Source: `_bmad-output/project-context.md`]

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Implementation Plan

- `CONFIG.COMBO.MULTIPLIER_STEPS` defines `x2 → x4 → x8 → x16` with cap at last step.
- `ComboTracker` in `src/core/combo-engine.ts` holds streak; `notifySuccessfulDeflection` / `notifyReset` are the only transitions.
- Bootstrap: reset on planet impact (same block as HP damage); on confirmed ray hit after `ASTEROID_HIT`, `notifySuccessfulDeflection()` may return `null` when the streak grew but the **tier** is unchanged (capped at last step). `COMBO_CHANGED` emits only on tier change or reset-to-baseline (same `null` pattern as `notifyReset` when already ×1).
- **Player feedback:** `ComboFireworksOverlay` (`src/ui/combo-fireworks-overlay.ts`) subscribes to `COMBO_CHANGED`, plays a two-stage pooled spark burst + floating `x2` / `x4` / … label when `multiplier > 1`; resets to ×1 do not trigger celebration. Tuning via `CONFIG.COMBO_FIREWORKS`. Mounted from `bootstrap-gameplay.ts` (stage index 3), updated each tick, disposed with gameplay.

### Debug Log

- (none)

### Completion Notes List

- Story 3.2 implemented: centralized combo steps, `ComboTracker`, `EVENTS.COMBO_CHANGED` + typed payload, wired in `bootstrap-gameplay.ts` to damage / hit / miss paths. **Combo fireworks + word overlay** on tier-ups (`ComboFireworksOverlay`, `CONFIG.COMBO_FIREWORKS`). Vitest `combo-engine.test.ts` covers progression, cap, reset, ordering, capped-streak emit suppression. Full `npm test` green. **Post-review:** `COMBO_CHANGED` no longer fires on every deflection at max multiplier (tier-change-only for hits).

### File List

- `src/core/combo-engine.ts`
- `src/core/combo-engine.test.ts`
- `src/config/config.ts`
- `src/core/events.ts`
- `src/bootstrap-gameplay.ts`
- `src/ui/combo-fireworks-overlay.ts`
- `_bmad-output/implementation-artifacts/3-2-the-combo-engine-multipliers.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-09: Implemented combo multiplier engine, `COMBO_CHANGED` bus hook, config steps, unit tests; sprint status → review.
- 2026-04-09: Added `ComboFireworksOverlay` + `CONFIG.COMBO_FIREWORKS` (fireworks + `xN` label on combo tier-ups); story file updated to match.
- 2026-04-09: Code review fix — `notifySuccessfulDeflection` returns `null` when multiplier tier unchanged (cap); bootstrap gates `COMBO_CHANGED`; story + sprint → **done**.

---

**Completion status:** done
