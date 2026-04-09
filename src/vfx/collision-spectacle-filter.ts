import { Filter, GlProgram, GpuProgram, UniformGroup } from "pixi.js";
import { CONFIG } from "../config/config.js";
import {
  aberrationEnvelope,
  shockwaveEnvelope,
  spectacleWavePhase,
} from "../core/collision-spectacle-envelope.js";
import {
  COLLISION_SPECTACLE_FILTER_VERTEX_GLSL,
  COLLISION_SPECTACLE_FRAG_GLSL,
  COLLISION_SPECTACLE_WGSL,
} from "./collision-spectacle-shaders.js";

/**
 * Single-pass screen-space filter: radial displacement shockwave + brief chromatic aberration.
 */
export class CollisionSpectacleFilter extends Filter {
  public constructor() {
    const sp = CONFIG.COLLISION_SPECTACLE;

    const gpuProgram = GpuProgram.from({
      vertex: {
        source: COLLISION_SPECTACLE_WGSL,
        entryPoint: "mainVertex",
      },
      fragment: {
        source: COLLISION_SPECTACLE_WGSL,
        entryPoint: "mainFragment",
      },
    });

    const glProgram = GlProgram.from({
      vertex: COLLISION_SPECTACLE_FILTER_VERTEX_GLSL,
      fragment: COLLISION_SPECTACLE_FRAG_GLSL,
      name: "collision-spectacle-filter",
    });

    const spectacleUniforms = new UniformGroup({
      uOriginX: { value: 0.5, type: "f32" },
      uOriginY: { value: 0.5, type: "f32" },
      uShock: { value: 0, type: "f32" },
      uAberration: { value: 0, type: "f32" },
      uWavePhase: { value: 0, type: "f32" },
      uRingScale: { value: sp.RING_SCALE, type: "f32" },
      uDispGain: { value: sp.DISPLACEMENT_GAIN, type: "f32" },
      uAberrationPx: { value: sp.ABERRATION_MAX_UV, type: "f32" },
      uRadialFalloff: { value: sp.RADIAL_FALLOFF, type: "f32" },
      _pad0: { value: 0, type: "f32" },
      _pad1: { value: 0, type: "f32" },
      _pad2: { value: 0, type: "f32" },
    });

    super({
      gpuProgram,
      glProgram,
      resources: {
        spectacleUniforms,
      },
      padding: 64,
    });
  }

  private get u(): Record<string, number> {
    return this.resources.spectacleUniforms.uniforms as Record<string, number>;
  }

  /** No-op visual state (hot path). */
  public setIdle(): void {
    const uniforms = this.u;
    uniforms.uShock = 0;
    uniforms.uAberration = 0;
    uniforms.uWavePhase = 0;
  }

  /**
   * Apply one frame of spectacle (envelopes computed outside to keep ticker math in one place).
   */
  public setActiveFrame(
    originX: number,
    originY: number,
    shock: number,
    aberration: number,
    wavePhase: number,
  ): void {
    const uniforms = this.u;
    uniforms.uOriginX = originX;
    uniforms.uOriginY = originY;
    uniforms.uShock = shock;
    uniforms.uAberration = aberration;
    uniforms.uWavePhase = wavePhase;
  }
}

/**
 * Bridges gameplay hits → filter uniforms (preallocated; no per-hit allocations).
 */
export class CollisionSpectacleController {
  private readonly _filter: CollisionSpectacleFilter;
  /** `CONFIG.COLLISION_SPECTACLE.MAX_SIMULTANEOUS_IMPULSES` — this pass supports 1 slot (last hit wins). */
  private readonly _maxSimultaneousImpulses: number;
  /** Start time on SyncClock audio timeline; `-1` = inactive */
  private _impulseStartAudioTime = -1;
  private _originX = 0.5;
  private _originY = 0.5;
  /** Story 3.4: scales active shock + aberration envelopes. */
  private _spectacleIntensity = 1;

  public constructor(filter: CollisionSpectacleFilter) {
    this._filter = filter;
    this._maxSimultaneousImpulses =
      CONFIG.COLLISION_SPECTACLE.MAX_SIMULTANEOUS_IMPULSES;
  }

  public setSpectacleIntensityMultiplier(multiplier: number): void {
    this._spectacleIntensity = Math.max(0, multiplier);
  }

  /** Call from the same path as impulse / `ASTEROID_HIT` (once per confirmed hit). */
  public triggerImpulse(
    audioTime: number,
    hitX: number,
    hitY: number,
    screenW: number,
    screenH: number,
  ): void {
    if (this._maxSimultaneousImpulses <= 0) {
      return;
    }
    if (screenW <= 0 || screenH <= 0) {
      return;
    }
    this._impulseStartAudioTime = audioTime;
    this._originX = hitX / screenW;
    this._originY = hitY / screenH;
  }

  /** Call from ticker after `audioTime` is read from `SyncClock`. */
  public updateFrame(audioTime: number): void {
    if (this._impulseStartAudioTime < 0) {
      this._filter.setIdle();
      return;
    }
    const age = audioTime - this._impulseStartAudioTime;
    const sp = CONFIG.COLLISION_SPECTACLE;
    const m = this._spectacleIntensity;
    const sw = shockwaveEnvelope(age, sp.SHOCKWAVE_DURATION_SEC) * m;
    const ab = aberrationEnvelope(age, sp.ABERRATION_DURATION_SEC) * m;
    if (sw <= 0 && ab <= 0) {
      this._impulseStartAudioTime = -1;
      this._filter.setIdle();
      return;
    }
    const phase = spectacleWavePhase(age, sp.WAVE_PHASE_SPEED_RAD_PER_SEC);
    this._filter.setActiveFrame(this._originX, this._originY, sw, ab, phase);
  }

  public dispose(): void {
    this._impulseStartAudioTime = -1;
    this._filter.setIdle();
  }
}
