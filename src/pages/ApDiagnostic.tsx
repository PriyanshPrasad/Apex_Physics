// Adaptive AP-style diagnostic: every attempt draws a fresh random set from
// the archetype engine, difficulty adapts to streaks (never on one answer),
// and the report breaks down performance by AP skill AND by topic, with
// direct links into filtered practice.
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Stethoscope, Zap } from "lucide-react";
import { filterQuestions, pickSmart, DIFFICULTY_LABELS, DIFFICULTY_ORDER, SKILL_LABELS, type QEntry, type Difficulty } from "@/data/qbank";
import { useProgress, progress, masteryOf } from "@/lib/progress";
import { QDiagram } from "@/components/questions/Diagrams";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LENGTHS = [
  { id: "short", label: "Quick · 12 questions", n: 12 },
  { id: "full", label: "Full · 24 questions", n: 24 },
] as const;

type Answered = { q: QEntry; correct: boolean };

/** Difficulty target after a miss streak: step down at most one tier. */
function stepDown(d: Difficulty): Difficulty {
  const i = DIFFICULTY_ORDER.indexOf(d);
  return DIFFICULTY_ORDER[Math.max(0, i - 1)];
}

// One question in the live diagnostic. Re-keyed per question so diagram and
// selection state fully reset between questions.
function LiveQuestion({ q, onDone }: { q: QEntry; onDone: (correct: boolean) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const ok = selected === q.correct;

  return (
    <div>
      {q.stimulusRender && (
        <div className="clay-inset mb-4 p-4">
          <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Stimulus</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-6">{q.stimulusRender.blurb}</p>
          {q.stimulusRender.diagram && <QDiagram spec={q.stimulusRender.diagram} />}
          {q.stimulusRender.table && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-xs">
                <thead><tr>{q.stimulusRender.table.headers.map((h) => <th key={h} className="border-b border-border/60 px-2 py-2 font-extrabold">{h}</th>)}</tr></thead>
                <tbody>{q.stimulusRender.table.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="border-b border-border/40 px-2 py-2">{cell}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
      <p className="whitespace-pre-line text-[15px] leading-7">{q.prompt}</p>
      {q.diagram && (
        <div className="clay-inset mt-3 p-2">
          <QDiagram spec={q.diagram} />
        </div>
      )}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {q.choices.map((c, i) => (
          <button
            key={i}
            disabled={checked}
            onClick={() => setSelected(i)}
            className={cn(
              "clay-sm clay-press px-4 py-3 text-left text-sm font-semibold",
              selected === i && "ring-2 ring-[var(--clay-4)]",
              checked && i === q.correct && "ring-2 ring-[#5bbfa3]",
              checked && i === selected && i !== q.correct && "ring-2 ring-destructive",
            )}
          >
            <span className="mr-2 text-muted-foreground">{"ABCD"[i]}.</span>{c}
          </button>
        ))}
      </div>
      {!checked ? (
        <Button
          disabled={selected === null}
          onClick={() => {
            setChecked(true);
            progress.recordAnswer(q.conceptId, ok, ok ? 1 : 0, q.category, {
              id: q.id,
              difficulty: q.difficulty,
              source: "diagnostic",
              skill: `${q.topic}::${q.type}`,
            });
          }}
          className="clay-btn clay-press mt-4 border-0 font-bold"
        >
          Submit answer
        </Button>
      ) : (
        <div className="clay-tint mt-4 space-y-3 p-4 text-sm">
          <p className="font-bold">
            {ok ? "✓ Correct." : `✗ The answer is ${"ABCD"[q.correct]} (${q.choices[q.correct]}).`}
          </p>
          {!ok && selected !== null && q.tempt?.[selected] && (
            <p className="text-destructive">
              <strong>Why that distractor is tempting:</strong> {q.tempt[selected]}
            </p>
          )}
          <p className="leading-6">{q.explanation}</p>
          <p className="text-muted-foreground">
            <strong className="text-foreground">AP reasoning strategy:</strong> {q.apStrategy}
          </p>
          <Button onClick={() => onDone(ok)} className="clay-btn clay-press border-0 font-bold">
            Continue <ArrowRight className="ml-1 size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ApDiagnostic() {
  const p = useProgress();
  const [phase, setPhase] = useState<"intro" | "run" | "report">("intro");
  const [len, setLen] = useState<(typeof LENGTHS)[number]["id"]>("full");
  const [plan, setPlan] = useState<string[]>([]); // topic per question index
  const [asked, setAsked] = useState<Answered[]>([]);
  const [currentQ, setCurrentQ] = useState<QEntry | null>(null);

  const targetN = LENGTHS.find((l) => l.id === len)?.n ?? 24;

  const start = () => {
    const bank = filterQuestions({});
    // Topic coverage plan: shuffle topics so each attempt differs.
    const topics = Array.from(new Set(bank.map((q) => q.topic))).sort(() => Math.random() - 0.5);
    const newPlan: string[] = [];
    while (newPlan.length < targetN && topics.length > 0) {
      for (const t of topics) {
        if (newPlan.length >= targetN) break;
        newPlan.push(t);
      }
    }
    setPlan(newPlan);
    setAsked([]);
    // Pick immediately from the newly created plan. Without this, the run
    // view can render its loading state forever because the plan update is
    // asynchronous and there is no effect watching it.
    const firstTopic = newPlan[0];
    const firstPool = firstTopic ? bank.filter((q) => q.topic === firstTopic) : bank;
    setCurrentQ(pickSmart(firstPool.length > 0 ? firstPool : bank, {
      missed: new Set<string>(),
      seen: new Set<string>(),
      conceptWeakness: (cid: string) => 1 - masteryOf(p, cid) / 100,
    }));
    setPhase("run");
  };

  // Adaptive pick: topic comes from the plan, difficulty from recent streaks.
  const pickNext = (history: Answered[]): QEntry | null => {
    const bank = filterQuestions({});
    const nextTopic = plan[history.length];
    let pool = nextTopic ? bank.filter((q) => q.topic === nextTopic) : bank;
    if (pool.length === 0) pool = bank;
    const askedIds = new Set(history.map((h) => h.q.id));
    const fresh = pool.filter((q) => !askedIds.has(q.id));
    if (fresh.length > 0) pool = fresh;
    // Adaptive difficulty — only after 2+ answers in a row agree.
    let target: Difficulty = "medium";
    const recent = history.slice(-3);
    if (recent.length >= 2) {
      const di = DIFFICULTY_ORDER.indexOf(recent[recent.length - 1].q.difficulty);
      if (recent.every((h) => h.correct)) target = DIFFICULTY_ORDER[Math.min(4, di + 1)];
      else if (recent.every((h) => !h.correct)) target = stepDown(recent[recent.length - 1].q.difficulty);
      else target = recent[recent.length - 1].q.difficulty;
    }
    const ti = DIFFICULTY_ORDER.indexOf(target);
    for (let off = 0; off < DIFFICULTY_ORDER.length; off++) {
      for (const d of [ti - off, ti + off]) {
        if (d < 0 || d >= DIFFICULTY_ORDER.length) continue;
        const c = pool.filter((q) => q.difficulty === DIFFICULTY_ORDER[d]);
        if (c.length > 0) return c[Math.floor(Math.random() * c.length)];
      }
    }
    const ctx = {
      missed: new Set<string>(),
      seen: askedIds,
      conceptWeakness: (cid: string) => 1 - masteryOf(p, cid) / 100,
    };
    return pickSmart(pool, ctx);
  };

  const advance = (history: Answered[]) => {
    if (history.length >= targetN) {
      setCurrentQ(null);
      setPhase("report");
      return;
    }
    setCurrentQ(pickNext(history));
  };

  // ------------------------------------------------------------
  // Report aggregation
  // ------------------------------------------------------------
  const report = useMemo(() => {
    const bySkill = new Map<string, { c: number; t: number }>();
    const byTopic = new Map<string, { c: number; t: number }>();
    for (const { q, correct } of asked) {
      const s = bySkill.get(q.type) ?? { c: 0, t: 0 };
      s.t++; if (correct) s.c++;
      bySkill.set(q.type, s);
      const t = byTopic.get(q.topic) ?? { c: 0, t: 0 };
      t.t++; if (correct) t.c++;
      byTopic.set(q.topic, t);
    }
    const sortKey = (m: Map<string, { c: number; t: number }>): [string, { c: number; t: number }][] =>
      Array.from(m.entries()).sort((a, b) => a[1].c / a[1].t - b[1].c / b[1].t);
    return { skills: sortKey(bySkill), topics: sortKey(byTopic) };
  }, [asked]);

  const weakTopics = report.topics.filter(([topic, v]) => v.c / v.t < 0.6).slice(0, 3);

  // ------------------------------------------------------------
  // Phases
  // ------------------------------------------------------------
  if (phase === "report") {
    const correct = asked.filter((a) => a.correct).length;
    const pct = asked.length > 0 ? Math.round((correct / asked.length) * 100) : 0;
    return (
      <div className="mx-auto max-w-3xl">
        <div className="clay p-6 md:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight">Diagnostic report</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {correct} of {asked.length} correct ({pct}%) · difficulty adapted to your streaks during the run.
          </p>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">By AP skill</p>
              <div className="mt-2 space-y-2">
                {report.skills.map(([skill, v]) => {
                  const sp = Math.round((v.c / v.t) * 100);
                  return (
                    <div key={skill} className="clay-sm p-3">
                      <div className="flex justify-between text-xs font-bold">
                        <span>{SKILL_LABELS[skill as keyof typeof SKILL_LABELS] ?? skill}</span>
                        <span className={sp >= 70 ? "text-[#3d9c82]" : sp >= 40 ? "text-[#c08a2d]" : "text-destructive"}>{sp}%</span>
                      </div>
                      <div className="clay-inset mt-1.5 h-2">
                        <div className="h-2 rounded-full" style={{ width: `${Math.max(3, sp)}%`, background: sp >= 70 ? "#6fd6c8" : sp >= 40 ? "#ffc46b" : "var(--destructive)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">By topic</p>
              <div className="mt-2 space-y-2">
                {report.topics.map(([topic, v]) => {
                  const tp = Math.round((v.c / v.t) * 100);
                  return (
                    <div key={topic} className="clay-sm p-3">
                      <div className="flex justify-between text-xs font-bold">
                        <span>{topic}</span>
                        <span className={tp >= 70 ? "text-[#3d9c82]" : tp >= 40 ? "text-[#c08a2d]" : "text-destructive"}>{tp}%</span>
                      </div>
                      <div className="clay-inset mt-1.5 h-2">
                        <div className="h-2 rounded-full" style={{ width: `${Math.max(3, tp)}%`, background: tp >= 70 ? "#6fd6c8" : tp >= 40 ? "#ffc46b" : "var(--destructive)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="clay-tint mt-6 p-5">
            <h2 className="flex items-center gap-2 text-lg font-extrabold"><Zap className="size-5" /> What to do next</h2>
            {weakTopics.length > 0 ? (
              <>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Your weakest topics are listed below — practice them directly with a filtered session.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {weakTopics.map(([topic]) => (
                    <Link
                      key={topic}
                      to="/practice"
                      className="clay-sm clay-press px-3.5 py-2 text-xs font-bold text-[var(--clay-primary-deep)]"
                    >
                      Practice: {topic}
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Strong across every topic sampled this run — try Challenge Mode or an Expert-tier session in Practice.
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={start} className="clay-btn clay-press border-0 font-bold">
              Retake (new questions) <ArrowRight className="ml-1.5 size-4" />
            </Button>
            <Button variant="ghost" onClick={() => setPhase("intro")} className="font-semibold">
              Change length
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "run") {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="clay p-6 md:p-8">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Question {Math.min(asked.length + 1, targetN)} of {targetN}</span>
            <span>{DIFFICULTY_LABELS[currentQ?.difficulty ?? "medium"].split("·")[0].trim()}</span>
          </div>
          <div className="clay-inset mt-2 h-2">
            <div
              className="h-2 rounded-full bg-[var(--clay-4)] transition-all"
              style={{ width: `${(asked.length / targetN) * 100}%` }}
            />
          </div>
          {currentQ ? (
            <div className="mt-5">
              <LiveQuestion
                key={currentQ.id + asked.length}
                q={currentQ}
                onDone={(ok) => {
                  const nextHistory: Answered[] = [...asked, { q: currentQ, correct: ok }];
                  setAsked(nextHistory);
                  advance(nextHistory);
                }}
              />
            </div>
          ) : (
            <div className="clay-tint mt-5 p-6 text-center text-sm text-muted-foreground">Choosing your next question…</div>
          )}
        </div>
      </div>
    );
  }

  // intro
  return (
    <div className="mx-auto max-w-2xl">
      <div className="clay p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--clay-primary-tint)]">
          <Stethoscope className="size-7 text-[var(--clay-primary-deep)]" />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">AP-style diagnostic</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
          Every attempt is different: questions are drawn fresh from the bank across all four courses, difficulty adapts
          to your streaks, and the report shows exactly which AP skills and topics need work.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {LENGTHS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLen(l.id)}
              className={cn("clay-sm clay-press px-4 py-2 text-sm font-bold", len === l.id && "ring-2 ring-[var(--clay-4)]")}
            >
              {l.label}
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Difficulty adapts only on streaks: 2+ correct in a row steps up, 2+ misses steps down — one answer never moves the needle.
        </p>
        <Button onClick={start} className="clay-btn clay-press mt-6 border-0 px-8 py-5 font-bold">
          Start diagnostic <ArrowRight className="ml-1.5 size-4" />
        </Button>
      </div>
    </div>
  );
}
