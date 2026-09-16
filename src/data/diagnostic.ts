import type { CourseId } from "./curriculum";
import type { DiagramSpec } from "@/components/questions/Diagrams";
import type { StimulusSpec } from "@/data/qgen/core";

export interface DiagnosticQuestion {
  domain: string; // foundation key, e.g. "f-algebra"
  prompt: string;
  choices: string[];
  correct: number;
  explains: string;
  diagram?: DiagramSpec;
  stimulus?: StimulusSpec;
}

/** Readiness diagnostic: quick placement across the mathematical + physical domains. */
export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  // Algebra
  { domain: "f-algebra", prompt: "Solve for v: v² = 2as, given s = 8 m and a = 4 m/s².", choices: ["v = 4 m/s", "v = 8 m/s", "v = 16 m/s", "v = 64 m/s"], correct: 1, explains: "v = √(2·4·8) = √64 = 8 m/s." },
  { domain: "f-algebra", prompt: "Rearrange W = Fd cosθ for d.", choices: ["d = W F cosθ", "d = W/(F cosθ)", "d = F/(W cosθ)", "d = cosθ/(WF)"], correct: 1, explains: "Divide both sides by F cosθ." },
  // Trig
  { domain: "f-trig", prompt: "A vector of magnitude 10 N makes 30° with the x-axis. Its y-component is:", choices: ["5 N", "8.7 N", "10 N", "3 N"], correct: 0, explains: "10·sin30° = 10·0.5 = 5 N." },
  { domain: "f-trig", prompt: "If sinθ = 3/5 for an angle in the first quadrant, cosθ =", choices: ["4/5", "3/4", "5/4", "2/5"], correct: 0, explains: "3-4-5 triangle: cos = 4/5." },
  // Graphs
  { domain: "f-graphs", prompt: "On a velocity–time graph, the slope represents:", choices: ["Displacement", "Acceleration", "Position", "Jerk"], correct: 1, explains: "Slope = Δv/Δt = acceleration.", diagram: { kind: "vgraph", graph: "vt", shape: "linear-up", title: "Velocity measured by a motion sensor", yLabel: "Velocity (m/s)", xLabel: "Time (s)", note: "positive slope" } },
  { domain: "f-graphs", prompt: "On a velocity–time graph, the area under the curve is:", choices: ["Acceleration", "Displacement", "Average speed", "Force"], correct: 1, explains: "v·t accumulates to displacement." },
  // Vectors
  { domain: "f-vectors", prompt: "Two perpendicular vectors of 3 N and 4 N add to a magnitude of:", choices: ["7 N", "5 N", "1 N", "12 N"], correct: 1, explains: "√(9+16) = 5 N — Pythagorean." },
  { domain: "f-vectors", prompt: "Subtracting vector B from vector A is the same as adding:", choices: ["B rotated 90°", "−B (reversed B)", "A + B", "Zero vector"], correct: 1, explains: "A − B = A + (−B)." },
  // Basic mechanics
  { domain: "f-mechanics", prompt: "A book rests on a table. The normal force on the book equals:", choices: ["Zero", "The book's weight (if no vertical acceleration)", "Twice the weight", "The book's mass"], correct: 1, explains: "Equilibrium: N = mg when nothing else pushes vertically.", stimulus: { kind: "diagram", title: "Book on a laboratory table", diagram: { kind: "fbd", scene: "table", labels: ["mg", "N"] }, blurb: "A force sensor is used to model the vertical forces on a book at rest. The book has no vertical acceleration.", caption: "Figure 1. Free-body diagram for the book.", purpose: "Identify the forces that determine vertical equilibrium." } },
  { domain: "f-mechanics", prompt: "A cart speeds up steadily from rest to 10 m/s in 5 s. Its acceleration is:", choices: ["50 m/s²", "2 m/s²", "0.5 m/s²", "10 m/s²"], correct: 1, explains: "a = Δv/Δt = 10/5 = 2 m/s²." },
  // Energy
  { domain: "f-energy", prompt: "Doubling an object's speed changes its kinetic energy by a factor of:", choices: ["2", "4", "1/2", "8"], correct: 1, explains: "K = ½mv² — v is squared, so 2× speed → 4× KE." },
  { domain: "f-energy", prompt: "Lifting a 2 kg book 3 m at constant speed (g ≈ 10) requires about:", choices: ["6 J", "60 J", "20 J", "0.7 J"], correct: 1, explains: "ΔU = mgh = 2·10·3 = 60 J." },
  // Momentum
  { domain: "f-momentum", prompt: "A 2 kg ball at 3 m/s bounces back at 3 m/s after hitting a wall. Its momentum change is:", choices: ["0 kg·m/s", "12 kg·m/s", "6 kg·m/s", "3 kg·m/s"], correct: 1, explains: "Δp = m(v_f − v_i) = 2(−3 − 3) = −12 kg·m/s → magnitude 12." },
  // New visual diagnostic items: the representations are part of the evidence,
  // not decoration. They assess graph, data, and diagram translation.
  { domain: "f-graphs", prompt: "The position–time graph in Figure 1 is concave upward. Which statement best describes the motion?", choices: ["The object has constant negative velocity", "The object is moving with positive acceleration", "The object is at rest for the entire interval", "The object has zero acceleration"], correct: 1, explains: "The slope increases with time, so velocity increases and acceleration is positive.", diagram: { kind: "vgraph", graph: "xt", shape: "parabolic-up", title: "Position recorded by a motion sensor", yLabel: "Position (m)", xLabel: "Time (s)", note: "slope increases" } },
  { domain: "f-energy", prompt: "A cart moves from point A to point B on the track shown. If friction is negligible, which energy statement is correct at point B?", choices: ["Kinetic energy is greater because gravitational potential energy decreased", "Both kinetic and gravitational potential energy increased", "Kinetic energy is unchanged because mass is constant", "The cart has no mechanical energy at B"], correct: 0, explains: "The lower height at B means gravitational potential energy decreased; conservation of mechanical energy transfers that energy to kinetic energy.", stimulus: { kind: "diagram", title: "Cart moving down a track", diagram: { kind: "track", marks: [4, 3, 2, 1, 0], note: "A → B" }, blurb: "A cart is released from rest at point A and rolls to point B. The track is smooth enough that thermal transfer is negligible.", caption: "Figure 1. Marked positions along the track.", purpose: "Translate a physical path into an energy-conservation claim." } },
  { domain: "f-momentum", prompt: "Using Table 1, which conclusion is best supported about the collision?", choices: ["Momentum is approximately conserved within experimental uncertainty", "Kinetic energy must be exactly conserved", "The final momentum is twice the initial momentum", "The masses were not measured"], correct: 0, explains: "The initial and final momentum values agree within the stated measurement variation; that evidence supports momentum conservation, but does not prove kinetic-energy conservation.", stimulus: { kind: "table", title: "Cart collision measurements", headers: ["Trial", "p before (kg·m/s)", "p after (kg·m/s)"], rows: [["1", "1.84", "1.79"], ["2", "2.40", "2.46"], ["3", "3.10", "3.05"]], blurb: "Two carts collide on a track. Position sensors estimate the system momentum immediately before and after each collision.", caption: "Table 1. System momentum measured before and after collision.", purpose: "Evaluate a conservation claim using data and uncertainty." } },
  // Calculus
  { domain: "f-calculus", prompt: "If x(t) = 3t², then v(t) = dx/dt is:", choices: ["3t", "6t", "6t²", "t³"], correct: 1, explains: "d/dt(3t²) = 6t." },
  { domain: "f-calculus", prompt: "∫2t dt from 0 to 3 equals:", choices: ["9", "6", "3", "18"], correct: 0, explains: "Antiderivative t², evaluated: 9 − 0 = 9." },
  // Differential equations
  { domain: "f-diffeq", prompt: "Which function solves dx/dt = −2x with x(0) = 5?", choices: ["x = 5e^{2t}", "x = 5e^{−2t}", "x = −2e^{5t}", "x = 5 − 2t"], correct: 1, explains: "Exponential decay: derivative is −2 times itself." },
  // Electricity fundamentals
  { domain: "f-electricity", prompt: "Two positive charges are brought closer together. The repulsive force:", choices: ["Decreases", "Increases as 1/r²", "Stays the same", "Becomes attractive"], correct: 1, explains: "Coulomb: F ∝ 1/r².", stimulus: { kind: "diagram", title: "Two charged spheres", diagram: { kind: "charges", q: ["+", "+"], note: "separation r decreases" }, blurb: "Two identical positively charged spheres are mounted on a low-friction track. Their separation is adjusted while the charge on each sphere remains constant.", caption: "Figure 1. Charge arrangement used in the investigation.", purpose: "Use the spatial representation to reason about Coulomb's law." } },
  { domain: "f-electricity", prompt: "The unit of electric potential difference is:", choices: ["Ampere", "Volt", "Ohm", "Coulomb"], correct: 1, explains: "Volts = joules per coulomb.", stimulus: { kind: "table", title: "Voltage measurement data", headers: ["Trial", "Energy (J)", "Charge (C)"], rows: [["1", "6.0", "2.0"], ["2", "9.0", "3.0"], ["3", "12.0", "4.0"]], blurb: "A student measures the energy transferred when different amounts of charge move between two points. The ratio is constant across trials.", caption: "Table 1. Energy transferred per unit charge.", purpose: "Connect a measured ratio to the definition and unit of potential difference." } },
];

export interface Recommendation {
  courses: CourseId[];
  path: string[];
  summary: string;
}

const COURSE_SCORES: Record<CourseId, { domains: string[]; weight: number }> = {
  p1: { domains: ["f-algebra", "f-trig", "f-graphs", "f-vectors", "f-mechanics", "f-energy", "f-momentum"], weight: 1 },
  p2: { domains: ["f-algebra", "f-graphs", "f-electricity", "f-energy"], weight: 0.95 },
  cm: { domains: ["f-calculus", "f-diffeq", "f-vectors", "f-mechanics"], weight: 1 },
  cem: { domains: ["f-calculus", "f-diffeq", "f-electricity"], weight: 0.95 },
};

export function recommend(scores: Record<string, number>): Recommendation {
  const results = (Object.keys(COURSE_SCORES) as CourseId[]).map((id) => {
    const { domains, weight } = COURSE_SCORES[id];
    const avg = domains.reduce((s, d) => s + (scores[d] ?? 0), 0) / domains.length;
    return { id, score: avg * weight };
  }).sort((a, b) => b.score - a.score);

  const calcReady = (scores["f-calculus"] ?? 0) >= 70 && (scores["f-diffeq"] ?? 0) >= 60;
  const mechanicsReady = (scores["f-mechanics"] ?? 0) >= 65;
  const electricityReady = (scores["f-electricity"] ?? 0) >= 60;

  const courses: CourseId[] = [];
  const path: string[] = [];

  // Build the recommended path foundation-first.
  path.push("Mathematical foundations");
  if (mechanicsReady && !calcReady) {
    courses.push("p1", "p2");
    path.push("AP Physics 1", "AP Physics 2");
    if (results.find((r) => r.id === "cm")!.score >= 60) {
      courses.push("cm");
      path.push("AP Physics C: Mechanics (stretch goal)");
    }
  } else if (calcReady) {
    courses.push("cm", "cem");
    path.push("AP Physics C: Mechanics", "AP Physics C: E&M");
    if (!electricityReady) path.push("Brush up: electricity fundamentals before C: E&M");
  } else {
    courses.push("p1");
    path.push("AP Physics 1", "Then AP Physics 2", "Then the C courses once calculus strengthens");
  }

  const weakest = Object.entries(scores).sort((a, b) => a[1] - b[1]).slice(0, 3).map(([k]) => k);
  const weakNames: Record<string, string> = {
    "f-algebra": "Algebra",
    "f-trig": "Trigonometry",
    "f-graphs": "Graph reading",
    "f-vectors": "Vectors",
    "f-mechanics": "Mechanics basics",
    "f-energy": "Energy",
    "f-momentum": "Momentum",
    "f-calculus": "Calculus",
    "f-diffeq": "Differential equations",
    "f-electricity": "Electricity",
  };

  const summary = `Start with ${courses[0].toUpperCase()} course. Focus early effort on: ${weakest.map((w) => weakNames[w] ?? w).join(", ")}.`;

  return { courses, path, summary };
}
