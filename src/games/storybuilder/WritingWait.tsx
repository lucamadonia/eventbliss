/**
 * Warte-Buehne fuer alle, die gerade nicht schreiben (Design §9.2 „Warten“):
 * der Schreibende gross in seiner Farbe statt eines ausgegrauten Eingabefelds.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { partyMotion, playerGlow } from '@/lib/party-motion';

export function WritingWait({ name, avatar, color, seconds }: { name: string; avatar: string; color: string; seconds: number }) {
  const { t } = useTranslation();
  const reduce = !!useReducedMotion();
  return (
    <motion.section
      data-testid="story-writing-wait"
      variants={partyMotion('cardEnter', reduce)}
      initial="initial"
      animate="animate"
      aria-live="polite"
      className="flex flex-1 flex-col items-center justify-center gap-5 rounded-sm px-6 py-10 text-center"
      style={{ background: `radial-gradient(circle at 50% 35%, ${color}2e 0%, transparent 65%)` }}
    >
      <span
        aria-hidden
        className="grid h-24 w-24 place-items-center rounded-full text-5xl font-black text-white"
        style={{ backgroundColor: color, boxShadow: playerGlow(color, 'active') }}
      >
        {avatar || name.slice(0, 1).toUpperCase()}
      </span>
      <p className="font-serif text-3xl leading-tight text-[#20332d] [text-wrap:balance]">
        {t('games.storybuilder.writingNow', '{{name}} schreibt gerade …', { name })}
      </p>
      <p className="text-sm font-semibold tabular-nums text-[#52605a]">
        {t('games.storybuilder.secondsLeft', 'noch {{count}} s', { count: seconds })}
      </p>
    </motion.section>
  );
}
