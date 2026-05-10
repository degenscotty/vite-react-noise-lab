/** High-resolution export. Creates a fresh offscreen WebGL canvas
 *  at the requested size, runs a single render, then exports a blob. */

import type {
  FireParams,
  PerlinParams,
  GrainParams,
  NoiseKind,
} from "@/types";
import { FireCloudRenderer } from "./fireCloud";
import { PerlinRenderer } from "./perlin";
import { GrainRenderer } from "./grain";

export type ExportFormat = "png" | "jpeg";

export async function exportNoise(
  kind: NoiseKind,
  params: FireParams | PerlinParams | GrainParams,
  width: number,
  height: number,
  format: ExportFormat = "png",
  time = 0,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  let dispose: () => void;

  if (kind === "fire") {
    const r = new FireCloudRenderer(canvas);
    r.setSize(width, height);
    r.render(params as FireParams, time);
    dispose = () => r.dispose();
  } else if (kind === "perlin") {
    const r = new PerlinRenderer(canvas);
    r.setSize(width, height);
    r.render(params as PerlinParams, time);
    dispose = () => r.dispose();
  } else {
    const r = new GrainRenderer(canvas);
    r.setSize(width, height);
    r.render(params as GrainParams, time);
    dispose = () => r.dispose();
  }

  const mime = format === "jpeg" ? "image/jpeg" : "image/png";
  const quality = format === "jpeg" ? 0.95 : undefined;

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      mime,
      quality,
    );
  });

  dispose();
  return blob;
}

/* ============================================================
   Seamless-loop video export (all three noise kinds)
   ------------------------------------------------------------
   Renders N frames at the requested size+fps using the kind's
   WebGL renderer with loopPeriod = durationSec. Every shader's
   time-dependent term is wrapped in drift() / circular paths, so
   frame 0 and frame N sample identical noise positions and the
   recorded video loops seamlessly.

   Output: WebM via MediaRecorder. VP9 preferred, AV1 if available,
   VP8 / default as fallback.
   ============================================================ */

export type LoopExportOptions = {
  width: number;
  height: number;
  durationSec: number;
  fps: number;
  bitrate?: number;
  onProgress?: (frame: number, total: number) => void;
};

function pickWebmMime(): string {
  // AV1 > VP9 > VP8. AV1 has better quality per bit but slower
  // encode; if supported in software it's worth the wait at high res.
  const candidates = [
    "video/webm;codecs=av01",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const c of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported &&
      MediaRecorder.isTypeSupported(c)
    ) {
      return c;
    }
  }
  return "video/webm";
}

/** Heuristic bitrate: bits per pixel-per-second × resolution × fps,
 *  clamped to a sensible range. Scales smoothly with resolution and
 *  fps so a 4K 60fps export gets several times the budget of 1080p
 *  30fps. The `bpp` knob controls quality: see `qualityToBpp()`. */
export function adaptiveBitrate(
  width: number,
  height: number,
  fps: number,
  bpp = 0.18,
): number {
  const pps = width * height * fps;
  return Math.max(8_000_000, Math.min(160_000_000, Math.round(pps * bpp)));
}

export type VideoQuality = "standard" | "high" | "max";

/** Bits-per-pixel-per-second for each named quality tier. */
export function qualityToBpp(q: VideoQuality): number {
  switch (q) {
    case "standard":
      return 0.12;
    case "high":
      return 0.18;
    case "max":
      return 0.32;
  }
}

/** Format a bitrate in bps as a human-readable Mbps string. */
export function formatBitrate(bps: number): string {
  return `${(bps / 1_000_000).toFixed(1)} Mbps`;
}

export async function exportVideo(
  kind: NoiseKind,
  params: FireParams | PerlinParams | GrainParams,
  opts: LoopExportOptions,
): Promise<Blob> {
  const { width, height, durationSec, fps, bitrate, onProgress } = opts;

  if (typeof MediaRecorder === "undefined") {
    throw new Error("MediaRecorder is not available in this browser");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  // Build a uniform renderFrame() for the chosen kind. Records the
  // animation as it would play in the live preview: linear time, no
  // loop substitution. The video doesn't loop seamlessly, but motion
  // matches the live preview exactly.
  let renderFrame: (t: number) => void;
  let dispose: () => void;
  if (kind === "fire") {
    const r = new FireCloudRenderer(canvas);
    r.setSize(width, height);
    renderFrame = (t) => r.render(params as FireParams, t);
    dispose = () => r.dispose();
  } else if (kind === "perlin") {
    const r = new PerlinRenderer(canvas);
    r.setSize(width, height);
    const p = { ...(params as PerlinParams), animate: true } as PerlinParams;
    renderFrame = (t) => r.render(p, t);
    dispose = () => r.dispose();
  } else {
    const r = new GrainRenderer(canvas);
    r.setSize(width, height);
    const p = { ...(params as GrainParams), animate: true } as GrainParams;
    renderFrame = (t) => r.render(p, t);
    dispose = () => r.dispose();
  }

  const totalFrames = Math.max(2, Math.round(durationSec * fps));
  // captureStream(fps) tells the browser to auto-sample the canvas at
  // the declared rate. The encoded video's duration tracks wall-clock
  // time between recorder.start() and recorder.stop(), independent of
  // how fast our render loop runs. This is far more reliable than the
  // captureStream(0) + requestFrame() + setTimeout() pacing approach,
  // which produced shorter-than-requested videos when setTimeout drift
  // accumulated.
  const stream = (canvas as HTMLCanvasElement).captureStream(fps);

  const mimeType = pickWebmMime();
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: bitrate ?? adaptiveBitrate(width, height, fps),
  });
  const chunks: Blob[] = [];
  // Track both the final `dataavailable` event AND the `stop` event so
  // we don't return the blob before MediaRecorder has flushed the last
  // chunk. Some browsers fire `stop` *before* the final `dataavailable`,
  // so resolving on `stop` alone produced truncated/early downloads.
  let lastDataAt = 0;
  recorder.ondataavailable = (e: BlobEvent) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
    lastDataAt = performance.now();
  };
  recorder.start(200);
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  // Render one frame "ahead" so the first auto-sample has fresh content
  renderFrame(0);

  // Wall-clock-paced render loop: target the elapsed time of frame i,
  // sleep until that moment, then render. Guarantees total wall-clock
  // duration of the recording == durationSec, so the encoded video's
  // duration matches exactly.
  const startMs = performance.now();
  const targetEndMs = startMs + durationSec * 1000;
  for (let i = 1; i < totalFrames; i++) {
    const targetMs = startMs + (i / totalFrames) * durationSec * 1000;
    const now = performance.now();
    const sleepMs = targetMs - now;
    if (sleepMs > 0) {
      await new Promise<void>((r) => setTimeout(r, sleepMs));
    }
    const t = (i / totalFrames) * durationSec;
    renderFrame(t);
    onProgress?.(i + 1, totalFrames);
  }
  // Ensure recording spans the full requested duration even if the
  // render loop finished slightly early.
  const remainMs = targetEndMs - performance.now();
  if (remainMs > 0) {
    await new Promise<void>((r) => setTimeout(r, remainMs));
  }
  // Trailing pad of one frame interval so the last sample is captured
  await new Promise<void>((r) => setTimeout(r, 1000 / fps));
  recorder.stop();
  await stopped;
  // Drain wait: give MediaRecorder up to 500ms past the last
  // `dataavailable` to ensure all chunks have arrived. Loops until
  // a quarter-second of silence has elapsed after the most recent
  // chunk, then returns. Prevents truncated blobs in browsers that
  // fire `stop` before the final `dataavailable`.
  const drainStart = performance.now();
  while (performance.now() - lastDataAt < 250) {
    await new Promise<void>((r) => setTimeout(r, 50));
    if (performance.now() - drainStart > 1000) break; // safety cap
  }

  dispose();
  return new Blob(chunks, { type: mimeType });
}

/** Back-compat alias: grain-only entry point kept so existing callers
 *  continue to work. New code should call exportVideo(kind, ...). */
export function exportGrainLoop(
  params: GrainParams,
  opts: LoopExportOptions,
): Promise<Blob> {
  return exportVideo("grain", params, opts);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function timestamp(): string {
  const d = new Date();
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(
    d.getHours(),
  )}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
