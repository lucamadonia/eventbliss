/**
 * AddPinSheet — bottom sheet to add a pin. Pick a kind (Foto / Link / Notiz /
 * Pinterest-URL), a category and the relevant fields. Free users at the pin
 * limit see an upgrade prompt instead of the form.
 */
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, Link2, StickyNote, Sparkles, Crown, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AddPinInput, PinCategory, PinKind } from "@/hooks/useIdeaBoard";
import { CATEGORY_LIST, CATEGORY_META } from "./categories";

interface AddPinSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canAddPin: boolean;
  freePinLimit: number;
  onAdd: (input: AddPinInput) => Promise<void>;
  onUpgrade?: () => void;
}

type KindTab = { key: PinKind; label: string; icon: typeof ImagePlus };

export function AddPinSheet({
  open,
  onOpenChange,
  canAddPin,
  freePinLimit,
  onAdd,
  onUpgrade,
}: AddPinSheetProps) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const keyboardInset = useKeyboardInset();
  const fileRef = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<PinKind>("image");
  const [category, setCategory] = useState<PinCategory>("deko");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const KIND_TABS: KindTab[] = [
    { key: "image", label: t("ideaBoard.kind.photo", "Foto"), icon: ImagePlus },
    { key: "link", label: t("ideaBoard.kind.link", "Link"), icon: Link2 },
    { key: "note", label: t("ideaBoard.kind.note", "Notiz"), icon: StickyNote },
    { key: "embed", label: t("ideaBoard.kind.embed", "Pinterest"), icon: Sparkles },
  ];

  const reset = () => {
    setKind("image");
    setCategory("deko");
    setTitle("");
    setNote("");
    setUrl("");
    setImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const pickFile = (file: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  // Only http(s) links — reject javascript:/data:/other schemes that could
  // execute or spoof when the pin is opened.
  const isSafeHttpUrl = (raw: string): boolean => {
    const v = raw.trim();
    if (v.length <= 3) return false;
    try {
      const parsed = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const canSubmit = (() => {
    if (kind === "image") return !!imageFile;
    if (kind === "link" || kind === "embed") return isSafeHttpUrl(url);
    if (kind === "note") return note.trim().length > 0 || title.trim().length > 0;
    return false;
  })();

  const handleSubmit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      const input: AddPinInput = {
        kind,
        category,
        title: title.trim() || undefined,
        note: kind === "note" ? note.trim() || undefined : undefined,
        url: kind === "link" || kind === "embed" ? url.trim() || undefined : undefined,
        imageFile: kind === "image" ? imageFile ?? undefined : undefined,
      };
      await onAdd(input);
      haptics.success();
      toast.success(t("ideaBoard.added", "Idee hinzugefügt"));
      close();
    } catch (err) {
      if ((err as Error).message === "free-limit") {
        toast.error(t("ideaBoard.upgradeTitle", "Premium für unbegrenzte Ideen"));
      } else {
        toast.error(t("ideaBoard.addError", "Konnte nicht gespeichert werden"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-3xl border-white/10 bg-[#0d0a1a]/95 backdrop-blur-2xl"
        style={keyboardInset ? { paddingBottom: keyboardInset + 24 } : undefined}
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-white">
            {t("ideaBoard.addIdea", "Idee hinzufügen")}
          </SheetTitle>
          <SheetDescription>
            {t("ideaBoard.addIdeaHint", "Teile Inspiration mit allen Gästen.")}
          </SheetDescription>
        </SheetHeader>

        {!canAddPin ? (
          /* ---- Upgrade prompt ---- */
          <div className="mt-4 flex flex-col items-center gap-4 rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/15 via-fuchsia-500/10 to-violet-500/15 px-5 py-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/20">
              <Crown className="h-7 w-7 text-amber-300" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">
                {t("ideaBoard.upgradeTitle", "Premium für unbegrenzte Ideen")}
              </h3>
              <p className="mt-1 text-sm text-white/60">
                {t(
                  "ideaBoard.upgradeBody",
                  "Kostenlos sind {{count}} Ideen möglich. Mit Premium wird dein Board grenzenlos.",
                  { count: freePinLimit },
                )}
              </p>
            </div>
            <Button
              onClick={() => {
                haptics.medium();
                onUpgrade?.();
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-white hover:opacity-90"
            >
              <Crown className="h-4 w-4" />
              {t("ideaBoard.upgradeCta", "Premium freischalten")}
            </Button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-5 pb-6">
            {/* Kind tabs */}
            <div className="grid grid-cols-4 gap-2">
              {KIND_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = kind === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      haptics.select();
                      setKind(tab.key);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-xs font-semibold transition-all",
                      active
                        ? "border-fuchsia-400/40 bg-gradient-to-br from-violet-600/40 to-fuchsia-500/30 text-white"
                        : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
                {t("ideaBoard.categoryLabel", "Kategorie")}
              </label>
              <Select value={category} onValueChange={(v) => setCategory(v as PinCategory)}>
                <SelectTrigger className="border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_LIST.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      <img src={c.icon} alt="" className="mr-1.5 inline-block h-4 w-4 object-contain align-[-3px]" />
                      {t(`ideaBoard.categories.${c.key}`, c.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Kind-specific fields */}
            {kind === "image" && (
              <div className="flex flex-col gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="relative flex min-h-[9rem] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/20 bg-white/5 text-white/60 transition-colors hover:bg-white/10"
                >
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="" className="h-48 w-full object-cover" />
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          pickFile(null);
                        }}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
                      >
                        <X className="h-4 w-4" />
                      </span>
                    </>
                  ) : (
                    <span className="flex flex-col items-center gap-2 py-8">
                      <ImagePlus className="h-7 w-7" />
                      <span className="text-sm">
                        {t("ideaBoard.pickPhoto", "Foto auswählen")}
                      </span>
                    </span>
                  )}
                </button>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("ideaBoard.titleOptional", "Titel (optional)")}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                />
              </div>
            )}

            {(kind === "link" || kind === "embed") && (
              <div className="flex flex-col gap-2">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  inputMode="url"
                  placeholder={
                    kind === "embed"
                      ? t("ideaBoard.embedPlaceholder", "Pinterest-URL einfügen")
                      : t("ideaBoard.urlPlaceholder", "https://…")
                  }
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                />
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("ideaBoard.titleOptional", "Titel (optional)")}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                />
              </div>
            )}

            {kind === "note" && (
              <div className="flex flex-col gap-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("ideaBoard.titleOptional", "Titel (optional)")}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                />
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder={t("ideaBoard.notePlaceholder", "Deine Idee…")}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                />
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              className="mt-1 h-12 w-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-base font-bold text-white hover:opacity-90"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <img src={CATEGORY_META[category].icon} alt="" className="h-5 w-5 object-contain" />
                  {t("ideaBoard.save", "Idee speichern")}
                </>
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
