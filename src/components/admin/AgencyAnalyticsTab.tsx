import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, Phone, Mail, Globe, TrendingUp, Users, 
  MapPin, BarChart3, PieChart as PieChartIcon, Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface Interaction {
  id: string;
  agency_id: string;
  agency_name: string;
  interaction_type: string;
  created_at: string;
  metadata: { city?: string; country?: string } | null;
  ref_code: string | null;
  converted: boolean | null;
}

interface StatsData {
  total: number;
  phone: number;
  email: number;
  website: number;
  conversions: number;
}

const COLORS = {
  phone: "hsl(var(--success))",
  email: "hsl(var(--accent))",
  website: "hsl(var(--primary))",
};

const AgencyAnalyticsTab = () => {
  const { t } = useTranslation();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [stats, setStats] = useState<StatsData>({ total: 0, phone: 0, email: 0, website: 0, conversions: 0 });

  useEffect(() => {
    fetchInteractions();
  }, [timeRange]);

  const fetchInteractions = async () => {
    setIsLoading(true);
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      const { data, error } = await supabase
        .from("agency_interactions")
        .select("*")
        .gte("created_at", daysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const typedData = (data || []) as Interaction[];
      setInteractions(typedData);

      // Calculate stats
      const phoneCount = typedData.filter(i => i.interaction_type === "phone").length;
      const emailCount = typedData.filter(i => i.interaction_type === "email").length;
      const websiteCount = typedData.filter(i => i.interaction_type === "website").length;
      const conversionCount = typedData.filter(i => i.converted).length;

      setStats({
        total: typedData.length,
        phone: phoneCount,
        email: emailCount,
        website: websiteCount,
        conversions: conversionCount,
      });
    } catch (error) {
      console.error("Error fetching interactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare chart data
  const pieData = [
    { name: t("admin.agencyAnalytics.phone", "Telefon"), value: stats.phone, color: COLORS.phone },
    { name: t("admin.agencyAnalytics.email", "Email"), value: stats.email, color: COLORS.email },
    { name: t("admin.agencyAnalytics.website", "Website"), value: stats.website, color: COLORS.website },
  ].filter(d => d.value > 0);

  // Group by city
  const cityData = interactions.reduce((acc, interaction) => {
    const city = (interaction.metadata?.city as string) || t("admin.agencyAnalytics.unknown", "Unbekannt");
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const cityChartData = Object.entries(cityData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Group by agency
  const agencyData = interactions.reduce((acc, interaction) => {
    const name = interaction.agency_name;
    if (!acc[name]) {
      acc[name] = { phone: 0, email: 0, website: 0, total: 0 };
    }
    acc[name][interaction.interaction_type as keyof typeof acc[string]]++;
    acc[name].total++;
    return acc;
  }, {} as Record<string, { phone: number; email: number; website: number; total: number }>);

  const topAgencies = Object.entries(agencyData)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Timeline data (last 30 days)
  const timelineData = (() => {
    const days: Record<string, { date: string; phone: number; email: number; website: number }> = {};
    const now = new Date();
    
    for (let i = parseInt(timeRange) - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split("T")[0];
      days[key] = { date: key, phone: 0, email: 0, website: 0 };
    }

    interactions.forEach(interaction => {
      const date = interaction.created_at.split("T")[0];
      if (days[date]) {
        days[date][interaction.interaction_type as "phone" | "email" | "website"]++;
      }
    });

    return Object.values(days).slice(-14); // Last 14 days for chart
  })();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {t("admin.agencyAnalytics.title", "Agentur-Analytics")}
          </h2>
          <p className="text-muted-foreground">
            {t("admin.agencyAnalytics.description", "Übersicht aller Agentur-Interaktionen")}
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{t("admin.agencyAnalytics.last7days", "Letzte 7 Tage")}</SelectItem>
            <SelectItem value="30">{t("admin.agencyAnalytics.last30days", "Letzte 30 Tage")}</SelectItem>
            <SelectItem value="90">{t("admin.agencyAnalytics.last90days", "Letzte 90 Tage")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">{t("admin.agencyAnalytics.totalInteractions", "Gesamt")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Phone className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.phone}</p>
                <p className="text-xs text-muted-foreground">{t("admin.agencyAnalytics.calls", "Anrufe")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Mail className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.email}</p>
                <p className="text-xs text-muted-foreground">{t("admin.agencyAnalytics.emails", "Emails")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.website}</p>
                <p className="text-xs text-muted-foreground">{t("admin.agencyAnalytics.websiteClicks", "Websites")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Users className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.email > 0 ? Math.round((stats.conversions / stats.email) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">{t("admin.agencyAnalytics.conversionRate", "Konversionen")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Interactions by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChartIcon className="h-5 w-5" />
              {t("admin.agencyAnalytics.byType", "Nach Interaktionstyp")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                {t("admin.agencyAnalytics.noData", "Keine Daten vorhanden")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart - Interactions by City */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" />
              {t("admin.agencyAnalytics.byCity", "Nach Stadt")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={cityChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                {t("admin.agencyAnalytics.noData", "Keine Daten vorhanden")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            {t("admin.agencyAnalytics.timeline", "Zeitverlauf")}
          </CardTitle>
          <CardDescription>
            {t("admin.agencyAnalytics.timelineDesc", "Interaktionen der letzten 14 Tage")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getDate()}.${date.getMonth() + 1}`;
                }}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString();
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="phone" 
                name={t("admin.agencyAnalytics.phone", "Telefon")}
                stroke={COLORS.phone} 
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="email" 
                name={t("admin.agencyAnalytics.email", "Email")}
                stroke={COLORS.email} 
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="website" 
                name={t("admin.agencyAnalytics.website", "Website")}
                stroke={COLORS.website} 
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Agencies Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            {t("admin.agencyAnalytics.topAgencies", "Top Agenturen")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topAgencies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">#</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      {t("admin.agencyAnalytics.agency", "Agentur")}
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                      <Phone className="h-4 w-4 inline" />
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                      <Mail className="h-4 w-4 inline" />
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                      <Globe className="h-4 w-4 inline" />
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      {t("admin.agencyAnalytics.total", "Gesamt")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topAgencies.map((agency, index) => (
                    <tr key={agency.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2">
                        <Badge variant={index === 0 ? "default" : "secondary"} className="w-6 h-6 p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 font-medium">{agency.name}</td>
                      <td className="py-3 px-2 text-center">{agency.phone}</td>
                      <td className="py-3 px-2 text-center">{agency.email}</td>
                      <td className="py-3 px-2 text-center">{agency.website}</td>
                      <td className="py-3 px-2 text-right font-bold text-primary">{agency.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {t("admin.agencyAnalytics.noData", "Keine Daten vorhanden")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { AgencyAnalyticsTab };
