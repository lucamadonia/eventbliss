import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Upload,
  Grid,
  List,
  Search,
  Filter,
  File,
  FileText,
  FileImage,
  FileSpreadsheet,
  FolderOpen,
  Calendar,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FileCategory = "contract" | "invoice" | "photo" | "floorplan" | "other";
type ViewMode = "grid" | "list";

interface AgencyFile {
  id: string;
  name: string;
  event: string;
  category: FileCategory;
  type: string;
  size: string;
  uploadDate: string;
  thumbnail?: boolean;
}

const categoryLabels: Record<FileCategory, string> = {
  contract: "Vertrag",
  invoice: "Rechnung",
  photo: "Foto",
  floorplan: "Raumplan",
  other: "Sonstiges",
};

const categoryColors: Record<FileCategory, string> = {
  contract: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  invoice: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  photo: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  floorplan: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  other: "bg-white/10 text-white/50 border-white/20",
};

const fileTypeIcons: Record<string, typeof File> = {
  pdf: FileText,
  jpg: FileImage,
  png: FileImage,
  xlsx: FileSpreadsheet,
  docx: FileText,
  default: File,
};

const mockFiles: AgencyFile[] = [
  { id: "1", name: "Vertrag_Schloss_Rosenstein.pdf", event: "Hochzeit M\u00FCller", category: "contract", type: "pdf", size: "2.4 MB", uploadDate: "20. M\u00E4r 2026" },
  { id: "2", name: "Angebot_Catering_Weber.pdf", event: "Hochzeit M\u00FCller", category: "invoice", type: "pdf", size: "1.1 MB", uploadDate: "18. M\u00E4r 2026" },
  { id: "3", name: "Location_Fotos.jpg", event: "Hochzeit M\u00FCller", category: "photo", type: "jpg", size: "8.5 MB", uploadDate: "15. M\u00E4r 2026", thumbnail: true },
  { id: "4", name: "Raumplan_Saal.pdf", event: "Firmenfeier SAP", category: "floorplan", type: "pdf", size: "3.2 MB", uploadDate: "12. M\u00E4r 2026" },
  { id: "5", name: "Rechnung_DJ_BeatMaster.pdf", event: "JGA Hamburg", category: "invoice", type: "pdf", size: "0.8 MB", uploadDate: "10. M\u00E4r 2026" },
  { id: "6", name: "Budget_Planung.xlsx", event: "Konferenz 2026", category: "other", type: "xlsx", size: "1.5 MB", uploadDate: "08. M\u00E4r 2026" },
  { id: "7", name: "Team_Briefing.docx", event: "Firmenfeier SAP", category: "other", type: "docx", size: "0.5 MB", uploadDate: "05. M\u00E4r 2026" },
  { id: "8", name: "Deko_Inspiration.png", event: "Geburtstag 50er", category: "photo", type: "png", size: "4.2 MB", uploadDate: "01. M\u00E4r 2026", thumbnail: true },
];

const storageUsed = 2.3;
const storageTotal = 5;

export function AgencyFileLibrary() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [isDragging, setIsDragging] = useState(false);

  const events = [...new Set(mockFiles.map((f) => f.event))];

  const filtered = mockFiles.filter((f) => {
    const matchesSearch = !search || f.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "all" || f.category === categoryFilter;
    const matchesEvent = eventFilter === "all" || f.event === eventFilter;
    return matchesSearch && matchesCat && matchesEvent;
  });

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
          <span className="text-sm text-white">{storageUsed} GB / {storageTotal} GB verwendet</span>
        </div>
        <Progress value={(storageUsed / storageTotal) * 100} className="h-2 bg-white/10" />
      </motion.div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragging
            ? "border-violet-500 bg-violet-500/10"
            : "border-white/10 hover:border-white/20"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
      >
        <Upload className="w-8 h-8 text-white/30 mx-auto mb-2" />
        <p className="text-sm text-white/50">Dateien hierher ziehen oder</p>
        <Button variant="outline" size="sm" className="mt-2 bg-white/5 border-white/10 text-white/60 hover:bg-white/10">
          Dateien ausw\u00E4hlen
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
            {(Object.keys(categoryLabels) as FileCategory[]).map((cat) => (
              <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Events</SelectItem>
            {events.map((ev) => (
              <SelectItem key={ev} value={ev}>{ev}</SelectItem>
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
      <p className="text-sm text-white/40">{filtered.length} Dateien</p>

      {/* File Grid / List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((file, i) => {
            const Icon = fileTypeIcons[file.type] || fileTypeIcons.default;
            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.02 }}
                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden hover:border-violet-500/30 transition-colors group cursor-pointer"
              >
                <div className="h-28 bg-white/[0.03] flex items-center justify-center">
                  {file.thumbnail ? (
                    <div className="w-full h-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center">
                      <FileImage className="w-10 h-10 text-white/20" />
                    </div>
                  ) : (
                    <Icon className="w-10 h-10 text-white/20" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-white truncate">{file.name}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <Badge variant="outline" className={`text-[10px] ${categoryColors[file.category]}`}>
                      {categoryLabels[file.category]}
                    </Badge>
                    <span className="text-[10px] text-white/30">{file.size}</span>
                  </div>
                  <p className="text-[10px] text-white/30 mt-1.5 truncate">{file.event}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs font-medium text-white/40 p-4">Dateiname</th>
                  <th className="text-left text-xs font-medium text-white/40 p-4 hidden md:table-cell">Event</th>
                  <th className="text-left text-xs font-medium text-white/40 p-4">Kategorie</th>
                  <th className="text-left text-xs font-medium text-white/40 p-4 hidden sm:table-cell">Gr\u00F6\u00DFe</th>
                  <th className="text-left text-xs font-medium text-white/40 p-4 hidden lg:table-cell">Hochgeladen</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((file) => {
                  const Icon = fileTypeIcons[file.type] || fileTypeIcons.default;
                  return (
                    <tr key={file.id} className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-white/30 shrink-0" />
                          <span className="text-sm text-white truncate">{file.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-white/50 hidden md:table-cell">{file.event}</td>
                      <td className="p-4">
                        <Badge variant="outline" className={`text-[10px] ${categoryColors[file.category]}`}>
                          {categoryLabels[file.category]}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-white/40 hidden sm:table-cell">{file.size}</td>
                      <td className="p-4 text-sm text-white/40 hidden lg:table-cell">{file.uploadDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
