"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Fade-and-rise the first time the element scrolls into view.
 *
 * Phase 16 replaced the `motion` dependency here: it was ~120 KB of client
 * JavaScript on every public page for this one effect. Distance, duration,
 * delay and the "animate only once" behaviour are unchanged.
 *
 * The hidden state is server-rendered, as before; the <noscript> rule in the
 * layout keeps the content visible when JavaScript is off. Reduced motion is
 * already handled by globals.css, which collapses transition durations.
 */
export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      // Browser without the observer: reveal on the next frame, so the effect
      // never sets state synchronously.
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal=""
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(18px)",
        transition: `opacity .55s ease ${delay}s, transform .55s ease ${delay}s`
      }}
    >
      {children}
    </div>
  );
}
