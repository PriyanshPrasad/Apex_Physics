import type { QEntry } from "@/data/qbank";

const base = {
  unit: 0,
  difficulty: "easy" as const,
  source: "hand" as const,
  equations: [],
  commonMistake: "Applying a familiar operation without checking what the variables represent.",
  apStrategy: "Keep the physical quantity and its units visible while doing the mathematics.",
  prereqIds: [],
  prerequisites: [],
  subtopic: "Prerequisites",
  skills: ["mathematical-routines"] as QEntry["skills"],
  representations: ["written-description"] as QEntry["representations"],
  responseType: "multiple-choice" as const,
  solutionSteps: ["Identify the mathematical relationship.", "Check the result and its units."],
  sciencePractice: ["mathematical-routines", "conceptual-reasoning"],
  calculatorAllowed: false,
  isOriginal: true,
  sourceType: "original-hand" as const,
  visualType: "none" as const,
};

export const PREREQ_QUESTIONS: QEntry[] = [
  { ...base, id: "pre-algebra-ratio", course: "p1", topic: "Prerequisites", conceptId: "f-algebra", type: "proportional-reasoning", prompt: "A model predicts that displacement is proportional to the square of time. If time is tripled, displacement changes by a factor of:", choices: ["3", "6", "9", "27"], correct: 2, explanation: "If x ∝ t², replacing t with 3t gives x' = (3t)² = 9x.", category: "proportional" },
  { ...base, id: "pre-slope-units", course: "p1", topic: "Prerequisites", conceptId: "f-graphs", type: "graph", prompt: "A graph of position in meters versus time in seconds has slope 4. The slope represents:", choices: ["4 m", "4 s", "4 m/s", "4 m/s²"], correct: 2, explanation: "Slope units are vertical units divided by horizontal units: meters per second, a velocity.", category: "graph" },
  { ...base, id: "pre-vector-components", course: "p1", topic: "Prerequisites", conceptId: "f-vectors", type: "diagram", prompt: "A 10-unit vector makes an angle of 60° above the positive x-axis. Its x-component is:", choices: ["5 units", "8.7 units", "10 units", "20 units"], correct: 0, explanation: "The adjacent component is A cosθ = 10 cos60° = 5 units.", category: "vector" },
  { ...base, id: "pre-scientific-notation", course: "p2", topic: "Prerequisites", conceptId: "f-algebra", type: "quantitative", prompt: "Which is equivalent to 3.0×10⁻⁶ C?", choices: ["3.0 μC", "3.0 mC", "0.0003 C", "3000 C"], correct: 0, explanation: "The prefix micro means 10⁻⁶, so 3.0×10⁻⁶ C is 3.0 μC.", category: "unit" },
  { ...base, id: "pre-equation-rearrange", course: "p2", topic: "Prerequisites", conceptId: "f-algebra", type: "equation-selection", prompt: "Solving V = IR for R gives:", choices: ["R = IV", "R = V/I", "R = I/V", "R = V−I"], correct: 1, explanation: "Divide both sides by I to isolate R: R = V/I.", category: "wrong-equation" },
  { ...base, id: "pre-trig-direction", course: "cm", topic: "Prerequisites", conceptId: "f-trig", type: "conceptual", prompt: "A vector points into quadrant II. Which sign pattern must its components have?", choices: ["x positive, y positive", "x negative, y positive", "x positive, y negative", "x negative, y negative"], correct: 1, explanation: "Quadrant II is left and up: negative x and positive y.", category: "sign" },
  { ...base, id: "pre-derivative-meaning", course: "cm", topic: "Prerequisites", conceptId: "f-calculus", difficulty: "medium", type: "representation", prompt: "If x(t) is position, what physical quantity is dx/dt?", choices: ["Acceleration", "Velocity", "Displacement", "Jerk"], correct: 1, explanation: "The derivative of position with respect to time is instantaneous velocity.", category: "calculus" },
  { ...base, id: "pre-integral-meaning", course: "cm", topic: "Prerequisites", conceptId: "f-calculus", difficulty: "medium", type: "representation", prompt: "If a(t) is acceleration, what does the signed area under a(t) from t₁ to t₂ represent?", choices: ["Change in velocity", "Change in position", "Average acceleration", "Force"], correct: 0, explanation: "Integrating acceleration over time accumulates velocity change: Δv = ∫a dt.", category: "calculus" },
  { ...base, id: "pre-function-slope", course: "cem", topic: "Prerequisites", conceptId: "f-calculus", difficulty: "medium", type: "graph", prompt: "At a local maximum of a smooth function, its instantaneous derivative is usually:", choices: ["Positive", "Negative", "Zero", "Infinite"], correct: 2, explanation: "The tangent is horizontal at a smooth local maximum, so the derivative is zero.", category: "calculus" },
  { ...base, id: "pre-statistics-spread", course: "p2", topic: "Prerequisites", conceptId: "f-graphs", type: "experimental", prompt: "Repeating a measurement and averaging several trials primarily reduces:", choices: ["A systematic calibration error", "Random variation", "The units", "The true value"], correct: 1, explanation: "Averaging reduces random scatter; it does not remove a consistent calibration offset.", category: "experimental" },
  { ...base, id: "pre-systems-linear", course: "cm", topic: "Prerequisites", conceptId: "f-algebra", type: "quantitative", prompt: "If x + y = 10 and x − y = 2, what is x?", choices: ["4", "5", "6", "8"], correct: 2, explanation: "Adding the equations gives 2x = 12, so x = 6.", category: "algebra" },
  { ...base, id: "pre-log-exponent", course: "cem", topic: "Prerequisites", conceptId: "f-calculus", difficulty: "hard", type: "quantitative", prompt: "For an RC decay Q = Q₀e^(−t/τ), which expression gives the time when Q = Q₀/2?", choices: ["τ/2", "τ ln 2", "2τ", "τ/e"], correct: 1, explanation: "Set e^(−t/τ)=1/2, take ln, and obtain t=τ ln2.", category: "calculus" },
];
