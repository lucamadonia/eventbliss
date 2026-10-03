// OHRWURM — Warte-Buehne fuer Geraete, die gerade nicht dran sind (Design §9.2):
// wer hoert gerade (gross, in seiner Farbe), eine ruhige Ansage und der eigene
// Zeitstrahl als Vorschau — statt eines kleinen „Warten…“ auf leerer Flaeche.
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { SeatAvatar } from '@/components/native/party/PartySheet';
import { partyMotion, playerGlow } from '@/lib/party-motion';
import { PartyTurnRibbon, useSeatAvatar } from '../ui/PartyTurnRibbon';
import type { Participant } from './ohrwurm-engine';
import { OW } from './ohrwurm-theme';

export function OhrwurmWaitStage({ acting, mine, line }: {
  acting: Pick<Participant, 'id' | 'name' | 'avatar' | 'color'>;
  /** Eigener Platz — sein Zeitstrahl als Vorschau (fehlt beim reinen Moderator). */
  mine?: Pick<Participant, 'timeline'> | null;
  line: string;
}) {
  const { t } = useTranslation();
  const reduce = !!useReducedMotion();
  const seatAvatar = useSeatAvatar();
  const years = [...(mine?.timeline ?? [])].map((s) => s.year).sort((a, b) => a - b);
  return (
    <motion.div variants={partyMotion('cardEnter', reduce)} initial="initial" animate="animate"
      data-testid="ohrwurm-waiting" className="flex h-full flex-col items-center gap-6 pt-2 text-center">
      <PartyTurnRibbon className="max-w-md" player={acting} kind="other" line={line} />
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <motion.span className="rounded-full" style={{ boxShadow: playerGlow(acting.color, 'active') }}
          animate={reduce ? undefined : { opacity: [0.85, 1, 0.85] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
          <SeatAvatar avatar={seatAvatar(acting.avatar, acting.id)} color={acting.color} size={120} />
        </motion.span>
        <p dir="auto" className="font-game text-[clamp(1.75rem,8vw,2.5rem)] font-extrabold leading-tight text-white [text-wrap:balance]">
          {t('games.ohrwurm.partyListenClose', 'Hört gut hin')}
        </p>
      </div>
      {mine && (
        <div className="w-full max-w-md rounded-[28px] px-4 py-3 text-start" style={{ background: OW.elevated, border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
          <p className="mb-2 text-[13px] font-semibold text-white/70">{t('games.ohrwurm.partyYourTimeline', 'Dein Zeitstrahl')}</p>
          <div className="flex flex-wrap gap-2">
            {years.length ? years.map((y, i) => (
              <span key={`${y}-${i}`} className="rounded-full px-3 py-1.5 text-[13px] font-bold tabular-nums text-white" style={{ background: OW.surface }}>{y}</span>
            )) : <span className="text-[13px] text-white/60">{t('games.ohrwurm.partyTimelineEmpty', 'Noch leer – dein erster Song kommt bald.')}</span>}
          </div>
        </div>
      )}
    </motion.div>
  );
}
