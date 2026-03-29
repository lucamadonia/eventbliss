import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  GripVertical,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { type FormField, FIELD_TYPE_META } from "./types";

interface FieldCardProps {
  field: FormField;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<FormField>) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

export const FieldCard = ({
  field,
  index,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: FieldCardProps) => {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editLabel, setEditLabel] = useState(field.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const meta = FIELD_TYPE_META[field.type];

  useEffect(() => {
    if (isEditingLabel && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingLabel]);

  const commitLabel = () => {
    setIsEditingLabel(false);
    const trimmed = editLabel.trim();
    if (trimmed && trimmed !== field.label) {
      onUpdate(field.id, { label: trimmed });
    } else {
      setEditLabel(field.label);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      onClick={() => onSelect(field.id)}
      className={`
        group relative flex items-center gap-3 rounded-xl border-l-4 p-4 cursor-pointer
        transition-all duration-200
        ${meta.borderColor}
        ${
          isSelected
            ? "bg-primary/5 ring-1 ring-primary/40 shadow-md"
            : "bg-background/60 hover:bg-background/80 border border-l-4 border-border/50"
        }
      `}
    >
      {/* Drag handle */}
      <div className="flex-shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground/70 cursor-grab">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Index */}
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted/60 text-xs font-medium flex items-center justify-center text-muted-foreground">
        {index + 1}
      </span>

      {/* Label */}
      <div className="flex-1 min-w-0">
        {isEditingLabel ? (
          <input
            ref={inputRef}
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitLabel();
              if (e.key === "Escape") {
                setEditLabel(field.label);
                setIsEditingLabel(false);
              }
            }}
            className="w-full bg-transparent border-b border-primary/50 text-sm font-medium outline-none py-0.5"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="text-sm font-medium truncate block cursor-text hover:text-primary transition-colors"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingLabel(true);
            }}
          >
            {field.label || "Untitled field"}
          </span>
        )}
      </div>

      {/* Type badge */}
      <Badge variant="secondary" className="text-[10px] px-2 py-0.5 flex-shrink-0">
        {meta.label}
      </Badge>

      {/* Required toggle */}
      <div
        className="flex items-center gap-1.5 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[10px] text-muted-foreground">Req</span>
        <Switch
          checked={field.required}
          onCheckedChange={(checked) =>
            onUpdate(field.id, { required: checked })
          }
          className="scale-75"
        />
      </div>

      {/* Reorder buttons */}
      <div className="flex flex-col gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          disabled={isFirst}
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp(index);
          }}
        >
          <ChevronUp className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          disabled={isLast}
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown(index);
          }}
        >
          <ChevronDown className="w-3 h-3" />
        </Button>
      </div>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(field.id);
        }}
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </motion.div>
  );
};
