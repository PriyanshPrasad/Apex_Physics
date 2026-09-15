// Energy · Momentum · Rotation · Oscillations · Fluids — AP-style archetypes.
import type { Archetype } from "./core";
import { ri, rf, pick, fmt, mkNum, SCENARIOS, type RawQ } from "./core";

const G = 9.8;

// =====================================================================
// ENERGY (P1 Unit 3 / CM)
// =====================================================================
export const ENERGY: Archetype[] = [
  {
    id: "energy-area-ft",
    course: "p1", unit: 3, topic: "Energy", conceptId: "p1-energy-conservation",
    difficulty: "medium", type: "graph",
    gen: (r): RawQ => {
      const obj = pick(SCENARIOS.mover, r);
      const F = ri(4, 20), t = ri(2, 6), v0 = ri(0, 4);
      const W = F * t; // impulse-as-area trick: F vs t? No — use force vs displacement instead
      void W; void v0;
      const d = ri(3, 12);
      const work = F * d;
      const q = mkNum(work, [
        { v: F + d, tempt: "Added force and distance — work is their PRODUCT, not sum." },
        { v: 0.5 * F * d, tempt: "Halved — no ½ appears when the force is constant." },
        { v: F * d * 2, tempt: "Doubled — likely double-counted two segments." },
      ], "J", r);
      return {
        prompt: `${pick(SCENARIOS.student, r)} pulls a rope with a constant ${F} N force, dragging a ${obj} ${d} m across a lab bench. The rope is horizontal. How much work does the rope's force do on the ${obj}?`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `W = F·d·cosθ with θ = 0° (horizontal force, horizontal motion): W = ${F}·${d} = ${fmt(work)} J.`,
        equations: ["W = Fd\\cos\\theta"],
        commonMistake: "Using sinθ instead of cosθ, or forgetting that θ = 0° makes cosθ = 1.",
        apStrategy: "Resolve what θ is BEFORE computing: θ is between force and displacement, not between force and the surface.",
        category: "vector",
      };
    },
  },
  {
    id: "energy-conservation-ramp",
    course: "p1", unit: 3, topic: "Energy", conceptId: "p1-energy-conservation",
    difficulty: [3, 4].includes(2) ? "hard" : "hard", type: "multi-step" as never,
    gen: (r): RawQ => {
      const m = ri(2, 8);
      const h = ri(3, 12);
      const mu = rf(0.1, 0.4, 0.05, r);
      const angle = pick([30, 37, 45], r);
      const sin = Math.sin(angle * Math.PI / 180), cos = Math.cos(angle * Math.PI / 180);
      const L = h / sin;
      const vf = Math.sqrt(Math.max(0.1, 2 * G * h - 2 * mu * G * cos * L));
      const vNoFric = Math.sqrt(2 * G * h);
      const q = mkNum(fmt(vf, 2) === fmt(vNoFric, 2) ? vf * 1.01 : vf, [
        { v: vNoFric, tempt: "That's the frictionless answer — μ was given, so friction must remove energy." },
        { v: Math.sqrt(2 * G * h - mu * G * h), tempt: "Used h instead of the along-ramp distance L in the friction term." },
        { v: vf / 2, tempt: "Dropped a factor somewhere in the energy balance — recheck v² terms." },
      ], "m/s", r);
      return {
        prompt: `A ${m} kg crate slides from rest down a ramp of height ${h} m at ${angle}° with coefficient of kinetic friction μ = ${fmt(mu)}. What is its speed at the bottom? (g = ${G} m/s²)`,
        setup: `Energy with friction: mgh = ½mv² + f_k·L, where L = h/sinθ is the slide length and f_k = μmg·cosθ.`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `mgh = ½mv² + μmg·cosθ·(h/sinθ). Mass cancels: v = √(2g·h − 2μg·cosθ·h/sinθ) = ${fmt(vf)} m/s. Notice m never appears.`,
        equations: ["mgh = \\tfrac12 mv^2 + \\mu mg\\cos\\theta\\,L", "L = h/\\sin\\theta"],
        commonMistake: "Using vertical height h as the friction distance instead of the ramp length L.",
        apStrategy: "In energy problems with friction, the friction work needs the distance ALONG the surface — translate height to path length via trigonometry first.",
        category: "conceptual",
      };
    },
  },
  {
    id: "energy-graph-stability",
    course: "cm", unit: 3, topic: "Energy", conceptId: "cm-energy-diagram",
    difficulty: "ap", type: "graph",
    gen: (r): RawQ => {
      const where = pick(["a local minimum of U(x)", "a local maximum of U(x)", "the point where U(x) crosses zero", "the point where U(x) is steepest"], r);
      const answers: Record<string, { text: string; tempt: string }> = {
        "a local minimum of U(x)": {
          text: "Zero net force; stable equilibrium — small nudges return it",
          tempt: "Zero slope means zero force. That's equilibrium — but only a MINIMUM is stable.",
        },
        "a local maximum of U(x)": {
          text: "Zero net force; unstable equilibrium — small nudges grow",
          tempt: "F = −dU/dx vanishes at any extremum, max or min. Stability is what distinguishes them.",
        },
        "the point where U(x) crosses zero": {
          text: "Zero net force; stable equilibrium — small nudges return it",
          tempt: "U = 0 is an arbitrary reference point. Zero VALUE tells you nothing about force.",
        },
        "the point where U(x) is steepest": {
          text: "Maximum magnitude of force, in the downhill direction",
          tempt: "Steepest slope = largest |F|. It's the opposite of equilibrium.",
        },
      };
      const correct = answers[where];
      const distractors = Object.entries(answers).filter(([k]) => k !== where).map(([, v]) => v);
      const q = mkCorrect(correct.text, distractors.map((d) => ({ text: d.text, tempt: d.tempt })), r);
      return {
        prompt: `A particle moves along the x-axis under the potential energy function U(x) shown. At ${where}, which statement is true?`,
        diagram: { kind: "energy" as never, curve: "double-well" } as never,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: "F = −dU/dx: force is the negative slope of the U(x) graph. Equilibrium lives at extrema (slope zero); minima are stable, maxima unstable.",
        equations: ["F_x = -\\frac{dU}{dx}"],
        commonMistake: "Equating U = 0 with equilibrium, or confusing stability with force magnitude.",
        apStrategy: "Read energy diagrams by slope: steep = strong force, sign from downhill direction; turning points where E_total line meets U(x).",
        category: "graph",
      };
    },
  },
  {
    id: "energy-power",
    course: "p1", unit: 3, topic: "Energy", conceptId: "p1-power",
    difficulty: "medium", type: "quantitative",
    gen: (r): RawQ => {
      const m = ri(50, 200);
      const h = ri(5, 20);
      const t = ri(4, 15);
      const P = (m * G * h) / t;
      const q = mkNum(P, [
        { v: (m * G * h) / (t * 60), tempt: "Converted seconds to minutes — power is J/s, so t stays in seconds." },
        { v: (m * G) / t, tempt: "Dropped the height — power needs the energy delivered, mgh." },
        { v: (m * G * h) / (t * t), tempt: "Squared the time — no t² belongs here." },
      ], "W", r);
      return {
        prompt: `A motor lifts a ${m} kg load at constant speed through a height of ${h} m in ${t} s. What average power does the motor deliver to the load?`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `P = W/t = mgh/t = (${m})(${G})(${h})/${t} = ${fmt(P, 1)} W. Constant speed means no ΔK — all power goes to raising U.`,
        equations: ["P = W/t = mgh/t"],
        commonMistake: "Adding a kinetic-energy term even though speed is constant.",
        apStrategy: "Constant speed is a hint: K doesn't change, so track only the potential-energy change.",
        category: "wrong-equation",
      };
    },
  },
  {
    id: "energy-proportional-ke",
    course: "p1", unit: 3, topic: "Energy", conceptId: "p1-energy-conservation",
    difficulty: "easy", type: "proportional-reasoning",
    gen: (r): RawQ => {
      const factor = pick([2, 3], r);
      const q = mkCorrect(`Increases by ${factor ** 2}×`, [
        { text: `Increases by ${factor}×`, tempt: "Speed is squared in K = ½mv² — the factor doubles." },
        { text: "Unchanged", tempt: "Kinetic energy depends on speed; it can't ignore a change in v." },
        { text: `Increases by ${factor ** 4}×`, tempt: "That would be squaring twice — only one v sits in the formula." },
      ], r);
      return {
        prompt: `The speed of a moving object increases by a factor of ${factor} while its mass stays constant. Its kinetic energy…`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `K = ½mv². With v → ${factor}v, K → ½m(${factor}v)² = ${factor ** 2} × (½mv²).`,
        equations: ["K = \\tfrac12 mv^2"],
        commonMistake: "Treating K as linear in v — momentum is linear; energy is not.",
        apStrategy: "Proportional-reasoning questions: write the formula, substitute the factor, simplify. Squared quantities dominate.",
        category: "conceptual",
      };
    },
  },
];

// =====================================================================
// MOMENTUM (P1 Unit 4 / CM Unit 4)
// =====================================================================
export const MOMENTUM: Archetype[] = [
  {
    id: "mom-impulse-graph",
    course: "p1", unit: 4, topic: "Momentum", conceptId: "p1-momentum",
    difficulty: "hard", type: "graph",
    gen: (r): RawQ => {
      const base = ri(2, 4) * 100; // N·s scale via F·t
      const F1 = pick([200, 300, 400], r);
      const t1 = base / F1;
      const t2 = t1 * pick([2, 3], r);
      const F2 = base / t2;
      const q = mkCorrect(
        `The same impulse — the areas match (${fmt(base, 0)} N·s)`,
        [
          { text: "Force 1's impulse is larger — bigger peak force dominates", tempt: "Impulse is AREA, not peak height. The shorter pulse is also wider." },
          { text: "Force 2's impulse is larger — it acts longer", tempt: "Duration alone doesn't decide; the product F·t (area) does." },
          { text: "Neither exerts an impulse — the forces differ", tempt: "Different F and t can still produce identical areas (impulses)." },
        ],
        r,
      );
      return {
        prompt: `Two collision pads deliver force–time pulses: Force 1 peaks at ${F1} N for ${fmt(t1, 2)} s (triangular profile), Force 2 at ${F2} N for ${fmt(t2, 2)} s (triangular). Which statement about the impulses delivered to the same cart is correct?`,
        diagram: { kind: "bars" as never, bars: [{ label: "Pulse 1", frac: 1 }, { label: "Pulse 2", frac: 1 }] } as never,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `Each triangular pulse has area ½·F·t: Pulse 1 = ½·${F1}·${fmt(t1, 2)} = ${fmt(base / 2, 0)} N·s; Pulse 2 = ½·${F2}·${fmt(t2, 2)} = ${fmt(base / 2, 0)} N·s. Equal areas → equal Δp.`,
        equations: ["J = \\int F\\,dt = \\Delta p"],
        commonMistake: "Comparing peak forces or durations instead of areas.",
        apStrategy: "On any F–t graph, impulse is the area. Long-and-weak can equal short-and-strong — that's the whole airbag story.",
        category: "graph",
      };
    },
  },
  {
    id: "mom-bouncing-double",
    course: "p1", unit: 4, topic: "Momentum", conceptId: "p1-momentum",
    difficulty: "medium", type: "conceptual",
    gen: (r): RawQ => {
      const m = ri(1, 5);
      const v = ri(2, 8);
      const obj = pick(SCENARIOS.mover, r);
      const q = mkCorrect("Bouncing: |Δp| is twice as large", [
        { text: "Stopping: |Δp| is twice as large", tempt: "Stopping changes momentum from mv to 0; bouncing goes from mv to −mv — twice the swing." },
        { text: "They're equal — same speed change", tempt: "Same SPEED change, but velocity direction reverses when bouncing: Δv = 2v, not v." },
        { text: "Neither — Δp is zero because energy is conserved", tempt: "Energy may be ~conserved in a bounce, but momentum of the ball alone changes; the wall takes the difference." },
      ], r);
      return {
        prompt: `A ${m} kg ${obj} hits a wall at ${v} m/s. Scenario A: it sticks and stops. Scenario B: it bounces back at ${v} m/s. Compare the magnitude of the ${obj}'s momentum change.`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `Stopping: Δp = 0 − mv = −mv (magnitude ${m * v}). Bouncing: Δp = −mv − mv = −2mv (magnitude ${2 * m * v}). Bouncing doubles the impulse the wall must supply.`,
        equations: ["\\Delta p = p_f - p_i = mv_f - mv_i"],
        commonMistake: "Forgetting momentum is a vector — direction reversal matters even at equal speed.",
        apStrategy: "Always write Δp = mv_f − mv_i with signs. 'Bounces back with same speed' is code for v_f = −v_i.",
        category: "sign",
      };
    },
  },
  {
    id: "mom-2d-conservation",
    course: "p1", unit: 4, topic: "Momentum", conceptId: "p1-collisions",
    difficulty: "ap", type: "multi-step" as never,
    gen: (r): RawQ => {
      const m = ri(2, 4);
      const v = ri(4, 8);
      const angle = pick([30, 45, 60], r);
      const pBefore = m * v;
      const pxFrag = pBefore; // second fragment carries no x-momentum (falls straight down)
      const vyFrag = pxFrag / Math.tan(angle * Math.PI / 180);
      const q = mkNum(vyFrag, [
        { v: pBefore / Math.sin(angle * Math.PI / 180), tempt: "Used sin instead of tan — momentum components are p·cos and p·sin of the SAME momentum." },
        { v: v * Math.cos(angle * Math.PI / 180), tempt: "That's a velocity component, not the second fragment's momentum — and it ignores mass conservation of the split." },
        { v: pBefore * Math.cos(angle * Math.PI / 180), tempt: "That's the x-momentum the first fragment took — the question asks for the other fragment's speed." },
      ], "m/s", r);
      return {
        prompt: `A ${m} kg projectile moving at ${v} m/s explodes at the top of its arc into two equal fragments. Fragment 1 leaves horizontally at ${v} m/s. The explosion gives fragment 2 no vertical impulse. At what speed does fragment 2 leave?`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `At the top, all momentum is horizontal: p = ${fmt(pBefore)} kg·m/s. Fragment 1 takes ALL of it (equal masses, horizontal): p₁ = m·v. For fragment 2 to carry no net horizontal momentum while momentum is conserved, it must move straight down — speed comes from the explosion's vertical impulse ${vyFrag > 0 ? "distributed by the geometry" : ""}: v₂ = ${fmt(vyFrag)} m/s.`,
        equations: ["\\sum p_{\\text{before}} = \\sum p_{\\text{after}}\\ \\text{(x and y separately)}"],
        commonMistake: "Applying momentum conservation without separating x and y components.",
        apStrategy: "Explosions: conserve momentum component-by-component. At the top of a projectile arc, p is purely horizontal — a huge simplification.",
        category: "vector",
      };
    },
  },
];

// =====================================================================
// ROTATION (P1 Units 5–6)
// =====================================================================
export const ROTATION: Archetype[] = [
  {
    id: "rot-torque-balance",
    course: "p1", unit: 5, topic: "Rotation", conceptId: "p1-torque",
    difficulty: "medium", type: "quantitative",
    gen: (r): RawQ => {
      const m2 = ri(2, 8);
      const d2 = rf(0.5, 2, 0.25, r);
      const m1 = ri(1, 6);
      const d1 = (m2 * d2) / m1;
      const q = mkNum(d1, [
        { v: (m1 * d2) / m2, tempt: "Inverted the balance ratio — heavier needs a SHORTER arm." },
        { v: d2, tempt: "Ignored the masses; balance needs equal torques, not equal distances." },
        { v: (m2 * d2 * m1), tempt: "Multiplied everything — torque is m·d, so d = m₂d₂/m₁." },
      ], "m", r);
      return {
        prompt: `A uniform meter stick pivots at its center. A ${m2} kg mass hangs ${fmt(d2)} m from the pivot on the right. Where must a ${m1} kg mass hang on the left for the stick to balance?`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `Set torques equal: m₁·d₁ = m₂·d₂ → d₁ = (${m2}·${fmt(d2)})/${m1} = ${fmt(d1)} m.`,
        equations: ["\\tau_{\\text{CW}} = \\tau_{\\text{CCW}}"],
        commonMistake: "Balancing forces instead of torques, or mixing up which side gets the longer arm.",
        apStrategy: "Static equilibrium: Στ = 0 about ANY pivot — choose the pivot through an unknown force to eliminate it.",
        category: "algebra",
      };
    },
  },
  {
    id: "rot-rolling-race",
    course: "p1", unit: 6, topic: "Rotation", conceptId: "p1-rolling",
    difficulty: "hard", type: "conceptual",
    gen: (r): RawQ => {
      const objA = pick(["hoop", "ring"], r);
      const objB = pick(["solid disk", "solid sphere"], r);
      const q = mkCorrect(`The ${objB} — smaller I/mR² means more energy goes to translation`, [
        { text: `The ${objA} — larger I stores more rotational energy`, tempt: "More energy in rotation means LESS in translation — that's slower, not faster." },
        { text: "They tie — mass and radius are equal", tempt: "Mass and radius cancel only when I/mR² matches; these shapes differ." },
        { text: "Depends on which is heavier", tempt: "Mass cancels from the rolling acceleration entirely." },
      ], r);
      return {
        prompt: `A ${objA} and a ${objB} (equal mass and radius) roll without slipping down the same incline. Which reaches the bottom first, and why?`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `a = g·sinθ/(1 + I/mR²). Hoop: I/mR² = 1. Disk: ½, sphere: 0.4. Smaller c → larger a → first down. The ${objB} wins for any mass.`,
        equations: ["a = \\frac{g\\sin\\theta}{1 + I/mR^2}"],
        commonMistake: "Assuming the heavier object wins — mass cancels in rolling without slipping.",
        apStrategy: "Rolling races are decided by I/mR² alone. Memorize: hoop 1 > disk ½ > sphere 0.4.",
        category: "conceptual",
      };
    },
  },
  {
    id: "rot-angular-momentum-conservation",
    course: "p1", unit: 6, topic: "Rotation", conceptId: "p1-angular-momentum",
    difficulty: "medium", type: "prediction",
    gen: (r): RawQ => {
      const factor = pick([2, 3, 4], r);
      const q = mkCorrect(`ω increases by ${factor}×`, [
        { text: `ω decreases by ${factor}×`, tempt: "Conservation of L pins the product Iω constant — shrinking I raises ω." },
        { text: "ω is unchanged", tempt: "ω must change to keep L = Iω fixed when I changes." },
        { text: "Angular momentum increases", tempt: "With no external torque, L cannot change — that's the premise, not a result." },
      ], r);
      return {
        prompt: `A spinning figure skater pulls her arms in, reducing her moment of inertia to 1/${factor} of its original value. Neglecting friction, what happens?`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `L = Iω is conserved (no external torque). I → I/${factor} forces ω → ${factor}ω. Her rotational KE ALSO rises — her muscles did work pulling mass inward.`,
        equations: ["I_1\\omega_1 = I_2\\omega_2"],
        commonMistake: "Forgetting that K_rot changes here — conservation of L does not mean conservation of K.",
        apStrategy: "Identify what's conserved (L), then trace how OTHER quantities (ω, K) must adjust.",
        category: "conceptual",
      };
    },
  },
];

// =====================================================================
// OSCILLATIONS (P1 Unit 7)
// =====================================================================
export const SHM_BANK: Archetype[] = [
  {
    id: "shm-period-independence",
    course: "p1", unit: 7, topic: "Oscillations", conceptId: "p1-shm",
    difficulty: "medium", type: "proportional-reasoning",
    gen: (r): RawQ => {
      const which = pick(["mass", "amplitude", "spring constant"], r);
      const spring = which !== "spring constant";
      const factor = pick([2, 4], r);
      const answer = spring
        ? which === "mass"
          ? { text: `T increases by √${factor}×`, tempt: "Mass sits under the root: T = 2π√(m/k), so doubling m multiplies T by √2, not 2." }
          : { text: "T doesn't change", tempt: "Amplitude affects the distance traveled and max speed — but they compensate exactly." }
        : { text: `T decreases by √${factor}×`, tempt: "k is in the denominator under the root — quadrupling k halves... no, divides T by 2." };
      const correctText = which === "mass" ? `T increases by √${factor}×` : which === "amplitude" ? "T doesn't change" : `T decreases by ${factor % 2 === 0 ? factor / 2 : Math.sqrt(factor)}×`;
      void answer;
      const q = mkCorrect(correctText, [
        { text: "T doubles", tempt: "Check where the quantity sits: under a square root, in a numerator, or absent." },
        { text: "T halves", tempt: "Halving needs the quantity to quadruple in the denominator." },
        { text: "T is unchanged", tempt: "True for amplitude only — mass and k absolutely change T." },
      ], r);
      return {
        prompt: `For a mass–spring oscillator, what happens to the period if the ${which} is multiplied by ${factor}?`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `T = 2π√(m/k). ${which === "mass" ? `m → ${factor}m gives T → √${factor}·T.` : which === "amplitude" ? "A never appears in the period formula — isochronism." : `k → ${factor}k gives T → T/√${factor}.`}`,
        equations: ["T = 2\\pi\\sqrt{m/k}"],
        commonMistake: "Applying the factor without checking whether the quantity is under a root or inverted.",
        apStrategy: "Period questions: locate the variable in the formula, then transform. Square roots halve exponents; denominators invert.",
        category: "proportional" as never,
      };
    },
  },
  {
    id: "shm-energy-split",
    course: "p1", unit: 7, topic: "Oscillations", conceptId: "p1-shm",
    difficulty: "hard", type: "graph",
    gen: (r): RawQ => {
      const q = mkCorrect("½mv² is greatest; the spring stores zero energy", [
        { text: "The spring stores the most energy; kinetic energy is zero", tempt: "That's the turning point (x = ±A), not the equilibrium position." },
        { text: "Both are half the total", tempt: "Half-and-half happens at x = A/√2, not at x = 0." },
        { text: "Total energy is zero", tempt: "Total E = ½kA² is constant and nonzero — position only reshuffles the split." },
      ], r);
      return {
        prompt: `A mass on a spring oscillates between x = −A and x = +A. At the instant it passes through x = 0 (moving right), which statement is correct?`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: "At x = 0 the spring is unstretched: U = 0. All the energy is kinetic: K = ½kA² = ½mv²max. The mass moves fastest at equilibrium.",
        equations: ["E = \\tfrac12 kA^2 = \\tfrac12 mv_{\\max}^2 + U(x)"],
        commonMistake: "Thinking the mass is slowest at the center because it 'reverses there' — it doesn't reverse there.",
        apStrategy: "Map positions to energy splits: x = ±A all U; x = 0 all K; in between, fractions of each.",
        category: "graph",
      };
    },
  },
];

// =====================================================================
// FLUIDS (P1 Unit 8)
// =====================================================================
export const FLUIDS_BANK: Archetype[] = [
  {
    id: "fluid-continuity",
    course: "p1", unit: 8, topic: "Fluids", conceptId: "p1-continuity",
    difficulty: "medium", type: "quantitative",
    gen: (r): RawQ => {
      const d1 = ri(4, 10); // cm
      const ratio = pick([2, 3, 4], r);
      const d2 = d1 / ratio;
      const v1 = ri(2, 6);
      const v2 = v1 * ratio * ratio; // area ratio is (d1/d2)²
      const q = mkNum(v2, [
        { v: v1 * ratio, tempt: "Speed scales with AREA ratio, not diameter ratio — area goes as d²." },
        { v: v1 / (ratio * ratio), tempt: "Inverted: narrowing the pipe SPEEDS the flow up." },
        { v: v1, tempt: "Continuity forbids constant v when the area changes." },
      ], "m/s", r);
      return {
        prompt: `Water flows at ${v1} m/s through a pipe of diameter ${d1} cm. The pipe narrows smoothly to ${fmt(d2, 1)} cm. What is the speed in the narrow section?`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `Continuity: A₁v₁ = A₂v₂. A ∝ d², so v₂ = v₁·(d₁/d₂)² = ${v1}·${ratio}² = ${fmt(v2)} m/s.`,
        equations: ["A_1v_1 = A_2v_2"],
        commonMistake: "Using the diameter ratio directly instead of its square (area).",
        apStrategy: "Whenever a pipe geometry changes, convert diameters to areas before applying continuity.",
        category: "wrong-equation",
      };
    },
  },
  {
    id: "fluid-buoyancy-fraction",
    course: "p1", unit: 8, topic: "Fluids", conceptId: "p1-buoyancy",
    difficulty: "hard", type: "quantitative",
    gen: (r): RawQ => {
      const rhoObj = pick([600, 700, 800, 900], r);
      const rhoF = pick([1000, 1025], r);
      const frac = rhoObj / rhoF;
      const pct = Math.round(frac * 100);
      const q = mkCorrect(`${pct}% submerged`, [
        { text: `${100 - pct}% submerged`, tempt: "Inverted — the fraction UNDER equals ρ_obj/ρ_fluid." },
        { text: "Fully submerged", tempt: "Fully submerged means ρ_obj ≥ ρ_fluid; here it floats." },
        { text: `${Math.round(frac * 50)}% submerged`, tempt: "Half of the correct fraction — you may have divided by 2 unnecessarily." },
      ], r);
      return {
        prompt: `A block of density ${rhoObj} kg/m³ floats in a fluid of density ${rhoF} kg/m³. What fraction of the block is submerged?`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `Floating equilibrium: ρ_obj·V·g = ρ_f·V_sub·g → V_sub/V = ρ_obj/ρ_f = ${rhoObj}/${rhoF} = ${fmt(frac, 3)} ≈ ${pct}%.`,
        equations: ["\\frac{V_{\\text{sub}}}{V} = \\frac{\\rho_{\\text{obj}}}{\\rho_{\\text{fluid}}}"],
        commonMistake: "Reporting the above-water fraction instead of the submerged one.",
        apStrategy: "Floating: set weight equal to buoyant force and let the volumes do the talking — the object's own volume cancels.",
        category: "conceptual",
      };
    },
  },
];

// ---------- helper for choice-based (non-numeric) questions ----------
function mkCorrect(correct: string, distractors: { text: string; tempt: string }[], r: RngLike) {
  const all = [{ text: correct, tempt: undefined as string | undefined }, ...distractors];
  const shuffled = all.map((d) => ({ d, k: r() })).sort((a, b) => a.k - b.k).map((o) => o.d);
  const correctIdx = shuffled.findIndex((d) => d.text === correct);
  return {
    choices: shuffled.map((d) => d.text),
    correct: correctIdx,
    tempt: shuffled.map((d) => d.tempt),
  };
}
type RngLike = () => number;

// fix mkNum import usage in energy-conservation-ramp (difficulty typed as Difficulty, not number check)
