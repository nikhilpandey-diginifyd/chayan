import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Grievance redressal" };

export default function GrievancePage() {
  const { grievanceOfficer, business } = siteConfig;
  return (
    <LegalPage title="Grievance redressal">
      <p>
        If you have a complaint about a session, a mentor, a payment, content on the platform or how
        we handle your personal data, you can contact our Grievance Officer.
      </p>
      <table>
        <tbody>
          <tr>
            <th scope="row">Name</th>
            <td>{grievanceOfficer.name}</td>
          </tr>
          <tr>
            <th scope="row">Email</th>
            <td>
              <a href={`mailto:${grievanceOfficer.email}`}>{grievanceOfficer.email}</a>
            </td>
          </tr>
          <tr>
            <th scope="row">Address</th>
            <td>{business.address}</td>
          </tr>
        </tbody>
      </table>

      <h2>How to raise a complaint</h2>
      <p>
        Email the Grievance Officer with your registered email address, the booking ID if the
        complaint is about a session, a description of the problem and any screenshots.
      </p>

      <h2>What happens next</h2>
      <p>{grievanceOfficer.responseTime}</p>
      <p>
        If you are not satisfied with our response to a complaint about your personal data, you can
        approach the Data Protection Board of India under the Digital Personal Data Protection Act,
        2023.
      </p>
    </LegalPage>
  );
}
