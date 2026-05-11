import { Range, Section, TextTabs } from "@/components/controls"
import { Button } from "@/components/ui/button"
import { formatBitrate, type VideoQuality } from "@/lib/download"

const rowLabelClassName =
  "font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"

export default function VideoExportSection({
  duration,
  fps,
  quality,
  bitrate,
  exporting,
  onDurationChange,
  onFpsChange,
  onQualityChange,
  onExport,
}: {
  duration: number
  fps: number
  quality: VideoQuality
  bitrate: number
  exporting: boolean
  onDurationChange: (v: number) => void
  onFpsChange: (v: number) => void
  onQualityChange: (v: VideoQuality) => void
  onExport: () => void
}) {
  return (
    <Section title="Video export">
      <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
        Records the animation as it plays. Same motion as the live preview.
        Saves an{" "}
        <code className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px] text-foreground">
          .mp4
        </code>{" "}
        at the chosen duration, fps, and quality.
      </p>
      <Range
        label="duration"
        value={duration}
        min={1}
        max={15}
        step={0.5}
        onChange={onDurationChange}
        format={(v) => `${v.toFixed(1)}s`}
      />
      <div className="grid grid-cols-[80px_1fr] items-center gap-3 py-1.5">
        <span className={rowLabelClassName}>fps</span>
        <TextTabs<string>
          options={[
            { label: "24", value: "24" },
            { label: "30", value: "30" },
            { label: "60", value: "60" },
          ]}
          value={String(fps)}
          onChange={(v) => onFpsChange(parseInt(v, 10))}
        />
      </div>
      <div className="grid grid-cols-[80px_1fr] items-center gap-3 py-1.5">
        <span className={rowLabelClassName}>quality</span>
        <TextTabs<VideoQuality>
          options={[
            { label: "Std", value: "standard" },
            { label: "High", value: "high" },
            { label: "Max", value: "max" },
          ]}
          value={quality}
          onChange={onQualityChange}
        />
      </div>
      <div className="grid grid-cols-[80px_1fr_auto] items-center gap-3 py-1.5">
        <span className={rowLabelClassName}>bitrate</span>
        <span />
        <span className="text-right font-mono text-[11px] tabular-nums text-foreground">
          {formatBitrate(bitrate)}
        </span>
      </div>
      <div className="grid grid-cols-[80px_1fr_auto] items-center gap-3 py-1.5">
        <span className={rowLabelClassName}>frames</span>
        <span />
        <span className="text-right font-mono text-[11px] tabular-nums text-foreground">
          {Math.round(duration * fps)}
        </span>
      </div>
      <Button
        variant="outline-primary"
        className="mt-2 w-full"
        onClick={onExport}
        disabled={exporting}
      >
        Export .mp4 video
      </Button>
    </Section>
  )
}
