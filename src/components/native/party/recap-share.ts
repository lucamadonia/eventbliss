/**
 * recap-share.ts — the "Abend-Rückblick" as a 1080×1350 image (feed format)
 * and sharing it: native share sheet (Capacitor) or Web Share, else a download.
 * Drawn with the plain 2D canvas API so it needs no extra dependency.
 */
import { isNative } from '@/lib/platform';
import type { PartyRecap } from '@/games/party/party-recap';

export interface RecapText {
  title: string;
  date: string;
  gamesLine: string;
  closestLine: string | null;
  mostWinsLine: string | null;
  /** One line per game: "Bomb – Lena". */
  gameLines: string[];
  footer: string;
}

const W = 1080, H = 1350, BG = '#060810';
const MEDAL = ['#fbbf24', '#cbd5e1', '#d6925c'];

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, emoji: string, ring: string) {
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = `${color}33`; ctx.fill();
  ctx.lineWidth = 8; ctx.strokeStyle = ring; ctx.shadowColor = color; ctx.shadowBlur = 40; ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = `${Math.round(r * 1.05)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(emoji, x, y + r * 0.06);
  ctx.restore();
}

function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > max) cut = cut.slice(0, -1);
  return `${cut}…`;
}

export function drawRecap(ctx: CanvasRenderingContext2D, recap: PartyRecap, text: RecapText): void {
  const winner = recap.podium.find(p => p.rank === 1);
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 360, 40, W / 2, 360, 760);
  glow.addColorStop(0, `${winner?.color ?? '#df8eff'}55`); glow.addColorStop(1, `${BG}00`);
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  const sans = '"Inter","Segoe UI",system-ui,sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#8ff5ff'; ctx.font = `700 34px ${sans}`; ctx.fillText(text.date, W / 2, 110);
  ctx.fillStyle = '#ffffff'; ctx.font = `900 84px ${sans}`; ctx.fillText(fit(ctx, text.title, W - 120), W / 2, 205);
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = `600 36px ${sans}`; ctx.fillText(text.gamesLine, W / 2, 265);

  // Podium 2 · 1 · 3
  const order = [recap.podium.find(p => p.rank === 2), winner, recap.podium.find(p => p.rank === 3)];
  const xs = [W / 2 - 300, W / 2, W / 2 + 300];
  const heights = [190, 260, 140];
  order.forEach((p, i) => {
    if (!p) return;
    const baseY = 860, plinthH = heights[i], top = baseY - plinthH, r = p.rank === 1 ? 92 : 72;
    const medal = MEDAL[p.rank - 1] ?? '#ffffff';
    const plinth = ctx.createLinearGradient(0, top, 0, baseY);
    plinth.addColorStop(0, `${medal}66`); plinth.addColorStop(1, `${medal}14`);
    ctx.fillStyle = plinth; ctx.beginPath();
    ctx.roundRect(xs[i] - 130, top, 260, plinthH, [28, 28, 0, 0]); ctx.fill();
    ctx.fillStyle = medal; ctx.font = `900 72px ${sans}`; ctx.fillText(String(p.rank), xs[i], top + 82);
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = `700 34px ${sans}`; ctx.fillText(String(p.points), xs[i], top + 126);
    circle(ctx, xs[i], top - r - 70, r, p.color, p.avatar, p.rank === 1 ? '#fbbf24' : p.color);
    ctx.fillStyle = '#ffffff'; ctx.font = `800 38px ${sans}`; ctx.fillText(fit(ctx, p.name, 250), xs[i], top - 24);
    if (p.rank === 1) { ctx.font = `64px ${sans}`; ctx.fillText('👑', xs[i], top - r * 2 - 82); }
  });

  // Highlights + per-game winners
  ctx.textAlign = 'left';
  let y = 950;
  ctx.font = `700 36px ${sans}`;
  for (const line of [text.closestLine, text.mostWinsLine].filter((l): l is string => !!l)) {
    ctx.fillStyle = '#8ff5ff'; ctx.fillText(fit(ctx, line, W - 160), 80, y); y += 58;
  }
  ctx.font = `600 32px ${sans}`; ctx.fillStyle = 'rgba(255,255,255,.78)';
  for (const line of text.gameLines.slice(0, 5)) { ctx.fillText(fit(ctx, line, W - 160), 80, y); y += 50; }

  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.font = `700 30px ${sans}`;
  ctx.fillText(text.footer, W / 2, H - 56);
}

export async function renderRecapPng(recap: PartyRecap, text: RecapText): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  drawRecap(ctx, recap, text);
  return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/png'));
}

const toBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});

/** Native share sheet → Web Share with file → download. Returns how it was shared. */
export async function shareRecapImage(blob: Blob, title: string): Promise<'native' | 'web' | 'download'> {
  const name = `eventbliss-rueckblick-${Date.now()}.png`;
  if (isNative()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
    const file = await Filesystem.writeFile({ path: name, data: await toBase64(blob), directory: Directory.Cache });
    await Share.share({ title, files: [file.uri] });
    return 'native';
  }
  const file = new File([blob], name, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) { await navigator.share({ title, files: [file] }); return 'web'; }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'download';
}
