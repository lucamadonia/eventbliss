import { buildPartyRecap } from '@/games/party/party-recap';
import type { GameHistoryEntry } from '@/games/party/session-schema';
import type { PartyGameResult, PartyStanding } from '../party-types';

/**
 * Die eine NEUE Zeile unter dem Podest: Wer gewonnen hat, zeigen Podest und
 * Endstand schon. Hier steht das Highlight des Abends — dieselben Daten wie
 * im Rueckblick auf den Handys (buildPartyRecap), damit Fernseher und Telefon
 * dieselbe Geschichte erzaehlen.
 */
export type FinaleHighlight =
  | { kind: 'closest'; names: string[]; gameId: string; gameName: string; margin: number }
  | { kind: 'mostWins'; name: string; wins: number }
  | { kind: 'phones' };

export function finaleHighlight(standings: readonly PartyStanding[], history: readonly PartyGameResult[]): FinaleHighlight {
  // Der Fernseher bekommt die Spielhistorie schlank; was fehlt, ergaenzen wir neutral.
  const entries = history.map((h) => {
    const extra = h as PartyGameResult & Partial<GameHistoryEntry>;
    return {
      ...extra,
      winnerName: extra.winnerName ?? '',
      points: extra.points ?? {},
      playedAt: extra.playedAt ?? 0,
      scored: extra.scored ?? Object.keys(h.scores ?? {}).length > 0,
    } as GameHistoryEntry;
  });
  const recap = buildPartyRecap(standings, entries, 0);
  if (recap.closestWin && recap.closestWin.margin !== null) {
    const source = history.find((h) => h.gameId === recap.closestWin!.gameId);
    return {
      kind: 'closest',
      names: recap.closestWin.winners.map((w) => w.name),
      gameId: recap.closestWin.gameId,
      gameName: source?.gameName ?? recap.closestWin.gameId,
      margin: recap.closestWin.margin,
    };
  }
  if (recap.mostWins) return { kind: 'mostWins', name: recap.mostWins.name, wins: recap.mostWins.wins };
  return { kind: 'phones' };
}
