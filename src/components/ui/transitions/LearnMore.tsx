"use client";

import type { ReactNode } from "react";
import { useInjectStyles } from "./useInjectStyles";

const __STYLES = `
:root {
  --learn-dur: 300ms;
  --learn-ease: cubic-bezier(0.22, 1, 0.36, 1);
}
.t-learn {
  appearance: none;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font: inherit;
  color: inherit;
  padding: 0;
  position: relative;
}
.t-learn-text {
  position: relative;
}
.t-learn-underline {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 2px;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--learn-dur) var(--learn-ease);
  border-radius: 2px;
}
.t-learn:hover .t-learn-underline,
.t-learn:focus-visible .t-learn-underline {
  transform: scaleX(1);
}
.t-learn-arrow {
  transition: transform var(--learn-dur) var(--learn-ease);
  display: inline-flex;
}
.t-learn:hover .t-learn-arrow {
  transform: translateX(4px);
}
@media (prefers-reduced-motion: reduce) {
  .t-learn-underline, .t-learn-arrow { transition: none !important; }
}
`;

interface LearnMoreProps {
  children?: ReactNode;
  align?: "left" | "right";
  arrow?: "none" | "arrow" | "corner";
  className?: string;
  underlineClassName?: string;
  onClick?: () => void;
}

/**
 * "Learn more" link whose underline scales in and an arrow slides on hover.
 */
export function LearnMore({
  children = "Saber mais",
  align = "left",
  arrow = "arrow",
  className = "",
  underlineClassName = "",
  onClick,
}: LearnMoreProps) {
  useInjectStyles("transitions-p24", __STYLES);
  const rtl = align === "right";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`t-learn ${className}`}
      style={rtl ? { flexDirection: "row-reverse" } : undefined}
    >
      {arrow !== "none" && (
        <span className="t-learn-arrow">
          {arrow === "corner" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17 17 7M7 7h10v10" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </span>
      )}
      <span className="t-learn-text">
        {children}
        <span className={`t-learn-underline ${underlineClassName}`} />
      </span>
    </button>
  );
}
