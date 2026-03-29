import { useTranslation } from "react-i18next";
import { MoreVertical, Archive, ArchiveRestore, Trash2, FolderInput, FolderMinus, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { EventFolder } from "@/hooks/useEventFolders";

interface EventCardActionsProps {
  eventId: string;
  isArchived: boolean;
  isDeleted: boolean;
  folders?: EventFolder[];
  currentFolderId?: string | null;
  showFolders?: boolean;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onMoveToFolder?: (folderId: string) => void;
  onRemoveFromFolder?: () => void;
}

export const EventCardActions = ({
  isArchived,
  isDeleted,
  folders = [],
  currentFolderId,
  showFolders = false,
  onArchive,
  onUnarchive,
  onDelete,
  onRestore,
  onMoveToFolder,
  onRemoveFromFolder,
}: EventCardActionsProps) => {
  const { t } = useTranslation();

  if (isDeleted) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={onRestore}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t("myEvents.restoreEvent")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {showFolders && folders.length > 0 && onMoveToFolder && (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderInput className="mr-2 h-4 w-4" />
                {t("myEvents.moveToFolder")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {folders.map((folder) => (
                  <DropdownMenuItem
                    key={folder.id}
                    onClick={() => onMoveToFolder(folder.id)}
                    className={currentFolderId === folder.id ? "bg-accent" : ""}
                  >
                    <span
                      className="mr-2 h-3 w-3 rounded-full inline-block"
                      style={{ backgroundColor: folder.color || "#8B5CF6" }}
                    />
                    {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {currentFolderId && onRemoveFromFolder && (
              <DropdownMenuItem onClick={onRemoveFromFolder}>
                <FolderMinus className="mr-2 h-4 w-4" />
                {t("myEvents.removeFromFolder")}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}

        {isArchived ? (
          <DropdownMenuItem onClick={onUnarchive}>
            <ArchiveRestore className="mr-2 h-4 w-4" />
            {t("myEvents.unarchiveEvent")}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onArchive}>
            <Archive className="mr-2 h-4 w-4" />
            {t("myEvents.archiveEvent")}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          {t("common.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
