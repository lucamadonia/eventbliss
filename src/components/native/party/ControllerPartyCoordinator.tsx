import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useGameRoom } from '@/games/multiplayer/useGameRoom';
import { openControllerParty, stopControllerParty, useControllerParty } from '@/games/party/controller-session';
import { controllerInvitationCode } from './controller-invitation';

/** One mounted coordinator owns routing across lobby, games and intermission. */
export function ControllerPartyCoordinator() {
  const auth = useAuthContext();
  const controller = useControllerParty();
  const room = useGameRoom();
  const navigate = useNavigate();
  const location = useLocation();
  const resumed = useRef('');
  useEffect(() => {
    if (auth.isLoading) return;
    if (!auth.user) { if (controller.data) stopControllerParty(); return; }
    if (controller.data && !controller.data.members.some(member => member.user_id === auth.user!.id)) { stopControllerParty(); return; }
    if (controller.data || resumed.current === auth.user.id || location.pathname.startsWith('/party/join/')) return;
    resumed.current = auth.user.id;
    let code: string | null = null;
    try { code = localStorage.getItem(`controller_party:${auth.user.id}`); } catch { /* optional */ }
    if (code) void openControllerParty(auth.user.id, String(auth.user.user_metadata?.display_name ?? 'Player'), code).catch(() => { /* lobby displays retry */ });
  }, [auth.isLoading, auth.user, controller.data, location.pathname]);
  useEffect(() => {
    const data = controller.data;
    if (!data || room.room?.roomCode !== data.party.code) return;
    const invitation = controllerInvitationCode(location.pathname);
    if (invitation && invitation !== data.party.code.toUpperCase()) return;
    const isHost = data.party.host_user_id === auth.user?.id;
    const active = room.room.participantIds.includes(room.myPlayerId);
    const playing = data.party.status === 'playing' && room.room.status === 'playing';
    const path = playing && (active || isHost)
      ? `/games/${room.room.gameId}?room=${data.party.code}&party=true`
      : '/party/controllers';
    if (location.pathname + location.search !== path) navigate(path, { replace: true });
  }, [controller.data, room.room, room.myPlayerId, auth.user?.id, navigate, location.pathname, location.search]);
  return null;
}
