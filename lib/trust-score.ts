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
  return Number((0.7 * averageRating + 0.3 * safetyToScore(safetyFlags)).toFixed(2));
}
