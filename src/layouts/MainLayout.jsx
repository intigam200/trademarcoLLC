import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";
import { COLORS } from "../theme/colors";
import { Analytics } from "@vercel/analytics/react";

export default function MainLayout({ children }) {
  return (
    <div style={{ fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: COLORS.darkGray, margin: 0, lineHeight: 1.6, WebkitFontSmoothing: "antialiased" }}>
      <TopBar />
      <Navbar />
      <main>
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
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
  );
}
