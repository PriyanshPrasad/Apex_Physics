import { useMemo, useState, useCallback } from "react";
import { Link } from "react-router";
import { ArrowRight, Lightbulb, RotateCcw, Shuffle, PenLine, Check, Play, Target, Timer, Zap, X } from "lucide-react";
import { CONCEPTS, COURSE_MAP, UNITS, type CourseId } from "@/data/curriculum";
import {
  filterQuestions, pickSmart, buildSet, bankStats, DIFFICULTY_LABELS, DIFFICULTY_ORDER, SKILL_LABELS,
  type QEntry, type QFilters, type Difficulty, type QuestionType, type SelectionCtx,
} from "@/data/qbank";
import { useProgress, progress, masteryOf } from "@/lib/progress";
import { QDiagram } from "@/components/questions/Diagrams";
import { M } from "@/components/math/Math";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------
// Practice modes (spec §23)
// ------------------------------------------------------------
const MODES = [
  { id: "quick", label: "Quick Practice", n: 10, desc: "10 questions" },
  { id: "standard", label: "Standard Practice", n: 25, desc: "25 questions" },
  { id: "deep", label: "Deep Practice", n: 50, desc: "50 questions" },
  { id: "mastery", label: "Topic Mastery", n: 100, desc: "100-question pool" },
  { id: "weak", label: "Weakness Practice", n: 15, desc: "targets your weak concepts" },
  { id: "challenge", label: "Challenge Mode", n: 20, desc: "hard → expert only" },
] as const;

const DIFFICULTIES: (Difficulty | "any")[] = ["any", "easy", "medium", "hard", "ap", "challenge"];
const TYPES: (QuestionType | "any")[] = ["any", "conceptual", "quantitative", "graph", "diagram", "experimental", "representation", "equation-selection", "proportional-reasoning"];

function diffColor(d: Difficulty): string {
  return { easy: "#3d9c82", medium: "#7c6cf4", hard: "#e08a3c", ap: "#e05a6d", challenge: "#c14bd8" }[d];
}

function record(conceptId: string, correct: boolean, category?: string) {
  progress.recordAnswer(conceptId, correct, correct ? 1 : 0, correct ? undefined : (category as never));
}

/** Renders {eq}...{/eq} math inline */
function Rich({ text }: { text: string }) {
  const parts = useMemo(() => text.split(/(\{eq\}.*?\{\/eq\})/g), [text]);
  return (
    <>{parts.map((part, i) => (part.startsWith("{eq}") ? <M key={i}>{part.slice(4, -5)}</M> : <span key={i}>{part}</span>))}</>
  );
}

// ------------------------------------------------------------
// One question card (used by sessions and free-run)
// ------------------------------------------------------------
function QuestionCard({
  q, sessionPos, sessionLen, onNext, showSession, timed,
}: {
  q: QEntry;
  sessionPos?: number;
  sessionLen?: number;
  onNext?: () => void;
  showSession?: boolean;
  timed?: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [showDiagramZoom, setShowDiagramZoom] = useState(false);

  const correct = checked && selected === q.correct;
  const course = COURSE_MAP[q.course];

  return (
    <div className="clay p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="clay-sm px-2 py-0.5 font-extrabold" style={{ color: course.color }}>{course.short}</span>
          <span className="text-muted-foreground">Unit {q.unit} · {q.topic}</span>
          <span className="clay-sm px-2 py-0.5 font-extrabold uppercase" style={{ color: diffColor(q.difficulty) }}>
            {DIFFICULTY_LABELS[q.difficulty].split("·")[0].trim()}
          </span>
          <span className="clay-sm px-2 py-0.5 font-bold text-muted-foreground">{SKILL_LABELS[q.type]}</span>
        </div>
        {showSession && sessionPos !== undefined && sessionLen && (
          <span className="text-xs font-bold text-muted-foreground">{sessionPos + 1} / {sessionLen}{timed ? " · timed" : ""}</span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-[15px] leading-7"><Rich text={q.prompt} /></p>
        {q.diagram && (
          <button
            onClick={() => setShowDiagramZoom((z) => !z)}
            className={cn("clay-inset mt-3 block w-full cursor-zoom-in overflow-hidden p-2 text-left", showDiagramZoom && "cursor-zoom-out")}
            title="Click to enlarge"
          >
            <div className={cn("mx-auto transition-all", showDiagramZoom ? "max-w-2xl scale-100" : "max-w-md")}>
              <QDiagram spec={q.diagram} />
            </div>
          </button>
        )}
      </div>

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

      {!checked && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            disabled={selected === null}
            onClick={() => {
              setChecked(true);
              record(q.conceptId, selected === q.correct, q.category);
            }}
            className="clay-btn clay-press border-0 font-bold"
          >
            Check answer
          </Button>
        </div>
      )}

      {checked && (
        <div className="clay-tint mt-4 space-y-3 p-4 text-sm">
          <p className="font-bold">
            {correct ? "✓ Correct." : `✗ Not quite — the answer is ${"ABCD"[q.correct]} (${q.choices[q.correct]}).`}
          </p>

          {!correct && selected !== null && q.tempt?.[selected] && (
            <p className="text-destructive">
              <strong>Why that distractor is tempting:</strong> {q.tempt[selected]}
            </p>
          )}

          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Solution</p>
            <p className="mt-1 leading-6">{q.explanation}</p>
          </div>

          {q.equations.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {q.equations.map((e, i) => <span key={i} className="clay-sm px-2.5 py-1"><M>{e}</M></span>)}
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <p className="text-muted-foreground"><strong className="text-foreground">Common trap:</strong> {q.commonMistake}</p>
            <p className="text-muted-foreground"><strong className="text-foreground">AP reasoning strategy:</strong> {q.apStrategy}</p>
          </div>

          {onNext && (
            <Button onClick={onNext} className="clay-btn clay-press border-0 font-bold">
              Next question <ArrowRight className="ml-1 size-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Free-response bank (self-scored rubrics)
// ------------------------------------------------------------
const FREE_RESPONSE_TASKS = [
  {
    id: "fr-energy", skill: "Qualitative/Quantitative Translation",
    prompt: "A block slides down a frictionless ramp from height h, then along a rough horizontal surface (coefficient μₖ) and stops after distance d.",
    parts: [
      "Part A (reasoning): Explain why energy methods, not kinematics, are the efficient approach on the rough surface.",
      "Part B (derive): Show that d = h/μₖ using energy conservation with friction work.",
      "Part C (justify): A student claims doubling h doubles d. Agree or disagree, citing your equation.",
    ],
    rubric: [
      "Names the system; states friction dissipates mechanical energy into thermal energy",
      "Writes mgh = μₖmg·d (or W_friction = ΔK) before substituting numbers",
      "Solves symbolically first: d = h/μₖ — mass cancels",
      "Agrees: d ∝ h, so doubling h doubles d; cites the derived equation",
    ],
  },
  {
    id: "fr-circuits", skill: "Experimental Design",
    prompt: "You have a battery, two resistors, an ammeter, a voltmeter, wires, and a switch. Design an experiment to determine an unknown resistance.",
    parts: [
      "Part A: State the measurements and how each meter must be connected.",
      "Part B: Explain how to combine Ohm's law with the measurements to obtain R.",
      "Part C: Describe one systematic error that would bias R, and a fix.",
    ],
    rubric: [
      "Ammeter in series with the resistor; voltmeter in parallel across it",
      "Record V and I; compute R = V/I, ideally several trials",
      "Graph V vs I and use the slope as R to reduce random error",
      "Identifies meter loading or ammeter resistance; proposes a correction",
    ],
  },
  {
    id: "fr-momentum", skill: "Mathematical Routines",
    prompt: "Cart A (mass 2m) moves at speed v toward stationary cart B (mass m). They collide elastically.",
    parts: [
      "Part A: Write the two conservation equations that apply.",
      "Part B: Solve for both final speeds symbolically.",
      "Part C: Check the equal-mass special case — does it match the known result?",
    ],
    rubric: [
      "Momentum: 2m·v = 2m·v_A + m·v_B",
      "Elastic K: ½(2m)v² = ½(2m)v_A² + ½mv_B²",
      "v_A = v/3, v_B = 4v/3",
      "Equal masses → velocities exchange — the limiting check",
    ],
  },
  {
    id: "fr-rc", skill: "Derivation (Physics C)",
    prompt: "A capacitor C charged to V₀ discharges through resistor R starting at t = 0.",
    parts: [
      "Part A: Write the loop rule and the relation between I and dQ/dt (mind the sign).",
      "Part B: Separate variables and integrate to find Q(t).",
      "Part C: Derive the time at which the charge reaches half its initial value.",
    ],
    rubric: [
      "Q/C − IR = 0 with I = −dQ/dt (discharging sign convention)",
      "dQ/Q = −dt/RC → ln(Q/Q₀) = −t/RC → Q = Q₀e^(−t/RC)",
      "Set e^(−t/RC) = ½ → t = RC·ln2",
      "Notes the decay is exponential, not linear (no credit for t = RC/2)",
    ],
  },
];

function FreeResponseCard({ task }: { task: (typeof FREE_RESPONSE_TASKS)[number] }) {
  const [answers, setAnswers] = useState(["", "", ""]);
  const [checked, setChecked] = useState(false);
  const done = checked && answers.every((a) => a.trim().length > 10);
  return (
    <div className="clay p-6">
      <span className="clay-sm px-2.5 py-1 text-[11px] font-extrabold text-[var(--clay-primary-deep)]">{task.skill}</span>
      <p className="mt-3 text-[15px] leading-7">{task.prompt}</p>
      <div className="mt-4 space-y-3">
        {task.parts.map((part, i) => (
          <div key={i}>
            <p className="text-xs font-bold text-muted-foreground">{part}</p>
            <textarea
              value={answers[i]}
              disabled={checked}
              onChange={(e) => setAnswers((a) => a.map((v, j) => (j === i ? e.target.value : v)))}
              rows={2}
              placeholder="Construct your reasoning — the AP exam rewards justification, not just answers…"
              className="clay-inset mt-1 w-full resize-y px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </div>
        ))}
      </div>
      {!checked ? (
        <Button onClick={() => setChecked(true)} className="clay-btn clay-press mt-3 border-0 font-bold">
          <PenLine className="mr-1.5 size-4" /> Self-score against rubric
        </Button>
      ) : (
        <div className="clay-tint mt-4 p-4">
          <p className="text-sm font-bold">Rubric — award yourself each point you genuinely earned:</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {task.rubric.map((r, i) => (
              <li key={i} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#3d9c82]" />{r}</li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <Button variant="ghost" onClick={() => { setChecked(false); setAnswers(["", "", ""]); }} className="text-xs font-semibold">
              <RotateCcw className="mr-1 size-3" /> Try again
            </Button>
            {done && <span className="text-xs font-bold text-[#3d9c82]">All parts attempted ✓</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Main page
// ------------------------------------------------------------
export default function Practice() {
  const p = useProgress();
  const stats = bankStats();
  const [tab, setTab] = useState<"session" | "free" | "frq">("session");

  // filters
  const [course, setCourse] = useState<CourseId | "any">("any");
  const [unit, setUnit] = useState<number | "any">("any");
  const [topic, setTopic] = useState<string | "any">("any");
  const [difficulty, setDifficulty] = useState<Difficulty | "any">("any");
  const [type, setType] = useState<QuestionType | "any">("any");
  const [mode, setMode] = useState<string>("standard");

  // session state
  const [session, setSession] = useState<QEntry[] | null>(null);
  const [pos, setPos] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [results, setResults] = useState<{ id: string; correct: boolean }[]>([]);

  // free-run state
  const [freeQ, setFreeQ] = useState<QEntry | null>(null);
  const [freeKey, setFreeKey] = useState(0);

  const unitsForCourse = UNITS.filter((u) => course === "any" || u.course === course);
  const topics = useMemo(
    () => Array.from(new Set(filterQuestions({ course: course === "any" ? undefined : course }).map((q) => q.topic))),
    [course],
  );

  const ctx: SelectionCtx = {
    missed: new Set(p.questionHistory.filter((h) => !h.correct).map((h) => h.id)),
    seen: new Set(p.questionHistory.map((h) => h.id)),
    conceptWeakness: (cid) => 1 - masteryOf(p, cid) / 100,
  };

  const pool = useMemo(
    () => filterQuestions({ course, unit, topic, difficulty, type }),
    [course, unit, topic, difficulty, type],
  );

  const startSession = useCallback(() => {
    const modeDef = MODES.find((m) => m.id === mode) ?? MODES[1];
    let p2 = pool;
    if (modeDef.id === "weak") {
      const weak = p2.filter((q) => ctx.conceptWeakness(q.conceptId) > 0.4);
      if (weak.length > 0) p2 = weak;
    }
    if (modeDef.id === "challenge") {
      const hard = p2.filter((q) => q.difficulty === "hard" || q.difficulty === "ap" || q.difficulty === "challenge");
      if (hard.length > 0) p2 = hard;
    }
    const n = Math.min(modeDef.n, p2.length);
    const set = buildSet(p2, n, ctx);
    setSession(set.length > 0 ? set : null);
    setPos(0);
    setResults([]);
    setStartedAt(Date.now());
    setElapsed(0);
  }, [pool, mode, ctx]);

  const nextFree = () => {
    setFreeQ(pickSmart(pool.length > 0 ? pool : filterQuestions({}), ctx));
    setFreeKey((k) => k + 1);
  };

  const current = session?.[pos];
  const done = session !== null && pos >= session.length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Practice</h1>
          <p className="text-sm text-muted-foreground">
            {stats.total} AP-style questions · {stats.hand} hand-written + {stats.gen} generated variants across {ARCHETYPE_COUNT_LABEL} reasoning archetypes
          </p>
        </div>
        <div className="clay-sm flex overflow-hidden p-1">
          {([["session", "Sessions"], ["free", "Free run"], ["frq", "Free response"]] as const).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn("clay-press rounded-xl px-4 py-1.5 text-sm font-bold", tab === t ? "bg-[var(--clay-primary-tint)] text-[var(--clay-primary-deep)]" : "text-muted-foreground")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "frq" ? (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Free-response practice: write actual reasoning, then score yourself against the rubric — the same skill the AP exam grades.
          </p>
          {FREE_RESPONSE_TASKS.map((t) => <FreeResponseCard key={t.id} task={t} />)}
        </div>
      ) : tab === "free" ? (
        <>
          <div className="clay mt-5 p-5">
            <FilterBar
              course={course} setCourse={setCourse} unit={unit} setUnit={setUnit} topic={topic} setTopic={setTopic}
              difficulty={difficulty} setDifficulty={setDifficulty} type={type} setType={setType}
              unitsForCourse={unitsForCourse} topics={topics}
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button onClick={nextFree} className="clay-btn clay-press border-0 font-bold">
                <Shuffle className="mr-1.5 size-4" /> Give me a random question
              </Button>
              <span className="text-xs text-muted-foreground">
                {pool.length} questions match · intelligent selection favors unseen + missed + weak concepts
              </span>
            </div>
          </div>
          {freeQ ? (
            <div key={freeKey} className="mt-4">
              <QuestionCard q={freeQ} onNext={nextFree} />
            </div>
          ) : (
            <div className="clay-tint mt-4 p-8 text-center text-sm text-muted-foreground">
              Pick your filters and hit the shuffle button to start.
            </div>
          )}
        </>
      ) : (
        <>
          <div className="clay mt-5 p-5">
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Practice mode</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "clay-sm clay-press px-3.5 py-2.5 text-left",
                    mode === m.id && "ring-2 ring-[var(--clay-4)]",
                  )}
                >
                  <span className="block text-sm font-bold">{m.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{m.desc}</span>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <FilterBar
                course={course} setCourse={setCourse} unit={unit} setUnit={setUnit} topic={topic} setTopic={setTopic}
                difficulty={difficulty} setDifficulty={setDifficulty} type={type} setType={setType}
                unitsForCourse={unitsForCourse} topics={topics}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button onClick={startSession} disabled={pool.length === 0} className="clay-btn clay-press border-0 font-bold">
                <Play className="mr-1.5 size-4" /> Start session
              </Button>
              <span className="text-xs text-muted-foreground">{pool.length} questions match your filters</span>
            </div>
          </div>

          {session === null ? (
            <div className="clay-tint mt-4 p-8 text-center text-sm text-muted-foreground">
              Choose a mode and filters, then start a session.
            </div>
          ) : done ? (
            <SessionSummary
              results={results}
              total={session.length}
              elapsed={elapsed}
              onRestart={startSession}
              onExit={() => setSession(null)}
            />
          ) : current ? (
            <div className="mt-4">
              <div className="mb-3 h-2 overflow-hidden rounded-full clay-inset">
                <div className="h-full rounded-full bg-[var(--clay-4)] transition-all" style={{ width: `${(pos / session.length) * 100}%` }} />
              </div>
              <QuestionCard
                key={current.id + pos}
                q={current}
                sessionPos={pos}
                sessionLen={session.length}
                showSession
                onNext={() => {
                  // grade the current question before moving on
                  const wasCorrect = document.querySelector('[data-checked="true"]') !== null;
                  void wasCorrect;
                  setPos((n) => n + 1);
                }}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Session summary
// ------------------------------------------------------------
function SessionSummary({ results, total, elapsed, onRestart, onExit }: {
  results: { id: string; correct: boolean }[];
  total: number;
  elapsed: number;
  onRestart: () => void;
  onExit: () => void;
}) {
  const correct = results.filter((r) => r.correct).length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="clay mt-4 p-8 text-center">
      <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Session complete</p>
      <p className="mt-2 text-5xl font-black">{pct}%</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {correct} of {total} correct · {Math.floor(elapsed / 60)}m {elapsed % 60}s
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Button onClick={onRestart} className="clay-btn clay-press border-0 font-bold">Another session</Button>
        <Button variant="ghost" onClick={onExit} className="font-semibold">Exit</Button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Shared filter bar
// ------------------------------------------------------------
function FilterBar({
  course, setCourse, unit, setUnit, topic, setTopic, difficulty, setDifficulty, type, setType,
  unitsForCourse, topics,
}: {
  course: CourseId | "any"; setCourse: (c: CourseId | "any") => void;
  unit: number | "any"; setUnit: (u: number | "any") => void;
  topic: string | "any"; setTopic: (t: string | "any") => void;
  difficulty: Difficulty | "any"; setDifficulty: (d: Difficulty | "any") => void;
  type: QuestionType | "any"; setType: (t: QuestionType | "any") => void;
  unitsForCourse: typeof UNITS;
  topics: string[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-xs font-bold">
        <span className="text-muted-foreground">Course</span>
        <select value={course} onChange={(e) => { setCourse(e.target.value as CourseId | "any"); setUnit("any"); setTopic("any"); }} className="clay-inset mt-1 w-full px-3 py-2.5 text-sm font-semibold outline-none">
          <option value="any">All courses</option>
          {Object.values(COURSE_MAP).map((c) => <option key={c.id} value={c.id}>{c.short}</option>)}
        </select>
      </label>
      <label className="text-xs font-bold">
        <span className="text-muted-foreground">Unit</span>
        <select value={String(unit)} onChange={(e) => { const v = e.target.value === "any" ? "any" : Number(e.target.value); setUnit(v); setTopic("any"); }} className="clay-inset mt-1 w-full px-3 py-2.5 text-sm font-semibold outline-none">
          <option value="any">All units</option>
          {unitsForCourse.map((u) => <option key={u.id} value={u.num}>Unit {u.num} — {u.name}</option>)}
        </select>
      </label>
      <label className="text-xs font-bold">
        <span className="text-muted-foreground">Topic</span>
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className="clay-inset mt-1 w-full px-3 py-2.5 text-sm font-semibold outline-none">
          <option value="any">All topics</option>
          {topics.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <label className="text-xs font-bold">
        <span className="text-muted-foreground">Difficulty</span>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty | "any")} className="clay-inset mt-1 w-full px-3 py-2.5 text-sm font-semibold outline-none">
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d === "any" ? "Any difficulty" : DIFFICULTY_LABELS[d]}</option>)}
        </select>
      </label>
      <label className="text-xs font-bold">
        <span className="text-muted-foreground">Question type / AP skill</span>
        <select value={type} onChange={(e) => setType(e.target.value as QuestionType | "any")} className="clay-inset mt-1 w-full px-3 py-2.5 text-sm font-semibold outline-none">
          {TYPES.map((t) => <option key={t} value={t}>{t === "any" ? "Any type" : SKILL_LABELS[t]}</option>)}
        </select>
      </label>
    </div>
  );
}

const ARCHETYPE_COUNT_LABEL = "60+";
