import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Check, ChevronRight, Trophy, Target, Clock } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { haversineKm } from '../engine/haversine';
import type { GeoLocation } from './geo-locations';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MapPhase = 'showing' | 'guessing' | 'handoff' | 'result';

interface PlayerGuess {
  playerId: string;
  playerName: string;
  playerColor: string;
  lat: number;
  lng: number;
  distanceKm: number;
}

interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
  score: number;
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
  fastestMs: number;
}

export interface MapRoundResult {
  playerId: string;
  distanceKm: number;
}

interface MapRoundProps {
  location: GeoLocation;
  players: Player[];
  roundNumber: number;
  totalRounds: number;
  timerSeconds: number;
  onRoundComplete: (results: MapRoundResult[]) => void;
  onExit: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString('de-DE')} km`;
}

function createPlayerIcon(color: string, initial: string): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${color};border:3px solid white;
      display:flex;align-items:center;justify-content:center;
      font-weight:800;font-size:14px;color:white;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
      font-family:'Plus Jakarta Sans',system-ui,sans-serif;
    ">${initial}</div>`,
  });
}

function createTargetIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:linear-gradient(135deg,#fbbf24,#f59e0b);
      border:3px solid white;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 0 16px rgba(251,191,36,0.6),0 2px 8px rgba(0,0,0,0.3);
      animation:pulse-gold 1.5s ease-in-out infinite;
    "><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MapRound({
  location,
  players,
  roundNumber,
  totalRounds,
  timerSeconds,
  onRoundComplete,
  onExit,
}: MapRoundProps) {
  const [phase, setPhase] = useState<MapPhase>('showing');
  const [guessingPlayerIdx, setGuessingPlayerIdx] = useState(0);
  const [guesses, setGuesses] = useState<PlayerGuess[]>([]);
  const [pinLat, setPinLat] = useState<number | null>(null);
  const [pinLng, setPinLng] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(timerSeconds);
  const [allDoneGuesses, setAllDoneGuesses] = useState<PlayerGuess[]>([]);

  // Separate refs for guessing and result map containers
  const guessMapContainerRef = useRef<HTMLDivElement>(null);
  const resultMapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Refs to track latest pin values (avoids stale closure in confirmGuess)
  const pinLatRef = useRef<number | null>(null);
  const pinLngRef = useRef<number | null>(null);

  const currentPlayer = players[guessingPlayerIdx % players.length];

  // Keep refs in sync with state
  useEffect(() => { pinLatRef.current = pinLat; }, [pinLat]);
  useEffect(() => { pinLngRef.current = pinLng; }, [pinLng]);

  // --- Showing phase auto-advance ---
  useEffect(() => {
    if (phase !== 'showing') return;
    const t = setTimeout(() => {
      setPhase('guessing');
      setCountdown(timerSeconds);
    }, 2500);
    return () => clearTimeout(t);
  }, [phase, timerSeconds]);

  // --- Guessing countdown ---
  useEffect(() => {
    if (phase !== 'guessing') return;
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          confirmGuess();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, guessingPlayerIdx]);

  // --- Initialize Leaflet map for guessing phase ---
  useEffect(() => {
    if (phase !== 'guessing' || !guessMapContainerRef.current) return;

    // Destroy previous map instance
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Double requestAnimationFrame to ensure DOM has fully rendered
    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled || !guessMapContainerRef.current) return;

        const map = L.map(guessMapContainerRef.current, {
          center: [20, 10],
          zoom: 2,
          zoomControl: false,
          attributionControl: false,
          maxBoundsViscosity: 1.0,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 18,
          subdomains: 'abcd',
        }).addTo(map);

        L.control.attribution({ position: 'bottomright', prefix: false })
          .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" style="color:#666">OSM</a>')
          .addTo(map);

        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          setPinLat(lat);
          setPinLng(lng);

          if (pinMarkerRef.current) {
            pinMarkerRef.current.setLatLng([lat, lng]);
          } else {
            const icon = createPlayerIcon(currentPlayer.color, currentPlayer.name.charAt(0).toUpperCase());
            pinMarkerRef.current = L.marker([lat, lng], { icon }).addTo(map);
          }
        });

        mapRef.current = map;

        // Force resize after mount to fix display
        setTimeout(() => map.invalidateSize(), 200);
      });
    });

    return () => {
      cancelled = true;
      pinMarkerRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [phase, guessingPlayerIdx]);

  // --- Initialize result map when phase transitions to result ---
  useEffect(() => {
    if (phase !== 'result' || allDoneGuesses.length === 0) return;

    // Wait for DOM to render
    let cancelled = false;
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled || !resultMapContainerRef.current) return;

          // Destroy previous map
          if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
          }

          const map = L.map(resultMapContainerRef.current, {
            center: [location.lat, location.lng],
            zoom: 4,
            zoomControl: false,
            attributionControl: false,
          });

          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 18,
            subdomains: 'abcd',
          }).addTo(map);

          // Target marker
          const targetIcon = createTargetIcon();
          L.marker([location.lat, location.lng], { icon: targetIcon }).addTo(map);

          // Player markers + lines
          const bounds = L.latLngBounds([[location.lat, location.lng]]);
          allDoneGuesses.forEach(g => {
            const icon = createPlayerIcon(g.playerColor, g.playerName.charAt(0).toUpperCase());
            L.marker([g.lat, g.lng], { icon }).addTo(map);

            L.polyline(
              [[g.lat, g.lng], [location.lat, location.lng]],
              { color: g.playerColor, weight: 2, dashArray: '8 6', opacity: 0.7 },
            ).addTo(map);

            bounds.extend([g.lat, g.lng]);
          });

          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
          mapRef.current = map;
          setTimeout(() => map.invalidateSize(), 200);
        });
      });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [phase, allDoneGuesses, location]);

  // --- Confirm guess (uses refs to avoid stale closure) ---
  const confirmGuess = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const lat = pinLatRef.current;
    const lng = pinLngRef.current;
    const guessLat = lat ?? 0;
    const guessLng = lng ?? 0;
    const distanceKm = (lat !== null && lng !== null)
      ? haversineKm(guessLat, guessLng, location.lat, location.lng)
      : 20000; // max penalty if no pin placed

    const guess: PlayerGuess = {
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      playerColor: currentPlayer.color,
      lat: guessLat,
      lng: guessLng,
      distanceKm,
    };

    const updatedGuesses = [...guesses, guess];
    setGuesses(updatedGuesses);

    // Reset pin state for next player
    setPinLat(null);
    setPinLng(null);
    pinMarkerRef.current = null;

    const nextIdx = guessingPlayerIdx + 1;
    if (nextIdx >= players.length) {
      // All players done -- store guesses, then transition to result
      setAllDoneGuesses(updatedGuesses);
      setPhase('result');
    } else {
      setGuessingPlayerIdx(nextIdx);
      setPhase('handoff');
    }
  }, [location, currentPlayer, guesses, guessingPlayerIdx, players.length]);

  // --- Handoff -> next guess ---
  const handleHandoffReady = () => {
    setPhase('guessing');
    setCountdown(timerSeconds);
  };

  // --- Finish round ---
  const handleNextRound = () => {
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    onRoundComplete(guesses.map(g => ({ playerId: g.playerId, distanceKm: g.distanceKm })));
  };

  // --- Sorted results ---
  const sortedGuesses = [...guesses].sort((a, b) => a.distanceKm - b.distanceKm);
  const winner = sortedGuesses[0];

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="min-h-screen bg-[#0d0d15] relative overflow-hidden flex flex-col">
      {/* Background auras */}
      <div className="pointer-events-none absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#00e3fd]/[0.06] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#cf96ff]/[0.05] blur-[120px]" />

      {/* Inject pulse animation */}
      <style>{`@keyframes pulse-gold { 0%,100% { box-shadow:0 0 16px rgba(251,191,36,0.6),0 2px 8px rgba(0,0,0,0.3); } 50% { box-shadow:0 0 28px rgba(251,191,36,0.9),0 2px 12px rgba(0,0,0,0.4); } }`}</style>

      {/* Header */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-4 pt-6 flex items-center justify-between">
        <button onClick={onExit} className="text-white/40 hover:text-white/70 text-sm transition-colors">
          ✕ Beenden
        </button>
        <div className="px-3 py-1 rounded-full bg-[#1f1f29] border border-white/[0.06]">
          <span className="text-white/60 text-xs font-medium">RUNDE {roundNumber}/{totalRounds}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* -- SHOWING PHASE -- */}
        {phase === 'showing' && (
          <motion.div
            key="showing"
            className="flex-1 flex flex-col items-center justify-center px-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#00e3fd] to-[#cf96ff] flex items-center justify-center shadow-lg mb-6"
              animate={{ rotate: [0, -3, 3, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            >
              <MapPin className="w-10 h-10 text-white" />
            </motion.div>
            <p className="text-white/50 text-sm mb-2">Wo liegt...</p>
            <h1
              className="text-4xl font-black text-center bg-clip-text text-transparent bg-gradient-to-r from-[#cf96ff] to-[#00e3fd]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {location.name}
            </h1>
            <p className="text-white/30 text-xs mt-3 uppercase tracking-wider">
              {location.type === 'country' ? 'Land' : 'Stadt'}
            </p>
          </motion.div>
        )}

        {/* -- GUESSING PHASE -- */}
        {phase === 'guessing' && (
          <motion.div
            key={`guessing-${guessingPlayerIdx}`}
            className="flex-1 flex flex-col relative z-10 w-full max-w-lg mx-auto px-4 pt-4"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            {/* Player + Location info */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: currentPlayer.color }}
                >
                  {currentPlayer.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-white font-semibold text-sm">{currentPlayer.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#cf96ff]" />
                <span className="text-[#cf96ff] font-bold text-sm">{location.name}</span>
              </div>
            </div>

            {/* Timer bar */}
            <div className="h-1.5 w-full rounded-full bg-[#1f1f29] overflow-hidden mb-3">
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${(countdown / timerSeconds) * 100}%`,
                  background: countdown <= 5
                    ? 'linear-gradient(90deg, #ef4444, #f97316)'
                    : 'linear-gradient(90deg, #00e3fd, #cf96ff)',
                }}
              />
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/30 text-xs">Tippe auf die Karte um die Stecknadel zu setzen</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-white/40" />
                <span className={`text-xs font-bold tabular-nums ${countdown <= 5 ? 'text-red-400' : 'text-white/50'}`}>
                  {countdown}s
                </span>
              </div>
            </div>

            {/* Map container -- explicit pixel height for Leaflet */}
            <div
              ref={guessMapContainerRef}
              className="rounded-2xl border border-white/[0.06] overflow-hidden"
              style={{ background: '#13131b', height: '400px', width: '100%' }}
            />

            {/* Confirm button */}
            <div className="py-4">
              <motion.button
                onClick={confirmGuess}
                disabled={pinLat === null}
                className="w-full h-14 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: pinLat !== null
                    ? 'linear-gradient(135deg, #00e3fd 0%, #cf96ff 100%)'
                    : '#1f1f29',
                  boxShadow: pinLat !== null
                    ? '0 8px 32px rgba(0,227,253,0.2), 0 2px 8px rgba(207,150,255,0.15)'
                    : 'none',
                }}
                whileTap={pinLat !== null ? { scale: 0.97 } : undefined}
              >
                <Check className="w-5 h-5" />
                FERTIG
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* -- HANDOFF PHASE -- */}
        {phase === 'handoff' && (
          <motion.div
            key="handoff"
            className="flex-1 flex flex-col items-center justify-center px-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4"
              style={{ background: players[(guessingPlayerIdx) % players.length].color }}
            >
              {players[(guessingPlayerIdx) % players.length].name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-white text-xl font-bold mb-2">
              Gib das Geraet an
            </h2>
            <p className="text-[#cf96ff] text-2xl font-black mb-8">
              {players[(guessingPlayerIdx) % players.length].name}
            </p>
            <motion.button
              onClick={handleHandoffReady}
              className="h-14 px-10 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #cf96ff 0%, #ff7350 100%)',
                boxShadow: '0 8px 32px rgba(207,150,255,0.25)',
              }}
              whileTap={{ scale: 0.97 }}
            >
              <ChevronRight className="w-5 h-5" />
              BEREIT
            </motion.button>
          </motion.div>
        )}

        {/* -- RESULT PHASE -- */}
        {phase === 'result' && (
          <motion.div
            key="result"
            className="flex-1 flex flex-col relative z-10 w-full max-w-lg mx-auto px-4 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Winner badge */}
            {winner && (
              <motion.div
                className="text-center mb-3"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1f1f29] border border-[#fbbf24]/30">
                  <Trophy className="w-4 h-4 text-[#fbbf24]" />
                  <span className="text-white text-sm font-bold">{winner.playerName}</span>
                  <span className="text-white/40 text-xs">gewinnt mit {formatDistance(winner.distanceKm)}</span>
                </div>
              </motion.div>
            )}

            {/* Result map -- explicit pixel height, always-assigned ref */}
            <div
              ref={resultMapContainerRef}
              className="rounded-2xl border border-white/[0.06] overflow-hidden mb-3"
              style={{ background: '#13131b', height: '300px', width: '100%' }}
            />

            {/* Distance leaderboard */}
            <div className="bg-[#1f1f29] rounded-2xl p-4 border border-white/[0.06] mb-3">
              {sortedGuesses.map((g, i) => (
                <motion.div
                  key={g.playerId}
                  className="flex items-center gap-3 py-2"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <span className={`text-sm font-bold w-6 text-center ${i === 0 ? 'text-[#fbbf24]' : 'text-white/40'}`}>
                    {i === 0 ? '\uD83C\uDFC6' : `${i + 1}.`}
                  </span>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: g.playerColor }}
                  >
                    {g.playerName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white text-sm font-medium flex-1">{g.playerName}</span>
                  <span className={`text-sm font-bold tabular-nums ${i === 0 ? 'text-[#00e3fd]' : 'text-white/50'}`}>
                    {formatDistance(g.distanceKm)}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Next round button */}
            <div className="pb-4">
              <motion.button
                onClick={handleNextRound}
                className="w-full h-14 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #cf96ff 0%, #00e3fd 100%)',
                  boxShadow: '0 8px 32px rgba(207,150,255,0.2)',
                }}
                whileTap={{ scale: 0.97 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <ChevronRight className="w-5 h-5" />
                {roundNumber >= totalRounds ? 'ERGEBNISSE' : 'NAECHSTE RUNDE'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
