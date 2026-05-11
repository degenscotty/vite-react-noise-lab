import type { FireParams, GrainParams, NoiseKind, PerlinParams } from "@/types"
import { clonePalette } from "@/lib/palettes"

export const TABS: { value: NoiseKind; label: string }[] = [
  { value: "fire", label: "Fire-Cloud" },
  { value: "perlin", label: "Perlin" },
  { value: "grain", label: "Grain" },
]

export const RES_PRESETS: { label: string; w: number; h: number }[] = [
  { label: "1080p", w: 1920, h: 1080 },
  { label: "1440p", w: 2560, h: 1440 },
  { label: "4K UHD", w: 3840, h: 2160 },
  { label: "Square 2K", w: 2048, h: 2048 },
  { label: "Vertical", w: 1080, h: 1920 },
  { label: "iPhone", w: 1290, h: 2796 },
  { label: "X single image", w: 1200, h: 675 },
  { label: "X 2-image", w: 700, h: 800 },
  { label: "X 3-image rest", w: 1200, h: 686 },
  { label: "X 4-image", w: 1200, h: 600 },
  { label: "X shared link", w: 1200, h: 628 },
  { label: "X profile banner", w: 1500, h: 500 },
  { label: "X banner 2×", w: 3000, h: 1000 },
  { label: "X post HD", w: 1600, h: 900 },
]

export const defaultFire = (): FireParams => ({
  speed: 1.0,
  scale: 1.0,
  intensity: 1.0,
  detail: 1.0,
  hotSpot: 1.0,
  stops: clonePalette("ember"),
  vignette: 0.4,
  seed: 0,
})

export const defaultPerlin = (): PerlinParams => ({
  scale: 4,
  octaves: 5,
  persistence: 0.5,
  lacunarity: 2.0,
  speed: 0.4,
  contrast: 1.2,
  warp: 0.4,
  stops: clonePalette("ember"),
  seed: 0,
  animate: true,
})

export const defaultGrain = (): GrainParams => ({
  intensity: 0.45,
  size: 1,
  density: 1.0,
  monochrome: false,
  stops: clonePalette("ember"),
  tintAmount: 1.0,
  contrast: 1.05,
  vignette: 0.3,
  animate: true,
  seed: 0.21,
  waveType: "blob",
  waveSpeed: 0.4,
  waveScale: 0.9,
  waveAmount: 0.5,
})

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const randInt = (min: number, max: number) =>
  Math.floor(rand(min, max + 1 - 1e-9))
const pick = <T,>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]

export const randomFire = (): Partial<FireParams> => ({
  speed: rand(0.3, 2.0),
  scale: rand(0.5, 2.5),
  intensity: rand(0.6, 1.8),
  detail: rand(0.0, 1.0),
  hotSpot: rand(0.0, 1.0),
  vignette: rand(0.0, 0.7),
  seed: rand(0, 100),
})

export const randomPerlin = (): Partial<PerlinParams> => ({
  scale: rand(1.5, 14),
  octaves: randInt(2, 7),
  persistence: rand(0.3, 0.75),
  lacunarity: rand(1.5, 3.0),
  speed: rand(0.1, 1.2),
  contrast: rand(0.7, 1.8),
  warp: rand(0.0, 1.2),
  seed: rand(0, 100),
})

const GRAIN_WAVES: GrainParams["waveType"][] = [
  "blob",
  "aurora",
  "flow",
  "ocean",
  "flame",
  "smoke",
  "plasma",
  "swirl",
]

export const randomGrain = (): Partial<GrainParams> => ({
  intensity: rand(0.2, 0.8),
  size: randInt(1, 4),
  density: rand(0.3, 1.0),
  monochrome: Math.random() < 0.2,
  tintAmount: rand(0.6, 1.0),
  contrast: rand(0.8, 1.4),
  vignette: rand(0.0, 0.6),
  seed: Math.random(),
  waveType: pick(GRAIN_WAVES),
  waveSpeed: rand(0.2, 1.4),
  waveScale: rand(0.5, 3.0),
  waveAmount: rand(0.2, 0.9),
})
