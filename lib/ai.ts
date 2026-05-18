import type { SafetyFlags } from "@/lib/types";

type SummarizeInput = {
  title: string;
  description: string;
  body: string;
};

const RISK_PATTERNS: Array<{ pattern: RegExp; reason: string; risk: SafetyFlags["risk"] }> = [
  {
    pattern: /login|verify|password|bank|wallet|crypto/i,
    reason: "Credential or financial bait terms detected",
    risk: "medium",
  },
  {
    pattern: /free money|guaranteed profit|limited time offer|urgent action/i,
    reason: "Manipulative urgency or scam-like language detected",
    risk: "high",
  },
  {
    pattern: /malware|trojan|payload|exploit|hack/i,
    reason: "Potential malware-related language detected",
    risk: "high",
  },
];

export function classifySafety(input: SummarizeInput): SafetyFlags {
  const source = `${input.title} ${input.description} ${input.body.slice(0, 2000)}`;
  let risk: SafetyFlags["risk"] = "safe";
  const reasons: string[] = [];

  for (const rule of RISK_PATTERNS) {
    if (rule.pattern.test(source)) {
      reasons.push(rule.reason);
      if (rule.risk === "high") {
        risk = "high";
      } else if (risk !== "high") {
        risk = "medium";
      }
    }
  }

  if (reasons.length === 0) {
    reasons.push("No obvious phishing or malware language patterns were detected.");
  }

  return { risk, reasons };
}

export async function summarizeWithAI(input: SummarizeInput): Promise<string> {
  const focus = input.description || input.title || "general informational content";
  return `This page appears to be about ${focus.toLowerCase()} and likely contains reading-focused information for visitors. You should expect links, context, and details related to this topic before deciding whether to continue.`;
}
