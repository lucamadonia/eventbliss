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
  /** false = keine schwebende Pille auf diesem Bildschirm. */
  showConnectButton?: boolean;
  /** Optional session code from PartySession. Overrides auto-generated code. */
  sessionCode?: string;
}

export function TVBroadcastProvider({ children, sessionCode, showConnectButton = true }: Props) {
  const outer = useContext(TVCtx);
  // Liegt schon ein Provider darueber, NICHT verschachteln: `supabase.channel()`
  // dedupliziert nach Topic und gibt dieselbe Instanz zurueck. Zwei Provider mit
  // demselben TV-Code teilen sich also EINEN Kanal — und der zuerst abgebaute
  // ruft `removeChannel` darauf und reisst den anderen mit. Beim Routenwechsel
  // ueberlappen beide waehrend der Seiten-Animation; der Fernseher faellt dann
  // still tot um. Deshalb: durchreichen statt aufmachen.
  if (outer) return <>{children}</>;
  return (
    <TVBroadcastRoot sessionCode={sessionCode} showConnectButton={showConnectButton}>
      {children}
    </TVBroadcastRoot>
  );
}

function TVBroadcastRoot({ children, sessionCode, showConnectButton }: Props) {
  const tv = useTVBroadcast(sessionCode);

  return (
    <TVCtx.Provider value={tv}>
      {children}
      {/* Die schwebende Pille gehoert nicht auf jeden Bildschirm. Seit der
          Provider ueber der gesamten App haengt, entscheidet der Aufrufer. */}
      {showConnectButton && (
        <TVConnectButton tvCode={tv.displayCode} isActive={tv.isActive} onActivate={tv.activate} />
      )}
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
