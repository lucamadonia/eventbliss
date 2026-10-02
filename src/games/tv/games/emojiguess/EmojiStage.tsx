import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { partyEase, playerGlow } from '@/lib/party-motion';
import { tvType } from '../../tv-tokens';
import { lu } from '../../components/tv-lobby-scale';
import TVPlayerAvatar from '../../cinema/TVPlayerAvatar';
import { riseIn, staggerChildren } from '../../cinema/scene';

export interface EmojiPlayer { id: string; name: string; color?: string; avatar?: string; score?: number; streak?: number; team?: number }
export const EG = { primary: '#df8eff', cyan: '#8ff5ff', amber: '#fbbf24', text: '#f1f3fc', dim: '#a8abb3', bg: '#060810' };

/** „Bereit“: Spotlight auf den, der gleich raet — das Raetsel ist noch verdeckt. */
export function ReadySpot({ player }: { player: EmojiPlayer | null }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  if (!player) return null;
  return (
    <motion.div className="flex flex-col items-center gap-[2.4vh] text-center" variants={staggerChildren(120)} initial="initial" animate="animate">
      <motion.div variants={riseIn(reduced)}>
        <TVPlayerAvatar id={player.id} name={player.name} avatar={player.avatar} color={player.color} size={lu(20)} active />
      </motion.div>
      <motion.h1 variants={riseIn(reduced)} className="font-black" style={{ fontSize: tvType.display, color: EG.text }}>
        {t('tvCinema.emojiGuess.upNext', '{{name}} ist dran', { name: player.name })}
      </motion.h1>
      <motion.p variants={riseIn(reduced)} className="font-semibold" style={{ fontSize: tvType.body, color: EG.dim }}>
        {t('tvCinema.emojiGuess.getReady', 'Gleich erscheinen die Emojis – alle raten mit!')}
      </motion.p>
    </motion.div>
  );
}

/**
 * Das Raetsel: Emojis auf einer leuchtenden Scheibe. Bei der Aufloesung
 * ruecken sie nach oben und die Loesung tritt darunter auf. Die Loesung kommt
 * von der Bruecke erst in `reveal` — vorher ist `answer` leer.
 */
export function EmojiPuzzle({ emojis, answer, revealed, ambient, player }: {
  emojis: string; answer: string; revealed: boolean; ambient: boolean; player: EmojiPlayer | null;
}) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const tone = revealed ? EG.cyan : player?.color || EG.primary;
  return (
    <div className="flex flex-col items-center gap-[3vh]">
      <motion.div className="relative grid place-items-center"
        animate={{ scale: revealed && !reduced ? 0.78 : 1, y: 0 }} transition={{ duration: 0.6, ease: partyEase.out }}>
        <span aria-hidden className="absolute rounded-full" style={{ width: '64vh', height: '30vh', background: `radial-gradient(ellipse closest-side, ${tone}33, transparent)`, transition: 'background 600ms ease' }} />
        <motion.span key={emojis} data-testid="tv-emoji-puzzle" className="relative select-none leading-none"
          style={{ fontSize: lu(17), letterSpacing: '0.08em', filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.5))' }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
          animate={ambient && !revealed ? { opacity: 1, scale: [1, 1.04, 1] } : { opacity: 1, scale: 1 }}
          transition={ambient && !revealed
            ? { opacity: { duration: 0.4 }, scale: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } }
            : { type: 'spring', duration: 0.6, bounce: 0.35 }}>
          {emojis || '❓'}
        </motion.span>
      </motion.div>
      <AnimatePresence mode="wait">
        {revealed && answer ? (
          <motion.div key="answer" data-testid="tv-emoji-answer" className="relative flex flex-col items-center gap-2 rounded-[50%] px-[6vw] py-[2vh] text-center"
            style={{ background: 'radial-gradient(ellipse closest-side, #060810 55%, transparent 100%)' }}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', duration: 0.65, bounce: 0.4, delay: 0.2 }}>
            <span className="font-bold" style={{ fontSize: tvType.label, color: EG.dim }}>{t('tvCinema.emojiGuess.solution', 'Die Lösung')}</span>
            <span className="max-w-[80vw] text-balance font-black leading-tight" style={{ fontSize: tvType.display, color: '#ffffff', textShadow: `0 0 50px ${EG.cyan}aa` }}>
              {answer}
            </span>
          </motion.div>
        ) : (
          <motion.div key="guess" className="flex items-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
            {player && (
              <span className="flex items-center gap-3 rounded-full py-1.5 pe-6 ps-1.5" style={{ background: '#16101f', boxShadow: playerGlow(player.color || EG.primary, 'active') }}>
                <TVPlayerAvatar id={player.id} name={player.name} avatar={player.avatar} color={player.color} size={lu(6)} />
                <span className="font-bold" style={{ fontSize: tvType.body, color: EG.text }}>
                  {t('tvCinema.emojiGuess.guessing', '{{name}} rät', { name: player.name })}
                </span>
              </span>
            )}
            <span className="font-semibold" style={{ fontSize: tvType.body, color: EG.dim }}>{t('tvCinema.emojiGuess.whatIsIt', 'Was steckt dahinter?')}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
