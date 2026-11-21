import type { CaptureResult, PostHogConfig } from "posthog-js";

/**
 * Product analytics (PostHog). Off unless NEXT_PUBLIC_POSTHOG_KEY is set: then
 * the library is never even downloaded. When on, it only counts page views and
 * clicks. There are no session recordings, typed values and on-screen text are
 * masked, and query strings are removed from every URL so tokens in links
 * (password reset, email confirmation) never leave the site.
 */

export const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";

/** Drops the query string and #hash from anything that looks like a URL. */
export function stripUrl(value: string): string {
  if (!/^https?:\/\//i.test(value)) return value;
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return value.split(/[?#]/)[0] ?? value;
  }
}

function scrub(value: unknown, depth = 0): unknown {
  if (typeof value === "string") return stripUrl(value);
  if (depth > 2 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => scrub(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      scrub(item, depth + 1),
    ]),
  );
}

/** Runs on every event before it is sent. */
export function scrubEvent(event: CaptureResult | null): CaptureResult | null {
  if (!event) return null;
  return {
    ...event,
    properties: scrub(event.properties) as CaptureResult["properties"],
    ...(event.$set ? { $set: scrub(event.$set) as CaptureResult["$set"] } : {}),
    ...(event.$set_once ? { $set_once: scrub(event.$set_once) as CaptureResult["$set_once"] } : {}),
  };
}

export const posthogConfig: Partial<PostHogConfig> = {
  capture_pageview: "history_change",
  capture_pageleave: true,
  // Anonymous counts only: we never call identify(), so no person profiles.
  person_profiles: "identified_only",
  respect_dnt: true,
  // No recordings, heatmaps, surveys, experiments or extra scripts.
  disable_session_recording: true,
  session_recording: { maskAllInputs: true, maskTextSelector: "*" },
  disable_external_dependency_loading: true,
  disable_surveys: true,
  disable_web_experiments: true,
  advanced_disable_flags: true,
  capture_heatmaps: false,
  capture_dead_clicks: false,
  capture_exceptions: false,
  capture_performance: false,
  // Clicks are counted by element type only: no text, no attribute values.
  mask_all_text: true,
  mask_all_element_attributes: true,
  before_send: scrubEvent,
};

export async function startAnalytics(key: string | undefined, host: string | undefined) {
  if (!key) return;
  const { posthog } = await import("posthog-js");
  posthog.init(key, { ...posthogConfig, api_host: host || DEFAULT_POSTHOG_HOST });
}
