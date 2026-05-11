import type { NoiseKind } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

export default function ExportDialog({
  open,
  kind,
  durationSec,
  fps,
  progress,
}: {
  open: boolean
  kind: NoiseKind
  durationSec: number
  fps: number
  progress: { frame: number; total: number } | null
}) {
  const total = progress?.total ?? Math.max(1, Math.round(durationSec * fps))
  const frame = progress?.frame ?? 0
  const pct = Math.min(100, Math.max(0, (frame / Math.max(1, total)) * 100))

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        className="max-w-sm"
      >
        <DialogHeader>
          <DialogTitle className="font-mono text-[13px] font-extrabold uppercase tracking-[0.18em]">
            Rendering video
          </DialogTitle>
          <DialogDescription>
            Encoding the {kind} animation to{" "}
            <code className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px] text-foreground">
              .mp4
            </code>{" "}
            at {fps} fps. Don't close this tab.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2.5">
          <Progress value={pct} className="h-2" />
          <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-muted-foreground">
            <span>
              frame {frame} / {total}
            </span>
            <span className="text-foreground">{pct.toFixed(0)}%</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
