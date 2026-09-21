"use client";

import Link from "next/link";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = "",
}: EmptyStateProps) {
  const content = (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      <div
        className="w-16 h-16 rounded-full border flex items-center justify-center mb-4"
        style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
      >
        {icon || <Inbox className="w-8 h-8" style={{ color: "var(--text-muted)" }} />}
      </div>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm text-center max-w-sm mb-6" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn btn-primary">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );

  return content;
}