import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Grid,
  List,
  Search,
  File,
  FileText,
  FileImage,
  FileSpreadsheet,
  HardDrive,
  Trash2,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEventFiles, EventFile } from "@/hooks/useEventFiles";
import { useMyEvents } from "@/hooks/useMyEvents";

type FileCategory =
  | "contract"
  | "invoice"
  | "photo"
  | "floorplan"
  | "briefing"
  | "other";
type ViewMode = "grid" | "list";

const CATEGORIES: { value: FileCategory; label: string }[] = [
  { value: "contract", label: "Vertrag" },
  { value: "invoice", label: "Rechnung" },
  { value: "photo", label: "Foto" },
  { value: "floorplan", label: "Raumplan" },
  { value: "briefing", label: "Briefing" },
  { value: "other", label: "Sonstiges" },
];

const categoryLabels: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
);

const categoryColors: Record<string, string> = {
  contract: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  invoice: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  photo: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  floorplan: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  briefing: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  other: "bg-white/10 text-white/50 border-white/20",
};

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return FileImage;
  if (fileType.includes("spreadsheet") || fileType.includes("excel"))
    return FileSpreadsheet;
  if (fileType.includes("pdf") || fileType.includes("document"))
    return FileText;
  return File;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function isImageType(fileType: string): boolean {
  return fileType.startsWith("image/");
}

const STORAGE_LIMIT_GB = 5;

export function AgencyFileLibrary() {
  const { files, isLoading, uploadFile, deleteFile, getStorageUsage } =
    useEventFiles();
  const { events } = useMyEvents();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<FileCategory>("other");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storageUsedBytes = getStorageUsage();
  const storageUsedGB = storageUsedBytes / (1024 * 1024 * 1024);
  const storagePercent = Math.min(
    (storageUsedGB / STORAGE_LIMIT_GB) * 100,
    100,
  );

  const handleUploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (!selectedEventId) {
        const { toast } = await import("sonner");
        toast.error("Bitte zuerst ein Event auswählen");
        return;
      }
      setUploading(true);
      const filesToUpload = Array.from(fileList);
      for (const f of filesToUpload) {
        await uploadFile(f, selectedEventId, uploadCategory);
      }
      setUploading(false);
    },
    [selectedEventId, uploadCategory, uploadFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleUploadFiles(e.dataTransfer.files);
      }
    },
    [handleUploadFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleUploadFiles(e.target.files);
        e.target.value = "";
      }
    },
    [handleUploadFiles],
  );

  // Build event name map for display
  const eventNameMap: Record<string, string> = {};
  events.forEach((ev) => {
    eventNameMap[ev.id] = ev.name;
  });

  const filtered = files.filter((f) => {
    const matchesSearch =
      !search || f.file_name.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      categoryFilter === "all" || f.category === categoryFilter;
    const matchesEvent = eventFilter === "all" || f.event_id === eventFilter;
    return matchesSearch && matchesCat && matchesEvent;
  });

  const uniqueEventIds = [...new Set(files.map((f) => f.event_id))];

  return (
    <div className="space-y-6">
      {/* Storage Quota */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-white/40" />
            <span className="text-sm text-white/60">Speicherplatz</span>
          </div>
          <span className="text-sm text-white">
            {storageUsedGB.toFixed(2)} GB / {STORAGE_LIMIT_GB} GB verwendet
          </span>
        </div>
        <Progress value={storagePercent} className="h-2 bg-white/10" />
      </motion.div>

      {/* Upload Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="w-full sm:w-56 bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Event für Upload wählen" />
          </SelectTrigger>
          <SelectContent>
            {events.map((ev) => (
              <SelectItem key={ev.id} value={ev.id}>
                {ev.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={uploadCategory}
          onValueChange={(v) => setUploadCategory(v as FileCategory)}
        >
          <SelectTrigger className="w-full sm:w-44 bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Kategorie" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Upload Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragging
            ? "border-violet-500 bg-violet-500/10"
            : "border-white/10 hover:border-white/20"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <Loader2 className="w-8 h-8 text-violet-400 mx-auto mb-2 animate-spin" />
        ) : (
          <Upload className="w-8 h-8 text-white/30 mx-auto mb-2" />
        )}
        <p className="text-sm text-white/50">
          {uploading ? "Wird hochgeladen..." : "Dateien hierher ziehen oder"}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
        <Button
          variant="outline"
          size="sm"
          className="mt-2 bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          Dateien auswählen
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Dateien suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Kategorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Events</SelectItem>
            {uniqueEventIds.map((eid) => (
              <SelectItem key={eid} value={eid}>
                {eventNameMap[eid] || eid}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 border border-white/10 rounded-md p-0.5 bg-white/5 self-start">
          <Button
            variant="ghost"
            size="icon"
            className={`w-8 h-8 ${viewMode === "grid" ? "bg-violet-600 text-white" : "text-white/40"}`}
            onClick={() => setViewMode("grid")}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`w-8 h-8 ${viewMode === "list" ? "bg-violet-600 text-white" : "text-white/40"}`}
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* File count */}
      <p className="text-sm text-white/40">
        {isLoading ? "Laden..." : `${filtered.length} Dateien`}
      </p>

      {/* File Grid / List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((file, i) => (
            <FileGridCard
              key={file.id}
              file={file}
              index={i}
              eventName={eventNameMap[file.event_id]}
              onDelete={deleteFile}
            />
          ))}
        </div>
      ) : (
        <FileListView
          files={filtered}
          eventNameMap={eventNameMap}
          onDelete={deleteFile}
        />
      )}
    </div>
  );
}

function FileGridCard({
  file,
  index,
  eventName,
  onDelete,
}: {
  file: EventFile;
  index: number;
  eventName?: string;
  onDelete: (id: string) => void;
}) {
  const Icon = getFileIcon(file.file_type);
  const catColor = categoryColors[file.category] || categoryColors.other;
  const catLabel = categoryLabels[file.category] || file.category;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.02 }}
      className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden hover:border-violet-500/30 transition-colors group"
    >
      <div className="h-28 bg-white/[0.03] flex items-center justify-center overflow-hidden">
        {isImageType(file.file_type) ? (
          <img
            src={file.file_url}
            alt={file.file_name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Icon className="w-10 h-10 text-white/20" />
        )}
      </div>
      <div className="p-3">
        <a
          href={file.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-white truncate block hover:text-violet-300 transition-colors"
          title={file.file_name}
        >
          {file.file_name}
        </a>
        <div className="flex items-center justify-between mt-1.5">
          <Badge variant="outline" className={`text-[10px] ${catColor}`}>
            {catLabel}
          </Badge>
          <span className="text-[10px] text-white/30">
            {formatBytes(file.file_size)}
          </span>
        </div>
        <p className="text-[10px] text-white/30 mt-1.5 truncate">
          {eventName || file.event_id}
        </p>
        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={file.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => onDelete(file.id)}
            className="p-1 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function FileListView({
  files,
  eventNameMap,
  onDelete,
}: {
  files: EventFile[];
  eventNameMap: Record<string, string>;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-xs font-medium text-white/40 p-4">
                Dateiname
              </th>
              <th className="text-left text-xs font-medium text-white/40 p-4 hidden md:table-cell">
                Event
              </th>
              <th className="text-left text-xs font-medium text-white/40 p-4">
                Kategorie
              </th>
              <th className="text-left text-xs font-medium text-white/40 p-4 hidden sm:table-cell">
                Größe
              </th>
              <th className="text-left text-xs font-medium text-white/40 p-4 w-20">
                Aktion
              </th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => {
              const Icon = getFileIcon(file.file_type);
              const catColor =
                categoryColors[file.category] || categoryColors.other;
              const catLabel =
                categoryLabels[file.category] || file.category;
              return (
                <tr
                  key={file.id}
                  className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                >
                  <td className="p-4">
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 hover:text-violet-300 transition-colors"
                    >
                      <Icon className="w-5 h-5 text-white/30 shrink-0" />
                      <span className="text-sm text-white truncate">
                        {file.file_name}
                      </span>
                    </a>
                  </td>
                  <td className="p-4 text-sm text-white/50 hidden md:table-cell">
                    {eventNameMap[file.event_id] || file.event_id}
                  </td>
                  <td className="p-4">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${catColor}`}
                    >
                      {catLabel}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-white/40 hidden sm:table-cell">
                    {formatBytes(file.file_size)}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => onDelete(file.id)}
                        className="p-1 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
