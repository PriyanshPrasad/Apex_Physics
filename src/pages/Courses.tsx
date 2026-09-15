// Courses tab: full catalog of all four AP Physics courses with live progress,
// mastery, and deep links into every unit and lesson.
import { Link, useParams } from "react-router";
import { ChevronRight, Check, CircleDashed, Blocks, Route } from "lucide-react";
import {
  COURSES, COURSE_MAP, UNITS_BY_COURSE, CONCEPT_MAP, CURRICULUM_VERSION,
  type CourseId,
} from "@/data/curriculum";
import { useProgress, masteryOf } from "@/lib/progress";
import { cn } from "@/lib/utils";

function courseStats(courseId: CourseId, completed: Record<string, number>, mastery: Record<string, number>) {
  const units = UNITS_BY_COURSE[courseId];
  const conceptIds = units.flatMap((u) => u.conceptIds);
  const done = conceptIds.filter((c) => (completed[c] ?? 0) >= 100).length;
  const touched = conceptIds.filter((c) => (mastery[c] ?? 0) > 0);
  const avgMastery = touched.length > 0 ? Math.round(touched.reduce((s, c) => s + mastery[c], 0) / touched.length) : 0;
  return {
    units: units.length,
    lessons: conceptIds.length,
    done,
    pct: conceptIds.length > 0 ? Math.round((done / conceptIds.length) * 100) : 0,
    avgMastery,
  };
}

function CourseCard({ courseId }: { courseId: CourseId }) {
  const p = useProgress();
  const course = COURSE_MAP[courseId];
  const stats = courseStats(courseId, p.completedLessons, p.conceptMastery);
  return (
    <Link to={`/courses/${courseId}`} className="clay clay-press block p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="clay-sm px-3 py-1.5 text-sm font-extrabold" style={{ color: course.color }}>{course.short}</span>
        <span className="clay-sm px-2.5 py-1 text-[11px] font-bold uppercase">{course.math === "calculus" ? "Calculus-based" : "Algebra-based"}</span>
      </div>
      <h2 className="mt-3 text-lg font-extrabold">{course.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{course.blurb}</p>
      <div className="mt-4 flex items-center gap-3">
        <div className="clay-inset h-3 flex-1">
          <div className="h-3 rounded-full transition-all" style={{ width: `${Math.max(2, stats.pct)}%`, background: course.color }} />
        </div>
        <span className="text-sm font-extrabold">{stats.pct}%</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>{stats.units} units</span>
        <span>{stats.done}/{stats.lessons} lessons complete</span>
        <span>{stats.avgMastery}% avg mastery</span>
      </div>
      <p className="mt-3 text-xs font-bold text-[var(--clay-primary-deep)]">Open course <ChevronRight className="inline size-3.5" /></p>
    </Link>
  );
}

function UnitRow({ courseId, unitIdx }: { courseId: CourseId; unitIdx: number }) {
  const p = useProgress();
  const units = UNITS_BY_COURSE[courseId];
  const u = units[unitIdx];
  if (!u) return null;
  const conceptIds = u.conceptIds;
  const done = conceptIds.filter((c) => (p.completedLessons[c] ?? 0) >= 100).length;
  const touched = conceptIds.filter((c) => (p.conceptMastery[c] ?? 0) > 0);
  const avg = touched.length > 0 ? Math.round(touched.reduce((s, c) => s + p.conceptMastery[c], 0) / touched.length) : 0;
  const course = COURSE_MAP[courseId];
  return (
    <div className="clay p-5">
      <div className="flex items-baseline gap-3">
        <span className="clay-sm flex h-9 w-9 shrink-0 items-center justify-center text-sm font-extrabold text-[var(--clay-primary-deep)]">{u.num}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-extrabold">{u.name}</h2>
          <p className="text-xs text-muted-foreground">{u.blurb}</p>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-sm font-extrabold">{done}/{conceptIds.length}</p>
          <p className="text-[10px] font-bold uppercase text-muted-foreground">lessons</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="clay-inset h-2.5 flex-1">
          <div className="h-2.5 rounded-full transition-all" style={{ width: `${Math.max(2, Math.round((done / conceptIds.length) * 100))}%`, background: course.color }} />
        </div>
        <span className="text-[11px] font-extrabold text-muted-foreground">{avg}% mastery</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {conceptIds.map((cid) => {
          const c = CONCEPT_MAP[cid];
          if (!c) return null;
          const isDone = (p.completedLessons[cid] ?? 0) >= 100;
          const mastery = masteryOf(p, cid);
          return (
            <Link
              key={cid}
              to={`/learn/${c.courseId}/${cid}`}
              className="clay-sm clay-press flex items-center justify-between gap-2 px-3.5 py-3"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  {isDone ? <Check className="size-3.5 shrink-0 text-[#3d9c82]" /> : <CircleDashed className="size-3.5 shrink-0 text-muted-foreground" />}
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
  );
}

export default function Courses() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight"><Blocks className="size-7 text-[var(--clay-4)]" /> Courses</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        All four AP Physics courses on one map. Every unit and lesson is one click away.
      </p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {COURSES.map((c) => <CourseCard key={c.id} courseId={c.id} />)}
      </div>
      <p className="mt-8 text-center text-[11px] text-muted-foreground">{CURRICULUM_VERSION}</p>
    </div>
  );
}

export function CourseDetail() {
  const { courseId } = useParams();
  const p = useProgress();
  const id = courseId as CourseId;
  const course = COURSE_MAP[id];
  if (!course) return <p className="mt-10 text-center font-bold">Course not found.</p>;
  const units = UNITS_BY_COURSE[id];
  const stats = courseStats(id, p.completedLessons, p.conceptMastery);

  // weakest concepts across the course
  const weakest = units
    .flatMap((u) => u.conceptIds)
    .map((cid) => ({ cid, pct: masteryOf(p, cid) }))
    .filter((x) => x.pct < 70)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link to="/courses" className="flex items-center gap-1 hover:text-foreground"><ChevronRight className="size-3 rotate-180" /> Courses</Link>
        <ChevronRight className="size-3" />
        <span className="font-semibold">{course.short}</span>
      </div>

      <div className="clay mt-4 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="clay-sm px-3 py-1.5 text-sm font-extrabold" style={{ color: course.color }}>{course.short}</span>
          <span className="clay-sm px-2.5 py-1 text-[11px] font-bold uppercase">{course.math === "calculus" ? "Calculus-based" : "Algebra-based"}</span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">{course.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{course.blurb}</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="clay-inset h-3 flex-1">
            <div className="h-3 rounded-full transition-all" style={{ width: `${Math.max(2, stats.pct)}%`, background: course.color }} />
          </div>
          <span className="text-sm font-extrabold">{stats.pct}% complete</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>{stats.done}/{stats.lessons} lessons</span>
          <span>{units.length} units</span>
          <span>{stats.avgMastery}% average mastery</span>
        </div>
        {weakest.length > 0 && (
          <div className="clay-tint mt-4 flex flex-wrap items-center gap-2 p-3 text-xs">
            <Route className="size-4 shrink-0" />
            <span className="font-bold">Weak areas:</span>
            {weakest.map((w) => (
              <Link key={w.cid} to={`/learn/${id}/${w.cid}`} className="clay-sm clay-press px-2.5 py-1 font-bold">
                {CONCEPT_MAP[w.cid]?.name ?? w.cid} ({w.pct}%)
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {units.map((_, i) => <UnitRow key={units[i].id} courseId={id} unitIdx={i} />)}
      </div>
    </div>
  );
}
