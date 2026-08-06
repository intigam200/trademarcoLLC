import { useEffect } from "react";
import { Link } from "react-router-dom";
import { COLORS } from "../theme/colors";
import { setSEO } from "../lib/seo";
import LegalLayout, { LegalP, LegalList } from "../components/LegalLayout";

const LAST_UPDATED = "August 5, 2026";

const SECTIONS = [
  {
    id: "information-we-collect",
    heading: "Information We Collect",
    body: (
      <>
        <LegalP>
          TradeMarco LLC (&ldquo;TradeMarco,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects information in the following ways:
        </LegalP>
        <LegalList
          items={[
            <><strong>Information you provide directly</strong> — when you submit a Request for Quotation (RFQ) or contact form, we collect your full name, email address, company name, phone number, country or delivery destination, the product(s) you are inquiring about, and the content of your message.</>,
            <><strong>Information collected automatically</strong> — like most websites, our hosting infrastructure automatically logs technical data such as IP address, browser type and version, device and operating system, pages visited, referring URL, and timestamps. This data is collected at the server/hosting level for security, abuse prevention and performance monitoring.</>,
            <><strong>Administrative account information</strong> — TradeMarco staff who manage our product catalog use an internal login (email and password) to access our admin system. This applies only to authorized TradeMarco personnel, not to public website visitors.</>,
          ]}
        />
        <LegalP>
          We do not collect payment card details, banking information, or other financial account information through this website. TradeMarco operates on a request-for-quotation basis; any commercial payment terms are agreed separately, outside of this website.
        </LegalP>
      </>
    ),
  },
  {
    id: "how-we-use-information",
    heading: "How We Use Information",
    body: (
      <LegalList
        items={[
          "To respond to your RFQ or inquiry and prepare a quotation for the products or services requested.",
          "To communicate with you about your inquiry, including follow-up questions needed to fulfill your request.",
          "To verify the legitimacy of business inquiries and protect our systems against spam, fraud and abuse.",
          "To maintain internal records of quotations and inquiries for business and accounting purposes.",
          "To operate, maintain, secure and improve the functionality and content of our website.",
          "To comply with applicable legal, tax, customs and export-control obligations.",
        ]}
      />
    ),
  },
  {
    id: "legal-basis",
    heading: "Legal Basis",
    body: (
      <>
        <LegalP>
          Where applicable data protection law (such as the EU/UK General Data Protection Regulation) requires a legal basis for processing, TradeMarco relies on one or more of the following:
        </LegalP>
        <LegalList
          items={[
            <><strong>Contractual necessity</strong> — processing your RFQ and related correspondence are steps taken at your request prior to entering into a commercial agreement.</>,
            <><strong>Legitimate interests</strong> — operating and securing our website, responding to business inquiries, and preventing fraudulent or abusive use of our forms.</>,
            <><strong>Consent</strong> — where required, such as for optional marketing communications, which you may withdraw at any time.</>,
            <><strong>Legal obligation</strong> — retaining records required for tax, accounting, or export/customs compliance purposes.</>,
          ]}
        />
      </>
    ),
  },
  {
    id: "cookies",
    heading: "Cookies",
    body: (
      <LegalP>
        Our website uses a limited number of cookies. Strictly necessary cookies are used to support the login session for authorized TradeMarco staff accessing the internal admin system; these are not set for members of the public browsing our product catalog. We do not currently use cookies for advertising or cross-site tracking. For full detail on the categories of cookies we use and how to manage them, see our <Link to="/cookie-policy" style={{ color: COLORS.orange, fontWeight: 600, textDecoration: "none" }}>Cookie Policy</Link>.
      </LegalP>
    ),
  },
  {
    id: "analytics",
    heading: "Analytics",
    body: (
      <LegalP>
        TradeMarco does not currently deploy third-party analytics or advertising trackers (such as Google Analytics or social media pixels) on the public website. Our hosting provider may retain aggregate, anonymized server access logs for security and performance purposes. If we introduce analytics tools in the future, we will update this Privacy Policy and, where required by law, request your consent before doing so.
      </LegalP>
    ),
  },
  {
    id: "rfq-forms",
    heading: "RFQ Forms",
    body: (
      <LegalP>
        When you submit a Request for Quotation, the information you provide (name, email, company, phone number, country/delivery destination, product reference, and your message) is transmitted securely and stored in our database, hosted by our infrastructure provider, Supabase. This information is used exclusively to review your requirements, prepare a competitive quotation, and communicate with you about your request. RFQ data is accessible only to authorized TradeMarco personnel.
      </LegalP>
    ),
  },
  {
    id: "contact-forms",
    heading: "Contact Forms",
    body: (
      <LegalP>
        General contact inquiries submitted through our website use the same secure form and storage process described above under RFQ Forms. In addition, a notification copy of your inquiry is sent by email to our sales and support team via an encrypted SMTP connection so that a member of our team can respond promptly. This notification email is used solely to route your inquiry internally.
      </LegalP>
    ),
  },
  {
    id: "email-communication",
    heading: "Email Communication",
    body: (
      <LegalP>
        We use the email address you provide to respond to your inquiry, deliver quotations, and correspond about your request. We do not sell, rent, or trade your email address to third parties. You may decline further non-essential communication at any time by replying to any email from us or by contacting <a href="mailto:support@trademarco.com" style={{ color: COLORS.orange, textDecoration: "none", fontWeight: 600 }}>support@trademarco.com</a>. Please note that transactional messages necessary to complete an active quotation or inquiry may still be sent.
      </LegalP>
    ),
  },
  {
    id: "third-party-services",
    heading: "Third-Party Services",
    body: (
      <>
        <LegalP>We work with a small number of trusted service providers to operate this website. Each processes data only to the extent necessary to provide their service to us, under their own applicable privacy and security terms:</LegalP>
        <LegalList
          items={[
            <><strong>Supabase</strong> — database, authentication and file storage infrastructure used to securely store RFQ/contact submissions and our product catalog.</>,
            <><strong>Vercel</strong> — website hosting and serverless function infrastructure.</>,
            <><strong>SMTP email delivery provider</strong> — used solely to deliver transactional notification emails for RFQ and contact submissions.</>,
            <><strong>Google Fonts</strong> — web font delivery; loading a page from our site may result in a request to Google&rsquo;s font servers, subject to Google&rsquo;s own privacy policy.</>,
          ]}
        />
      </>
    ),
  },
  {
    id: "data-security",
    heading: "Data Security",
    body: (
      <>
        <LegalP>We take reasonable technical and organizational measures to protect the information you provide, including:</LegalP>
        <LegalList
          items={[
            "Encryption of data in transit via HTTPS/TLS across the entire website.",
            "Database-level access controls (row-level security) restricting data access to authorized systems and personnel only.",
            "Restricted administrative access — the internal admin system is available only to authenticated TradeMarco staff and is not open to public registration.",
            "No storage of sensitive credentials or secrets in the browser.",
          ]}
        />
        <LegalP>No method of transmission or storage is 100% secure, and we cannot guarantee absolute security. If we become aware of a security incident affecting your personal data, we will take appropriate steps in line with applicable law.</LegalP>
      </>
    ),
  },
  {
    id: "international-data-transfers",
    heading: "International Data Transfers",
    body: (
      <LegalP>
        TradeMarco LLC is registered and based in the United States. Because we serve customers worldwide, information you submit may be transferred to, stored, and processed in the United States and other countries where our service providers operate, which may have data protection laws different from those of your home jurisdiction. Where required by applicable law (for example, transfers of personal data originating in the European Economic Area or United Kingdom), we rely on appropriate safeguards, such as standard contractual clauses, offered by our service providers.
      </LegalP>
    ),
  },
  {
    id: "data-retention",
    heading: "Data Retention",
    body: (
      <LegalP>
        We retain RFQ and contact information for as long as necessary to respond to your inquiry, maintain our business relationship with you, and satisfy applicable legal, tax, accounting, or export/customs recordkeeping obligations — which in some jurisdictions may require retention of commercial records for several years. Where no ongoing business relationship or legal retention requirement applies, we take reasonable steps to delete or anonymize personal information.
      </LegalP>
    ),
  },
  {
    id: "user-rights",
    heading: "User Rights",
    body: (
      <>
        <LegalP>Depending on your jurisdiction, you may have the right to:</LegalP>
        <LegalList
          items={[
            "Request access to the personal data we hold about you.",
            "Request correction of inaccurate or incomplete data.",
            "Request deletion of your personal data, subject to legal retention requirements.",
            "Object to or request restriction of certain processing.",
            "Request a portable copy of the data you provided to us.",
            "Withdraw consent at any time, where processing is based on consent.",
            "Lodge a complaint with your local data protection supervisory authority.",
          ]}
        />
        <LegalP>
          To exercise any of these rights, contact us at <a href="mailto:info@trademarco.com" style={{ color: COLORS.orange, textDecoration: "none", fontWeight: 600 }}>info@trademarco.com</a>. We will respond within a reasonable timeframe and in accordance with applicable law.
        </LegalP>
      </>
    ),
  },
  {
    id: "contact-information",
    heading: "Contact Information",
    body: (
      <LegalP>
        Questions or requests regarding this Privacy Policy can be directed to:<br /><br />
        <strong style={{ color: COLORS.navy }}>TradeMarco LLC</strong><br />
        30 N Gould St Ste N, Sheridan, WY 82801, USA<br />
        Email: <a href="mailto:info@trademarco.com" style={{ color: COLORS.orange, textDecoration: "none", fontWeight: 600 }}>info@trademarco.com</a> · <a href="mailto:support@trademarco.com" style={{ color: COLORS.orange, textDecoration: "none", fontWeight: 600 }}>support@trademarco.com</a><br />
        Phone: +1 (307) 999-8667
      </LegalP>
    ),
  },
  {
    id: "last-updated",
    heading: "Last Updated",
    body: (
      <LegalP>
        This Privacy Policy was last updated on {LAST_UPDATED}. We may update this Policy from time to time to reflect changes in our practices or for other operational, legal or regulatory reasons. Material changes will be reflected by updating the date above.
      </LegalP>
    ),
  },
];

export default function PrivacyPolicy() {
  useEffect(() => {
    setSEO({
      title: "Privacy Policy | TradeMarco Global",
      description: "Learn how Trademarco Global collects, uses and protects your information when you submit RFQ or contact inquiries on our industrial sourcing website.",
      path: "/privacy-policy",
    });
  }, []);

  return (
    <LegalLayout
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This Privacy Policy explains how TradeMarco LLC collects, uses, and protects information when you use our website and submit RFQ or contact inquiries."
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
    />
  );
}
