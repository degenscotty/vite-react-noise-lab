export type NoiseKind = "fire" | "perlin" | "grain";

export type ColorStop = {
  id: string;
  pos: number; // 0..1
  color: string; // hex
};

export type FireParams = {
  speed: number;        // 0..3
  scale: number;        // 0.4..6
  intensity: number;    // 0.4..2
  detail: number;       // 0..1
  hotSpot: number;      // 0..1
  stops: ColorStop[];
  vignette: number;     // 0..1
  seed: number;
};

export type PerlinParams = {
  scale: number;        // 1..200 (px per cell-ish)
  octaves: number;      // 1..8
  persistence: number;  // 0..1
  lacunarity: number;   // 1..4
  speed: number;        // 0..2 (animation)
  contrast: number;     // 0..2
  warp: number;         // 0..2 (domain-warp amount)
  stops: ColorStop[];
  seed: number;
  animate: boolean;
};

export type GrainWave =
  // static curves
  | "linear"
  | "sine"
  | "radial"
  | "spiral"
  | "ripple"
  | "diagonal"
  // dynamic, fbm-based motion
  | "blob"
  | "aurora"
  | "flow"
  | "ocean"
  | "flame"
  | "smoke"
  | "plasma"
  | "swirl";

export type GrainParams = {
  intensity: number;    // 0..1
  size: number;         // 1..6 px
  density: number;      // 0..1
  monochrome: boolean;
  stops: ColorStop[];   // gradient mapped onto the wave field (N stops)
  tintAmount: number;   // 0..1 (overall gradient strength)
  contrast: number;     // 0..2
  vignette: number;     // 0..1
  animate: boolean;
  seed: number;
  waveType: GrainWave;
  waveSpeed: number;    // 0..3
  waveScale: number;    // 0.3..8 (frequency)
  waveAmount: number;   // 0..1 (wave displacement strength)
};

export type Resolution = {
  w: number;
  h: number;
};

/** Imperative renderer API: each noise renderer exposes this so we can
 *  re-render to an offscreen canvas at arbitrary export sizes. */
export type RenderFn<P> = (
  canvas: HTMLCanvasElement,
  params: P,
  time: number,
) => void;
