import { useEffect, useState } from "react";
import { COLORS } from "../theme/colors";
import Icon from "./Icon";

// Floating action button, present on every public page (mounted once in
// MainLayout) — appears once the visitor has scrolled past the first
// viewport and jumps them back to the top of the page.
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <>
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        aria-hidden={!visible}
        tabIndex={visible ? 0 : -1}
        className={`tm-back-to-top${visible ? " tm-back-to-top-visible" : ""}`}
        style={{
          position: "fixed", right: 24, bottom: 24, zIndex: 90,
          width: 48, height: 48, borderRadius: "50%",
          background: COLORS.navy, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", padding: 0,
        }}
      >
        <Icon type="chevron-up" size={22} color="#FFFFFF" />
      </button>
      <style>{`
        .tm-back-to-top {
          opacity: 0; transform: translateY(8px);
          pointer-events: none;
          transition: opacity 0.25s ease, transform 0.25s ease, background 0.2s ease;
        }
        .tm-back-to-top-visible { opacity: 1; transform: translateY(0); pointer-events: auto; }
        .tm-back-to-top:hover { background: ${COLORS.navyLight}; }
        .tm-back-to-top:focus-visible { outline: 2px solid ${COLORS.orange}; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) {
          .tm-back-to-top { transition: opacity 0.25s ease; }
        }
        @media (max-width: 640px) {
          .tm-back-to-top { right: 16px; bottom: 16px; width: 44px; height: 44px; }
        }
      `}</style>
    </>
  );
}
