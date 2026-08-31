"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import { useInjectStyles } from "./useInjectStyles";

const __STYLES = `
:root {
  --dd-dur: 200ms;
  --dd-ease: cubic-bezier(0.22, 1, 0.36, 1);
}
.t-dropdown {
  position: relative;
  display: inline-block;
}
.t-dropdown-menu {
  transform-origin: top right;
  animation: t-dd-in var(--dd-dur) var(--dd-ease) forwards;
}
.t-dropdown-menu.closing {
  animation: t-dd-out 150ms ease-in forwards;
}
@keyframes t-dd-in {
  from { opacity: 0; transform: scale(0.96) translateY(-4px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes t-dd-out {
  from { opacity: 1; transform: scale(1) translateY(0); }
  to   { opacity: 0; transform: scale(0.97) translateY(-3px); }
}
@media (prefers-reduced-motion: reduce) {
  .t-dropdown-menu { animation: none !important; }
}
`;

interface DropdownMenuProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  width?: number | string;
  className?: string;
  menuClassName?: string;
}

/**
 * Dropdown with a scale+fade entrance and exit. Handles outside-click close
 * and animates out before closing so exit transitions are visible.
 */
export function DropdownMenu({
  trigger,
  children,
  align = "right",
  width = 224,
  className = "",
  menuClassName = "",
}: DropdownMenuProps) {
  useInjectStyles("transitions-p2", __STYLES);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (open) {
      setClosing(true);
      setTimeout(() => {
        setOpen(false);
        setClosing(false);
      }, 150);
    } else {
      setOpen(true);
    }
  };

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) toggle();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div ref={ref} className={`t-dropdown ${className}`}>
      {trigger({ open, toggle: () => toggle() })}
      {open && (
        <div
          className={`t-dropdown-menu ${closing ? "closing" : ""} ${menuClassName}`}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            ...(align === "right" ? { right: 0 } : { left: 0 }),
            width,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
