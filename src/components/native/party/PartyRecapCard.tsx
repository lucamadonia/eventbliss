import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Image as ImageIcon, Loader2, Swords, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useHaptics';
import type { PartyRecap } from '@/games/party/party-recap';
import { joinNames } from '@/games/party/party-availability';
import { partyMotion, pressable } from '@/lib/party-motion';
import { playableGames } from '@/lib/playable-games';
import { cn } from '@/lib/utils';
import { SeatAvatar } from './PartySheet';
import { renderRecapPng, shareRecapImage, type RecapText } from './recap-share';

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060810]';

/** All words of the recap, in the UI language — shared by the card and the image. */
export function useRecapText(recap: PartyRecap): RecapText {
  const { t, i18n } = useTranslation();
  const name = (id: string) => t(playableGames.find(g => g.id === id)?.nameKey ?? id);
  const names = (ids: { name: string }[]) => joinNames(ids.map(p => p.name), i18n.language);
  return {
    title: t('partyPlay.recap.title', 'Abend-Rückblick'),
    date: new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(new Date(recap.dateMs)),
    gamesLine: t('partyPlay.recap.games', '{{count}} Spiele gespielt', { count: recap.gamesPlayed }),
    closestLine: recap.closestWin ? t('partyPlay.recap.closest', 'Knappster Sieg: {{name}} in {{game}} (+{{margin}})',
      { name: names(recap.closestWin.winners), game: name(recap.closestWin.gameId), margin: recap.closestWin.margin }) : null,
    mostWinsLine: recap.mostWins ? t('partyPlay.recap.mostWins', 'Meiste Siege: {{name}} ({{count}})', { name: recap.mostWins.name, count: recap.mostWins.wins }) : null,
    gameLines: recap.games.filter(g => g.winners.length).map(g => `${name(g.gameId)} – ${names(g.winners)}`),
    footer: t('partyPlay.recap.footer', 'Gefeiert mit EventBliss · event-bliss.com'),
  };
}

/** Hook for the share action of the recap image (used by the card and the closing CTA). */
export function useShareRecap(recap: PartyRecap) {
  const text = useRecapText(recap);
  const [busy, setBusy] = useState(false);
  const share = async () => {
    if (busy) return;
    setBusy(true);
    try { await shareRecapImage(await renderRecapPng(recap, text), text.title); }
    catch { /* share sheet dismissed or not available */ }
    finally { setBusy(false); }
  };
  return { share, busy, text };
}

/** "Abend-Rückblick" (§11): the evening's moments, shareable as an image. */
export function PartyRecapCard({ recap }: { recap: PartyRecap }) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const reduced = !!useReducedMotion();
  const { share, busy, text } = useShareRecap(recap);
  const wins = recap.games.filter(g => g.winners.length).slice(0, 6);
  return (
    <motion.section data-testid="party-recap" variants={partyMotion('cardEnter', reduced)} initial="initial" animate="animate"
      className="mt-5 rounded-3xl border border-white/10 bg-[#0d1020] p-4">
      {/* Compact: title + meta with the share as an icon, one highlight line, the game chips. */}
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold">{text.title}</h2>
          <p className="text-xs text-white/55">{text.date} · {text.gamesLine}</p>
        </div>
        <motion.button type="button" data-testid="recap-share" disabled={busy} {...(reduced ? {} : pressable)}
          onClick={() => { haptics.light(); void share(); }} aria-label={t('partyPlay.recap.share', 'Rückblick als Bild teilen')}
          className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/[.08] text-white active:bg-white/15 disabled:opacity-60', focus)}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ImageIcon className="h-4 w-4" aria-hidden />}
        </motion.button>
      </div>
      {(text.closestLine ?? text.mostWinsLine) && (
        <p className="mt-2 flex items-center gap-2 truncate text-sm text-[#8ff5ff]">
          {text.closestLine ? <Swords className="h-4 w-4 shrink-0" aria-hidden /> : <Trophy className="h-4 w-4 shrink-0 text-[#fbbf24]" aria-hidden />}
          <span className="truncate">{text.closestLine ?? text.mostWinsLine}</span>
        </p>
      )}
      {wins.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={t('partyPlay.recap.winners', 'Sieger pro Spiel')}>
          {wins.map((game, i) => (
            <li key={`${game.gameId}:${i}`} className="flex items-center gap-2 rounded-full bg-white/[.05] py-1 pe-3 ps-1 text-xs">
              <SeatAvatar avatar={game.winners[0].avatar} color={game.winners[0].color} size={24} />
              <span className="font-semibold text-white/85">{t(playableGames.find(g => g.id === game.gameId)?.nameKey ?? game.gameId)}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.section>
  );
}
