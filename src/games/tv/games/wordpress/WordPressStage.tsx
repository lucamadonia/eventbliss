import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { partyEase, playerGlow } from '@/lib/party-motion';
import { spring } from '@/lib/motion';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import TVPlayerAvatar from '../../cinema/TVPlayerAvatar';
import { lu } from '../../components/tv-lobby-scale';
import { tvPanelRaised, tvType } from '../../tv-tokens';
import { WP, accuracyOf, emojiOnly, type WPPlayer } from './wp-tv';

/**
 * Laufender Zug — eine durchgehende Szene. Links wer tippt (Avatar, Live-
 * Punkte, Combo), rechts das Wort als Held mit Regel und Fortschritt.
 * Spielerwechsel animieren im Panel (Schluessel = Spieler), das Wort per
 * Schluessel = Wortindex. Stroop: Wort auf heller Karte, damit die Tinten-
 * farbe (die Regel) neutral lesbar bleibt.
 */
export default function WordPressStage({ player, playerKey, color, score, combo, word, wordKey, wordColor, stroop, rule, wordIndex, wordsPerTurn }: {
  player: WPPlayer | undefined; playerKey: string; color: string; score: number; combo: number;
  word: string; wordKey: string; wordColor: string; stroop: boolean; rule: string; wordIndex: number; wordsPerTurn: number;
}) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();
  const reduced = !!useReducedMotion();
  const accuracy = accuracyOf(player);
  const progress = Math.max(0, Math.min(1, wordsPerTurn ? wordIndex / wordsPerTurn : 0));

  return (
    <div className="grid h-full w-full grid-cols-[minmax(0,1fr)_minmax(0,2.3fr)] items-stretch" style={{ gap: lu(4) }}>
      {/* Wer tippt gerade */}
      <div className={`${tvPanelRaised} relative flex flex-col items-center justify-center overflow-hidden text-center`} style={{ gap: lu(2.2), padding: lu(3), boxShadow: playerGlow(color, 'active') }}>
        <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 90% 55% at 50% 25%, ${color}2e, transparent 70%)` }} />
        <AnimatePresence mode="wait">
          <motion.div key={playerKey} className="relative flex flex-col items-center" style={{ gap: lu(1.6) }}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -24, scale: 0.94, transition: { duration: 0.22, ease: partyEase.exit } }}
            transition={{ duration: 0.5, ease: partyEase.out }}>
            <span className="font-semibold" style={{ fontSize: tvType.label, color: WP.dim }}>{t('tv.nowPlaying', 'Jetzt dran')}</span>
            <TVPlayerAvatar id={player?.id} name={player?.name || '?'} avatar={emojiOnly(player?.avatar)} color={color} size={lu(14)} active />
            <span className="max-w-full truncate font-black leading-tight" style={{ fontSize: tvType.title, color: '#fff' }}>{player?.name || ''}</span>
          </motion.div>
        </AnimatePresence>
        <motion.span key={score} className="relative font-black tabular-nums leading-none" style={{ fontSize: tvType.display, color: '#fff', textShadow: `0 0 36px ${WP.secondary}88` }}
          initial={reduced ? { opacity: 0.5 } : { scale: 1.2 }} animate={reduced ? { opacity: 1 } : { scale: 1 }} transition={spring.bouncy}>
          {score}
        </motion.span>
        <div className="relative flex min-h-[1.6em] items-center" style={{ fontSize: tvType.body }}>
          <AnimatePresence>
            {combo > 0 && (
              <motion.span key="combo" className="flex items-center gap-2 rounded-full px-5 py-1.5 font-black"
                style={{ color: '#fff', background: `${WP.accent}2e`, boxShadow: `inset 0 0 0 1.5px ${WP.accent}88` }}
                initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={spring.bouncy}>
                <motion.span aria-hidden animate={ambient ? { scale: [1, 1.25, 1] } : { scale: 1 }} transition={ambient ? { duration: 0.6, repeat: Infinity, ease: partyEase.inOut } : { duration: 0.2 }}>🔥</motion.span>
                {t('tvCinema.wordpress.combo', '{{count}}× Combo', { count: combo })}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {accuracy !== null && (
          <span className="relative font-semibold tabular-nums" style={{ fontSize: tvType.label, color: WP.dim }}>
            {t('tvCinema.wordpress.accuracy', '{{pct}} % Treffer', { pct: accuracy })}
          </span>
        )}
      </div>

      {/* Das Wort */}
      <div className="flex min-w-0 flex-col items-center justify-center" style={{ gap: lu(3.4) }}>
        <div className="grid w-full place-items-center" style={{ minHeight: '28vh' }}>
          <AnimatePresence mode="wait">
            <motion.div key={wordKey}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.72, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.12 } }} transition={spring.game}
              className="max-w-full break-words px-4 text-center font-black leading-none"
              style={{ fontSize: tvType.hero, color: wordColor, ...(stroop ? { background: '#eee9da', padding: `${lu(2.4)} ${lu(4.4)}`, borderRadius: lu(3), boxShadow: '0 30px 80px -30px rgba(0,0,0,0.8)' } : { textShadow: `0 0 60px ${wordColor}55` }) }}>
              {word || '…'}
            </motion.div>
          </AnimatePresence>
        </div>
        <p className="max-w-[30ch] text-center font-bold leading-snug" style={{ fontSize: tvType.title, color: WP.text }}>{rule}</p>
        <div className="flex w-full max-w-[min(40vw,720px)] flex-col items-center" style={{ gap: lu(1.2) }}>
          <div className="h-3 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div className="h-full w-full origin-left rounded-full" style={{ background: `linear-gradient(90deg, ${WP.primary}, ${WP.secondary})` }}
              animate={{ scaleX: progress }} transition={{ duration: 0.3, ease: partyEase.out }} />
          </div>
          <span className="font-semibold tabular-nums" style={{ fontSize: tvType.label, color: WP.dim }}>
            {t('tvCinema.wordpress.progress', 'Wort {{n}} von {{total}}', { n: Math.min(wordIndex, wordsPerTurn), total: wordsPerTurn })}
          </span>
        </div>
      </div>
    </div>
  );
}
