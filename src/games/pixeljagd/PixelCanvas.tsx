/**
 * PixelCanvas — zeigt ein Motiv in der aktuellen Enthüllungsstufe.
 *
 * Das Bild wird EINMAL geladen und danach nur noch neu gezeichnet; ein
 * Stufenwechsel löst also keinen Netzwerkzugriff aus.
 */
import { useEffect, useRef, useState } from 'react';
import { drawPixelated } from './pixelate';

interface Props {
  src: string;
  /** Blöcke in der Breite. Klein = grob. */
  step: number;
  /** Interne Auflösung der Zeichenfläche. */
  width?: number;
  height?: number;
  className?: string;
  onError?: () => void;
}

export function PixelCanvas({ src, step, width = 960, height = 720, className, onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const errorRef = useRef(onError);
  errorRef.current = onError;
  const [ready, setReady] = useState(false);

  // Bild laden. crossOrigin='anonymous' ist Pflicht: ohne den Header gilt der
  // Canvas als getaint, und dann wirft jeder spätere getImageData()-Zugriff.
  // Deshalb dürfen hier nur same-origin- oder Supabase-URLs ankommen.
  useEffect(() => {
    setReady(false);
    imgRef.current = null;
    if (!src) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      if (cancelled) return;
      imgRef.current = img;
      setReady(true);
    };
    img.onerror = () => { if (!cancelled) errorRef.current?.(); };
    img.src = src;
    return () => { cancelled = true; };
  }, [src]);

  // Neu zeichnen, wenn Bild oder Stufe sich ändern.
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !ready) return;
    drawPixelated(canvas, img, step, img.naturalWidth, img.naturalHeight);
  }, [ready, step, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      // Damit auch die Browser-Skalierung auf großen Bildschirmen die Blöcke
      // hart lässt und nicht doch noch weichzeichnet.
      style={{ imageRendering: 'pixelated' }}
      aria-hidden="true"
    />
  );
}
