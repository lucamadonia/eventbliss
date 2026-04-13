import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Eye,
  ShieldCheck,
  ShieldX,
  ShieldOff,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type ListingStatus = "pending_review" | "approved" | "rejected" | "suspended";

interface Listing {
  id: string;
  title: string;
  category: string;
  agency: string;
  agencyTier: string;
  price: number;
  status: ListingStatus;
  date: string;
  description?: string;
}

const STATUS_CONFIG: Record<ListingStatus, { label: string; color: string; bgColor: string }> = {
  pending_review: { label: "Zur Prüfung", color: "text-yellow-700 dark:text-yellow-400", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  approved: { label: "Aktiv", color: "text-green-700 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/30" },
  rejected: { label: "Abgelehnt", color: "text-red-700 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/30" },
  suspended: { label: "Gesperrt", color: "text-orange-700 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
};

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  starter: { label: "Starter", color: "bg-gray-500" },
  professional: { label: "Professional", color: "bg-blue-500" },
  enterprise: { label: "Enterprise", color: "bg-purple-500" },
};

const CATEGORY_LABELS: Record<string, string> = {
  workshop: "Workshop",
  entertainment: "Entertainment",
  catering: "Catering",
  music: "Musik",
  wellness: "Wellness",
  sport: "Sport",
};

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);

const categoryGradients: Record<string, string> = {
  workshop: "from-violet-500 to-purple-600",
  entertainment: "from-pink-500 to-rose-600",
  catering: "from-amber-500 to-orange-600",
  music: "from-blue-500 to-indigo-600",
  wellness: "from-green-500 to-emerald-600",
  sport: "from-red-500 to-rose-600",
};

async function fetchListings(): Promise<Listing[]> {
  const { data: services, error } = await (supabase.from as any)("marketplace_services")
    .select("*, agencies(name, marketplace_tier)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const serviceIds = (services || []).map((s: any) => s.id);

  let translationsMap: Record<string, { title: string; description: string }> = {};
  if (serviceIds.length > 0) {
    const { data: translations } = await (supabase.from as any)("marketplace_service_translations")
      .select("service_id, locale, title, description")
      .in("service_id", serviceIds)
      .in("locale", ["de", "en"]);

    if (translations) {
      for (const t of translations) {
        const existing = translationsMap[t.service_id];
        if (!existing || t.locale === "de") {
          translationsMap[t.service_id] = { title: t.title, description: t.description };
        }
      }
    }
  }

  return (services || []).map((s: any) => ({
    id: s.id,
    title: translationsMap[s.id]?.title || s.slug || "Unbenannt",
    category: s.category || "other",
    agency: s.agencies?.name || "Unbekannt",
    agencyTier: s.agencies?.marketplace_tier || "starter",
    price: s.price_cents || 0,
    status: s.status as ListingStatus,
    date: s.created_at ? new Date(s.created_at).toISOString().split("T")[0] : "",
    description: translationsMap[s.id]?.description || "",
  }));
}

export default function MarketplaceListingsTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ListingStatus | "all">("all");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["admin-marketplace-listings"],
    queryFn: fetchListings,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, newStatus, reason }: { id: string; newStatus: ListingStatus; reason?: string }) => {
      const updatePayload: any = { status: newStatus };
      if (reason) updatePayload.admin_rejection_reason = reason;
      const { error } = await (supabase.from as any)("marketplace_services")
        .update(updatePayload)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-marketplace-listings"] });
      const statusLabel = STATUS_CONFIG[variables.newStatus].label;
      toast.success(`Listing ${statusLabel.toLowerCase()} gesetzt`);
      if (variables.reason) {
        toast.info(`Grund: ${variables.reason}`);
      }
      setRejectId(null);
      setRejectReason("");
    },
    onError: () => {
      toast.error("Fehler beim Aktualisieren des Status");
    },
  });

  const counts = {
    pending_review: listings.filter((l) => l.status === "pending_review").length,
    approved: listings.filter((l) => l.status === "approved").length,
    rejected: listings.filter((l) => l.status === "rejected").length,
    suspended: listings.filter((l) => l.status === "suspended").length,
  };

  const filtered = filter === "all" ? listings : listings.filter((l) => l.status === filter);

  const handleApprove = (id: string) => statusMutation.mutate({ id, newStatus: "approved" });

  const handleReject = (id: string) => {
    if (!rejectReason.trim()) {
      toast.error("Bitte geben Sie einen Ablehnungsgrund an");
      return;
    }
    statusMutation.mutate({ id, newStatus: "rejected", reason: rejectReason });
  };

  const handleSuspend = (id: string) => statusMutation.mutate({ id, newStatus: "suspended" });

  const openDetail = (listing: Listing) => {
    setSelectedListing(listing);
    setDetailOpen(true);
  };

  const statsCards = [
    { label: "Zur Prüfung", count: counts.pending_review, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
    { label: "Aktiv", count: counts.approved, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
    { label: "Abgelehnt", count: counts.rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
    { label: "Gesperrt", count: counts.suspended, icon: Ban, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20" },
  ];

  const filterButtons: { label: string; value: ListingStatus | "all" }[] = [
    { label: "Zur Prüfung", value: "pending_review" },
    { label: "Aktiv", value: "approved" },
    { label: "Abgelehnt", value: "rejected" },
    { label: "Gesperrt", value: "suspended" },
    { label: "Alle", value: "all" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <Card key={card.label} className={card.bg}>
            <CardContent className="p-4 flex items-center gap-3">
              <card.icon className={`h-8 w-8 ${card.color}`} />
              <div>
                <p className="text-2xl font-bold">{card.count}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((btn) => (
          <Button
            key={btn.value}
            variant={filter === btn.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(btn.value)}
          >
            {btn.label}
            {btn.value !== "all" && (
              <Badge variant="secondary" className="ml-2">
                {counts[btn.value as ListingStatus]}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Listings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Marketplace Listings ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Agentur</TableHead>
                  <TableHead>Preis</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((listing) => {
                  const statusCfg = STATUS_CONFIG[listing.status];
                  const tierCfg = TIER_CONFIG[listing.agencyTier] || { label: listing.agencyTier, color: "bg-gray-500" };
                  const gradient = categoryGradients[listing.category] || "from-gray-500 to-gray-600";

                  return (
                    <TableRow key={listing.id}>
                      <TableCell>
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient}`} />
                      </TableCell>
                      <TableCell className="font-medium">{listing.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{CATEGORY_LABELS[listing.category] || listing.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{listing.agency}</span>
                          <Badge className={`${tierCfg.color} text-white text-xs`}>{tierCfg.label}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatPrice(listing.price)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{listing.date}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color} ${statusCfg.bgColor}`}>
                          {statusCfg.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openDetail(listing)} title="Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {listing.status === "pending_review" && (
                            <>
                              <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" onClick={() => handleApprove(listing.id)} title="Genehmigen">
                                <ShieldCheck className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => setRejectId(rejectId === listing.id ? null : listing.id)}
                                title="Ablehnen"
                              >
                                <ShieldX className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {(listing.status === "approved" || listing.status === "pending_review") && (
                            <Button variant="ghost" size="icon" className="text-orange-600 hover:text-orange-700" onClick={() => handleSuspend(listing.id)} title="Sperren">
                              <ShieldOff className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {rejectId === listing.id && (
                          <div className="mt-2 space-y-2">
                            <Textarea
                              placeholder="Ablehnungsgrund (Pflichtfeld)..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="text-sm"
                              rows={2}
                            />
                            <div className="flex gap-1">
                              <Button size="sm" variant="destructive" onClick={() => handleReject(listing.id)}>
                                Ablehnen
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setRejectId(null); setRejectReason(""); }}>
                                Abbrechen
                              </Button>
                            </div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Keine Listings mit diesem Status gefunden.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedListing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${categoryGradients[selectedListing.category] || "from-gray-500 to-gray-600"}`} />
                  {selectedListing.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[selectedListing.status].color} ${STATUS_CONFIG[selectedListing.status].bgColor}`}>
                    {STATUS_CONFIG[selectedListing.status].label}
                  </span>
                </div>

                {/* Service Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Service Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Kategorie:</span>
                      <p className="font-medium">{CATEGORY_LABELS[selectedListing.category] || selectedListing.category}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Preis:</span>
                      <p className="font-medium text-lg">{formatPrice(selectedListing.price)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Erstellt am:</span>
                      <p className="font-medium">{selectedListing.date}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ID:</span>
                      <p className="font-medium font-mono text-xs">{selectedListing.id}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Beschreibung</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedListing.description || "Keine Beschreibung vorhanden."}
                  </p>
                </div>

                {/* Images Placeholder */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Bilder</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`aspect-video rounded-lg bg-gradient-to-br ${categoryGradients[selectedListing.category] || "from-gray-500 to-gray-600"} opacity-60 flex items-center justify-center`}>
                        <span className="text-white/60 text-xs">Bild {i}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agency Info */}
                <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                  <h3 className="font-semibold">Agentur</h3>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedListing.agency}</span>
                    <Badge className={`${TIER_CONFIG[selectedListing.agencyTier]?.color || "bg-gray-500"} text-white text-xs`}>
                      {TIER_CONFIG[selectedListing.agencyTier]?.label || selectedListing.agencyTier}
                    </Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  {selectedListing.status === "pending_review" && (
                    <>
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          handleApprove(selectedListing.id);
                          setSelectedListing({ ...selectedListing, status: "approved" });
                        }}
                      >
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Genehmigen
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setRejectId(selectedListing.id);
                          setDetailOpen(false);
                        }}
                      >
                        <ShieldX className="h-4 w-4 mr-2" />
                        Ablehnen
                      </Button>
                    </>
                  )}
                  {(selectedListing.status === "approved" || selectedListing.status === "pending_review") && (
                    <Button
                      variant="outline"
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      onClick={() => {
                        handleSuspend(selectedListing.id);
                        setSelectedListing({ ...selectedListing, status: "suspended" });
                      }}
                    >
                      <ShieldOff className="h-4 w-4 mr-2" />
                      Sperren
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setDetailOpen(false)} className="ml-auto">
                    Schließen
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
