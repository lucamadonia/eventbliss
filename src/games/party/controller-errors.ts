/**
 * controller-errors.ts — server error codes of `controller_party_request`
 * mapped to friendly, translatable texts. Pure, no React.
 */
export const CONTROLLER_ERROR_CODES = [
  'seat_taken', 'already_seated', 'not_guest', 'party_full', 'locked_in_game', 'cannot_kick_host', 'banned',
  'invalid_name', 'invalid_avatar', 'invalid_color', 'invalid_mode', 'invalid_controller', 'controller_taken',
  'not_member', 'not_claimed', 'cannot_release_host', 'not_allowed', 'not_playing', 'recalled',
] as const;
export type ControllerErrorCode = typeof CONTROLLER_ERROR_CODES[number] | 'removed' | 'host_required' | 'ended' | 'not_found';

const DEFAULTS: Record<ControllerErrorCode, string> = {
  seat_taken: 'Diesen Platz hat gerade jemand anderes übernommen. Die Liste ist aktualisiert.',
  already_seated: 'Du hast in dieser Party schon einen Platz.',
  not_guest: 'Dieser Platz gehört schon zu einem Handy.',
  party_full: 'Die Party ist voll (12 Spieler). Übernimm einen Platz oder frag den Host.',
  locked_in_game: 'Gerade läuft ein Spiel – nach der Runde möglich.',
  cannot_kick_host: 'Der Host kann nicht entfernt werden.',
  banned: 'Du kannst dieser Party nicht mehr beitreten.',
  invalid_name: 'Bitte einen Namen mit 1–24 Zeichen.',
  invalid_avatar: 'Dieses Symbol ist nicht verfügbar. Bitte ein anderes wählen.',
  invalid_color: 'Diese Farbe ist nicht verfügbar. Bitte eine andere wählen.',
  invalid_mode: 'Das hat nicht geklappt. Bitte noch einmal versuchen.',
  invalid_controller: 'Dieses Handy konnte nicht zugeordnet werden. Bitte die App neu öffnen.',
  controller_taken: 'Dieses Handy ist in der Party schon vergeben.',
  not_member: 'Diese Person ist nicht mehr in der Party.',
  not_claimed: 'Für diesen Platz ist nichts vorgemerkt.',
  cannot_release_host: 'Der Platz des Hosts bleibt am Host-Handy.',
  not_allowed: 'Das darf nur der Host.',
  not_playing: 'Gerade läuft kein Spiel.',
  recalled: 'Du spielst jetzt am Host-Handy.',
  host_required: 'Das darf nur der Host.',
  removed: 'Du bist nicht mehr in dieser Party.',
  ended: 'Diese Party ist vorbei.',
  not_found: 'Diese Party gibt es nicht. Prüfe den Code.',
};

/** Extracts a known code from a raw RPC error message (codes may be wrapped in prose). */
export function controllerErrorCode(message: string | null | undefined): ControllerErrorCode | null {
  if (!message) return null;
  for (const code of CONTROLLER_ERROR_CODES) if (new RegExp(`\\b${code}\\b`).test(message)) return code;
  // Legacy prose messages of the original RPC.
  if (/party membership required/i.test(message)) return 'removed';
  if (/party is full/i.test(message)) return 'party_full';
  if (/host action required/i.test(message)) return 'host_required';
  if (/party (has )?ended|party_ended|party (has )?expired/i.test(message)) return 'ended';
  if (/party not found|unknown party|invalid (party )?code/i.test(message)) return 'not_found';
  return null;
}

type Translate = (key: string, fallback: string) => string;

/** Friendly text for any controller error; unknown errors are shown as they are. */
export function describeControllerError(message: string | null | undefined, t: Translate): string | null {
  if (!message) return null;
  const code = controllerErrorCode(message);
  if (code) return t(`partyPlay.error.${code}`, DEFAULTS[code]);
  if (message.startsWith('partyControllers.')) return t(message, message);
  return message;
}
