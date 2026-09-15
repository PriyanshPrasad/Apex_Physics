import { Scale } from "lucide-react";
import { COURSES } from "@/data/curriculum";
import { cn } from "@/lib/utils";

const ROWS: { label: string; values: [boolean, boolean, boolean, boolean]; note?: string }[] = [
  { label: "Algebra & trigonometry", values: [true, true, true, true] },
  { label: "Calculus (derivatives & integrals)", values: [false, false, true, true] },
  { label: "Mechanics (motion, forces, energy)", values: [true, false, true, false] },
  { label: "Fluids & thermodynamics", values: [true, true, false, false] },
  { label: "Electricity & circuits", values: [false, true, false, true] },
  { label: "Magnetism & induction", values: [false, true, false, true] },
  { label: "Optics & waves", values: [false, true, false, false] },
  { label: "Modern & nuclear physics", values: [false, true, false, false] },
  { label: "Oscillations & gravitation", values: [true, false, true, false] },
];

const PREREQ_NOTES: { course: string; text: string }[] = [
  { course: "Physics 1", text: "Entry point. Requires strong algebra and trig — everything else is built inside the course." },
  { course: "Physics 2", text: "Best after Physics 1 (energy, momentum, pressure). Full algebra toolkit assumed." },
  { course: "C: Mechanics", text: "Requires concurrent or completed calculus: derivatives, integrals, simple differential equations." },
  { course: "C: E&M", text: "Requires C-level calculus fluency (integration with symmetry, exponential ODEs). Physics C: Mechanics recommended first, not required." },
];

export default function Compare() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight"><Scale className="size-7 text-[var(--clay-4)]" /> Compare courses</h1>
      <p className="mt-1 text-sm text-muted-foreground">Which AP physics fits your year? The honest matrix — content, math level, and how they chain together.</p>

      <div className="clay mt-6 overflow-x-auto p-6">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left">
              <th className="pb-3 pr-4" />
              {COURSES.map((c) => (
                <th key={c.id} className="pb-3 text-center">
                  <span className="block text-xs font-extrabold" style={{ color: c.color }}>{c.short}</span>
                  <span className="block text-[10px] font-semibold text-muted-foreground">{c.math === "calculus" ? "calc-based" : "algebra-based"}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, ri) => (
              <tr key={r.label} className={cn(ri % 2 === 0 && "bg-clay-2/50")}>
                <td className="py-2.5 pr-4 font-semibold">{r.label}</td>
                {r.values.map((v, i) => (
                  <td key={i} className="py-2.5 text-center font-extrabold">
                    {v ? <span className="text-[#3d9c82]">✓</span> : <span className="text-muted-foreground/50">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-6 text-xl font-extrabold">How they chain</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {PREREQ_NOTES.map((n) => (
          <div key={n.course} className="clay-sm p-4">
            <p className="text-sm font-extrabold">{n.course}</p>
            <p className="mt-1 text-sm text-muted-foreground">{n.text}</p>
          </div>
        ))}
      </div>

      <div className="clay-tint mt-6 p-5 text-sm">
        <p className="font-extrabold">Same concept, two depths</p>
        <p className="mt-1 text-muted-foreground">
          Kinematics, energy, momentum, torque, SHM appear in both Physics 1 and C: Mechanics; fields, potential, circuits, and magnetism appear in both Physics 2 and C: E&M.
          This platform shares those concepts between courses and adds the calculus treatment where the C course requires it — you never learn the same thing twice as if it were new.
        </p>
      </div>
    </div>
  );
}
