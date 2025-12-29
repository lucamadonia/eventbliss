import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Key, Shield } from "lucide-react";

interface ForcePasswordChangeProps {
  open: boolean;
  onPasswordChanged: () => void;
}

export function ForcePasswordChange({ open, onPasswordChanged }: ForcePasswordChangeProps) {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error(t("auth.passwordRequired", "Bitte füllen Sie beide Passwortfelder aus"));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t("auth.passwordTooShort", "Das Passwort muss mindestens 6 Zeichen haben"));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("auth.passwordMismatch", "Die Passwörter stimmen nicht überein"));
      return;
    }

    setIsLoading(true);

    try {
      // Update password in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (authError) {
        throw authError;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Update profile to set must_change_password = false
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ must_change_password: false })
          .eq("id", user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
          // Don't fail - password was changed successfully
        }
      }

      toast.success(t("auth.passwordChanged", "Passwort erfolgreich geändert"));
      onPasswordChanged();
    } catch (error: any) {
      console.error("Password change error:", error);
      toast.error(error.message || t("auth.passwordChangeError", "Fehler beim Ändern des Passworts"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t("auth.changePasswordTitle", "Passwort ändern erforderlich")}
          </DialogTitle>
          <DialogDescription>
            {t("auth.changePasswordDescription", "Aus Sicherheitsgründen müssen Sie Ihr Passwort ändern, bevor Sie fortfahren können.")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              {t("auth.newPassword", "Neues Passwort")}
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {t("auth.confirmPassword", "Passwort bestätigen")}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {t("auth.passwordRequirements", "Das Passwort muss mindestens 6 Zeichen lang sein.")}
          </p>
        </div>

        <Button 
          onClick={handleChangePassword} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {t("auth.changePassword", "Passwort ändern")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
