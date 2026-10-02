import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { NativeOverlayPortal } from '@/components/native/NativeOverlayPortal';
import { useTVContext } from '@/contexts/TVBroadcastContext';
import { gameRoomSession } from '@/games/multiplayer/useGameRoom';
import { serverClock } from '@/games/party/scene-clock';
import { sceneLocalTime } from '@/games/party/scene-schedule';
import { useScene } from '@/games/party/useScene';
import { applyPartySceneMessage, parsePartySceneMessage, sceneGoAt, usePartyScene, type PartyScene } from '@/games/party/party-scene';
import { SceneCountdown } from '@/games/ui/SceneCountdown';
import { partyMotion } from '@/lib/party-motion';
import { playableGames } from '@/lib/playable-games';

interface Props {
  isHost: boolean;
  /** Called once per scene at its shared moment ("Los!" / round end). */
  onGo: (scene: PartyScene) => void;
}

/**
 * Receives `party-scene` from the Host, shows the synchronized countdown and
 * fires `onGo` at the same server time on every device. The Host also hands
 * the scene to the TV with a clock stamp, so the TV counts along.
 */
export function PartySceneLayer({ isHost, onGo }: Props) {
  const scene = usePartyScene();
  const tv = useTVContext();
  const onGoRef = useRef(onGo);
  onGoRef.current = onGo;

  useEffect(() => gameRoomSession.onBroadcast('party-scene', data => {
    const message = parsePartySceneMessage(data, serverClock.now());
    if (message) applyPartySceneMessage(message);
  }), []);

  useEffect(() => {
    if (!isHost || !tv?.isActive || !scene || scene.scene !== 'game-start') return;
    tv.broadcastTV('game-start', { scene, serverNow: new Date(serverClock.now()).toISOString() });
  }, [isHost, tv, scene]);

  // Round end has no countdown: just switch at the shared moment.
  useScene(scene?.scene === 'round-end' ? scene : null);
  useEffect(() => {
    if (!scene || scene.scene !== 'round-end') return;
    const wait = Math.max(0, sceneLocalTime(sceneGoAt(scene)) - Date.now());
    const id = setTimeout(() => onGoRef.current(scene), wait);
    return () => clearTimeout(id);
  }, [scene]);

  return <NativeOverlayPortal>
    <AnimatePresence>
      {scene?.scene === 'game-start' && <GameStartOverlay key={scene.sceneId} scene={scene} onGo={() => onGoRef.current(scene)} />}
    </AnimatePresence>
  </NativeOverlayPortal>;
}

function GameStartOverlay({ scene, onGo }: { scene: PartyScene; onGo: () => void }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const game = playableGames.find(entry => entry.id === scene.data?.gameId);
  return (
    <motion.div data-testid="party-scene-overlay" data-scene-id={scene.sceneId}
      variants={partyMotion('scrimFade', reduced)} initial="initial" animate="animate" exit="exit"
      className="fixed inset-0 z-[150] bg-[#060810]/90 text-center text-white backdrop-blur-xl">
      {/* The digit sits dead centre, exactly as on the TV (T05); the game sits above it. */}
      <div className="absolute inset-x-0 top-[max(12%,env(safe-area-inset-top))] flex flex-col items-center gap-3 px-6">
        {game && <img src={game.image} alt="" className="h-20 w-20 rounded-3xl object-cover shadow-[0_20px_60px_rgba(223,142,255,.35)]" />}
        <p className="text-sm font-semibold uppercase tracking-[.25em] text-[#8ff5ff]">
          {game ? t(game.nameKey) : t('partyPlay.scene.getReady', 'Gleich geht’s los')}
        </p>
      </div>
      <SceneCountdown scene={scene} onGo={onGo} className="absolute inset-0" />
    </motion.div>
  );
}
