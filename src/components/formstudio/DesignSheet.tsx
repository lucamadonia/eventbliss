/**
 * DesignSheet — template + branding editor, wrapped as a Studio sheet.
 * Reuses DesignTemplateSelector and BrandingEditor; both funnel into
 * SET_BRANDING so the autosave engine persists the branding block.
 */
import { useTranslation } from "react-i18next";
import { StudioSheet } from "./StudioSheet";
import { DesignTemplateSelector } from "@/components/dashboard/DesignTemplateSelector";
import { BrandingEditor } from "@/components/dashboard/BrandingEditor";
import type { FormStudioAction } from "./formStudioReducer";
import { type EventSettings, type BrandingConfig, DEFAULT_BRANDING } from "@/lib/survey-config";
import { getTemplateById, type DesignTemplate } from "@/lib/design-templates";

interface DesignSheetProps {
  open: boolean;
  settings: EventSettings;
  eventName: string;
  honoreeName: string;
  eventType: string;
  dispatch: React.Dispatch<FormStudioAction>;
  onClose: () => void;
  flush: () => void;
}

export function DesignSheet({
  open,
  settings,
  eventName,
  honoreeName,
  eventType,
  dispatch,
  onClose,
  flush,
}: DesignSheetProps) {
  const { t } = useTranslation();
  const branding = settings.branding ?? DEFAULT_BRANDING;
  const selectedTemplate = branding.template_id ? getTemplateById(branding.template_id) ?? null : null;

  const setBranding = (next: BrandingConfig) => dispatch({ type: "SET_BRANDING", branding: next });

  const onTemplate = (template: DesignTemplate) =>
    setBranding({
      ...branding,
      primary_color: template.branding.primary_color,
      accent_color: template.branding.accent_color,
      background_style: template.branding.background_style,
      template_id: template.id,
    });

  return (
    <StudioSheet open={open} onClose={onClose} flush={flush} emoji="🎨" title={t("formStudio.design", "Design")}>
      <div className="space-y-6">
        <DesignTemplateSelector
          selectedTemplateId={selectedTemplate?.id ?? null}
          onSelect={onTemplate}
          eventType={eventType}
        />
        <BrandingEditor
          branding={branding}
          onChange={setBranding}
          eventName={eventName}
          honoreeName={honoreeName}
          selectedTemplate={selectedTemplate}
        />
      </div>
    </StudioSheet>
  );
}
