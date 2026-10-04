import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download, Loader2, PartyPopper } from 'lucide-react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useGameRoom } from '@/games/multiplayer/useGameRoom';
import {
  abortControllerGame, closeControllerParty, controllerSeatStatus, dismissControllerRemoval, endControllerParty, leaveControllerParty, openControllerParty, ownMember, releaseControllerSeat,
  retryControllerConnection, useControllerParty,
} from '@/games/party/controller-session';
import { needsClientUpdate } from '@/games/party/controller-api';
import { controllerErrorCode, describeControllerError } from '@/games/party/controller-errors';
import { playableGames } from '@/lib/playable-games';
import { isNative } from '@/lib/platform';
import { usePartySession } from '@/hooks/usePartySession';
import { PartyStandingsList } from './PartyStandingsList';
import { derivePartyStandings } from '@/games/party/standings';
import { useTVContext } from '@/contexts/TVBroadcastContext';
import { PartyFinaleOverlay } from './PartyFinaleOverlay';
import { forgetInvitation, invitationAction, rememberInvitation, switchConfirmedParty } from './controller-invitation';
import { ControllerOnboarding, myPendingClaim, PendingClaim } from './ControllerOnboarding';
import { ControllerPartyLogin, ControllerPartyStart, ControllerPartyWebInvite, lobbyButton as button } from './ControllerPartyStart';
import { ControllerPlaylistPanel } from './ControllerPlaylistPanel';
import { PartyClosingScreen } from './PartyClosingScreen';
import { PartyConfirmSheet } from './PartyConfirmSheet';
import { PartyRemovedNotice } from './PartyRemovedNotice';
import { PartyRoster } from './PartyRoster';
import { PartyLobbyHeader } from './PartyLobbyHeader';
import { PartyReadyBar } from './PartyReadyBar';
import { PartyInviteCard, PartyTvTile } from './PartyInviteCard';
import { HostStartBar } from './HostStartBar';
import { PartyBottomBarSpacer } from './PartyBottomBar';
import { NextGameCard } from './NextGameCard';
import { useNextGame } from './useNextGame';
import { WaitingFor } from './WaitingFor';
import { SeatAvatar } from './PartySheet';
import { playerGlow } from '@/lib/party-motion';
import { usePartyScreenTrace } from './ui-trace';
import { useControllerTvLobby } from './useControllerTvLobby';
import { estimateSetlistMinutes } from './setlist';

const STORE_URL = 'https://apps.apple.com/app/eventbliss/id6761774268';

export default function ControllerPartyLobby() {
  const { t } = useTranslation();
  const { code: inviteCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuthContext();
  const controller = useControllerParty();
  const room = useGameRoom();
  const party = usePartySession();
  const tv = useTVContext();
  const [finaleSeen, setFinaleSeen] = useState(0);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [switchDevice, setSwitchDevice] = useState<string | null>(null);
  const attempted = useRef('');
  const switching = useRef(false);
  const data = controller.data;
  const isHost = data?.party.host_user_id === auth.user?.id;
  const roster = data?.members.filter(member => !member.banned && (data.party.host_plays || !member.is_host)) ?? [];
  const playlist = data?.party.playlist ?? [];
  const nextIndex = data?.results.length ?? 0;
  const ended = data?.party.status === 'finished';
  const playing = data?.party.status === 'playing';
  const notReady = roster.filter(member => member.controlled_by == null && !room.players.some(player => player.id === member.player_id && player.isReady)).map(member => member.name);
  // Who counts as ready on the stage: phones that tapped (Host included), plus guests at the Host's phone.
  const readyIds = new Set(roster.filter(member => member.controlled_by != null
    || room.players.some(player => player.id === member.player_id && player.isReady)).map(member => member.player_id));
  const me = ownMember(data, auth.user?.id);
  const pendingClaim = data ? myPendingClaim(data) : null;
  const inMatch = !!room.room?.participantIds.includes(room.myPlayerId);
  const myReady = !!room.players.find(p => p.id === room.myPlayerId)?.isReady;
  const next = useNextGame(data, notReady, room.connection === 'connected');
  const minPlayers = Math.max(2, next.game?.minPlayers ?? 2);
  // A ready player is told who the room still waits for (with faces), not just a count.
  const waitingFor = !isHost && myReady && !playing ? roster.filter(m => m.controlled_by == null && m.player_id !== me?.player_id
    && !room.players.some(p => p.id === m.player_id && p.isReady)) : [];
  // Empty metadata strings must not win (A05: the profile opened with an empty name).
  const accountName = String(auth.user?.user_metadata?.display_name || auth.user?.user_metadata?.full_name || auth.user?.email?.split('@')[0] || t('partyControllers.player')).trim().slice(0, 24);
  const errorText = describeControllerError(controller.error, (key, fallback) => t(key, fallback));
  const errorCode = controllerErrorCode(controller.error);
  const act = (work: Promise<unknown>) => { void work.catch(() => { /* state displays failure */ }); };
  const invitation = invitationAction(inviteCode, data?.party.code, controller.busy);
  const changeParty = () => {
    if (invitation !== 'confirm' || switching.current || !auth.user || !inviteCode) return;
    switching.current = true;
    const target = inviteCode.toUpperCase();
    act(switchConfirmedParty(
      () => leaveControllerParty(!!isHost),
      () => { attempted.current = target; return openControllerParty(auth.user!.id, accountName, target); },
    ).finally(() => { switching.current = false; }));
  };
  usePartyScreenTrace('lobby');
  useControllerTvLobby(data, party.session, room.players, isHost);

  // The Host is implicitly ready (the TV shows it that way); the room still wants the flag.
  useEffect(() => {
    if (isHost && data?.party.status === 'lobby' && room.connection === 'connected' && !myReady) room.setReady(true);
  }, [isHost, data?.party.status, room.connection, myReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Park the invitation before any login detour (social sign-in may lose ?redirect).
  useEffect(() => { if (inviteCode && !auth.isLoading && !auth.user) rememberInvitation(inviteCode); }, [inviteCode, auth.isLoading, auth.user]);

  // Every opening of an invitation link is a fresh attempt — also the same code
  // again after an unban (F16). The lobby instance may survive route changes.
  useEffect(() => { attempted.current = ''; }, [location.key]);

  useEffect(() => {
    if (!isNative() || auth.isLoading || !auth.user || !inviteCode || invitation !== 'join' || switching.current || attempted.current === inviteCode.toUpperCase()) return;
    const code = inviteCode.toUpperCase(), userId = auth.user.id;
    attempted.current = code;
    forgetInvitation();
    // An old "no longer in this party" must not block a new invitation; the server decides (banned → error).
    if (controller.removed) dismissControllerRemoval();
    // B06: the same account already sits in this party on another phone → ask first.
    // B07: a member re-opening the link resumes their seat — "Wer bist du?" is only for new seats.
    act(controllerSeatStatus(userId, code).then(seat => seat === 'elsewhere' ? setSwitchDevice(code)
      : openControllerParty(userId, accountName, code, true, { resume: seat === 'here' })));
  }, [auth.isLoading, auth.user, inviteCode, invitation, accountName, location.key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isNative()) return <ControllerPartyWebInvite inviteCode={inviteCode} />;
  if (auth.isLoading) return <div className="grid min-h-dvh place-items-center"><Loader2 className="animate-spin" aria-label={t('partyControllers.loading')} /></div>;
  if (!auth.user) return <ControllerPartyLogin inviteCode={inviteCode} onLogin={path => navigate(path)} />;

  const shell = (children: ReactNode) => <main data-testid="party-lobby" data-role={isHost ? 'host' : 'player'}
    className="relative h-full min-h-dvh overflow-y-auto overscroll-y-contain native-scroll bg-[#060810] px-5 pb-tabbar pt-[max(24px,env(safe-area-inset-top))] text-white">
    {/* The party surface fills the whole viewport on tall screens — never a white strip below. */}
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[#060810]" />
    <div className="mx-auto max-w-2xl space-y-6">{children}</div></main>;

  // A fresh invitation replaces the old removal notice (the effect above clears it and joins).
  if (!data && controller.removed && !inviteCode) {
    const removal = controller.removed;
    return shell(<PartyRemovedNotice removal={removal}
      onRejoin={() => { dismissControllerRemoval(); attempted.current = ''; navigate(`/party/join/${removal.code}`, { replace: true }); }}
      onStartOwn={() => { dismissControllerRemoval(); navigate('/party/controllers', { replace: true }); }}
      onDone={() => { dismissControllerRemoval(); navigate('/games', { replace: true }); }} />);
  }
  // A08: an ended party opened by invitation — clear words and one way out, not the raw server text.
  if (!data && errorCode === 'ended') return shell(<section data-testid="party-ended-screen" role="status" className="space-y-4 pt-10 text-center">
    <PartyPopper className="mx-auto h-10 w-10 text-[#df8eff]" aria-hidden />
    <h1 className="text-2xl font-black">{t('partyPlay.ended.title', 'Diese Party ist vorbei')}</h1>
    <p className="text-white/60">{t('partyPlay.ended.body', 'Danke fürs Mitspielen! Starte einfach deine eigene Party.')}</p>
    <button className={`${button} w-full bg-[#df8eff] text-[#0a0e14]`} onClick={() => { dismissControllerRemoval(); navigate('/party/controllers', { replace: true }); }}>{t('partyPlay.removed.startOwn', 'Eigene Party starten')}</button>
  </section>);
  if (needsClientUpdate(data)) return shell(<section data-testid="update-required" role="alert" className="space-y-4 pt-10 text-center">
    <Download className="mx-auto h-10 w-10 text-[#8ff5ff]" aria-hidden />
    <h1 className="text-2xl font-black">{t('partyPlay.update.title', 'Bitte aktualisiere die App')}</h1>
    <p className="text-white/60">{t('partyPlay.update.body', 'Diese Party nutzt neue Funktionen. Mit der neuesten Version bist du sofort dabei.')}</p>
    <a href={STORE_URL} className={`${button} block w-full bg-[#df8eff] text-[#0a0e14]`}>{t('partyPlay.update.cta', 'Jetzt aktualisieren')}</a>
  </section>);
  // D04/T16: the party is over — every device shows the closing screen; the TV runs the finale.
  if (data && ended) return shell(<PartyClosingScreen myPlayerId={me?.player_id ?? null}
    history={party.session?.gameHistory ?? []} partyDateMs={party.session?.createdAt || Date.now()}
    standings={party.session ? derivePartyStandings([...party.session.players, ...(party.session.archivedPlayers ?? [])], party.session.gameHistory) : []}
    onStartOwn={() => { closeControllerParty(); navigate('/party/controllers', { replace: true }); }}
    onDone={() => { closeControllerParty(); navigate('/games', { replace: true }); }} />);
  if (data && controller.onboarding && !isHost && (me || pendingClaim || controller.seatless)) return shell(<ControllerOnboarding data={data} userId={auth.user.id} busy={controller.busy} seatless={controller.seatless} />);

  return shell(<>
    {data ? <PartyLobbyHeader members={roster} readyIds={readyIds} gamesPlanned={playlist.length}
      firstGameReady={data.party.status === 'lobby' && playlist.length > 0 && nextIndex === 0} plannedMinutes={estimateSetlistMinutes(playlist, roster.length)} tvConnected={!!tv?.isActive}
      hostColor={data.members.find(m => m.is_host)?.color ?? '#df8eff'} onBack={() => setConfirmLeave(true)}
      runningGame={playing ? t(playableGames.find(game => game.id === data.party.current_game_id)?.nameKey ?? data.party.current_game_id ?? '') : null}
      now={waitingFor.length > 0 && <WaitingFor members={waitingFor} />} />
      : <><header className="flex items-center gap-3"><button className={`${button} bg-white/5`} aria-label={t('common.back')} onClick={() => navigate('/party')}><ArrowLeft size={20} className="rtl:rotate-180" /></button><div><p className="text-xs uppercase tracking-widest text-[#8ff5ff]">EventBliss Party</p><h1 className="text-2xl font-bold">{t('partyControllers.title')}</h1></div></header>
        <p className="text-white/70">{t('partyControllers.subtitle')}</p></>}
    {controller.pendingResults > 0 && <p role="status" className="rounded-xl bg-white/5 p-4">{t('partyControllers.pendingResults')}</p>}
    {errorText && <div role="alert" data-testid={errorCode === 'party_full' ? 'party-full-message' : errorCode === 'banned' ? 'seat-error' : 'party-error'} data-error-code={errorCode ?? ''} className="rounded-xl border border-rose-300/30 bg-rose-300/10 p-4">{errorText}</div>}
    {data && room.connection !== 'connected' && !ended && <button className={`${button} w-full border border-white/20`} disabled={controller.busy} onClick={() => act(retryControllerConnection())}>{t('partyControllers.retry')}</button>}
    {!data ? <ControllerPartyStart busy={controller.busy} defaultName={accountName} initialCode={inviteCode ?? ''}
      onCreate={(name, hostPlays) => act(openControllerParty(auth.user!.id, name, undefined, hostPlays))}
      onJoin={(name, code) => act(openControllerParty(auth.user!.id, name, code))} /> : <>
      {pendingClaim && <PendingClaim guest={pendingClaim} onCancel={() => act(releaseControllerSeat(pendingClaim.player_id))} />}
      {/* NOW-first mid-game: what happens for me comes right under the stage. */}
      {playing && <section className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[.04] p-4" {...(!inMatch && !isHost ? { 'data-testid': 'join-next-round' } : {})}>
        {me && <span className="rounded-full" style={{ boxShadow: playerGlow(me.color) }}><SeatAvatar avatar={me.avatar} color={me.color} size={48} /></span>}
        <div className="min-w-0 flex-1">
          <p className="font-bold">{!inMatch && !isHost ? t('partyPlay.lobby.soon', 'Gleich bist du dran') : t('partyPlay.lobby.running', 'Gerade läuft ein Spiel')}</p>
          <p className="text-sm text-white/60">{!inMatch && !isHost ? t('partyPlay.lobby.nextRound', 'Ab der nächsten Runde bist du dabei.') : t('partyControllers.waitNext')}</p>
          {isHost && <button className="mt-2 min-h-11 rounded-full px-4 text-sm font-semibold text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:bg-white/5" onClick={() => act(abortControllerGame())}>{t('partyControllers.abort')}</button>}
        </div>
      </section>}
      {data.party.status === 'lobby' && <NextGameCard next={next} role={isHost ? 'host' : 'player'}
        sitOutIds={data.members.filter(m => !m.banned && m.controlled_by != null).map(m => m.player_id)} />}
      {/* Progressive disclosure: big invitation while people still join, a chip once everyone is in or a game runs. */}
      {!ended && <PartyInviteCard code={data.party.code} compact={playing || (nextIndex > 0 && notReady.length === 0 && roster.length >= minPlayers)} />}
      {isHost && !tv?.isActive && <PartyTvTile connected={false} onPair={() => tv?.openConnection()} />}
      <PartyRoster data={data} myUserId={auth.user.id} presence={room.players} participantIds={room.room?.participantIds ?? []} busy={controller.busy} />

      {isHost && data.party.status === 'lobby' && <ControllerPlaylistPanel data={data} busy={controller.busy} />}
      {party.session && data.results.length > 0 && <details className="rounded-2xl border border-white/10 p-4"><summary className="min-h-11 cursor-pointer py-2 font-semibold">{t('nativeExtra.partyLobby.overallScore')}</summary><PartyStandingsList standings={derivePartyStandings([...party.session.players, ...(party.session.archivedPlayers ?? [])], party.session.gameHistory)} /></details>}
      {party.session && nextIndex > finaleSeen && playlist.length > 0 && nextIndex >= playlist.length && <PartyFinaleOverlay open standings={derivePartyStandings([...party.session.players, ...(party.session.archivedPlayers ?? [])], party.session.gameHistory)} history={party.session.gameHistory.map(entry => ({ ...entry, gameName: t(playableGames.find(game => game.id === entry.gameId)?.nameKey ?? entry.gameName) }))} gamesPlayed={nextIndex} playerCount={roster.length} onDone={() => setFinaleSeen(nextIndex)} />}
      <button data-testid={isHost ? 'end-party' : 'leave-party'} disabled={controller.busy}
        className="mx-auto block min-h-11 rounded-full px-4 text-sm font-semibold text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:bg-white/5 disabled:opacity-40"
        onClick={() => setConfirmLeave(true)}>{t(isHost ? 'partyControllers.end' : 'partyControllers.leave')}</button>
      {data.party.status === 'lobby' && (isHost || me) && <PartyBottomBarSpacer />}
      {/* NOW-first: the one action for this person, always in the thumb zone. */}
      {data.party.status === 'lobby' && isHost && <HostStartBar next={next} busy={controller.busy} firstGame={playlist.length > 0 && nextIndex === 0} />}
      {data.party.status === 'lobby' && !isHost && me && <PartyReadyBar ready={myReady} color={me.color} onToggle={ready => room.setReady(ready)} />}
    </>}
    <PartyConfirmSheet open={confirmLeave} onClose={() => setConfirmLeave(false)} danger={isHost} busy={controller.busy}
      testId={isHost ? 'end-party-prompt' : 'leave-party-prompt'} confirmTestId={isHost ? 'end-party-confirm' : 'leave-confirm'}
      title={t(isHost ? 'partyControllers.end' : 'partyControllers.leave')}
      body={isHost ? t('partyPlay.end.body', 'Für alle endet die Party. Die Wertung bleibt sichtbar.') : t('partyPlay.leave.body', 'Deine Punkte bleiben in der Wertung.')}
      confirmLabel={t(isHost ? 'partyControllers.end' : 'partyControllers.leave')}
      onConfirm={() => { setConfirmLeave(false); act(isHost ? endControllerParty() : leaveControllerParty(false).then(() => navigate('/party'))); }} />
    <PartyConfirmSheet open={!!switchDevice} busy={controller.busy} testId="switch-device-prompt" confirmTestId="switch-device-confirm"
      title={t('partyPlay.switchDevice.title', 'Auf dieses Handy wechseln?')}
      body={t('partyPlay.switchDevice.body', 'Du spielst in dieser Party schon auf einem anderen Handy. Deine Punkte kommen mit, das andere Handy gibt den Platz ab.')}
      confirmLabel={t('partyPlay.switchDevice.confirm', 'Hierher wechseln')}
      onClose={() => { setSwitchDevice(null); navigate('/party/controllers', { replace: true }); }}
      onConfirm={() => { const code = switchDevice!; setSwitchDevice(null); act(openControllerParty(auth.user!.id, accountName, code)); }} />
    <PartyConfirmSheet open={invitation === 'confirm'} busy={controller.busy} testId="switch-party-prompt" confirmTestId="switch-party-confirm"
      title={t('partyPlay.switch.title', 'Party wechseln?')}
      body={errorText ?? t('partyPlay.switch.body', 'Du verlässt {{from}} und trittst {{to}} bei.', { from: data?.party.code, to: inviteCode?.toUpperCase() })}
      confirmLabel={t('partyPlay.switch.confirm', 'Wechseln')}
      onClose={() => navigate('/party/controllers', { replace: true })} onConfirm={changeParty} />
  </>);
}
