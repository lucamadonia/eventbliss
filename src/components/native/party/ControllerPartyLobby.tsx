import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Check, Gamepad2, Loader2, Play, Plus, Tv, X } from 'lucide-react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useGameRoom } from '@/games/multiplayer/useGameRoom';
import { abortControllerGame, leaveControllerParty, openControllerParty, retryControllerConnection, setControllerPlaylist, startControllerGame, useControllerParty } from '@/games/party/controller-session';
import { playableGames } from '@/lib/playable-games';
import { isGamePremium } from '@/games/premium/gameConfig';
import { getBaseUrl, isNative } from '@/lib/platform';
import { usePartySession } from '@/hooks/usePartySession';
import { PartyStandingsList } from './PartyStandingsList';
import { buildPartyNightState, derivePartyStandings } from '@/games/party/standings';
import { useTVContext } from '@/contexts/TVBroadcastContext';
import { PartyFinaleOverlay } from './PartyFinaleOverlay';
import { ConfirmExitDialog, useConfirmExit } from '@/games/ui/useConfirmExit';

const button = 'min-h-11 rounded-xl px-4 py-3 font-semibold disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4';
export default function ControllerPartyLobby() {
  const { t, i18n } = useTranslation();
  const { code: inviteCode } = useParams();
  const navigate = useNavigate();
  const auth = useAuthContext();
  const controller = useControllerParty();
  const room = useGameRoom();
  const party = usePartySession();
  const tv = useTVContext();
  const [name, setName] = useState('');
  const [code, setCode] = useState(inviteCode ?? '');
  const [hostPlays, setHostPlays] = useState(true);
  const [finaleSeen, setFinaleSeen] = useState(0);
  const attempted = useRef('');
  const data = controller.data;
  const isHost = data?.party.host_user_id === auth.user?.id;
  const roster = data?.members.filter(member => data.party.host_plays || !member.is_host) ?? [];
  const playlist = data?.party.playlist ?? [];
  const nextIndex = data?.results.length ?? 0;
  const next = playlist[nextIndex];
  const ended = data?.party.status === 'finished';
  const nextGame = playableGames.find(game => game.id === next);
  const compatible = !!nextGame && roster.length >= Math.max(2, nextGame.minPlayers) && roster.length <= nextGame.maxPlayers;
  const allReady = roster.length >= 2 && roster.every(member => room.players.some(player => player.id === member.player_id && player.isReady));
  const displayName = name.trim() || String(auth.user?.user_metadata?.display_name ?? auth.user?.user_metadata?.full_name ?? t('partyControllers.player'));
  const act = (work: Promise<unknown>) => { void work.catch(() => { /* state displays failure */ }); };
  const exit = useConfirmExit(() => act(leaveControllerParty(!!isHost).then(() => navigate('/party'))));

  useEffect(() => {
    if (!isNative() || auth.isLoading || !auth.user || !inviteCode || data || attempted.current === inviteCode) return;
    attempted.current = inviteCode;
    act(openControllerParty(auth.user.id, displayName, inviteCode.toUpperCase()));
  }, [auth.isLoading, auth.user, inviteCode, data, displayName]);

  useEffect(() => {
    if (!isHost || !tv?.isActive || !party.session || data?.party.status === 'playing') return;
    const view = ended || (playlist.length > 0 && nextIndex >= playlist.length) ? 'finale' : nextIndex ? 'between' : 'map';
    const partyNight = buildPartyNightState(party.session, id => t(playableGames.find(game => game.id === id)?.nameKey ?? id), view);
    tv.broadcastTV('tv-state', { game: 'lobby', phase: 'idle', lang: i18n.language, partyNight,
      controllerJoinCode: ended ? null : data?.party.code, players: party.session.players });
  }, [isHost, tv, party.session, data?.party.status, data?.party.code, ended, playlist.length, nextIndex, t, i18n.language]);

  if (!isNative()) return <main className="min-h-dvh bg-[#0a0e14] px-6 py-16 text-white"><div className="mx-auto max-w-md space-y-6">
    <Gamepad2 className="h-12 w-12 text-[#df8eff]" /><h1 className="text-3xl font-bold">{t('partyControllers.title')}</h1>
    <p>{t('partyControllers.appRequired')}</p>
    {inviteCode && <><p className="rounded-2xl bg-white/10 p-5 text-center font-mono text-3xl tracking-widest">{inviteCode.toUpperCase()}</p>
      <a className={`${button} block bg-[#df8eff] text-center text-[#0a0e14]`} href={`eventbliss://party/join/${encodeURIComponent(inviteCode)}`}>{t('partyControllers.openApp')}</a></>}
    <p className="text-sm text-white/70">{t('partyControllers.installHint')}</p>
    <div className="flex gap-3"><a className={`${button} border border-white/20`} href="https://apps.apple.com/app/eventbliss/id6761774268">App Store</a><a className={`${button} border border-white/20`} href="https://play.google.com/store/apps/details?id=app.eventbliss">Google Play</a></div>
  </div></main>;

  if (auth.isLoading) return <div className="grid min-h-dvh place-items-center"><Loader2 className="animate-spin" aria-label={t('partyControllers.loading')} /></div>;
  if (!auth.user) return <main className="min-h-dvh bg-[#0a0e14] px-6 py-16 text-white"><div className="mx-auto max-w-md space-y-6">
    <h1 className="text-3xl font-bold">{t('partyControllers.title')}</h1><p>{t('partyControllers.loginRequired')}</p>
    <button className={`${button} bg-[#df8eff] text-[#0a0e14]`} onClick={() => navigate(`/auth?redirect=${encodeURIComponent(inviteCode ? `/party/join/${inviteCode}` : '/party/controllers')}`)}>{t('partyControllers.login')}</button>
  </div></main>;

  return <main className="min-h-dvh bg-[#0a0e14] px-5 pb-28 pt-[max(24px,env(safe-area-inset-top))] text-white">
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-center gap-3"><button className={`${button} bg-white/5`} aria-label={t('common.back')} onClick={() => data ? exit.request() : navigate('/party')}><ArrowLeft size={20} /></button><div><p className="text-xs uppercase tracking-widest text-[#8ff5ff]">EventBliss Party</p><h1 className="text-2xl font-bold">{t('partyControllers.title')}</h1></div></header>
      <p className="text-white/70">{t('partyControllers.subtitle')}</p>
      {controller.pendingResults > 0 && <p role="status" className="rounded-xl bg-white/5 p-4">{t('partyControllers.pendingResults')}</p>}
      {controller.error && <div role="alert" className="rounded-xl border border-rose-300/30 bg-rose-300/10 p-4">{controller.error.startsWith('partyControllers.') ? t(controller.error) : controller.error}</div>}
      {data && room.connection !== 'connected' && !ended && <button className={`${button} w-full border border-white/20`} disabled={controller.busy} onClick={() => act(retryControllerConnection())}>{t('partyControllers.retry')}</button>}
      {ended && <p role="status">{t('partyControllers.roomEnded')}</p>}
      {!data ? <section className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5">
        <label className="block space-y-2"><span>{t('partyControllers.name')}</span><input className="min-h-12 w-full rounded-xl bg-black/30 px-4" value={name} maxLength={40} onChange={event => setName(event.target.value)} placeholder={displayName} /></label>
        <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={hostPlays} onChange={event => setHostPlays(event.target.checked)} />{t('partyControllers.hostPlays')}</label>
        <button disabled={controller.busy} className={`${button} w-full bg-[#df8eff] text-[#0a0e14]`} onClick={() => act(openControllerParty(auth.user!.id, displayName, undefined, hostPlays))}>{t('partyControllers.create')}</button>
        <div className="border-t border-white/10 pt-5"><label className="block space-y-2"><span>{t('partyControllers.roomCode')}</span><input className="min-h-12 w-full rounded-xl bg-black/30 px-4 font-mono uppercase tracking-widest" autoCapitalize="characters" maxLength={6} value={code} onChange={event => setCode(event.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''))} /></label>
          <button disabled={controller.busy || !/^[A-HJ-NP-Z2-9]{6}$/.test(code)} className={`${button} mt-3 w-full border border-white/20`} onClick={() => act(openControllerParty(auth.user!.id, displayName, code))}>{t('partyControllers.join')}</button></div>
      </section> : <>
        <section className="grid gap-5 rounded-3xl border border-[#df8eff]/20 bg-gradient-to-br from-[#df8eff]/10 to-[#8ff5ff]/5 p-5 sm:grid-cols-[auto_1fr]">
          <div className="mx-auto rounded-2xl bg-white p-3"><QRCodeSVG value={`${getBaseUrl()}/party/join/${data.party.code}`} size={160} title={t('partyControllers.scan')} /></div>
          <div className="space-y-3"><h2 className="text-lg font-bold">{t('partyControllers.scan')}</h2><p className="font-mono text-3xl tracking-widest">{data.party.code}</p><p className="text-sm text-white/70">{t('partyControllers.accountHint')}</p>
            {isHost && <button className={`${button} border border-white/20`} onClick={() => tv?.activate()}><Tv className="me-2 inline h-4 w-4" />{t('partyControllers.tv')}</button>}</div>
        </section>
        <section className="space-y-3"><h2 className="text-lg font-bold">{t('partyControllers.players', { count: roster.length })}</h2>
          {data.members.map(member => { const presence = room.players.find(p => p.id === member.player_id); return <div key={member.user_id} className="flex min-h-14 items-center justify-between rounded-xl bg-white/5 px-4"><span>{member.name}{member.is_host ? ' ♛' : ''}</span><span className="text-sm text-white/70">{!presence ? t('partyControllers.offline') : presence.isReady ? t('partyControllers.ready') : t('partyControllers.notReadyYet')}</span></div>; })}
          {!ended && <button className={`${button} w-full ${room.players.find(p => p.id === room.myPlayerId)?.isReady ? 'bg-emerald-400 text-black' : 'bg-[#8ff5ff] text-black'}`} onClick={() => room.setReady(!room.players.find(p => p.id === room.myPlayerId)?.isReady)}><Check className="me-2 inline h-5 w-5" />{t('partyControllers.readyToggle')}</button>}
        </section>
        {data.party.status === 'playing' && <section className="rounded-xl bg-amber-200/10 p-4"><p>{t('partyControllers.waitNext')}</p>{isHost && <button className={`${button} mt-3 border border-white/20`} onClick={() => act(abortControllerGame())}>{t('partyControllers.abort')}</button>}</section>}
        {isHost && data.party.status === 'lobby' && <section className="space-y-4"><h2 className="text-lg font-bold">{t('partyControllers.playlist')}</h2>
          <ol className="space-y-2">{playlist.map((id, index) => <li key={`${id}:${index}`} className="flex items-center gap-3 rounded-xl bg-white/5 p-3"><span className="text-white/50">{index + 1}</span><span className="flex-1">{t(playableGames.find(g => g.id === id)?.nameKey ?? id)}</span>{index < nextIndex ? <Check size={18} /> : <button className="grid h-11 w-11 place-items-center" aria-label={t('partyControllers.remove')} onClick={() => act(setControllerPlaylist(playlist.filter((_, i) => i !== index)))}><X size={18} /></button>}</li>)}</ol>
          <button disabled={!next || !compatible || !allReady || controller.busy || room.connection !== 'connected'} className={`${button} w-full bg-[#df8eff] text-black`} onClick={() => next && act(startControllerGame(next))}><Play className="me-2 inline h-5 w-5" />{t('partyControllers.startNext')}</button>
          {next && !compatible && <p role="status" className="text-sm text-amber-200">{t('partyControllers.capacity', { min: Math.max(2, nextGame?.minPlayers ?? 2), max: Math.min(12, nextGame?.maxPlayers ?? 12) })}</p>}
          {!allReady && <p role="status" className="text-sm text-white/70">{t('partyControllers.notReady')}</p>}
          <div className="grid gap-3 sm:grid-cols-2">{playableGames.map(game => { const fits = roster.length >= Math.max(2, game.minPlayers) && roster.length <= game.maxPlayers; const locked = isGamePremium(game.id) && !data.party.premium; return <button key={game.id} disabled={!fits || locked || controller.busy || playlist.length >= 30} className="flex min-h-20 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-start disabled:opacity-40" onClick={() => act(setControllerPlaylist([...playlist, game.id]))}><img src={game.image} alt="" className="h-14 w-14 rounded-xl object-cover" loading="lazy" /><span className="flex-1"><strong className="block text-sm">{t(game.nameKey)}</strong><span className="text-xs text-white/65">{locked ? t('partyControllers.premiumRequired') : t('partyControllers.capacity', { min: Math.max(2, game.minPlayers), max: Math.min(12, game.maxPlayers) })}</span></span><Plus size={18} /></button>; })}</div>
        </section>}
        {!isHost && data.party.status === 'lobby' && <p role="status" className="rounded-2xl bg-white/5 p-5">{t('partyControllers.hostChoosing')}</p>}
        {party.session && data.results.length > 0 && <PartyStandingsList standings={derivePartyStandings([...party.session.players, ...(party.session.archivedPlayers ?? [])], party.session.gameHistory)} />}
        {party.session && nextIndex > finaleSeen && playlist.length > 0 && nextIndex >= playlist.length && <PartyFinaleOverlay open standings={derivePartyStandings([...party.session.players, ...(party.session.archivedPlayers ?? [])], party.session.gameHistory)} history={party.session.gameHistory.map(entry => ({ ...entry, gameName: t(playableGames.find(game => game.id === entry.gameId)?.nameKey ?? entry.gameName) }))} gamesPlayed={nextIndex} playerCount={roster.length} onDone={() => setFinaleSeen(nextIndex)} />}
        <button disabled={controller.busy} className={`${button} w-full border border-white/20`} onClick={exit.request}>{t(isHost ? 'partyControllers.end' : 'partyControllers.leave')}</button>
      </>}
      <ConfirmExitDialog {...exit.dialogProps} title={t(isHost ? 'partyControllers.end' : 'partyControllers.leave')} />
    </div>
  </main>;
}
