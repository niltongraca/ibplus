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
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        {icon || <Inbox className="w-8 h-8 text-gray-400 dark:text-gray-500" />}
      </div>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{title}</h3>
      {description && <p className="text-sm text-center max-w-sm mb-6" style={{ color: "var(--text-muted)" }}>{description}</p>}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );

  return content;
}
