/**
 * TVBroadcastContext — wraps offline games to provide TV broadcast capability.
 * Renders the TVConnectButton overlay and provides broadcastTV() via context.
 */
import { createContext, useContext, ReactNode } from "react";
import { useTVBroadcast, type TVBroadcastAPI } from "@/hooks/useTVBroadcast";
import { TVConnectButton } from "@/games/ui/TVConnectButton";

const TVCtx = createContext<TVBroadcastAPI | null>(null);

export function TVBroadcastProvider({ children, roomCode }: { children: ReactNode; roomCode?: string }) {
  const tv = useTVBroadcast(roomCode);

  return (
    <TVCtx.Provider value={tv}>
      {children}
      <TVConnectButton tvCode={tv.tvCode} isActive={tv.isActive} onActivate={tv.activate} />
    </TVCtx.Provider>
  );
}

/**
 * Access the TV broadcast function from inside a game.
 * Returns null if not wrapped in TVBroadcastProvider.
 */
export function useTVContext(): TVBroadcastAPI | null {
  return useContext(TVCtx);
}
