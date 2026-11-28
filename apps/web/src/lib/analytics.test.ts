import { describe, expect, it } from "vitest";
import type { CaptureResult } from "posthog-js";
import { posthogConfig, scrubEvent, stripUrl } from "./analytics";

describe("stripUrl", () => {
  it("removes query strings and hashes from URLs", () => {
    expect(stripUrl("https://prepanyexam.io/reset-password?token=secret#top")).toBe(
      "https://prepanyexam.io/reset-password",
    );
  });

  it("leaves other strings alone", () => {
    expect(stripUrl("/mentors?exam=upsc")).toBe("/mentors?exam=upsc");
    expect(stripUrl("Book a session")).toBe("Book a session");
  });
});

describe("scrubEvent", () => {
  it("strips tokens from every URL property, including nested person properties", () => {
    const event = {
      uuid: "1",
      event: "$pageview",
      properties: {
        $current_url: "https://prepanyexam.io/verify-email?token=abc",
        $referrer: "https://mail.google.com/mail/u/0/?th=123",
        $pathname: "/verify-email",
      },
      $set_once: { $initial_person_info: { u: "https://prepanyexam.io/?token=abc" } },
    } as CaptureResult;
    const result = scrubEvent(event)!;
    expect(result.properties.$current_url).toBe("https://prepanyexam.io/verify-email");
    expect(result.properties.$referrer).toBe("https://mail.google.com/mail/u/0/");
    expect(JSON.stringify(result)).not.toContain("token");
  });

  it("passes through dropped events", () => {
    expect(scrubEvent(null)).toBeNull();
  });
});

describe("posthogConfig", () => {
  it("never records sessions and masks inputs and text", () => {
    expect(posthogConfig.disable_session_recording).toBe(true);
    expect(posthogConfig.disable_external_dependency_loading).toBe(true);
    expect(posthogConfig.session_recording?.maskAllInputs).toBe(true);
    expect(posthogConfig.mask_all_text).toBe(true);
    expect(posthogConfig.mask_all_element_attributes).toBe(true);
  });
});
