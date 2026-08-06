import { useEffect, useRef, useState } from "react";
import isEmail from "validator/lib/isEmail.js";
import { COLORS } from "../theme/colors";
import Icon from "./Icon";
import Button from "./Button";
import Turnstile from "./Turnstile";

const FIELD_LABELS = {
  name: "Full Name",
  company: "Company",
  email: "Email",
  product: "Product",
  message: "Your Inquiry",
};

function validateField(key, value) {
  const v = value.trim();
  switch (key) {
    case "name": return v ? "" : "Please enter your full name.";
    case "company": return v ? "" : "Please enter your company name.";
    case "email":
      if (!v) return "Please enter your email address.";
      if (!isEmail(v)) return "Please enter a valid email address.";
      return "";
    case "product": return v ? "" : "Please describe the product you're interested in.";
    case "message": return v ? "" : "Please describe your inquiry.";
    default: return "";
  }
}

function TextField({ id, label, required, optionalHint, error, textarea, inputRef, style = {}, ...props }) {
  const errorId = error ? `${id}-error` : undefined;
  const Tag = textarea ? "textarea" : "input";
  return (
    <div>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 600, color: COLORS.navy, display: "block", marginBottom: 6 }}>
        {label}
        {required && <span aria-hidden="true" style={{ color: "#C0392B" }}> *</span>}
        {optionalHint && <span style={{ fontWeight: 400, color: COLORS.medGray, textTransform: "none", letterSpacing: 0 }}> {optionalHint}</span>}
      </label>
      <Tag
        id={id}
        ref={inputRef}
        className="tm-cf-field"
        aria-required={required || undefined}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={errorId}
        style={{
          width: "100%", padding: "12px 14px", fontSize: 14, fontFamily: "inherit",
          border: `1px solid ${error ? "#C0392B" : COLORS.borderGray}`, borderRadius: 3, outline: "none",
          color: COLORS.darkGray, background: COLORS.white, transition: "border-color 0.15s",
          ...(textarea ? { minHeight: 120, resize: "vertical" } : {}),
          ...style,
        }}
        {...props}
      />
      {error && <div id={errorId} role="alert" style={{ fontSize: 12, color: "#C0392B", marginTop: 5 }}>{error}</div>}
    </div>
  );
}

export default function ContactForm({ productId = null, manufacturerName = "", productName = "", partNumber = "", initialMessage = "" }) {
  const isProductContext = Boolean(productId);

  const initialForm = {
    name: "", company: "", email: "", phone: "", country: "",
    product: isProductContext ? productName : "",
    partNumber: isProductContext ? partNumber : "",
    message: initialMessage,
    website: "", // honeypot — never shown, never filled by real visitors
  };

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const fieldRefs = useRef({});
  const successRef = useRef(null);
  const errorRef = useRef(null);

  useEffect(() => {
    if (status === "sent") successRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (status === "error") errorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [status]);

  const set = (k) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
    setErrors((errs) => (errs[k] ? { ...errs, [k]: "" } : errs));
  };

  const blurValidate = (k) => () => {
    const err = validateField(k, form[k]);
    setErrors((errs) => ({ ...errs, [k]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === "sending") return; // guard against double submission

    // Honeypot: a real visitor never sees or fills this field (off-screen,
    // unlabeled). A bot that blindly fills every input trips it — pretend
    // success without touching the network, so it doesn't learn to adapt.
    if (form.website.trim()) {
      setStatus("sent");
      return;
    }

    const newErrors = {};
    for (const key of Object.keys(FIELD_LABELS)) {
      const err = validateField(key, form[key]);
      if (err) newErrors[key] = err;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setErrorMsg("Please correct the highlighted fields below.");
      setStatus("error");
      const firstInvalid = Object.keys(newErrors)[0];
      fieldRefs.current[firstInvalid]?.focus();
      return;
    }

    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          company: form.company.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          country: form.country.trim(),
          product: form.product.trim(),
          partNumber: form.partNumber.trim(),
          message: form.message.trim(),
          website: form.website,
          productId,
          manufacturerName,
          pageUrl: typeof window !== "undefined" ? window.location.href : "",
          turnstileToken,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.errors) setErrors((errs) => ({ ...errs, ...data.errors }));
        throw new Error(data.error || "Something went wrong submitting your request.");
      }

      setStatus("sent");
      setErrors({});

      // Conversion tracking — no-op until Google Analytics (gtag.js) is
      // actually installed on the site; wired up now so it activates
      // automatically the moment it is.
      if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("event", "generate_lead", {
          event_category: "RFQ",
          event_label: productName || form.product,
        });
      }
    } catch (err) {
      console.error("RFQ submission failed:", err);
      setErrorMsg(err.message || "Something went wrong submitting your request. Please try again or email us directly.");
      setStatus("error");
      setResetKey((k) => k + 1); // fetch a fresh Turnstile token before retrying
    }
  };

  const sendAnother = () => {
    setForm(initialForm);
    setErrors({});
    setErrorMsg("");
    setStatus("idle");
  };

  if (status === "sent") {
    return (
      <div ref={successRef} role="status" aria-live="polite" tabIndex={-1} style={{ background: COLORS.lightGray, borderRadius: 4, padding: "48px 32px", textAlign: "center" }}>
        <Icon type="check" size={40} color={COLORS.orange} />
        <h3 style={{ fontSize: 20, fontWeight: 700, color: COLORS.navy, margin: "16px 0 8px" }}>Inquiry Received</h3>
        <p style={{ fontSize: 14, color: COLORS.medGray, margin: "0 0 20px" }}>
          Thank you for contacting TradeMarco Global. A confirmation has been sent to your email, and our sales team will respond within one business day.
        </p>
        <button
          type="button"
          onClick={sendAnother}
          style={{ fontSize: 13, fontWeight: 600, color: COLORS.orange, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}
        >
          Submit another inquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Honeypot — off-screen and unlabeled, invisible to real visitors but
          commonly auto-filled by bots. Do not add a visible label or "name"/
          "email" as the field name, that defeats the purpose. */}
      <input
        type="text"
        name="website"
        value={form.website}
        onChange={set("website")}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />

      {isProductContext && (
        <div style={{ background: COLORS.lightGray, border: `1px solid ${COLORS.borderGray}`, borderRadius: 6, padding: "10px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: COLORS.medGray, marginBottom: 3 }}>
            Requesting a Quote For
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.navy }}>
            {productName}{form.partNumber ? ` — ${form.partNumber}` : ""}
          </div>
          {manufacturerName && <div style={{ fontSize: 12, color: COLORS.medGray, marginTop: 1 }}>{manufacturerName}</div>}
        </div>
      )}

      <div className="tm-cf-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <TextField id="rfq-name" label={FIELD_LABELS.name} required value={form.name} onChange={set("name")} onBlur={blurValidate("name")}
          error={errors.name} placeholder="John Smith" inputRef={(el) => (fieldRefs.current.name = el)} autoComplete="name" />
        <TextField id="rfq-email" label={FIELD_LABELS.email} required type="email" value={form.email} onChange={set("email")} onBlur={blurValidate("email")}
          error={errors.email} placeholder="john@company.com" inputRef={(el) => (fieldRefs.current.email = el)} autoComplete="email" />
      </div>

      <TextField id="rfq-company" label={FIELD_LABELS.company} required value={form.company} onChange={set("company")} onBlur={blurValidate("company")}
        error={errors.company} placeholder="Company name" inputRef={(el) => (fieldRefs.current.company = el)} autoComplete="organization" />

      {!isProductContext && (
        <div className="tm-cf-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <TextField id="rfq-product" label={FIELD_LABELS.product} required value={form.product} onChange={set("product")} onBlur={blurValidate("product")}
            error={errors.product} placeholder="e.g. Pressure relief valve, 4 inch" inputRef={(el) => (fieldRefs.current.product = el)} />
          <TextField id="rfq-part-number" label="Part Number" optionalHint="(if known)" value={form.partNumber} onChange={set("partNumber")}
            placeholder="e.g. AI820" inputRef={(el) => (fieldRefs.current.partNumber = el)} />
        </div>
      )}

      <div className="tm-cf-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <TextField id="rfq-phone" label="Phone Number" optionalHint="(optional)" type="tel" value={form.phone} onChange={set("phone")}
          placeholder="+1 (XXX) XXX-XXXX" inputRef={(el) => (fieldRefs.current.phone = el)} autoComplete="tel" />
        <TextField id="rfq-country" label="Country / Delivery Destination" value={form.country} onChange={set("country")}
          placeholder="e.g. Saudi Arabia, Houston TX" inputRef={(el) => (fieldRefs.current.country = el)} autoComplete="country-name" />
      </div>

      <TextField id="rfq-message" label={FIELD_LABELS.message} required textarea value={form.message} onChange={set("message")} onBlur={blurValidate("message")}
        error={errors.message} placeholder="Describe the products you need: type, specifications, quantity, delivery destination..."
        inputRef={(el) => (fieldRefs.current.message = el)} />

      <Turnstile onToken={setTurnstileToken} resetKey={resetKey} />

      {status === "error" && errorMsg && (
        <div ref={errorRef} role="alert" tabIndex={-1} style={{ fontSize: 13, color: "#C0392B", background: "#FDECEA", borderRadius: 4, padding: "10px 14px" }}>
          {errorMsg}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        style={{ width: "100%", justifyContent: "center", marginTop: 4, opacity: status === "sending" ? 0.7 : 1, cursor: status === "sending" ? "default" : "pointer" }}
        disabled={status === "sending"}
        aria-busy={status === "sending"}
      >
        {status === "sending" ? (
          <>
            <span className="tm-cf-spinner" aria-hidden="true" />
            Sending…
          </>
        ) : "Submit Inquiry"}
      </Button>

      <style>{`
        .tm-cf-field:focus { border-color: ${COLORS.navy}; }
        .tm-cf-field[aria-invalid="true"]:focus { border-color: #C0392B; }
        .tm-cf-spinner {
          display: inline-block; width: 14px; height: 14px; margin-right: 8px;
          border: 2px solid rgba(255,255,255,0.4); border-top-color: #FFFFFF;
          border-radius: 50%; animation: tm-cf-spin 0.7s linear infinite; vertical-align: -2px;
        }
        @keyframes tm-cf-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .tm-cf-spinner { animation-duration: 1.4s; }
        }
        @media (max-width: 420px) {
          .tm-cf-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </form>
  );
}
