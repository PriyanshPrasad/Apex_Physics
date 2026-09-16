import { useState } from "react";
import { Calculator, ChevronDown, Delete, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

function normalizeExpression(value: string): string {
  return value
    .split("π").join("PI")
    .split("√").join("sqrt")
    .split("^").join("**")
    .replace(/\bln\b/g, "log")
    .replace(/\blog10\b/g, "log10");
}

function evaluate(value: string): number | null {
  const expression = normalizeExpression(value.trim());
  if (!expression || !/^[0-9a-zA-Z_+\-*/%().,\s]*$/.test(expression)) return null;
  try {
    // The whitelist above limits input to mathematical tokens; all functions
    // are supplied explicitly and no browser/global object is exposed.
    const fn = new Function("PI", "sin", "cos", "tan", "asin", "acos", "atan", "sqrt", "log", "log10", "abs", "exp", `"use strict"; return (${expression});`);
    const result = fn(Math.PI, Math.sin, Math.cos, Math.tan, Math.asin, Math.acos, Math.atan, Math.sqrt, Math.log, Math.log10, Math.abs, Math.exp);
    return typeof result === "number" && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

function format(value: number | null): string {
  if (value === null) return "—";
  return Number.isInteger(value) ? String(value) : value.toPrecision(10).replace(/0+$/, "").replace(/\.$/, "");
}

export function PhysicsCalculator({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [expression, setExpression] = useState("sin(π/4)");
  const result = evaluate(expression);

  const append = (value: string) => setExpression((current) => `${current}${value}`);
  const clear = () => setExpression("");
  const backspace = () => setExpression((current) => current.slice(0, -1));

  return (
    <section className={cn("clay-sm", compact ? "mb-4" : "mb-5")} aria-label="Scientific calculator">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="flex items-center gap-2 text-sm font-extrabold"><Calculator className="size-4 text-[var(--clay-primary-deep)]" /> Scientific calculator <span className="text-xs font-semibold text-muted-foreground">local · no answer reveal</span></span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3">
          <div className="mx-auto max-w-md clay-inset p-3">
            <div className="rounded-lg bg-background/50 p-3 text-right">
              <p className="min-h-5 overflow-x-auto text-xs text-muted-foreground">{expression || "0"}</p>
              <p className="mt-1 text-2xl font-black" aria-live="polite">{format(result)}</p>
            </div>
            <div className="mt-2 grid grid-cols-5 gap-1.5">
              <button type="button" onClick={clear} className="clay-press rounded-lg px-2 py-2 text-xs font-bold text-destructive" aria-label="Clear calculator">C</button>
              <button type="button" onClick={backspace} className="clay-press rounded-lg px-2 py-2 text-xs font-bold" aria-label="Delete last character"><Delete className="mx-auto size-3.5" /></button>
              <button type="button" onClick={() => append("(")} className="clay-press rounded-lg py-2 text-xs font-bold">(</button>
              <button type="button" onClick={() => append(")")} className="clay-press rounded-lg py-2 text-xs font-bold">)</button>
              <button type="button" onClick={() => setExpression("")} className="clay-press rounded-lg py-2 text-xs font-bold" aria-label="Reset calculator"><RotateCcw className="mx-auto size-3.5" /></button>
              {["7", "8", "9", "/", "sin(", "4", "5", "6", "*", "cos(", "1", "2", "3", "-", "tan(", "0", ".", "^", "+", "sqrt(", "π", "e", "%", "log(", "ln(", "abs(", "exp(", "asin(", "acos(", "atan("].map((key) => <button key={key} type="button" onClick={() => append(key)} className="clay-press rounded-lg px-1 py-2 text-xs font-bold">{key}</button>)}
            </div>
            <p className="mt-2 text-[11px] leading-4 text-muted-foreground">Supports arithmetic, powers, parentheses, π, e, sin, cos, tan, inverse trig, sqrt, log, ln, abs, and exp. Trig functions use radians.</p>
          </div>
        </div>
      )}
    </section>
  );
}
