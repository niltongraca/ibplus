"use client";

import { useState } from "react";
import { useInjectStyles } from "./useInjectStyles";

const __STYLES = `
:root {
  --check2-dur: 300ms;
  --check2-draw-dur: 250ms;
  --check2-ease: cubic-bezier(0.34, 1.35, 0.64, 1);
}
.t-checkbox-wrap {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}
.t-checkbox-wrap.disabled { opacity: 0.5; cursor: not-allowed; }
.t-checkbox {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid #d1d5db;
  background: #fff;
  margin: 0;
  cursor: pointer;
  transition: border-color 150ms ease, background-color 150ms ease, transform 150ms var(--check2-ease);
  position: relative;
}
.t-checkbox:hover { transform: scale(1.05); }
.t-checkbox:active { transform: scale(0.92); }
.t-checkbox:checked { animation: t-check2-pop 300ms var(--check2-ease); }
.t-checkbox:disabled { cursor: not-allowed; }
.t-check-mark {
  position: absolute;
  pointer-events: none;
  left: 4px;
  top: 4px;
  width: 12px;
  height: 12px;
  z-index: 1;
}
.t-check-mark path {
  stroke-dasharray: 14;
  stroke-dashoffset: 14;
  transition: stroke-dashoffset var(--check2-draw-dur) ease-in 60ms;
}
.t-checkbox-wrap.checked .t-check-mark path { stroke-dashoffset: 0; }
@keyframes t-check2-pop {
  0%   { transform: scale(0.8); }
  50%  { transform: scale(1.15); }
  100% { transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .t-checkbox, .t-check-mark path { animation: none !important; transition: none !important; }
}
`;

interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  color?: string;
  label?: string;
  className?: string;
}

/**
 * Checkbox that animates its check mark drawing in with a springy pop.
 */
export function AnimatedCheckbox({
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  color = "#2563eb",
  label,
  className = "",
}: CheckboxProps) {
  useInjectStyles("transitions-p25", __STYLES);
  const isControlled = checked !== undefined;
  const [internal, setInternal] = useState(defaultChecked);
  const value = isControlled ? checked : internal;

  const handleChange = () => {
    const next = !value;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  return (
    <label
      className={`t-checkbox-wrap ${value ? "checked " : ""}${disabled ? "disabled " : ""}${className}`}
      style={{ position: "relative" }}
    >
      <input
        type="checkbox"
        aria-checked={value}
        checked={value}
        disabled={disabled}
        onChange={handleChange}
        className="t-checkbox"
        style={value ? { background: color, borderColor: color } : undefined}
      />
      <svg
        className="t-check-mark"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4.5 12.5l5 5L19.5 6" />
      </svg>
      {label && <span className="ml-2 text-sm">{label}</span>}
    </label>
  );
}
