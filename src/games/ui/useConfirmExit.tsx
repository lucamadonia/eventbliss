/**
 * useConfirmExit + ConfirmExitDialog — a shared "Spiel verlassen?" guard so an
 * accidental tap on a game's in-game back button never drops the player
 * straight out to the games list, losing the whole round.
 *
 * Usage in a game:
 *   const navigate = useNavigate();
 *   const exit = useConfirmExit(() => navigate('/games'));
 *   // in-game (active play) back button:  onClick={exit.request}
 *   // setup / final-results back button:  onClick={() => navigate('/games')}  (direct, nothing to lose)
 *   // render once:  <ConfirmExitDialog {...exit.dialogProps} accent="#df8eff" />
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { holdLocalGame } from '@/games/engine/local-pause';
import * as Dialog from '@radix-ui/react-alert-dialog';
import { useTranslation } from "react-i18next";

export function useConfirmExit(onExit: () => void) {
  const [open, setOpen] = useState(false);
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => { if (open) return holdLocalGame(); }, [open]);
  const request = useCallback(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
  }, []);
  const returnFocus = useCallback(() => { if (previousFocus.current?.isConnected) previousFocus.current.focus(); }, []);
  const cancel = useCallback(() => setOpen(false), []);
  const confirm = useCallback(() => {
    setOpen(false);
    onExit();
  }, [onExit]);
  return { open, request, cancel, confirm, dialogProps: { open, onStay: cancel, onLeave: confirm, onReturnFocus: returnFocus } };
}

interface ConfirmExitDialogProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
  onReturnFocus?: () => void;
  /** Accent for the primary "keep playing" button — pass the game's palette. */
  accent?: string;
  title?: string;
  subtitle?: string;
}

export function ConfirmExitDialog({
  open,
  onStay,
  onLeave,
  onReturnFocus,
  accent = "#df8eff",
  title,
  subtitle,
}: ConfirmExitDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog.Root open={open} onOpenChange={value => { if (!value) onStay(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-[90] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(4px)" }}
        />
          <Dialog.Content
            onCloseAutoFocus={event => { if (onReturnFocus) { event.preventDefault(); onReturnFocus(); } }}
            className="fixed left-1/2 top-1/2 z-[91] w-[calc(100%-48px)] max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-3xl p-5 text-center"
            style={{ background: "#151a21", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Dialog.Title className="text-base font-bold mb-1 text-white">
              {title ?? t("games.common.leaveTitle")}
            </Dialog.Title>
            <Dialog.Description className="text-sm mb-4 text-white/70">
              {subtitle ?? t("games.common.leaveSub")}
            </Dialog.Description>
            <div className="flex flex-col gap-2">
              <Dialog.Cancel
                onClick={onStay}
                className="w-full py-3 rounded-2xl text-sm font-bold"
                style={{ background: accent, color: "#0a0e14" }}
              >
                {t("games.common.leaveStay")}
              </Dialog.Cancel>
              <Dialog.Action
                onClick={onLeave}
                className="w-full py-3 rounded-2xl text-sm font-semibold text-white/60"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {t("games.common.leaveConfirm")}
              </Dialog.Action>
            </div>
          </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
