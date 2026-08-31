"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const __STYLES = `
:root {
  --check-opacity-dur: 500ms;
  --check-rotate-dur: 500ms;
  --check-rotate-from: 80deg;
  --check-bob-dur: 500ms;
  --check-y-amount: 40px;
  --check-blur-dur: 500ms;
  --check-blur-from: 10px;
  --check-path-dur: 500ms;
  --check-path-delay: 80ms;
  --check-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --check-ease-opacity: cubic-bezier(0.22, 1, 0.36, 1);
  --check-ease-rotate: cubic-bezier(0.22, 1, 0.36, 1);
  --check-ease-bob: cubic-bezier(0.34, 1.35, 0.64, 1);
  --check-ease-path: cubic-bezier(0.22, 1, 0.36, 1);
}
.t-success-check {
  display: inline-block;
  transform-origin: center;
  opacity: 0;
  will-change: transform, opacity, filter;
}
.t-success-check svg { display: block; overflow: visible; }
.t-success-check svg path {
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
}
.t-success-check[data-state="in"] {
  animation:
    t-check-fade   var(--check-opacity-dur) var(--check-ease-opacity) forwards,
    t-check-rotate var(--check-rotate-dur)  var(--check-ease-rotate)  forwards,
    t-check-blur   var(--check-blur-dur)    var(--check-ease-out)     forwards,
    t-check-bob    var(--check-bob-dur)     var(--check-ease-bob)     forwards;
}
.t-success-check[data-state="in"] svg path {
  animation: t-check-draw var(--check-path-dur) var(--check-ease-path) var(--check-path-delay, 0ms) forwards;
}
@keyframes t-check-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes t-check-rotate {
  from { transform: rotate(var(--check-rotate-from)); }
  to   { transform: rotate(0deg); }
}
@keyframes t-check-blur {
  from { filter: blur(var(--check-blur-from)); }
  to   { filter: blur(0); }
}
@keyframes t-check-bob {
  from { translate: 0 var(--check-y-amount); }
  to   { translate: 0 0; }
}
@keyframes t-check-draw { to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) {
  .t-success-check { animation: none !important; opacity: 1; }
  .t-success-check svg path { animation: none !important; stroke-dashoffset: 0 !important; }
}
`;

export interface SuccessCheckHandle {
  play: () => void;
}

interface SuccessCheckProps {
  className?: string;
  size?: number;
  autoPlay?: boolean;
}

export const SuccessCheck = forwardRef<SuccessCheckHandle, SuccessCheckProps>(
  function SuccessCheck({ className, size = 96, autoPlay = true }, ref) {
    const [state, setState] = useState<"out" | "in">("out");
    const innerRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
      if (typeof document !== "undefined" && !document.getElementById("transitions-p10")) {
        const style = document.createElement("style");
        style.id = "transitions-p10";
        style.textContent = __STYLES;
        document.head.appendChild(style);
      }
    }, []);

    const play = () => {
      setState("out");
      requestAnimationFrame(() => {
        if (innerRef.current) void innerRef.current.offsetWidth;
        setState("in");
      });
    };

    useImperativeHandle(ref, () => ({ play }));

    useEffect(() => {
      if (autoPlay) play();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPlay]);

    return (
      <span ref={innerRef} className={`t-success-check ${className || ""}`} data-state={state} aria-hidden="true">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
    );
  }
);
