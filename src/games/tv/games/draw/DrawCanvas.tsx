import { useEffect, useRef } from 'react';
import type { Stroke } from '../../drawing';

const SIZE = 700;

function paintWhite(ctx: CanvasRenderingContext2D) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, SIZE, SIZE);
}

/**
 * Die Zeichenflaeche des Fernsehers — eine durchgehende Szene. Sie wird NIE
 * neu eingehaengt (Phasenwechsel animieren nur ihre Umgebung). Striche kommen
 * live, das fertige Bild als PNG-Daten-URL; ein spaet verbundener Fernseher
 * zeichnet alle bisherigen Striche nach.
 */
export default function DrawCanvas({ strokes, dataURL }: { strokes: Stroke[]; dataURL?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawnCount = useRef(0);

  // Live-Striche. Weniger Striche als gezeichnet = neue Runde → neu beginnen.
  useEffect(() => {
    if (typeof dataURL === 'string') return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    if (strokes.length === 0 || strokes.length < drawnCount.current || drawnCount.current === 0) {
      paintWhite(ctx);
      drawnCount.current = 0;
    }
    for (let i = drawnCount.current; i < strokes.length; i++) {
      const s = strokes[i];
      ctx.beginPath();
      ctx.moveTo(s.from.x, s.from.y);
      ctx.lineTo(s.to.x, s.to.y);
      if (s.tool === 'eraser') {
        // Radierer malt weiss statt zu stanzen — die Flaeche bleibt Papier.
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = (s.size || 6) * 3;
      } else {
        ctx.strokeStyle = s.color || '#000000';
        ctx.lineWidth = s.size || 6;
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    drawnCount.current = strokes.length;
  }, [strokes, dataURL]);

  // Fertiges Bild (nur PNG-Daten-URLs, nie fremde Adressen).
  useEffect(() => {
    if (typeof dataURL !== 'string') return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    let cancelled = false;
    paintWhite(ctx);
    drawnCount.current = 0;
    if (!dataURL.startsWith('data:image/png;base64,')) return;
    const picture = new Image();
    picture.onload = () => { if (!cancelled) ctx.drawImage(picture, 0, 0, SIZE, SIZE); };
    picture.src = dataURL;
    return () => { cancelled = true; picture.onload = null; };
  }, [dataURL]);

  return <canvas ref={canvasRef} width={SIZE} height={SIZE} className="block h-full w-full bg-white" data-testid="tv-draw-canvas" />;
}
