import { useTranslation } from 'react-i18next';
import { Check, MessageCircle, Sparkles, ArrowRight } from 'lucide-react';
import { StageHeader, StageAction } from '../ui/GameStage';
import { BottleObject } from './BottleObject';
import { filterBottleCards, type ContentSelection as Selection } from './deck';
import type { BottleCard, BottleCategory } from './bottlespin-content';
import type { CategoryMeta } from './bottlespin-content-de';

interface Props {
  cards: BottleCard[];
  categories: Record<string, CategoryMeta>;
  selected: BottleCategory[];
  type: Selection;
  onToggle: (category: BottleCategory) => void;
  onType: (type: Selection) => void;
  onContinue: () => void;
  disabled?: boolean;
}

export function BottleContentSelection({ cards, categories, selected, type, onToggle, onType, onContinue, disabled }: Props) {
  const { t } = useTranslation();
  const count = filterBottleCards(cards, selected, type).length;
  return <section className="bottle-selection" data-phase="content-setup">
    <div className="bottle-selection-heading">
      <StageHeader title={t('gameNames.flaschendrehen')} subtitle={t('games.bottlespin.categorySelection')} />
      <BottleObject />
    </div>
    <fieldset disabled={disabled}>
      <legend>{t('games.bottlespin.contentSelection')}</legend>
      <div className="bottle-content-types">
        {([
          ['mixed', 'mixedCards', <Sparkles size={18} />],
          ['frage', 'questionsOnly', <MessageCircle size={18} />],
          ['aufgabe', 'tasksOnly', <Check size={18} />],
        ] as const).map(([id, label, icon]) => <button type="button" key={id} aria-pressed={type === id} onClick={() => onType(id)}>{icon}<span>{t(`games.bottlespin.${label}`)}</span></button>)}
      </div>
    </fieldset>
    <fieldset disabled={disabled}>
      <legend>{t('games.bottlespin.categorySelection')}</legend>
      <div className="bottle-category-grid">
        {(Object.keys(categories) as BottleCategory[]).filter(category => filterBottleCards(cards, [category], type).length > 0).map((category, index) => {
          const active = selected.includes(category);
          const categoryCount = filterBottleCards(cards, [category], type).length;
          return <button type="button" key={category} aria-pressed={active} onClick={() => onToggle(category)}>
            <span className="bottle-category-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <span><strong>{categories[category].name}</strong><small>{t('games.bottlespin.availableCards', { count: categoryCount })}</small></span>
            <span className="bottle-category-check" aria-hidden="true">{active && <Check size={15} />}</span>
          </button>;
        })}
      </div>
    </fieldset>
    <div className="bottle-selection-footer">
      <p role="status">{count ? t('games.bottlespin.availableCards', { count }) : t('games.bottlespin.selectionRequired')}</p>
      <StageAction disabled={disabled || !count} onClick={onContinue}>{t('games.bottlespin.prepareRound')}<ArrowRight size={18} /></StageAction>
    </div>
  </section>;
}
