import { clientEnv } from "@/env";

/**
 * Single place for brand and business details.
 * Replace every value marked TODO before submitting the site to Razorpay.
 */
export const siteConfig = {
  name: "Chayan", // TODO: final brand name
  tagline: "Talk to people who actually cleared UPSC and SSC",
  description:
    "Book one-to-one video sessions with verified UPSC and SSC selected candidates. Download previous year papers and watch short prep videos.",
  url: clientEnv.NEXT_PUBLIC_SITE_URL,
  locale: "en_IN",

  business: {
    legalName: "Nikhil Pandey (Proprietor)", // TODO: legal entity name as registered with Razorpay
    address: "TODO: full registered address, New Delhi, India",
    email: "support@example.com", // TODO
    phone: "+91 00000 00000", // TODO
    supportHours: "Monday to Saturday, 10:00 to 18:00 IST",
    gstin: "", // optional until registered
  },

  grievanceOfficer: {
    name: "TODO: Grievance Officer name",
    email: "grievance@example.com", // TODO
    responseTime: "We acknowledge complaints within 48 hours and resolve them within 30 days.",
  },

  pricing: {
    commissionPercent: 20,
    typicalSessionRange: "₹199 to ₹999",
  },

  policyLastUpdated: "4 November 2026",
} as const;

export const legalLinks = [
  { href: "/terms", label: "Terms of service" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/refund-policy", label: "Refund and cancellation" },
  { href: "/delivery-policy", label: "Service delivery" },
  { href: "/grievance", label: "Grievance redressal" },
  { href: "/contact", label: "Contact us" },
] as const;
