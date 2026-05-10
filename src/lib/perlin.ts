/**
 * PerlinRenderer: WebGL2 classic gradient (Perlin) noise + fBM,
 * with domain warping, animation, and arbitrary multi-stop color
 * gradient mapping.
 */

import type { PerlinParams } from "@/types";

const VERT_SRC = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const MAX_STOPS = 8;
const MAX_OCTAVES = 8;

const FRAG_SRC = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  iResolution;
uniform float iTime;
uniform float uScale;
uniform int   uOctaves;
uniform float uPersistence;
uniform float uLacunarity;
uniform float uContrast;
uniform float uWarp;
uniform float uSeed;
uniform int   uStopCount;
uniform vec3  uStopColors[${MAX_STOPS}];
uniform float uStopPositions[${MAX_STOPS}];

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// Classic Perlin gradient noise
float perlin(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  float norm = 0.0;
  for (int i = 0; i < ${MAX_OCTAVES}; i++) {
    if (i >= uOctaves) break;
    v += a * perlin(p);
    norm += a;
    p *= uLacunarity;
    a *= uPersistence;
  }
  return v / max(norm, 1e-4);
}

vec3 sampleStops(float t) {
  t = clamp(t, 0.0, 1.0);
  if (uStopCount <= 0) return vec3(0.0);
  if (uStopCount == 1) return uStopColors[0];
  // Below first stop: use first stop's color (don't fall through to last)
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
  // Above last stop
  return uStopColors[uStopCount - 1];
}

void main() {
  vec2 r = iResolution.xy;
  vec2 uv = (gl_FragCoord.xy - r * 0.5) / r.y;
  vec2 p = uv * uScale + vec2(uSeed * 137.0, uSeed * 91.0);

  // domain warp
  vec2 q = vec2(fbm(p + vec2(0.0, iTime * 0.1)), fbm(p + vec2(5.2, 1.3)));
  vec2 w = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + iTime * 0.05),
                fbm(p + 4.0 * q + vec2(8.3, 2.8)));
  float n = fbm(p + uWarp * w);

  // remap to 0..1
  float t = n * 0.5 + 0.5;
  // contrast
  t = clamp((t - 0.5) * uContrast + 0.5, 0.0, 1.0);

  vec3 col = sampleStops(t);
  // tiny dither
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
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
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export { PALETTES as PERLIN_PRESETS } from "./palettes";

export class PerlinRenderer {
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
      uScale: u("uScale"),
      uOctaves: u("uOctaves"),
      uPersistence: u("uPersistence"),
      uLacunarity: u("uLacunarity"),
      uContrast: u("uContrast"),
      uWarp: u("uWarp"),
      uSeed: u("uSeed"),
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

  render(params: PerlinParams, time: number) {
    const gl = this.gl;
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
    gl.uniform1f(this.uLoc.iTime, time * (params.animate ? params.speed : 0));
    gl.uniform1f(this.uLoc.uScale, params.scale);
    gl.uniform1i(this.uLoc.uOctaves, Math.round(params.octaves));
    gl.uniform1f(this.uLoc.uPersistence, params.persistence);
    gl.uniform1f(this.uLoc.uLacunarity, params.lacunarity);
    gl.uniform1f(this.uLoc.uContrast, params.contrast);
    gl.uniform1f(this.uLoc.uWarp, params.warp);
    gl.uniform1f(this.uLoc.uSeed, params.seed);
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
