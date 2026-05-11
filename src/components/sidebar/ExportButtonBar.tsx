import { Button } from "@/components/ui/button"

export default function ExportButtonBar({
  exporting,
  copied,
  copiedSettings,
  onExportPng,
  onExportJpeg,
  onCopy,
  onCopySettings,
  onRandomize,
  onReset,
}: {
  exporting: boolean
  copied: boolean
  copiedSettings: boolean
  onExportPng: () => void
  onExportJpeg: () => void
  onCopy: () => void
  onCopySettings: () => void
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
      <div className="grid grid-cols-4 gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          disabled={exporting}
          title="Copy the current preview frame as PNG to the clipboard"
        >
          {copied ? "copied!" : "copy"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopySettings}
          disabled={exporting}
          title="Copy the current shader settings as JSON to share with another project"
        >
          {copiedSettings ? "copied!" : "json"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onRandomize}>
          random
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset}>
          reset
        </Button>
      </div>
    </div>
  )
}
