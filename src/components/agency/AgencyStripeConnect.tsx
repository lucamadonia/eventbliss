import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, CheckCircle2, Shield, Banknote, BarChart3,
  ExternalLink, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─── Component ──────────────────────────────────────── */
export default function AgencyStripeConnect() {
  const [connected, setConnected] = useState(false);

  const benefits = [
    { icon: Banknote, label: "Direkte Auszahlungen", desc: "Erhalte Zahlungen direkt auf dein Bankkonto" },
    { icon: Shield, label: "Sichere Zahlungen", desc: "PCI-konforme Zahlungsabwicklung durch Stripe" },
    { icon: BarChart3, label: "Einfaches Dashboard", desc: "Umsaetze und Auszahlungen im Blick behalten" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-lg font-semibold text-slate-50">Zahlungen</h3>
        <p className="text-sm text-slate-500">Stripe Connect fuer Marketplace-Auszahlungen</p>
      </motion.div>

      {!connected ? (
        /* ─── Not Connected State ────────────────────── */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-violet-600/10 via-cyan-600/5 to-violet-600/10 backdrop-blur-xl border border-violet-500/20 rounded-2xl p-8 sm:p-10"
        >
          <div className="max-w-lg mx-auto text-center space-y-6">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <CreditCard className="w-8 h-8 text-white" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-slate-50">Stripe verbinden</h4>
              <p className="text-sm text-slate-400 mt-2">
                Verbinde dein Stripe-Konto, um Zahlungen fuer deine Marketplace-Services zu empfangen und automatische Auszahlungen zu erhalten.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4 text-left">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={benefit.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <benefit.icon className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{benefit.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{benefit.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <Button
              onClick={() => setConnected(true)}
              className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white cursor-pointer shadow-lg shadow-violet-500/20 h-11 px-8 text-sm"
            >
              <Zap className="w-4 h-4 mr-2" />
              Jetzt verbinden
            </Button>

            <p className="text-[10px] text-slate-600">
              Du wirst zu Stripe weitergeleitet, um dein Konto zu verifizieren.
            </p>
          </div>
        </motion.div>
      ) : (
        /* ─── Connected State ────────────────────────── */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-emerald-500/[0.06] backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-8 sm:p-10"
        >
          <div className="max-w-lg mx-auto space-y-6">
            {/* Success Header */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-50">Stripe verbunden</h4>
                <p className="text-sm text-slate-400">Dein Konto ist bereit fuer Zahlungen</p>
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Konto-ID</span>
                <span className="text-xs font-mono text-slate-300">acct_****7x9K</span>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-slate-200">Zahlungen aktiviert</span>
                  <Badge className="ml-auto text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20">
                    charges_enabled
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-slate-200">Auszahlungen aktiviert</span>
                  <Badge className="ml-auto text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20">
                    payouts_enabled
                  </Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-white/[0.1] text-slate-300 hover:bg-white/[0.04] cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Stripe Dashboard oeffnen
              </Button>
              <Button
                variant="ghost"
                onClick={() => setConnected(false)}
                className="text-slate-500 hover:text-red-400 cursor-pointer text-xs"
              >
                Trennen
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
