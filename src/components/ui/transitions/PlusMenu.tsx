"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useInjectStyles } from "./useInjectStyles";

const __STYLES = `
:root {
  --pm-dur: 360ms;
  --pm-spring: cubic-bezier(0.34, 1.25, 0.64, 1);
  --pm-ease: cubic-bezier(0.22, 1, 0.36, 1);
}
.t-morph {
  position: relative;
  display: inline-block;
}
.t-morph-toggle {
  appearance: none;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #2563eb;
  color: #fff;
  border-radius: 9999px;
  transition: border-radius var(--pm-dur) var(--pm-ease), width var(--pm-dur) var(--pm-spring), box-shadow 200ms ease;
  overflow: hidden;
}
.t-morph-toggle .pm-plus {
  transition: transform var(--pm-dur) var(--pm-spring);
}
.t-morph.open .t-morph-toggle { border-radius: 14px; }
.t-morph.open .pm-plus { transform: rotate(45deg); }
.t-morph-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  display: flex;
  flex-direction: column;
  transform-origin: top right;
  animation: t-pm-in var(--pm-dur) var(--pm-spring);
}
.t-morph-menu.closing { animation: t-pm-out 180ms ease forwards; }
@keyframes t-pm-in {
  from { opacity: 0; transform: scale(0.6) translateY(-12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes t-pm-out {
  from { opacity: 1; transform: scale(1) translateY(0); }
  to   { opacity: 0; transform: scale(0.7) translateY(-8px); }
}
@media (prefers-reduced-motion: reduce) {
  .t-morph-toggle, .pm-plus, .t-morph-menu { animation: none !important; transition: none !important; }
}
`;

interface PlusMenuProps {
  /** items rendered inside the opened menu */
  menu: (handle: { close: () => void }) => ReactNode;
  size?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  menuClassName?: string;
  ariaLabel?: string;
}

/**
 * A circular "+" that morphs into a rounded square and springs open a menu
 * below it. Great for compact per-row actions or a mobile action button.
 */
export function PlusMenu({
  menu,
  size = 40,
  open: controlledOpen,
  onOpenChange,
  className = "",
  menuClassName = "",
  ariaLabel = "Mais opções",
}: PlusMenuProps) {
  useInjectStyles("transitions-p20", __STYLES);
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const open = isControlled ? controlledOpen : internalOpen;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setInternalOpen(false);
      onOpenChange?.(false);
    }, 180);
  };

  const toggle = () => {
    if (open) {
      close();
    } else {
      setInternalOpen(true);
      onOpenChange?.(true);
    }
  };

  return (
    <div ref={ref} className={`t-morph ${open ? "open" : ""} ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={toggle}
        className="t-morph-toggle"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.6) }}
      >
        <span className="pm-plus">
          <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </button>
      {open && (
        <div className={`t-morph-menu ${closing ? "closing" : ""} ${menuClassName}`}>
          {menu({ close })}
        </div>
      )}
    </div>
  );
}
