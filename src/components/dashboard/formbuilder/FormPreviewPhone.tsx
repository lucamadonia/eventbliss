import { motion } from "framer-motion";
import { Star, Calendar, ChevronDown } from "lucide-react";
import { type FormField } from "./types";

interface FormPreviewPhoneProps {
  fields: FormField[];
  selectedFieldId: string | null;
}

export const FormPreviewPhone = ({
  fields,
  selectedFieldId,
}: FormPreviewPhoneProps) => {
  return (
    <div className="rounded-[2.5rem] border-4 border-slate-700 bg-slate-900 p-2 w-[320px] mx-auto shadow-2xl">
      {/* Notch */}
      <div className="flex justify-center mb-2">
        <div className="w-24 h-5 bg-black rounded-full" />
      </div>

      {/* Screen */}
      <div className="rounded-[2rem] bg-slate-950 min-h-[480px] max-h-[520px] overflow-y-auto px-4 py-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
        {/* Form header */}
        <div className="text-center mb-2">
          <h3 className="text-white text-sm font-semibold">Form Preview</h3>
          <p className="text-slate-500 text-[10px]">
            {fields.length} field{fields.length !== 1 ? "s" : ""}
          </p>
        </div>

        {fields.length === 0 && (
          <div className="flex items-center justify-center h-40 text-slate-600 text-xs">
            Add fields to preview them here
          </div>
        )}

        {fields.map((field) => (
          <motion.div
            key={field.id}
            layout
            className={`rounded-lg p-3 transition-all duration-200 ${
              selectedFieldId === field.id
                ? "ring-2 ring-primary/60 bg-slate-800/80"
                : "bg-slate-800/40"
            }`}
          >
            {/* Label */}
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
              {field.label || "Untitled"}
              {field.required && (
                <span className="text-red-400 ml-0.5">*</span>
              )}
            </label>

            {/* Field rendering by type */}
            {renderFieldPreview(field)}

            {field.helpText && (
              <p className="text-[9px] text-slate-500 mt-1">{field.helpText}</p>
            )}
          </motion.div>
        ))}

        {/* Bottom spacer for safe area */}
        <div className="h-4" />
      </div>

      {/* Home indicator */}
      <div className="flex justify-center mt-2">
        <div className="w-28 h-1 bg-slate-600 rounded-full" />
      </div>
    </div>
  );
};

function renderFieldPreview(field: FormField) {
  switch (field.type) {
    case "text":
      return (
        <div className="h-8 rounded-md bg-slate-700/50 border border-slate-600/50 px-2 flex items-center">
          <span className="text-[10px] text-slate-500">
            {field.placeholder || "Enter text..."}
          </span>
        </div>
      );

    case "textarea":
      return (
        <div className="h-16 rounded-md bg-slate-700/50 border border-slate-600/50 px-2 pt-1.5">
          <span className="text-[10px] text-slate-500">
            {field.placeholder || "Enter text..."}
          </span>
        </div>
      );

    case "number":
      return (
        <div className="h-8 rounded-md bg-slate-700/50 border border-slate-600/50 px-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            {field.min ?? 0}
          </span>
          <span className="text-[9px] text-slate-600">
            {field.min ?? 0} - {field.max ?? 999}
          </span>
        </div>
      );

    case "select":
      return (
        <div className="h-8 rounded-md bg-slate-700/50 border border-slate-600/50 px-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">Select an option</span>
          <ChevronDown className="w-3 h-3 text-slate-500" />
        </div>
      );

    case "multi_select":
    case "checkbox_group":
      return (
        <div className="space-y-1.5">
          {(field.options || []).slice(0, 4).map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-3.5 h-3.5 rounded ${
                  field.type === "checkbox_group" ? "rounded" : "rounded-sm"
                } border border-slate-500 flex-shrink-0`}
              />
              <span className="text-[10px] text-slate-400">{opt}</span>
            </div>
          ))}
          {(field.options || []).length > 4 && (
            <span className="text-[9px] text-slate-600">
              +{(field.options || []).length - 4} more
            </span>
          )}
        </div>
      );

    case "slider":
      return (
        <div className="space-y-1">
          <div className="h-1.5 rounded-full bg-slate-700 relative">
            <div className="absolute left-0 top-0 h-full w-1/2 rounded-full bg-primary/60" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-slate-900" />
          </div>
          <div className="flex justify-between">
            <span className="text-[9px] text-slate-600">{field.min ?? 0}</span>
            <span className="text-[9px] text-slate-600">{field.max ?? 100}</span>
          </div>
        </div>
      );

    case "rating":
      return (
        <div className="flex gap-1">
          {Array.from({ length: field.max || 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < 3
                  ? "text-amber-400 fill-amber-400"
                  : "text-slate-600"
              }`}
            />
          ))}
        </div>
      );

    case "date_range":
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-8 rounded-md bg-slate-700/50 border border-slate-600/50 px-2 flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] text-slate-500">Start date</span>
          </div>
          <span className="text-slate-600 text-[10px]">-</span>
          <div className="flex-1 h-8 rounded-md bg-slate-700/50 border border-slate-600/50 px-2 flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] text-slate-500">End date</span>
          </div>
        </div>
      );

    default:
      return null;
  }
}
