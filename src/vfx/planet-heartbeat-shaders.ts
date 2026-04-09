/**
 * GLSL / WGSL sources for the planet heartbeat filter (Pixi v8 dual backend).
 * Vertex matches Pixi's default filter quad (`defaultFilter.vert`).
 */

/** Standard Pixi filter vertex (GLSL 3.0 `in`/`out`). */
export const FILTER_VERTEX_GLSL = `
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition( void )
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;

    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`;

export const PLANET_HEARTBEAT_FRAG_GLSL = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uPulse;
uniform float uGlowGain;
uniform float uScaleGain;
uniform float uGlowR;
uniform float uGlowG;
uniform float uGlowB;

void main(void)
{
    vec2 uv = vTextureCoord - 0.5;
    float scale = 1.0 + uPulse * uScaleGain;
    vec2 uv2 = 0.5 + uv / scale;
    vec4 c = texture(uTexture, uv2);
    vec3 tint = vec3(uGlowR, uGlowG, uGlowB);
    float r = length(uv) * 2.0;
    float rim = clamp(1.0 - r, 0.0, 1.0);
    float glow = uPulse * uGlowGain * rim;
    /* Rim is in output space; gate by source alpha so empty AABB corners do not pick up glow. */
    vec3 add = tint * glow * c.a;
    finalColor = vec4(c.rgb * tint + add, c.a);
}
`;

/** WebGPU: global filter uniforms + heartbeat params (padded to 32 bytes). */
export const PLANET_HEARTBEAT_WGSL = `
struct GlobalFilterUniforms {
  uInputSize:vec4<f32>,
  uInputPixel:vec4<f32>,
  uInputClamp:vec4<f32>,
  uOutputFrame:vec4<f32>,
  uGlobalFrame:vec4<f32>,
  uOutputTexture:vec4<f32>,
};

struct HeartbeatUniforms {
  uPulse:f32,
  uGlowGain:f32,
  uScaleGain:f32,
  uGlowR:f32,
  uGlowG:f32,
  uGlowB:f32,
};

@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler : sampler;

@group(1) @binding(0) var<uniform> heartbeatUniforms : HeartbeatUniforms;

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
  @location(0) uv: vec2<f32>,
  @builtin(position) position: vec4<f32>
) -> @location(0) vec4<f32> {
    var uvCenter = uv - vec2<f32>(0.5, 0.5);
    var scale = 1.0 + heartbeatUniforms.uPulse * heartbeatUniforms.uScaleGain;
    var uv2 = vec2<f32>(0.5, 0.5) + uvCenter / scale;
    var c = textureSample(uTexture, uSampler, uv2);
    var tint = vec3<f32>(heartbeatUniforms.uGlowR, heartbeatUniforms.uGlowG, heartbeatUniforms.uGlowB);
    var r = length(uvCenter) * 2.0;
    var rim = clamp(1.0 - r, 0.0, 1.0);
    var glow = heartbeatUniforms.uPulse * heartbeatUniforms.uGlowGain * rim;
    var add = tint * glow * c.a;
    return vec4<f32>(c.rgb * tint + add, c.a);
}
`;
