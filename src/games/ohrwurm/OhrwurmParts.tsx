// OHRWURM — Teilansichten (Spielerchips, Karten, Zeitstrahl, Auflösung).
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { ChevronDown, ExternalLink, Loader2, Music2, Plus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { Participant, PendingCounter, RoundResolution, Song } from './ohrwurm-engine';
import { OW } from './ohrwurm-theme';

export function Avatar({ p, size = 32 }: { p: Pick<Participant, 'color' | 'avatar' | 'type'>; size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center font-black text-white shrink-0 relative"
      style={{ width: size, height: size, fontSize: size * 0.5, background: `radial-gradient(circle at 30% 25%, ${p.color}55, ${p.color}22)`, boxShadow: `inset 0 0 0 2px ${p.color}aa` }}>
      {p.avatar}
      {p.type === 'group' && (
        <Users className="absolute -bottom-1 -right-1 w-3 h-3 p-[1px] rounded-full" style={{ background: OW.bg, color: p.color }} />
      )}
    </div>
  );
}

const FADE = 'linear-gradient(to var(--ow-fade, right), #000 82%, transparent)';

export function Scoreboard({ participants, activeId, winTarget }: { participants: Participant[]; activeId?: string; winTarget: number }) {
  // Mehr Plaetze als Breite: weich ausblenden + einrasten, damit klar ist, dass es weitergeht.
  const strip = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(check) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [participants.length]);
  const openTeam = participants.find((participant) => participant.id === openTeamId && participant.memberNames?.length);
  return (
    <div className="relative z-10">
    <div ref={strip} className="flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4 py-3 no-scrollbar rtl:[--ow-fade:left]"
      style={overflows ? { maskImage: FADE, WebkitMaskImage: FADE } : undefined}>
      {participants.map((p) => {
        const isActive = p.id === activeId;
        return (
          <button type="button" key={p.id} disabled={!p.memberNames?.length}
            onClick={() => setOpenTeamId((current) => current === p.id ? null : p.id)}
            aria-expanded={p.memberNames?.length ? openTeamId === p.id : undefined}
            aria-label={p.memberNames?.length ? `${p.name}: ${p.memberNames.join(', ')}` : undefined}
            className="shrink-0 snap-start flex items-center gap-2.5 rounded-2xl px-3 py-2 transition-all"
            style={{
              background: OW.surface,
              border: `1.5px solid ${isActive || openTeamId === p.id ? p.color : 'transparent'}`,
              boxShadow: isActive ? `0 0 18px ${p.color}40` : 'none',
            }}>
            <Avatar p={p} size={30} />
            <div className="leading-tight">
              <div dir="auto" className="text-[13px] font-bold max-w-[88px] line-clamp-2 break-words leading-tight">{p.name}</div>
              <div className="text-[12px] font-mono" style={{ color: OW.dim }}>
                <span style={{ color: OW.secondary }}>{p.timeline.length}</span>/{winTarget} · {p.hooks} 🎣
              </div>
            </div>
            {!!p.memberNames?.length && <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${openTeamId === p.id ? 'rotate-180' : ''}`} style={{ color: p.color }} />}
          </button>
        );
      })}
    </div>
    {openTeam && (
      <div role="region" aria-label={openTeam.name} className="mx-4 mb-2 rounded-xl px-3 py-2 text-xs leading-relaxed"
        style={{ background: OW.surface, color: OW.dim, borderLeft: `3px solid ${openTeam.color}` }}>
        <strong dir="auto" style={{ color: OW.text }}>{openTeam.name}:</strong> {openTeam.memberNames?.join(' · ')}
      </div>
    )}
    </div>
  );
}

export function PhaseBanner({ tone, kicker, title, sub }: { tone: 'primary' | 'secondary' | 'accent'; kicker: string; title: string; sub: string }) {
  const color = tone === 'primary' ? OW.primary : tone === 'secondary' ? OW.secondary : OW.accent;
  return (
    <div className="text-center max-w-md mx-auto">
      <p className="text-[13px] font-black mb-1.5" style={{ color }}>{kicker}</p>
      <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">{title}</h2>
      <p className="text-sm" style={{ color: OW.dim }}>{sub}</p>
    </div>
  );
}

// Filigraner Sekundär-Aktions-Chip (Icon über Mini-Label). Visuell zurückgenommen,
// aber Tap-Target ≥ 52px. Genau EIN großer Primär-Button pro Screen; alles Weitere
// landet in einer Chip-Leiste oberhalb davon.
type ChipTone = 'default' | 'accent' | 'secondary' | 'spotify';

function chipToneStyle(tone: ChipTone, active: boolean): React.CSSProperties {
  if (active) {
    return {
      background: `${OW.accent}1f`, color: OW.accent, border: `1.5px solid ${OW.accent}`,
      boxShadow: `0 0 18px ${OW.accent}40, inset 0 1px 0 ${OW.accent}22`,
    };
  }
  switch (tone) {
    case 'secondary':
      return { background: 'rgba(38,224,196,0.10)', color: OW.secondary, border: '1.5px solid rgba(38,224,196,0.28)' };
    case 'spotify':
      return { background: 'rgba(29,185,84,0.14)', color: '#1DB954', border: '1.5px solid rgba(29,185,84,0.40)' };
    default:
      return { background: OW.surface, color: OW.dim, border: '1.5px solid transparent' };
  }
}

export function ActionChip({
  icon: Icon, label, tone = 'default', toggle = false, active = false, busy = false, cost, disabled = false, onClick, ariaLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone?: ChipTone;
  /** Ist der Chip ein An/Aus-Schalter? Steuert aria-pressed (entkoppelt vom Ton). */
  toggle?: boolean;
  active?: boolean;
  busy?: boolean;
  cost?: string;
  disabled?: boolean;
  onClick: () => void;
  ariaLabel?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      aria-pressed={toggle ? active : undefined}
      aria-disabled={disabled || undefined}
      aria-busy={busy || undefined}
      aria-label={ariaLabel ?? label}
      className={cn(
        'ow-chip relative flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl min-h-[52px] px-2 py-2',
        'font-bold transition-[background,border-color,box-shadow,opacity,color] duration-200',
        disabled && 'opacity-30',
      )}
      style={chipToneStyle(tone, active)}
    >
      {busy ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Icon className="w-[18px] h-[18px]" />}
      <span className="text-[12px] font-bold leading-none tracking-[0.04em] whitespace-nowrap">{label}</span>
      {cost && (
        <span
          className="absolute top-0.5 right-1 text-[12px] font-mono font-black leading-none px-1 py-0.5 rounded-full"
          style={{ background: OW.bg, color: tone === 'secondary' ? OW.secondary : OW.dim }}
        >
          {cost}
        </span>
      )}
    </motion.button>
  );
}

/** Mystery-Chip — repräsentiert die unbekannte (noch nicht aufgedeckte) Karte. */
export function MysteryChip() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex items-center gap-2 px-4 py-2 rounded-full"
      style={{ background: OW.surface, border: `1px dashed ${OW.primary}` }}>
      <Music2 className="w-4 h-4" style={{ color: OW.primary }} />
      <span className="font-black text-lg" style={{ color: OW.primary }}>?</span>
      <span className="text-xs font-bold" style={{ color: OW.dim }}>{t('games.ohrwurm.yearUnknown')}</span>
    </div>
  );
}

/** Vorderseite der Karte: QR-Code + Logo (Spec §2.2). */
export function QrCard({ song }: { song: Song }) {
  const { t } = useTranslation();
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-[20px] blur-2xl opacity-40" style={{ background: OW.primary }} />
      <div className="relative w-[230px] rounded-[20px] p-5 flex flex-col items-center gap-4"
        style={{ background: OW.elevated, boxShadow: '0 18px 50px rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1.5">
          <Music2 className="w-3.5 h-3.5" style={{ color: OW.primary }} />
          <span className="text-[13px] font-black tracking-[0.25em]" style={{ color: OW.dim }}>OHRWURM</span>
        </div>
        <div className="bg-white p-3 rounded-2xl">
          <QRCodeSVG value={song.qrPayload} size={158} level="M" fgColor="#16101f" bgColor="#ffffff" />
        </div>
        <a href={song.qrPayload} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: OW.secondary }}>
          <ExternalLink className="w-3.5 h-3.5" /> {t('games.ohrwurm.openOnSpotify')}
        </a>
      </div>
    </div>
  );
}

/** Auflösungs-Karte: Jahr groß + Titel + Künstler + Flagge (Spec §2.2). */
export function RevealCard({ song, flipped }: { song: Song; flipped: boolean }) {
  const { t } = useTranslation();
  return (
    <div style={{ perspective: 1000 }}>
      <motion.div
        animate={{ rotateY: flipped ? 0 : 180 }}
        transition={{ duration: 0.7, ease: [0.4, 0.7, 0.3, 1.1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-[230px] h-[300px]"
      >
        {/* Rückseite (sichtbar nach Flip) */}
        <div className="ow-card-face absolute inset-0 rounded-[20px] p-6 flex flex-col items-center justify-center text-center gap-3"
          style={{ background: `linear-gradient(160deg, ${OW.elevated}, ${OW.surface})`, border: `1px solid ${OW.primary}`, boxShadow: '0 18px 50px rgba(0,0,0,.5)' }}>
          <span className="text-[13px] font-black" style={{ color: OW.dim }}>{t('games.ohrwurm.releaseYear')}</span>
          <span className="text-6xl font-black ow-glow-pink leading-none" style={{ color: OW.primary }}>{song.year}</span>
          <div className="mt-2">
            <h3 className="text-xl font-black leading-tight">{song.title}</h3>
            <p className="text-sm font-semibold mt-1" style={{ color: OW.dim }}>
              {song.artist} <span className="ml-1">{song.flag}</span>
            </p>
          </div>
          <span className="mt-1 px-2.5 py-0.5 rounded-full text-[13px] font-bold" style={{ background: OW.bg, color: OW.accent }}>{song.genre}</span>
        </div>
        {/* Vorderseite (QR-Platzhalter, sichtbar vor Flip) */}
        <div className="ow-card-face absolute inset-0 rounded-[20px] flex items-center justify-center"
          style={{ background: OW.elevated, border: '1px solid rgba(255,255,255,0.06)', transform: 'rotateY(180deg)' }}>
          <Music2 className="w-12 h-12" style={{ color: OW.primary }} />
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Era-Farbe: bildet das Jahr auf ein chronologisches Spektrum ab — alt = kühl
 * (Teal) → Gold → neu = warm (Pink), exakt die Marken-Trias in zeitlicher
 * Reihenfolge. So liest sich der Zeitstrahl als Verlauf der Jahrzehnte.
 */
function eraColor(year: number): string {
  const t = Math.max(0, Math.min(1, (year - 1955) / 70)); // 1955..2025
  const hue = t < 0.5
    ? 174 + (46 - 174) * (t / 0.5)                 // Teal → Gold
    : (46 - 76 * ((t - 0.5) / 0.5) + 360) % 360;   // Gold → Pink
  return `hsl(${hue.toFixed(0)} 85% 62%)`;
}

/**
 * Horizontale Timeline mit antippbaren Slots — als leuchtender Zeitstrahl:
 * durchscheinender Glow-Thread, Era-Farbspektrum, gestaffelt einfliegende
 * Premium-Karten und magnetische Drop-Zonen. `prefers-reduced-motion`-aware.
 */
export function TimelinePlacer({ timeline, onSelect, accent }: { timeline: Song[]; onSelect: (slot: number) => void; accent: string }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();

  const itemVar = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.92 },
    show: (i: number) => reduce
      ? { opacity: 1, transition: { delay: i * 0.03 } }
      : { opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.05, type: 'spring' as const, stiffness: 320, damping: 26 } },
  };

  let pos = 0;

  const slot = (i: number, label: string) => (
    <motion.button key={`slot-${i}`} data-testid={`ohrwurm-slot-${i}`} onClick={() => onSelect(i)}
      custom={pos++} variants={itemVar}
      whileHover={reduce ? undefined : { scale: 1.08, y: -4 }}
      whileTap={{ scale: 0.9 }}
      className="relative z-10 shrink-0 w-[60px] h-[136px] rounded-2xl flex flex-col items-center justify-center gap-2 snap-center"
      style={{
        background: `linear-gradient(180deg, ${accent}1f, ${accent}05)`,
        border: `2px dashed ${accent}`,
        backdropFilter: 'blur(2px)',
      }}>
      <motion.span className="grid place-items-center w-9 h-9 rounded-full"
        style={{ background: `${accent}26`, border: `1px solid ${accent}66` }}
        animate={reduce ? undefined : { boxShadow: [`0 0 0px ${accent}00`, `0 0 16px ${accent}cc`, `0 0 0px ${accent}00`] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
        <Plus className="w-5 h-5" style={{ color: accent }} />
      </motion.span>
      <span className="text-[12px] font-extrabold leading-tight text-center px-1" style={{ color: OW.dim }}>{label}</span>
    </motion.button>
  );

  const card = (s: Song) => {
    const c = eraColor(s.year);
    return (
      <motion.div key={s.id}
        custom={pos++} variants={itemVar}
        whileHover={reduce ? undefined : { y: -8, scale: 1.04 }}
        transition={reduce ? undefined : { type: 'spring', stiffness: 400, damping: 24 }}
        className="relative z-10 shrink-0 w-[108px] h-[136px] rounded-2xl p-3 flex flex-col justify-between overflow-hidden snap-center"
        style={{
          background: 'linear-gradient(165deg, #2b2046 0%, #1b1430 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: `0 10px 26px -14px ${c}`,
        }}>
        {/* Era-Leiste oben */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, transparent, ${c}, transparent)` }} />
        {/* weicher Era-Glow */}
        <div aria-hidden className="absolute -top-7 -right-7 w-24 h-24 rounded-full blur-2xl pointer-events-none"
          style={{ background: c, opacity: 0.2 }} />
        {/* Jahr als Neon-Text */}
        <span className="relative text-[27px] leading-none font-black tabular-nums"
          style={{ color: c, textShadow: `0 0 18px ${c}66` }}>{s.year}</span>
        {/* Titel + Interpret */}
        <div className="relative leading-tight">
          <div className="text-[12px] font-bold line-clamp-2 text-white">{s.title}</div>
          <div className="text-[13px] truncate flex items-center gap-1.5" style={{ color: OW.dim }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
            <span className="truncate">{s.artist} {s.flag}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  const items: React.ReactNode[] = [];
  items.push(slot(0, timeline.length ? t('games.ohrwurm.slotEarlier') : t('games.ohrwurm.slotHere')));
  timeline.forEach((s, i) => {
    items.push(card(s));
    const isLast = i === timeline.length - 1;
    items.push(slot(i + 1, isLast ? t('games.ohrwurm.slotLater') : t('games.ohrwurm.slotBetween')));
  });

  return (
    <div className="overflow-x-auto pb-3 no-scrollbar">
      <motion.div
        className="relative flex gap-3 items-center px-1 w-max min-w-full snap-x"
        initial="hidden" animate="show">
        {/* durchscheinender Glow-Thread (Karten decken ihn, Slots lassen ihn durchglühen) */}
        <div aria-hidden className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-[3px] rounded-full pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, #26E0C4aa 15%, #FFD23Faa 50%, #FF2E88aa 85%, transparent)' }} />
        {items}
      </motion.div>
    </div>
  );
}

/** Textuelle Zusammenfassung der Auflösung. */
export function ResolutionSummary({ resolution, active, counter, participants }: {
  resolution: RoundResolution; active: Participant; counter: PendingCounter | null; participants: Participant[];
}) {
  const { t } = useTranslation();
  const winnerName = resolution.winnerId
    ? participants.find((p) => p.id === resolution.winnerId)?.name ?? '—'
    : null;
  const counterName = counter ? participants.find((p) => p.id === counter.participantId)?.name : null;

  let headline: string;
  let tone: string;
  if (!resolution.winnerId) {
    headline = t('games.ohrwurm.resolutionMissed');
    tone = OW.primary;
  } else if (resolution.winnerId === active.id) {
    headline = counter && !resolution.activeCorrect
      ? t('games.ohrwurm.resolutionKeepsCard', { name: active.name })
      : t('games.ohrwurm.resolutionCorrect', { name: active.name });
    tone = OW.secondary;
  } else {
    headline = t('games.ohrwurm.resolutionCounterWins', { name: winnerName });
    tone = OW.secondary;
  }

  return (
    <div className="w-full max-w-sm rounded-2xl px-4 py-3 text-center" style={{ background: OW.surface }}>
      <p className="font-black" style={{ color: tone }}>{headline}</p>
      <div className="mt-1.5 flex items-center justify-center gap-3 text-xs" style={{ color: OW.dim }}>
        <span>{active.name}: {resolution.activeCorrect ? t('games.ohrwurm.correct') : t('games.ohrwurm.wrong')}</span>
        {counter && counterName && (
          <span>· {counterName}: {resolution.counterCorrect ? t('games.ohrwurm.correct') : t('games.ohrwurm.wrong')}</span>
        )}
      </div>
    </div>
  );
}
