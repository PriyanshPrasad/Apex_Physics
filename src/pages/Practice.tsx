import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Lightbulb, RotateCcw, Shuffle, PenLine, Check } from "lucide-react";
import { CONCEPTS, CONCEPT_MAP, COURSE_MAP } from "@/data/curriculum";
import { generateProblem, difficultyColor, type Difficulty, type GenProblem } from "@/data/problems";
import { useProgress } from "@/lib/progress";
import { M } from "@/components/math/Math";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function recordAnswer(conceptId: string, correct: boolean, hints: number, category?: string) {
  import("@/lib/progress").then(({ progress }) =>
    progress.recordAnswer(conceptId, correct, correct ? (hints === 0 ? 1 : 0.5) : 0, correct ? undefined : (category as never)),
  );
}

function Prompt({ text }: { text: string }) {
  const parts = useMemo(() => text.split(/(\{eq\}.*?\{\/eq\})/g), [text]);
  return (
    <p className="text-[15px] leading-7">
      {parts.map((part, i) => (part.startsWith("{eq}") ? <M key={i}>{part.slice(4, -5)}</M> : <span key={i}>{part}</span>))}
    </p>
  );
}

const FREE_RESPONSE_TASKS = [
  {
    id: "fr-energy",
    skill: "Qualitative/Quantitative Translation",
    prompt:
      "A block slides down a frictionless ramp from height h, then along a rough horizontal surface with coefficient μ_k and stops after distance d.",
    parts: [
      "Part A (reasoning): Explain why energy methods, not kinematics, are the efficient approach on the rough surface.",
      "Part B (derive): Show that d = h/μ_k using energy conservation with friction work.",
      "Part C (justify): A student claims doubling h doubles d. Agree or disagree, with reference to your equation.",
    ],
    rubric: [
      "Names the system and states that friction dissipates mechanical energy into thermal energy",
      "Writes mgh = μ_k·mg·d (or W_friction = ΔK) before substituting",
      "Solves symbolically first: d = h/μ_k — mass cancels",
      "Agrees: d ∝ h, so doubling h doubles d; cites the derived equation",
    ],
  },
  {
    id: "fr-circuits",
    skill: "Experimental Design",
    prompt:
      "You have a battery, two resistors, an ammeter, a voltmeter, wires, and a switch. Design an experiment to determine an unknown resistance.",
    parts: [
      "Part A: State the measurements you would take and how each meter must be connected.",
      "Part B: Explain how you would combine Ohm's law with your measurements to obtain R.",
      "Part C: Describe one systematic error that would bias R, and a fix.",
    ],
    rubric: [
      "Ammeter in series with the resistor; voltmeter in parallel across it",
      "Record V and I; compute R = V/I (ideally over several trials with a graph of V vs I)",
      "Uses slope of V–I line as R to reduce random error",
      "Identifies e.g. ammeter's own resistance or meter loading; proposes a correction or better circuit",
    ],
  },
  {
    id: "fr-momentum",
    skill: "Mathematical Routines",
    prompt:
      "Cart A (mass 2m) moves at speed v toward stationary cart B (mass m). They collide elastically.",
    parts: [
      "Part A: Write the two conservation equations that apply.",
      "Part B: Solve for both final speeds symbolically.",
      "Part C: Check your result for the special case of equal masses — does it match the known bounce-off result?",
    ],
    rubric: [
      "Momentum: 2m·v = 2m·v_A + m·v_B",
      "Elastic: ½(2m)v² = ½(2m)v_A² + ½m v_B²",
      "v_A = v/3, v_B = 4v/3",
      "Equal masses → velocities exchange (A stops, B leaves at v) — the limiting check",
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

export default function Practice() {
  const p = useProgress();
  const [conceptId, setConceptId] = useState("p1-kinematics");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [problem, setProblem] = useState<GenProblem>(() => generateProblem("p1-kinematics", "medium"));
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [hints, setHints] = useState(0);
  const [tab, setTab] = useState<"mcq" | "frq">("mcq");

  const nextProblem = (cid = conceptId, d = difficulty) => {
    setProblem(generateProblem(cid, d));
    setSelected(null);
    setChecked(false);
    setHints(0);
  };

  const concept = CONCEPT_MAP[problem.conceptId];
  const correct = checked && selected === problem.correct;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Practice</h1>
          <p className="text-sm text-muted-foreground">Unlimited generated problems, graduated hints, AP-style reasoning.</p>
        </div>
        <div className="clay-sm flex overflow-hidden p-1">
          {(["mcq", "frq"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn("clay-press rounded-xl px-4 py-1.5 text-sm font-bold", tab === t ? "bg-[var(--clay-primary-tint)] text-[var(--clay-primary-deep)]" : "text-muted-foreground")}
            >
              {t === "mcq" ? "Multiple choice" : "Free response"}
            </button>
          ))}
        </div>
      </div>

      {tab === "mcq" ? (
        <>
          <div className="clay mt-5 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold">
                <span className="text-muted-foreground">Concept</span>
                <select
                  value={conceptId}
                  onChange={(e) => { setConceptId(e.target.value); nextProblem(e.target.value, difficulty); }}
                  className="clay-inset mt-1 w-full px-3 py-2.5 text-sm font-semibold outline-none"
                >
                  {CONCEPTS.map((c) => (
                    <option key={c.id} value={c.id}>{COURSE_MAP[c.courseId].short} — {c.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold">
                <span className="text-muted-foreground">Difficulty</span>
                <select
                  value={difficulty}
                  onChange={(e) => { const d = e.target.value as Difficulty; setDifficulty(d); nextProblem(conceptId, d); }}
                  className="clay-inset mt-1 w-full px-3 py-2.5 text-sm font-semibold outline-none"
                >
                  {["easy", "medium", "hard", "ap", "challenge"].map((d) => (
                    <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)} {d === "ap" ? "(AP-level)" : ""}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="clay mt-4 p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {concept ? COURSE_MAP[concept.courseId].short : ""} · {concept?.name}
              </span>
              <span className="clay-sm px-2 py-0.5 text-[10px] font-extrabold uppercase" style={{ color: difficultyColor(problem.difficulty) }}>
                {problem.difficulty}
              </span>
            </div>
            <div className="mt-3"><Prompt text={problem.prompt} /></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {problem.choices.map((c, i) => (
                <button
                  key={i}
                  disabled={checked}
                  onClick={() => setSelected(i)}
                  className={cn(
                    "clay-sm clay-press px-4 py-3 text-left text-sm font-semibold",
                    selected === i && "ring-2 ring-[var(--clay-4)]",
                    checked && i === problem.correct && "ring-2 ring-[#5bbfa3]",
                    checked && i === selected && i !== problem.correct && "ring-2 ring-destructive",
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
                  onClick={() => { setChecked(true); recordAnswer(problem.conceptId, selected === problem.correct, hints, problem.category); }}
                  className="clay-btn clay-press border-0 font-bold"
                >
                  Check answer
                </Button>
                {hints < problem.hints.length && (
                  <Button variant="ghost" onClick={() => setHints((h) => h + 1)} className="gap-1.5 font-semibold">
                    <Lightbulb className="size-4 text-[#ffc46b]" /> Graduated hint {hints + 1}/{problem.hints.length}
                  </Button>
                )}
                <Button variant="ghost" onClick={() => nextProblem()} className="gap-1.5 font-semibold">
                  <Shuffle className="size-4" /> New problem
                </Button>
              </div>
            )}
            {hints > 0 && !checked && (
              <div className="clay-tint mt-3 space-y-2 p-3.5 text-sm">
                {problem.hints.slice(0, hints).map((h, i) => (
                  <p key={i}><span className="font-bold text-[var(--clay-primary-deep)]">Hint {i + 1}:</span> {h}</p>
                ))}
              </div>
            )}
            {checked && (
              <div className="clay-tint mt-4 p-4 text-sm">
                <p className="font-bold">{correct ? "Correct — nice reasoning." : "Not quite — here's the path:"}</p>
                {!correct && (
                  <p className="mt-1 text-muted-foreground">
                    Answer: <strong>{"ABCD"[problem.correct]}</strong> ({problem.choices[problem.correct]}). The hints reconstruct the reasoning — walk back through them.
                  </p>
                )}
                <Button onClick={() => nextProblem()} className="clay-btn clay-press mt-3 border-0 font-bold">
                  Next problem <ArrowRight className="ml-1 size-4" />
                </Button>
              </div>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Answered {p.questionsAnswered} questions so far · every answer feeds your mastery model
          </p>
        </>
      ) : (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Free-response practice: write actual reasoning, then score yourself against the rubric — the same skill the AP exam grades.
          </p>
          {FREE_RESPONSE_TASKS.map((t) => <FreeResponseCard key={t.id} task={t} />)}
        </div>
      )}
    </div>
  );
}
