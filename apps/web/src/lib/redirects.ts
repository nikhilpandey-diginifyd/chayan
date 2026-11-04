/**
 * Only allow redirects to paths on this site. Blocks values like
 * "https://evil.com" or "//evil.com" that would send users elsewhere.
 */
export function safeRedirectPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
