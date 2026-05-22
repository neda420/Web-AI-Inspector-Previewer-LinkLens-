import type { SafetyRisk } from "@/lib/types";

const riskClassByLevel: Record<SafetyRisk, string> = {
  safe: "bg-emerald-500/10 text-emerald-200 border-emerald-500/40",
  medium: "bg-amber-500/10 text-amber-200 border-amber-500/40",
  high: "bg-rose-500/10 text-rose-200 border-rose-500/40",
};

type TrustScoreBadgeProps = {
  trustScore: number;
  risk: SafetyRisk;
};

export function TrustScoreBadge({ trustScore, risk }: TrustScoreBadgeProps) {
  return (
    <div className={`inline-flex items-center rounded-lg border px-3 py-2 text-sm ${riskClassByLevel[risk]}`}>
      Trust Score: {trustScore.toFixed(1)}/5 · Risk: {risk.toUpperCase()}
    </div>
  );
}
