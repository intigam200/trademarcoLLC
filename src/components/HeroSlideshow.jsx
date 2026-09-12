import { useEffect, useState } from "react";
import { INDUSTRIES } from "../data/content";

// Crossfading stack of the sector photographs, sized to whatever element it
// is dropped into — the caller owns the positioning, mask and wash, so the
// same rotation can sit behind the home hero and the industries hero without
// either having to match the other's framing.
//
// A picture added to INDUSTRIES joins the rotation automatically.
const SLIDES = INDUSTRIES.filter((i) => i.photo);
const SLIDE_MS = 6000;

export default function HeroSlideshow() {
  const [slide, setSlide] = useState(0);
  const [ready, setReady] = useState(false);

  // Hold the remaining frames back until the page has finished loading, so
  // the first one is the only hero image competing for bandwidth while the
  // page is still painting.
  useEffect(() => {
    if (document.readyState === "complete") { setReady(true); return; }
    const onLoad = () => setReady(true);
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (!ready || SLIDES.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [ready]);

  return (
    <>
      {SLIDES.map((ind, i) => {
        // Fetch one frame ahead of the rotation rather than all six at once.
        const load = i === 0 || (ready && i <= slide + 1);
        return (
          <div
            key={ind.slug}
            aria-hidden="true"
            className={`tm-hero-slide${i === slide ? " tm-hero-slide-active" : ""}`}
            style={load ? {
              "--hero-img": `url(/images/industries/${ind.photo}.webp)`,
              "--hero-img-sm": `url(/images/industries/${ind.photo}-sm.webp)`,
            } : undefined}
          />
        );
      })}

      <style>{`
        .tm-hero-slide {
          position: absolute;
          inset: 0;
          background-image: var(--hero-img);
          background-size: cover;
          background-position: center;
          opacity: 0;
          transition: opacity 1.4s ease-in-out;
        }
        .tm-hero-slide-active { opacity: 1; }

        @media (max-width: 900px) {
          .tm-hero-slide { background-image: var(--hero-img-sm); }
        }
        @media (prefers-reduced-motion: reduce) {
          /* The rotation is already suppressed in JS; drop the fade too so
             nothing moves if that check is ever bypassed. */
          .tm-hero-slide { transition: none; }
        }
      `}</style>
    </>
  );
}
