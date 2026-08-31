"use client";

import { useRef, useState, useLayoutEffect, type ReactNode } from "react";
import { useInjectStyles } from "./useInjectStyles";

const __STYLES = `
:root {
  --tabs-slide-dur: 300ms;
  --tabs-ease: cubic-bezier(0.22, 1, 0.36, 1);
}
.t-tabs {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: 10px;
}
.t-tabs-pill {
  position: absolute;
  top: 3px;
  bottom: 3px;
  z-index: 0;
  border-radius: 8px;
  transition:
    left var(--tabs-slide-dur) var(--tabs-ease),
    width var(--tabs-slide-dur) var(--tabs-ease);
}
.t-tabs-btn {
  position: relative;
  z-index: 1;
  appearance: none;
  border: none;
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: color 200ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .t-tabs-pill { transition: none; }
  .t-tabs-btn { transition: none; }
}
`;

interface TabItem<T extends string> {
  key: T;
  label: string;
  icon?: ReactNode;
}

interface AnimatedTabsProps<T extends string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (key: T) => void;
  /** rendered card/pill background color (defaults to accent) */
  pillClassName?: string;
  /** overall container classes */
  className?: string;
  /** background for the pill track */
  trackClassName?: string;
  /** "light" sites use gray; "dark" app uses theme vars */
  mode?: "dark" | "light";
  btnClassName?: string;
  activeBtnClassName?: string;
  iconClassName?: string;
}

export function AnimatedTabs<T extends string>({
  tabs,
  active,
  onChange,
  pillClassName = "bg-ib-accent",
  className = "",
  trackClassName = "",
  mode = "light",
  btnClassName = "",
  activeBtnClassName = "",
  iconClassName = "w-4 h-4",
}: AnimatedTabsProps<T>) {
  useInjectStyles("transitions-p16", __STYLES);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeBtn = container.querySelector<HTMLButtonElement>(
      `[data-key="${active}"]`
    );
    if (!activeBtn) return;
    const next = {
      left: activeBtn.offsetLeft - 3,
      width: activeBtn.offsetWidth + 6,
      ready: true,
    };
    // Avoid animating on the very first layout pass.
    if (!pill.ready) {
      setPill(next);
    } else {
      setPill(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, tabs]);

  return (
    <div
      ref={containerRef}
      className={`t-tabs ${trackClassName} ${className}`}
      style={{ backgroundColor: mode === "dark" ? "rgba(128,128,128,0.15)" : "#f3f4f6" }}
    >
      <span
        className={`t-tabs-pill ${pillClassName}`}
        style={{
          left: pill.left,
          width: pill.width,
          opacity: pill.ready ? 1 : 0,
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }}
      />
      {tabs.map((tab) => (
        <button
          key={tab.key}
          data-key={tab.key}
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={`t-tabs-btn flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            active === tab.key ? activeBtnClassName : btnClassName
          }`}
        >
          {tab.icon ? <span className={iconClassName} style={{ display: "inline-flex" }}>{tab.icon}</span> : null}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
