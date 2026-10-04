/**
 * SCHNELLZEICHNER — Bildschirm-Bausteine (aus QuickDrawGame.tsx ausgelagert,
 * damit das Spiel unter 500 Zeilen bleibt): Setup, Ratenliste, Warte-Buehne
 * und Spielerlicht (Design §9.1: „Deine Farbe ist dein Licht“).
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check, Pencil, Play, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { playerGlow } from '@/lib/party-motion';
import { hasShellBackButton } from '@/games/ui/shell-back';
import { StageHeader } from '../ui/GameStage';
import { PlayerSetup } from '../ui/PlayerSetup';
import { getPlayerInitial } from '../ui/PlayerAvatars';

export type QuickDrawMode = 'classic' | 'speed' | 'blind';
export const QUICKDRAW_MODE_IDS: QuickDrawMode[] = ['classic', 'speed', 'blind'];

export interface QuickDrawPlayer {
  id: string;
  name: string;
  color: string;
  score: number;
}

export interface SetupScreenProps {
  players: QuickDrawPlayer[];
  locked: boolean;
  importNames?: (names: string[]) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
  mode: QuickDrawMode;
  onMode: (mode: QuickDrawMode) => void;
  totalRounds: number;
  onRounds: (rounds: number) => void;
  onStart: () => void;
}

export function SetupScreen(props: SetupScreenProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { players, mode, totalRounds } = props;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col py-3 max-w-3xl mx-auto w-full">
      <StageHeader title={t('gameRules.quickdraw.title')} subtitle={t('games.quickdraw.tagline')} />
      <div className="mb-6">
        <PlayerSetup locked={props.locked}
          players={players.map((p) => ({ id: p.id, name: p.name, color: p.color }))}
          onAdd={props.onAdd} onRemove={props.onRemove} onRename={props.onRename}
          onImportNames={props.importNames}
          min={2} max={10} accent="#77cbbb" label={t('games.quickdraw.playerLabel')} />
      </div>
      <section className="space-y-3 mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-white/65">{t('games.quickdraw.modeLabel')}</h2>
        <div className="space-y-2">
          {QUICKDRAW_MODE_IDS.map(id => (
            <button key={id} onClick={() => props.onMode(id)} aria-pressed={mode === id}
              className={cn('w-full flex items-center gap-3 p-4 rounded-[1rem] border-2 transition-colors text-left',
                mode === id ? 'border-[#77cbbb] bg-[#77cbbb]/10 text-white' : 'border-gray-700 bg-[#1b2028] text-gray-300 hover:border-gray-600')}>
              <Pencil className={cn('w-5 h-5', mode === id ? 'text-[#77cbbb]' : 'text-white/60')} />
              <div>
                <div className="text-sm font-semibold">{t(`gameModes.quickdraw.${id}.name`)}</div>
                <div className="text-xs text-white/65">{t(`gameModes.quickdraw.${id}.desc`)}</div>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section className="mb-6">
        <div className="bg-[#1b2028] border border-[#44484f]/20 rounded-[1rem] p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/65">{t('games.setup.rounds')}</span><span className="text-white font-bold">{totalRounds}</span>
          </div>
          <input aria-label={t('games.setup.rounds')} type="range" min={3} max={20} step={1} value={totalRounds}
            onChange={e => props.onRounds(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-gray-700 accent-[#77cbbb] cursor-pointer" />
        </div>
      </section>
      <div className="sticky bottom-0 mt-6 border-t border-white/10 bg-[var(--stage-bg)] py-4 z-20">
        <div className="w-full mx-auto space-y-3">
          <motion.button whileTap={{ scale: 0.97 }} onClick={props.onStart}
            className="w-full py-4 rounded-full bg-[#77cbbb] text-[#14221a] text-base font-extrabold font-sans uppercase tracking-wide  flex items-center justify-center gap-2">
            <Play className="w-5 h-5" /> {t('games.setup.startGame')}</motion.button>
          {/* Nur im Web. In der App macht das der FloatingBackButton. */}
          {!hasShellBackButton() && (
            <button onClick={() => navigate('/games')} className="w-full py-3 text-white/60 text-sm hover:text-white/50 transition">{t('games.quickdraw.back')}</button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function GuessList({ guesses, players }: { guesses: { playerId: string; guess: string; correct: boolean }[]; players: QuickDrawPlayer[] }) {
  return (
    <div className="w-full divide-y divide-white/15">
      {guesses.map((g, i) => {
        const p = players.find(x => x.id === g.playerId);
        return (
          <div key={i} className="flex flex-wrap items-center gap-3 py-4">
            {g.correct ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
            <span className="text-white/50 text-sm">{p?.name}:</span>
            <span className={cn('font-semibold text-sm', g.correct ? 'text-emerald-300' : 'text-white/60')}>{g.guess}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Spielerlicht: radialer Verlauf (18 %) in der Farbe dessen, der dran ist. */
export function TurnLight({ color }: { color?: string }) {
  if (!color) return null;
  return <div aria-hidden className="pointer-events-none fixed inset-0 -z-0" style={{ background: `radial-gradient(circle at 50% 22%, ${color}2e 0%, transparent 62%)` }} />;
}

/**
 * Warte-Buehne fuer alle, die gerade nicht dran sind (Design §9.2 „Warten“):
 * Avatar des Aktiven gross mit Glow, wer dran ist, „Schau auf den Fernseher“.
 */
export function WaitingStage({ name, color, line, tvHint }: { name: string; color: string; line: string; tvHint?: boolean }) {
  const { t } = useTranslation();
  const reduce = !!useReducedMotion();
  return (
    <div data-testid="quickdraw-waiting" className="mx-auto flex min-h-[60dvh] w-full max-w-md flex-col items-center justify-center gap-5 text-center">
      <motion.div
        className="grid h-28 w-28 place-items-center rounded-full text-4xl font-black text-white"
        style={{ backgroundColor: color, boxShadow: playerGlow(color, 'active') }}
        animate={reduce ? undefined : { opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {getPlayerInitial(name)}
      </motion.div>
      <p className="font-game font-black leading-tight" style={{ fontSize: 'clamp(2.25rem, 10vw, 3.5rem)' }}>{name}</p>
      <p className="text-base font-medium text-white/80">{line}</p>
      {tvHint && <p className="text-[0.8125rem] font-semibold text-white/55">{t('games.quickdraw.lookAtTv', '👀 Schau auf den Fernseher')}</p>}
    </div>
  );
}

export interface GuessPanelProps {
  drawingDataURL: string | null;
  guesser?: { name: string; color: string };
  value: string;
  onChange: (value: string) => void;
  canGuess: boolean;
  canPass: boolean;
  onGuess: () => void;
  onPass: () => void;
  seconds: number;
}

/** Raten: Bild als Buehne, darunter wer dran ist (in seiner Farbe) und die Eingabe in der Daumenzone. */
export function GuessPanel(props: GuessPanelProps) {
  const { t } = useTranslation();
  const color = props.guesser?.color ?? '#77cbbb';
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="relative flex-1 flex flex-col items-center gap-5 px-4 py-6 max-w-3xl mx-auto w-full">
      <div className="px-4 py-1.5 rounded-full bg-[#1b2028] border border-[#44484f]/20">
        <span className="text-xs font-bold uppercase tracking-widest text-[#77cbbb]">{t('games.quickdraw.guessingPhase')}</span>
      </div>
      {props.drawingDataURL && (
        <div className="w-full max-w-2xl aspect-square border-[12px] border-[#f7f2e6] overflow-hidden bg-white shadow-lg">
          <img src={props.drawingDataURL} alt={t('games.quickdraw.drawingAlt')} className="w-full h-full object-contain" />
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: color, boxShadow: playerGlow(color, 'active') }}>{getPlayerInitial(props.guesser?.name ?? '')}</div>
        <span className="text-lg font-bold text-white">{t('games.quickdraw.playerGuesses', { name: props.guesser?.name })}</span>
      </div>
      <div className="w-full flex gap-2">
        <input type="text" data-testid="quickdraw-guess-input" value={props.value} onChange={e => props.onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && props.canGuess && props.value.trim() && props.onGuess()}
          disabled={!props.canGuess} placeholder={t('games.quickdraw.guessPlaceholder')} className="min-w-0 flex-1 bg-[#1b2028] border border-[#44484f]/20 rounded-xl px-4 py-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[#77cbbb]/50" />
        <motion.button data-testid="quickdraw-guess-submit" whileTap={{ scale: 0.95 }} disabled={!props.canGuess || !props.value.trim()} onClick={props.onGuess}
          className="min-h-[44px] px-5 py-3 rounded-xl bg-[#77cbbb] text-[#14221a] font-bold">OK</motion.button>
      </div>
      <div className="flex items-center gap-4"><span className="tabular-nums" aria-live="polite">{props.seconds}s</span><button data-testid="quickdraw-pass" className="min-h-[44px] rounded-xl border border-white/20 px-5 py-3 disabled:opacity-40" disabled={!props.canPass} onClick={props.onPass}>{t('games.quickdraw.pass', { defaultValue: 'Pass' })}</button></div>
    </motion.div>
  );
}
