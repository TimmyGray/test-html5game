# Story 2.1: The Planetary Heartbeat (Uber-Shader)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Player,  
I want the planetoid to pulse in sync with the music,  
so that I feel an immediate rhythmic connection to the world.

## Acceptance Criteria

1. **Beat-synced pulse:** Given background music is playing at the configured BPM, when each beat occurs according to `SyncClock`/audio time, then the planet heartbeat pulse updates on that beat boundary. [Source: `_bmad-output/planning-artifacts/epics/epic-list.md` Story 2.1]
2. **Uber-Shader modulation:** The planet visual uses an Uber-Shader slice to modulate atmospheric glow intensity and visual scale (or equivalent radius deformation) on beat.
3. **Timing precision:** Pulse alignment is visually synchronized with sub-16ms perceived latency relative to beat timing.
4. **Performance-safe rendering:** Shader implementation remains mobile-friendly (no unnecessary multi-pass or heavy branching), preserving 60fps targets.
5. **Regression-safe integration:** Existing Story 1.1-1.3 gameplay loop (SyncClock, pooled storm, flick/raycast interactions) remains fully functional.
6. **Tests and verification:** Unit checks for heartbeat timing math plus manual visual/performance verification are documented and executable.

## Tasks / Subtasks

- [ ] **Add heartbeat/Uber constants** (AC: #1, #2, #3, #4)
  - [ ] Extend `src/config/config.ts` with `PLANET_HEARTBEAT` (or equivalent) for pulse amplitude, attack/decay, glow gain, scale gain, and beat window.
  - [ ] Keep all values centralized and immutable with existing `CONFIG` conventions.

- [ ] **Implement beat phase source from SyncClock** (AC: #1, #3)
  - [ ] Add a rhythm helper under `src/core/` or `src/systems/rhythm/` that derives beat phase from `SyncClock.instance.getAbsoluteTime()` and `CONFIG.RHYTHM.BPM`.
  - [ ] Avoid timer-based scheduling (`setTimeout` / `setInterval`); keep one time authority.

- [ ] **Implement planetary heartbeat shader module** (AC: #2, #4)
  - [ ] Add new VFX module(s), e.g. `src/vfx/planet-heartbeat-filter.ts` and shader source file(s), using Pixi v8 filter APIs.
  - [ ] Update shader uniforms every frame using preallocated state (no per-tick allocations).
  - [ ] Keep fragment math branch-light and mobile-friendly.

- [ ] **Integrate planet visual into gameplay bootstrap** (AC: #1, #2, #5)
  - [ ] Add planet visual node/filter setup in `src/bootstrap-gameplay.ts` with stable center positioning.
  - [ ] Ensure render ordering does not break current debris/flick readability.
  - [ ] Wire beat phase/envelope updates in `update()` while preserving existing storm and hit loop behavior.

- [ ] **Event and observability wiring (optional but recommended)** (AC: #1, #3)
  - [ ] Use existing `EVENTS.BEAT` channel for debug tracing (or emit beat events from the new rhythm helper) without changing current event contracts.
  - [ ] Add lightweight diagnostics toggles for pulse sync validation in dev mode.

- [ ] **Validation and quality checks** (AC: #3, #4, #6)
  - [ ] Add unit tests for beat phase/envelope math (deterministic inputs -> deterministic pulse outputs).
  - [ ] Confirm Story 1.1-1.3 tests still pass.
  - [ ] Run browser profiling pass with storm active and heartbeat shader enabled; verify frame stability.

## Dev Notes

### Previous Story Intelligence (1.3 -> 2.1)

- Story 1.3 finalized pooled storm gameplay and multi-debris hit resolution (`pickBestStormHit`) inside `bootstrap-gameplay.ts`.
- The update loop is now performance-sensitive; heartbeat logic must avoid introducing allocations or extra expensive passes.
- `SyncClock` remains the timing authority in `main.ts` (`sync()` before `gameplay.update()`); Story 2.1 should build on this, not bypass it.

### Architecture Compliance Guardrails

- Follow the architecture decision for a **Single-Pass Uber-Shader** trajectory; this story should implement the heartbeat slice in a way that can be extended by Story 2.2+.
- Keep system boundaries clean:
  - time/rhythm math in `core` or rhythm system module,
  - shader/filter logic in `vfx`,
  - orchestration in `bootstrap-gameplay.ts`.
- Continue using the typed event bus (`gameEvents` + `EVENTS`) for cross-system signaling.

### Implementation Guidance

- Use BPM phase formula based on audio time from `SyncClock`:
  - `beatsPerSec = BPM / 60`
  - `phase = fract(audioTime * beatsPerSec)`
- Build a compact heartbeat envelope around beat edges (attack/decay curve), then map envelope to glow and scale uniforms.
- Keep the planet centered using renderer dimensions and ensure behavior is stable across resize/orientation changes.
- Ensure current flick/raycast flow and asteroid-hit emissions remain unchanged while planet pulse runs concurrently.

### Project Structure Notes

- **New files expected (suggested):**
  - `src/vfx/planet-heartbeat-filter.ts`
  - `src/vfx/planet-heartbeat-filter.test.ts` (if pure math portions are extractable)
  - `src/core/beat-phase.ts` (or `src/systems/rhythm/beat-phase.ts`)
  - `src/core/beat-phase.test.ts`
- **Likely modified files:**
  - `src/bootstrap-gameplay.ts`
  - `src/config/config.ts`
  - `src/core/events.ts` (only if extending beat diagnostics/events)

### Project Context Rules

- Pixi initialization remains WebGPU-first with WebGL fallback.
- Timing-critical logic must use `SyncClock`; avoid alternate timers.
- No `new` inside ticker/hot update paths.
- Keep tests colocated with modules as `*.test.ts`.
- Any Uber-Shader or pooling change requires browser performance profiling.

### Testing Requirements

- Unit tests:
  - Beat phase wraps correctly at BPM boundaries.
  - Heartbeat envelope outputs expected amplitude around beat edges.
  - Config-driven clamp/sanity behaviors (if added).
- Regression tests:
  - Existing Story 1.1/1.2/1.3 test suites remain green.
- Manual checks:
  - Visual sync with beat (sub-16ms target feel).
  - WebGPU and WebGL fallback smoke checks.
  - Performance profile under active debris storm.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-list.md` - Story 2.1]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR6, NFR1, NFR2]
- [Source: `_bmad-output/planning-artifacts/ux-design.md` - premium visual sync goals]
- [Source: `_bmad-output/game-architecture.md` - Single-Pass Uber-Shader, rhythm timing decisions]
- [Source: `_bmad-output/project-context.md` - engine rules, performance rules, testing rules]
- [Source: `_bmad-output/implementation-artifacts/1-3-procedural-debris-storm-object-pooling.md`]
- [Source: `src/main.ts`]
- [Source: `src/bootstrap-gameplay.ts`]
- [Source: `src/config/config.ts`]

## Dev Agent Record

### Agent Model Used

GPT-5.3 Codex

### Debug Log References

- N/A (story creation phase)

### Completion Notes List

- Story context includes Uber-Shader guardrails, SyncClock beat-phase integration guidance, and explicit anti-regression constraints for Stories 1.1-1.3.
- Ready for direct handoff to `dev-story`.

### File List

- `_bmad-output/implementation-artifacts/2-1-the-planetary-heartbeat-uber-shader.md`

## Change Log

- 2026-04-08: Story created and set to **ready-for-dev** with implementation guidance and quality guardrails.
