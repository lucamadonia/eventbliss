/**
 * TVBroadcastContext — wraps ALL games to provide persistent TV broadcast.
 * Renders the TVConnectButton overlay and provides broadcastTV() via context.
 *
 * Place this ONCE above the game router so it persists across game switches.
 */
import { createContext, useContext, ReactNode } from "react";
import { useTVBroadcast, type TVBroadcastAPI } from "@/hooks/useTVBroadcast";
import { TVConnectButton } from "@/games/ui/TVConnectButton";

const TVCtx = createContext<TVBroadcastAPI | null>(null);

interface Props {
  children: ReactNode;
  /** Optional session code from PartySession. Overrides auto-generated code. */
  sessionCode?: string;
}

export function TVBroadcastProvider({ children, sessionCode }: Props) {
  const tv = useTVBroadcast(sessionCode);

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
