import { Loader2 } from "lucide-react";

export function PageLoading() {
  return (
    <div
      role="status"
      aria-label="A carregar"
      className="flex min-h-[50vh] items-center justify-center p-8"
    >
      <div className="glass-card rounded-2xl px-6 py-5 flex items-center gap-3">
        <Loader2 className="w-6 h-6 text-ib-accent animate-spin" />
        <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          A carregar…
        </span>
      </div>
    </div>
  );
}