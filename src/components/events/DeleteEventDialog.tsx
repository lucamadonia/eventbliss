import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface DeleteEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: { id: string; name: string } | null;
  onConfirm: (reason?: string) => void;
}

export const DeleteEventDialog = ({
  open,
  onOpenChange,
  event,
  onConfirm,
}: DeleteEventDialogProps) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
    setReason("");
  };

  const handleCancel = () => {
    setReason("");
    onOpenChange(false);
  };

  if (!event) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("myEvents.deleteEvent")}</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium">{event.name}</span>
            {" — "}
            {t("myEvents.deleteEventDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Label htmlFor="delete-event-reason" className="text-sm font-medium">
            {t("myEvents.deleteReason")}
          </Label>
          <Textarea
            id="delete-event-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("myEvents.deleteReasonPlaceholder")}
            className="mt-2"
            rows={3}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
