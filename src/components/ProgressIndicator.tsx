import { Users, Clock, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PARTICIPANTS } from "@/lib/constants";

interface ProgressIndicatorProps {
  responseCount: number;
  deadline?: string;
  lockedBlock?: { block: string; label: string };
}

const ProgressIndicator = ({ 
  responseCount, 
  deadline,
  lockedBlock 
}: ProgressIndicatorProps) => {
  const total = PARTICIPANTS.length;
  const percentage = Math.round((responseCount / total) * 100);

  return (
    <section className="container pb-8">
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 animate-slide-up delay-200">
        {/* Locked Block Banner */}
        {lockedBlock && (
          <div className="mb-4 p-3 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
            <div>
              <span className="font-medium text-success">Termin steht!</span>
              <span className="ml-2 text-sm text-foreground">{lockedBlock.label}</span>
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Antworten</span>
          </div>
          <span className="text-sm font-semibold text-primary">
            {responseCount} von {total}
          </span>
        </div>

        <Progress value={percentage} className="h-2 mb-2" />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{percentage}% haben geantwortet</span>
          {deadline && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Deadline: {deadline}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProgressIndicator;
