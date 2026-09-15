// Archetype bank 2: Dynamics — FBDs, Newton's laws, friction, inclines,
// systems, elevators, circular motion. The hardest part is choosing the model.
import { Archetype, ri, rf, pick, fmt, SCENARIOS } from "./core";

const G = 9.8;

export const DYNAMICS: Archetype[] = [
  // ---- D1: FBD force inventory ----
  {
    id: "dyn-fbd-select",
    course: "p1", unit: 2, topic: "Dynamics", conceptId: "p1-fbd",
    difficulty: "easy", type: "diagram",
    gen: (r) => {
      const scene = pick([
        { desc: "a box accelerating up a frictionless ramp, pulled by a rope parallel to the ramp", forces: "Weight, normal force, and tension", wrong: "…plus 'ma up the ramp' (ma is the result, not a force)", correct: 1 },
        { desc: "a bucket at rest hanging from a rope", forces: "Weight and tension only", wrong: "…plus a normal force (nothing touches it from below)", correct: 1 },
        { desc: "a book sliding to a stop across a rough table", forces: "Weight, normal force, and kinetic friction", wrong: "…plus a forward 'force of motion' keeping it going", correct: 1 },
        { desc: "a ball at the top of its vertical throw (in flight)", forces: "Weight only", wrong: "…plus an upward 'throw force' still acting", correct: 1 },
      ] as const, r);
      return {
        prompt: `Which free-body diagram correctly shows ALL forces on ${scene.desc}?`,
        diagram: { kind: "fbd", scene: r() < 0.5 ? "incline" : "table", labels: ["mg", "F_N", "f"] },
        choices: [
          "Weight and normal force only",
          scene.forces,
          "Weight, normal force, and a forward force of motion",
          "Weight, normal force, tension, and ma in the direction of motion",
        ],
        correct: scene.correct,
        tempt: [
          "Missing a real force — inventory what TOUCHES the object plus field forces.",
          undefined,
          "No interaction supplies a 'force of motion' — motion persists without one (Newton I).",
          "'ma' is the outcome of ΣF, never an extra arrow. FBDs show interaction forces only.",
        ],
        explanation: `FBDs contain only interaction forces: field forces (gravity here) plus contact forces from things touching the object. ${scene.wrong ? "Rejecting the extra arrow: " + scene.wrong.replace("…plus ", "") : ""} For ${scene.desc}, the correct set is: ${scene.forces}.`,
        equations: ["\\Sigma \\vec{F} = m\\vec{a}"],
        commonMistake: "Adding 'force of motion' or 'ma' arrows to free-body diagrams.",
        apStrategy: "Build every FBD from two questions: what touches it, and what field forces act? Nothing else gets an arrow.",
        category: "missing-force",
      };
    },
  },
  // ---- D2: incline slide-or-not (static vs kinetic decision) ----
  {
    id: "dyn-incline-decision",
    course: "p1", unit: 2, topic: "Dynamics", conceptId: "p1-friction",
    difficulty: "medium", type: "conceptual",
    gen: (r) => {
      const theta = ri(15, 35, r);
      const muS = rf(0.3, 0.9, 0.05, r);
      const slides = Math.tan((theta * Math.PI) / 180) > muS;
      const rad = (theta * Math.PI) / 180;
      const a = slides ? G * (Math.sin(rad) - muS * Math.cos(rad)) : 0;
      const mass = ri(2, 12, r);
      const obj = pick(SCENARIOS.object, r);
      return {
        prompt: `A ${mass} kg ${obj} rests on a ramp at ${theta}°. The coefficient of static friction is ${muS} (kinetic is lower). What happens, and what is the acceleration along the ramp?`,
        choices: slides
          ? [`It stays put; a = 0`, `It slides; a ≈ ${fmt(a, 1)} m/s² down the ramp`, `It slides; a ≈ ${fmt(G * Math.sin(rad), 1)} m/s²`, `It slides; a ≈ ${fmt(G * (Math.sin(rad) - muS * Math.cos(rad)) * 2, 1)} m/s²`]
          : [`It stays put; a = 0`, `It slides; a ≈ ${fmt(a, 1)} m/s²`, `It slides; a ≈ ${fmt(G * Math.sin(rad) - muS * G, 1)} m/s²`, `It slides; a ≈ ${fmt((G * Math.sin(rad) - muS * G * Math.cos(rad)) / 2, 1)} m/s²`],
        correct: 0,
        tempt: [
          undefined,
          "Only if tanθ > μₛ! Compare the downhill pull mg·sinθ with the friction CEILING μₛmg·cosθ first.",
          "You ignored friction entirely — kinetic friction still acts once sliding.",
          "You used the full μmg as the friction force — friction only reaches its ceiling if sliding.",
        ],
        explanation: `Downhill pull: mg·sinθ = ${mass}×9.8×${fmt(Math.sin(rad))} = ${fmt(mass * G * Math.sin(rad))} N. Friction ceiling: μₛmg·cosθ = ${fmt(muS * mass * G * Math.cos(rad))} N. ${slides ? `Pull exceeds ceiling → slides with a = g(sinθ − μₖcosθ) ≈ ${fmt(a, 1)} m/s².` : `Pull ≤ ceiling → static friction holds it at exactly mg·sinθ; a = 0.`} Note the mass cancels from the slide condition: tanθ vs μₛ.`,
        equations: ["f_{s,\\max} = \\mu_s F_N = \\mu_s mg\\cos\\theta", "\\text{slides iff } \\tan\\theta > \\mu_s"],
        commonMistake: "Computing kinetic friction before deciding whether the object even slides.",
        apStrategy: "Friction questions are TWO-step: (1) can it slide? (tanθ vs μₛ), (2) if yes, THEN use kinetic. Never skip step 1.",
        category: "assumption",
      };
    },
  },
  // ---- D3: elevator apparent weight ----
  {
    id: "dyn-elevator",
    course: "p1", unit: 2, topic: "Dynamics", conceptId: "p1-newton2",
    difficulty: "medium", type: "quantitative",
    gen: (r) => {
      const m = ri(50, 80, r);
      const a = rf(1, 3, 0.5, r);
      const dir = pick(["accelerating upward", "accelerating downward", "moving upward at constant speed", "decelerating while moving upward (accelerating down)"] as const, r);
      const N = dir.startsWith("accelerating upward") ? m * (G + a) : dir.startsWith("accelerating downward") ? m * (G - a) : dir.startsWith("decelerating") ? m * (G - a) : m * G;
      const obj = pick(SCENARIOS.student, r);
      return {
        prompt: `A ${m} kg ${obj} stands on a bathroom scale in an elevator ${dir} at ${a} m/s². What does the scale read (the normal force)?`,
        choices: [
          `${fmt(N, 0)} N`,
          `${fmt(m * G, 0)} N`,
          `${fmt(N > m * G ? m * (G - a) : m * (G + a), 0)} N`,
          `${fmt(m * a, 0)} N`,
        ],
        correct: 0,
        tempt: [
          undefined,
          "That is the true weight \u2014 but the scale reads the NORMAL force, which responds to acceleration.",
          "That is the apparent weight for the OPPOSITE acceleration — recheck whether the elevator speeds up or slows down, and in which direction.",
          "That is ma alone \u2014 gravity still acts. N = m(g \u00b1 a).",
        ],
        explanation: `\u03a3F = ma vertically: N = ${fmt(N, 0)} N for this acceleration. ${N > m * G ? "N > mg: the passenger feels heavier." : N < m * G ? "N < mg: feels lighter." : "Constant velocity \u2192 N = mg exactly."}`,
        equations: ["N - mg = ma"],
        commonMistake: "Using the velocity direction instead of the acceleration direction.",
        apStrategy: "Apparent weight follows the ACCELERATION, never the velocity. Draw the FBD, write ΣF = ma in the vertical direction, solve for N.",
        category: "conceptual",
      };
    },
  },
  // ---- D4: two-block system (connected objects) ----
  {
    id: "dyn-two-block",
    course: "p1", unit: 2, topic: "Dynamics", conceptId: "p1-newton2",
    difficulty: "hard", type: "quantitative",
    gen: (r) => {
      const m1 = ri(2, 6, r);
      const m2 = ri(2, 6, r);
      const F = ri(20, 60, r);
      const a = F / (m1 + m2);
      const T = m2 * a; // tension in the string between them if m2 is pulled by m1
      return {
        prompt: `Blocks A (${m1} kg) and B (${m2} kg) sit on a frictionless surface, connected by a light string. A ${F} N horizontal force pulls A so both accelerate together. What is the acceleration, and what is the tension in the string between them?`,
        choices: [
          `a = ${fmt(a, 2)} m/s\u00b2, T = ${fmt(T, 1)} N`,
          `a = ${fmt(F / m1, 2)} m/s\u00b2, T = ${fmt(F, 1)} N`,
          `a = ${fmt(a, 2)} m/s\u00b2, T = ${fmt(F, 1)} N`,
          `a = ${fmt(F / m2, 2)} m/s\u00b2, T = ${fmt(T, 1)} N`,
        ],
        correct: 0,
        tempt: [
          undefined,
          "a = F/(m\u2081+m\u2082) \u2014 the force accelerates BOTH blocks; and the string only pulls B, so T < F.",
          "Acceleration is right, but T = m\u2082a (only B hangs on the string), not the full applied force.",
          "You divided by one block's mass \u2014 the whole system accelerates together.",
        ],
        explanation: `System view: a = F/(m\u2081+m\u2082) = ${F}/${m1 + m2} = ${fmt(a, 2)} m/s\u00b2. Then block B alone: T = m\u2082a = ${m2} \u00d7 ${fmt(a, 2)} = ${fmt(T, 1)} N. Two systems \u2014 whole for a, single block for T.`,
        equations: ["a = \\frac{F}{m_1 + m_2}, \\quad T = m_2 a"],
        commonMistake: "Using one mass for the acceleration, or the full force for the tension.",
        apStrategy: "Connected objects: whole system \u2192 acceleration; single object \u2192 internal force. Choose the system that contains only what you want.",
        category: "wrong-system",
      };
    },
  },
  // ---- D5: circular motion force source ----
  {
    id: "dyn-circular-source",
    course: "p1", unit: 2, topic: "Dynamics", conceptId: "p1-circular-force",
    difficulty: "medium", type: "conceptual",
    gen: (r) => {
      const scene = pick([
        { desc: "a car rounding a flat curve", source: "static friction from the road", wrong: "centrifugal force pushing out", correct: 1 },
        { desc: "a ball swung on a string in a horizontal circle", source: "the string's tension", wrong: "centrifugal force", correct: 1 },
        { desc: "a roller-coaster car at the top of a loop", source: "gravity plus the (downward) normal force", wrong: "an outward 'centrifugal' force", correct: 1 },
        { desc: "a satellite in circular orbit", source: "gravity alone", wrong: "an outward centrifugal force balancing gravity", correct: 1 },
      ] as const, r);
      return {
        prompt: `${scene.desc[0].toUpperCase() + scene.desc.slice(1)}. What force(s) supply the inward (centripetal) acceleration?`,
        choices: [
          "A centrifugal force pointing outward",
          scene.source,
          "The forward force of motion",
          "No force is needed at constant speed",
        ],
        correct: scene.correct,
        tempt: [
          "Centrifugal force is a frame artifact, not an interaction — the inward force comes from something real touching or pulling.",
          undefined,
          "'Force of motion' doesn't exist — no interaction pushes it forward on a curve.",
          "Changing DIRECTION is acceleration even at constant speed — a net inward force is required.",
        ],
        explanation: `Uniform circular motion requires a = v²/r pointing to the center. The supplied force: ${scene.source}. "Centrifugal force" is what your body feels in the accelerating frame; in an inertial frame only the real inward force exists.`,
        equations: ["F_c = \\frac{mv^2}{r}"],
        commonMistake: "Inventing an outward force to 'balance' the inward one.",
        apStrategy: "Identify centripetal force by NAME from the FBD (tension? friction? normal? gravity?). It's always an existing interaction.",
        category: "conceptual",
      };
    },
  },
  // ---- D6: friction direction reasoning ----
  {
    id: "dyn-friction-direction",
    course: "p1", unit: 2, topic: "Dynamics", conceptId: "p1-friction",
    difficulty: "hard", type: "conceptual",
    gen: (r) => {
      const scene = pick([
        { desc: "a crate riding ON a truck that accelerates forward without slipping", dir: "forward — friction accelerates the crate", correct: 1 },
        { desc: "a person walking forward", dir: "backward on the ground — the person pushes back on the floor (third law)", correct: 0 },
        { desc: "a box on the bed of a decelerating truck, not slipping", dir: "backward — friction decelerates the box along with the truck", correct: 1 },
      ] as const, r);
      return {
        prompt: `What is the direction of the friction force ON ${scene.desc}?`,
        choices: [
          "Backward \u2014 friction always opposes motion",
          "Forward \u2014 friction supplies the needed acceleration",
          "Backward \u2014 opposite the vehicle's motion",
          "Zero \u2014 no slipping means no friction",
        ],
        correct: scene.correct,
        tempt: [
          "Friction opposes RELATIVE SLIDING, not motion \u2014 here it prevents slipping by pointing along the acceleration.",
          undefined,
          "Reread the scenario \u2014 friction acts to keep the object moving WITH the surface.",
          "No slipping means STATIC friction \u2014 which still acts, taking whatever value prevents sliding.",
        ],
        explanation: `Friction opposes relative sliding between surfaces, not velocity in general. Here: ${scene.dir}.`,
        equations: ["f_s \\leq \\mu_s F_N"],
        commonMistake: "Assuming friction always points backward.",
        apStrategy: "Friction direction: ask which way the object would SLIP without friction; friction points opposite that.",
        category: "conceptual",
      };
    },
  },
  // ---- D7: atwood-style proportional ----
  {
    id: "dyn-atwood-prop",
    course: "p1", unit: 2, topic: "Dynamics", conceptId: "p1-newton2",
    difficulty: "ap", type: "proportional-reasoning",
    gen: (r) => {
      return {
        prompt: "Two blocks hang over an ideal pulley. Block A has mass 3m, block B has mass m. The magnitude of the net force on the TWO-BLOCK SYSTEM is:",
        choices: ["mg", "2mg", "4mg", "3mg"],
        correct: 1,
        tempt: [
          undefined,
          "Tension is INTERNAL to the two-block system — it cancels. Only the weight difference (3mg − mg = 2mg) accelerates the system.",
          "That's the total weight, but tension cancels inside the system — only the DIFFERENCE drives motion.",
          "That's block A's weight alone.",
        ],
        explanation: "Treating the two blocks as ONE system: internal tension cancels, leaving net force = (3m − m)g = 2mg, so a = 2mg/4m = g/2. System selection is the entire problem.",
        equations: ["a = \\frac{(m_1 - m_2)g}{m_1 + m_2}"],
        commonMistake: "Including tension in the system-level force inventory.",
        apStrategy: "For multi-object problems, ask what internal forces cancel when you merge the objects into one system — that's where the answer hides.",
        category: "wrong-system",
      };
    },
  },
  // ---- D8: spring force + FBD ----
  {
    id: "dyn-spring-normal",
    course: "p1", unit: 2, topic: "Dynamics", conceptId: "p1-fbd",
    difficulty: "hard", type: "quantitative",
    gen: (r) => {
      const m = ri(1, 5, r);
      const Fup = rf(10, 80, 5, r);
      const W = m * G;
      const N = Math.max(0, W - Fup);
      const lifting = Fup < W;
      return {
        prompt: `A ${m} kg block rests on the floor. You pull UP on it with ${fmt(Fup, 0)} N. What is the normal force from the floor?`,
        choices: lifting
          ? [`${fmt(N, 1)} N`, `${fmt(W, 1)} N`, `${fmt(W + Fup, 1)} N`, "Zero — any upward force lifts the block"]
          : ["Zero", `${fmt(W, 1)} N`, `${fmt(N, 1)} N`, `${fmt(Fup - W, 1)} N`],
        correct: lifting ? 0 : 2,
        tempt: [
          "The block leaves the floor only if your pull exceeds mg — compare first.",
          "The floor force shrinks as you pull up — equilibrium still holds while it stays down.",
          undefined,
          lifting ? "N = mg − F while in contact; it hits zero exactly when F = mg." : "Correct once it lifts off — but while resting, equilibrium requires N = W − F.",
        ],
        explanation: `While in contact: N + F = mg → N = mg − F = ${fmt(W, 1)} − ${fmt(Fup, 0)} = ${fmt(N, 1)} N. ${lifting ? `Since F < mg (${fmt(W, 0)} N), the block stays down and the floor pushes up with ${fmt(N, 1)} N.` : `Since F > mg, the block leaves the floor and N = 0.`} Normal forces are reactive — they take whatever value equilibrium demands, down to zero.`,
        equations: ["N + F - mg = 0"],
        commonMistake: "Treating the normal force as fixed at mg.",
        apStrategy: "Normal force is the LAST force you compute: ΣF = ma with everything else known, solve for N. Check the a = 0 case here.",
        category: "conceptual",
      };
    },
  },
];
