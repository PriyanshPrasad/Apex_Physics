import { Link } from "react-router";
import { TrendingUp, Route as RouteIcon } from "lucide-react";
import { useProgress, masteryOf } from "@/lib/progress";
import { COURSES, COURSE_MAP, UNITS_BY_COURSE, CONCEPT_MAP, type CourseId } from "@/data/curriculum";
import { cn } from "@/lib/utils";

const DOMAIN_NAMES: Record<string, string> = {
  "f-algebra": "Algebra", "f-trig": "Trigonometry", "f-graphs": "Graphs", "f-vectors": "Vectors",
  "f-mechanics": "Mechanics", "f-energy": "Energy", "f-momentum": "Momentum", "f-calculus": "Calculus",
  "f-diffeq": "Differential equations", "f-electricity": "Electricity",
};

export default function Progress() {
  const p = useProgress();
  const concepts = Object.values(CONCEPT_MAP);
  const overall = Math.round(concepts.reduce((s, c) => s + masteryOf(p, c.id), 0) / Math.max(1, concepts.length));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight"><TrendingUp className="size-7 text-[var(--clay-4)]" /> Progress</h1>
      <p className="mt-1 text-sm text-muted-foreground">Mastery is built from lesson performance, hint use, transfer problems, and repetition — never one question.</p>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Overall mastery", value: `${overall}%` },
          { label: "Lessons completed", value: Object.values(p.completedLessons).filter((v) => v >= 100).length },
          { label: "Questions answered", value: p.questionsAnswered },
          { label: "Day streak", value: p.streak },
        ].map((s) => (
          <div key={s.label} className="clay-sm p-4">
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="text-[11px] font-semibold text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* per-course grids */}
      <div className="mt-6 space-y-4">
        {COURSES.map((course) => (
          <div key={course.id} className="clay p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold" style={{ color: course.color }}>{course.short}</h2>
              <Link to={`/learn/${course.id}`} className="text-xs font-bold text-[var(--clay-primary-deep)]">Open course</Link>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {UNITS_BY_COURSE[course.id].flatMap((u) =>
                u.conceptIds.map((cid) => {
                  const c = CONCEPT_MAP[cid];
                  if (!c) return null;
                  const m = masteryOf(p, cid);
                  return (
                    <Link key={cid} to={`/learn/${course.id}/${cid}`} className="clay-sm px-3.5 py-2.5">
                      <div className="flex items-center justify-between gap-2 text-xs font-bold">
                        <span className="truncate">{c.name}</span>
                        <span className={cn(m >= 70 ? "text-[#3d9c82]" : m >= 40 ? "text-[#c08a2d]" : "text-muted-foreground")}>{m}%</span>
                      </div>
                      <div className="clay-inset mt-1.5 h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.max(2, m)}%`, background: m >= 70 ? "#6fd6c8" : m >= 40 ? "#ffc46b" : "var(--destructive)" }} />
                      </div>
                    </Link>
                  );
                }),
              )}
            </div>
          </div>
        ))}
      </div>

      {/* diagnostic + roadmap */}
      <div className="clay mt-6 p-6">
        <h2 className="flex items-center gap-2 text-lg font-extrabold"><RouteIcon className="size-5 text-[var(--clay-4)]" /> Diagnostic & roadmap</h2>
        {p.diagnostic?.completed ? (
          <>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(p.diagnostic.scores).map(([d, pct]) => (
                <div key={d} className="clay-sm p-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{DOMAIN_NAMES[d] ?? d}</span><span>{pct}%</span>
                  </div>
                  <div className="clay-inset mt-1.5 h-1.5">
                    <div className="h-1.5 rounded-full bg-[var(--clay-4)]" style={{ width: `${Math.max(3, pct)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Recommended path: {p.diagnostic.recommendedCourses.map((c) => COURSE_MAP[c as CourseId]?.short ?? c).join(" → ")}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Take the diagnostic to generate your personalized roadmap and seed your prerequisite map.</p>
        )}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => { if (confirm("Reset all progress on this device? This cannot be undone.")) { import("@/lib/progress").then(({ progress }) => progress.reset()); } }}
          className="text-xs font-semibold text-muted-foreground underline hover:text-destructive"
        >
          Reset all progress
        </button>
      </div>
    </div>
  );
}
