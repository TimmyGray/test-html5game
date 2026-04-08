---
title: 'Game Architecture'
project: 'test-html5game'
date: '2026-04-08'
author: 'Timmy'
version: '1.0'
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9]
status: 'complete'
engine: 'PixiJS 8'
platform: 'Mobile/Desktop Web'
---

# Game Architecture

## Executive Summary

**The Reactive Planet** architecture is designed for **PixiJS 8** targeting **Mobile & Desktop Web** platforms as a high-performance 15-second playable ad.

**Key Architectural Decisions:**
- **Hybrid Webpack Inlining:** Ensures a single-file HTML output (< 5MB) by automatically inlining JS, CSS, and base64 assets.
- **Calibrated Hybrid Clock:** Achieves perfect rhythmic synchronization by calibrating the delta-based Ticker (used for slow-mo) against high-precision Web Audio API time.
- **Single-Pass Uber-Shader:** Maximizes mobile performance by consolidating all planetary visual effects (displacement, chromatic aberration, pulse) into one GPU pass.

**Project Structure:** **Hybrid Organization** pattern with 5 core systems (Input, Rhythm, Rendering, Physics, UI) documented for clear ownership.

**Implementation Patterns:** 5 specialized patterns including **Object Pooling** and **Typed Event Bus**, ensuring AI agent consistency and zero-jitter 60fps performance.

**Ready for:** Epic implementation phase.

---

## Document Status

This architecture document is complete and serves as the technical single source of truth for **The Reactive Planet**.

**Steps Completed:** 9 of 9 (Finalized)

---

## Project Context

### Game Overview
**The Reactive Planet** - A premium 15-second HTML5 playable ad designed as a high-performance technical showcase for a Senior Marketing Developer portfolio.

### Technical Scope
**Platform:** Mobile Web (Primary), Desktop Web (Secondary)
**Genre:** Rhythm / Arcade Defense
**Project Level:** High-Performance Technical Showcase

### Core Systems
| System | Complexity | Architectural Role |
| :--- | :--- | :--- |
| **Rendering Pipeline** | High | PixiJS 8.0 implementation with custom GLSL post-processing. |
| **Input Intersector** | High | Ray-cast based collision and velocity buffering for interaction. |
| **Shader Orchestrator** | High | Managing planet heartbeat, displacement, and nebula noise. |
| **Rhythm Clock** | Medium | Central BPM synchronization for gameplay and VFX. |
| **Physics Engine** | Medium | Custom lightweight collision for asteroid/planet interaction. |

### Technical Requirements
- **Performance:** Locked 60fps on modern mobile browsers.
- **Latency:** Sub-millisecond response through the Input Buffer.
- **Payload:** < 5MB total asset weight.
- **Optimization:** PixiJS 8 WebGL/WebGPU hybrid pipeline utilization.

---

## Engine & Framework

### Selected Engine
**PixiJS v8.17.1**

**Rationale:** PixiJS 8 provides a high-performance WebGPU-first rendering pipeline with robust WebGL fallbacks. Its reactive render loop and native `ParticleContainer` are essential for achieving the locked 60fps requirement while orchestrating complex custom shaders.

### Project Initialization
```bash
# Recommended initialization command
npm create pixi.js@latest
```
*Select: Bundler Template -> Webpack.*

### Engine-Provided Architecture
| Component | Solution | Notes |
| :--- | :--- | :--- |
| **Rendering** | WebGPU/WebGL Hybrid | Handled by PixiJS 8. |
| **Physics** | Simple Collisions | Native utility functions. |
| **Audio** | HTML5 / Web Audio | Integrated playback system. |
| **Input** | Unified Pointer Events | Native PixiJS interaction. |
| **Build System** | Webpack 5 | Bundler starter template. |

---

## Architectural Decisions

### Decision Summary
| Category | Decision | Rationale |
| :--- | :--- | :--- |
| **Build System** | Hybrid Webpack Inlining | Automated single-file HTML output (< 5MB). |
| **Time Management** | Calibrated Hybrid Clock | Syncs slow-mo Ticker scaling with Audio precision. |
| **Rendering** | Single-Pass Uber-Shader | Consolidates VFX into one GPU pass for mobile speed. |
| **Input Physics** | Vector-Based CCD | Prevents tunneling at high flick speeds. |
| **Data Persistence** | Native LocalStorage | Light, offline-first persistence for scores. |

### Technical Deep Dives
**State Management:** The **Calibrated Hybrid Clock** re-aligns `ticker.speed` deltas with `audioContext.currentTime` every frame, ensuring rhythmic integrity even during slow-mo warps.

**Interaction:** **Vector-Based CCD** intersects the line segment of the asteroid's movement with the user's swipe vector, ensuring frame-perfect interaction.

---

## Cross-cutting Concerns

### Error Handling
**Strategy:** Global Emergency Handler. Critical faults trigger a stylized **"Professional Physics Shatter"** state rather than a raw crash.

### Logging
**Strategy:** Conditional Console Logging. Full diagnostics in development; stripped in production by Webpack to save bytes.

### Event System
**Pattern:** Typed Event Bus. Centralized `EVENTS` constants used with Pixi's native `EventEmitter`.

### Configuration
**Approach:** Inlined Shared Config. Immutable JS object containing all balancing constants, inlined via Webpack.

---

## Project Structure

### Directory Structure
```
test-html5game/
├── src/                    # Game core logic
│   ├── core/               # Engine init, Ticker, Event Bus
│   ├── systems/            # Prime Pillars (Input, Rhythm, Rendering, Physics)
│   ├── ui/                 # HUD & HUD Overlays
│   ├── utils/              # Math, GLSL helpers, Logger
│   ├── config/             # Immutable constants
│   └── main.js             # Entry & Global Error Handler
├── assets/                 # Raw materials (Inlined)
├── webpack/                # Custom Inlining config
└── index.html              # Final template
```

---

## Implementation Patterns

### Novel Patterns
- **Micro-Time Warp:** Delta scaling synchronized with Web Audio.
- **Visual Smash Batcher:** High-frequency uniform updates for the Uber-Shader.

### Standard Patterns
- **Communication:** Typed Event Bus.
- **Entity Management:** Object Pooling for Asteroids.
- **State Transitions:** Finite State Machine (FSM).

---

## Development Environment

### Prerequisites
- Node.js 20+
- npm 10+

### Setup Commands
```bash
npm install
npm create pixi.js@latest ./ # Follow prompts for Webpack
npm install --save-dev html-webpack-plugin html-inline-script-webpack-plugin
```

### First Steps
1. Run `npm create pixi.js@latest` to initialize the project structure.
2. Update `webpack.config.js` with the inline plugins for single-file output.
3. Implement `src/core/SyncClock.js` to establish the Calibrated Hybrid Clock.
4. Forge the first asteroid pool in `src/systems/physics/`.

---

## Architecture Validation

### Validation Summary
| Check | Status | Result |
| :--- | :--- | :--- |
| **Decision Compatibility** | ✅ PASS | Perfectly aligned for mobile web performance. |
| **GDD Coverage** | ✅ PASS | 100% of core pillars addressed. |
| **Pattern Completeness** | ✅ PASS | Clear guidelines for all recurring AI tasks. |
| **Document Status** | ✅ READY | Finalized and verified. |

**Validation Date:** 2026-04-08
