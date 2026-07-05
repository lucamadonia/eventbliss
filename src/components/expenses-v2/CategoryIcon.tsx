/**
 * CategoryIcon — a clean monochrome line icon per expense category.
 *
 * Uses the app's lucide icon set (native, instant, no image assets), tinted via
 * currentColor so callers control the tone. The outer box is sized by
 * `className` (e.g. w-10 h-10); the glyph sits centered at half that size.
 */
import {
  Car,
  Hotel,
  PartyPopper,
  UtensilsCrossed,
  Beer,
  Gift,
  Wallet,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { categoryKeyFromName, type CategoryAssetKey } from "@/lib/expenses-v2/category-assets";
import { cn } from "@/lib/utils";

export interface CategoryLike {
  name?: string | null;
  color?: string | null;
  emoji?: string | null;
}

const ICONS: Record<CategoryAssetKey, LucideIcon> = {
  transport: Car,
  accommodation: Hotel,
  activities: PartyPopper,
  food: UtensilsCrossed,
  drinks: Beer,
  gifts: Gift,
  other: Wallet,
};

export function CategoryIcon({
  category,
  size = "row",
  selected = false,
  className,
}: {
  category: CategoryLike | null | undefined;
  size?: "row" | "tile";
  selected?: boolean;
  className?: string;
}) {
  const key = categoryKeyFromName(category?.name);
  const Icon: LucideIcon = key ? ICONS[key] : Tag;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        selected ? "text-primary" : "text-foreground/70",
        className,
      )}
    >
      <Icon className="w-1/2 h-1/2" strokeWidth={1.9} aria-hidden />
    </span>
  );
}

export default CategoryIcon;
