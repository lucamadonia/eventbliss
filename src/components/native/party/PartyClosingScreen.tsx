import { motion, useReducedMotion } from 'framer-motion';
import { PartyPopper, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PartyStanding } from '@/games/tv/party-types';
import { checkPop, partyMotion } from '@/lib/party-motion';
import { PartyStandingsList } from './PartyStandingsList';
import { usePartyScreenTrace } from './ui-trace';

interface Props {
  standings: PartyStanding[];
  /** This device's player, for "Du bist auf Platz 2". */
  myPlayerId: string | null;
  onStartOwn: () => void;
  onDone: () => void;
}

/** D04/T16: the party is over — own placement, final standings, one way on. */
export function PartyClosingScreen({ standings, myPlayerId, onStartOwn, onDone }: Props) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  usePartyScreenTrace('ended');
  const mine = standings.find(row => row.id === myPlayerId);
  return (
    <motion.section data-testid="party-ended-screen" role="status" aria-labelledby="closing-title" className="mx-auto max-w-md space-y-6 pt-6 text-center"
      variants={partyMotion('cardEnter', reduced)} initial="initial" animate="animate">
      <motion.div variants={reduced ? undefined : checkPop} initial="initial" animate="animate"
        className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] bg-gradient-to-br from-[#df8eff]/25 to-[#8ff5ff]/10 ring-1 ring-white/10">
        <Trophy className="h-9 w-9 text-amber-300" aria-hidden />
      </motion.div>
      <h1 id="closing-title" className="text-3xl font-black tracking-tight">{t('partyPlay.closing.title', 'Die Party ist vorbei')}</h1>
      {mine && <p data-testid="closing-placement" className="text-lg text-white/80">
        {t('partyPlay.closing.placement', 'Du bist auf Platz {{rank}} – {{points}} Punkte', { rank: mine.rank, points: mine.points })}
      </p>}
      <p className="text-white/55">{t('partyPlay.closing.tv', 'Die Siegerehrung läuft auf dem Fernseher.')}</p>
      {standings.length > 0 && <div className="text-start"><PartyStandingsList standings={standings} /></div>}
      <div className="space-y-2">
        <button type="button" onClick={onStartOwn}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#df8eff] to-[#8ff5ff] font-bold text-[#0a0e14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff]">
          <PartyPopper className="h-5 w-5" aria-hidden />{t('partyPlay.removed.startOwn', 'Eigene Party starten')}
        </button>
        <button type="button" data-testid="closing-done" onClick={onDone}
          className="min-h-12 w-full rounded-2xl text-sm font-semibold text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:bg-white/5">
          {t('partyPlay.closing.done', 'Fertig')}
        </button>
      </div>
    </motion.section>
  );
}
