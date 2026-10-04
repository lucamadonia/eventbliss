/**
 * PartyTurnRibbon — „Wer ist dran?“ als Buehne oben am Handy (Design §9.1/9.2).
 *
 *   kind="me":    Du bist dran — Flaeche leuchtet in deiner Farbe, Haptik T06.
 *   kind="pass":  ein 🔁-Gast an DIESEM Handy ist dran, ohne verdeckte
 *                 Weitergabe (Spiele ohne Geheimnis/ohne Uhr-Pause, z. B. die
 *                 Bombe): „Gib das Handy an MAX“.
 *   kind="other": jemand anderes ist dran — ruhig, ohne Glow.
 *
 * Nur oeffentliche Infos (Name, Symbol, Farbe). Test-IDs fuer qa-party:
 * party-turn-ribbon[data-kind][data-player-id].
 */
import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { useHaptics } from "@/hooks/useHaptics";
import { firePartyHaptic, partyCue, partyMotion, playerGlow } from "@/lib/party-motion";
import { SeatAvatar } from "@/components/native/party/PartySheet";
import { resolveSeatAvatar } from "./seat-avatar-resolve";
import { useControllerParty } from "../party/controller-session";

export { resolveSeatAvatar };

export type TurnRibbonKind = "me" | "pass" | "other";

/** Hook form: resolves against the live controller-party roster. */
export function useSeatAvatar(): (avatar: string | undefined, id: string) => string {
  const members = useControllerParty().data?.members ?? [];
  return (avatar, id) => resolveSeatAvatar(avatar, id, members);
}

export interface TurnRibbonPlayer {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
}

export function PartyTurnRibbon({ player, kind, line, className = "" }: {
  player: TurnRibbonPlayer;
  kind: TurnRibbonKind;
  /** Zweite Zeile (Handlung), optional. */
  line?: string;
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  const reduced = !!useReducedMotion();
  const haptics = useHaptics();
  const color = player.color || "#df8eff";
  const avatar = useSeatAvatar()(player.avatar, player.id);
  const lit = kind !== "other";

  // T06/T07: nur wenn es fuer dieses Handy neu losgeht.
  const last = useRef("");
  useEffect(() => {
    const key = `${kind}|${player.id}`;
    if (key === last.current) return;
    last.current = key;
    if (lit) firePartyHaptic(haptics, partyCue(kind === "me" ? "T06" : "T07", kind === "me" ? "phone" : "host").haptic);
  }, [kind, player.id, lit, haptics]);

  const title = kind === "me"
    ? t("partyPlay.turn.you", "Du bist dran")
    : kind === "pass"
      ? t("partyPlay.turn.passTo", "Gib das Handy an {{name}}", { name: player.name.toLocaleUpperCase(i18n.language || undefined) })
      : t("partyPlay.turn.other", "{{name}} ist dran", { name: player.name });

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={`${kind}|${player.id}`}
        variants={partyMotion("cardEnter", reduced)} initial="initial" animate="animate" exit="exit"
        role="status" aria-live="polite"
        data-testid="party-turn-ribbon" data-kind={kind} data-player-id={player.id}
        className={`relative flex w-full items-center gap-4 overflow-hidden rounded-[28px] px-4 py-3 text-start ${className}`}
        style={{
          background: lit
            ? `radial-gradient(120% 140% at 0% 50%, ${color}2e 0%, #0d0915 62%)`
            : "#0d0915",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: lit ? `inset 0 1px 0 rgba(255,255,255,0.08), ${playerGlow(color, "soft")}` : "inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <span className="shrink-0 rounded-full" style={{ boxShadow: playerGlow(color, lit ? "active" : "soft") }}>
          <SeatAvatar avatar={avatar} color={color} size={56} />
        </span>
        <span className="min-w-0 flex-1">
          <span dir="auto" className="line-clamp-2 block break-words font-game text-[clamp(1.125rem,5.6vw,1.375rem)] font-extrabold leading-tight text-white [text-wrap:balance]">{title}</span>
          {line && <span dir="auto" className="mt-0.5 block text-[0.8125rem] font-semibold text-white/70">{line}</span>}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
