"use client";

import { useState, type ReactNode } from "react";
import { useInjectStyles } from "./useInjectStyles";

const __STYLES = `
:root {
  --acc-dur: 320ms;
  --acc-ease: cubic-bezier(0.22, 1, 0.36, 1);
}
.t-acc {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.t-acc-item {
  border-radius: 12px;
  overflow: hidden;
}
.t-acc-trigger {
  appearance: none;
  border: none;
  background: transparent;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  cursor: pointer;
}
.t-acc-chevron {
  transition: transform var(--acc-dur) var(--acc-ease);
  flex-shrink: 0;
}
.t-acc-item.open .t-acc-chevron { transform: rotate(180deg); }
.t-acc-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--acc-dur) var(--acc-ease);
}
.t-acc-item.open .t-acc-body { grid-template-rows: 1fr; }
.t-acc-inner {
  overflow: hidden;
  min-height: 0;
}
@media (prefers-reduced-motion: reduce) {
  .t-acc-body, .t-acc-chevron { transition: none; }
}
`;

export interface AccordionItemData {
  value: string;
  title: ReactNode;
  content: ReactNode;
}

interface AccordionProps {
  items: AccordionItemData[];
  allowMultiple?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
  chevron?: ReactNode;
}

/**
 * Accordion that expands/collapses with a smooth grid-rows animation
 * (`0fr -> 1fr`), which animates height without needing a fixed height.
 */
export function Accordion({
  items,
  allowMultiple = false,
  triggerClassName = "",
  contentClassName = "",
  itemClassName = "",
  chevron,
}: AccordionProps) {
  useInjectStyles("transitions-p21", __STYLES);
  const [openValues, setOpenValues] = useState<string[]>([]);

  const toggle = (value: string) => {
    setOpenValues((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      if (allowMultiple) return [...prev, value];
      return [value];
    });
  };

  const isOpen = (value: string) => openValues.includes(value);

  return (
    <div className="t-acc">
      {items.map((item) => {
        const open = isOpen(item.value);
        return (
          <div
            key={item.value}
            className={`t-acc-item ${open ? "open" : ""} ${itemClassName}`}
          >
            <button
              type="button"
              aria-expanded={open}
              onClick={() => toggle(item.value)}
              className={`t-acc-trigger ${triggerClassName}`}
            >
              <span>{item.title}</span>
              <span className="t-acc-chevron">
                {chevron ?? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                )}
              </span>
            </button>
            <div className="t-acc-body">
              <div className="t-acc-inner">
                <div className={contentClassName}>{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
