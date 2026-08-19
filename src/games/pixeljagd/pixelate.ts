/**
 * pixelate — der Kern von PIXELJAGD.
 *
 * Echte Pixelung, kein Weichzeichner: das Bild wird auf eine winzige Fläche
 * heruntergerechnet und dann mit abgeschaltetem Interpolieren wieder groß
 * gezogen. Ergebnis sind harte Blöcke. Ein CSS-`blur()` würde stattdessen
 * Formen und Farbverläufe erhalten und damit viel zu früh verraten, was zu
 * sehen ist.
 *
 * WICHTIG zur Bildquelle: `vercel.json` erlaubt zwar jedes `https:` als
 * `<img>`-Quelle, aber `connect-src` ist eine strikte Allowlist. Zeichnet man
 * ein fremdgehostetes Bild in einen Canvas, gilt der Canvas als „getaint" und
 * jeder spätere `getImageData()`/`toBlob()` wirft. Deshalb dürfen hier nur
 * Bilder ankommen, die same-origin (`/images/...`) oder aus dem Supabase-
 * Storage stammen — Supabase steht in `connect-src`.
 */

/** Feinste Stufe: ab hier ist das Bild praktisch scharf. */
const FINAL_STEP = 320;

/**
 * Zeichnet `source` in `canvas`, heruntergebrochen auf `step` Blöcke in der
 * Breite. Kleines `step` = grob, großes `step` = fein.
 */
export function drawPixelated(
  canvas: HTMLCanvasElement,
  source: CanvasImageSource,
  step: number,
  srcWidth: number,
  srcHeight: number,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx || srcWidth <= 0 || srcHeight <= 0) return;

  const w = canvas.width;
  const h = canvas.height;
  if (w === 0 || h === 0) return;

  const blocks = Math.max(2, Math.round(step));
  if (blocks >= FINAL_STEP) {
    // Endstufe: unverfälscht und geglättet zeichnen.
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, w, h);
    drawContain(ctx, source, srcWidth, srcHeight, w, h);
    return;
  }

  // Zwischenfläche im Seitenverhältnis des Ziels, damit die Blöcke quadratisch
  // bleiben und nicht zu Streifen verzerren.
  const tmp = document.createElement("canvas");
  tmp.width = blocks;
  tmp.height = Math.max(2, Math.round((blocks * h) / w));
  const tctx = tmp.getContext("2d");
  if (!tctx) return;

  tctx.imageSmoothingEnabled = true; // beim Verkleinern mitteln — sonst Aliasing
  drawContain(tctx, source, srcWidth, srcHeight, tmp.width, tmp.height);

  ctx.imageSmoothingEnabled = false; // beim Vergrößern NICHT interpolieren
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, 0, 0, w, h);
}

/**
 * `object-fit: contain` von Hand — das GANZE Bild muss sichtbar sein.
 *
 * Vorher stand hier `cover` (Math.max), also formatfüllend mit Beschnitt. Bei
 * einem Ratespiel ist das genau falsch herum: Weggeschnitten wird regelmäßig
 * der Teil, an dem man das Motiv erkennt — bei einem Hochformat-Porträt der
 * Kopf, bei einem Logo die Ränder. Lieber Balken am Rand als ein Motiv, das
 * niemand erraten kann.
 */
function drawContain(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sw: number,
  sh: number,
  dw: number,
  dh: number,
): void {
  const scale = Math.min(dw / sw, dh / sh);
  const w = sw * scale;
  const h = sh * scale;
  ctx.drawImage(source, (dw - w) / 2, (dh - h) / 2, w, h);
}

/**
 * Die Enthüllungsleiter: eine Stufe pro Sekunde, **geometrisch** wachsend.
 *
 * Linear wäre falsch. Die Erkennbarkeit hängt ungefähr logarithmisch an der
 * Auflösung: von 8 auf 16 Blöcke ist ein gewaltiger Sprung, von 200 auf 208
 * sieht niemand einen Unterschied. Linear verteilt käme der entscheidende
 * Moment geballt am Ende — das Spiel wäre bis zur letzten Sekunde langweilig
 * und dann schlagartig trivial.
 */
export function stepsFor(startPx: number, durationSec: number): number[] {
  const n = Math.max(1, Math.round(durationSec));
  const from = Math.max(2, startPx);
  if (n === 1) return [FINAL_STEP];
  const ratio = Math.pow(FINAL_STEP / from, 1 / (n - 1));
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(Math.round(from * Math.pow(ratio, i)));
  out[out.length - 1] = FINAL_STEP;
  return out;
}

/** Wie viele Punkte gibt es beim aktuellen Fortschritt? 100 → 10, wie EmojiGuess. */
export function pointsAt(elapsedSec: number, durationSec: number): number {
  if (durationSec <= 0) return 10;
  const p = Math.min(1, Math.max(0, elapsedSec / durationSec));
  return Math.max(10, Math.round(100 - p * 90));
}

export { FINAL_STEP };
