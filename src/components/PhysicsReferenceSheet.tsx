import { useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import { COURSE_MAP, type CourseId } from "@/data/curriculum";
import { M } from "@/components/math/Math";
import { cn } from "@/lib/utils";

const COURSE_ORDER: CourseId[] = ["p1", "p2", "cm", "cem"];

type FormulaGroup = { title: string; formulas: { label: string; equation: string }[] };

const FORMULAS: Record<CourseId, FormulaGroup[]> = {
  p1: [
    { title: "Vectors and kinematics", formulas: [
      { label: "Components", equation: "A_x=A\\cos\\theta\\quad A_y=A\\sin\\theta" },
      { label: "Constant acceleration", equation: "v=v_0+at\\quad x=x_0+v_0t+\\frac12at^2" },
      { label: "Velocity-position", equation: "v^2=v_0^2+2a\\Delta x" },
      { label: "Projectile components", equation: "v_x=v_0\\cos\\theta\\quad v_y=v_0\\sin\\theta-gt" },
    ] },
    { title: "Forces and circular motion", formulas: [
      { label: "Newton's second law", equation: "\\sum F=ma" },
      { label: "Weight", equation: "F_g=mg" },
      { label: "Friction", equation: "f_k=\\mu_kN\\quad f_s\\le\\mu_sN" },
      { label: "Uniform circular motion", equation: "a_c=\\frac{v^2}{r}=\\omega^2r\\quad F_c=\\frac{mv^2}{r}" },
    ] },
    { title: "Energy and momentum", formulas: [
      { label: "Work", equation: "W=Fd\\cos\\theta" },
      { label: "Kinetic energy", equation: "K=\\frac12mv^2" },
      { label: "Gravitational potential", equation: "U_g=mgh" },
      { label: "Momentum and impulse", equation: "p=mv\\quad J=\\Delta p=F\\Delta t" },
    ] },
    { title: "Rotation and oscillations", formulas: [
      { label: "Torque", equation: "\\tau=rF\\sin\\theta" },
      { label: "Rotational dynamics", equation: "\\sum\\tau=I\\alpha" },
      { label: "Rotational kinetic energy", equation: "K_R=\\frac12I\\omega^2" },
      { label: "Spring period", equation: "T=2\\pi\\sqrt{\\frac{m}{k}}" },
      { label: "Pendulum period", equation: "T=2\\pi\\sqrt{\\frac{L}{g}}" },
    ] },
  ],
  p2: [
    { title: "Fluids and thermodynamics", formulas: [
      { label: "Pressure with depth", equation: "P=P_0+\\rho gh" },
      { label: "Buoyant force", equation: "F_B=\\rho_{fluid}V_{disp}g" },
      { label: "Ideal gas law", equation: "PV=nRT" },
      { label: "First law", equation: "\\Delta U=Q-W" },
      { label: "Efficiency", equation: "e=\\frac{W_{out}}{Q_{in}}" },
    ] },
    { title: "Electric fields and potential", formulas: [
      { label: "Coulomb force", equation: "F=k\\frac{|q_1q_2|}{r^2}" },
      { label: "Point-charge field", equation: "E=k\\frac{|q|}{r^2}" },
      { label: "Electric potential", equation: "V=k\\frac{q}{r}" },
      { label: "Potential energy", equation: "U=qV" },
      { label: "Field and potential", equation: "E=\\frac{\\Delta V}{\\Delta x}\\;\\text{(magnitude)}" },
    ] },
    { title: "Circuits and capacitors", formulas: [
      { label: "Ohm's law", equation: "V=IR" },
      { label: "Electrical power", equation: "P=IV=I^2R=\\frac{V^2}{R}" },
      { label: "Series resistance", equation: "R_{eq}=R_1+R_2+\\cdots" },
      { label: "Parallel resistance", equation: "\\frac1{R_{eq}}=\\frac1{R_1}+\\frac1{R_2}+\\cdots" },
      { label: "Capacitance", equation: "C=\\frac{Q}{V}\\quad U_C=\\frac12CV^2" },
    ] },
    { title: "Waves and optics", formulas: [
      { label: "Wave relationship", equation: "v=f\\lambda" },
      { label: "Refraction", equation: "n_1\\sin\\theta_1=n_2\\sin\\theta_2" },
      { label: "Thin lens / mirror", equation: "\\frac1f=\\frac1{d_o}+\\frac1{d_i}" },
      { label: "Magnification", equation: "m=\\frac{h_i}{h_o}=-\\frac{d_i}{d_o}" },
    ] },
  ],
  cm: [
    { title: "Calculus-based motion", formulas: [
      { label: "Velocity", equation: "v=\\frac{dx}{dt}" },
      { label: "Acceleration", equation: "a=\\frac{dv}{dt}=\\frac{d^2x}{dt^2}" },
      { label: "Integral relationships", equation: "\\Delta v=\\int a\\,dt\\quad \\Delta x=\\int v\\,dt" },
      { label: "Momentum form", equation: "\\vec F=\\frac{d\\vec p}{dt}" },
    ] },
    { title: "Work, energy, and momentum", formulas: [
      { label: "Variable-force work", equation: "W=\\int_{x_i}^{x_f}F(x)\\,dx" },
      { label: "Potential energy", equation: "F_x=-\\frac{dU}{dx}" },
      { label: "Impulse", equation: "\\vec J=\\int\\vec F\\,dt=\\Delta\\vec p" },
      { label: "Center of mass", equation: "x_{cm}=\\frac{\\sum m_ix_i}{\\sum m_i}" },
    ] },
    { title: "Rotation and gravitation", formulas: [
      { label: "Rotational dynamics", equation: "\\sum\\tau=I\\alpha" },
      { label: "Angular kinematics", equation: "\\omega=\\frac{d\\theta}{dt}\\quad \\alpha=\\frac{d\\omega}{dt}" },
      { label: "Rolling", equation: "v_{cm}=\\omega R" },
      { label: "Gravitational force", equation: "F_g=G\\frac{m_1m_2}{r^2}" },
    ] },
    { title: "Differential equations", formulas: [
      { label: "Simple harmonic motion", equation: "m\\frac{d^2x}{dt^2}=-kx" },
      { label: "SHM solution", equation: "x=A\\cos(\\omega t+\\phi)\\quad \\omega=\\sqrt{\\frac{k}{m}}" },
      { label: "Pendulum approximation", equation: "\\frac{d^2\\theta}{dt^2}=-\\frac{g}{L}\\theta" },
    ] },
  ],
  cem: [
    { title: "Electrostatics", formulas: [
      { label: "Continuous-charge field", equation: "d\\vec E=k\\frac{dq}{r^2}\\hat r\\quad \\vec E=\\int d\\vec E" },
      { label: "Gauss's law", equation: "\\oint\\vec E\\cdot d\\vec A=\\frac{Q_{enc}}{\\epsilon_0}" },
      { label: "Potential from field", equation: "\\Delta V=-\\int\\vec E\\cdot d\\vec l" },
      { label: "Potential energy", equation: "U=qV" },
    ] },
    { title: "Capacitors and circuits", formulas: [
      { label: "Capacitance", equation: "C=\\frac{Q}{V}" },
      { label: "RC time constant", equation: "\\tau=RC" },
      { label: "Charging capacitor", equation: "q(t)=CV\\left(1-e^{-t/RC}\\right)" },
      { label: "Discharging capacitor", equation: "q(t)=Q_0e^{-t/RC}" },
    ] },
    { title: "Magnetism and induction", formulas: [
      { label: "Magnetic force", equation: "\\vec F=q\\vec v\\times\\vec B" },
      { label: "Biot–Savart law", equation: "d\\vec B=\\frac{\\mu_0}{4\\pi}\\frac{I\\,d\\vec l\\times\\hat r}{r^2}" },
      { label: "Ampère's law", equation: "\\oint\\vec B\\cdot d\\vec l=\\mu_0I_{enc}" },
      { label: "Faraday's law", equation: "\\mathcal E=-\\frac{d\\Phi_B}{dt}" },
      { label: "Magnetic flux", equation: "\\Phi_B=\\int\\vec B\\cdot d\\vec A" },
    ] },
    { title: "RL and RLC models", formulas: [
      { label: "Inductor voltage", equation: "V_L=L\\frac{dI}{dt}" },
      { label: "RL time constant", equation: "\\tau_L=\\frac{L}{R}" },
      { label: "Inductor energy", equation: "U_L=\\frac12LI^2" },
      { label: "Kirchhoff loop rule", equation: "\\sum\\Delta V=0" },
    ] },
  ],
};

export function PhysicsReferenceSheet({ initialCourse, compact = false }: { initialCourse?: CourseId; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [course, setCourse] = useState<CourseId>(initialCourse ?? "p1");
  const [lastInitial, setLastInitial] = useState<CourseId | undefined>(initialCourse);

  // Follow a changed initial course without an effect cascade.
  if (initialCourse !== lastInitial) {
    setLastInitial(initialCourse);
    if (initialCourse) setCourse(initialCourse);
  }

  return (
    <section className={cn("clay-sm", compact ? "mb-4" : "mb-5")} aria-label="Physics reference sheet">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="flex items-center gap-2 text-sm font-extrabold"><BookOpen className="size-4 text-[var(--clay-primary-deep)]" /> Physics reference sheet <span className="text-xs font-semibold text-muted-foreground">{COURSE_MAP[course].short}</span></span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Physics course formulas">
            {COURSE_ORDER.map((id) => (
              <button key={id} type="button" role="tab" aria-selected={course === id} onClick={() => setCourse(id)} className={cn("clay-press rounded-lg px-3 py-1.5 text-xs font-extrabold", course === id ? "bg-[var(--clay-primary-tint)] text-[var(--clay-primary-deep)] ring-1 ring-[var(--clay-4)]" : "text-muted-foreground")}>
                {COURSE_MAP[id].short}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {FORMULAS[course].map((group) => (
              <div key={group.title} className="clay-inset p-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{group.title}</h3>
                <div className="mt-2 space-y-2">
                  {group.formulas.map((formula) => <div key={formula.label} className="rounded-lg border border-border/40 bg-background/30 px-2.5 py-2"><p className="text-[11px] font-bold text-muted-foreground">{formula.label}</p><div className="mt-1 overflow-x-auto text-sm"><M>{formula.equation}</M></div></div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
