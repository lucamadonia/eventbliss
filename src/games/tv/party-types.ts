/**
 * Party Night — the wire shape the phone puts inside the existing `tv-state`
 * broadcast so the big screen can show "wo stehe ich heute Abend?" at any time.
 *
 * Everything here is OPTIONAL on the wire: a `tv-state` without `partyNight`
 * behaves exactly as before, so single games are untouched.
 *
 * The phone owns the game catalogue and the localisation of game names, so
 * `PartyPlaylistItem.name` arrives already translated — the TV never maps ids
 * to display names itself.
 */

export interface PartyPlaylistItem {
  gameId: string;
  /** already localised by the phone */
  name: string;
  done: boolean;
}

export interface PartyStanding {
  id: string;
  name: string;
  color: string;
  /** emoji avatar (existing app data) — falls back to the name initial */
  avatar?: string;
  /** cumulative points across the whole evening */
  points: number;
  /** 1-based, competition ranking (ties share a rank) */
  rank: number;
  /** rank BEFORE the last finished game; null while nothing has finished yet */
  prevRank: number | null;
  gamesWon: number;
  /** consecutive games won up to now; 0 when the last game was not won */
  streak: number;
}

/**
 * One finished game. Structurally a subset of `GameHistoryEntry` from
 * `usePartySession`, so the phone can forward its `gameHistory` entries as-is.
 */
export interface PartyGameResult {
  gameId: string;
  gameName: string;
  winnerId: string;
  /** playerId -> points earned in THIS game (not cumulative) */
  scores: Record<string, number>;
}

export interface PartyNightState {
  active: boolean;
  playlist: PartyPlaylistItem[];
  /** 0-based position of the game that is current / up next */
  index: number;
  standings: PartyStanding[];
  history: PartyGameResult[];
  /**
   * 'ingame'  — a game is running; the TV shows the game view plus the slim
   *             progress strip and the inline party rank on every scoreboard.
   * 'between' — the dedicated TVPartyStandings scene.
   * 'finale'  — the end-of-night TVPartyFinale ceremony.
   */
  phase: 'ingame' | 'between' | 'finale';
  /** name of the game that just finished — headline of the standings scene */
  lastGameName?: string;
}
