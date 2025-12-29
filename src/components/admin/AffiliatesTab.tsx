import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useAllAffiliates,
  useCreateAffiliate,
  useUpdateAffiliate,
  useAssignVoucherToAffiliate,
} from "@/hooks/useAffiliate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Plus,
  Edit,
  Link,
  TrendingUp,
  Euro,
  Percent,
  Building2,
  Mail,
  Phone,
  Globe,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const tierColors: Record<string, string> = {
  bronze: "bg-amber-600",
  silver: "bg-gray-400",
  gold: "bg-yellow-500",
  platinum: "bg-purple-500",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  active: "bg-green-500",
  suspended: "bg-red-500",
  terminated: "bg-gray-500",
};

export function AffiliatesTab() {
  const { t } = useTranslation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: affiliates, isLoading } = useAllAffiliates();
  const createAffiliate = useCreateAffiliate();
  const updateAffiliate = useUpdateAffiliate();
  const assignVoucher = useAssignVoucherToAffiliate();

  // Get all vouchers for assignment
  const { data: vouchers } = useQuery({
    queryKey: ["vouchers-for-assignment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vouchers")
        .select("id, code, is_active")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  // Form state for create/edit
  const [formData, setFormData] = useState({
    contact_name: "",
    email: "",
    company_name: "",
    phone: "",
    website: "",
    tax_id: "",
    commission_type: "percentage",
    commission_rate: 10,
    status: "pending",
    tier: "bronze",
    notes: "",
  });

  const [assignData, setAssignData] = useState({
    voucher_id: "",
    custom_commission_type: "",
    custom_commission_rate: 0,
  });

  const filteredAffiliates = affiliates?.filter(
    (a) =>
      a.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    await createAffiliate.mutateAsync({
      contact_name: formData.contact_name,
      email: formData.email,
      company_name: formData.company_name || undefined,
      phone: formData.phone || undefined,
      website: formData.website || undefined,
      tax_id: formData.tax_id || undefined,
      commission_type: formData.commission_type,
      commission_rate: formData.commission_rate,
      status: formData.status,
      tier: formData.tier,
      notes: formData.notes || undefined,
    });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!selectedAffiliate) return;
    await updateAffiliate.mutateAsync({
      id: selectedAffiliate.id,
      ...formData,
    });
    setIsEditOpen(false);
    resetForm();
  };

  const handleAssignVoucher = async () => {
    if (!selectedAffiliate || !assignData.voucher_id) return;
    await assignVoucher.mutateAsync({
      affiliate_id: selectedAffiliate.id,
      voucher_id: assignData.voucher_id,
      custom_commission_type: assignData.custom_commission_type || undefined,
      custom_commission_rate: assignData.custom_commission_rate || undefined,
    });
    setIsAssignOpen(false);
    setAssignData({ voucher_id: "", custom_commission_type: "", custom_commission_rate: 0 });
  };

  const resetForm = () => {
    setFormData({
      contact_name: "",
      email: "",
      company_name: "",
      phone: "",
      website: "",
      tax_id: "",
      commission_type: "percentage",
      commission_rate: 10,
      status: "pending",
      tier: "bronze",
      notes: "",
    });
    setSelectedAffiliate(null);
  };

  const openEdit = (affiliate: any) => {
    setSelectedAffiliate(affiliate);
    setFormData({
      contact_name: affiliate.contact_name,
      email: affiliate.email,
      company_name: affiliate.company_name || "",
      phone: affiliate.phone || "",
      website: affiliate.website || "",
      tax_id: affiliate.tax_id || "",
      commission_type: affiliate.commission_type,
      commission_rate: affiliate.commission_rate,
      status: affiliate.status,
      tier: affiliate.tier,
      notes: affiliate.notes || "",
    });
    setIsEditOpen(true);
  };

  const openAssign = (affiliate: any) => {
    setSelectedAffiliate(affiliate);
    setIsAssignOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("affiliate.admin.totalPartners", "Partner gesamt")}</p>
                <p className="text-2xl font-bold">{affiliates?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("affiliate.admin.activePartners", "Aktive Partner")}</p>
                <p className="text-2xl font-bold">
                  {affiliates?.filter((a) => a.status === "active").length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Euro className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("affiliate.admin.totalEarnings", "Gesamtprovisionen")}</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    affiliates?.reduce((sum, a) => sum + parseFloat(a.total_earnings || 0), 0) || 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Euro className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("affiliate.admin.pendingPayouts", "Ausstehende Auszahlungen")}</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    affiliates?.reduce((sum, a) => sum + parseFloat(a.pending_balance || 0), 0) || 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Input
          placeholder={t("affiliate.admin.searchPlaceholder", "Partner suchen...")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t("affiliate.admin.createPartner", "Partner anlegen")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("affiliate.admin.createPartner", "Partner anlegen")}</DialogTitle>
            </DialogHeader>
            <AffiliateForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreate}
              isLoading={createAffiliate.isPending}
              submitLabel={t("common.save", "Speichern")}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Affiliates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("affiliate.admin.partnerList", "Partner-Liste")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("affiliate.admin.name", "Name")}</TableHead>
                  <TableHead>{t("affiliate.admin.email", "E-Mail")}</TableHead>
                  <TableHead>{t("affiliate.admin.tier", "Tier")}</TableHead>
                  <TableHead>{t("affiliate.admin.commission", "Provision")}</TableHead>
                  <TableHead>{t("affiliate.admin.earnings", "Einnahmen")}</TableHead>
                  <TableHead>{t("affiliate.admin.pending", "Offen")}</TableHead>
                  <TableHead>{t("common.status", "Status")}</TableHead>
                  <TableHead>{t("affiliate.admin.actions", "Aktionen")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAffiliates?.map((affiliate) => (
                  <TableRow key={affiliate.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{affiliate.contact_name}</p>
                        {affiliate.company_name && (
                          <p className="text-sm text-muted-foreground">{affiliate.company_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{affiliate.email}</TableCell>
                    <TableCell>
                      <Badge className={`${tierColors[affiliate.tier]} text-white`}>
                        {t(`affiliate.tiers.${affiliate.tier}`, affiliate.tier)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {affiliate.commission_type === "percentage"
                        ? `${affiliate.commission_rate}%`
                        : formatCurrency(affiliate.commission_rate)}
                    </TableCell>
                    <TableCell>{formatCurrency(parseFloat(affiliate.total_earnings || 0))}</TableCell>
                    <TableCell>{formatCurrency(parseFloat(affiliate.pending_balance || 0))}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${statusColors[affiliate.status]} text-white`}>
                        {t(`affiliate.status.${affiliate.status}`, affiliate.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(affiliate)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openAssign(affiliate)}>
                          <Link className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!filteredAffiliates || filteredAffiliates.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {t("affiliate.admin.noPartners", "Keine Partner gefunden")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("affiliate.admin.editPartner", "Partner bearbeiten")}</DialogTitle>
          </DialogHeader>
          <AffiliateForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdate}
            isLoading={updateAffiliate.isPending}
            submitLabel={t("common.save", "Speichern")}
          />
        </DialogContent>
      </Dialog>

      {/* Assign Voucher Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("affiliate.admin.assignVoucher", "Gutschein zuweisen")} - {selectedAffiliate?.contact_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("affiliate.admin.selectVoucher", "Gutschein auswählen")}</Label>
              <Select
                value={assignData.voucher_id}
                onValueChange={(v) => setAssignData({ ...assignData, voucher_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("affiliate.admin.selectVoucherPlaceholder", "Gutschein wählen...")} />
                </SelectTrigger>
                <SelectContent>
                  {vouchers?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("affiliate.admin.customCommissionType", "Eigener Provisionstyp")}</Label>
                <Select
                  value={assignData.custom_commission_type}
                  onValueChange={(v) => setAssignData({ ...assignData, custom_commission_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("affiliate.admin.useDefault", "Standard verwenden")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{t("affiliate.commission.percentage", "Prozent")}</SelectItem>
                    <SelectItem value="fixed">{t("affiliate.commission.fixed", "Festbetrag")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("affiliate.admin.customRate", "Eigener Satz")}</Label>
                <Input
                  type="number"
                  value={assignData.custom_commission_rate || ""}
                  onChange={(e) =>
                    setAssignData({ ...assignData, custom_commission_rate: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <Button
              onClick={handleAssignVoucher}
              disabled={!assignData.voucher_id || assignVoucher.isPending}
              className="w-full"
            >
              {assignVoucher.isPending ? t("common.loading", "Laden...") : t("affiliate.admin.assign", "Zuweisen")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Affiliate Form Component
function AffiliateForm({
  formData,
  setFormData,
  onSubmit,
  isLoading,
  submitLabel,
}: {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
  submitLabel: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t("affiliate.form.contactName", "Ansprechpartner")} *
          </Label>
          <Input
            value={formData.contact_name}
            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {t("affiliate.form.email", "E-Mail")} *
          </Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {t("affiliate.form.companyName", "Firmenname")}
          </Label>
          <Input
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          />
        </div>
        <div>
          <Label className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            {t("affiliate.form.phone", "Telefon")}
          </Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t("affiliate.form.website", "Website")}
          </Label>
          <Input
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />
        </div>
        <div>
          <Label className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t("affiliate.form.taxId", "USt-ID")}
          </Label>
          <Input
            value={formData.tax_id}
            onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t("affiliate.form.commissionType", "Provisionstyp")}</Label>
          <Select
            value={formData.commission_type}
            onValueChange={(v) => setFormData({ ...formData, commission_type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">
                <span className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  {t("affiliate.commission.percentage", "Prozent")}
                </span>
              </SelectItem>
              <SelectItem value="fixed">
                <span className="flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  {t("affiliate.commission.fixed", "Festbetrag")}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>
            {t("affiliate.form.commissionRate", "Provisionssatz")}{" "}
            {formData.commission_type === "percentage" ? "(%)" : "(€)"}
          </Label>
          <Input
            type="number"
            value={formData.commission_rate}
            onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t("affiliate.form.tier", "Tier")}</Label>
          <Select value={formData.tier} onValueChange={(v) => setFormData({ ...formData, tier: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bronze">{t("affiliate.tiers.bronze", "Bronze")}</SelectItem>
              <SelectItem value="silver">{t("affiliate.tiers.silver", "Silber")}</SelectItem>
              <SelectItem value="gold">{t("affiliate.tiers.gold", "Gold")}</SelectItem>
              <SelectItem value="platinum">{t("affiliate.tiers.platinum", "Platin")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t("common.status", "Status")}</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">{t("affiliate.status.pending", "Ausstehend")}</SelectItem>
              <SelectItem value="active">{t("affiliate.status.active", "Aktiv")}</SelectItem>
              <SelectItem value="suspended">{t("affiliate.status.suspended", "Gesperrt")}</SelectItem>
              <SelectItem value="terminated">{t("affiliate.status.terminated", "Beendet")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>{t("affiliate.form.notes", "Notizen")}</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <Button onClick={onSubmit} disabled={isLoading || !formData.contact_name || !formData.email} className="w-full">
        {isLoading ? t("common.loading", "Laden...") : submitLabel}
      </Button>
    </div>
  );
}