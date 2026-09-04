"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  stagger?: boolean;
  delay?: number;
  className?: string;
  id?: string;
}

/**
 * Reveal — wraps children in a `.reveal` (or `.reveal-stagger`) container
 * that transitions to `.visible` when it scrolls into view. One
 * IntersectionObserver per element; no per-child work.
 */
export default function Reveal({
  children,
  stagger = false,
  delay = 0,
  className = "",
  id,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (delay) {
              window.setTimeout(() => el.classList.add("visible"), delay);
            } else {
              el.classList.add("visible");
            }
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const classes = `${stagger ? "reveal-stagger" : "reveal"} ${className}`.trim();

  return (
    <div ref={ref} className={classes} id={id}>
      {children}
    </div>
  );
}
