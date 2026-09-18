import { useEffect, useRef, useState } from "react";

// Six-second sector clips that replace the single still in the "Sectors We
// Serve" header. Two <video> slots crossfade into each other, so at most two
// clips are in flight at once rather than all four.
const CLIPS = [
  { name: "port-logistics", alt: "Container port at dusk" },
  { name: "mining", alt: "Open-pit mining operation" },
  { name: "energy", alt: "Wind turbines on farmland" },
  { name: "manufacturing", alt: "Assembling an electric motor" },
];

const FADE_MS = 700;

function sourceFor(name, small) {
  return `/videos/${name}${small ? "-sm" : ""}.mp4`;
}

export default function SectorVideo({ className, style }) {
  const [index, setIndex] = useState(0);
  const [live, setLive] = useState(false);   // in view and allowed to play
  const [small, setSmall] = useState(false);
  const slots = [useRef(null), useRef(null)];
  const wrapRef = useRef(null);

  // Anything under a laptop screen gets the 854px encodes; the header image is
  // hidden altogether below 800px, so this only ever covers small laptops.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1100px)");
    const apply = () => setSmall(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Nothing is fetched until the section is actually approaching the viewport,
  // so the clips never compete with the hero for bandwidth.
  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? false;
        setLive(visible);
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Play the active slot; hold the other one at its first frame, ready to take
  // over the moment this clip ends.
  useEffect(() => {
    if (!live) {
      slots.forEach((ref) => ref.current?.pause());
      return;
    }
    const active = slots[index % 2].current;
    if (!active) return;
    active.currentTime = 0;
    const attempt = active.play();
    // Autoplay can still be refused (battery saver, strict settings) — the
    // poster underneath stays visible, which is a fine outcome.
    if (attempt?.catch) attempt.catch(() => {});
  }, [live, index, small]);

  const current = CLIPS[index % CLIPS.length];

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ position: "relative", overflow: "hidden", ...style }}
      aria-label={`${current.alt} — sectors we serve`}
      role="img"
    >
      {/* Poster of the current clip sits underneath, so a slot swap or a
          refused autoplay never shows an empty rectangle. */}
      <img
        src={`/videos/${current.name}-poster.webp`}
        alt=""
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />

      {[0, 1].map((slot) => {
        const isActive = slot === index % 2;
        // The idle slot always holds the clip that comes next.
        const clip = CLIPS[(isActive ? index : index + 1) % CLIPS.length];
        return (
          <video
            key={slot}
            ref={slots[slot]}
            src={sourceFor(clip.name, small)}
            poster={`/videos/${clip.name}-poster.webp`}
            muted
            playsInline
            preload={live ? "auto" : "none"}
            aria-hidden="true"
            tabIndex={-1}
            onEnded={() => setIndex((i) => i + 1)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: isActive ? 1 : 0,
              transition: `opacity ${FADE_MS}ms ease`,
            }}
          />
        );
      })}
    </div>
  );
}
