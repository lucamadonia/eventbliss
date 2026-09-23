import { useTranslation } from 'react-i18next';
import { useControllerParty, abortControllerGame, retryControllerResults } from '@/games/party/controller-session';
import { useGameRoom } from '@/games/multiplayer/useGameRoom';
import { useConfirmExit, ConfirmExitDialog } from '@/games/ui/useConfirmExit';

/** Party-level actions stay separate from the active player's game controls. */
export function ControllerGameControls() {
  const { t } = useTranslation();
  const { data, error, busy, pendingResults } = useControllerParty();
  const { isHost } = useGameRoom();
  const exit = useConfirmExit(() => { void abortControllerGame().catch(() => {}); });
  if (!data) return null;
  return <>
    <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-[#0a0e14] px-4 py-2 text-white">
      <span className="flex-1 text-sm text-white/70">{t('partyControllers.title')} · {data.party.code}</span>
      {isHost && <button disabled={busy} className="min-h-11 rounded-xl border border-white/20 px-4 text-sm disabled:opacity-40" onClick={exit.request}>{t('partyControllers.abort')}</button>}
      {pendingResults > 0 && <p role="status" className="w-full text-sm text-white/70">{t('partyControllers.pendingResults')}</p>}
      {pendingResults > 0 && error && <button disabled={busy} className="min-h-11 rounded-xl border border-white/20 px-4 text-sm disabled:opacity-40" onClick={() => { void retryControllerResults().catch(() => {}); }}>{t('partyControllers.retry')}</button>}
      {error && <p role="alert" className="w-full text-sm text-rose-200">{error.startsWith('partyControllers.') ? t(error) : error}</p>}
    </div>
    <ConfirmExitDialog {...exit.dialogProps} title={t('partyControllers.abort')} />
  </>;
}
