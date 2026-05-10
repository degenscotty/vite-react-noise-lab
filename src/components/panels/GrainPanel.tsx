import type { GrainParams } from "@/types"
import { clonePalette } from "@/lib/palettes"
import {
  PalettePicker,
  Range,
  Section,
  StopsEditor,
  TextTabs,
  Toggle,
} from "@/components/controls"

const staticWaves: { label: string; value: GrainParams["waveType"] }[] = [
  { label: "Linear", value: "linear" },
  { label: "Sine", value: "sine" },
  { label: "Radial", value: "radial" },
  { label: "Spiral", value: "spiral" },
  { label: "Ripple", value: "ripple" },
  { label: "Diagonal", value: "diagonal" },
]

const dynamicWaves: { label: string; value: GrainParams["waveType"] }[] = [
  { label: "Blob", value: "blob" },
  { label: "Aurora", value: "aurora" },
  { label: "Flow", value: "flow" },
  { label: "Ocean", value: "ocean" },
  { label: "Flame", value: "flame" },
  { label: "Smoke", value: "smoke" },
  { label: "Plasma", value: "plasma" },
  { label: "Swirl", value: "swirl" },
]

export default function GrainPanel({
  value,
  onChange,
}: {
  value: GrainParams
  onChange: (v: GrainParams) => void
}) {
  const set = <K extends keyof GrainParams>(k: K, v: GrainParams[K]) =>
    onChange({ ...value, [k]: v })

  return (
    <>
      <Section title="Palette">
        <StopsEditor stops={value.stops} onChange={(s) => set("stops", s)} />
        <PalettePicker
          stops={value.stops}
          onPick={(v) => set("stops", clonePalette(v))}
        />
        <div className="h-2" />
        <Range
          label="strength"
          value={value.tintAmount}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => set("tintAmount", v)}
        />
      </Section>

      <Section title="Waves">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
          static
        </div>
        <TextTabs
          options={staticWaves}
          value={value.waveType}
          onChange={(v) => set("waveType", v)}
        />
        <div className="mb-1 mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
          dynamic
        </div>
        <TextTabs
          options={dynamicWaves}
          value={value.waveType}
          onChange={(v) => set("waveType", v)}
        />
        <div className="h-3" />
        <Range
          label="speed"
          value={value.waveSpeed}
          min={0}
          max={3}
          step={0.01}
          onChange={(v) => set("waveSpeed", v)}
        />
        <Range
          label="scale"
          value={value.waveScale}
          min={0.3}
          max={8}
          step={0.01}
          onChange={(v) => set("waveScale", v)}
        />
        <Range
          label="amount"
          value={value.waveAmount}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => set("waveAmount", v)}
        />
        <Toggle
          label="animate"
          value={value.animate}
          onChange={(v) => set("animate", v)}
        />
      </Section>

      <Section title="Grain">
        <Range
          label="intensity"
          value={value.intensity}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => set("intensity", v)}
        />
        <Range
          label="size"
          value={value.size}
          min={1}
          max={8}
          step={1}
          onChange={(v) => set("size", v)}
        />
        <Range
          label="density"
          value={value.density}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => set("density", v)}
        />
        <Toggle
          label="monochrome"
          value={value.monochrome}
          onChange={(v) => set("monochrome", v)}
        />
      </Section>

      <Section title="Look">
        <Range
          label="contrast"
          value={value.contrast}
          min={0.4}
          max={2}
          step={0.01}
          onChange={(v) => set("contrast", v)}
        />
        <Range
          label="vignette"
          value={value.vignette}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => set("vignette", v)}
        />
      </Section>
    </>
  )
}
