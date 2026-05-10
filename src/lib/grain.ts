/**
 * GrainRenderer: WebGL2 film-grain noise on a customizable
 * multi-stop gradient field. Mirrors the fire-cloud / perlin
 * stop model so a single shared palette library drives all three
 * renderers.
 *
 * Loop mode: when render() is called with a non-zero loopPeriod, the
 * shader replaces every linear-in-time translation with a circular
 * path of period == loopPeriod. The result is that frame 0 and frame
 * N (where N*dt == loopPeriod) sample identical noise positions, so a
 * seamless loop falls out of the math: no crossfade required.
 */

import type { GrainParams } from "@/types";

const VERT_SRC = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const MAX_STOPS = 8;

const FRAG_SRC = `#version 300 es
precision highp float;
out vec4 fragColor;

#define PI 3.14159265359
#define TAU 6.28318530718

uniform vec2  iResolution;
uniform float iTime;
uniform float uTintAmount;
uniform float uIntensity;
uniform float uGrainSize;
uniform float uDensity;
uniform float uContrast;
uniform float uVignette;
uniform float uMono;
uniform float uSeed;
uniform int   uWaveType;
uniform float uWaveSpeed;
uniform float uWaveScale;
uniform float uWaveAmount;
uniform int   uStopCount;
uniform vec3  uStopColors[${MAX_STOPS}];
uniform float uStopPositions[${MAX_STOPS}];

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec3 hash3(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yzz) * p3.zyx);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y);
}
float fbm(vec2 p) {
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * vnoise(p);
    p = rot * p * 2.0 + 0.5;
    a *= 0.5;
  }
  return v;
}

vec2 centered(vec2 uv) {
  vec2 p = uv - 0.5;
  p.x *= iResolution.x / max(iResolution.y, 1.0);
  return p;
}

vec3 sampleStops(float t) {
  t = clamp(t, 0.0, 1.0);
  if (uStopCount <= 0) return vec3(0.0);
  if (uStopCount == 1) return uStopColors[0];
  if (t <= uStopPositions[0]) return uStopColors[0];
  for (int i = 1; i < ${MAX_STOPS}; i++) {
    if (i >= uStopCount) break;
    float p0 = uStopPositions[i - 1];
    float p1 = uStopPositions[i];
    if (t <= p1) {
      float k = (p1 - p0) > 1e-5 ? (t - p0) / (p1 - p0) : 0.0;
      return mix(uStopColors[i - 1], uStopColors[i], smoothstep(0.0, 1.0, k));
    }
  }
  return uStopColors[uStopCount - 1];
}

float waveValue(vec2 uv, float t) {
  float s   = max(uWaveScale, 0.0001);
  float amt = clamp(uWaveAmount, 0.0, 1.0);
  float warp = amt * 2.2 + 0.25;
  vec2  cp  = centered(uv);
  float baseG = smoothstep(0.0, 1.0, 0.55 * uv.x + 0.45 * (1.0 - uv.y));

  // ---------- static curves ----------
  if (uWaveType == 0) {
    return fract(uv.x * s * 0.5 + t * 0.15);
  } else if (uWaveType == 1) {
    float w = 0.5 + 0.5 * sin(uv.x * s * TAU + uv.y * s * 1.3 + t * 1.2);
    return mix(baseG, w, amt);
  } else if (uWaveType == 2) {
    return fract(length(cp) * s * 1.6 + t * 0.25);
  } else if (uWaveType == 3) {
    float a = atan(cp.y, cp.x) / TAU;
    return fract(a * 2.0 + length(cp) * s * 1.2 + t * 0.3);
  } else if (uWaveType == 4) {
    return 0.5 + 0.5 * sin(length(cp) * s * TAU - t * 1.6);
  } else if (uWaveType == 5) {
    return fract(baseG + t * 0.08);
  }

  // ---------- dynamic, fbm-based ----------
  vec2 p = cp * 2.6 * s;

  if (uWaveType == 6) {
    // blob: low-freq drifting lobes
    vec2 q  = cp * 1.1 * s;
    vec2 d1 = vec2( 0.10,  0.07) * t;
    vec2 d2 = vec2(-0.08,  0.11) * t;
    vec2 d3 = vec2(-0.06, -0.04) * t;
    float a = vnoise(q + d1);
    float b = vnoise(q * 1.35 + vec2(3.7, 1.1) + d2);
    float c = vnoise(q * 0.7  + vec2(7.2, 4.3) + d3);
    float v = (a + b * 0.85 + c * 0.7) / 2.55;
    v = mix(v, vnoise(q + vec2(b, c) * warp), amt * 0.5);
    return smoothstep(0.18, 0.82, v);
  } else if (uWaveType == 7) {
    // aurora: horizontal drifting bands
    vec2 q = vec2(p.x * 0.6, p.y * 1.6);
    float band = sin(q.y * 1.1 + fbm(q * 0.5 + vec2(t * 0.4, 0.0)) * (1.5 + amt * 1.5) + t * 0.35);
    float falloff = smoothstep(1.0, 0.0, abs(uv.y - 0.5) * 1.6);
    return clamp(0.5 + 0.5 * band * mix(0.6, 1.0, falloff), 0.0, 1.0);
  } else if (uWaveType == 8) {
    // flow: domain-warped fbm drifting
    vec2 q = vec2(
      fbm(p + vec2(t * 0.18, 0.0)),
      fbm(p + vec2(5.2, 1.3) + vec2(-t * 0.14, 0.0)));
    return fbm(p + warp * q + vec2(t * 0.30, 0.0));
  } else if (uWaveType == 9) {
    // ocean: directional swells + chop
    vec2 disp = vec2(
      fbm(p * 0.9 + vec2(t * 0.30, 0.0)),
      fbm(p * 0.7 + vec2(2.1, 4.7) + vec2(-t * 0.20, 0.0)));
    float swell = sin(p.x * 0.9 + p.y * 0.25 + t * 1.10 + disp.x * 2.4);
    float chop  = sin(p.x * 2.6 + p.y * 0.7  + t * 1.95 + disp.y * 1.8);
    float w     = mix(swell, swell * 0.5 + chop * 0.5, 0.55);
    return 0.5 + 0.5 * w;
  } else if (uWaveType == 10) {
    // flame: upward convection
    vec2 q = p + vec2(0.0, -t * 1.10);
    vec2 w = vec2(
      fbm(q + vec2(t * 0.45, 0.0)),
      fbm(q + vec2(3.7, 1.1) + vec2(-t * 0.40, 0.0)));
    float f = fbm(q + warp * 1.2 * w);
    float bias = mix(1.10, 0.60, smoothstep(0.0, 1.0, uv.y));
    return clamp(f * bias, 0.0, 1.0);
  } else if (uWaveType == 11) {
    // smoke: slow upward billow
    vec2 driftV = vec2(0.18 * sin(t * 0.25), -t * 0.50);
    vec2 q = p * 0.85 + driftV;
    vec2 w = vec2(
      fbm(q + vec2(t * 0.20, 0.0)),
      fbm(q + vec2(1.9, 4.3) + vec2(-t * 0.18, 0.0)));
    return smoothstep(0.18, 0.92, fbm(q + warp * 1.0 * w));
  } else if (uWaveType == 12) {
    // plasma: multi-stage chaotic warp
    vec2 q = vec2(
      fbm(p + vec2(t * 0.27, 0.0)),
      fbm(p + vec2(7.4, 3.1) + vec2(-t * 0.21, 0.0)));
    vec2 w = vec2(
      fbm(p + 2.0 * q + vec2(t * 0.30, 0.0)),
      fbm(p + 2.0 * q + vec2(5.0, 1.0) + vec2(-t * 0.27, 0.0)));
    return fbm(p + warp * 1.6 * w);
  } else {
    // swirl: vortex rotation around center
    float r = length(cp);
    float ang = atan(cp.y, cp.x) + t * 0.50 + r * 2.0;
    vec2 q = vec2(cos(ang), sin(ang)) * r * 2.6 * s;
    vec2 w = vec2(
      fbm(q + vec2(t * 0.18, 0.0)),
      fbm(q + vec2(2.2, 1.7) + vec2(-t * 0.22, 0.0)));
    return fbm(q + warp * 1.4 * w);
  }
}

void main() {
  vec2 r = iResolution.xy;
  vec2 uv = gl_FragCoord.xy / r;

  float t = iTime * uWaveSpeed + uSeed * 7.0;
  float g = clamp(waveValue(uv, t), 0.0, 1.0);

  // tiny low-freq variation for organic feel
  float bx = fract(sin(dot(uv * 3.0 + uSeed, vec2(12.9898, 78.233))) * 43758.5);
  g = clamp(g + (bx - 0.5) * 0.05, 0.0, 1.0);

  // multi-stop palette sampling, blended by tintAmount against the
  // first stop (so tintAmount=0 reads as a flat dark base).
  vec3 ramp = sampleStops(g);
  vec3 dark = uStopCount > 0 ? uStopColors[0] : vec3(0.0);
  vec3 col = mix(dark, ramp, clamp(uTintAmount, 0.0, 1.0));

  float gs = max(1.0, uGrainSize);
  vec2 gp = floor(gl_FragCoord.xy / gs) + uSeed * 31.0 + vec2(iTime * 60.0, 0.0);
  float n;
  vec3 nc;
  if (uMono > 0.5) {
    n = hash(gp) - 0.5;
    nc = vec3(n);
  } else {
    nc = hash3(gp) - 0.5;
    n = (nc.r + nc.g + nc.b) / 3.0;
  }

  float gate = step(1.0 - clamp(uDensity, 0.0, 1.0), hash(gp + 7.31));
  vec3 grain = nc * uIntensity * gate;
  col += grain;

  col = (col - 0.5) * uContrast + 0.5;

  vec2 c = uv - 0.5;
  float vig = 1.0 - dot(c * 1.4, c * 1.4);
  col *= mix(1.0, clamp(vig, 0.0, 1.0), uVignette);

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error("Shader compile failed: " + log);
  }
  return sh;
}
function link(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader) {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error("Program link failed: " + log);
  }
  return prog;
}
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export { PALETTES as GRAIN_PRESETS } from "./palettes";

const WAVE_INDEX: Record<GrainParams["waveType"], number> = {
  linear: 0,
  sine: 1,
  radial: 2,
  spiral: 3,
  ripple: 4,
  diagonal: 5,
  blob: 6,
  aurora: 7,
  flow: 8,
  ocean: 9,
  flame: 10,
  smoke: 11,
  plasma: 12,
  swirl: 13,
};

export class GrainRenderer {
  private gl: WebGL2RenderingContext;
  private prog: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private vbo: WebGLBuffer;
  private uLoc: Record<string, WebGLUniformLocation | null>;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      antialias: false,
    });
    if (!gl) throw new Error("WebGL2 unavailable");
    this.gl = gl;

    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    this.vbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    this.prog = link(gl, vs, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    const u = (n: string) => gl.getUniformLocation(this.prog, n);
    this.uLoc = {
      iResolution: u("iResolution"),
      iTime: u("iTime"),
      uTintAmount: u("uTintAmount"),
      uIntensity: u("uIntensity"),
      uGrainSize: u("uGrainSize"),
      uDensity: u("uDensity"),
      uContrast: u("uContrast"),
      uVignette: u("uVignette"),
      uMono: u("uMono"),
      uSeed: u("uSeed"),
      uWaveType: u("uWaveType"),
      uWaveSpeed: u("uWaveSpeed"),
      uWaveScale: u("uWaveScale"),
      uWaveAmount: u("uWaveAmount"),
      uStopCount: u("uStopCount"),
      uStopColors: u("uStopColors"),
      uStopPositions: u("uStopPositions"),
    };
  }

  setSize(w: number, h: number) {
    const c = this.gl.canvas as HTMLCanvasElement;
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
      this.gl.viewport(0, 0, w, h);
    }
  }

  render(params: GrainParams, time: number) {
    const gl = this.gl;
    gl.useProgram(this.prog);
    gl.bindVertexArray(this.vao);
    const c = gl.canvas as HTMLCanvasElement;

    const stops = [...params.stops]
      .sort((a, b) => a.pos - b.pos)
      .slice(0, MAX_STOPS);
    const count = stops.length;
    const colors = new Float32Array(MAX_STOPS * 3);
    const positions = new Float32Array(MAX_STOPS);
    for (let i = 0; i < MAX_STOPS; i++) {
      if (i < count) {
        const [r, g, b] = hexToRgb(stops[i].color);
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
        positions[i] = stops[i].pos;
      } else {
        const last = Math.max(0, count - 1);
        const [r, g, b] = stops[last]
          ? hexToRgb(stops[last].color)
          : [0, 0, 0];
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
        positions[i] = 1.0;
      }
    }

    gl.uniform2f(this.uLoc.iResolution, c.width, c.height);
    gl.uniform1f(this.uLoc.iTime, params.animate ? time : 0);
    gl.uniform1f(this.uLoc.uTintAmount, params.tintAmount);
    gl.uniform1f(this.uLoc.uIntensity, params.intensity);
    gl.uniform1f(this.uLoc.uGrainSize, params.size);
    gl.uniform1f(this.uLoc.uDensity, params.density);
    gl.uniform1f(this.uLoc.uContrast, params.contrast);
    gl.uniform1f(this.uLoc.uVignette, params.vignette);
    gl.uniform1f(this.uLoc.uMono, params.monochrome ? 1.0 : 0.0);
    gl.uniform1f(this.uLoc.uSeed, params.seed);
    gl.uniform1i(this.uLoc.uWaveType, WAVE_INDEX[params.waveType] ?? 6);
    gl.uniform1f(this.uLoc.uWaveSpeed, params.waveSpeed);
    gl.uniform1f(this.uLoc.uWaveScale, params.waveScale);
    gl.uniform1f(this.uLoc.uWaveAmount, params.waveAmount);
    gl.uniform1i(this.uLoc.uStopCount, count);
    gl.uniform3fv(this.uLoc.uStopColors, colors);
    gl.uniform1fv(this.uLoc.uStopPositions, positions);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    const gl = this.gl;
    try { gl.deleteBuffer(this.vbo); } catch { /* lost */ }
    try { gl.deleteVertexArray(this.vao); } catch { /* lost */ }
    try { gl.deleteProgram(this.prog); } catch { /* lost */ }
  }
}
