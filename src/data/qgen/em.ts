// Archetype bank 4: E&M, circuits (incl. RC), magnetism, induction, optics,
// waves, modern physics — spanning Physics 1/2 and Physics C.
import { Archetype, ri, rf, pick, fmt } from "./core";

const K = 8.99e9;

export const EM: Archetype[] = [
  // ---- Field concepts ----
  {
    id: "em-field-vec",
    course: "p2", unit: 4, topic: "Electric Fields", conceptId: "p2-efield",
    difficulty: "medium", type: "vector",
    gen: (r) => {
      const n = pick([2, 3, 4] as const, r);
      return {
        prompt: `A charge $q$ is placed in an electric field. The force on it is $F = qE$. If the field is reversed and the charge doubled, the force becomes:`,
        choices: [`$2F$, opposite direction`, `$2F$, same direction`, `unchanged`, `$F/2$, opposite direction`],
        correct: 0,
        tempt: [undefined, "Reversing the field reverses the force direction too.", undefined, "Doubling q doubles F."],
        explanation: `F = qE is a vector equation: doubling q doubles |F|; reversing E flips F. Net: 2F in the opposite direction.`,
        equations: ["\\vec{F} = q\\vec{E}"],
        commonMistake: "Treating F = qE as only magnitudes.",
        apStrategy: "Electric field questions are usually vector questions \u2014 carry signs and directions through every step.",
        category: "vector",
      };
    },
  },
  // ---- RC circuit time constant ----
  {
    id: "rc-tau-graph",
    course: "p2", unit: 5, topic: "RC Circuits", conceptId: "p2-rc",
    difficulty: "medium", type: "graph",
    gen: (r) => {
      const R = ri(1, 10, r);
      const C = ri(100, 500, r);
      const tau = (R * C) / 1000;
      const V = 12;
      return {
        prompt: `An RC circuit has R = ${R} kΩ and C = ${C} μF, connected to a ${V} V battery. The capacitor charges to ${V} V. After one time constant, approximately how much charge is on the capacitor?`,
        choices: [
          `${fmt(V * C / 1000, 2)} mC`,
          `${fmt(0.63 * V * C / 1000, 2)} mC`,
          `${fmt(V * C, 0)} mC`,
          `0 \u2014 it hasn't started charging yet`,
        ],
        correct: 1,
        tempt: [
          undefined,
          undefined,
          "You forgot to divide by 1000 (μF \u2192 F) and used the final value \u2014 after 1τ only 63% has arrived.",
          "Charging starts immediately \u2014 63% is on after one time constant.",
        ],
        explanation: `Q = CV(1 − e^{−t/τ}). At t = τ: Q = CV(1 − e^{−1}) = 0.63·CV. CV = ${R === 0 ? "" : V}×${C}×10⁻⁶ F\u00b7V → full charge = ${fmt(V * C / 1000, 2)} mC, so at 1τ: ${fmt(0.63 * V * C / 1000, 2)} mC.`,
        equations: ["Q(t) = CV\\left(1 - e^{-t/RC}\\right)"],
        commonMistake: "Using Q = CV at t = τ instead of Q = 0.63·CV.",
        apStrategy: "RC memory hooks: 1τ → 63% (charging) or 37% (discharging); 5τ → 'fully' done. Exponentials never quite reach 1 or 0.",
        category: "conceptual",
      };
    },
  },
  // ---- RC what if R doubles ----
  {
    id: "rc-what-if",
    course: "p2", unit: 5, topic: "RC Circuits", conceptId: "p2-rc",
    difficulty: "hard", type: "proportional-reasoning",
    gen: (r) => {
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
          "Final charge depends on V and C only (Q = CV) \u2014 R never appears there.",
          "Mixing up two independent roles of R: it gates the SPEED, not the DESTINATION.",
          "Larger R slows the current \u2014 nothing speeds up.",
        ],
        explanation: `Final charge: Q_f = CV \u2014 set by the battery and capacitor, blind to R. Speed: τ = RC \u2192 ×${f} slower charging. R controls the highway, not the destination.`,
        equations: ["\\tau = RC, \\quad Q_f = CV"],
        commonMistake: "Thinking R changes how much charge ends up on the capacitor.",
        apStrategy: "Separate 'where does it end up' (Q_f = CV) from 'how fast' (τ = RC) \u2014 they're governed by different variables.",
        category: "wrong-equation",
      };
    },
  },
  // ---- RC calculus (Physics C) ----
  {
    id: "rc-calculus-derive",
    course: "pcem", unit: 5, topic: "RC Circuits", conceptId: "pcem-rc",
    difficulty: "ap", type: "derivation",
    gen: (r) => {
      return {
        prompt: `In a discharging RC circuit, apply Kirchhoff's loop rule and solve for the charge on the capacitor as a function of time, given Q(0) = Q\u2080. The result is:`,
        choices: [
          `Q(t) = Q\u2080 e^{−t/RC}`,
          `Q(t) = Q\u2080(1 − e^{−t/RC})`,
          `Q(t) = Q\u2080 cos(t/RC)`,
          `Q(t) = Q\u2080 − t/RC`,
        ],
        correct: 0,
        tempt: [
          undefined,
          "That's the CHARGING solution \u2014 discharging starts full and decays.",
          "RC discharge is exponential decay, not oscillation \u2014 no restoring force exists.",
          "Linear decay would need constant current; but I = Q/RC shrinks as Q does \u2014 the current itself decays.",
        ],
        explanation: `Loop: Q/C − IR = 0 with I = −dQ/dt → dQ/dt = −Q/(RC). Separating: dQ/Q = −dt/RC → ln(Q/Q\u2080) = −t/RC → Q = Q\u2080e^{−t/RC}. The differential equation IS the physics: current drains the capacitor proportionally to how much charge remains.`,
        equations: ["\\frac{dQ}{dt} = -\\frac{Q}{RC} \\;\\Rightarrow\\; Q = Q_0 e^{-t/RC}"],
        commonMistake: "Sign errors in the loop rule (current direction vs discharge direction).",
        apStrategy: "For every RC derivation: write the loop rule, express I as ±dQ/dt, separate, integrate with limits. The sign of I relative to Q decides charge vs decay.",
        category: "calculus",
      };
    },
  },
  // ---- Circuits series/parallel identification ----
  {
    id: "circ-series-par",
    course: "p1", unit: 5, topic: "Circuits", conceptId: "p1-circuits",
    difficulty: "medium", type: "conceptual",
    gen: (r) => {
      return {
        prompt: `Two identical bulbs are connected in series to a battery. A third identical bulb is added in PARALLEL with the second. What happens to the brightness of bulb 1 (the first in series)?`,
        diagram: { kind: "circuit", note: "Bulb 1 in series with (bulb 2 ∥ bulb 3)" },
        choices: [
          "It stays the same brightness",
          "It gets brighter",
          "It gets dimmer",
          "It goes out",
        ],
        correct: 1,
        tempt: [
          undefined,
          undefined,
          "Adding a parallel branch REDUCES the equivalent resistance \u2014 more total current flows, including through bulb 1.",
          "Nothing is disconnected \u2014 bulb 1 still conducts.",
        ],
        explanation: "Bulb 2 ∥ bulb 3 has half the resistance of bulb 2 alone, so total R drops, total current rises, and bulb 1 (carrying the full current) gets brighter. Voltage across bulb 1 rises; the parallel pair shares what's left.",
        equations: ["R_{eq} = R_1 + \\frac{R_2 R_3}{R_2 + R_3}"],
        commonMistake: "Believing adding bulbs always dims the others.",
        apStrategy: "Track equivalent resistance after every circuit change: series additions raise it, parallel additions lower it. Current follows from the battery.",
        category: "conceptual",
      };
    },
  },
  // ---- Kirchhoff junction ----
  {
    id: "circ-junction",
    course: "p1", unit: 5, topic: "Circuits", conceptId: "p1-kirchhoff",
    difficulty: "easy", type: "conceptual",
    gen: (r) => {
      const i1 = ri(1, 5, r);
      const i2 = ri(1, 5, r);
      return {
        prompt: `At a junction, ${i1} A flows in from the left and ${i2} A flows in from the right. The current leaving downward is:`,
        choices: [`${i1 + i2} A`, `${i1 - i2} A`, `${Math.abs(i1 - i2)} A`, "0 A"],
        correct: 0,
        tempt: [
          undefined,
          "Both currents ENTER the junction \u2014 they add, not subtract.",
          "Same trap \u2014 charge conservation says in = out.",
          undefined,
        ],
        explanation: `Junction rule (charge conservation): current in = current out. ${i1} + ${i2} = ${i1 + i2} A downward.`,
        equations: ["\\sum I_{in} = \\sum I_{out}"],
        commonMistake: "Subtracting currents that both flow into a junction.",
        apStrategy: "Label every branch current with a direction BEFORE writing junction equations \u2014 then in/out is unambiguous.",
        category: "conceptual",
      };
    },
  },
  // ---- Magnetism: force on moving charge ----
  {
    id: "mag-force-dir",
    course: "p2", unit: 6, topic: "Magnetism", conceptId: "p2-magnetic-force",
    difficulty: "medium", type: "vector",
    gen: (r) => {
      const q = pick(["positive", "negative"] as const, r);
      return {
        prompt: `A ${q} charge moves east through a magnetic field pointing north (into the screen from your view: field out of the screen). The magnetic force on it points:`,
        choices: ["Up", "Down", "East", "Into the screen"],
        correct: q === "positive" ? 0 : 1,
        tempt: [
          q === "positive" ? undefined : "That's the positive-charge answer \u2014 flip it for negative.",
          q === "positive" ? "That's for a negative charge \u2014 positive gives the opposite." : undefined,
          "The force is perpendicular to BOTH v and B \u2014 never along either.",
          "That's along B \u2014 impossible for magnetic force.",
        ],
        explanation: `F = qv × B. East × North(up-ish basis) gives Up for a positive charge; negative charge flips it to Down. F is always perpendicular to both v and B.`,
        equations: ["\\vec{F} = q\\vec{v} \\times \\vec{B}"],
        commonMistake: "Forgetting the sign flip for negative charges.",
        apStrategy: "Right-hand rule first for the direction, then apply the charge sign LAST \u2014 one flip, done.",
        category: "vector",
      };
    },
  },
  // ---- Induction: Lenz conceptual ----
  {
    id: "ind-lenz",
    course: "p2", unit: 6, topic: "Electromagnetic Induction", conceptId: "p2-lenz",
    difficulty: "hard", type: "conceptual",
    gen: (r) => {
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
          dir === "into" ? undefined : "Flux into page increasing → induced field opposes the change → points OUT of page → counterclockwise.",
          dir === "into" ? "Flux into page increasing → induced field opposes change → points out of page → counterclockwise when viewed from above." : undefined,
          "A changing flux always induces an EMF \u2014 that's Faraday's law.",
          "R sets the SIZE of the current, not its existence or direction.",
        ],
        explanation: `Faraday: changing flux induces EMF. Lenz: the induced current opposes the CHANGE. Flux ${dir} the page is growing → induced field points ${dir === "into" ? "out of" : "into"} the page → ${dir === "into" ? "counterclockwise" : "clockwise"} current.`,
        equations: ["\\varepsilon = -\\frac{d\\Phi_B}{dt}"],
        commonMistake: "Opposing the FIELD instead of opposing the CHANGE.",
        apStrategy: "Lenz's law recipe: state what's changing, decide the opposing field, then read the current direction from the right-hand rule.",
        category: "conceptual",
      };
    },
  },
  // ---- Optics: converging lens image ----
  {
    id: "opt-image",
    course: "p2", unit: 7, topic: "Optics", conceptId: "p2-optics",
    difficulty: "medium", type: "quantitative",
    gen: (r) => {
      const f = ri(5, 20, r);
      const d = pick([(1.5 * f), (2 * f), (3 * f)] as const, r);
      const di = 1 / (1 / f - 1 / d);
      const m = -di / d;
      const dofmt = fmt(d, 0);
      const difmt = fmt(Math.abs(di), 1);
      return {
        prompt: `An object sits ${dofmt} cm from a converging lens of focal length ${f} cm. The image is:`,
        choices: [
          `${difmt} cm from the lens, ${Math.abs(m) > 1 ? "enlarged" : "reduced"}, ${m < 0 ? "inverted, real" : "upright, virtual"}`,
          `${difmt} cm from the lens, always upright`,
          `on the same side as the object, virtual`,
          `${fmt(f, 0)} cm from the lens regardless of object position`,
        ],
        correct: 0,
        tempt: [
          undefined,
          "Real images from converging lenses with d_o > f are inverted.",
          "Virtual on the object side happens only when d_o < f \u2014 check the object distance.",
          "The image position depends on d_o \u2014 only special cases put it at f.",
        ],
        explanation: `1/f = 1/d_o + 1/d_i → d_i = ${difmt} cm (positive: real, opposite side). m = −d_i/d_o = ${fmt(m, 2)} → ${Math.abs(m) > 1 ? "enlarged" : "reduced"} and inverted.`,
        equations: ["\\frac{1}{f} = \\frac{1}{d_o} + \\frac{1}{d_i}, \\quad m = -\\frac{d_i}{d_o}"],
        commonMistake: "Sign errors when images are virtual.",
        apStrategy: "Compute d_i, then read its sign for real/virtual, and only then interpret m \u2014 sign and size are separate facts.",
        category: "algebra",
      };
    },
  },
  // ---- Waves: standing waves harmonic ----
  {
    id: "wave-harmonic",
    course: "p1", unit: 7, topic: "Waves", conceptId: "p1-waves",
    difficulty: "medium", type: "quantitative",
    gen: (r) => {
      const L = rf(0.5, 2, 0.25, r);
      const n = pick([2, 3, 4] as const, r);
      const v = 340;
      const f = (n * v) / (2 * L);
      return {
        prompt: `A string of length ${L} m is fixed at both ends and carries waves at ${v} m/s. The ${n}${n === 2 ? "nd" : n === 3 ? "rd" : "th"} harmonic frequency is:`,
        choices: [`${fmt(f, 1)} Hz`, `${fmt(f / n, 1)} Hz`, `${fmt(f * 2, 1)} Hz`, `${fmt(v / (2 * L), 1)} Hz`],
        correct: 0,
        tempt: [
          undefined,
          "That's the fundamental (n = 1) \u2014 multiply by n.",
          "That's the NEXT harmonic up \u2014 check your n.",
          "You forgot the harmonic number n.",
        ],
        explanation: `f_n = nv/(2L) for a string fixed at both ends: f_${n} = ${n}·${v}/(2·${L}) = ${fmt(f, 1)} Hz. Each end must be a node \u2014 n half-wavelengths fit.`,
        equations: ["f_n = \\frac{nv}{2L}"],
        commonMistake: "Using the wrong harmonic number or forgetting the 2L.",
        apStrategy: "Count the antinodes in the picture: n antinodes = nth harmonic. Then f_n = n·f₁.",
        category: "algebra",
      };
    },
  },
  // ---- Modern: photoelectric threshold ----
  {
    id: "mod-photoelectric",
    course: "p2", unit: 8, topic: "Modern Physics", conceptId: "p2-photoelectric",
    difficulty: "hard", type: "conceptual",
    gen: (r) => {
      return {
        prompt: `Light shines on a metal and ejects electrons. If the light's INTENSITY is doubled (same frequency, still above threshold), what changes?`,
        choices: [
          "More electrons per second, same maximum kinetic energy",
          "Same number of electrons, higher maximum kinetic energy",
          "More electrons AND higher kinetic energy",
          "Fewer electrons, same maximum kinetic energy",
        ],
        correct: 0,
        tempt: [
          undefined,
          "Intensity is photon RATE, not photon energy \u2014 K_max depends on frequency alone.",
          "Intensity can't raise K_max \u2014 each electron absorbs exactly one photon's worth of energy.",
          undefined,
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
