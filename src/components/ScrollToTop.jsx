import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Browsers don't reset scroll position on client-side route changes (only
// full page loads), so without this a link clicked near the footer leaves
// the next page open scrolled to that same offset instead of the top.
//
// When the target URL carries a hash (/industries#mining, /#contact) the
// browser's own anchor handling doesn't apply either — the element isn't in
// the document yet at navigation time — so resolve it here instead of
// dropping the visitor at the top of a page they asked to enter part-way
// down. scrollIntoView is used rather than a manual offset so each target's
// own scroll-margin-top keeps it clear of the fixed navbar.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior });
      return;
    }

    const id = decodeURIComponent(hash.slice(1));

    // The element is usually present on the first frame, but a section
    // rendered from fetched data may be a couple of frames behind. Give it a
    // few attempts before falling back to the top of the page.
    let frame;
    let attempts = 0;
    const timers = [];
    let cancelled = false;

    // Images and fetched sections above the target keep loading while the
    // smooth scroll is still running, pushing it further down the page — so
    // the first scroll routinely lands short. Re-aim a few times while the
    // layout settles, and stop the moment the visitor takes over.
    const stopCorrecting = () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };

    const scrollToTarget = (target) => {
      target.scrollIntoView({ behavior, block: "start" });
      [200, 500, 900, 1400].forEach((delay) => {
        timers.push(setTimeout(() => {
          if (cancelled) return;
          const top = target.getBoundingClientRect().top;
          // A correctly parked target sits just below the fixed navbar; any
          // larger gap means the page grew underneath the scroll.
          if (top > 160 || top < -40) target.scrollIntoView({ behavior, block: "start" });
        }, delay));
      });
    };

    const findAndScroll = () => {
      const target = document.getElementById(id);
      if (target) {
        scrollToTarget(target);
        return;
      }
      if (attempts++ < 10) frame = requestAnimationFrame(findAndScroll);
      else window.scrollTo({ top: 0, left: 0, behavior });
    };
    frame = requestAnimationFrame(findAndScroll);

    window.addEventListener("wheel", stopCorrecting, { passive: true, once: true });
    window.addEventListener("touchstart", stopCorrecting, { passive: true, once: true });

    return () => {
      cancelAnimationFrame(frame);
      stopCorrecting();
      window.removeEventListener("wheel", stopCorrecting);
      window.removeEventListener("touchstart", stopCorrecting);
    };
  }, [pathname, hash]);

  return null;
}
