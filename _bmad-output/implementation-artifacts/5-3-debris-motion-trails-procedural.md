# Story 5.3: Planet + Debris Visual Asset Upgrade

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Player,  
I want the planet and debris to use polished image assets with comet-tail trails on moving asteroids,  
so that gameplay readability and visual quality match the premium presentation goal.

## Acceptance Criteria

1. Given gameplay renders the center planet and incoming debris, when the scene initializes and debris spawns, then the planet uses `assets/planet.png` and debris use sprite assets from `assets/` instead of procedural circle placeholders.
2. Given a normal debris spawn occurs, when a pooled debris object is activated, then one sprite from `assets/asteroid_1.png` to `assets/asteroid_4.png` is selected randomly for that spawn.
3. Given a heavy/golden debris spawn occurs, when a pooled debris object is activated with gold behavior, then one sprite from `assets/golden_asteroid_1.png` to `assets/golden_asteroid_4.png` is selected randomly for that spawn.
4. Given debris velocity is above the configured trail threshold, when debris move across the scene, then a velocity-aligned comet-tail trail is rendered with alpha fade and correctly follows the selected debris sprite.
5. Existing gameplay logic remains unchanged (flick collision, gold resistance/reward, combo reset on planet impact, pooling lifecycle).
6. Rendering and spawn behavior remain stable at 60fps target on supported targets.
7. Add/extend tests to validate sprite selection and trail behavior rules and guard against regressions.

## Tasks / Subtasks

- [x] Replace planet placeholder circle rendering with sprite-backed visual while preserving current transform/filter behavior (AC: #1, #5, #6)
  - [x] Import and mount `assets/planet.png` in `src/bootstrap-gameplay.ts` (or extracted scene factory) while keeping `PlanetHeartbeatFilter` and rim behavior compatible.
  - [x] Keep current center positioning logic and atmosphere health tint integration intact.
- [x] Replace debris `Graphics` circle with sprite-capable pooled visual in `DebrisProbe` (AC: #1, #5, #6)
  - [x] Refactor `src/systems/gameplay/debris-probe.ts` to render via sprite/textures instead of `Graphics.circle()` fill.
  - [x] Preserve existing `syncGraphicsPosition`-equivalent behavior and pool visibility toggles.
- [x] Implement deterministic random visual variant selection per spawn (AC: #2, #3, #5)
  - [x] Extend spawn state payload (or probe state) to include selected sprite variant for each activation.
  - [x] In `src/systems/gameplay/debris-storm-spawner.ts`, use existing RNG injection path to choose normal vs gold sprite variant consistently with spawn type.
  - [x] Ensure tutorial first wave (non-gold) also gets a normal asteroid variant.
- [x] Add comet-tail rendering for moving debris (AC: #4, #6)
  - [x] Implement trail rendering as a pooled low-overhead visual (e.g., dedicated `Graphics`/mesh or segmented trail) attached to each active debris.
  - [x] Gate trail rendering by velocity threshold and fade alpha by trail length/time to preserve readability.
  - [x] Ensure gold and normal debris both support trails without changing collision geometry.
- [x] Ensure asset module typing/build compatibility for image imports (AC: #1)
  - [x] Add image module declarations (e.g. `*.png`) in `src/global.d.ts` if missing.
  - [x] Verify webpack pipeline handles imported PNGs within bundle constraints.
- [x] Extend and run tests (AC: #7)
  - [x] Update `debris-storm-spawner` and/or `debris-probe` tests to assert random variant selection maps to correct pool (normal vs gold).
  - [x] Add tests for trail threshold gating and stable trail orientation/fade behavior.
  - [x] Add/adjust tests for planet visual wiring to avoid regressions in scene init.
  - [x] Run full lint/test regression and record outcomes.

## Dev Notes

### Epic Context

- Epic 5 closes remaining polish gaps between shipped behavior and presentation goals.
- Story 5.3 is now course-corrected to combine asset-based planet/debris replacement with comet-tail readability polish.

### Relevant Existing Systems and Reuse Targets

- Planet scene assembly currently happens in `src/bootstrap-gameplay.ts` using `planetRoot`, `planetBody` (`Graphics`), `planetRim`, and `PlanetHeartbeatFilter`.
- Debris visuals are currently authored in `src/systems/gameplay/debris-probe.ts` via `Graphics.circle()` and color fill based on `goldFragment`.
- Spawn-type logic already exists in `src/systems/gameplay/debris-storm-spawner.ts` using `rollIsGoldFragment(...)`.
- Pool lifecycle is centralized in `src/systems/gameplay/debris-pool.ts` (acquire/release, visibility, reset behavior).
- Trail behavior guidance exists in UX intent and should be implemented with low-allocation rendering.

### Previous Story Intelligence

- Story 5.2 reinforced event-bus decoupling and strict lifecycle cleanup; keep the same discipline for visual object initialization and teardown.
- Avoid introducing hot-path allocations in gameplay update loops; assign variant/texture at spawn-time only.

### Architecture & Project Context Guardrails

- Maintain PixiJS v8 patterns and renderer performance budget (60fps / 16.6ms frame target).
- Keep object pooling contract intact: no runtime object churn in `PLAYING` loop.
- Preserve current collision geometry assumptions (debris radius + centered planet radius) even after sprite swap; visuals must not silently change collision math.
- Trail implementation must remain lightweight and avoid per-frame allocations in hot gameplay paths.
- Keep naming and structure aligned with existing domain directories (`src/core`, `src/systems`, `src/vfx`, `src/ui`).

### File Structure Requirements

- Expected primary touch points:
  - `src/bootstrap-gameplay.ts`
  - `src/systems/gameplay/debris-probe.ts`
  - `src/systems/gameplay/debris-storm-spawner.ts`
  - `src/systems/gameplay/debris-pool.ts` (if visibility/reset hooks need updates)
  - `src/vfx/*` trail helper module(s), if extracted
  - `src/global.d.ts`
  - Related `*.test.ts` files in same directories

### Testing Requirements

- Unit coverage should verify:
  - Normal spawns only select from normal asteroid asset set.
  - Gold spawns only select from golden asset set.
  - Spawn RNG path remains deterministic under injected RNG.
  - Trail only appears above threshold and aligns with debris velocity.
  - Pool release/reset does not retain stale visual variant state.
- Regression checks:
  - Existing gameplay tests remain green.
  - Manual smoke confirms sprites render, trails feel readable, and collisions remain unchanged.

### Project Context Rules

- Use PixiJS 8 with `webgpu` preference and existing stage/layering approach.
- Keep central event/constants contracts (`EVENTS`, `CONFIG`) as single source of truth.
- Respect strict performance rules: no avoidable allocations in active gameplay tick.
- Keep final bundle constraints in mind when importing image assets.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-list.md` - Story 5.3]
- [Source: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-04-11.md` - visual polish gap]
- [Source: `_bmad-output/gdd.md` - premium visual polish + debris loop intent]
- [Source: `_bmad-output/game-architecture.md` - Pixi/asset/pooling architecture]
- [Source: `_bmad-output/planning-artifacts/ux-design.md` - readability, premium feedback, and trail intent]
- [Source: `_bmad-output/project-context.md` - performance/pooling/testing constraints]
- [Source: `src/bootstrap-gameplay.ts` - current planet rendering path]
- [Source: `src/systems/gameplay/debris-probe.ts` - current debris placeholder visuals]
- [Source: `src/systems/gameplay/debris-storm-spawner.ts` - spawn and gold selection logic]

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- Dev workflow executed for story key `5-3-debris-motion-trails-procedural`.
- Validation run: `npm test` (158 passed), `npm run lint` (clean).

### Completion Notes List

- Replaced planet circle placeholder with `assets/planet.png` sprite while preserving heartbeat filter, rim glow, and center anchoring behavior.
- Migrated debris visuals from procedural circles to sprite variants (normal and gold sets), with deterministic per-spawn variant selection driven by injected storm RNG.
- Added pooled comet-tail rendering in `DebrisProbe` with velocity threshold gating, direction alignment, and alpha-fade segmentation without changing collision geometry.
- Extended pool cleanup to reset visual state on release and added PNG module typing support for TypeScript asset imports.
- Added/updated gameplay tests for variant selection, trail gating/alignment, and visual reset behavior; full regression and lint pass completed.
- Follow-up polish pass: swapped line-based trail strokes for layered additive trail sprites (glow + core + highlight) to improve readability and visual quality.
- Follow-up reliability fix: moved planet/asteroid texture handling to explicit Pixi `Assets` preload + alias lookup to prevent runtime invisible sprites.
- Code review (CR 5.3): exported `GAMEPLAY_ASSET_ALIASES` + `clampDebrisVisualVariantIndex`, Node-only tests for alias/bootstrap order (Vitest cannot complete `Assets.load` in the default Node pool without hanging), aligned `setStormState` with shared clamp, refreshed stale comments.

### File List

- `assets/planet.png`
- `assets/asteroid_1.png` … `assets/asteroid_4.png`
- `assets/golden_asteroid_1.png` … `assets/golden_asteroid_4.png`
- `src/bootstrap-gameplay.ts`
- `src/config/config.ts`
- `src/global.d.ts`
- `src/main.ts`
- `src/systems/gameplay/debris-pool.ts`
- `src/systems/gameplay/debris-pool.test.ts`
- `src/systems/gameplay/debris-probe.ts`
- `src/systems/gameplay/debris-probe.test.ts`
- `src/systems/gameplay/gameplay-visual-assets.ts`
- `src/systems/gameplay/debris-storm-spawner.ts`
- `src/systems/gameplay/debris-storm-spawner.test.ts`
- `src/systems/gameplay/gameplay-visual-assets.test.ts`
- `_bmad-output/implementation-artifacts/5-3-debris-motion-trails-procedural.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-04-12: Implemented sprite-based planet and debris visuals, deterministic asteroid variant selection, pooled comet-tail trails, and expanded guardrail tests for story 5.3.
- 2026-04-12: Improved trail art direction with layered additive tails and fixed sprite invisibility by preloading gameplay visuals via Pixi `Assets`.
- 2026-04-12: Post–code review: alias/clamp exports, `gameplay-visual-assets` regression tests, probe variant clamp alignment, story file list completed for shipped PNGs.

---

**Completion status:** done
