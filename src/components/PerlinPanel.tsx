import type { PerlinParams } from "@/types"
import { clonePalette } from "@/lib/palettes"
import {
  PalettePicker,
  Range,
  Section,
  StopsEditor,
  Toggle,
} from "@/components/Controls"

export default function PerlinPanel({
  value,
  onChange,
}: {
  value: PerlinParams
  onChange: (v: PerlinParams) => void
}) {
  const set = <K extends keyof PerlinParams>(k: K, v: PerlinParams[K]) =>
    onChange({ ...value, [k]: v })

  return (
    <>
      <Section title="Palette">
        <StopsEditor stops={value.stops} onChange={(s) => set("stops", s)} />
        <PalettePicker
          stops={value.stops}
          onPick={(v) => set("stops", clonePalette(v))}
        />
      </Section>

      <Section title="Field">
        <Range
          label="scale"
          value={value.scale}
          min={0.5}
          max={20}
          step={0.01}
          onChange={(v) => set("scale", v)}
        />
        <Range
          label="octaves"
          value={value.octaves}
          min={1}
          max={8}
          step={1}
          onChange={(v) => set("octaves", v)}
        />
        <Range
          label="persist."
          value={value.persistence}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => set("persistence", v)}
        />
        <Range
          label="lacunar."
          value={value.lacunarity}
          min={1}
          max={4}
          step={0.01}
          onChange={(v) => set("lacunarity", v)}
        />
        <Range
          label="warp"
          value={value.warp}
          min={0}
          max={2}
          step={0.01}
          onChange={(v) => set("warp", v)}
        />
        <Range
          label="contrast"
          value={value.contrast}
          min={0.2}
          max={3}
          step={0.01}
          onChange={(v) => set("contrast", v)}
        />
      </Section>

      <Section title="Motion">
        <Toggle
          label="animate"
          value={value.animate}
          onChange={(v) => set("animate", v)}
        />
        <Range
          label="speed"
          value={value.speed}
          min={0}
          max={2}
          step={0.01}
          onChange={(v) => set("speed", v)}
        />
        <Range
          label="seed"
          value={value.seed}
          min={0}
          max={100}
          step={0.01}
          onChange={(v) => set("seed", v)}
        />
      </Section>
    </>
  )
}
