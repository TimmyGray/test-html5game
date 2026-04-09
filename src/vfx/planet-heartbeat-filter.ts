import { Filter, GlProgram, GpuProgram, UniformGroup } from "pixi.js";
import { CONFIG } from "../config/config.js";
import {
  FILTER_VERTEX_GLSL,
  PLANET_HEARTBEAT_FRAG_GLSL,
  PLANET_HEARTBEAT_WGSL,
} from "./planet-heartbeat-shaders.js";

/**
 * Single-pass filter: beat-driven glow + mild radial UV scale (Uber-Shader heartbeat slice).
 * Uniforms updated each frame — only `uPulse` should change in hot paths.
 */
export class PlanetHeartbeatFilter extends Filter {
  public constructor() {
    const hb = CONFIG.PLANET_HEARTBEAT;

    const gpuProgram = GpuProgram.from({
      vertex: {
        source: PLANET_HEARTBEAT_WGSL,
        entryPoint: "mainVertex",
      },
      fragment: {
        source: PLANET_HEARTBEAT_WGSL,
        entryPoint: "mainFragment",
      },
    });

    const glProgram = GlProgram.from({
      vertex: FILTER_VERTEX_GLSL,
      fragment: PLANET_HEARTBEAT_FRAG_GLSL,
      name: "planet-heartbeat-filter",
    });

    const heartbeatUniforms = new UniformGroup({
      uPulse: { value: 0, type: "f32" },
      uGlowGain: { value: hb.GLOW_GAIN, type: "f32" },
      uScaleGain: { value: hb.SCALE_GAIN, type: "f32" },
      uGlowR: { value: hb.GLOW_COLOR.r, type: "f32" },
      uGlowG: { value: hb.GLOW_COLOR.g, type: "f32" },
      uGlowB: { value: hb.GLOW_COLOR.b, type: "f32" },
    });

    super({
      gpuProgram,
      glProgram,
      resources: {
        heartbeatUniforms,
      },
      padding: 8,
    });
  }

  /** Envelope 0..1 from beat-phase math */
  public setPulse(envelope: number): void {
    this.resources.heartbeatUniforms.uniforms.uPulse = envelope;
  }

  /** Multiplies shader glow + radial scale gains (Story 3.4 intensity stages). */
  public setOscillationIntensity(multiplier: number): void {
    const hb = CONFIG.PLANET_HEARTBEAT;
    const u = this.resources.heartbeatUniforms.uniforms;
    u.uGlowGain = hb.GLOW_GAIN * multiplier;
    u.uScaleGain = hb.SCALE_GAIN * multiplier;
  }

  /** Atmospheric health tint (RGB 0–1); drives surface multiply + rim glow color (Story 3.1). */
  public setGlowTintRgb(r: number, g: number, b: number): void {
    const u = this.resources.heartbeatUniforms.uniforms;
    u.uGlowR = r;
    u.uGlowG = g;
    u.uGlowB = b;
  }
}
