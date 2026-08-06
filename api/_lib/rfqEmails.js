const SITE_URL = "https://trademarco.com";
const LOGO_URL = `${SITE_URL}/images/products/logo.png`;
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
// Includes every field requested: date, contact info, product context, message, source URL.
export function buildNotificationEmail(rfq) {
  const lines = [
    `New RFQ received — ${rfq.createdAt}`,
    "",
    `Customer Name: ${rfq.contactName}`,
    `Company: ${rfq.company || "—"}`,
    `Email: ${rfq.email}`,
    `Phone: ${rfq.phone || "—"}`,
    `Country: ${rfq.country || "—"}`,
    "",
    `Manufacturer: ${rfq.manufacturerName || "—"}`,
    `Product: ${rfq.productName || "—"}`,
    `Part Number: ${rfq.partNumber || "—"}`,
    "",
    "Message:",
    rfq.message,
    "",
    `Page URL: ${rfq.pageUrl || "—"}`,
    `IP Address: ${rfq.ipAddress || "—"}`,
    `User Agent: ${rfq.userAgent || "—"}`,
    "",
    `RFQ ID: ${rfq.id}`,
  ];
  return {
    subject: `New RFQ from ${rfq.contactName}${rfq.company ? ` (${rfq.company})` : ""}`,
    text: lines.join("\n"),
  };
}

// Customer-facing confirmation — professional branded HTML email, sent the
// moment an RFQ is stored. Table-based layout for broad email client
// compatibility (Outlook/Gmail); every dynamic value is HTML-escaped since
// it's interpolated directly into markup.
export function buildConfirmationEmail(rfq) {
  const name = escapeHtml(rfq.contactName);
  const productRows = [
    rfq.manufacturerName && ["Manufacturer", rfq.manufacturerName],
    rfq.productName && ["Product", rfq.productName],
    rfq.partNumber && ["Part Number", rfq.partNumber],
  ].filter(Boolean);

  const productTable = productRows.length
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0; border:1px solid ${BORDER_GRAY}; border-radius:8px; overflow:hidden;">
        ${productRows.map(([label, value], i) => `
          <tr style="background:${i % 2 === 0 ? "#FFFFFF" : LIGHT_GRAY};">
            <td style="padding:10px 16px; font-size:12px; font-weight:700; color:${MED_GRAY}; text-transform:uppercase; letter-spacing:0.04em; width:140px;">${escapeHtml(label)}</td>
            <td style="padding:10px 16px; font-size:14px; color:${NAVY}; font-weight:600;">${escapeHtml(value)}</td>
          </tr>
        `).join("")}
      </table>
    `
    : "";

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
                <img src="${LOGO_URL}" alt="TradeMarco Global" height="40" style="display:block; height:40px; width:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <div style="font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${ORANGE}; margin-bottom:12px;">Request Received</div>
                <h1 style="margin:0 0 16px; font-size:22px; line-height:1.3; color:${NAVY};">Thank you for contacting TradeMarco Global.</h1>
                <p style="margin:0 0 8px; font-size:15px; line-height:1.7; color:${MED_GRAY};">Hi ${name},</p>
                <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:${MED_GRAY};">
                  Your quotation request has been received. Our sales team will contact you as soon as possible.
                </p>
                ${productTable}
                <div style="margin:20px 0 0;">
                  <div style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; color:${MED_GRAY}; margin-bottom:8px;">Your Message</div>
                  <div style="font-size:14px; line-height:1.7; color:${NAVY}; background:${LIGHT_GRAY}; border:1px solid ${BORDER_GRAY}; border-radius:8px; padding:14px 16px; white-space:pre-line;">${nl2br(escapeHtml(rfq.message))}</div>
                </div>
                <p style="margin:28px 0 0; font-size:13px; line-height:1.7; color:${MED_GRAY};">
                  Reference ID: <strong style="color:${NAVY};">${escapeHtml(rfq.id)}</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:${LIGHT_GRAY}; padding:24px 32px; border-top:1px solid ${BORDER_GRAY};">
                <p style="margin:0 0 4px; font-size:13px; font-weight:700; color:${NAVY};">TradeMarco LLC</p>
                <p style="margin:0; font-size:12px; line-height:1.6; color:${MED_GRAY};">
                  30 N Gould St Ste N, Sheridan, WY 82801, USA<br />
                  <a href="mailto:sales@trademarco.com" style="color:${ORANGE}; text-decoration:none;">sales@trademarco.com</a> · +1 (307) 999-8667
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
    `Thank you for contacting TradeMarco Global.`,
    ``,
    `Hi ${rfq.contactName},`,
    ``,
    `Your quotation request has been received. Our sales team will contact you as soon as possible.`,
    ``,
    rfq.manufacturerName ? `Manufacturer: ${rfq.manufacturerName}` : null,
    rfq.productName ? `Product: ${rfq.productName}` : null,
    rfq.partNumber ? `Part Number: ${rfq.partNumber}` : null,
    ``,
    `Your Message:`,
    rfq.message,
    ``,
    `Reference ID: ${rfq.id}`,
    ``,
    `TradeMarco LLC — 30 N Gould St Ste N, Sheridan, WY 82801, USA`,
    `sales@trademarco.com · +1 (307) 999-8667`,
  ].filter((l) => l !== null).join("\n");

  return { subject: "We received your RFQ", html, text };
}
