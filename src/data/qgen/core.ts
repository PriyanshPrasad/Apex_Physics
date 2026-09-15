// Question generation core: archetypes produce variants by varying scenario,
// representation, wording, and numbers. Distractors are COMPUTED from real
// student mistakes so each wrong answer has a specific "why it's tempting".
import type { CourseId } from "@/data/curriculum";
import type { ErrorCategory } from "@/lib/progress";
import type { DiagramSpec } from "@/components/questions/Diagrams";

export type Difficulty = "easy" | "medium" | "hard" | "ap" | "challenge";
export type QuestionType =
  | "conceptual" | "quantitative" | "graph" | "diagram" | "experimental"
  | "representation" | "equation-selection" | "proportional-reasoning";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy · Foundation",
  medium: "Medium · Standard AP",
  hard: "Hard · Challenging",
  ap: "Very Hard · Advanced AP",
  challenge: "Expert · Stretch",
};
export const DIFFICULTY_ORDER: Difficulty[] = ["easy", "medium", "hard", "ap", "challenge"];

export const SKILL_LABELS: Record<QuestionType, string> = {
  conceptual: "Conceptual reasoning",
  quantitative: "Mathematical routines",
  graph: "Graph interpretation",
  diagram: "Diagram interpretation",
  experimental: "Experimental design & data",
  representation: "Representation translation",
  "equation-selection": "Equation/model selection",
  "proportional-reasoning": "Proportional reasoning",
};

export type Rng = () => number;

export interface RawQ {
  prompt: string;
  diagram?: DiagramSpec;
  choices: string[];
  correct: number;
  /** per-choice "why this distractor is tempting" (index-aligned; undefined for correct) */
  tempt?: (string | undefined)[];
  explanation: string;
  equations: string[];
  commonMistake: string;
  apStrategy: string;
  category?: ErrorCategory;
}

export interface Archetype {
  id: string;
  course: CourseId;
  unit: number;
  topic: string;
  conceptId: string;
  difficulty: Difficulty;
  type: QuestionType;
  skill: string;
  gen: (r: Rng) => RawQ;
}

// ---------------- deterministic-ish RNG helpers ----------------
export function ri(min: number, max: number, r: Rng): number {
  return Math.floor(r() * (max - min + 1)) + min;
}
export function rf(min: number, max: number, step: number, r: Rng): number {
  const n = Math.round((min + r() * (max - min)) / step) * step;
  return Math.round(n * 1000) / 1000;
}
export function pick<T>(arr: readonly T[], r: Rng): T {
  return arr[Math.floor(r() * arr.length)];
}
export function pickN<T>(arr: readonly T[], n: number, r: Rng): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length > 0) out.push(copy.splice(Math.floor(r() * copy.length), 1)[0]);
  return out;
}
export function fmt(n: number, d = 2): string {
  if (Number.isInteger(n)) return String(n);
  const s = n.toFixed(d).replace(/\.?0+$/, "");
  return s === "-0" ? "0" : s;
}

// ---------------- numeric distractor builder ----------------
/**
 * Build a 4-choice MCQ from a correct value + distractor values computed from
 * real mistakes. Each distractor can carry a temptation note.
 */
export function mkNum(
  correct: number,
  distractors: { v: number; tempt: string }[],
  unit: string,
  r: Rng,
  digits = 2,
): Pick<RawQ, "choices" | "correct" | "tempt"> {
  const all: { v: number; tempt?: string }[] = [{ v: correct }, ...distractors];
  const seen = new Set<string>();
  const uniq = all.filter((d) => {
    const key = fmt(d.v, digits);
    if (seen.has(key) || !Number.isFinite(d.v)) return false;
    seen.add(key);
    return true;
  });
  while (uniq.length < 4) {
    const filler = correct * (1 + (uniq.length + 1) * 0.35) + 1;
    const key = fmt(filler, digits);
    if (!seen.has(key)) { seen.add(key); uniq.push({ v: filler, tempt: "A fill-in distractor — recompute carefully." }); }
    else break;
  }
  const four = uniq.slice(0, 4);
  const shuffled = four
    .map((d) => ({ d, k: r() }))
    .sort((a, b) => a.k - b.k)
    .map((o) => o.d);
  const correctIdx = shuffled.findIndex((d) => fmt(d.v, digits) === fmt(correct, digits));
  return {
    choices: shuffled.map((d) => `${fmt(d.v, digits)}${unit ? ` ${unit}` : ""}`),
    correct: correctIdx,
    tempt: shuffled.map((d) => (fmt(d.v, digits) === fmt(correct, digits) ? undefined : d.tempt ?? "Recheck your reasoning — this value comes from a common slip.")),
  };
}

// ---------------- scenario banks (variation engine fuel) ----------------
export const SCENARIOS = {
  mover: ["a delivery drone", "a marble", "a cyclist", "a toy train", "a laboratory cart", "a hockey puck", "a sensor package", "a model rocket", "a cart on an air track", "a rolling ball"] as const,
  surface: ["a wooden ramp", "a steel track", "a lab bench", "an inclined plane", "a conveyor belt", "a frictionless air table"] as const,
  fluid: ["fresh water", "seawater", "cooking oil", "glycerin", "mercury"] as const,
  object: ["a steel cube", "a wooden block", "an aluminum cylinder", "a hollow sphere", "a rubber ball", "a cork stopper"] as const,
  circuitSource: ["a 9 V battery", "a 12 V lab supply", "a 6 V battery pack", "an adjustable power supply"] as const,
  wave: ["a sound wave", "a wave on a string", "a ripple in a tank", "a radio wave", "a microwave signal"] as const,
  student: ["a student", "an AP candidate", "a lab partner", "a physics teacher", "a research assistant"] as const,
} as const;

/** motion graph shapes used by graph archetypes */
export const GRAPH_SHAPES = ["linear-up", "linear-down", "flat", "parabolic-up", "parabolic-down", "sine-up", "sine-down", "v-shape", "triangle"] as const;
export type GraphShape = (typeof GRAPH_SHAPES)[number];

/** describe a graph shape in words (for answer choices) */
export function shapeWord(shape: GraphShape, forV = false): string {
  switch (shape) {
    case "linear-up": return forV ? "increases linearly" : "curves upward (parabolic)";
    case "linear-down": return forV ? "decreases linearly" : "curves downward";
    case "flat": return forV ? "is constant and nonzero" : "is a straight line with constant slope";
    case "parabolic-up": return forV ? "increases linearly from zero" : "is a horizontal line";
    case "parabolic-down": return forV ? "decreases linearly toward zero" : "is a horizontal line";
    case "sine-up": return "rises then levels off";
    case "sine-down": return "falls then levels off";
    case "v-shape": return "decreases to zero, then increases";
    case "triangle": return "decreases then increases back to the start";
  }
}
