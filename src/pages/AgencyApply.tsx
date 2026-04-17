import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Percent, 
  Building2, 
  Ticket, 
  HeadphonesIcon,
  Users,
  TrendingUp,
  Euro,
  CheckCircle2,
  Sparkles,
  MapPin,
  Search,
  PlusCircle
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { AGENCIES, type Agency } from "@/lib/agencies-data";
import { getLocalizedCountriesWithPriority } from "@/lib/countries";

const formSchema = z.object({
  agency_mode: z.enum(["existing", "new"]),
  existing_agency_id: z.string().optional(),
  new_agency_name: z.string().optional(),
  new_agency_city: z.string().optional(),
  new_agency_country: z.string().optional(),
  contact_email: z.string().email("Ungültige E-Mail-Adresse"),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  motivation: z.string().min(20, "Bitte beschreibe deine Motivation (mind. 20 Zeichen)"),
  expected_referrals: z.string().optional(),
  payout_method: z.enum(["bank_transfer", "paypal"]),
  privacy_accepted: z.boolean().refine((val) => val === true, "Du musst die Datenschutzerklärung akzeptieren"),
}).refine((data) => {
  if (data.agency_mode === "existing") {
    return !!data.existing_agency_id;
  } else {
    return !!data.new_agency_name && !!data.new_agency_city && !!data.new_agency_country;
  }
}, {
  message: "Bitte wähle eine Agentur oder gib die Daten für eine neue Agentur ein",
  path: ["existing_agency_id"],
});

type FormData = z.infer<typeof formSchema>;

// Country Select Field Component
function CountrySelectField({ form }: { form: ReturnType<typeof useForm<FormData>> }) {
  const { t, i18n } = useTranslation();
  const countries = useMemo(() => getLocalizedCountriesWithPriority(i18n.language), [i18n.language]);
  
  return (
    <FormField
      control={form.control}
      name="new_agency_country"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("agencyApply.form.country", "Land")} *</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <ScrollArea className="h-[300px]">
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.name}>
                    {country.name}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default function AgencyApply() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Check for invite token from outreach email → pre-fill from agency_directory
  const [inviteData, setInviteData] = useState<{
    name: string; email: string; city: string; country: string; website: string; directoryId: number;
  } | null>(null);
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("invite");
    if (!token) return;
    (async () => {
      const { data } = await (supabase.from as any)("agency_directory")
        .select("id, name, email, city, country, website")
        .eq("invite_token", token)
        .maybeSingle();
      if (data) {
        setInviteData({
          name: data.name, email: data.email, city: data.city,
          country: data.country, website: data.website || "", directoryId: data.id,
        });
      }
    })();
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agency_mode: "existing",
      existing_agency_id: "",
      new_agency_name: "",
      new_agency_city: "",
      new_agency_country: "Deutschland",
      contact_email: "",
      phone: "",
      website: "",
      motivation: "",
      expected_referrals: "",
      payout_method: "bank_transfer",
      privacy_accepted: false,
    },
  });

  // Pre-fill form when invite data loads
  const hasAppliedInvite = useState(false);
  if (inviteData && !hasAppliedInvite[0]) {
    hasAppliedInvite[1](true);
    form.setValue("agency_mode", "new");
    form.setValue("new_agency_name", inviteData.name);
    form.setValue("new_agency_city", inviteData.city);
    form.setValue("new_agency_country", inviteData.country);
    form.setValue("contact_email", inviteData.email);
    form.setValue("website", inviteData.website);
  }

  const agencyMode = form.watch("agency_mode");
  const selectedAgencyId = form.watch("existing_agency_id");

  const filteredAgencies = useMemo(() => {
    if (!searchQuery) return AGENCIES.slice(0, 20);
    const query = searchQuery.toLowerCase();
    return AGENCIES.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.city.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [searchQuery]);

  const selectedAgency = useMemo(() => {
    return AGENCIES.find((a) => a.id.toString() === selectedAgencyId);
  }, [selectedAgencyId]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      let agencyData: {
        agency_id: string;
        agency_name: string;
        agency_city: string;
        agency_country: string;
      };

      if (data.agency_mode === "existing" && selectedAgency) {
        agencyData = {
          agency_id: selectedAgency.id.toString(),
          agency_name: selectedAgency.name,
          agency_city: selectedAgency.city,
          agency_country: selectedAgency.country,
        };
      } else {
        // Generate a unique ID for new agencies
        agencyData = {
          agency_id: `new-${Date.now()}`,
          agency_name: data.new_agency_name!,
          agency_city: data.new_agency_city!,
          agency_country: data.new_agency_country!,
        };
      }

      const { error } = await supabase.from("agency_affiliates" as never).insert({
        ...agencyData,
        contact_email: data.contact_email,
        commission_rate: 10,
        commission_type: "percentage",
        status: "pending",
        is_verified: false,
      } as never);

      if (error) throw error;

      // If this came from an outreach invite, mark the directory entry as onboarded
      if (inviteData?.directoryId) {
        await (supabase.from as any)("agency_directory")
          .update({ outreach_status: "onboarded" })
          .eq("id", inviteData.directoryId);
        await (supabase.from as any)("agency_outreach_activity").insert({
          directory_id: inviteData.directoryId,
          action: "link_clicked",
          details: { source: "agency_apply_form" },
        });
      }

      setIsSubmitted(true);
    } catch (error: unknown) {
      console.error("Error submitting application:", error);
      toast.error(t("agencyApply.errors.submitFailed", "Fehler beim Einreichen der Bewerbung") as string);
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: Percent,
      title: t("agencyApply.benefits.commission.title", "Attraktive Provisionen"),
      description: t("agencyApply.benefits.commission.description", "Bis zu 20% pro Buchung über deine Empfehlung"),
    },
    {
      icon: Building2,
      title: t("agencyApply.benefits.tracking.title", "Referenz-Tracking"),
      description: t("agencyApply.benefits.tracking.description", "Automatische Zuordnung per eindeutigem Code"),
    },
    {
      icon: Ticket,
      title: t("agencyApply.benefits.vouchers.title", "Exklusive Voucher"),
      description: t("agencyApply.benefits.vouchers.description", "Spezielle Rabatt-Codes für deine Kunden"),
    },
    {
      icon: HeadphonesIcon,
      title: t("agencyApply.benefits.support.title", "Partner-Support"),
      description: t("agencyApply.benefits.support.description", "Dedizierter Ansprechpartner für alle Fragen"),
    },
  ];

  const stats = [
    { icon: Building2, value: "100+", label: t("agencyApply.stats.agencies", "Partner-Agenturen") },
    { icon: TrendingUp, value: "20%", label: t("agencyApply.stats.commissionRate", "Max. Provision") },
    { icon: Euro, value: "30K€+", label: t("agencyApply.stats.payouts", "Ausgezahlt") },
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
                  {t("agencyApply.success.title", "Bewerbung eingereicht!")}
                </h1>
                <p className="text-muted-foreground mb-4">
                  {t("agencyApply.success.description", "Vielen Dank für dein Interesse an einer Partnerschaft.")}
                </p>
                <p className="text-sm text-muted-foreground mb-8">
                  {t("agencyApply.success.nextSteps", "Wir prüfen deine Bewerbung und melden uns innerhalb von 48 Stunden.")}
                </p>
                <Button onClick={() => navigate("/agency?welcome=1")} size="lg">
                  {t("agencyApply.success.goToDashboard", "Zum Agency Dashboard")}
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
                {t("agencyApply.hero.badge", "Agentur-Partnerschaft")}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
                {t("agencyApply.hero.title", "Werde EventBliss-Partner")}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t("agencyApply.hero.description", "Verdiene Provisionen für jeden Kunden, den du zu EventBliss bringst. Exklusive Vorteile für JGA-Agenturen.")}
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
                  {t("agencyApply.form.title", "Jetzt bewerben")}
                </h2>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Agency Selection Mode */}
                    <FormField
                      control={form.control}
                      name="agency_mode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("agencyApply.form.agencyMode", "Agentur-Typ")} *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="existing">
                                <div className="flex items-center gap-2">
                                  <Search className="h-4 w-4" />
                                  {t("agencyApply.form.existingAgency", "Agentur aus Verzeichnis wählen")}
                                </div>
                              </SelectItem>
                              <SelectItem value="new">
                                <div className="flex items-center gap-2">
                                  <PlusCircle className="h-4 w-4" />
                                  {t("agencyApply.form.newAgency", "Neue Agentur registrieren")}
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Existing Agency Search */}
                    {agencyMode === "existing" && (
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={t("agencyApply.form.searchAgency", "Agentur suchen...") as string}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="existing_agency_id"
                          render={({ field }) => (
                            <FormItem>
                              <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-2">
                                {filteredAgencies.map((agency) => (
                                  <button
                                    key={agency.id}
                                    type="button"
                                    onClick={() => {
                                      field.onChange(agency.id.toString());
                                      form.setValue("contact_email", agency.email || "");
                                    }}
                                    className={`w-full text-left p-3 rounded-md transition-colors ${
                                      field.value === agency.id.toString()
                                        ? "bg-primary/10 border-primary border"
                                        : "hover:bg-muted border border-transparent"
                                    }`}
                                  >
                                    <div className="font-medium text-sm">{agency.name}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {agency.city}, {agency.country}
                                    </div>
                                  </button>
                                ))}
                                {filteredAgencies.length === 0 && (
                                  <div className="text-center py-4 text-muted-foreground text-sm">
                                    {t("agencyApply.form.noAgenciesFound", "Keine Agenturen gefunden")}
                                  </div>
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* New Agency Form */}
                    {agencyMode === "new" && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                        <FormField
                          control={form.control}
                          name="new_agency_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("agencyApply.form.agencyName", "Agenturname")} *</FormLabel>
                              <FormControl>
                                <Input placeholder="z.B. JGA Events Berlin" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="new_agency_city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("agencyApply.form.city", "Stadt")} *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Berlin" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <CountrySelectField form={form} />
                        </div>
                      </div>
                    )}

                    {/* Contact Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contact_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("agencyApply.form.contactEmail", "Kontakt-Email")} *</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="partner@agentur.de"
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
                            <FormLabel>{t("agencyApply.form.phone", "Telefon")}</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="+49 30 12345678"
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
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("agencyApply.form.website", "Website")}</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://www.deine-agentur.de"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="motivation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("agencyApply.form.motivation", "Warum möchtest du Partner werden?")} *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("agencyApply.form.motivationPlaceholder", "Erzähle uns von deiner Agentur und warum eine Partnerschaft für beide Seiten vorteilhaft wäre...") as string}
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="expected_referrals"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("agencyApply.form.expectedReferrals", "Erwartete monatliche Empfehlungen")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("agencyApply.form.selectOption", "Bitte wählen")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1-5">1-5</SelectItem>
                                <SelectItem value="6-15">6-15</SelectItem>
                                <SelectItem value="16-30">16-30</SelectItem>
                                <SelectItem value="30+">30+</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="payout_method"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("agencyApply.form.payoutMethod", "Bevorzugte Auszahlung")} *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="bank_transfer">{t("agencyApply.form.bankTransfer", "Banküberweisung")}</SelectItem>
                                <SelectItem value="paypal">PayPal</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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
                              {t("agencyApply.form.privacy", "Ich akzeptiere die")}{" "}
                              <Link to="/legal/privacy" className="text-primary hover:underline">
                                {t("landing.footer.privacy", "Datenschutzerklärung")}
                              </Link>{" "}
                              &{" "}
                              <Link to="/legal/terms" className="text-primary hover:underline">
                                {t("landing.footer.terms", "AGB")}
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
                      {isSubmitting ? t("agencyApply.form.submitting", "Wird eingereicht...") : t("agencyApply.form.submit", "Bewerbung einreichen")}
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
