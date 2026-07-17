import type { SafetyFlags } from "@/lib/types";

function safetyToScore(flags: SafetyFlags): number {
  switch (flags.risk) {
    case "high":
      return 1;
    case "medium":
      return 2.5;
    default:
      return 5;
  }
}

export function computeTrustScore(averageRating: number, safetyFlags: SafetyFlags): number {
  const safetyScore = safetyToScore(safetyFlags);
  if (averageRating <= 0) {
    return Number(safetyScore.toFixed(2));
  }
  return Number((0.7 * averageRating + 0.3 * safetyScore).toFixed(2));
}
