import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { COLORS } from "../theme/colors";
import { listManufacturers } from "../lib/supabase/manufacturers";

// Continuously scrolling strip of the brands in the catalogue, sitting between
// the hero and the benefit bar. The names come from Supabase rather than a
// hardcoded list, so adding a manufacturer in the admin panel adds it here too.
export default function BrandMarquee() {
  const [manufacturers, setManufacturers] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listManufacturers({ status: "active" })
      .then((data) => { if (!cancelled) setManufacturers(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  // Only bail out once we know there is genuinely nothing to show — bailing
  // while the fetch is still in flight would shift the rest of the page down
  // when the strip appeared.
  if (loaded && manufacturers.length === 0) return null;

  const brandItems = (hidden) =>
    manufacturers.map((m) => (
      <Link
        key={`${hidden ? "b" : "a"}-${m.slug}`}
        to={`/manufacturers/${m.slug}`}
        className="tm-brand-item"
        tabIndex={hidden ? -1 : undefined}
      >
        {m.name}
      </Link>
    ));

  return (
    <section className="tm-brand-section" style={{ background: "#14203A", position: "relative", overflow: "hidden", zIndex: 2 }}>
      {/* Refinery photo, then a navy wash over it — same treatment as the hero,
          so the strip reads as one continuous dark band rather than a photo
          block dropped between two sections. */}
      <div className="tm-brand-bg" aria-hidden="true" />
      <div className="tm-brand-wash" aria-hidden="true" />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 40px 0", position: "relative", zIndex: 1 }}>
        <div className="tm-brand-head">
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.orange, marginBottom: 14 }}>
            Manufacturers
          </div>
          <h2 style={{ fontSize: "clamp(26px, 3.4vw, 40px)", fontWeight: 800, color: COLORS.white, lineHeight: 1.15, margin: 0, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
            Leading Industrial Brands
          </h2>
        </div>
      </div>

      <div className="tm-brand-marquee">
        <div className="tm-brand-track">
          <div className="tm-brand-group">{brandItems(false)}</div>
          <div className="tm-brand-group" aria-hidden="true">{brandItems(true)}</div>
        </div>
      </div>

      <style>{`
        /* Hairline along the top edge, so the hero photo ends on a deliberate
           rule instead of an abrupt cut. Brightest mid-width, easing off
           towards the edges rather than stopping dead. */
        .tm-brand-section::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          z-index: 2;
          background: linear-gradient(90deg,
            rgba(255,255,255,0.12) 0%,
            rgba(255,255,255,0.75) 50%,
            rgba(255,255,255,0.12) 100%);
        }

        .tm-brand-head { padding-bottom: 44px; }

        /* 60 KB WebP (20 KB below 900px) rather than the 1.5 MB source PNG,
           and a plain background layer so it never competes with the hero
           image for load priority. */
        .tm-brand-bg {
          position: absolute; inset: 0;
          background-image: url(/images/products/brandsanimation.webp);
          background-size: cover;
          background-position: center 58%;
        }
        .tm-brand-wash {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, rgba(20,32,58,0.95) 0%, rgba(20,32,58,0.86) 42%, rgba(20,32,58,0.62) 100%);
        }

        .tm-brand-marquee {
          position: relative;
          z-index: 1;
          /* Deepens toward the right, where the photo is brightest, so the
             names hold the same contrast across the whole strip. */
          background: linear-gradient(90deg, rgba(13,22,42,0.5) 0%, rgba(13,22,42,0.74) 100%);
          border-top: 1px solid rgba(255,255,255,0.1);
          border-bottom: 1px solid rgba(255,255,255,0.1);
          overflow: hidden;
          /* Feather both edges so names dissolve instead of being sliced off */
          mask-image: linear-gradient(90deg, transparent 0, black 8%, black 92%, transparent 100%);
          -webkit-mask-image: linear-gradient(90deg, transparent 0, black 8%, black 92%, transparent 100%);
        }
        .tm-brand-track {
          display: flex;
          width: max-content;
          animation: tm-brand-scroll 45s linear infinite;
        }
        .tm-brand-marquee:hover .tm-brand-track { animation-play-state: paused; }
        .tm-brand-group { display: flex; }

        /* Each group is exactly half the track, so resetting at -50% lands the
           duplicate precisely where the original started — no visible seam. */
        @keyframes tm-brand-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .tm-brand-item {
          display: flex;
          align-items: center;
          height: 78px;
          padding: 0 44px;
          border-left: 1px solid rgba(255,255,255,0.08);
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          white-space: nowrap;
          color: rgba(255,255,255,0.55);
          text-decoration: none;
          transition: color 0.2s ease, background 0.2s ease;
        }
        .tm-brand-item:hover { color: ${COLORS.white}; background: rgba(255,255,255,0.04); }

        @media (max-width: 900px) {
          .tm-brand-bg { background-image: url(/images/products/brandsanimation-sm.webp); }
          .tm-brand-wash {
            background: linear-gradient(90deg, rgba(20,32,58,0.94) 0%, rgba(20,32,58,0.82) 100%);
          }
        }
        @media (max-width: 768px) {
          .tm-brand-item { height: 64px; padding: 0 28px; font-size: 12px; letter-spacing: 0.16em; }
        }

        @media (prefers-reduced-motion: reduce) {
          .tm-brand-track { animation: none; }
          .tm-brand-marquee { overflow-x: auto; }
        }
      `}</style>
    </section>
  );
}
