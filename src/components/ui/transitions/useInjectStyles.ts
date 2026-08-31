"use client";

import { useEffect } from "react";

/**
 * Inject a <style> tag with a stable id on mount (client-only).
 * The same id is never injected twice, so styles apply once globally.
 */
export function useInjectStyles(id: string, css: string) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}
