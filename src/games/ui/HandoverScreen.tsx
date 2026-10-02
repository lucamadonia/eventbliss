/**
 * HandoverScreen — „Gib das Handy an MAX“ (Masterplan 3.5, T07/T08).
 *
 * Deckt den GANZEN Bildschirm deckend ab, solange das Host-Handy den Besitzer
 * wechselt. Das Spiel darf darunter nichts Geheimes rendern — der Zustand
 * dafuer kommt aus handover-machine.ts (`activeGuest`); nach der Bestaetigung
 * den Inhalt in <HandoverReveal> einblenden.
 *
 *   kind="handover": `player` bekommt das Handy vom Host.
 *   kind="return":   `player` ist fertig, `returnTo` bekommt das Handy
 *                    (naechster Gast: „Weiter an Gerda“, Host: „Zurueck an Luca“).
 *   secret:          vor dem Weitergeben erst „Zudecken & weitergeben“, und
 *                    „Ich bin …“ muss 600 ms gehalten werden — ein
 *                    Doppeltipp darf keine Rolle an den Falschen verraten.
 *
 * Test-IDs (qa-party): handover-screen[data-player-id], handover-confirm,
 * handover-next, handover-cover.
 */
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { useHaptics } from "@/hooks/useHaptics";
import { firePartyHaptic, partyCue, partyMotion, playerGlow } from "@/lib/party-motion";

export interface HandoverPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface HandoverScreenProps {
  /** handover: Empfaenger. return: wer gerade fertig ist. */
  player: HandoverPlayer;
  kind: "handover" | "return";
  /** return: Empfaenger. `isHost` → „Zurueck an …“ statt „Weiter an …“. Fehlt er, geht das Handy an den Host. */
  returnTo?: HandoverPlayer & { isHost?: boolean };
  onConfirm: () => void;
  /** Geheime Infos im Spiel → „Zudecken & weitergeben“ + Halten statt Tippen. */
  secret?: boolean;
  /** Hinweis „Uhr angehalten“ — aus bei Spielen ohne pausierte Uhr. Standard: an. */
  clockPaused?: boolean;
}

type Step = "cover" | "pass";

const BASE = "#060810";
/** Eingaben direkt nach einem Bildwechsel verwerfen (Doppeltipp-Schutz). */
export const HANDOVER_INPUT_GUARD_MS = 400;
/** Halten fuer geheime Spiele. */
export const HANDOVER_HOLD_MS = 600;

export function HandoverScreen({ player, kind, returnTo, onConfirm, secret = false, clockPaused = true }: HandoverScreenProps) {
  const { t, i18n } = useTranslation();
  const haptics = useHaptics();
  const reduce = !!useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const armedAt = useRef(0);

  // Neuer Empfaenger / neue Art → wieder von vorn (ggf. erst zudecken). Im
  // Rendern zurueckgesetzt statt im Effekt, damit kein Bild mit altem Schritt
  // aufblitzt.
  const resetKey = `${kind}|${secret}|${player.id}|${returnTo?.id ?? ""}`;
  const firstStep: Step = kind === "return" && secret ? "cover" : "pass";
  const [stepState, setStepState] = useState<{ key: string; step: Step }>({ key: resetKey, step: firstStep });
  if (stepState.key !== resetKey) setStepState({ key: resetKey, step: firstStep });
  const step = stepState.key === resetKey ? stepState.step : firstStep;

  const recipient = kind === "return" ? returnTo ?? null : player;
  const toHost = kind === "return" && (!returnTo || !!returnTo.isHost);
  const shown = step === "cover" ? player : recipient ?? player;
  const upper = (name: string) => name.toLocaleUpperCase(i18n.language || undefined);

  useEffect(() => {
    armedAt.current = performance.now();
    firePartyHaptic(haptics, partyCue("T07", "host").haptic);
    buttonRef.current?.focus({ preventScroll: true });
  }, [haptics, step, shown.id]);

  const armed = () => performance.now() - armedAt.current >= HANDOVER_INPUT_GUARD_MS;

  const recipientName = recipient?.name ?? "";
  let headline: string;
  let cta: string;
  let announce: string;
  let testId: string;
  if (step === "cover") {
    headline = t("handover.coverTitle", "Fertig, {{name}}?", { name: player.name });
    cta = t("handover.coverButton", "Zudecken & weitergeben");
    announce = t("handover.coverAnnounce", "{{name}} ist fertig. Bildschirm zudecken.", { name: player.name });
    testId = "handover-cover";
  } else if (kind === "handover") {
    headline = t("handover.passTo", "Gib das Handy an {{name}}", { name: upper(player.name) });
    cta = t("handover.confirm", "Ich bin {{name}} – los geht's", { name: player.name });
    announce = t("handover.announce", "Handy an {{name}} weitergeben.", { name: player.name });
    testId = "handover-confirm";
  } else if (toHost) {
    headline = recipient
      ? t("handover.returnTo", "Zurück an {{name}}", { name: upper(recipientName) })
      : t("handover.returnToHost", "Zurück an den Host");
    cta = recipient
      ? t("handover.confirmHost", "Ich bin {{name}} – weiter", { name: recipientName })
      : t("handover.confirmHostGeneric", "Ich bin der Host – weiter");
    announce = headline;
    testId = "handover-next";
  } else {
    headline = t("handover.passOn", "Weiter an {{name}}", { name: upper(recipientName) });
    cta = t("handover.confirm", "Ich bin {{name}} – los geht's", { name: recipientName });
    announce = t("handover.announce", "Handy an {{name}} weitergeben.", { name: recipientName });
    testId = "handover-next";
  }

  const hold = secret && step === "pass";
  const showLookAway = step === "pass" && !toHost;
  const glow = shown.color || "#df8eff";

  const act = () => {
    if (!armed()) return;
    haptics.light();
    if (step === "cover") setStepState({ key: resetKey, step: "pass" });
    else onConfirm();
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="handover-headline"
        data-testid="handover-screen"
        data-player-id={shown.id}
        data-step={step}
        className="fixed inset-0 z-[90] flex flex-col overflow-hidden px-6 text-white"
        style={{
          backgroundColor: BASE,
          paddingTop: "max(env(safe-area-inset-top), 16px)",
          paddingBottom: "max(env(safe-area-inset-bottom), 20px)",
        }}
      >
        {/* Farbglut des Spielers — nur Deckkraft animiert (schont aeltere Android-GPUs). */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(circle at 50% 40%, ${glow}2e 0%, ${glow}12 30%, transparent 62%)` }}
          animate={reduce ? undefined : { opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />

        <p className="sr-only" aria-live="assertive" aria-atomic="true">{announce}</p>

        <div className="relative flex h-10 shrink-0 items-center justify-center">
          {clockPaused && (
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-sm font-medium text-white/80">
              ⏸ {t("handover.clockPaused", "Uhr angehalten")}
            </span>
          )}
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`${step}:${shown.id}`}
              variants={partyMotion("profileMorph", reduce)}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex w-full max-w-md flex-col items-center text-center"
            >
              <div
                className="mb-7 flex h-40 w-40 items-center justify-center rounded-full"
                style={{ background: `linear-gradient(145deg, ${glow}3d, ${glow}12)`, boxShadow: playerGlow(glow, "active") }}
              >
                <span aria-hidden className="text-[96px] leading-none">{step === "cover" ? "🙈" : shown.avatar}</span>
              </div>

              <h1
                className="font-game w-full break-words font-black leading-[0.95] tracking-tight [text-wrap:balance]"
                style={{ fontSize: "clamp(2rem, 11vw, 3.75rem)", textShadow: `0 0 32px ${glow}59` }}
              >
                {upper(shown.name)}
              </h1>

              <p id="handover-headline" className="mt-5 text-xl font-semibold text-white/90">
                {step === "cover" ? "" : "📲 "}
                {headline}
              </p>

              {step === "cover" && (
                <p className="mt-2 text-base text-white/60">
                  {t("handover.coverHint", "Leg das Handy mit dem Bildschirm nach unten, bevor du es weitergibst.")}
                </p>
              )}
              {showLookAway && (
                <p className="mt-2 text-base text-white/60">{t("handover.lookAway", "(die anderen bitte wegschauen)")}</p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative mx-auto w-full max-w-md shrink-0 pt-4">
          {hold ? (
            <HoldButton
              buttonRef={buttonRef}
              testId={testId}
              glow={glow}
              label={cta}
              hint={t("handover.holdHint", "Gedrückt halten")}
              canStart={armed}
              onHeld={act}
              onStart={() => haptics.select()}
            />
          ) : (
            <button
              ref={buttonRef}
              type="button"
              data-testid={testId}
              onClick={act}
              className="min-h-[60px] w-full rounded-2xl bg-white px-6 text-lg font-bold text-[#0b0a12] outline-none transition-transform focus-visible:ring-4 focus-visible:ring-white/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
              style={{ boxShadow: playerGlow(glow, "active") }}
            >
              {cta}
            </button>
          )}
        </div>
      </div>
    </MotionConfig>
  );
}

interface HoldButtonProps {
  buttonRef: RefObject<HTMLButtonElement>;
  testId: string;
  glow: string;
  label: string;
  hint: string;
  canStart: () => boolean;
  onStart: () => void;
  onHeld: () => void;
}

/** 600 ms halten; Fuellung waechst linear, springt beim Loslassen in 200 ms zurueck. */
function HoldButton({ buttonRef, testId, glow, label, hint, canStart, onStart, onHeld }: HoldButtonProps) {
  const { i18n } = useTranslation();
  // Fuellung waechst in Leserichtung (Arabisch: von rechts).
  const rtl = i18n.dir?.() === "rtl" || (typeof document !== "undefined" && document.dir === "rtl");
  const empty = rtl ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)";
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };
  const start = () => {
    if (timer.current || !canStart()) return;
    onStart();
    setHolding(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      onHeld();
    }, HANDOVER_HOLD_MS);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <button
      ref={buttonRef}
      type="button"
      data-testid={testId}
      data-hold-ms={HANDOVER_HOLD_MS}
      aria-describedby={`${testId}-hint`}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); start(); }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !e.repeat) { e.preventDefault(); start(); } }}
      onKeyUp={(e) => { if (e.key === "Enter" || e.key === " ") stop(); }}
      onContextMenu={(e) => e.preventDefault()}
      className="relative min-h-[60px] w-full select-none overflow-hidden rounded-2xl bg-white/90 px-6 text-lg font-bold text-[#0b0a12] outline-none [touch-action:none] [-webkit-touch-callout:none] focus-visible:ring-4 focus-visible:ring-white/50"
      style={{ boxShadow: playerGlow(glow, "active") }}
    >
      <span
        aria-hidden
        className="absolute inset-0 bg-white"
        style={{
          clipPath: holding ? "inset(0 0% 0 0%)" : empty,
          transition: holding ? `clip-path ${HANDOVER_HOLD_MS}ms linear` : "clip-path 200ms ease-out",
          boxShadow: `inset 0 -4px 0 ${glow}`,
        }}
      />
      <span className="relative flex flex-col items-center leading-tight">
        {label}
        <span id={`${testId}-hint`} className="text-sm font-medium text-[#0b0a12]/70">{hint}</span>
      </span>
    </button>
  );
}

/**
 * Inhalt nach „Ich bin Max“ freilegen (handoverReveal, 450 ms von der Mitte).
 * Rendert die Kinder erst, wenn `revealed` — vorher existiert nichts im DOM.
 */
export function HandoverReveal({ revealed, children }: { revealed: boolean; children: ReactNode }) {
  const reduce = !!useReducedMotion();
  const haptics = useHaptics();
  useEffect(() => {
    if (revealed) haptics.medium();
  }, [revealed, haptics]);
  return (
    <AnimatePresence>
      {revealed && (
        <motion.div key="handover-reveal" variants={partyMotion("handoverReveal", reduce)} initial="initial" animate="animate" exit="exit">
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default HandoverScreen;
