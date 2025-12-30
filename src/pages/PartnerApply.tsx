import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Percent, 
  BarChart3, 
  Wallet, 
  HeadphonesIcon,
  Users,
  TrendingUp,
  Euro,
  ArrowLeft,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { GlassCard } from "@/components/ui/GlassCard";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Link } from "react-router-dom";

const formSchema = z.object({
  company_name: z.string().optional(),
  contact_name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  tax_id: z.string().optional(),
  notes: z.string().optional(),
  promotion_method: z.string().min(10, "Please describe how you plan to promote"),
  privacy_accepted: z.boolean().refine((val) => val === true, "You must accept the privacy policy"),
});

type FormData = z.infer<typeof formSchema>;

export default function PartnerApply() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: "",
      contact_name: "",
      email: "",
      phone: "",
      website: "",
      tax_id: "",
      notes: "",
      promotion_method: "",
      privacy_accepted: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("affiliates").insert([
        {
          company_name: data.company_name || null,
          contact_name: data.contact_name,
          email: data.email,
          phone: data.phone || null,
          website: data.website || null,
          tax_id: data.tax_id || null,
          notes: `${data.notes || ""}\n\nPromotion Method: ${data.promotion_method}`.trim(),
          status: "pending" as const,
        },
      ]);

      if (error) throw error;
      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error(t("partnerApply.errors.submitFailed") as string);
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: Percent,
      title: t("partnerApply.benefits.commission.title"),
      description: t("partnerApply.benefits.commission.description"),
    },
    {
      icon: BarChart3,
      title: t("partnerApply.benefits.tracking.title"),
      description: t("partnerApply.benefits.tracking.description"),
    },
    {
      icon: Wallet,
      title: t("partnerApply.benefits.payouts.title"),
      description: t("partnerApply.benefits.payouts.description"),
    },
    {
      icon: HeadphonesIcon,
      title: t("partnerApply.benefits.support.title"),
      description: t("partnerApply.benefits.support.description"),
    },
  ];

  const stats = [
    { icon: Users, value: "100+", label: t("partnerApply.stats.partners") },
    { icon: TrendingUp, value: "25%", label: t("partnerApply.stats.commissionRate") },
    { icon: Euro, value: "50K€+", label: t("partnerApply.stats.payouts") },
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="pt-32 pb-24">
          <div className="container max-w-2xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <GlassCard className="p-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </motion.div>
                <h1 className="text-3xl font-display font-bold mb-4">
                  {t("partnerApply.success.title")}
                </h1>
                <p className="text-muted-foreground mb-4">
                  {t("partnerApply.success.description")}
                </p>
                <p className="text-sm text-muted-foreground mb-8">
                  {t("partnerApply.success.nextSteps")}
                </p>
                <Button onClick={() => navigate("/")} size="lg">
                  {t("partnerApply.success.backToHome")}
                </Button>
              </GlassCard>
            </motion.div>
          </div>
        </main>
        <LandingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      
      <main className="pt-24 pb-24">
        {/* Hero Section */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container max-w-6xl mx-auto px-4 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                {t("partnerApply.hero.badge")}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
                {t("partnerApply.hero.title")}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t("partnerApply.hero.description")}
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-16"
            >
              {stats.map((stat, index) => (
                <GlassCard
                  key={index}
                  className="p-6 text-center"
                >
                  <stat.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
                </GlassCard>
              ))}
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
            >
              {benefits.map((benefit, index) => (
                <GlassCard
                  key={index}
                  className="p-6 text-center hover:border-primary/50 transition-colors"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </GlassCard>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-8">
          <div className="container max-w-2xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard className="p-8">
                <h2 className="text-2xl font-display font-bold mb-6 text-center">
                  {t("partnerApply.form.title")}
                </h2>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="company_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("partnerApply.form.companyName")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("partnerApply.form.companyNamePlaceholder") as string}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contact_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("partnerApply.form.contactName")} *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("partnerApply.form.contactNamePlaceholder") as string}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("partnerApply.form.email")} *</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder={t("partnerApply.form.emailPlaceholder") as string}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("partnerApply.form.phone")}</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder={t("partnerApply.form.phonePlaceholder") as string}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("partnerApply.form.website")}</FormLabel>
                            <FormControl>
                              <Input
                                type="url"
                                placeholder={t("partnerApply.form.websitePlaceholder") as string}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tax_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("partnerApply.form.taxId")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("partnerApply.form.taxIdPlaceholder") as string}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("partnerApply.form.about")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("partnerApply.form.aboutPlaceholder") as string}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="promotion_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("partnerApply.form.promotion")} *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("partnerApply.form.promotionPlaceholder") as string}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="privacy_accepted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal">
                              {t("partnerApply.form.privacy")}{" "}
                              <Link to="/legal/privacy" className="text-primary hover:underline">
                                {t("landing.footer.privacy")}
                              </Link>{" "}
                              &{" "}
                              <Link to="/legal/terms" className="text-primary hover:underline">
                                {t("landing.footer.terms")}
                              </Link>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? t("partnerApply.form.submitting") : t("partnerApply.form.submit")}
                    </Button>
                  </form>
                </Form>
              </GlassCard>
            </motion.div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
