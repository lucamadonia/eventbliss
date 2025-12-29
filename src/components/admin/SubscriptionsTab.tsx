import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crown, RefreshCw, Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  expires_at: string | null;
  created_at: string;
  stripe_subscription_id: string | null;
}

export function SubscriptionsTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    subscription: Subscription | null;
  }>({ open: false, subscription: null });
  const [newPlan, setNewPlan] = useState("free");
  const [newExpiry, setNewExpiry] = useState("");

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("plan", filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast({
        title: t("common.error"),
        description: t("admin.subscriptions.fetchError", "Fehler beim Laden der Abos"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [filter]);

  const handleEdit = (subscription: Subscription) => {
    setEditDialog({ open: true, subscription });
    setNewPlan(subscription.plan);
    setNewExpiry(subscription.expires_at ? subscription.expires_at.split("T")[0] : "");
  };

  const handleSaveEdit = async () => {
    if (!editDialog.subscription) return;

    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          plan: newPlan,
          expires_at: newExpiry ? new Date(newExpiry).toISOString() : null,
        })
        .eq("id", editDialog.subscription.id);

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("admin.subscriptions.updated", "Abo aktualisiert"),
      });

      setEditDialog({ open: false, subscription: null });
      fetchSubscriptions();
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: t("common.error"),
        description: t("admin.subscriptions.updateError", "Fehler beim Aktualisieren"),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("admin.subscriptions.confirmDelete", "Abo wirklich löschen?"))) return;

    try {
      const { error } = await supabase.from("subscriptions").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("admin.subscriptions.deleted", "Abo gelöscht"),
      });

      fetchSubscriptions();
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast({
        title: t("common.error"),
        description: t("admin.subscriptions.deleteError", "Fehler beim Löschen"),
        variant: "destructive",
      });
    }
  };

  const getPlanBadge = (plan: string) => {
    if (plan === "premium") {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
          <Crown className="h-3 w-3 mr-1" />
          Premium
        </Badge>
      );
    }
    if (plan === "lifetime") {
      return (
        <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
          <Crown className="h-3 w-3 mr-1" />
          Lifetime
        </Badge>
      );
    }
    return <Badge variant="secondary">Free</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>{t("admin.subscriptions.title", "Abonnement-Verwaltung")}</CardTitle>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t("common.filter")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchSubscriptions}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.subscriptions.user", "Benutzer")}</TableHead>
                    <TableHead>{t("admin.subscriptions.plan", "Plan")}</TableHead>
                    <TableHead>{t("admin.subscriptions.expires", "Läuft ab")}</TableHead>
                    <TableHead>{t("admin.subscriptions.stripe", "Stripe")}</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {t("admin.subscriptions.noSubscriptions", "Keine Abos gefunden")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {sub.user_id.slice(0, 8)}...
                          </code>
                        </TableCell>
                        <TableCell>{getPlanBadge(sub.plan)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {sub.expires_at
                            ? format(new Date(sub.expires_at), "dd.MM.yyyy", { locale: de })
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {sub.stripe_subscription_id ? (
                            <Badge variant="outline" className="font-mono text-xs">
                              {sub.stripe_subscription_id.slice(0, 12)}...
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(sub)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(sub.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, subscription: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.subscriptions.editTitle", "Abo bearbeiten")}</DialogTitle>
            <DialogDescription>
              {t("admin.subscriptions.editDescription", "Ändere den Plan oder das Ablaufdatum")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("admin.subscriptions.plan", "Plan")}</Label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.subscriptions.expiryDate", "Ablaufdatum")}</Label>
              <Input
                type="date"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("admin.subscriptions.expiryHint", "Leer lassen für unbegrenzt")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, subscription: null })}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveEdit}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
