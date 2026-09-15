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
import type { Difficulty, QuestionType } from "@/data/qgen/core";

export type { Difficulty, QuestionType, BankQuestion, BankFilters };
export { DIFFICULTY_LABELS, DIFFICULTY_ORDER, SKILL_LABELS } from "@/data/qgen/core";
import { DIFFICULTY_LABELS, DIFFICULTY_ORDER, SKILL_LABELS } from "@/data/qgen/core";

// ------------------------------------------------------------
// Archetype registry: materialize N variants of each archetype
// with distinct seeds. This is the "expansion engine" — adding
// more archetypes or raising VARIANT_DEPTH grows the bank.
// ------------------------------------------------------------
export const VARIANT_DEPTH = 10; // variants materialized per archetype

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
}

let cache: QEntry[] | null = null;

export function getBank(): QEntry[] {
  if (cache) return cache;
  const out: QEntry[] = BANK.map((q) => ({ ...q, source: "hand" as const }));
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
      // validate: 4 choices, correct in range, explanation present
      if (!raw || raw.choices.length !== 4 || raw.correct < 0 || raw.correct > 3 || !raw.explanation) continue;
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
        prereqIds: [arch.conceptId],
        category: raw.category,
        source: "gen",
        archetypeId: arch.id,
        variantSeed: seed,
        tempt: raw.tempt,
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
  difficulty?: Difficulty | "any";
  type?: QuestionType | "any";
  conceptId?: string;
}

export function filterQuestions(f: QFilters): QEntry[] {
  return getBank().filter((q) => {
    if (f.course && f.course !== "any" && q.course !== f.course) return false;
    if (f.unit !== undefined && f.unit !== "any" && q.unit !== f.unit) return false;
    if (f.topic && f.topic !== "any" && q.topic !== f.topic) return false;
    if (f.difficulty && f.difficulty !== "any" && q.difficulty !== f.difficulty) return false;
    if (f.type && f.type !== "any" && q.type !== f.type) return false;
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
  for (const q of bank) {
    byCourse[q.course] = (byCourse[q.course] ?? 0) + 1;
    byDiff[q.difficulty] = (byDiff[q.difficulty] ?? 0) + 1;
    byType[q.type] = (byType[q.type] ?? 0) + 1;
  }
  return { total: bank.length, hand: bank.filter((q) => q.source === "hand").length, gen: bank.filter((q) => q.source === "gen").length, byCourse, byDiff, byType };
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
  const now = Date.now();
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

/** Balanced set builder: spreads across topics and difficulties. */
export function buildSet(pool: QEntry[], n: number, ctx: SelectionCtx): QEntry[] {
  const out: QEntry[] = [];
  const remaining = [...pool];
  // group by topic to guarantee coverage
  const byTopic = new Map<string, QEntry[]>();
  for (const q of remaining) {
    const list = byTopic.get(q.topic) ?? [];
    list.push(q);
    byTopic.set(q.topic, list);
  }
  const topics = [...byTopic.keys()];
  while (out.length < n && topics.length > 0) {
    for (let ti = 0; ti < topics.length && out.length < n; ti++) {
      const list = byTopic.get(topics[ti]);
      if (!list || list.length === 0) continue;
      const picked = pickSmart(list, ctx);
      if (picked) {
        out.push(picked);
        list.splice(list.indexOf(picked), 1);
      }
    }
    // drop exhausted topics
    for (let i = topics.length - 1; i >= 0; i--) {
      const list = byTopic.get(topics[i]);
      if (!list || list.length === 0) topics.splice(i, 1);
    }
  }
  return out;
}

/** Re-export hand-bank filter for pages that only want hand questions. */
export { filterHandBank };
