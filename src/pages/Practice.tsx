import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router";
import { ArrowRight, Lightbulb, RotateCcw, Shuffle, PenLine, Check, Play, Target, Timer, Zap, X } from "lucide-react";
import { CONCEPTS, COURSE_MAP, UNITS, type CourseId } from "@/data/curriculum";
import {
  filterQuestions, pickSmart, buildSet, bankStats, AP_SKILL_LABELS, DIFFICULTY_LABELS, DIFFICULTY_ORDER, REPRESENTATION_LABELS, SKILL_LABELS, ARCHETYPE_COUNT,
  type APSkill, type QEntry, type Difficulty, type QuestionType, type Representation, type SelectionCtx,
} from "@/data/qbank";
import { useProgress, progress, masteryOf } from "@/lib/progress";
import { QDiagram, type DiagramSpec } from "@/components/questions/Diagrams";
import { StimulusVisuals } from "@/components/questions/StimulusVisuals";
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
  { id: "timed", label: "Timed AP Practice", n: 20, desc: "90 seconds per question" },
  { id: "adaptive", label: "Adaptive Practice", n: 20, desc: "difficulty adjusts as you go" },
] as const;

const DIFFICULTIES: (Difficulty | "any" | "adaptive")[] = ["any", "easy", "medium", "hard", "ap", "challenge", "adaptive"];
const TYPES: (QuestionType | "any")[] = ["any", "conceptual", "quantitative", "graph", "diagram", "experimental", "representation", "equation-selection", "proportional-reasoning"];
const AP_SKILLS: (APSkill | "any")[] = ["any", "conceptual-reasoning", "mathematical-routines", "creating-representations", "graphical-analysis", "experimental-design", "data-analysis", "representation-translation", "model-selection", "conservation-reasoning", "proportional-reasoning", "qualitative-quantitative-translation"];
const REPRESENTATIONS: (Representation | "any")[] = ["any", "graph", "diagram", "table", "data", "equation", "circuit", "pv-diagram", "written-description"];

function diffColor(d: Difficulty): string {
  return { easy: "#3d9c82", medium: "#7c6cf4", hard: "#e08a3c", ap: "#e05a6d", challenge: "#c14bd8" }[d];
}

function record(q: QEntry, correct: boolean) {
  progress.recordAnswer(q.conceptId, correct, correct ? 1 : 0, correct ? undefined : (q.category as never), {
    id: q.id,
    difficulty: q.difficulty,
    source: q.source === "hand" ? "bank" : "generated",
    skill: `${q.topic}::${q.type}`,
  });
}

/** Renders {eq}...{/eq} math inline */
function Rich({ text }: { text: string }) {
  const parts = useMemo(() => text.split(/(\{eq\}.*?\{\/eq\})/g), [text]);
  return (
    <>{parts.map((part, i) => (part.startsWith("{eq}") ? <M key={i}>{part.slice(4, -5)}</M> : <span key={i}>{part}</span>))}</>
  );
}

/** Pick a question at (or nearest to) a target difficulty. */
function nearestDiff(pool: QEntry[], target: Difficulty): QEntry | null {
  const ti = DIFFICULTY_ORDER.indexOf(target);
  for (let off = 0; off < DIFFICULTY_ORDER.length; off++) {
    for (const d of [ti - off, ti + off]) {
      if (d < 0 || d >= DIFFICULTY_ORDER.length) continue;
      const c = pool.filter((q) => q.difficulty === DIFFICULTY_ORDER[d]);
      if (c.length > 0) return c[Math.floor(Math.random() * c.length)];
    }
  }
  return null;
}

// ------------------------------------------------------------
// One question card (used by sessions and free-run)
// ------------------------------------------------------------
function QuestionCard({
  q, sessionPos, sessionLen, onNext, showSession, timed, onGraded,
}: {
  q: QEntry;
  sessionPos?: number;
  sessionLen?: number;
  onNext?: () => void;
  showSession?: boolean;
  timed?: boolean;
  /** Called once when the answer is checked (session grading). */
  onGraded?: (q: QEntry, correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [showDiagramZoom, setShowDiagramZoom] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);

  // per-question countdown (timed mode only)
  useEffect(() => {
    if (!timed || checked) return;
    const iv = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(iv);
  }, [timed, checked]);
  useEffect(() => {
    if (!timed || checked || timeLeft > 0) return;
    setChecked(true);
    record(q, false);
    onGraded?.(q, false);
  }, [timeLeft, timed, checked]); // eslint-disable-line react-hooks/exhaustive-deps

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
        {showSession && sessionPos !== undefined && (
          <span className="text-xs font-bold text-muted-foreground">
            {sessionPos + 1}{sessionLen ? ` / ${sessionLen}` : ""}
          </span>
        )}
        {timed && !checked && (
          <span className={cn("clay-sm px-2 py-0.5 text-xs font-extrabold", timeLeft <= 15 ? "text-destructive" : "text-muted-foreground")}>
            ⏱ {Math.max(0, timeLeft)}s
          </span>
        )}
      </div>

      <div className="mt-4">
        {q.stimulusRender && (
          <div className="clay-inset mb-4 p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">STIMULUS</p>
            <h3 className="mt-1 text-lg font-extrabold">{q.stimulusRender.title}</h3>
            <p className="mt-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">{q.stimulusRender.scenarioLabel}</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-6">{q.stimulusRender.blurb}</p>
            {q.stimulusRender.diagram && <figure className="mt-3"><p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">{q.stimulusRender.block.label}</p><button type="button" onClick={() => setShowDiagramZoom((z) => !z)} aria-label="Expand stimulus visual" className="clay-sm block w-full cursor-zoom-in overflow-hidden p-2 text-left"><div className={cn("mx-auto transition-all", showDiagramZoom ? "max-w-3xl" : "max-w-xl")}><QDiagram spec={q.stimulusRender.diagram} /></div></button><figcaption className="mt-1 text-center text-xs text-muted-foreground">{q.stimulusRender.caption}</figcaption>{q.stimulusRender.purpose && <p className="mt-1 text-center text-[11px] text-muted-foreground">Purpose: {q.stimulusRender.purpose}</p>}</figure>}
            {q.stimulusRender.table && (
              <figure className="mt-3 overflow-x-auto"><p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">{q.stimulusRender.block.label}</p><figcaption className="mb-1 text-xs font-semibold text-muted-foreground">{q.stimulusRender.caption}</figcaption>
                <table className="w-full min-w-[320px] text-left text-xs">
                  <thead><tr>{q.stimulusRender.table.headers.map((h) => <th key={h} className="border-b border-border/60 px-2 py-2 font-extrabold">{h}</th>)}</tr></thead>
                  <tbody>{q.stimulusRender.table.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="border-b border-border/40 px-2 py-2">{cell}</td>)}</tr>)}</tbody>
                </table>
              </figure>
            )}
            {q.stimulusRender.visuals && <StimulusVisuals visuals={q.stimulusRender.visuals} />}
            {q.stimulusRender.note && <p className="mt-2 text-xs text-muted-foreground">{q.stimulusRender.note}</p>}
          </div>
        )}
        <p className="whitespace-pre-line text-[15px] leading-7"><Rich text={q.prompt} /></p>
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

      {!checked && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            disabled={selected === null}
            onClick={() => {
              setChecked(true);
              const ok = selected === q.correct;
              record(q, ok);
              onGraded?.(q, ok);
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
            {correct
              ? "✓ Correct."
              : selected === null
                ? `⏱ Time expired — the answer is ${"ABCD"[q.correct]} (${q.choices[q.correct]}).`
                : `✗ Not quite — the answer is ${"ABCD"[q.correct]} (${q.choices[q.correct]}).`}
          </p>

          {!correct && selected !== null && q.tempt?.[selected] && (
            <p className="text-destructive">
              <strong>Why that distractor is tempting:</strong> {q.tempt[selected]}
            </p>
          )}

          <div className="clay-sm p-3">
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Option analysis</p>
            <div className="mt-2 space-y-1.5 text-xs">
              {q.choices.map((choice, i) => (
                <p key={i} className={cn("leading-5", i === q.correct ? "text-[#2c8f78]" : "text-muted-foreground")}>
                  <strong>{"ABCD"[i]}. {i === q.correct ? "Correct" : "Tempting"}:</strong> {i === q.correct ? "This choice matches the governing model and physical direction." : (q.tempt?.[i] ?? "This distractor reflects a common setup or interpretation error.")}
                </p>
              ))}
            </div>
          </div>

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
const FRQ_RESOURCES: Record<CourseId, { label: string; url: string }> = {
  p1: { label: "AP Physics 1 official past FRQs & scoring", url: "https://apcentral.collegeboard.org/courses/ap-physics-1/exam/past-exam-questions" },
  p2: { label: "AP Physics 2 official past FRQs & scoring", url: "https://apcentral.collegeboard.org/courses/ap-physics-2/exam/past-exam-questions" },
  cm: { label: "AP Physics C: Mechanics official past FRQs & scoring", url: "https://apcentral.collegeboard.org/courses/ap-physics-c-mechanics/exam/past-exam-questions" },
  cem: { label: "AP Physics C: E&M official past FRQs & scoring", url: "https://apcentral.collegeboard.org/courses/ap-physics-c-electricity-and-magnetism/exam/past-exam-questions" },
};

const FREE_RESPONSE_TASKS = [
  {
    id: "fr-energy", course: "p1" as CourseId, skill: "Qualitative/Quantitative Translation",
    prompt: "A block slides down a frictionless ramp from height h, then along a rough horizontal surface (coefficient μₖ) and stops after distance d.",
    diagram: { kind: "fbd", scene: "incline", labels: ["mg", "F_N", "f"] } as DiagramSpec,
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
    id: "fr-circuits", course: "p2" as CourseId, skill: "Experimental Design",
    prompt: "You have a battery, two resistors, an ammeter, a voltmeter, wires, and a switch. Design an experiment to determine an unknown resistance.",
    diagram: { kind: "circuit", layout: "rcMeter", labels: ["ε", "R", "A"] } as DiagramSpec,
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
    id: "fr-momentum", course: "cm" as CourseId, skill: "Mathematical Routines",
    prompt: "Cart A (mass 2m) moves at speed v toward stationary cart B (mass m). They collide elastically.",
    diagram: { kind: "collision", m1: 2, v1: 3, m2: 1, v2: 0, note: "before collision" } as DiagramSpec,
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
    id: "fr-rc", course: "cem" as CourseId, skill: "Derivation (Physics C)",
    prompt: "A capacitor C charged to V₀ discharges through resistor R starting at t = 0.",
    diagram: { kind: "circuit", layout: "batteryCapacitor", labels: ["V₀", "C"] } as DiagramSpec,
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
      {task.diagram && <div className="clay-inset mt-4 p-2"><QDiagram spec={task.diagram} /></div>}
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
  const [frqCourse, setFrqCourse] = useState<CourseId>("p1");
  const [frqYear, setFrqYear] = useState("2025");
  const [frqMode, setFrqMode] = useState<"original" | "official">("original");
  const stats = bankStats();
  const [tab, setTab] = useState<"session" | "free" | "frq">("session");

  // filters
  const [course, setCourse] = useState<CourseId | "any">("any");
  const [unit, setUnit] = useState<number | "any">("any");
  const [topic, setTopic] = useState<string | "any">("any");
  const [subtopic, setSubtopic] = useState<string | "any">("any");
  const [difficulty, setDifficulty] = useState<Difficulty | "any">("any");
  const [type, setType] = useState<QuestionType | "any">("any");
  const [skill, setSkill] = useState<APSkill | "any">("any");
  const [representation, setRepresentation] = useState<Representation | "any">("any");
  const [mode, setMode] = useState<string>("standard");

  // session state
  const [session, setSession] = useState<(QEntry | null)[] | null>(null);
  const [sessionLen, setSessionLen] = useState(0);
  const [stack, setStack] = useState<{ q: QEntry; correct: boolean }[]>([]);
  const [liveMode, setLiveMode] = useState<"timed" | "adaptive" | null>(null);
  const [liveCurrent, setLiveCurrent] = useState<QEntry | null>(null);
  const [pos, setPos] = useState(0);
  // timed session ticking
  useEffect(() => {
    const total = liveMode ? sessionLen : (session?.length ?? 0);
    if (session === null || pos >= total) return; // pause after done
    const iv = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, [session, pos, liveMode, sessionLen]);

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

  const subtopics = useMemo(
    () => Array.from(new Set(filterQuestions({ course, topic }).map((q) => q.subtopic))),
    [course, topic],
  );

  const pool = useMemo(
    () => filterQuestions({ course, unit, topic, subtopic, difficulty, type, skill, representation }),
    [course, unit, topic, subtopic, difficulty, type, skill, representation],
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
    }    const n = Math.min(modeDef.n, p2.length);
    if (modeDef.id === "timed" || modeDef.id === "adaptive") {
      // Live selection modes: stack holds answered questions; the current
      // question is picked on demand so difficulty can react mid-session.
      setStack([]);
      setLiveCurrent(null);
      setLiveMode(modeDef.id as "timed" | "adaptive");
      setSession([null]); // sentinel; real length tracked in sessionLen
      setSessionLen(n);
      setPos(0);
      setResults([]);
      setStartedAt(Date.now());
      setElapsed(0);
      return;
    }
    setLiveMode(null);
    setLiveCurrent(null);
    setStack([]);
    setSessionLen(0);
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

  const current = liveMode
    ? null // resolved via liveCurrent below
    : (session?.[pos] ?? null);
  const done = session !== null && pos >= (liveMode ? sessionLen : session.length);

  // Live modes (timed/adaptive): pick the next question on demand.
  useEffect(() => {
    if (!liveMode || !session) return;
    if (pos >= sessionLen) { if (liveCurrent) setLiveCurrent(null); return; }
    if (liveCurrent) return; // already showing a question
    let target: Difficulty = "medium";
    if (liveMode === "adaptive" && stack.length > 0) {
      const last = stack[stack.length - 1];
      const di = DIFFICULTY_ORDER.indexOf(last.q.difficulty);
      const recent = stack.slice(-3);
      if (recent.length >= 2 && recent.slice(-2).every((s) => !s.correct)) {
        target = DIFFICULTY_ORDER[Math.max(0, di - 1)]; // stepping down after 2 misses
      } else if (recent.length >= 2 && recent.every((s) => s.correct)) {
        target = DIFFICULTY_ORDER[Math.min(4, di + 1)]; // stepping up after a streak
      } else {
        target = last.q.difficulty;
      }
    }
    const chosen = nearestDiff(pool, target) ?? pickSmart(pool, ctx);
    if (chosen) setLiveCurrent(chosen);
    else setSessionLen(pos); // pool exhausted → end here
  }, [liveMode, session, pos, sessionLen, liveCurrent, stack, pool]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Practice</h1>
          <p className="text-sm text-muted-foreground">
            {stats.total} original AP-style questions · {stats.visualPct}% visual/stimulus-based · {stats.hand} curated + {stats.gen} generated variants across {ARCHETYPE_COUNT} reasoning archetypes
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
          <div className="clay p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Free response</p><h2 className="mt-1 text-2xl font-extrabold">Practice the AP response, not just the answer</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Use original local prompts for guided practice, or open the official College Board archive for a selected course and year. Official copyrighted text stays on College Board.</p></div>
              <div className="clay-sm flex overflow-hidden p-1"><button onClick={() => setFrqMode("original")} className={cn("px-3 py-1.5 text-xs font-bold", frqMode === "original" && "bg-[var(--clay-primary-tint)] text-[var(--clay-primary-deep)]")}>Original practice</button><button onClick={() => setFrqMode("official")} className={cn("px-3 py-1.5 text-xs font-bold", frqMode === "official" && "bg-[var(--clay-primary-tint)] text-[var(--clay-primary-deep)]")}>Official resources</button></div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-bold"><span className="text-muted-foreground">Course</span><select value={frqCourse} onChange={(e) => setFrqCourse(e.target.value as CourseId)} className="clay-inset mt-1 w-full px-3 py-2.5 text-sm font-semibold outline-none">{Object.values(COURSE_MAP).map((c) => <option key={c.id} value={c.id}>{c.short}</option>)}</select></label>
              <label className="text-xs font-bold"><span className="text-muted-foreground">Year</span><select value={frqYear} onChange={(e) => setFrqYear(e.target.value)} className="clay-inset mt-1 w-full px-3 py-2.5 text-sm font-semibold outline-none">{["2025", "2024", "2023", "2022", "2021"].map((year) => <option key={year}>{year}</option>)}</select></label>
              <div className="flex items-end"><a href={FRQ_RESOURCES[frqCourse].url} target="_blank" rel="noreferrer" className="clay-btn clay-press inline-flex w-full items-center justify-center px-4 py-2.5 text-xs font-bold">Open official {frqYear} archive <ArrowRight className="ml-1 size-3.5" /></a></div>
            </div>
          </div>
          {frqMode === "official" ? <div className="clay-tint p-5"><p className="text-sm font-bold">{FRQ_RESOURCES[frqCourse].label}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">The official archive provides the selected year’s released questions, scoring guidelines, sample responses, and scoring information.</p><a href={FRQ_RESOURCES[frqCourse].url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[var(--clay-primary-deep)]">Open College Board resources <ArrowRight className="size-4" /></a></div> : FREE_RESPONSE_TASKS.filter((task) => task.course === frqCourse).map((t) => <FreeResponseCard key={t.id} task={t} />)}
        </div>
      ) : tab === "free" ? (
        <>
          <div className="clay mt-5 p-5">
            <FilterBar
              course={course} setCourse={setCourse} unit={unit} setUnit={setUnit} topic={topic} setTopic={setTopic} subtopic={subtopic} setSubtopic={setSubtopic}
              difficulty={difficulty} setDifficulty={setDifficulty} type={type} setType={setType} skill={skill} setSkill={setSkill} representation={representation} setRepresentation={setRepresentation}
              unitsForCourse={unitsForCourse} topics={topics} subtopics={subtopics}
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
                course={course} setCourse={setCourse} unit={unit} setUnit={setUnit} topic={topic} setTopic={setTopic} subtopic={subtopic} setSubtopic={setSubtopic}
                difficulty={difficulty} setDifficulty={setDifficulty} type={type} setType={setType} skill={skill} setSkill={setSkill} representation={representation} setRepresentation={setRepresentation}
                unitsForCourse={unitsForCourse} topics={topics} subtopics={subtopics}
              />
            </div>
            <SkillSnapshot course={course} topic={topic} type={type} mastery={p.skillMastery} />
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
              total={liveMode ? sessionLen : session.length}
              elapsed={elapsed}
              onRestart={startSession}
              onExit={() => setSession(null)}
            />
          ) : (current || (liveMode && liveCurrent)) ? (
            <div className="mt-4">
              <div className="mb-3 h-2 overflow-hidden rounded-full clay-inset">
                <div
                  className="h-full rounded-full bg-[var(--clay-4)] transition-all"
                  style={{ width: `${(pos / (liveMode ? sessionLen : session.length)) * 100}%` }}
                />
              </div>
              <QuestionCard
                key={(current ?? liveCurrent)!.id + pos}
                q={(current ?? liveCurrent)!}
                sessionPos={pos}
                sessionLen={liveMode ? sessionLen : session.length}
                showSession
                timed={liveMode === "timed"}
                onGraded={(q, ok) => {
                  setResults((rs) => [...rs, { id: q.id, correct: ok }]);
                  if (liveMode) {
                    setStack((st) => [...st, { q, correct: ok }]);
                    setLiveCurrent(null); // trigger next pick
                  }
                }}
                onNext={() => setPos((n) => n + 1)}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function SkillSnapshot({ course, topic, type, mastery }: { course: CourseId | "any"; topic: string | "any"; type: QuestionType | "any"; mastery: Record<string, number> }) {
  const relevant = Object.entries(mastery)
    .filter(([key]) => {
      const [skillTopic, skillType] = key.split("::");
      return (topic === "any" || skillTopic === topic) && (type === "any" || skillType === type) && (course === "any" || filterQuestions({ course }).some((q) => q.topic === skillTopic && q.type === skillType));
    })
    .sort((a, b) => a[1] - b[1])
    .slice(0, 4);
  if (relevant.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">Skill mastery</span>
      {relevant.map(([key, value]) => {
        const label = key.split("::")[1];
        return <span key={key} className="clay-sm px-2.5 py-1 text-[11px] font-bold">{SKILL_LABELS[label as QuestionType] ?? label} · {value}%</span>;
      })}
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
  course, setCourse, unit, setUnit, topic, setTopic, subtopic, setSubtopic, difficulty, setDifficulty, type, setType, skill, setSkill, representation, setRepresentation,
  unitsForCourse, topics, subtopics,
}: {
  course: CourseId | "any"; setCourse: (c: CourseId | "any") => void;
  unit: number | "any"; setUnit: (u: number | "any") => void;
  topic: string | "any"; setTopic: (t: string | "any") => void;
  subtopic: string | "any"; setSubtopic: (t: string | "any") => void;
  difficulty: Difficulty | "any"; setDifficulty: (d: Difficulty | "any") => void;
  type: QuestionType | "any"; setType: (t: QuestionType | "any") => void;
  skill: APSkill | "any"; setSkill: (s: APSkill | "any") => void;
  representation: Representation | "any"; setRepresentation: (r: Representation | "any") => void;
  unitsForCourse: typeof UNITS;
  topics: string[];
  subtopics: string[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-xs font-bold">
        <span className="text-muted-foreground">Course</span>
        <select value={course} onChange={(e) => { setCourse(e.target.value as CourseId | "any"); setUnit("any"); setTopic("any"); setSubtopic("any"); }} className="clay-inset mt-1 w-full px-3 py-2.5 text-sm font-semibold outline-none">
          <option value="any">All courses</option>
          {Object.values(COURSE_MAP).map((c) => <option key={c.id} value={c.id}>{c.short}</option>)}
        </select>
      </label>
      <label className="text-xs font-bold">
        <span className="text-muted-foreground">Unit</span>
        <select value={String(unit)} onChange={(e) => { const v = e.target.value === "any" ? "any" : Number(e.target.value); setUnit(v); setTopic("any"); setSubtopic("any"); }} className="clay-inset mt-1 w-full px-3 py-2.5 text-sm font-semibold outline-none">
          <option value="any">All units</option>
          {unitsForCourse.map((u) => <option key={u.id} value={u.num}>Unit {u.num} — {u.name}</option>)}
        </select>
      </label>
      <label className="text-xs font-bold">
        <span className="text-muted-foreground">Topic</span>
        <select value={topic} onChange={(e) => { setTopic(e.target.value); setSubtopic("any"); }} className="clay-inset mt-1 w-full px-3 py-2.5 text-sm font-semibold outline-none">
          <option value="any">All topics</option>
          {topics.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <label className="text-xs font-bold">
        <span className="text-muted-foreground">Subtopic</span>
        <select value={subtopic} onChange={(e) => setSubtopic(e.target.value)} className="clay-inset mt-1 w-full px-3 py-2.5 text-sm font-semibold outline-none">
          <option value="any">All subtopics</option>
          {subtopics.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <label className="text-xs font-bold">
        <span className="text-muted-foreground">Difficulty</span>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value === "adaptive" ? "any" : e.target.value as Difficulty | "any")} className="clay-inset mt-1 w-full px-3 py-2.5 text-sm font-semibold outline-none">
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d === "any" ? "Any difficulty" : d === "adaptive" ? "Adaptive difficulty" : DIFFICULTY_LABELS[d]}</option>)}
        </select>
      </label>
      <label className="text-xs font-bold">
        <span className="text-muted-foreground">Question type</span>
        <select value={type} onChange={(e) => setType(e.target.value as QuestionType | "any")} className="clay-inset mt-1 w-full px-3 py-2.5 text-sm font-semibold outline-none">
          {TYPES.map((t) => <option key={t} value={t}>{t === "any" ? "Any type" : SKILL_LABELS[t]}</option>)}
        </select>
      </label>
      <label className="text-xs font-bold">
        <span className="text-muted-foreground">AP science skill</span>
        <select value={skill} onChange={(e) => setSkill(e.target.value as APSkill | "any")} className="clay-inset mt-1 w-full px-3 py-2.5 text-sm font-semibold outline-none">
          {AP_SKILLS.map((s) => <option key={s} value={s}>{s === "any" ? "All AP skills" : AP_SKILL_LABELS[s]}</option>)}
        </select>
      </label>
      <label className="text-xs font-bold">
        <span className="text-muted-foreground">Representation</span>
        <select value={representation} onChange={(e) => setRepresentation(e.target.value as Representation | "any")} className="clay-inset mt-1 w-full px-3 py-2.5 text-sm font-semibold outline-none">
          {REPRESENTATIONS.map((r) => <option key={r} value={r}>{r === "any" ? "All representations" : REPRESENTATION_LABELS[r]}</option>)}
        </select>
      </label>
    </div>
  );
}


