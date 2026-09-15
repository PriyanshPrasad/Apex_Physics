import { useState } from "react";
import { Link, useParams } from "react-router";
import { ChevronRight, Check, CircleDashed, Route } from "lucide-react";
import { COURSES, COURSE_MAP, UNITS_BY_COURSE, CONCEPT_MAP, CURRICULUM_VERSION, type CourseId } from "@/data/curriculum";
import { useProgress, masteryOf } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function LearnHome() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Learn</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Four courses, one connected map of physics. Pick a course — or start with your roadmap below.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {COURSES.map((c) => {
          const units = UNITS_BY_COURSE[c.id];
          const conceptCount = units.reduce((s, u) => s + u.conceptIds.length, 0);
          return (
            <Link key={c.id} to={`/learn/${c.id}`} className="clay clay-press p-5">
              <div className="flex items-center justify-between">
                <span className="clay-sm px-2.5 py-1 text-xs font-extrabold" style={{ color: c.color }}>{c.short}</span>
                <span className="text-xs font-bold text-muted-foreground">{units.length} units · {conceptCount} lessons</span>
              </div>
              <h2 className="mt-3 text-lg font-extrabold leading-snug">{c.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{c.blurb}</p>
              <p className="mt-3 text-xs font-bold text-[var(--clay-primary-deep)]">Open course <ChevronRight className="inline size-3.5" /></p>
            </Link>
          );
        })}
      </div>
      <p className="mt-8 text-center text-[11px] text-muted-foreground">{CURRICULUM_VERSION}</p>
    </div>
  );
}

export function CoursePage() {
  const { courseId } = useParams();
  const p = useProgress();
  const course = COURSE_MAP[courseId as CourseId];
  if (!course) return <p className="mt-10 text-center font-bold">Course not found.</p>;
  const units = UNITS_BY_COURSE[course.id];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="clay p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="clay-sm px-3 py-1.5 text-sm font-extrabold" style={{ color: course.color }}>{course.short}</span>
          <span className="clay-sm px-2.5 py-1 text-[11px] font-bold uppercase">{course.math === "calculus" ? "Calculus-based" : "Algebra-based"}</span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">{course.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{course.blurb}</p>
      </div>

      <div className="mt-5 space-y-3">
        {units.map((u) => (
          <div key={u.id} className="clay p-5">
            <div className="flex items-baseline gap-3">
              <span className="clay-sm flex h-9 w-9 shrink-0 items-center justify-center text-sm font-extrabold text-[var(--clay-primary-deep)]">{u.num}</span>
              <div>
                <h2 className="text-lg font-extrabold">{u.name}</h2>
                <p className="text-xs text-muted-foreground">{u.blurb}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {u.conceptIds.map((cid) => {
                const c = CONCEPT_MAP[cid];
                if (!c) return null;
                const done = (p.completedLessons[cid] ?? 0) >= 100;
                const mastery = masteryOf(p, cid);
                return (
                  <Link
                    key={cid}
                    to={`/learn/${c.courseId}/${cid}`}
                    className="clay-sm clay-press flex items-center justify-between gap-2 px-3.5 py-3"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-bold">
                        {done ? <Check className="size-3.5 shrink-0 text-[#3d9c82]" /> : <CircleDashed className="size-3.5 shrink-0 text-muted-foreground" />}
                        {c.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{c.tagline}</span>
                    </span>
                    <span className={cn("shrink-0 text-[11px] font-extrabold", mastery >= 70 ? "text-[#3d9c82]" : mastery > 0 ? "text-[#c08a2d]" : "text-muted-foreground")}>
                      {mastery > 0 ? `${mastery}%` : "start"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
