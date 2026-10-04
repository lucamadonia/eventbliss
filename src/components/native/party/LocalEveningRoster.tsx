import { useState } from 'react';
import { Reorder, useDragControls, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUp, GripVertical, Pencil, UserMinus, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useHaptics';
import type { PartyPlayer } from '@/games/party/session-schema';
import { MAX_PARTY_PLAYERS, suggestPlayerLook } from '@/games/party/session-schema';
import type { PlayerProfile } from '@/games/party/controller-session';
import { partyMotion, playerGlow } from '@/lib/party-motion';
import { cn } from '@/lib/utils';
import { PartySheet, SeatAvatar } from './PartySheet';
import { PlayerProfileEditor } from './PlayerProfileEditor';

interface Props {
  players: PartyPlayer[];
  onAdd: (profile: PlayerProfile) => void;
  onUpdate: (id: string, profile: PlayerProfile) => void;
  onRemove: (id: string) => void;
  onMove: (from: number, to: number) => void;
}

/** The single move that turns `before` into `after` (a drag step), or null. */
export function diffMove(before: readonly string[], after: readonly string[]): [number, number] | null {
  const first = before.findIndex((id, i) => id !== after[i]);
  if (first < 0 || before.length !== after.length) return null;
  // Moved down: the item at `first` reappears later; moved up: a later item now sits at `first`.
  const movedDown = after[first] === before[first + 1];
  const id = movedDown ? before[first] : after[first];
  return [before.indexOf(id), after.indexOf(id)];
}

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff]';
type Sheet = { kind: 'actions' | 'profile'; player: PartyPlayer } | { kind: 'add' } | null;

/**
 * One-phone party, "Euer Abend": the Host manages everyone — rename, symbol,
 * colour, remove, and the turn order (drag handle, or up/down in the sheet).
 */
export function LocalEveningRoster({ players, onAdd, onUpdate, onRemove, onMove }: Props) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const [sheet, setSheet] = useState<Sheet>(null);
  const close = () => setSheet(null);
  const reorder = (ids: string[]) => {
    // Reorder.Group reports the whole new order; apply it as one move.
    const move = diffMove(players.map(p => p.id), ids);
    if (move) onMove(move[0], move[1]);
  };
  return (
    <section data-testid="evening-roster" aria-labelledby="evening-roster-title" className="space-y-2">
      <h2 id="evening-roster-title" className="text-sm font-bold text-white/80">{t('partyPlay.evening.players', 'Spieler · Reihenfolge')}</h2>
      <Reorder.Group axis="y" values={players.map(p => p.id)} onReorder={reorder} className="space-y-2">
        {players.map((player, index) => (
          <RosterRow key={player.id} player={player} index={index} onOpen={() => { haptics.light(); setSheet({ kind: 'actions', player }); }} onDrop={() => haptics.select()} />
        ))}
      </Reorder.Group>
      <button type="button" data-testid="evening-add-player" disabled={players.length >= MAX_PARTY_PLAYERS} onClick={() => setSheet({ kind: 'add' })}
        className={cn('flex min-h-16 w-full items-center gap-3 rounded-3xl border border-dashed border-white/20 bg-white/[.02] px-3 text-start text-white/80 active:bg-white/[.06] disabled:opacity-40', focus)}>
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white/[.06]"><UserPlus className="h-5 w-5 text-[#8ff5ff]" aria-hidden /></span>
        <strong>{t('partyPlay.evening.addPlayer', 'Spieler hinzufügen')}</strong>
      </button>

      <PartySheet open={sheet?.kind === 'actions'} onClose={close} testId="evening-player-sheet" title={sheet?.kind === 'actions' ? sheet.player.name : ''}>
        {sheet?.kind === 'actions' && (() => {
          const index = players.findIndex(p => p.id === sheet.player.id);
          const rows = [
            { key: 'edit', Icon: Pencil, label: t('partyPlay.roster.editProfile', 'Name, Symbol & Farbe'), run: () => setSheet({ kind: 'profile', player: sheet.player }) },
            ...(index > 0 ? [{ key: 'up', Icon: ArrowUp, label: t('partyPlay.evening.moveUp', 'Nach oben'), run: () => { onMove(index, index - 1); close(); } }] : []),
            ...(index < players.length - 1 ? [{ key: 'down', Icon: ArrowDown, label: t('partyPlay.evening.moveDown', 'Nach unten'), run: () => { onMove(index, index + 1); close(); } }] : []),
            { key: 'remove', Icon: UserMinus, label: t('partyPlay.roster.removePlayer', 'Entfernen'), danger: true, run: () => { onRemove(sheet.player.id); close(); } },
          ];
          return <div className="space-y-2">{rows.map(({ key, Icon, label, danger, run }) => (
            <button key={key} type="button" data-testid={`evening-player-${key}`} onClick={() => { haptics.light(); run(); }}
              className={cn('flex min-h-14 w-full items-center gap-4 rounded-2xl bg-white/[.04] px-4 text-start active:bg-white/10', focus)}>
              <Icon className={cn('h-5 w-5', danger ? 'text-rose-300' : 'text-[#8ff5ff]')} aria-hidden />
              <strong className={cn(danger && 'text-rose-200')}>{label}</strong>
            </button>))}</div>;
        })()}
      </PartySheet>
      <PartySheet open={sheet?.kind === 'profile'} onClose={close} title={t('partyPlay.profile.title', 'Profil')}>
        {sheet?.kind === 'profile' && <PlayerProfileEditor key={sheet.player.id} initial={sheet.player} hostDevice
          submitLabel={t('partyPlay.profile.save', 'Speichern')} onSubmit={profile => { onUpdate(sheet.player.id, profile); close(); }} />}
      </PartySheet>
      <PartySheet open={sheet?.kind === 'add'} onClose={close} title={t('partyPlay.evening.addPlayer', 'Spieler hinzufügen')}>
        {sheet?.kind === 'add' && <PlayerProfileEditor initial={{ name: '', ...suggestPlayerLook(players) }} hostDevice testIds={{ name: 'guest-name', save: 'guest-save' }}
          submitLabel={t('partyPlay.roster.addGuestSubmit', 'Hinzufügen')} onSubmit={profile => { onAdd(profile); close(); }} />}
      </PartySheet>
    </section>
  );
}

function RosterRow({ player, index, onOpen, onDrop }: { player: PartyPlayer; index: number; onOpen: () => void; onDrop: () => void }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const drag = useDragControls();
  return (
    <Reorder.Item value={player.id} dragListener={false} dragControls={drag} onDragEnd={onDrop} data-testid={`evening-player-${player.id}`}
      variants={partyMotion('avatarArrive', reduced)} initial="initial" animate="animate"
      className="flex min-h-16 items-center gap-2 rounded-3xl border border-white/[.06] bg-white/[.04] pe-1 ps-3"
      whileDrag={{ scale: 1.03, boxShadow: playerGlow(player.color, 'active') }}>
      <span className="w-5 text-center font-game text-sm font-black tabular-nums text-white/50">{index + 1}</span>
      <button type="button" onClick={onOpen} aria-haspopup="dialog" className={cn('flex min-h-14 flex-1 items-center gap-3 text-start', focus)}>
        <span className="rounded-full" style={{ boxShadow: playerGlow(player.color) }}><SeatAvatar avatar={player.avatar} color={player.color} size={44} /></span>
        <strong className="min-w-0 flex-1 truncate">{player.name}</strong>
      </button>
      <button type="button" aria-label={t('partyPlay.evening.drag', 'Reihenfolge ziehen')} onPointerDown={event => drag.start(event)}
        className={cn('grid h-11 w-11 touch-none place-items-center rounded-full text-white/50 active:bg-white/10', focus)}>
        <GripVertical className="h-5 w-5" aria-hidden />
      </button>
    </Reorder.Item>
  );
}
