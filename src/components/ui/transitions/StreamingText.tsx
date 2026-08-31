"use client";

import { useEffect, useState } from "react";
import { useInjectStyles } from "./useInjectStyles";

const __STYLES = `
:root {
  --stream-word-dur: 200ms;
  --stream-blur: 9px;
  --stream-ease: cubic-bezier(0.22, 1, 0.36, 1);
}
.t-stream-w {
  display: inline;
}
.t-stream-w .word {
  display: inline-block;
  opacity: 0;
  filter: blur(var(--stream-blur));
  transform: translateY(8px);
  animation: t-stream-in var(--stream-word-dur) var(--stream-ease) forwards;
}
.t-stream-w .space { display: inline-block; white-space: pre; }
@keyframes t-stream-in {
  to { opacity: 1; filter: blur(0); transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .t-stream-w .word { animation: none !important; opacity: 1 !important; filter: none !important; transform: none !important; }
}
`;

interface StreamingTextProps {
  text: string;
  /** stagger delay between words in ms */
  interval?: number;
  startDelay?: number;
  className?: string;
}

/**
 * Text that streams in word-by-word (fade + blur + rise), like a live reply.
 */
export function StreamingText({
  text,
  interval = 200,
  startDelay = 0,
  className = "",
}: StreamingTextProps) {
  useInjectStyles("transitions-p26", __STYLES);
  const [visibleCount, setVisibleCount] = useState(0);
  const words = text.split(/(\s+)/).filter(Boolean);

  useEffect(() => {
    setVisibleCount(0);
    const total = words.length;
    let i = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      i += 1;
      setVisibleCount(i);
      if (i < total) {
        timer = setTimeout(tick, interval);
      }
    };
    timer = setTimeout(tick, startDelay);
    return () => {
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, interval, startDelay]);

  return (
    <span className={`t-stream-w ${className}`}>
      {words.map((w, i) => {
        const isSpace = /^\s+$/.test(w);
        const visible = i < visibleCount;
        const delay = (i + 1) * interval + startDelay;
        return isSpace ? (
          <span key={i} className="space" style={{ visibility: visible ? "visible" : "hidden" }}>
            {w}
          </span>
        ) : (
          <span
            key={i}
            className="word"
            style={{ animationDelay: `${delay}ms` }}
          >
            {w}
          </span>
        );
      })}
    </span>
  );
}
