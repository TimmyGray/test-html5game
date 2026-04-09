# Story 3.3: Heavy Fragments (Gold Debris)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Player,  
I want a rare, high-value challenge during the storm,  
so that I can test my flick speed and earn massive points.

## Acceptance Criteria

1. Given a procedural spawn event, when a rare "Gold" debris object is selected, then it spawns with heavy-fragment identity and distinct behavior.
2. Gold debris uses dampening/resistance logic so weak/slow flicks are less effective than on normal debris.
3. Given high-velocity successful deflection of Gold debris, then unique metallic particles and `5x` score bonus are applied.
4. Gold behavior is integrated into existing spawn/hit systems without duplicate lifecycle paths.
5. Performance remains stable with pooling and no forbidden runtime allocations in hot loops.
6. Add tests for rarity, resistance, and reward path; run full suite.

## Tasks / Subtasks

- [x] Add gold-fragment config values (spawn rarity, dampening thresholds, bonus multiplier) (AC: #1, #2, #3)
- [x] Extend debris model/state to represent heavy fragment variants (AC: #1)
- [x] Implement resistance logic in hit resolution/impulse path using existing intersector + velocity data (AC: #2)
- [x] Trigger metallic VFX and score multiplier on valid high-velocity gold deflection (AC: #3)
- [x] Keep pooling/lifecycle shared with current debris systems (AC: #4, #5)
- [x] Add unit/integration tests and run regressions (AC: #6)

## Dev Notes

### Epic Context

- Story 3.3 is the high-risk/high-reward spike inside the reactive storm progression.
- This story must reuse existing debris pooling and hit resolution patterns from previous stories.

### Previous Story Intelligence

- Story 3.2 provides combo framework; gold rewards should compose cleanly with combo/scoring signals.
- Earlier stories enforce single source of truth for hit determination and effect triggering.

### Architecture & Project Context Guardrails

- Preserve object pooling constraints and avoid `new` in ticker/onTick logic.
- Keep event flow decoupled through event bus constants.
- Maintain PixiJS 8 `ParticleContainer`-oriented VFX strategy for burst effects.

### Testing Requirements

- Unit: rarity selection and deterministic fallback behavior.
- Unit: resistance threshold handling under low vs high flick velocity.
- Unit: reward trigger path for metallic VFX + `5x` bonus.
- Regression: existing debris, ray-cast, combo, and VFX flows remain green.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-list.md` - Story 3.3]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR12, FR5, FR7]
- [Source: `_bmad-output/gdd.md` - Rhythm specific design (Heavy Fragments)]
- [Source: `_bmad-output/game-architecture.md`]
- [Source: `_bmad-output/project-context.md`]

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Completion Notes List

- Added `CONFIG.GOLD_DEBRIS` (spawn chance, impulse ref/min efficiency, high-velocity gate aligned with perfect-smash px, 5× score multiplier, gold fill color).
- `DebrisProbe.goldFragment` + `setStormState(..., gold)` and `applyImpulse(..., impulseScale)`; spawner rolls gold on procedural spawns only (tutorial first wave stays normal); pool clears gold on release.
- Pure helpers in `gold-fragment.ts` for rarity, dampening efficiency, reward gate, and `base × combo × gold` score; `bootstrap-gameplay` wires impulse scale, `burstMetallicAt` vs standard burst, extended `AsteroidHitPayload`, and `EVENTS.SCORE_AWARDED`.
- Tests: `gold-fragment.test.ts` (incl. NaN resistance), `debris-probe` impulse scale, `debris-storm-spawner` gold roll (tutorial never gold + procedural pass/fail), `impact-particle-burst.canvas.test.ts` metallic vs standard tint paths; shared `FLICK_HIGH_INTENSITY_MIN_WEIGHTED_SPEED_PX` for perfect-smash + gold gate; `npm test` + `npm run lint` clean.
- Code review follow-up (2026-04-09): `applyImpulse` clamp variable rename; review marked complete → status **done**.

### File List

- `src/config/config.ts`
- `src/core/events.ts`
- `src/bootstrap-gameplay.ts`
- `src/systems/gameplay/gold-fragment.ts`
- `src/systems/gameplay/gold-fragment.test.ts`
- `src/systems/gameplay/debris-probe.ts`
- `src/systems/gameplay/debris-probe.test.ts`
- `src/systems/gameplay/debris-pool.ts`
- `src/systems/gameplay/debris-storm-spawner.ts`
- `src/vfx/impact-particle-burst.ts`
- `src/vfx/impact-particle-burst.canvas.test.ts`
- `package.json` / `package-lock.json` (devDependency `jsdom` for burst canvas tests)
- `_bmad-output/implementation-artifacts/3-3-heavy-fragments-gold-debris.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-09: Implemented heavy/gold debris (Story 3.3): config, spawn roll, resistance impulse, metallic burst + 5× score composed with combo, score event + payload fields.
- 2026-04-09: Post-review hardening: shared flick high-intensity px constant; spawner gold + metallic burst tests; NaN gold efficiency; `applyImpulse` inner clamp rename; story marked done.

---

**Completion status:** done
