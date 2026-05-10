import { useEffect, useState } from "react"
import FireCloudCanvas from "@/components/FireCloudCanvas"
import { defaultFire } from "@/lib/noisePresets"

const FIRE = defaultFire()

function useViewport() {
  const [vp, setVp] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 0,
    h: typeof window !== "undefined" ? window.innerHeight : 0,
  }))
  useEffect(() => {
    const handler = () =>
      setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])
  return vp
}

export default function MobileBlocker() {
  const vp = useViewport()

  return (
    <div className="fixed inset-0 isolate overflow-hidden bg-black">
      <div className="absolute inset-0">
        <FireCloudCanvas params={FIRE} />
      </div>

      {/* Vignettes for legibility */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black/85 via-black/30 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      <div className="pointer-events-none absolute left-3 top-3 z-20 rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white/70 backdrop-blur-md bg-black/35">
        Noise Lab · locked
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 z-20 rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wider tabular-nums text-white/70 backdrop-blur-md bg-black/35">
        {vp.w}×{vp.h} · need 1024+
      </div>

      {/* Centered message */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-700">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.24em] text-white/55">
            desktop only
          </div>
          <div className="mx-auto mb-6 h-px w-14 bg-white/30" />
          <h1
            className="mx-auto mb-5 max-w-[14ch] text-balance text-[clamp(2.25rem,10vw,3.75rem)] font-semibold leading-[0.95] tracking-tight text-white"
            style={{ textShadow: "0 2px 30px rgba(0,0,0,0.65)" }}
          >
            Built for the desktop.
          </h1>
          <p
            className="mx-auto max-w-[30ch] text-balance text-[13px] leading-relaxed text-white/80"
            style={{ textShadow: "0 1px 16px rgba(0,0,0,0.7)" }}
          >
            Noise Lab is a WebGL workbench: palettes, precision sliders,
            full-bleed canvas. Come back on a wider screen for the full kit.
          </p>
        </div>
      </div>
    </div>
  )
}
