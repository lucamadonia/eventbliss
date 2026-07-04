/**
 * BoardSettingsSheet — organizer-only board configuration. Choose the
 * contribute mode and toggle guest visibility / guest pinning.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Users, Eye, PenLine } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { ContributeMode, EventBoard } from "@/hooks/useIdeaBoard";

interface BoardSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: EventBoard;
  onSave: (patch: Partial<EventBoard>) => Promise<void>;
}

export function BoardSettingsSheet({
  open,
  onOpenChange,
  board,
  onSave,
}: BoardSettingsSheetProps) {
  const { t } = useTranslation();
  const haptics = useHaptics();

  const [mode, setMode] = useState<ContributeMode>(board.contribute_mode);
  const [canView, setCanView] = useState(board.guests_can_view);
  const [canPin, setCanPin] = useState(board.guests_can_pin);
  const [saving, setSaving] = useState(false);

  const MODES: { key: ContributeMode; label: string; hint: string; icon: typeof Users }[] = [
    {
      key: "contribute",
      label: t("ideaBoard.settings.modeContribute", "Alle dürfen beitragen"),
      hint: t("ideaBoard.settings.modeContributeHint", "Gäste können Ideen pinnen und reagieren."),
      icon: Users,
    },
    {
      key: "view",
      label: t("ideaBoard.settings.modeView", "Nur ansehen"),
      hint: t("ideaBoard.settings.modeViewHint", "Gäste sehen das Board, pinnen aber nicht."),
      icon: Eye,
    },
    {
      key: "private",
      label: t("ideaBoard.settings.modePrivate", "Privat"),
      hint: t("ideaBoard.settings.modePrivateHint", "Nur du siehst und bearbeitest das Board."),
      icon: PenLine,
    },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        contribute_mode: mode,
        guests_can_view: canView,
        guests_can_pin: canPin,
      });
      haptics.success();
      toast.success(t("ideaBoard.settings.saved", "Einstellungen gespeichert"));
      onOpenChange(false);
    } catch {
      toast.error(t("ideaBoard.settings.saveError", "Speichern fehlgeschlagen"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-3xl border-white/10 bg-[#0d0a1a]/95 backdrop-blur-2xl"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-white">
            {t("ideaBoard.settings.title", "Board-Einstellungen")}
          </SheetTitle>
          <SheetDescription>
            {t("ideaBoard.settings.subtitle", "Bestimme, wer beitragen darf.")}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-5 pb-6">
          {/* Contribute mode */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
              {t("ideaBoard.settings.mode", "Modus")}
            </span>
            <RadioGroup
              value={mode}
              onValueChange={(v) => {
                haptics.select();
                setMode(v as ContributeMode);
              }}
              className="gap-2"
            >
              {MODES.map((m) => {
                const Icon = m.icon;
                const active = mode === m.key;
                return (
                  <label
                    key={m.key}
                    htmlFor={`mode-${m.key}`}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition-colors",
                      active
                        ? "border-fuchsia-400/40 bg-gradient-to-br from-violet-600/25 to-fuchsia-500/15"
                        : "border-white/10 bg-white/5 hover:bg-white/10",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        active ? "bg-fuchsia-500/25 text-fuchsia-200" : "bg-white/10 text-white/60",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{m.label}</p>
                      <p className="text-xs text-white/50">{m.hint}</p>
                    </div>
                    <RadioGroupItem
                      id={`mode-${m.key}`}
                      value={m.key}
                      className="mt-1 border-white/30 text-fuchsia-400"
                    />
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Switches */}
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  {t("ideaBoard.settings.guestsView", "Gäste dürfen sehen")}
                </p>
                <p className="text-xs text-white/50">
                  {t("ideaBoard.settings.guestsViewHint", "Board ohne Login für Gäste sichtbar.")}
                </p>
              </div>
              <Switch
                checked={canView}
                onCheckedChange={(v) => {
                  haptics.select();
                  setCanView(v);
                }}
              />
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  {t("ideaBoard.settings.guestsPin", "Gäste dürfen pinnen")}
                </p>
                <p className="text-xs text-white/50">
                  {t("ideaBoard.settings.guestsPinHint", "Gäste können eigene Ideen hinzufügen.")}
                </p>
              </div>
              <Switch
                checked={canPin}
                onCheckedChange={(v) => {
                  haptics.select();
                  setCanPin(v);
                }}
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-12 w-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-base font-bold text-white hover:opacity-90"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              t("ideaBoard.settings.save", "Speichern")
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
