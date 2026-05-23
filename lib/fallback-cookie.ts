export const FALLBACK_COOKIE_TTL_SECONDS = 10 * 60;
export const MAX_FALLBACK_COOKIE_VALUE_LENGTH = 3800;
export const MAX_FALLBACK_TITLE_LENGTH = 200;
export const MAX_FALLBACK_DESCRIPTION_LENGTH = 400;
export const MAX_FALLBACK_SUMMARY_LENGTH = 2000;
export const MAX_FALLBACK_REASONS = 20;
export const MAX_FALLBACK_REASON_LENGTH = 200;

export function toBoundedString(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}
