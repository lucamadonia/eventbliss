import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { playableGames } from '@/lib/playable-games';
import { buildRoute } from '../party-map';
import { tvType } from '../tv-tokens';
import type { PartyPlaylistItem, PartyStanding } from '../party-types';

/**
 * TVPartyMap — der Abend als Brettspiel-Route.
 *
 * WICHTIG ZUM VERSTAENDNIS DER EBENEN: Die Gebaeude im Hintergrundbild sind
 * KEINE Spielfelder, sondern Landschaft — Kulisse, durch die sich die Route
 * zieht. Die Felder liegen als eigene Ebene darueber:
 *
 *   Figuren    ● ● ●          die Avatare der Gaeste, wandern die Route entlang
 *   Felder     ⬤—⬤—⬤—⬤       ein Medaillon je Spiel der Set-Liste
 *   Route      ~~~~~~~        leuchtet hinter der Gruppe aus
 *   Landschaft 🏠 🏠 🎤 🏠     festes Bild, reine Stimmung
 *
 * Der Grund fuer die Trennung: Eine Party hat zwischen 1 und 12 Spielen. Waeren
 * die Felder ins Bild gemalt, braeuchte es ein Bild je Spielzahl — und bei vier
 * Spielen stuenden acht leere Haeuser herum. Deshalb ist die Landschaft bewusst
 * leer und die Route wird gerechnet (`party-map.ts`).
 *
 * Die Medaillons benutzen das Artwork, das die Spiele ohnehin haben
 * (`playable-games.ts` → `public/images/games/{id}.webp`) — kein neues Bild je
 * Spiel noetig, und die Karte bleibt automatisch aktuell, wenn eines dazukommt.
 */

/** Der Hintergrund ist Stimmung, kein Inhalt — faellt er aus, traegt der Verlauf. */
const LAYERS = [
  { src: '/images/tv/map-far.webp', depth: 0.15, opacity: 0.85 },
  { src: '/images/tv/map-mid.webp', depth: 0.4, opacity: 1 },
  { src: '/images/tv/map-near.webp', depth: 0.75, opacity: 0.9 },
];

const ACCENT = ['#df8eff', '#ff6b98', '#f9ca24'];

function artworkFor(gameId: string): string | null {
  return playableGames.find((g) => g.id === gameId)?.image ?? null;
}

interface Props {
  playlist: PartyPlaylistItem[];
  /** 0-basierte Position des Spiels, das gerade laeuft / als naechstes kommt. */
  index: number;
  standings: PartyStanding[];
  /**
   * Feld, von dem die Gruppe losspringt. Vorgabe `index - 1`.
   * Die Zwischenstands-Szene setzt es ausdruecklich, weil dort das eben
   * beendete Spiel der Startpunkt ist — nicht das davor.
   */
  from?: number;
  /** Erst wenn true, loest der Sprung aus — die Szene gibt den Takt vor. */
  travel?: boolean;
  className?: string;
}

export default function TVPartyMap({
  playlist,
  index,
  standings,
  from: fromProp,
  travel = true,
  className,
}: Props) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();
  const route = useMemo(() => buildRoute(playlist.length), [playlist.length]);

  /**
   * Die Figuren starten auf dem VORIGEN Feld und reisen von dort — sonst
   * erschiene der Sprung als Schnitt, und genau diese Reise ist der Moment,
   * auf den der Abend hinlaeuft.
   */
  const from = Math.max(0, Math.min(fromProp ?? index - 1, playlist.length - 1));
  const progress = useMotionValue(route.tAt(from));
  const eased = useSpring(progress, { stiffness: 42, damping: 18, mass: 1.1 });
  const [arrived, setArrived] = useState(index === 0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!travel || startedRef.current) return;
    startedRef.current = true;
    if (!ambient) {
      progress.set(route.tAt(index));
      setArrived(true);
      return;
    }
    const go = window.setTimeout(() => progress.set(route.tAt(index)), 420);
    const done = window.setTimeout(() => setArrived(true), 1900);
    return () => {
      window.clearTimeout(go);
      window.clearTimeout(done);
    };
  }, [travel, ambient, index, progress, route]);

  // Position der Gruppe auf der Route — Kamera-Anker und Ort der Figuren.
  const [head, setHead] = useState(() => route.pointAt(route.tAt(from)));
  useEffect(() => eased.on('change', (v) => setHead(route.pointAt(v))), [eased, route]);

  /*
   * KEINE mitfahrende Kamera. Der erste Entwurf schob die Ansicht mit der
   * Gruppe mit — das hat die Haelfte des Abends aus dem Bild geschoben und
   * an den Raendern Luecken in die Hintergrundebenen gerissen. Die Route ist
   * jetzt auf 16:9 gerechnet und liegt komplett im Bild; auf einem Fernseher
   * ist das ohnehin richtig, weil alle den ganzen Abend sehen wollen.
   */

  // Der Pfad hinter der Gruppe leuchtet aus, der vor ihr bleibt gedaempft.
  const dash = useTransform(eased, (v) => `${Math.max(0.001, v)} 1`);

  if (playlist.length === 0) return null;

  const current = playlist[Math.min(index, playlist.length - 1)];
  const leader = standings.find((s) => s.rank === 1);

  return (
    <div className={`relative h-full w-full overflow-hidden ${className ?? ''}`}>
      {/* Grundton — traegt die Szene auch ohne die Bildebenen. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 20%, #1a0f2e 0%, #0b0716 45%, #060810 100%)',
        }}
      />

      <div className="absolute inset-0">
        {/* Landschaft in Ebenen — die Tiefe steckt im Bild, nicht in Bewegung. */}
        {LAYERS.map((layer) => (
          <div
            key={layer.src}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${layer.src})`, opacity: layer.opacity }}
            aria-hidden
          />
        ))}

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${route.width} ${route.height}`}
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <defs>
            <linearGradient id="routeLit" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={ACCENT[0]} />
              <stop offset="55%" stopColor={ACCENT[1]} />
              <stop offset="100%" stopColor={ACCENT[2]} />
            </linearGradient>
            <filter id="routeGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="16" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Der Weg, der noch vor euch liegt. */}
          <path
            d={route.d}
            fill="none"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray="2 26"
          />
          {/* Der Weg, den ihr schon gegangen seid. */}
          <motion.path
            d={route.d}
            fill="none"
            stroke="url(#routeLit)"
            strokeWidth={14}
            strokeLinecap="round"
            filter="url(#routeGlow)"
            pathLength={1}
            style={{ strokeDasharray: dash }}
          />
        </svg>

        {/* Die Felder — ein Medaillon je Spiel der Set-Liste. */}
        {route.stations.map((p, i) => {
          const item = playlist[i];
          const art = artworkFor(item.gameId);
          const done = i < index;
          const active = i === index;
          const size = active ? 190 : 148;
          return (
            <div
              key={`${item.gameId}-${i}`}
              className="absolute"
              style={{
                left: `${(p.x / route.width) * 100}%`,
                top: `${(p.y / route.height) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <motion.div
                className="relative overflow-hidden rounded-full"
                style={{
                  width: size,
                  height: size,
                  border: `3px solid ${active ? ACCENT[0] : 'rgba(255,255,255,0.14)'}`,
                  boxShadow: active
                    ? `0 0 0 6px rgba(223,142,255,0.18), 0 0 60px -6px ${ACCENT[0]}`
                    : '0 12px 40px -18px rgba(0,0,0,0.9)',
                  filter: done ? 'grayscale(0.8) brightness(0.55)' : undefined,
                }}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{
                  scale: active && arrived && ambient ? [1, 1.06, 1] : 1,
                  opacity: 1,
                }}
                transition={
                  active && arrived && ambient
                    ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
                    : { type: 'spring', stiffness: 220, damping: 22, delay: i * 0.05 }
                }
              >
                {art ? (
                  <img src={art} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-[#16101f]" />
                )}
                {/* Kommende Felder bleiben angedeutet — die Vorfreude gehoert dazu. */}
                {!done && !active && <div className="absolute inset-0 bg-[#060810]/55" />}
                {done && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#060810]/45">
                    <Check className="h-10 w-10 text-white/85" strokeWidth={3} />
                  </div>
                )}
              </motion.div>

              <div
                className="mt-2 text-center font-black uppercase tracking-wide"
                style={{
                  fontSize: tvType.micro,
                  color: active ? '#ffffff' : 'rgba(255,255,255,0.45)',
                  maxWidth: size + 60,
                }}
              >
                {item.name}
              </div>
            </div>
          );
        })}

        {/* Die Gruppe auf dem Weg. */}
        <div
          className="absolute z-20"
          style={{
            left: `${(head.x / route.width) * 100}%`,
            // Etwas ueber der Linie: sonst stehen die Figuren mitten im
            // Medaillon des aktiven Feldes und sind nicht zu sehen.
            top: `calc(${(head.y / route.height) * 100}% - 5.5rem)`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="flex items-center -space-x-3">
            {standings.slice(0, 6).map((s, i) => (
              <motion.div
                key={s.id}
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 62,
                  height: 62,
                  background: '#0d0915',
                  border: `3px solid ${s.color}`,
                  boxShadow: `0 0 26px -4px ${s.color}`,
                  fontSize: 30,
                  zIndex: 10 - i,
                  // Die Fuehrung laeuft ein Stueck voraus.
                  marginTop: s.rank === 1 ? -14 : 0,
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: i * 0.06 }}
              >
                {s.avatar || s.name.charAt(0)}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Was als Naechstes dran ist. */}
      {/* Abdunkelung unter der Schrift — ohne sie steht "Als Naechstes" mitten
          auf einem Feld der unteren Reihe und ist kaum zu lesen. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%]"
        style={{ background: 'linear-gradient(to top, #060810 12%, rgba(6,8,16,0.85) 45%, transparent 100%)' }}
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 z-30 p-[clamp(1.25rem,2.4vw,3rem)]">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: arrived ? 0 : 30, opacity: arrived ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          className="text-center"
        >
          <div
            className="font-black uppercase tracking-[0.3em]"
            style={{ fontSize: tvType.micro, color: '#b3a8c9' }}
          >
            {t('tv.partyNight.upNext')}
          </div>
          <div className="font-black text-white" style={{ fontSize: tvType.title }}>
            {current?.name}
          </div>
          {leader && (
            <div style={{ fontSize: tvType.label, color: leader.color }}>
              {t('tv.partyNight.leaderLine', { name: leader.name, points: leader.points })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
