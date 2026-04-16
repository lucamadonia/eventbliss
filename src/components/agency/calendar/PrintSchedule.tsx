import type { MarketplaceBooking } from "@/hooks/useMarketplaceBookings";

function formatEUR(cents: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
}

interface PrintProps {
  title: string;
  subtitle?: string;
  filterSummary?: string;
  bookings: MarketplaceBooking[];
  groupBy?: "none" | "guide" | "day";
  agencyName?: string;
}

/**
 * Print-only schedule. Hidden on screen via @media screen { display: none }.
 * When user clicks "Drucken" in toolbar, window.print() is called and this
 * component becomes the only visible content.
 */
export function PrintSchedule({
  title, subtitle, filterSummary, bookings, groupBy = "none", agencyName,
}: PrintProps) {
  const sorted = [...bookings].sort((a, b) => {
    const dateCmp = (a.booking_date || "").localeCompare(b.booking_date || "");
    if (dateCmp !== 0) return dateCmp;
    return (a.booking_time || "").localeCompare(b.booking_time || "");
  });

  let groups: Array<{ label: string; items: MarketplaceBooking[] }>;
  if (groupBy === "guide") {
    const m = new Map<string, MarketplaceBooking[]>();
    sorted.forEach((b) => {
      const name = (b as unknown as { assigned_guide_name?: string | null }).assigned_guide_name ?? "— Nicht zugewiesen —";
      const list = m.get(name) ?? [];
      list.push(b);
      m.set(name, list);
    });
    groups = Array.from(m, ([label, items]) => ({ label, items })).sort((a, b) => a.label.localeCompare(b.label));
  } else if (groupBy === "day") {
    const m = new Map<string, MarketplaceBooking[]>();
    sorted.forEach((b) => {
      const list = m.get(b.booking_date) ?? [];
      list.push(b);
      m.set(b.booking_date, list);
    });
    groups = Array.from(m, ([label, items]) => ({ label: formatDate(label), items }));
  } else {
    groups = [{ label: "", items: sorted }];
  }

  return (
    <>
      <style>{`
        @media screen {
          .print-only-schedule { display: none; }
        }
        @media print {
          body * { visibility: hidden; }
          .print-only-schedule, .print-only-schedule * { visibility: visible; }
          .print-only-schedule { position: absolute; left: 0; top: 0; width: 100%; color: #000; background: #fff; }
          .page-break { page-break-before: always; }
          .no-print { display: none !important; }
          @page { size: A4 landscape; margin: 12mm; }
        }
      `}</style>
      <div className="print-only-schedule p-8">
        <header className="mb-6 border-b-2 border-black pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-black text-black">{title}</h1>
              {subtitle && <div className="text-sm text-gray-700 mt-1">{subtitle}</div>}
            </div>
            <div className="text-right text-xs text-gray-700">
              <div className="font-bold">{agencyName ?? "EventBliss Agency"}</div>
              <div>Gedruckt: {new Date().toLocaleString("de-DE")}</div>
              <div>{sorted.length} Termine</div>
            </div>
          </div>
          {filterSummary && (
            <div className="mt-3 text-xs text-gray-600 italic">
              Filter: {filterSummary}
            </div>
          )}
        </header>

        {groups.map((group, gi) => (
          <section key={group.label || gi} className={gi > 0 && groupBy === "guide" ? "page-break mt-8" : "mb-8"}>
            {group.label && (
              <h2 className="text-lg font-bold text-black mb-3 border-b border-gray-400 pb-1">
                {group.label}
              </h2>
            )}
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-black text-left">
                  <th className="py-2 pr-2">Datum</th>
                  <th className="py-2 pr-2">Zeit</th>
                  <th className="py-2 pr-2">Service</th>
                  <th className="py-2 pr-2">Kunde</th>
                  <th className="py-2 pr-2 text-center">TN</th>
                  <th className="py-2 pr-2">Guide</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2 text-right">Betrag</th>
                  <th className="py-2 pr-2">Notizen</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((b) => {
                  const guideName = (b as unknown as { assigned_guide_name?: string | null }).assigned_guide_name;
                  return (
                    <tr key={b.id} className="border-b border-gray-300 align-top">
                      <td className="py-1.5 pr-2 whitespace-nowrap">{formatDate(b.booking_date)}</td>
                      <td className="py-1.5 pr-2 whitespace-nowrap font-mono">{b.booking_time?.slice(0, 5)}</td>
                      <td className="py-1.5 pr-2 font-semibold">{b.service_title || "—"}</td>
                      <td className="py-1.5 pr-2">
                        <div>{b.customer_name}</div>
                        <div className="text-gray-600 text-[10px]">
                          {b.customer_email}{b.customer_phone ? ` · ${b.customer_phone}` : ""}
                        </div>
                      </td>
                      <td className="py-1.5 pr-2 text-center">{b.participant_count}</td>
                      <td className="py-1.5 pr-2">{guideName ?? "—"}</td>
                      <td className="py-1.5 pr-2">{b.status}</td>
                      <td className="py-1.5 pr-2 text-right font-mono">{formatEUR(b.total_price_cents)}</td>
                      <td className="py-1.5 pr-2 text-gray-700 text-[10px]">
                        {b.customer_notes ?? ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ))}

        <footer className="mt-8 pt-3 border-t border-gray-400 text-[10px] text-gray-500 text-center">
          {agencyName ?? "EventBliss"} · Gedruckt über event-bliss.com
        </footer>
      </div>
    </>
  );
}
