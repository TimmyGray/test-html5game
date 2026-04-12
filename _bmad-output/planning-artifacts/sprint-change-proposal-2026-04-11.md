# Sprint Change Proposal — The Reactive Planet

**Date:** 2026-04-11  
**Author:** Course correction (Max / Scrum Master workflow)  
**Stakeholder:** Timmy  
**Trigger:** Post-ship holistic review (party session + direct playtest): audio silence for common cases, missing HUD during session vs UX doc, minimal debris/planet read vs “premium” vision.

---

## Section 1 — Issue summary

### Problem statement

Shipped stories marked **done** in `sprint-status.yaml`, but the **live product** does not yet deliver the **GDD + UX** promise for *sustained feedback* during the 15–30s loop: full audio bed + hit/planet SFX, in-session score (and combo visibility per UX), and optional player-facing **mute / volume**. Visuals remain **circle-first** prototype read; UX calls for stronger motion legibility (e.g. debris trails / “comet” read).

### Context / discovery

- **Evidence:** Runtime behavior vs `_bmad-output/planning-artifacts/ux-design.md` §2 (Gameplay HUD: score top-left, combo top-right). Code emits `SCORE_AWARDED` / `COMBO_CHANGED` but lacks a dedicated **session HUD** surface; results overlay carries end-of-run stats.  
- **Audio:** `QuantizedSfxPlayer` is scoped to **Perfect Smash** path only; no dedicated **music / pulse bed**, no guaranteed SFX on every deflection or planet impact; no **master gain + mute** in UI.  
- **Design gap:** Procedural circles vs “Premium Visual Smash” positioning — acceptable for early epic proof, **not** aligned with recruiter-facing polish expectation without a follow-on slice.

### Issue type (checklist 1.2)

- **Primary:** Gap between **original requirements / UX** and **implementation completeness** (acceptance criteria too narrow in places, e.g. Story 2.4 only Perfect Smash).  
- **Secondary:** **New / clarified stakeholder expectation** — controls and always-on feedback during session.

---

## Section 2 — Impact analysis

### Epic impact

| Area | Affected epics (conceptual) | Notes |
|------|-----------------------------|--------|
| Audio | Epic 2 (Dopamine Payload) | Story 2.1 mentions music at BPM; build lacks full music lane. Story 2.4 needs expansion or sibling stories. |
| HUD / UI | Epic 3 + UX §2 | Story 3.2 says combo on UI; session score/combo HUD not fully realized vs UX. Epic 4 results polish does not replace in-run HUD. |
| Visual read | Epic 1–2 debris/planet | Pooling + spectacle exist; **motion trails / silhouette** not specified as done in epics. |

**Verdict:** Original epics can remain **historically “done”** for traceability; add **Epic 5 (post-MVP polish)** or **maintenance epic** so new work is tracked without rewriting history.

### Story impact

| Story | Gap | Proposal |
|-------|-----|------------|
| **2.4** Rhythmic SFX | AC only covers Perfect Smash quantization | **Extend AC** or add **2.5** — general hit SFX, planet impact, optional bed, `AudioContext` graph + mute/volume. |
| **3.2** Combo | AC says multiplier on UI | Clarify **in-session HUD** (not results-only). Add tasks or **3.5** session HUD. |
| **2.1** Heartbeat | Music + visual pulse | Clarify **audio bed** vs shader-only pulse; add tasks if music is required. |

### Artifact conflicts

| Artifact | Conflict | Action |
|----------|----------|--------|
| **ux-design.md** §2 | Specifies live score + combo | Implement HUD **or** revise UX with explicit “phase 2” (not recommended). |
| **gdd.md** | Premium showcase, rhythmic feedback, audio latency called out | Align implementation + one paragraph in GDD if scope split (bed vs stems). |
| **game-architecture.md** | SyncClock + audio | Document **audio bus** (master gain, routing, mute). |
| **PRD** | N/A if none in repo | Skip or create if external tool needs it. |

### Technical impact

- New or extended: **Web Audio** routing (master `GainNode`), persistence for volume (optional `localStorage`).  
- New UI layer: DOM or Pixi text for **score + combo** during `PLAYING`.  
- VFX: debris **velocity-aligned trails** (procedural first; assets optional).  
- **Tests:** extend or add for HUD updates and audio gate (mock `AudioContext` where already pattern exists).

---

## Section 3 — Recommended approach

**Selected path:** **Option 1 — Direct adjustment** (checklist 4.1)  
**Rationale:** No rollback of shipped core loop; **additive** stories + small doc edits. Low political cost, high player-visible value.

| Option | Viable? | Notes |
|--------|---------|--------|
| 4.1 Direct adjustment | **Yes** | New stories / epic slice + narrow code changes. |
| 4.2 Rollback | **No** | Would waste stable SyncClock, pooling, spectacle. |
| 4.3 MVP / PRD shrink | **No** | GDD promise is polish/recruiter flex; shrinking contradicts goal. |

**Effort:** Medium (2–4 focused stories or one consolidated “Session Feedback” story).  
**Risk:** Low–medium (browser autoplay already partially handled; test mute + suspended context).

---

## Section 4 — Detailed change proposals

### 4.1 Epic list (`planning-artifacts/epics/epic-list.md`)

**ADD** new epic (example id):

```markdown
## Epic 5: Session Feedback & Audio Fidelity (Post-Launch Polish)

Goal: Close the gap between UX/GDD and the playable build: always-on session HUD, full audio feedback loop, player controls, and stronger debris motion read.

### Story 5.1: Session HUD (Score + Combo)
...

### Story 5.2: Audio Director (Bed + SFX + Mute/Volume)
...

### Story 5.3: Debris Motion Trails (Procedural)
...
```

*(Story bodies to be filled in `gds-create-story` or collaborative edit.)*

### 4.2 Story 2.4 — acceptance criteria extension (conceptual)

**OLD (implicit gap):** Only Perfect Smash triggers quantized SFX.

**NEW (add bullets):**

- Given **any** successful deflection, When SFX is enabled, Then a **deflection** one-shot plays (intensity may vary by combo or velocity).  
- Given **planet impact** by debris, When not muted, Then a distinct **impact / damage** cue plays.  
- Given **heartbeat / beat tick**, When music bed enabled, Then low-level **rhythmic bed** or pulse-linked noise is audible and aligned to `SyncClock`.  
- Given user adjusts **volume** or toggles **mute**, Then all routed audio respects the master bus.

**Rationale:** UX/GDD describe musical/rhythmic experience, not only “perfect” hits.

### 4.3 UX design (`ux-design.md`)

- **§2 Gameplay HUD:** Add explicit **“must be visible for entire `PLAYING` state”** and note **mute/volume** placement (e.g. corner icon + slider collapsed).  
- **§5 Technical Asset Manifest:** Note **phase 1 procedural trails**, phase 2 optional texture pack.

### 4.4 Architecture (`game-architecture.md`)

- Add subsection **Audio graph:** sources → category gains (optional) → **master gain** → destination; interaction with `SyncClock` and autoplay resume.

---

## Section 5 — Implementation handoff

| Scope | Classification | Owner |
|-------|----------------|--------|
| HUD + events wiring | **Minor–Moderate** | **Link Freeman** (`gds-agent-game-dev`) via **`gds-dev-story`** or **`gds-quick-dev-new-preview`** |
| Audio bus + SFX matrix | **Moderate** | Dev + quick **GLaDOS** pass on test cases (`gds-test-design` optional) |
| Doc / epic updates | **Moderate** | **Max** (`gds-sprint-planning` after stories land) + optional **Paige** for UX wording |

**Success criteria**

- [ ] Score (and combo per UX) visible **during** session, updating on `SCORE_AWARDED` / `COMBO_CHANGED`.  
- [ ] User can **mute** and set **volume**; state survives refresh (if spec’d).  
- [ ] Audible feedback for **deflect**, **planet hit**, and **rhythmic bed** (or explicit GDD amendment if bed deferred).  
- [ ] Debris has **readable motion trail** without new bitmap assets (MVP).  
- [ ] `sprint-status.yaml` lists new epic/story rows once created.

---

## Appendix A — Change Navigation Checklist status

| ID | Status | Note |
|----|--------|------|
| 1.1 | **N/A** | Holistic QA; closest related story **2.4** / **3.2** |
| 1.2 | **Done** | Requirement / UX vs implementation gap |
| 1.3 | **Done** | Playtest + party session evidence |
| 2.1–2.5 | **Done** | Add Epic 5; no rewrite of Epics 1–4 required |
| 3.1 | **N/A** | No PRD in standard path |
| 3.2–3.4 | **Done** | Architecture + UX + tests noted |
| 4.1–4.4 | **Done** | Direct adjustment selected |
| 5.1–5.5 | **Done** | Reflected in Sections 1–5 |
| 6.1–6.3 | **Done** | User approved on 2026-04-11 |
| 6.4 | **Done** | `epic-list.md` and `sprint-status.yaml` updated with Epic 5 + story backlog |
| 6.5 | **Done** | Handoff defined: Story drafting to Scrum, implementation to Dev |

---

## Appendix B — Next commands (after you approve)

1. **`gds-create-story`** — draft **5.1 / 5.2 / 5.3** (or one combined story) with full context.  
2. **`gds-dev-story`** — implement in repo order: HUD → audio bus → trails.  
3. **`gds-sprint-planning` (SP)** — append Epic 5 + statuses to `sprint-status.yaml`.

---

## Approval and handoff log

- **Approval:** Approved by Timmy (`yes`) on 2026-04-11.
- **Scope classification:** **Moderate** (backlog reorganization + implementation stories).
- **Artifacts updated:**  
  - `_bmad-output/planning-artifacts/epics/epic-list.md` (Epic 5 + Stories 5.1–5.3)  
  - `_bmad-output/implementation-artifacts/sprint-status.yaml` (Epic 5/story statuses = backlog)
- **Next execution route:**  
  1. `gds-create-story` for 5.1/5.2/5.3 (or one combined implementation story)  
  2. `gds-dev-story` (implementation)  
  3. `gds-code-review` after implementation

*Proposal finalized and ready for implementation handoff.*
