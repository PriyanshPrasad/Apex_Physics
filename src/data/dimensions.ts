// ============================================================
// Dimensional analysis engine — SI units, derived units, and
// dimensional-consistency checking. No external services.
// ============================================================

export type Dim = [M: number, L: number, T: number, Q: number, Th: number];

export interface UnitDef {
  symbol: string;
  dim: Dim;
  meaning: string;
}

/** Base + derived units used across the AP curriculum. */
export const UNITS: Record<string, UnitDef> = {
  kg: { symbol: "kg", dim: [1, 0, 0, 0, 0], meaning: "mass" },
  m: { symbol: "m", dim: [0, 1, 0, 0, 0], meaning: "length" },
  s: { symbol: "s", dim: [0, 0, 1, 0, 0], meaning: "time" },
  C: { symbol: "C", dim: [0, 0, 0, 1, 0], meaning: "charge" },
  K: { symbol: "K", dim: [0, 0, 0, 0, 1], meaning: "temperature" },
  "m/s": { symbol: "m/s", dim: [0, 1, -1, 0, 0], meaning: "velocity" },
  "m/s²": { symbol: "m/s²", dim: [0, 1, -2, 0, 0], meaning: "acceleration" },
  N: { symbol: "N", dim: [1, 1, -2, 0, 0], meaning: "force" },
  J: { symbol: "J", dim: [1, 2, -2, 0, 0], meaning: "energy" },
  W: { symbol: "W", dim: [1, 2, -3, 0, 0], meaning: "power" },
  Pa: { symbol: "Pa", dim: [1, -1, -2, 0, 0], meaning: "pressure" },
  "N·m": { symbol: "N·m", dim: [1, 2, -2, 0, 0], meaning: "torque — same dimensions as energy, a favorite trap" },
  "kg·m²": { symbol: "kg·m²", dim: [1, 2, 0, 0, 0], meaning: "moment of inertia" },
  "kg·m/s": { symbol: "kg·m/s", dim: [1, 1, -1, 0, 0], meaning: "momentum" },
  "N·s": { symbol: "N·s", dim: [1, 1, -1, 0, 0], meaning: "impulse — same dimensions as momentum ✓" },
  V: { symbol: "V", dim: [1, 2, -3, -1, 0], meaning: "electric potential" },
  "Ω": { symbol: "Ω", dim: [1, 2, -3, -2, 0], meaning: "resistance" },
  F: { symbol: "F", dim: [-1, -2, 4, 2, 0], meaning: "capacitance" },
  "V/m": { symbol: "V/m", dim: [1, 1, -3, -1, 0], meaning: "electric field (same as N/C ✓)" },
  T: { symbol: "T", dim: [1, 0, -2, -1, 0], meaning: "magnetic field" },
  Wb: { symbol: "Wb", dim: [1, 2, -2, -1, 0], meaning: "magnetic flux (T·m²)" },
  Hz: { symbol: "Hz", dim: [0, 0, -1, 0, 0], meaning: "frequency" },
};

export const DIMENSION_NAMES = ["mass (M)", "length (L)", "time (T)", "charge (Q)", "temperature (Θ)"] as const;
const DIM_SYMBOLS = ["M", "L", "T", "Q", "Θ"] as const;

export function dimToString(d: Dim): string {
  const parts: string[] = [];
  d.forEach((exp, i) => {
    if (exp === 0) return;
    parts.push(exp === 1 ? DIM_SYMBOLS[i] : `${DIM_SYMBOLS[i]}^${exp}`);
  });
  return parts.length ? parts.join(" · ") : "dimensionless";
}

/** A dimensionally-checked equation drill: pick the RHS whose units balance the LHS. */
export interface DimCheck {
  tex: string;
  lhs: string; // units on the left side
  rhs: string[]; // candidate unit chains on the right
  answer: number; // index of the consistent one
  why: string;
}

export const DIM_CHECKS: DimCheck[] = [
  {
    tex: "v = v_0 + at",
    lhs: "m/s",
    rhs: ["(m/s²)(s) = m/s", "(m/s)(s) = m", "(m/s²)(s²) = m"],
    answer: 0,
    why: "at has units (m/s²)(s) = m/s, matching v. The equation survives dimensional analysis.",
  },
  {
    tex: "x = x_0 + v_0 t + \\tfrac{1}{2} a t^2",
    lhs: "m",
    rhs: ["m + (m/s)(s) + (m/s²)(s²)", "m + m + m/s", "m + (m/s)(s) + m/s"],
    answer: 0,
    why: "Every term collapses to meters — necessary (though not sufficient) for correctness.",
  },
  {
    tex: "F = k \\dfrac{q_1 q_2}{r^2}",
    lhs: "N",
    rhs: ["(N·m²/C²)(C²)/m²", "(N·m²/C²)(C)/m²", "(N·m/C²)(C²)/m²"],
    answer: 0,
    why: "C² cancels, m² cancels, leaving N. k must carry N·m²/C² for the equation to balance.",
  },
  {
    tex: "\\tau = I\\alpha",
    lhs: "N·m",
    rhs: ["(kg·m²)(1/s²)", "(kg·m)(1/s²)", "(kg·m²)(1/s)"],
    answer: 0,
    why: "I (kg·m²) × α (1/s² — radians are dimensionless) = kg·m²/s² = N·m. Consistent.",
  },
  {
    tex: "v = f\\lambda",
    lhs: "m/s",
    rhs: ["(1/s)(m)", "(m/s)(m)", "(1/s)(m²)"],
    answer: 0,
    why: "Hz × m = m/s. The same check exposes the classic slip λ = f/v — the correct form is λ = v/f.",
  },
  {
    tex: "\\tau = RC",
    lhs: "s",
    rhs: ["Ω·F = (V/A)(C/V) = C/A = s", "Ω/F", "R/C"],
    answer: 0,
    why: "Ohms × farads: (V/A)·(C/V) = C/A = s — which is why τ = RC comes out in seconds.",
  },
];

// ---- Unit conversion drill ----
export interface Conversion {
  prompt: string;
  choices: string[];
  correct: number;
  explains: string;
}

export const CONVERSIONS: Conversion[] = [
  { prompt: "72 km/h in m/s:", choices: ["20 m/s", "7.2 m/s", "200 m/s", "259 m/s"], correct: 0, explains: "72 × (1000 m / 3600 s) = 72/3.6 = 20 m/s. Dividing km/h by 3.6 is the shortcut." },
  { prompt: "3.0 μC in C:", choices: ["3×10⁻⁹ C", "3×10⁻⁶ C", "3×10⁻³ C", "3×10³ C"], correct: 1, explains: "micro = 10⁻⁶, so 3.0 μC = 3.0×10⁻⁶ C." },
  { prompt: "2.5 kΩ in Ω:", choices: ["0.0025 Ω", "250 Ω", "2500 Ω", "25,000 Ω"], correct: 2, explains: "kilo = 10³, so 2.5 kΩ = 2500 Ω." },
  { prompt: "0.40 L of water (ρ = 1000 kg/m³) has mass:", choices: ["0.4 kg", "4 kg", "40 g", "0.04 kg"], correct: 0, explains: "0.40 L = 4.0×10⁻⁴ m³, so m = ρV = 1000 × 4.0×10⁻⁴ = 0.4 kg. (One liter of water ≈ 1 kg.)" },
  { prompt: "3600 rpm in rad/s:", choices: ["60π rad/s", "60 rad/s", "377 rad/s", "6π rad/s"], correct: 2, explains: "3600 rev/min × (2π rad/rev) × (1 min/60 s) = 120π ≈ 377 rad/s." },
  { prompt: "1 eV in joules:", choices: ["1.6×10⁻¹⁹ J", "1.6×10⁻¹⁷ J", "6.6×10⁻³⁴ J", "9×10¹⁶ J"], correct: 0, explains: "1 eV = e·(1 V) = 1.6×10⁻¹⁹ J — the electron charge times one volt." },
];
