import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CloudRain, Target, TrendingUp, Trophy, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { partyEase } from '@/lib/party-motion';
import TVPlayerAvatar from '../cinema/TVPlayerAvatar';
import { lu } from './tv-lobby-scale';
import type { PartyAward, PartyAwardKey } from '../partyAwards';
import type { PartyStanding } from '../party-types';

const AWARD_META: Record<PartyAwardKey, { icon: LucideIcon; color: string }> = {
  comeback: { icon: TrendingUp, color: '#26E0C4' },
  mostWins: { icon: Trophy, color: '#FFD23F' },
  consistency: { icon: Target, color: '#8ff5ff' },
  bestGame: { icon: Zap, color: '#df8eff' },
  unlucky: { icon: CloudRain, color: '#ff6b98' },
};

const AWARD_TITLE_DE: Record<PartyAwardKey, string> = {
  comeback: 'Comeback des Abends',
  mostWins: 'Seriensieger',
  consistency: 'Konstanz-König',
  bestGame: 'Bestleistung des Abends',
  unlucky: 'Pechvogel',
};

/** Eine Nebenauszeichnung der Siegerehrung: Titel in Satzschreibung, Spieler als Kugel. */
export default function TVFinaleAward({ award, player, index }: { award: PartyAward; player: PartyStanding; index: number }) {
  const { t, i18n } = useTranslation();
  const meta = AWARD_META[award.key];
  const Icon = meta.icon;

  const detail = (() => {
    switch (award.key) {
      case 'comeback':
        return t('tv.partyNight.award.comeback.detail', 'Von Platz {{from}} auf Platz {{to}}', { from: award.from, to: award.to });
      case 'mostWins':
        return t('tv.partyNight.award.mostWins.detail', '{{n}} Siege', { n: award.value });
      case 'consistency':
        return t('tv.partyNight.award.consistency.detail', 'Ø Platz {{value}}', {
          value: award.value.toLocaleString(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
        });
      case 'bestGame':
        return t('tv.partyNight.award.bestGame.detail', 'Rekord: {{value}} Punkte in {{game}}', { value: award.value, game: award.gameName ?? '' });
      case 'unlucky':
      default:
        return t('tv.partyNight.award.unlucky.detail', '{{n}}× Letzter', { n: award.value });
    }
  })();

  return (
    <motion.div
      data-testid={`tv-finale-award-${award.key}`}
      className="relative flex items-center overflow-hidden rounded-[1.4rem] border bg-white/[0.04]"
      style={{ gap: lu(1.6), padding: `${lu(1.2)} ${lu(1.6)}`, borderColor: `${meta.color}3a`, boxShadow: `inset 0 1px 0 rgba(255,255,255,.07), 0 18px 46px -38px ${meta.color}` }}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: partyEase.out, delay: 0.08 + index * 0.12 }}
    >
      <span className="absolute inset-y-[20%] left-0 w-[3px] rounded-full" style={{ background: meta.color, boxShadow: `0 0 14px ${meta.color}` }} aria-hidden />
      <div className="relative shrink-0">
        <TVPlayerAvatar id={player.id} name={player.name} avatar={player.avatar} color={player.color} size={lu(5.2)} />
        <span className="absolute -right-1 -bottom-1 grid place-items-center rounded-full" style={{ width: lu(2.4), height: lu(2.4), background: '#0d0915', border: `1.5px solid ${meta.color}`, color: meta.color }}>
          <Icon style={{ width: '58%', height: '58%' }} strokeWidth={2.6} aria-hidden />
        </span>
      </div>
      <div className="min-w-0 flex flex-col leading-tight" style={{ gap: lu(0.3) }}>
        <span className="font-extrabold truncate" style={{ fontSize: lu(1.9), color: meta.color }}>
          {t(`tv.partyNight.award.${award.key}.title`, AWARD_TITLE_DE[award.key])}
        </span>
        <span className="font-black text-white truncate" style={{ fontSize: lu(2.4) }}>{player.name}</span>
        <span className="font-semibold truncate" style={{ fontSize: lu(1.8), color: '#c9bfdc' }}>{detail}</span>
      </div>
    </motion.div>
  );
}
