# Story 1.1: The Rhythmic Core & SyncClock

Status: done

## Story

As a Developer,
I want to initialize the PixiJS 8 scene and the Calibrated Hybrid Clock,
so that the game has a solid technical foundation for rhythm and time-warps.

## Acceptance Criteria

1. **PixiJS 8 Scene Initialization**: The engine must initialize with `preference: 'webgpu'` and fallback correctly to WebGL 2.
2. **Calibrated SyncClock**: Implementation of a `SyncClock` that aligns the render loop (`ticker.speed`) with the high-precision Web Audio API (`audioContext.currentTime`). [Source: project-context.md#27]
3. **Drift Tolerance**: Rhythmic drift between the visual ticker and audio clock must be less than 5ms per minute.
4. **Resolution Independence**: The stage must be initialized with a responsive coordinate system suitable for both Mobile (Safari/Chrome) and Desktop.

## Tasks / Subtasks

- [x] **Core Architecture Setup** (AC: #1)
  - [x] Create `/src/core` directory.
  - [x] Implement `EventEmitter` constants for system-wide sync.
- [x] **SyncClock Implementation** (AC: #2)
  - [x] Create `/src/core/sync-clock.ts`.
  - [x] Implement `calibrate(audioContext)` logic.
  - [x] Implement `getDelta()` and `getAbsoluteTime()` methods.
- [x] **Engine Bootstrap** (AC: #1, #4)
  - [x] Update `/src/main.ts` to initialize `PIXI.Application`.
  - [x] Force `preference: 'webgpu'`.
  - [x] Attach `SyncClock` to the global `ticker`.
- [x] **Validation & Profiling** (AC: #3)
  - [x] Create `sync-clock.test.ts` for drift verification.
  - [x] Verify WebGPU vs WebGL fallback in the browser console.

## Dev Notes

- **Engine Specifics**: Use PixiJS v8.8.1. Avoid deprecated `PIXI.Loader`. Use `Assets`.
- **Rhythm Integrity**: DO NOT use `setTimeout` or `setInterval` for gameplay-critical timing. Use the `SyncClock`.
- **Performance**: Zero-Allocation in the ticker loop is mandatory.
- **Project Structure**: Code must live in `/src/core`.

### Project Context Rules

- **Renderer Preference**: Always initialize PixiJS with `preference: 'webgpu'`.
- **Ticker & Time**: Implementation MUST use the `SyncClock` pattern to align `ticker.speed` with the Windows Web Audio API (`audioContext.currentTime`) for rhythmic precision.
- **Audio Guardrail**: All audio triggers MUST be preceded by a call to check the `AudioContext` state to handle browser Autoplay Restrictions gracefully.

### References

- [Source: project-context.md](file:///e:/apps/test-html5game/_bmad-output/project-context.md)
- [Source: epic-list.md#Story 1.1](file:///e:/apps/test-html5game/_bmad-output/planning-artifacts/epics/epic-list.md#story-11-the-rhythmic-core--syncclock)

## Dev Agent Record

### Agent Model Used

Claude (Cursor Agent)

### Implementation Plan

- Added `gameEvents` + `EVENTS` re-export from config for a single event bus.
- SyncClock uses raw `ticker.elapsedMS` (wall clock) vs audio delta to set `ticker.speed`; `getDelta()` / `getAbsoluteTime()` expose rhythm-safe timing.
- Main: `preference: 'webgpu'`, `resizeTo` + `autoDensity` + DPR resolution; `AudioContext` + suspended → `pointerdown` resume; ticker hooks `SyncClock.sync`.
- Vitest drift test: cumulative delta vs absolute audio time stays under 5ms over one simulated minute.
- Webpack `extensionAlias` + `global.d.ts` so `.js` TS specifiers and CSS imports build cleanly.

### Debug Log References

### Completion Notes List

- All tasks and acceptance criteria addressed; `npm test` and `npm run build` pass.
- Console verification: startup log includes `renderer` class name and `gpu` type (WebGPU vs WebGL) for manual fallback check.
- Code review (2026-04-08): File List completed; drift tests extended (audio/wall skew + zero audio advance); `sync()` comment for no-advance frames; story → done; sprint synced.

### File List

- `src/config/config.ts`
- `src/core/events.ts`
- `src/core/sync-clock.ts`
- `src/core/sync-clock.test.ts`
- `src/global.d.ts`
- `src/main.ts`
- `webpack.config.mjs`
- `package.json`
- `package-lock.json`
- `vitest.config.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Senior Developer Review (AI)

**Reviewer:** Link Freeman (gds-code-review workflow)  
**Date:** 2026-04-08  
**Outcome:** Approve → fixes applied (auto path)

- Resolved MEDIUM: incomplete File List (`config.ts`, `package-lock.json`); drift coverage expanded (skew + stable baseline); documented `sync()` behavior when `currentTime` does not advance; sprint `1-1-the-rhythmic-core-syncclock` set to **done**.
- Remaining note: Vitest runs in `node` with mocked `AudioContext` — integration tests against real Pixi ticker deferred to later stories.

## Change Log

- 2026-04-08: Story 1.1 implemented — SyncClock, Pixi WebGPU bootstrap, event bus, vitest drift suite, webpack/CSS typings fixes.
- 2026-04-08: Post-review — File List sync, extra drift/zero-advance tests, `sync()` comment, status **done**, sprint status updated.
