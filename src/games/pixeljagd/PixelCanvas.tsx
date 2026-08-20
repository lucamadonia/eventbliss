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
  /** Feuert, sobald das Bild geladen UND gezeichnet ist. */
  onReady?: () => void;
}

export function PixelCanvas({ src, step, width = 960, height = 720, className, onError, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const errorRef = useRef(onError);
  errorRef.current = onError;
  const readyRef = useRef(onReady);
  readyRef.current = onReady;
  const [ready, setReady] = useState(false);

  // Bild laden.
  //
  // Bewusst OHNE crossOrigin: ein fremdgehostetes Bild „taintet" damit zwar den
  // Canvas, aber das blockiert ausschließlich das ZURÜCKLESEN von Pixeln
  // (getImageData/toBlob/toDataURL) — und das passiert hier nirgends, es wird
  // nur gezeichnet. Mit crossOrigin='anonymous' würde der Browser das Laden
  // dagegen komplett verweigern, sobald der fremde Server keine CORS-Header
  // schickt. Genau das hätte Bild-URLs ohne Not unmöglich gemacht.
  useEffect(() => {
    setReady(false);
    imgRef.current = null;
    if (!src) return;
    let cancelled = false;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (cancelled) return;
      imgRef.current = img;
      setReady(true);
      // Erst jetzt darf die Runde loslaufen: Vorher ist die Zeichenflaeche
      // leer, und die Enthuellung liefe gegen ein Bild, das niemand sieht.
      readyRef.current?.();
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
