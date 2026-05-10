import type {
  FireParams,
  GrainParams,
  NoiseKind,
  PerlinParams,
  Resolution,
} from "@/types"

function summaryFor(
  kind: NoiseKind,
  fire: FireParams,
  perlin: PerlinParams,
  grain: GrainParams,
) {
  if (kind === "fire") {
    return `${fire.stops.length} stops · scale ${fire.scale.toFixed(2)} · speed ${fire.speed.toFixed(2)}`
  }
  if (kind === "perlin") {
    return `octaves ${perlin.octaves} · persistence ${perlin.persistence.toFixed(2)} · warp ${perlin.warp.toFixed(2)}`
  }
  return `${grain.waveType} · intensity ${grain.intensity.toFixed(2)} · size ${grain.size.toFixed(0)}px · density ${(grain.density * 100).toFixed(0)}%`
}

export default function StatusBar({
  kind,
  res,
  fire,
  perlin,
  grain,
}: {
  kind: NoiseKind
  res: Resolution
  fire: FireParams
  perlin: PerlinParams
  grain: GrainParams
}) {
  const summary = summaryFor(kind, fire, perlin, grain)

  return (
    <footer className="flex h-8 items-center gap-6 border-t border-border bg-card px-5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground tabular-nums">
      <span>
        <span className="text-muted-foreground/60">mode </span>
        <span className="text-foreground">{kind}</span>
      </span>
      <span>
        <span className="text-muted-foreground/60">canvas </span>
        <span className="text-foreground">
          {res.w}×{res.h}
        </span>
      </span>
      <span className="truncate">
        <span className="text-muted-foreground/60">params </span>
        <span className="text-foreground">{summary}</span>
      </span>
    </footer>
  )
}
