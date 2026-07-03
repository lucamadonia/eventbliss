import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
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

export default function RoomInvite({ gameId, roomCode, gameName }: RoomInviteProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${getBaseUrl()}/games/${gameId}?room=${roomCode}`;

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
          className="text-4xl font-extrabold tracking-[0.25em] font-game"
          style={{ color: EP.neonPurple }}
        >
          {roomCode}
        </p>

        {/* QR Code — scannable link into the room */}
        <div className="mt-4 flex justify-center">
          <div
            className="rounded-xl p-2 bg-white"
            style={{ border: `1px solid ${EP.border}` }}
          >
            <QRCodeSVG value={shareUrl} size={96} bgColor="#ffffff" fgColor="#0a0e14" />
          </div>
        </div>

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
