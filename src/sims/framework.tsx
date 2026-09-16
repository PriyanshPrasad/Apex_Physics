import { useEffect, useRef, useState, Component, type ReactNode, type ErrorInfo } from "react";

export interface DrawCtx {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  t: number;
  fg: string;
  muted: string;
  violet: string;
  pink: string;
  teal: string;
  gold: string;
  blue: string;
}

/**
 * Canvas loop with DPR scaling and rAF.
 * - Pass `running` to freeze physics time (drawing continues, clock stops).
 * - Pass `resetKey` (any changing value) to re-zero the internal clock —
 *   sims derive their own per-frame dt from the same timestamps, so a key
 *   change cleanly resets motion.
 */
export function useCanvasLoop(
  draw: (d: DrawCtx) => void,
  opts: { running?: boolean; resetKey?: string | number } = {},
) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const runningRef = useRef(opts.running ?? true);
  runningRef.current = opts.running ?? true;
  const resetKeyRef = useRef(opts.resetKey);
  const tRef = useRef(0);
  const lastRef = useRef(0);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const loop = (now: number) => {
      try {
        if (resetKeyRef.current !== opts.resetKey) {
          resetKeyRef.current = opts.resetKey;
          tRef.current = 0;
          lastRef.current = now;
        }
        if (!lastRef.current) lastRef.current = now;
        const dt = Math.min((now - lastRef.current) / 1000, 0.05);
        lastRef.current = now;
        if (runningRef.current) tRef.current += dt;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        const w = Math.max(1, rect.width);
        const h = Math.max(1, rect.height);
        if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(h * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const dark = document.documentElement.classList.contains("dark");
        ctx.clearRect(0, 0, w, h);
        drawRef.current({
          ctx, w, h, t: tRef.current,
          fg: dark ? "#efecf9" : "#3c3752",
          muted: dark ? "#a49dbf" : "#7c7697",
          violet: "#7c6cf4",
          pink: "#ff8fb1",
          teal: "#4fc7b8",
          gold: "#ffc46b",
          blue: "#8fb8f7",
        });
      } catch (err) {
        // Never let one bad frame kill the app; log loudly so bugs surface.
        console.error("[sim frame error]", err);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [opts.resetKey, opts.running]); // re-init on run/reset change keeps cleanup airtight
  return ref;
}

export function SimFrame({ children, height = 320 }: { children: ReactNode; height?: number }) {
  return (
    <div className="clay-screen relative w-full overflow-hidden" style={{ height }}>
      {children}
    </div>
  );
}

export function SimRow({ children }: { children: ReactNode }) {
  return <div className="mt-3 flex flex-wrap items-center gap-4">{children}</div>;
}

export function Slider({
  label, value, min, max, step = 1, onChange, format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="flex min-w-[150px] flex-1 flex-col gap-1 text-xs font-medium">
      <span className="text-muted-foreground">
        {label} <span className="text-foreground">{format ? format(value) : value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-clay-3 accent-[var(--clay-4)]"
      />
    </label>
  );
}

export function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold"
      style={on ? { background: "var(--clay-primary-tint)", color: "var(--clay-primary-deep)" } : undefined}
    >
      {label} {on ? "✓" : "○"}
    </button>
  );
}

export function SimButtons({
  running, onPlayPause, onReset, onStep, disabled,
}: {
  running: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onStep?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onPlayPause}
        disabled={disabled}
        className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold"
        style={running ? undefined : { background: "var(--clay-primary-tint)", color: "var(--clay-primary-deep)" }}
      >
        {running ? "⏸ Pause" : "▶ Play"}
      </button>
      <button onClick={onReset} className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" disabled={disabled}>
        ↻ Reset
      </button>
      {onStep && (
        <button onClick={onStep} className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" disabled={disabled || running}>
          ⏭ Step
        </button>
      )}
    </div>
  );
}

/** Renders a static frame — used when paused so the last state stays visible. */
export function StaticFrame({ draw, height = 320 }: { draw: (d: Omit<DrawCtx, "t">) => void; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const dark = document.documentElement.classList.contains("dark");
    try {
      draw({
        ctx, w, h,
        fg: dark ? "#efecf9" : "#3c3752",
        muted: dark ? "#a49dbf" : "#7c7697",
        violet: "#7c6cf4", pink: "#ff8fb1", teal: "#4fc7b8", gold: "#ffc46b", blue: "#8fb8f7",
      });
    } catch (err) {
      console.error("[sim static frame error]", err);
    }
  });
  return (
    <SimFrame height={height}>
      <canvas ref={ref} className="h-full w-full" />
    </SimFrame>
  );
}

/** Error boundary: a crashing sim degrades to a clear message, never a blank app. */
export class SimFallback extends Component<{ children: ReactNode; name?: string }, { hasError: boolean; msg: string }> {
  state = { hasError: false, msg: "" };
  static getDerivedStateFromError(err: Error) {
    return { hasError: true, msg: err.message };
  }
  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error(`[sim${this.props.name ? ` ${this.props.name}` : ""}] crashed:`, err, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="clay-inset p-6 text-center">
          <p className="text-sm font-bold text-destructive">Simulation failed to initialize. Resetting simulation…</p>
          <p className="mt-1 text-xs text-muted-foreground">{this.state.msg}</p>
          <button
            onClick={() => this.setState({ hasError: false, msg: "" })}
            className="clay-sm clay-press mt-3 px-4 py-2 text-xs font-bold"
          >
            ↻ Reset simulation
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/** arrow helper */
export function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  color: string, width = 2, head = 7,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  const a = Math.atan2(dy, dx);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - head * 0.6 * Math.cos(a), y2 - head * 0.6 * Math.sin(a));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(a - Math.PI / 6), y2 - head * Math.sin(a - Math.PI / 6));
  ctx.lineTo(x2 - head * Math.cos(a + Math.PI / 6), y2 - head * Math.sin(a + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

export function grid(ctx: CanvasRenderingContext2D, w: number, h: number, step = 30, color = "rgba(128,120,160,0.14)") {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
  for (let y = 0; y < h; y += step) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
  ctx.stroke();
}

/** clay-style ball */
export function ball(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.25, color);
  g.addColorStop(1, shade(color, -28));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}
