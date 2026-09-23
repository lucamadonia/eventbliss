import type { ReactNode } from 'react';
export const useAuthContext = () => ({ user: window.controllerIdentity, session:{user:window.controllerIdentity}, isLoading:false,isAuthenticated:true,isPremium:true,planType:'lifetime',subscriptionLoading:false,syncSubscription:async()=>{},signOut:async()=>({error:null}) });
export const AuthProvider = ({children}:{children:ReactNode}) => <>{children}</>;
