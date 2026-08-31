"use client";

import { useEffect, useRef, useState } from "react";

const __STYLES = `
:root {
  --clear-dur: 1000ms;
  --clear-out-dur: 400ms;
  --clear-in-dur: 400ms;
  --clear-out-fly: 12px;
  --clear-in-fly: 12px;
  --clear-out-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --clear-in-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --clear-blur: 2px;
  --glow-delay: 50ms;
  --glow-peak-at: 0.15;
  --glow-opacity: 0.85;
  --glow-spread: 1.5;
}
.t-clear { position: relative; overflow: hidden; }
.t-clear-mirror,
.t-clear-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  pointer-events: none;
  white-space: nowrap;
  overflow: hidden;
  z-index: 2;
}
.t-clear-mirror { opacity: 0; }
.t-clear.has-value .t-clear-mirror,
.t-clear.is-clearing .t-clear-mirror { opacity: 1; }
.t-clear.has-value > input,
.t-clear.is-clearing > input { -webkit-text-fill-color: transparent; }
.t-clear.has-value .t-clear-placeholder { opacity: 0; }
.t-clear-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  z-index: 3;
  mix-blend-mode: multiply;
}
@media (prefers-reduced-motion: reduce) {
  .t-clear-glow { opacity: 0 !important; }
}
`;

interface ClearInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function ClearInput({ value, onChange, placeholder = "", className = "", inputClassName = "" }: ClearInputProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const fakePhRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const isClearing = useRef(false);

  useEffect(() => {
    if (typeof document !== "undefined" && !document.getElementById("transitions-p13")) {
      const style = document.createElement("style");
      style.id = "transitions-p13";
      style.textContent = __STYLES;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const has = value.length > 0;
    wrap.classList.toggle("has-value", has);
    if (has && mirrorRef.current) {
      mirrorRef.current.textContent = value.replace(/ /g, "\u00a0");
    }
  }, [value]);

  const handleClear = () => {
    const wrap = wrapRef.current;
    const input = inputRef.current;
    const mirror = mirrorRef.current;
    const fakePh = fakePhRef.current;
    const glow = glowRef.current;
    if (!wrap || !input || !mirror || !fakePh || !glow) return;
    if (isClearing.current || !input.value) return;

    isClearing.current = true;
    const wasFocused = document.activeElement === input;
    mirror.textContent = input.value.replace(/ /g, "\u00a0");
    const bg = buildLayers(wrap, mirror.textContent);
    const peakAt = readNum("--glow-peak-at", 0.15);
    const opacity = readNum("--glow-opacity", 0.42);
    const total = readNum("--clear-dur", 1000);
    const outDur = readNum("--clear-out-dur", 400);
    const inDur = readNum("--clear-in-dur", 400);
    const outFly = readNum("--clear-out-fly", 12);
    const inFly = readNum("--clear-in-fly", 12);
    const blurPx = readNum("--clear-blur", 2);
    const glowDly = readNum("--glow-delay", 50);
    const eOut = makeEase(readEase("--clear-out-ease", "cubic-bezier(0.22, 1, 0.36, 1)"));
    const eIn = makeEase(readEase("--clear-in-ease", "cubic-bezier(0.22, 1, 0.36, 1)"));

    input.value = "";
    wrap.classList.remove("has-value");
    wrap.classList.add("is-clearing");
    fakePh.style.transform = `translateY(-${inFly}px)`;
    fakePh.style.opacity = "0.9";
    fakePh.style.filter = `blur(${blurPx}px)`;
    glow.style.background = bg;
    glow.style.opacity = "0";

    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(1, elapsed / total);
      const e = eOut(Math.min(1, elapsed / outDur));
      mirror.style.transform = `translateY(${(e * outFly).toFixed(1)}px)`;
      mirror.style.opacity = (1 - e).toFixed(3);
      mirror.style.filter = `blur(${(e * blurPx).toFixed(1)}px)`;
      const pe = eIn(Math.min(1, elapsed / inDur));
      fakePh.style.transform = `translateY(${(-inFly + pe * inFly).toFixed(1)}px)`;
      fakePh.style.opacity = (0.9 + pe * 0.1).toFixed(3);
      fakePh.style.filter = `blur(${(blurPx - pe * blurPx).toFixed(1)}px)`;
      let g = 0;
      if (elapsed > glowDly) {
        const remaining = Math.max(1, total - glowDly);
        const gp = Math.min(1, (elapsed - glowDly) / remaining);
        g = gp < peakAt ? gp / peakAt : 1 - (gp - peakAt) / (1 - peakAt);
      }
      glow.style.opacity = (g * opacity).toFixed(3);
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        wrap.classList.remove("is-clearing");
        for (const el of [mirror, fakePh]) el.style.cssText = "";
        mirror.textContent = "";
        glow.style.opacity = "0";
        glow.style.background = "";
        isClearing.current = false;
        onChange("");
        if (wasFocused) input.focus({ preventScroll: true });
      }
    };
    requestAnimationFrame(tick);
  };

  return (
    <div ref={wrapRef} className={`t-clear ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 ${inputClassName}`}
      />
      <div ref={mirrorRef} className="t-clear-mirror pl-9 text-gray-700" aria-hidden="true" />
      <div ref={fakePhRef} className="t-clear-placeholder pl-9 text-gray-400" aria-hidden="true">
        {placeholder}
      </div>
      <div ref={glowRef} className="t-clear-glow" aria-hidden="true" />
      {value.length > 0 && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 text-sm leading-none flex items-center justify-center z-[4]"
          aria-label="Limpar"
          onPointerDown={(e) => { if (document.activeElement === inputRef.current) e.preventDefault(); }}
          onMouseDown={(e) => { if (document.activeElement === inputRef.current) e.preventDefault(); }}
          onClick={handleClear}
        >
          ×
        </button>
      )}
    </div>
  );
}

function buildLayers(wrap: HTMLElement, text: string) {
  const inputW = wrap.clientWidth || 280;
  const padLeft = 32;
  const segments = text.split(/(\s+)/);
  const spread = readNum("--glow-spread", 1.5);
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const rgb = isDark ? "255,255,255" : "0,0,0";
  const layers: string[] = [];
  let x = 0;
  for (const seg of segments) {
    const w = seg.length * 7;
    if (seg.trim()) {
      const cx = padLeft + x + w / 2;
      const hw = Math.max(w * 0.45, 8) * spread;
      const stops = [
        { dx: 0, rw: hw * 0.8, rh: 7, a: 0.22 },
        { dx: hw * 0.45, rw: hw * 0.55, rh: 8, a: 0.18 },
        { dx: -hw * 0.4, rw: hw * 0.65, rh: 6, a: 0.16 },
        { dx: hw * 0.15, rw: hw * 0.9, rh: 5, a: 0.14 },
      ];
      for (const l of stops) {
        const lx = (((cx + l.dx) / inputW) * 100).toFixed(2);
        layers.push(
          `radial-gradient(ellipse ${Math.max(l.rw, 2).toFixed(1)}px ${l.rh}px at ${lx}% 100%, rgba(${rgb},${l.a.toFixed(3)}), transparent)`
        );
      }
    }
    x += w;
  }
  return layers.join(", ");
}
function readNum(name: string, fb: number): number {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(v) ? v : fb;
}
function readEase(name: string, fb: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fb;
}
function makeEase(ease: string): (t: number) => number {
  const m = ease.match(/cubic-bezier\s*\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/i);
  if (!m) return (t) => t;
  const [x1, y1, x2, y2] = [m[1], m[2], m[3], m[4]].map(parseFloat);
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sX = (s: number) => ((ax * s + bx) * s + cx) * s;
  const sY = (s: number) => ((ay * s + by) * s + cy) * s;
  const dX = (s: number) => (3 * ax * s + 2 * bx) * s + cx;
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let s = t;
    for (let i = 0; i < 8; i++) {
      const dx = sX(s) - t;
      if (Math.abs(dx) < 1e-6) break;
      const d = dX(s);
      if (d === 0) break;
      s -= dx / d;
    }
    return sY(s);
  };
}
