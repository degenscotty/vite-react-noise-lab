import type { Resolution } from "@/types"
import { ResolutionPicker, Section } from "@/components/controls"
import { Input } from "@/components/ui/input"
import { RES_PRESETS } from "@/lib/noisePresets"

const rowLabelClassName =
  "font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"

const MIN_PX = 64
const MAX_PX = 8192

const clampPx = (v: number) => Math.max(MIN_PX, Math.min(MAX_PX, v || MIN_PX))

export default function OutputSection({
  res,
  onResChange,
}: {
  res: Resolution
  onResChange: (next: Resolution) => void
}) {
  return (
    <Section title="Output">
      <div className="grid grid-cols-[80px_1fr_32px] items-center gap-3 py-1.5">
        <span className={rowLabelClassName}>Width</span>
        <Input
          type="number"
          min={MIN_PX}
          max={MAX_PX}
          step={1}
          value={res.w}
          onChange={(e) =>
            onResChange({ ...res, w: clampPx(+e.target.value) })
          }
          className="h-8 font-mono text-[11px] tabular-nums"
        />
        <span className="text-right font-mono text-[10px] text-muted-foreground">
          px
        </span>
      </div>
      <div className="grid grid-cols-[80px_1fr_32px] items-center gap-3 py-1.5">
        <span className={rowLabelClassName}>Height</span>
        <Input
          type="number"
          min={MIN_PX}
          max={MAX_PX}
          step={1}
          value={res.h}
          onChange={(e) =>
            onResChange({ ...res, h: clampPx(+e.target.value) })
          }
          className="h-8 font-mono text-[11px] tabular-nums"
        />
        <span className="text-right font-mono text-[10px] text-muted-foreground">
          px
        </span>
      </div>
      <ResolutionPicker
        res={res}
        options={RES_PRESETS}
        onPick={(r) => onResChange({ w: r.w, h: r.h })}
      />
    </Section>
  )
}
