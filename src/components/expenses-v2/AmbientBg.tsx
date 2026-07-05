/**
 * AmbientBg — a calm, STATIC gradient backdrop for the Expenses module.
 *
 * Previously three large blur-3xl blobs animated forever + an SVG film grain;
 * on mobile that meant constant GPU repaints → visible lag. It is now a single
 * fixed, lightweight radial gradient (no animation, no blur layers, no grain),
 * so scrolling and sheets stay smooth. Tone shifts subtly with the balance.
 */
export function AmbientBg({ tone = "neutral" }: { tone?: "violet" | "emerald" | "rose" | "neutral" }) {
  const accent = {
    violet: "rgba(124, 92, 255, 0.10)",
    emerald: "rgba(47, 210, 122, 0.10)",
    rose: "rgba(255, 77, 109, 0.10)",
    neutral: "rgba(124, 92, 255, 0.06)",
  }[tone];

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: `radial-gradient(120% 80% at 50% -10%, ${accent}, transparent 60%)`,
      }}
    />
  );
}
