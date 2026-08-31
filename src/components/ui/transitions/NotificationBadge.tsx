"use client";

import { useInjectStyles } from "./useInjectStyles";

const __STYLES = `
:root {
  --badge-ping-dur: 1.6s;
  --badge-bounce: cubic-bezier(0.22, 1.3, 0.36, 1);
}
.t-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  color: #fff;
  transform-origin: center;
  animation: t-badge-pop 380ms var(--badge-bounce);
}
.t-badge::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  background: inherit;
  animation: t-badge-ping var(--badge-ping-dur) cubic-bezier(0, 0, 0.2, 1) infinite;
  z-index: -1;
}
@keyframes t-badge-pop {
  0%   { transform: scale(0.4); }
  60%  { transform: scale(1.15); }
  100% { transform: scale(1); }
}
@keyframes t-badge-ping {
  0%   { transform: scale(1); opacity: 0.6; }
  80%, 100% { transform: scale(1.9); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .t-badge, .t-badge::before { animation: none !important; }
}
`;

interface NotificationBadgeProps {
  count: number;
  max?: number;
  className?: string;
  backgroundColor?: string;
}

/**
 * Badge that pops in with a spring and shows a continuous ping ripple — used
 * for unread notification counts.
 */
export function NotificationBadge({
  count,
  max = 99,
  className = "",
  backgroundColor = "var(--ib-danger, #ef4444)",
}: NotificationBadgeProps) {
  useInjectStyles("transitions-p1", __STYLES);
  if (count <= 0) return null;
  return (
    <span className={`t-badge ${className}`} style={{ backgroundColor }} aria-hidden="true">
      {count > max ? `${max}+` : count}
    </span>
  );
}
