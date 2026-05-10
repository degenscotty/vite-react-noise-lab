import { useEffect, useRef, useState, type ReactNode } from "react"
import { Maximize2, Minimize2 } from "lucide-react"
import type { NoiseKind } from "@/types"
import { cn } from "@/lib/utils"

const KIND_LABEL: Record<NoiseKind, string> = {
  fire: "fire-cloud",
  perlin: "perlin",
  grain: "grain",
}

export default function CanvasViewport({
  aspect,
  pixelLabel,
  kind,
  children,
}: {
  aspect: number
  pixelLabel: string
  kind: NoiseKind
  children: ReactNode
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    }
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  const fullscreenSupported =
    typeof document !== "undefined" &&
    typeof document.exitFullscreen === "function"

  const toggleFullscreen = async () => {
    if (!fullscreenSupported) return
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else if (containerRef.current) {
      await containerRef.current.requestFullscreen()
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        isFullscreen ? "bg-black" : "border-r border-border p-8",
      )}
    >
      <div
        data-noiselab-canvas
        className="relative w-full overflow-hidden rounded-md border border-border bg-black shadow-lg"
        style={{
          aspectRatio: aspect,
          maxWidth: isFullscreen
            ? "100vw"
            : `min(100%, calc((100vh - 200px) * ${aspect}))`,
          maxHeight: isFullscreen ? "100vh" : "100%",
        }}
      >
        <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white/70 backdrop-blur-md bg-black/35">
          {KIND_LABEL[kind]}
        </div>
        {fullscreenSupported && (
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
            className="absolute right-2.5 top-2.5 z-20 rounded p-1.5 text-white/70 backdrop-blur-md bg-black/35 transition-colors hover:bg-black/55 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            {isFullscreen ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
          </button>
        )}
        <div className="pointer-events-none absolute bottom-2.5 right-2.5 z-10 rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wider tabular-nums text-white/70 backdrop-blur-md bg-black/35">
          {pixelLabel} · {aspect.toFixed(2)}:1
        </div>
        {children}
      </div>
    </div>
  )
}
