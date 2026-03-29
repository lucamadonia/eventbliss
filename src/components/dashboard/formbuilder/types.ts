export type FieldType =
  | "text"
  | "select"
  | "multi_select"
  | "date_range"
  | "slider"
  | "rating"
  | "checkbox_group"
  | "textarea"
  | "number";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[]; // for select, multi_select, checkbox_group
  min?: number; // for slider, number
  max?: number; // for slider, number
  showIf?: { fieldId: string; value: string }; // conditional visibility
}

export interface FormTemplate {
  name: string;
  description: string;
  icon: string; // Lucide icon name
  fields: FormField[];
}

export const FIELD_TYPE_META: Record<
  FieldType,
  { label: string; borderColor: string }
> = {
  text: { label: "Text", borderColor: "border-l-blue-500" },
  select: { label: "Select", borderColor: "border-l-violet-500" },
  multi_select: { label: "Multi Select", borderColor: "border-l-fuchsia-500" },
  date_range: { label: "Date Range", borderColor: "border-l-cyan-500" },
  slider: { label: "Slider", borderColor: "border-l-emerald-500" },
  rating: { label: "Rating", borderColor: "border-l-amber-500" },
  checkbox_group: {
    label: "Checkbox Group",
    borderColor: "border-l-rose-500",
  },
  textarea: { label: "Text Area", borderColor: "border-l-indigo-500" },
  number: { label: "Number", borderColor: "border-l-green-500" },
};

export function createField(type: FieldType): FormField {
  const id = `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const base: FormField = { id, type, label: "", required: false };

  switch (type) {
    case "select":
    case "multi_select":
    case "checkbox_group":
      return { ...base, label: FIELD_TYPE_META[type].label, options: ["Option 1", "Option 2"] };
    case "slider":
      return { ...base, label: "Slider", min: 0, max: 100 };
    case "rating":
      return { ...base, label: "Rating", min: 1, max: 5 };
    case "number":
      return { ...base, label: "Number", min: 0, max: 999 };
    default:
      return { ...base, label: FIELD_TYPE_META[type].label };
  }
}
