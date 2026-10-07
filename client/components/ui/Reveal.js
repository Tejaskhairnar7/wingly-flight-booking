"use client";

import { useEffect, useRef, useState } from "react";

// Fades/slides its child in the first time it scrolls into view. `delay` (ms) staggers siblings.
export default function Reveal({ as: Tag = "div", delay = 0, className = "", style, children, ...props }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal ${shown ? "is-in" : ""} ${className}`} style={{ ...style, "--d": `${delay}ms` }} {...props}>
      {children}
    </Tag>
  );
}
