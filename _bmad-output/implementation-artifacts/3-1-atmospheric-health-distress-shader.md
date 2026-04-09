# Story 3.1: Atmospheric Health & Distress Shader

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Player,  
I want to see the planet's health reflected in its color,  
so that I feel the tension and stakes as damage occurs.

## Acceptance Criteria

1. Given the planet takes damage from a missed debris object, when `atmosphericHealth` decreases, then the planet visual shifts from Neon Cyan toward Distress Red based on current health percentage.
2. Color transition is smooth and immediately reactive in gameplay (no abrupt stepping artifacts).
3. Health-color updates are driven by the existing gameplay damage path and not by duplicated state.
4. No forbidden timers for gameplay-critical updates; visual state stays tied to rhythm/game loop systems.
5. Existing stories 1.1-2.4 remain behaviorally stable.
6. Add/extend tests for interpolation mapping and health threshold behavior, then run full test suite.

## Tasks / Subtasks

- [x] Add health-to-color mapping config/constants in `src/config/config.ts` (AC: #1, #2)
- [x] Implement/extend shader input path for atmospheric health interpolation (AC: #1, #2, #4)
- [x] Wire to existing damage pipeline so misses update health and visual state through one path (AC: #1, #3)
- [x] Preserve performance budget and no-allocation discipline in update loop (AC: #4)
- [x] Add unit tests for interpolation math and boundary cases (`100%`, `0%`, midpoint) (AC: #6)
- [x] Run regression suite and manual smoke in WebGPU + WebGL fallback (AC: #5, #6)

## Dev Notes

### Epic Context

- Epic 3 introduces challenge and failure-state bridge; this story is the primary visual health signal feeding tension.
- Scope is visual feedback + data flow, not full shatter/failure FSM (handled in Story 3.4).

### Previous Story Intelligence

- Story 2.4 establishes rhythm-locked integration discipline and single trigger-path guardrails.
- Continue using centralized event/constants patterns and avoid parallel state paths.

### Architecture & Project Context Guardrails

- Keep PixiJS 8 pipeline compatibility (WebGPU-first, WebGL fallback).
- Use `SyncClock`/core loop timing; avoid `setTimeout`/`setInterval` for gameplay-critical logic.
- Keep constants centralized and immutable.
- Maintain no-allocation behavior in hot paths.

### Testing Requirements

- Unit: health percentage to shader parameter mapping.
- Unit: interpolation continuity and clamping.
- Regression: existing input, collision, rhythm, and VFX tests remain green.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-list.md` - Story 3.1]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR8, FR9]
- [Source: `_bmad-output/gdd.md` - Failure conditions and color shift]
- [Source: `_bmad-output/game-architecture.md`]
- [Source: `_bmad-output/project-context.md`]

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Completion Notes List

- Added `CONFIG.ATMOSPHERIC_HEALTH` (max HP, damage per impact, healthy/distress RGB, visual tau).
- Pure helpers in `src/core/atmospheric-health.ts` + Vitest for `atmosphericHealth01`, tint lerp, smoothing.
- `PlanetHeartbeatFilter`: `setGlowTintRgb`; GLSL/WGSL multiply base `c.rgb * tint` with same tint on additive rim for cyan→red shift.
- `bootstrap-gameplay.ts`: `atmosphericHp` decremented only on planet–debris impact (same loop as tutorial cleanup); smoothed display drives filter + rim each frame after sim (no timers). **`planetBody.filters = [PlanetHeartbeatFilter]`** (not the parent): filtering the whole `planetRoot` produced a visible rectangular filter RT behind the disk.
- **TypeScript:** `let atmosphericHp: number` so literal `MAX` does not infer type `100` and break assignments after damage.
- **Filter / shader polish (post-review):** `padding: 8` on the filter; additive rim uses **`add *= c.a`** so empty AABB corners do not pick up heartbeat glow (avoids corner “spark” without a geometric disk mask — a `uv2` disk smoothstep was tried and **reverted** because it distorted the planet silhouette).
- Full `npm test` + `npm run lint` green; smoke `npm run dev` on WebGPU / WebGL as needed.
- **CR follow-up (option 1):** `PLANET_HEALTHY_RGB` single frozen RGB for `PLANET_HEARTBEAT.GLOW_COLOR` and `ATMOSPHERIC_HEALTH.HEALTHY_TINT`; comment in `bootstrap-gameplay.ts` documenting planet-impact-before-flick tick order.

### File List

- `src/config/config.ts`
- `src/core/atmospheric-health.ts`
- `src/core/atmospheric-health.test.ts`
- `src/vfx/planet-heartbeat-shaders.ts`
- `src/vfx/planet-heartbeat-filter.ts`
- `src/bootstrap-gameplay.ts`
- `_bmad-output/implementation-artifacts/3-1-atmospheric-health-distress-shader.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-09: Story 3.1 — atmospheric health tint via heartbeat shader + planet impact damage path.
- 2026-04-09: Follow-up — `atmosphericHp: number`; filter on `planetBody` only; heartbeat fragment `add *= c.a`; filter padding 8; reverted experimental disk mask that harmed planet shape.
- 2026-04-09: Code review pass — shared healthy RGB constant + frame-order note in gameplay loop.

---

**Completion status:** done
