import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Building2, Search, Plus, Check, X, ExternalLink, 
  Phone, Mail, MapPin, Percent, Euro, TrendingUp, Users, Ticket, Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AGENCIES as allAgencies, type Agency } from "@/lib/agencies-data";

interface AgencyAffiliate {
  id: string;
  agency_id: string;
  agency_name: string;
  agency_city: string;
  agency_country: string;
  affiliate_id: string | null;
  commission_rate: number;
  commission_type: string;
  is_verified: boolean;
  contact_email: string | null;
  status: string;
  total_referrals: number;
  total_bookings: number;
  total_commission: number;
  created_at: string;
}

const AgencyAffiliateManager = () => {
  const { t } = useTranslation();
  const [agencyAffiliates, setAgencyAffiliates] = useState<AgencyAffiliate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showVoucherDialog, setShowVoucherDialog] = useState(false);
  const [showManualAgencyDialog, setShowManualAgencyDialog] = useState(false);
  const [selectedAgencyForVoucher, setSelectedAgencyForVoucher] = useState<AgencyAffiliate | null>(null);
  const [availableVouchers, setAvailableVouchers] = useState<Array<{id: string; code: string; discount_type: string; discount_value: number | null}>>([]);
  const [selectedVoucherId, setSelectedVoucherId] = useState("");
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [commissionRate, setCommissionRate] = useState("10");
  const [contactEmail, setContactEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Manual agency form state
  const [manualAgencyName, setManualAgencyName] = useState("");
  const [manualAgencyCity, setManualAgencyCity] = useState("");
  const [manualAgencyCountry, setManualAgencyCountry] = useState("Deutschland");
  const [manualAgencyEmail, setManualAgencyEmail] = useState("");
  const [manualAgencyPhone, setManualAgencyPhone] = useState("");
  const [manualAgencyWebsite, setManualAgencyWebsite] = useState("");

  useEffect(() => {
    fetchAgencyAffiliates();
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const { data, error } = await supabase
        .from("vouchers")
        .select("id, code, discount_type, discount_value")
        .eq("is_active", true);
      if (error) throw error;
      setAvailableVouchers(data || []);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
    }
  };

  const fetchAgencyAffiliates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("agency_affiliates" as never)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAgencyAffiliates((data || []) as AgencyAffiliate[]);
    } catch (error) {
      console.error("Error fetching agency affiliates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAgencyAffiliate = async () => {
    if (!selectedAgency) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("agency_affiliates" as never)
        .insert({
          agency_id: selectedAgency.id.toString(),
          agency_name: selectedAgency.name,
          agency_city: selectedAgency.city,
          agency_country: selectedAgency.country,
          commission_rate: parseFloat(commissionRate),
          commission_type: "percentage",
          contact_email: contactEmail || selectedAgency.email,
          status: "pending",
        } as never);

      if (error) throw error;

      toast.success(t("admin.agencyAffiliate.addedSuccess", "Agentur als Partner hinzugefügt"));
      setShowAddDialog(false);
      resetAddDialog();
      fetchAgencyAffiliates();
    } catch (error) {
      console.error("Error adding agency affiliate:", error);
      toast.error(t("admin.agencyAffiliate.addedError", "Fehler beim Hinzufügen"));
    } finally {
      setIsSaving(false);
    }
  };

  const resetAddDialog = () => {
    setSelectedAgency(null);
    setCommissionRate("10");
    setContactEmail("");
    setSearchQuery("");
  };

  const resetManualDialog = () => {
    setManualAgencyName("");
    setManualAgencyCity("");
    setManualAgencyCountry("Deutschland");
    setManualAgencyEmail("");
    setManualAgencyPhone("");
    setManualAgencyWebsite("");
    setCommissionRate("10");
  };

  const handleAddManualAgency = async () => {
    if (!manualAgencyName || !manualAgencyCity || !manualAgencyCountry) {
      toast.error(t("admin.agencyAffiliate.fillRequired", "Bitte alle Pflichtfelder ausfüllen"));
      return;
    }
    setIsSaving(true);

    try {
      // Generate a unique ID for the new agency
      const uniqueId = `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from("agency_affiliates" as never)
        .insert({
          agency_id: uniqueId,
          agency_name: manualAgencyName,
          agency_city: manualAgencyCity,
          agency_country: manualAgencyCountry,
          commission_rate: parseFloat(commissionRate),
          commission_type: "percentage",
          contact_email: manualAgencyEmail || null,
          status: "active", // Directly active since admin creates it
          is_verified: true,
        } as never);

      if (error) throw error;

      toast.success(t("admin.agencyAffiliate.manualAddedSuccess", "Agentur manuell hinzugefügt"));
      setShowManualAgencyDialog(false);
      resetManualDialog();
      fetchAgencyAffiliates();
    } catch (error) {
      console.error("Error adding agency affiliate:", error);
      toast.error(t("admin.agencyAffiliate.addedError", "Fehler beim Hinzufügen"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      // Find the agency affiliate
      const affiliate = agencyAffiliates.find(a => a.id === id);
      
      if (status === "active" && affiliate && !affiliate.affiliate_id) {
        // Create an affiliates entry first
        const { data: newAffiliate, error: affiliateError } = await supabase
          .from("affiliates")
          .insert({
            contact_name: affiliate.agency_name,
            email: affiliate.contact_email || "",
            company_name: affiliate.agency_name,
            status: "active",
            commission_rate: affiliate.commission_rate,
            commission_type: affiliate.commission_type as "percentage" | "fixed",
          })
          .select()
          .single();

        if (affiliateError) throw affiliateError;

        // Update agency_affiliates with the new affiliate_id
        const { error } = await supabase
          .from("agency_affiliates" as never)
          .update({ 
            status, 
            is_verified: true,
            affiliate_id: newAffiliate.id 
          } as never)
          .eq("id", id as never);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("agency_affiliates" as never)
          .update({ status, is_verified: status === "active" } as never)
          .eq("id", id as never);

        if (error) throw error;
      }

      toast.success(t("admin.agencyAffiliate.statusUpdated", "Status aktualisiert"));
      fetchAgencyAffiliates();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(t("admin.agencyAffiliate.statusError", "Fehler beim Aktualisieren"));
    }
  };

  const handleAssignVoucher = async () => {
    if (!selectedAgencyForVoucher || !selectedVoucherId) return;
    
    if (!selectedAgencyForVoucher.affiliate_id) {
      toast.error(t("admin.agencyAffiliate.noAffiliateId", "Agentur muss zuerst genehmigt werden"));
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("affiliate_vouchers")
        .insert({
          affiliate_id: selectedAgencyForVoucher.affiliate_id,
          voucher_id: selectedVoucherId,
        });

      if (error) throw error;

      toast.success(t("admin.agencyAffiliate.voucherAssigned", "Voucher zugewiesen"));
      setShowVoucherDialog(false);
      setSelectedAgencyForVoucher(null);
      setSelectedVoucherId("");
    } catch (error: any) {
      console.error("Error assigning voucher:", error);
      if (error.message?.includes("duplicate")) {
        toast.error(t("admin.agencyAffiliate.voucherAlreadyAssigned", "Voucher bereits zugewiesen"));
      } else {
        toast.error(t("admin.agencyAffiliate.voucherError", "Fehler beim Zuweisen"));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const openVoucherDialog = (agency: AgencyAffiliate) => {
    setSelectedAgencyForVoucher(agency);
    setSelectedVoucherId("");
    setShowVoucherDialog(true);
  };

  // Get agencies not yet registered as affiliates
  const registeredAgencyIds = new Set(agencyAffiliates.map(a => a.agency_id));
  const availableAgencies = allAgencies.filter(a => !registeredAgencyIds.has(a.id.toString()));
  
  const filteredAvailableAgencies = availableAgencies.filter(
    a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         a.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter agency affiliates by status
  const filteredAgencyAffiliates = agencyAffiliates.filter(a => {
    if (statusFilter === "all") return true;
    return a.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/20 text-success border-success/30">Aktiv</Badge>;
      case "suspended":
        return <Badge variant="destructive">Gesperrt</Badge>;
      default:
        return <Badge variant="secondary">Ausstehend</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {t("admin.agencyAffiliate.title", "Agentur-Partner")}
          </h2>
          <p className="text-muted-foreground">
            {t("admin.agencyAffiliate.description", "Verwalte Agentur-Partnerschaften und Provisionen")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("admin.agencyAffiliate.addAgency", "Agentur hinzufügen")}
          </Button>
          <Button variant="outline" onClick={() => setShowManualAgencyDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("admin.agencyAffiliate.createAgency", "Neue Agentur")}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agencyAffiliates.length}</p>
                <p className="text-xs text-muted-foreground">Partner</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Check className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agencyAffiliates.filter(a => a.status === "active").length}</p>
                <p className="text-xs text-muted-foreground">Aktiv</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agencyAffiliates.reduce((sum, a) => sum + a.total_referrals, 0)}</p>
                <p className="text-xs text-muted-foreground">Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Euro className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agencyAffiliates.reduce((sum, a) => sum + a.total_commission, 0).toFixed(0)}€</p>
                <p className="text-xs text-muted-foreground">Provisionen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agency Affiliates List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>{t("admin.agencyAffiliate.registeredAgencies", "Registrierte Agenturen")}</CardTitle>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList>
                <TabsTrigger value="all" className="gap-1">
                  <Filter className="h-3 w-3" />
                  {t("common.all", "Alle")}
                </TabsTrigger>
                <TabsTrigger value="pending" className="gap-1">
                  {t("admin.agencyAffiliate.pending", "Ausstehend")}
                  {agencyAffiliates.filter(a => a.status === "pending").length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {agencyAffiliates.filter(a => a.status === "pending").length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="active">{t("admin.agencyAffiliate.active", "Aktiv")}</TabsTrigger>
                <TabsTrigger value="suspended">{t("admin.agencyAffiliate.suspended", "Gesperrt")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAgencyAffiliates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("admin.agencyAffiliate.noAgencies", "Noch keine Agentur-Partner registriert")}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAgencyAffiliates.map((affiliate) => (
                <div
                  key={affiliate.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{affiliate.agency_name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {affiliate.agency_city}, {affiliate.agency_country}
                      </div>
                      {affiliate.contact_email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {affiliate.contact_email}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 text-sm">
                      <Percent className="h-4 w-4 text-accent" />
                      <span className="font-medium">{affiliate.commission_rate}%</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <span>{affiliate.total_referrals} Referrals</span>
                    </div>
                    {getStatusBadge(affiliate.status)}
                    
                    {affiliate.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => handleUpdateStatus(affiliate.id, "active")}
                          title={t("admin.agencyAffiliate.approve", "Genehmigen")}
                        >
                          <Check className="h-4 w-4 text-success" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => handleUpdateStatus(affiliate.id, "suspended")}
                          title={t("admin.agencyAffiliate.reject", "Ablehnen")}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                    
                    {affiliate.status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1"
                        onClick={() => openVoucherDialog(affiliate)}
                      >
                        <Ticket className="h-4 w-4" />
                        {t("admin.agencyAffiliate.assignVoucher", "Voucher")}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Agency Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("admin.agencyAffiliate.addAgencyTitle", "Agentur als Partner hinzufügen")}</DialogTitle>
            <DialogDescription>
              {t("admin.agencyAffiliate.addAgencyDesc", "Wähle eine Agentur aus dem Verzeichnis und konfiguriere die Provision")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("admin.agencyAffiliate.searchAgencies", "Agentur suchen...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Agency List */}
            <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-2">
              {filteredAvailableAgencies.slice(0, 10).map((agency) => (
                <button
                  key={agency.id}
                  onClick={() => {
                    setSelectedAgency(agency);
                    setContactEmail(agency.email || "");
                  }}
                  className={`w-full text-left p-2 rounded-md transition-colors ${
                    selectedAgency?.id === agency.id
                      ? "bg-primary/10 border-primary border"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="font-medium text-sm">{agency.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {agency.city}, {agency.country}
                  </div>
                </button>
              ))}
              {filteredAvailableAgencies.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  {t("admin.agencyAffiliate.noAvailableAgencies", "Keine verfügbaren Agenturen gefunden")}
                </div>
              )}
            </div>

            {selectedAgency && (
              <>
                <div className="space-y-2">
                  <Label>{t("admin.agencyAffiliate.contactEmail", "Kontakt-Email")}</Label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="partner@agency.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("admin.agencyAffiliate.commissionRate", "Provisionssatz (%)")}</Label>
                  <Select value={commissionRate} onValueChange={setCommissionRate}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="10">10% (Standard)</SelectItem>
                      <SelectItem value="15">15%</SelectItem>
                      <SelectItem value="20">20%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t("common.cancel", "Abbrechen")}
            </Button>
            <Button 
              onClick={handleAddAgencyAffiliate} 
              disabled={!selectedAgency || isSaving}
            >
              {isSaving ? t("common.saving", "Speichern...") : t("admin.agencyAffiliate.addPartner", "Partner hinzufügen")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Voucher Assignment Dialog */}
      <Dialog open={showVoucherDialog} onOpenChange={setShowVoucherDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.agencyAffiliate.assignVoucherTitle", "Voucher zuweisen")}</DialogTitle>
            <DialogDescription>
              {selectedAgencyForVoucher && (
                <>
                  {t("admin.agencyAffiliate.assignVoucherDesc", "Wähle einen Voucher für")} <strong>{selectedAgencyForVoucher.agency_name}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("admin.agencyAffiliate.selectVoucher", "Voucher auswählen")}</Label>
              <Select value={selectedVoucherId} onValueChange={setSelectedVoucherId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.agencyAffiliate.selectVoucherPlaceholder", "Voucher wählen...")} />
                </SelectTrigger>
                <SelectContent>
                  {availableVouchers.map((voucher) => (
                    <SelectItem key={voucher.id} value={voucher.id}>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-bold">{voucher.code}</code>
                        <span className="text-muted-foreground text-xs">
                          {voucher.discount_type === "percentage" && `${voucher.discount_value}%`}
                          {voucher.discount_type === "fixed" && `${voucher.discount_value}€`}
                          {voucher.discount_type === "lifetime" && "Lifetime"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVoucherDialog(false)}>
              {t("common.cancel", "Abbrechen")}
            </Button>
            <Button 
              onClick={handleAssignVoucher} 
              disabled={!selectedVoucherId || isSaving}
            >
              {isSaving ? t("common.saving", "Speichern...") : t("admin.agencyAffiliate.assignVoucherBtn", "Voucher zuweisen")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Agency Creation Dialog */}
      <Dialog open={showManualAgencyDialog} onOpenChange={setShowManualAgencyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("admin.agencyAffiliate.createAgencyTitle", "Neue Agentur manuell anlegen")}</DialogTitle>
            <DialogDescription>
              {t("admin.agencyAffiliate.createAgencyDesc", "Erstelle eine neue Agentur, die nicht im Verzeichnis ist")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("admin.agencyAffiliate.agencyName", "Agenturname")} *</Label>
              <Input
                value={manualAgencyName}
                onChange={(e) => setManualAgencyName(e.target.value)}
                placeholder="z.B. Party Events GmbH"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("admin.agencyAffiliate.city", "Stadt")} *</Label>
                <Input
                  value={manualAgencyCity}
                  onChange={(e) => setManualAgencyCity(e.target.value)}
                  placeholder="z.B. München"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.agencyAffiliate.country", "Land")} *</Label>
                <Select value={manualAgencyCountry} onValueChange={setManualAgencyCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Deutschland">Deutschland</SelectItem>
                    <SelectItem value="Österreich">Österreich</SelectItem>
                    <SelectItem value="Schweiz">Schweiz</SelectItem>
                    <SelectItem value="Niederlande">Niederlande</SelectItem>
                    <SelectItem value="Belgien">Belgien</SelectItem>
                    <SelectItem value="Frankreich">Frankreich</SelectItem>
                    <SelectItem value="Italien">Italien</SelectItem>
                    <SelectItem value="Spanien">Spanien</SelectItem>
                    <SelectItem value="Polen">Polen</SelectItem>
                    <SelectItem value="Tschechien">Tschechien</SelectItem>
                    <SelectItem value="Ungarn">Ungarn</SelectItem>
                    <SelectItem value="Portugal">Portugal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("admin.agencyAffiliate.contactEmail", "Kontakt-Email")}</Label>
              <Input
                type="email"
                value={manualAgencyEmail}
                onChange={(e) => setManualAgencyEmail(e.target.value)}
                placeholder="partner@agency.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("admin.agencyAffiliate.phone", "Telefon")}</Label>
                <Input
                  type="tel"
                  value={manualAgencyPhone}
                  onChange={(e) => setManualAgencyPhone(e.target.value)}
                  placeholder="+49 123 456789"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.agencyAffiliate.website", "Website")}</Label>
                <Input
                  type="url"
                  value={manualAgencyWebsite}
                  onChange={(e) => setManualAgencyWebsite(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("admin.agencyAffiliate.commissionRate", "Provisionssatz (%)")}</Label>
              <Select value={commissionRate} onValueChange={setCommissionRate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="10">10% (Standard)</SelectItem>
                  <SelectItem value="15">15%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualAgencyDialog(false)}>
              {t("common.cancel", "Abbrechen")}
            </Button>
            <Button 
              onClick={handleAddManualAgency} 
              disabled={!manualAgencyName || !manualAgencyCity || isSaving}
            >
              {isSaving ? t("common.saving", "Speichern...") : t("admin.agencyAffiliate.createPartner", "Agentur erstellen")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { AgencyAffiliateManager };
