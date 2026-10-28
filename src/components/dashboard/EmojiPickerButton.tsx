import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Smile, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const EMOJIS = [
  "🎉", "🥳", "🎂", "🎁", "🎈", "✨", "💍", "❤️", "🥂", "🍻", "🍹", "🍕",
  "🌴", "🏖️", "🌅", "✈️", "🚗", "🚆", "🏕️", "🎯", "🎮", "🎨", "🎵", "📅",
  "💰", "💶", "📍", "🏙️", "💪", "🧘", "👍", "👎", "🤔", "🙌", "😊", "🚫",
];

interface EmojiPickerButtonProps {
  value?: string;
  onChange: (value: string | undefined) => void;
}

export function EmojiPickerButton({ value, onChange }: EmojiPickerButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const select = (emoji?: string) => {
    onChange(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-12 shrink-0 items-center justify-center rounded-md border border-input bg-background text-xl hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("formStudio.chooseEmoji", "Emoji auswählen")}
          aria-expanded={open}
        >
          {value || <Smile className="h-5 w-5 text-muted-foreground" />}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(19rem,calc(100vw-2rem))] p-2" align="start" sideOffset={6}>
        <div className="grid grid-cols-6 gap-1" role="group" aria-label={t("formStudio.chooseEmoji", "Emoji auswählen")}>
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="grid h-10 w-10 place-items-center rounded-lg text-xl hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => select(emoji)}
              aria-label={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
          onClick={() => select()}
        >
          <X className="h-4 w-4" />
          {t("formStudio.removeEmoji", "Ohne Emoji")}
        </button>
      </PopoverContent>
    </Popover>
  );
}
