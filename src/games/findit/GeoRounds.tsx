import MapRound from './MapRound';
import StreetViewRound from './StreetViewRound';
import type { GeoLocation } from './geo-locations';
import type { StreetViewLocation } from './streetview-locations';
import type { Mode, Phase, Player } from './findit-config';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import type { GuestHandover } from '../ui/useGuestHandover';

/** Karte / Street View rounds — full-screen, outside AnimatePresence for proper map height. */
export function GeoRounds({ view, mode, round, svRound, totalRounds, timerSeconds, players, currentGeo, svLocation, online, handover, onLocalSeat, onExit, onComplete }: {
  view: Phase; mode: Mode; round: number; svRound: number; totalRounds: number; timerSeconds: number; players: Player[];
  currentGeo: GeoLocation | null; svLocation: StreetViewLocation | undefined; online?: OnlineGameProps; handover: GuestHandover;
  onLocalSeat: (seat: string | null) => void; onExit: () => void; onComplete: (results: { playerId: string; distanceKm: number }[]) => void;
}) {
  const shared = { players, totalRounds, timerSeconds, online, handover, onLocalSeat, onExit, onRoundComplete: onComplete };
  if (view === 'question' && mode === 'karte' && currentGeo) {
    return (
      <div className="fixed inset-0 z-50" style={{ background: '#0a0e14' }}>
        <MapRound key={`karte-${round}`} location={currentGeo} roundNumber={round + 1} {...shared} />
      </div>
    );
  }
  if (view === 'streetviewPlay' && svLocation) {
    return (
      <div className="fixed inset-0 z-50" style={{ background: '#0a0e14' }}>
        <StreetViewRound key={`sv-${svRound}`} location={svLocation} roundNumber={svRound + 1} {...shared} />
      </div>
    );
  }
  return null;
}
