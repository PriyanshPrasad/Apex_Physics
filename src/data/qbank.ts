// ============================================================
// Question bank facade — fuses three sources into one interface:
//   1. BANK (hand-written AP-style questions)
//   2. Archetypes (reasoning patterns → procedural variants)
//   3. Diagnostic pool (adaptive selection)
// "1 archetype = 1 AP question pattern"; variants vary scenario,
// numbers, representation, wording, and distractors.
// ============================================================
import type { CourseId } from "@/data/curriculum";
import { BANK, filterBank as filterHandBank, type BankQuestion, type BankFilters } from "@/data/bank";
import { KINEMATICS } from "@/data/qgen/kinematics";
import { DYNAMICS } from "@/data/qgen/dynamics";
import { ENERGY, MOMENTUM, ROTATION, OSCILLATIONS, FLUIDS } from "@/data/qgen/energy";
import { EM } from "@/data/qgen/em";
import { CALC } from "@/data/qgen/calc";
import { RC } from "@/data/qgen/rc";
import { THERMO } from "@/data/qgen/thermo";
import { VISUALS } from "@/data/qgen/visuals";
import type { APSkill, Difficulty, QuestionType, Representation, ResponseType, VisualType } from "@/data/qgen/core";
import type { StimulusSpec, StimulusRender } from "@/data/qgen/core";
export type { StimulusSpec, StimulusRender } from "@/data/qgen/core";
import { stimRender, type RawQ } from "@/data/qgen/core";

export type { Difficulty, QuestionType, BankQuestion, BankFilters };
export { AP_SKILL_LABELS, DIFFICULTY_LABELS, DIFFICULTY_ORDER, REPRESENTATION_LABELS, SKILL_LABELS } from "@/data/qgen/core";
export type { APSkill, Representation, ResponseType };

// ------------------------------------------------------------
// Archetype registry: materialize N variants of each archetype
// with distinct seeds. This is the "expansion engine" — adding
// more archetypes or raising VARIANT_DEPTH grows the bank.
// ------------------------------------------------------------
// Each archetype produces a deterministic family of scenario/representation
// variants. The bank remains local and lazy-cached while supporting thousands
// of original questions as more archetypes are added.
export const VARIANT_DEPTH = 36; // variants materialized per archetype

const ARCHETYPES = [
  ...KINEMATICS,
  ...DYNAMICS,
  ...ENERGY,
  ...MOMENTUM,
  ...ROTATION,
  ...OSCILLATIONS,
  ...FLUIDS,
  ...EM,
  ...CALC,
  ...RC,
  ...THERMO,
  ...VISUALS,
];

export const ARCHETYPE_COUNT = ARCHETYPES.length;

/** Stable string hash → uint32 (xmur3-style) */
function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

/** Deterministic mulberry32 PRNG */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One materialized question — a variant with a stable identity. */
export interface QEntry extends BankQuestion {
  source: "hand" | "gen";
  archetypeId?: string;
  variantSeed?: number;
  tempt?: (string | undefined)[];
  /** AP-style stimulus (shared scenario) rendered above the prompt when present. */
  stimulusRender?: StimulusRender;
  stimulusId?: string;
  responseType: ResponseType;
  solutionSteps: string[];
  stimulusType?: StimulusSpec["kind"];
  sciencePractice: string[];
  calculatorAllowed: boolean;
  isOriginal: boolean;
  sourceType: "original-hand" | "original-generated" | "official-link";
  visualType: VisualType;
  subtopic: string;
  skills: APSkill[];
  representations: Representation[];
  prerequisites: string[];
}

// ------------------------------------------------------------
// Quality control — every generated question must pass before
// it is allowed into the bank. Broken questions are dropped and
// logged rather than silently served to students.
// ------------------------------------------------------------
function validateRaw(archId: string, raw: RawQ): string | null {
  if (!raw || typeof raw !== "object") return "not an object";
  if (typeof raw.prompt !== "string" || raw.prompt.trim().length < 15) return "prompt missing/too short";
  if (raw.prompt.includes("undefined") || raw.prompt.includes("[object")) return "prompt contains 'undefined' or '[object]'";
  if (raw.prompt.includes("\\n")) return "prompt contains literal backslash-n";
  if (!Array.isArray(raw.choices) || raw.choices.length !== 4) return "must have exactly 4 choices";
  for (const c of raw.choices) {
    if (typeof c !== "string" || c.trim().length === 0) return "empty choice text";
    if (c.includes("undefined") || c.includes("[object") || c.includes("NaN")) return `choice contains 'undefined'/NaN: "${c.slice(0, 40)}"`;
  }
  const uniq = new Set(raw.choices.map((c) => c.trim()));
  if (uniq.size !== 4) return "duplicate choice text";
  if (!Number.isInteger(raw.correct) || raw.correct < 0 || raw.correct > 3) return "correct index out of range";
  if (typeof raw.explanation !== "string" || raw.explanation.trim().length < 20) return "explanation missing/too short";
  if (raw.explanation.includes("undefined") || raw.explanation.includes("NaN")) return "explanation contains 'undefined'/NaN";
  if (raw.tempt) {
    if (!Array.isArray(raw.tempt) || raw.tempt.length !== 4) return "tempt must align with 4 choices";
    if (typeof raw.tempt[raw.correct] !== "undefined") return "tempt set for the CORRECT choice";
    if (raw.tempt.some((t, i) => i !== raw.correct && (typeof t !== "string" || t.trim().length < 8))) return "each distractor needs a misconception explanation";
  }
  if (raw.stimulus) {
    if (raw.stimulus.blurb.trim().length < 20) return "stimulus blurb missing/too short";
    if (raw.stimulus.kind === "table" && (raw.stimulus.headers.length < 2 || raw.stimulus.rows.length < 2)) return "stimulus table needs headers and data rows";
    if (raw.stimulus.kind === "pv" && raw.stimulus.points.length < 2) return "P–V stimulus needs at least two points";
  }
  return null;
}

function deriveSkills(q: { type: QuestionType; conceptId: string; diagram?: unknown; stimulus?: StimulusSpec }): APSkill[] {
  const skills = new Set<APSkill>();
  if (q.type === "conceptual") skills.add("conceptual-reasoning");
  if (q.type === "quantitative") skills.add("mathematical-routines");
  if (q.type === "graph") skills.add("graphical-analysis");
  if (q.type === "diagram") skills.add("creating-representations");
  if (q.type === "experimental") { skills.add("experimental-design"); skills.add("data-analysis"); }
  if (q.type === "representation") skills.add("representation-translation");
  if (q.type === "equation-selection") skills.add("model-selection");
  if (q.type === "proportional-reasoning") skills.add("proportional-reasoning");
  if (q.type === "quantitative" || q.type === "equation-selection" || q.type === "representation") skills.add("qualitative-quantitative-translation");
  if (/energy|momentum|collision|conservation|gauss|kirchhoff|induction/i.test(q.conceptId)) skills.add("conservation-reasoning");
  if (q.diagram || q.stimulus) skills.add("creating-representations");
  return [...skills];
}

function deriveSubtopic(id: string, topic: string): string {
  const key = id.toLowerCase();
  const rules: [RegExp, string][] = [
    [/graph|vt|xt|at|piecewise/, "Motion graphs"],
    [/projectile/, "Projectile motion"],
    [/relative/, "Relative motion"],
    [/fbd|force|newton|elevator|incline|friction|circular/, "Forces and models"],
    [/work|energy|power|ramp/, "Work and energy"],
    [/momentum|collision/, "Momentum and collisions"],
    [/torque|rot|rolling|angular/, "Rotation"],
    [/shm|oscill/, "Oscillations"],
    [/fluid|buoy|pressure|continuity/, "Fluids"],
    [/thermo|gas|heat|entropy|pv/, "Thermodynamic processes"],
    [/rc/, "RC circuits"],
    [/capacitor|dielectric/, "Capacitors"],
    [/gauss|charge|field|potential|coulomb/, "Fields and potential"],
    [/magnet|ampere|induction|faraday|lenz/, "Magnetism and induction"],
    [/lens|optic|ray|wave/, "Waves and optics"],
    [/calc|deriv|integral|diff/, "Calculus relationships"],
  ];
  return rules.find(([pattern]) => pattern.test(key))?.[1] ?? topic;
}

function deriveRepresentations(q: { type: QuestionType; diagram?: { kind?: string }; stimulus?: StimulusSpec }): Representation[] {
  const reps = new Set<Representation>(["written-description"]);
  if (q.type === "graph") reps.add("graph");
  if (q.type === "diagram" || q.diagram) reps.add("diagram");
  if (q.type === "quantitative" || q.type === "equation-selection") reps.add("equation");
  if (q.type === "experimental") { reps.add("data"); reps.add("table"); }
  if (q.type === "representation") reps.add("equation");
  if (q.diagram?.kind === "circuit") reps.add("circuit");
  if (q.diagram?.kind === "pv" || q.stimulus?.kind === "pv") reps.add("pv-diagram");
  if (q.stimulus?.kind === "table") { reps.add("table"); reps.add("data"); }
  return [...reps];
}

let cache: QEntry[] | null = null;

export function getBank(): QEntry[] {
  if (cache) return cache;
  const out: QEntry[] = BANK.map((q) => ({
    ...q,
    source: "hand" as const,
    subtopic: deriveSubtopic(q.id, q.topic),
    skills: deriveSkills({ type: q.type, conceptId: q.conceptId, diagram: q.diagram }),
    representations: deriveRepresentations({ type: q.type, diagram: q.diagram }),
    prerequisites: q.prereqIds,
    responseType: "multiple-choice",
    solutionSteps: ["Identify the physical model and the quantity being asked for.", q.apStrategy, q.explanation],
    stimulusType: undefined,
    sciencePractice: deriveSkills({ type: q.type, conceptId: q.conceptId, diagram: q.diagram }),
    calculatorAllowed: true,
    isOriginal: true,
    sourceType: "original-hand",
    visualType: q.diagram ? "diagram" : "none",

    tempt: q.choices.map((_, index) => index === q.correct ? undefined : `This choice reflects a common mistake: ${q.commonMistake}`),
  }));
  const seenPrompts = new Set(out.map((q) => q.prompt.trim()));
  for (const arch of ARCHETYPES) {
    for (let v = 0; v < VARIANT_DEPTH; v++) {
      const seed = hashSeed(`${arch.id}#${v}`);
      const r = mulberry32(seed);
      let raw;
      try {
        raw = arch.gen(r);
      } catch (err) {
        // A failing archetype must never take the whole bank down.
        console.error(`Archetype ${arch.id} variant ${v} failed to generate`, err);
        continue;
      }
      if (!raw) continue;
      const fail = validateRaw(arch.id, raw);
      if (fail) {
        console.warn(`[qbank] dropped ${arch.id}-v${v}: ${fail}`);
        continue;
      }
      // exact-duplicate prompt guard (archetype produced a fixed question)
      const pKey = raw.prompt.trim();
      if (seenPrompts.has(pKey)) {
        console.warn(`[qbank] dropped ${arch.id}-v${v}: duplicate of an existing question`);
        continue;
      }
      seenPrompts.add(pKey);
      // stimulus-set seeding: members of a shared set get the SAME stimulus
      // (and scenario numbers where the archetype reads the same rng stream)
      const setSeed = arch.shared ? hashSeed(`${arch.shared}#${v}`) : seed;
      let stimSpec: StimulusSpec | undefined = raw.stimulus;
      if (arch.shared) {
        // regenerate the set's stimulus deterministically from the shared seed
        const sr = mulberry32(setSeed);
        try {
          const probe = arch.gen(sr);
          if (probe?.stimulus) stimSpec = probe.stimulus;
        } catch {
          /* stimulus probe failure → fall back to raw's own stimulus */
        }
      }
      out.push({
        id: `${arch.id}-v${v}`,
        course: arch.course,
        unit: arch.unit,
        topic: arch.topic,
        conceptId: arch.conceptId,
        difficulty: arch.difficulty,
        type: arch.type,
        prompt: raw.prompt,
        diagram: raw.diagram,
        choices: raw.choices,
        correct: raw.correct,
        explanation: raw.explanation,
        equations: raw.equations ?? [],
        commonMistake: raw.commonMistake ?? "",
        apStrategy: raw.apStrategy ?? "",
        prereqIds: raw.prerequisites ?? arch.prerequisites ?? [arch.conceptId],
        category: raw.category,
        subtopic: raw.subtopic ?? arch.subtopic ?? deriveSubtopic(arch.id, arch.topic),
        skills: raw.skills ?? arch.skills ?? deriveSkills({ type: arch.type, conceptId: arch.conceptId, diagram: raw.diagram, stimulus: stimSpec }),
        representations: raw.representations ?? arch.representations ?? deriveRepresentations({ type: arch.type, diagram: raw.diagram, stimulus: stimSpec }),
        prerequisites: raw.prerequisites ?? arch.prerequisites ?? [arch.conceptId],
        source: "gen",
        archetypeId: arch.id,
        variantSeed: setSeed,
        tempt: raw.tempt,
        stimulusRender: stimSpec ? stimRender(stimSpec) : undefined,
        stimulusId: stimSpec ? `${arch.shared ?? arch.id}#${v}` : undefined,
        responseType: raw.responseType ?? "multiple-choice",
        solutionSteps: raw.solutionSteps ?? ["Identify the system and known information.", raw.apStrategy, raw.explanation],
        stimulusType: stimSpec?.kind,
        sciencePractice: raw.skills ?? arch.skills ?? deriveSkills({ type: arch.type, conceptId: arch.conceptId, diagram: raw.diagram, stimulus: stimSpec }),
        calculatorAllowed: true,
        isOriginal: true,
        sourceType: "original-generated",
        visualType: stimSpec ? (raw.diagram ? "multi-representation" : "stimulus") : raw.diagram ? (raw.diagram.kind === "vgraph" || raw.diagram.kind === "pv" ? "graph" : "diagram") : "none",
      });
    }
  }
  cache = out;
  return out;
}

/** Invalidate cache (used by tests or hot reload). */
export function invalidateBankCache() {
  cache = null;
}

// ------------------------------------------------------------
// Filtering over the fused bank
// ------------------------------------------------------------
export interface QFilters {
  course?: CourseId | "any";
  unit?: number | "any";
  topic?: string | "any";
  subtopic?: string | "any";
  difficulty?: Difficulty | "any";
  type?: QuestionType | "any";
  skill?: APSkill | "any";
  representation?: Representation | "any";
  prerequisite?: string | "any";
  conceptId?: string;
}

export function filterQuestions(f: QFilters): QEntry[] {
  return getBank().filter((q) => {
    if (f.course && f.course !== "any" && q.course !== f.course) return false;
    if (f.unit !== undefined && f.unit !== "any" && q.unit !== f.unit) return false;
    if (f.topic && f.topic !== "any" && q.topic !== f.topic) return false;
    if (f.subtopic && f.subtopic !== "any" && q.subtopic !== f.subtopic) return false;
    if (f.difficulty && f.difficulty !== "any" && q.difficulty !== f.difficulty) return false;
    if (f.type && f.type !== "any" && q.type !== f.type) return false;
    if (f.skill && f.skill !== "any" && !q.skills.includes(f.skill)) return false;
    if (f.representation && f.representation !== "any" && !q.representations.includes(f.representation)) return false;
    if (f.prerequisite && f.prerequisite !== "any" && !q.prerequisites.includes(f.prerequisite)) return false;
    if (f.conceptId && q.conceptId !== f.conceptId) return false;
    return true;
  });
}

export const TOPICS_BY_COURSE = (course: CourseId): string[] =>
  Array.from(new Set(getBank().filter((q) => q.course === course).map((q) => q.topic)));

export const TYPES_PRESENT: QuestionType[] = Array.from(new Set(getBank().map((q) => q.type)));

export const bankStats = () => {
  const bank = getBank();
  const byCourse = {} as Record<CourseId, number>;
  const byDiff = {} as Record<Difficulty, number>;
  const byType = {} as Record<QuestionType, number>;
  let visual = 0;
  for (const q of bank) {
    if (q.visualType !== "none" || q.stimulusId) visual++;
    byCourse[q.course] = (byCourse[q.course] ?? 0) + 1;
    byDiff[q.difficulty] = (byDiff[q.difficulty] ?? 0) + 1;
    byType[q.type] = (byType[q.type] ?? 0) + 1;
  }
  return { total: bank.length, hand: bank.filter((q) => q.source === "hand").length, gen: bank.filter((q) => q.source === "gen").length, visual, visualPct: bank.length ? Math.round((visual / bank.length) * 100) : 0, byCourse, byDiff, byType };
};

// ------------------------------------------------------------
// Spaced-repetition-aware selection
// ------------------------------------------------------------
export interface SelectionCtx {
  missed: Set<string>; // recently missed question ids
  seen: Set<string>; // answered question ids
  conceptWeakness: (conceptId: string) => number; // 0 (strong) .. 1 (weak)
}

/**
 * Intelligent random pick: weights toward unseen questions, recently
 * missed questions, and weak concepts, while avoiding immediate repeats.
 */
export function pickSmart(
  pool: QEntry[],
  ctx: SelectionCtx,
  rand: () => number = Math.random,
): QEntry | null {
  if (pool.length === 0) return null;
  const weights = pool.map((q) => {
    let w = 1;
    if (!ctx.seen.has(q.id)) w *= 2.2; // prefer fresh questions
    if (ctx.missed.has(q.id)) w *= 2.0; // retest misses (spaced repetition)
    w *= 1 + 2 * ctx.conceptWeakness(q.conceptId); // weak concepts
    return w;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rand() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/**
 * Construct an intentional session instead of drawing independently.
 * The greedy score rewards fresh/weak questions, then penalizes repeating an
 * archetype, representation, or target topic already used in the session.
 */
export function buildSet(pool: QEntry[], n: number, ctx: SelectionCtx): QEntry[] {
  const out: QEntry[] = [];
  const remaining = [...pool];
  while (out.length < n && remaining.length > 0) {
    const topicCounts = new Map<string, number>();
    const archetypeCounts = new Map<string, number>();
    const repCounts = new Map<string, number>();
    for (const q of out) {
      topicCounts.set(q.topic, (topicCounts.get(q.topic) ?? 0) + 1);
      if (q.archetypeId) archetypeCounts.set(q.archetypeId, (archetypeCounts.get(q.archetypeId) ?? 0) + 1);
      q.representations.forEach((rep) => repCounts.set(rep, (repCounts.get(rep) ?? 0) + 1));
    }
    const scored = remaining.map((q) => {
      let score = 1;
      if (!ctx.seen.has(q.id)) score += 3;
      if (ctx.missed.has(q.id)) score += 2;
      score += ctx.conceptWeakness(q.conceptId) * 3;
      score -= (topicCounts.get(q.topic) ?? 0) * 1.4;
      score -= (archetypeCounts.get(q.archetypeId ?? "") ?? 0) * 4;
      score -= q.representations.reduce((sum, rep) => sum + (repCounts.get(rep) ?? 0), 0) * 0.18;
      // Small deterministic noise prevents identical sessions without making
      // selection purely random.
      score += Math.random() * 0.5;
      return { q, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const chosen = scored[0].q;
    out.push(chosen);
    remaining.splice(remaining.indexOf(chosen), 1);
  }
  return out;
}

/** Re-export hand-bank filter for pages that only want hand questions. */
export { filterHandBank };
