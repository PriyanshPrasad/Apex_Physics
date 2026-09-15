import { useCallback, useEffect, useState } from "react";

export type ErrorCategory =
  | "conceptual"
  | "wrong-equation"
  | "wrong-system"
  | "missing-force"
  | "sign"
  | "vector"
  | "algebra"
  | "unit"
  | "graph"
  | "calculus"
  | "assumption"
  | "proportional"
  | "experimental";

export type DiagnosticState = {
  completed: boolean;
  scores: Record<string, number>; // domain -> percent
  recommendedCourses: string[]; // course ids
};

export type QuestionRecord = {
  id: string;
  conceptId: string;
  correct: boolean;
  at: number;
  difficulty: string;
  source: string; // "bank" | "generated" | "lesson"
};

export type ProgressState = {
  version: number;
  completedLessons: Record<string, number>; // lessonId -> percent (0-100)
  conceptMastery: Record<string, number>; // conceptId -> percent
  skillMastery: Record<string, number>; // topic::questionType -> percent
  attempts: Record<string, number>; // conceptId -> count
  errors: { id: string; conceptId: string; category: ErrorCategory; at: number }[];
  streak: number;
  lastStudyDay: string | null;
  problemsCompleted: number;
  questionsAnswered: number;
  timeStudiedMin: number;
  diagnostic: DiagnosticState | null;
  currentCourseId: string;
  questionHistory: QuestionRecord[]; // ring buffer, newest first
};

const KEY = "ap-physics-mastery-progress-v1";

const initial: ProgressState = {
  version: 1,
  completedLessons: {},
  conceptMastery: {},
  skillMastery: {},
  attempts: {},
  errors: [],
  streak: 0,
  lastStudyDay: null,
  problemsCompleted: 0,
  questionsAnswered: 0,
  timeStudiedMin: 0,
  diagnostic: null,
  currentCourseId: "p1",
  questionHistory: [],
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial, ...(JSON.parse(raw) as ProgressState) };
  } catch {
    /* fresh start */
  }
  return initial;
}

let state: ProgressState = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full — keep going in memory */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function set(patch: Partial<ProgressState> | ((s: ProgressState) => Partial<ProgressState>)) {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  persist();
  emit();
}

function touchStreak() {
  const today = todayStr();
  if (state.lastStudyDay === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  set({
    streak: state.lastStudyDay === yesterday ? state.streak + 1 : 1,
    lastStudyDay: today,
  });
}

export const progress = {
  get: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  completeLesson(lessonId: string, percent: number, minutes: number) {
    const prev = state.completedLessons[lessonId] ?? 0;
    set((s) => ({
      completedLessons: { ...s.completedLessons, [lessonId]: Math.max(prev, Math.round(percent)) },
      timeStudiedMin: s.timeStudiedMin + minutes,
    }));
    touchStreak();
  },
  recordAnswer(conceptId: string, correct: boolean, quality: number, category?: ErrorCategory, meta?: { difficulty?: string; source?: string; id?: string; skill?: string }) {
    // Exponential-moving mastery from 0-100. quality: 1 correct-first-try, 0.5 correct-with-hints, 0 incorrect.
    const prev = state.conceptMastery[conceptId] ?? 25;
    const next = Math.max(0, Math.min(100, prev + (quality * 100 - prev) * 0.22));
    const skillKey = meta?.skill;
    const previousSkill = skillKey ? state.skillMastery[skillKey] ?? 25 : 0;
    const nextSkill = skillKey ? Math.max(0, Math.min(100, previousSkill + (quality * 100 - previousSkill) * 0.22)) : 0;
    set((s) => ({
      conceptMastery: { ...s.conceptMastery, [conceptId]: Math.round(next) },
      ...(skillKey ? { skillMastery: { ...s.skillMastery, [skillKey]: Math.round(nextSkill) } } : {}),
      attempts: { ...s.attempts, [conceptId]: (s.attempts[conceptId] ?? 0) + 1 },
      questionsAnswered: s.questionsAnswered + 1,
      problemsCompleted: s.problemsCompleted + (correct ? 1 : 0),
      questionHistory: [
        {
          id: meta?.id ?? `q-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
          conceptId,
          correct,
          at: Date.now(),
          difficulty: meta?.difficulty ?? "medium",
          source: meta?.source ?? "generated",
        },
        ...s.questionHistory,
      ].slice(0, 300),
      errors:
        correct || !category
          ? s.errors
          : [
              { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, conceptId, category, at: Date.now() },
              ...s.errors,
            ].slice(0, 200),
    }));
    touchStreak();
  },
  setDiagnostic(d: DiagnosticState) {
    set({ diagnostic: d });
    if (d.recommendedCourses.length > 0) set({ currentCourseId: d.recommendedCourses[0] });
  },
  setCurrentCourse(courseId: string) {
    set({ currentCourseId: courseId });
  },
  reset() {
    state = initial;
    persist();
    emit();
  },
};

export function useProgress(): ProgressState {
  const [, force] = useState(0);
  useEffect(() => progress.subscribe(() => force((n) => n + 1)), []);
  return state;
}

/** Mastery of a concept, with sensible default. */
export function masteryOf(state: ProgressState, conceptId: string): number {
  return state.conceptMastery[conceptId] ?? 0;
}

/** Lowest-mastery prerequisites for a concept, sorted ascending. */
export function weakestPrereqs(
  state: ProgressState,
  prereqIds: string[],
  count = 2,
): { id: string; pct: number }[] {
  return prereqIds
    .map((id) => ({ id, pct: masteryOf(state, id) }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, count);
}

export function useProgressAction<T extends (...args: never[]) => unknown>(fn: T) {
  return useCallback(fn, []);
}
