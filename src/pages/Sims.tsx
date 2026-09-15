import { useState } from "react";
import { Atom } from "lucide-react";
import { SIMS } from "@/sims/registry";
import { SimFallback } from "@/sims/framework";
import { cn } from "@/lib/utils";

const SIM_META: { key: string; name: string; blurb: string; course: string }[] = [
  { key: "vectors", name: "Vector Components", blurb: "Drag magnitude and angle; watch components project.", course: "P1 · CM" },
  { key: "kinematics", name: "Motion Graphs", blurb: "Constant-a motion with live x–t and v–t graphs.", course: "P1 · CM" },
  { key: "projectile", name: "Projectile Launcher", blurb: "Angle, speed, component arrows, ghost trails.", course: "P1" },
  { key: "fbd", name: "Ramp & Free-Body", blurb: "Tilt the ramp; forces and acceleration respond.", course: "P1" },
  { key: "circular", name: "Circular Motion", blurb: "Velocity tangent, acceleration inward.", course: "P1 · CM" },
  { key: "energy", name: "Energy Coaster", blurb: "K ↔ U trading bars, optional friction.", course: "P1" },
  { key: "collision", name: "Collision Lab", blurb: "Elastic vs inelastic; momentum bars.", course: "P1 · CM" },
  { key: "rotation", name: "Rotational Inertia", blurb: "Hoop vs disk vs sphere spin-up race.", course: "P1 · CM" },
  { key: "torque", name: "Torque Seesaw", blurb: "Balance torques, not forces.", course: "P1 · CM" },
  { key: "shm", name: "SHM Oscillator", blurb: "Spring or pendulum, live energy split.", course: "P1 · CM" },
  { key: "rolling", name: "Rolling Race", blurb: "Hoop vs disk vs sphere — shape decides.", course: "P1 · CM" },
  { key: "fluids", name: "Pressure & Buoyancy", blurb: "Depth, density, floating equilibrium.", course: "P1" },
  { key: "gas", name: "Gas Particles", blurb: "Temperature, volume, and pressure from collisions.", course: "P2" },
  { key: "charges", name: "Charge Field Studio", blurb: "Drag charges; field lines and vector field.", course: "P2 · CEM" },
  { key: "circuits", name: "Circuit Builder", blurb: "Battery, resistors, bulbs — series loop analysis.", course: "P2 · CEM" },
  { key: "rc", name: "RC Circuit", blurb: "Exponential charge/discharge with τ = RC.", course: "CEM" },
  { key: "magnetism", name: "Magnetic Fields", blurb: "Wire, loop, and circling charges.", course: "P2 · CEM" },
  { key: "optics", name: "Ray Optics", blurb: "Converging, diverging, concave & convex — true ray tracing.", course: "P2" },
  { key: "waves", name: "Wave Studio", blurb: "Traveling, standing, interference, Doppler.", course: "P2" },
  { key: "decay", name: "Radioactive Decay", blurb: "Random nuclei, lawful half-life curve.", course: "P2" },
  { key: "photoelectric", name: "Photoelectric Effect", blurb: "Photon energy vs intensity.", course: "P2" },
  { key: "orbital", name: "Orbital Mechanics", blurb: "Kepler's third law in motion.", course: "P1 · CM" },
  { key: "calculus", name: "Calculus Explorer", blurb: "Tangents and areas — derivatives ↔ integrals.", course: "CM · CEM" },
];

export default function Sims() {
  const [sel, setSel] = useState(SIM_META[0].key);
  const Sim = SIMS[sel];
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight"><Atom className="size-7 text-[var(--clay-4)]" /> Simulations</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every simulation is interactive — drag, slide, and toggle. This is where intuition is built.</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {SIM_META.map((s) => (
            <button
              key={s.key}
              onClick={() => setSel(s.key)}
              className={cn("clay-sm clay-press px-4 py-3 text-left", sel === s.key && "ring-2 ring-[var(--clay-4)]")}
            >
              <p className="text-sm font-extrabold">{s.name}</p>
              <p className="text-[11px] text-muted-foreground">{s.blurb}</p>
              <p className="mt-1 text-[10px] font-extrabold uppercase text-[var(--clay-primary-deep)]">{s.course}</p>
            </button>
          ))}
        </div>
        <div className="clay p-5">
          <h2 className="text-lg font-extrabold">{SIM_META.find((s) => s.key === sel)?.name}</h2>
          {Sim && <SimFallback key={sel} name={sel}><Sim /></SimFallback>}
        </div>
      </div>
    </div>
  );
}
