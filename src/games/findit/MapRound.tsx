import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Check, ChevronRight, Trophy, Timer, Share2, Crosshair } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { haversineKm } from '../engine/haversine';
import type { GeoLocation } from './geo-locations';

type MapPhase = 'showing' | 'guessing' | 'handoff' | 'result';
interface PlayerGuess { playerId: string; playerName: string; playerColor: string; lat: number; lng: number; distanceKm: number; }
interface Player { id: string; name: string; color: string; avatar: string; score: number; correct: number; wrong: number; streak: number; bestStreak: number; fastestMs: number; }
export interface MapRoundResult { playerId: string; distanceKm: number; }
interface MapRoundProps { location: GeoLocation; players: Player[]; roundNumber: number; totalRounds: number; timerSeconds: number; onRoundComplete: (results: MapRoundResult[]) => void; onExit: () => void; }

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString('de-DE')} km`;
}

function playerIcon(color: string, initial: string): L.DivIcon {
  return L.divIcon({ className: '', iconSize: [32, 32], iconAnchor: [16, 32],
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:white;box-shadow:0 0 15px ${color}88;font-family:system-ui">${initial}</div>`,
  });
}

function targetIcon(): L.DivIcon {
  return L.divIcon({ className: '', iconSize: [36, 36], iconAnchor: [18, 36],
    html: `<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#8ff5ff,#00deec);border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 0 15px #8ff5ff;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  });
}

// Sub-component: handles click events on the map
function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

// Sub-component: auto-fit bounds when result guesses change
function FitBounds({ guesses, location }: { guesses: PlayerGuess[]; location: GeoLocation }) {
  const map = useMap();
  useEffect(() => {
    if (guesses.length === 0) return;
    const bounds = L.latLngBounds([[location.lat, location.lng]]);
    guesses.forEach(g => bounds.extend([g.lat, g.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
  }, [guesses, location, map]);
  return null;
}

const CSS = `.text-glow-primary{text-shadow:0 0 20px rgba(223,142,255,0.5)}.text-glow-cyan{text-shadow:0 0 20px rgba(143,245,255,0.5)}.glass-panel{background:rgba(21,26,33,0.4);backdrop-filter:blur(20px)}.leaflet-container{background:#0a0e14!important}.leaflet-control-attribution{font-size:9px!important;background:transparent!important;color:#666!important}`;

export default function MapRound({ location, players, roundNumber, totalRounds, timerSeconds, onRoundComplete, onExit }: MapRoundProps) {
  const [phase, setPhase] = useState<MapPhase>('showing');
  const [guessingPlayerIdx, setGuessingPlayerIdx] = useState(0);
  const [guesses, setGuesses] = useState<PlayerGuess[]>([]);
  const [pinPos, setPinPos] = useState<[number, number] | null>(null);
  const [countdown, setCountdown] = useState(timerSeconds);
  const [allDoneGuesses, setAllDoneGuesses] = useState<PlayerGuess[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pinPosRef = useRef<[number, number] | null>(null);
  const currentPlayer = players[guessingPlayerIdx % players.length];

  useEffect(() => { pinPosRef.current = pinPos; }, [pinPos]);

  // Showing → Guessing auto-transition
  useEffect(() => {
    if (phase !== 'showing') return;
    const t = setTimeout(() => { setPhase('guessing'); setCountdown(timerSeconds); }, 2500);
    return () => clearTimeout(t);
  }, [phase, timerSeconds]);

  // Countdown
  useEffect(() => {
    if (phase !== 'guessing') return;
    timerRef.current = setInterval(() => {
      setCountdown(prev => { if (prev <= 1) { clearInterval(timerRef.current!); confirmGuess(); return 0; } return prev - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, guessingPlayerIdx]);

  const confirmGuess = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const pos = pinPosRef.current;
    const lat = pos?.[0] ?? 0, lng = pos?.[1] ?? 0;
    const distanceKm = pos ? haversineKm(lat, lng, location.lat, location.lng) : 20000;
    const guess: PlayerGuess = { playerId: currentPlayer.id, playerName: currentPlayer.name, playerColor: currentPlayer.color, lat, lng, distanceKm };
    const updated = [...guesses, guess];
    setGuesses(updated);
    setPinPos(null);
    if (guessingPlayerIdx + 1 >= players.length) { setAllDoneGuesses(updated); setPhase('result'); }
    else { setGuessingPlayerIdx(guessingPlayerIdx + 1); setPhase('handoff'); }
  }, [location, currentPlayer, guesses, guessingPlayerIdx, players.length]);

  const handleHandoffReady = () => { setPhase('guessing'); setCountdown(timerSeconds); };
  const handleNextRound = () => { onRoundComplete(guesses.map(g => ({ playerId: g.playerId, distanceKm: g.distanceKm }))); };
  const sortedGuesses = [...allDoneGuesses].sort((a, b) => a.distanceKm - b.distanceKm);
  const winner = sortedGuesses[0];
  const handoffPlayer = players[(guessingPlayerIdx) % players.length];

  return (
    <div className="fixed inset-0 bg-[#0a0e14] overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', system-ui" }}>
      <style>{CSS}</style>

      {/* SHOWING */}
      {phase === 'showing' && (
        <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute top-6 right-6 px-3 py-1.5 rounded-full bg-[#151a21]/60 border border-white/5">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#a8abb3] font-bold">Runde {roundNumber}/{totalRounds}</span>
          </div>
          <button onClick={onExit} className="absolute top-6 left-6 text-[#a8abb3]/60 hover:text-[#a8abb3] text-sm">Beenden</button>
          <motion.div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#df8eff] to-[#8ff5ff] flex items-center justify-center mb-8"
            animate={{ rotate: [0, -3, 3, -3, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}>
            <MapPin className="w-10 h-10 text-white" />
          </motion.div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#a8abb3] font-bold mb-3">Aktuelle Mission</p>
          <h1 className="text-5xl font-black italic tracking-tighter text-[#df8eff] text-glow-primary uppercase text-center">{location.name}</h1>
          <div className="mt-4 px-4 py-1.5 rounded-full bg-[#ff6b98]/10 border border-[#ff6b98]/20">
            <span className="text-[11px] uppercase tracking-[0.15em] text-[#ff6b98] font-bold">{location.type === 'country' ? 'Land' : 'Stadt'}</span>
          </div>
        </motion.div>
      )}

      {/* GUESSING — react-leaflet MapContainer */}
      {phase === 'guessing' && (
        <div className="absolute inset-0">
          <MapContainer center={[20, 10]} zoom={2} zoomControl={false} attributionControl={false}
            style={{ height: '100%', width: '100%', background: '#0a0e14' }}>
            <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
            <ClickHandler onMapClick={(lat, lng) => setPinPos([lat, lng])} />
            {pinPos && <Marker position={pinPos} icon={playerIcon(currentPlayer.color, currentPlayer.name.charAt(0).toUpperCase())} />}
          </MapContainer>

          {/* Overlays */}
          <div className="absolute top-4 left-4 z-[1000]">
            <div className="glass-panel px-3 py-2 rounded-full flex items-center gap-2 border border-white/5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: currentPlayer.color }}>{currentPlayer.name.charAt(0)}</div>
              <span className="text-sm font-bold text-[#f1f3fc]">{currentPlayer.name}</span>
            </div>
          </div>
          <div className="absolute top-4 right-4 z-[1000]">
            <div className="glass-panel px-3 py-2 rounded-full border border-white/5">
              <span className="text-[10px] uppercase tracking-[0.15em] text-[#a8abb3] font-bold">{roundNumber}/{totalRounds}</span>
            </div>
          </div>
          <div className="absolute top-16 left-0 right-0 z-[1000] px-4 mt-2">
            <div className="max-w-2xl mx-auto bg-[#151a21]/80 backdrop-blur-2xl p-1 rounded-full shadow-[0_16px_48px_-12px_rgba(0,0,0,0.5)] border border-white/5">
              <div className="flex items-center justify-between pl-5 pr-2 py-2">
                <div>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-[#a8abb3] font-bold">Aktuelle Mission</span>
                  <h2 className="text-base font-extrabold tracking-tight text-[#f1f3fc] uppercase">WO IST: {location.name}?</h2>
                </div>
                <div className="bg-[#ff6b98] p-2.5 rounded-full flex flex-col items-center min-w-[60px] shadow-[0_0_20px_rgba(255,107,152,0.4)]">
                  <span className="text-[8px] font-black uppercase text-white/80 leading-none mb-0.5">Zeit</span>
                  <span className="text-lg font-black text-white leading-none tabular-nums">{countdown}</span>
                </div>
              </div>
            </div>
          </div>
          {pinPos && (
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[1000]">
              <div className="bg-[#262c36]/90 backdrop-blur-md px-4 py-2 rounded-xl border border-[#df8eff]/30">
                <p className="text-xs font-bold text-[#df8eff] tracking-wide">PIN POSITIONIERT</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-6 left-0 right-0 z-[1000] flex justify-center px-4">
            <motion.button onClick={confirmGuess} disabled={!pinPos}
              className="px-12 py-5 rounded-full bg-gradient-to-r from-[#df8eff] to-[#d779ff] shadow-[0_20px_40px_-10px_rgba(223,142,255,0.4)] disabled:opacity-30 disabled:shadow-none"
              whileTap={pinPos ? { scale: 0.95 } : undefined}>
              <span className="flex items-center gap-3">
                <span className="text-xl font-black tracking-[0.15em] text-[#4f006d]">SETZEN</span>
                <Check className="w-6 h-6 text-[#4f006d]" />
              </span>
            </motion.button>
          </div>
        </div>
      )}

      {/* HANDOFF */}
      {phase === 'handoff' && (
        <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-black mb-4"
            style={{ background: handoffPlayer.color, boxShadow: `0 0 30px ${handoffPlayer.color}88` }}>
            {handoffPlayer.name.charAt(0).toUpperCase()}
          </div>
          <p className="text-[#a8abb3] text-sm mb-2">Gib das Geraet an</p>
          <h2 className="text-3xl font-black text-[#df8eff] text-glow-primary mb-10">{handoffPlayer.name}</h2>
          <motion.button onClick={handleHandoffReady}
            className="px-10 py-4 rounded-full bg-gradient-to-r from-[#df8eff] to-[#d779ff] shadow-[0_20px_40px_-10px_rgba(223,142,255,0.4)]"
            whileTap={{ scale: 0.95 }}>
            <span className="text-lg font-black tracking-[0.15em] text-[#4f006d]">BEREIT</span>
          </motion.button>
        </motion.div>
      )}

      {/* RESULT */}
      {phase === 'result' && (
        <motion.div className="absolute inset-0 z-10 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="w-full max-w-lg mx-auto px-4 pt-6 pb-8">
            <div className="flex items-center justify-between mb-6">
              <button onClick={onExit} className="text-[#a8abb3]/60 text-sm">Beenden</button>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#a8abb3] font-bold">{roundNumber}/{totalRounds}</span>
            </div>
            {winner && (
              <div className="text-center mb-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#ff6b98] font-bold mb-2">Level abgeschlossen</p>
                <h1 className="text-5xl font-black italic text-[#df8eff] text-glow-primary">GEWONNEN!</h1>
              </div>
            )}

            {/* Result map */}
            <div className="aspect-video rounded-xl border border-white/10 overflow-hidden mb-6" style={{ background: '#0f141a' }}>
              <MapContainer center={[location.lat, location.lng]} zoom={4} zoomControl={false} attributionControl={false}
                style={{ height: '100%', width: '100%', background: '#0a0e14' }}>
                <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
                <Marker position={[location.lat, location.lng]} icon={targetIcon()} />
                {allDoneGuesses.map(g => (
                  <Marker key={g.playerId} position={[g.lat, g.lng]} icon={playerIcon(g.playerColor, g.playerName.charAt(0).toUpperCase())} />
                ))}
                {allDoneGuesses.map(g => (
                  <Polyline key={`line-${g.playerId}`} positions={[[g.lat, g.lng], [location.lat, location.lng]]}
                    pathOptions={{ color: g.playerColor, weight: 2, dashArray: '8 6', opacity: 0.7 }} />
                ))}
                <FitBounds guesses={allDoneGuesses} location={location} />
              </MapContainer>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {winner && (
                <div className="col-span-2 bg-[#151a21]/60 backdrop-blur-md rounded-xl p-5 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Crosshair className="w-4 h-4 text-[#8ff5ff]" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#a8abb3] font-bold">Entfernung</span>
                  </div>
                  <p className="text-4xl font-black text-[#8ff5ff] text-glow-cyan">{formatDistance(winner.distanceKm)}</p>
                </div>
              )}
              <div className="bg-[#151a21]/60 rounded-xl p-4 border border-white/5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#a8abb3] font-bold">Reaktionszeit</span>
                <p className="text-2xl font-bold text-[#f1f3fc] mt-1">{timerSeconds}s</p>
              </div>
              {winner && (
                <div className="bg-gradient-to-br from-[#df8eff]/10 to-transparent rounded-xl p-4 border border-[#df8eff]/20">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#a8abb3] font-bold">Punkte</span>
                  <p className="text-2xl font-bold text-[#df8eff] mt-1">+{Math.max(0, Math.round(1000 * Math.exp(-winner.distanceKm / 2000)))}</p>
                </div>
              )}
            </div>

            {/* Leaderboard */}
            <div className="space-y-2 mb-6">
              {sortedGuesses.map((g, i) => (
                <div key={g.playerId} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${i === 0 ? 'bg-[#df8eff]/10 border border-[#df8eff]/20' : 'bg-[#20262f]/40 border border-white/5'}`}>
                  <span className={`text-sm font-black w-6 text-center ${i === 0 ? 'text-[#df8eff]' : 'text-[#a8abb3]/60'}`}>{i === 0 ? '🏆' : `${i + 1}`}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: g.playerColor }}>{g.playerName.charAt(0)}</div>
                  <span className={`text-sm font-semibold flex-1 ${i === 0 ? 'text-[#f1f3fc]' : 'text-[#a8abb3]'}`}>{g.playerName}</span>
                  <span className={`text-sm font-bold tabular-nums ${i === 0 ? 'text-[#8ff5ff]' : 'text-[#a8abb3]/60'}`}>{formatDistance(g.distanceKm)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <motion.button onClick={handleNextRound}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#df8eff] to-[#d779ff] shadow-[0_20px_40px_-10px_rgba(223,142,255,0.4)]"
                whileTap={{ scale: 0.95 }}>
                <span className="text-lg font-black tracking-[0.1em] text-[#4f006d]">{roundNumber >= totalRounds ? 'ERGEBNISSE' : 'NAECHSTE RUNDE'}</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
