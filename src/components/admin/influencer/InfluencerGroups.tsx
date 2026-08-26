/**
 * Gruppen und Leistungspakete — die Vorlagen, aus denen ein Deal entsteht.
 *
 * Eine GRUPPE haelt die Standardkonditionen ("TikTok DE klein" = 3 Monate
 * Probe, 10 % Provision). Ein PAKET haelt, was dafuer geliefert werden soll
 * ("2 Reels + 3 Stories in 30 Tagen").
 *
 * Beim Aktivieren eines Deals werden beide nur als VORBELEGUNG benutzt — im
 * Deal-Dialog laesst sich jedes Feld ueberschreiben. Genau deshalb sind es
 * Vorlagen und keine Regeln: eine Konditionentabelle, von der man nicht
 * abweichen kann, wird im ersten Sonderfall umgangen.
 */
import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useInfluencerGroups, useInfluencerPackages, useSaveGroup, useSavePackage,
  type InfluencerGroup, type PackageItem,
} from "@/hooks/useInfluencers";

const ITEM_KINDS = ["reel", "story", "post", "video", "livestream", "newsletter", "other"] as const;
const ITEM_LABEL: Record<string, string> = {
  reel: "Reel", story: "Story", post: "Post", video: "Video",
  livestream: "Livestream", newsletter: "Newsletter", other: "Sonstiges",
};

export default function InfluencerGroups() {
  const { data: groups = [] } = useInfluencerGroups();
  const { data: packages = [] } = useInfluencerPackages();
  const [groupDialog, setGroupDialog] = useState<Partial<InfluencerGroup> | null>(null);
  const [packageDialog, setPackageDialog] = useState<{
    id?: number; name: string; duration: string; items: Partial<PackageItem>[];
  } | null>(null);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* ── Gruppen ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Gruppen</CardTitle>
            <Button size="sm" onClick={() => setGroupDialog({ name: "" })}>
              <Plus className="h-4 w-4 mr-2" />Gruppe
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {groups.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Noch keine Gruppen. Sie sparen Tipparbeit, sobald mehrere Influencer dieselben Konditionen bekommen.
            </p>
          )}
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setGroupDialog(g)}
              className="w-full text-left rounded-lg border px-3 py-2 hover:bg-muted/50 transition-colors"
            >
              <div className="font-medium">{g.name}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {g.default_trial_months != null && (
                  <Badge variant="secondary" className="text-[10px]">{g.default_trial_months} Monate Probe</Badge>
                )}
                {g.default_commission_rate != null && (
                  <Badge variant="secondary" className="text-[10px]">{g.default_commission_rate} % Provision</Badge>
                )}
                {g.default_fee_amount != null && (
                  <Badge variant="secondary" className="text-[10px]">{g.default_fee_amount} € Honorar</Badge>
                )}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* ── Pakete ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Leistungspakete</CardTitle>
            <Button
              size="sm"
              onClick={() => setPackageDialog({ name: "", duration: "30", items: [{ kind: "reel", quantity: 1, due_offset_days: 14 }] })}
            >
              <Plus className="h-4 w-4 mr-2" />Paket
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {packages.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Noch keine Pakete. Aus einem Paket entstehen beim Aktivieren eines Deals die einzelnen Aufgaben mit Frist.
            </p>
          )}
          {packages.map((p) => (
            <button
              key={p.id}
              onClick={() =>
                setPackageDialog({
                  id: p.id,
                  name: p.name,
                  duration: String(p.duration_days),
                  items: (p.items || []).map((it) => ({ ...it })),
                })
              }
              className="w-full text-left rounded-lg border px-3 py-2 hover:bg-muted/50 transition-colors"
            >
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-muted-foreground">
                {(p.items || []).map((it) => `${it.quantity}× ${ITEM_LABEL[it.kind] ?? it.kind}`).join(", ") || "keine Posten"}
                {" · "}{p.duration_days} Tage
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {groupDialog && <GroupDialog group={groupDialog} onClose={() => setGroupDialog(null)} packages={packages} />}
      {packageDialog && <PackageDialog draft={packageDialog} onClose={() => setPackageDialog(null)} />}
    </div>
  );
}

/* ── Gruppen-Dialog ──────────────────────────────────────────────────── */

function GroupDialog({
  group, onClose, packages,
}: {
  group: Partial<InfluencerGroup>;
  onClose: () => void;
  packages: { id: number; name: string }[];
}) {
  const save = useSaveGroup();
  const [name, setName] = useState(group.name ?? "");
  const [description, setDescription] = useState(group.description ?? "");
  const [months, setMonths] = useState(group.default_trial_months?.toString() ?? "");
  const [commission, setCommission] = useState(group.default_commission_rate?.toString() ?? "");
  const [fee, setFee] = useState(group.default_fee_amount?.toString() ?? "");
  const [pkg, setPkg] = useState(group.default_package_id ? String(group.default_package_id) : "none");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{group.id ? "Gruppe bearbeiten" : "Neue Gruppe"}</DialogTitle>
          <DialogDescription>Standardkonditionen — im Deal jederzeit überschreibbar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="TikTok DE klein" />
          </div>
          <div className="space-y-1.5">
            <Label>Beschreibung</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Probe-Monate</Label>
              <Input type="number" value={months} onChange={(e) => setMonths(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Provision %</Label>
              <Input type="number" step="0.5" value={commission} onChange={(e) => setCommission(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Honorar €</Label>
              <Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Standardpaket</Label>
            <Select value={pkg} onValueChange={setPkg}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keins</SelectItem>
                {packages.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button
            disabled={!name.trim() || save.isPending}
            onClick={() =>
              save.mutate(
                {
                  ...(group.id ? { id: group.id } : {}),
                  name: name.trim(),
                  description,
                  default_trial_months: months ? Number(months) : null,
                  default_commission_rate: commission ? Number(commission) : null,
                  default_fee_amount: fee ? Number(fee) : null,
                  default_package_id: pkg === "none" ? null : Number(pkg),
                },
                { onSuccess: onClose },
              )
            }
          >
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Paket-Dialog ────────────────────────────────────────────────────── */

function PackageDialog({
  draft, onClose,
}: {
  draft: { id?: number; name: string; duration: string; items: Partial<PackageItem>[] };
  onClose: () => void;
}) {
  const save = useSavePackage();
  const [name, setName] = useState(draft.name);
  const [duration, setDuration] = useState(draft.duration);
  const [items, setItems] = useState(draft.items);

  const setItem = (idx: number, patch: Partial<PackageItem>) =>
    setItems((cur) => cur.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Paket bearbeiten" : "Neues Paket"}</DialogTitle>
          <DialogDescription>
            Aus jedem Posten entstehen beim Aktivieren so viele Aufgaben, wie die Anzahl sagt — jede mit eigener Frist.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Standard-Paket" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Zeitraum (Tage)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Posten</Label>
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  className="w-16"
                  value={it.quantity ?? 1}
                  onChange={(e) => setItem(idx, { quantity: Number(e.target.value) })}
                />
                <Select value={it.kind ?? "reel"} onValueChange={(v) => setItem(idx, { kind: v })}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ITEM_KINDS.map((k) => (
                      <SelectItem key={k} value={k}>{ITEM_LABEL[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  className="w-24"
                  title="Fällig nach Tagen"
                  value={it.due_offset_days ?? 14}
                  onChange={(e) => setItem(idx, { due_offset_days: Number(e.target.value) })}
                />
                <Button size="sm" variant="ghost" onClick={() => setItems((cur) => cur.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setItems((cur) => [...cur, { kind: "story", quantity: 1, due_offset_days: 14 }])}
            >
              <Plus className="h-4 w-4 mr-2" />Posten
            </Button>
            <p className="text-xs text-muted-foreground">
              Die dritte Zahl ist die Frist in Tagen ab Deal-Start.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button
            disabled={!name.trim() || save.isPending}
            onClick={() =>
              save.mutate(
                {
                  pkg: {
                    ...(draft.id ? { id: draft.id } : {}),
                    name: name.trim(),
                    duration_days: Number(duration) || 30,
                    is_active: true,
                  },
                  items: items.map(({ id: _id, package_id: _pid, ...rest }) => rest),
                },
                { onSuccess: onClose },
              )
            }
          >
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
