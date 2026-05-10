import type { FireParams } from "@/types"
import { clonePalette } from "@/lib/palettes"
import {
  PalettePicker,
  Range,
  Section,
  StopsEditor,
} from "@/components/controls"

export default function FirePanel({
  value,
  onChange,
}: {
  value: FireParams
  onChange: (v: FireParams) => void
}) {
  const set = <K extends keyof FireParams>(k: K, v: FireParams[K]) =>
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

      <Section title="Motion">
        <Range
          label="speed"
          value={value.speed}
          min={0}
          max={3}
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

      <Section title="Shape">
        <Range
          label="scale"
          value={value.scale}
          min={0.3}
          max={4}
          step={0.01}
          onChange={(v) => set("scale", v)}
        />
        <Range
          label="intensity"
          value={value.intensity}
          min={0.3}
          max={3}
          step={0.01}
          onChange={(v) => set("intensity", v)}
        />
        <Range
          label="detail"
          value={value.detail}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => set("detail", v)}
        />
        <Range
          label="hotspot"
          value={value.hotSpot}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => set("hotSpot", v)}
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
