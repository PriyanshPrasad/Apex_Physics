import { useCallback, useEffect, useRef } from "react";

export interface DrawCtx {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  fg: string;
  muted: string;
  violet: string;
  pink: string;
  teal: string;
  gold: string;
  blue: string;
}

/** Mutable sim state + per-frame interaction events handed to every draw call. */
export interface SimState {
  /** Simulated time in seconds (pauses with the sim; survives re-renders). */
  t: number;
  /** Number of draw frames so far. */
  frame: number;
  /** One-shot UI events queued by handlers: "launch", "run", "reset", … */
  events: Set<string>;
  /** Last pointer position in canvas CSS pixels (null until pointerdown). */
  drag: { id: string; x: number; y: number } | null;
  /** True while a pointer is down. */
  dragging: boolean;
}

export interface CanvasApi {
  canvasRef: (el: HTMLCanvasElement | null) => void;
  /** Read/consume the sim state inside draw callbacks. */
  state: SimState;
  /** Queue a one-shot event, e.g. api.fire("launch"). */
  fire: (event: string) => void;
  /** Full sim reset: clears time, events, drag, and your reset hook. */
  reset: () => void;
  /** Schedule your reset hook to run at the start of the next frame. */
  onReset: (fn: () => void) => void;
}

/**
 * Canvas loop with DPR scaling, delta-time stepping, pause support, and an
 * interaction-event channel. Physics state should live in useRef objects the
 * draw callback mutates; React state (sliders/toggles) is read directly in the
 * draw callback so parameter changes always take effect on the next frame.
 */
export function useSimCanvas(
  draw: (d: DrawCtx, api: CanvasApi) => void,
  { paused = false, onReset }: { paused?: boolean; onReset?: () => void } = {},
): CanvasApi {
  const elRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const resetHookRef = useRef<(() => void) | undefined>(onReset);
  resetHookRef.current = onReset;

  const stateRef = useRef<SimState>({
    t: 0,
    frame: 0,
    events: new Set(),
    drag: null,
    dragging: false,
  });
  const lastTimeRef = useRef<number | null>(null);

  const apiRef = useRef<CanvasApi>({
    canvasRef: (el) => {
      elRef.current = el;
    },
    state: stateRef.current,
    fire: (event) => stateRef.current.events.add(event),
    reset: () => {
      const s = stateRef.current;
      s.t = 0;
      s.frame = 0;
      s.events.clear();
      s.drag = null;
      s.dragging = false;
      lastTimeRef.current = null;
      resetHookRef.current?.();
    },
    onReset: (fn) => {
      resetHookRef.current = fn;
    },
  });

  useEffect(() => {
    const canvas = elRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let disposed = false;

    const loop = (now: number) => {
      if (disposed) return;
      const s = stateRef.current;
      const dt = lastTimeRef.current === null ? 0 : Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;
      if (!pausedRef.current) s.t += dt;

      // resize with DPR
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
      drawRef.current(
        {
          ctx, w, h,
          fg: dark ? "#efecf9" : "#3c3752",
          muted: dark ? "#a49dbf" : "#7c7697",
          violet: "#7c6cf4",
          pink: "#ff8fb1",
          teal: "#4fc7b8",
          gold: "#ffc46b",
          blue: "#8fb8f7",
        },
        apiRef.current,
      );
      // frame bookkeeping AFTER draw so events queued during the frame apply next frame
      s.frame += 1;
      s.events.clear();
      if (s.drag && !s.dragging) s.drag = null;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return apiRef.current;
}

/** Pointer handlers wiring drag position (in canvas CSS px) into SimState. */
export function pointerHandlers(api: CanvasApi, id = "main") {
  return {
    onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      api.state.drag = { id, x: e.clientX - rect.left, y: e.clientY - rect.top };
      api.state.dragging = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!api.state.dragging) return;
      const rect = e.currentTarget.getBoundingClientRect();
      api.state.drag = { id, x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    onPointerUp: () => {
      api.state.dragging = false;
    },
    onPointerCancel: () => {
      api.state.dragging = false;
    },
  };
}

export function SimFrame({ children, height = 320 }: { children: React.ReactNode; height?: number }) {
  return (
    <div className="clay-screen relative w-full overflow-hidden" style={{ height }}>
      {children}
    </div>
  );
}

export function SimRow({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 flex flex-wrap items-center gap-4">{children}</div>;
}

export function SimButton({
  children, onClick, active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold"
      style={active ? { background: "var(--clay-primary-tint)", color: "var(--clay-primary-deep)" } : undefined}
    >
      {children}
    </button>
  );
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
