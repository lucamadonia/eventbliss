/**
 * StudioSheet — bottom-sheet shell for every Form Studio editor.
 *
 * Uses Dialog (not vaul Drawer) for the same reason as GameRoomSheet: the
 * native iOS keyboard dismisses vaul drawers. Rendered as a rounded-top sheet
 * pinned to the bottom, scrollable, with a grabber, emoji + title row, an
 * optional "peek" (eye) button that jumps into the live preview, and a close X.
 * Closing always flushes the draft so nothing is lost on dismiss.
 */
import type { ReactNode } from "react";
import { Eye, X } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useHaptics } from "@/hooks/useHaptics";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface StudioSheetProps {
  open: boolean;
  onClose: () => void;
  /** Persist the draft before the sheet unmounts. */
  flush: () => void;
  emoji?: string;
  title: string;
  /** When set, shows an eye button that opens the live preview for this key. */
  onPeek?: () => void;
  children: ReactNode;
}

export function StudioSheet({ open, onClose, flush, emoji, title, onPeek, children }: StudioSheetProps) {
  const haptics = useHaptics();

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      flush();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          // Override the centered dialog into a bottom-anchored sheet.
          "fixed inset-x-0 bottom-0 top-auto left-0 translate-x-0 translate-y-0 mx-auto",
          "flex flex-col w-full sm:max-w-lg max-h-[85vh] p-0 gap-0 overflow-hidden",
          "rounded-t-3xl border-x-0 border-b-0 border-t border-border bg-background",
          // Hide the primitive's built-in top-right close (we render our own).
          "[&>button]:hidden",
        )}
      >
        {/* Grabber */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="h-1.5 w-10 rounded-full bg-foreground/20" />
        </div>

        {/* Title row */}
        <div className="flex items-center gap-3 px-5 pb-3">
          {emoji && <span className="text-2xl leading-none">{emoji}</span>}
          <DialogTitle className="flex-1 text-lg font-display font-bold text-foreground">
            {title}
          </DialogTitle>
          {onPeek && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              transition={spring.snappy}
              onClick={() => {
                haptics.light();
                flush();
                onPeek();
              }}
              className="grid h-9 w-9 place-items-center rounded-full bg-foreground/[0.06] text-muted-foreground"
              aria-label="Preview"
            >
              <Eye className="h-4 w-4" />
            </motion.button>
          )}
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            transition={spring.snappy}
            onClick={() => handleOpenChange(false)}
            className="grid h-9 w-9 place-items-center rounded-full bg-foreground/[0.06] text-muted-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto native-scroll px-5 pb-8">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
