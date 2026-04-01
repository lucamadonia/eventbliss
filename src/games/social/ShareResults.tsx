import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Check, Download } from 'lucide-react';
import { GAME_NAMES } from './types';

interface ShareResultsProps {
  gameId: string;
  score: number;
  rank?: number;
  totalPlayers?: number;
  playerName?: string;
  won?: boolean;
}

export function ShareResults({
  gameId,
  score,
  rank,
  totalPlayers,
  playerName,
  won,
}: ShareResultsProps) {
  const [copied, setCopied] = useState(false);

  const gameName = GAME_NAMES[gameId] ?? gameId;

  const buildShareText = useCallback(() => {
    const lines: string[] = [];
    lines.push(`🎮 EventBliss Games — ${gameName}`);
    if (playerName) lines.push(`👤 ${playerName}`);
    lines.push(`🏆 Punkte: ${score}`);
    if (rank && totalPlayers) {
      lines.push(`📊 Platz ${rank} von ${totalPlayers}`);
    }
    if (won) lines.push('✅ Gewonnen!');
    lines.push('');
    lines.push('Spiel jetzt auf EventBliss! 🚀');
    return lines.join('\n');
  }, [gameName, playerName, score, rank, totalPlayers, won]);

  const handleCopy = useCallback(async () => {
    const text = buildShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [buildShareText]);

  const handleNativeShare = useCallback(async () => {
    const text = buildShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `EventBliss — ${gameName}`,
          text,
          url: window.location.origin,
        });
      } catch {
        // User cancelled or share failed — ignore
      }
    } else {
      await handleCopy();
    }
  }, [buildShareText, gameName, handleCopy]);

  const handleDownloadImage = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 400;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#0a0e14');
    gradient.addColorStop(1, '#151a21');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);

    // Border glow
    ctx.strokeStyle = '#df8eff40';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 560, 360);

    // Title
    ctx.fillStyle = '#df8eff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EVENTBLISS GAMES', 300, 60);

    // Game name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(gameName, 300, 110);

    // Score
    ctx.fillStyle = '#8ff5ff';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText(String(score), 300, 210);

    ctx.fillStyle = '#8ff5ff80';
    ctx.font = '16px sans-serif';
    ctx.fillText('PUNKTE', 300, 240);

    // Rank
    if (rank && totalPlayers) {
      ctx.fillStyle = '#ff6b98';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`Platz ${rank} von ${totalPlayers}`, 300, 290);
    }

    // Player name
    if (playerName) {
      ctx.fillStyle = '#ffffff80';
      ctx.font = '16px sans-serif';
      ctx.fillText(playerName, 300, 330);
    }

    // Won badge
    if (won) {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('🏆 GEWONNEN!', 300, 370);
    }

    const link = document.createElement('a');
    link.download = `eventbliss-${gameId}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [gameName, gameId, score, rank, totalPlayers, playerName, won]);

  return (
    <div className="flex items-center gap-2">
      <motion.button
        onClick={handleNativeShare}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        style={{
          background: 'rgba(223, 142, 255, 0.15)',
          color: '#df8eff',
          border: '1px solid rgba(223, 142, 255, 0.3)',
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <Share2 className="w-4 h-4" />
        Teilen
      </motion.button>

      <motion.button
        onClick={handleCopy}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        style={{
          background: 'rgba(143, 245, 255, 0.1)',
          color: '#8ff5ff',
          border: '1px solid rgba(143, 245, 255, 0.2)',
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Kopiert!' : 'Kopieren'}
      </motion.button>

      <motion.button
        onClick={handleDownloadImage}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        style={{
          background: 'rgba(255, 107, 152, 0.1)',
          color: '#ff6b98',
          border: '1px solid rgba(255, 107, 152, 0.2)',
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <Download className="w-4 h-4" />
        Bild
      </motion.button>
    </div>
  );
}
