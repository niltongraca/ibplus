"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
import { useInjectStyles } from "./useInjectStyles";

const __STYLES = `
:root {
  --modal-scale-from: 0.9;
  --modal-scale-min: 0.96;
  --modal-spring: cubic-bezier(0.34, 1.35, 0.64, 1);
  --modal-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --modal-dur: 300ms;
  --modal-fade-dur: 250ms;
}
.t-modal-backdrop {
  animation: t-modal-fade var(--modal-fade-dur) var(--modal-ease) forwards;
}
.t-modal-panel {
  animation: t-modal-scale var(--modal-dur) var(--modal-spring) forwards;
  transform-origin: center;
}
.t-modal-backdrop[data-exiting="true"] { animation: t-modal-fade-out var(--modal-fade-dur) var(--modal-ease) forwards; }
.t-modal-panel[data-exiting="true"] { animation: t-modal-scale-out var(--modal-dur) var(--modal-ease) forwards; }
@keyframes t-modal-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes t-modal-fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes t-modal-scale {
  0% { opacity: 0; transform: scale(var(--modal-scale-from)); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes t-modal-scale-out {
  0% { opacity: 1; transform: scale(1); }
  60% { opacity: 1; transform: scale(var(--modal-scale-min)); }
  100% { opacity: 0; transform: scale(var(--modal-scale-from)); }
}
@media (prefers-reduced-motion: reduce) {
  .t-modal-backdrop, .t-modal-panel { animation: none !important; }
}
`;

interface AnimatedModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  panelClassName?: string;
  closeOnBackdrop?: boolean;
}

/**
 * Modal that plays a scale+fade entrance on open and a quick exit animation
 * before actually unmounting (so close animations are visible).
 */
export function AnimatedModal({
  open,
  onClose,
  children,
  className = "",
  panelClassName = "",
  closeOnBackdrop = true,
}: AnimatedModalProps) {
  useInjectStyles("transitions-p7", __STYLES);
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setExiting(false);
    }
  }, [open]);

  const requestClose = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    // Wait for exit animation to finish before unmounting.
    setTimeout(() => {
      setMounted(false);
      setExiting(false);
      onClose();
    }, 300);
  }, [exiting, onClose]);

  if (!mounted) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center ${className}`}>
      <div
        className="absolute inset-0 bg-black/40 t-modal-backdrop"
        data-exiting={exiting}
        onClick={closeOnBackdrop ? requestClose : undefined}
      />
      <div
        className={`relative z-10 t-modal-panel ${panelClassName}`}
        data-exiting={exiting}
      >
        {children}
      </div>
    </div>
  );
}

export function useAnimatedModal(open: boolean, onClose: () => void, closeOnBackdrop = true) {
  const props = { open, onClose, closeOnBackdrop };
  return props;
}
