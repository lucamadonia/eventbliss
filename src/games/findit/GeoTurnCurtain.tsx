import { useTranslation } from 'react-i18next';

/** Covers the map on phones that are waiting for another player's turn. */
export function GeoTurnCurtain({ player }: { player: { name: string; color: string } | null }) {
  const { t } = useTranslation();
  if (!player) return null;
  return (
    <div role="status" data-testid="findit-waiting-turn" className="absolute inset-0 z-[15] flex flex-col items-center justify-center gap-5 bg-[#111827]/95 px-6 text-center text-white">
      <span className="grid h-20 w-20 place-items-center rounded-full text-3xl font-black" style={{ backgroundColor: player.color }} aria-hidden="true">{player.name.slice(0, 1).toUpperCase()}</span>
      <span className="text-3xl font-black">{t('games.findit.playerTurn', { name: player.name })}</span>
      <span className="text-base text-white/70">{t('games.findit.mapWaitingPlayers')}</span>
    </div>
  );
}
