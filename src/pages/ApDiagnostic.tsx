// Adaptive AP-style diagnostic: every attempt draws a fresh random set from
// the archetype engine, difficulty adapts to streaks (never on one answer),
// and the report breaks down performance by AP skill AND by topic, with
// direct links into filtered practice.
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Stethoscope, Zap } from "lucide-react";
import { filterQuestions, pickSmart, DIFFICULTY_LABELS, DIFFICULTY_ORDER, SKILL_LABELS, type QEntry, type Difficulty } from "@/data/qbank";
import { COURSES, COURSE_MAP, type CourseId } from "@/data/curriculum";
import { useProgress, progress, masteryOf } from "@/lib/progress";
import { QDiagram } from "@/components/questions/Diagrams";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LENGTHS = [
  { id: "quick", label: "Quick · 12 questions", n: 12, minutes: 18 },
  { id: "standard", label: "Standard · 24 questions", n: 24, minutes: 36 },
  { id: "full", label: "Full · 36 questions", n: 36, minutes: 54 },
  { id: "custom", label: "Custom", n: 0, minutes: 0 },
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
            aria-pressed={selected === i}
            aria-label={`Choice ${"ABCD"[i]}${selected === i ? ", selected" : ""}`}
            onClick={() => setSelected(i)}
            className={cn(
              "clay-sm clay-press flex items-start gap-3 border-2 px-4 py-3 text-left text-sm font-semibold transition-all duration-200",
              selected === i && "border-[var(--clay-4)] bg-[var(--clay-primary-tint)] text-[var(--clay-primary-deep)] ring-2 ring-[var(--clay-4)] ring-offset-2 ring-offset-background scale-[1.01]",
              selected !== i && "border-transparent",
              checked && i === q.correct && "ring-2 ring-[#5bbfa3]",
              checked && i === selected && i !== q.correct && "ring-2 ring-destructive",
            )}
          >
            <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black", selected === i ? "border-[var(--clay-4)] bg-[var(--clay-4)] text-white" : "border-muted-foreground/40 text-muted-foreground")}>
              {selected === i ? "✓" : "ABCD"[i]}
            </span>
            <span className="pt-0.5">{c}</span>
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
  const [len, setLen] = useState<(typeof LENGTHS)[number]["id"]>("standard");
  const [customN, setCustomN] = useState(30);
  const [courses, setCourses] = useState<CourseId[]>(["p1"]);
  const [difficultyMode, setDifficultyMode] = useState<"mixed" | "easy-hard" | "standard" | "challenging" | "advanced">("mixed");
  const [plan, setPlan] = useState<string[]>([]); // topic per question index
  const [asked, setAsked] = useState<Answered[]>([]);
  const [currentQ, setCurrentQ] = useState<QEntry | null>(null);

  const targetN = len === "custom" ? customN : LENGTHS.find((l) => l.id === len)?.n ?? 24;
  const toggleCourse = (courseId: CourseId) => setCourses((current) => current.includes(courseId) ? current.filter((id) => id !== courseId) : [...current, courseId]);

  const start = () => {
    const bank = filterQuestions({}).filter((q) => courses.includes(q.course));
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
    // Baseline distribution is approximately 20% foundation, 40% standard,
    // 25% challenging, and 15% advanced. Streaks may move one tier, but the
    // diagnostic never collapses into all-easy or all-hard questions.
    const fraction = history.length / Math.max(1, targetN);
    let target: Difficulty = difficultyMode === "easy-hard"
      ? (fraction < 0.5 ? "easy" : fraction < 0.8 ? "medium" : "hard")
      : difficultyMode === "standard" ? "medium"
        : difficultyMode === "challenging" ? "hard"
          : difficultyMode === "advanced" ? "ap"
            : fraction < 0.2 ? "easy" : fraction < 0.6 ? "medium" : fraction < 0.85 ? "hard" : "ap";
    const recent = history.slice(-3);
    if (recent.length >= 2) {
      const di = DIFFICULTY_ORDER.indexOf(target);
      if (recent.every((h) => h.correct)) target = DIFFICULTY_ORDER[Math.min(4, di + 1)];
      else if (recent.every((h) => !h.correct)) target = stepDown(target);
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
    const byCourse = new Map<string, { c: number; t: number }>();
    const misconceptions = new Map<string, number>();
    for (const { q, correct } of asked) {
      const courseScore = byCourse.get(q.course) ?? { c: 0, t: 0 };
      courseScore.t++; if (correct) courseScore.c++;
      byCourse.set(q.course, courseScore);
      const s = bySkill.get(q.type) ?? { c: 0, t: 0 };
      s.t++; if (correct) s.c++;
      bySkill.set(q.type, s);
      const t = byTopic.get(q.topic) ?? { c: 0, t: 0 };
      t.t++; if (correct) t.c++;
      byTopic.set(q.topic, t);
      if (!correct && q.category) misconceptions.set(q.category, (misconceptions.get(q.category) ?? 0) + 1);
    }
    const sortKey = (m: Map<string, { c: number; t: number }>): [string, { c: number; t: number }][] =>
      Array.from(m.entries()).sort((a, b) => a[1].c / a[1].t - b[1].c / b[1].t);
    return { courses: sortKey(byCourse), skills: sortKey(bySkill), topics: sortKey(byTopic), misconceptions: [...misconceptions.entries()].sort((a, b) => b[1] - a[1]) };
  }, [asked]);

  const weakTopics = report.topics.filter(([, v]) => v.c / v.t < 0.6).slice(0, 3);

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

          <div className="mt-5">
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">By course</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {report.courses.map(([courseId, value]) => { const cp = Math.round((value.c / value.t) * 100); return <div key={courseId} className="clay-sm p-3"><div className="flex justify-between text-xs font-bold"><span>{COURSE_MAP[courseId as CourseId]?.short ?? courseId}</span><span>{cp}%</span></div><div className="clay-inset mt-1.5 h-2"><div className="h-2 rounded-full bg-[var(--clay-4)]" style={{ width: `${Math.max(3, cp)}%` }} /></div></div>; })}
            </div>
          </div>

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

          {report.misconceptions.length > 0 && (
            <div className="clay-tint mt-6 p-5">
              <h2 className="flex items-center gap-2 text-lg font-extrabold"><Stethoscope className="size-5" /> Likely misconception signals</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">These are patterns in missed questions, not diagnoses. Practice the same idea through a different representation.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {report.misconceptions.slice(0, 5).map(([category, count]) => <span key={category} className="clay-sm px-3 py-1.5 text-xs font-bold">{category.split("-").join(" ")} · {count} misses</span>)}
              </div>
            </div>
          )}

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

  // intro / configuration
  const selectedTopics = Array.from(new Set(filterQuestions({}).filter((q) => courses.includes(q.course)).map((q) => q.topic)));
  const selectedSkills = Array.from(new Set(filterQuestions({}).filter((q) => courses.includes(q.course)).flatMap((q) => q.type)));
  const lengthMeta = LENGTHS.find((l) => l.id === len);
  return (
    <div className="mx-auto max-w-3xl">
      <div className="clay p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--clay-primary-tint)]">
            <Stethoscope className="size-7 text-[var(--clay-primary-deep)]" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Configure your AP diagnostic</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Choose any course combination. Each attempt builds a fresh, coverage-aware assessment from original questions, diagrams, data, and AP science practices.</p>
          </div>
        </div>

        <section className="mt-7">
          <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Courses to assess</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {COURSES.map((course) => {
              const selected = courses.includes(course.id);
              return (
                <button key={course.id} onClick={() => toggleCourse(course.id)} aria-pressed={selected} className={cn("clay-sm clay-press flex items-start gap-3 border-2 p-4 text-left transition-all", selected ? "border-[var(--clay-4)] bg-[var(--clay-primary-tint)] ring-2 ring-[var(--clay-4)]" : "border-transparent")}>
                  <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black", selected ? "border-[var(--clay-4)] bg-[var(--clay-4)] text-white" : "border-muted-foreground/40 text-muted-foreground")}>{selected ? "✓" : ""}</span>
                  <span><span className="block text-sm font-extrabold" style={{ color: selected ? course.color : undefined }}>{course.short}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{course.math === "calculus" ? "Calculus-based" : "Algebra-based"} · {course.blurb}</span></span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold"><span className="text-muted-foreground">Diagnostic length</span><select value={len} onChange={(e) => setLen(e.target.value as (typeof LENGTHS)[number]["id"])} className="clay-inset mt-1 w-full px-3 py-2.5 text-sm font-semibold outline-none">{LENGTHS.map((l) => <option key={l.id} value={l.id}>{l.label}{l.n ? ` · ${l.minutes} min` : ""}</option>)}</select></label>
          {len === "custom" ? <label className="text-xs font-bold"><span className="text-muted-foreground">Questions: {customN}</span><input type="range" min={8} max={60} step={2} value={customN} onChange={(e) => setCustomN(Number(e.target.value))} className="mt-3 h-2 w-full" /></label> : <label className="text-xs font-bold"><span className="text-muted-foreground">Difficulty profile</span><select value={difficultyMode} onChange={(e) => setDifficultyMode(e.target.value as typeof difficultyMode)} className="clay-inset mt-1 w-full px-3 py-2.5 text-sm font-semibold outline-none"><option value="mixed">Mixed · adaptive coverage</option><option value="easy-hard">Easy → hard</option><option value="standard">Standard AP</option><option value="challenging">Challenging</option><option value="advanced">Advanced AP</option></select></label>}
        </section>

        <div className="clay-tint mt-6 grid gap-3 p-4 sm:grid-cols-3">
          <div><p className="text-[10px] font-extrabold uppercase text-muted-foreground">Selected courses</p><p className="mt-1 text-sm font-black">{courses.length ? courses.map((id) => COURSE_MAP[id].short).join(" + ") : "None selected"}</p></div>
          <div><p className="text-[10px] font-extrabold uppercase text-muted-foreground">Coverage</p><p className="mt-1 text-sm font-black">{targetN} questions · {selectedTopics.length} topics</p></div>
          <div><p className="text-[10px] font-extrabold uppercase text-muted-foreground">AP skills</p><p className="mt-1 text-sm font-black">{selectedSkills.length} skill types</p></div>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">Difficulty adapts only after rolling evidence: two or more correct answers move up one tier, while two or more misses move down one tier. A single answer never determines your level.</p>
        <Button disabled={courses.length === 0} onClick={start} className="clay-btn clay-press mt-6 w-full border-0 py-5 font-bold"><Stethoscope className="mr-2 size-4" /> Start {targetN}-question diagnostic <ArrowRight className="ml-1.5 size-4" /></Button>
      </div>
    </div>
  );
}
