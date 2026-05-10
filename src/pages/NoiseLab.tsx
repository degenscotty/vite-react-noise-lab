import { useCallback, useMemo, useState } from "react"
import type {
  FireParams,
  GrainParams,
  NoiseKind,
  PerlinParams,
  Resolution,
} from "@/types"
import {
  adaptiveBitrate,
  downloadBlob,
  exportNoise,
  exportVideo,
  qualityToBpp,
  timestamp,
  type VideoQuality,
} from "@/lib/download"
import FireCloudCanvas from "@/components/FireCloudCanvas"
import PerlinCanvas from "@/components/PerlinCanvas"
import GrainCanvas from "@/components/GrainCanvas"
import FirePanel from "@/components/FirePanel"
import PerlinPanel from "@/components/PerlinPanel"
import GrainPanel from "@/components/GrainPanel"
import TopBar from "@/components/TopBar"
import CanvasViewport from "@/components/CanvasViewport"
import StatusBar from "@/components/StatusBar"
import ExportDialog from "@/components/ExportDialog"
import OutputSection from "@/components/OutputSection"
import VideoExportSection from "@/components/VideoExportSection"
import ExportButtonBar from "@/components/ExportButtonBar"
import {
  defaultFire,
  defaultGrain,
  defaultPerlin,
  randomFire,
  randomGrain,
  randomPerlin,
} from "@/lib/noisePresets"
import { usePersistedState } from "@/lib/usePersistedState"

export default function NoiseLab() {
  const [kind, setKind] = usePersistedState<NoiseKind>(
    "noiselab:kind",
    () => "fire",
  )
  const [fire, setFire] = usePersistedState<FireParams>(
    "noiselab:fire",
    defaultFire,
  )
  const [perlin, setPerlin] = usePersistedState<PerlinParams>(
    "noiselab:perlin",
    defaultPerlin,
  )
  const [grain, setGrain] = usePersistedState<GrainParams>(
    "noiselab:grain",
    defaultGrain,
  )
  const [res, setRes] = usePersistedState<Resolution>("noiselab:res", () => ({
    w: 1920,
    h: 1080,
  }))
  const [exporting, setExporting] = useState(false)
  const [loopDuration, setLoopDuration] = usePersistedState<number>(
    "noiselab:loopDuration",
    () => 6,
  )
  const [loopFps, setLoopFps] = usePersistedState<number>(
    "noiselab:loopFps",
    () => 30,
  )
  const [loopQuality, setLoopQuality] = usePersistedState<VideoQuality>(
    "noiselab:loopQuality",
    () => "high",
  )
  const [loopProgress, setLoopProgress] = useState<{
    frame: number
    total: number
  } | null>(null)
  const loopBitrate = adaptiveBitrate(
    res.w,
    res.h,
    loopFps,
    qualityToBpp(loopQuality),
  )

  const aspect = res.w / res.h
  const pixelLabel = `${res.w} × ${res.h}`

  const downloadFile = useCallback(
    async (format: "png" | "jpeg") => {
      setExporting(true)
      try {
        const params =
          kind === "fire" ? fire : kind === "perlin" ? perlin : grain
        const blob = await exportNoise(kind, params, res.w, res.h, format)
        const name = `noiselab_${kind}_${res.w}x${res.h}_${timestamp()}.${format}`
        downloadBlob(blob, name)
      } catch (err) {
        console.error(err)
        alert("Export failed: " + (err as Error).message)
      } finally {
        setExporting(false)
      }
    },
    [kind, fire, perlin, grain, res],
  )

  const downloadLoop = useCallback(async () => {
    setExporting(true)
    setLoopProgress({ frame: 0, total: 1 })
    try {
      const params =
        kind === "fire" ? fire : kind === "perlin" ? perlin : grain
      const blob = await exportVideo(kind, params, {
        width: res.w,
        height: res.h,
        durationSec: loopDuration,
        fps: loopFps,
        bitrate: loopBitrate,
        onProgress: (frame, total) => setLoopProgress({ frame, total }),
      })
      const name = `noiselab_${kind}_${res.w}x${res.h}_${loopDuration}s_${loopFps}fps_${timestamp()}.webm`
      downloadBlob(blob, name)
    } catch (err) {
      console.error(err)
      alert("Video export failed: " + (err as Error).message)
    } finally {
      setExporting(false)
      setLoopProgress(null)
    }
  }, [kind, fire, perlin, grain, res, loopDuration, loopFps, loopBitrate])

  const [copied, setCopied] = useState(false)
  const copyToClipboard = useCallback(async () => {
    const canvas = document.querySelector<HTMLCanvasElement>(
      "[data-noiselab-canvas] canvas",
    )
    if (!canvas) return
    if (
      typeof navigator === "undefined" ||
      !navigator.clipboard ||
      typeof ClipboardItem === "undefined"
    ) {
      alert("Clipboard API not available in this browser.")
      return
    }
    // Wait one frame so the latest preview is on the buffer
    await new Promise<void>((r) => requestAnimationFrame(() => r()))
    canvas.toBlob(async (blob) => {
      if (!blob) {
        alert("Copy failed: preview canvas is empty.")
        return
      }
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ])
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      } catch (err) {
        console.error(err)
        alert("Copy to clipboard failed: " + (err as Error).message)
      }
    }, "image/png")
  }, [])

  const randomize = useCallback(() => {
    if (kind === "fire") setFire((f) => ({ ...f, ...randomFire() }))
    else if (kind === "perlin")
      setPerlin((p) => ({ ...p, ...randomPerlin() }))
    else setGrain((g) => ({ ...g, ...randomGrain() }))
  }, [kind, setFire, setPerlin, setGrain])

  const reset = useCallback(() => {
    if (kind === "fire") setFire(defaultFire())
    else if (kind === "perlin") setPerlin(defaultPerlin())
    else setGrain(defaultGrain())
  }, [kind, setFire, setPerlin, setGrain])

  const Preview = useMemo(() => {
    if (kind === "fire") return <FireCloudCanvas params={fire} />
    if (kind === "perlin") return <PerlinCanvas params={perlin} />
    return <GrainCanvas params={grain} />
  }, [kind, fire, perlin, grain])

  return (
    <div className="grid h-full grid-rows-[3rem_1fr_2rem]">
      <TopBar kind={kind} onKindChange={setKind} />

      {/* Main area */}
      <div className="grid min-h-0 grid-cols-[1fr_360px]">
        <CanvasViewport aspect={aspect} pixelLabel={pixelLabel} kind={kind}>
          {Preview}
        </CanvasViewport>

        {/* Side panel */}
        <aside className="flex flex-col overflow-hidden bg-card">
          <div className="flex flex-col gap-0.5 border-b border-border px-5 py-4">
            <div className="text-[15px] font-semibold tracking-tight text-foreground">
              {kind === "fire"
                ? "Fire-cloud"
                : kind === "perlin"
                  ? "Perlin field"
                  : "Film grain"}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {kind === "fire" && "fragment shader / 7-octave fbm"}
              {kind === "perlin" && "fragment shader / classic gradient noise"}
              {kind === "grain" && "fragment shader / stochastic dither"}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-2">
            {kind === "fire" && <FirePanel value={fire} onChange={setFire} />}
            {kind === "perlin" && (
              <PerlinPanel value={perlin} onChange={setPerlin} />
            )}
            {kind === "grain" && (
              <GrainPanel value={grain} onChange={setGrain} />
            )}

            <OutputSection res={res} onResChange={setRes} />

            <VideoExportSection
              duration={loopDuration}
              fps={loopFps}
              quality={loopQuality}
              bitrate={loopBitrate}
              exporting={exporting}
              progress={loopProgress}
              onDurationChange={setLoopDuration}
              onFpsChange={setLoopFps}
              onQualityChange={setLoopQuality}
              onExport={downloadLoop}
            />
          </div>

          <ExportButtonBar
            exporting={exporting}
            copied={copied}
            onExportPng={() => downloadFile("png")}
            onExportJpeg={() => downloadFile("jpeg")}
            onCopy={copyToClipboard}
            onRandomize={randomize}
            onReset={reset}
          />
        </aside>
      </div>

      <StatusBar kind={kind} res={res} fire={fire} perlin={perlin} grain={grain} />

      {/* Render-blocking export dialog */}
      <ExportDialog
        open={exporting}
        kind={kind}
        durationSec={loopDuration}
        fps={loopFps}
        progress={loopProgress}
      />
    </div>
  )
}
