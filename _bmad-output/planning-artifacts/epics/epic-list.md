# Epic List

## Epic 1: The Rhythmic Foundation

Goal: Establish the "One-Verb" gameplay loop and the SyncClock foundation. Ensure the game feels physically correct and remains synced.

## Story 1.1: The Rhythmic Core & SyncClock

As a Developer,
I want to initialize the PixiJS 8 scene and the Calibrated Hybrid Clock,
So that the game has a solid technical foundation for rhythm and time-warps.

**Acceptance Criteria:**

**Given** a clean development environment with Node.js and npm installed
**When** I run the build system and start the application
**Then** a PixiJS 8 scene initializes with a calibrated `SyncClock` that aligns the render loop (`ticker.speed`) with the high-precision Web Audio API (`audioContext.currentTime`)
**And** rhythmic drift is less than 5ms per minute.

## Story 1.2: High-Fidelity Flick (Ray-Cast Intersector)

As a Player,
I want to flick debris with my finger or mouse,
So that I can deflect threats from the planetoid with frame-perfect precision.

**Acceptance Criteria:**

**Given** a moving debris object on a high-speed trajectory
**When** a swipe interaction occurs across the object's path
**Then** the `Ray-Cast Intersector` detects the collision correctly regardless of frame-rate
**And** the system calculates a physics impulse using a `Weighted Velocity Buffer` to kick the object away.

## Story 1.3: Procedural Debris Storm (Object Pooling)

As a Player,
I want a consistent storm of orbits to interact with,
So that the game maintains a high-energy intensity without performance drops.

**Acceptance Criteria:**

**Given** the game scene is active
**When** the procedural spawning timer triggers
**Then** debris objects spawn from the screen edges with randomized trajectories towards the center
**And** objects are managed via an `Object Pool` for efficient memory usage and zero-jitter performance.

## Story 1.4: Zero-Text Onboarding (Tutorial Wave)

As a Player,
I want the first debris object to be easy to deflect,
So that I can intuitively learn the "Flick" interaction without needing tutorial text.

**Acceptance Criteria:**

**Given** a new game session starts
**When** the first debris object spawns
**Then** it follows a direct path to the planet center at a 50% reduced velocity
**And** it remains on screen until interacted with or until it impacts at the reduced speed.

## Epic 2: The Dopamine Payload

Goal: Layer on the "Visual Smash" and auditory satisfaction. This is our primary technical "flex" for recruiters.

## Story 2.1: The Planetary Heartbeat (Uber-Shader)

As a Player,
I want the planetoid to pulse in sync with the music,
So that I feel an immediate rhythmic connection to the world.

**Acceptance Criteria:**

**Given** the background music is playing at a specific BPM
**When** the beat occurs in the `SyncClock`
**Then** the `Uber-Shader` modulates the planet's atmospheric glow intensity and scale
**And** the pulse is visually synced with sub-16ms accuracy.

## Story 2.2: Collision Spectacle (Shockwaves & Aberration)

As a Player,
I want a massive visual reaction when I successfully flick an object,
So that I feel a sense of "Visual Smash" and senior-level payoff.

**Acceptance Criteria:**

**Given** a successful `Ray-Cast` collision between the flick swipe and debris
**When** the object is deflected
**Then** the system triggers a **Displacement Shockwave** filter that ripples the background starfield
**And** a **Chromatic Aberration** spike occurs briefly at the point of impact.

## Story 2.3: Micro-Slow-Mo & Particle Ejection

As a Player,
I want the game to briefly slow down when I make contact,
So that I can appreciate the high-fidelity destruction of the debris.

**Acceptance Criteria:**

**Given** the initial frame of contact between the flick and the asteroid
**When** the interaction resolves
**Then** the `SyncClock` scales the global time delta to 0.2x for 100ms (Micro-Slow-Mo)
**And** a burst of fragments is ejected using a PixiJS 8 `ParticleContainer` for maximum performance.

## Story 2.4: Rhythmic SFX Feedback (QuantizedSFX)

As a Player,
I want my interactions to sound like they are part of the music,
So that the game feels like a reactive musical instrument.

**Acceptance Criteria:**

**Given** a successful "Perfect Smash" detection
**When** the interaction SFX is triggered
**Then** the sound is pitch-quantized to the track's musical key
**And** its playback is quantized to the nearest 1/16th note according to the `SyncClock`.

## Epic 3: The Reactive Storm

Goal: Implement challenge, progression, and the failure-state bridge. Players must manage health while dealing with high-reward threats.

## Story 3.1: Atmospheric Health & Distress Shader

As a Player,
I want to see the planet's health reflected in its color,
So that I feel the tension and stakes as damage occurs.

**Acceptance Criteria:**

**Given** the planet takes damage from a missed debris object
**When** the `atmosphericHealth` value decreases
**Then** the `Uber-Shader` interpolates the planet's color from **Neon Cyan** to **Distress Red** based on current health percentage
**And** the shift is smooth and immediately reactive.

## Story 3.2: The Combo Engine (Multipliers)

As a Player,
I want to be rewarded for my rhythmic accuracy and streaks,
So that I have a reason to master the flick interactions.

**Acceptance Criteria:**

**Given** multiple successful flick interactions in a row
**When** no hits result in damage to the planet
**Then** the `Combo Multiplier` increments (x2, x4, x8...) and displays on the UI
**And** any damage taken resets the multiplier to x1.

## Story 3.3: Heavy Fragments (Gold Debris)

As a Player,
I want a rare, high-value challenge during the storm,
So that I can test my flick speed and earn massive points.

**Acceptance Criteria:**

**Given** a procedural spawn event
**When** a rare "Gold" debris object enters the scene
**Then** the object uses physics-dampening logic to resist slow flicks
**And** a high-velocity deflection triggers unique "Metallic" particles and a 5x score bonus.

## Story 3.4: Intensity Stages & The Shatter (FSM)

As a Player,
I want the game to build to a climatic finish,
So that I experience the full technical "flex" of the project.

**Acceptance Criteria:**

**Given** a session duration of 30 seconds
**When** time passes through the 5s and 20s thresholds
**Then** the `Intensity FSM` elevates the spawning frequency and shader oscillation intensity (Arrival → Flow → Climax)
**And** health reaching zero triggers the **"Professional Physics Shatter"** state transition and bridges to the results screen.

## Epic 4: The Masterpiece Meta

Goal: Finalize the "Recruitment Funnel" with personality, persistence, and premium polish.

## Story 4.1a: The Victory Climax & Results Overlay

As a Player,
I want to celebrate a successful defense with a massive visual payoff,
So that the session feels like a "Master-level" accomplishment.

**Acceptance Criteria:**

**Given** the player has survived the 30-second intensity window
**When** the `finalPulse` event completes
**Then** the `Uber-Shader` triggers a full-screen "Golden Bloom" displacement wave
**And** a **Glassmorphism UI** overlay appears displaying the "Victory" state and session stats.

## Story 4.1b: The Physics Shatter & Fail State

As a Player,
I want a dramatic visual conclusion if my atmospheric health reaches zero,
So that I feel the stakes and technical polish even in failure.

**Acceptance Criteria:**

**Given** the `atmosphericHealth` value reaches 0
**When** the "Shatter" state transition occurs
**Then** the planetoid triggers the "Professional Physics Shatter" VFX (high-fidelity fragmentation)
**And** the UI overlay appears with "Atmospheric Failure" and a Cynical Evaluation from GLaDOS.

## Story 4.2: GLaDOS Rank Evaluation

As a Player,
I want to hear what GLaDOS thinks of my performance,
So that I feel motivated by the personality-driven feedback.

**Acceptance Criteria:**

**Given** the results screen is active
**When** the session stats (score, combo, health) are analyzed
**Then** a text field displays personality-driven feedback in the GLaDOS style
**And** the message is specific to the performance tier reached.

## Story 4.3: Persistent High Scores (LocalStorage)

As a Player,
I want the game to remember my best score,
So that I have a personal goal to beat in future sessions.

**Acceptance Criteria:**

**Given** a completed session score
**When** the score is higher than the existing record
**Then** the system updates the `totalHighScore` in `localStorage`
**And** the value is displayed prominently on the Landing and Results UI elements.

## Story 4.4: The Architect's Funnel (Technical CTA)

As a Recruiter,
I want to easily find the technical documentation for this project,
So that I can evaluate the developer's engineering depth.

**Acceptance Criteria:**

**Given** the results overlay is active
**When** I click the "Architect's Notes" button
**Then** the application navigates to the detailed technical documentation or portfolio backend in a new tab.

## Epic 5: Session Feedback & Audio Fidelity

Goal: Close the gap between UX/GDD promise and live gameplay by delivering continuous in-session feedback (audio + HUD) and stronger debris readability.

## Story 5.1: Live Session HUD (Score + Combo)

As a Player,
I want to see score and combo while I am playing,
So that I can react to performance in real time instead of waiting for results.

**Acceptance Criteria:**

**Given** a session is in `PLAYING` state
**When** I successfully deflect debris
**Then** score updates immediately in a visible in-session HUD
**And** combo multiplier visibility matches active streak changes in real time.

## Story 5.2: Audio Director + Player Audio Controls

As a Player,
I want complete gameplay audio feedback with mute and volume controls,
So that I can hear rhythmic responses and control loudness per my environment.

**Acceptance Criteria:**

**Given** gameplay interactions occur
**When** deflections, planet impacts, and heartbeat moments happen
**Then** distinct routed SFX/audio cues are audible through a master audio bus
**And** mute/volume controls affect all game audio consistently.

## Story 5.3: Planet + Debris Visual Asset Upgrade

As a Player,
I want the planet and debris to use polished image assets with comet-tail trails on moving asteroids,
So that gameplay readability and visual quality match the premium presentation goal.

**Acceptance Criteria:**

**Given** gameplay renders the center planet and incoming debris
**When** the scene initializes and debris spawns
**Then** the planet uses `assets/planet.png` and debris use sprite assets from the `assets/` folder instead of procedural circle placeholders
**And** each normal debris spawn randomly picks one image from `assets/asteroid_1.png` through `assets/asteroid_4.png`
**And** each heavy/golden debris spawn randomly picks one image from `assets/golden_asteroid_1.png` through `assets/golden_asteroid_4.png`
**And** moving debris above trail threshold render a velocity-aligned comet tail with alpha fade
**And** visual replacement and random selection preserve existing gameplay behavior and 60fps target on supported targets.
