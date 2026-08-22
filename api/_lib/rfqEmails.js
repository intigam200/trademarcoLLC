const SITE_URL = process.env.SITE_URL || "https://www.trademarco.com";
const LOGO_URL = `${SITE_URL}/images/products/logo.png`;

const COMPANY_LEGAL_NAME = "TRADEMARCO LLC";
const COMPANY_ADDRESS = "30 N Gould St Ste N, Sheridan, WY 82801, USA";
const COMPANY_WEBSITE_LABEL = "www.trademarco.com";
const COMPANY_WEBSITE_URL = "https://www.trademarco.com";
const COMPANY_PHONE = "+1 (307) 999-8667";
const COMPANY_WHATSAPP_URL = "https://wa.me/13079998667";
const COMPANY_LINKEDIN_URL = "https://linkedin.com/company/trademarco";
const SALES_EMAIL = "sales@trademarco.com";

const NAVY = "#1B2A4A";
const ORANGE = "#2D72D2";
const LIGHT_GRAY = "#F4F5F7";
const BORDER_GRAY = "#E0E2E6";
const MED_GRAY = "#5A5F6B";

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function nl2br(html) {
  return html.replace(/\n/g, "<br />");
}

// Internal sales notification — plain text, sent to sales@trademarco.com.
// Field order matches what the sales team needs to triage a lead at a
// glance: who it's from, what they want, then the full message and context.
export function buildNotificationEmail(rfq) {
  const lines = [
    `New RFQ received — ${rfq.requestId}`,
    "",
    `Request ID: ${rfq.requestId}`,
    `Submitted: ${rfq.createdAt}`,
    "",
    `Customer Name: ${rfq.contactName}`,
    `Company: ${rfq.company || "—"}`,
    `Country: ${rfq.country || "—"}`,
    `Phone: ${rfq.phone || "—"}`,
    `Email: ${rfq.email}`,
    "",
    `Manufacturer: ${rfq.manufacturerName || "—"}`,
    `Product: ${rfq.productName || "—"}`,
    `Part Number: ${rfq.partNumber || "—"}`,
    "",
    "Message:",
    rfq.message,
    "",
    `Source URL: ${rfq.pageUrl || "—"}`,
    `IP Address: ${rfq.ipAddress || "—"}`,
    `User Agent: ${rfq.userAgent || "—"}`,
  ];
  return {
    subject: `New RFQ ${rfq.requestId} from ${rfq.contactName}${rfq.company ? ` (${rfq.company})` : ""}`,
    text: lines.join("\n"),
  };
}

// Customer-facing confirmation — professional branded HTML email, sent the
// moment an RFQ is stored. Table-based layout for broad email client
// compatibility (Outlook/Gmail); every dynamic value is HTML-escaped since
// it's interpolated directly into markup.
export function buildConfirmationEmail(rfq) {
  const name = escapeHtml(rfq.contactName);
  const detailRows = [
    ["Request ID", rfq.requestId],
    ["Submitted", rfq.createdAt],
    rfq.manufacturerName && ["Manufacturer", rfq.manufacturerName],
    rfq.productName && ["Product", rfq.productName],
    rfq.partNumber && ["Part Number", rfq.partNumber],
  ].filter(Boolean);

  const detailTable = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0; border:1px solid ${BORDER_GRAY}; border-radius:8px; overflow:hidden;">
      ${detailRows.map(([label, value], i) => `
        <tr style="background:${i % 2 === 0 ? "#FFFFFF" : LIGHT_GRAY};">
          <td style="padding:10px 16px; font-size:12px; font-weight:700; color:${MED_GRAY}; text-transform:uppercase; letter-spacing:0.04em; width:140px;">${escapeHtml(label)}</td>
          <td style="padding:10px 16px; font-size:14px; color:${NAVY}; font-weight:600;">${escapeHtml(value)}</td>
        </tr>
      `).join("")}
    </table>
  `;

  const html = `
<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
  <body style="margin:0; padding:0; background:${LIGHT_GRAY}; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${LIGHT_GRAY}; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#FFFFFF; border-radius:10px; overflow:hidden; border:1px solid ${BORDER_GRAY};">
            <tr>
              <td style="background:${NAVY}; padding:28px 32px;">
                <img src="${LOGO_URL}" alt="Trademarco Global" height="40" style="display:block; height:40px; width:auto; border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <div style="font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${ORANGE}; margin-bottom:12px;">Request Received</div>
                <h1 style="margin:0 0 16px; font-size:22px; line-height:1.3; color:${NAVY};">Thank you for contacting Trademarco Global.</h1>
                <p style="margin:0 0 8px; font-size:15px; line-height:1.7; color:${MED_GRAY};">Hi ${name},</p>
                <p style="margin:0 0 4px; font-size:15px; line-height:1.7; color:${MED_GRAY};">
                  Your quotation request has been successfully received.
                </p>
                <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:${MED_GRAY};">
                  Our sales team will review your request and contact you as soon as possible.
                </p>
                ${detailTable}
                <div style="margin:20px 0 0;">
                  <div style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; color:${MED_GRAY}; margin-bottom:8px;">Your Message</div>
                  <div style="font-size:14px; line-height:1.7; color:${NAVY}; background:${LIGHT_GRAY}; border:1px solid ${BORDER_GRAY}; border-radius:8px; padding:14px 16px; white-space:pre-line;">${nl2br(escapeHtml(rfq.message))}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background:${LIGHT_GRAY}; padding:24px 32px; border-top:1px solid ${BORDER_GRAY};">
                <p style="margin:0 0 12px; font-size:13px; font-weight:700; color:${NAVY};">${COMPANY_LEGAL_NAME}</p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:12px; color:${MED_GRAY}; line-height:1.9;">
                  <tr><td style="padding-right:8px; color:${MED_GRAY};">Address</td><td style="color:${NAVY};">${COMPANY_ADDRESS}</td></tr>
                  <tr><td style="padding-right:8px; color:${MED_GRAY};">Email</td><td><a href="mailto:${SALES_EMAIL}" style="color:${ORANGE}; text-decoration:none;">${SALES_EMAIL}</a></td></tr>
                  <tr><td style="padding-right:8px; color:${MED_GRAY};">Phone</td><td style="color:${NAVY};">${COMPANY_PHONE}</td></tr>
                  <tr><td style="padding-right:8px; color:${MED_GRAY};">Website</td><td><a href="${COMPANY_WEBSITE_URL}" style="color:${ORANGE}; text-decoration:none;">${COMPANY_WEBSITE_LABEL}</a></td></tr>
                </table>
                <div style="margin-top:14px;">
                  <a href="${COMPANY_LINKEDIN_URL}" style="color:${ORANGE}; text-decoration:none; font-size:12px; font-weight:600; margin-right:16px;">LinkedIn</a>
                  <a href="${COMPANY_WHATSAPP_URL}" style="color:${ORANGE}; text-decoration:none; font-size:12px; font-weight:600;">WhatsApp</a>
                </div>
                <p style="margin:16px 0 0; font-size:11px; line-height:1.6; color:${MED_GRAY};">
                  This is an automated confirmation of your quotation request (${escapeHtml(rfq.requestId)}). Please do not reply directly to this email — contact us using the details above.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `Thank you for contacting Trademarco Global.`,
    ``,
    `Hi ${rfq.contactName},`,
    ``,
    `Your quotation request has been successfully received.`,
    `Our sales team will review your request and contact you as soon as possible.`,
    ``,
    `Request ID: ${rfq.requestId}`,
    `Submitted: ${rfq.createdAt}`,
    rfq.manufacturerName ? `Manufacturer: ${rfq.manufacturerName}` : null,
    rfq.productName ? `Product: ${rfq.productName}` : null,
    rfq.partNumber ? `Part Number: ${rfq.partNumber}` : null,
    ``,
    `Your Message:`,
    rfq.message,
    ``,
    `${COMPANY_LEGAL_NAME}`,
    `${COMPANY_ADDRESS}`,
    `Email: ${SALES_EMAIL}`,
    `Phone: ${COMPANY_PHONE}`,
    `Website: ${COMPANY_WEBSITE_LABEL}`,
    `LinkedIn: ${COMPANY_LINKEDIN_URL}`,
    `WhatsApp: ${COMPANY_WHATSAPP_URL}`,
  ].filter((l) => l !== null).join("\n");

  return { subject: "We received your RFQ", html, text };
}
