import { useMemo, useState } from "react";
import { Sigma, Search } from "lucide-react";
import { CONCEPTS, COURSE_MAP, COURSES, type CourseId } from "@/data/curriculum";
import { M } from "@/components/math/Math";
import { cn } from "@/lib/utils";

interface EqEntry {
  tex: string;
  label: string;
  where: string;
  courses: CourseId[];
  conceptId: string;
  conceptName: string;
  unit: number;
}

export default function Equations() {
  const [q, setQ] = useState("");
  const [course, setCourse] = useState<CourseId | "all">("all");

  const entries: EqEntry[] = useMemo(
    () =>
      CONCEPTS.flatMap((c) =>
        c.equations.map((e) => ({
          ...e,
          conceptId: c.id,
          conceptName: c.name,
          unit: c.unit,
        })),
      ),
    [],
  );

  const filtered = entries.filter((e) => {
    if (course !== "all" && !e.courses.includes(course)) return false;
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (
      e.label.toLowerCase().includes(needle) ||
      e.conceptName.toLowerCase().includes(needle) ||
      e.where.toLowerCase().includes(needle) ||
      e.tex.toLowerCase().includes(needle)
    );
  });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight"><Sigma className="size-7 text-[var(--clay-4)]" /> Equation library</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every equation with its meaning and usage limits — not a formula sheet to memorize, a toolbox to understand.
      </p>

      <div className="clay mt-5 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, concept, or when to use it…"
            className="clay-inset w-full py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCourse("all")}
            className={cn("clay-sm clay-press px-3 py-1.5 text-xs font-bold", course === "all" && "text-[var(--clay-primary-deep)]")}
            style={course === "all" ? { background: "var(--clay-primary-tint)" } : undefined}
          >
            All
          </button>
          {COURSES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCourse(c.id)}
              className={cn("clay-sm clay-press px-3 py-1.5 text-xs font-bold", course === c.id && "text-[var(--clay-primary-deep)]")}
              style={course === c.id ? { background: "var(--clay-primary-tint)" } : undefined}
            >
              {c.short}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {filtered.map((e, i) => (
          <div key={i} className="clay p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-extrabold">{e.label}</p>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Unit {e.unit} · {e.conceptName}
                </p>
              </div>
              <div className="flex gap-1">
                {e.courses.map((cid) => (
                  <span key={cid} className="clay-sm px-2 py-0.5 text-[10px] font-extrabold" style={{ color: COURSE_MAP[cid].color }}>
                    {COURSE_MAP[cid].short}
                  </span>
                ))}
              </div>
            </div>
            <div className="clay-eq mt-3 px-4 py-3 text-center"><M>{e.tex}</M></div>
            <p className="mt-3 text-sm text-muted-foreground"><strong className="text-foreground">Use when:</strong> {e.where}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="clay p-6 text-center text-sm text-muted-foreground">No equations match — try a broader term.</p>
        )}
      </div>
    </div>
  );
}
