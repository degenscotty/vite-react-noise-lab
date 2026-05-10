/**
 * Shared palette library: single source of truth for color stops
 * used by every noise renderer (fire-cloud, perlin, grain).
 *
 * Each preset is a list of ColorStop objects covering [0..1]. The
 * positions are anchored to 0 and 1 so the gradient lookup is
 * complete (no clamping artifacts at either end).
 */

import type { ColorStop } from "@/types";

const s = (id: string, pos: number, color: string): ColorStop => ({
  id,
  pos,
  color,
});

export const PALETTES: Record<string, ColorStop[]> = {
  ember: [
    s("ember-0", 0.0, "#06030a"),
    s("ember-1", 0.28, "#421006"),
    s("ember-2", 0.5, "#8a2a08"),
    s("ember-3", 0.72, "#e75e0d"),
    s("ember-4", 0.92, "#ffc23a"),
    s("ember-5", 1.0, "#fff2bf"),
  ],
  ice: [
    s("ice-0", 0.0, "#02060f"),
    s("ice-1", 0.28, "#0a2540"),
    s("ice-2", 0.55, "#1f6fa8"),
    s("ice-3", 0.78, "#7ad1e8"),
    s("ice-4", 1.0, "#f1fbff"),
  ],
  toxic: [
    s("toxic-0", 0.0, "#020a04"),
    s("toxic-1", 0.3, "#0e2b13"),
    s("toxic-2", 0.55, "#3aa84a"),
    s("toxic-3", 0.8, "#c0ff3e"),
    s("toxic-4", 1.0, "#fbffb8"),
  ],
  ash: [
    s("ash-0", 0.0, "#050505"),
    s("ash-1", 0.3, "#1f1c19"),
    s("ash-2", 0.6, "#5a544c"),
    s("ash-3", 0.85, "#b9b1a3"),
    s("ash-4", 1.0, "#f3ecdb"),
  ],
  magenta: [
    s("mag-0", 0.0, "#06020a"),
    s("mag-1", 0.32, "#3b0a4f"),
    s("mag-2", 0.58, "#a01784"),
    s("mag-3", 0.78, "#ff4fb5"),
    s("mag-4", 1.0, "#ffe5f0"),
  ],
  iridescent: [
    s("iri-0", 0.0, "#0a0033"),
    s("iri-1", 0.25, "#5a0e8c"),
    s("iri-2", 0.5, "#e9407a"),
    s("iri-3", 0.75, "#ffba49"),
    s("iri-4", 1.0, "#fff8d6"),
  ],
  ocean: [
    s("oce-0", 0.0, "#03101f"),
    s("oce-1", 0.4, "#0c4a6e"),
    s("oce-2", 0.7, "#22d3ee"),
    s("oce-3", 1.0, "#ecfeff"),
  ],
  sunset: [
    s("sun-0", 0.0, "#1a0033"),
    s("sun-1", 0.3, "#7a1c52"),
    s("sun-2", 0.55, "#ff5e3a"),
    s("sun-3", 0.8, "#ffd166"),
    s("sun-4", 1.0, "#fff3b0"),
  ],
  vapor: [
    s("vap-0", 0.0, "#1a0a2e"),
    s("vap-1", 0.3, "#3d348b"),
    s("vap-2", 0.55, "#ff5d8f"),
    s("vap-3", 0.8, "#7ce0e8"),
    s("vap-4", 1.0, "#fffbeb"),
  ],
  forest: [
    s("for-0", 0.0, "#0a1f0a"),
    s("for-1", 0.4, "#1f4d1f"),
    s("for-2", 0.7, "#7fa84a"),
    s("for-3", 1.0, "#fff5cc"),
  ],
  emerald: [
    s("eme-0", 0.0, "#04261a"),
    s("eme-1", 0.45, "#1d8a4a"),
    s("eme-2", 0.78, "#7adfa6"),
    s("eme-3", 1.0, "#a8f0c8"),
  ],
  cobalt: [
    s("cob-0", 0.0, "#020a1f"),
    s("cob-1", 0.42, "#1f2da8"),
    s("cob-2", 0.72, "#3b6cff"),
    s("cob-3", 1.0, "#9be7ff"),
  ],
  pomegranate: [
    s("pom-0", 0.0, "#1a0410"),
    s("pom-1", 0.45, "#a30a3a"),
    s("pom-2", 0.78, "#e10b50"),
    s("pom-3", 1.0, "#ffb1c8"),
  ],
  saffron: [
    s("saf-0", 0.0, "#1c0a04"),
    s("saf-1", 0.45, "#b56700"),
    s("saf-2", 0.75, "#ffb200"),
    s("saf-3", 1.0, "#fff2b8"),
  ],
  abyss: [
    s("aby-0", 0.0, "#02030a"),
    s("aby-1", 0.45, "#1a3a8a"),
    s("aby-2", 0.78, "#7e5cff"),
    s("aby-3", 1.0, "#c8b9ff"),
  ],
  dusk: [
    s("dus-0", 0.0, "#1a0625"),
    s("dus-1", 0.42, "#6a1ea8"),
    s("dus-2", 0.72, "#a23bff"),
    s("dus-3", 1.0, "#ff9bd1"),
  ],
  scarlet: [
    s("sca-0", 0.0, "#0a0214"),
    s("sca-1", 0.32, "#7e0510"),
    s("sca-2", 0.58, "#b50713"),
    s("sca-3", 0.82, "#5a2a8a"),
    s("sca-4", 1.0, "#1f3fa8"),
  ],
  monochrome: [
    s("mon-0", 0.0, "#000000"),
    s("mon-1", 1.0, "#ffffff"),
  ],
};

export const PALETTE_NAMES = Object.keys(PALETTES);

/** Deep-clone a palette so callers can mutate stops freely. */
export function clonePalette(name: string): ColorStop[] {
  const p = PALETTES[name] ?? PALETTES.ember;
  return p.map((stop) => ({ ...stop, id: `${stop.id}-${Math.random().toString(36).slice(2, 7)}` }));
}
