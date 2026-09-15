// Archetype bank 5: Physics C calculus-based — kinematics, dynamics, energy,
// momentum, rotation, oscillation. Derivatives, integrals, ODEs, limit cases.
// Also contains EXPERT-tier (challenge) stretches across courses.
import type { Archetype, RawQ, Rng } from "./core";
import { ri, rf, pick, fmt } from "./core";

const G = 9.8;

export const CALC: Archetype[] = [
  // ---- C1: x(t) → v, a (differentiate then evaluate) ----
  {
    id: "calc-kin-diff",
    course: "cm", unit: 1, topic: "Kinematics", conceptId: "cm-calculus-kin",
    difficulty: "medium", type: "quantitative",
    gen: (r): RawQ => {
      const A = ri(2, 5, r);
      const B = ri(1, 4, r);
      const t = ri(1, 3, r);
      const v = 3 * A * t * t - 2 * B * t;
      const a = 6 * A * t - 2 * B;
      return {
        prompt: `A particle's position is x(t) = ${A}t³ − ${B}t² (SI units). Its velocity and acceleration at t = ${t} s are:`,
        choices: [
          `v = ${fmt(v)} m/s, a = ${fmt(a)} m/s²`,
          `v = ${fmt(A * t ** 3 - B * t * t)} m/s, a = ${fmt(3 * A * t - B)} m/s²`,
          `v = ${fmt(v + A)} m/s, a = ${fmt(a + 2)} m/s²`,
          `v = ${fmt(3 * A * t)} m/s, a = ${fmt(6 * A)} m/s²`,
        ],
        correct: 0,
        tempt: [
          undefined,
          "Those are x(t) at t and its average slope over 0→t — the instantaneous velocity needs the DERIVATIVE evaluated at t.",
          "Off by leftover terms — check each differentiation step.",
          "You differentiated only part way — v needs both terms, a needs both.",
        ],
        explanation: `v = dx/dt = 3·${A}t² − 2·${B}t = ${fmt(v)} m/s at t = ${t}. a = dv/dt = 6·${A}t − 2·${B} = ${fmt(a)} m/s². Differentiate first, evaluate second — never the reverse.`,
        equations: ["v = \\frac{dx}{dt}, \\quad a = \\frac{dv}{dt}"],
        commonMistake: "Substituting time before differentiating, or dropping the chain-rule factors.",
        apStrategy: "Physics C reflex: symbolic derivative → then substitute numbers. Write the general v(t) before any evaluation.",
        category: "calculus",
      };
    },
  },
  // ---- C2: v(t) → displacement by integration ----
  {
    id: "calc-kin-integrate",
    course: "cm", unit: 1, topic: "Kinematics", conceptId: "cm-calculus-kin",
    difficulty: "hard", type: "quantitative",
    gen: (r): RawQ => {
      const A = ri(2, 4, r);
      const T = ri(2, 3, r);
      const dx = A * T ** 2 / 2 - (T ** 3 / 3) * 3; // ∫ (At − 3t²) dt
      const vRev = A / 3; // reversal at t = A/3
      return {
        prompt: `A particle's velocity is v(t) = ${A}t − 3t² m/s. Starting from x = 0, its displacement from t = 0 to t = ${T} s is:`,
        choices: [
          `${fmt(dx, 2)} m`,
          `${fmt(A * T - 3 * T * T, 2)} m`,
          `${fmt(dx * 2, 2)} m`,
          `${fmt(A * T * T / 2, 2)} m`,
        ],
        correct: 0,
        tempt: [
          undefined,
          "That's v(T) itself — displacement needs the integral of v, not its endpoint value.",
          "Doubled — check your antiderivative and limits.",
          "You integrated only the first term — both terms contribute.",
        ],
        explanation: `Δx = ∫₀^T v dt = ${A}t²/2 − t³ |₀^${T} = ${fmt(dx, 2)} m. (Reversal check: v = 0 at t = ${fmt(vRev, 2)} s — the particle moves forward, stalls, moves backward; the integral keeps the net signed area honest.)`,
        equations: ["\\Delta x = \\int_{t_1}^{t_2} v(t)\\,dt"],
        commonMistake: "Reporting v(T) or forgetting the antiderivative's second term.",
        apStrategy: "Displacement = ∫v dt; distance = ∫|v| dt. If v changes sign mid-interval, those differ — decide which the question asks.",
        category: "calculus",
      };
    },
  },
  // ---- C3: variable force → work integral → speed via energy ----
  {
    id: "calc-work-integral",
    course: "cm", unit: 3, topic: "Energy", conceptId: "cm-work-integral",
    difficulty: "hard", type: "quantitative",
    gen: (r): RawQ => {
      const k = ri(2, 6, r);
      const x2 = ri(2, 3, r);
      const m = ri(1, 4, r);
      const W = 0.5 * k * x2 * x2;
      const v = Math.sqrt((2 * W) / m);
      return {
        prompt: `A block (${m} kg, at rest on frictionless ice) is pushed by a force F(x) = ${k}x N. The work done from x = 0 to x = ${x2} m is, and the block's final speed is:`,
        choices: [
          `W = ${fmt(W, 1)} J, v = ${fmt(v, 2)} m/s`,
          `W = ${fmt(k * x2 * x2, 1)} J, v = ${fmt(Math.sqrt((2 * k * x2 * x2) / m), 2)} m/s`,
          `W = ${fmt(W, 1)} J, v = ${fmt(W / m, 2)} m/s`,
          `W = ${fmt(k * x2, 1)} J, v = ${fmt(Math.sqrt((2 * k * x2) / m), 2)} m/s`,
        ],
        correct: 0,
        tempt: [
          undefined,
          "You used W = F·x with the ENDPOINT force — that overcounts a growing force by 2×. Integrate.",
          "Divided energy by mass directly — v comes from ½mv² = W, so v = √(2W/m).",
          "Used F(x₂) without integrating — the force varies along the path.",
        ],
        explanation: `W = ∫₀^${x2} ${k}x dx = ${k}x²/2 |₀^${x2} = ${fmt(W, 1)} J. Energy theorem: ½mv² = W → v = √(2W/m) = ${fmt(v, 2)} m/s.`,
        equations: ["W = \\int F\\,dx, \\quad W = \\tfrac12 m v^2 - \\tfrac12 m v_0^2"],
        commonMistake: "W = Fd with the final force value instead of the integral.",
        apStrategy: "Variable force → integral for W, then energy theorem for speed. Two-step pipelines like this dominate Physics C FRQs.",
        category: "calculus",
      };
    },
  },
  // ---- C4: U(x) → force via derivative + stability ----
  {
    id: "calc-u-to-force",
    course: "cm", unit: 3, topic: "Energy", conceptId: "cm-work-integral",
    difficulty: "ap", type: "quantitative",
    gen: (r): RawQ => {
      const A = ri(2, 5, r);
      const x1 = ri(1, 2, r);
      const F = -2 * A * x1;
      return {
        prompt: `A particle has potential energy U(x) = ${A}x² J (x in meters). The force on it at x = ${x1} m is:`,
        choices: [
          `${fmt(-F, 0)} N in the −x direction`,
          `${fmt(F, 0)} N in the −x direction`,
          `${fmt(2 * A * x1, 0)} N in the +x direction`,
          `Zero — U is positive everywhere`,
        ],
        correct: 0,
        tempt: [
          undefined,
          `That's the force's magnitude with the sign misread — F = −dU/dx = −${2 * A}x, which is negative at positive x: the force points in −x.`,
          "The minus sign in F = −dU/dx matters: the force points DOWNHILL on the U landscape, toward smaller U.",
          "U's sign says nothing about force — the SLOPE of U does.",
        ],
        explanation: `F = −dU/dx = −2·${A}x → at x = ${x1}: F = ${fmt(F, 0)} N (pointing in −x, toward the origin where U is smallest). This is the harmonic-oscillator restoring force.`,
        equations: ["F_x = -\\frac{dU}{dx}"],
        commonMistake: "Dropping the minus sign — the direction IS the physics here.",
        apStrategy: "E → V, U → F: the derivative-with-minus-sign pattern repeats across all of C. After computing, verify 'downhill' direction.",
        category: "sign",
      };
    },
  },
  // ---- C5: impulse integral with F(t) ----
  {
    id: "calc-impulse-integral",
    course: "cm", unit: 4, topic: "Momentum", conceptId: "cm-momentum",
    difficulty: "medium", type: "quantitative",
    gen: (r): RawQ => {
      const k = ri(3, 8, r);
      const T = ri(1, 3, r);
      const m = ri(1, 4, r);
      const J = k * T * T;
      const dv = J / m;
      return {
        prompt: `A force F(t) = ${k}t N acts on a ${m} kg object initially at rest, from t = 0 to t = ${T} s. The impulse and final speed are:`,
        choices: [
          `J = ${fmt(J, 1)} N·s, v = ${fmt(dv, 2)} m/s`,
          `J = ${fmt(k * T, 1)} N·s, v = ${fmt((k * T) / m, 2)} m/s`,
          `J = ${fmt(J, 1)} N·s, v = ${fmt(J / m / 2, 2)} m/s`,
          `J = ${fmt(k * T * T * T, 1)} N·s, v = ${fmt((k * T ** 3) / m, 2)} m/s`,
        ],
        correct: 0,
        tempt: [
          undefined,
          "Used F(T)·Δt with the endpoint force — a growing force needs the integral (average force is half).",
          "Halved after integrating — the ½ is already inside the antiderivative kt²/2 evaluated at T.",
          "Integrated one time too many — impulse is ∫F dt, not ∫∫F.",
        ],
        explanation: `J = ∫₀^${T} ${k}t dt = ${k}t²/2 |₀^${T} = ${fmt(J, 1)} N·s. Then J = Δp = mv → v = ${fmt(dv, 2)} m/s.`,
        equations: ["J = \\int F\\,dt = \\Delta p"],
        commonMistake: "Treating a time-varying force as constant at its endpoint value.",
        apStrategy: "Any 'force as a function' impulse problem: integrate, then apply Δp = J. The graph version uses area — same idea.",
        category: "calculus",
      };
    },
  },
  // ---- C6: rotational dynamics with I by formula ----
  {
    id: "calc-rot-torque",
    course: "cm", unit: 5, topic: "Rotation", conceptId: "cm-rot-dynamics",
    difficulty: "medium", type: "quantitative",
    gen: (r): RawQ => {
      const M = ri(2, 6, r);
      const R = rf(0.2, 0.6, 0.1, r);
      const F = ri(10, 50, r);
      const I = 0.5 * M * R * R;
      const alpha = (F * R) / I;
      return {
        prompt: `A solid disk (mass ${M} kg, radius ${fmt(R, 1)} m, I = ½MR²) is spun by a tangential force of ${F} N at its rim. Its angular acceleration is:`,
        choices: [
          `${fmt(alpha, 1)} rad/s²`,
          `${fmt(alpha * 2, 1)} rad/s²`,
          `${fmt(alpha / 2, 1)} rad/s²`,
          `${fmt(F / M, 1)} rad/s²`,
        ],
        correct: 0,
        tempt: [
          undefined,
          "Dropped the ½ from I = ½MR² — it flips into a 2× error in α.",
          "Doubled I instead of halving — check the substitution.",
          "That's a = F/M (translational) — rotation needs α = τ/I with τ = FR.",
        ],
        explanation: `τ = FR = ${F}×${fmt(R, 1)} = ${fmt(F * R, 1)} N·m. α = τ/I = τ/(½MR²) = ${fmt(alpha, 1)} rad/s².`,
        equations: ["\\tau = FR, \\quad \\alpha = \\frac{\\tau}{I}, \\quad I_{disk} = \\tfrac12 MR^2"],
        commonMistake: "Substituting I = MR² (that's a hoop) for a disk.",
        apStrategy: "Memorize the three common inertias (hoop MR², disk ½MR², sphere 2/5 MR²) — half of Physics C rotation speed is inertia recall.",
        category: "algebra",
      };
    },
  },
  // ---- C7: SHM ODE → ω (the Physics C signature move) ----
  {
    id: "calc-shm-ode",
    course: "cm", unit: 7, topic: "Oscillations", conceptId: "cm-shm-ode",
    difficulty: "ap", type: "quantitative",
    gen: (r): RawQ => {
      const k = ri(2, 8, r) * 10;
      const m = ri(1, 4, r);
      const omega = Math.sqrt(k / m);
      const period = (2 * Math.PI) / omega;
      return {
        prompt: `A mass on a spring (k = ${k} N/m, m = ${m} kg) obeys m·x″ = −kx. Matching to x = A cos(ωt), the angular frequency and period are:`,
        choices: [
          `ω = ${fmt(omega, 2)} rad/s, T = ${fmt(period, 2)} s`,
          `ω = ${fmt(k / m, 2)} rad/s, T = ${fmt((2 * Math.PI) / (k / m), 2)} s`,
          `ω = ${fmt(omega, 2)} rad/s, T = ${fmt(1 / omega, 2)} s`,
          `ω = ${fmt(Math.sqrt(k * m), 2)} rad/s, T = ${fmt((2 * Math.PI) / Math.sqrt(k * m), 2)} s`,
        ],
        correct: 0,
        tempt: [
          undefined,
          "ω² = k/m, not ω = k/m — differentiate x = A cos(ωt) twice and match coefficients.",
          "T = 2π/ω, not 1/ω — the 2π is the cycles-to-radians bridge.",
          "Inverted — ω = √(k/m), not √(km).",
        ],
        explanation: `x″ = −ω²A cos(ωt) = −ω²x. Requiring −ω²x = −(k/m)x gives ω² = k/m → ω = ${fmt(omega, 2)} rad/s, T = 2π/ω = ${fmt(period, 2)} s. The ODE hands you the frequency — that's why C does SHM this way.`,
        equations: ["m\\frac{d^2x}{dt^2} = -kx \\;\\Rightarrow\\; \\omega = \\sqrt{k/m}"],
        commonMistake: "Forgetting that two differentiations produce ω², not ω.",
        apStrategy: "The assume-sinusoid-and-match ritual works for every ODE on the C exam: SHM, LC circuits, drag decay. One skill, many questions.",
        category: "calculus",
      };
    },
  },
  // ---- C8: RC discharge time constant + exponential reasoning (C E&M) ----
  {
    id: "calc-rc-expert",
    course: "cem", unit: 11, topic: "RC Circuits", conceptId: "cem-rc-circuits",
    difficulty: "challenge", type: "quantitative",
    gen: (r): RawQ => {
      const V = pick([10, 12, 20] as const, r);
      const R = ri(2, 8, r);         // kΩ
      const C = ri(100, 600, r);     // μF
      const tau = R * C;             // ms (kΩ·μF = ms)
      const I0 = V / R;              // mA
      const tMult = pick([1, 2, 3] as const, r);
      const It = I0 * Math.exp(-tMult);
      return {
        prompt: `A capacitor C = ${C} μF discharges from ${V} V through R = ${R} kΩ. The initial current is ${fmt(I0, 2)} mA. The current after t = ${tMult}τ is closest to:`,
        choices: [
          `${fmt(It, 2)} mA`,
          `${fmt(I0 / tMult, 2)} mA`,
          `${fmt(I0 * (1 - Math.exp(-tMult)), 2)} mA`,
          `${fmt(I0 * Math.exp(-tMult / 2), 2)} mA`,
        ],
        correct: 0,
        tempt: [
          undefined,
          "The decay is exponential, not linear: I ∝ e^(−t/τ), so I(2τ) is 0.14·I₀, not I₀/2.",
          "That's the CHARGING formula's complement — discharging decays toward zero.",
          "Half the time constant is not half the exponent — keep t/τ together.",
        ],
        explanation: `I(t) = I₀e^(−t/τ) with τ = RC = ${R}k × ${C}μ = ${fmt(tau, 0)} ms. At t = ${tMult}τ: I = ${fmt(I0, 2)}·e^(−${tMult}) = ${fmt(It, 2)} mA. e ≈ 2.718 — after 1τ only 37% remains, after 2τ only 14%.`,
        equations: ["I(t) = I_0 e^{-t/\\tau}, \\quad \\tau = RC"],
        commonMistake: "Treating exponential decay as linear (I/2 at 2τ).",
        apStrategy: "Expert RC questions live in the exponential's shape: memorize e⁻¹ ≈ 0.37, e⁻² ≈ 0.14, e⁻³ ≈ 0.05 and estimate without a calculator.",
        category: "calculus",
      };
    },
  },
  // ---- C9: Gauss's law symmetry selection (expert) ----
  {
    id: "calc-gauss-expert",
    course: "cem", unit: 8, topic: "Gauss's Law", conceptId: "cem-gauss",
    difficulty: "challenge", type: "quantitative",
    gen: (r): RawQ => {
      const lam = ri(2, 9, r); // nC/m
      const rad = rf(0.02, 0.1, 0.01, r);
      const k = 8.99e9;
      const E = (2 * k * lam * 1e-9) / rad;
      return {
        prompt: `An infinite line of charge has linear density λ = ${lam} nC/m. Using a cylindrical Gaussian surface of radius ${fmt(rad * 100, 0)} cm and length L, the field magnitude is:`,
        choices: [
          `E = ${fmt(E, 0)} N/C (independent of L)`,
          `E = ${fmt(E / 2, 0)} N/C (independent of L)`,
          `E = λL/(2πε₀r) — grows with L`,
          `E cannot be found — Gauss's law fails for lines`,
        ],
        correct: 0,
        tempt: [
          undefined,
          "Half — check the enclosed charge: λL flows through the curved side only; the flat caps contribute zero flux.",
          "L cancels: both enclosed charge (λL) and curved-surface flux (E·2πrL) carry the L.",
          "The symmetry is perfect — that's exactly when Gauss's law SUCCEEDS.",
        ],
        explanation: `Enclosed: Q = λL. Flux exits only the curved side: Φ = E·2πrL. Gauss: E·2πrL = λL/ε₀ → E = λ/(2πε₀r) = ${fmt(E, 0)} N/C. L cancels — the field of an infinite line falls as 1/r, not 1/r².`,
        equations: ["E\\cdot 2\\pi r L = \\frac{\\lambda L}{\\varepsilon_0} \\Rightarrow E = \\frac{\\lambda}{2\\pi\\varepsilon_0 r}"],
        commonMistake: "Keeping L as if it mattered, or including the end caps' flux (it's zero).",
        apStrategy: "Gauss in three moves: pick the symmetry surface, list which sides carry flux, cancel the geometric parameter. The cancellation IS the punchline.",
        category: "calculus",
      };
    },
  },
  // ---- C10: expert stretch — energy diagram turning points (C M) ----
  {
    id: "calc-turning-points",
    course: "cm", unit: 3, topic: "Energy", conceptId: "cm-work-integral",
    difficulty: "challenge", type: "conceptual",
    gen: (r): RawQ => {
      void r;
      return {
        prompt: "A particle moves in 1D with total energy E and potential U(x), where U(x) has a single well with U → ∞ as |x| → ∞. The turning points of the motion occur where:",
        choices: [
          "U(x) = E — all energy is potential, K = 0, and the particle reverses",
          "U(x) = 0 — the reference level",
          "dU/dx = 0 — the equilibrium points",
          "K(x) is maximum",
        ],
        correct: 0,
        tempt: [
          undefined,
          "The zero of U is arbitrary — only the comparison between E and U matters.",
          "dU/dx = 0 marks equilibrium (F = 0), not reversal — the particle passes through or rests there, but doesn't turn there (unless it's a minimum AND E = U there).",
          "Maximum K happens at the bottom of the well — the MIDDLE of the motion, not its ends.",
        ],
        explanation: "E = K + U is fixed. Turning points: K = 0 → U = E. Between them, U < E so K > 0 (motion allowed); outside, U > E (forbidden — K would be negative). Reading allowed regions off an energy diagram is a guaranteed C-exam skill.",
        equations: ["E = K + U, \\quad K = E - U(x) \\geq 0"],
        commonMistake: "Confusing turning points with equilibrium points.",
        apStrategy: "Energy diagrams: draw the horizontal E line. Allowed where U < E; turning points at intersections; equilibrium at slope-zero points.",
        category: "graph",
      };
    },
  },
  // ---- C11: expert stretch — Newton's second law as ODE (C M) ----
  {
    id: "calc-drag-ode",
    course: "cm", unit: 2, topic: "Dynamics", conceptId: "cm-diff-dynamics",
    difficulty: "challenge", type: "quantitative",
    gen: (r): RawQ => {
      const m = ri(1, 5, r);
      const b = rf(0.5, 2, 0.25, r);
      const v0 = ri(5, 20, r);
      const tau = m / b;
      const vHalf = v0 * Math.exp(-Math.LN2);
      return {
        prompt: `A ${m} kg object slides on frictionless ice with drag F = −b·v (b = ${fmt(b, 2)} N·s/m), launched at ${v0} m/s. The time to reach HALF its initial speed is:`,
        choices: [
          `τ·ln2 = ${fmt(tau * Math.LN2, 2)} s`,
          `τ/2 = ${fmt(tau / 2, 2)} s`,
          `τ = ${fmt(tau, 2)} s`,
          `2τ = ${fmt(2 * tau, 2)} s`,
        ],
        correct: 0,
        tempt: [
          undefined,
          "Half the TIME CONSTANT is not half the SPEED — exponentials halve every τ·ln2, not every τ/2.",
          "After one full τ the speed is v₀/e ≈ 0.37v₀ — already below half.",
          "Wrong direction — the speed DROPS; 2τ leaves ~14%.",
        ],
        explanation: `m dv/dt = −bv → v(t) = v₀e^(−t/τ), τ = m/b = ${fmt(tau, 2)} s. Half speed: e^(−t/τ) = ½ → t = τ·ln2 = ${fmt(tau * Math.LN2, 2)} s. Exponentials lose half in ln2, not in ½.`,
        equations: ["m\\frac{dv}{dt} = -bv \\;\\Rightarrow\\; v = v_0 e^{-bt/m}"],
        commonMistake: "Applying linear intuition (half the time → half the speed) to exponential decay.",
        apStrategy: "Every 'time to reach a fraction' question with exponential decay: solve e^(−t/τ) = fraction → t = τ·ln(1/fraction).",
        category: "calculus",
      };
    },
  },
  // ---- C12: expert stretch — dimensional escape (all courses) ----
  {
    id: "calc-dim-analysis",
    course: "cem", unit: 9, topic: "Potential", conceptId: "cem-potential",
    difficulty: "challenge", type: "conceptual",
    gen: (r): RawQ => {
      void r;
      return {
        prompt: "You derive V(r) for a point charge but two candidate answers remain: (A) V = kq/r and (B) V = kq/r². Only one has the units of potential. The check:",
        choices: [
          "V must be J/C; kq/r² has units of field (N/C) — (B) is E, not V",
          "Both work — they're related by a constant",
          "(B) is correct because potential must fall faster than field",
          "Neither — potential has units of N·m",
        ],
        correct: 0,
        tempt: [
          undefined,
          "They differ by a factor of length — different dimensions, cannot both be right.",
          "Field falls as 1/r²; potential (its integral) falls as 1/r — slower, not faster.",
          "N·m is energy (J); potential is energy PER CHARGE.",
        ],
        explanation: "E has units N/C = V/m, so V = kq/r and E = kq/r². Dimensional analysis kills wrong candidates without any physics reasoning — on a timed exam, it's free elimination.",
        equations: ["V = \\frac{kq}{r}, \\quad E = \\frac{kq}{r^2}"],
        commonMistake: "Mixing up V and E formulas for point charges.",
        apStrategy: "Dimension-check every recalled formula: E is N/C, V is J/C, B is N·s/(C·m). Mismatch = immediate elimination.",
        category: "unit",
      };
    },
  },
];
