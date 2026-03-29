import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#8B5CF6", // purple
  "#06B6D4", // cyan
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
];

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, color?: string) => void;
  editingFolder?: { name: string; color?: string | null } | null;
}

export const CreateFolderDialog = ({
  open,
  onOpenChange,
  onSave,
  editingFolder,
}: CreateFolderDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(PRESET_COLORS[0]);

  useEffect(() => {
    if (editingFolder) {
      setName(editingFolder.name);
      setColor(editingFolder.color || PRESET_COLORS[0]);
    } else {
      setName("");
      setColor(PRESET_COLORS[0]);
    }
  }, [editingFolder, open]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), color);
    setName("");
    setColor(PRESET_COLORS[0]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {editingFolder ? t("myEvents.editFolder") : t("myEvents.newFolder")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">{t("myEvents.folderName")}</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("myEvents.folderName")}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>{t("myEvents.folderColor")}</Label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full cursor-pointer transition-all",
                    color === c
                      ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                      : "hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {t("myEvents.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
