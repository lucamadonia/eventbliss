import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Mail, Lock, CheckCircle } from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { createPasswordSchema } from "@/lib/password-validation";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const registerSchema = z.object({
    email: z.string().email(t('auth.invalidEmail')),
    password: createPasswordSchema(t),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth.passwordsMismatch'),
    path: ["confirmPassword"],
  });

  type RegisterFormValues = z.infer<typeof registerSchema>;

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(data.email, data.password);
      
      if (error) {
        if (error.message.includes("already registered")) {
          toast.error(t('auth.emailAlreadyRegistered'));
          onSwitchToLogin();
        } else {
          toast.error(error.message || t('auth.registrationFailed'));
        }
        return;
      }

      setIsSuccess(true);
      toast.success(t('auth.registrationSuccessRedirect'));
    } catch (err) {
      toast.error(t('auth.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-redirect after successful registration
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => {
      navigate("/", { replace: true });
    }, 2000);
    return () => clearTimeout(timer);
  }, [isSuccess]);

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {t('auth.registrationSuccessTitle')}
        </h3>
        <p className="text-muted-foreground">
          {t('auth.redirecting')}
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.email')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.password')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder={t('auth.minCharsPlaceholder')}
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <PasswordStrengthIndicator password={field.value} />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.confirmPassword')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder={t('auth.repeatPassword')}
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('auth.registering')}
            </>
          ) : (
            t('auth.register')
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t('auth.alreadyRegistered')}{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-primary hover:underline font-medium"
          >
            {t('auth.loginNow')}
          </button>
        </p>
      </form>
    </Form>
  );
}
