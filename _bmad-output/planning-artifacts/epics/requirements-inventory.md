# Requirements Inventory

## Functional Requirements

FR1: Player must be able to perform a high-velocity "flick" interaction (swipe/click-and-swipe) on orbital debris objects.
FR2: System must use a Ray-Cast Intersector for frame-perfect collision detection during the flick interaction.
FR3: System must calculate impulse using a Weighted Velocity Buffer for precise flick physics.
FR4: System must trigger a "Micro-Slow-Mo" effect (0.2x time scale for 100ms) upon initial contact with debris.
FR5: Orbital debris must spawn from screen edges with procedural trajectories and velocities.
FR6: Central planetoid must have an "Atmospheric Heartbeat" shader pulse locked to the music's BPM.
FR7: Successful deflections must trigger "Collision Spectacle" VFX: displacement shockwaves, chromatic aberration, and particle ejection.
FR8: Planet must have "Atmospheric Health" visualized via a Neon Cyan to Distress Red color-interpolation shader.
FR9: Missing debris must cause damage to Atmospheric Health and reset the combo multiplier.
FR10: Reaching zero health must trigger a "Professional Physics Shatter" failure state.
FR11: System must track a combo multiplier (x2, x4, x8...) incremented by consecutive successful flicks.
FR12: "Gold" (Heavy) fragments must spawn rarely, requiring higher flick velocity and rewarding 5x score with unique SFX/VFX.
FR13: Gameplay must progress through three intensity stages (Arrival, Flow, Final Pulse) over a 30-second window.
FR14: End-of-session UI must provide "One More Try" (reset) and "Architect's Notes" (technical funnel) CTA buttons.
FR15: System must generate "GLaDOS Rank Evaluation" personality-driven feedback based on session performance.
FR16: System must persist local high scores using `localStorage`.
FR17: Audio system must trigger pitch-quantized SFX synchronized to the track's musical key upon hits.
FR18: Failure must trigger a "Shatter Drop" audio effect (glass shatter + distorted sub-bass).
FR19: System must handle a "Victory Condition" (successfully surviving the window) with a unique visual climax and results transition.
FR20: System must implement a "Zero-Text Onboarding" mechanic where the first debris wave is reduced in velocity.

## NonFunctional Requirements

NFR1: Game must target a locked 60fps on modern mobile and desktop browsers.
NFR2: Interaction latency must be sub-millisecond (sub-16ms end-to-end flick-to-raycast).
NFR3: Assets must be optimized to ensure the final payload is under 5MB (pre-gzip).
NFR4: Game must load and become interactive in under 2 seconds on 4G throttle.
NFR5: System must be built using PixiJS 8 (WebGPU/WebGL pipeline) and AnimeJS.
NFR6: Coordinate system must be responsive/multi-layered for various screen sizes (Mobile/Desktop).
NFR7: Game must handle browser auto-play restrictions for the Audio Context.
NFR8: Visual style must follow "Stylized Vector-Hybrid" with neon contrast and glassmorphism UI.

## Additional Requirements

- **Engine**: PixiJS 8.17.1 (WebGPU/WebGL hybrid).
- **Core strategy**: Single-pass Uber-Shader for planet VFX (displacement, chromatic aberration, pulse).
- **Time Management**: Calibrated Hybrid Clock (syncing ticker speed deltas with Web Audio precision).
- **Input Physics**: Vector-Based CCD (Continuous Collision Detection) to prevent tunneling at high flick speeds.
- **Build System**: Webpack 5 with Hybrid Inlining for single-file HTML output (< 5MB).
- **State Management**: Finite State Machine (FSM).
- **Entity Management**: Object Pooling for asteroids/debris.
- **Communication**: Typed Event Bus (Pixi native EventEmitter with constants).
- **Project Structure**: Hybrid Organization (Input, Rhythm, Rendering, Physics, UI systems).

## UX Design Requirements

*None identified in current documents.*

## FR Coverage Map

FR1: Epic 1 - "One-Verb" Flick Interaction.
FR2: Epic 1 - Ray-Cast Intersector logic.
FR3: Epic 1 - Impulse and velocity buffering.
FR4: Epic 2 - Micro-Slow-Mo visual feel.
FR5: Epic 1 - Procedural debris spawning foundation.
FR6: Epic 2 - BPM-locked Atmospheric Pulse.
FR7: Epic 2 - Collision Spectacle (Shaders/Particles).
FR8: Epic 3 - Distress Red health interpolation.
FR9: Epic 3 - Damage and combo-reset logic.
FR10: Epic 3 - Failure state (Shatter) logic and FSM.
FR11: Epic 3 - Combo multiplier logic.
FR12: Epic 3 - Gold debris (heavy fragments) specialized logic.
FR13: Epic 3 - Intensity Phase management (Arrival -> Flow -> Climax).
FR14: Epic 4 - Results UI, CTAs and technical funnel.
FR15: Epic 4 - GLaDOS evaluation personality logic.
FR16: Epic 4 - LocalStorage high-score persistence.
FR17: Epic 2 - Rhythmic SFX feedback.
FR18: Epic 2 - Shatter Drop audio experience.
FR19: Epic 4 - Success climax and Victory UI (Story 4.1a).
FR20: Epic 1 - Tutorial Wave logic (Story 1.4).
