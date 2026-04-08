# Story 1.1: The Rhythmic Core & SyncClock

Status: ready-for-dev

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

- [ ] **Core Architecture Setup** (AC: #1)
  - [ ] Create `/src/core` directory.
  - [ ] Implement `EventEmitter` constants for system-wide sync.
- [ ] **SyncClock Implementation** (AC: #2)
  - [ ] Create `/src/core/sync-clock.ts`.
  - [ ] Implement `calibrate(audioContext)` logic.
  - [ ] Implement `getDelta()` and `getAbsoluteTime()` methods.
- [ ] **Engine Bootstrap** (AC: #1, #4)
  - [ ] Update `/src/main.ts` to initialize `PIXI.Application`.
  - [ ] Force `preference: 'webgpu'`.
  - [ ] Attach `SyncClock` to the global `ticker`.
- [ ] **Validation & Profiling** (AC: #3)
  - [ ] Create `sync-clock.test.ts` for drift verification.
  - [ ] Verify WebGPU vs WebGL fallback in the browser console.

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

Gemini 3 Flash

### Debug Log References

### Completion Notes List

### File List
