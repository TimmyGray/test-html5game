# Story 5.2: Audio Director + Player Audio Controls

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Player,  
I want complete gameplay audio feedback with mute and volume controls,  
so that I can hear rhythmic responses and control loudness per my environment.

## Acceptance Criteria

1. Given gameplay interactions occur, when deflections, planet impacts, and heartbeat moments happen, then distinct routed SFX/audio cues are audible through a master audio bus.
2. Given I toggle mute, when gameplay continues, then all game audio output is muted/unmuted consistently without breaking rhythm timing.
3. Given I change volume, when audio events trigger, then loudness changes are applied through a single master control affecting all routed gameplay audio.
4. Given browser autoplay restrictions suspend audio, when user performs unlock gesture, then audio resumes safely and playback checks guard against invalid scheduling.
5. Existing rhythmic timing integrity remains intact (`SyncClock` + quantized scheduling), and gameplay performance remains within 60fps target.
6. Add/extend tests for audio routing, mute/volume behavior, and suspended/running context guards.

## Tasks / Subtasks

- [x] Implement an `AudioDirector` module (or equivalent) under `src/core`/`src/systems` to own master graph setup (AC: #1, #2, #3, #4)
  - [x] Create shared master `GainNode` chain (`master -> destination`) in the existing `AudioContext`.
  - [x] Expose `setMuted(boolean)` and `setMasterVolume(number)` APIs with clamped values.
  - [x] Keep lifecycle explicit: init, connect, dispose.
- [x] Route existing quantized SFX through master bus (AC: #1, #3, #5)
  - [x] Refactor `QuantizedSfxPlayer` to accept output node/bus (avoid direct `destination` coupling).
  - [x] Preserve `trySchedulePerfectSmash` timing logic and state guards.
- [x] Add missing gameplay audio triggers (AC: #1, #5)
  - [x] Deflection cue path beyond perfect-only gate as defined by design intent.
  - [x] Planet impact/shatter cue path from gameplay events/state transitions.
  - [x] Heartbeat-linked low-level pulse/bed path using existing beat timing/events.
- [x] Add player-facing audio controls in UI (AC: #2, #3)
  - [x] Add mute toggle + volume control surface in gameplay-safe UI area.
  - [x] Ensure controls do not conflict with overlays and remain responsive on mobile/desktop.
  - [x] (Optional) Persist user volume/mute preference in `localStorage` with safe fallback.
- [x] Extend tests and run regressions (AC: #6)
  - [x] Extend `quantized-sfx.test.ts` for output routing + mute/volume behavior.
  - [x] Add focused tests for `AudioDirector` control state and context guardrails.
  - [x] Run full test suite and manual browser smoke check for resume/autoplay flow.

## Dev Notes

### Epic Context

- Epic 5 is post-launch polish to close feedback gaps discovered in direct playtest.
- Story 5.2 is the audio backbone story; it aligns UX/GDD rhythmic feel with actual runtime behavior and user controls.

### Relevant Existing Systems and Reuse Targets

- Audio context bootstrap and unlock path already exist in `src/main.ts`:
  - `new AudioContext()`
  - `SyncClock.instance.calibrate(audioCtx)`
  - pointer/keyboard resume when suspended
  - `initGameplay(app, { audioContext: audioCtx })`
- Current SFX engine:
  - `src/core/quantized-sfx.ts` (`QuantizedSfxPlayer`) uses procedural one-shot buffers
  - routes internal gain through the provided output bus (or `destination` when unset)
  - `trySchedulePerfectSmash` may schedule while suspended so playback begins after `resume()`; invalid `start` attempts are caught
- Gameplay audio hooks:
  - `EVENTS.ASTEROID_HIT` currently drives quantized SFX scheduling
  - `EVENTS.BEAT` is available for heartbeat/pulse audio hooks
  - planet-impact/shatter paths in gameplay should be wired to distinct audio cues
- Event definitions and contracts:
  - `src/core/events.ts`
  - `src/config/config.ts` (`EVENTS`, `QUANTIZED_SFX`)

### Previous Story Intelligence

- Story 5.1 established live HUD wiring patterns and reinforces event-driven decoupling.
- Follow the same lifecycle discipline: explicit mount/init and `dispose` teardown to prevent listener/node leaks.

### Architecture & Project Context Guardrails

- Use the central Event Bus for cross-system communication; avoid hard coupling audio logic inside rendering systems.
- Maintain `SyncClock` as source of rhythm integrity; avoid gameplay-critical `setTimeout`/`setInterval`.
- Respect autoplay guardrails: validate `AudioContext.state` before scheduling/starting sources.
- Keep changes lightweight and performance-safe (no heavy work in hot tick paths).
- Preserve TypeScript strictness and colocated tests.

### Implementation Guidance

- Recommended structure:
  - `AudioDirector` owns shared bus and control state.
  - `QuantizedSfxPlayer` accepts an output node instead of connecting to destination directly.
  - Gameplay systems emit events; audio layer subscribes and plays routed cues.
- Suggested control model:
  - `masterVolume`: normalized `0..1`, clamped.
  - `muted`: boolean that sets effective gain to `0` while preserving previous volume value.
- Keep existing `CONFIG.QUANTIZED_SFX.MASTER_GAIN` as per-effect headroom and add a global master control above it.

### Testing Requirements

- Unit tests:
  - master gain routing and connection path
  - mute toggle does not break scheduling
  - volume clamping and effective gain behavior
  - suspended context no-op safety
- Integration/manual:
  - first input unlock resumes audio
  - deflection/impact/heartbeat cues audible and controllable
  - controls remain functional across replay and overlay transitions

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-list.md` - Story 5.2]
- [Source: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-04-11.md` - Section 4.2 and handoff]
- [Source: `_bmad-output/gdd.md` - Audio Integration, Art and Audio Direction]
- [Source: `_bmad-output/game-architecture.md` - Time management, Event system, Audio stack]
- [Source: `_bmad-output/project-context.md` - audio guardrail, rhythm integrity, performance/testing rules]
- [Source: `src/main.ts` - `AudioContext` creation and unlock path]
- [Source: `src/core/quantized-sfx.ts` and `src/core/quantized-sfx.test.ts`]
- [Source: `src/bootstrap-gameplay.ts` - audio/event trigger wiring]
- [Source: `src/core/sync-clock.ts` and `src/core/events.ts`]

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- CS workflow run targeting explicit story key `5-2-audio-director-player-audio-controls`.
- Implemented routed `AudioDirector` and gameplay/UI integration with quantized + procedural cues.
- Regression validated with `npm run lint` and `npm run test` (149 passing).
- Browser smoke on dev server verified HUD + mute toggle flow; slider drag remained automation-limited but unit coverage passed.

### Completion Notes List

- Code review (2026-04-12): BGM now connects via `getMasterInputNode()` so `SFX_BUS_HEADROOM` applies only to gameplay SFX; `setAudioMuted` / `setMasterVolume` emit bus events (removed duplicate bootstrap listeners); story File List completed; dev note corrected for quantized suspended scheduling.
- Added `AudioDirector` with master gain bus (`master -> destination`), mute/volume APIs, and safe cue scheduling guards for suspended contexts.
- Routed `QuantizedSfxPlayer` through configurable output bus while preserving perfect-smash quantized scheduling and timing gates.
- Added gameplay audio triggers for deflection, planet impact, shatter, and beat-linked heartbeat pulse paths via event bus.
- Added HUD mute/volume controls and safe localStorage preference persistence in startup wiring.
- Extended tests with new `audio-director.test.ts`, plus quantized output-route coverage and HUD controls behavior test.
- Full project regression passed: lint clean and test suite green.
- Production build passed (`npm run build`) and browser smoke showed no runtime errors.

### Change Log

- 2026-04-12: Post–code-review fixes: BGM `masterInputNode` routing, mute/volume bus emits from gameplay setters, File List + dev notes sync, story marked done.
- 2026-04-12: Implemented Story 5.2 audio director, routed cues, player controls, persistence, and regression tests.

### File List

- `_bmad-output/implementation-artifacts/5-2-audio-director-player-audio-controls.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/core/audio-director.ts`
- `src/core/audio-director.test.ts`
- `src/core/background-music.ts`
- `src/core/background-music.test.ts`
- `src/core/quantized-sfx.ts`
- `src/core/quantized-sfx.test.ts`
- `src/bootstrap-gameplay.ts`
- `src/core/events.ts`
- `src/config/config.ts`
- `src/ui/session-hud.ts`
- `src/ui/session-hud.test.ts`
- `src/style.css`
- `src/main.ts`
- `src/global.d.ts`
- `assets/Cosmic Freeway-128k.mp3`
- `assets/Cosmic Freeway (1)-128k.mp3`

---

**Completion status:** done
