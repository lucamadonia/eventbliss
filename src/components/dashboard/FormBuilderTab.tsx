import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Settings2,
  Eye,
  Clock,
  Layers,
  LayoutTemplate,
  Smartphone,
  FileText,
  ToggleLeft,
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type EventSettings,
  mergeWithDefaults,
} from "@/lib/survey-config";
import {
  type FormField,
  type FieldType,
  createField,
} from "./formbuilder/types";
import { FieldCard } from "./formbuilder/FieldCard";
import { FormPreviewPhone } from "./formbuilder/FormPreviewPhone";
import { AddFieldDropdown } from "./formbuilder/AddFieldDropdown";
import { FormTemplateCards } from "./formbuilder/FormTemplateCards";

interface Event {
  id: string;
  slug: string;
  name: string;
  honoree_name?: string;
  event_type?: string;
  settings: Partial<EventSettings> | null;
}

interface FormBuilderTabProps {
  event: Event;
  onUpdate: () => void;
}

export const FormBuilderTab = ({ event, onUpdate }: FormBuilderTabProps) => {
  const { t } = useTranslation();
  const settings = mergeWithDefaults(event.settings);

  // --- State ---
  const [fields, setFields] = useState<FormField[]>(() =>
    convertSettingsToFields(settings)
  );
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeEditorTab, setActiveEditorTab] = useState("fields");
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Settings tab state
  const [formTitle, setFormTitle] = useState(
    settings.branding?.hero_title || event.name || ""
  );
  const [formDescription, setFormDescription] = useState(
    settings.branding?.hero_subtitle || ""
  );
  const [thankYouMessage, setThankYouMessage] = useState("Thank you for your response!");
  const [allowAnonymous, setAllowAnonymous] = useState(true);

  // --- Field CRUD ---
  const handleAddField = useCallback((type: FieldType) => {
    const newField = createField(type);
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  }, []);

  const handleUpdateField = useCallback(
    (id: string, updates: Partial<FormField>) => {
      setFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    []
  );

  const handleDeleteField = useCallback(
    (id: string) => {
      setFields((prev) => prev.filter((f) => f.id !== id));
      if (selectedFieldId === id) setSelectedFieldId(null);
    },
    [selectedFieldId]
  );

  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0) return;
    setFields((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setFields((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const handleApplyTemplate = useCallback((templateFields: FormField[]) => {
    setFields(templateFields);
    setSelectedFieldId(null);
    setActiveEditorTab("fields");
    toast.success("Template applied");
  }, []);

  // --- Field config panel for selected field ---
  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

  // --- Save ---
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedSettings: Partial<EventSettings> = {
        ...settings,
        branding: {
          ...(settings.branding || {}),
          primary_color: settings.branding?.primary_color || "#6366f1",
          accent_color: settings.branding?.accent_color || "#8b5cf6",
          background_style: settings.branding?.background_style || "gradient",
          hero_title: formTitle,
          hero_subtitle: formDescription,
        },
        custom_questions: fields.map((f) => ({
          id: f.id,
          type: mapFieldTypeToQuestionType(f.type),
          label: f.label,
          required: f.required,
          placeholder: f.placeholder,
          options: f.options?.map((o) => ({ value: o.toLowerCase().replace(/\s+/g, "_"), label: o })),
        })),
      };

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-event-settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            event_id: event.id,
            settings: updatedSettings,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || t("common.error"));
      }

      toast.success(t("dashboard.form.successMessage"));
      onUpdate();
    } catch (error) {
      console.error("Save error:", error);
      toast.error(t("common.error"));
    } finally {
      setIsSaving(false);
    }
  };

  const estimatedMinutes = Math.max(1, Math.ceil((fields.length * 20) / 60));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-primary" />
            {t("dashboard.form.title")}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t("dashboard.form.subtitle", { eventName: event.name })}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Mobile preview toggle */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 lg:hidden"
            onClick={() => setShowMobilePreview(!showMobilePreview)}
          >
            <Smartphone className="w-4 h-4" />
            Preview
          </Button>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a
              href={`/e/${event.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Eye className="w-4 h-4" />
              {t("dashboard.form.preview")}
            </a>
          </Button>
          <GradientButton
            onClick={handleSave}
            disabled={isSaving}
            icon={<Save className="w-4 h-4" />}
          >
            {isSaving ? t("dashboard.form.saving") : t("dashboard.form.save")}
          </GradientButton>
        </div>
      </div>

      {/* Main split layout */}
      <div className="flex gap-6">
        {/* Editor panel (2/3) */}
        <div className="flex-1 min-w-0 space-y-4">
          <Tabs
            value={activeEditorTab}
            onValueChange={setActiveEditorTab}
            className="space-y-4"
          >
            <TabsList className="grid grid-cols-3 w-full max-w-sm">
              <TabsTrigger value="fields" className="gap-1.5 text-xs">
                <Layers className="w-3.5 h-3.5" />
                Fields
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-1.5 text-xs">
                <LayoutTemplate className="w-3.5 h-3.5" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5 text-xs">
                <Settings2 className="w-3.5 h-3.5" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* FIELDS TAB */}
            <TabsContent value="fields" className="space-y-3">
              <AnimatePresence mode="popLayout">
                {fields.map((field, index) => (
                  <FieldCard
                    key={field.id}
                    field={field}
                    index={index}
                    isSelected={selectedFieldId === field.id}
                    onSelect={setSelectedFieldId}
                    onUpdate={handleUpdateField}
                    onDelete={handleDeleteField}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    isFirst={index === 0}
                    isLast={index === fields.length - 1}
                  />
                ))}
              </AnimatePresence>

              {fields.length === 0 && (
                <GlassCard className="p-8 text-center">
                  <FileText className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No fields yet. Add one below or pick a template.
                  </p>
                </GlassCard>
              )}

              <AddFieldDropdown onAddField={handleAddField} />

              {/* Inline field config panel */}
              <AnimatePresence>
                {selectedField && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    <GlassCard className="p-5 space-y-4 border-primary/20">
                      <h4 className="text-sm font-semibold">
                        Configure: {selectedField.label || "Untitled"}
                      </h4>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Label</Label>
                          <Input
                            value={selectedField.label}
                            onChange={(e) =>
                              handleUpdateField(selectedField.id, {
                                label: e.target.value,
                              })
                            }
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Placeholder</Label>
                          <Input
                            value={selectedField.placeholder || ""}
                            onChange={(e) =>
                              handleUpdateField(selectedField.id, {
                                placeholder: e.target.value,
                              })
                            }
                            className="h-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Help text</Label>
                        <Input
                          value={selectedField.helpText || ""}
                          onChange={(e) =>
                            handleUpdateField(selectedField.id, {
                              helpText: e.target.value,
                            })
                          }
                          className="h-9"
                          placeholder="Optional helper text shown below the field"
                        />
                      </div>

                      {/* Options editor for select/multi_select/checkbox_group */}
                      {(selectedField.type === "select" ||
                        selectedField.type === "multi_select" ||
                        selectedField.type === "checkbox_group") && (
                        <OptionsEditor
                          options={selectedField.options || []}
                          onChange={(options) =>
                            handleUpdateField(selectedField.id, { options })
                          }
                        />
                      )}

                      {/* Min/Max for slider, number, rating */}
                      {(selectedField.type === "slider" ||
                        selectedField.type === "number" ||
                        selectedField.type === "rating") && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Min</Label>
                            <Input
                              type="number"
                              value={selectedField.min ?? 0}
                              onChange={(e) =>
                                handleUpdateField(selectedField.id, {
                                  min: Number(e.target.value),
                                })
                              }
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Max</Label>
                            <Input
                              type="number"
                              value={selectedField.max ?? 100}
                              onChange={(e) =>
                                handleUpdateField(selectedField.id, {
                                  max: Number(e.target.value),
                                })
                              }
                              className="h-9"
                            />
                          </div>
                        </div>
                      )}
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* TEMPLATES TAB */}
            <TabsContent value="templates" className="space-y-4">
              <GlassCard className="p-5">
                <h4 className="text-sm font-semibold mb-1">
                  Quick-start Templates
                </h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Pick a template to pre-populate your form fields. You can
                  customize everything afterward.
                </p>
                <FormTemplateCards onSelectTemplate={handleApplyTemplate} />
              </GlassCard>
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="settings" className="space-y-4">
              <GlassCard className="p-5 space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Form Title</Label>
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Give your form a title"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Description</Label>
                  <Textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="A short description for respondents"
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Thank-you Message
                  </Label>
                  <Input
                    value={thankYouMessage}
                    onChange={(e) => setThankYouMessage(e.target.value)}
                    placeholder="Message shown after submission"
                    className="h-9"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">
                        Allow anonymous responses
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Respondents can submit without identifying themselves
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={allowAnonymous}
                    onCheckedChange={setAllowAnonymous}
                  />
                </div>
              </GlassCard>
            </TabsContent>
          </Tabs>
        </div>

        {/* Phone preview (1/3 width, desktop only) */}
        <div className="hidden lg:block w-[360px] flex-shrink-0">
          <div className="sticky top-6">
            <FormPreviewPhone
              fields={fields}
              selectedFieldId={selectedFieldId}
            />
          </div>
        </div>
      </div>

      {/* Mobile preview overlay */}
      <AnimatePresence>
        {showMobilePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center lg:hidden"
            onClick={() => setShowMobilePreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <FormPreviewPhone
                fields={fields}
                selectedFieldId={selectedFieldId}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom status bar */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              {fields.length} field{fields.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />~{estimatedMinutes} min to complete
            </span>
          </div>
          <GradientButton
            onClick={handleSave}
            disabled={isSaving}
            icon={<Save className="w-4 h-4" />}
          >
            {isSaving ? t("dashboard.form.saving") : t("dashboard.form.save")}
          </GradientButton>
        </div>
      </GlassCard>
    </div>
  );
};

// --- Options Editor sub-component ---

function OptionsEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (options: string[]) => void;
}) {
  const [newOption, setNewOption] = useState("");

  const addOption = () => {
    const trimmed = newOption.trim();
    if (!trimmed) return;
    onChange([...options, trimmed]);
    setNewOption("");
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Options</Label>
      <div className="space-y-1.5">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={opt}
              onChange={(e) => {
                const next = [...options];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="h-8 text-xs"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
              onClick={() => onChange(options.filter((_, idx) => idx !== i))}
            >
              x
            </Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addOption()}
          placeholder="New option"
          className="h-8 text-xs flex-1"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          onClick={addOption}
          disabled={!newOption.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

// --- Helpers ---

function mapFieldTypeToQuestionType(
  type: FieldType
): "text" | "select" | "multi_select" | "date" | "number" | "scale" | "textarea" {
  switch (type) {
    case "text":
      return "text";
    case "textarea":
      return "textarea";
    case "select":
      return "select";
    case "multi_select":
    case "checkbox_group":
      return "multi_select";
    case "date_range":
      return "date";
    case "number":
      return "number";
    case "slider":
    case "rating":
      return "scale";
    default:
      return "text";
  }
}

function convertSettingsToFields(settings: ReturnType<typeof mergeWithDefaults>): FormField[] {
  const fields: FormField[] = [];

  if (settings.custom_questions && settings.custom_questions.length > 0) {
    for (const q of settings.custom_questions) {
      const fieldType = mapQuestionTypeToFieldType(q.type);
      fields.push({
        id: q.id || `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: fieldType,
        label: q.label,
        required: q.required || false,
        placeholder: q.placeholder,
        options: q.options?.map((o: { label: string }) => o.label),
      });
    }
  }

  return fields;
}

function mapQuestionTypeToFieldType(type: string): FieldType {
  switch (type) {
    case "text":
      return "text";
    case "textarea":
      return "textarea";
    case "select":
      return "select";
    case "multi_select":
      return "multi_select";
    case "date":
      return "date_range";
    case "number":
      return "number";
    case "scale":
      return "slider";
    default:
      return "text";
  }
}
