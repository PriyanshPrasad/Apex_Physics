import { Link } from "react-router";
import { ArrowDown } from "lucide-react";
import { CONCEPT_MAP, COURSE_MAP, type CourseId } from "@/data/curriculum";
import { useProgress, masteryOf } from "@/lib/progress";

function conceptName(id: string): string {
  return CONCEPT_MAP[id]?.name ?? id.replace(/^f-/, "").replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function Node({ id, to }: { id: string; to: string }) {
  const p = useProgress();
  const m = masteryOf(p, id);
  const known = CONCEPT_MAP[id];
  const course = known ? COURSE_MAP[known.courseId] : null;
  return (
    <Link
      to={to}
      className="clay-sm clay-press block px-4 py-3 text-center"
      style={m >= 70 ? { background: "rgba(111,214,200,0.25)" } : undefined}
    >
      <p className="text-sm font-extrabold">{conceptName(id)}</p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {course ? course.short : "foundation"}{m > 0 ? ` · ${m}%` : ""}
      </p>
    </Link>
  );
}

function Chain({ title, ids }: { title: string; ids: string[] }) {
  return (
    <div className="clay p-5">
      <h2 className="text-center text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="mt-4 flex flex-col items-center gap-1">
        {ids.map((id, i) => (
          <div key={id} className="flex w-full flex-col items-center">
            {i > 0 && <ArrowDown className="my-0.5 size-4 text-muted-foreground" />}
            <div className="w-full max-w-[240px]">
              <Node id={id} to={CONCEPT_MAP[id] ? `/learn/${CONCEPT_MAP[id].courseId}/${id}` : "/diagnostic"} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function KnowledgeMap() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Physics knowledge map</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every idea in physics stands on the ones below it. Click any node to open its lesson — green means strong mastery.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Chain title="Mechanics chain" ids={["f-algebra", "p1-vectors", "p1-kinematics", "p1-newton2", "p1-work", "p1-momentum", "p1-torque", "p1-shm"]} />
        <Chain title="Rotation chain" ids={["p1-angular-kin", "p1-torque", "p1-rot-dynamics", "p1-rot-energy", "p1-angular-momentum", "p1-rolling", "p1-gravitation-orbits"]} />
        <Chain title="E&M chain" ids={["p2-charge-force", "p2-e-field", "p2-potential", "p2-current-ohm", "p2-series-parallel", "cem-gauss", "cem-magnetism", "cem-induction"]} />
        <Chain title="Fields & quanta chain" ids={["p2-ideal-gas", "p2-heat-energy", "p2-entropy", "p2-waves", "p2-interference", "p2-refraction", "p2-lenses-mirrors", "p2-photoelectric"]} />
      </div>
      <div className="clay mt-4 p-5 text-sm text-muted-foreground">
        <strong className="text-foreground">Reading the map:</strong> arrows mean "is required by". If a node feels shaky, trace downward — the gap is almost always below, not at, the node you're stuck on. The calculus-based C-course versions ({["cm-calculus-kin", "cm-work-integral", "cem-gauss", "cem-rc-circuits"].map((id) => CONCEPT_MAP[id]?.name).filter(Boolean).join(", ")}) hang off these same chains.
      </div>
    </div>
  );
}
