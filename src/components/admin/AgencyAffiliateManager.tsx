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
import { toast } from "sonner";
import { 
  Building2, Search, Plus, Check, X, ExternalLink, 
  Phone, Mail, MapPin, Percent, Euro, TrendingUp, Users
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
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [commissionRate, setCommissionRate] = useState("10");
  const [contactEmail, setContactEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAgencyAffiliates();
  }, []);

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
      setSelectedAgency(null);
      setCommissionRate("10");
      setContactEmail("");
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
      const { error } = await supabase
        .from("agency_affiliates" as never)
        .update({ status, is_verified: status === "active" } as never)
        .eq("id", id as never);

      if (error) throw error;

      toast.success(t("admin.agencyAffiliate.statusUpdated", "Status aktualisiert"));
      fetchAgencyAffiliates();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(t("admin.agencyAffiliate.statusError", "Fehler beim Aktualisieren"));
    }
  };

  // Get agencies not yet registered as affiliates
  const registeredAgencyIds = new Set(agencyAffiliates.map(a => a.agency_id));
  const availableAgencies = allAgencies.filter(a => !registeredAgencyIds.has(a.id.toString()));
  
  const filteredAvailableAgencies = availableAgencies.filter(
    a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         a.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("admin.agencyAffiliate.addAgency", "Agentur hinzufügen")}
        </Button>
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
          <CardTitle>{t("admin.agencyAffiliate.registeredAgencies", "Registrierte Agenturen")}</CardTitle>
        </CardHeader>
        <CardContent>
          {agencyAffiliates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("admin.agencyAffiliate.noAgencies", "Noch keine Agentur-Partner registriert")}
            </div>
          ) : (
            <div className="space-y-3">
              {agencyAffiliates.map((affiliate) => (
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
                        >
                          <Check className="h-4 w-4 text-success" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => handleUpdateStatus(affiliate.id, "suspended")}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
    </div>
  );
};

export { AgencyAffiliateManager };
