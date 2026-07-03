/**
 * QuestionCardStack — the reorderable list of core + custom question cards.
 *
 * Renders the effective question order (getEffectiveQuestionOrder), interleaving
 * core keys and custom questions. Design choice: group headers (STUDIO_GROUPS)
 * are only shown while the order is still the DEFAULT order — once the organizer
 * has manually reordered, a single flat list is shown instead (headers would be
 * meaningless mid-sequence and fight the drag measurement).
 */
import { Fragment } from "react";
import { Reorder } from "framer-motion";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { QuestionCard } from "./QuestionCard";
import {
  CORE_META_BY_KEY,
  STUDIO_GROUPS,
  optionsOf,
  type CoreKey,
} from "@/components/formstudio/questionRegistry";
import {
  type EventSettings,
  type QuestionConfigs,
  getEffectiveQuestionOrder,
  getDateBlocks,
  CUSTOM_ORDER_PREFIX,
  CORE_QUESTION_KEYS,
} from "@/lib/survey-config";

interface QuestionCardStackProps {
  settings: EventSettings;
  onReorder: (order: string[]) => void;
  onDrop: () => void;
  onOpenCore: (key: CoreKey) => void;
  onToggleCore: (key: CoreKey) => void;
  onOpenCustom: (id: string) => void;
  onDeleteCustom: (id: string) => void;
  onUndo: () => void;
}

const translateLabel = (label: string): string =>
  label.startsWith("templates.") && i18n.exists(label) ? i18n.t(label) : label;

export function QuestionCardStack({
  settings,
  onReorder,
  onDrop,
  onOpenCore,
  onToggleCore,
  onOpenCustom,
  onDeleteCustom,
  onUndo,
}: QuestionCardStackProps) {
  const { t } = useTranslation();

  const order = getEffectiveQuestionOrder(settings);
  const defaultOrder = getEffectiveQuestionOrder({ ...settings, question_order: undefined });
  const isDefaultOrder =
    order.length === defaultOrder.length && order.every((id, i) => id === defaultOrder[i]);

  const questionConfig = settings.question_config as QuestionConfigs;
  const customById = new Map((settings.custom_questions ?? []).map((q) => [q.id, q]));
  const dateBlocks = getDateBlocks(settings);

  // Group header shown before the first core key of each group (default order only).
  const firstOfGroup = new Map<CoreKey, (typeof STUDIO_GROUPS)[number]["id"]>();
  if (isDefaultOrder) {
    const seen = new Set<string>();
    for (const key of CORE_QUESTION_KEYS) {
      const g = CORE_META_BY_KEY[key].group;
      if (!seen.has(g)) {
        seen.add(g);
        firstOfGroup.set(key, g);
      }
    }
  }

  return (
    <Reorder.Group axis="y" values={order} onReorder={onReorder} className="space-y-2.5">
      {order.map((id) => {
        if (id.startsWith(CUSTOM_ORDER_PREFIX)) {
          const q = customById.get(id.slice(CUSTOM_ORDER_PREFIX.length));
          if (!q) return null;
          return (
            <QuestionCard
              key={id}
              value={id}
              custom={q}
              answerCount={q.options?.length ?? 0}
              multiSelect={q.type === "checkbox"}
              chips={q.options?.slice(0, 3) ?? []}
              onOpen={() => onOpenCustom(q.id)}
              onDelete={() => onDeleteCustom(q.id)}
              onUndo={onUndo}
              onDropped={onDrop}
            />
          );
        }

        const key = id as CoreKey;
        const meta = CORE_META_BY_KEY[key];
        if (!meta) return null;
        const opts = optionsOf(settings, key);
        const isDates = meta.optionsKey === null;
        const chips = isDates
          ? dateBlocks.map((b) => translateLabel(b.label || b.key))
          : opts.map((o) => translateLabel(o.label));
        const answerCount = isDates ? dateBlocks.length : opts.length;
        const cfg = questionConfig[key];
        const group = firstOfGroup.get(key);

        return (
          <Fragment key={id}>
            {group && (
              <h3 className="pt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                {t(STUDIO_GROUPS.find((g) => g.id === group)!.labelKey, group)}
              </h3>
            )}
            <QuestionCard
              value={id}
              meta={meta}
              config={cfg}
              answerCount={answerCount}
              multiSelect={cfg?.multiSelect ?? false}
              chips={chips}
              onOpen={() => onOpenCore(key)}
              onToggle={() => onToggleCore(key)}
              onDropped={onDrop}
            />
          </Fragment>
        );
      })}
    </Reorder.Group>
  );
}
