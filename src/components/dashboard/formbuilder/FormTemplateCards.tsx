import { motion } from "framer-motion";
import {
  PartyPopper,
  Cake,
  Plane,
  Heart,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type FormField, createField } from "./types";

interface FormTemplateCardsProps {
  onSelectTemplate: (fields: FormField[]) => void;
}

interface TemplateDefinition {
  name: string;
  description: string;
  icon: typeof PartyPopper;
  color: string;
  gradient: string;
  fields: Array<{ type: FormField["type"]; label: string; required: boolean; options?: string[] }>;
}

const TEMPLATES: TemplateDefinition[] = [
  {
    name: "JGA Survey",
    description: "Bachelorette / bachelor party planning",
    icon: PartyPopper,
    color: "text-violet-400",
    gradient: "from-violet-500/20 to-fuchsia-500/20",
    fields: [
      { type: "select", label: "Can you attend?", required: true, options: ["Yes, definitely!", "Maybe", "Unfortunately not"] },
      { type: "date_range", label: "Preferred dates", required: true },
      { type: "slider", label: "Budget (EUR)", required: true },
      { type: "select", label: "Preferred destination", required: false, options: ["City trip", "Nature", "Beach", "Stay local"] },
      { type: "rating", label: "Fitness level", required: false },
      { type: "checkbox_group", label: "Activity preferences", required: false, options: ["Spa & Wellness", "Adventure", "Nightlife", "Sightseeing", "Sports"] },
    ],
  },
  {
    name: "Birthday Planning",
    description: "Coordinate the perfect birthday party",
    icon: Cake,
    color: "text-amber-400",
    gradient: "from-amber-500/20 to-orange-500/20",
    fields: [
      { type: "select", label: "Will you be there?", required: true, options: ["Count me in!", "Not sure yet", "Can't make it"] },
      { type: "date_range", label: "Date preference", required: false },
      { type: "textarea", label: "Gift ideas", required: false },
      { type: "checkbox_group", label: "Dietary restrictions", required: false, options: ["Vegetarian", "Vegan", "Gluten-free", "No allergies"] },
      { type: "checkbox_group", label: "Activity votes", required: false, options: ["BBQ", "Game night", "Karaoke", "Movie night", "Escape room"] },
    ],
  },
  {
    name: "Trip Voting",
    description: "Plan a group trip together",
    icon: Plane,
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 to-sky-500/20",
    fields: [
      { type: "date_range", label: "Available dates", required: true },
      { type: "checkbox_group", label: "Destination votes", required: true, options: ["Barcelona", "Amsterdam", "Prague", "Lisbon", "Vienna"] },
      { type: "slider", label: "Max budget per person", required: true },
      { type: "select", label: "Trip duration", required: false, options: ["Weekend (2-3 days)", "Short trip (4-5 days)", "Full week"] },
      { type: "select", label: "Accommodation preference", required: false, options: ["Hotel", "Airbnb", "Hostel", "No preference"] },
    ],
  },
  {
    name: "Wedding RSVP",
    description: "Elegant wedding response form",
    icon: Heart,
    color: "text-pink-400",
    gradient: "from-pink-500/20 to-rose-500/20",
    fields: [
      { type: "select", label: "Will you attend?", required: true, options: ["Joyfully accept", "Regretfully decline"] },
      { type: "number", label: "Number of guests", required: true },
      { type: "checkbox_group", label: "Dietary needs", required: false, options: ["Vegetarian", "Vegan", "Gluten-free", "Halal", "Kosher", "None"] },
      { type: "text", label: "Song request", required: false },
      { type: "select", label: "Need accommodation?", required: false, options: ["Yes, both nights", "Yes, one night", "No, all set"] },
    ],
  },
  {
    name: "Corporate Event",
    description: "Professional event registration",
    icon: Building2,
    color: "text-blue-400",
    gradient: "from-blue-500/20 to-indigo-500/20",
    fields: [
      { type: "checkbox_group", label: "Sessions to attend", required: true, options: ["Keynote", "Workshop A", "Workshop B", "Panel Discussion", "Networking"] },
      { type: "checkbox_group", label: "Dietary requirements", required: false, options: ["Vegetarian", "Vegan", "Gluten-free", "Halal", "None"] },
      { type: "select", label: "Travel needs", required: false, options: ["No travel needed", "Need parking", "Need shuttle", "Flying in"] },
      { type: "checkbox_group", label: "Networking interests", required: false, options: ["Engineering", "Design", "Marketing", "Sales", "Leadership"] },
    ],
  },
];

export const FormTemplateCards = ({
  onSelectTemplate,
}: FormTemplateCardsProps) => {
  const applyTemplate = (template: TemplateDefinition) => {
    const fields: FormField[] = template.fields.map((def) => {
      const field = createField(def.type);
      field.label = def.label;
      field.required = def.required;
      if (def.options) field.options = def.options;
      return field;
    });
    onSelectTemplate(fields);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory">
      {TEMPLATES.map((template) => {
        const Icon = template.icon;
        return (
          <motion.div
            key={template.name}
            whileHover={{ y: -4 }}
            className="flex-shrink-0 w-56 snap-start"
          >
            <div className="rounded-xl border border-border/50 bg-background/60 backdrop-blur overflow-hidden">
              {/* Gradient header */}
              <div
                className={`h-20 bg-gradient-to-br ${template.gradient} flex items-center justify-center`}
              >
                <Icon className={`w-8 h-8 ${template.color}`} />
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-semibold">{template.name}</h4>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                    {template.description}
                  </p>
                </div>

                <Badge variant="secondary" className="text-[10px]">
                  {template.fields.length} fields
                </Badge>

                <Button
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => applyTemplate(template)}
                >
                  Use Template
                </Button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
