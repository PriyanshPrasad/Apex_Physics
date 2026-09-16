import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, RotateCcw, Route as RouteIcon, Check } from "lucide-react";
import { DIAGNOSTIC_QUESTIONS, recommend } from "@/data/diagnostic";
import { useProgress, masteryOf } from "@/lib/progress";
import { COURSE_MAP, type CourseId } from "@/data/curriculum";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { QDiagram } from "@/components/questions/Diagrams";
import { StimulusVisuals } from "@/components/questions/StimulusVisuals";
import { stimRender } from "@/data/qgen/core";
import type { DiagnosticQuestion } from "@/data/diagnostic";

const DOMAIN_NAMES: Record<string, string> = {
  "f-algebra": "Algebra",
  "f-trig": "Trigonometry",
  "f-graphs": "Graphs",
  "f-vectors": "Vectors",
  "f-mechanics": "Basic mechanics",
  "f-energy": "Energy",
  "f-momentum": "Momentum",
  "f-calculus": "Calculus",
  "f-diffeq": "Differential equations",
  "f-electricity": "Electricity",
};

function DiagnosticVisual({ question }: { question: DiagnosticQuestion }) {
  const stimulus = question.stimulus ? stimRender(question.stimulus) : null;
  return (
    <div className="mt-4 space-y-4">
      {stimulus && (
        <section className="clay-inset p-4" aria-label={stimulus.title}>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Stimulus</p>
          <h2 className="mt-1 text-base font-extrabold">{stimulus.title}</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-6">{stimulus.blurb}</p>
          {stimulus.diagram && (
            <figure className="mt-3">
              <div className="clay-sm overflow-hidden p-2"><QDiagram spec={stimulus.diagram} /></div>
              <figcaption className="mt-1 text-center text-xs text-muted-foreground">{stimulus.caption}</figcaption>
            </figure>
          )}
          {stimulus.table && (
            <figure className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-xs">
                <thead><tr>{stimulus.table.headers.map((header) => <th key={header} className="border-b border-border/60 px-2 py-2 font-extrabold">{header}</th>)}</tr></thead>
                <tbody>{stimulus.table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border-b border-border/40 px-2 py-2">{cell}</td>)}</tr>)}</tbody>
              </table>
              <figcaption className="mt-1 text-xs text-muted-foreground">{stimulus.caption}</figcaption>
            </figure>
          )}
          {stimulus.visuals && <StimulusVisuals visuals={stimulus.visuals} />}
          {stimulus.purpose && <p className="mt-2 text-[11px] text-muted-foreground">Purpose: {stimulus.purpose}</p>}
        </section>
      )}
      {question.diagram && <div className="clay-inset overflow-hidden p-2"><QDiagram spec={question.diagram} /></div>}
    </div>
  );
}

export default function Diagnostic() {
  const p = useProgress();
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => DIAGNOSTIC_QUESTIONS.map(() => null));
  const [finished, setFinished] = useState(false);

  const scores = useMemo(() => {
    const s: Record<string, { correct: number; total: number }> = {};
    DIAGNOSTIC_QUESTIONS.forEach((q, i) => {
      s[q.domain] ??= { correct: 0, total: 0 };
      s[q.domain].total++;
      if (answers[i] === q.correct) s[q.domain].correct++;
    });
    const pct: Record<string, number> = {};
    Object.entries(s).forEach(([k, v]) => (pct[k] = Math.round((v.correct / v.total) * 100)));
    return pct;
  }, [answers]);

  const rec = useMemo(() => recommend(scores), [scores]);

  const q = DIAGNOSTIC_QUESTIONS[idx];

  const finish = () => {
    setFinished(true);
    useProgressSetDiagnostic(scores, rec);
  };

  if (finished) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="clay p-6 md:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight">Your physics level</h1>
          <p className="mt-1 text-sm text-muted-foreground">{rec.summary}</p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {Object.entries(scores).map(([domain, pct]) => (
              <div key={domain} className="clay-sm p-3.5">
                <div className="flex justify-between text-xs font-bold">
                  <span>{DOMAIN_NAMES[domain] ?? domain}</span>
                  <span className={pct >= 70 ? "text-[#3d9c82]" : pct >= 40 ? "text-[#c08a2d]" : "text-destructive"}>{pct}%</span>
                </div>
                <div className="clay-inset mt-1.5 h-2">
                  <div className="h-2 rounded-full" style={{ width: `${Math.max(3, pct)}%`, background: pct >= 70 ? "#6fd6c8" : pct >= 40 ? "#ffc46b" : "var(--destructive)" }} />
                </div>
              </div>
            ))}
          </div>

          <div className="clay-tint mt-6 p-5">
            <h2 className="flex items-center gap-2 text-lg font-extrabold"><RouteIcon className="size-5" /> Your physics roadmap</h2>
            <div className="mt-3 space-y-2">
              {rec.path.map((step, i) => (
                <div key={i} className="clay-sm flex items-center gap-3 px-4 py-2.5 text-sm font-semibold">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--clay-4)] text-[11px] font-extrabold text-white">{i + 1}</span>
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={() => navigate(`/learn/${rec.courses[0]}`)}
              className="clay-btn clay-press border-0 font-bold"
            >
              Start {COURSE_MAP[rec.courses[0] as CourseId].short} <ArrowRight className="ml-1 size-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setStarted(false); setFinished(false); setIdx(0); setAnswers(DIAGNOSTIC_QUESTIONS.map(() => null)); }}
              className="font-semibold"
            >
              <RotateCcw className="mr-1.5 size-4" /> Retake
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="clay p-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">Find my physics level</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            {DIAGNOSTIC_QUESTIONS.length} quick questions across algebra, trigonometry, vectors, graphs, mechanics, energy, calculus, differential equations, and electricity.
            No scoring pressure — this places you in the right course and builds your personalized roadmap.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {Object.values(DOMAIN_NAMES).map((d) => (
              <span key={d} className="clay-sm px-3 py-1 text-xs font-bold">{d}</span>
            ))}
          </div>
          {p.diagnostic?.completed && (
            <p className="mt-4 text-xs text-muted-foreground">You've taken this before — retaking refreshes your roadmap.</p>
          )}
          <Button onClick={() => setStarted(true)} className="clay-btn clay-press mt-6 border-0 px-8 py-5 font-bold">
            Start diagnostic <ArrowRight className="ml-1.5 size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="clay p-6 md:p-8">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>{DOMAIN_NAMES[q.domain]} · question {idx + 1} of {DIAGNOSTIC_QUESTIONS.length}</span>
          <span>{Math.round(((idx) / DIAGNOSTIC_QUESTIONS.length) * 100)}%</span>
        </div>
        <div className="clay-inset mt-2 h-2">
          <div className="h-2 rounded-full bg-[var(--clay-4)] transition-all" style={{ width: `${(idx / DIAGNOSTIC_QUESTIONS.length) * 100}%` }} />
        </div>

        <p className="mt-6 text-lg font-bold leading-7">{q.prompt}</p>
        <DiagnosticVisual question={q} />
        <div className="mt-4 space-y-2">
          {q.choices.map((c, i) => (
            <button
              key={i}
              aria-pressed={answers[idx] === i}
              aria-label={`Choice ${"ABCD"[i]}${answers[idx] === i ? ", selected" : ""}`}
              onClick={() => setAnswers((a) => a.map((v, j) => (j === idx ? i : v)))}
              className={cn(
                "clay-sm clay-press flex w-full items-start gap-3 border-2 px-4 py-3 text-left text-sm font-semibold transition-all duration-200",
                answers[idx] === i && "border-[var(--clay-4)] bg-[var(--clay-primary-tint)] text-[var(--clay-primary-deep)] ring-2 ring-[var(--clay-4)] ring-offset-2 ring-offset-background scale-[1.01]",
                answers[idx] !== i && "border-transparent",
              )}
            >
              <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black", answers[idx] === i ? "border-[var(--clay-4)] bg-[var(--clay-4)] text-white" : "border-muted-foreground/40 text-muted-foreground")}>
                {answers[idx] === i ? "✓" : "ABCD"[i]}
              </span>
              <span className="pt-0.5">{c}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)} className="font-semibold">
            Back
          </Button>
          {idx < DIAGNOSTIC_QUESTIONS.length - 1 ? (
            <Button disabled={answers[idx] === null} onClick={() => setIdx((i) => i + 1)} className="clay-btn clay-press border-0 font-bold">
              Next <ArrowRight className="ml-1 size-4" />
            </Button>
          ) : (
            <Button disabled={answers[idx] === null} onClick={finish} className="clay-btn clay-press border-0 font-bold">
              <Check className="mr-1.5 size-4" /> See my level
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function useProgressSetDiagnostic(scores: Record<string, number>, rec: ReturnType<typeof recommend>) {
  import("@/lib/progress").then(({ progress }) => {
    progress.setDiagnostic({
      completed: true,
      scores,
      recommendedCourses: rec.courses,
    });
    // seed foundation mastery from diagnostic so prereq engine has signal
    Object.entries(scores).forEach(([domain, pct]) => {
      const cur = masteryOf(progress.get(), domain);
      if (cur < pct) progress.recordAnswer(domain, true, pct / 100, undefined);
    });
  });
}
