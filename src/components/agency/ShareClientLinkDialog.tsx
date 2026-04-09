import { useState } from "react";
import { Copy, Check, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getBaseUrl } from "@/lib/platform";

interface ShareClientLinkDialogProps {
  eventId: string;
  agencyId: string;
  trigger?: React.ReactNode;
}

const permissionOptions = [
  { key: "view_timeline", label: "Zeitplan ansehen" },
  { key: "view_budget_summary", label: "Budget-Uebersicht ansehen" },
  { key: "view_files", label: "Dateien ansehen" },
  { key: "approve_milestones", label: "Meilensteine freigeben" },
] as const;

export function ShareClientLinkDialog({ eventId, agencyId, trigger }: ShareClientLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    view_timeline: true,
    view_budget_summary: true,
    view_files: false,
    approve_milestones: false,
  });
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const togglePerm = (key: string) => {
    setPermissions((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleGenerate = async () => {
    if (!clientName.trim()) return;
    setGenerating(true);
    try {
      const { data, error } = await (supabase
        .from("client_access_tokens" as any)
        .insert({
          event_id: eventId,
          agency_id: agencyId,
          client_name: clientName.trim(),
          client_email: clientEmail.trim() || null,
          permissions,
          expires_at: expiresAt || null,
          is_active: true,
        } as any)
        .select("token")
        .single() as any);

      if (error) throw error;

      const token = (data as any)?.token;
      const link = `${getBaseUrl()}/client/${token}`;
      setGeneratedLink(link);
    } catch (err) {
      console.error("Failed to generate client link:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setClientName("");
      setClientEmail("");
      setExpiresAt("");
      setPermissions({ view_timeline: true, view_budget_summary: true, view_files: false, approve_milestones: false });
      setGeneratedLink(null);
      setCopied(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="bg-white/5 border-white/10 text-white/70 hover:text-white gap-1.5">
            <Link2 className="w-3.5 h-3.5" /> Kunden-Link
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#1a1625] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Kunden-Zugang teilen</DialogTitle>
        </DialogHeader>

        {generatedLink ? (
          <div className="space-y-4 mt-2">
            <p className="text-sm text-white/60">
              Der Zugangs-Link wurde erstellt. Teile ihn mit deinem Kunden:
            </p>
            <div className="flex gap-2">
              <Input
                value={generatedLink}
                readOnly
                className="bg-white/5 border-white/10 text-white text-xs flex-1"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                size="icon"
                className={copied ? "bg-emerald-600 hover:bg-emerald-700" : "bg-violet-600 hover:bg-violet-700"}
                onClick={handleCopy}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full border-white/10 text-white/60"
              onClick={() => handleClose(false)}
            >
              Schliessen
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-white/60 text-xs">Kundenname *</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="bg-white/5 border-white/10 text-white mt-1"
                placeholder="Max Mustermann"
              />
            </div>
            <div>
              <Label className="text-white/60 text-xs">E-Mail (optional)</Label>
              <Input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white mt-1"
                placeholder="max@example.com"
              />
            </div>
            <div>
              <Label className="text-white/60 text-xs mb-2 block">Berechtigungen</Label>
              <div className="space-y-2.5">
                {permissionOptions.map((opt) => (
                  <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer">
                    <Checkbox
                      checked={permissions[opt.key]}
                      onCheckedChange={() => togglePerm(opt.key)}
                      className="border-white/20 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                    />
                    <span className="text-sm text-white/70">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-white/60 text-xs">Ablaufdatum (optional)</Label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="bg-white/5 border-white/10 text-white mt-1"
              />
            </div>
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2"
              disabled={!clientName.trim() || generating}
              onClick={handleGenerate}
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Link generieren
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
