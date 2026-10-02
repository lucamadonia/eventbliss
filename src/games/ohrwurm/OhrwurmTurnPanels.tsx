// OHRWURM — Zug-Ansichten: hören, einordnen, kontern, Konter einordnen.
import { motion } from 'framer-motion';
import { ChevronRight, Fish, Repeat, RotateCcw, Sparkles, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MysteryPlayer } from './MysteryPlayer';
import type { Participant } from './ohrwurm-engine';
import { OW, ROUND_SECONDS } from './ohrwurm-theme';
import { ActionChip, Avatar, MysteryChip, PhaseBanner, TimelinePlacer } from './OhrwurmParts';

export function DrawPanel({ active, previewLoading, previewUrl, isAudioPlaying, listening, timeLeft, bonusClaimed, swapUsed,
  onPlay, onStartSilent, onReplay, onToggleBonus, onSwap, onToPlace }: {
  active: Participant; previewLoading: boolean; previewUrl: string | null; isAudioPlaying: boolean; listening: boolean; timeLeft: number;
  bonusClaimed: boolean; swapUsed: boolean; onPlay: () => void; onStartSilent: () => void; onReplay: () => void;
  onToggleBonus: () => void; onSwap: () => void; onToPlace: () => void;
}) {
  const { t } = useTranslation();
  return (
    <motion.div key="draw" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center gap-6 py-4">
      <PhaseBanner
        tone="primary"
        kicker={t('games.ohrwurm.kickerPlayerTurn', { name: active.name })}
        title={t('games.ohrwurm.listenAndPlace')}
        sub={t('games.ohrwurm.drawSub')}
      />

      {/* WICHTIG: `spotifyUri` darf hier NICHT mitentscheiden. Seit die
          App-Remote-Vollwiedergabe entfernt wurde (playback.ts), wird die
          URI im Spiel nie abgespielt — sie dient nur QR/Deep-Link im
          Reveal. Nahm man sie in die Bedingung auf, rendert für die ~646
          Songs mit gebackener URI ein voll aussehender Player, der beim
          Tippen nur die Uhr startet und stumm bleibt. */}
      {(previewLoading || previewUrl) ? (
        <MysteryPlayer
          loading={previewLoading}
          hasPreview={!!previewUrl}
          isPlaying={isAudioPlaying}
          started={listening}
          timeLeft={timeLeft}
          total={ROUND_SECONDS}
          speedActive={listening && (ROUND_SECONDS - timeLeft) < 10}
          onPlay={onPlay}
        />
      ) : (
        /* Fallback: kein Hörclip → manueller Start, KEIN QR
           (QR würde beim Raten den Titel verraten — gibt es erst im Reveal).
           Hier startet der Spieler die Uhr bewusst, im Wissen, dass er
           ohne Ton schätzen muss — anders als beim früheren stummen Player. */
        <div className="flex flex-col items-center gap-4 text-center">
          {!listening ? (
            <>
              <p className="text-sm max-w-xs" style={{ color: OW.dim }}>
                {t('games.ohrwurm.noClipAvailable')}
              </p>
              <button onClick={onStartSilent}
                className="px-6 h-12 rounded-2xl font-black flex items-center gap-2"
                style={{ background: OW.primary, color: OW.bg }}>
                {t('games.ohrwurm.start60s')}
              </button>
            </>
          ) : (
            <div className="font-mono font-black text-3xl tabular-nums"
              style={{ color: timeLeft <= 10 ? '#ff5d73' : OW.text }}>
              {timeLeft}s
            </div>
          )}
        </div>
      )}

      {/* Aktionen erst nach Start sichtbar */}
      {listening && (
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {/* Sekundär-Aktionen — filigrane Chips, OBERHALB des Primär-Buttons */}
          <div role="group" aria-label={t('games.ohrwurm.actionsGroup')} className="flex items-stretch gap-2 w-full">
            <ActionChip
              icon={RotateCcw} label={t('games.ohrwurm.replay')}
              ariaLabel={t('games.ohrwurm.replayAria')}
              onClick={onReplay}
            />
            <ActionChip
              icon={Sparkles} label={bonusClaimed ? t('games.ohrwurm.bonusClaimed') : t('games.ohrwurm.bonus')} tone="accent" toggle active={bonusClaimed}
              ariaLabel={t('games.ohrwurm.bonusAria')}
              onClick={onToggleBonus}
            />
            <ActionChip
              icon={Repeat} label={swapUsed ? t('games.ohrwurm.swapped') : t('games.ohrwurm.swap')} tone="secondary"
              cost={swapUsed ? undefined : '1 🎣'}
              disabled={swapUsed || active.hooks < 1}
              ariaLabel={swapUsed ? t('games.ohrwurm.swapUsedAria') : active.hooks < 1 ? t('games.ohrwurm.swapNoHooksAria') : t('games.ohrwurm.swapAria')}
              onClick={onSwap}
            />
          </div>
          {/* Ein großer Primär-Button */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={onToPlace}
            className="w-full h-14 rounded-2xl font-black text-base flex items-center justify-center gap-2"
            style={{ background: OW.primary, color: OW.bg, boxShadow: `0 10px 30px ${OW.primary}40` }}>
            {t('games.ohrwurm.placeInTimeline')} <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

export function PlacePanel({ active, listening, timeLeft, onPlace }: { active: Participant; listening: boolean; timeLeft: number; onPlace: (slot: number) => void }) {
  const { t } = useTranslation();
  return (
    <motion.div key="place" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="flex-1 flex flex-col gap-5 py-4">
      <PhaseBanner tone="accent" kicker={t('games.ohrwurm.playerTimeline', { name: active.name })} title={t('games.ohrwurm.whereDoesItBelong')}
        sub={t('games.ohrwurm.tapTheGap')} />
      <div className="flex items-center justify-center gap-3">
        <MysteryChip />
        {listening && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-full font-mono font-black"
            style={{
              background: OW.surface,
              color: timeLeft <= 10 ? '#ff5d73' : (ROUND_SECONDS - timeLeft) < 10 ? OW.accent : OW.text,
            }}>
            {timeLeft}s
            {(ROUND_SECONDS - timeLeft) < 10 && <Zap className="w-3.5 h-3.5" style={{ color: OW.accent }} />}
          </div>
        )}
      </div>
      <TimelinePlacer timeline={active.timeline} onSelect={onPlace} accent={active.color} />
    </motion.div>
  );
}

export function CounterPanel({ active, participants, turn, mayCounter, onChoose, onNoCounter }: {
  active: Participant; participants: Participant[]; turn: number; mayCounter: (seatId: string) => boolean;
  onChoose: (pid: string) => void; onNoCounter: () => void;
}) {
  const { t } = useTranslation();
  return (
    <motion.div key="counter" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="flex-1 flex flex-col gap-5 py-4">
      <PhaseBanner tone="secondary" kicker={t('games.ohrwurm.counterWindow')} title={t('games.ohrwurm.whoWantsToCounter')}
        sub={t('games.ohrwurm.counterSub', { name: active.name })} />
      <div className="flex flex-col gap-2.5 w-full max-w-md mx-auto">
        {participants.map((p, i) => {
          if (i === turn) return null;
          // Online: each device counters for the seats it plays (guest-turns.ts).
          const canCounter = p.hooks >= 1 && mayCounter(p.id);
          return (
            <button key={p.id} onClick={() => canCounter && onChoose(p.id)} disabled={!canCounter}
              className="flex min-h-[56px] items-center gap-3 rounded-2xl px-4 py-3 text-start transition-all disabled:opacity-35"
              style={{ background: OW.surface, border: `1px solid ${canCounter ? p.color : 'transparent'}` }}>
              <Avatar p={p} />
              <span dir="auto" className="flex-1 font-bold">{p.name}</span>
              <span className="text-sm font-mono" style={{ color: OW.secondary }}>{p.hooks} 🎣</span>
              {canCounter && <Fish className="w-4 h-4" style={{ color: OW.secondary }} />}
            </button>
          );
        })}
      </div>
      <button onClick={onNoCounter}
        className="mx-auto mt-2 min-h-[48px] px-8 py-3 rounded-2xl font-bold text-sm"
        style={{ background: 'rgba(255,255,255,0.06)', color: OW.dim }}>
        {t('games.ohrwurm.noCounterReveal')}
      </button>
    </motion.div>
  );
}

export function CounterPlacePanel({ active, participants, counteringId, onCommit }: {
  active: Participant; participants: Participant[]; counteringId: string; onCommit: (slot: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <motion.div key="cplace" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="flex-1 flex flex-col gap-5 py-4">
      <PhaseBanner tone="secondary"
        kicker={t('games.ohrwurm.countering', { name: participants.find((p) => p.id === counteringId)?.name })}
        title={t('games.ohrwurm.replaceCard')}
        sub={t('games.ohrwurm.counterPlaceSub', { name: active.name })} />
      <MysteryChip />
      <TimelinePlacer timeline={active.timeline} onSelect={onCommit}
        accent={participants.find((p) => p.id === counteringId)?.color ?? OW.secondary} />
    </motion.div>
  );
}
