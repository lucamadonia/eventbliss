import { useState } from "react";
import { Settings, Calendar, Lock, Unlock, Save, Clock, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamInviteManager } from "./TeamInviteManager";
import type { EventData, Participant } from "@/hooks/useEvent";

interface SettingsTabProps {
  event: EventData;
  participants: Participant[];
  onUpdate: () => void;
}

export const SettingsTab = ({ event, participants, onUpdate }: SettingsTabProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formLocked, setFormLocked] = useState(event.settings?.form_locked || false);
  const [lockedBlock, setLockedBlock] = useState<string>(event.settings?.locked_block || "");
  const [deadline, setDeadline] = useState(event.survey_deadline || "");

  const dateBlocks = (event.settings?.date_blocks || {}) as Record<string, string>;

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-event-settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            event_id: event.id,
            settings: {
              form_locked: formLocked,
              locked_block: lockedBlock || null,
            },
            survey_deadline: deadline || null,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to save settings");
      }

      toast.success(t('notifications.settingsSaved'));
      onUpdate();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(t('notifications.errorOccurred'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLockBlock = async (block: string) => {
    setLockedBlock(block);
    setFormLocked(true);
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-event-settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            event_id: event.id,
            locked_block: block,
            status: "active",
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to lock block");
      }

      toast.success(t('dashboard.settings.dateLocked', { block }));
      onUpdate();
    } catch (error) {
      console.error("Error locking block:", error);
      toast.error(t('notifications.errorOccurred'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Status */}
      <GlassCard className="p-6">
        <h4 className="font-bold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          {t('dashboard.settings.formStatus.title')}
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-background/30">
            <div className="flex items-center gap-3">
              {formLocked ? (
                <Lock className="w-5 h-5 text-warning" />
              ) : (
                <Unlock className="w-5 h-5 text-green-400" />
              )}
              <div>
                <Label className="font-medium">{t('dashboard.settings.formStatus.lockForm')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.settings.formStatus.lockFormDesc')}
                </p>
              </div>
            </div>
            <Switch
              checked={formLocked}
              onCheckedChange={setFormLocked}
            />
          </div>

          {/* Deadline */}
          <div className="p-4 rounded-lg bg-background/30">
            <Label className="font-medium flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              {t('dashboard.settings.deadline')}
            </Label>
            <input
              type="datetime-local"
              value={deadline ? deadline.slice(0, 16) : ""}
              onChange={(e) => setDeadline(e.target.value ? new Date(e.target.value).toISOString() : "")}
              className="w-full p-2 rounded-lg bg-background border border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.settings.deadlineDesc')}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Lock Date Block */}
      <GlassCard className="p-6 border-primary/30">
        <h4 className="font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {t('dashboard.settings.setDate')}
        </h4>
        
        {lockedBlock ? (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-5 h-5 text-green-400" />
              <span className="font-bold text-green-400">
                {t('dashboard.settings.blockLocked', { block: lockedBlock })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {dateBlocks[lockedBlock] || ""}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setLockedBlock("");
                setFormLocked(false);
              }}
            >
              {t('dashboard.settings.changeDate')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              {t('dashboard.settings.selectDateDesc')}
            </p>
            <Select onValueChange={handleLockBlock} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder={t('dashboard.settings.selectBlock')} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(dateBlocks).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {t('dashboard.schedule.block')} {key}: {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </GlassCard>

      {/* Team Invite Manager */}
      <TeamInviteManager
        eventSlug={event.id}
        eventId={event.id}
        participants={participants as any}
        onUpdate={onUpdate}
      />

      {/* Save Button */}
      <GradientButton
        onClick={handleSaveSettings}
        disabled={isLoading}
        icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        className="w-full"
      >
        {isLoading ? t('common.saving') : t('dashboard.settings.saveSettings')}
      </GradientButton>
    </div>
  );
};
