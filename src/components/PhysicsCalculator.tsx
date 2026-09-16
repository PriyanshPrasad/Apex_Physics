import { useMemo, useState } from "react";
import { Calculator, ChevronDown, Delete, FunctionSquare, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const FUNCTIONS = ["sin", "cos", "tan", "sqrt", "log", "ln", "abs", "exp"] as const;

function normalizeExpression(value: string): string {
  return value
    .split("π").join("PI")
    .split("√").join("sqrt")
    .split("^").join("**")
    .replace(/\bln\b/g, "log")
    .replace(/\blog10\b/g, "log10");
}

function evaluate(value: string, x = 0): number | null {
  const expression = normalizeExpression(value.trim());
  if (!expression || !/^[0-9a-zA-Z_+\-*/%().,\s]*$/.test(expression)) return null;
  try {
    // The whitelist above limits input to mathematical tokens; all functions
    // are supplied explicitly and no browser/global object is exposed.
    const fn = new Function("x", "PI", "sin", "cos", "tan", "sqrt", "log", "log10", "abs", "exp", `"use strict"; return (${expression});`);
    const result = fn(x, Math.PI, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.log, Math.log10, Math.abs, Math.exp);
    return typeof result === "number" && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

function format(value: number | null): string {
  if (value === null) return "—";
  return Number.isInteger(value) ? String(value) : value.toPrecision(8).replace(/0+$/, "").replace(/\.$/, "");
}

function Graph({ expression, min, max }: { expression: string; min: number; max: number }) {
  const points = useMemo(() => {
    const samples: { x: number; y: number }[] = [];
    for (let i = 0; i <= 140; i++) {
      const x = min + (max - min) * i / 140;
      const y = evaluate(expression, x);
      if (y !== null && Math.abs(y) < 1e6) samples.push({ x, y });
    }
    return samples;
  }, [expression, min, max]);
  const width = 560;
  const height = 260;
  const pad = { left: 44, right: 18, top: 18, bottom: 32 };
  const ys = points.map((point) => point.y);
  const rawMin = ys.length ? Math.min(...ys) : -1;
  const rawMax = ys.length ? Math.max(...ys) : 1;
  const span = Math.max(1e-9, rawMax - rawMin);
  const yMin = rawMin - span * 0.08;
  const yMax = rawMax + span * 0.08;
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const xMap = (x: number) => pad.left + ((x - min) / Math.max(1e-9, max - min)) * plotW;
  const yMap = (y: number) => pad.top + (1 - (y - yMin) / Math.max(1e-9, yMax - yMin)) * plotH;
  const path = points.map((point, i) => `${i === 0 ? "M" : "L"}${xMap(point.x).toFixed(2)},${yMap(point.y).toFixed(2)}`).join(" ");
  const zeroX = min <= 0 && max >= 0 ? xMap(0) : null;
  const zeroY = yMin <= 0 && yMax >= 0 ? yMap(0) : null;

  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-border/50 bg-background/35 p-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[460px]" role="img" aria-label={`Graph of y equals ${expression}`}>
        {[0.25, 0.5, 0.75].map((fraction) => <line key={`h${fraction}`} x1={pad.left} x2={width - pad.right} y1={pad.top + plotH * fraction} y2={pad.top + plotH * fraction} stroke="currentColor" opacity="0.12" />)}
        {[0.25, 0.5, 0.75].map((fraction) => <line key={`v${fraction}`} y1={pad.top} y2={height - pad.bottom} x1={pad.left + plotW * fraction} x2={pad.left + plotW * fraction} stroke="currentColor" opacity="0.12" />)}
        {zeroX !== null && <line x1={zeroX} x2={zeroX} y1={pad.top} y2={height - pad.bottom} stroke="currentColor" opacity="0.45" />}
        {zeroY !== null && <line x1={pad.left} x2={width - pad.right} y1={zeroY} y2={zeroY} stroke="currentColor" opacity="0.45" />}
        <polyline points={`${pad.left},${pad.top} ${pad.left},${height - pad.bottom} ${width - pad.right},${height - pad.bottom}`} fill="none" stroke="currentColor" opacity="0.5" />
        {path && <path d={path} fill="none" stroke="#7c6cf4" strokeWidth="3" strokeLinecap="round" />}
        <text x={width - pad.right} y={height - 8} textAnchor="end" fontSize="12" fill="currentColor">x</text>
        <text x={pad.left - 10} y={pad.top + 5} textAnchor="end" fontSize="12" fill="currentColor">y</text>
        <text x={pad.left} y={height - 8} fontSize="10" fill="currentColor">{min}</text>
        <text x={width - pad.right} y={height - 8} textAnchor="end" fontSize="10" fill="currentColor">{max}</text>
        <text x={pad.left - 8} y={height - pad.bottom + 4} textAnchor="end" fontSize="10" fill="currentColor">{format(yMin)}</text>
        <text x={pad.left - 8} y={pad.top + 4} textAnchor="end" fontSize="10" fill="currentColor">{format(yMax)}</text>
      </svg>
      {!path && <p className="px-2 pb-1 text-xs text-destructive">Enter a valid function of x, such as <code>sin(x)</code> or <code>x^2-4</code>.</p>}
    </div>
  );
}

export function PhysicsCalculator({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [expression, setExpression] = useState("sin(π/4)");
  const [graphExpression, setGraphExpression] = useState("sin(x)");
  const [min, setMin] = useState(-6.28);
  const [max, setMax] = useState(6.28);
  const result = evaluate(expression);

  const append = (value: string) => setExpression((current) => `${current}${value}`);
  const clear = () => setExpression("");
  const backspace = () => setExpression((current) => current.slice(0, -1));

  return (
    <section className={cn("clay-sm", compact ? "mb-4" : "mb-5")} aria-label="Scientific calculator and graphing tool">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="flex items-center gap-2 text-sm font-extrabold"><Calculator className="size-4 text-[var(--clay-primary-deep)]" /> Scientific calculator + graphing tool <span className="text-xs font-semibold text-muted-foreground">local · no answer reveal</span></span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3">
          <div className="grid gap-4 lg:grid-cols-[minmax(250px,0.8fr)_minmax(420px,1.2fr)]">
            <div className="clay-inset p-3">
              <div className="rounded-lg bg-background/50 p-3 text-right">
                <p className="min-h-5 overflow-x-auto text-xs text-muted-foreground">{expression || "0"}</p>
                <p className="mt-1 text-2xl font-black" aria-live="polite">{format(result)}</p>
              </div>
              <div className="mt-2 grid grid-cols-5 gap-1.5">
                <button type="button" onClick={clear} className="clay-press rounded-lg px-2 py-2 text-xs font-bold text-destructive" aria-label="Clear calculator">C</button>
                <button type="button" onClick={backspace} className="clay-press rounded-lg px-2 py-2 text-xs font-bold" aria-label="Delete last character"><Delete className="mx-auto size-3.5" /></button>
                <button type="button" onClick={() => append("(")} className="clay-press rounded-lg py-2 text-xs font-bold">(</button>
                <button type="button" onClick={() => append(")")} className="clay-press rounded-lg py-2 text-xs font-bold">)</button>
                <button type="button" onClick={() => setExpression("0")} className="clay-press rounded-lg py-2 text-xs font-bold" aria-label="Reset calculator"><RotateCcw className="mx-auto size-3.5" /></button>
                {["7", "8", "9", "/", "sin(", "4", "5", "6", "*", "cos(", "1", "2", "3", "-", "tan(", "0", ".", "^", "+", "sqrt(", "π", "x", "%", "log(", "ln("].map((key) => <button key={key} type="button" onClick={() => append(key)} className="clay-press rounded-lg px-1 py-2 text-xs font-bold">{key}</button>)}
              </div>
              <p className="mt-2 text-[11px] leading-4 text-muted-foreground">Supports arithmetic, powers, π, x, sin, cos, tan, sqrt, log, ln, abs, and exp. Angles use radians.</p>
            </div>
            <div className="clay-inset p-3">
              <div className="flex items-center gap-2"><FunctionSquare className="size-4 text-[var(--clay-primary-deep)]" /><label htmlFor="graph-expression" className="text-xs font-extrabold">Graph y =</label><input id="graph-expression" value={graphExpression} onChange={(event) => setGraphExpression(event.target.value)} className="clay-sm min-w-0 flex-1 px-2.5 py-1.5 text-sm font-semibold outline-none" /></div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs"><label className="font-bold text-muted-foreground">x min<input type="number" value={min} onChange={(event) => setMin(Number(event.target.value))} className="clay-sm mt-1 w-full px-2 py-1.5 text-foreground outline-none" /></label><label className="font-bold text-muted-foreground">x max<input type="number" value={max} onChange={(event) => setMax(Number(event.target.value))} className="clay-sm mt-1 w-full px-2 py-1.5 text-foreground outline-none" /></label></div>
              <Graph expression={graphExpression} min={Number.isFinite(min) ? min : -1} max={Number.isFinite(max) && max > min ? max : min + 1} />
              <div className="mt-2 flex flex-wrap gap-1.5">{FUNCTIONS.map((fn) => <button key={fn} type="button" onClick={() => setGraphExpression((value) => `${value}${fn}(`)} className="clay-press rounded-md px-2 py-1 text-[11px] font-bold">{fn}</button>)}<button type="button" onClick={() => setGraphExpression("x^2")} className="clay-press rounded-md px-2 py-1 text-[11px] font-bold"><Plus className="mr-0.5 inline size-3" /> x²</button></div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
