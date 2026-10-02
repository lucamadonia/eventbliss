import { avatarOrFallback } from '@/games/multiplayer/seat-avatar';
import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Check, Film, PawPrint, Play, Sparkles, Star } from 'lucide-react';
import type { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { useHaptics } from '@/hooks/useHaptics';
import { useInitialRoster } from '@/games/ui/useInitialRoster';
import { DEFAULT_PLAYER_SENTINEL, PLAYER_COLORS } from './whoami-config';

type T = ReturnType<typeof useTranslation>['t'];
export interface SetupSeat { id: string; name: string; color: string; avatar: string }

/**
 * Spielerliste des Setups. Party-Besetzung uebernehmen: Dieser eigene
 * Setup-Bildschirm kannte frueher nur den Online-Raum — eine laufende Party
 * begann hier mit Platzhaltern statt mit ihren echten Gaesten.
 */
export function useSetupRoster(onlinePlayers: { id: string; name: string; color?: string; avatar?: string }[] | undefined, t: T, min: number, max: number) {
  const isOnline = (onlinePlayers?.length ?? 0) > 0;
  const partyRoster = useInitialRoster({ onlinePlayers, min: 2 });
  const [players, setPlayers] = useState<SetupSeat[]>(() => {
    if (isOnline && onlinePlayers) return onlinePlayers.map((p, i) => ({ id: p.id, name: p.name, color: p.color ?? PLAYER_COLORS[i % PLAYER_COLORS.length], avatar: avatarOrFallback(p.avatar, i) }));
    if (partyRoster) return partyRoster.map((p, i) => ({ id: p.id, name: p.name, color: p.color ?? PLAYER_COLORS[i % PLAYER_COLORS.length], avatar: avatarOrFallback(p.avatar, i) }));
    // Interner Platzhalter 'Du'; PlayerSetup zeigt dafuer die uebersetzte Beschriftung.
    return [
      { id: 'p-1', name: DEFAULT_PLAYER_SENTINEL, color: PLAYER_COLORS[0], avatar: avatarOrFallback(null, 0) },
      { id: 'p-2', name: t('games.whoami.setup.playerN', { n: 2 }), color: PLAYER_COLORS[1], avatar: avatarOrFallback(null, 1) },
    ];
  });
  const seat = (idx: number, name?: string): SetupSeat => ({
    id: `p-${Date.now()}-${idx}`, name: name ?? t('games.whoami.setup.playerN', { n: idx + 1 }),
    color: PLAYER_COLORS[idx % PLAYER_COLORS.length], avatar: avatarOrFallback(null, idx),
  });
  return {
    isOnline, players,
    add: () => { if (!isOnline && players.length < max) setPlayers(prev => [...prev, seat(prev.length)]); },
    remove: (id: string) => { if (!isOnline) setPlayers(prev => prev.length > min ? prev.filter(p => p.id !== id) : prev); },
    rename: (id: string, name: string) => { if (!isOnline) setPlayers(prev => prev.map(p => p.id === id ? { ...p, name } : p)); },
    /** Liste durch importierte Namen ERSETZEN; bis `min` mit erzeugten Namen auffuellen. */
    importNames: (names: string[]) => setPlayers(() => {
      const imported: SetupSeat[] = [];
      for (const n of names) { if (imported.length >= max) break; imported.push(seat(imported.length, n)); }
      while (imported.length < min) imported.push(seat(imported.length));
      return imported;
    }),
  };
}

const CATEGORIES: Array<{ id: string; icon: ReactNode; tone: 'primary' | 'secondary' | 'tertiary' }> = [
  { id: 'prominente', icon: <Star className="w-6 h-6" />, tone: 'primary' },
  { id: 'filme', icon: <Film className="w-6 h-6" />, tone: 'primary' },
  { id: 'tiere', icon: <PawPrint className="w-6 h-6" />, tone: 'tertiary' },
  { id: 'berufe', icon: <Briefcase className="w-6 h-6" />, tone: 'secondary' },
];
const TONE = {
  primary: { ring: 'border-[#ef987e]', glow: 'shadow-[0_0_24px_rgba(150,160,165,0.22)]', iconBg: 'bg-[#ef987e]', iconFg: 'text-[#0a0e14]', text: 'text-[#ef987e]' },
  secondary: { ring: 'border-[#ff6b98]', glow: 'shadow-[0_0_24px_rgba(255,107,152,0.22)]', iconBg: 'bg-[#ff6b98]', iconFg: 'text-[#0a0e14]', text: 'text-[#ff6b98]' },
  tertiary: { ring: 'border-[#e4cec0]', glow: 'shadow-[0_0_24px_rgba(143,245,255,0.22)]', iconBg: 'bg-[#e4cec0]', iconFg: 'text-[#003f43]', text: 'text-[#e4cec0]' },
};

/** Bento-Setup: Spielerleiste (`strip`), Grenzen, Themenraster, schwebender Start. */
export function WhoAmISetup({ strip, canStart, contentError, haptics, t, onStart }: {
  strip: ReactNode; canStart: boolean; contentError?: boolean; haptics: ReturnType<typeof useHaptics>; t: T;
  onStart: (mode: string, settings: { timer: number; rounds: number }) => void;
}) {
  const [categoryId, setCategoryId] = useState('prominente');
  const [questionLimit, setQuestionLimit] = useState(20);
  const [roundLimit, setRoundLimit] = useState(1);
  const start = () => { if (!canStart) return; void haptics.celebrate(); onStart(categoryId, { timer: questionLimit, rounds: roundLimit }); };
  return (
    <div className="identity-setup relative min-h-screen overflow-hidden bg-[#0a0e14] text-[#f1f3fc]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-[#ef987e]/10 blur-[100px]" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-[#ff6b98]/10 blur-[100px]" />
      </div>
      <main className="pt-10 pb-40 px-6 max-w-2xl mx-auto">
        <div className="relative mb-10">
          <p className="text-[#ff6b98] font-bold tracking-[0.25em] text-[11px] uppercase mb-2">{t('games.whoami.setup.heading')}</p>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight drop-shadow-[0_0_8px_rgba(150,160,165,0.35)]">{t('games.whoami.setup.title')}</h2>
          <p className="text-[#a8abb3] text-sm mt-2 max-w-md">{t('games.whoami.setup.subtitle')}</p>
        </div>
        <section className="mb-10">{strip}</section>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <label className="space-y-2">{t('games.whoami.questionLimit')}<select className="block w-full bg-[#20262f] p-3 rounded-xl" value={questionLimit} onChange={e => setQuestionLimit(Number(e.target.value))}>{[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
          <label className="space-y-2">{t('games.setup.rounds')}<select className="block w-full bg-[#20262f] p-3 rounded-xl" value={roundLimit} onChange={e => setRoundLimit(Number(e.target.value))}>{[1, 2, 3, 5].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
        </div>
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-4 h-4 text-[#e4cec0]" />
            <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-[#a8abb3]">{t('games.whoami.setup.pickTheme')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => {
              const active = categoryId === cat.id;
              const tone = TONE[cat.tone];
              return (
                <button key={cat.id} type="button" onClick={() => { void haptics.select(); setCategoryId(cat.id); }}
                  className={cn('group relative overflow-hidden rounded-2xl p-5 text-left transition-all active:scale-[0.98]', active ? cn('bg-[#ef987e]/10 border-2', tone.ring, tone.glow) : 'bg-[#0f141a] border border-[#44484f]/20 hover:border-[#ef987e]/30')}>
                  <div className={cn('absolute top-0 right-0 p-3 opacity-10 transition-opacity', active ? 'opacity-25' : 'group-hover:opacity-20', tone.text)}>
                    <span className="block scale-[3] origin-top-right">{cat.icon}</span>
                  </div>
                  <div className="relative z-10">
                    <div className={cn('w-11 h-11 rounded-full flex items-center justify-center mb-3', active ? tone.iconBg : 'bg-[#20262f]', active ? tone.iconFg : tone.text)}>{cat.icon}</div>
                    <h4 className={cn('text-base font-extrabold mb-1', active ? tone.text : 'text-white group-hover:' + tone.text)}>{t(`games.whoami.setup.cat.${cat.id}.label`)}</h4>
                    <p className="text-xs text-[#a8abb3] leading-relaxed">{t(`games.whoami.setup.cat.${cat.id}.desc`)}</p>
                    {active && <div className={cn('mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest', tone.text)}><Check className="w-3 h-3" /> {t('games.whoami.setup.selected')}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </main>
      <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] inset-x-0 px-6 flex justify-center z-40 pointer-events-none">
        <motion.button type="button" onClick={start} disabled={!canStart} whileTap={canStart ? { scale: 0.97 } : {}}
          className={cn('w-full max-w-md h-16 rounded-full font-black tracking-tight text-base flex items-center justify-center gap-3 pointer-events-auto transition-all', canStart ? 'text-[#0a0e14] shadow-[0_20px_40px_rgba(150,160,165,0.35)]' : 'bg-[#20262f] text-[#44484f] cursor-not-allowed')}
          style={canStart ? { background: 'linear-gradient(90deg, #ef987e, #d779ff)' } : {}}>
          {canStart ? <>{t('games.whoami.setup.startGame')}<Play className="w-5 h-5" /></> : contentError ? t('games.whoami.setup.noContent') : t('games.whoami.setup.minPlayers')}
        </motion.button>
      </div>
    </div>
  );
}
