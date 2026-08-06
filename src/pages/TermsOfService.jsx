import { useEffect } from "react";
import { COLORS } from "../theme/colors";
import { setSEO } from "../lib/seo";
import LegalLayout, { LegalP, LegalList } from "../components/LegalLayout";

const LAST_UPDATED = "August 5, 2026";

const SECTIONS = [
  {
    id: "acceptance-of-terms",
    heading: "Acceptance of Terms",
    body: (
      <LegalP>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the TradeMarco LLC (&ldquo;TradeMarco,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) website, including all pages, product listings, and forms available on this domain (collectively, the &ldquo;Website&rdquo;). By accessing or using the Website, you agree to be bound by these Terms. If you do not agree with any part of these Terms, please discontinue use of the Website.
      </LegalP>
    ),
  },
  {
    id: "website-use",
    heading: "Website Use",
    body: (
      <>
        <LegalP>The Website is provided for the purpose of browsing our industrial product catalog and submitting legitimate sourcing and quotation inquiries. You agree not to:</LegalP>
        <LegalList
          items={[
            "Use the Website for any unlawful purpose or in violation of any applicable local, state, national or international law or regulation.",
            "Attempt to gain unauthorized access to any part of the Website, including our internal admin system, or to any server, database or system connected to the Website.",
            "Use automated means (bots, scrapers, crawlers) to extract data from the Website without our prior written consent.",
            "Submit false, misleading, or fraudulent information through our RFQ or contact forms.",
            "Interfere with or disrupt the operation of the Website or the servers and networks used to make it available.",
            "Reproduce, duplicate, copy, or exploit any portion of the Website without express written permission from TradeMarco.",
          ]}
        />
      </>
    ),
  },
  {
    id: "rfq-disclaimer",
    heading: "RFQ Disclaimer",
    body: (
      <LegalP>
        Submitting a Request for Quotation (RFQ) or contact inquiry through the Website constitutes an inquiry only and does not create a binding order, contract, or obligation on the part of either party. Any quotation TradeMarco provides in response to an RFQ is an estimate based on the information available at the time and is subject to product availability, manufacturer confirmation, and final written agreement. No purchase order, sale, or commercial transaction is formed until both parties execute a separate written agreement, purchase order, or invoice specifically covering that transaction.
      </LegalP>
    ),
  },
  {
    id: "product-information-disclaimer",
    heading: "Product Information Disclaimer",
    body: (
      <LegalP>
        Product names, descriptions, specifications, images, and datasheets displayed on the Website are compiled from manufacturer and supplier-provided information and are presented for general reference &ldquo;as is.&rdquo; While TradeMarco takes reasonable care in presenting this information, we do not warrant that all product descriptions, specifications, images, or other content available on the Website are accurate, complete, current, or error-free. All manufacturer names, trademarks, and logos referenced or displayed on the Website remain the property of their respective owners. TradeMarco LLC is an independent industrial sourcing company and is not an authorized distributor or representative of the manufacturers listed unless otherwise expressly stated.
      </LegalP>
    ),
  },
  {
    id: "pricing-disclaimer",
    heading: "Pricing Disclaimer",
    body: (
      <LegalP>
        Where pricing information appears on a product page, it is provided for indicative reference only and does not constitute a binding offer to sell at that price. Displayed prices may not reflect freight, insurance, duties, taxes, customs charges, or minimum order quantities, and are subject to change without notice. Final, binding pricing is confirmed only through a formal written quotation issued by TradeMarco in response to your specific RFQ.
      </LegalP>
    ),
  },
  {
    id: "intellectual-property",
    heading: "Intellectual Property",
    body: (
      <LegalP>
        All content on the Website — including text, graphics, layout, design elements, and the TradeMarco name and logo — is the property of TradeMarco LLC or its licensors and is protected by applicable copyright, trademark, and other intellectual property laws. No content from the Website may be reproduced, distributed, modified, or used for commercial purposes without our prior written consent. Manufacturer trademarks, brand names, and logos displayed on the Website remain the exclusive property of their respective owners and are used solely for product identification purposes.
      </LegalP>
    ),
  },
  {
    id: "limitation-of-liability",
    heading: "Limitation of Liability",
    body: (
      <LegalP>
        The Website and its content are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis, without warranties of any kind, whether express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. To the fullest extent permitted by applicable law, TradeMarco LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenue, arising out of or in connection with your use of, or inability to use, the Website or reliance on any information presented on it.
      </LegalP>
    ),
  },
  {
    id: "governing-law",
    heading: "Governing Law",
    body: (
      <LegalP>
        These Terms are governed by and construed in accordance with the laws of the State of Wyoming, USA, without regard to its conflict-of-law principles. You agree that any dispute arising out of or relating to these Terms or the Website shall be subject to the exclusive jurisdiction of the state or federal courts located in Sheridan County, Wyoming.
      </LegalP>
    ),
  },
  {
    id: "contact-information",
    heading: "Contact Information",
    body: (
      <LegalP>
        Questions regarding these Terms of Service can be directed to:<br /><br />
        <strong style={{ color: COLORS.navy }}>TradeMarco LLC</strong><br />
        30 N Gould St Ste N, Sheridan, WY 82801, USA<br />
        Email: <a href="mailto:info@trademarco.com" style={{ color: COLORS.orange, textDecoration: "none", fontWeight: 600 }}>info@trademarco.com</a><br />
        Phone: +1 (307) 999-8667
      </LegalP>
    ),
  },
];

export default function TermsOfService() {
  useEffect(() => {
    setSEO({
      title: "Terms of Service | TradeMarco Global",
      description: "Read the Terms of Service governing use of the Trademarco Global website, RFQ submissions, product information, and pricing disclaimers.",
      path: "/terms-of-service",
    });
  }, []);

  return (
    <LegalLayout
      eyebrow="Legal"
      title="Terms of Service"
      intro="These Terms of Service govern your use of the TradeMarco website, including RFQ submissions and the industrial product information presented here."
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
    />
  );
}
