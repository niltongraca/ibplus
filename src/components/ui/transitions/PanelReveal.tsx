"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useInjectStyles } from "./useInjectStyles";

const __STYLES = `
:root {
  --panel-dur: 320ms;
  --panel-ease: cubic-bezier(0.22, 1, 0.36, 1);
}
.t-panel-backdrop {
  background: rgba(0, 0, 0, 0.4);
  animation: t-panel-fade var(--panel-dur) var(--panel-ease) forwards;
}
.t-panel-backdrop.closing { animation: t-panel-fade-out 200ms ease forwards; }
.t-panel {
  position: fixed;
  top: 0;
  height: 100dvh;
  background: #fff;
  z-index: 60;
  display: flex;
  flex-direction: column;
  will-change: transform;
}
.t-panel[data-align="right"] { right: 0; }
.t-panel[data-align="left"] { left: 0; }
.t-panel[data-align="right"] { animation: t-panel-in-right var(--panel-dur) var(--panel-ease) forwards; }
.t-panel[data-align="left"] { animation: t-panel-in-left var(--panel-dur) var(--panel-ease) forwards; }
.t-panel.closing[data-align="right"] { animation: t-panel-out-right 200ms ease forwards; }
.t-panel.closing[data-align="left"] { animation: t-panel-out-left 200ms ease forwards; }
@keyframes t-panel-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes t-panel-fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes t-panel-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes t-panel-in-left { from { transform: translateX(-100%); } to { transform: translateX(0); } }
@keyframes t-panel-out-right { from { transform: translateX(0); } to { transform: translateX(100%); } }
@keyframes t-panel-out-left { from { transform: translateX(0); } to { transform: translateX(-100%); } }
@media (prefers-reduced-motion: reduce) {
  .t-panel-backdrop, .t-panel { animation: none !important; }
}
`;

interface PanelRevealProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  align?: "right" | "left";
  width?: number;
  className?: string;
}

/**
 * Slide-in panel (drawer) with animated backdrop fade. Plays the exit before
 * unmounting so closing is visible.
 */
export function PanelReveal({
  open,
  onClose,
  children,
  align = "right",
  width = 420,
  className = "",
}: PanelRevealProps) {
  useInjectStyles("transitions-p3", __STYLES);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
    }
  }, [open]);

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      setMounted(false);
      setClosing(false);
      onClose();
    }, 220);
  };

  if (!mounted) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-[59] t-panel-backdrop ${closing ? "closing" : ""}`}
        onClick={requestClose}
      />
      <div
        data-align={align}
        className={`t-panel ${closing ? "closing" : ""} ${className}`}
        style={{ width: `min(${width}px, 100vw)` }}
      >
        {children}
      </div>
    </>
  );
}
