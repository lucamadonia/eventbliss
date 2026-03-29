import { useMemo } from "react";

interface SurveyDeadlineCountdownProps {
  deadline: string | null;
}

const SurveyDeadlineCountdown = ({
  deadline,
}: SurveyDeadlineCountdownProps) => {
  const remaining = useMemo(() => {
    if (!deadline) return null;
    const now = new Date();
    const end = new Date(deadline);
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return null;

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { days, hours, minutes, diffMs };
  }, [deadline]);

  if (!remaining) return null;

  const { days, hours, minutes, diffMs } = remaining;
  const isUrgent = diffMs < 24 * 60 * 60 * 1000;
  const isWarning = days >= 1 && days <= 7;

  const colorClass = isUrgent
    ? "text-red-400"
    : isWarning
      ? "text-amber-400"
      : "text-emerald-400";

  const dotColorClass = isUrgent
    ? "bg-red-400"
    : isWarning
      ? "bg-amber-400"
      : "bg-emerald-400";

  const label =
    days > 0
      ? `Noch ${days} ${days === 1 ? "Tag" : "Tage"}`
      : hours > 0
        ? `Noch ${hours}h ${minutes}m`
        : `Noch ${minutes} Min.`;

  return (
    <div
      className={`flex items-center gap-2 text-xs font-medium ${colorClass}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${dotColorClass} animate-pulse`}
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
};

export default SurveyDeadlineCountdown;
