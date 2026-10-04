import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { useControllerParty, abortControllerGame, retryControllerResults } from '@/games/party/controller-session';
import { useGameRoom } from '@/games/multiplayer/useGameRoom';
import { describeControllerError } from '@/games/party/controller-errors';
import { useConfirmExit, ConfirmExitDialog } from '@/games/ui/useConfirmExit';
import { PartyPlayerPicker } from './PartyPlayerPicker';

/** Party-level actions stay separate from the active player's game controls. */
export function ControllerGameControls() {
  const { t } = useTranslation();
  const { data, error, busy, pendingResults } = useControllerParty();
  const { isHost } = useGameRoom();
  const exit = useConfirmExit(() => { void abortControllerGame().catch(() => {}); });
  const [picking, setPicking] = useState(false);
  if (!data) return null;
  // The code already sits in the connection bar: this row only carries actions and result status.
  if (!isHost && pendingResults === 0 && !error) return null;
  return <>
    <div className="flex flex-wrap items-center justify-end gap-3 border-b border-white/10 bg-[#0a0e14] px-4 py-2 text-white">
      {isHost && <button disabled={busy} aria-haspopup="dialog" data-testid="pause-players" className="flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm disabled:opacity-40" onClick={() => setPicking(true)}><Users className="h-4 w-4" aria-hidden />{t('partyPlay.remote.players', 'Spieler')}</button>}
      {isHost && <button disabled={busy} className="min-h-11 rounded-xl border border-white/20 px-4 text-sm disabled:opacity-40" onClick={exit.request}>{t('partyControllers.abort')}</button>}
      {pendingResults > 0 && <p role="status" className="w-full text-sm text-white/70">{t('partyControllers.pendingResults')}</p>}
      {pendingResults > 0 && error && <button disabled={busy} className="min-h-11 rounded-xl border border-white/20 px-4 text-sm disabled:opacity-40" onClick={() => { void retryControllerResults().catch(() => {}); }}>{t('partyControllers.retry')}</button>}
      {error && <p role="alert" className="w-full text-sm text-rose-200">{describeControllerError(error, (key, fallback) => t(key, fallback))}</p>}
    </div>
    <ConfirmExitDialog {...exit.dialogProps} title={t('partyControllers.abort')} />
    {isHost && <PartyPlayerPicker open={picking} onClose={() => setPicking(false)} />}
  </>;
}
