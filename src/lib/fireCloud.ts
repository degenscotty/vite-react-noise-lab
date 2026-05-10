/**
 * FireCloudRenderer: WebGL2 fragment shader producing animated
 * fbm domain-warped fire/cloud noise. Adapted from the reference
 * implementation; expanded with multiple palettes and user-tunable
 * uniforms (speed, scale, intensity, detail, hotspot, vignette, seed).
 */

import type { ColorStop, FireParams } from "@/types";

const VERT_SRC = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const MAX_STOPS = 8;

const FRAG_SRC = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uScale;
uniform float uIntensity;
uniform float uDetail;
uniform float uHotSpot;
uniform float uVignette;
uniform float uSeed;
uniform int   uStopCount;
uniform vec3  uStopColors[${MAX_STOPS}];
uniform float uStopPositions[${MAX_STOPS}];

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
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
  for (int i = 0; i < 7; i++) {
    v += a * noise(p);
    p = rot * p * 2.0 + 0.5;
    a *= 0.5;
  }
  return v;
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

void main() {
  vec2  r  = iResolution.xy;
  float t  = iTime * uSpeed * 0.18 + uSeed * 137.0;
  vec2  uv = (gl_FragCoord.xy - r * 0.5) / r.y;
  vec2  p  = uv * 2.8 * uScale;

  vec2 q = vec2(
    fbm(p + vec2(t * 0.15, 0.0)),
    fbm(p + vec2(5.2, 1.3) + vec2(-t * 0.12, 0.0)));
  vec2 w = vec2(
    fbm(p + 3.2 * q + vec2(1.7, 9.2) + vec2(t * 0.18, 0.0)),
    fbm(p + 3.2 * q + vec2(8.3, 2.8) + vec2(-t * 0.14, 0.0)));
  float f = fbm(p + 3.5 * w);

  float detail = fbm(p * 3.5 + vec2(-t * 0.10, 0.0) + w * 1.5);
  f = mix(f, f * 0.72 + detail * 0.28, uDetail);

  float hot = fbm(p * 1.8 + vec2(t * 0.22, -t * 0.18) + 2.0 * q);
  hot = smoothstep(0.48, 0.78, hot);

  f = smoothstep(0.08, 0.92, f);
  f = mix(f, f * 0.75 + hot * 0.25, uHotSpot);

  // intensity reshapes the histogram (gamma-like) to brighten/darken
  float intensity = clamp(uIntensity, 0.05, 4.0);
  f = pow(clamp(f, 0.0, 1.0), 1.0 / intensity);

  vec3 col = sampleStops(f);

  // vignette
  float vig = clamp(1.0 - dot(uv * 1.15, uv * 1.15), 0.0, 1.0);
  col *= mix(1.0, vig * vig * vig, uVignette);

  col += (hash(gl_FragCoord.xy + fract(iTime)) - 0.5) / 255.0;

  fragColor = vec4(col, 1.0);
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
  const v = h.length === 3
    ? h.split("").map((c) => c + c).join("")
    : h;
  const n = parseInt(v, 16);
  return [
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255,
  ];
}

export { PALETTES as FIRE_PRESETS } from "./palettes";

export function getFireStops(p: FireParams): ColorStop[] {
  return p.stops;
}

export class FireCloudRenderer {
  private gl: WebGL2RenderingContext;
  private prog: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private vbo: WebGLBuffer;
  private uLoc: {
    iResolution: WebGLUniformLocation | null;
    iTime: WebGLUniformLocation | null;
    uSpeed: WebGLUniformLocation | null;
    uScale: WebGLUniformLocation | null;
    uIntensity: WebGLUniformLocation | null;
    uDetail: WebGLUniformLocation | null;
    uHotSpot: WebGLUniformLocation | null;
    uVignette: WebGLUniformLocation | null;
    uSeed: WebGLUniformLocation | null;
    uStopCount: WebGLUniformLocation | null;
    uStopColors: WebGLUniformLocation | null;
    uStopPositions: WebGLUniformLocation | null;
  };

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

    this.uLoc = {
      iResolution: gl.getUniformLocation(this.prog, "iResolution"),
      iTime: gl.getUniformLocation(this.prog, "iTime"),
      uSpeed: gl.getUniformLocation(this.prog, "uSpeed"),
      uScale: gl.getUniformLocation(this.prog, "uScale"),
      uIntensity: gl.getUniformLocation(this.prog, "uIntensity"),
      uDetail: gl.getUniformLocation(this.prog, "uDetail"),
      uHotSpot: gl.getUniformLocation(this.prog, "uHotSpot"),
      uVignette: gl.getUniformLocation(this.prog, "uVignette"),
      uSeed: gl.getUniformLocation(this.prog, "uSeed"),
      uStopCount: gl.getUniformLocation(this.prog, "uStopCount"),
      uStopColors: gl.getUniformLocation(this.prog, "uStopColors"),
      uStopPositions: gl.getUniformLocation(this.prog, "uStopPositions"),
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

  render(params: FireParams, time: number) {
    const gl = this.gl;
    const stops = getFireStops(params).slice(0, MAX_STOPS).sort((a, b) => a.pos - b.pos);
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
        const [r, g, b] = stops[last] ? hexToRgb(stops[last].color) : [0, 0, 0];
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
        positions[i] = 1.0;
      }
    }

    gl.useProgram(this.prog);
    gl.bindVertexArray(this.vao);
    const c = gl.canvas as HTMLCanvasElement;
    gl.uniform2f(this.uLoc.iResolution, c.width, c.height);
    gl.uniform1f(this.uLoc.iTime, time);
    gl.uniform1f(this.uLoc.uSpeed, params.speed);
    gl.uniform1f(this.uLoc.uScale, params.scale);
    gl.uniform1f(this.uLoc.uIntensity, params.intensity);
    gl.uniform1f(this.uLoc.uDetail, params.detail);
    gl.uniform1f(this.uLoc.uHotSpot, params.hotSpot);
    gl.uniform1f(this.uLoc.uVignette, params.vignette);
    gl.uniform1f(this.uLoc.uSeed, params.seed);
    gl.uniform1i(this.uLoc.uStopCount, count);
    gl.uniform3fv(this.uLoc.uStopColors, colors);
    gl.uniform1fv(this.uLoc.uStopPositions, positions);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    const gl = this.gl;
    try { gl.deleteBuffer(this.vbo); } catch { /* context lost */ }
    try { gl.deleteVertexArray(this.vao); } catch { /* context lost */ }
    try { gl.deleteProgram(this.prog); } catch { /* context lost */ }
  }
}
