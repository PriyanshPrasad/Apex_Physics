import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowRight, Atom, Sigma, Target, FlaskConical, Map as MapIcon,
  Dumbbell, TriangleAlert, Sparkles, Route as RouteIcon, Moon, Sun, Calculator,
} from "lucide-react";
import { useState } from "react";
import { COURSES } from "@/data/curriculum";
import { M } from "@/components/math/Math";

const FEATURES = [
  { icon: RouteIcon, title: "Prerequisite engine", text: "Every lesson maps what it stands on. 'Why am I struggling?' traces your gap down the dependency graph — with mastery percentages on each link." },
  { icon: FlaskConical, title: "22 live simulations", text: "Drag charges, build circuits, launch projectiles, trace rays. Every concept you learn, you can grab with your hands." },
  { icon: Target, title: "Guided problem coach", text: "Graduated hints that teach the method — never answer-dumping. Recognition → setup → solve → check, every time." },
  { icon: Sigma, title: "Derivations, not memorization", text: "Where equations come from, shown step by step. Calculus and algebra treatments side by side with a toggle." },
  { icon: Dumbbell, title: "Unlimited generated practice", text: "Procedural problems at five difficulty levels, from warm-up to challenge, plus AP-style free response with rubrics." },
  { icon: TriangleAlert, title: "Mistake forensics", text: "Sign errors, wrong systems, missing forces — your errors are categorized and tracked into a personal fix-list." },
];

const CALCUVS = {
  algebra: { tex: "W = F d \\cos\\theta", note: "Constant force, straight-line motion. The AP 1/2 toolkit." },
  calculus: { tex: "W = \\int_{x_i}^{x_f} F(x)\\,dx", note: "Any force, any path — the C-course generalization that contains the other as a special case." },
};

export default function Landing() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [calc, setCalc] = useState<"algebra" | "calculus">("algebra");

  return (
    <div className="min-h-screen">
      {/* nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-8">
        <div className="flex items-center gap-2.5">
          <div className="clay-sm flex h-11 w-11 items-center justify-center bg-[var(--clay-4)] text-xl text-white">⚛</div>
          <div>
            <p className="text-base font-extrabold leading-tight">AP Physics Mastery</p>
            <p className="text-[11px] font-semibold text-muted-foreground">Don't memorize. Understand.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { const n = !dark; setDark(n); document.documentElement.classList.toggle("dark", n); localStorage.setItem("apm-theme", n ? "dark" : "light"); }}
            className="clay-sm clay-press flex h-10 w-10 items-center justify-center"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <Link to="/auth" className="clay-btn clay-press px-5 py-2.5 text-sm font-extrabold">Start free</Link>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-6xl px-4 pt-8 md:px-8 md:pt-14">
        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_1fr]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <span className="clay-tint inline-block px-4 py-1.5 text-xs font-extrabold text-[var(--clay-primary-deep)]">
              All four AP Physics courses · current College Board frameworks
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              Physics is a skill,<br />
              <span className="text-glow text-[var(--clay-primary-deep)]">not a formula hunt.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              An interactive textbook, tutor, simulator, and AP coach in one. Physics 1, Physics 2, and both Physics C courses —
              with a prerequisite engine that finds exactly where your understanding breaks down.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/auth" className="clay-btn clay-press px-7 py-3.5 text-sm font-extrabold">
                Start learning <ArrowRight className="ml-1.5 inline size-4" />
              </Link>
              <Link to="/auth?returnTo=%2Fdiagnostic" className="clay-sm clay-press px-6 py-3.5 text-sm font-extrabold">
                Find my physics level
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-muted-foreground">
              <span>✓ 4 courses · 15+ units</span>
              <span>✓ 40+ interactive lessons</span>
              <span>✓ 22 simulations</span>
              <span>✓ Free, progress saved locally</span>
            </div>
          </motion.div>

          {/* floating clay equation stack */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative mx-auto w-full max-w-md"
          >
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="clay p-6">
              <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Live from the curriculum</p>
              <div className="mt-3"><M>{"\\sum \\vec{F} = m\\vec{a}"}</M></div>
              <p className="mt-2 text-xs text-muted-foreground">Net force is the cause; acceleration is the effect.</p>
            </motion.div>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }} className="clay mt-4 p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Energy conservation</p>
                <span className="clay-sm px-2 py-0.5 text-[10px] font-extrabold text-[#3d9c82]">P1 + CM</span>
              </div>
              <div className="mt-3"><M>{"K_i + U_i = K_f + U_f"}</M></div>
              <p className="mt-2 text-xs text-muted-foreground">One law, four units, zero exceptions in a frictionless world.</p>
            </motion.div>
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.1 }} className="clay mx-auto mt-4 max-w-[80%] p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Gauss's law</p>
                <span className="clay-sm px-2 py-0.5 text-[10px] font-extrabold text-[#c08a2d]">C: E&M</span>
              </div>
              <div className="mt-3"><M>{"\\oint \\vec{E} \\cdot d\\vec{A} = \\dfrac{q_{enc}}{\\varepsilon_0}"}</M></div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* courses */}
      <section className="mx-auto mt-20 max-w-6xl px-4 md:px-8">
        <h2 className="text-center text-3xl font-black tracking-tight">Four courses. One connected map.</h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground">
          Shared concepts are taught once and linked everywhere they appear — with algebra and calculus treatments side by side.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {COURSES.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}>
              <Link to="/auth" className="clay clay-press block h-full p-6">
                <div className="flex items-center justify-between">
                  <span className="clay-sm px-3 py-1.5 text-xs font-black" style={{ color: c.color }}>{c.short}</span>
                  <span className="clay-sm px-2.5 py-1 text-[10px] font-extrabold uppercase">{c.math === "calculus" ? <Calculator className="inline size-3" /> : null} {c.math === "calculus" ? "Calculus" : "Algebra"}</span>
                </div>
                <h3 className="mt-3 text-lg font-extrabold">{c.name}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{c.blurb}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* algebra vs calculus toggle */}
      <section className="mx-auto mt-20 max-w-3xl px-4 md:px-8">
        <div className="clay p-8 text-center">
          <Sparkles className="mx-auto size-7 text-[#ffc46b]" />
          <h2 className="mt-3 text-2xl font-black tracking-tight">The same law, two depths</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Every shared concept carries a toggle. See why the calculus version contains the algebra version — and when each is the right tool.
          </p>
          <div className="mx-auto mt-5 flex w-fit gap-1.5 rounded-2xl bg-clay-2 p-1.5">
            {(["algebra", "calculus"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setCalc(k)}
                className={`clay-press rounded-xl px-5 py-2 text-xs font-extrabold ${calc === k ? "bg-[var(--clay-primary-tint)] text-[var(--clay-primary-deep)] shadow-sm" : "text-muted-foreground"}`}
              >
                {k === "algebra" ? "Algebra-based" : "Calculus-based"}
              </button>
            ))}
          </div>
          <div className="clay-eq mx-auto mt-5 max-w-md px-6 py-4 text-xl">
            <M>{CALCUVS[calc].tex}</M>
          </div>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">{CALCUVS[calc].note}</p>
        </div>
      </section>

      {/* features */}
      <section className="mx-auto mt-20 max-w-6xl px-4 md:px-8">
        <h2 className="text-center text-3xl font-black tracking-tight">Built like a tutor, not a textbook</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: (i % 3) * 0.08 }} className="clay p-6">
                <div className="clay-sm flex h-11 w-11 items-center justify-center">
                  <Icon className="size-5 text-[var(--clay-4)]" />
                </div>
                <h3 className="mt-4 text-base font-extrabold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{f.text}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* philosophy */}
      <section className="mx-auto mt-20 max-w-4xl px-4 md:px-8">
        <div className="clay p-8 md:p-10">
          <div className="flex items-center gap-3">
            <Atom className="size-6 text-[var(--clay-4)]" />
            <MapIcon className="size-6 text-[#6fd6c8]" />
            <Sigma className="size-6 text-[#ffc46b]" />
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight md:text-3xl">The questions you'll learn to ask</h2>
          <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {[
              "What is actually happening here?",
              "What system am I analyzing?",
              "What principles govern it?",
              "What representation should I draw?",
              "What assumptions am I making?",
              "Does my answer make physical sense?",
            ].map((q) => (
              <div key={q} className="clay-sm px-4 py-3 text-sm font-bold">{q}</div>
            ))}
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section className="mx-auto my-20 max-w-3xl px-4 text-center md:px-8">
        <h2 className="text-3xl font-black tracking-tight md:text-4xl">Start where you are.<br />Go as far as C: E&M.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Take the two-minute diagnostic and get a personalized roadmap — or jump straight into any course.
        </p>
        <Link to="/auth" className="clay-btn clay-press mt-6 inline-block px-8 py-4 text-sm font-extrabold">
          Begin — it's free <ArrowRight className="ml-1.5 inline size-4" />
        </Link>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        AP Physics Mastery · curriculum aligned to the current College Board AP Physics frameworks · original explanations and simulations
      </footer>
    </div>
  );
}
