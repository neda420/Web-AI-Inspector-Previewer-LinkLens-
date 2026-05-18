import type { SafetyRisk } from "@/lib/types";

const riskClassByLevel: Record<SafetyRisk, string> = {
  safe: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-rose-50 text-rose-700 border-rose-200",
};

type TrustScoreBadgeProps = {
  trustScore: number;
  risk: SafetyRisk;
};

export function TrustScoreBadge({ trustScore, risk }: TrustScoreBadgeProps) {
  return (
    <div className={`inline-flex items-center rounded-lg border px-3 py-2 text-sm ${riskClassByLevel[risk]}`}>
      Trust Score: {trustScore.toFixed(1)}/5 · Risk: {risk}
    </div>
  );
}
