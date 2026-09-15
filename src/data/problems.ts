// Procedural practice problem engine — generates infinite, parameterized problems
// from concept templates. Numbers are randomized; the solution method is not.

export type Difficulty = "easy" | "medium" | "hard" | "ap" | "challenge";

export interface GenProblem {
  id: string;
  conceptId: string;
  difficulty: Difficulty;
  prompt: string; // may contain {eq}...{/eq} markers for math rendering
  choices: string[];
  correct: number;
  hints: string[];
  category?: string; // error category if answered wrong
}

type Generator = (d: Difficulty, rnd: () => number) => Omit<GenProblem, "id" | "conceptId" | "difficulty">;

function ri(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function round(n: number, digits = 2) {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}

// ---- helpers to build plausible distractors ----
function uniq(nums: number[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const n of nums) {
    const r = round(n, 2);
    if (!seen.has(r)) {
      seen.add(r);
      out.push(r);
    }
  }
  return out;
}

function pick4(correct: number, distractors: number[], digits = 2): { choices: string[]; correct: number } {
  const all = uniq([correct, ...distractors]).slice(0, 4);
  while (all.length < 4) all.push(round(correct * (1 + all.length * 0.5) + 1, digits));
  const shuffled = all
    .map((v) => ({ v, k: Math.random() }))
    .sort((a, b) => a.k - b.k)
    .map((o) => o.v);
  const idx = shuffled.findIndex((v) => Math.abs(v - round(correct, digits)) < 1e-9);
  return { choices: shuffled.map((v) => String(round(v, digits))), correct: idx };
}

interface Template {
  conceptId: string;
  gen: Generator;
}

const TEMPLATES: Template[] = [
  // ---------------- Kinematics ----------------
  {
    conceptId: "p1-kinematics",
    gen: (_d, _r) => {
      const v0 = ri(2, 15);
      const a = ri(1, 6);
      const t = ri(2, 8);
      const v = v0 + a * t;
      const p = pick4(v, [v0, a * t, v + a * t, v0 * t]);
      return {
        prompt: `A cart starts at {eq}v_0 = ${v0}\\text{ m/s}{/eq} and accelerates uniformly at {eq}${a}\\text{ m/s}^2{/eq} for ${t} s. What is its final velocity?`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "List what you know: v₀, a, t. Which equation links them to v?",
          "Use v = v₀ + at — constant acceleration.",
          `Compute: v = ${v0} + ${a}·${t}.`,
        ],
        category: "wrong-equation",
      };
    },
  },
  {
    conceptId: "p1-kinematics",
    gen: (_d, _r) => {
      const v0 = 0;
      const a = ri(2, 10);
      const t = ri(2, 6);
      const x = 0.5 * a * t * t;
      const p = pick4(x, [a * t, a * t * t, x / 2, x + t]);
      return {
        prompt: `An object starts from rest and accelerates at {eq}${a}\\text{ m/s}^2{/eq}. How far does it travel in ${t} s?`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "From rest means v₀ = 0.",
          "Use x = v₀t + ½at².",
          `x = ½·${a}·${t}².`,
        ],
        category: "algebra",
      };
    },
  },
  {
    conceptId: "p1-projectiles",
    gen: (_d, _r) => {
      const v = ri(10, 40);
      const angle = [30, 45, 60][ri(0, 2)];
      const vy = v * Math.sin((angle * Math.PI) / 180);
      const t = (2 * vy) / 9.8;
      const p = pick4(t, [vy / 9.8, (2 * v) / 9.8, t * 2, v / 9.8]);
      return {
        prompt: `A projectile is launched at {eq}${v}\\text{ m/s}{/eq} at ${angle}° above horizontal (level ground). What is its total flight time?`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "Split the launch velocity into components first.",
          "Time up + time down: use v_y at the top = 0, then double.",
          `v_y = ${v}·sin(${angle}°) = ${round(vy)}, then t = 2·v_y/g.`,
        ],
        category: "vector",
      };
    },
  },
  // ---------------- Forces ----------------
  {
    conceptId: "p1-friction",
    gen: (_d, _r) => {
      const m = ri(2, 20);
      const mu = round(0.1 * ri(2, 8), 1);
      const f = round(mu * m * 9.8, 2);
      const p = pick4(f, [mu * m, m * 9.8, f / 2, f + mu]);
      return {
        prompt: `A ${m} kg block slides on a surface with {eq}\\mu_k = ${mu}{/eq}. What is the kinetic friction force? (g = 9.8 m/s²)`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "Friction depends on the normal force, not directly on mass.",
          "F_N = mg on flat ground, then f_k = μ_k·F_N.",
          `f = ${mu}·${m}·9.8.`,
        ],
        category: "wrong-equation",
      };
    },
  },
  {
    conceptId: "p1-newton2",
    gen: (_d, _r) => {
      const F = ri(20, 200);
      const m = ri(2, 30);
      const a = round(F / m, 2);
      const p = pick4(a, [F * m, m / F, a * 2, a / 2]);
      return {
        prompt: `A net force of ${F} N acts on a ${m} kg object. Find the acceleration.`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "Newton's second law relates net force, mass, and acceleration.",
          "ΣF = ma, so a = ΣF/m.",
          `a = ${F}/${m}.`,
        ],
        category: "wrong-equation",
      };
    },
  },
  {
    conceptId: "p1-circular-force",
    gen: (_d, _r) => {
      const m = ri(1, 5);
      const v = ri(4, 20);
      const r = ri(2, 12);
      const F = round((m * v * v) / r, 2);
      const p = pick4(F, [(m * v) / r, m * v * v * r, F / 2, (m * v) / (2 * r)]);
      return {
        prompt: `A ${m} kg ball swings in a circle of radius ${r} m at ${v} m/s. What inward force is required?`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "What acceleration does circular motion require?",
          "a_c = v²/r; then F = m·a_c.",
          `F = ${m}·${v}²/${r}.`,
        ],
        category: "wrong-equation",
      };
    },
  },
  // ---------------- Energy ----------------
  {
    conceptId: "p1-energy-conservation",
    gen: (_d, _r) => {
      const m = ri(1, 10);
      const h = ri(2, 30);
      const ke = round(m * 9.8 * h, 2);
      const p = pick4(ke, [m * h, m * 9.8 * h * 2, ke / 2, m * 9.8 / h]);
      return {
        prompt: `A ${m} kg object falls from height ${h} m. Ignoring air resistance, what is its kinetic energy just before impact?`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "All gravitational potential energy becomes kinetic energy.",
          "U = mgh converts fully to K.",
          `K = ${m}·9.8·${h}.`,
        ],
        category: "conceptual",
      };
    },
  },
  {
    conceptId: "p1-work",
    gen: (_d, _r) => {
      const F = ri(10, 100);
      const d = ri(2, 20);
      const theta = [0, 30, 45, 60][ri(0, 3)];
      const w = round(F * d * Math.cos((theta * Math.PI) / 180), 2);
      const p = pick4(w, [F * d, F * d * Math.sin((theta * Math.PI) / 180), -w, F * d * Math.cos((theta * Math.PI) / 90)]);
      return {
        prompt: `A force of ${F} N acts over ${d} m at ${theta}° to the displacement. How much work is done?`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "Only the component of force along the motion does work.",
          "W = F·d·cos θ.",
          `W = ${F}·${d}·cos(${theta}°).`,
        ],
        category: "vector",
      };
    },
  },
  // ---------------- Momentum ----------------
  {
    conceptId: "p1-momentum",
    gen: (_d, _r) => {
      const m1 = ri(1, 10);
      const v1 = ri(2, 20);
      const J = round(m1 * v1, 2);
      const p = pick4(J, [m1 * v1 * 2, v1 / m1, J / 2, m1 + v1]);
      return {
        prompt: `A ${m1} kg cart moves at ${v1} m/s. What impulse would bring it to rest?`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "Impulse equals the change in momentum.",
          "J = Δp = m·Δv. Stopping means Δv = −v.",
          `|J| = ${m1}·${v1}.`,
        ],
        category: "conceptual",
      };
    },
  },
  {
    conceptId: "p1-collisions",
    gen: (_d, _r) => {
      const m1 = ri(1, 8);
      const m2 = ri(1, 8);
      const v1 = ri(2, 12);
      const vf = round((m1 * v1) / (m1 + m2), 2);
      const p = pick4(vf, [v1 / 2, m2 * v1, v1, (m1 * v1) / m2]);
      return {
        prompt: `A ${m1} kg cart at ${v1} m/s collides and sticks to a stationary ${m2} kg cart. Find their common speed after.`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "Sticking together = perfectly inelastic.",
          "Conserve momentum: m₁v₁ = (m₁+m₂)v_f.",
          `v_f = ${m1}·${v1}/(${m1}+${m2}).`,
        ],
        category: "conceptual",
      };
    },
  },
  // ---------------- Rotation ----------------
  {
    conceptId: "p1-torque",
    gen: (_d, _r) => {
      const F = ri(10, 90);
      const r = round(0.25 * ri(1, 8), 2);
      const theta = [90, 60, 45, 30][ri(0, 3)];
      const tau = round(F * r * Math.sin((theta * Math.PI) / 180), 2);
      const p = pick4(tau, [F * r, F * r * Math.cos((theta * Math.PI) / 180), tau / 2, F / r]);
      return {
        prompt: `A force of ${F} N is applied ${r} m from a pivot at ${theta}° to the lever arm. What is the torque?`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "Only the perpendicular part of the force twists.",
          "τ = r·F·sin θ.",
          `τ = ${r}·${F}·sin(${theta}°).`,
        ],
        category: "vector",
      };
    },
  },
  {
    conceptId: "p1-angular-momentum",
    gen: (_d, _r) => {
      const I1 = round(0.5 * ri(1, 6), 2);
      const w1 = ri(2, 12);
      const I2 = round(I1 / ri(2, 4), 2);
      const w2 = round((I1 * w1) / I2, 2);
      const p = pick4(w2, [w1 / 2, I1 * w1, w1, w2 * 2]);
      return {
        prompt: `A skater spins at {eq}${w1}\\text{ rad/s}{/eq} with moment of inertia ${I1} kg·m². She pulls her arms in, reducing I to ${I2}. Her new angular speed is:`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "No external torque → angular momentum is conserved.",
          "I₁ω₁ = I₂ω₂.",
          `ω₂ = (${I1}·${w1})/${I2}.`,
        ],
        category: "conceptual",
      };
    },
  },
  // ---------------- SHM ----------------
  {
    conceptId: "p1-shm",
    gen: (_d, _r) => {
      const m = round(0.1 * ri(2, 30), 2);
      const k = ri(10, 200);
      const T = round(2 * Math.PI * Math.sqrt(m / k), 3);
      const p = pick4(T, [2 * Math.PI * Math.sqrt(k / m), Math.sqrt(m / k), T / 2, 1 / T]);
      return {
        prompt: `A ${m} kg mass hangs from a spring with {eq}k = ${k}\\text{ N/m}{/eq}. What is the period of oscillation?`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "The period formula involves both m and k.",
          "T = 2π√(m/k).",
          `T = 2π√(${m}/${k}).`,
        ],
        category: "wrong-equation",
      };
    },
  },
  // ---------------- Electricity ----------------
  {
    conceptId: "p2-current-ohm",
    gen: (_d, _r) => {
      const V = ri(3, 24);
      const R = ri(2, 100);
      const I = round(V / R, 3);
      const p = pick4(I, [V * R, R / V, I * 10, I / 10]);
      return {
        prompt: `A ${V} V battery drives current through a ${R} Ω resistor. What current flows?`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "Ohm's law links V, I, and R.",
          "V = IR → I = V/R.",
          `I = ${V}/${R}.`,
        ],
        category: "wrong-equation",
      };
    },
  },
  {
    conceptId: "p2-series-parallel",
    gen: (_d, _r) => {
      const R1 = ri(2, 50);
      const R2 = ri(2, 50);
      const req = round((R1 * R2) / (R1 + R2), 2);
      const p = pick4(req, [R1 + R2, R1 * R2, Math.abs(R1 - R2), req * 2]);
      return {
        prompt: `Resistors of ${R1} Ω and ${R2} Ω are connected in parallel. What is the equivalent resistance?`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "Parallel resistors combine reciprocally.",
          "1/R = 1/R₁ + 1/R₂, so R = R₁R₂/(R₁+R₂).",
          `R = (${R1}·${R2})/(${R1}+${R2}).`,
        ],
        category: "wrong-equation",
      };
    },
  },
  {
    conceptId: "p2-charge-force",
    gen: (_d, _r) => {
      const q1 = ri(1, 9);
      const q2 = ri(1, 9);
      const r = ri(1, 5);
      const k = 8.99e9;
      const F = (k * q1 * 1e-6 * q2 * 1e-6) / (r * r);
      const p = pick4(F, [F * r, F * r * r, F / 2, F * 4]);
      return {
        prompt: `Charges of ${q1} μC and ${q2} μC sit ${r} m apart. What is the force between them? (k = 8.99×10⁹)`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "Coulomb's law: F = k·q₁q₂/r².",
          "Convert μC to C: multiply by 10⁻⁶.",
          `F = 8.99e9·${q1}e-6·${q2}e-6/${r}².`,
        ],
        category: "unit",
      };
    },
  },
  {
    conceptId: "cem-rc-circuits",
    gen: (_d, _r) => {
      const R = ri(1, 50) * 1000;
      const C = round(0.0001 * ri(1, 9), 4);
      const tau = round((R * C) / 1000, 3); // ms
      const p = pick4(tau, [R * C, R / C, tau * 2, C / R]);
      return {
        prompt: `An RC circuit has R = ${R / 1000} kΩ and C = ${C * 1000} μF. What is the time constant τ?`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "τ emerges from the circuit components.",
          "τ = RC (in seconds when R is Ω and C is F).",
          `τ = ${R}·${C} s — convert to ms.`,
        ],
        category: "unit",
      };
    },
  },
  // ---------------- Waves / optics ----------------
  {
    conceptId: "p2-waves",
    gen: (_d, _r) => {
      const f = ri(2, 100);
      const v = [340, 343, 1500][ri(0, 2)];
      const lambda = round(v / f, 3);
      const p = pick4(lambda, [f / v, v * f, lambda * 2, lambda / 2]);
      return {
        prompt: `A sound wave has frequency ${f} Hz and travels at ${v} m/s. What is its wavelength?`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "Wave speed relates frequency and wavelength.",
          "v = fλ → λ = v/f.",
          `λ = ${v}/${f}.`,
        ],
        category: "wrong-equation",
      };
    },
  },
  {
    conceptId: "p2-lenses-mirrors",
    gen: (_d, _r) => {
      const f = ri(5, 30);
      const dobj = f * ri(2, 5);
      const di = round((f * dobj) / (dobj - f), 2);
      const p = pick4(di, [dobj - f, f, dobj + f, di / 2]);
      return {
        prompt: `An object sits ${dobj} cm from a converging lens of focal length ${f} cm. Where is the image?`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "Use the thin-lens equation.",
          "1/f = 1/d₀ + 1/dᵢ → dᵢ = f·d₀/(d₀ − f).",
          `dᵢ = (${f}·${dobj})/(${dobj} − ${f}).`,
        ],
        category: "wrong-equation",
      };
    },
  },
  // ---------------- Calculus (C courses) ----------------
  {
    conceptId: "cm-calculus-kin",
    gen: (_d, _r) => {
      const c = ri(2, 9);
      const t = ri(2, 6);
      const v = c * t;
      const p = pick4(v, [c, c * t * t, v / 2, c / t]);
      return {
        prompt: `A particle's position is {eq}x(t) = ${c}t^2{/eq} (SI units). What is its speed at ${t} s?`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "Velocity is the derivative of position.",
          "v = dx/dt = 2ct.",
          `v = 2·${c}·${t}.`,
        ],
        category: "calculus",
      };
    },
  },
  {
    conceptId: "cm-work-integral",
    gen: (_d, _r) => {
      const c = ri(2, 10);
      const x1 = ri(1, 3);
      const x2 = x1 + ri(1, 4);
      const W = round((c / 2) * (x2 * x2 - x1 * x1), 2);
      const p = pick4(W, [c * (x2 - x1), (c / 2) * (x2 - x1), c * x2 * x2, W / 2]);
      return {
        prompt: `A force {eq}F(x) = ${c}x{/eq} N acts from {eq}x = ${x1}{/eq} m to {eq}x = ${x2}{/eq} m. Find the work done.`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "The force varies — you cannot just multiply.",
          "W = ∫F dx from x₁ to x₂.",
          `W = ${c}·x²/2 evaluated between ${x1} and ${x2}.`,
        ],
        category: "calculus",
      };
    },
  },
  {
    conceptId: "cem-gauss",
    gen: (_d, _r) => {
      const Q = round(ri(1, 20) / 10, 1);
      const r = ri(1, 4);
      const k = 8.99e9;
      const E = (k * Q) / (r * r);
      const p = pick4(E, [E * r, E * r * r, E / 2, k * Q / (2 * r)]);
      return {
        prompt: `A point charge of ${Q} μC sits at the origin. What is the electric field magnitude at ${r} m?`,
        choices: p.choices,
        correct: p.correct,
        hints: [
          "Spherically symmetric: use the point-charge field (Gauss gives the same result).",
          "E = kq/r².",
          `E = 8.99e9·${Q}e-6/${r}².`,
        ],
        category: "unit",
      };
    },
  },
];

// Concept fallback: generic conceptual questions for any concept without a template.
const GENERIC: Template[] = [
  {
    conceptId: "*",
    gen: (d) => {
      const conceptPromptBank: Record<string, { prompt: string; choices: string[]; correct: number; hints: string[] }> = {
        "p2-ideal-gas": {
          prompt: "A gas in a sealed container is heated at constant volume. What happens to its pressure?",
          choices: ["Decreases", "Increases", "Stays the same", "Drops to zero"],
          correct: 1,
          hints: ["Which gas-law variable is held fixed?", "Constant V: P and T are proportional.", "Gay-Lussac: P/T = const."],
        },
        "p2-e-field": {
          prompt: "Two equal positive charges are separated. At the midpoint between them, the electric field is:",
          choices: ["Doubled", "Zero", "Halved", "Infinite"],
          correct: 1,
          hints: ["Add the fields as vectors.", "Each charge's field at the midpoint points the opposite way of the other's.", "Equal magnitudes, opposite directions → cancel."],
        },
        "p2-photoelectric": {
          prompt: "Increasing the intensity of light below the threshold frequency will:",
          choices: ["Eject electrons faster", "Eject no electrons", "Increase K_max", "Lower the work function"],
          correct: 1,
          hints: ["What does each photon's energy depend on?", "Energy per photon = hf, independent of intensity.", "Below threshold, no single photon has enough energy."],
        },
        "p1-buoyancy": {
          prompt: "An ice cube floats in water. The buoyant force on it equals:",
          choices: ["Less than its weight", "Its weight", "More than its weight", "Zero"],
          correct: 1,
          hints: ["The ice is in equilibrium.", "ΣF = 0 while floating.", "F_b = mg exactly."],
        },
        "cm-shm-ode": {
          prompt: "The differential equation m x'' = −kx tells you that SHM's angular frequency is:",
          choices: ["ω = k/m", "ω = √(k/m)", "ω = √(m/k)", "ω = A·k/m"],
          correct: 1,
          hints: ["Substitute x = A cos(ωt) into the equation.", "x'' = −ω²x; require −ω² = −k/m.", "ω = √(k/m)."],
        },
      };
      const bank = conceptPromptBank;
      return {
        prompt: "Conceptual check: which statement best reflects careful physics reasoning?",
        choices: ["Pick the formula with the most variables", "Identify the system, forces, and conservation laws first", "Assume all forces are constant", "Skip the diagram"],
        correct: 1,
        hints: ["Think about the problem-solving workflow.", "Diagrams and systems come before equations.", "Model first, then math."],
      };
    },
  },
];

export function generateProblem(conceptId: string, difficulty: Difficulty = "medium"): GenProblem {
  const matching = TEMPLATES.filter((t) => t.conceptId === conceptId);
  const pool = matching.length > 0 ? matching : GENERIC;
  const tpl = pool[Math.floor(Math.random() * pool.length)];
  const core = tpl.gen(difficulty, Math.random);
  return {
    id: `${conceptId}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    conceptId,
    difficulty,
    ...core,
  };
}

export function difficultyColor(d: Difficulty): string {
  switch (d) {
    case "easy": return "#6fd6c8";
    case "medium": return "#8fb8f7";
    case "hard": return "#ffc46b";
    case "ap": return "#ff8fb1";
    case "challenge": return "#7c6cf4";
  }
}
