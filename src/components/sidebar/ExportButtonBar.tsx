import { Button } from "@/components/ui/button"

export default function ExportButtonBar({
  exporting,
  copied,
  onExportPng,
  onExportJpeg,
  onCopy,
  onRandomize,
  onReset,
}: {
  exporting: boolean
  copied: boolean
  onExportPng: () => void
  onExportJpeg: () => void
  onCopy: () => void
  onRandomize: () => void
  onReset: () => void
}) {
  return (
    <div className="grid gap-2 border-t border-border bg-card px-5 py-4">
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline-primary"
          onClick={onExportPng}
          disabled={exporting}
        >
          {exporting ? "rendering…" : "Export PNG"}
        </Button>
        <Button variant="outline" onClick={onExportJpeg} disabled={exporting}>
          Export JPEG
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          disabled={exporting}
          title="Copy the current preview frame to the clipboard"
        >
          {copied ? "copied!" : "copy"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onRandomize}>
          randomise
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset}>
          reset
        </Button>
      </div>
    </div>
  )
}
