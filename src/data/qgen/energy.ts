// Archetype bank 3: Energy, Momentum, Rotation, Oscillations, Fluids.
// Each archetype is a distinct AP reasoning pattern; variants vary scenario,
// representation, asked quantity, and numbers with computed distractors.
import type { Archetype, RawQ, Rng } from "./core";
import { ri, rf, pick, fmt, mkNum, SCENARIOS } from "./core";

const G = 9.8;

/** shuffle a text-answer MCQ, keeping the correct answer's index tracked */
function mkCorrect(correct: string, distractors: { text: string; tempt: string }[], r: Rng) {
  const all: { text: string; tempt?: string }[] = [{ text: correct }, ...distractors];
  const shuffled = all.map((d) => ({ d, k: r() })).sort((a, b) => a.k - b.k).map((o) => o.d);
  const correctIdx = shuffled.findIndex((d) => d.text === correct);
  return {
    choices: shuffled.map((d) => d.text),
    correct: correctIdx,
    tempt: shuffled.map((d) => (d.tempt satisfies string | undefined)),
  };
}

// =====================================================================
// ENERGY (P1 Unit 3 / CM)
// =====================================================================
export const ENERGY: Archetype[] = [
  {
    id: "en-work-basic",
    course: "p1", unit: 3, topic: "Energy", conceptId: "p1-work",
    difficulty: "easy", type: "quantitative",
    gen: (r): RawQ => {
      const obj = pick(SCENARIOS.mover, r);
      const F = ri(4, 20, r);
      const d = ri(3, 12, r);
      const work = F * d;
      const q = mkNum(work, [
        { v: F + d, tempt: "Added force and distance — work is their PRODUCT, not sum." },
        { v: 0.5 * F * d, tempt: "Halved — no ½ appears when the force is constant." },
        { v: F * d * 2, tempt: "Doubled — likely double-counted two segments." },
      ], "J", r);
      return {
        prompt: `${pick(SCENARIOS.student, r)} pulls a rope with a constant ${F} N force, dragging ${obj} ${d} m across a horizontal lab bench. The rope is horizontal. How much work does the rope's force do?`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `W = F·d·cosθ with θ = 0° (horizontal force, horizontal motion): W = ${F}·${d} = ${fmt(work)} J.`,
        equations: ["W = Fd\\cos\\theta"],
        commonMistake: "Using sinθ instead of cosθ, or forgetting that θ = 0° makes cosθ = 1.",
        apStrategy: "Identify what θ is BEFORE computing: θ is between force and displacement, not between force and the surface.",
        category: "vector",
      };
    },
  },
  {
    id: "en-conservation-prop",
    course: "p1", unit: 3, topic: "Energy", conceptId: "p1-energy-conservation",
    difficulty: "medium", type: "proportional-reasoning",
    gen: (r): RawQ => {
      const f = pick([2, 3, 4] as const, r);
      const q = mkCorrect(`√${f} × v`, [
        { text: "v", tempt: "Height changed, so speed must change — v² ∝ h." },
        { text: `${f} × v`, tempt: "That's the ENERGY scaling (×" + f + "), not speed — K = ½mv².", },
        { text: `${f * f} × v`, tempt: "That's the v² scaling — speed itself grows as √h.", },
      ], r);
      return {
        prompt: `A sled slides from rest down a frictionless hill of height h, reaching the bottom at speed v. On a hill of height ${f}h, its speed at the bottom is:`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `mgh = ½mv² → v = √(2gh). ${f}× the height → √${f} ≈ ${fmt(Math.sqrt(f))}× the speed. Energy scales linearly with h; speed scales as its square root.`,
        equations: ["mgh = \\tfrac{1}{2}mv^2"],
        commonMistake: "Assuming speed is proportional to height.",
        apStrategy: "Solve symbolically first: v ∝ √h. The proportionality IS the answer — no numbers required.",
        category: "proportional",
      };
    },
  },
  {
    id: "en-ramp-friction",
    course: "p1", unit: 3, topic: "Energy", conceptId: "p1-energy-conservation",
    difficulty: "hard", type: "quantitative",
    gen: (r): RawQ => {
      const m = ri(2, 8, r);
      const h = ri(3, 10, r);
      const angle = pick([30, 37, 45] as const, r);
      const mu = rf(0.1, 0.4, 0.05, r);
      const sin = Math.sin(angle * Math.PI / 180), cos = Math.cos(angle * Math.PI / 180);
      const L = h / sin;
      const vf = Math.sqrt(Math.max(0.1, 2 * G * h - 2 * mu * G * cos * L));
      const vNoFric = Math.sqrt(2 * G * h);
      const q = mkNum(vf, [
        { v: vNoFric, tempt: "That's the frictionless answer — μ was given, so friction must remove energy." },
        { v: Math.sqrt(Math.max(0.1, 2 * G * h - mu * G * h)), tempt: "Used the vertical height in the friction term — friction acts over the ramp length L = h/sinθ." },
        { v: vf / 2, tempt: "Dropped a factor of 2 in the v² bookkeeping — recheck." },
      ], "m/s", r);
      return {
        prompt: `A ${m} kg crate slides from rest down a ramp of height ${h} m inclined at ${angle}°, with coefficient of kinetic friction μ = ${fmt(mu)} between crate and ramp. What is its speed at the bottom? (g = ${G} m/s²)`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `Energy: mgh = ½mv² + μmg·cosθ·L with L = h/sinθ = ${fmt(L, 2)} m. Mass cancels: v = √(2gh − 2μg·cosθ·h/sinθ) = ${fmt(vf)} m/s.`,
        equations: ["mgh = \\tfrac{1}{2}mv^2 + \\mu mg\\cos\\theta\\,L", "L = h/\\sin\\theta"],
        commonMistake: "Using the vertical height as the friction distance instead of the ramp length.",
        apStrategy: "With friction, energy problems need the distance ALONG the surface. Translate height to path length with trig before balancing energy.",
        category: "wrong-equation",
      };
    },
  },
  {
    id: "en-power-motor",
    course: "p1", unit: 3, topic: "Energy", conceptId: "p1-power",
    difficulty: "medium", type: "quantitative",
    gen: (r): RawQ => {
      const m = ri(50, 200, r);
      const h = ri(5, 20, r);
      const t = ri(4, 15, r);
      const P = (m * G * h) / t;
      const q = mkNum(P, [
        { v: (m * G * h) / (t * 60), tempt: "Converted seconds to minutes — power is J/s; keep t in seconds." },
        { v: (m * G) / t, tempt: "Dropped the height — power needs the energy delivered, mgh." },
        { v: (m * G * h) / (t * t), tempt: "Squared the time — no t² belongs here." },
      ], "W", r, 1);
      return {
        prompt: `A motor lifts a ${m} kg load at constant speed through a height of ${h} m in ${t} s. What average power does the motor deliver to the load?`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `P = W/t = mgh/t = (${m})(${G})(${h})/${t} = ${fmt(P, 1)} W. Constant speed means no ΔK — all power goes to raising gravitational potential energy.`,
        equations: ["P = W/t = mgh/t"],
        commonMistake: "Adding a kinetic-energy term even though speed is constant.",
        apStrategy: "Constant speed is a hint: K doesn't change, so track only the potential-energy change.",
        category: "wrong-equation",
      };
    },
  },
  {
    id: "en-ke-prop",
    course: "p1", unit: 3, topic: "Energy", conceptId: "p1-energy-conservation",
    difficulty: "easy", type: "proportional-reasoning",
    gen: (r): RawQ => {
      const factor = pick([2, 3] as const, r);
      const q = mkCorrect(`Increases by ${factor ** 2}×`, [
        { text: `Increases by ${factor}×`, tempt: "Speed is squared in K = ½mv² — the factor gets squared too." },
        { text: "Unchanged", tempt: "Kinetic energy depends on speed; it can't ignore a change in v." },
        { text: `Increases by ${factor ** 4}×`, tempt: "That would square it twice — only one v sits in the formula." },
      ], r);
      return {
        prompt: `The speed of a moving object increases by a factor of ${factor} while its mass stays constant. Its kinetic energy…`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `K = ½mv². With v → ${factor}v, K → ½m(${factor}v)² = ${factor ** 2} × (½mv²).`,
        equations: ["K = \\tfrac{1}{2}mv^2"],
        commonMistake: "Treating K as linear in v — momentum is linear; energy is not.",
        apStrategy: "Proportional reasoning: write the formula, substitute the factor, simplify. Squared quantities dominate.",
        category: "proportional",
      };
    },
  },
  {
    id: "en-u-diagram",
    course: "cm", unit: 3, topic: "Energy", conceptId: "cm-work-integral",
    difficulty: "ap", type: "graph",
    gen: (r): RawQ => {
      const where = pick([
        "a local minimum of U(x)",
        "a local maximum of U(x)",
        "the point where U(x) crosses zero",
        "the point where U(x) is steepest",
      ] as const, r);
      const answers: Record<(typeof where), { text: string; tempt: string }> = {
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
          text: "Maximum magnitude of force, directed downhill",
          tempt: "Steepest slope = largest |F|. It's the opposite of equilibrium.",
        },
      };
      const correct = answers[where];
      const distractors = (Object.keys(answers) as (typeof where)[])
        .filter((k) => k !== where)
        .map((k) => ({ text: answers[k].text, tempt: answers[k].tempt }));
      const q = mkCorrect(correct.text, distractors, r);
      return {
        prompt: `A particle moves along the x-axis under the potential energy function U(x) shown. At ${where}, which statement is true?`,
        diagram: { kind: "vgraph", graph: "vt", shape: "double-well", note: "Potential energy U(x) vs position x" },
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: "F = −dU/dx: force is the negative slope of the U(x) graph. Equilibrium lives at extrema (slope zero); minima are stable, maxima unstable.",
        equations: ["F_x = -\\frac{dU}{dx}"],
        commonMistake: "Equating U = 0 with equilibrium, or confusing stability with force magnitude.",
        apStrategy: "Read energy diagrams by slope: steep = strong force, sign from the downhill direction; turning points occur where the total-energy line meets U(x).",
        category: "graph",
      };
    },
  },
];

// =====================================================================
// MOMENTUM (P1 Unit 4 / CM Unit 4)
// =====================================================================
export const MOMENTUM: Archetype[] = [
  {
    id: "mo-impulse-graph",
    course: "p1", unit: 4, topic: "Momentum", conceptId: "p1-momentum",
    difficulty: "medium", type: "quantitative",
    gen: (r): RawQ => {
      const F = ri(4, 20, r);
      const t = ri(2, 5, r);
      const m = ri(2, 6, r);
      const J = F * t;
      const dv = J / m;
      const q = mkNum(J, [
        { v: F, tempt: "That's just the force — impulse is force × time." },
        { v: F + t, tempt: "Added instead of multiplied." },
        { v: F * t * m, tempt: "Multiplied by mass twice — J = FΔt directly, no mass factor." },
      ], "N·s", r);
      return {
        prompt: `A constant force of ${F} N acts on a ${m} kg cart for ${t} s. What is the impulse delivered to the cart?`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `J = FΔt = ${F} × ${t} = ${J} N·s. This equals Δp; the cart's speed change is Δv = J/m = ${fmt(dv, 2)} m/s (from rest).`,
        equations: ["J = F\\Delta t = \\Delta p"],
        commonMistake: "Forgetting to divide by mass when converting impulse to speed.",
        apStrategy: "Impulse is the area under a force–time graph. For triangle or curve shapes, compute the AREA — never multiply endpoints blindly.",
        category: "graph",
      };
    },
  },
  {
    id: "mo-bounce-vs-stop",
    course: "p1", unit: 4, topic: "Momentum", conceptId: "p1-momentum",
    difficulty: "medium", type: "conceptual",
    gen: (r): RawQ => {
      const m = ri(1, 5, r);
      const v = ri(2, 8, r);
      const obj = pick(SCENARIOS.mover, r);
      const q = mkCorrect("Bouncing: |Δp| is twice as large", [
        { text: "Stopping: |Δp| is twice as large", tempt: "Stopping changes momentum from mv to 0; bouncing goes from mv to −mv — twice the swing." },
        { text: "They're equal — same speed change", tempt: "Same SPEED change, but velocity reverses when bouncing: Δv = 2v, not v." },
        { text: "Neither — Δp is zero because energy is conserved", tempt: "Energy may be ~conserved in a bounce, but the ball's momentum changes; the wall takes the difference." },
      ], r);
      return {
        prompt: `A ${m} kg ${obj} hits a wall at ${v} m/s. Scenario A: it sticks and stops. Scenario B: it bounces back at ${v} m/s. Compare the magnitude of the ${obj}'s momentum change.`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `Stopping: Δp = 0 − mv (magnitude ${m * v} kg·m/s). Bouncing: Δp = −mv − mv (magnitude ${2 * m * v} kg·m/s). Bouncing doubles the impulse the wall must supply.`,
        equations: ["\\Delta p = mv_f - mv_i"],
        commonMistake: "Forgetting momentum is a vector — direction reversal matters even at equal speed.",
        apStrategy: "Always write Δp = mv_f − mv_i with signs. 'Bounces back with the same speed' is code for v_f = −v_i.",
        category: "sign",
      };
    },
  },
  {
    id: "mo-collision-classify",
    course: "p1", unit: 4, topic: "Momentum", conceptId: "p1-collisions",
    difficulty: "medium", type: "conceptual",
    gen: (r): RawQ => {
      const kind = pick([
        { desc: "stick together after colliding", K: "kinetic energy decreases", why: "deformation and thermal energy absorb the difference" },
        { desc: "bounce apart with no mechanical energy loss", K: "kinetic energy is conserved", why: "that's the definition of elastic" },
        { desc: "bounce apart but with a loud clank and slight warming", K: "kinetic energy decreases", why: "sound and heat carry energy away" },
      ] as const, r);
      const q = mkCorrect(`Momentum is conserved; ${kind.K}`, [
        { text: "Momentum is conserved; kinetic energy is also conserved", tempt: "K conservation defines ELASTIC only — sticking or clanking loses K." },
        { text: "Momentum decreases; kinetic energy is conserved", tempt: "Momentum is conserved whenever no external net force acts — internal forces cancel in pairs." },
        { text: "Neither momentum nor kinetic energy is conserved", tempt: "Momentum is the robust one here; K may drop, but p cannot." },
      ], r);
      return {
        prompt: `Two carts collide on a level track and ${kind.desc}. Which statement applies?`,
        diagram: { kind: "collision", m1: 2, v1: 3, m2: 2, v2: 0, note: kind.desc },
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `All collisions conserve momentum (isolated system — internal forces cancel via Newton's third law). The collision type only decides K: this one is in the "${kind.desc}" family, so ${kind.K} because ${kind.why}.`,
        equations: ["\\Sigma p = \\text{const (always)}, \\quad \\Sigma K = \\text{const (elastic only)}"],
        commonMistake: "Applying energy conservation to any collision.",
        apStrategy: "First question for any collision: is kinetic energy conserved? The answer picks your equation count: 1 (inelastic) or 2 (elastic).",
        category: "wrong-equation",
      };
    },
  },
  {
    id: "mo-elastic-limit",
    course: "p1", unit: 4, topic: "Momentum", conceptId: "p1-collisions",
    difficulty: "ap", type: "conceptual",
    gen: (r): RawQ => {
      const sameMass = r() < 0.5;
      return sameMass
        ? {
            prompt: "Two IDENTICAL carts collide elastically on a level track. Cart A moves at v, cart B is at rest. After the collision:",
            choices: ["A stops, B moves off at v", "Both move at v/2", "A bounces back at v", "Both stop"],
            correct: 0,
            tempt: [
              undefined,
              "That's the perfectly inelastic outcome — elasticity swaps the velocities instead.",
              "Reversal happens only if B is much heavier.",
              "That violates momentum conservation (total p was mv).",
            ],
            explanation: "Equal masses + elastic = velocity exchange. A arrives with v and leaves with 0; B departs at v. Check: both p and K survive. This is Newton's cradle.",
            equations: ["v_1' = 0, \\; v_2' = v_1 \\; (m_1 = m_2)"],
            commonMistake: "Applying the stick-together result to an elastic hit.",
            apStrategy: "Limiting cases: m₁ = m₂ must give velocity exchange — test any remembered formula against it.",
            category: "conceptual",
          }
        : {
            prompt: "A very light cart (mass m) moving at v hits a very heavy cart (mass 100m) at rest, ELASTICALLY. After the collision the light cart:",
            choices: ["Continues forward, slower", "Stops dead", "Bounces back at nearly v", "Bounces back at nearly 2v"],
            correct: 2,
            tempt: [
              undefined,
              "Stopping is the equal-mass result — here the wall-like heavy cart reflects it.",
              undefined,
              "Nearly v, not 2v — that would double its kinetic energy.",
            ],
            explanation: "For m₁ ≪ m₂ elastic: v₁' ≈ −v₁ (bounces back at nearly its original speed), and the heavy cart barely moves. Think: a tennis ball off a brick wall.",
            equations: ["v_1' = \\frac{m_1 - m_2}{m_1 + m_2} v_1 \\xrightarrow{\\;m_2 \\gg m_1\\;} -v_1"],
            commonMistake: "Mixing up the light-on-heavy vs heavy-on-light cases.",
            apStrategy: "Take the formula to its limits: m₂ → ∞ must reproduce 'bounce off a wall'. If it doesn't, you have the wrong formula.",
            category: "conceptual",
          };
    },
  },
  {
    id: "mo-explosion-2d",
    course: "cm", unit: 4, topic: "Momentum", conceptId: "cm-momentum",
    difficulty: "ap", type: "quantitative",
    gen: (r): RawQ => {
      const m = ri(2, 4, r);
      const v = ri(4, 8, r);
      const angle = pick([30, 45, 60] as const, r);
      // At top of arc: momentum purely horizontal, p = mv (total mass m).
      // Fragment 1 (m/2) leaves horizontally at v → takes ALL horizontal momentum.
      // Fragment 2 (m/2) must carry zero horizontal momentum → moves straight down.
      // The question asks fragment 2's speed given the explosion's vertical impulse
      // leaves fragment 2 with speed such that vertical momenta cancel: fragment 1 has none.
      // So fragment 2 can have any vertical speed only if the SYSTEM had none — instead ask:
      // fragment 1 leaves at 30° above horizontal at speed v; find fragment 2's velocity components.
      const px = (m / 2) * v * Math.cos(angle * Math.PI / 180);
      const py1 = (m / 2) * v * Math.sin(angle * Math.PI / 180);
      // Fragment 2 must carry px forward and −py1 downward:
      const v2x = px / (m / 2) === v * Math.cos(angle * Math.PI / 180) ? v * Math.cos(angle * Math.PI / 180) : 0;
      void v2x;
      const v2y = py1 / (m / 2);
      const v2 = Math.sqrt((v * Math.cos(angle * Math.PI / 180)) ** 2 + v2y ** 2);
      const q = mkNum(v2, [
        { v: v2y, tempt: "That's only the vertical component — fragment 2 also carries the leftover horizontal momentum." },
        { v: v * Math.cos(angle * Math.PI / 180), tempt: "That's fragment 1's horizontal component, not fragment 2's speed." },
        { v: v, tempt: "The fragments don't simply inherit the original speed — momentum components must balance." },
      ], "m/s", r);
      return {
        prompt: `A ${m} kg projectile moves at ${v} m/s when it explodes into two equal fragments. Fragment 1 (mass m/2) leaves at ${angle}° above the horizontal, still at speed ${v} m/s. What is the SPEED of fragment 2 immediately after the explosion?`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `Before: p = ${fmt(m * v)} kg·m/s horizontal. Fragment 1 carries p₁ₓ = ${fmt(px, 2)}, p₁ᵧ = ${fmt(py1, 2)}. Fragment 2 must supply the rest: p₂ₓ = ${fmt(m * v - px, 2)} forward, p₂ᵧ = ${fmt(-py1, 2)} downward → |v₂| = √(vₓ² + vᵧ²) = ${fmt(v2)} m/s.`,
        equations: ["\\Sigma p_{x,i} = \\Sigma p_{x,f}, \\quad \\Sigma p_{y,i} = \\Sigma p_{y,f}"],
        commonMistake: "Applying momentum conservation without separating x and y components.",
        apStrategy: "Explosions: conserve momentum component-by-component. Write both component equations before touching numbers.",
        category: "vector",
      };
    },
  },
];

// =====================================================================
// ROTATION (P1 Units 5–6 / CM)
// =====================================================================
export const ROTATION: Archetype[] = [
  {
    id: "ro-torque-balance",
    course: "p1", unit: 5, topic: "Rotation", conceptId: "p1-torque",
    difficulty: "medium", type: "quantitative",
    gen: (r): RawQ => {
      const m1 = ri(2, 8, r);
      const d1 = rf(0.5, 2, 0.25, r);
      const d2 = rf(0.5, 2.5, 0.25, r);
      const m2 = (m1 * d1) / d2;
      const q = mkNum(d2, [
        { v: d1, tempt: "Balance needs EQUAL torques, not equal distances — the unequal masses change the lever arm." },
        { v: m1 * d1, tempt: "That's m₁d₁ in kg·m — a torque, not a distance. Divide by m₂." },
        { v: d2 / 2, tempt: "No factor of ½ appears in the torque balance." },
      ], "m", r);
      return {
        prompt: `A uniform meter stick pivots at its center. A ${m1} kg mass hangs ${fmt(d1, 2)} m left of the pivot. Where must a ${fmt(m2, 2)} kg mass hang on the right to balance it?`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `Στ = 0: m₁g·d₁ = m₂g·d₂ → d₂ = m₁d₁/m₂ = ${m1}·${fmt(d1, 2)}/${fmt(m2, 2)} = ${fmt(d2, 2)} m. The g's cancel — balance is about mass × distance products.`,
        equations: ["m_1 g d_1 = m_2 g d_2"],
        commonMistake: "Balancing masses instead of torques (ignoring lever arms).",
        apStrategy: "Rotational equilibrium: pick the pivot, list every torque with sign (CCW +, CW −), set the sum to zero.",
        category: "vector",
      };
    },
  },
  {
    id: "ro-inertia-rank",
    course: "p1", unit: 5, topic: "Rotation", conceptId: "p1-rot-dynamics",
    difficulty: "easy", type: "conceptual",
    gen: (r): RawQ => {
      const I = pick([
        { shape: "a hoop (all mass at the rim)", c: "largest", I: "mR²", correct: 0 },
        { shape: "a solid disk", c: "middle", I: "½mR²", correct: 1 },
        { shape: "a solid sphere", c: "smallest", I: "0.4mR²", correct: 2 },
      ] as const, r);
      const q = mkCorrect(
        { 0: "The hoop (I = mR²)", 1: "The disk (I = ½mR²)", 2: "The sphere (I = 0.4mR²)" }[I.correct],
        [
          { text: "The hoop (I = mR²)", tempt: "Mass AT the rim is farthest from the axis — r² weights it most." },
          { text: "The disk (I = ½mR²)", tempt: undefined as unknown as string },
          { text: "The sphere (I = 0.4mR²)", tempt: "A sphere concentrates mass toward the center — smallest average r²." },
        ].filter((d) => d.text !== { 0: "The hoop (I = mR²)", 1: "The disk (I = ½mR²)", 2: "The sphere (I = 0.4mR²)" }[I.correct]),
        r,
      );
      return {
        prompt: `Three objects have the same mass and radius: a hoop (I = mR²), a solid disk (I = ½mR²), and a solid sphere (I = 0.4mR²). Which has the ${I.c} rotational inertia about its center — ${I.shape}?`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `I depends on WHERE the mass sits relative to the axis: I = ∫r²dm. Hoop mR² (all mass at R), disk ½mR², sphere 0.4mR². Same m and R — different I.`,
        equations: ["I = \\int r^2\\,dm"],
        commonMistake: "Believing same mass + same radius → same rotational inertia.",
        apStrategy: "Rank I by imagining mass sliding toward or away from the axis — no formulas needed for rankings.",
        category: "conceptual",
      };
    },
  },
  {
    id: "ro-rolling-race",
    course: "p1", unit: 6, topic: "Rotation", conceptId: "p1-rolling",
    difficulty: "hard", type: "conceptual",
    gen: (r): RawQ => {
      const objA = pick(["hoop", "ring"] as const, r);
      const objB = pick(["solid disk", "solid sphere"] as const, r);
      const q = mkCorrect(`The ${objB} — smaller I/mR² means more energy goes to translation`, [
        { text: `The ${objA} — larger I stores more rotational energy`, tempt: "More energy in rotation means LESS in translation — that's slower, not faster." },
        { text: "They tie — mass and radius are equal", tempt: "Mass and radius cancel only when I/mR² matches; these shapes differ." },
        { text: "Depends on which is heavier", tempt: "Mass cancels from the rolling acceleration entirely." },
      ], r);
      return {
        prompt: `A ${objA} and a ${objB} (equal mass and radius) roll without slipping down the same incline. Which reaches the bottom first, and why?`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `a = g·sinθ/(1 + I/mR²). Hoop: I/mR² = 1. Disk: ½. Sphere: 0.4. Smaller c → larger a → first to the bottom. The ${objB} wins regardless of mass.`,
        equations: ["a = \\frac{g\\sin\\theta}{1 + I/mR^2}"],
        commonMistake: "Assuming the heavier object wins — mass cancels in rolling without slipping.",
        apStrategy: "Rolling races are decided by I/mR² alone: hoop 1 > disk ½ > sphere 0.4.",
        category: "conceptual",
      };
    },
  },
  {
    id: "ro-ang-momentum-K",
    course: "p1", unit: 6, topic: "Rotation", conceptId: "p1-angular-momentum",
    difficulty: "ap", type: "conceptual",
    gen: (r): RawQ => {
      const f = pick([2, 3] as const, r);
      const q = mkCorrect(`L unchanged; K multiplied by ${f}`, [
        { text: `L multiplied by 1/${f}; K unchanged`, tempt: "No external torque → L is fixed; ω changes to compensate." },
        { text: "Both unchanged", tempt: "L is the conserved quantity here, not K — muscles did work pulling mass inward." },
        { text: `L multiplied by ${f}; K multiplied by ${f}`, tempt: "L would only grow with an external torque — there is none." },
      ], r);
      return {
        prompt: `A spinning skater pulls her arms in, reducing her moment of inertia to 1/${f} of its original value. Her angular momentum L and rotational kinetic energy K become:`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `L = Iω is conserved (no external torque): I → I/${f} forces ω → ${f}ω. Then K = ½Iω² = ½(I/${f})(${f}ω)² = ${f}·K₀. The extra energy came from the skater's WORK pulling mass inward.`,
        equations: ["I\\omega_i = I\\omega_f, \\quad K = \\tfrac{1}{2}I\\omega^2"],
        commonMistake: "Assuming kinetic energy is conserved too.",
        apStrategy: "When L is conserved and I changes, always recompute K — it changes unless I is constant. Hunt for the work source.",
        category: "conceptual",
      };
    },
  },
];

// =====================================================================
// OSCILLATIONS (P1 Unit 7 / CM)
// =====================================================================
export const OSCILLATIONS: Archetype[] = [
  {
    id: "os-period-prop",
    course: "p1", unit: 7, topic: "Oscillations", conceptId: "p1-shm",
    difficulty: "medium", type: "proportional-reasoning",
    gen: (r): RawQ => {
      const isSpring = r() < 0.5;
      const f = pick([2, 4, 9] as const, r);
      return isSpring
        ? {
            prompt: `A mass on a spring has period T. The spring constant is increased by a factor of ${f}. The new period is:`,
            choices: [`T/${f}`, `T/√${f}`, `${f}T`, `√${f}T`],
            correct: 1,
            tempt: [
              "The square root! T = 2π√(m/k).",
              undefined,
              "Increasing k makes the spring STIFFER — faster oscillation, shorter period.",
              "Wrong direction entirely — stiffer springs oscillate faster.",
            ],
            explanation: `T = 2π√(m/k): k ×${f} → T ÷ √${f} = T/${fmt(Math.sqrt(f))}. Square roots halve the effect of the factor.`,
            equations: ["T = 2\\pi\\sqrt{m/k}"],
            commonMistake: "Forgetting the square root in period formulas.",
            apStrategy: "Under-the-root variables move the period by their square root. Say it aloud: 'k quadruples, T halves.'",
            category: "proportional",
          }
        : {
            prompt: `A pendulum has period T on Earth. Taken to a planet with ${f}× Earth's gravitational field strength, its period becomes:`,
            choices: [`T/${f}`, `T/√${f}`, `√${f}T`, "T — pendulums don't feel gravity"],
            correct: 1,
            tempt: [
              "Close — but g sits under a square root.",
              undefined,
              "T = 2π√(L/g): stronger gravity → faster swings.",
              "Pendulums absolutely feel gravity — it's the restoring force.",
            ],
            explanation: `T = 2π√(L/g): g ×${f} → T ÷ √${f}. On the Moon (g/6) pendulums run √6 ≈ 2.4× slower — why astronauts' swings looked dreamy.`,
            equations: ["T = 2\\pi\\sqrt{L/g}"],
            commonMistake: "Linear reasoning about a square-root relationship.",
            apStrategy: "Period formulas: T = 2π√(stuff). Any change under the root shrinks to its square root in the period.",
            category: "proportional",
          };
    },
  },
  {
    id: "os-energy-position",
    course: "p1", unit: 7, topic: "Oscillations", conceptId: "p1-shm",
    difficulty: "hard", type: "quantitative",
    gen: (r): RawQ => {
      const half = r() < 0.5;
      return half
        ? {
            prompt: "A mass on a spring oscillates with amplitude A. At displacement x = A/2, the kinetic energy is what fraction of the total energy?",
            choices: ["1/2", "3/4", "1/4", "Depends on the period"],
            correct: 1,
            tempt: [
              "Compute U first: U = ½kx² = ¼·(½kA²). Then K = E − U.",
              undefined,
              "Careful: U at A/2 is one QUARTER of E, so K is the rest.",
              "Nothing here depends on the period — only on position.",
            ],
            explanation: "E = ½kA². At x = A/2: U = ½k(A/2)² = ¼(½kA²) = E/4. So K = E − E/4 = 3E/4. Kinetic energy dominates between the midpoint and center.",
            equations: ["E = \\tfrac{1}{2}kA^2, \\quad U = \\tfrac{1}{2}kx^2"],
            commonMistake: "Assuming K and U split evenly away from the extremes.",
            apStrategy: "In SHM, compute U from position and get K by subtraction. Never re-derive velocity unless asked.",
            category: "algebra",
          }
        : {
            prompt: "For a mass oscillating on a spring, where is the magnitude of the acceleration greatest?",
            choices: ["At maximum displacement (x = ±A)", "At equilibrium (x = 0)", "Halfway between", "It's constant throughout"],
            correct: 0,
            tempt: [
              undefined,
              "Speed is greatest there, but acceleration follows FORCE — and the spring force is smallest at x = 0.",
              undefined,
              "a = −(k/m)x — acceleration grows with displacement.",
            ],
            explanation: "F = −kx, so a = −(k/m)x: acceleration magnitude is proportional to displacement. Max at the turning points (spring most stretched), zero at the center — exactly opposite to velocity.",
            equations: ["a = -\\frac{k}{m}x"],
            commonMistake: "Confusing maximum speed's location with maximum acceleration's.",
            apStrategy: "v and a in SHM are a quarter-cycle out of step: max a at the extremes, max v at the center. Keep the two straight.",
            category: "conceptual",
          };
    },
  },
  {
    id: "os-shm-graph-read",
    course: "cm", unit: 7, topic: "Oscillations", conceptId: "cm-shm-ode",
    difficulty: "medium", type: "graph",
    gen: (r): RawQ => {
      const which = pick(["velocity is most negative", "acceleration is most positive", "speed is greatest"] as const, r);
      return {
        prompt: `A mass on a spring has position x(t) = A cos(ωt). At t = 0 it is at x = +A. A quarter period later (t = π/2ω), the mass's:`,
        diagram: { kind: "vgraph", graph: "xt", shape: "cosine", note: "x(t) = A cos(ωt)" },
        choices: [
          which === "velocity is most negative" ? "velocity is most negative" : "velocity is zero",
          which === "acceleration is most positive" ? "acceleration is most positive" : "acceleration is most negative",
          which === "speed is greatest" ? "speed is greatest" : "speed is zero",
          "position is x = +A again",
        ],
        correct: which === "velocity is most negative" ? 0 : which === "acceleration is most positive" ? 0 : 0,
        tempt: [
          undefined,
          undefined,
          undefined,
          "It returns to +A after a FULL period, not a quarter.",
        ],
        explanation: "At t = π/2ω: x = 0 (passing through equilibrium moving negative), v = −Aω (fastest, negative), a = 0. The quarter-cycle maps extreme → center: all K, no U, max speed.",
        equations: ["x = A\\cos(\\omega t), \\; v = -A\\omega\\sin(\\omega t), \\; a = -A\\omega^2\\cos(\\omega t)"],
        commonMistake: "Mixing up which quantity is maximal at the extremes vs the center.",
        apStrategy: "Trace the quarter-cycle: extreme → center means U→K, v max, a zero. One quarter more: center → opposite extreme.",
        category: "graph",
      };
    },
  },
];

// =====================================================================
// FLUIDS (P1 Unit 8)
// =====================================================================
export const FLUIDS: Archetype[] = [
  {
    id: "fl-floating-fraction",
    course: "p1", unit: 8, topic: "Fluids", conceptId: "p1-buoyancy",
    difficulty: "medium", type: "quantitative",
    gen: (r): RawQ => {
      const pair = pick([
        { obj: "Ice (ρ = 917 kg/m³)", rhoObj: 917, fluid: "water (ρ = 1000 kg/m³)", rhoF: 1000 },
        { obj: "A block (ρ = 700 kg/m³)", rhoObj: 700, fluid: "water (ρ = 1000 kg/m³)", rhoF: 1000 },
        { obj: "A block (ρ = 800 kg/m³)", rhoObj: 800, fluid: "oil (ρ = 900 kg/m³)", rhoF: 900 },
      ] as const, r);
      const frac = pair.rhoObj / pair.rhoF;
      const q = mkCorrect(`${fmt(frac * 100, 0)}% submerged`, [
        { text: `${fmt(100 - frac * 100, 0)}% submerged`, tempt: "That's the fraction ABOVE the surface — the question asks for submerged." },
        { text: "50%", tempt: "Half only happens when ρ_obj = ρ_fluid/2." },
        { text: "It sinks completely", tempt: "Sinking needs ρ_obj > ρ_fluid — compare densities first." },
      ], r);
      return {
        prompt: `${pair.obj} floats in ${pair.fluid}. What fraction of the object is submerged?`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `Floating: F_b = W → ρ_f·V_sub·g = ρ_o·V_total·g → V_sub/V = ρ_o/ρ_f = ${pair.rhoObj}/${pair.rhoF} = ${fmt(frac * 100, 0)}% submerged. The submerged fraction IS the density ratio.`,
        equations: ["\\frac{V_{sub}}{V} = \\frac{\\rho_{obj}}{\\rho_{fluid}}"],
        commonMistake: "Reporting the above-surface fraction, or the inverse ratio.",
        apStrategy: "Floating problems collapse to one ratio. Write 'buoyant force = weight' in density form and the answer falls out.",
        category: "algebra",
      };
    },
  },
  {
    id: "fl-pressure-depth",
    course: "p1", unit: 8, topic: "Fluids", conceptId: "p1-pressure",
    difficulty: "medium", type: "proportional-reasoning",
    gen: (r): RawQ => {
      const d1 = ri(2, 5, r);
      const f = pick([2, 3] as const, r);
      const q = mkCorrect(`${f}P`, [
        { text: "P", tempt: "Gauge pressure grows LINEARLY with depth: P = ρgh." },
        { text: `${f * f}P`, tempt: "That would be a square — there's no h² in ρgh." },
        { text: "P + ρg", tempt: "ρg is the slope, not a pressure — multiply by depth." },
      ], r);
      return {
        prompt: `The gauge pressure at depth ${d1} m in a lake is P. At depth ${f * d1} m, the gauge pressure is:`,
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: `Gauge pressure P = ρgh is linear in depth: ${f}× deeper → ${f}P. (Absolute pressure would be P₀ + ρgh — the atmospheric part doesn't scale with depth.)`,
        equations: ["P_{gauge} = \\rho g h"],
        commonMistake: "Mixing gauge and absolute pressure, or squaring depth.",
        apStrategy: "Underline 'gauge' or 'absolute' in the stem — it decides whether P₀ appears in your answer.",
        category: "proportional",
      };
    },
  },
  {
    id: "fl-continuity-bernoulli",
    course: "p1", unit: 8, topic: "Fluids", conceptId: "p1-continuity",
    difficulty: "hard", type: "conceptual",
    gen: (r): RawQ => {
      const q = mkCorrect("Speed is higher and pressure is lower", [
        { text: "Speed is higher and pressure is higher", tempt: undefined as unknown as string },
        { text: "Speed is lower and pressure is higher", tempt: "Continuity forces speed UP in the narrow section — A₁v₁ = A₂v₂." },
        { text: "Speed is higher and pressure is unchanged", tempt: "Faster flow needs a pressure PUSH to accelerate it — and Bernoulli keeps the total constant: faster means lower P." },
      ], r);
      return {
        prompt: "Water flows through a horizontal pipe that narrows smoothly. In the narrow section, compared to the wide section:",
        choices: q.choices, correct: q.correct, tempt: q.tempt,
        explanation: "Continuity: smaller A → larger v. Bernoulli (horizontal): ½ρv² + P = constant → faster flow has LOWER pressure. This is how airplane wings and atomizers work.",
        equations: ["A_1v_1 = A_2v_2, \\quad P + \\tfrac{1}{2}\\rho v^2 = \\text{const}"],
        commonMistake: "Assuming pressure must be higher where the pipe is squeezed.",
        apStrategy: "Narrowing a pipe is like pinching a hose: continuity sets the speed, then Bernoulli sets the pressure.",
        category: "conceptual",
      };
    },
  },
];
