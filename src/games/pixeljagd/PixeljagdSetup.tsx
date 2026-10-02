/** PIXELJAGD — Setup: Besetzung, Modus, Antwortart, Kategorien, Runden. */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye } from 'lucide-react';
import { PlayerSetup, type PlayerSetupPlayer } from '../ui/PlayerSetup';
import { GameSetupBackLink } from '../ui/GameSetupBackLink';
import { useInitialRoster } from '@/games/ui/useInitialRoster';
import { PremiumImageChoiceCard } from '../ui/PremiumImageChoiceCard';
import { PIXELJAGD_THEME_ASSETS } from '../ui/premium-game-assets';
import { importPixelPlayers } from './recovery';
import { getPixelPuzzles, PIXEL_CATEGORIES, categoryLabelKey, type PixelCategory } from './pixeljagd-content';
import { PJ, MODES, type AnswerMode, type ModeId } from './pixeljagd-theme';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
export function PixeljagdSetup({ onStart, onlinePlayers, contentReady, allowText, toast }: {
  onStart: (cfg: { players: { id: string; name: string }[]; mode: ModeId; answerMode: AnswerMode; categories: PixelCategory[]; rounds: number }) => void;
  onlinePlayers?: { id: string; name: string }[];
  contentReady: boolean;
  allowText: boolean;
  toast: string | null;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
        ?? [{ id: 'p1', name: '' }, { id: 'p2', name: '' }],
  );
  const [mode, setMode] = useState<ModeId>('klassisch');
  const [answerMode, setAnswerMode] = useState<AnswerMode>('buzzer');
  const [cats, setCats] = useState<PixelCategory[]>([]);
  const [rounds, setRounds] = useState(8);
  // Einzeln oder in Gruppen. Aendert nur die Beschriftung und die
  // Vorgabenamen — gespielt wird in beiden Faellen ueber dieselbe Liste,
  // eine Gruppe ist schlicht ein Spieler mit mehreren Koepfen dahinter.
  const [teamMode, setTeamMode] = useState<'solo' | 'groups'>('solo');

  const available = useMemo(
    () => (contentReady ? getPixelPuzzles(cats.length ? cats : undefined).length : 0),
    [contentReady, cats],
  );

  const named = list.map((p, i) => ({
    id: p.id,
    name: p.name.trim()
      || (teamMode === 'groups'
        ? t('games.pixeljagd.teamN', { n: i + 1 })
        : t('games.pixeljagd.playerN', { n: i + 1 })),
  }));
  const canStart = contentReady && available > 0 && named.length >= 2;

  return (
    <div className="min-h-[100dvh]" style={{ background: PJ.bg, color: PJ.text }}>
      <main className="relative z-10 pt-14 px-5 max-w-2xl mx-auto pb-16">
        <GameSetupBackLink onClick={() => navigate('/games')} className="mb-5" style={{ color: PJ.dim }}>
          ← {t('games.pixeljagd.backToGames')}
        </GameSetupBackLink>

        <section className="relative min-h-[220px] overflow-hidden rounded-[32px] border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.36)]">
          <img
            src={PIXELJAGD_THEME_ASSETS[cats[0] ?? 'mix']}
            alt=""
            aria-hidden="true"
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-[#0b1120]/46 to-black/5" />
          <div className="relative flex min-h-[220px] flex-col justify-end p-6">
            <span className="mb-3 grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-black/35 backdrop-blur-md">
              <Eye className="w-6 h-6" style={{ color: PJ.primary }} />
            </span>
            <h1 className="text-3xl font-black text-white">{t('games.pixeljagd.title')}</h1>
            <p className="mt-1 max-w-md text-sm text-white/70">{t('games.pixeljagd.tagline')}</p>
          </div>
        </section>

        {/* Einzeln oder in Gruppen */}
        <p className="mt-6 mb-2 text-[13px] font-black" style={{ color: PJ.dim }}>
          {t('games.pixeljagd.teamMode')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(['solo', 'groups'] as const).map((m) => (
            <button key={m} onClick={() => setTeamMode(m)}
              aria-pressed={teamMode === m}
              className="p-3 rounded-2xl text-sm font-black"
              style={{
                background: teamMode === m ? PJ.secondary : PJ.surface,
                color: teamMode === m ? PJ.bg : PJ.text,
              }}>
              {m === 'solo'
                ? t('games.pixeljagd.teamModeSolo')
                : t('games.pixeljagd.teamModeGroups')}
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
            accent={PJ.primary}
            label={teamMode === 'groups'
              ? t('games.pixeljagd.groupsLabel')
              : t('games.pixeljagd.playersLabel')}
            /* Aus dem Event uebernehmen: Wer schon eine Gaesteliste gepflegt
               hat, soll sie nicht zum zweiten Mal abtippen. */
            onImportNames={(names) =>
              setList((prev) => importPixelPlayers(prev, names, index => `ev${Date.now()}-${index}`))
            }
          />
        </div>

        {/* Modus */}
        <p className="mt-7 mb-2 text-[13px] font-black" style={{ color: PJ.dim }}>
          {t('games.pixeljagd.mode')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className="p-3 rounded-2xl text-left"
              style={{
                background: mode === m.id ? PJ.primary : PJ.surface,
                color: mode === m.id ? PJ.bg : PJ.text,
              }}>
              <span className="block text-sm font-black">{t(`gameModes.pixeljagd.${m.id}.name`)}</span>
              <span className="block text-[13px] opacity-80">{t(`gameModes.pixeljagd.${m.id}.desc`)}</span>
            </button>
          ))}
        </div>

        {/* Antwortmodus */}
        <p className="mt-7 mb-2 text-[13px] font-black" style={{ color: PJ.dim }}>
          {t('games.pixeljagd.answerMode')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setAnswerMode('buzzer')}
            className="p-3 rounded-2xl text-left"
            style={{ background: answerMode === 'buzzer' ? PJ.secondary : PJ.surface, color: answerMode === 'buzzer' ? PJ.bg : PJ.text }}>
            <span className="block text-sm font-black">{t('games.pixeljagd.modeBuzzer')}</span>
            <span className="block text-[13px] opacity-80">{t('games.pixeljagd.modeBuzzerDesc')}</span>
          </button>
          <button onClick={() => allowText && setAnswerMode('text')} disabled={!allowText}
            className="p-3 rounded-2xl text-left disabled:opacity-40"
            style={{ background: answerMode === 'text' ? PJ.secondary : PJ.surface, color: answerMode === 'text' ? PJ.bg : PJ.text }}>
            <span className="block text-sm font-black">{t('games.pixeljagd.modeText')}</span>
            <span className="block text-[13px] opacity-80">
              {allowText ? t('games.pixeljagd.modeTextDesc') : t('games.pixeljagd.modeTextOnlineOnly')}
            </span>
          </button>
        </div>

        {/* Kategorien */}
        <section className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_22px_62px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-5">
          <div className="mb-4">
            <p className="text-[13px] font-black" style={{ color: PJ.primary }}>
              {t('games.pixeljagd.categoriesLabel')}
            </p>
            <p className="mt-1 text-xs" style={{ color: PJ.dim }}>
              {cats.length === 0 ? t('games.pixeljagd.allCategories') : t('games.pixeljagd.available', { count: available })}
            </p>
          </div>
          <PremiumImageChoiceCard
            title={t('games.pixeljagd.categories.mix')}
            image={PIXELJAGD_THEME_ASSETS.mix}
            selected={cats.length === 0}
            onClick={() => setCats([])}
            accent={PJ.primary}
            layout="wide"
            priority
            className="mb-3"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PIXEL_CATEGORIES.map((c) => {
              const on = cats.includes(c);
              return (
                <PremiumImageChoiceCard
                  key={c}
                  title={t(categoryLabelKey(c))}
                  image={PIXELJAGD_THEME_ASSETS[c]}
                  selected={on}
                  onClick={() => setCats((prev) => (on ? prev.filter((x) => x !== c) : [...prev, c]))}
                  accent={PJ.accent}
                />
              );
            })}
          </div>
        </section>

        {/* Runden */}
        <p className="mt-7 mb-2 text-[13px] font-black" style={{ color: PJ.dim }}>
          {t('games.pixeljagd.rounds')}: {rounds}
        </p>
        <input type="range" min={3} max={20} step={1} value={rounds}
          onChange={(e) => setRounds(Number(e.target.value))} className="w-full" style={{ accentColor: PJ.primary }} />

        {contentReady && available === 0 && (
          <div className="mt-6 rounded-2xl p-4 text-sm" style={{ background: PJ.surface, color: PJ.dim }}>
            {t('games.pixeljagd.noImagesSetup')}
          </div>
        )}

        <button
          disabled={!canStart}
          onClick={() => onStart({ players: named, mode, answerMode, categories: cats, rounds })}
          className="mt-6 w-full h-14 rounded-2xl font-black disabled:opacity-40"
          style={{ background: PJ.primary, color: PJ.bg }}
        >
          {t('games.pixeljagd.start')}
        </button>

        {toast && <p className="mt-3 text-center text-sm" style={{ color: PJ.bad }}>{toast}</p>}
      </main>
    </div>
  );
}
