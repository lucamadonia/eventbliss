import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TimerOff } from 'lucide-react';
import { partyEase, playerGlow } from '@/lib/party-motion';
import { tvPanel, tvType } from '../../tv-tokens';
import { lu } from '../../components/tv-lobby-scale';
import TVPlayerAvatar from '../../cinema/TVPlayerAvatar';
import { riseIn, staggerChildren } from '../../cinema/scene';
import TVTimerRing from '../broadcast/TVTimerRing';
import { emojiAvatar } from '../broadcast/broadcast-utils';

export interface CatPlayer { id?: string; name: string; color?: string; avatar?: string; score?: number; losses?: number }
export interface SaidWord { word: string; playerId: string }

export const CAT = { primary: '#df8eff', cyan: '#8ff5ff', red: '#ff6b98', amber: '#fbbf24', text: '#f1f3fc', dim: '#a8abb3', bg: '#060810' };

/** Kategorie + optionaler Anfangsbuchstabe — die Ansage der Runde. */
export function CategoryTitle({ category, letter, big }: { category: string; letter?: string; big: boolean }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  return (
    <div className="flex flex-col items-center gap-[1.6vh] text-center">
      <span className="font-bold" style={{ fontSize: tvType.label, color: CAT.dim }}>{t('tvCinema.category.category', 'Kategorie')}</span>
      <div className="flex items-center gap-[2vw]">
        <motion.h1 key={category} className="max-w-[70vw] text-balance font-black leading-[1.02]"
          style={{ fontSize: big ? tvType.hero : tvType.display, color: '#ffffff', textShadow: `0 0 60px ${CAT.primary}88` }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: big ? 1.5 : 1.1, y: big ? 0 : 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={big && !reduced ? { type: 'spring', duration: 0.7, bounce: 0.35 } : { duration: 0.45, ease: partyEase.out }}>
          {category}
        </motion.h1>
        {letter && (
          <motion.span key={letter} data-testid="tv-category-letter" className="grid shrink-0 place-items-center rounded-[28px] font-black"
            style={{ width: big ? lu(16) : lu(10), height: big ? lu(16) : lu(10), fontSize: big ? lu(10) : lu(6), color: '#060810', background: CAT.cyan, boxShadow: `0 0 50px -6px ${CAT.cyan}` }}
            initial={reduced ? { opacity: 0 } : { opacity: 0, rotate: -20, scale: 0.4 }} animate={{ opacity: 1, rotate: 0, scale: 1 }}
            transition={{ type: 'spring', duration: 0.6, bounce: 0.45, delay: big ? 0.35 : 0 }}>
            {letter.toUpperCase()}
          </motion.span>
        )}
      </div>
    </div>
  );
}

/** Wer gerade antworten muss — gross, mit Licht in der Spielerfarbe und Uhr. */
export function ActiveSpot({ player, seconds, fraction, paused }: { player: CatPlayer | null; seconds: number | null; fraction: number; paused: boolean }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  return (
    <div className="relative flex flex-col items-center justify-center gap-[2vh]">
      <AnimatePresence mode="wait">
        {player && (
          <motion.div key={player.id ?? player.name} data-testid="tv-category-active" className="flex flex-col items-center gap-[1.6vh]"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.08, transition: { duration: 0.22, ease: partyEase.exit } }}
            transition={{ type: 'spring', duration: 0.55, bounce: 0.3 }}>
            <TVPlayerAvatar id={player.id} name={player.name} avatar={emojiAvatar(player.avatar)} color={player.color} size={lu(17)} active />
            <span className="font-black" style={{ fontSize: tvType.title, color: CAT.text }}>{player.name}</span>
            <span className="font-bold" style={{ fontSize: tvType.body, color: CAT.dim }}>{t('tvCinema.category.yourTurn', 'ist dran')}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {seconds !== null && <TVTimerRing seconds={Math.ceil(seconds)} fraction={fraction} paused={paused} size={lu(10)} />}
    </div>
  );
}

/** Die in dieser Runde genannten Begriffe als Wand aus Chips (neueste zuerst). */
export function WordWall({ words, players }: { words: SaidWord[]; players: CatPlayer[] }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const shown = [...words].reverse().slice(0, 14);
  return (
    <div className={`${tvPanel} flex max-h-full min-h-[26vh] flex-col gap-[1.6vh] self-center p-[2vw]`} data-testid="tv-category-words">
      <span className="font-bold" style={{ fontSize: tvType.label, color: CAT.text }}>
        {t('tvCinema.category.named', '{{count}} genannt', { count: words.length })}
      </span>
      {words.length === 0 ? (
        <span className="font-semibold" style={{ fontSize: tvType.body, color: CAT.dim }}>{t('tvCinema.category.noWords', 'Noch nichts genannt – wer fängt an?')}</span>
      ) : (
        <motion.div className="flex flex-wrap content-start gap-3 overflow-hidden" variants={staggerChildren(40)} initial="initial" animate="animate">
          <AnimatePresence initial={false}>
            {shown.map((w, i) => {
              const owner = players.find((p) => p.id === w.playerId);
              return (
                <motion.span key={`${w.word}-${words.length - i}`} layout={!reduced} variants={riseIn(reduced)} initial="initial" animate="animate"
                  className="flex items-center gap-3 rounded-full py-1.5 pe-5 ps-1.5"
                  style={{ background: i === 0 ? '#16101f' : 'rgba(255,255,255,0.05)', boxShadow: i === 0 && owner?.color ? playerGlow(owner.color, 'soft') : 'none' }}>
                  <TVPlayerAvatar id={owner?.id} name={owner?.name || '?'} avatar={emojiAvatar(owner?.avatar)} color={owner?.color} size={lu(4.4)} />
                  <span className="font-bold" style={{ fontSize: tvType.body, color: CAT.text }}>{w.word}</span>
                </motion.span>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

/** Rundenende: wer zu langsam war — rotes Licht, Uhr-Symbol, kein Spott. */
export function RoundEndSpot({ loser, wordCount }: { loser: CatPlayer | null; wordCount: number }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  return (
    <motion.div className="flex flex-col items-center gap-[2.4vh] text-center" variants={staggerChildren(140)} initial="initial" animate="animate">
      <motion.span variants={riseIn(reduced)} className="grid place-items-center rounded-full" style={{ width: lu(10), height: lu(10), background: `${CAT.red}22`, boxShadow: `0 0 50px -8px ${CAT.red}` }}>
        <TimerOff aria-hidden style={{ width: '52%', height: '52%', color: CAT.red }} />
      </motion.span>
      <motion.h1 variants={riseIn(reduced)} className="font-black" style={{ fontSize: tvType.display, color: CAT.text }}>
        {t('tvCinema.category.timeUp', 'Zeit abgelaufen!')}
      </motion.h1>
      {loser && (
        <motion.div variants={riseIn(reduced)} className="flex items-center gap-[1.4vw] rounded-full py-2 pe-8 ps-2" style={{ background: '#16101f', boxShadow: playerGlow(CAT.red, 'active') }}>
          <TVPlayerAvatar id={loser.id} name={loser.name} avatar={emojiAvatar(loser.avatar)} color={loser.color} size={lu(9)} />
          <span className="font-black" style={{ fontSize: tvType.title, color: CAT.text }}>{loser.name}</span>
        </motion.div>
      )}
      <motion.p variants={riseIn(reduced)} className="font-semibold" style={{ fontSize: tvType.body, color: CAT.dim }}>
        {t('tvCinema.category.wordsThisRound', '{{count}} Begriffe in dieser Runde', { count: wordCount })}
      </motion.p>
    </motion.div>
  );
}
