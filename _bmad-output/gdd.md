---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
inputDocuments: ["game-brief.md", "vacancy-research.md", "brainstorming-session-2026-04-07.md"]
documentCounts:
  briefs: 1
  research: 1
  brainstorming: 1
  projectDocs: 0
workflowType: 'gdd'
lastStep: 14
project_name: 'The Reactive Planet'
user_name: 'Timmy'
date: '2026-04-08'
game_type: 'rhythm'
game_name: 'The Reactive Planet'
---

# The Reactive Planet - Game Design Document

**Author:** Timmy
**Game Type:** Rhythm
**Target Platform(s):** {{platforms}}

---

## Executive Summary

### Game Name

The Reactive Planet

### Core Concept

The Reactive Planet is a premium HTML5 playable ad designed as a high-performance technical showcase. Players engage in a 15-second rhythmic defense experience, flicking incoming orbital debris away from a central pulsing planetoid. 

The game focuses on extreme "juice" and tactile responsiveness, where every interaction triggers custom PixiJS displacement filters and musical feedback scale shifts. It is a "mini-masterpiece" designed to prove senior-level mastery of web-based game development and shader optimization through butter-smooth, low-latency gameplay.

### Game Type

**Type:** Rhythm (rhythm)
**Framework:** This GDD uses the rhythm template with type-specific sections for Music synchronization, timing-based gameplay, and rhythmic feedback loops.

---

## Target Platform(s)

### Primary Platform

Web Browser (Mobile & Desktop)

### Platform Considerations

- **Input Lag:** Optimized for PixiJS 8's Tick-Based Input Buffer to ensure sub-millisecond responsiveness for the "Flick" action.
- **Audio Latency:** Automatic Audio-Context handling to manage browser-specific auto-play restrictions.
- **Cross-Device Scaling:** Responsive coordinate system mapping to maintain consistent flick-sensitivity on any screen size.
- **Performance:** Target a locked 60fps across modern mobile (iOS/Android) and desktop browsers using PixiJS 8's WebGL/WebGPU pipeline.

### Control Scheme

**Flick Interaction:** Single-point touch swipe (Mobile) and Click-and-Swipe (Desktop). Velocity-sensitive, physics-aware input mapping using a high-fidelity buffer.

---

## Target Audience

### Demographics

- **Primary:** Technical Recruiters and Marketing Leads (Ages 25-45) in the mobile gaming industry.
- **Secondary:** Casual Mobile Gamers seeking high-quality, short-form interactive experiences.

### Gaming Experience

**Casual/Technical:** Designed for "instant mastery" by recruiters who value technical polish over complex learning curves.

### Genre Familiarity

**High (Intuitive):** Leverages standard "Defense" and "Flick" tropes for a zero learning curve and instant gratification.

### Session Length

**Ultra-Short (15-30 Seconds):** Perfectly tuned for the attention span of a technical professional or a mobile user in transit.

### Player Motivations

Recruiters are motivated by discovering a developer who can overcome the constraints of marketing tech. Players are motivated by the "mini-masterpiece" of visual payoff and rhythmic satisfaction.

---

## Goals and Context

### Project Goals

1. **Secure Senior Vacancy:** Demonstrate professional-grade mastery of PixiJS 8 and performance optimization to secure a Senior Marketing Developer position.
2. **Locked 60fps Technical Validation:** Ship a flawlessly smooth experience on mobile and desktop web, proving optimization mastery under tight browser constraints.
3. **High-Fidelity Interaction:** Create a tactile, sub-millisecond response that feels "physically weighty" and immediate to the recruiter's touch.

### Background and Rationale

The Reactive Planet is a dedicated technical showcase built specifically for a high-level job application. It is a direct tactical response to the low-quality "misleading" ad meta, delivering a premium, custom-coded interactive experience in a compact, 15-second format. The motivation is purely professional: to prove high-end technical proficiency and "juice" orchestration.

---

## Unique Selling Points (USPs)

### The "Mini-Masterpiece" Standard

The game's primary differentiator is achieving AAA-level visual and auditory polish in a tightly focused, 15-second interaction. Every "flick" and collision is treated as a "mini-masterpiece" of multi-sensory feedback, ensuring that even the briefest engagement leaves a lasting professional impression of technical superiority.

### Custom-Shader Superiority

Every visual effect—from atmospheric distortions to the planetary heartbeat—is hand-crafted in GLSL/PixiJS 8. This "no generic plugins" approach immediately communicates a senior-level mastery of the rendering pipeline and GPU optimization.

### Rhythmic Atmospheric Synergy

A unified technical system where the planet's heartbeat, shader intensity, and gameplay rhythm are mathematically linked, creating a hypnotic and reactive "living world" experience.

### Competitive Positioning

This project separates itself from standard "template-based" portfolio pieces by focusing on master-level, custom-coded VFX. It positions the developer as a performance specialist capable of handling the extreme demands of premium marketing technology.

---

## Core Gameplay

### Game Pillars

1. **Visual Smash:** Every single interaction (flick, collision, pulse) must be a "mini-masterpiece" of visual payoff using custom shaders, displacement maps, and high-fidelity particles.
2. **Butter-Smooth Response:** Locked 60fps and sub-millisecond input-to-render feedback to prove technical mastery and professional-grade optimization.
3. **The "One-Verb" Rule:** Balancing deep technical complexity with a single, intuitive "Flick" action for zero learning curve and instant gratification.

**Pillar Prioritization:** When pillars conflict, prioritize in this order:
**Visual Smash > Butter-Smooth Response > One-Verb Rule**

### Core Gameplay Loop

The player engages in a high-octane rhythmic defense cycle centered around tactile interaction and visual spectacle.

- **Action:** Player performs a velocity-sensitive "flick" on incoming orbital debris.
- **Feedback:** Immediate displacement-filter shockwave and rhythmic musical scale shift.
- **Reward:** Massive visual payoff of "The Smash" and increased atmospheric "glow" intensity.
- **Motivation:** Rising rhythmic frequency and intensity of debris flow, driving the player towards the "Final Pulse" technical climax.

**Loop Diagram:**
`Flick (Input) -> Smash (VFX) -> Glow (Reward) -> Intensity (Motivation) -> Flick`

**Loop Timing:** 0.5 - 2.0 Seconds per cycle.
**Loop Variation:** Difficulty scales via fragment density and arrival rhythm, mathematically synced to the planet's atmospheric heartbeat.

### Win/Loss Conditions

#### Victory Conditions
- **High-Performance Completion:** Successfully survive the 15-30 second interactive window and reach the "Final Pulse" climax.

#### Failure Conditions
- **Atmospheric Depletion (Red-Alert System):** The planetoid possesses "Atmospheric Health." This is visualized through a color-interpolation shader that shifts the planet from **Neon Cyan to Distress Red** as damage is taken. Reaching zero triggers the **"Professional Physics Shatter"** failure state.

#### Failure Recovery
- **Immediate Restart:** Quick reset to encourage an addictive "one more try" loop.
- **Portfolio Handoff:** Direct 1-tap navigation to the technical breakdown or developer portfolio upon failure.

---

## Game Mechanics

### Primary Mechanics

{{primary_mechanics}}

### Controls and Input

{{controls}}

---

## Game Mechanics

### Primary Mechanics

1. **High-Fidelity Flick (Interaction / Combat):**
   - **Description:** Players interact with incoming orbital debris by performing a high-velocity swipe or flick directly on the object.
   - **Technical Implementation:** Employs a **Ray-Cast Intersector** to ensure frame-perfect collision detection during high-speed swipes, combined with a **Weighted Velocity Buffer** for precise impulse calculation.
   - **Tactile Feel:** Includes a **Micro-Slow-Mo (0.2x time scale)** trigger for 100ms upon initial contact, providing a window for "Specialist" precision and enhancing the "Mini-Masterpiece" aesthetic.
   - **Pillar Alignment:** Supports the **One-Verb Rule**, **Butter-Smooth Response**, and **Visual Smash**.

2. **Atmospheric Pulse (Information / Rhythm):**
   - **Description:** The central planetoid pulses with a rhythmic "heartbeat" shader.
   - **Interaction:** The pulse frequency and intensity increase as the session progresses, mathematically linked to the incoming debris rhythm and musical scales.
   - **Pillar Alignment:** Supports **Visual Smash**.

3. **Collision Spectacle (Interaction / Feedback):**
   - **Description:** Every successful deflection triggers a multi-shader explosion event.
   - **VFX Layers:** Displacement shockwaves, chromatic aberration spikes, and high-performance particle ejection.
   - **Pillar Alignment:** Supports **Visual Smash**.

4. **Distress Coloration (Resource / Feedback):**
   - **Description:** Planet color interpolates from Neon Cyan to Distress Red based on atmospheric health.
   - **Pillar Alignment:** Supports the **One-Verb Rule**.

### Mechanic Interactions

The **High-Fidelity Flick** is the master mechanic. The **Ray-Cast Intersector** ensures that even the fastest flick is registered, while the **Micro-Slow-Mo** provides a brief moment of "Zen" before the **Collision Spectacle** triggers a rhythmic shockwave that ripples through the **Atmospheric Pulse**.

---

## Controls and Input

### Control Scheme (Web Browser)

| Action | Mobile (Touch) | Desktop (Mouse) |
| :--- | :--- | :--- |
| **Deflect Debris** | Single-point Ray-casted Swipe | Left-Click + Ray-casted Swipe |
| **Restart/Menu** | UI Tap | UI Click |

### Input Feel

The controls are designed for **sub-millisecond responsiveness**. By combining **Ray-Casting** with the **Micro-Slow-Mo** effect, the game creates a feeling of "Specialist Precision." The "One-Verb" interaction feels physically connected to the user's movement, maintaining a "Senior-level" technical standard with zero input dampening.

---

## Rhythm Specific Design

### Procedural Orbital Debris

- **Spawning Logic:** Orbital debris spawns at random intervals and trajectories from the screen edges, creating a high-energy "storm" feel rather than a rigid chart.
- **Heavy Fragments (Gold):** Rare "Gold" debris objects possess increased mass and physics-dampening properties. These require a higher-velocity **High-Fidelity Flick** to successfully deflect, serving as a "Skill Check" that rewards players with 5x score and unique "Metallic" particle VFX.

### Scoring and Judgment

- **Judgment Framework:**
    - **Perfect Smash:** Frame-perfect ray-cast collision at high intensity. Triggers the **Micro-Slow-Mo** effect.
    - **Hit:** Standard ray-cast deflection.
    - **Miss:** Debris impacts the planetoid, causing **Atmospheric Damage** and resetting the combo.
- **Combo Multiplier:** Every consecutive successful flick increments a multiplier (x2, x4, x8...). This is displayed via a shader-animated UI element that pulses in perfect sync with the **Atmospheric Heartbeat**.

### Audio Integration

- **Pulse Sync:** The **Atmospheric Pulse** and the background audio share a strictly consistent BPM, ensuring the planetary "heartbeat" remains locked to the musical rhythm.
- **Rhythmic Feedback:** Successful hits trigger quantized SFX that are pitch-shifted to the song's key, effectively turning the gameplay into a reactive music visualizer.

---

## Progression and Balance

### Player Progression

The Reactive Planet focuses on a concentrated, high-performance interactive loop. Progression is centered on **Skill Acquisition**, **Visual Reward**, and a **Recursive Portfolio Funnel**.

- **Skill Progression:** Players improve through the mastery of the **High-Fidelity Flick** timing and the physical intuition required to deflect "Gold" asteroids.
- **Visual Dopamine (High Feedback Rate):** Achieving a new high score triggers a unique "Golden Pulse" of the planetary shaders and a high-intensity glow on the score UI.
- **Local Persistence:** The game tracks and displays a **Local High Score** (cached via `localStorage`) to encourage re-engagement.

#### Progression Pacing

Progression is immediate. The player reaches "Peak Intensity" within seconds, focusing the experience on sustained performance and "perfect" execution streaks during the 15-30 second window.

### Difficulty Curve

The game utilizes a **Flat** difficulty curve to maintain a consistently high level of technical challenge. 

#### Challenge Scaling

The game operates at "Peak Intensity" from the first spawn. This forces the recruiter to immediately engage with the physics and input math, proving senior-level competency from the very first frame.

#### Meta Loop & Portfolio Funnel (Replayability)

At the conclusion of each session (Victory or Shatter), a stylized glassmorphism UI overlay appears with a dual-purpose Call to Action:
1. **"One More Try" (Play Again):** A zero-friction state reset for immediate replayability.
2. **"The Architect's Notes":** A secondary link directing the recruiter to a detailed technical breakdown, blog post, or the GitHub repository.
3. **GLaDOS Rank Evaluation:** A specialized text field that generates cynical, personality-driven feedback based on performance (e.g., *"Statistical insignificance detected. Please attempt to be slightly more competent next time."*).

### Economy and Resources

_This game does not feature an in-game economy or resource system to maintain the focus on technical execution and the "One-Verb" interaction rule._

---

## Level Design Framework

### Structure Type

The Reactive Planet utilizes an **Endless / Procedural Arena** structure. The entire experience is contained within a single, high-fidelity interactive scene to eliminate menus and ensure the user moves from "Load" to "Play" in under 2 seconds.

### Level Types (The Reactive Nebula)

The game features a single, atmospheric setting: **The Reactive Nebula**.

- **Atmospheric Elements:**
    - **Glowing Space Gas:** Multi-layered parallax fog driven by noise shaders to create a sense of cosmic depth and organic movement.
    - **Pulsing Starfield:** A background field of tiny, dot-like stars. Each star pulses with subtle, randomized timing—creating a shimmering "Cosmic Vibe" without distracting the player's focus from the debris.
- **Tutorial Integration:**
    - **Zero-Text Onboarding:** The first debris object spawns at a reduced velocity and follows a direct path to the planet center, intuitively forcing the "Flick" interaction without the need for tutorial text.

### Level Progression

#### Procedural Intensity Stages

Instead of discrete levels, the game progresses through three intensity phases over a 30-second window:
1. **Arrival (0-5s):** Onboarding phase. Low debris frequency and clear vectors.
2. **Flow (5-20s):** The core rhythmic experience. Steady bombardment and consistent musical integration.
3. **The Final Pulse (20s+):** The technical climax. Maximum fragment density, intense shader oscillation, and high-frequency pulse events.

### Level Design Principles

1. **"Atmosphere is Gameplay":** Every environment change (stars, gas, planet color) must communicate game state to the player.
2. **"Immediate Engagement":** The first interaction must trigger within seconds of arrival to maximize user retention.
3. **"Climatic Finish":** The final 10 seconds must push the rendering limits of PixiJS 8 to leave a stunning professional impression.

---

## Art and Audio Direction

### Art Style

The Reactive Planet utilizes a **Stylized Vector-Hybrid** aesthetic, combining clean geometric forms with high-performance procedural shaders. The visual target is to communicate "Master-level" technical proficiency through subtle micro-animations and sophisticated rendering effects.

#### Visual References
- **TRON: Legacy:** For the high-contrast neon lighting and minimalist, glow-heavy environments.
- **Modern Glassmorphism:** For a premium, tactical UI feel that screams "Senior Portfolio."

#### Color Palette
- **Neon Cyan:** The primary signature of planetary stability and perfect health.
- **Distress Red:** Dynamic shift for atmospheric damage and critical health states.
- **Molten Gold:** Reserved for "Heavy Debris" skill-check objects.
- **Deep Void Obsidian:** The high-contrast canvas for the parallax nebula.

#### Camera and Perspective
The game uses a **Fixed 2D Perspective** with an **Infinite Depth** visual gimmick. Multi-layered parallax fog (noise shaders) and Z-depth blurs create the illusion of vast 3D space while keeping the "Flick" interaction perfectly flat and precise.

### Audio and Music

#### Music Style
High-energy **Electronic / Synthwave** with a 120-130 BPM. The music is a driving, 30-second loop that builds tension while remaining mathematically locked to the planetary heartbeat.

#### Sound Design
- **Minimalist Soundscape:** The audio environment is kept clean. Background elements like space gas and stars remain silent to avoid distracting from the core rhythm.
- **Quantized Feedback:** Every successful "Flick" triggers a synthesized "Ping" that is pitch-quantized to the track's musical key, making the player feel like they are "performing" the music.
- **The Shatter Drop:** Failure triggers a high-fidelity "Glass Shattering" effect layered with a distorted sub-bass drop for a dramatic session conclusion.

### Aesthetic Goals

Every visual and auditory asset is designed to serve the **Visual Smash** and **Butter-Smooth Response** pillars. By prioritizing high-contrast clarity and synchronized rhythmic feedback, the game demonstrates a senior-level mastery of holistic game feel.

---

## Technical Specifications

### Performance Requirements

{{performance_requirements}}

### Platform-Specific Details

{{platform_details}}

### Asset Requirements

{{asset_requirements}}

---

## Development Epics

### Epic Overview

| # | Epic Name | Scope | Dependencies | Est. Stories |
| :--- | :--- | :--- | :--- | :--- |
| 1 | The Core Collision | Flick physics, Raycast, Debris spawning | None | 5 |
| 2 | Atmospheric Aesthetics | Planet Shaders, Nebula, Rhythm Sync | Epic 1 | 4 |
| 3 | The Reactive Systems | Gold Debris, Combo Multiplier, Health | Epic 2 | 5 |
| 4 | Portfolio Polish & Meta | Play Again loop, GLaDOS Ranking, CTA | Epic 3 | 4 |

### Recommended Sequence

The project utilizes a **Vertical Slice** sequence (1 → 2 → 3 → 4). This ensures the core interaction (the "One-Verb" Flick) is technically sound and performant before layering on the visual "Smash" and complex scoring systems.

### Vertical Slice

**The first playable milestone:** A functional environment where the player can successfully deflect debris using a high-fidelity, ray-casted flick interaction at 60fps.

---

## Out of Scope

- **Multiplayer/Social:** No global leaderboards, friend challenges, or PvP modes.
- **Narrative Content:** No dedicated story mode, character dialogue, or world-building lore beyond the atmospheric nebula.
- **Economic Systems:** No in-game currency, upgrades, or cosmetic skins.
- **Platform Support:** No Console, VR, or TV-based rendering support.
- **Localization:** Strictly English (US) interface.

### Deferred to Post-Launch (Nice-to-Haves)
- **Global Persistence:** Transitioning `localStorage` scores to a cloud-based leaderboard (Supabase/Firebase).
- **Secondary Game Modes:** "Zen Mode" with no failure states, and "Hardcore Mode" with faster debris.

---

## Assumptions and Dependencies

### Key Assumptions
- **Modern Hardware:** The user/recruiter has a device capable of hardware-accelerated WebGPU/WebGL 2 rendering.
- **Stable Engine:** PixiJS 8 is assumed to be stable and performant for core rendering.
- **Rhythmic Accuracy:** The browser's audio context provides low-latency playback for the BPM-sync system.

### External Dependencies
- **PixiJS 8:** Core rendering engine.
- **AnimeJS:** Interaction and UI tween library.
- **Web Hosting:** Netlify, Vercel, or GitHub Pages.

### Risk Factors
- **Performance Budget:** Pushing too many complex shaders could lead to frame drops on older mobile devices, potentially violating the "Butter-Smooth" pillar.
- **Input Lag:** Technical browser performance issues could introduce non-deterministic input latency for high-speed flicks.

---

## Document Information

**Document:** The Reactive Planet - Game Design Document
**Version:** 1.0
**Created:** 2026-04-08
**Author:** Timmy
**Status:** Complete

### Change Log

| Version | Date | Changes |
| :--- | :--- | :--- |
| 1.0 | 2026-04-08 | Initial GDD complete. |

---

# GDD COMPLETE

---

## Success Metrics

### Technical Metrics

The technical evaluation of "The Reactive Planet" is focused on proving senior-level mastery of the modern web rendering pipeline and asset optimization strategies.

#### Key Technical KPIs

| Metric | Target | Measurement Method |
| :--- | :--- | :--- |
| **Frame Rate Stability** | Locked 60fps | PixiJS Ticker / Chrome DevTools Performance |
| **Load Efficiency** | < 2 Seconds | 4G Throttling Simulation (First Interactive) |
| **Payload Management** | Under 5MB Total | Final Build Asset Audit (Pre-Gzip) |
| **Input Precision** | < 16ms Latency | End-to-end "Flick" to Raycast resolution |

### Gameplay Metrics

Success is measured by the recruiter's engagement with the core loop and the re-engagement friction of the "One More Try" loop.

#### Key Gameplay KPIs

| Metric | Target | Measurement Method |
| :--- | :--- | :--- |
| **High-Score Mastery** | 1 Player Goal | Motivation for the recruiter to reach a new personal best |
| **Replay Engagement** | 2.5x sessions | Avg. "Play Again" clicks per unique recruiter session |
| **Climax Achievement** | 30 Seconds | Average player survival length (reaching the intensity peak) |
| **Technical Conversion** | 15% CTR | Clicks on the "Architect's Notes" recruitment CTA |

### Qualitative Success Criteria

1. **"The Portfolio Catalyst":** The primary qualitative metric—the project serves as a definitive conversation starter that leads to a job offer.
2. **"Butter-Smooth Recognition":** The recruiter or hiring manager explicitly notes the "premium feel" or "smoothness" of the interaction.
3. **"Technical Hook":** The viewer is compelled to ask about the custom shaders or the "Master-Level Vanilla" physics architecture, proving the technical "flex" was successful.

### Metric Review Cadence

_Since this is a portfolio project, metrics will be reviewed during the final "Performance Profiling" phase of development and audited before each major application submission._

---

# GDD FINALIZED

---

## Out of Scope

{{out_of_scope}}

---

## Assumptions and Dependencies

{{assumptions_and_dependencies}}
