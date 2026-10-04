import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Maximize, Plus, Smartphone, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PARTY_TRANSITIONS, partyEase, type PartySound } from '@/lib/party-motion';
import { pushPartyTrace, wallClockNow } from '@/games/party/party-trace';
import TVLobbyJoinPanel from './components/TVLobbyJoinPanel';
import TVLobbyPlayerCard, { type LobbyCardSize } from './components/TVLobbyPlayerCard';
import TVLobbyFooter from './components/TVLobbyFooter';
import TVLobbyNotice from './components/TVLobbyNotice';
import TVLobbySetlist from './components/TVLobbySetlist';
import type { PartyPlaylistItem } from './party-types';
import { LOBBY_ACCENTS, lu } from './components/tv-lobby-scale';
import { diffLobbyPlayers, isActiveLobbyPlayer, type TVLobbyState } from './tv-lobby-state';

/*
 * Langsame Farbflecken. Bewusst OHNE `filter: blur` und nur mit `transform`
 * animiert: Der Verlauf ist schon weich, und Smart-TV-GPUs (Tizen, webOS,
 * Fire TV) brechen bei animierten Weichzeichnern ein.
 */
function FloatingOrbs({ reduced }: { reduced: boolean }) {
  const orbs = [
    { x: '4%', y: '8%', size: 60, color: '223,142,255', duration: 24 },
    { x: '62%', y: '48%', size: 70, color: '255,107,152', duration: 28 },
    { x: '38%', y: '70%', size: 54, color: '143,245,255', duration: 26 },
  ];
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ left: orb.x, top: orb.y, width: `${orb.size}vh`, height: `${orb.size}vh`, background: `radial-gradient(circle, rgba(${orb.color},0.10) 0%, rgba(${orb.color},0.04) 40%, transparent 70%)` }}
          animate={reduced ? undefined : { x: [0, 60, -40, 0], y: [0, -40, 30, 0] }}
          transition={{ duration: orb.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/** Spalten und Kartengroesse so, dass 2–12 Karten nie ueberlaufen. */
function gridFor(count: number): { cols: number; size: LobbyCardSize; rowMax: string } {
  if (count <= 3) return { cols: 3, size: 'lg', rowMax: lu(42) };
  if (count <= 4) return { cols: 2, size: 'lg', rowMax: lu(32) };
  if (count <= 6) return { cols: 3, size: 'md', rowMax: lu(29) };
  if (count <= 9) return { cols: 3, size: 'sm', rowMax: '1fr' };
  if (count <= 12) return { cols: 4, size: 'sm', rowMax: '1fr' };
  return { cols: 5, size: 'sm', rowMax: '1fr' };
}

const TOAST_MS = 4500;
/** Treten drei gleichzeitig bei, klingt es einmal — nicht dreimal. */
const SOUND_THROTTLE_MS = 400;

type Toast = { id: string; kind: 'left' | 'joined'; text: string };

export default function TVLobby({ lobby, notice = null, isConnected, error, onSound, setlist = null }: {
  lobby: TVLobbyState;
  /** Die Set-Liste des Abends („Heute spielen wir“) — nur in einer Party mit Plan. */
  setlist?: PartyPlaylistItem[] | null;
  /** Kein Wartebereich bekannt: Gastgeber noch nicht verbunden, oder die Party ist vorbei. */
  notice?: 'waiting-host' | 'ended' | null;
  isConnected: boolean;
  error?: string | null;
  /** Ton zum Ereignis — der Ton gehoert dem TVScreen (Audiofreigabe). */
  onSound?: (sound: PartySound) => void;
}) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const { players } = lobby;

  // Messpunkt fuer die Timing-Tests: Wann wird der Wartebereich sichtbar?
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const now = wallClockNow();
      pushPartyTrace({ kind: 'scene', scene: 'lobby', sceneId: `lobby:${lobby.code}`, device: 'tv', startsAt: now, shownAt: now, localNow: Date.now(), offsetMs: 0, late: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [lobby.code]);

  // ── Ereignisse aus dem Vergleich zweier Zustaende ──
  const prevPlayersRef = useRef<typeof players | null>(null);
  const soundRef = useRef(onSound);
  soundRef.current = onSound;
  const lastSoundAtRef = useRef(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const prev = prevPlayersRef.current;
    prevPlayersRef.current = players;
    // Der erste Zustand ist kein Beitritt — ein frisch geladener Fernseher
    // soll nicht fuer jeden schon Anwesenden klingeln.
    if (!prev) return;
    const diff = diffLobbyPlayers(prev, players);
    const sound: PartySound = diff.joined.length > 0 ? PARTY_TRANSITIONS.T01.tv.sound
      : diff.seatClaimed.length > 0 ? PARTY_TRANSITIONS.T02.tv.sound
        : diff.becameReady.length > 0 ? PARTY_TRANSITIONS.T04.tv.sound
          : 'none';
    const now = Date.now();
    if (sound !== 'none' && now - lastSoundAtRef.current >= SOUND_THROTTLE_MS) {
      lastSoundAtRef.current = now;
      soundRef.current?.(sound);
    }
    const added: Toast[] = [
      ...diff.joined.map((p) => ({ id: `j:${p.id}:${now}`, kind: 'joined' as const, text: t('tvLobby.playerJoined', '{{name}} ist dabei', { name: p.name }) })),
      // Taktvoll: nie "wurde entfernt" — fuer alle anderen ist es dasselbe.
      ...diff.left.map((p) => ({ id: `l:${p.id}:${now}`, kind: 'left' as const, text: t('tvLobby.playerLeft', '{{name}} hat die Party verlassen', { name: p.name }) })),
    ];
    if (added.length > 0) setToasts((current) => [...current, ...added].slice(-2));
  }, [players, t]);
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = window.setTimeout(() => setToasts((current) => current.slice(1)), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  const activeCount = useMemo(() => players.filter(isActiveLobbyPlayer).length, [players]);
  const guests = useMemo(() => players.filter((p) => p.seat === 'host-device' && !p.isHost), [players]);
  // Leere Plaetze laden ein, statt kaputt zu wirken — nur wenn man beitreten kann.
  const ghostSlots = lobby.joinUrl ? Math.max(0, 3 - players.length) : 0;
  const cells = players.length + ghostSlots;
  const { cols, size, rowMax } = gridFor(cells);
  const rows = Math.max(1, Math.ceil(cells / cols));

  const guestHint = lobby.joinUrl && guests.length > 0
    ? (guests.length === 1
      ? t('tvLobby.guestHintOne', '{{names}}: Hast du ein Handy? Scann dich rein.', { names: guests[0].name })
      : t('tvLobby.guestHint', '{{names}}: Habt ihr ein Handy? Scannt euch rein.', {
        names: guests.length > 3 ? `${guests.slice(0, 3).map((g) => g.name).join(', ')} …` : guests.map((g) => g.name).join(', '),
      }))
    : null;

  const dotColor = isConnected ? LOBBY_ACCENTS.cyan : '#ff6e84';

  return (
    <motion.div
      data-testid="tv-lobby"
      data-mode={lobby.mode}
      data-player-count={players.length}
      className="relative grid h-screen w-full overflow-hidden"
      // 5 % Sicherheitsrand rundum: viele Fernseher schneiden den Rand ab (Overscan).
      style={{ backgroundColor: '#060810', gridTemplateRows: 'auto minmax(0,1fr) auto', paddingBlock: '5vh', paddingInline: '5vw', rowGap: lu(2.2) }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <FloatingOrbs reduced={reduced} />

      {/* ── Kopfzeile ── */}
      <header className="relative z-10 flex items-center justify-between" style={{ gap: lu(2) }}>
        <div className="flex min-w-0 items-center rounded-full border border-white/[0.07] bg-white/[0.04]" style={{ gap: lu(1.2), paddingBlock: lu(0.9), paddingInline: lu(1.8) }}>
          {/* Ruhig, solange alles gut ist — Pulsieren hiesse "da passiert etwas". */}
          <span
            className={`shrink-0 rounded-full ${isConnected ? '' : 'animate-pulse'}`}
            style={{ width: lu(1.3), height: lu(1.3), background: dotColor, boxShadow: `0 0 12px ${dotColor}` }}
          />
          <span className="truncate font-bold tracking-wider text-white/75" style={{ fontSize: lu(2) }}>
            {isConnected ? t('tv.connected') : error ? t('tv.error') : t('tv.connecting')}
          </span>
          {error && <span className="truncate font-bold text-[#ff6e84]" style={{ fontSize: lu(2) }}>{error}</span>}
        </div>
        <div className="flex items-center" style={{ gap: lu(1.6) }}>
          {lobby.gamesPlanned > 0 && (
            <span className="font-bold text-white/75" style={{ fontSize: lu(2.1) }}>
              {t('tvLobby.gamesPlanned', { count: lobby.gamesPlanned, defaultValue_one: 'Party-Abend · 1 Spiel', defaultValue_other: 'Party-Abend · {{count}} Spiele' })}
            </span>
          )}
          <button
            onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.04] text-white/60 transition-colors hover:text-white"
            style={{ padding: lu(1.2) }}
            aria-label={t('tvLobby.fullscreen', 'Vollbild')}
          >
            <Maximize style={{ width: lu(2.4), height: lu(2.4) }} />
          </button>
        </div>
      </header>

      {/* ── Hauptbereich: QR | Spieler ── */}
      {notice ? (
        <main className="relative z-10 grid min-h-0 place-items-center">
          <TVLobbyNotice kind={notice} code={lobby.code} />
        </main>
      ) : (
      <main className="relative z-10 grid min-h-0" style={{ gridTemplateColumns: setlist?.length ? `auto minmax(0,1fr) ${lu(48)}` : 'auto minmax(0,1fr)', columnGap: setlist?.length ? lu(4) : lu(6) }}>
        <TVLobbyJoinPanel joinUrl={lobby.joinUrl} code={lobby.code} />

        <section className="flex min-h-0 flex-col" style={{ gap: lu(1.6) }}>
          <div className="flex items-center" style={{ gap: lu(1.4) }}>
            <Users className="text-[#df8eff]" style={{ width: lu(2.8), height: lu(2.8) }} />
            <h3 className="font-black text-white/85" style={{ fontSize: lu(2.8) }}>
              {t('tvLobby.playersHeading', 'Dabei')}
            </h3>
            {/* Die Zahl gleitet weiter, statt neu aufzuploppen. */}
            <span data-testid="tv-lobby-count" className="relative inline-flex overflow-hidden font-black tabular-nums text-[#8ff5ff]" style={{ fontSize: lu(3.4), height: '1.15em', lineHeight: '1.15em' }}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={activeCount}
                  className="block"
                  initial={reduced ? { opacity: 0 } : { y: '100%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { y: '-100%', opacity: 0 }}
                  transition={{ duration: 0.28, ease: partyEase.out }}
                >
                  {activeCount}
                </motion.span>
              </AnimatePresence>
            </span>
          </div>

          {guestHint && (
            <motion.p
              data-testid="tv-lobby-guest-hint"
              className="rounded-2xl font-semibold text-white/90"
              style={{ fontSize: lu(2.1), paddingBlock: lu(1), paddingInline: lu(1.8), background: 'linear-gradient(90deg, rgba(223,142,255,0.16), rgba(143,245,255,0.06))', boxShadow: 'inset 0 0 0 1px rgba(223,142,255,0.25)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Smartphone aria-hidden strokeWidth={2.5} className="me-[0.5em] inline-block align-[-0.15em] text-[#df8eff]" style={{ width: '1.1em', height: '1.1em' }} />
              {guestHint}
            </motion.p>
          )}

          <motion.div
            layout={!reduced}
            className="grid min-h-0 flex-1"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0,${rowMax}))`, alignContent: 'center', gap: lu(1.6) }}
          >
            <AnimatePresence mode="popLayout">
              {players.map((p, i) => <TVLobbyPlayerCard key={p.id} player={p} size={size} index={i} showSeat={lobby.mode !== 'local-party'} />)}
            </AnimatePresence>
            {Array.from({ length: ghostSlots }).map((_, i) => (
              <motion.div
                key={`ghost-${i}`}
                layout={!reduced}
                className="flex flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-white/20"
                animate={reduced ? undefined : { opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
              >
                <Plus aria-hidden strokeWidth={2.5} className="text-white/30" style={{ width: lu(3.2), height: lu(3.2), marginBlockEnd: lu(0.8) }} />
                <span className="font-semibold text-white/45" style={{ fontSize: lu(2.3) }}>
                  {t('tvLobby.yourSeat', 'Dein Platz')}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </section>
        {setlist?.length ? <TVLobbySetlist playlist={setlist} players={activeCount} /> : null}
      </main>
      )}

      {notice ? <span /> : <TVLobbyFooter lobby={lobby} />}

      {/* ── Hinweise (Beitritte, Abgaenge): unten mittig ueber der Fusszeile — dort liegt nichts, was man gerade lesen muss ── */}
      <div className="pointer-events-none absolute inset-x-0 z-20 flex justify-center" style={{ insetBlockEnd: `calc(5vh + ${lu(10)})`, gap: lu(1.2), paddingInline: '5vw' }} aria-live="polite">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              data-testid="tv-toast"
              data-kind={toast.kind}
              layout={!reduced}
              className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-white/10 bg-[#151a21]/95 font-bold text-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]"
              style={{ fontSize: lu(2.2), paddingBlock: lu(1.1), paddingInline: lu(2.6), maxWidth: '100%' }}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduced ? 0 : 16, transition: { duration: 0.26, ease: partyEase.exit } }}
              transition={{ duration: 0.4, ease: partyEase.out }}
            >
              {toast.kind === 'left' ? '👋' : '✨'} {toast.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
