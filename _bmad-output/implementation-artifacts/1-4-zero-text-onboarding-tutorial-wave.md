# Story 1.4: Zero-Text Onboarding (Tutorial Wave)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Player,  
I want the first debris object to be easy to deflect,  
so that I can intuitively learn the "Flick" interaction without needing tutorial text.

## Acceptance Criteria

1. **Session scope:** **Given** a new gameplay session starts (fresh `initGameplay` lifecycle after load — same as when `GAME_START` fires today), **when** the first storm debris is spawned, **then** that piece is the **tutorial first wave** piece (exactly one per session).
2. **Direct approach:** That first piece uses a **straight inward trajectory** toward viewport center `(width/2, height/2)` — **no angular jitter** (contrast: normal storm uses jitter in `DebrisStormSpawner._spawnOne`).
3. **50% reduced velocity:** The first piece’s speed magnitude is **50%** of the speed that would apply to a **normal** spawn using the same baseline draw from `CONFIG.DEBRIS_STORM.SPEED_MIN` / `SPEED_MAX` (i.e. compute the usual random speed once, then multiply by **0.5** for the tutorial piece, or apply a **`0.5` multiplier** to the same formula — behavior must match “half as fast as a typical first spawn”).
4. **Lifespan until resolution:** **And** the tutorial piece **remains active** (not OOB-recycled) until **either**:
   - the player successfully applies a flick that resolves to a hit on that debris (existing `FLICK_COMMIT` → `pickBestStormHit` path registers interaction), **or**
   - it **impacts the planet**: distance from debris center to viewport center is ≤ `CONFIG.PLANET.RADIUS + CONFIG.DEBRIS_PROBE.RADIUS` (treat planet as centered circle; matches current layout assumption in spawner comments).
5. **Storm continues after:** After the tutorial piece is resolved (hit or impact), subsequent spawns use **existing** storm behavior (jitter + full speed range) with no special casing.
6. **No-allocation hot path:** Tutorial flags and checks use **preallocated** fields or pooled state — no per-frame `new` in the ticker path (per `project-context.md`).
7. **Tests:** Colocated unit tests cover: (a) first-spawn uses no jitter and half speed vs baseline; (b) tutorial debris is not recycled by OOB while still the active tutorial piece; (c) planet impact resolves tutorial when center distance crosses threshold (pure function test with stub positions).

## Tasks / Subtasks

- [x] **Config** (AC: #3, #6)
  - [x] Add `CONFIG.ONBOARDING` (or extend `DEBRIS_STORM`) with frozen constants: `FIRST_WAVE_SPEED_SCALE: 0.5`, `FIRST_WAVE_JITTER: 0` (explicit is fine), optional `PLANET_HIT_ENABLED: true` for clarity.
- [x] **`DebrisProbe` / pool** (AC: #1, #4, #6)
  - [x] Add minimal tutorial state (e.g. `tutorialWave: 'none' | 'active' | 'done'` or boolean `isTutorialFirstWave` + `tutorialResolved`) set only on the first spawn; avoid extra allocations.
- [x] **`DebrisStormSpawner`** (AC: #2, #3, #5)
  - [x] Introduce a session-scoped counter or injectable policy so the **first** `_spawnOne` in a session uses: fixed edge choice for a **direct** aim (e.g. top-edge **center** spawn → velocity exactly toward `(cx, cy)`), `jitter = 0`, speed `= 0.5 * (smin + rng * (smax - smin))` matching current speed draw.
  - [x] Reset tutorial state when `reset()` is called if gameplay session restarts (align with `destroy()` / re-init).
- [x] **`bootstrap-gameplay.ts`** (AC: #4, #5, #6)
  - [x] After integrate, before OOB recycle: if debris is active tutorial piece, **skip** `isStormOutOfView` recycle until resolved.
  - [x] After positions update: if tutorial still active, test planet impact using center `(w/2, h/2)` vs `CONFIG.PLANET.RADIUS` + debris radius; on hit, mark tutorial resolved and `pool.release` or transition to `done` per pool rules (document chosen behavior — likely release back to pool like other debris).
  - [x] Ensure first successful **flick hit** on tutorial id also marks tutorial resolved (may already happen via normal hit path — add explicit flag clear).
- [ ] **Optional (UX stretch, not blocking AC):** [Source: `ux-design.md` § State A] semi-transparent swipe hint after **2s** idle — only if zero-text bar is met; gated behind config flag default **off** or follow-up story.
- [x] **Validation** (AC: #7)
  - [x] Colocated tests: spawner tutorial first spawn, bootstrap/recycle rules (extract pure helpers where needed), `npm test` + `npm run build` pass.

## Dev Notes

### Architecture & scope

- **Depends on 1.3:** `DebrisPool`, `DebrisStormSpawner`, `bootstrap-gameplay` storm loop, `SyncClock` dt — do not regress pooling or flick CCD.
- **Planet geometry:** No dedicated planet `DisplayObject` is required for AC #4; **circle-vs-point** distance at stage center is sufficient until Epic 2 planet shader owns a transform (if later offset, update test helper).
- **Pool exhaustion:** If `acquire()` fails on the first eligible spawn tick, do **not** consume the tutorial wave — the **first successful `acquire`** that follows must still apply tutorial rules (session flag remains “pending tutorial spawn”).
- **“Normal” speed for 50% comparison:** Implementations should derive the tutorial speed from the **same RNG draw** as a standard spawn would use for that slot, then multiply by `0.5`, so tests can seed `rng` and assert exact half.

### Previous story intelligence (1.3)

- `DebrisStormSpawner` documents viewport-centered aim; tutorial **turns off** jitter for spawn #1 only.
- OOB recycling lives in `bootstrap-gameplay.ts` — tutorial must **opt out** until resolved.
- `pickBestStormHit` / `ASTEROID_HIT` unchanged; tutorial completion may subscribe once or set flag in hit handler when `debrisId` matches tutorial.

### Project structure

- Prefer **`src/systems/gameplay/`** for any `onboarding-session.ts` helper if logic grows; keep **hot path** in existing files unless split improves clarity.
- **Naming:** kebab-case files, `CONFIG` centralized in `src/config/config.ts`.

### Project Context Rules

- **Strict No-Alloc Loop:** No `new` in ticker callbacks; tutorial fields on `DebrisProbe` or module-level session struct created at init.
- **Rhythm:** Spawning cadence still driven by accumulated `dt` from `SyncClock`; do not use `setTimeout` for gameplay.
- **Testing:** Colocated `*.test.ts` with Vitest.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-list.md` — Story 1.4]
- [Source: `_bmad-output/planning-artifacts/ux-design.md` — §4 State A: Onboarding (Wave 1)]
- [Source: `_bmad-output/project-context.md` — Performance, No-Alloc, SyncClock]
- [Source: `_bmad-output/implementation-artifacts/1-3-procedural-debris-storm-object-pooling.md`]
- [Source: `src/systems/gameplay/debris-storm-spawner.ts`]
- [Source: `src/bootstrap-gameplay.ts`]
- [Source: `src/config/config.ts` — `PLANET.RADIUS`, `DEBRIS_PROBE`, `DEBRIS_STORM`]

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- Implemented session-scoped first spawn: `DebrisStormSpawner` keeps `_tutorialFirstSpawnPending` until the first successful `acquire` + spawn; tutorial uses top-center `(cx, -EDGE_MARGIN)`, no jitter, `baseSpeed * CONFIG.ONBOARDING.FIRST_WAVE_SPEED_SCALE`.
- `DebrisProbe.tutorialFirstWaveActive` gates OOB recycle; cleared on flick hit, planet impact (`pool.release`), or `DebrisPool.release`.
- Pure helpers in `tutorial-planet-impact.ts` for planet overlap and OOB policy; covered by Vitest.

### File List

- `src/config/config.ts`
- `src/systems/gameplay/debris-probe.ts`
- `src/systems/gameplay/debris-pool.ts`
- `src/systems/gameplay/debris-storm-spawner.ts`
- `src/systems/gameplay/debris-storm-spawner.test.ts`
- `src/systems/gameplay/tutorial-planet-impact.ts`
- `src/systems/gameplay/tutorial-planet-impact.test.ts`
- `src/bootstrap-gameplay.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/1-4-zero-text-onboarding-tutorial-wave.md`

## Change Log

- 2026-04-08: Story created via `gds-create-story` — ultimate context engine analysis completed; comprehensive developer guide created.
- 2026-04-08: Implemented zero-text tutorial first wave (config, spawner, probe/pool, bootstrap planet + OOB + flick clear); tests + build green.
