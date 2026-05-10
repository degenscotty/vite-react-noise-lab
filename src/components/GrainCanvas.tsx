import { useEffect, useRef } from "react";
import type { GrainParams } from "@/types";
import { GrainRenderer } from "../lib/grain";

type Props = {
  params: GrainParams;
  pixelRatio?: number;
};

export default function GrainCanvas({ params, pixelRatio }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<GrainRenderer | null>(null);
  const paramsRef = useRef(params);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: GrainRenderer;
    try {
      renderer = new GrainRenderer(canvas);
    } catch (e) {
      console.error(e);
      return;
    }
    rendererRef.current = renderer;

    const dpr = () =>
      Math.max(1, Math.min(2, pixelRatio ?? (window.devicePixelRatio || 1)));

    const resize = () => {
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr()));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr()));
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    startRef.current = performance.now();
    const tick = (now: number) => {
      const t = (now - startRef.current) / 1000;
      renderer.render(paramsRef.current, t);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [pixelRatio]);

  return <canvas ref={canvasRef} className="block size-full" />;
}
