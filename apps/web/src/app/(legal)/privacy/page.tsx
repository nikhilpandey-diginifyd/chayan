import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  const { business, grievanceOfficer } = siteConfig;
  return (
    <LegalPage title="Privacy policy">
      <p>
        This policy explains what personal data {siteConfig.name} (&quot;we&quot;) collects, why,
        who we share it with and the rights you have under the Digital Personal Data Protection Act,
        2023. {siteConfig.name} is operated by {business.legalName}, {business.address}.
      </p>

      <h2>Data we collect</h2>
      <h3>From all users</h3>
      <ul>
        <li>Name, email address, and phone number if you provide it</li>
        <li>Your Google account name, email and profile photo, if you sign in with Google</li>
        <li>Your exam, target year, preparation stage and preferred language</li>
        <li>Bookings, payments, refunds, reviews and messages on the platform</li>
        <li>
          Technical data such as IP address, device and browser type, and pages visited, used for
          security and to improve the service
        </li>
      </ul>
      <h3>Additionally from mentors</h3>
      <ul>
        <li>Exam results, marksheets and similar documents you upload to prove your result</li>
        <li>Government ID details, PAN and bank account details, for verification and payouts</li>
      </ul>
      <p>
        We do not record video calls. We store when each person joined and left a call, to handle
        no-shows and refunds fairly.
      </p>

      <h2>Why we use it</h2>
      <ul>
        <li>To create and secure your account</li>
        <li>To match you with mentors and run bookings, video calls, payments and refunds</li>
        <li>To verify mentors and pay them, including tax deductions required by law</li>
        <li>To send booking confirmations, reminders and service messages</li>
        <li>To prevent fraud and abuse, and to meet legal obligations</li>
        <li>To understand how the platform is used so we can improve it</li>
      </ul>
      <p>
        We process your data on the basis of your consent and, where the law allows, for legitimate
        uses such as meeting legal obligations. We do not sell your personal data.
      </p>

      <h2>Who we share it with</h2>
      <ul>
        <li>
          <strong>Mentors and aspirants:</strong> a mentor sees your name, exam details and booking
          information for sessions you book with them. Aspirants see a mentor&apos;s public profile,
          never their documents, ID or bank details.
        </li>
        <li>
          <strong>Service providers</strong> who process data for us under contract: payments
          (Razorpay), video calls (100ms), email delivery, cloud hosting and storage, error
          monitoring and product analytics. Some of these providers may process data outside India.
        </li>
        <li>
          <strong>Authorities</strong>, when required by law, such as tax authorities or law
          enforcement acting under a valid legal order.
        </li>
      </ul>

      <h2>How long we keep it</h2>
      <ul>
        <li>Account data: while your account is active, and deleted after you close it</li>
        <li>
          Payment, invoice and tax records: for as long as tax and accounting laws require, usually
          8 years
        </li>
        <li>
          Documents from mentor applications that we reject: deleted within 90 days of the decision
        </li>
      </ul>

      <h2>Your rights</h2>
      <ul>
        <li>Access a summary of your personal data and how we process it</li>
        <li>Correct or update inaccurate data</li>
        <li>
          Withdraw consent and ask us to erase your data, unless the law requires us to keep it
        </li>
        <li>Nominate another person to exercise your rights in case of death or incapacity</li>
        <li>Raise a grievance with us, and then with the Data Protection Board of India</li>
      </ul>
      <p>
        To use these rights, write to{" "}
        <a href={`mailto:${grievanceOfficer.email}`}>{grievanceOfficer.email}</a>.
      </p>

      <h2>Age</h2>
      <p>
        You must be 18 or older to create an account or book a session. We do not knowingly collect
        personal data from anyone under 18.
      </p>

      <h2>Security</h2>
      <p>
        We encrypt data in transit, restrict access to mentor documents to the verification team,
        and store passwords only as secure hashes. If a personal data breach affects you, we will
        inform you and the Data Protection Board as the law requires.
      </p>

      <h2>Cookies</h2>
      <p>
        We use essential cookies to keep you signed in and secure. We use analytics to understand
        how the platform is used, without selling or sharing this data for advertising.
      </p>

      <h2>Changes</h2>
      <p>
        If we make material changes to this policy, we will notify you by email or on the website
        before they take effect.
      </p>
    </LegalPage>
  );
}
