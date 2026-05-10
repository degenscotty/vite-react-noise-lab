import type { NoiseKind } from "@/types"
import { TABS } from "@/lib/noisePresets"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { cn } from "@/lib/utils"

export default function TopBar({
  kind,
  onKindChange,
}: {
  kind: NoiseKind
  onKindChange: (k: NoiseKind) => void
}) {
  return (
    <header className="grid h-12 grid-cols-3 items-center border-b border-border bg-card px-4">
      <div className="font-mono text-[13px] font-extrabold uppercase tracking-[0.18em] text-foreground">
        Noise Lab
      </div>
      <div className="flex items-center justify-center gap-5">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onKindChange(t.value)}
            className={cn(
              "text-[11px] font-medium uppercase tracking-wider transition-colors",
              kind === t.value
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
