import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useAdmin } from "@/hooks/useAdmin";
import PageLoader from "@/components/ui/PageLoader";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuthContext();
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  if (authLoading || adminLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
