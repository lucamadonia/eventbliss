/**
 * NAH DRAN — Einrichtung (Spieler/Gruppen, Modus, Kategorien, Runden).
 */
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Target } from 'lucide-react';
import { PlayerSetup, type PlayerSetupPlayer } from '../ui/PlayerSetup';
import { GameSetupBackLink } from '../ui/GameSetupBackLink';
import { useInitialRoster } from '@/games/ui/useInitialRoster';
import { PremiumImageChoiceCard } from '../ui/PremiumImageChoiceCard';
import { CLOSE_ENOUGH_THEME_ASSETS } from '../ui/premium-game-assets';
import { compactWords } from './number-format';
import { CloseEnoughAtmosphere } from './CloseEnoughAtmosphere';
import { categoryLabelKey, CE_CATEGORIES, type CeCategory, type CeQuestion } from './closeenough-content';
import { CE, MODES, type ModeId } from './ce-theme';

// ===========================================================================
// Einrichtung
// ===========================================================================

export function CloseEnoughSetup({
  onStart,
  onlinePlayers,
  pool,
  contentReady,
  toast,
}: {
  onStart: (cfg: {
    players: { id: string; name: string }[];
    mode: ModeId;
    categories: CeCategory[];
    rounds: number;
  }) => void;
  onlinePlayers?: { id: string; name: string }[];
  pool: CeQuestion[];
  contentReady: boolean;
  toast: string | null;
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = (i18n.language || 'de').split('-')[0];

  /**
   * Party-Besetzung uebernehmen. Dieser eigene Setup-Bildschirm kannte bisher
   * nur den Online-Raum — eine laufende Party begann hier mit Platzhaltern
   * statt mit ihren echten Gaesten.
   */
  const partyRoster = useInitialRoster({ onlinePlayers, min: 2 });

  const [list, setList] = useState<PlayerSetupPlayer[]>(
    onlinePlayers?.length
      ? onlinePlayers.map((p) => ({ id: p.id, name: p.name, readOnly: true }))
      : partyRoster?.map((p) => ({ id: p.id, name: p.name }))
        ?? [
          { id: 'p1', name: '' },
          { id: 'p2', name: '' },
        ],
  );
  const [mode, setMode] = useState<ModeId>('klassisch');
  const [cats, setCats] = useState<CeCategory[]>([]);
  const [rounds, setRounds] = useState(7);
  // Einzeln oder in Gruppen. Aendert nur Beschriftung und Vorgabenamen —
  // gespielt wird in beiden Faellen ueber dieselbe Liste, eine Gruppe ist
  // schlicht ein Spieler mit mehreren Koepfen dahinter.
  const [teamMode, setTeamMode] = useState<'solo' | 'groups'>('solo');

  /** Wie viele Fragen je Kategorie da sind — leere Kategorien bleiben draußen. */
  const perCategory = useMemo(() => {
    const c: Record<string, number> = {};
    for (const q of pool) c[q.category] = (c[q.category] ?? 0) + 1;
    return c;
  }, [pool]);

  const available = useMemo(
    () => (cats.length ? pool.filter((q) => cats.includes(q.category)).length : pool.length),
    [pool, cats],
  );

  const named = list.map((p, i) => ({
    id: p.id,
    name:
      p.name.trim() ||
      (teamMode === 'groups'
        ? t('games.closeenough.teamN', { n: i + 1 })
        : t('games.closeenough.playerN', { n: i + 1 })),
  }));
  const canStart = contentReady && available > 0 && named.length >= 2;

  return (
    <div className="min-h-[100dvh] relative" style={{ background: CE.bg, color: CE.text }}>
      <CloseEnoughAtmosphere warm={CE.accent} cool={CE.truth} />

      <main className="relative z-10 pt-14 px-5 max-w-2xl mx-auto pb-16">
        <GameSetupBackLink
          onClick={() => navigate('/games')}
          className="mb-5"
          style={{ color: CE.dim }}
        >
          ← {t('games.closeenough.backToGames')}
        </GameSetupBackLink>

        <motion.section
          className="relative min-h-[220px] overflow-hidden rounded-[32px] border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.36)]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
          <img
            src={CLOSE_ENOUGH_THEME_ASSETS[cats[0] ?? 'mix']}
            alt=""
            aria-hidden="true"
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-[#0b1120]/48 to-black/5" />
          <div className="relative flex min-h-[220px] flex-col justify-end p-6">
            <motion.span
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              className="mb-3 grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-black/35 backdrop-blur-md"
            >
              <Target className="w-6 h-6" style={{ color: CE.accent }} />
            </motion.span>
            <h1 className="text-3xl font-black text-white">{t('games.closeenough.title')}</h1>
            <p className="mt-1 max-w-md text-sm text-white/70">{t('games.closeenough.tagline')}</p>
          </div>
        </motion.section>

        <motion.h1
          className="hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
          {/* Das Zielsymbol atmet — ein einziges bewegtes Element im Kopf
              reicht, damit die Seite lebendig wirkt statt bloss dunkel. */}
          <motion.span
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex"
          >
            <Target className="w-7 h-7" style={{ color: CE.accent }} />
          </motion.span>
          {t('games.closeenough.title')}
        </motion.h1>
        <motion.p
          className="hidden"
          style={{ color: CE.dim }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
        >
          {t('games.closeenough.tagline')}
        </motion.p>

        {/* Einzeln oder in Gruppen */}
        <p
          className="mt-7 mb-2 text-[13px] font-black"
          style={{ color: CE.dim }}
        >
          {t('games.closeenough.teamMode')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(['solo', 'groups'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setTeamMode(m)}
              aria-pressed={teamMode === m}
              className="p-3 rounded-2xl text-sm font-black transition-colors"
              style={{
                background: teamMode === m ? CE.truth : CE.surface,
                color: teamMode === m ? CE.bg : CE.text,
              }}
            >
              {m === 'solo'
                ? t('games.closeenough.teamModeSolo')
                : t('games.closeenough.teamModeGroups')}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <PlayerSetup
            players={list}
            onAdd={() => setList((p) => [...p, { id: `p${Date.now()}`, name: '' }])}
            onRemove={(id) => setList((p) => p.filter((x) => x.id !== id))}
            onRename={(id, name) => setList((p) => p.map((x) => (x.id === id ? { ...x, name } : x)))}
            min={2}
            max={8}
            accent={CE.accent}
            label={
              teamMode === 'groups'
                ? t('games.closeenough.groupsLabel')
                : t('games.closeenough.playersLabel')
            }
            /* Aus dem Event uebernehmen: Wer schon eine Gaesteliste gepflegt
               hat, soll sie nicht ein zweites Mal abtippen. */
            onImportNames={(names) =>
              setList((prev) => {
                const room = Math.max(0, 8 - prev.length);
                const fresh = names.slice(0, room).map((n, i) => ({
                  id: `ev${Date.now()}-${i}`,
                  name: n,
                }));
                // Leere Platzhalterzeilen zuerst auffuellen, sonst stehen
                // „Spieler 1" und „Spieler 2" leer daneben.
                const filled = prev.slice();
                let take = 0;
                for (let i = 0; i < filled.length && take < fresh.length; i++) {
                  if (!filled[i].name.trim() && !filled[i].readOnly) {
                    filled[i] = { ...filled[i], name: fresh[take].name };
                    take++;
                  }
                }
                return [...filled, ...fresh.slice(take)].slice(0, 8);
              })
            }
          />
        </div>

        {/* Modus */}
        <p
          className="mt-7 mb-2 text-[13px] font-black"
          style={{ color: CE.dim }}
        >
          {t('games.closeenough.mode')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className="p-3 rounded-2xl text-left"
              style={{
                background: mode === m.id ? CE.accent : CE.surface,
                color: mode === m.id ? CE.bg : CE.text,
              }}
            >
              <span className="block text-sm font-black">
                {t(`gameModes.closeenough.${m.id}.name`)}
              </span>
              <span className="block text-[13px] opacity-80">
                {t(`gameModes.closeenough.${m.id}.desc`)}
              </span>
            </button>
          ))}
        </div>

        {/* Kategorien */}
        <section className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_22px_62px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-5">
          <div className="mb-4">
            <p className="text-[13px] font-black" style={{ color: CE.accent }}>
              {t('games.closeenough.categoriesLabel')}
            </p>
            <p className="mt-1 text-xs" style={{ color: CE.dim }}>
              {!contentReady
                ? t('games.closeenough.loading')
                : cats.length === 0
                  ? t('games.closeenough.allCategories', { count: available })
                  : t('games.closeenough.available', { count: available })}
            </p>
          </div>
          <PremiumImageChoiceCard
            title={t('games.closeenough.categories.mix')}
            image={CLOSE_ENOUGH_THEME_ASSETS.mix}
            selected={cats.length === 0}
            onClick={() => setCats([])}
            accent={CE.accent}
            layout="wide"
            priority
            className="mb-3"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CE_CATEGORIES.map((c) => {
              const count = perCategory[c] ?? 0;
              // Empty categories stay unavailable even though their artwork exists.
              if (contentReady && count === 0) return null;
              const on = cats.includes(c);
              return (
                <PremiumImageChoiceCard
                  key={c}
                  title={t(categoryLabelKey(c))}
                  subtitle={contentReady ? t('games.closeenough.available', { count }) : undefined}
                  image={CLOSE_ENOUGH_THEME_ASSETS[c]}
                  selected={on}
                  onClick={() => setCats((prev) => (on ? prev.filter((x) => x !== c) : [...prev, c]))}
                  accent={CE.truth}
                />
              );
            })}
          </div>
        </section>

        {/* Runden */}
        <p
          className="mt-7 mb-2 text-[13px] font-black"
          style={{ color: CE.dim }}
        >
          {t('games.closeenough.rounds')}: {rounds}
        </p>
        <input
          type="range"
          min={3}
          max={15}
          step={1}
          value={rounds}
          onChange={(e) => setRounds(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: CE.accent }}
        />

        {contentReady && available === 0 && (
          <div
            className="mt-6 rounded-2xl p-4 text-sm"
            style={{ background: CE.surface, color: CE.dim }}
          >
            {t('games.closeenough.noQuestionsSetup')}
          </div>
        )}

        {/* Beispiel für die Wortform, damit die Eingabefläche keine Überraschung
            ist: so groß wird die eigene Zahl später angezeigt. */}
        <p className="mt-6 text-[13px] text-center" style={{ color: CE.dim }}>
          {t('games.closeenough.wordFormHint', { example: compactWords(2_500_000, lang) })}
        </p>

        <button
          disabled={!canStart}
          onClick={() => onStart({ players: named, mode, categories: cats, rounds })}
          className="mt-4 w-full h-14 rounded-2xl font-black disabled:opacity-40"
          style={{ background: CE.accent, color: CE.bg }}
        >
          {t('games.closeenough.start')}
        </button>

        {toast && (
          <p className="mt-3 text-center text-sm" style={{ color: CE.bad }}>
            {toast}
          </p>
        )}
      </main>
    </div>
  );
}
