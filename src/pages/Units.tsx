import { useMemo, useState } from "react";
import { Ruler, Check, X, RotateCcw, Shuffle } from "lucide-react";
import { UNITS, DIM_CHECKS, CONVERSIONS, dimToString } from "@/data/dimensions";
import { M } from "@/components/math/Math";
import { useProgress } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function recordDrill(correct: boolean) {
  import("@/lib/progress").then(({ progress }) =>
    progress.recordAnswer("f-algebra", correct, correct ? 1 : 0.5, correct ? undefined : "unit"),
  );
}

function DimCheckCard({ check }: { check: (typeof DIM_CHECKS)[number] }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="clay p-5">
      <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Does this equation balance?</p>
      <div className="clay-eq mt-3 px-4 py-3 text-center"><M>{check.tex}</M></div>
      <p className="mt-3 text-sm text-muted-foreground">
        Left side: <strong className="text-foreground">{check.lhs}</strong>. Which right-side unit chain matches?
      </p>
      <div className="mt-3 space-y-2">
        {check.rhs.map((r, i) => (
          <button
            key={i}
            disabled={picked !== null}
            onClick={() => { setPicked(i); recordDrill(i === check.answer); }}
            className={cn(
              "clay-sm clay-press block w-full px-4 py-2.5 text-left text-sm font-semibold",
              picked === i && picked !== check.answer && "ring-2 ring-destructive",
              picked !== null && i === check.answer && "ring-2 ring-[#5bbfa3]",
            )}
          >
            {r}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className="clay-tint mt-3 flex gap-2 p-3.5 text-sm">
          {picked === check.answer ? <Check className="mt-0.5 size-4 shrink-0 text-[#3d9c82]" /> : <X className="mt-0.5 size-4 shrink-0 text-destructive" />}
          <p>{check.why}</p>
        </div>
      )}
      {picked !== null && (
        <button onClick={() => setPicked(null)} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[var(--clay-primary-deep)]">
          <RotateCcw className="size-3" /> Reset
        </button>
      )}
    </div>
  );
}

function ConversionDrill() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * CONVERSIONS.length));
  const [picked, setPicked] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const c = CONVERSIONS[idx];
  return (
    <div className="clay p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Conversion practice</p>
        <span className="clay-sm px-2.5 py-1 text-xs font-extrabold">🔥 {streak} in a row</span>
      </div>
      <p className="mt-3 text-[15px] font-bold">{c.prompt}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {c.choices.map((ch, i) => (
          <button
            key={i}
            disabled={picked !== null}
            onClick={() => { setPicked(i); recordDrill(i === c.correct); setStreak(i === c.correct ? streak + 1 : 0); }}
            className={cn(
              "clay-sm clay-press px-4 py-2.5 text-left text-sm font-semibold",
              picked === i && picked !== c.correct && "ring-2 ring-destructive",
              picked !== null && i === c.correct && "ring-2 ring-[#5bbfa3]",
            )}
          >
            {ch}
          </button>
        ))}
      </div>
      {picked !== null && (
        <>
          <div className="clay-tint mt-3 p-3.5 text-sm">{c.explains}</div>
          <Button
            onClick={() => { setIdx((idx + 1 + Math.floor(Math.random() * (CONVERSIONS.length - 1))) % CONVERSIONS.length); setPicked(null); }}
            className="clay-btn clay-press mt-3 border-0 font-bold"
          >
            Next conversion <Shuffle className="ml-1.5 size-4" />
          </Button>
        </>
      )}
    </div>
  );
}

export default function Units() {
  const p = useProgress();
  const grouped = useMemo(() => {
    const byDim = new Map<string, { symbol: string; meaning: string; dimStr: string }[]>();
    Object.values(UNITS).forEach((u) => {
      const key = dimToString(u.dim);
      byDim.set(key, [...(byDim.get(key) ?? []), { symbol: u.symbol, meaning: u.meaning, dimStr: key }]);
    });
    return [...byDim.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight"><Ruler className="size-7 text-[var(--clay-4)]" /> Units & dimensional analysis</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Before you trust an equation, interrogate its units. Dimensional consistency can't prove an equation right — but it
        catches most wrong ones instantly, and it's free points on every AP exam.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold">Check the equation</h2>
          {DIM_CHECKS.slice(0, 3).map((c, i) => <DimCheckCard key={i} check={c} />)}
        </div>
        <div className="space-y-4">
          <ConversionDrill />
          <div className="clay p-5">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">The method</h2>
            <ol className="mt-3 space-y-2 text-sm">
              {[
                "Write every term with its SI units.",
                "Multiply/divide unit symbols like algebra — they cancel.",
                "Only terms with identical dimensions may add or subtract.",
                "Arguments to sin, cos, exp must be dimensionless (radians are too).",
                "If the units don't balance, the equation is wrong — stop and re-derive.",
              ].map((s, i) => (
                <li key={i} className="clay-sm flex gap-3 p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--clay-4)] text-[11px] font-extrabold text-white">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-extrabold">Check the equation (part 2)</h2>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        {DIM_CHECKS.slice(3).map((c, i) => <DimCheckCard key={i} check={c} />)}
      </div>

      <h2 className="mt-8 text-lg font-extrabold">SI unit reference — grouped by dimension</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Units sharing a dimension are interchangeable in equations; spotting twins (N·m vs J, N·s vs kg·m/s) is a superpower on the exam.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {grouped.map(([dim, members]) => (
          <div key={dim} className="clay p-4">
            <p className="text-xs font-extrabold text-[var(--clay-primary-deep)]">{dim}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {members.map((u) => (
                <span key={u.symbol} className="clay-sm px-2.5 py-1 text-xs font-bold" title={u.meaning}>
                  {u.symbol} <span className="font-medium text-muted-foreground">— {u.meaning}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Drill results feed your mastery model — {p.questionsAnswered} answered so far.
      </p>
    </div>
  );
}
