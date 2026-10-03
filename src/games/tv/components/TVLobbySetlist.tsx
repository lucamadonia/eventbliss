import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { partyEase } from '@/lib/party-motion';
import { playableGames } from '@/lib/playable-games';
import { tvPanel } from '../tv-tokens';
import { LOBBY_ACCENTS, lu } from './tv-lobby-scale';
import { buildSetlist, type SetlistRow } from './setlist-model';
import type { PartyPlaylistItem } from '../party-types';

const AMBER = '#fbbf24';
const range = (id: string) => {
  const g = playableGames.find((game) => game.id === id);
  return g ? { min: g.minPlayers, max: g.maxPlayers } : null;
};

function Art({ gameId, size, dim }: { gameId: string; size: string; dim: boolean }) {
  const game = playableGames.find((g) => g.id === gameId);
  return (
    <span className="relative shrink-0 overflow-hidden rounded-2xl" style={{ width: size, height: size, opacity: dim ? 0.55 : 1, boxShadow: '0 10px 30px -14px rgba(0,0,0,.9)' }}>
      <span aria-hidden className={`absolute inset-0 bg-gradient-to-br ${game?.gradient ?? 'from-fuchsia-500 to-cyan-400'}`} />
      {game?.image && <img src={game.image} alt="" loading="eager" decoding="async" className="relative h-full w-full object-cover" />}
    </span>
  );
}

function Row({ row, index }: { row: SetlistRow; index: number }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const next = row.state === 'next';
  const done = row.state === 'done';
  const hint = done
    ? { text: t('tvLobby.setlist.played', 'Gespielt'), color: 'rgba(255,255,255,.55)' }
    : row.fit === 'tooFew'
      ? { text: t('tvLobby.setlist.tooFew', 'Ab {{count}} Spielern', { count: row.min }), color: AMBER }
      : row.fit === 'tooMany'
        ? { text: t('tvLobby.setlist.tooMany', 'Höchstens {{count}} Spieler', { count: row.max }), color: AMBER }
        : row.fit === 'ok'
          ? { text: t('tvLobby.playerRange', '{{min}}–{{max}} Spieler', { min: row.min, max: row.max }), color: 'rgba(255,255,255,.62)' }
          : null;
  return (
    <motion.li
      data-testid="tv-setlist-row"
      data-state={row.state}
      data-fit={row.fit}
      className="relative flex items-center rounded-[1.4rem]"
      style={{
        gap: lu(1.6), padding: lu(1.1),
        background: next ? 'linear-gradient(100deg, rgba(223,142,255,.20), rgba(143,245,255,.06))' : 'rgba(255,255,255,.03)',
        boxShadow: next ? `inset 0 0 0 2px ${LOBBY_ACCENTS.purple}, 0 0 36px -10px ${LOBBY_ACCENTS.purple}` : 'inset 0 0 0 1px rgba(255,255,255,.06)',
      }}
      initial={{ opacity: 0, x: reduced ? 0 : 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: partyEase.out, delay: 0.08 + index * 0.07 }}
    >
      <span className="w-[1.4em] shrink-0 text-center font-black tabular-nums" style={{ fontSize: lu(2.2), color: next ? LOBBY_ACCENTS.purple : 'rgba(255,255,255,.45)' }}>
        {done ? <Check aria-hidden strokeWidth={3} style={{ width: '0.9em', height: '0.9em', display: 'inline' }} /> : row.position}
      </span>
      <Art gameId={row.gameId} size={next ? lu(7.4) : lu(6.2)} dim={done} />
      <span className="flex min-w-0 flex-col" style={{ gap: lu(0.3) }}>
        {next && (
          <span className="font-bold" style={{ fontSize: lu(1.9), color: LOBBY_ACCENTS.purple }}>{t('tvLobby.nextUp', 'Als Nächstes')}</span>
        )}
        <span className="truncate font-black" style={{ fontSize: next ? lu(2.8) : lu(2.3), color: done ? 'rgba(255,255,255,.6)' : '#fff' }}>{row.name}</span>
        {hint && !next && <span className="truncate font-semibold" style={{ fontSize: lu(1.9), color: hint.color }}>{hint.text}</span>}
      </span>
    </motion.li>
  );
}

/**
 * „Heute spielen wir“ — die Set-Liste des Abends neben QR und Spielern: in
 * Reihenfolge, mit Spielbild, das naechste Spiel hervorgehoben, fuer die
 * spaeteren ein Hinweis, ob die Runde passt. Ob das NAECHSTE startet, sagt
 * weiterhin die Fusszeile (derselbe Chip wie auf den Handys).
 */
export default function TVLobbySetlist({ playlist, players }: { playlist: PartyPlaylistItem[]; players: number }) {
  const { t } = useTranslation();
  if (!playlist.length) return null;
  const view = buildSetlist(playlist, players, range);
  return (
    <section data-testid="tv-lobby-setlist" className={`${tvPanel} flex min-h-0 flex-col`} style={{ padding: lu(2), gap: lu(1.4) }}>
      <div className="flex items-baseline justify-between" style={{ gap: lu(1) }}>
        <h3 className="font-black text-white" style={{ fontSize: lu(2.8) }}>{t('tvLobby.setlist.title', 'Heute spielen wir')}</h3>
        <span className="shrink-0 font-bold tabular-nums text-white/60" style={{ fontSize: lu(2) }}>
          {view.done > 0
            ? t('tvLobby.setlist.progress', '{{done}} von {{total}}', { done: view.done, total: view.total })
            : t('tvLobby.setlist.count', { count: view.total, defaultValue_one: '1 Spiel', defaultValue_other: '{{count}} Spiele' })}
        </span>
      </div>
      <ol className="flex min-h-0 flex-col" style={{ gap: lu(1) }}>
        {view.rows.map((row, i) => <Row key={`${row.gameId}-${row.position}`} row={row} index={i} />)}
      </ol>
      {view.hiddenLater > 0 && (
        <span className="font-semibold text-white/55" style={{ fontSize: lu(1.9) }}>
          {t('tvLobby.setlist.more', '+{{count}} weitere', { count: view.hiddenLater })}
        </span>
      )}
    </section>
  );
}
