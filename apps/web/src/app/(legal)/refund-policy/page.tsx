import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Refund and cancellation policy" };

export default function RefundPolicyPage() {
  const { business } = siteConfig;
  return (
    <LegalPage title="Refund and cancellation policy">
      <p>
        This policy explains when you get your money back for mentorship sessions booked on{" "}
        {siteConfig.name}. Refunds always go back to the original payment method.
      </p>

      <h2>Sessions</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">What happens</th>
            <th scope="col">Refund to you</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>The mentor does not join within 10 minutes of the start time</td>
            <td>100%, issued automatically</td>
          </tr>
          <tr>
            <td>The mentor cancels the session</td>
            <td>100%, issued automatically</td>
          </tr>
          <tr>
            <td>You cancel 12 hours or more before the start time</td>
            <td>100%</td>
          </tr>
          <tr>
            <td>You cancel less than 12 hours before the start time</td>
            <td>50%</td>
          </tr>
          <tr>
            <td>You do not join within 10 minutes of the start time</td>
            <td>50%</td>
          </tr>
          <tr>
            <td>
              A technical problem on our side or the video provider&apos;s side keeps the call
              connected for less than half of the booked time
            </td>
            <td>Your choice of a free reschedule or a 100% refund</td>
          </tr>
        </tbody>
      </table>

      <h2>Rescheduling</h2>
      <p>
        You can reschedule a session once, free of charge, up to 12 hours before the start time,
        subject to the mentor&apos;s availability.
      </p>

      <h2>Session quality</h2>
      <p>
        If a session took place but you believe the mentor did not provide the service described on
        their profile, write to us within 48 hours of the session at{" "}
        <a href={`mailto:${business.email}`}>{business.email}</a>. We review the booking and the
        call records and may issue a full or partial refund.
      </p>

      <h2>Free content</h2>
      <p>Previous year papers and short videos are free, so no refund applies to them.</p>

      <h2>How long refunds take</h2>
      <p>
        We start the refund within 2 working days of it being approved. The bank or payment provider
        usually credits it within 5 to 7 working days after that. UPI refunds are often faster.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about a refund: <a href={`mailto:${business.email}`}>{business.email}</a> or{" "}
        {business.phone}, {business.supportHours}.
      </p>
    </LegalPage>
  );
}
