import type { BottleCard, BottleCategory, CardType } from './bottlespin-content-de';

export type ContentSelection = CardType | 'mixed';
export function filterBottleCards(cards: readonly BottleCard[], categories: readonly BottleCategory[], type: ContentSelection): BottleCard[] {
  return cards.filter(card => categories.includes(card.category) && (type === 'mixed' || card.type === type));
}

/** Draw every selected card once before refilling; never repeat across the boundary when avoidable. */
export function createBottleDeck(cards: readonly BottleCard[], random = Math.random) {
  let remaining: BottleCard[] = [];
  let last: BottleCard | undefined;
  return {
    draw(): BottleCard | undefined {
      if (!remaining.length) {
        remaining = [...cards];
        for (let i = remaining.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1));
          [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
        }
        if (remaining.length > 1 && remaining[remaining.length - 1] === last) {
          [remaining[0], remaining[remaining.length - 1]] = [remaining[remaining.length - 1], remaining[0]];
        }
      }
      last = remaining.pop();
      return last;
    },
  };
}
