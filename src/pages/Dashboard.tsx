import { Link, useNavigate } from "react-router";
import {
  Flame, Target, Zap, Clock, ListChecks, ArrowRight, ClipboardList,
  TrendingUp, TriangleAlert, BookOpen, Sparkles,
} from "lucide-react";
import { useProgress, masteryOf } from "@/lib/progress";
import { COURSE_MAP, UNITS_BY_COURSE, CONCEPT_MAP, type CourseId } from "@/data/curriculum";
import { Button } from "@/components/ui/button";

function conceptName(id: string): string {
  return CONCEPT_MAP[id]?.name ?? id.replace(/^f-/, "").replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function nextLesson(courseId: CourseId, completed: Record<string, number>) {
  const units = UNITS_BY_COURSE[courseId];
  for (const u of units) {
    for (const cid of u.conceptIds) {
      if ((completed[cid] ?? 0) < 100) return { unit: u, conceptId: cid };
    }
  }
  return null;
}

export default function Dashboard() {
  const p = useProgress();
  const navigate = useNavigate();
  const courseId = p.currentCourseId as CourseId;
  const course = COURSE_MAP[courseId];
  const next = nextLesson(courseId, p.completedLessons);
  const nextConcept = next ? CONCEPT_MAP[next.conceptId] : null;

  const allConcepts = Object.values(CONCEPT_MAP);
  const weakest = [...allConcepts]
    .filter((c) => (p.attempts[c.id] ?? 0) > 0)
    .sort((a, b) => masteryOf(p, a.id) - masteryOf(p, b.id))
    .slice(0, 4);

  const errorCounts = p.errors.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1;
    return acc;
  }, {});
  const topErrors = Object.entries(errorCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const totalMastery = allConcepts.length
    ? Math.round(allConcepts.reduce((s, c) => s + masteryOf(p, c.id), 0) / allConcepts.length)
    : 0;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero */}
      <div className="clay relative overflow-hidden p-6 md:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-[var(--clay-4)] opacity-15 blur-2xl" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {p.diagnostic?.completed ? "Your roadmap" : "Welcome"}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">
              Don't memorize physics. <span className="text-glow text-[var(--clay-primary-deep)]">Understand it.</span>
            </h1>
            {next && nextConcept && (
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                Up next in <strong>{course.short}</strong>, Unit {next.unit.num} ({next.unit.name}):{" "}
                <strong className="text-foreground">{nextConcept.name}</strong> — {nextConcept.tagline}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {next && (
              <Button onClick={() => navigate(`/learn/${nextConcept!.courseId}/${next.conceptId}`)} className="clay-btn clay-press border-0 font-bold">
                <BookOpen className="mr-1.5 size-4" /> Continue learning
              </Button>
            )}
            <Button onClick={() => navigate("/practice")} variant="ghost" className="font-semibold">
              <Zap className="mr-1.5 size-4" /> Practice weak areas
            </Button>
            {!p.diagnostic?.completed && (
              <Button onClick={() => navigate("/diagnostic")} variant="ghost" className="font-semibold">
                <ClipboardList className="mr-1.5 size-4" /> Take the diagnostic
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { icon: Flame, label: "Day streak", value: p.streak },
          { icon: ListChecks, label: "Problems solved", value: p.problemsCompleted },
          { icon: Target, label: "Questions answered", value: p.questionsAnswered },
          { icon: Clock, label: "Minutes studied", value: p.timeStudiedMin },
          { icon: TrendingUp, label: "Avg mastery", value: `${totalMastery}%` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="clay-sm p-4">
            <Icon className="size-4 text-[var(--clay-4)]" />
            <p className="mt-2 text-2xl font-extrabold">{value}</p>
            <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Mastery by unit */}
        <div className="clay p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">{course.short} mastery</h2>
            <Link to={`/learn/${course.id}`} className="text-xs font-bold text-[var(--clay-primary-deep)]">All units <ArrowRight className="inline size-3" /></Link>
          </div>
          <div className="mt-4 space-y-3">
            {UNITS_BY_COURSE[courseId].map((u) => {
              const avg = Math.round(u.conceptIds.reduce((s, cid) => s + masteryOf(p, cid), 0) / Math.max(1, u.conceptIds.length));
              return (
                <div key={u.id}>
                  <div className="flex justify-between text-xs font-bold">
                    <span>Unit {u.num} · {u.name}</span>
                    <span className="text-muted-foreground">{avg}%</span>
                  </div>
                  <div className="clay-inset mt-1 h-2.5">
                    <div className="h-2.5 rounded-full transition-all" style={{ width: `${Math.max(2, avg)}%`, background: avg >= 70 ? "#6fd6c8" : avg >= 40 ? "#ffc46b" : "var(--destructive)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          {/* Weakest */}
          <div className="clay p-6">
            <h2 className="flex items-center gap-2 text-lg font-extrabold"><Target className="size-5 text-destructive" /> Weakest concepts</h2>
            {weakest.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Answer some practice questions and your personal weak spots will appear here.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {weakest.map((c) => {
                  const m = masteryOf(p, c.id);
                  return (
                    <Link key={c.id} to={`/learn/${c.courseId}/${c.id}`} className="clay-sm clay-press flex items-center justify-between px-3.5 py-2.5">
                      <span className="text-sm font-bold">{c.name}</span>
                      <span className="text-xs font-extrabold text-destructive">{m}%</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent mistakes */}
          <div className="clay p-6">
            <h2 className="flex items-center gap-2 text-lg font-extrabold"><TriangleAlert className="size-5 text-[#c08a2d]" /> Recent mistakes</h2>
            {p.errors.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No mistakes logged yet — or none you've made. Either way, nice.</p>
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                {topErrors.map(([cat, n]) => (
                  <div key={cat} className="clay-sm flex items-center justify-between px-3.5 py-2.5">
                    <span className="font-bold capitalize">{cat.replace("-", " ")} errors</span>
                    <span className="text-xs font-extrabold">{n}×</span>
                  </div>
                ))}
                <Link to="/mistakes" className="inline-flex items-center gap-1 pt-1 text-xs font-bold text-[var(--clay-primary-deep)]">
                  Analyze mistakes <ArrowRight className="size-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick practice */}
      <div className="clay mt-5 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><Sparkles className="size-5 text-[var(--clay-4)]" /> Warm up</h2>
          <p className="mt-1 text-sm text-muted-foreground">One conceptual question, right now — spaced repetition keeps mastery honest.</p>
        </div>
        <Button onClick={() => navigate("/practice")} className="clay-btn clay-press border-0 font-bold">Practice <ArrowRight className="ml-1 size-4" /></Button>
      </div>
    </div>
  );
}
