/**
 * MFA Enrollment UI — TOTP enrollment, verification and unenrollment.
 *
 * GDPR Art. 32 hardening for privileged accounts. Required by AdminRoute
 * which enforces AAL2 for admin areas.
 *
 * Flow:
 *   1. User clicks "MFA aktivieren"
 *   2. Supabase returns a TOTP secret + QR-code SVG
 *   3. User scans in authenticator app + enters a 6-digit code
 *   4. We call verify() → if OK, factor is enabled
 *   5. List enrolled factors with option to unenroll
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldOff, Loader2, Smartphone, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MfaFactor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
}

export function MfaEnrollment() {
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollData, setEnrollData] = useState<{
    factorId: string;
    qrCode: string;
    secret: string;
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  async function loadFactors() {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const totp = (data?.totp ?? []) as MfaFactor[];
      setFactors(totp);
    } catch (err) {
      console.error("[mfa] listFactors", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFactors();
  }, []);

  async function startEnrollment() {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `EventBliss-${new Date().toISOString().slice(0, 10)}`,
      });
      if (error) throw error;
      if (!data?.totp) throw new Error("no_totp_data");
      setEnrollData({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "MFA-Aktivierung fehlgeschlagen";
      toast.error(message);
    } finally {
      setEnrolling(false);
    }
  }

  async function verifyEnrollment() {
    if (!enrollData || verifyCode.length !== 6) return;
    setVerifying(true);
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({
        factorId: enrollData.factorId,
      });
      if (chErr) throw chErr;

      const { error: verErr } = await supabase.auth.mfa.verify({
        factorId: enrollData.factorId,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (verErr) throw verErr;

      toast.success("MFA aktiviert ✅");
      setEnrollData(null);
      setVerifyCode("");
      await loadFactors();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verifizierung fehlgeschlagen — bitte Code erneut eingeben.";
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  }

  async function unenroll(factorId: string) {
    if (!confirm("MFA wirklich deaktivieren? Dein Konto ist dann weniger geschützt.")) return;
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      toast.success("MFA deaktiviert");
      await loadFactors();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Deaktivierung fehlgeschlagen";
      toast.error(message);
    }
  }

  function copySecret() {
    if (!enrollData?.secret) return;
    navigator.clipboard.writeText(enrollData.secret).then(() => {
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <GlassCard padding="md">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </GlassCard>
    );
  }

  const verified = factors.filter((f) => f.status === "verified");

  return (
    <GlassCard padding="md">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          {verified.length > 0 ? (
            <ShieldCheck className="w-6 h-6 text-success shrink-0 mt-0.5" />
          ) : (
            <ShieldOff className="w-6 h-6 text-muted-foreground shrink-0 mt-0.5" />
          )}
          <div>
            <h3 className="font-display font-semibold mb-1">
              Multi-Faktor-Authentifizierung (MFA)
            </h3>
            <p className="text-sm text-muted-foreground">
              {verified.length > 0
                ? "MFA ist aktiviert. Dein Konto ist mit einem zweiten Faktor geschützt."
                : "Sichere dein Konto mit einer Authenticator-App (Google Authenticator, 1Password, Aegis, etc.)."}
            </p>
          </div>
        </div>
      </div>

      {verified.length > 0 && (
        <div className="space-y-2 mb-4">
          {verified.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/40"
            >
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className="w-4 h-4 text-primary" />
                <span className="font-medium">{f.friendly_name ?? "Authenticator-App"}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => unenroll(f.id)}>
                Entfernen
              </Button>
            </div>
          ))}
        </div>
      )}

      {!enrollData && (
        <GradientButton
          variant={verified.length > 0 ? "outline" : "primary"}
          size="md"
          onClick={startEnrollment}
          disabled={enrolling}
        >
          {enrolling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {verified.length > 0 ? "Weiteren Faktor hinzufügen" : "MFA aktivieren"}
        </GradientButton>
      )}

      {enrollData && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-4 p-4 rounded-xl bg-muted/30 border border-border/40"
        >
          <p className="text-sm">
            <strong>1.</strong> Scanne den QR-Code mit deiner Authenticator-App:
          </p>
          <div
            className="bg-white p-4 rounded-lg w-fit mx-auto"
            dangerouslySetInnerHTML={{ __html: enrollData.qrCode }}
          />
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              Manuell eingeben (TOTP-Secret)
            </summary>
            <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-background border border-border/50 font-mono text-xs break-all">
              <span className="flex-1">{enrollData.secret}</span>
              <button onClick={copySecret} className="shrink-0 p-1 hover:text-foreground">
                {secretCopied ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </details>

          <div className="space-y-2">
            <Label htmlFor="mfa-verify-code">
              <strong>2.</strong> Gib den 6-stelligen Code aus deiner App ein:
            </Label>
            <Input
              id="mfa-verify-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="font-mono text-lg tracking-widest text-center"
            />
          </div>

          <div className="flex gap-2">
            <GradientButton
              size="md"
              onClick={verifyEnrollment}
              disabled={verifyCode.length !== 6 || verifying}
            >
              {verifying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Aktivieren
            </GradientButton>
            <Button
              variant="ghost"
              onClick={() => {
                setEnrollData(null);
                setVerifyCode("");
              }}
            >
              Abbrechen
            </Button>
          </div>
        </motion.div>
      )}
    </GlassCard>
  );
}
