import { useEffect, useState } from 'react';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { OBJECT_ATLAS } from './visual-content';

/** Competitive time starts only once every participating device has decoded the object atlas. */
export function useFindItAssets(online: OnlineGameProps | undefined, players: readonly { id: string }[]) {
  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);
  const [readyPeers, setReadyPeers] = useState<string[]>([]);
  const [hostImagesAvailable, setHostImagesAvailable] = useState(false);
  const imagesAvailable = imageReady && (!online || (online.isHost
    ? players.every(p => p.id === online.myPlayerId || readyPeers.includes(p.id))
    : hostImagesAvailable));
  useEffect(() => {
    let active = true;
    const picture = new Image();
    setImageError(false);
    picture.onload = () => { if (active) setImageReady(true); };
    picture.onerror = () => { if (active) setImageError(true); };
    picture.src = OBJECT_ATLAS;
    return () => { active = false; picture.onload = null; picture.onerror = null; };
  }, [imageAttempt]);
  useEffect(() => {
    if (!online?.isHost) return;
    return online.onBroadcast('findit-assets-ready', data => {
      if (typeof data.__senderId !== 'string') return;
      const id = data.__senderId;
      setReadyPeers(previous => previous.includes(id) ? previous : [...previous, id]);
    });
  }, [online]);
  useEffect(() => {
    if (!online || online.isHost || !imageReady) return;
    const announce = () => online.broadcast('findit-assets-ready', {});
    announce();
    const retry = setInterval(announce, 1500);
    return () => clearInterval(retry);
  }, [online, imageReady]);
  return { imagesAvailable, imageError, setImageAttempt, setHostImagesAvailable };
}
