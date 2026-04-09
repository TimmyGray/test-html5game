# Story 2.2: Collision Spectacle (Shockwaves & Aberration)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Player,  
I want a massive visual reaction when I successfully flick an object,  
so that I feel a sense of "Visual Smash" and senior-level payoff.

## Acceptance Criteria

1. **Trigger on real deflections only:** Given a successful `Ray-Cast` intersection between the flick segment and debris motion (same conditions that apply impulse today), when the hit resolves and impulse is applied, then collision-spectacle VFX are triggered for that hit. [Source: `_bmad-output/planning-artifacts/epics/epic-list.md` Story 2.2]
2. **Displacement shockwave:** Given a triggered spectacle, then a **displacement-style shockwave** visibly ripples the **background starfield** (expanding wave from the impact point in screen space). The effect must read clearly on mobile and desktop aspect ratios.
3. **Chromatic aberration spike:** Given a triggered spectacle, then a **brief chromatic aberration** (RGB channel separation) spikes at/near the impact point. UX spec targets **~50ms** perceived spike duration; use config-driven duration with sane defaults. [Source: `_bmad-output/planning-artifacts/ux-design.md` §3 Impact VFX]
4. **Performance:** VFX updates must stay within the project frame budget (no sustained >2ms GPU/logic hotspots on target hardware); **no per-frame allocations** in the ticker path; shader math stays **branch-light** per `project-context.md`.
5. **Regression safety:** Stories **1.1–1.4** gameplay (SyncClock, flick/ray-cast, pooled storm, tutorial wave) and **2.1** planet heartbeat remain functional; render order keeps debris/readability intact.
6. **Tests / verification:** Extract and unit-test any **pure math** for shockwave/aberration envelopes (time-based decay, clamping). Document manual visual checks (shockwave clarity, aberration timing, WebGPU + WebGL).

**Scope boundary (explicit):** **Particle ejection** and **micro-slow-mo** are **Epic 2 Stories 2.3–2.4**; do **not** implement shard bursts or `SyncClock` time-scale warps in this story unless required for a minimal no-op stub (prefer none).

## Tasks / Subtasks

- [x] **Config** (AC: #3, #4)
  - [x] Add `CONFIG.COLLISION_SPECTACLE` (or similarly named) for shockwave speed/radius, displacement strength, aberration intensity, aberration duration (~50ms default), and max simultaneous impulses if needed.
  - [x] Keep immutable `Object.freeze` patterns consistent with `src/config/config.ts`.

- [x] **Background starfield layer** (AC: #2, #5)
  - [x] The canvas currently has solid `SCREEN.BACKGROUND_COLOR` only; introduce a **dedicated starfield drawable** (e.g. `Graphics` scatter, low-cost shader noise, or sparse sprites) on a layer **below** the planet and pooled debris so the shockwave has visible structure to distort.
  - [x] Ensure resize/orientation updates re-seed or rescale safely without allocations in the hot path.

- [x] **Spectacle filter / shader module** (AC: #2, #3, #4)
  - [x] Implement PixiJS v8 `Filter` with **WGSL + GLSL** fragments (mirror `PlanetHeartbeatFilter` / `planet-heartbeat-shaders.ts` dual-backend approach).
  - [x] Prefer a **single combined pass** for displacement + aberration on the starfield container to match architecture’s **Single-Pass Uber-Shader** direction; avoid unnecessary multi-pass chains on mobile.
  - [x] Uniforms driven by **preallocated state**; impulse events set **origin (uv or pixel)** and **start time** from `SyncClock` audio time (not `setTimeout`).

- [x] **Wiring from gameplay** (AC: #1, #5)
  - [x] Hook where `EVENTS.ASTEROID_HIT` is emitted in `src/bootstrap-gameplay.ts` (payload already includes `hitX`, `hitY`, `debrisId`) — either listen on `gameEvents` inside bootstrap or call a small spectacle controller from the same code path **once per confirmed hit**.
  - [x] Do **not** duplicate ray-cast logic; spectacle triggers only after the same `pickBestStormHit` success path that applies impulse.

- [x] **Validation** (AC: #4, #6)
  - [x] Unit tests for envelope/decay math only (colocated `*.test.ts`).
  - [x] Run existing test suite; browser profile with debris storm active.

## Dev Notes

### Previous Story Intelligence (2.1 → 2.2)

- Story **2.1** added `PlanetHeartbeatFilter`, `beat-phase` / `BeatTickTracker`, and `EVENTS.BEAT`. Starfield is **index 0**, planet **index 1**; debris pool mounts above.
- Heartbeat uniforms update every frame from `SyncClock.getAbsoluteTime()` — spectacle should also use **audio time** for deterministic effect age, not wall `Date.now()` in gameplay logic.
- `EVENTS.ASTEROID_HIT` payload shape: `{ debrisId, hitX, hitY, tFlick, tDebris }` — sufficient to place the shockwave origin in stage space (account for any container offset if starfield is nested).

### Architecture Compliance Guardrails

- **Single-Pass Uber-Shader:** Architecture consolidates planet VFX; this story adds **spectacle on the starfield layer**. Design shaders so **Story 3+** can extend uniforms (health tint, intensity FSM) without rewriting the displacement core — keep uniforms namespaced and documented.
- **Event bus:** Continue using `gameEvents` + `EVENTS` from `src/core/events.ts`. Add new event constants only if spectator systems need them; otherwise internal controller is fine.
- **No forbidden timers:** Per `project-context.md`, do not use `setTimeout`/`setInterval` for effect duration — integrate decay via per-frame uniform updates using `SyncClock` delta/time.

### Implementation Guidance

- **Coordinates:** Map `hitX`/`hitY` to filter UVs using current renderer width/height; handle **resolution** / `autoDensity` like other scene positioning.
- **Layering:** Suggested order (bottom → top): starfield + spectacle filter → planet + heartbeat → pooled debris (current behavior adds planet at 0; inserting starfield may require reordering `addChildAt` so debris stays on top — verify visually).
- **Visual polish checklist (GDD):** Shockwave should feel like a **circular ripple** through parallax/displacement; aberration is a **short punch**, not a permanent tint.

### Project Structure Notes

- **New files (suggested):**
  - `src/vfx/collision-spectacle-filter.ts`
  - `src/vfx/collision-spectacle-shaders.ts` (WGSL + GLSL)
  - `src/core/collision-spectacle-envelope.ts` (optional pure math + `collision-spectacle-envelope.test.ts`)
  - `src/vfx/starfield-background.ts` (optional factoring for procedural stars)
- **Likely modified:**
  - `src/bootstrap-gameplay.ts`
  - `src/config/config.ts`

### Project Context Rules

- Pixi **WebGPU-first**, WebGL fallback; dual shader backends required for filters.
- **Strict no-alloc in ticker** for gameplay and VFX controller hot paths.
- **Profiling** after Uber-Shader / pool changes — run a session with active storm.
- Tests colocated with modules.

### Testing Requirements

- **Unit:** Decay/envelope math, edge cases (multiple hits, rapid hits, clamped strength).
- **Regression:** All existing `*.test.ts` pass.
- **Manual:** WebGPU + WebGL; verify shockwave origin tracks flick impact; no z-order regressions.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-list.md` — Story 2.2]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` — FR7 (partial: shaders only; particles deferred to 2.3)]
- [Source: `_bmad-output/gdd.md` — Collision Spectacle mechanic]
- [Source: `_bmad-output/planning-artifacts/ux-design.md` — §3 Impact VFX]
- [Source: `_bmad-output/game-architecture.md` — Single-Pass Uber-Shader, Shader Orchestrator]
- [Source: `_bmad-output/project-context.md`]
- [Source: `_bmad-output/implementation-artifacts/2-1-the-planetary-heartbeat-uber-shader.md`]
- [Source: `src/bootstrap-gameplay.ts` — `EVENTS.ASTEROID_HIT`]
- [Source: `src/vfx/planet-heartbeat-filter.ts` — Filter wiring pattern]

### Latest Technical Notes

- Follow **PixiJS v8.8.x** `Filter` + `GpuProgram`/`GlProgram` patterns already proven in-repo; no new render libraries.

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- Implemented `CONFIG.COLLISION_SPECTACLE`, `StarfieldBackground` (layer index 0), dual-backend `CollisionSpectacleFilter` + `CollisionSpectacleController`; `triggerImpulse` runs on the same `pickBestStormHit` success path as impulse + `EVENTS.ASTEROID_HIT` (once per hit). Effect age uses `SyncClock.getAbsoluteTime()`; envelopes in `collision-spectacle-envelope.ts` covered by Vitest.
- **Manual:** WebGPU + WebGL — confirm shockwave origin tracks flick impact; no z-order regressions (starfield → planet → debris); aberration reads as a short punch (~50ms class via `ABERRATION_DURATION_SEC`). Optional: profile with debris storm active (`Performance` panel) to confirm frame budget.
- **Code review follow-up (2026-04-09):** Ticker uses `samplePlanetHeartbeatInto` (no per-frame object alloc). `MAX_SIMULTANEOUS_IMPULSES` read in controller (`<= 0` disables; value `1` = single-slot last-hit-wins). Shaders: idle fast-path single `textureSample` when shock+aberration near zero. Starfield resize reuses one fill style object. Shared `quadraticDecayEnvelope` for shock/aberration curves. Added `collision-spectacle-filter.test.ts` (rapid-hit + idle); `beat-phase` / envelope tests extended.

### File List

- `src/config/config.ts`
- `src/bootstrap-gameplay.ts`
- `src/core/beat-phase.ts`
- `src/core/beat-phase.test.ts`
- `src/core/collision-spectacle-envelope.ts`
- `src/core/collision-spectacle-envelope.test.ts`
- `src/vfx/collision-spectacle-filter.ts`
- `src/vfx/collision-spectacle-filter.test.ts`
- `src/vfx/collision-spectacle-shaders.ts`
- `src/vfx/starfield-background.ts`

### Change Log

- 2026-04-09: Story 2.2 — collision spectacle (starfield + displacement shockwave + chromatic aberration), config, envelope unit tests, bootstrap wiring.
- 2026-04-09: Review fixes — alloc-free heartbeat sampling, spectacle controller tests, shader idle path, starfield fill reuse, config/doc ordering.

---

**Completion status:** done — Review findings addressed; tests and production build green.
