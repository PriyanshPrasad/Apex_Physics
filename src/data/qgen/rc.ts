// Archetype bank 6: RC circuits — the spec calls for ~100 RC questions.
// Charging, discharging, τ, graphs, energy, parameter changes, limits,
// experiment design, calculus derivations. Pairs p2 (algebra) with cem (calc).
import type { Archetype, RawQ } from "./core";
import { ri, pick, fmt } from "./core";

export const RC: Archetype[] = [
  // ---- RC1: time constant computation (both courses) ----
  {
    id: "rc-tau-calc",
    course: "p2", unit: 11, topic: "RC Circuits", conceptId: "p2-kirchhoff",
    difficulty: "easy", type: "quantitative",
    gen: (r): RawQ => {
      const R = ri(1, 20, r);      // kΩ
      const C = ri(50, 600, r);    // μF
      const tau = R * C;           // ms (kΩ·μF = ms)
      return {
        prompt: `A series circuit has R = ${R} kΩ and C = ${C} μF. The time constant τ is:`,
        choices: [
          `${fmt(tau, 0)} ms`,
          `${fmt(tau / 1000, 3)} ms`,
          `${fmt(tau * 1000, 0)} ms`,
          `${fmt(R / C, 3)} ms`,
        ],
        correct: 0,
        tempt: [
          undefined,
          "kΩ × μF = 10³ × 10⁻⁶ = 10⁻³ — the product is already in ms, don't divide again.",
          "Multiplied by 1000 twice — check the prefix powers.",
          "τ = RC is a product, not a ratio.",
        ],
        explanation: `τ = RC = (${R}×10³ Ω)(${C}×10⁻⁶ F) = ${fmt(tau, 0)}×10⁻³ s = ${fmt(tau, 0)} ms. The k and μ prefixes cancel to give milliseconds directly — a reliable AP shortcut.`,
        equations: ["\\tau = RC"],
        commonMistake: "Prefix arithmetic: kΩ·μF lands in ms, not s or μs.",
        apStrategy: "Convert prefixes to powers of ten mentally: k·μ = 10³·10⁻⁶ = 10⁻³. One move, no calculator.",
        category: "unit",
      };
    },
  },
  // ---- RC2: discharging fraction after n τ (memorized exponentials) ----
  {
    id: "rc-decay-fraction",
    course: "p2", unit: 11, topic: "RC Circuits", conceptId: "p2-kirchhoff",
    difficulty: "medium", type: "quantitative",
    gen: (r): RawQ => {
      const n = pick([1, 2, 3] as const, r);
      const vals: Record<number, [string, number]> = { 1: ["37%", 0.37], 2: ["14%", 0.14], 3: ["5%", 0.05] };
      const V = pick([9, 12, 20] as const, r);
      const VT = V * vals[n][1];
      return {
        prompt: `A capacitor charged to ${V} V discharges through a resistor. After ${n} time constant${n > 1 ? "s" : ""}, the capacitor voltage is closest to:`,
        choices: [`${fmt(VT, 1)} V`, `${fmt(V / (n + 1), 1)} V`, `${fmt(V * (1 - vals[n][1]), 1)} V`, `${fmt(V / 2, 1)} V`],
        correct: 0,
        tempt: [
          undefined,
          "The decay is exponential, not linear — e^(−t/τ) does the work, not 1/(n+1).",
          "That's the RESISTOR's voltage after nτ (charging case) — the capacitor keeps the remainder while discharging.",
          "Halving happens every τ·ln2, not every whole τ — 1τ leaves 37%, not 50%.",
        ],
        explanation: `Discharging: V_C = V₀e^(−t/τ). At ${n}τ: V = ${V}·e^(−${n}) = ${V} × ${vals[n][0].replace("%", "")}% ≈ ${fmt(VT, 1)} V. Memorize e⁻¹≈0.37, e⁻²≈0.14, e⁻³≈0.05.`,
        equations: ["V_C(t) = V_0 e^{-t/\\tau}"],
        commonMistake: "Linear-intuition answers (÷2, ÷3) applied to exponential decay.",
        apStrategy: "AP exponential questions expect e⁻¹/⁻²/⁻³ recall. Drill the three values and most RC MCQs become instant.",
        category: "algebra",
      };
    },
  },
  // ---- RC3: charging: what fraction remains after 1τ? ----
  {
    id: "rc-charge-63",
    course: "p2", unit: 11, topic: "RC Circuits", conceptId: "p2-kirchhoff",
    difficulty: "medium", type: "graph",
    gen: (r): RawQ => {
      void r;
      return {
        prompt: "While a capacitor charges through a resistor, which quantity follows the curve that STARTS AT MAXIMUM and DECAYS?",
        diagram: { kind: "circuit", layout: "rcMeter", labels: ["ε", "R", "ammeter A"] },
        choices: [
          "The current — maximum initially (ε/R), decaying to zero",
          "The capacitor voltage — it starts at ε and falls",
          "The capacitor charge — it starts full and drains",
          "The time constant — it shrinks as the capacitor fills",
        ],
        correct: 0,
        tempt: [
          undefined,
          "Capacitor voltage during charging RISES from 0 toward ε — only the current decays.",
          "Charge mirrors voltage: Q = CV grows from zero.",
          "τ = RC is a constant for fixed R and C — it never changes during the process.",
        ],
        explanation: "At t = 0 the empty capacitor acts like a wire: I = ε/R (max). As Q builds, the capacitor's opposing voltage grows and the current decays: I(t) = (ε/R)e^(−t/τ). Voltage and charge both RISE (1 − e^(−t/τ)); only current (and resistor voltage) decay.",
        equations: ["I(t) = \\frac{\\varepsilon}{R}e^{-t/\\tau}, \\quad V_C = \\varepsilon\\left(1 - e^{-t/\\tau}\\right)"],
        commonMistake: "Mixing up which quantities rise and which decay.",
        apStrategy: "Sort RC quantities into two families: RISING (Q, V_C: ×(1−e^(−t/τ))) and DECAYING (I, V_R: ×e^(−t/τ)). Every graph question is family ID.",
        category: "graph",
      };
    },
  },
  // ---- RC4: parameter change: R doubles ----
  {
    id: "rc-param-R",
    course: "p2", unit: 11, topic: "RC Circuits", conceptId: "p2-kirchhoff",
    difficulty: "hard", type: "proportional-reasoning",
    gen: (r): RawQ => {
      const f = pick([2, 3] as const, r);
      return {
        prompt: `In a charging RC circuit, R is multiplied by ${f}. What happens to the INITIAL current and the time to reach 63% charge?`,
        choices: [
          `Initial current ÷${f}; time ×${f}`,
          `Initial current ÷${f}; time unchanged`,
          `Initial current unchanged; time ×${f}`,
          `Both unchanged — only C matters`,
        ],
        correct: 0,
        tempt: [
          undefined,
          `τ = RC changes too — the whole curve stretches by ${f}.`,
          "I₀ = ε/R drops immediately — the initial surge shrinks.",
          "Both I₀ and τ depend on R — neither survives unchanged.",
        ],
        explanation: `I₀ = ε/R → ÷${f}. τ = RC → ×${f}, so reaching 63% takes ${f}× longer. R throttles everything: less current, slower fill — but the final charge (CV) never changes.`,
        equations: ["I_0 = \\frac{\\varepsilon}{R}, \\quad \\tau = RC"],
        commonMistake: "Tracking only one of the two R-dependencies.",
        apStrategy: "RC parameter changes: audit THREE things — I₀ = ε/R, τ = RC, Q_f = CV. Each depends on a different subset.",
        category: "proportional",
      };
    },
  },
  // ---- RC5: energy delivered vs stored (factor-2 subtlety) ----
  {
    id: "rc-energy-half",
    course: "cem", unit: 11, topic: "RC Circuits", conceptId: "cem-rc-circuits",
    difficulty: "challenge", type: "conceptual",
    gen: (r): RawQ => {
      void r;
      return {
        prompt: "A battery charges a capacitor through a resistor until the capacitor is fully charged. Compared to the energy stored in the capacitor, the energy dissipated in the resistor is:",
        choices: [
          "Exactly equal — half the battery's work heats the resistor, half is stored (independent of R)",
          "Smaller, because a bigger resistor would store more",
          "Larger, because current flows the whole time",
          "Zero — ideal resistors don't dissipate",
        ],
        correct: 0,
        tempt: [
          undefined,
          "Surprising but true: the 50/50 split holds for ANY R. Bigger R just takes longer, wasting the same energy more slowly.",
          "The current stops when the capacitor fills — the total dissipated charge is what matters.",
          "Joule heating I²R is exactly how energy leaves the circuit here.",
        ],
        explanation: "Battery does work W = Qε. Capacitor stores ½Qε. The missing half — ½Qε — dissipates in R no matter the resistance value. Faster charging wastes the same energy faster. This famous result appears on C exams as a derivation question.",
        equations: ["W_{batt} = Q\\varepsilon = 2\\,\\tfrac{1}{2}Q\\varepsilon = 2 U_C"],
        commonMistake: "Assuming the R–energy split depends on R.",
        apStrategy: "When a result is 'independent of a parameter', that's the exam's favorite ask-why. Derive it once: integrate I²R dt over the charge-up.",
        category: "conceptual",
      };
    },
  },
  // ---- RC6: discharge derivation (C-level, loop rule) ----
  {
    id: "rc-derive-discharge",
    course: "cem", unit: 11, topic: "RC Circuits", conceptId: "cem-rc-circuits",
    difficulty: "ap", type: "quantitative",
    gen: (r): RawQ => {
      void r;
      return {
        prompt: "Starting from Kirchhoff's loop rule for a DISCHARGING RC circuit, the correct differential equation for the capacitor charge Q(t) is:",
        choices: [
          "Q/C − IR = 0 with I = −dQ/dt, giving dQ/dt = −Q/(RC)",
          "Q/C + IR = 0 with I = +dQ/dt, giving dQ/dt = +Q/(RC)",
          "ε − Q/C − IR = 0, giving dQ/dt = (ε − Q/C)/R",
          "dQ/dt = −RC·Q",
        ],
        correct: 0,
        tempt: [
          undefined,
          "Sign error: while discharging the current CARRIES charge OFF the plate, so I = −dQ/dt. Your version would predict charge growth without a battery.",
          "That's the CHARGING loop (battery present). Discharging has no ε.",
          "Dimensions: RC has units of time — multiplying by Q can't give a rate.",
        ],
        explanation: "Loop: the capacitor's voltage drives current through R: Q/C − IR = 0. With I = −dQ/dt (charge leaving), dQ/dt = −Q/(RC) → Q = Q₀e^(−t/RC). Getting the sign of I vs dQ/dt right IS the derivation.",
        equations: ["\\frac{Q}{C} - IR = 0, \\quad I = -\\frac{dQ}{dt}"],
        commonMistake: "Flipping the I–dQ/dt sign relation.",
        apStrategy: "In every RC derivation, declare the current direction and whether the plate in question gains or loses charge BEFORE writing I = ±dQ/dt.",
        category: "sign",
      };
    },
  },
  // ---- RC7: experimental design — measure τ ----
  {
    id: "rc-experiment",
    course: "p2", unit: 11, topic: "RC Circuits", conceptId: "p2-kirchhoff",
    difficulty: "hard", type: "experimental",
    gen: (r): RawQ => {
      void r;
      return {
        prompt: "A student must measure an RC time constant with a voltmeter across the capacitor and a stopwatch. The most reliable procedure is:",
        choices: [
          "Time how long V_C takes to fall to 37% of its initial value — that elapsed time IS τ",
          "Time until V_C reads exactly zero",
          "Time until the current (read from the voltmeter) is maximum",
          "Divide the measured resistance by the capacitance printed on the capacitor",
        ],
        correct: 0,
        tempt: [
          undefined,
          "The exponential never truly reaches zero — you'd be timing infinity. The 37% mark (or 63% while charging) is the standard.",
          "A voltmeter reads voltage, not current — and maximum current happens at t = 0, before you can start a stopwatch.",
          "That assumes the printed value is accurate and ignores the wiring — the experiment exists to measure the real thing.",
        ],
        explanation: "τ is DEFINED as the time for the decaying quantity to fall to e⁻¹ ≈ 37% (or the rising one to reach 63%). Time from release to 0.37·V₀ gives τ directly — no curve fitting needed. For better precision, time several fractions and average.",
        equations: ["V_C(\\tau) = 0.37\\,V_0"],
        commonMistake: "Trying to time 'until it's done' — exponentials are asymptotic.",
        apStrategy: "Experimental RC questions: the measurable landmark is always 37%/63%. Say what fraction you're timing and why it equals τ.",
        category: "experimental",
      };
    },
  },
  // ---- RC8: two-capacitor or series RC identification ----
  {
    id: "rc-series-combine",
    course: "cem", unit: 10, topic: "Capacitors", conceptId: "cem-capacitors",
    difficulty: "hard", type: "quantitative",
    gen: (r): RawQ => {
      const C = pick([2, 4, 6] as const, r);
      const Ceq = C / 2; // two identical Cs in series
      return {
        prompt: `Two identical ${C} μF capacitors are connected in SERIES. The equivalent capacitance is:`,
        choices: [
          `${fmt(Ceq, 1)} μF`,
          `${C * 2} μF`,
          `${C} μF`,
          `${fmt(C * C, 0)} μF²`,
        ],
        correct: 0,
        tempt: [
          undefined,
          "That's the PARALLEL rule. Series capacitors add reciprocally — and the result is SMALLER than either.",
          "Series combination is always less than the smallest capacitor.",
          "Capacitance doesn't multiply into μF² — check the reciprocal formula.",
        ],
        explanation: `Series: 1/C_eq = 1/C + 1/C = 2/C → C_eq = C/2 = ${fmt(Ceq, 1)} μF. (Parallel would give 2C.) Opposite rules to resistors — a deliberate AP trap.`,
        equations: ["\\frac{1}{C_{eq}} = \\sum \\frac{1}{C_i} \\text{ (series)}"],
        commonMistake: "Applying resistor intuition (series adds) to capacitors.",
        apStrategy: "Capacitors are resistors' mirror image: series → smaller (reciprocal sum), parallel → larger (plain sum). Say the rule out loud before computing.",
        category: "wrong-equation",
      };
    },
  },
  // ---- RC9: V_C vs V_R graph pairing ----
  {
    id: "rc-graph-pair",
    course: "cem", unit: 11, topic: "RC Circuits", conceptId: "cem-rc-circuits",
    difficulty: "medium", type: "representation",
    gen: (r): RawQ => {
      void r;
      return {
        prompt: "During capacitor CHARGING, the resistor voltage V_R(t) and capacitor voltage V_C(t) are related by:",
        choices: [
          "V_R + V_C = ε at every instant — one rises exactly as fast as the other falls",
          "Both rise toward ε together",
          "V_R stays constant while V_C rises",
          "V_R = V_C at every instant",
        ],
        correct: 0,
        tempt: [
          undefined,
          "Kirchhoff's loop rule pins the SUM to ε at every instant — they are mirror images, not copies.",
          "The resistor voltage decays — it carries the leftover, not a share that grows.",
          "Early on V_R ≈ ε and V_C ≈ 0; late the reverse. They only match once, at V = ε/2.",
        ],
        explanation: "Loop rule: ε = V_R + V_C always. V_C = ε(1 − e^(−t/τ)) rises; V_R = εe^(−t/τ) falls; they sum to ε. They cross exactly once, when each is ε/2 (t = τ·ln2).",
        equations: ["\\varepsilon = V_R + V_C"],
        commonMistake: "Graphing both as rising curves.",
        apStrategy: "Loop-rule constraints turn graph questions into bookkeeping: if you know one curve, the other is ε minus it.",
        category: "graph",
      };
    },
  },
  // ---- RC10: limit behavior expert ----
  {
    id: "rc-limit-behavior",
    course: "cem", unit: 11, topic: "RC Circuits", conceptId: "cem-rc-circuits",
    difficulty: "challenge", type: "conceptual",
    gen: (r): RawQ => {
      void r;
      return {
        prompt: "In the limit R → 0 (ideal wires, no resistance), a capacitor charging from an ideal battery would reach:",
        choices: [
          "The same final charge CV — but in zero time, with infinite initial current",
          "Zero final charge — no resistor means nothing pushes charge",
          "A larger final charge, since nothing dissipates",
          "No charge flows — a closed loop needs resistance",
        ],
        correct: 0,
        tempt: [
          undefined,              "The DESTINATION (Q = CV) never depended on R — only the journey did. Kill R and the journey takes zero time.",
              "The capacitor still charges — the battery still pumps charge until V_C = ε.",
              "Nothing dissipates energy, but the battery's work still stores ½CV² on the capacitor — it just can't dissipate the other half in a resistor anymore.",
              "Current flows freely when nothing resists — that's the point of the limit.",
        ],
        explanation: "Q_f = CV regardless of R. With R → 0, τ → 0: charging is instantaneous through infinite current. The resistor sets the TIMESCALE, never the endpoint — and the 'missing' dissipated half-energy would have to go somewhere else (sparks, radiation) in a real circuit.",
        equations: ["Q_f = CV \\;\\text{(independent of } R), \\quad \\tau = RC \\to 0"],
        commonMistake: "Believing R changes the final state rather than the rate.",
        apStrategy: "Limiting-case questions: hold the physics constants (C, ε) fixed and watch only the timescale move. Endpoint vs rate — separate them.",
        category: "assumption",
      };
    },
  },
];
