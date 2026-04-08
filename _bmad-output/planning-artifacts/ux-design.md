# UX & Visual Specification: The Reactive Planet

## 1. Vision: "Premium Visual Smash"
The aesthetic goal is to deliver a 15-30 second "High-Fidelity Flex" that feels like a premium interactive ad. The UX must prioritize instant feedback, rhythmic synchronicity, and senior-level visual "juice."

---

## 2. HUD & Interface Layout

### Gameplay HUD
- **Score (Top-Left):** Scaled with `AnimeJS` on each hit. Uses a "Geometric Shadow" to ensure visibility against the starfield.
- **Combo (Top-Right):** Pulsing at the track's BPM. Multiplier text increases in "glow intensity" as the tier rises (x2 → x8).
- **Atmospheric Health (Center Planetoid):** Not a bar. Health is reflected in the planet's **Atmospheric Glow** color (Neon Cyan → Distress Red).

### Glassmorphism Overlays
All UI overlays (Landing, Victory, Failure) use a **Frosted Glass** effect:
- **Blur:** 20px Gaussian blur on the background backdrop-filter.
- **Border:** 1px white border at 10% opacity for a "Glass Edge" highlight.
- **Typography:** Modern sans-serif (e.g., 'Inter' or 'Outfit').

---

## 3. Interaction Model: The "High-Fidelity Flick"

### The Flick Swipe (Interaction Window)
- **Input:** Single-point touch/mouse swipe.
- **Visual Feedback:** A **Tapered Glow Trail** that persists for 200ms.
- **Logic:** The trail is rendered using a `PIXI.Graphics` object with dynamic alpha-fade.

### Impact VFX (Collision Spectacle)
Upon a successful `Ray-Cast` deflection:
1. **Displacement Ripple:** A circular shockwave shader expands from the point of impact.
2. **Chromatic Aberration:** A 50ms spike in RGB offset to simulate high-velocity impact.
3. **Particle Ejection:** 20-30 geometric shards ejected using a `PIXI.ParticleContainer`.

---

## 4. Universal States & Transitions

### State A: Onboarding (Wave 1)
- **Visuals:** A single, isolated asteroid spawns with the lowest velocity.
- **Interaction:** A subtle, semi-transparent "Swipe Hint" icon (hand icon) appears if no interaction occurs for 2 seconds.

### State B: The Final Pulse (Success)
- **Visuals:** The "Golden Bloom." The entire screen ripples with a high-intensity bloom filter.
- **Payoff:** A triumphant GLaDOS card appearing with "DEFENSE SUCCESSFUL."

---

## 5. Technical Asset Manifest

| Asset Type | Requirement | Technical Implementation |
| :--- | :--- | :--- |
| **Fonts** | Inter / Roboto Mono | Google Fonts (Loaded via Webfontloader) |
| **Shaders** | Uber-Shader | PIXI.Filter (Custom GLSL) |
| **Particles** | Vector Shards | PIXI.ParticleContainer |
| **UI Blur** | Frosted Glass | Backdrop-Filter Shader |
| **Icons** | Minimalist Vector | Inlined SVG (Under 5MB Target) |

---

## 6. UX Best Practices Compliance

- [x] Zero-Text Tutorial Wave.
- [x] <16ms Interaction Latency.
- [x] Rhythmic BPM-Syncing.
- [x] Multi-Resolution Support (Desktop/Mobile Safari).
