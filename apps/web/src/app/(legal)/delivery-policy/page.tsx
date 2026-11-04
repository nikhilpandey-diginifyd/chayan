import Link from "next/link";
import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Service delivery policy" };

export default function DeliveryPolicyPage() {
  return (
    <LegalPage title="Service delivery policy">
      <p>{siteConfig.name} provides online services only. We do not ship any physical goods.</p>

      <h2>Mentorship sessions</h2>
      <ul>
        <li>
          After a successful payment, you receive a booking confirmation by email immediately, with
          the date, time and a link to join.
        </li>
        <li>
          The session takes place as a live video call on {siteConfig.name} at the booked time. You
          can join from a computer or phone browser.
        </li>
        <li>We send reminders 24 hours, 1 hour and 10 minutes before the session.</li>
        <li>
          If the session cannot take place, the{" "}
          <Link href="/refund-policy">refund and cancellation policy</Link> applies.
        </li>
      </ul>

      <h2>Previous year papers and videos</h2>
      <p>These are available instantly on the website after you sign in, at no cost.</p>

      <h2>Contact</h2>
      <p>
        If you did not receive a booking confirmation, write to{" "}
        <a href={`mailto:${siteConfig.business.email}`}>{siteConfig.business.email}</a>.
      </p>
    </LegalPage>
  );
}
