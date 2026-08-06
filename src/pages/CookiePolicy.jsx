import { useEffect } from "react";
import { Link } from "react-router-dom";
import { COLORS } from "../theme/colors";
import { setSEO } from "../lib/seo";
import LegalLayout, { LegalP, LegalList } from "../components/LegalLayout";

const LAST_UPDATED = "August 5, 2026";

const SECTIONS = [
  {
    id: "essential-cookies",
    heading: "Essential Cookies",
    body: (
      <LegalP>
        Essential cookies are strictly necessary for parts of the Website to function. On the Trademarco Global website, this applies only to our internal admin system (<code style={{ background: COLORS.lightGray, padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>/admin</code>), where an authentication session is required for authorized Company staff to log in and manage the product catalog. This cookie/session token is not set when you browse our public product catalog, manufacturer pages, or submit an RFQ, and it cannot be disabled without preventing staff from accessing the admin system.
      </LegalP>
    ),
  },
  {
    id: "analytics-cookies",
    heading: "Analytics Cookies",
    body: (
      <LegalP>
        The Company does not currently use analytics cookies (such as Google Analytics) or advertising/retargeting cookies on the public Website. Should we introduce analytics or advertising cookies in the future, we will update this Cookie Policy and, where required by applicable law, request your consent before any non-essential cookie is set.
      </LegalP>
    ),
  },
  {
    id: "preference-cookies",
    heading: "Preference Cookies",
    body: (
      <LegalP>
        Preference cookies are used to remember choices you make on a website, such as language or region settings. The Company does not currently set any preference cookies on the public Website. If preference cookies are introduced in the future (for example, to remember a preferred region or unit of measurement), this Policy will be updated accordingly.
      </LegalP>
    ),
  },
  {
    id: "cookie-management",
    heading: "Cookie Management",
    body: (
      <>
        <LegalP>
          Because the public Website does not set non-essential cookies, there is generally nothing for you to opt out of when simply browsing our catalog. If you wish to review or clear any cookies stored by your browser, most browsers allow you to manage or delete cookies through their settings:
        </LegalP>
        <LegalList
          items={[
            "Chrome: Settings → Privacy and security → Cookies and other site data.",
            "Firefox: Settings → Privacy & Security → Cookies and Site Data.",
            "Safari: Preferences → Privacy → Manage Website Data.",
            "Microsoft Edge: Settings → Cookies and site permissions.",
          ]}
        />
        <LegalP>
          Disabling cookies entirely in your browser will not affect your ability to browse our public product catalog or submit an RFQ, but it will prevent authorized staff from remaining logged in to the internal admin system.
        </LegalP>
      </>
    ),
  },
  {
    id: "third-party-cookies",
    heading: "Third-Party Cookies",
    body: (
      <LegalP>
        Our Website loads web fonts from Google Fonts. Loading a page may result in a request to Google&rsquo;s font-delivery servers, which is governed by Google&rsquo;s own privacy and cookie practices and is outside the Company&rsquo;s control. We do not embed any advertising networks, social media widgets, or third-party tracking/retargeting scripts on the public Website. For more detail on the categories of information we process more broadly, see our <Link to="/privacy-policy" style={{ color: COLORS.orange, fontWeight: 600, textDecoration: "none" }}>Privacy Policy</Link>.
      </LegalP>
    ),
  },
];

export default function CookiePolicy() {
  useEffect(() => {
    setSEO({
      title: "Cookie Policy | Trademarco Global",
      description: "Learn what cookies Trademarco Global uses on its website — essential, analytics, preference and third-party cookies — and how to manage them.",
      path: "/cookie-policy",
    });
  }, []);

  return (
    <LegalLayout
      eyebrow="Legal"
      title="Cookie Policy"
      intro="This Cookie Policy explains what cookies TRADEMARCO LLC uses on this website, why we use them, and how you can manage your preferences."
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
    />
  );
}
