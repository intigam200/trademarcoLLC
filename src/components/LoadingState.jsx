import { COLORS } from "../theme/colors";

export default function LoadingState({ label = "Loading…", minHeight = 240 }) {
  return (
    <div style={{ minHeight, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", textAlign: "center" }}>
      <span className="tm-spinner" />
      <p style={{ marginTop: 14, fontSize: 14, color: COLORS.medGray }}>{label}</p>
      <style>{`
        .tm-spinner {
          width: 26px; height: 26px; border-radius: 50%;
          border: 3px solid ${COLORS.borderGray}; border-top-color: ${COLORS.orange};
          animation: tm-spin 0.7s linear infinite;
        }
        @keyframes tm-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .tm-spinner { animation-duration: 1.6s; } }
      `}</style>
    </div>
  );
}
