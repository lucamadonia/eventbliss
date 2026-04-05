import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, Check, ChevronRight, Trophy, MapPin, Crosshair, Eye, Timer } from 'lucide-react';
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps';
import { haversineKm } from '../engine/haversine';
import type { StreetViewLocation } from './streetview-locations';

const GMAP_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';

const MAP_STYLE: google.maps.MapTypeStyle[] = [
  { featureType: 'administrative.locality', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

function MapStyler() { const map = useMap(); useEffect(() => { if (map) map.setOptions({ styles: MAP_STYLE }); }, [map]); return null; }
function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => { if (!map) return; const l = map.addListener('click', (e: google.maps.MapMouseEvent) => { if (e.latLng) onClick(e.latLng.lat(), e.latLng.lng()); }); return () => l.remove(); }, [map, onClick]);
  return null;
}

type Phase = 'explore' | 'guess' | 'result';
interface Player { id: string; name: string; color: string; avatar: string; score: number; correct: number; wrong: number; streak: number; bestStreak: number; fastestMs: number; }
export interface StreetViewResult { playerId: string; distanceKm: number; }
interface Props { location: StreetViewLocation; players: Player[]; roundNumber: number; totalRounds: number; timerSeconds: number; onRoundComplete: (results: StreetViewResult[]) => void; onExit: () => void; }

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString('de-DE')} km`;
}

const CSS = `.text-glow-primary{text-shadow:0 0 20px rgba(223,142,255,0.5)}.text-glow-cyan{text-shadow:0 0 20px rgba(143,245,255,0.5)}.glass-panel{background:rgba(21,26,33,0.4);backdrop-filter:blur(20px)}`;

// Street View component — waits for Google Maps API to load
function StreetViewPano({ lat, lng }: { lat: number; lng: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panoRef = useRef<google.maps.StreetViewPanorama | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Poll until google.maps is available (loaded by APIProvider)
    let cancelled = false;
    const tryInit = () => {
      if (cancelled) return;
      if (typeof google === 'undefined' || !google.maps) {
        setTimeout(tryInit, 200);
        return;
      }
      if (!containerRef.current || panoRef.current) return;
      panoRef.current = new google.maps.StreetViewPanorama(containerRef.current, {
        position: { lat, lng },
        pov: { heading: Math.random() * 360, pitch: 0 },
        zoom: 1,
        disableDefaultUI: true,
        showRoadLabels: false,
        addressControl: false,
        linksControl: true,
        panControl: true,
        enableCloseButton: false,
      });
    };
    tryInit();

    return () => { cancelled = true; panoRef.current = null; };
  }, [lat, lng]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#0a0e14' }} />;
}

export default function StreetViewRound({ location, players, roundNumber, totalRounds, timerSeconds, onRoundComplete, onExit }: Props) {
  const [phase, setPhase] = useState<Phase>('explore');
  const [playerIdx, setPlayerIdx] = useState(0);
  const [guesses, setGuesses] = useState<{ playerId: string; playerName: string; playerColor: string; lat: number; lng: number; distanceKm: number }[]>([]);
  const [pinPos, setPinPos] = useState<{ lat: number; lng: number } | null>(null);
  const [countdown, setCountdown] = useState(timerSeconds);
  const [exploreTime, setExploreTime] = useState(20); // 20s to explore
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const guessesRef = useRef(guesses);
  const playerIdxRef = useRef(playerIdx);
  const pinPosRef = useRef(pinPos);
  useEffect(() => { guessesRef.current = guesses; }, [guesses]);
  useEffect(() => { playerIdxRef.current = playerIdx; }, [playerIdx]);
  useEffect(() => { pinPosRef.current = pinPos; }, [pinPos]);

  const currentPlayer = players[playerIdx % players.length];
  const currentPlayerRef = useRef(currentPlayer);
  useEffect(() => { currentPlayerRef.current = currentPlayer; }, [currentPlayer]);

  // Explore countdown
  useEffect(() => {
    if (phase !== 'explore') return;
    const t = setInterval(() => {
      setExploreTime(prev => {
        if (prev <= 1) { clearInterval(t); setPhase('guess'); setCountdown(timerSeconds); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, timerSeconds, playerIdx]);

  const confirmGuess = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const pos = pinPosRef.current;
    const lat = pos?.lat ?? 0, lng = pos?.lng ?? 0;
    const distanceKm = pos ? haversineKm(lat, lng, location.lat, location.lng) : 20000;
    const cp = currentPlayerRef.current;
    const guess = { playerId: cp.id, playerName: cp.name, playerColor: cp.color, lat, lng, distanceKm };
    const updated = [...guessesRef.current, guess];
    setGuesses(updated);
    setPinPos(null);
    const nextIdx = playerIdxRef.current + 1;
    if (nextIdx >= players.length) { setPhase('result'); }
    else { setPlayerIdx(nextIdx); setPhase('explore'); setExploreTime(20); }
  }, [location, players.length]);

  // Guess countdown
  useEffect(() => {
    if (phase !== 'guess') return;
    timerRef.current = setInterval(() => {
      setCountdown(prev => { if (prev <= 1) { clearInterval(timerRef.current!); timerRef.current = null; confirmGuess(); return 0; } return prev - 1; });
    }, 1000);
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [phase, playerIdx, confirmGuess]);

  const handleMapClick = useCallback((lat: number, lng: number) => { setPinPos({ lat, lng }); }, []);
  const sorted = [...guesses].sort((a, b) => a.distanceKm - b.distanceKm);
  const winner = sorted[0];

  return (
    <APIProvider apiKey={GMAP_KEY}>
      <div className="fixed inset-0 bg-[#0a0e14] overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', system-ui" }}>
        <style>{CSS}</style>

        {/* EXPLORE PHASE — Street View Panorama */}
        {phase === 'explore' && (
          <div className="absolute inset-0">
            <StreetViewPano lat={location.lat} lng={location.lng} />
            {/* Overlays */}
            <div className="absolute top-4 left-4 z-10">
              <div className="glass-panel px-3 py-2 rounded-full flex items-center gap-2 border border-white/5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: currentPlayer.color }}>{currentPlayer.name.charAt(0)}</div>
                <span className="text-sm font-bold text-[#f1f3fc]">{currentPlayer.name}</span>
              </div>
            </div>
            <div className="absolute top-4 right-4 z-10">
              <div className="glass-panel px-3 py-2 rounded-full border border-white/5">
                <span className="text-[10px] uppercase tracking-wider text-[#a8abb3] font-bold">{roundNumber}/{totalRounds}</span>
              </div>
            </div>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="glass-panel px-4 py-2 rounded-full border border-[#8ff5ff]/20 flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#8ff5ff]" />
                <span className="text-sm font-bold text-[#8ff5ff]">Schau dich um!</span>
                <span className="text-lg font-black text-white tabular-nums">{exploreTime}s</span>
              </div>
            </div>
            <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center">
              <motion.button onClick={() => { setPhase('guess'); setCountdown(timerSeconds); }}
                className="px-10 py-4 rounded-full bg-gradient-to-r from-[#df8eff] to-[#d779ff] shadow-[0_20px_40px_-10px_rgba(223,142,255,0.4)]"
                whileTap={{ scale: 0.95 }}>
                <span className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#4f006d]" />
                  <span className="text-lg font-black tracking-[0.1em] text-[#4f006d]">RATEN</span>
                </span>
              </motion.button>
            </div>
          </div>
        )}

        {/* GUESS PHASE — Map to place pin */}
        {phase === 'guess' && (
          <div className="absolute inset-0">
            <Map defaultCenter={{ lat: 20, lng: 10 }} defaultZoom={2}
              style={{ width: '100%', height: '100%' }} gestureHandling="greedy"
              disableDefaultUI fullscreenControl={false} mapTypeControl={false} streetViewControl={false}>
              <MapStyler />
              <ClickHandler onClick={handleMapClick} />
              {pinPos && <Marker position={pinPos} label={{ text: currentPlayer.name.charAt(0), color: 'white', fontWeight: 'bold' }} />}
            </Map>
            {/* Overlays */}
            <div className="absolute top-4 left-4 z-10">
              <div className="glass-panel px-3 py-2 rounded-full flex items-center gap-2 border border-white/5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: currentPlayer.color }}>{currentPlayer.name.charAt(0)}</div>
                <span className="text-sm font-bold text-[#f1f3fc]">{currentPlayer.name}</span>
              </div>
            </div>
            <div className="absolute top-16 left-0 right-0 z-10 px-4 mt-2">
              <div className="max-w-2xl mx-auto bg-[#151a21]/80 backdrop-blur-2xl p-1 rounded-full shadow-[0_16px_48px_-12px_rgba(0,0,0,0.5)] border border-white/5">
                <div className="flex items-center justify-between pl-5 pr-2 py-2">
                  <div>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#a8abb3] font-bold">Wo warst du?</span>
                    <h2 className="text-base font-extrabold tracking-tight text-[#f1f3fc] uppercase">SETZE DEINEN PIN!</h2>
                  </div>
                  <div className="bg-[#ff6b98] p-2.5 rounded-full flex flex-col items-center min-w-[60px] shadow-[0_0_20px_rgba(255,107,152,0.4)]">
                    <span className="text-[8px] font-black uppercase text-white/80 leading-none mb-0.5">Zeit</span>
                    <span className="text-lg font-black text-white leading-none tabular-nums">{countdown}</span>
                  </div>
                </div>
              </div>
            </div>
            {pinPos && (
              <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-[#262c36]/90 backdrop-blur-md px-4 py-2 rounded-xl border border-[#df8eff]/30">
                  <p className="text-xs font-bold text-[#df8eff] tracking-wide">PIN POSITIONIERT</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center px-4">
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

        {/* RESULT */}
        {phase === 'result' && (
          <motion.div className="absolute inset-0 z-10 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="w-full max-w-lg mx-auto px-4 pt-6 pb-8">
              <div className="flex items-center justify-between mb-6">
                <button onClick={onExit} className="text-[#a8abb3]/60 text-sm">Beenden</button>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#a8abb3] font-bold">{roundNumber}/{totalRounds}</span>
              </div>
              {winner && (
                <div className="text-center mb-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#ff6b98] font-bold mb-2">Street View Runde</p>
                  <h1 className="text-4xl font-black italic text-[#df8eff] text-glow-primary">{location.city}, {location.country}</h1>
                </div>
              )}
              {/* Result map */}
              <div className="aspect-video rounded-xl border border-white/10 overflow-hidden mb-6">
                <Map defaultCenter={{ lat: location.lat, lng: location.lng }} defaultZoom={3}
                  style={{ width: '100%', height: '100%' }} disableDefaultUI mapTypeControl={false}>
                  <MapStyler />
                  <Marker position={{ lat: location.lat, lng: location.lng }} label={{ text: '★', color: '#8ff5ff', fontWeight: 'bold', fontSize: '16px' }} />
                  {guesses.map(g => (
                    <Marker key={g.playerId} position={{ lat: g.lat, lng: g.lng }} label={{ text: g.playerName.charAt(0), color: 'white', fontWeight: 'bold' }} />
                  ))}
                </Map>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {winner && (
                  <div className="col-span-2 bg-[#151a21]/60 rounded-xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Crosshair className="w-4 h-4 text-[#8ff5ff]" />
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#a8abb3] font-bold">Naechster Treffer</span>
                    </div>
                    <p className="text-4xl font-black text-[#8ff5ff] text-glow-cyan">{formatDistance(winner.distanceKm)}</p>
                  </div>
                )}
                {winner && (
                  <div className="col-span-2 bg-gradient-to-br from-[#df8eff]/10 to-transparent rounded-xl p-4 border border-[#df8eff]/20">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#a8abb3] font-bold">Punkte</span>
                    <p className="text-2xl font-bold text-[#df8eff] mt-1">+{Math.max(0, Math.round(1000 * Math.exp(-winner.distanceKm / 2000)))}</p>
                  </div>
                )}
              </div>
              {/* Leaderboard */}
              <div className="space-y-2 mb-6">
                {sorted.map((g, i) => (
                  <div key={g.playerId} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${i === 0 ? 'bg-[#df8eff]/10 border border-[#df8eff]/20' : 'bg-[#20262f]/40 border border-white/5'}`}>
                    <span className={`text-sm font-black w-6 text-center ${i === 0 ? 'text-[#df8eff]' : 'text-[#a8abb3]/60'}`}>{i === 0 ? '🏆' : `${i + 1}`}</span>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: g.playerColor }}>{g.playerName.charAt(0)}</div>
                    <span className={`text-sm font-semibold flex-1 ${i === 0 ? 'text-[#f1f3fc]' : 'text-[#a8abb3]'}`}>{g.playerName}</span>
                    <span className={`text-sm font-bold tabular-nums ${i === 0 ? 'text-[#8ff5ff]' : 'text-[#a8abb3]/60'}`}>{formatDistance(g.distanceKm)}</span>
                  </div>
                ))}
              </div>
              <motion.button onClick={() => onRoundComplete(guesses.map(g => ({ playerId: g.playerId, distanceKm: g.distanceKm })))}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#df8eff] to-[#d779ff] shadow-[0_20px_40px_-10px_rgba(223,142,255,0.4)]"
                whileTap={{ scale: 0.95 }}>
                <span className="text-lg font-black tracking-[0.1em] text-[#4f006d]">{roundNumber >= totalRounds ? 'ERGEBNISSE' : 'NAECHSTE RUNDE'}</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </APIProvider>
  );
}
