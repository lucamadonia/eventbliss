/**
 * Alle Aufgaben aller Influencer an einem Ort — mit Freigabe.
 *
 * DIE FREIGABE BLEIBT HIER. Der Influencer darf im eigenen Bereich einen
 * Nachweis einreichen (Status "submitted"), aber nicht genehmigen; das steht
 * so auch in der RLS-Regel der Tabelle. Wer beides duerfte, genehmigte sich
 * selbst.
 *
 * "Ueberfaellig" wird beim Anzeigen berechnet, nicht gespeichert. Ein Status,
 * den ein naechtlicher Lauf setzen muesste, ist so lange falsch, bis der Lauf
 * durch ist — und dieser Lauf existiert noch nicht.
 */
import { useMemo, useState } from "react";
import { Check, ExternalLink, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { de as deLocale } from "date-fns/locale";
import { formatReach } from "@/lib/influencer-status";
import { useDeliverables, useInfluencers, useUpdateDeliverable } from "@/hooks/useInfluencers";

const STATUS_LABEL: Record<string, string> = {
  open: "Offen",
  submitted: "Eingereicht",
  approved: "Freigegeben",
  rejected: "Abgelehnt",
  overdue: "Überfällig",
  waived: "Erlassen",
};

export default function InfluencerDeliverables() {
  const { data: tasks = [], isLoading } = useDeliverables();
  const { data: influencers = [] } = useInfluencers();
  const updateTask = useUpdateDeliverable();

  const [filter, setFilter] = useState("open");
  const [reachDraft, setReachDraft] = useState<Record<number, string>>({});

  const nameOf = useMemo(() => {
    const map = new Map<number, string>();
    for (const i of influencers) map.set(i.id, i.handle);
    return map;
  }, [influencers]);

  const now = Date.now();
  const isOverdue = (t: (typeof tasks)[number]) =>
    t.status === "open" && !!t.due_at && new Date(t.due_at).getTime() < now;

  const filtered = tasks.filter((t) => {
    if (filter === "all") return true;
    if (filter === "overdue") return isOverdue(t);
    return t.status === filter;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base">
            Leistungen
            <span className="ml-2 text-sm font-normal text-muted-foreground">{filtered.length}</span>
          </CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="open">Offen</SelectItem>
              <SelectItem value="overdue">Überfällig</SelectItem>
              <SelectItem value="submitted">Eingereicht</SelectItem>
              <SelectItem value="approved">Freigegeben</SelectItem>
              <SelectItem value="rejected">Abgelehnt</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Influencer</TableHead>
                <TableHead>Aufgabe</TableHead>
                <TableHead>Fällig</TableHead>
                <TableHead>Nachweis</TableHead>
                <TableHead>Reichweite</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Freigabe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Lade…</TableCell></TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    {tasks.length === 0
                      ? "Noch keine Aufgaben — sie entstehen beim Aktivieren eines Deals mit Leistungspaket."
                      : "Nichts in dieser Auswahl."}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((t) => {
                const overdue = isOverdue(t);
                return (
                  <TableRow key={t.id} className={overdue ? "bg-amber-500/5" : undefined}>
                    <TableCell className="font-medium">{nameOf.get(t.influencer_id) ?? "—"}</TableCell>
                    <TableCell>{t.title}</TableCell>
                    <TableCell className={overdue ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                      {t.due_at ? format(new Date(t.due_at), "dd.MM.yy", { locale: deLocale }) : "—"}
                    </TableCell>
                    <TableCell>
                      {t.proof_url ? (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={t.proof_url} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {t.status === "approved" ? (
                        <span className="tabular-nums text-sm">{formatReach(t.reach)}</span>
                      ) : (
                        <Input
                          type="number"
                          className="h-8 w-24"
                          placeholder="Reichweite"
                          value={reachDraft[t.id] ?? (t.reach ?? "")}
                          onChange={(e) => setReachDraft((d) => ({ ...d, [t.id]: e.target.value }))}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant(overdue ? "overdue" : t.status)}>
                        {STATUS_LABEL[overdue ? "overdue" : t.status] ?? t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {t.status !== "approved" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Freigeben"
                          onClick={() => {
                            const draft = reachDraft[t.id];
                            updateTask.mutate({
                              id: t.id,
                              patch: {
                                status: "approved",
                                approved_at: new Date().toISOString(),
                                ...(draft ? { reach: parseInt(draft, 10) } : {}),
                              },
                            });
                          }}
                        >
                          <Check className="h-4 w-4 text-emerald-600" />
                        </Button>
                      )}
                      {t.status !== "rejected" && t.status !== "approved" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Ablehnen"
                          onClick={() => updateTask.mutate({ id: t.id, patch: { status: "rejected" } })}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function badgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "approved") return "default";
  if (status === "rejected" || status === "overdue") return "destructive";
  if (status === "submitted") return "secondary";
  return "outline";
}
