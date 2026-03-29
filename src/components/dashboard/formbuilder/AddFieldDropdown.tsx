import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Type,
  ListOrdered,
  CheckSquare,
  Calendar,
  SlidersHorizontal,
  Star,
  CheckCircle2,
  AlignLeft,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type FieldType } from "./types";

interface AddFieldDropdownProps {
  onAddField: (type: FieldType) => void;
}

const FIELD_OPTIONS: { type: FieldType; label: string; icon: typeof Type }[] = [
  { type: "text", label: "Text", icon: Type },
  { type: "select", label: "Select", icon: ListOrdered },
  { type: "multi_select", label: "Multi Select", icon: CheckSquare },
  { type: "date_range", label: "Date Range", icon: Calendar },
  { type: "slider", label: "Slider", icon: SlidersHorizontal },
  { type: "rating", label: "Rating", icon: Star },
  { type: "checkbox_group", label: "Checkboxes", icon: CheckCircle2 },
  { type: "textarea", label: "Text Area", icon: AlignLeft },
  { type: "number", label: "Number", icon: Hash },
];

export const AddFieldDropdown = ({ onAddField }: AddFieldDropdownProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-dashed border-2 gap-2 h-12 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Field
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="center">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="grid grid-cols-3 gap-2"
            >
              {FIELD_OPTIONS.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => {
                    onAddField(type);
                    setOpen(false);
                  }}
                  className="flex flex-col items-center gap-1.5 rounded-lg p-3 text-center transition-colors hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium leading-tight">
                    {label}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
};
