import { useSyncExternalStore, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
// Synthetic auth for Party-Play QA; the harness signs in/out via window.partyQAAuth (A03).
let version = 0;
const subscribe = (fn: () => void) => supabase.auth.onAuthStateChange(() => { version++; fn(); }).data.subscription.unsubscribe;
const value = () => {
  const user = window.controllerIdentity ?? null;
  return { user, session: user ? { user } : null, isLoading: false, isAuthenticated: !!user, isPremium: true, planType: 'lifetime',
    subscriptionLoading: false, syncSubscription: async () => {}, signOut: async () => supabase.auth.signOut() };
};
let cached = { version: -1, value: value() };
const snapshot = () => { if (cached.version !== version) cached = { version, value: value() }; return cached.value; };
export const useAuthContext = () => useSyncExternalStore(subscribe, snapshot, snapshot);
export const useOptionalAuthContext = useAuthContext;
export const AuthProvider = ({ children }: { children: ReactNode }) => <>{children}</>;
