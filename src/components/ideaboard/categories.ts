/**
 * Category metadata for the Ideenboard — emoji + accent gradient per category.
 * Labels are resolved via i18n at render time (t("ideaBoard.categories.<key>")).
 */
import { PIN_CATEGORIES, type PinCategory } from "@/hooks/useIdeaBoard";

export interface CategoryMeta {
  key: PinCategory;
  emoji: string;
  /** German fallback label (locale agent adds the rest) */
  label: string;
  /** Tailwind gradient for accents */
  gradient: string;
}

export const CATEGORY_META: Record<PinCategory, CategoryMeta> = {
  deko:     { key: "deko",     emoji: "🎈", label: "Deko",       gradient: "from-fuchsia-500 to-pink-400" },
  outfit:   { key: "outfit",   emoji: "👗", label: "Outfit",     gradient: "from-violet-500 to-purple-400" },
  food:     { key: "food",     emoji: "🍽️", label: "Essen", gradient: "from-emerald-500 to-green-400" },
  drinks:   { key: "drinks",   emoji: "🍹", label: "Drinks",     gradient: "from-cyan-500 to-sky-400" },
  activity: { key: "activity", emoji: "🎯", label: "Aktivität", gradient: "from-amber-500 to-orange-400" },
  location: { key: "location", emoji: "📍", label: "Location",   gradient: "from-rose-500 to-red-400" },
  gift:     { key: "gift",     emoji: "🎁", label: "Geschenk",   gradient: "from-pink-500 to-rose-400" },
  playlist: { key: "playlist", emoji: "🎵", label: "Playlist",   gradient: "from-indigo-500 to-violet-400" },
  other:    { key: "other",    emoji: "✨",       label: "Sonstiges",  gradient: "from-slate-500 to-slate-400" },
};

export const CATEGORY_LIST: CategoryMeta[] = PIN_CATEGORIES.map((c) => CATEGORY_META[c]);
