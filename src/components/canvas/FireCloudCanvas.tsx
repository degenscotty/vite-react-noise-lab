import { useEffect, useRef } from "react";
import type { FireParams } from "@/types";
import { FireCloudRenderer } from "@/lib/fireCloud";

type Props = {
  params: FireParams;
  pixelRatio?: number;
  paused?: boolean;
};

export default function FireCloudCanvas({ params, pixelRatio, paused = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<FireCloudRenderer | null>(null);
  const paramsRef = useRef(params);
  const rafRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const pausedRef = useRef(paused);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: FireCloudRenderer;
    try {
      renderer = new FireCloudRenderer(canvas);
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
      if (pausedRef.current) {
        renderer.render(paramsRef.current, elapsedRef.current);
      }
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [pixelRatio]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (paused) {
      renderer.render(paramsRef.current, elapsedRef.current);
      return;
    }

    let lastMs = performance.now();
    const tick = (now: number) => {
      elapsedRef.current += (now - lastMs) / 1000;
      lastMs = now;
      renderer.render(paramsRef.current, elapsedRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [paused, pixelRatio]);

  useEffect(() => {
    if (!paused) return;
    rendererRef.current?.render(params, elapsedRef.current);
  }, [params, paused]);

  return <canvas ref={canvasRef} className="block size-full" />;
}
