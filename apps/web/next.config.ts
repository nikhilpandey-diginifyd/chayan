import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const isDev = process.env.NODE_ENV !== "production";

function sentryOrigin(): string | null {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return null;
  try {
    return new URL(dsn).origin;
  } catch {
    return null;
  }
}

/**
 * Content Security Policy. Only the services the app actually uses may load
 * scripts, open frames or receive data: Razorpay Checkout, 100ms video,
 * YouTube's privacy-friendly player and (optionally) Sentry.
 * Set CSP_REPORT_ONLY=1 to log violations in the browser console instead of
 * blocking, if a provider changes its domains.
 */
function contentSecurityPolicy() {
  const sentry = sentryOrigin();
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "https://checkout.razorpay.com",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https://i.ytimg.com", "https://*.razorpay.com"],
    "font-src": ["'self'", "data:"],
    "media-src": ["'self'", "blob:"],
    "connect-src": [
      "'self'",
      "https://*.razorpay.com",
      "https://*.100ms.live",
      "wss://*.100ms.live",
      ...(sentry ? [sentry] : []),
      ...(isDev ? ["ws:", "wss:"] : []),
    ],
    "frame-src": ["https://*.razorpay.com", "https://www.youtube-nocookie.com"],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  const policy = Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
  return isDev ? policy : `${policy}; upgrade-insecure-requests`;
}

const securityHeaders = [
  {
    key:
      process.env.CSP_REPORT_ONLY === "1"
        ? "Content-Security-Policy-Report-Only"
        : "Content-Security-Policy",
    value: contentSecurityPolicy(),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Razorpay Checkout opens bank and UPI pages in popups that must reach back.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  // camera/microphone/display-capture stay allowed for our own origin (video calls)
  {
    key: "Permissions-Policy",
    value:
      'camera=(self), microphone=(self), display-capture=(self), geolocation=(), payment=(self "https://checkout.razorpay.com" "https://api.razorpay.com")',
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ["@chayan/db", "@chayan/shared"],
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
