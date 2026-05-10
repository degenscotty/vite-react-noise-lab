# Noise Lab

A WebGL workbench for generating animated noise textures in the browser. Three noise types (fire-cloud, Perlin field, film grain), each with its own palette editor and real-time canvas preview. Export single frames as PNG/JPEG or animated loops as WebM.

## Quick start

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Scripts

- `npm run dev`: Vite dev server with HMR.
- `npm run build`: strict typecheck (`tsc -b`) then a production bundle in `dist/`.
- `npm run lint`: ESLint.
- `npm run preview`: serve the production build.

## Features

- Three WebGL2 fragment shaders: fire-cloud (fbm + domain warp), Perlin (classic gradient noise + fbm + warp), and film grain (stochastic dither over 14 wave types).
- Shared 17-preset palette library with a draggable multi-stop gradient editor reused by every mode.
- Image export as PNG or JPEG at any resolution from 64 to 8192 px per side, with presets for 1080p, 4K, square, iPhone, X banner, etc.
- Video export as WebM via `MediaRecorder` with adjustable duration (1 to 15 s), fps (24 / 30 / 60), and quality (Std / High / Max). A modal tracks frame-by-frame progress.
- Native fullscreen preview from a button on the canvas, or Esc to exit.
- Every parameter auto-persists to `localStorage` under the `noiselab:` namespace, so a refresh keeps your settings.
- Desktop-only: under 1024 px the app shows a fire-cloud blocker screen instead of a cramped layout.
- Light / dark theme via `next-themes`.

## Stack

Vite 8, React 19, TypeScript (strict, with `noUnusedLocals` and `noUnusedParameters`), Tailwind CSS 4, shadcn/ui on Radix primitives, lucide-react, next-themes.

## Layout

```
src/
├── components/
│   ├── ui/         shadcn/ui primitives only
│   ├── theme/      ThemeProvider, ThemeToggle
│   ├── canvas/     CanvasViewport + per-mode WebGL canvas wrappers
│   ├── controls/   shared low-level controls (Range, Toggle, StopsEditor, ...)
│   ├── layout/     TopBar, StatusBar, MobileBlocker
│   ├── panels/     per-mode side-panel control groups
│   └── sidebar/    shared sidebar sections (Output, Video export, Export bar, dialog)
├── lib/            WebGL renderers, palettes, exports, hooks
├── pages/          NoiseLab.tsx (single page)
└── types/          shared TS types
```

## Adding a new noise type

1. New renderer in `src/lib/<name>.ts` matching the `setSize` / `render(params, time)` / `dispose` shape of the existing ones.
2. Extend `NoiseKind` and add `<Name>Params` in `src/types/index.ts`.
3. Register the renderer in `exportNoise` and `exportVideo` in `src/lib/download.ts`.
4. Wrap as `src/components/canvas/<Name>Canvas.tsx`, add default and random factories to `src/lib/noisePresets.ts`, and build a side-panel `src/components/panels/<Name>Panel.tsx`.
