import { useEffect, useRef, useState } from "react";

// Six-second sector clips that replace the single still in the "Sectors We
// Serve" header. Two <video> slots take turns: the incoming clip starts
// underneath while the outgoing one is still playing, then the outgoing slot
// fades out on top of it. At most two clips are in flight at once.
const CLIPS = [
  { name: "port-logistics", alt: "Container port at dusk" },
  { name: "mining", alt: "Open-pit mining operation" },
  { name: "energy", alt: "Wind turbines on farmland" },
  { name: "manufacturing", alt: "Assembling an electric motor" },
];

const FADE_MS = 1200;

function sourceFor(name, small) {
  return `/videos/${name}${small ? "-sm" : ""}.mp4`;
}

export default function SectorVideo({ className, style }) {
  const [active, setActive] = useState(0);        // which slot is visible
  const [slotClip, setSlotClip] = useState([0, 1]); // clip index held by each slot
  const [live, setLive] = useState(false);        // in view and allowed to play
  const [small, setSmall] = useState(false);
  const slots = [useRef(null), useRef(null)];
  const wrapRef = useRef(null);
  const advancing = useRef(false);

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
      (entries) => setLive(entries[0]?.isIntersecting ?? false),
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!live) {
      slots.forEach((ref) => ref.current?.pause());
      return;
    }
    const attempt = slots[active].current?.play();
    // Autoplay can still be refused (battery saver, strict settings) — the
    // poster underneath stays visible, which is a fine outcome.
    if (attempt?.catch) attempt.catch(() => {});
  }, [live, small]); // eslint-disable-line react-hooks/exhaustive-deps

  function advance() {
    if (advancing.current) return;
    advancing.current = true;

    const incoming = 1 - active;
    const video = slots[incoming].current;
    if (video) {
      video.currentTime = 0;
      const attempt = video.play();
      if (attempt?.catch) attempt.catch(() => {});
    }
    setActive(incoming);

    // Only once the outgoing slot has fully faded out does it get loaded with
    // the clip after next — swapping it any earlier flashes a blank frame
    // mid-fade.
    setTimeout(() => {
      setSlotClip((held) => {
        const next = [...held];
        next[1 - incoming] = (held[incoming] + 1) % CLIPS.length;
        return next;
      });
      advancing.current = false;
    }, FADE_MS + 100);
  }

  // Start the crossfade before the clip ends, so the outgoing picture is still
  // moving while it fades instead of freezing on its last frame.
  function handleTimeUpdate(event, slot) {
    if (slot !== active) return;
    const v = event.currentTarget;
    if (v.duration && v.currentTime >= v.duration - FADE_MS / 1000) advance();
  }

  const current = CLIPS[slotClip[active]];

  return (
    <div
      ref={wrapRef}
      className={className}
      // translateZ(0) gives the wrapper its own compositing layer — without it
      // Safari ignores border-radius clipping on <video> children.
      style={{ position: "relative", overflow: "hidden", transform: "translateZ(0)", ...style }}
      aria-label={`${current.alt} — sectors we serve`}
      role="img"
    >
      {/* Poster underneath covers the first paint and a refused autoplay. */}
      <img
        src={`/videos/${current.name}-poster.webp`}
        alt=""
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />

      {[0, 1].map((slot) => {
        const isActive = slot === active;
        const clip = CLIPS[slotClip[slot]];
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
            onTimeUpdate={(e) => handleTimeUpdate(e, slot)}
            onEnded={() => { if (slot === active) advance(); }}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              // The incoming clip appears at full opacity underneath; only the
              // outgoing one fades, on top. Fading both at once would let the
              // background show through halfway.
              zIndex: isActive ? 1 : 2,
              opacity: isActive ? 1 : 0,
              transition: isActive ? "none" : `opacity ${FADE_MS}ms ease-in-out`,
            }}
          />
        );
      })}
    </div>
  );
}
