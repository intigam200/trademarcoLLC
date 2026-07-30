import { COLORS } from "../theme/colors";

export function Section({ id, bg = COLORS.white, children, style = {} }) {
  return (
    <section id={id} style={{ background: bg, scrollMarginTop: 64, ...style }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "88px 24px" }}>
        {children}
      </div>
    </section>
  );
}

export function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.orange, marginBottom: 12 }}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, color = COLORS.navy, style = {} }) {
  return (
    <h2 style={{ fontSize: "clamp(26px, 3.2vw, 36px)", fontWeight: 700, color, lineHeight: 1.2, margin: "0 0 16px", letterSpacing: "-0.01em", ...style }}>
      {children}
    </h2>
  );
}

export function SectionDesc({ children, color = COLORS.medGray, style = {} }) {
  return (
    <p style={{ fontSize: 16, lineHeight: 1.7, color, margin: 0, maxWidth: 560, ...style }}>
      {children}
    </p>
  );
}
