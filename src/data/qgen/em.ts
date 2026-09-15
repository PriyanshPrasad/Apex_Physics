// Archetype bank 4: E&M, circuits (incl. RC), magnetism, induction, optics,
// waves, modern physics — spanning Physics 1/2 and Physics C.
import type { Archetype, RawQ, Rng } from "./core";
import { pick, fmt, ri, rf } from "./core";

export const EM: Archetype[] = [
  // ---- Field concepts ----
  {
    id: "em-field-vec",
    course: "p2", unit: 10, topic: "Electric Fields", conceptId: "p2-e-field",
    difficulty: "medium", type: "conceptual",
    gen: (r): RawQ => {
      const obj = pick(["a proton", "an electron", "a small charged bead", "a dust grain carrying charge"] as const, r);
      return {
        prompt: `A charged object (${obj}) sits in a uniform electric field and experiences force F. If the field is reversed in direction AND the charge is doubled, the new force on the object is:`,
        choices: ["2F, opposite direction", "2F, same direction", "unchanged", "F/2, opposite direction"],
        correct: 0,
        tempt: [
          undefined,
          "Reversing the field reverses the force direction too.",
          "Doubling q doubles F — the force cannot stay put.",
          "Doubling q doubles F.",
        ],
        explanation: "F = qE is a vector equation: doubling q doubles |F|; reversing E flips F's direction. Net: 2F in the opposite direction.",
        equations: ["\\vec{F} = q\\vec{E}"],
        commonMistake: "Treating F = qE as a magnitude-only relation.",
        apStrategy: "Electric field questions are vector questions — carry signs and directions through every step.",
        category: "vector" as const,
      };
    },
  },
  {
    id: "em-charges-two",
    course: "p2", unit: 10, topic: "Electric Fields", conceptId: "p2-e-field",
    difficulty: "hard", type: "quantitative",
    gen: (r): RawQ => {
      const like = r() < 0.5;
      const d = pick([1, 2, 4] as const, r);
      const K = 8.99e9;
      const qq = 1e-6, dd = 0.1 * d;
      const each = (K * qq) / (dd * dd);
      const total = like ? 0 : 2 * each;
      const q0 = {
        prompt: like
          ? `Two equal positive charges (+${qq * 1e6} μC) sit ${fmt(d * 10, 0)} cm apart. The electric field exactly at the midpoint is:`
          : `A +${qq * 1e6} μC charge and a −${qq * 1e6} μC charge sit ${fmt(d * 10, 0)} cm apart. The electric field exactly at the midpoint is:`,
        choices: [
          like ? "Zero — the two fields cancel" : `Nonzero, pointing from + toward − (magnitude ≈ ${fmt(total / 1e5, 1)} × 10⁵ N/C)`,
          like ? "Nonzero, pointing from one charge to the other" : "Zero — fields always cancel at the midpoint",
          "Zero — the midpoint is always a neutral point",
          "Infinite — you can't be equidistant from two charges",
        ],
        correct: 0,
        tempt: [
          undefined,
          like ? undefined : "Opposite charges' fields point the SAME way at the midpoint (toward the −) — they add, never cancel.",
          "Only symmetric LIKE charges cancel at the midpoint.",
          "The formula 1/r² is finite for r > 0.",
        ] as (string | undefined)[],
        explanation: like
          ? `Each field has magnitude kq/r² but they point in OPPOSITE directions (away from each charge), so they cancel exactly at the midpoint: E = 0.`
          : `At the midpoint both fields point from + toward −: E = 2·kq/r² = 2(${K})(${qq})/(${dd})² ≈ ${fmt(total / 1e5, 1)} × 10⁵ N/C. Opposite charges ADD there.`,
        equations: ["E = \\frac{kq}{r^2}"],
        commonMistake: "Assuming the midpoint is always a zero-field point.",
        apStrategy: "Draw the individual field vectors first, THEN add them. Symmetry arguments come from the drawing, not the formula.",
        category: "vector" as const,
      };
      return q0;
    },
  },
  // ---- RC circuit: charging ----
  {
    id: "rc-tau-charge",
    course: "p2", unit: 11, topic: "RC Circuits", conceptId: "p2-kirchhoff",
    difficulty: "medium", type: "graph",
    gen: (r): RawQ => {
      const V = pick([6, 9, 12] as const, r);
      const R = ri(1, 10, r);           // kΩ
      const C = ri(100, 500, r);        // μF
      const tau = (R * C) / 1000;       // ms
      const Qfull = (V * C) / 1000;     // mC
      const I0 = V / R;                 // mA
      return {
        prompt: `A capacitor (C = ${C} μF) charges through a resistor (R = ${R} kΩ) from a ${V} V battery. Immediately after the switch closes, and after one time constant, the current is approximately:`,
        diagram: { kind: "circuit", layout: "rcMeter", labels: [`${V} V`, "R", "switch + ammeter"] },
        choices: [
          `${fmt(I0, 2)} mA now; ${fmt(0.37 * I0, 2)} mA after 1τ`,
          `0 mA now; ${fmt(I0, 2)} mA after 1τ`,
          `${fmt(I0, 2)} mA now; ${fmt(I0, 2)} mA after 1τ`,
          `${fmt(0.37 * I0, 2)} mA now; ${fmt(I0, 2)} mA after 1τ`,
        ],
        correct: 0,
        tempt: [
          undefined,
          "An uncharged capacitor acts like a WIRE — the initial current is maximum, not zero.",
          "The current decays exponentially as the capacitor charges: I(t) = (V/R)e^(−t/τ).",
          "Backwards — the capacitor starts uncharged (max current) and charges up (current decays).",
        ],
        explanation: `I(0) = V/R = ${V}/${R}k = ${fmt(I0, 2)} mA (capacitor acts like a wire when empty). I(t) = I₀e^(−t/τ): at t = τ, I = 0.37·I₀ = ${fmt(0.37 * I0, 2)} mA. Time constant τ = RC = ${R}k × ${C}μ = ${fmt(tau, 0)} ms.`,
        equations: ["I(t) = \\frac{V}{R}e^{-t/RC}, \\quad \\tau = RC"],
        commonMistake: "Believing current is zero when the switch first closes.",
        apStrategy: "RC memory hooks: uncharged C behaves like a wire; charged C behaves like an open switch. 1τ → 37% remains (decay) or 63% achieved (growth).",
        category: "conceptual",
      };
    },
  },
  {
    id: "rc-what-if",
    course: "p2", unit: 11, topic: "RC Circuits", conceptId: "p2-kirchhoff",
    difficulty: "hard", type: "proportional-reasoning",
    gen: (r): RawQ => {
      const f = pick([2, 4] as const, r);
      return {
        prompt: `In a charging RC circuit, the resistance R is increased by a factor of ${f}. Which statement is TRUE?`,
        choices: [
          `The final charge on the capacitor is unchanged; the time constant increases by ${f}`,
          `The final charge increases by ${f}; the time constant is unchanged`,
          `Both the final charge and the time constant increase by ${f}`,
          `The final charge decreases; the time constant decreases`,
        ],
        correct: 0,
        tempt: [
          undefined,
          "Final charge depends on V and C only (Q = CV) — R never appears there.",
          "Mixing up two independent roles of R: it gates the SPEED, not the DESTINATION.",
          "Larger R slows the current — nothing speeds up.",
        ],
        explanation: `Final charge: Q_f = CV — set by the battery and capacitor, blind to R. Speed: τ = RC → ×${f} slower charging. R controls the highway, not the destination.`,
        equations: ["\\tau = RC, \\quad Q_f = CV"],
        commonMistake: "Thinking R changes how much charge ends up on the capacitor.",
        apStrategy: "Separate 'where does it end up' (Q_f = CV) from 'how fast' (τ = RC) — they're governed by different variables.",
        category: "wrong-equation",
      };
    },
  },
  {
    id: "rc-calculus-derive",
    course: "cem", unit: 11, topic: "RC Circuits", conceptId: "cem-rc-circuits",
    difficulty: "ap", type: "quantitative",
    gen: (r): RawQ => {
      void r;
      return {
        prompt: `In a discharging RC circuit, apply Kirchhoff's loop rule and solve for the charge as a function of time, given Q(0) = Q₀. The result is:`,
        choices: [
          "Q(t) = Q₀ e^(−t/RC)",
          "Q(t) = Q₀(1 − e^(−t/RC))",
          "Q(t) = Q₀ cos(t/RC)",
          "Q(t) = Q₀ − t/RC",
        ],
        correct: 0,
        tempt: [
          undefined,
          "That's the CHARGING solution — discharging starts full and decays.",
          "RC discharge is exponential decay, not oscillation — there's no restoring force.",
          "Linear decay would need constant current; but I = Q/RC shrinks as Q does.",
        ],
        explanation: "Loop: Q/C − IR = 0 with I = −dQ/dt → dQ/dt = −Q/(RC). Separating: dQ/Q = −dt/RC → ln(Q/Q₀) = −t/RC → Q = Q₀e^(−t/RC). The differential equation IS the physics: current drains the capacitor in proportion to how much charge remains.",
        equations: ["\\frac{dQ}{dt} = -\\frac{Q}{RC} \\;\\Rightarrow\\; Q = Q_0 e^{-t/RC}"],
        commonMistake: "Sign errors in the loop rule (current direction vs discharge direction).",
        apStrategy: "For every RC derivation: write the loop rule, express I as ±dQ/dt, separate variables, integrate with limits. The sign of I relative to Q decides charge vs decay.",
        category: "calculus",
      };
    },
  },
  {
    id: "rc-graph-id",
    course: "p2", unit: 11, topic: "RC Circuits", conceptId: "p2-kirchhoff",
    difficulty: "hard", type: "representation",
    gen: (r): RawQ => {
      return {
        prompt: `A capacitor charges through a resistor from a battery. Which V–t graph correctly shows the capacitor voltage as a function of time?`,
        diagram: { kind: "circuit", layout: "batteryCapacitor", labels: ["ε", "C"] },
        choices: [
          "Starts at 0, rises steeply, then levels off approaching ε asymptotically",
          "Starts at ε, decays toward 0",
          "Starts at 0 and rises linearly forever",
          "Starts at ε/2 and stays constant",
        ],
        correct: 0,
        tempt: [
          undefined,
          "That's the DISCHARGING curve, or the resistor's voltage during charging.",
          "Exponential approach, not linear growth — the rate slows as the capacitor fills.",
          "The capacitor voltage isn't pinned at ε/2 — it moves from 0 toward ε.",
        ],
        explanation: "V_C(t) = ε(1 − e^(−t/τ)): starts at 0 (empty capacitor), rises fastest initially, and flattens as it approaches ε. The curve is concave down — the slope (current) decays exponentially.",
        equations: ["V_C(t) = \\varepsilon\\left(1 - e^{-t/\\tau}\\right)"],
        commonMistake: "Picking a linear rise or the discharging shape.",
        apStrategy: "For every RC graph, ask two questions: which variable, and charging or discharging? Each pair has a mirror-image curve.",
        category: "graph",
      };
    },
  },
  // ---- Circuits ----
  {
    id: "circ-bulb-brightness",
    course: "p1", unit: 5, topic: "Circuits", conceptId: "p2-series-parallel",
    difficulty: "medium", type: "conceptual",
    gen: (r): RawQ => {
      void r;
      return {
        prompt: "Two identical bulbs are connected in series to a battery. A third identical bulb is added in PARALLEL with the second bulb. What happens to the brightness of bulb 1 (in series with the pair)?",
        diagram: { kind: "circuit", layout: "parallel2", labels: ["ε", "bulb 2", "bulb 3"] },
        choices: ["It gets brighter", "It stays the same", "It gets dimmer", "It goes out"],
        correct: 0,
        tempt: [
          undefined,
          "Adding a parallel branch REDUCES the equivalent resistance — more total current flows.",
          "The parallel pair has half the resistance of bulb 2 alone, so total R drops and current rises.",
          "Nothing is disconnected — bulb 1 still carries the full loop current.",
        ],
        explanation: "Bulb 2 ∥ bulb 3 has half the resistance of bulb 2 alone, so total R drops, total current rises, and bulb 1 (carrying the full current) gets brighter. Voltage across bulb 1 rises; the parallel pair shares what's left.",
        equations: ["R_{eq} = R_1 + \\frac{R_2 R_3}{R_2 + R_3}"],
        commonMistake: "Believing adding bulbs always dims the others.",
        apStrategy: "Track equivalent resistance after every circuit change: series additions raise it, parallel additions lower it. Current follows from the battery.",
        category: "conceptual",
      };
    },
  },
  {
    id: "circ-junction",
    course: "p1", unit: 5, topic: "Circuits", conceptId: "p1-kirchhoff",
    difficulty: "easy", type: "quantitative",
    gen: (r): RawQ => {
      const i1 = ri(1, 5, r);
      const i2 = ri(1, 5, r);
      return {
        prompt: `At a junction, ${i1} A flows in from the left and ${i2} A flows in from the top. The current leaving downward is:`,
        choices: [`${i1 + i2} A`, `${i1 - i2} A`, `${Math.abs(i1 - i2)} A`, "0 A"],
        correct: 0,
        tempt: [
          undefined,
          "Both currents ENTER the junction — they add, not subtract.",
          "Same trap — charge conservation says current in = current out.",
          undefined,
        ],
        explanation: `Junction rule (charge conservation): current in = current out. ${i1} + ${i2} = ${i1 + i2} A downward.`,
        equations: ["\\sum I_{in} = \\sum I_{out}"],
        commonMistake: "Subtracting currents that both flow into a junction.",
        apStrategy: "Label every branch current with a direction BEFORE writing junction equations — then in/out is unambiguous.",
        category: "conceptual",
      };
    },
  },
  // ---- Magnetism ----
  {
    id: "mag-force-dir",
    course: "p2", unit: 12, topic: "Magnetism", conceptId: "p2-magnetic-force",
    difficulty: "medium", type: "diagram",
    gen: (r): RawQ => {
      const q = pick(["positive", "negative"] as const, r);
      return {
        prompt: `A ${q} charge moves east (to the right) through a magnetic field pointing into the page. The magnetic force on the charge points:`,
        choices: ["Upward", "Downward", "Eastward (along v)", "Into the page (along B)"],
        correct: q === "positive" ? 0 : 1,
        tempt: [
          q === "positive" ? undefined : "That's the positive-charge answer — flip it for negative.",
          q === "positive" ? ("That's for a negative charge — positive gives the opposite." as string | undefined) : undefined,
          "The force is perpendicular to BOTH v and B — never along either.",
          "That's along B — magnetic force is never along B.",
        ],
        explanation: `F = qv × B. With v east and B into the page, v × B points up for a positive charge; negative charge flips it to Down. F is always perpendicular to both v and B.`,
        equations: ["\\vec{F} = q\\vec{v} \\times \\vec{B}"],
        commonMistake: "Forgetting the sign flip for negative charges.",
        apStrategy: "Right-hand rule first for the direction, then apply the charge sign LAST — one flip, done.",
        category: "vector",
      };
    },
  },
  // ---- Induction ----
  {
    id: "ind-lenz",
    course: "p2", unit: 12, topic: "Electromagnetic Induction", conceptId: "p2-wire-fields",
    difficulty: "hard", type: "conceptual",
    gen: (r): RawQ => {
      const dir = pick(["into", "out of"] as const, r);
      return {
        prompt: `A loop of wire lies flat on the page. The magnetic flux through it, pointing ${dir} the page, is INCREASING. The induced current in the loop (viewed from above) is:`,
        choices: [
          dir === "into" ? "Clockwise" : "Counterclockwise",
          dir === "into" ? "Counterclockwise" : "Clockwise",
          "There is no induced current",
          "It depends on the resistance of the loop",
        ],
        correct: dir === "into" ? 0 : 1,
        tempt: [
          dir === "into" ? undefined : "Flux into page increasing → induced field opposes the change → points OUT of page → counterclockwise (viewed from above).",
          dir === "into" ? "Flux into page increasing → induced field opposes the change → points OUT of page → counterclockwise (viewed from above)." : undefined,
          "A changing flux always induces an EMF — that's Faraday's law.",
          "R sets the SIZE of the current, not its existence or direction.",
        ],
        explanation: `Faraday: changing flux induces EMF. Lenz: the induced current opposes the CHANGE. Flux ${dir} the page is growing → induced field points ${dir === "into" ? "out of" : "into"} the page → ${dir === "into" ? "clockwise" : "counterclockwise"} current.`,
        equations: ["\\varepsilon = -\\frac{d\\Phi_B}{dt}"],
        commonMistake: "Opposing the FIELD instead of opposing the CHANGE.",
        apStrategy: "Lenz's law recipe: state what's changing, decide the opposing field, then read the current direction from the right-hand rule.",
        category: "conceptual",
      };
    },
  },
  // ---- Optics ----
  {
    id: "opt-image",
    course: "p2", unit: 13, topic: "Optics", conceptId: "p2-lenses-mirrors",
    difficulty: "medium", type: "quantitative",
    gen: (r): RawQ => {
      const f = ri(5, 20, r);
      const mult = pick([1.5, 2, 3] as const, r);
      const d = f * mult;
      const di = 1 / (1 / f - 1 / d);
      const m = -di / d;
      return {
        prompt: `An object sits ${fmt(d, 0)} cm from a converging lens of focal length ${f} cm. The image is:`,
        choices: [
          `${fmt(Math.abs(di), 1)} cm on the far side, ${Math.abs(m) > 1 ? "enlarged" : "reduced"}, inverted, real`,
          `${fmt(Math.abs(di), 1)} cm on the near side, upright, virtual`,
          "at the focal point, regardless of object distance",
          "at infinity",
        ],
        correct: 0,
        tempt: [
          undefined,
          "Virtual images on the object side happen only when d_o < f — check the object distance.",
          "Only the special case d_o → ∞ puts the image at f.",
          "Only the special case d_o = f puts the image at infinity.",
        ],
        explanation: `1/f = 1/d_o + 1/d_i → d_i = 1/(1/${f} − 1/${fmt(d, 0)}) = ${fmt(di, 1)} cm (positive → real, far side). m = −d_i/d_o = ${fmt(m, 2)} → ${Math.abs(m) > 1 ? "enlarged" : "reduced"} and inverted.`,
        equations: ["\\frac{1}{f} = \\frac{1}{d_o} + \\frac{1}{d_i}, \\quad m = -\\frac{d_i}{d_o}"],
        commonMistake: "Sign errors when images are virtual.",
        apStrategy: "Compute d_i, then read its sign for real/virtual, and only then interpret m — sign and size are separate facts.",
        category: "algebra",
      };
    },
  },
  // ---- Waves ----
  {
    id: "wave-harmonic",
    course: "p2", unit: 14, topic: "Waves", conceptId: "p2-waves",
    difficulty: "medium", type: "quantitative",
    gen: (r): RawQ => {
      const L = rf(0.5, 2, 0.25, r);
      const n = pick([2, 3, 4] as const, r);
      const v = 340;
      const f = (n * v) / (2 * L);
      return {
        prompt: `A string of length ${L} m is fixed at both ends; waves travel on it at ${v} m/s. The ${n}${n === 2 ? "nd" : n === 3 ? "rd" : "th"} harmonic frequency is:`,
        diagram: { kind: "wave", scene: "standing", note: `string fixed at both ends, n = ${n}` },
        choices: [`${fmt(f, 1)} Hz`, `${fmt(f / n, 1)} Hz`, `${fmt(f * 2, 1)} Hz`, `${fmt(v / (2 * L), 1)} Hz`],
        correct: 0,
        tempt: [
          undefined,
          "That's the fundamental (n = 1) — multiply by n.",
          "That's the NEXT harmonic up — check your n.",
          "You forgot the harmonic number n.",
        ],
        explanation: `f_n = nv/(2L) for a string fixed at both ends: f_${n} = ${n}·${v}/(2·${L}) = ${fmt(f, 1)} Hz. Each end must be a node — n half-wavelengths fit on the string.`,
        equations: ["f_n = \\frac{nv}{2L}"],
        commonMistake: "Using the wrong harmonic number or forgetting the 2L.",
        apStrategy: "Count the antinodes in the picture: n antinodes = nth harmonic. Then f_n = n·f₁.",
        category: "algebra",
      };
    },
  },
  // ---- Modern ----
  {
    id: "mod-photoelectric",
    course: "p2", unit: 15, topic: "Modern Physics", conceptId: "p2-photoelectric",
    difficulty: "hard", type: "conceptual",
    gen: (r): RawQ => {
      void r;
      return {
        prompt: "Light shines on a metal and ejects electrons. If the light's INTENSITY is doubled (same frequency, still above threshold), what changes?",
        choices: [
          "More electrons per second, same maximum kinetic energy",
          "Same number of electrons, higher maximum kinetic energy",
          "More electrons AND higher kinetic energy",
          "Fewer electrons, same maximum kinetic energy",
        ],
        correct: 0,
        tempt: [
          undefined,
          "Intensity is photon RATE, not photon energy — K_max depends on frequency alone.",
          "Intensity can't raise K_max — each electron absorbs exactly one photon's worth of energy.",
          "Dimmer light ejects FEWER electrons per second, not more — and K_max still wouldn't budge.",
        ],
        explanation: "Doubling intensity doubles the photon rate → more electrons per second. But each photon still carries hf, so K_max = hf − φ is unchanged. Brighter light ≠ more energetic light.",
        equations: ["K_{max} = hf - \\phi"],
        commonMistake: "Treating intensity as if it raises electron energy.",
        apStrategy: "Photoelectric questions hinge on separating INTENSITY (photon count) from FREQUENCY (photon energy). Assign each knob to one outcome.",
        category: "conceptual",
      };
    },
  },
];
