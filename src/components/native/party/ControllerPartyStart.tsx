import { useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { invitationLoginPath } from './controller-invitation';

export const lobbyButton = 'min-h-11 rounded-xl px-4 py-3 font-semibold disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4';

/** Browser without the app: show the code and the store links. */
export function ControllerPartyWebInvite({ inviteCode }: { inviteCode?: string }) {
  const { t } = useTranslation();
  return <main className="min-h-dvh bg-[#0a0e14] px-6 py-16 text-white"><div className="mx-auto max-w-md space-y-6">
    <Gamepad2 className="h-12 w-12 text-[#df8eff]" /><h1 className="text-3xl font-bold">{t('partyControllers.title')}</h1>
    <p>{t('partyControllers.appRequired')}</p>
    {inviteCode && <><p className="rounded-2xl bg-white/10 p-5 text-center font-mono text-3xl tracking-widest">{inviteCode.toUpperCase()}</p>
      <a className={`${lobbyButton} block bg-[#df8eff] text-center text-[#0a0e14]`} href={`eventbliss://party/join/${encodeURIComponent(inviteCode)}`}>{t('partyControllers.openApp')}</a></>}
    <p className="text-sm text-white/70">{t('partyControllers.installHint')}</p>
    <div className="flex gap-3"><a className={`${lobbyButton} border border-white/20`} href="https://apps.apple.com/app/eventbliss/id6761774268">App Store</a><a className={`${lobbyButton} border border-white/20`} href="https://play.google.com/store/apps/details?id=app.eventbliss">Google Play</a></div>
  </div></main>;
}

/** Not logged in: login returns to the same invitation (also parked for social sign-in). */
export function ControllerPartyLogin({ inviteCode, onLogin }: { inviteCode?: string; onLogin: (path: string) => void }) {
  const { t } = useTranslation();
  return <main className="h-full min-h-0 overflow-y-auto native-scroll bg-[#0a0e14] px-6 pt-16 pb-tabbar text-white"><div className="mx-auto max-w-md space-y-6">
    <h1 className="text-3xl font-bold">{t('partyControllers.title')}</h1><p>{t('partyControllers.loginRequired')}</p>
    {inviteCode && <p className="rounded-2xl bg-white/[.06] p-4 text-center font-mono text-2xl tracking-widest">{inviteCode.toUpperCase()}</p>}
    <button className={`${lobbyButton} w-full bg-[#df8eff] text-[#0a0e14]`} onClick={() => onLogin(invitationLoginPath(inviteCode))}>{t('partyControllers.login')}</button>
  </div></main>;
}

interface StartProps {
  busy: boolean;
  defaultName: string;
  initialCode: string;
  onCreate: (name: string, hostPlays: boolean) => void;
  onJoin: (name: string, code: string) => void;
  localPlayerCount?: number;
  onImportLocal?: (name: string) => void;
}

/** No party yet: create one as Host or join with a code. */
export function ControllerPartyStart({ busy, defaultName, initialCode, onCreate, onJoin, localPlayerCount = 0, onImportLocal }: StartProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [code, setCode] = useState(initialCode);
  const [hostPlays, setHostPlays] = useState(true);
  const displayName = name.trim() || defaultName;
  return <section className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5">
    <label className="block space-y-2"><span>{t('partyControllers.name')}</span><input className="min-h-12 w-full rounded-xl bg-black/30 px-4" value={name} maxLength={24} onChange={event => setName(event.target.value)} placeholder={defaultName} /></label>
    {localPlayerCount > 0 && onImportLocal && <div className="space-y-2 rounded-2xl border border-[#8ff5ff]/30 bg-[#8ff5ff]/10 p-4">
      <p className="font-bold">{t('partyControllers.importLocalTitle', 'Mit euren Spielern weiterspielen')}</p>
      <p className="text-sm text-white/70">{t('partyControllers.importLocalHint', '{{count}} Profile und der Spielplan kommen mit. Jeder kann danach den TV-Code scannen und seinen Platz am eigenen Handy übernehmen. Die bisherige Wertung wird gesichert; die Joystick-Wertung beginnt neu.', { count: localPlayerCount })}</p>
      <button type="button" disabled={busy} data-testid="import-local-party" className={`${lobbyButton} w-full bg-[#8ff5ff] text-[#0a0e14]`} onClick={() => onImportLocal(displayName)}>
        {t('partyControllers.importLocalAction', 'Joystick-Modus mit diesen Spielern starten')}
      </button>
    </div>}
    <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={hostPlays} onChange={event => setHostPlays(event.target.checked)} />{t('partyControllers.hostPlays')}</label>
    <button disabled={busy} className={`${lobbyButton} w-full bg-[#df8eff] text-[#0a0e14]`} onClick={() => onCreate(displayName, hostPlays)}>{t('partyControllers.create')}</button>
    <div className="border-t border-white/10 pt-5"><label className="block space-y-2"><span>{t('partyControllers.roomCode')}</span><input className="min-h-12 w-full rounded-xl bg-black/30 px-4 font-mono uppercase tracking-widest" autoCapitalize="characters" maxLength={6} value={code} onChange={event => setCode(event.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''))} /></label>
      <button disabled={busy || !/^[A-HJ-NP-Z2-9]{6}$/.test(code)} className={`${lobbyButton} mt-3 w-full border border-white/20`} onClick={() => onJoin(displayName, code)}>{t('partyControllers.join')}</button></div>
  </section>;
}
