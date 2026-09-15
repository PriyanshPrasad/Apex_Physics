import { Link } from "react-router";
import { TriangleAlert, ArrowRight } from "lucide-react";
import { useProgress } from "@/lib/progress";
import { CONCEPT_MAP, CONCEPTS } from "@/data/curriculum";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  conceptual: "Conceptual error",
  "wrong-equation": "Wrong equation",
  "wrong-system": "Wrong system",
  "missing-force": "Missing force",
  sign: "Sign error",
  vector: "Vector error",
  algebra: "Algebra slip",
  unit: "Unit error",
  graph: "Graph misread",
  calculus: "Calculus error",
  assumption: "Assumption error",
};

function conceptName(id: string): string {
  return CONCEPT_MAP[id]?.name ?? id.replace(/^f-/, "").replace(/-/g, " ");
}

export default function Mistakes() {
  const p = useProgress();
  const counts = p.errors.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1;
    return acc;
  }, {});
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = ranked[0]?.[1] ?? 1;

  const insights = ranked.slice(0, 3).map(([cat, n]) => {
    const label = CATEGORY_LABELS[cat] ?? cat;
    const conceptCount = new Set(p.errors.filter((e) => e.category === cat).map((e) => e.conceptId)).size;
    return `You've made ${n} ${label.toLowerCase()}${label.toLowerCase().endsWith("s") ? "" : "s"} across ${conceptCount} concept${conceptCount > 1 ? "s" : ""} — pattern worth attacking directly.`;
  });

  const recent = p.errors.slice(0, 10);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight"><TriangleAlert className="size-7 text-[#c08a2d]" /> Why did I get this wrong?</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Mistakes aren't failures — they're data. Every logged error is categorized and tracked so your study plan targets the pattern, not the symptom.
      </p>

      {p.errors.length === 0 ? (
        <div className="clay mt-6 p-8 text-center">
          <p className="text-sm text-muted-foreground">No mistakes logged yet. Answer practice questions and this page becomes your personal error profile.</p>
          <Link to="/practice" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[var(--clay-primary-deep)]">
            Go to practice <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="clay mt-6 p-6">
            <h2 className="text-lg font-extrabold">Your error profile</h2>
            <div className="mt-4 space-y-3">
              {ranked.map(([cat, n]) => (
                <div key={cat}>
                  <div className="flex justify-between text-xs font-bold">
                    <span>{CATEGORY_LABELS[cat] ?? cat}</span>
                    <span className="text-muted-foreground">{n}×</span>
                  </div>
                  <div className="clay-inset mt-1 h-2.5">
                    <div className="h-2.5 rounded-full bg-[#ffc46b]" style={{ width: `${(n / max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {insights.length > 0 && (
            <div className="clay-tint mt-4 p-5">
              <h2 className="text-sm font-extrabold">What this says about your studying</h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {insights.map((s, i) => <li key={i}>• {s}</li>)}
              </ul>
            </div>
          )}

          <div className="clay mt-4 p-6">
            <h2 className="text-lg font-extrabold">Recent mistakes</h2>
            <div className="mt-3 space-y-2">
              {recent.map((e) => {
                const c = CONCEPT_MAP[e.conceptId];
                return (
                  <Link
                    key={e.id}
                    to={c ? `/learn/${c.courseId}/${c.id}` : "/practice"}
                    className="clay-sm clay-press flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-bold">{c?.name ?? e.conceptId}</p>
                      <p className="text-[11px] font-semibold text-muted-foreground">{CATEGORY_LABELS[e.category] ?? e.category} · {new Date(e.at).toLocaleDateString()}</p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      <h2 className="mt-8 text-xl font-extrabold">Common mistakes database</h2>
      <p className="mt-1 text-sm text-muted-foreground">The classic traps for each concept — and why each one is wrong.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {CONCEPTS.filter((c) => c.mistakes.length > 0).slice(0, 24).map((c) => (
          <div key={c.id} className="clay p-4">
            <p className="text-sm font-extrabold">{c.name}</p>
            <div className="mt-2 space-y-2">
              {c.mistakes.map((m, i) => (
                <div key={i} className="clay-sm p-3 text-xs">
                  <p className="font-bold text-destructive">✗ {m.wrong}</p>
                  <p className="mt-1 text-muted-foreground">✓ {m.why}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
