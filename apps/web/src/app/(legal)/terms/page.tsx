import Link from "next/link";
import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  const { business, pricing } = siteConfig;
  return (
    <LegalPage title="Terms of service">
      <p>
        These terms apply to your use of {siteConfig.name}, operated by {business.legalName}. By
        creating an account or booking a session, you agree to them.
      </p>

      <h2>What we are</h2>
      <p>
        {siteConfig.name} is an online marketplace that connects aspirants preparing for UPSC and
        SSC examinations with independent mentors. Mentors are not our employees. We are not
        affiliated with UPSC, SSC or any government body, and no mentor or content on the platform
        can guarantee selection in any examination.
      </p>

      <h2>Eligibility and accounts</h2>
      <ul>
        <li>You must be 18 or older to use the platform.</li>
        <li>
          Give accurate information and keep your login details safe. You are responsible for
          activity on your account.
        </li>
        <li>One person may hold only one aspirant account and one mentor profile.</li>
      </ul>

      <h2>Bookings and payments</h2>
      <ul>
        <li>
          Mentors set their own session prices. The price shown at checkout is the full amount you
          pay, including our platform fee.
        </li>
        <li>Payments are processed by Razorpay. We do not store your card or bank details.</li>
        <li>
          Cancellations, no-shows and refunds follow our{" "}
          <Link href="/refund-policy">refund and cancellation policy</Link>.
        </li>
        <li>
          All payments for sessions must go through {siteConfig.name}. Paying a mentor directly for
          a session found on the platform is not allowed.
        </li>
      </ul>

      <h2>Rules for everyone</h2>
      <ul>
        <li>Be respectful. Harassment, abuse or discrimination leads to account removal.</li>
        <li>Do not record a session without the other person&apos;s clear consent.</li>
        <li>
          Do not share phone numbers, social media handles or payment details to move a booking off
          the platform.
        </li>
        <li>Do not upload content that you do not have the right to share.</li>
        <li>Do not misuse the platform, try to access other accounts or disrupt the service.</li>
      </ul>

      <h2>Additional terms for mentors</h2>
      <ul>
        <li>
          Your profile goes live only after we verify your result and identity. Every claim on your
          profile must be true and supported by documents.
        </li>
        <li>
          Join your sessions on time and deliver what your profile describes. Repeated no-shows or
          complaints may lead to suspension.
        </li>
        <li>
          We retain a platform fee of {pricing.commissionPercent}% of the session price, plus
          applicable taxes on that fee, and pay you the balance after deducting taxes required by
          law, such as TDS.
        </li>
        <li>
          Serving government employees must have any permission their service rules require before
          offering paid sessions.
        </li>
      </ul>

      <h2>Content</h2>
      <p>
        Previous year question papers are published by UPSC and SSC and are provided for reference.
        Videos, notes and other material created by us or our mentors may not be copied, resold or
        redistributed without permission.
      </p>

      <h2>Liability</h2>
      <p>
        We work to keep the platform available and accurate, but we provide it &quot;as is&quot;. To
        the extent the law allows, our total liability for any claim relating to a booking is
        limited to the amount you paid for that booking.
      </p>

      <h2>Suspension and closing your account</h2>
      <p>
        You may close your account at any time. We may suspend or close accounts that break these
        terms, after giving notice where reasonable.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India. Courts in New Delhi have jurisdiction over
        any dispute.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We will notify you of material changes by email or on the website before they take effect.
        Continuing to use the platform after that means you accept the updated terms.
      </p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${business.email}`}>{business.email}</a>, {business.phone}
      </p>
    </LegalPage>
  );
}
