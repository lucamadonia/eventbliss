import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Share2, QrCode } from "lucide-react";
import { getBaseUrl } from "@/lib/platform";

const EP = {
  surface1: "#151a21",
  surface2: "#1b2028",
  neonPurple: "#df8eff",
  neonCyan: "#8ff5ff",
  border: "rgba(223,142,255,0.12)",
} as const;

interface RoomInviteProps {
  gameId: string;
  roomCode: string;
  gameName?: string;
}

// Simple QR code rendered as SVG via canvas data URL
function useQrDataUrl(text: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Simple QR-like visual (a styled code display since full QR encoding is complex)
    // We create a visual grid pattern as a placeholder that encodes the room code visually
    const canvas = document.createElement("canvas");
    canvasRef.current = canvas;
    const size = 150;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dark background
    ctx.fillStyle = "#0a0e14";
    ctx.fillRect(0, 0, size, size);

    // Generate a deterministic pattern from the text
    const cellSize = 6;
    const gridSize = Math.floor(size / cellSize);
    const margin = 2;

    for (let y = margin; y < gridSize - margin; y++) {
      for (let x = margin; x < gridSize - margin; x++) {
        const charCode = text.charCodeAt((x + y * gridSize) % text.length);
        const hash = ((charCode * 31 + x * 7 + y * 13) % 100);
        if (hash < 45) {
          ctx.fillStyle = "#df8eff";
          ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
        }
      }
    }

    // Corner markers (QR-style)
    const drawCorner = (cx: number, cy: number) => {
      ctx.fillStyle = "#df8eff";
      ctx.fillRect(cx, cy, 18, 18);
      ctx.fillStyle = "#0a0e14";
      ctx.fillRect(cx + 3, cy + 3, 12, 12);
      ctx.fillStyle = "#df8eff";
      ctx.fillRect(cx + 6, cy + 6, 6, 6);
    };
    drawCorner(6, 6);
    drawCorner(size - 24, 6);
    drawCorner(6, size - 24);

    setUrl(canvas.toDataURL());
  }, [text]);

  return url;
}

export default function RoomInvite({ gameId, roomCode, gameName }: RoomInviteProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${getBaseUrl()}/games/${gameId}?room=${roomCode}`;
  const qrUrl = useQrDataUrl(roomCode + shareUrl);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareUrl]);

  const handleNativeShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: `${gameName ?? "Spiel"} - EventBliss`,
        text: `Tritt meinem Spiel bei! Code: ${roomCode}`,
        url: shareUrl,
      });
    } else {
      handleCopy();
    }
  }, [shareUrl, roomCode, gameName, handleCopy]);

  const handleWhatsApp = useCallback(() => {
    const text = encodeURIComponent(
      `Spiel mit mir ${gameName ?? "ein Spiel"} auf EventBliss! Code: ${roomCode}\n${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }, [shareUrl, roomCode, gameName]);

  return (
    <div className="space-y-4">
      {/* Big room code */}
      <div
        className="relative rounded-2xl p-5 text-center overflow-hidden"
        style={{
          backgroundColor: EP.surface1,
          border: `1px solid ${EP.border}`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: `radial-gradient(ellipse at center, rgba(223,142,255,0.06), transparent 70%)`,
          }}
        />
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40 font-['Be_Vietnam_Pro'] mb-2">
          Raumcode
        </p>
        <p
          className="text-4xl font-extrabold tracking-[0.25em] font-['Plus_Jakarta_Sans']"
          style={{ color: EP.neonPurple }}
        >
          {roomCode}
        </p>

        {/* QR Code */}
        {qrUrl && (
          <div className="mt-4 flex justify-center">
            <div
              className="rounded-xl p-2"
              style={{ backgroundColor: EP.surface2, border: `1px solid ${EP.border}` }}
            >
              <img
                src={qrUrl}
                alt="QR Code"
                className="h-24 w-24 rounded-lg"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
            style={{
              backgroundColor: copied
                ? "rgba(143,245,255,0.15)"
                : "rgba(223,142,255,0.12)",
              color: copied ? EP.neonCyan : EP.neonPurple,
            }}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Kopiert!" : "Link kopieren"}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleNativeShare}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"
            style={{
              backgroundColor: "rgba(143,245,255,0.12)",
              color: EP.neonCyan,
            }}
          >
            <Share2 className="h-3.5 w-3.5" /> Teilen
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleWhatsApp}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"
            style={{
              backgroundColor: "rgba(37,211,102,0.12)",
              color: "#25D366",
            }}
          >
            <QrCode className="h-3.5 w-3.5" /> WhatsApp
          </motion.button>
        </div>
      </div>
    </div>
  );
}
