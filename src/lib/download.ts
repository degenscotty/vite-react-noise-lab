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
import { Muxer, ArrayBufferTarget } from "mp4-muxer";

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
   MP4 / H.264 video export (WebCodecs + mp4-muxer)
   ------------------------------------------------------------
   Renders N frames at the requested size+fps using the kind's
   WebGL renderer, encodes each frame through a hardware-backed
   VideoEncoder, and muxes the resulting chunks into an MP4 file.

   Output: MP4 / H.264. Universally supported (social platforms,
   iOS, macOS Quick Look, etc).
   ============================================================ */

export type LoopExportOptions = {
  width: number;
  height: number;
  durationSec: number;
  fps: number;
  bitrate?: number;
  onProgress?: (frame: number, total: number) => void;
};

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

/** Find the highest-quality H.264 profile the encoder will accept
 *  for the given dimensions, fps, and bitrate. Level 5.2 supports
 *  up to 4K@60, which covers every preset in the app. */
async function pickH264Codec(
  width: number,
  height: number,
  fps: number,
  bitrate: number,
): Promise<string> {
  // High > Main > Baseline. Hardware encoders almost always support
  // High; the fallbacks exist for software-only paths on older
  // browsers.
  const candidates = [
    "avc1.640034", // High      L5.2
    "avc1.4D4034", // Main      L5.2
    "avc1.420034", // Baseline  L5.2
    "avc1.640028", // High      L4.0  (1080p30 fallback)
    "avc1.42E01F", // Baseline  L3.1  (720p fallback)
  ];
  for (const codec of candidates) {
    try {
      const support = await VideoEncoder.isConfigSupported({
        codec,
        width,
        height,
        bitrate,
        framerate: fps,
      });
      if (support.supported) return codec;
    } catch {
      // Some browsers throw on unknown codec strings instead of
      // returning { supported: false }; just try the next one.
    }
  }
  throw new Error(
    `No supported H.264 encoder config for ${width}x${height} @ ${fps}fps`,
  );
}

export async function exportVideo(
  kind: NoiseKind,
  params: FireParams | PerlinParams | GrainParams,
  opts: LoopExportOptions,
): Promise<Blob> {
  const { width, height, durationSec, fps, bitrate, onProgress } = opts;

  if (typeof VideoEncoder === "undefined") {
    throw new Error(
      "WebCodecs (VideoEncoder) is not available in this browser. " +
        "Use a recent Chrome, Edge, Safari 16.4+, or Firefox 130+.",
    );
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

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
  const targetBitrate = bitrate ?? adaptiveBitrate(width, height, fps);
  const codec = await pickH264Codec(width, height, fps, targetBitrate);

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: "avc",
      width,
      height,
    },
    fastStart: "in-memory",
  });

  let encodeError: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      encodeError = e instanceof Error ? e : new Error(String(e));
    },
  });

  encoder.configure({
    codec,
    width,
    height,
    bitrate: targetBitrate,
    framerate: fps,
  });

  // One keyframe every ~2 seconds. Keeps the stream seekable without
  // bloating size on long renders.
  const keyframeInterval = Math.max(1, Math.round(fps * 2));
  const frameDurationUs = Math.round(1_000_000 / fps);

  try {
    for (let i = 0; i < totalFrames; i++) {
      if (encodeError) throw encodeError;

      const t = (i / totalFrames) * durationSec;
      renderFrame(t);

      const frame = new VideoFrame(canvas, {
        timestamp: Math.round((i * 1_000_000) / fps),
        duration: frameDurationUs,
      });
      encoder.encode(frame, { keyFrame: i % keyframeInterval === 0 });
      frame.close();

      // Backpressure: yield to the event loop if the encoder is
      // falling behind, otherwise we'd queue thousands of frames in
      // RAM at high fps + high res.
      if (encoder.encodeQueueSize > 2) {
        await new Promise<void>((r) => setTimeout(r, 0));
      }

      onProgress?.(i + 1, totalFrames);
    }

    await encoder.flush();
    if (encodeError) throw encodeError;

    muxer.finalize();
  } finally {
    if (encoder.state !== "closed") encoder.close();
    dispose();
  }

  return new Blob([muxer.target.buffer], { type: "video/mp4" });
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
