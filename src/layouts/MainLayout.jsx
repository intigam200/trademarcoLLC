import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";
import { QuoteListProvider } from "../context/QuoteListContext";
import { COLORS } from "../theme/colors";
import { Analytics } from "@vercel/analytics/react";

export default function MainLayout({ children }) {
  return (
    <QuoteListProvider>
      <div style={{ fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: COLORS.darkGray, margin: 0, lineHeight: 1.6, WebkitFontSmoothing: "antialiased" }}>
        <a href="#main-content" className="tm-skip-link">Skip to content</a>
        <TopBar />
        <Navbar />
        <main id="main-content">
          {children}
        </main>
        <Footer />
        <BackToTop />
        <Analytics />

        <style>{`
          .mobile-burger { display: none !important; }
          @media (max-width: 768px) {
            .desktop-nav { display: none !important; }
            .mobile-burger { display: block !important; }
          }
          @media (min-width: 769px) {
            .mobile-menu { display: none !important; }
          }
          * { box-sizing: border-box; }
          html { scroll-behavior: smooth; }
          @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }

          .tm-skip-link {
            position: absolute; top: -48px; left: 8px; z-index: 1000;
            background: ${COLORS.orange}; color: ${COLORS.white};
            padding: 12px 20px; border-radius: 4px; font-size: 14px; font-weight: 700;
            text-decoration: none; transition: top 0.15s ease;
          }
          .tm-skip-link:focus { top: 8px; }

          .tm-icon {
            color: var(--tm-icon-color);
            transition: transform 0.3s ease, color 0.3s ease;
          }
          .tm-hover-icon:hover .tm-icon {
            transform: scale(1.15);
            color: var(--tm-icon-hover-color);
          }
          .tm-icon-pulsing {
            animation: tm-icon-pulse 0.3s ease;
          }
          @keyframes tm-icon-pulse {
            0% { transform: scale(1.15); }
            50% { transform: scale(1.3); }
            100% { transform: scale(1.15); }
          }
          @media (prefers-reduced-motion: reduce) {
            .tm-icon, .tm-icon-pulsing { animation: none !important; transition: none !important; }
          }
        `}</style>
      </div>
    </QuoteListProvider>
  );
}
