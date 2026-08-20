import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Browsers don't reset scroll position on client-side route changes (only
// full page loads), so without this a link clicked near the footer leaves
// the next page open scrolled to that same offset instead of the top.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [pathname]);

  return null;
}
