/**
 * GLSL / WGSL for collision spectacle filter (displacement ripple + chromatic aberration).
 * Vertex matches Pixi filter quad; dual backend like `planet-heartbeat-shaders.ts`.
 */

import { FILTER_VERTEX_GLSL } from "./planet-heartbeat-shaders.js";

export { FILTER_VERTEX_GLSL as COLLISION_SPECTACLE_FILTER_VERTEX_GLSL };

export const COLLISION_SPECTACLE_FRAG_GLSL = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;

uniform float uOriginX;
uniform float uOriginY;
uniform float uShock;
uniform float uAberration;
uniform float uWavePhase;
uniform float uRingScale;
uniform float uDispGain;
uniform float uAberrationPx;
uniform float uRadialFalloff;

void main(void)
{
    float idleEps = 1e-8;
    if (uShock * uShock + uAberration * uAberration < idleEps) {
        finalColor = texture(uTexture, vTextureCoord);
        return;
    }

    vec2 o = vec2(uOriginX, uOriginY);
    vec2 delta = vTextureCoord - o;
    float r = length(delta);
    vec2 dir = r > 1e-4 ? delta / r : vec2(1.0, 0.0);

    float ripple = sin(r * uRingScale - uWavePhase);
    float att = exp(-r * uRadialFalloff);
    float dispAmt = uShock * uDispGain * ripple * att;
    vec2 uvDisp = vTextureCoord + dir * dispAmt;

    vec2 abVec = dir * (uAberration * uAberrationPx);
    vec4 cr = texture(uTexture, uvDisp + abVec);
    vec4 cg = texture(uTexture, uvDisp);
    vec4 cb = texture(uTexture, uvDisp - abVec);

    finalColor = vec4(cr.r, cg.g, cb.b, cg.a);
}
`;

export const COLLISION_SPECTACLE_WGSL = `
struct GlobalFilterUniforms {
  uInputSize:vec4<f32>,
  uInputPixel:vec4<f32>,
  uInputClamp:vec4<f32>,
  uOutputFrame:vec4<f32>,
  uGlobalFrame:vec4<f32>,
  uOutputTexture:vec4<f32>,
};

struct SpectacleUniforms {
  uOriginX:f32,
  uOriginY:f32,
  uShock:f32,
  uAberration:f32,
  uWavePhase:f32,
  uRingScale:f32,
  uDispGain:f32,
  uAberrationPx:f32,
  uRadialFalloff:f32,
  _pad0:f32,
  _pad1:f32,
  _pad2:f32,
};

@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler : sampler;

@group(1) @binding(0) var<uniform> spectacleUniforms : SpectacleUniforms;

struct VSOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv : vec2<f32>
};

fn filterVertexPosition(aPosition:vec2<f32>) -> vec4<f32>
{
    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;

    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

fn filterTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>
{
    return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);
}

@vertex
fn mainVertex(
  @location(0) aPosition : vec2<f32>,
) -> VSOutput {
  return VSOutput(
   filterVertexPosition(aPosition),
   filterTextureCoord(aPosition)
  );
}

@fragment
fn mainFragment(
  @location(0) vTextureCoord: vec2<f32>,
) -> @location(0) vec4<f32> {
    let idleEps = 1e-8;
    let s = spectacleUniforms.uShock;
    let a = spectacleUniforms.uAberration;
    if (s * s + a * a < idleEps) {
      return textureSample(uTexture, uSampler, vTextureCoord);
    }

    var o = vec2<f32>(spectacleUniforms.uOriginX, spectacleUniforms.uOriginY);
    var delta = vTextureCoord - o;
    var r = length(delta);
    var dir = select(vec2<f32>(1.0, 0.0), delta / r, r > 1e-4);

    var ripple = sin(r * spectacleUniforms.uRingScale - spectacleUniforms.uWavePhase);
    var att = exp(-r * spectacleUniforms.uRadialFalloff);
    var dispAmt = spectacleUniforms.uShock * spectacleUniforms.uDispGain * ripple * att;
    var uvDisp = vTextureCoord + dir * dispAmt;

    var abVec = dir * (spectacleUniforms.uAberration * spectacleUniforms.uAberrationPx);
    var cr = textureSample(uTexture, uSampler, uvDisp + abVec);
    var cg = textureSample(uTexture, uSampler, uvDisp);
    var cb = textureSample(uTexture, uSampler, uvDisp - abVec);

    return vec4<f32>(cr.r, cg.g, cb.b, cg.a);
}
`;
