import { useState } from "react";
import { COLORS } from "../theme/colors";
import Icon from "./Icon";
import Button from "./Button";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const inputStyle = {
    width: "100%", padding: "12px 14px", fontSize: 14, fontFamily: "inherit",
    border: `1px solid ${COLORS.borderGray}`, borderRadius: 3, outline: "none",
    color: COLORS.darkGray, background: COLORS.white, transition: "border-color 0.15s",
  };

  if (sent) {
    return (
      <div style={{ background: COLORS.lightGray, borderRadius: 4, padding: "48px 32px", textAlign: "center" }}>
        <Icon type="check" size={40} color={COLORS.orange} />
        <h3 style={{ fontSize: 20, fontWeight: 700, color: COLORS.navy, margin: "16px 0 8px" }}>Inquiry Received</h3>
        <p style={{ fontSize: 14, color: COLORS.medGray, margin: 0 }}>We will review your request and respond within one business day.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.navy, display: "block", marginBottom: 6 }}>Full Name</label>
          <input style={inputStyle} value={form.name} onChange={set("name")} placeholder="John Smith"
            onFocus={e => e.target.style.borderColor = COLORS.navy} onBlur={e => e.target.style.borderColor = COLORS.borderGray} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.navy, display: "block", marginBottom: 6 }}>Email</label>
          <input style={inputStyle} type="email" value={form.email} onChange={set("email")} placeholder="john@company.com"
            onFocus={e => e.target.style.borderColor = COLORS.navy} onBlur={e => e.target.style.borderColor = COLORS.borderGray} />
        </div>
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.navy, display: "block", marginBottom: 6 }}>Company</label>
        <input style={inputStyle} value={form.company} onChange={set("company")} placeholder="Company name"
          onFocus={e => e.target.style.borderColor = COLORS.navy} onBlur={e => e.target.style.borderColor = COLORS.borderGray} />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.navy, display: "block", marginBottom: 6 }}>Your Inquiry</label>
        <textarea style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} value={form.message} onChange={set("message")}
          placeholder="Describe the products you need: type, specifications, quantity, delivery destination..."
          onFocus={e => e.target.style.borderColor = COLORS.navy} onBlur={e => e.target.style.borderColor = COLORS.borderGray} />
      </div>
      <Button variant="primary" style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
        onClick={() => { if (form.name && form.email && form.message) setSent(true); }}>
        Submit Inquiry
      </Button>
    </div>
  );
}
