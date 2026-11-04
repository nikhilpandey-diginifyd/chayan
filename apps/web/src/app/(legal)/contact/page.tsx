import Link from "next/link";
import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Contact us" };

export default function ContactPage() {
  const { business } = siteConfig;
  return (
    <LegalPage title="Contact us">
      <p>We usually reply within one working day.</p>
      <table>
        <tbody>
          <tr>
            <th scope="row">Email</th>
            <td>
              <a href={`mailto:${business.email}`}>{business.email}</a>
            </td>
          </tr>
          <tr>
            <th scope="row">Phone</th>
            <td>{business.phone}</td>
          </tr>
          <tr>
            <th scope="row">Support hours</th>
            <td>{business.supportHours}</td>
          </tr>
          <tr>
            <th scope="row">Operated by</th>
            <td>{business.legalName}</td>
          </tr>
          <tr>
            <th scope="row">Address</th>
            <td>{business.address}</td>
          </tr>
          {business.gstin ? (
            <tr>
              <th scope="row">GSTIN</th>
              <td>{business.gstin}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <p>
        For complaints about a mentor, a payment or your personal data, you can also write to our{" "}
        <Link href="/grievance">Grievance Officer</Link>.
      </p>
    </LegalPage>
  );
}
