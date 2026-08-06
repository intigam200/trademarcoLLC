import nodemailer from "nodemailer";
import isEmail from "validator/lib/isEmail.js";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js";
import { verifyTurnstile } from "./_lib/verifyTurnstile.js";
import { buildNotificationEmail, buildConfirmationEmail } from "./_lib/rfqEmails.js";

const SALES_RECIPIENT = "sales@trademarco.com";

const MAX_LEN = {
  name: 200, company: 200, email: 254, phone: 50, country: 100,
  product: 200, partNumber: 100, message: 5000, pageUrl: 500,
};

// Strips control characters (except \n, \r, \t) a client could smuggle into
// a JSON string body — these have no legitimate use in any of these fields
// and would otherwise land in the database and in outbound emails verbatim.
function clean(value) {
  if (typeof value !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();
}

function validate(fields) {
  const errors = {};

  if (!fields.name) errors.name = "Please enter your full name.";
  else if (fields.name.length > MAX_LEN.name) errors.name = "Name is too long.";

  if (!fields.company) errors.company = "Please enter your company name.";
  else if (fields.company.length > MAX_LEN.company) errors.company = "Company name is too long.";

  if (!fields.email) errors.email = "Please enter your email address.";
  else if (fields.email.length > MAX_LEN.email || !isEmail(fields.email)) errors.email = "Please enter a valid email address.";

  if (!fields.product) errors.product = "Please describe the product you're interested in.";
  else if (fields.product.length > MAX_LEN.product) errors.product = "Product description is too long.";

  if (fields.partNumber.length > MAX_LEN.partNumber) errors.partNumber = "Part number is too long.";

  if (!fields.message) errors.message = "Please describe your inquiry.";
  else if (fields.message.length > MAX_LEN.message) errors.message = "Message is too long.";

  if (fields.phone.length > MAX_LEN.phone) errors.phone = "Phone number is too long.";
  if (fields.country.length > MAX_LEN.country) errors.country = "Country is too long.";

  return errors;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || null;
}

async function sendEmails(rfq) {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.error("SMTP environment variables are not fully configured — RFQ emails not sent for", rfq.id);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE ? SMTP_SECURE === "true" : Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  const from = SMTP_FROM || SMTP_USER;

  const notification = buildNotificationEmail(rfq);
  const confirmation = buildConfirmationEmail(rfq);

  // Both are best-effort: the RFQ is already safely stored in Supabase by
  // the time this runs, so a transient SMTP failure shouldn't turn a
  // captured lead into a user-facing error. Each is logged independently so
  // a delivery problem with one doesn't hide a problem with the other.
  const results = await Promise.allSettled([
    transporter.sendMail({ from, to: SALES_RECIPIENT, replyTo: rfq.email, subject: notification.subject, text: notification.text }),
    transporter.sendMail({ from, to: rfq.email, subject: confirmation.subject, html: confirmation.html, text: confirmation.text }),
  ]);
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`RFQ ${i === 0 ? "sales notification" : "customer confirmation"} email failed for ${rfq.id}:`, r.reason?.message || r.reason);
    }
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};

  // Honeypot: a real visitor never sees or fills this field. A bot that
  // blindly fills every input trips it — pretend success without touching
  // Supabase or sending anything, so it doesn't learn to adapt.
  if (clean(body.website)) {
    return res.status(200).json({ ok: true });
  }

  const fields = {
    name: clean(body.name),
    company: clean(body.company),
    email: clean(body.email).toLowerCase(),
    phone: clean(body.phone),
    country: clean(body.country),
    product: clean(body.product),
    partNumber: clean(body.partNumber),
    message: clean(body.message),
    pageUrl: clean(body.pageUrl).slice(0, MAX_LEN.pageUrl),
    manufacturerName: clean(body.manufacturerName),
    productId: clean(body.productId) || null,
    turnstileToken: typeof body.turnstileToken === "string" ? body.turnstileToken : "",
  };

  const errors = validate(fields);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: "Please correct the highlighted fields.", errors });
  }

  const ip = getClientIp(req);

  const spamCheckPassed = await verifyTurnstile(fields.turnstileToken, ip);
  if (!spamCheckPassed) {
    return res.status(403).json({ error: "Spam verification failed. Please refresh the page and try again." });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    console.error("RFQ submission failed — Supabase admin client unavailable:", err.message);
    return res.status(500).json({ error: "We couldn't process your request right now. Please try again shortly." });
  }

  // If this RFQ references a catalog product, trust the database's current
  // record over whatever the client sent for its name/part number/
  // manufacturer — a client can't be relied on not to tamper with those.
  let manufacturerName = fields.manufacturerName || null;
  let productName = fields.product || null;
  let partNumber = fields.partNumber || null;

  if (fields.productId) {
    const { data: product } = await supabase
      .from("products")
      .select("product_name, part_number, manufacturer:manufacturers(name)")
      .eq("id", fields.productId)
      .maybeSingle();
    if (product) {
      manufacturerName = product.manufacturer?.name || manufacturerName;
      productName = product.product_name || productName;
      partNumber = product.part_number || partNumber;
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("rfqs")
    .insert({
      company: fields.company,
      contact_name: fields.name,
      email: fields.email,
      phone: fields.phone || null,
      country: fields.country || null,
      product_id: fields.productId,
      product_text: fields.productId ? null : fields.product,
      manufacturer_name: manufacturerName,
      product_name: productName,
      part_number: partNumber,
      page_url: fields.pageUrl || null,
      message: fields.message,
      status: "unread",
      ip_address: ip,
      user_agent: clean(req.headers["user-agent"] || "") || null,
    })
    .select("id, created_at")
    .single();

  if (insertError) {
    console.error("RFQ insert failed:", insertError.message);
    return res.status(500).json({ error: "We couldn't submit your request right now. Please try again, or email us directly at sales@trademarco.com." });
  }

  const rfq = {
    id: inserted.id,
    createdAt: new Date(inserted.created_at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" }),
    contactName: fields.name,
    company: fields.company,
    email: fields.email,
    phone: fields.phone,
    country: fields.country,
    manufacturerName,
    productName,
    partNumber,
    message: fields.message,
    pageUrl: fields.pageUrl,
    ipAddress: ip,
    userAgent: clean(req.headers["user-agent"] || ""),
  };

  await sendEmails(rfq);

  return res.status(200).json({ ok: true, id: inserted.id });
}
