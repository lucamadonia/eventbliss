/**
 * PixelCanvas — zeigt ein Motiv in der aktuellen Enthüllungsstufe.
 *
 * Das Bild wird EINMAL geladen und danach nur noch neu gezeichnet; ein
 * Stufenwechsel löst also keinen Netzwerkzugriff aus.
 */
import { useEffect, useRef, useState } from 'react';
import { drawPixelated, frameHeightFor } from './pixelate';

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
  const reportedReadyRef = useRef(false);
  const reportedErrorRef = useRef(false);
  const reportError = () => {
    if (reportedErrorRef.current) return;
    reportedErrorRef.current = true;
    errorRef.current?.();
  };
  const [ready, setReady] = useState(false);
  // Rahmen im Seitenverhaeltnis des Bildes (pixelate.ts frameHeightFor) — keine leeren Balken.
  const [fitHeight, setFitHeight] = useState<number | null>(null);

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
    setFitHeight(null);
    imgRef.current = null;
    reportedReadyRef.current = false;
    reportedErrorRef.current = false;
    if (!src) { reportError(); return; }
    let cancelled = false;
    let settled = false;
    const img = new Image();
    const fail = () => {
      if (cancelled || settled) return;
      settled = true;
      window.clearTimeout(timeout);
      reportError();
    };
    const timeout = window.setTimeout(fail, 12_000);
    img.decoding = 'async';
    img.onload = async () => {
      if (cancelled || settled) return;
      // On iOS, load can fire before the asynchronous decode is drawable.
      // Keep the loading cover and the round clock stopped until drawing succeeds.
      try { await img.decode(); } catch { /* drawPixelated reports an actual failure below */ }
      if (cancelled || settled) return;
      settled = true;
      window.clearTimeout(timeout);
      imgRef.current = img;
      setFitHeight(frameHeightFor(width, img.naturalWidth, img.naturalHeight, height));
      setReady(true);
    };
    img.onerror = fail;
    img.src = src;
    return () => { cancelled = true; window.clearTimeout(timeout); img.onload = null; img.onerror = null; };
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  // Neu zeichnen, wenn Bild oder Stufe sich ändern.
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !ready) return;
    try {
      if (!drawPixelated(canvas, img, step, img.naturalWidth, img.naturalHeight)) throw new Error('canvas unavailable');
      if (!reportedReadyRef.current) {
        reportedReadyRef.current = true;
        readyRef.current?.();
      }
    } catch {
      reportError();
    }
  }, [ready, step, width, height, fitHeight]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={fitHeight ?? height}
      className={className}
      // Damit auch die Browser-Skalierung auf großen Bildschirmen die Blöcke
      // hart lässt und nicht doch noch weichzeichnet.
      style={{ imageRendering: 'pixelated' }}
      aria-hidden="true"
    />
  );
}
