// OHRWURM — Auflösung, Siegerehrung und Overlays (Verlassen, Spotify-Status, Toast, QR).
import { useState, type ComponentProps } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ExternalLink, Heart, Plus, QrCode, RotateCcw, Sparkles, Trophy, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Confetti } from '@/components/expenses-v2/Confetti';
import type { useHaptics } from '@/hooks/useHaptics';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { hasShellBackButton } from '../ui/shell-back';
import type { Participant, PendingCounter, RoundResolution, Song } from './ohrwurm-engine';
import { spotifyTrackDeepLink, spotifyTrackUrl } from './ohrwurm-content';
import type { SpotifyBridge } from './playback';
import { OW } from './ohrwurm-theme';
import { ActionChip, Avatar, QrCard, ResolutionSummary, RevealCard } from './OhrwurmParts';

export function RevealPanel({ song, flipped, resolution, active, counter, participants, spotifyUri, bridge, haptics, flash,
  bonusOpen, bonusForfeited, speedEligible, onQr, onBonus, onContinue }: {
  song: Song; flipped: boolean; resolution: RoundResolution; active: Participant; counter: PendingCounter | null; participants: Participant[];
  spotifyUri: string | null; bridge: SpotifyBridge | null; haptics: ReturnType<typeof useHaptics>; flash: (msg: string) => void;
  bonusOpen: boolean; bonusForfeited: boolean; speedEligible: boolean; onQr: () => void; onBonus: (earned: boolean) => void; onContinue: () => void;
}) {
  const { t } = useTranslation();
  // Lade-Status der Reveal-Spotify-Aktionen (verhindert Doppel-Schreiben bei Doppeltipp).
  const [likeBusy, setLikeBusy] = useState(false);
  const [playlistBusy, setPlaylistBusy] = useState(false);
  return (
    <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center gap-6 py-4">
      <RevealCard song={song} flipped={flipped} />
      <ResolutionSummary
        resolution={resolution} active={active} counter={counter} participants={participants}
      />
      {/* Aktionen NACH der Auflösung — filigrane Chip-Leiste über „Weiter".
          QR immer; „Volle Länge" öffnet den Track DIREKT in Spotify (Deep-Link),
          sobald eine URI vorliegt; Like/Playlist nur bei autorisierter Bridge. */}
      <div role="group" aria-label={t('games.ohrwurm.actionsGroup')} className="flex items-stretch gap-2 w-full max-w-sm">
        {spotifyUri && (
          <ActionChip
            icon={ExternalLink} label={t('games.ohrwurm.fullLength')} tone="spotify"
            ariaLabel={t('games.ohrwurm.fullLengthAria')}
            onClick={() => {
              void haptics.light();
              const deep = spotifyTrackDeepLink(spotifyUri);
              const web = spotifyTrackUrl(spotifyUri);
              window.open(deep || web, '_system');
            }}
          />
        )}
        {bridge && spotifyUri && (
          <>
          <ActionChip
            icon={Heart} label={t('games.ohrwurm.like')} busy={likeBusy}
            ariaLabel={t('games.ohrwurm.likeAria')}
            onClick={() => {
              if (likeBusy) return;
              void haptics.light(); setLikeBusy(true);
              // Promise.resolve fängt den Fall ab, dass die Methode fehlt
              // (?. → undefined) — sonst würde .then werfen und busy hängenbleiben.
              Promise.resolve(bridge?.saveTrack?.(spotifyUri))
                .then((r) => flash(r?.ok ? t('games.ohrwurm.flashLiked') : t('games.ohrwurm.flashLikeFailed') + (r ? ' (' + r.detail + ')' : '')))
                .catch(() => flash(t('games.ohrwurm.flashLikeFailed')))
                .finally(() => setLikeBusy(false));
            }}
          />
          <ActionChip
            icon={Plus} label={t('games.ohrwurm.playlist')} tone="spotify" busy={playlistBusy}
            ariaLabel={t('games.ohrwurm.playlistAria')}
            onClick={() => {
              if (playlistBusy) return;
              void haptics.light(); setPlaylistBusy(true);
              Promise.resolve(bridge?.addToPlaylist?.(spotifyUri))
                .then((r) => flash(r?.ok ? t('games.ohrwurm.flashPlaylistAdded') : t('games.ohrwurm.flashPlaylistFailed') + (r ? ' (' + r.detail + ')' : '')))
                .catch(() => flash(t('games.ohrwurm.flashPlaylistFailed')))
                .finally(() => setPlaylistBusy(false));
            }}
          />
          </>
        )}
        <ActionChip
          icon={QrCode} label={t('games.ohrwurm.qrCode')}
          ariaLabel={t('games.ohrwurm.qrCodeAria')}
          onClick={() => { void haptics.light(); onQr(); }}
        />
      </div>
      {bonusOpen ? (
        <div className="w-full max-w-sm rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: OW.surface, border: `1px solid ${OW.accent}`, boxShadow: speedEligible ? `0 0 26px ${OW.accent}55` : 'none' }}>
          <p className="text-sm font-bold text-center" style={{ color: OW.accent }}>
            {speedEligible ? <Zap className="inline w-4 h-4 me-1" fill={OW.accent} /> : <Sparkles className="inline w-4 h-4 me-1" />}
            {speedEligible && <span className="font-black">{t('games.ohrwurm.blitz')} </span>}
            {t('games.ohrwurm.bonusConfirmQuestion', { name: active.name })}
          </p>
          <p className="text-[13px] text-center -mt-1" style={{ color: OW.dim }}>
            {speedEligible
              ? t('games.ohrwurm.bonusSpeedDesc')
              : t('games.ohrwurm.bonusNormalDesc')}
          </p>
          <div className="flex gap-3">
            <button onClick={() => onBonus(true)} className="flex-1 h-12 rounded-xl font-black" style={{ background: OW.accent, color: OW.bg }}>
              {t('games.ohrwurm.bonusYes', { count: speedEligible ? 2 : 1 })}
            </button>
            <button onClick={() => onBonus(false)} className="flex-1 h-12 rounded-xl font-bold" style={{ background: 'rgba(255,255,255,0.06)', color: OW.dim }}>{t('games.ohrwurm.bonusNo')}</button>
          </div>
        </div>
      ) : (
        <>
          {bonusForfeited && (
            <p className="text-[13px] text-center -mt-2" style={{ color: OW.dim }}>
              {t('games.ohrwurm.bonusForfeited')}
            </p>
          )}
          <motion.button data-testid="ohrwurm-continue" whileTap={{ scale: 0.97 }} onClick={onContinue}
            className="w-full max-w-sm h-14 rounded-2xl font-black text-base flex items-center justify-center gap-2"
            style={{ background: OW.primary, color: OW.bg, boxShadow: `0 10px 30px ${OW.primary}40` }}>
            {t('games.ohrwurm.next')} <ArrowRight className="w-5 h-5" />
          </motion.button>
        </>
      )}
    </motion.div>
  );
}

export function GameOverPanel({ participants, winner, achievements, onDismissAchievements, onRematch, onOtherGame }: {
  participants: Participant[]; winner: Participant;
  achievements: ComponentProps<typeof GameEndOverlay>['achievements']; onDismissAchievements: () => void;
  onRematch: () => void; onOtherGame: () => void;
}) {
  const { t } = useTranslation();
  return (
    <motion.div key="over" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col items-center justify-center gap-5 py-8 max-w-lg mx-auto w-full">
      <Confetti fire particles={120} />
      <GameEndOverlay achievements={achievements} onDismiss={onDismissAchievements} />
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full" style={{ background: 'rgba(255,210,63,0.12)', border: `1px solid ${OW.accent}` }}>
          <Trophy className="w-8 h-8" style={{ color: OW.accent }} />
        </div>
      </motion.div>
      <h2 className="text-3xl font-black ow-glow-pink" style={{ color: OW.primary }}>{t('games.ohrwurm.gameOver')}</h2>
      <div className="text-lg font-bold" style={{ color: OW.secondary }}>{t('games.ohrwurm.winnerAnnounce', { name: winner.name, count: winner.timeline.length })}</div>
      <div className="w-full space-y-2">
        {[...participants].sort((a, b) => b.timeline.length - a.timeline.length).map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: OW.surface }}>
            <span className="text-sm font-bold w-5" style={{ color: OW.dim }}>#{i + 1}</span>
            <Avatar p={p} />
            <span className="flex-1 font-semibold truncate">{p.name}</span>
            <span className="font-bold" style={{ color: OW.secondary }}>{t('games.ohrwurm.hitsCount', { count: p.timeline.length })}</span>
            <span className="text-sm font-mono" style={{ color: OW.accent }}>{p.hooks} 🎣</span>
          </div>
        ))}
      </div>
      <div className="w-full space-y-3 mt-2">
        <motion.button whileTap={{ scale: 0.97 }} onClick={onRematch}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl h-14 font-black"
          style={{ background: `linear-gradient(135deg, ${OW.primary}, ${OW.secondary})`, color: OW.bg }}>
          <RotateCcw className="w-4 h-4" /> {t('games.ohrwurm.playAgain')}
        </motion.button>
        {!hasShellBackButton() && (
          <button onClick={onOtherGame} className="w-full py-3.5 rounded-2xl text-sm font-semibold" style={{ border: '1px solid rgba(255,255,255,0.1)', color: OW.dim }}>
            {t('games.ohrwurm.otherGame')}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/** "Spiel verlassen?" — verhindert, dass ein Zurück-Tipp die ganze Runde abbricht. */
export function LeaveDialog({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  const { t } = useTranslation();
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(4px)' }}
      onClick={onStay}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-3xl p-5 text-center"
        style={{ background: OW.surface, border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <p className="text-base font-bold mb-1" style={{ color: OW.text }}>
          {t('games.ohrwurm.leaveTitle', 'Spiel verlassen?')}
        </p>
        <p className="text-xs mb-4" style={{ color: OW.dim }}>
          {t('games.ohrwurm.leaveSub', 'Der aktuelle Spielstand geht dabei verloren.')}
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onStay}
            className="w-full py-3 rounded-2xl text-sm font-bold"
            style={{ background: OW.primary, color: '#0a0e14' }}
          >
            {t('games.ohrwurm.leaveStay', 'Weiterspielen')}
          </button>
          <button
            onClick={onLeave}
            className="w-full py-3 rounded-2xl text-sm font-semibold"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: OW.dim }}
          >
            {t('games.ohrwurm.leaveConfirm', 'Verlassen')}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Spotify-Status (sichtbar im Premium-Modus). Autorisierung ist schnell —
 * ok = Premium aktiv (Like/Playlist + Volle-Länge-Link nach dem Reveal),
 * preview = 30s-Vorschau mit Grund. Kein Connect-Button mehr.
 */
export function SpotifyStatusBar({ spotifyStatus }: { spotifyStatus: string }) {
  const { t } = useTranslation();
  const ok = spotifyStatus === 'ok';
  const connecting = spotifyStatus === 'connecting';
  const reason = spotifyStatus.startsWith('preview:') ? spotifyStatus.slice('preview:'.length) : '';
  return (
    <div className="relative z-10 px-4 py-1.5 text-[12px] font-bold flex items-center justify-center gap-2 flex-wrap"
      style={
        ok
          ? { background: 'rgba(29,185,84,0.14)', color: '#1DB954' }
          : connecting
            ? { background: 'rgba(255,210,63,0.12)', color: OW.accent }
            : { background: 'rgba(255,46,136,0.12)', color: OW.primary }
      }>
      <span className="flex items-center gap-1.5">
        {ok
          ? t('games.ohrwurm.spotifyOk')
          : connecting
            ? t('games.ohrwurm.spotifyConnecting')
            : t('games.ohrwurm.spotifyPreviewOnly', { reason: reason || t('games.ohrwurm.spotifyUnavailable') })}
      </span>
    </div>
  );
}

export function OhrwurmToast({ toast }: { toast: string | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div role="status" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full font-bold text-sm shadow-xl"
          style={{ background: OW.elevated, color: OW.text, border: `1px solid ${OW.secondary}` }}>
          {toast}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** QR-Overlay — immer per QR-Chip erreichbar (zum Scannen/Abspielen auf Spotify). */
export function QrOverlay({ qrOpen, song, onClose }: { qrOpen: boolean; song: Song | null; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {qrOpen && song && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.35, duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-4"
          >
            <QrCard song={song} />
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full text-sm font-bold"
              style={{ background: OW.surface, color: OW.text, border: '1px solid rgba(255,255,255,0.12)' }}
            >
              {t('games.ohrwurm.close')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
