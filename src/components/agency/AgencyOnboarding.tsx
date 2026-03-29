import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Palette, Users, ArrowRight, Check, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Agency } from "@/hooks/useAgency";

interface AgencyOnboardingProps {
  onCreateAgency: (
    name: string,
    slug: string,
    colors?: { primary_color?: string; accent_color?: string }
  ) => Promise<Agency | null>;
}

const PRIMARY_PRESETS = ["#8b5cf6", "#6366f1", "#ec4899", "#f43f5e", "#f97316", "#10b981"];
const ACCENT_PRESETS = ["#06b6d4", "#3b82f6", "#a855f7", "#14b8a6", "#eab308", "#f472b6"];

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

interface InviteEntry {
  email: string;
  role: "admin" | "member" | "viewer";
}

export function AgencyOnboarding({ onCreateAgency }: AgencyOnboardingProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#8b5cf6");
  const [accentColor, setAccentColor] = useState("#06b6d4");
  const [invites, setInvites] = useState<InviteEntry[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");
  const [creating, setCreating] = useState(false);

  const generateSlug = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(generateSlug(value));
  };

  const addInvite = () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) return;
    setInvites((prev) => [...prev, { email: inviteEmail.trim(), role: inviteRole }]);
    setInviteEmail("");
  };

  const removeInvite = (idx: number) => {
    setInvites((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) return;
    setCreating(true);
    try {
      await onCreateAgency(name.trim(), slug.trim(), {
        primary_color: primaryColor,
        accent_color: accentColor,
      });
    } finally {
      setCreating(false);
    }
  };

  const steps = [
    { num: 1, label: "Agentur erstellen", icon: Building2 },
    { num: 2, label: "Anpassen", icon: Palette },
    { num: 3, label: "Team einladen", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#0f0a1e] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {steps.map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step >= s.num
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                    : "bg-white/[0.06] text-slate-600"
                }`}
              >
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              {s.num < 3 && (
                <div className={`w-12 h-0.5 rounded-full transition-colors duration-300 ${
                  step > s.num ? "bg-violet-500" : "bg-white/[0.08]"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl shadow-black/20">
          <AnimatePresence mode="wait">
            {/* Step 1: Create */}
            {step === 1 && (
              <motion.div key="step1" variants={stagger} initial="hidden" animate="show" exit="hidden" className="space-y-6">
                <motion.div variants={fadeUp} className="text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-50">Erstelle deine Agentur</h2>
                  <p className="text-sm text-slate-500 mt-1">Gib deiner Agentur einen Namen</p>
                </motion.div>
                <motion.div variants={fadeUp} className="space-y-3">
                  <label className="text-xs font-medium text-slate-400">Agenturname</label>
                  <Input
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="z.B. Traumhochzeiten GmbH"
                    className="bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder:text-slate-600 h-11 rounded-xl"
                  />
                </motion.div>
                <motion.div variants={fadeUp} className="space-y-3">
                  <label className="text-xs font-medium text-slate-400">URL-Slug</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">eventbliss.app/</span>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(generateSlug(e.target.value))}
                      placeholder="traumhochzeiten"
                      className="bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder:text-slate-600 h-11 rounded-xl flex-1"
                    />
                  </div>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!name.trim() || !slug.trim()}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11 rounded-xl cursor-pointer disabled:opacity-40"
                  >
                    Weiter <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* Step 2: Customize */}
            {step === 2 && (
              <motion.div key="step2" variants={stagger} initial="hidden" animate="show" exit="hidden" className="space-y-6">
                <motion.div variants={fadeUp} className="text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-pink-500/25">
                    <Palette className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-50">Anpassen</h2>
                  <p className="text-sm text-slate-500 mt-1">Waehle deine Markenfarben</p>
                </motion.div>
                <motion.div variants={fadeUp} className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Primaerfarbe</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRIMARY_PRESETS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setPrimaryColor(c)}
                        className={`w-9 h-9 rounded-xl cursor-pointer transition-all duration-200 ${
                          primaryColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#0f0a1e] scale-110" : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </motion.div>
                <motion.div variants={fadeUp} className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Akzentfarbe</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {ACCENT_PRESETS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setAccentColor(c)}
                        className={`w-9 h-9 rounded-xl cursor-pointer transition-all duration-200 ${
                          accentColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#0f0a1e] scale-110" : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </motion.div>
                {/* Preview */}
                <motion.div variants={fadeUp} className="rounded-xl border border-white/[0.08] p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}>
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{name || "Deine Agentur"}</p>
                    <p className="text-[10px] text-slate-500">Vorschau</p>
                  </div>
                </motion.div>
                <motion.div variants={fadeUp} className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(1)}
                    className="flex-1 text-slate-400 hover:text-slate-200 h-11 rounded-xl cursor-pointer"
                  >
                    Zurueck
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white h-11 rounded-xl cursor-pointer"
                  >
                    Weiter <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* Step 3: Invite Team */}
            {step === 3 && (
              <motion.div key="step3" variants={stagger} initial="hidden" animate="show" exit="hidden" className="space-y-6">
                <motion.div variants={fadeUp} className="text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-50">Team einladen</h2>
                  <p className="text-sm text-slate-500 mt-1">Lade Teammitglieder ein (optional)</p>
                </motion.div>
                <motion.div variants={fadeUp} className="flex gap-2">
                  <Input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@beispiel.de"
                    className="bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder:text-slate-600 h-10 rounded-xl flex-1"
                    onKeyDown={(e) => e.key === "Enter" && addInvite()}
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as InviteEntry["role"])}
                    className="bg-white/[0.04] border border-white/[0.1] text-slate-300 text-xs rounded-xl px-2 h-10 cursor-pointer"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Mitglied</option>
                    <option value="viewer">Betrachter</option>
                  </select>
                  <Button onClick={addInvite} size="icon" className="bg-violet-600 hover:bg-violet-700 h-10 w-10 rounded-xl cursor-pointer shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </motion.div>
                {invites.length > 0 && (
                  <motion.div variants={fadeUp} className="space-y-2 max-h-40 overflow-y-auto">
                    {invites.map((inv, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/[0.04] rounded-xl px-3 py-2">
                        <div>
                          <span className="text-sm text-slate-200">{inv.email}</span>
                          <span className="text-[10px] text-slate-500 ml-2 capitalize">{inv.role}</span>
                        </div>
                        <button onClick={() => removeInvite(i)} className="text-slate-600 hover:text-red-400 cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
                <motion.div variants={fadeUp} className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(2)}
                    className="flex-1 text-slate-400 hover:text-slate-200 h-11 rounded-xl cursor-pointer"
                  >
                    Zurueck
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={creating}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white h-11 rounded-xl cursor-pointer disabled:opacity-40"
                  >
                    {creating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" /> Loslegen
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
