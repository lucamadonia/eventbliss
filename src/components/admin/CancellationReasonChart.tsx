import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Human-readable labels for the check-constrained reason codes from the
// migration. Keeping this map client-side avoids a second DB round-trip;
// if new codes are added, they fall back to the raw code string.
const REASON_LABELS: Record<string, string> = {
  agency_unavailable: "Agentur nicht verfügbar",
  agency_staff_shortage: "Personalmangel",
  agency_weather: "Wetter",
  agency_other: "Sonstiges (Agentur)",
  customer_changed_mind: "Kunde – Meinung geändert",
  customer_unreachable: "Kunde – nicht erreichbar",
  customer_no_show: "Kunde – nicht erschienen",
  platform_policy: "Plattform-Policy",
  platform_fraud_suspected: "Betrugsverdacht",
  system_payment_timeout: "Zahlungs-Timeout",
  system_duplicate: "Duplikat",
};

interface ReasonRow {
  reason_code: string;
  count: number;
}

async function fetchAgencyCancellationReasons(): Promise<ReasonRow[]> {
  // We intentionally pull the raw rows (bounded by the 30d window on the client
  // via filter) because Supabase's JS client lacks server-side GROUP BY; the
  // row count should remain small (<500) given realistic storno volume.
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await (supabase.from as any)(
    "marketplace_booking_cancellations",
  )
    .select("reason_code")
    .eq("cancelled_by", "agency")
    .gte("created_at", since);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as Array<{ reason_code: string }>) {
    counts.set(row.reason_code, (counts.get(row.reason_code) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([reason_code, count]) => ({ reason_code, count }))
    .sort((a, b) => b.count - a.count);
}

export function CancellationReasonChart() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-cancellation-reasons-30d"],
    queryFn: fetchAgencyCancellationReasons,
    staleTime: 60_000,
  });

  const chartData = (data ?? []).map((r) => ({
    label: REASON_LABELS[r.reason_code] ?? r.reason_code,
    value: r.count,
  }));

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Top-Storno-Gründe (30 Tage, Agentur-seitig)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            Gründe konnten nicht geladen werden.
          </p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Keine Agentur-Stornos in den letzten 30 Tagen.
          </p>
        ) : (
          <div className="h-56 w-full" role="img" aria-label="Balkendiagramm der Top-Storno-Gründe">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={140}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [v, "Anzahl"]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={idx === 0 ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CancellationReasonChart;
