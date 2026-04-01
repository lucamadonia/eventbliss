import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Check, ChevronRight, Trophy, Timer, Share2, Crosshair } from 'lucide-react';
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

function createPlayerIcon(color: string, initial: string): L.DivIcon {
  return L.divIcon({ className: '', iconSize: [32, 32], iconAnchor: [16, 32],
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:white;box-shadow:0 0 15px ${color}88,0 2px 8px rgba(0,0,0,0.4);font-family:'Plus Jakarta Sans',system-ui,sans-serif;">${initial}</div>`,
  });
}

function createTargetIcon(): L.DivIcon {
  return L.divIcon({ className: '', iconSize: [36, 36], iconAnchor: [18, 36],
    html: `<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#8ff5ff,#00deec);border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 0 15px #8ff5ff,0 2px 8px rgba(0,0,0,0.3);animation:pulse-cyan 1.5s ease-in-out infinite;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  });
}

const CSS = `.glass-panel{background:rgba(21,26,33,0.4);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}.text-glow-primary{text-shadow:0 0 20px rgba(223,142,255,0.5)}.text-glow-cyan{text-shadow:0 0 20px rgba(143,245,255,0.5)}.grid-overlay{background-image:linear-gradient(to right,rgba(223,142,255,0.05) 1px,transparent 1px),linear-gradient(to bottom,rgba(223,142,255,0.05) 1px,transparent 1px);background-size:40px 40px}.neo-shadow-primary{box-shadow:0 0 20px rgba(223,142,255,0.2)}@keyframes pulse-cyan{0%,100%{box-shadow:0 0 15px #8ff5ff,0 2px 8px rgba(0,0,0,0.3)}50%{box-shadow:0 0 28px #8ff5ffcc,0 2px 12px rgba(0,0,0,0.4)}}@keyframes float-orb{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(10px,-15px) scale(1.1)}}@keyframes pulse-ring{0%{transform:scale(1);opacity:0.6}100%{transform:scale(2);opacity:0}}`;

export default function MapRound({ location, players, roundNumber, totalRounds, timerSeconds, onRoundComplete, onExit }: MapRoundProps) {
  const [phase, setPhase] = useState<MapPhase>('showing');
  const [guessingPlayerIdx, setGuessingPlayerIdx] = useState(0);
  const [guesses, setGuesses] = useState<PlayerGuess[]>([]);
  const [pinLat, setPinLat] = useState<number | null>(null);
  const [pinLng, setPinLng] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(timerSeconds);
  const [allDoneGuesses, setAllDoneGuesses] = useState<PlayerGuess[]>([]);
  const guessMapContainerRef = useRef<HTMLDivElement>(null);
  const resultMapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pinLatRef = useRef<number | null>(null);
  const pinLngRef = useRef<number | null>(null);
  const currentPlayer = players[guessingPlayerIdx % players.length];

  useEffect(() => { pinLatRef.current = pinLat; }, [pinLat]);
  useEffect(() => { pinLngRef.current = pinLng; }, [pinLng]);

  useEffect(() => {
    if (phase !== 'showing') return;
    const t = setTimeout(() => { setPhase('guessing'); setCountdown(timerSeconds); }, 2500);
    return () => clearTimeout(t);
  }, [phase, timerSeconds]);

  useEffect(() => {
    if (phase !== 'guessing') return;
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); confirmGuess(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, guessingPlayerIdx]);

  useEffect(() => {
    if (phase !== 'guessing' || !guessMapContainerRef.current) return;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    let cancelled = false;
    requestAnimationFrame(() => { requestAnimationFrame(() => {
      if (cancelled || !guessMapContainerRef.current) return;
      const map = L.map(guessMapContainerRef.current, { center: [20, 10], zoom: 2, zoomControl: false, attributionControl: false, maxBoundsViscosity: 1.0 });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18, subdomains: 'abcd' }).addTo(map);
      L.control.attribution({ position: 'bottomright', prefix: false }).addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" style="color:#666">OSM</a>').addTo(map);
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setPinLat(lat); setPinLng(lng);
        if (pinMarkerRef.current) { pinMarkerRef.current.setLatLng([lat, lng]); }
        else { pinMarkerRef.current = L.marker([lat, lng], { icon: createPlayerIcon(currentPlayer.color, currentPlayer.name.charAt(0).toUpperCase()) }).addTo(map); }
      });
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 200);
    }); });
    return () => { cancelled = true; pinMarkerRef.current = null; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [phase, guessingPlayerIdx]);

  useEffect(() => {
    if (phase !== 'result' || allDoneGuesses.length === 0) return;
    let cancelled = false;
    const timer = setTimeout(() => { requestAnimationFrame(() => { requestAnimationFrame(() => {
      if (cancelled || !resultMapContainerRef.current) return;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      const map = L.map(resultMapContainerRef.current, { center: [location.lat, location.lng], zoom: 4, zoomControl: false, attributionControl: false });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18, subdomains: 'abcd' }).addTo(map);
      L.marker([location.lat, location.lng], { icon: createTargetIcon() }).addTo(map);
      const bounds = L.latLngBounds([[location.lat, location.lng]]);
      allDoneGuesses.forEach(g => {
        L.marker([g.lat, g.lng], { icon: createPlayerIcon(g.playerColor, g.playerName.charAt(0).toUpperCase()) }).addTo(map);
        L.polyline([[g.lat, g.lng], [location.lat, location.lng]], { color: g.playerColor, weight: 2, dashArray: '8 6', opacity: 0.7 }).addTo(map);
        bounds.extend([g.lat, g.lng]);
      });
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 200);
    }); }); }, 300);
    return () => { cancelled = true; clearTimeout(timer); if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [phase, allDoneGuesses, location]);

  const confirmGuess = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const lat = pinLatRef.current, lng = pinLngRef.current;
    const guessLat = lat ?? 0, guessLng = lng ?? 0;
    const distanceKm = (lat !== null && lng !== null) ? haversineKm(guessLat, guessLng, location.lat, location.lng) : 20000;
    const guess: PlayerGuess = { playerId: currentPlayer.id, playerName: currentPlayer.name, playerColor: currentPlayer.color, lat: guessLat, lng: guessLng, distanceKm };
    const updatedGuesses = [...guesses, guess];
    setGuesses(updatedGuesses);
    setPinLat(null); setPinLng(null); pinMarkerRef.current = null;
    const nextIdx = guessingPlayerIdx + 1;
    if (nextIdx >= players.length) { setAllDoneGuesses(updatedGuesses); setPhase('result'); }
    else { setGuessingPlayerIdx(nextIdx); setPhase('handoff'); }
  }, [location, currentPlayer, guesses, guessingPlayerIdx, players.length]);

  const handleHandoffReady = () => { setPhase('guessing'); setCountdown(timerSeconds); };
  const handleNextRound = () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } onRoundComplete(guesses.map(g => ({ playerId: g.playerId, distanceKm: g.distanceKm }))); };
  const sortedGuesses = [...guesses].sort((a, b) => a.distanceKm - b.distanceKm);
  const winner = sortedGuesses[0];
  const typeLabel = location.type === 'country' ? 'Land' : 'Stadt';
  const handoffPlayer = players[guessingPlayerIdx % players.length];

  return (
    <div className="fixed inset-0 bg-[#0a0e14] overflow-hidden flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <style>{CSS}</style>
      <AnimatePresence mode="wait">
        {phase === 'showing' && (
          <motion.div key="showing" className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4 }}>
            <div className="pointer-events-none absolute top-[15%] right-[10%] w-[35vw] h-[35vw] rounded-full blur-[120px]" style={{ background: 'rgba(223,142,255,0.08)', animation: 'float-orb 6s ease-in-out infinite' }} />
            <div className="pointer-events-none absolute bottom-[10%] left-[5%] w-[30vw] h-[30vw] rounded-full blur-[100px]" style={{ background: 'rgba(143,245,255,0.06)', animation: 'float-orb 8s ease-in-out infinite reverse' }} />
            <div className="pointer-events-none absolute top-[40%] left-[40%] w-[20vw] h-[20vw] rounded-full blur-[80px]" style={{ background: 'rgba(255,107,152,0.05)', animation: 'float-orb 7s ease-in-out infinite' }} />
            <div className="absolute top-6 right-6">
              <div className="px-3 py-1.5 rounded-full bg-[#151a21]/60 border border-white/5 backdrop-blur-md">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#a8abb3] font-bold">Runde {roundNumber}/{totalRounds}</span>
              </div>
            </div>
            <button onClick={onExit} className="absolute top-6 left-6 text-[#a8abb3]/60 hover:text-[#a8abb3] text-sm transition-colors font-medium">Beenden</button>
            <motion.div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#df8eff] to-[#8ff5ff] flex items-center justify-center mb-8 neo-shadow-primary"
              animate={{ rotate: [0, -3, 3, -3, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}>
              <MapPin className="w-10 h-10 text-white" />
            </motion.div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#a8abb3] font-bold mb-3">Aktuelle Mission</p>
            <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter text-[#df8eff] text-glow-primary uppercase text-center leading-none mb-4">{location.name}</h1>
            <div className="px-4 py-1.5 rounded-full bg-[#ff6b98]/10 border border-[#ff6b98]/20">
              <span className="text-[11px] uppercase tracking-[0.15em] text-[#ff6b98] font-bold">{typeLabel}</span>
            </div>
          </motion.div>
        )}

        {phase === 'guessing' && (
          <motion.div key={`guessing-${guessingPlayerIdx}`} className="absolute inset-0 z-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div ref={guessMapContainerRef} className="absolute inset-0 z-0" style={{ height: '100%', width: '100%' }} />
            <div className="absolute inset-0 z-[1] grid-overlay pointer-events-none" />
            <div className="absolute top-4 left-4 z-20">
              <div className="glass-panel px-3 py-2 rounded-full flex items-center gap-2 border border-white/5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: currentPlayer.color }}>{currentPlayer.name.charAt(0)}</div>
                <span className="text-sm font-bold text-[#f1f3fc]">{currentPlayer.name}</span>
              </div>
            </div>
            <div className="absolute top-4 right-4 z-20">
              <div className="glass-panel px-3 py-2 rounded-full border border-white/5">
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#a8abb3] font-bold">{roundNumber}/{totalRounds}</span>
              </div>
            </div>
            <div className="absolute top-20 left-0 right-0 z-20 px-4">
              <div className="max-w-2xl mx-auto bg-[#151a21]/80 backdrop-blur-2xl p-1 rounded-full shadow-[0_16px_48px_-12px_rgba(0,0,0,0.5)] border border-white/5">
                <div className="flex items-center justify-between pl-6 pr-2 py-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#a8abb3] font-bold">Aktuelle Mission</span>
                    <h2 className="text-lg font-extrabold tracking-tight text-[#f1f3fc] uppercase">WO IST: {location.name}?</h2>
                  </div>
                  <div className="bg-[#ff6b98] p-3 rounded-full flex flex-col items-center min-w-[70px] shadow-[0_0_20px_rgba(255,107,152,0.4)]">
                    <span className="text-[10px] font-black uppercase text-white/80 leading-none mb-1">Zeit</span>
                    <span className="text-xl font-black text-white leading-none tabular-nums">{countdown}</span>
                  </div>
                </div>
              </div>
            </div>
            {pinLat !== null && (
              <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20">
                <motion.div className="bg-[#262c36]/90 backdrop-blur-md px-4 py-2 rounded-xl border border-[#df8eff]/30 shadow-xl"
                  initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                  <p className="text-xs font-bold text-[#df8eff] tracking-wide">PIN POSITIONIERT</p>
                </motion.div>
              </div>
            )}
            <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center px-4">
              <motion.button onClick={confirmGuess} disabled={pinLat === null}
                className="relative px-12 py-5 rounded-full bg-gradient-to-r from-[#df8eff] to-[#d779ff] shadow-[0_20px_40px_-10px_rgba(223,142,255,0.4)] disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none transition-shadow"
                whileTap={pinLat !== null ? { scale: 0.95 } : undefined}>
                <span className="flex items-center gap-3">
                  <span className="text-xl font-black tracking-[0.15em] text-[#4f006d]">SETZEN</span>
                  <Check className="w-6 h-6 text-[#4f006d]" />
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {phase === 'handoff' && (
          <motion.div key="handoff" className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="pointer-events-none absolute top-[20%] right-[15%] w-[30vw] h-[30vw] rounded-full blur-[100px]" style={{ background: 'rgba(223,142,255,0.07)' }} />
            <div className="pointer-events-none absolute bottom-[15%] left-[10%] w-[25vw] h-[25vw] rounded-full blur-[80px]" style={{ background: 'rgba(143,245,255,0.05)' }} />
            <div className="relative mb-6">
              <motion.div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-black"
                style={{ background: handoffPlayer.color, boxShadow: `0 0 30px ${handoffPlayer.color}88` }}>
                {handoffPlayer.name.charAt(0).toUpperCase()}
              </motion.div>
              <div className="absolute inset-0 rounded-full border-2 border-[#df8eff]/40" style={{ animation: 'pulse-ring 2s ease-out infinite' }} />
            </div>
            <p className="text-[#a8abb3] text-sm font-medium mb-2 tracking-wide">Gib das Geraet an</p>
            <h2 className="text-3xl font-black text-[#df8eff] text-glow-primary mb-10">{handoffPlayer.name}</h2>
            <motion.button onClick={handleHandoffReady}
              className="px-10 py-4 rounded-full bg-gradient-to-r from-[#df8eff] to-[#d779ff] shadow-[0_20px_40px_-10px_rgba(223,142,255,0.4)]"
              whileTap={{ scale: 0.95 }}>
              <span className="flex items-center gap-2">
                <span className="text-lg font-black tracking-[0.15em] text-[#4f006d]">BEREIT</span>
                <ChevronRight className="w-5 h-5 text-[#4f006d]" />
              </span>
            </motion.button>
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div key="result" className="absolute inset-0 z-10 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="pointer-events-none absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full blur-[120px]" style={{ background: 'rgba(223,142,255,0.06)' }} />
            <div className="pointer-events-none absolute bottom-0 left-0 w-[35vw] h-[35vw] rounded-full blur-[100px]" style={{ background: 'rgba(143,245,255,0.05)' }} />
            <div className="relative z-10 w-full max-w-lg mx-auto px-4 pt-6 pb-8">
              <div className="flex items-center justify-between mb-6">
                <button onClick={onExit} className="text-[#a8abb3]/60 hover:text-[#a8abb3] text-sm transition-colors font-medium">Beenden</button>
                <div className="px-3 py-1.5 rounded-full bg-[#151a21]/60 border border-white/5">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#a8abb3] font-bold">Runde {roundNumber}/{totalRounds}</span>
                </div>
              </div>
              {winner && (
                <motion.div className="text-center mb-6" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#ff6b98] font-bold mb-2">Level abgeschlossen</p>
                  <h1 className="text-5xl md:text-6xl font-black italic text-[#df8eff] text-glow-primary uppercase leading-none">GEWONNEN!</h1>
                </motion.div>
              )}
              <motion.div className="aspect-video rounded-xl border border-white/10 overflow-hidden mb-6 relative"
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} style={{ background: '#0f141a' }}>
                <div ref={resultMapContainerRef} style={{ height: '100%', width: '100%' }} />
              </motion.div>
              <motion.div className="grid grid-cols-2 gap-3 mb-6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                {winner && (
                  <div className="col-span-2 bg-[#151a21]/60 backdrop-blur-md rounded-xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Crosshair className="w-4 h-4 text-[#8ff5ff]" />
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#a8abb3] font-bold">Entfernung</span>
                    </div>
                    <p className="text-4xl font-black text-[#8ff5ff] text-glow-cyan">{formatDistance(winner.distanceKm)}</p>
                  </div>
                )}
                <div className="bg-[#151a21]/60 backdrop-blur-md rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="w-3.5 h-3.5 text-[#a8abb3]" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#a8abb3] font-bold">Reaktionszeit</span>
                  </div>
                  <p className="text-2xl font-bold text-[#f1f3fc]">{timerSeconds}s</p>
                </div>
                {winner && (
                  <div className="bg-gradient-to-br from-[#df8eff]/10 to-[#df8eff]/5 backdrop-blur-md rounded-xl p-4 border border-[#df8eff]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-3.5 h-3.5 text-[#df8eff]" />
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#a8abb3] font-bold">Punkte</span>
                    </div>
                    <p className="text-2xl font-bold text-[#df8eff]">{Math.max(0, Math.round(5000 - winner.distanceKm * 10))}</p>
                  </div>
                )}
              </motion.div>
              <motion.div className="mb-6 space-y-2" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                {sortedGuesses.map((g, i) => (
                  <motion.div key={g.playerId}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl ${i === 0 ? 'bg-gradient-to-r from-[#df8eff]/15 to-[#df8eff]/5 border border-[#df8eff]/20' : 'bg-[#20262f]/40 border border-white/5'}`}
                    initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }}>
                    <span className={`text-sm font-black w-6 text-center ${i === 0 ? 'text-[#df8eff]' : 'text-[#a8abb3]/60'}`}>
                      {i === 0 ? <Trophy className="w-4 h-4 text-[#df8eff] mx-auto" /> : `${i + 1}`}
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${i === 0 ? 'ring-2 ring-[#df8eff]/50' : ''}`}
                      style={{ background: g.playerColor }}>{g.playerName.charAt(0).toUpperCase()}</div>
                    <span className={`text-sm font-semibold flex-1 ${i === 0 ? 'text-[#f1f3fc]' : 'text-[#a8abb3]'}`}>{g.playerName}</span>
                    <span className={`text-sm font-bold tabular-nums ${i === 0 ? 'text-[#8ff5ff]' : 'text-[#a8abb3]/60'}`}>{formatDistance(g.distanceKm)}</span>
                  </motion.div>
                ))}
              </motion.div>
              <motion.div className="space-y-3 pb-4" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
                <motion.button onClick={handleNextRound}
                  className="w-full py-4 rounded-full bg-gradient-to-r from-[#df8eff] to-[#d779ff] shadow-[0_20px_40px_-10px_rgba(223,142,255,0.4)]"
                  whileTap={{ scale: 0.95 }}>
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-lg font-black tracking-[0.1em] text-[#4f006d]">{roundNumber >= totalRounds ? 'ERGEBNISSE' : 'NAECHSTE RUNDE'}</span>
                    <ChevronRight className="w-5 h-5 text-[#4f006d]" />
                  </span>
                </motion.button>
                <button className="w-full py-4 rounded-full border-2 border-[#df8eff]/30 text-[#df8eff] font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-[#df8eff]/5 transition-colors">
                  <Share2 className="w-4 h-4" /> ERGEBNIS TEILEN
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
