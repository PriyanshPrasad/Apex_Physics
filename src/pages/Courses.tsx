import { Link } from "react-router";
import { Blocks, ChevronRight, Sigma, Shapes, ArrowRight, Link2 } from "lucide-react";
import { COURSES, UNITS_BY_COURSE, type CourseId } from "@/data/curriculum";
import { useProgress, masteryOf } from "@/lib/progress";

// Topic coverage matrix — mirrors how the four exams divide content.
const TOPICS: { area: string; has: CourseId[] }[] = [
  { area: "Kinematics & motion", has: ["p1", "cm"] },
  { area: "Forces & dynamics", has: ["p1", "cm"] },
  { area: "Energy & momentum", has: ["p1", "cm"] },
  { area: "Rotation & orbits", has: ["p1", "cm"] },
  { area: "Oscillations", has: ["p1", "cm"] },
  { area: "Fluids", has: ["p1"] },
  { area: "Thermodynamics", has: ["p2"] },
  { area: "Electric force, field & potential", has: ["p2", "cem"] },
  { area: "Circuits (DC + RC)", has: ["p2", "cem"] },
  { area: "Magnetism & induction", has: ["p2", "cem"] },
  { area: "Geometric optics", has: ["p2"] },
  { area: "Waves, sound & physical optics", has: ["p2"] },
  { area: "Modern physics", has: ["p2"] },
];

const MATH: Record<CourseId, string> = { p1: "Algebra + trig", p2: "Algebra + trig", cm: "Calculus", cem: "Calculus" };

export default function Courses() {
  const p = useProgress();
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight">
        <Blocks className="size-7 text-[var(--clay-4)]" /> Courses
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        The four AP Physics exams side by side — what each covers, how they connect, and where you stand in each.
      </p>

      {/* Coverage matrix */}
      <div className="clay mt-6 overflow-x-auto p-5">
        <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
          <Shapes className="size-4" /> Topic coverage
        </h2>
        <table className="mt-3 w-full min-w-[560px] text-sm">
          <thead>
            <tr>
              <th className="pb-2 text-left text-xs font-extrabold">Topic area</th>
              {COURSES.map((c) => (
                <th key={c.id} className="pb-2 text-center text-xs font-extrabold" style={{ color: c.color }}>{c.short}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TOPICS.map((t) => (
              <tr key={t.area} className="border-t border-border/40">
                <td className="py-2 font-semibold">{t.area}</td>
                {COURSES.map((c) => (
                  <td key={c.id} className="py-2 text-center">
                    {t.has.includes(c.id) ? (
                      <span className="font-bold text-[#3d9c82]">✓</span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t-2 border-border/60">
              <td className="py-2 font-extrabold">Math required</td>
              {COURSES.map((c) => (
                <td key={c.id} className="py-2 text-center text-xs font-bold">{MATH[c.id]}</td>
              ))}
            </tr>
          </tbody>
        </table>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Counts in parentheses are interactive lessons on this site. The C exams teach mechanics / E&M with derivatives and integrals; Physics 1/2 reach the same ideas with algebra.
        </p>
      </div>

      {/* Course cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {COURSES.map((c) => {
          const units = UNITS_BY_COURSE[c.id];
          const concepts = units.flatMap((u) => u.conceptIds);
          const avg = concepts.length ? Math.round(concepts.reduce((s, cid) => s + masteryOf(p, cid), 0) / concepts.length) : 0;
          const done = concepts.filter((cid) => (p.completedLessons[cid] ?? 0) >= 100).length;
          return (
            <div key={c.id} className="clay p-5">
              <div className="flex items-center justify-between">
                <span className="clay-sm px-3 py-1 text-sm font-extrabold" style={{ color: c.color }}>{c.short}</span>
                <span className="clay-sm px-2 py-0.5 text-[10px] font-bold uppercase">{MATH[c.id]}</span>
              </div>
              <h2 className="mt-3 text-lg font-extrabold leading-snug">{c.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{c.blurb}</p>
              <div className="mt-3 flex items-center gap-3 text-xs font-bold text-muted-foreground">
                <span>{units.length} units</span>
                <span>·</span>
                <span>{concepts.length} lessons</span>
                <span>·</span>
                <span>{done} completed</span>
              </div>
              <div className="clay-inset mt-3 h-3">
                <div className="h-3 rounded-full bg-gradient-to-r from-[#6fd6c8] to-[var(--clay-4)] transition-all" style={{ width: `${Math.max(3, avg)}%` }} />
              </div>
              <p className="mt-1 text-[11px] font-bold text-muted-foreground">Average mastery: {avg}%</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/learn/${c.id}`} className="clay-btn clay-press inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold">
                  Open course <ArrowRight className="size-3.5" />
                </Link>
                <Link to="/compare" className="clay-sm clay-press px-3 py-2 text-xs font-bold text-muted-foreground">Compare in detail</Link>
              </div>
              {/* Unit chips */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {units.slice(0, 8).map((u) => (
                  <Link key={u.id} to={`/learn/${c.id}`} className="clay-sm clay-press px-2 py-1 text-[10px] font-bold text-muted-foreground">
                    {u.num}. {u.name.length > 22 ? u.name.slice(0, 22) + "…" : u.name}
                  </Link>
                ))}
                {units.length > 8 && <span className="px-1 py-1 text-[10px] text-muted-foreground">+{units.length - 8} more</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* How the courses connect */}
      <div className="clay mt-6 p-5">
        <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
          <Link2 className="size-4" /> How the courses connect
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="clay-sm p-4 text-sm">
            <p className="font-extrabold">Mechanics chain</p>
            <p className="mt-1 leading-6 text-muted-foreground">
              Physics 1 kinematics → forces → energy → momentum → rotation. <strong>C: Mechanics</strong> rebuilds the
              same chain with calculus: derivatives replace slope-reading, integrals replace graph areas. Take Physics 1
              first (or concurrently) unless your calculus is already fluent.
            </p>
          </div>
          <div className="clay-sm p-4 text-sm">
            <p className="font-extrabold">E&M chain</p>
            <p className="mt-1 leading-6 text-muted-foreground">
              Physics 2 charge → field → potential → circuits → magnetism → induction. <strong>C: E&M</strong> covers the
              identical sequence with Gauss's law, potential integrals, and RC differential equations. Physics 2 is the
              conceptual foundation; C: E&M is the calculus treatment.
            </p>
          </div>
        </div>
        <div className="clay-tint mt-3 flex flex-wrap items-center gap-2 p-4 text-sm">
          <Sigma className="size-4 shrink-0 text-[var(--clay-4)]" />
          <span className="font-semibold">Not sure where to start?</span>
          <Link to="/diagnostic" className="inline-flex items-center gap-1 font-bold text-[var(--clay-primary-deep)]">
            Take the readiness diagnostic <ChevronRight className="size-3.5" />
          </Link>
          <span className="text-muted-foreground">— it tests algebra through calculus and recommends a course.</span>
        </div>
      </div>
    </div>
  );
}
