import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { resolveGameRules } from '@/games/ui/game-rules';
import { playableGames } from '@/lib/playable-games';
import { tvType } from './tv-tokens';

/**
 * TVRules — die Anleitung des naechsten Spiels auf dem grossen Schirm.
 *
 * WARUM: Die Regeln standen bisher nur auf dem Telefon des Gastgebers. In
 * einer Runde von neun Leuten liest sie damit genau einer vor. Auf dem
 * Fernseher lesen alle gleichzeitig — und danach kann es losgehen.
 *
 * Die Texte existieren laengst (`gameRules.*`, 24 Spiele in 10 Sprachen);
 * hier kommt nur die Fernsehdarstellung dazu. Aufloesung und Kennungs-
 * Uebersetzung teilt sich diese Ansicht mit dem Telefon, damit beide dasselbe
 * zeigen.
 */
interface Props {
  /** Kennung aus der Registry, z.B. "wer-bin-ich". */
  gameId: string;
  /** Bereits uebersetzter Anzeigename vom Telefon. */
  gameName?: string;
}

export default function TVRules({ gameId, gameName }: Props) {
  const { t } = useTranslation();
  const rules = resolveGameRules(gameId, t as (k: string, f?: string) => string);
  const art = playableGames.find((g) => g.id === gameId)?.image ?? null;

  // Ohne Text lieber gar nichts zeigen als eine leere Seite.
  if (!rules) return null;

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#060810] px-[clamp(2rem,5vw,6rem)] py-[clamp(1.5rem,4vh,4rem)]">
      {/* Stimmung, nicht Inhalt — bewusst weit heruntergedimmt, damit die
          Schrift aus drei Metern lesbar bleibt. */}
      {art && (
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.09] blur-2xl"
          style={{ backgroundImage: `url(${art})` }}
          aria-hidden
        />
      )}

      <motion.div
        className="relative z-10 flex items-center gap-[clamp(1rem,2vw,2rem)]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {art && (
          <img
            src={art}
            alt=""
            className="h-[clamp(70px,7vw,130px)] w-[clamp(70px,7vw,130px)] shrink-0 rounded-full border-[3px] border-[#df8eff]/50 object-cover"
          />
        )}
        <div className="min-w-0">
          <div
            className="font-black uppercase tracking-[0.3em] text-[#b3a8c9]"
            style={{ fontSize: tvType.micro }}
          >
            {t('tv.remote.rules')}
          </div>
          <div className="font-black text-white" style={{ fontSize: tvType.title }}>
            {gameName || rules.title}
          </div>
        </div>
      </motion.div>

      {rules.tagline && (
        <motion.p
          className="relative z-10 mt-[clamp(0.5rem,1.5vh,1.5rem)] text-[#a8abb3]"
          style={{ fontSize: tvType.label }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          {rules.tagline}
        </motion.p>
      )}

      <div className="relative z-10 mt-[clamp(1rem,3vh,2.5rem)] flex min-h-0 flex-1 flex-col justify-center gap-[clamp(0.6rem,1.8vh,1.4rem)]">
        {rules.steps.map((step, i) => (
          <motion.div
            key={i}
            className="flex items-start gap-[clamp(0.75rem,1.6vw,1.5rem)]"
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.12, type: 'spring', stiffness: 220, damping: 24 }}
          >
            <span
              className="flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#df8eff] to-[#ff6b98] font-black text-white"
              style={{
                width: 'clamp(2.2rem,3.4vw,3.4rem)',
                height: 'clamp(2.2rem,3.4vw,3.4rem)',
                fontSize: tvType.label,
              }}
            >
              {i + 1}
            </span>
            <span className="text-[#f1f3fc]" style={{ fontSize: tvType.body }}>
              {step}
            </span>
          </motion.div>
        ))}
      </div>

      {rules.tip && (
        <motion.div
          className="relative z-10 mt-[clamp(0.75rem,2vh,2rem)] rounded-2xl border border-[#f9ca24]/30 bg-[#f9ca24]/10 px-[clamp(1rem,2vw,2rem)] py-[clamp(0.6rem,1.4vh,1.2rem)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 + rules.steps.length * 0.12, duration: 0.4 }}
        >
          <span className="text-[#f9ca24]" style={{ fontSize: tvType.label }}>
            💡 {rules.tip}
          </span>
        </motion.div>
      )}
    </div>
  );
}
