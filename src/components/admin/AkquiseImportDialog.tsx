import { useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  X, Upload, FileText, FileSpreadsheet, FileJson, Download,
  Check, AlertTriangle, Loader2, Eye, Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AkquiseImportDialogProps {
  onClose: () => void;
  onImported: () => void;
}

interface ParsedAgency {
  name: string;
  email: string;
  city: string;
  country: string;
  country_code: string;
  phone: string;
  website: string;
  description: string;
  contact_person: string;
  contact_role: string;
  valid: boolean;
  error?: string;
}

// ─── Example files ──────────────────────────────────────────────────────

const EXAMPLE_CSV = `name,email,city,country,country_code,phone,website,description,contact_person,contact_role
"Berlin Events GmbH",info@berlin-events.de,Berlin,Deutschland,DE,"+49 30 12345678",https://berlin-events.de,"JGA & Teamevents in Berlin",Max Müller,Geschäftsführer
"Munich Party Crew",hello@munich-party.de,München,Deutschland,DE,"+49 89 9876543",https://munich-party.de,"Partys und Events aller Art",Lisa Schmidt,Event-Managerin
"Barcelona Fiestas SL",hola@bcn-fiestas.es,Barcelona,España,ES,"+34 93 1234567",https://bcn-fiestas.es,"Fiestas y eventos en Barcelona",Carlos López,Director`;

const EXAMPLE_JSON = `[
  {
    "name": "Berlin Events GmbH",
    "email": "info@berlin-events.de",
    "city": "Berlin",
    "country": "Deutschland",
    "country_code": "DE",
    "phone": "+49 30 12345678",
    "website": "https://berlin-events.de",
    "description": "JGA & Teamevents in Berlin",
    "contact_person": "Max Müller",
    "contact_role": "Geschäftsführer"
  },
  {
    "name": "Munich Party Crew",
    "email": "hello@munich-party.de",
    "city": "München",
    "country": "Deutschland",
    "country_code": "DE",
    "phone": "+49 89 9876543",
    "website": "https://munich-party.de",
    "description": "Partys und Events aller Art",
    "contact_person": "Lisa Schmidt",
    "contact_role": "Event-Managerin"
  }
]`;

const EXAMPLE_TXT = `Berlin Events GmbH | info@berlin-events.de | Berlin | Deutschland | DE
Munich Party Crew | hello@munich-party.de | München | Deutschland | DE
Barcelona Fiestas SL | hola@bcn-fiestas.es | Barcelona | España | ES`;

const REQUIRED_FIELDS = ["name", "email", "city"];
const ALL_FIELDS = ["name", "email", "city", "country", "country_code", "phone", "website", "description", "contact_person", "contact_role"];

// ─── Parsers ────────────────────────────────────────────────────────────

function parseCSV(text: string): ParsedAgency[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headerRaw = lines[0];
  // Handle quoted CSV
  const headers = headerRaw.split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase().replace(/\s+/g, "_"));

  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; continue; }
      current += char;
    }
    values.push(current.trim());

    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ""; });

    return validateRow(obj);
  });
}

function parseJSON(text: string): ParsedAgency[] {
  try {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : [data];
    return arr.map((obj: Record<string, unknown>) => {
      const row: Record<string, string> = {};
      for (const key of ALL_FIELDS) {
        row[key] = String(obj[key] ?? obj[key.replace(/_/g, "")] ?? "");
      }
      return validateRow(row);
    });
  } catch {
    return [];
  }
}

function parseTXT(text: string): ParsedAgency[] {
  const lines = text.trim().split("\n").filter((l) => l.trim());
  return lines.map((line) => {
    const parts = line.split("|").map((p) => p.trim());
    const row: Record<string, string> = {};
    // Expect: name | email | city | country | country_code
    const fieldOrder = ["name", "email", "city", "country", "country_code"];
    fieldOrder.forEach((f, i) => { row[f] = parts[i] || ""; });
    return validateRow(row);
  });
}

function validateRow(obj: Record<string, string>): ParsedAgency {
  const a: ParsedAgency = {
    name: obj.name || "",
    email: obj.email || "",
    city: obj.city || "",
    country: obj.country || "Deutschland",
    country_code: obj.country_code || obj.countrycode || "DE",
    phone: obj.phone || "",
    website: obj.website || "",
    description: obj.description || "",
    contact_person: obj.contact_person || obj.contactperson || "",
    contact_role: obj.contact_role || obj.contactrole || "",
    valid: true,
  };
  if (!a.name) { a.valid = false; a.error = "Name fehlt"; }
  else if (!a.email || !a.email.includes("@")) { a.valid = false; a.error = "E-Mail ungültig"; }
  else if (!a.city) { a.valid = false; a.error = "Stadt fehlt"; }
  return a;
}

function autoDetect(text: string): "csv" | "json" | "txt" {
  const trimmed = text.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) return "json";
  if (trimmed.includes(",") && trimmed.split("\n")[0].includes("name")) return "csv";
  return "txt";
}

// ─── Component ──────────────────────────────────────────────────────────

export default function AkquiseImportDialog({ onClose, onImported }: AkquiseImportDialogProps) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedAgency[]>([]);
  const [format, setFormat] = useState<"csv" | "json" | "txt">("csv");
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [importResult, setImportResult] = useState<{ success: number; skipped: number; errors: number }>({ success: 0, skipped: 0, errors: 0 });

  const validCount = useMemo(() => parsed.filter((p) => p.valid).length, [parsed]);
  const invalidCount = useMemo(() => parsed.filter((p) => !p.valid).length, [parsed]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawText(text);
      const detected = autoDetect(text);
      setFormat(detected);
      const results = detected === "csv" ? parseCSV(text) : detected === "json" ? parseJSON(text) : parseTXT(text);
      setParsed(results);
      setStep("preview");
    };
    reader.readAsText(file);
  };

  const handlePasteAndParse = () => {
    if (!rawText.trim()) return;
    const detected = autoDetect(rawText);
    setFormat(detected);
    const results = detected === "csv" ? parseCSV(rawText) : detected === "json" ? parseJSON(rawText) : parseTXT(rawText);
    setParsed(results);
    setStep("preview");
  };

  const handleImport = async () => {
    const validRows = parsed.filter((p) => p.valid);
    if (validRows.length === 0) { toast.error("Keine gültigen Einträge"); return; }

    setStep("importing");
    let success = 0;
    let skipped = 0;
    let errors = 0;

    // Batch insert in chunks of 25
    for (let i = 0; i < validRows.length; i += 25) {
      const chunk = validRows.slice(i, i + 25).map((a) => ({
        name: a.name,
        email: a.email,
        city: a.city,
        country: a.country,
        country_code: a.country_code || "DE",
        phone: a.phone,
        website: a.website,
        description: a.description,
        contact_person: a.contact_person,
        contact_role: a.contact_role,
        outreach_status: "new",
        priority: "normal",
        status: "active",
      }));

      const { data, error } = await (supabase.from as any)("agency_directory")
        .upsert(chunk, { onConflict: "name,city", ignoreDuplicates: true })
        .select("id");

      if (error) {
        errors += chunk.length;
      } else {
        success += (data as any[])?.length ?? chunk.length;
        skipped += chunk.length - ((data as any[])?.length ?? chunk.length);
      }
    }

    setImportResult({ success, skipped, errors });
    setStep("done");
    toast.success(`${success} Agenturen importiert`);
  };

  const downloadExample = (type: "csv" | "json" | "txt") => {
    const content = type === "csv" ? EXAMPLE_CSV : type === "json" ? EXAMPLE_JSON : EXAMPLE_TXT;
    const ext = type;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eventbliss-import-beispiel.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyExample = (type: "csv" | "json" | "txt") => {
    const content = type === "csv" ? EXAMPLE_CSV : type === "json" ? EXAMPLE_JSON : EXAMPLE_TXT;
    navigator.clipboard.writeText(content);
    toast.success("Beispiel kopiert");
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", damping: 25 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#0a0118] p-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Upload className="w-6 h-6 text-purple-400" />
              Agenturen importieren
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              CSV, JSON oder TXT-Datei hochladen oder direkt einfügen
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        {/* Step: Upload */}
        {step === "upload" && (
          <div className="space-y-6">
            {/* Format examples */}
            <Tabs defaultValue="csv">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Beispiel-Formate</span>
                <TabsList className="bg-white/5 border border-white/10">
                  <TabsTrigger value="csv" className="text-xs gap-1"><FileSpreadsheet className="w-3 h-3" /> CSV</TabsTrigger>
                  <TabsTrigger value="json" className="text-xs gap-1"><FileJson className="w-3 h-3" /> JSON</TabsTrigger>
                  <TabsTrigger value="txt" className="text-xs gap-1"><FileText className="w-3 h-3" /> TXT</TabsTrigger>
                </TabsList>
              </div>

              {(["csv", "json", "txt"] as const).map((type) => (
                <TabsContent key={type} value={type}>
                  <Card className="p-4 border-white/10 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Badge className={cn("text-[10px] border-0 mr-2",
                          type === "csv" ? "bg-emerald-500/20 text-emerald-200" :
                          type === "json" ? "bg-amber-500/20 text-amber-200" :
                          "bg-blue-500/20 text-blue-200"
                        )}>{type.toUpperCase()}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {type === "csv" ? "Pflichtfelder: name, email, city — Rest optional" :
                           type === "json" ? "Array von Objekten mit name, email, city Pflichtfeldern" :
                           "Pipe-getrennt: name | email | city | country | country_code"}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => downloadExample(type)} className="gap-1 h-7 border-white/10">
                          <Download className="w-3 h-3" /> Download
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => copyExample(type)} className="gap-1 h-7 border-white/10">
                          <Copy className="w-3 h-3" /> Kopieren
                        </Button>
                      </div>
                    </div>
                    <pre className="text-[11px] font-mono text-muted-foreground bg-black/30 rounded-lg p-3 overflow-x-auto whitespace-pre leading-relaxed">
                      {type === "csv" ? EXAMPLE_CSV : type === "json" ? EXAMPLE_JSON : EXAMPLE_TXT}
                    </pre>
                    <div className="mt-3 text-[10px] text-muted-foreground">
                      <strong className="text-foreground">Pflichtfelder:</strong> name, email, city<br/>
                      <strong className="text-foreground">Optionale Felder:</strong> country, country_code, phone, website, description, contact_person, contact_role
                    </div>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            {/* Upload zone */}
            <div className="grid md:grid-cols-2 gap-4">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="group p-8 rounded-2xl border-2 border-dashed border-white/15 hover:border-purple-500/50 bg-white/[0.02] hover:bg-purple-500/5 transition-all text-center">
                <Upload className="w-10 h-10 text-muted-foreground group-hover:text-purple-400 mx-auto mb-3 transition-colors" />
                <p className="font-bold text-foreground mb-1">Datei hochladen</p>
                <p className="text-xs text-muted-foreground">.csv, .json oder .txt</p>
                <input ref={fileRef} type="file" accept=".csv,.json,.txt,.tsv" className="hidden" onChange={handleFileUpload} />
              </button>

              <div className="space-y-2">
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Oder hier direkt einfügen (CSV, JSON oder Pipe-Text)..."
                  className="w-full h-[140px] rounded-xl bg-white/[0.03] border border-white/10 p-3 text-sm font-mono text-foreground placeholder:text-muted-foreground resize-none"
                />
                <Button onClick={handlePasteAndParse} disabled={!rawText.trim()} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 font-bold">
                  <Eye className="w-4 h-4 mr-2" /> Vorschau & Validieren
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-purple-500/20 text-purple-200 border-0">{parsed.length} Einträge erkannt</Badge>
              <Badge className="bg-emerald-500/20 text-emerald-200 border-0"><Check className="w-3 h-3 mr-1" /> {validCount} gültig</Badge>
              {invalidCount > 0 && (
                <Badge className="bg-red-500/20 text-red-200 border-0"><AlertTriangle className="w-3 h-3 mr-1" /> {invalidCount} ungültig</Badge>
              )}
              <Badge className="bg-white/10 text-white/70 border-0">Format: {format.toUpperCase()}</Badge>
            </div>

            <div className="rounded-xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-xs">
                  <thead className="bg-white/[0.04] sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-muted-foreground font-semibold">Status</th>
                      <th className="px-3 py-2 text-left text-muted-foreground font-semibold">Name</th>
                      <th className="px-3 py-2 text-left text-muted-foreground font-semibold">E-Mail</th>
                      <th className="px-3 py-2 text-left text-muted-foreground font-semibold">Stadt</th>
                      <th className="px-3 py-2 text-left text-muted-foreground font-semibold">Land</th>
                      <th className="px-3 py-2 text-left text-muted-foreground font-semibold">Kontakt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((a, i) => (
                      <tr key={i} className={cn("border-t border-white/5", !a.valid && "bg-red-500/5")}>
                        <td className="px-3 py-2">
                          {a.valid
                            ? <Check className="w-4 h-4 text-emerald-400" />
                            : <span className="text-red-400 text-[10px]">{a.error}</span>}
                        </td>
                        <td className="px-3 py-2 font-semibold text-foreground">{a.name || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{a.email || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{a.city || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{a.country} ({a.country_code})</td>
                        <td className="px-3 py-2 text-muted-foreground">{a.contact_person || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setStep("upload"); setParsed([]); setRawText(""); }} className="border-white/10">
                Zurück
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 font-bold gap-2">
                <Upload className="w-4 h-4" />
                {validCount} Agenturen importieren
              </Button>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === "importing" && (
          <div className="py-16 text-center">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-lg font-bold text-foreground">Importiere {validCount} Agenturen...</p>
            <p className="text-sm text-muted-foreground mt-1">Bitte Fenster nicht schließen</p>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-black text-foreground">Import abgeschlossen!</h3>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-black text-emerald-400">{importResult.success}</div>
                <div className="text-xs text-muted-foreground">Importiert</div>
              </div>
              {importResult.skipped > 0 && (
                <div className="text-center">
                  <div className="text-3xl font-black text-amber-400">{importResult.skipped}</div>
                  <div className="text-xs text-muted-foreground">Übersprungen (Duplikat)</div>
                </div>
              )}
              {importResult.errors > 0 && (
                <div className="text-center">
                  <div className="text-3xl font-black text-red-400">{importResult.errors}</div>
                  <div className="text-xs text-muted-foreground">Fehler</div>
                </div>
              )}
            </div>
            <Button onClick={() => { onImported(); onClose(); }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 font-bold">
              Fertig — zur Pipeline
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
