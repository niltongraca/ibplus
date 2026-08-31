"use client";

import { useState } from "react";
import { useInjectStyles } from "./useInjectStyles";

const __STYLES = `
:root {
  --like-dur: 500ms;
  --like-bounce: cubic-bezier(0.34, 1.5, 0.64, 1);
  --like-spark: 500ms;
}
.t-like {
  appearance: none;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font: inherit;
  color: inherit;
}
.t-like svg {
  transition: transform 150ms var(--like-bounce), fill 200ms ease, stroke 200ms ease;
  will-change: transform;
}
.t-like:active svg { transform: scale(0.85); }
.t-like[data-liked="true"] svg {
  fill: currentColor;
}
.t-like[data-burst="true"] svg {
  animation: t-like-pop var(--like-dur) var(--like-bounce);
}
.t-like-spark {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  pointer-events: none;
  animation: t-like-spark var(--like-spark) ease-out forwards;
}
@keyframes t-like-pop {
  0%   { transform: scale(0.6); }
  40%  { transform: scale(1.4); }
  100% { transform: scale(1); }
}
@keyframes t-like-spark {
  0%   { transform: translate(0,0) scale(1); opacity: 1; }
  100% { transform: translate(var(--sx), var(--sy)) scale(0); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .t-like svg, .t-like[data-burst="true"] svg, .t-like-spark { animation: none !important; transition: none !important; }
}
`;

interface LikeButtonProps {
  liked?: boolean;
  onToggle?: (liked: boolean) => void;
  color?: string;
  size?: number;
  showCount?: boolean;
  count?: number;
  label?: string;
  className?: string;
}

/**
 * Like (heart) button with a springy pop and radiating sparks on toggle.
 */
export function LikeButton({
  liked = false,
  onToggle,
  color = "#ef4444",
  size = 24,
  showCount = false,
  count = 0,
  className = "",
}: LikeButtonProps) {
  useInjectStyles("transitions-p23", __STYLES);
  const [isLiked, setIsLiked] = useState(liked);
  const [burst, setBurst] = useState(false);
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleClick = () => {
    const next = !isLiked;
    setIsLiked(next);
    setBurst(true);
    if (next) {
      const newSparks = Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return {
          id: Date.now() + i,
          x: Math.cos(angle) * 26,
          y: Math.sin(angle) * 26,
        };
      });
      setSparks(newSparks);
      setTimeout(() => setSparks([]), 550);
    }
    setTimeout(() => setBurst(false), 550);
    onToggle?.(next);
  };

  return (
    <button
      type="button"
      className={`t-like ${className}`}
      data-liked={isLiked}
      data-burst={burst}
      onClick={handleClick}
      aria-pressed={isLiked}
      style={{ color: isLiked ? color : "currentColor", position: "relative" }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ overflow: "visible" }}
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
      {sparks.map((s) => (
        <span
          key={s.id}
          className="t-like-spark"
          style={{
            left: "50%",
            top: "50%",
            background: color,
            ["--sx" as string]: `${s.x}px`,
            ["--sy" as string]: `${s.y}px`,
          }}
        />
      ))}
      {showCount && <span className="text-sm">{count + (isLiked ? 1 : 0)}</span>}
    </button>
  );
}
