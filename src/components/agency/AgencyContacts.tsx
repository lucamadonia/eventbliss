import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Search, Filter, Plus, Phone, Mail, MapPin, Star, Upload, Users,
  TrendingUp, CalendarCheck, FileSpreadsheet, Sparkles, Clock, ThumbsUp, Gauge,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useVendors, Vendor, VendorRatings } from "@/hooks/useVendors";
import { specializationTags } from "./AgencyContactsData";

type QuickFilter = "all" | "top-rated" | "recently-used" | "available";

function StarRating({ rating, interactive, onChange }: { rating: number; interactive?: boolean; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? "text-amber-400 fill-amber-400" : "text-white/20"} ${interactive ? "cursor-pointer hover:text-amber-300" : ""}`}
          onClick={interactive && onChange ? () => onChange(i + 1) : undefined}
        />
      ))}
    </div>
  );
}

function QualityScoreBadge({ score }: { score: number }) {
  const color = score >= 4 ? "text-emerald-400" : score >= 3 ? "text-amber-400" : "text-red-400";
  const bgColor = score >= 4 ? "bg-emerald-500/10" : score >= 3 ? "bg-amber-500/10" : "bg-red-500/10";
  return (
    <div className={`flex items-center gap-1 text-[10px] ${color} ${bgColor} px-1.5 py-0.5 rounded`}>
      <Gauge className="w-3 h-3" /> {score ? `${score}/5` : "-"}
    </div>
  );
}

export function AgencyContacts() {
  const { t } = useTranslation();
  const { vendors, isLoading, createVendor, updateVendor, deleteVendor, rateVendor } = useVendors();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [selectedContact, setSelectedContact] = useState<Vendor | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [showCsvDialog, setShowCsvDialog] = useState(false);

  // Add contact form state
  const [newContact, setNewContact] = useState({
    name: "", company: "", type: "", phone: "", email: "", city: "",
    specialization: "", notes: "", tags: [] as string[],
  });

  const handleCreate = async () => {
    if (!newContact.name.trim()) return;
    await createVendor({
      name: newContact.name,
      company: newContact.company || undefined,
      type: newContact.type || undefined,
      phone: newContact.phone || undefined,
      email: newContact.email || undefined,
      city: newContact.city || undefined,
      specialization: newContact.specialization || undefined,
      notes: newContact.notes || undefined,
      tags: newContact.tags.length > 0 ? newContact.tags : undefined,
    });
    setNewContact({ name: "", company: "", type: "", phone: "", email: "", city: "", specialization: "", notes: "", tags: [] });
    setAddDialogOpen(false);
  };

  // Rating dialog state
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [pendingRatings, setPendingRatings] = useState<VendorRatings>({ quality: 0, punctuality: 0, price: 0, communication: 0, flexibility: 0 });

  const filtered = useMemo(() => {
    return vendors.filter((c) => {
      const matchesSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.company || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.tags || []).some((tag) => tag.toLowerCase().includes(search.toLowerCase())) ||
        (c.specialization || "").toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || c.type === typeFilter;
      let matchesQuick = true;
      if (quickFilter === "top-rated") matchesQuick = (c.rating || 0) >= 4;
      else if (quickFilter === "available") matchesQuick = c.is_active;
      return matchesSearch && matchesType && matchesQuick;
    });
  }, [vendors, search, typeFilter, quickFilter]);

  const typeLabels: Record<string, string> = {
    veranstalter: "Veranstalter",
    dienstleister: "Dienstleister",
    crew: "Crew/Helfer",
    kontaktperson: "Kontaktperson",
  };

  const typeColors: Record<string, string> = {
    veranstalter: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    dienstleister: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    crew: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    kontaktperson: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input placeholder="Kontakte suchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white"><Filter className="w-4 h-4 mr-2 text-white/40" /><SelectValue placeholder="Alle Typen" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Typen</SelectItem>
            <SelectItem value="veranstalter">Veranstalter</SelectItem>
            <SelectItem value="dienstleister">Dienstleister</SelectItem>
            <SelectItem value="crew">Crew/Helfer</SelectItem>
            <SelectItem value="kontaktperson">Kontaktperson</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10" onClick={() => setShowCsvDialog(true)}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> CSV Import
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild><Button className="bg-violet-600 hover:bg-violet-700 text-white"><Plus className="w-4 h-4 mr-2" /> Kontakt</Button></DialogTrigger>
            <DialogContent className="bg-[#1a1625] border-white/10 text-white max-w-md">
              <DialogHeader><DialogTitle>Neuen Kontakt hinzufügen</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-white/60 text-xs">Name</Label><Input value={newContact.name} onChange={(e) => setNewContact((p) => ({ ...p, name: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" placeholder="Vor- und Nachname" /></div>
                  <div><Label className="text-white/60 text-xs">Unternehmen</Label><Input value={newContact.company} onChange={(e) => setNewContact((p) => ({ ...p, company: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" placeholder="Firmenname" /></div>
                </div>
                <div><Label className="text-white/60 text-xs">Typ</Label>
                  <Select value={newContact.type} onValueChange={(v) => setNewContact((p) => ({ ...p, type: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue placeholder="Typ wählen" /></SelectTrigger>
                    <SelectContent><SelectItem value="veranstalter">Veranstalter</SelectItem><SelectItem value="dienstleister">Dienstleister</SelectItem><SelectItem value="crew">Crew/Helfer</SelectItem><SelectItem value="kontaktperson">Kontaktperson</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-white/60 text-xs">Telefon</Label><Input value={newContact.phone} onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" placeholder="+49..." /></div>
                  <div><Label className="text-white/60 text-xs">E-Mail</Label><Input value={newContact.email} onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" placeholder="email@beispiel.de" /></div>
                </div>
                <div><Label className="text-white/60 text-xs">Stadt</Label><Input value={newContact.city} onChange={(e) => setNewContact((p) => ({ ...p, city: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" placeholder="Stadt" /></div>
                <div><Label className="text-white/60 text-xs">Spezialisierung</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">{specializationTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={`text-[10px] cursor-pointer ${newContact.tags.includes(tag) ? "border-violet-500/50 text-violet-300 bg-violet-500/10" : "border-white/10 text-white/50 hover:border-violet-500/30 hover:text-violet-300"}`}
                      onClick={() => setNewContact((p) => ({
                        ...p,
                        tags: p.tags.includes(tag) ? p.tags.filter((t) => t !== tag) : [...p.tags, tag],
                      }))}
                    >{tag}</Badge>
                  ))}</div>
                </div>
                <div><Label className="text-white/60 text-xs">Notizen</Label><Textarea value={newContact.notes} onChange={(e) => setNewContact((p) => ({ ...p, notes: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1 resize-none" rows={3} placeholder="Interne Notizen..." /></div>
                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white" onClick={handleCreate}>Kontakt speichern</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Quick filter presets */}
      <div className="flex items-center gap-2">
        {([
          { key: "all" as QuickFilter, label: "Alle", icon: Users },
          { key: "top-rated" as QuickFilter, label: "Top bewertet", icon: ThumbsUp },
          { key: "available" as QuickFilter, label: "Aktiv", icon: Sparkles },
        ]).map((qf) => (
          <Button key={qf.key} variant="ghost" size="sm" onClick={() => setQuickFilter(qf.key)}
            className={`text-xs gap-1.5 ${quickFilter === qf.key ? "bg-violet-600/20 text-violet-300" : "text-white/40 hover:text-white/70"}`}>
            <qf.icon className="w-3.5 h-3.5" /> {qf.label}
          </Button>
        ))}
        <p className="text-sm text-white/40 ml-auto">{filtered.length} Kontakte gefunden</p>
      </div>

      {/* Contact List */}
      {isLoading ? (
        <div className="space-y-2"><Skeleton className="h-16 bg-white/5" /><Skeleton className="h-16 bg-white/5" /><Skeleton className="h-16 bg-white/5" /></div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/10">
                <th className="text-left text-xs font-medium text-white/40 p-4">Name</th>
                <th className="text-left text-xs font-medium text-white/40 p-4 hidden md:table-cell">Typ</th>
                <th className="text-left text-xs font-medium text-white/40 p-4 hidden lg:table-cell">Unternehmen</th>
                <th className="text-left text-xs font-medium text-white/40 p-4 hidden lg:table-cell">Stadt</th>
                <th className="text-left text-xs font-medium text-white/40 p-4 hidden sm:table-cell">Bewertung</th>
                <th className="text-left text-xs font-medium text-white/40 p-4">Tags</th>
              </tr></thead>
              <tbody>{filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-white/30">Keine Kontakte gefunden. Erstelle deinen ersten Kontakt.</td></tr>
              ) : filtered.map((contact) => (
                <tr key={contact.id} className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors" onClick={() => setSelectedContact(contact)}>
                  <td className="p-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-300">{contact.name.split(" ").map(n => n[0]).join("")}</div><div><p className="text-sm font-medium text-white">{contact.name}</p><p className="text-xs text-white/40 md:hidden">{contact.company}</p></div></div></td>
                  <td className="p-4 hidden md:table-cell"><Badge variant="outline" className={`text-xs ${typeColors[contact.type || ""] || "border-white/10 text-white/50"}`}>{typeLabels[contact.type || ""] || contact.type || "-"}</Badge></td>
                  <td className="p-4 text-sm text-white/60 hidden lg:table-cell">{contact.company || "-"}</td>
                  <td className="p-4 text-sm text-white/60 hidden lg:table-cell">{contact.city || "-"}</td>
                  <td className="p-4 hidden sm:table-cell"><StarRating rating={contact.rating || 0} /></td>
                  <td className="p-4"><div className="flex gap-1 flex-wrap">
                    {(contact.tags || []).slice(0, 2).map((tag) => (<Badge key={tag} variant="outline" className="text-[10px] border-white/10 text-white/50">{tag}</Badge>))}
                    {(contact.tags || []).length > 2 && (<Badge variant="outline" className="text-[10px] border-white/10 text-white/30">+{(contact.tags || []).length - 2}</Badge>)}
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* CSV Import Dialog */}
      <Dialog open={showCsvDialog} onOpenChange={setShowCsvDialog}>
        <DialogContent className="bg-[#1a1625] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>CSV Import</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-violet-500/30 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-white/30 mx-auto mb-3" />
              <p className="text-sm text-white/60 mb-1">CSV-Datei hierher ziehen</p>
              <p className="text-xs text-white/30">oder klicken zum Auswaehlen</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-white/40 mb-1">Erwartete Spalten:</p>
              <p className="text-[10px] text-white/30 font-mono">Name, Firma, Typ, Telefon, Email, Stadt, Tags</p>
            </div>
            <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setShowCsvDialog(false)}>Importieren</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Detail Sheet */}
      <Sheet open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
        <SheetContent className="bg-[#1a1625] border-white/10 text-white w-full sm:max-w-md overflow-y-auto">
          {selectedContact && (
            <div className="space-y-6 mt-6">
              <SheetHeader>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-violet-500/20 flex items-center justify-center text-lg font-bold text-violet-300">{selectedContact.name.split(" ").map(n => n[0]).join("")}</div>
                  <div><SheetTitle className="text-white text-lg">{selectedContact.name}</SheetTitle><p className="text-sm text-white/50">{selectedContact.company || "-"}</p></div>
                </div>
              </SheetHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={typeColors[selectedContact.type || ""] || "border-white/10 text-white/50"}>{typeLabels[selectedContact.type || ""] || selectedContact.type || "-"}</Badge>
                <QualityScoreBadge score={selectedContact.rating || 0} />
              </div>
              <div className="space-y-3">
                {selectedContact.phone && <div className="flex items-center gap-3 text-sm"><Phone className="w-4 h-4 text-white/40" /><span className="text-white/80">{selectedContact.phone}</span></div>}
                {selectedContact.email && <div className="flex items-center gap-3 text-sm"><Mail className="w-4 h-4 text-white/40" /><span className="text-white/80">{selectedContact.email}</span></div>}
                {selectedContact.city && <div className="flex items-center gap-3 text-sm"><MapPin className="w-4 h-4 text-white/40" /><span className="text-white/80">{selectedContact.city}</span></div>}
              </div>
              <div><p className="text-xs text-white/40 mb-2">Bewertung</p><StarRating rating={selectedContact.rating || 0} /></div>

              {/* Rate vendor */}
              <div>
                <p className="text-xs text-white/40 mb-2">Detailbewertung</p>
                <div className="space-y-2">
                  {(["quality", "punctuality", "price", "communication", "flexibility"] as const).map((key) => {
                    const ratingKey = `rating_${key}` as keyof Vendor;
                    const val = (selectedContact[ratingKey] as number) || 0;
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-[10px] text-white/40 w-24 capitalize">{key === "price" ? "Preis-Leistung" : key === "quality" ? "Qualitaet" : key === "punctuality" ? "Puenktlichkeit" : key === "communication" ? "Kommunikation" : "Flexibilitaet"}</span>
                        <StarRating rating={val} interactive onChange={(v) => {
                          const ratings: VendorRatings = {
                            quality: (selectedContact.rating_quality || 0),
                            punctuality: (selectedContact.rating_punctuality || 0),
                            price: (selectedContact.rating_price || 0),
                            communication: (selectedContact.rating_communication || 0),
                            flexibility: (selectedContact.rating_flexibility || 0),
                          };
                          ratings[key] = v;
                          rateVendor(selectedContact.id, ratings);
                          setSelectedContact({ ...selectedContact, [`rating_${key}`]: v });
                        }} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {(selectedContact.tags || []).length > 0 && (
                <div><p className="text-xs text-white/40 mb-2">Tags</p><div className="flex gap-1.5 flex-wrap">{(selectedContact.tags || []).map((tag) => (<Badge key={tag} variant="outline" className="border-white/10 text-white/60">{tag}</Badge>))}</div></div>
              )}
              {selectedContact.notes && (
                <div><p className="text-xs text-white/40 mb-2">Notizen</p><p className="text-sm text-white/70 bg-white/5 rounded-lg p-3">{selectedContact.notes}</p></div>
              )}
              <Button variant="destructive" size="sm" className="w-full" onClick={() => { deleteVendor(selectedContact.id); setSelectedContact(null); }}>
                <Trash2 className="w-4 h-4 mr-2" /> Kontakt loeschen
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
