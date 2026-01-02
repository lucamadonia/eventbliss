import { AlertTriangle, CheckCircle2, Heart, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

interface InfoCardProps {
  noGos?: string[];
  focusPoints?: string[];
}

const InfoCard = ({ noGos = [], focusPoints = [] }: InfoCardProps) => {
  const { t } = useTranslation();

  // Use dynamic values if provided, otherwise fall back to translated defaults
  const displayNoGos = noGos.length > 0 
    ? noGos 
    : (t('survey.info.defaultNoGos', { returnObjects: true }) as string[]);
    
  const displayFocusPoints = focusPoints.length > 0 
    ? focusPoints 
    : (t('survey.info.defaultFocusPoints', { returnObjects: true }) as string[]);

  return (
    <section className="container pb-8">
      <div className="info-card animate-slide-up delay-100">
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <Heart className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t('survey.info.title')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* No-Gos */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium text-sm uppercase tracking-wide">{t('survey.info.noGos')}</span>
              </div>
              <ul className="space-y-2">
                {displayNoGos.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-destructive mt-0.5">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Focus Points */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium text-sm uppercase tracking-wide">{t('survey.info.focus')}</span>
              </div>
              <ul className="space-y-2">
                {displayFocusPoints.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-success mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Privacy note */}
          <div className="mt-6 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5" />
              <span>{t('survey.info.privacy')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfoCard;
