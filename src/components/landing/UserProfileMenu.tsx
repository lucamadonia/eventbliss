import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Settings, LogOut, Calendar, Crown, ShieldCheck, CreditCard, Loader2, Building2 } from "lucide-react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function UserProfileMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut, isPremium, planType } = useAuthContext();
  const { isAdmin } = useAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true);
    const popup = window.open("about:blank", "_blank");
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        popup!.location.href = data.url;
      } else {
        popup?.close();
        toast.error(t("premium.portalError"));
      }
    } catch (err) {
      console.error("Error opening customer portal:", err);
      popup?.close();
      toast.error(t("premium.portalError"));
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error(t("common.error"));
    } else {
      toast.success(t("auth.logoutSuccess"));
      navigate("/");
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  if (!user) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <Avatar className="h-9 w-9 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(user.email || "U")}
            </AvatarFallback>
          </Avatar>
          {isPremium && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-amber-500 hover:bg-amber-500 border-2 border-background"
              title={planType === "lifetime" ? "Lifetime" : planType === "yearly" ? "Yearly" : "Premium"}
            >
              <Crown className="h-3 w-3 text-white" />
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{t("profile.account")}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => navigate("/my-events")}
          className="cursor-pointer"
        >
          <Calendar className="mr-2 h-4 w-4" />
          {t("profile.myEvents")}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate("/settings")}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          {t("profile.settings")}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate("/premium")}
          className="cursor-pointer"
        >
          <Crown className="mr-2 h-4 w-4" />
          {t("profile.premium")}
        </DropdownMenuItem>
        {isPremium && planType !== "lifetime" && (
          <DropdownMenuItem 
            onClick={handleManageSubscription}
            className="cursor-pointer"
            disabled={isLoadingPortal}
          >
            {isLoadingPortal ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            {t("premium.manageSubscription")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => navigate("/agency/pricing")}
          className="cursor-pointer"
        >
          <Building2 className="mr-2 h-4 w-4" />
          {t("profile.becomeAgency", "Für Agenturen")}
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem
            onClick={() => navigate("/admin")}
            className="cursor-pointer"
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            {t("profile.adminArea")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("auth.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
