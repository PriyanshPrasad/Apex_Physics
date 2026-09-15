import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, Lightbulb, HelpCircle,
  Wand2, Eye, PenTool, Sigma, FlaskConical, Compass, Hammer, Target,
  Brain, Shuffle, Award, AlertTriangle, Link2,
} from "lucide-react";
import { CONCEPT_MAP, COURSE_MAP, COURSES, UNITS, type Concept } from "@/data/curriculum";
import { DERIVATIONS } from "@/data/derivations";
import { generateProblem, type GenProblem } from "@/data/problems";
import { useProgress, weakestPrereqs, masteryOf } from "@/lib/progress";
import { M, Eq } from "@/components/math/Math";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SIMS } from "@/sims/registry";
import { CONCEPT_QUESTIONS, checkAnswer } from "@/data/conceptQuestions";

// Steps are computed per concept so that no step ever renders empty: the
// Derivation panel lives inside Math Meaning when a derivation exists and the
// step is dropped entirely when it doesn't.
function stepsFor(concept: Concept) {
  return [
    { key: "intuition", label: "Intuition", icon: Lightbulb },
    { key: "visualize", label: "Visualize", icon: Eye },
    { key: "representation", label: "Represent", icon: PenTool },
    { key: "mathMeaning", label: "Math meaning", icon: Sigma },
    ...(concept.derivation ? [{ key: "derivation", label: "Derivation", icon: FlaskConical }] : []),
    { key: "recognition", label: "Recognize", icon: Compass },
    { key: "setup", label: "Setup", icon: Hammer },
    { key: "guided", label: "Guided problem", icon: Target },
    { key: "independent", label: "Solve it", icon: Brain },
    { key: "conceptual", label: "Concept check", icon: HelpCircle },
    { key: "transfer", label: "Transfer", icon: Shuffle },
    { key: "mastery", label: "Mastery", icon: Award },
  ] as const;
}

function conceptName(id: string): string {
  if (id in CONCEPT_MAP) return CONCEPT_MAP[id].name;
  return id.replace(/^f-/, "").replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

// Attach library derivations to concepts once at module load (idempotent).
for (const c of Object.values(CONCEPT_MAP)) {
  if (!c.derivation && DERIVATIONS[c.id]) c.derivation = DERIVATIONS[c.id];
}

function conceptCourse(id: string): string | null {
  return CONCEPT_MAP[id]?.courseId ?? null;
}

// ---------- Prerequisite panel ----------
function PrereqPanel({ concept }: { concept: Concept }) {
  const p = useProgress();
  const weakest = weakestPrereqs(p, concept.prereqs, 2);
  const low = weakest.filter((w) => w.pct < 60);
  return (
    <div className="clay p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <Link2 className="size-4 text-[var(--clay-4)]" /> Prerequisites
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">Recommended before this lesson.</p>
      <div className="mt-3 space-y-2">
        {concept.prereqs.map((pid) => {
          const pct = masteryOf(p, pid);
          const href = pid in CONCEPT_MAP ? `/learn/${conceptCourse(pid)}/${pid}` : "/diagnostic";
          return (
            <Link key={pid} to={href} className="block">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className={pct < 40 ? "text-destructive" : pct < 70 ? "text-[#c08a2d]" : ""}>{conceptName(pid)}</span>
                <span className="text-muted-foreground">{pct}%</span>
              </div>
              <div className="clay-inset mt-1 h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${Math.max(4, pct)}%`,
                    background: pct < 40 ? "var(--destructive)" : pct < 70 ? "#ffc46b" : "#6fd6c8",
                  }}
                />
              </div>
            </Link>
          );
        })}
      </div>
      {low.length > 0 && (
        <div className="clay-tint mt-4 p-3 text-xs">
          <p className="font-bold">Why might you struggle here?</p>
          <p className="mt-1 text-muted-foreground">
            Your mastery of {low.map((l) => conceptName(l.id)).join(" and ")} is below 60%. Review{" "}
            {low.length === 1 ? "this concept" : "these concepts"} first — {low.map((l) => `${conceptName(l.id)} (${l.pct}%)`).join(", ")}.
          </p>
          <Link to={`/learn/${conceptCourse(low[0].id)}/${low[0].id}`} className="mt-2 inline-flex items-center gap-1 font-bold text-[var(--clay-primary-deep)]">
            Review {conceptName(low[0].id)} <ChevronRight className="size-3" />
          </Link>
        </div>
      )}
      {concept.related.length > 0 && (
        <>
          <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">Related concepts</h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {concept.related.map((rid) => (
              <Link
                key={rid}
                to={rid in CONCEPT_MAP ? `/learn/${conceptCourse(rid)}/${rid}` : "/map"}
                className="clay-sm clay-press px-2.5 py-1 text-[11px] font-semibold"
              >
                {conceptName(rid)}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Problem player ----------
function ProblemPlayer({
  problem, conceptId, onNext, allowHints = true, label,
}: {
  problem: GenProblem;
  conceptId: string;
  onNext: () => void;
  allowHints?: boolean;
  label: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const correct = checked && selected === problem.correct;

  const check = () => {
    if (selected === null) return;
    setChecked(true);
    useProgressRecord(conceptId, selected === problem.correct, hintsShown, problem.category);
  };

  return (
    <div className="clay p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className="clay-sm px-2 py-0.5 text-[10px] font-bold uppercase">{problem.difficulty}</span>
      </div>
      <Prompt text={problem.prompt} />
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {problem.choices.map((c, i) => (
          <button
            key={i}
            disabled={checked}
            onClick={() => setSelected(i)}
            className={cn(
              "clay-sm clay-press px-4 py-3 text-left text-sm font-semibold transition-colors",
              selected === i && "ring-2 ring-[var(--clay-4)]",
              checked && i === problem.correct && "ring-2 ring-[#5bbfa3]",
              checked && i === selected && i !== problem.correct && "ring-2 ring-destructive",
            )}
          >
            <span className="mr-2 text-muted-foreground">{"ABCD"[i]}.</span>
            {c}
          </button>
        ))}
      </div>
      {!checked && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={check} disabled={selected === null} className="clay-btn clay-press border-0 font-bold">
            Check answer
          </Button>
          {allowHints && hintsShown < problem.hints.length && (
            <Button variant="ghost" onClick={() => setHintsShown((h) => h + 1)} className="gap-1.5 font-semibold">
              <Lightbulb className="size-4" /> Hint {hintsShown + 1}
            </Button>
          )}
        </div>
      )}
      {hintsShown > 0 && !checked && (
        <div className="clay-tint mt-3 space-y-2 p-3 text-sm">
          {problem.hints.slice(0, hintsShown).map((h, i) => (
            <p key={i}><span className="font-bold text-[var(--clay-primary-deep)]">Hint {i + 1}:</span> {h}</p>
          ))}
        </div>
      )}
      {checked && (
        <div className={cn("clay-tint mt-4 p-4 text-sm", correct ? "" : "bg-destructive/10")}>
          <p className="flex items-center gap-2 font-bold">
            {correct ? <Check className="size-4 text-[#3d9c82]" /> : <AlertTriangle className="size-4 text-destructive" />}
            {correct ? "Correct!" : selected === null ? "" : "Not quite."}
          </p>
          {!correct && (
            <p className="mt-1 text-muted-foreground">
              The answer is <strong>{"ABCD"[problem.correct]}</strong>: {problem.choices[problem.correct]}. {hintsShown === 0 && "Try the hints next time before answering — mastery grows faster when you reason it out."}
            </p>
          )}
          <button onClick={onNext} className="mt-3 inline-flex items-center gap-1 font-bold text-[var(--clay-primary-deep)]">
            Next <ArrowRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function useProgressRecord(conceptId: string, correct: boolean, hints: number, category?: string) {
  const quality = correct ? (hints === 0 ? 1 : 0.5) : 0;
  import("@/lib/progress").then(({ progress }) =>
    progress.recordAnswer(conceptId, correct, quality, correct ? undefined : (category as never)),
  );
}

// Render {eq}...{/eq} fragments inside a prompt
function Prompt({ text }: { text: string }) {
  const parts = useMemo(() => text.split(/(\{eq\}.*?\{\/eq\})/g), [text]);
  return (
    <p className="mt-3 text-[15px] leading-7">
      {parts.map((part, i) =>
        part.startsWith("{eq}") ? <M key={i}>{part.slice(4, -5)}</M> : <span key={i}>{part}</span>,
      )}
    </p>
  );
}

// ---------- Main lesson ----------
export default function Lesson() {
  const { courseId, conceptId } = useParams();
  const navigate = useNavigate();
  const concept = CONCEPT_MAP[conceptId ?? ""];
  const [step, setStep] = useState(0);

  const guided = useMemo(() => (concept ? generateProblem(concept.id, "easy") : null), [concept?.id]);
  const independent = useMemo(() => (concept ? generateProblem(concept.id, "hard") : null), [concept?.id]);
  const transfer = useMemo(() => (concept ? generateProblem(concept.id, "ap") : null), [concept?.id]);
  const cquestion = useMemo(() => (concept ? CONCEPT_QUESTIONS[concept.id] ?? null : null), [concept?.id]);

  if (!concept || concept.courseId !== courseId) {
    return (
      <div className="clay mx-auto mt-10 max-w-md p-6 text-center">
        <p className="font-bold">Lesson not found.</p>
        <Button onClick={() => navigate("/learn")} className="clay-btn clay-press mt-4 border-0 font-bold">Back to Learn</Button>
      </div>
    );
  }

  const course = COURSE_MAP[concept.courseId];
  const unit = UNITS.find((u) => u.course === concept.courseId && u.num === concept.unit);
  const SimComp = concept.sim ? SIMS[concept.sim] : null;
  const STEPS = stepsFor(concept);
  const totalSteps = STEPS.length;
  const stepKey = STEPS[Math.min(step, totalSteps - 1)].key;

  return (
    <div className="mx-auto max-w-7xl">
      {/* breadcrumb */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link to="/learn" className="flex items-center gap-1 hover:text-foreground"><ArrowLeft className="size-3" /> Learn</Link>
        <ChevronRight className="size-3" />
        <Link to={`/learn/${course.id}`} className="font-semibold">{course.short}</Link>
        <ChevronRight className="size-3" />
        <span>Unit {unit?.num}: {unit?.name}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr_260px]">
        {/* LEFT — course/unit/topic/prereqs/progress */}
        <aside className="space-y-4">
          <div className="clay p-4">
            <span className="clay-sm px-2 py-0.5 text-[10px] font-bold" style={{ color: course.color }}>{course.short}</span>
            <h1 className="mt-2 text-xl font-extrabold leading-tight">{concept.name}</h1>
            <p className="mt-1 text-xs text-muted-foreground">{concept.tagline}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              <span className="clay-sm px-2 py-0.5 text-[10px] font-bold uppercase">{concept.math === "calculus" ? "Calculus-based" : "Algebra-based"}</span>
              <span className="clay-sm px-2 py-0.5 text-[10px] font-bold uppercase">
                {concept.status === "ap-required" ? "AP required" : concept.status === "prerequisite" ? "Prerequisite" : "Deep dive"}
              </span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-[11px] font-bold">
                <span>Lesson progress</span><span>{Math.round((step / (totalSteps - 1)) * 100)}%</span>
              </div>
              <div className="clay-inset mt-1 h-2.5">
                <div className="h-2.5 rounded-full bg-[var(--clay-4)] transition-all" style={{ width: `${(step / (totalSteps - 1)) * 100}%` }} />
              </div>
            </div>
          </div>
          <PrereqPanel concept={concept} />
        </aside>

        {/* MAIN — the 12 steps */}
        <div className="min-w-0 space-y-5">
          {/* step pills — computed so numbering is always gapless */}
          <div className="flex flex-wrap gap-1.5">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => setStep(i)}
                  className={cn(
                    "clay-sm clay-press flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold",
                    step === i ? "text-[var(--clay-primary-deep)]" : "text-muted-foreground",
                  )}
                  style={step === i ? { background: "var(--clay-primary-tint)" } : undefined}
                >
                  <Icon className="size-3" /> {i + 1}. {s.label}
                </button>
              );
            })}
          </div>

          <div className="min-h-[420px]">
            {stepKey === "intuition" && (
              <div className="clay p-6">
                <h2 className="flex items-center gap-2 text-lg font-extrabold"><Lightbulb className="size-5 text-[#ffc46b]" /> What is really happening?</h2>
                <p className="mt-3 leading-7 text-[15px]">{concept.intuition}</p>
                {concept.mistakes.length > 0 && (
                  <div className="mt-5">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Common mistakes</h3>
                    <div className="mt-2 space-y-2">
                      {concept.mistakes.map((m, i) => (
                        <div key={i} className="clay-sm p-3 text-sm">
                          <p className="font-bold text-destructive">✗ {m.wrong}</p>
                          <p className="mt-1 text-muted-foreground">✓ {m.why}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {stepKey === "visualize" && (
              <div className="clay p-6">
                <h2 className="flex items-center gap-2 text-lg font-extrabold"><Eye className="size-5 text-[var(--clay-4)]" /> Play with it</h2>
                <p className="mt-2 text-sm text-muted-foreground">{concept.visualize}</p>
                <div className="mt-4">
                  {SimComp ? <SimComp /> : <div className="clay-inset p-6 text-sm text-muted-foreground">Visualization coming online for this concept soon.</div>}
                </div>
              </div>
            )}

            {stepKey === "representation" && (
              <div className="clay p-6">
                <h2 className="flex items-center gap-2 text-lg font-extrabold"><PenTool className="size-5 text-[#6fd6c8]" /> How physicists draw it</h2>
                <p className="mt-3 leading-7 text-[15px]">{concept.representation}</p>
                <div className="clay-tint mt-4 p-4 text-sm">
                  <strong>Representation habit:</strong> before touching algebra, decide which representation (diagram, graph, bar chart, circuit) matches this situation. The right representation usually makes the next step obvious.
                </div>
              </div>
            )}

            {stepKey === "mathMeaning" && (
              <div className="clay p-6">
                <h2 className="flex items-center gap-2 text-lg font-extrabold"><Sigma className="size-5 text-[var(--clay-4)]" /> What the equations mean</h2>
                <p className="mt-3 leading-7 text-[15px]">{concept.mathMeaning}</p>
                <div className="mt-4 space-y-3">
                  {concept.equations.map((eq, i) => (
                    <Eq key={i} tex={eq.tex} label={eq.label} />
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  {concept.equations.map((eq, i) => (
                    <div key={i} className="clay-sm p-3 text-sm">
                      <p><strong>When to use:</strong> {eq.where}</p>
                    </div>
                  ))}
                </div>
                {concept.derivation && (
                  <div className="clay-tint mt-5 p-4">
                    <h3 className="flex items-center gap-2 text-sm font-extrabold">
                      <FlaskConical className="size-4 text-[#ffc46b]" /> Derivation — where this comes from
                    </h3>
                    <div className="clay-eq mt-3 px-3 py-2 text-center"><M>{concept.derivation.tex}</M></div>
                    <ol className="mt-3 space-y-2 text-sm">
                      {concept.derivation.steps.map((s, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--clay-4)] text-[11px] font-bold text-white">{i + 1}</span>
                          <span className="leading-6">{s}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            {stepKey === "recognition" && (
              <div className="clay p-6">
                <h2 className="flex items-center gap-2 text-lg font-extrabold"><Compass className="size-5 text-[#6fd6c8]" /> When to reach for this</h2>
                <p className="mt-3 leading-7 text-[15px]">{concept.recognition}</p>
              </div>
            )}

            {stepKey === "setup" && (
              <div className="clay p-6">
                <h2 className="flex items-center gap-2 text-lg font-extrabold"><Hammer className="size-5 text-[var(--clay-4)]" /> Setup ritual</h2>
                <p className="mt-2 text-sm text-muted-foreground">Translate words into physics in this order, every time:</p>
                <ol className="mt-4 space-y-2">
                  {concept.setup.map((s, i) => (
                    <li key={i} className="clay-sm flex items-center gap-3 p-3 text-sm font-medium">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--clay-4)] text-[11px] font-bold text-white">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {stepKey === "guided" && guided && (
              <ProblemPlayer problem={guided} conceptId={concept.id} label="Guided problem — hints encouraged" onNext={() => setStep((s) => Math.min(s + 1, totalSteps - 1))} />
            )}

            {stepKey === "independent" && independent && (
              <ProblemPlayer problem={independent} conceptId={concept.id} label="Independent problem — no hints" allowHints={false} onNext={() => setStep((s) => Math.min(s + 1, totalSteps - 1))} />
            )}

            {stepKey === "conceptual" && (
              <div className="clay p-6">
                <h2 className="flex items-center gap-2 text-lg font-extrabold"><HelpCircle className="size-5 text-[#ffc46b]" /> Concept check</h2>
                {cquestion ? (
                  <>
                    <p className="mt-3 text-[15px] leading-7">{cquestion.prompt}</p>
                    <ConceptCheck qid={concept.id} onNext={() => setStep(10)} />
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Explain {concept.name} to an imaginary classmate in two sentences — no equations allowed. If you can, you understand it; if you can't, revisit the intuition and representation steps.
                    </p>
                    <button onClick={() => setStep(10)} className="clay-btn clay-press mt-4 px-5 py-2.5 text-sm font-bold">
                      I can explain it — continue
                    </button>
                  </>
                )}
              </div>
            )}

            {stepKey === "transfer" && transfer && (
              <ProblemPlayer problem={transfer} conceptId={concept.id} label="Transfer problem — same physics, new scene" onNext={() => setStep((s) => Math.min(s + 1, totalSteps - 1))} />
            )}

            {stepKey === "mastery" && (
              <div className="clay p-6 text-center">
                <Award className="mx-auto size-10 text-[#ffc46b]" />
                <h2 className="mt-2 text-xl font-extrabold">Mastery check</h2>
                <MasterySummary conceptId={concept.id} />
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button onClick={() => setStep(0)} variant="ghost" className="font-semibold">Replay lesson</Button>
                  <Button
                    onClick={() => {
                      import("@/lib/progress").then(({ progress }) => progress.completeLesson(concept.id, 100, 12));
                      navigate("/learn");
                    }}
                    className="clay-btn clay-press border-0 font-bold"
                  >
                    Complete lesson <ArrowRight className="ml-1 size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* nav */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))} className="gap-1 font-semibold">
              <ArrowLeft className="size-4" /> Back
            </Button>
            <span className="text-xs font-bold text-muted-foreground">Step {step + 1} of {totalSteps}</span>
            <Button
              disabled={step === totalSteps - 1}
              onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}
              className="clay-btn clay-press gap-1 border-0 font-bold"
            >
              Next <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* RIGHT — equation toolbox */}
        <aside className="space-y-4">
          <div className="clay p-4">
            <h3 className="text-sm font-bold">Equation toolbox</h3>
            <div className="mt-3 space-y-2">
              {concept.equations.map((eq, i) => (
                <div key={i} className="clay-eq px-3 py-2 text-center text-sm">
                  <M>{eq.tex}</M>
                </div>
              ))}
            </div>
          </div>
          <div className="clay p-4 text-xs">
            <h3 className="text-sm font-bold">Course connections</h3>
            <p className="mt-2 text-muted-foreground">
              This concept is taught in <strong>{course.short}</strong> ({concept.math === "calculus" ? "calculus-based" : "algebra-based"}).
              {concept.math === "algebra" ? " A calculus treatment appears in the C courses where noted." : " The algebra version appears in Physics 1/2 where noted."}
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              {COURSES.map((c) => (
                <span key={c.id} className="clay-sm px-2 py-0.5 text-[10px] font-bold" style={{ color: c.color }}>{c.short}</span>
              ))}
            </div>
          </div>
          <div className="clay-tint p-4 text-xs">
            <p className="font-bold">Physics is choosing a model</p>
            <p className="mt-1 text-muted-foreground">…not just finding a formula. Ask: what's happening, what system, what governs it, what representation, does the answer make sense?</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ---------- helpers ----------
function ConceptCheck({ qid, onNext }: { qid: string; onNext: () => void }) {
  const q = CONCEPT_QUESTIONS[qid];
  const [picked, setPicked] = useState<number | null>(null);
  // Reset when navigating to a different concept's check.
  useEffect(() => setPicked(null), [qid]);
  if (!q) return <p className="mt-3 text-sm text-muted-foreground">Check coming soon.</p>;
  return (
    <div className="mt-4 space-y-2">
      {q.choices.map((c, i) => (
        <button
          key={i}
          disabled={picked !== null}
          onClick={() => {
            setPicked(i);
            checkAnswer(qid, i === q.correct);
          }}
          className={cn(
            "clay-sm clay-press block w-full px-4 py-3 text-left text-sm font-semibold",
            picked === i && "ring-2 ring-[var(--clay-4)]",
            picked !== null && i === q.correct && "ring-2 ring-[#5bbfa3]",
          )}
        >
          {c}
        </button>
      ))}
      {picked !== null && (
        <div className="clay-tint mt-3 p-4 text-sm">
          <p className="font-bold">{picked === q.correct ? "Exactly right." : "Let's unpack it."}</p>
          <p className="mt-1 text-muted-foreground">{q.explains}</p>
          <button onClick={onNext} className="mt-2 inline-flex items-center gap-1 font-bold text-[var(--clay-primary-deep)]">
            Continue <ArrowRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function MasterySummary({ conceptId }: { conceptId: string }) {
  const p = useProgress();
  const pct = masteryOf(p, conceptId);
  return (
    <div className="mx-auto mt-4 max-w-sm">
      <div className="clay-inset h-4">
        <div className="h-4 rounded-full bg-gradient-to-r from-[#6fd6c8] to-[var(--clay-4)] transition-all" style={{ width: `${Math.max(4, pct)}%` }} />
      </div>
      <p className="mt-2 text-sm font-bold">{pct}% mastery</p>
      <p className="text-xs text-muted-foreground">Based on every answer you gave in this lesson — first-try accuracy, hint use, and the transfer problem.</p>
    </div>
  );
}
