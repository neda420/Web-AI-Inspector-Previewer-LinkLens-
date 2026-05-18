export type SafetyRisk = "safe" | "medium" | "high";

export type SafetyFlags = {
  risk: SafetyRisk;
  reasons: string[];
};

export type UrlRecord = {
  id: string;
  normalizedUrl: string;
  title: string;
  description: string;
  summary: string;
  safetyFlags: SafetyFlags;
  createdAt: string;
};

export type Review = {
  id: string;
  urlId: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: string;
  updatedAt: string;
};

export type UrlWithScores = UrlRecord & {
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
  trustScore: number;
};
