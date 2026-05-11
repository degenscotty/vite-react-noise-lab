import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from "react"
import { ChevronsUpDown, Plus, X } from "lucide-react"
import type { ColorStop } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { PALETTES, PALETTE_NAMES } from "@/lib/palettes"
import { cn } from "@/lib/utils"

/* ============================================================
   Row primitive: shared 3-column grid (label / control / value)
   ============================================================ */

const rowLabelClassName =
  "font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"

/* ============================================================
   Range: wraps shadcn Slider in a labelled 3-col row
   ============================================================ */

type RangeProps = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (n: number) => void
  format?: (n: number) => string
}

export function Range({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  format,
}: RangeProps) {
  const fmt = format
    ? format(value)
    : Number.isInteger(step) && step >= 1
      ? value.toFixed(0)
      : value.toFixed(value < 10 ? 2 : 1)
  return (
    <div className="grid grid-cols-[80px_1fr_56px] items-center gap-3 py-1.5">
      <span className={rowLabelClassName}>{label}</span>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
      />
      <span className="text-right font-mono text-[11px] tabular-nums text-foreground">
        {fmt}
      </span>
    </div>
  )
}

/* ============================================================
   Toggle: labelled shadcn Switch row
   ============================================================ */

type ToggleProps = {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}

export function Toggle({ label, value, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={rowLabelClassName}>{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  )
}

/* ============================================================
   Segmented: shadcn ToggleGroup as single-select segmented control
   ============================================================ */

type SegmentedProps<T extends string> = {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v as T)
      }}
      className="w-full justify-start flex-wrap"
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          className="flex-1 font-mono text-[10px] uppercase tracking-[0.12em] data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary/50"
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/* ============================================================
   ColorRow: single hex + swatch row
   ============================================================ */

type ColorRowProps = {
  color: string
  onChange: (hex: string) => void
  label?: string
}

export function ColorRow({ color, onChange, label }: ColorRowProps) {
  return (
    <div className="flex items-center gap-2 py-1">
      <label
        className="relative size-7 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border"
        style={{ background: color }}
      >
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      <Input
        type="text"
        value={color}
        onChange={(e) => {
          const v = e.target.value.trim()
          if (/^#?[0-9a-fA-F]{0,8}$/.test(v)) {
            onChange(v.startsWith("#") ? v : `#${v}`)
          }
        }}
        className="h-8 flex-1 font-mono text-[11px] uppercase tracking-wider"
      />
      {label && (
        <span className="font-mono text-[10px] text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  )
}

/* ============================================================
   Section: semantic section with a mono uppercase title
   ============================================================ */

type SectionProps = {
  title: string
  children: React.ReactNode
}

export function Section({ title, children }: SectionProps) {
  return (
    <section className="space-y-2 border-b border-border py-3 last:border-b-0">
      <h3 className="font-mono text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </section>
  )
}

/* ============================================================
   Chips: Ember-style round pill presets
   ============================================================ */

type ChipsProps = {
  options: { label: string; value: string }[]
  onPick: (v: string) => void
}

export function Chips({ options, onPick }: ChipsProps) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onPick(o.value)}
          className="inline-flex shrink-0 items-center rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-primary/70 hover:bg-primary/[0.06] hover:text-primary"
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ============================================================
   useCloseOnOutsideScroll: closes a popover as soon as the user
   scrolls anywhere outside the popper portal. Without this, fast
   scrolling in the side panel can leave the popover floating over
   an unrelated trigger position.
   ============================================================ */

function useCloseOnOutsideScroll(open: boolean, setOpen: (v: boolean) => void) {
  useEffect(() => {
    if (!open) return
    const onScroll = (e: Event) => {
      const t = e.target
      if (
        t instanceof Element &&
        t.closest("[data-radix-popper-content-wrapper]")
      ) {
        return
      }
      setOpen(false)
    }
    // capture phase so we see scrolls on inner scrollable elements too
    window.addEventListener("scroll", onScroll, true)
    return () => window.removeEventListener("scroll", onScroll, true)
  }, [open, setOpen])
}

/* ============================================================
   PalettePicker: popover-based palette selector. Trigger shows
   the current gradient + chevron; popover lists every named preset
   as a row of (gradient strip · name) for at-a-glance preview.
   Pattern mirrors Ember's HandleSearchBar / handle picker.
   ============================================================ */

type PalettePickerProps = {
  stops: ColorStop[]
  onPick: (name: string) => void
}

export function PalettePicker({ stops, onPick }: PalettePickerProps) {
  const [open, setOpen] = useState(false)
  useCloseOnOutsideScroll(open, setOpen)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="mt-2 flex w-full items-center gap-2.5 rounded-md border border-border/60 bg-card px-2.5 py-2 text-left transition-colors hover:bg-muted/40"
        >
          <div
            className="h-5 w-16 shrink-0 rounded-sm border border-border/40"
            style={{ background: buildGradientCss(stops) }}
            aria-hidden
          />
          <span className="flex-1 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Pick palette
          </span>
          <ChevronsUpDown className="size-3 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border-border/60 bg-popover p-0 shadow-xl"
      >
        <div className="max-h-72 overflow-y-auto overscroll-contain p-1">
          {PALETTE_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                onPick(name)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-muted"
            >
              <div
                className="h-5 w-16 shrink-0 rounded-sm border border-border/40"
                style={{ background: buildGradientCss(PALETTES[name]) }}
                aria-hidden
              />
              <span className="flex-1 truncate font-mono text-[11px] font-medium uppercase tracking-wider text-foreground">
                {name}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/* ============================================================
   ResolutionPicker: popover-based resolution selector. Each row
   shows a scaled-down rectangle matching the resolution's aspect
   ratio so the user can pick by shape at a glance.
   ============================================================ */

type ResolutionOption = { label: string; w: number; h: number }
type ResolutionPickerProps = {
  res: { w: number; h: number }
  options: ResolutionOption[]
  onPick: (r: { w: number; h: number }) => void
}

/** Map (w,h) to a small bounding box (max 26×18 px) preserving aspect. */
function aspectBox(w: number, h: number) {
  const maxW = 26
  const maxH = 18
  const a = w / h
  if (a >= maxW / maxH) {
    return { width: maxW, height: Math.max(3, Math.round(maxW / a)) }
  }
  return { width: Math.max(3, Math.round(maxH * a)), height: maxH }
}

export function ResolutionPicker({
  res,
  options,
  onPick,
}: ResolutionPickerProps) {
  const [open, setOpen] = useState(false)
  useCloseOnOutsideScroll(open, setOpen)
  const currentBox = aspectBox(res.w, res.h)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="mt-2 flex w-full items-center gap-2.5 rounded-md border border-border/60 bg-card px-2.5 py-2 text-left transition-colors hover:bg-muted/40"
        >
          <div className="flex h-5 w-7 shrink-0 items-center justify-center">
            <div
              className="rounded-[2px] border border-muted-foreground/60 bg-muted-foreground/20"
              style={currentBox}
              aria-hidden
            />
          </div>
          <span className="flex-1 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Preset size
          </span>
          <ChevronsUpDown className="size-3 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border-border/60 bg-popover p-0 shadow-xl"
      >
        <div className="max-h-72 overflow-y-auto overscroll-contain p-1">
          {options.map((o) => {
            const box = aspectBox(o.w, o.h)
            const active = o.w === res.w && o.h === res.h
            return (
              <button
                key={`${o.w}x${o.h}`}
                type="button"
                onClick={() => {
                  onPick({ w: o.w, h: o.h })
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-muted",
                  active && "bg-muted/70",
                )}
              >
                <div className="flex h-5 w-7 shrink-0 items-center justify-center">
                  <div
                    className={cn(
                      "rounded-[2px] border",
                      active
                        ? "border-primary/60 bg-primary/30"
                        : "border-muted-foreground/50 bg-muted-foreground/20",
                    )}
                    style={box}
                    aria-hidden
                  />
                </div>
                <span
                  className={cn(
                    "flex-1 truncate font-mono text-[11px] font-medium uppercase tracking-wider",
                    active ? "text-primary" : "text-foreground",
                  )}
                >
                  {o.label}
                </span>
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                  {o.w}×{o.h}
                </span>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/* ============================================================
   TextTabs: plain-text tab strip (wraps when too many options).
   Same visual treatment as the main topbar tabs: primary text
   on active, muted-foreground with hover-lift on inactive.
   ============================================================ */

type TextTabsProps<T extends string> = {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}

export function TextTabs<T extends string>({
  options,
  value,
  onChange,
}: TextTabsProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "text-[11px] font-medium uppercase tracking-wider transition-colors",
            value === o.value
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ============================================================
   StopsEditor: gradient bar + draggable stop pins + row list
   ============================================================ */

type StopsEditorProps = {
  stops: ColorStop[]
  onChange: (stops: ColorStop[]) => void
}

function buildGradientCss(stops: ColorStop[]): string {
  const sorted = [...stops].sort((a, b) => a.pos - b.pos)
  if (sorted.length === 0) return "#000"
  if (sorted.length === 1) return sorted[0].color
  return `linear-gradient(to right, ${sorted
    .map((s) => `${s.color} ${(s.pos * 100).toFixed(1)}%`)
    .join(", ")})`
}

function normalizeHex(hex: string): string {
  const h = hex.replace("#", "")
  if (h.length === 3) return "#" + h.split("").map((c) => c + c).join("")
  if (h.length >= 6) return "#" + h.slice(0, 6)
  return "#888888"
}
function lerpHex(a: string, b: string, t: number): string {
  const A = normalizeHex(a).slice(1)
  const B = normalizeHex(b).slice(1)
  const ar = parseInt(A.slice(0, 2), 16)
  const ag = parseInt(A.slice(2, 4), 16)
  const ab = parseInt(A.slice(4, 6), 16)
  const br = parseInt(B.slice(0, 2), 16)
  const bg = parseInt(B.slice(2, 4), 16)
  const bb = parseInt(B.slice(4, 6), 16)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return (
    "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    bl.toString(16).padStart(2, "0")
  )
}
function sampleGradientHex(stops: ColorStop[], pos: number): string {
  const sorted = [...stops].sort((a, b) => a.pos - b.pos)
  if (sorted.length === 0) return "#888888"
  if (pos <= sorted[0].pos) return sorted[0].color
  const last = sorted[sorted.length - 1]
  if (pos >= last.pos) return last.color
  for (let i = 1; i < sorted.length; i++) {
    if (pos <= sorted[i].pos) {
      const a = sorted[i - 1]
      const b = sorted[i]
      const t = (pos - a.pos) / (b.pos - a.pos || 1)
      return lerpHex(a.color, b.color, t)
    }
  }
  return last.color
}

export function StopsEditor({ stops, onChange }: StopsEditorProps) {
  const sorted = [...stops].sort((a, b) => a.pos - b.pos)
  const barRef = useRef<HTMLDivElement>(null)
  const stopsRef = useRef(stops)
  const onChangeRef = useRef(onChange)
  const [nextStopId, setNextStopId] = useState(() => {
    let max = 0
    for (const s of stops) {
      const m = s.id.match(/^s_(\d+)$/)
      if (m) max = Math.max(max, parseInt(m[1], 10))
    }
    return max
  })
  const [dragId, setDragId] = useState<string | null>(null)
  const dragHandlersRef = useRef<{
    move: (e: PointerEvent) => void
    up: (e: PointerEvent) => void
  } | null>(null)

  useEffect(() => {
    stopsRef.current = stops
  }, [stops])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    return () => {
      if (dragHandlersRef.current) {
        window.removeEventListener("pointermove", dragHandlersRef.current.move)
        window.removeEventListener("pointerup", dragHandlersRef.current.up)
        window.removeEventListener(
          "pointercancel",
          dragHandlersRef.current.up,
        )
      }
    }
  }, [])

  const update = (id: string, patch: Partial<ColorStop>) => {
    onChange(stops.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }
  const remove = (id: string) => {
    if (stops.length <= 2) return
    onChange(stops.filter((s) => s.id !== id))
  }
  const add = (pos = 0.5, color = "#888888") => {
    if (stops.length >= 8) return
    const newId = nextStopId + 1
    setNextStopId(newId)
    const id = `s_${newId}`
    onChange([...stops, { id, pos: Math.max(0, Math.min(1, pos)), color }])
  }
  const onPosInput = (id: string, e: ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    if (Number.isFinite(v)) update(id, { pos: Math.max(0, Math.min(1, v)) })
  }

  const onPinDown = (
    e: ReactPointerEvent<HTMLSpanElement>,
    id: string,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const bar = barRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    setDragId(id)

    const move = (ev: PointerEvent) => {
      const pos = Math.max(
        0,
        Math.min(1, (ev.clientX - rect.left) / Math.max(1, rect.width)),
      )
      onChangeRef.current(
        stopsRef.current.map((s) => (s.id === id ? { ...s, pos } : s)),
      )
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
      dragHandlersRef.current = null
      setDragId(null)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
    dragHandlersRef.current = { move, up }
  }

  const onBarPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.dataset.stopPin) return
    if (stopsRef.current.length >= 8) return
    const bar = barRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const pos = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)),
    )
    add(pos, sampleGradientHex(stopsRef.current, pos))
  }

  return (
    <div className="space-y-2">
      <div
        ref={barRef}
        className="relative mb-7 h-7 cursor-copy select-none rounded-md border border-border touch-none"
        style={{ background: buildGradientCss(stops) }}
        onPointerDown={onBarPointerDown}
        title="Click to add a stop"
      >
        {sorted.map((s) => (
          <span
            key={s.id}
            data-stop-pin
            className={cn(
              "absolute flex -translate-x-1/2 origin-top cursor-ew-resize touch-none flex-col items-center transition-transform",
              dragId === s.id ? "z-10 scale-110" : "z-0",
            )}
            style={{ top: "100%", left: `${(s.pos * 100).toFixed(2)}%` }}
            title={`${s.color} @ ${(s.pos * 100).toFixed(0)}%, drag to move`}
            onPointerDown={(e) => onPinDown(e, s.id)}
          >
            <span
              data-stop-pin
              className="block size-0 border-l-[4px] border-r-[4px] border-b-[5px] border-l-transparent border-r-transparent border-b-primary drop-shadow-[0_-1px_1px_rgba(0,0,0,0.45)]"
            />
            <span
              data-stop-pin
              className={cn(
                "block size-3.5 rounded-sm border border-border shadow-[0_1px_2px_rgba(0,0,0,0.35)] transition-[box-shadow,border-color]",
                dragId === s.id && "border-primary shadow-[0_0_0_2px_var(--primary)]",
              )}
              style={{ background: s.color }}
            />
          </span>
        ))}
      </div>
      <div className="space-y-1">
        {stops.map((s) => (
          <div className="flex items-center gap-2" key={s.id}>
            <label
              className="relative size-7 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border"
              style={{ background: s.color }}
            >
              <input
                type="color"
                value={s.color}
                onChange={(e) => update(s.id, { color: e.target.value })}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
            </label>
            <Input
              type="text"
              value={s.color}
              onChange={(e) => {
                const v = e.target.value.trim()
                if (/^#?[0-9a-fA-F]{0,8}$/.test(v)) {
                  update(s.id, { color: v.startsWith("#") ? v : `#${v}` })
                }
              }}
              className="h-8 flex-1 font-mono text-[11px] uppercase tracking-wider"
            />
            <Input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={s.pos.toFixed(2)}
              onChange={(e) => onPosInput(s.id, e)}
              className="h-8 w-16 text-right font-mono text-[10px] tabular-nums"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => remove(s.id)}
              disabled={stops.length <= 2}
              title="Remove stop"
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
      {stops.length < 8 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full border-dashed text-muted-foreground hover:text-primary"
          onClick={() => add()}
        >
          <Plus className="size-3.5" />
          add stop
        </Button>
      )}
    </div>
  )
}
