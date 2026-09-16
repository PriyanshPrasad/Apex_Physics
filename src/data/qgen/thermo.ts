// Original AP-style thermodynamics archetypes: model selection, PV diagrams,
// microscopic/macroscopic reasoning, and experimental data interpretation.
import type { Archetype, RawQ } from "./core";
import { fmt, pick, ri } from "./core";

const GAS = ["helium sample", "sealed piston of air", "argon chamber", "laboratory gas" ] as const;

function pistonStimulus(r: () => number) {
  const pressure = ri(2, 6, r);
  const rows = [1, 2, 3, 4].map((volume) => [String(volume), fmt(pressure * volume), "constant temperature"]);
  return { pressure, stimulus: { kind: "composite" as const, title: "Isothermal compression of a sealed gas", visuals: [
    { kind: "diagram" as const, diagram: { kind: "piston" as const, temp: 300, vol: 0.72, note: "sealed sample; piston moves slowly" }, caption: "Figure 1. Sealed gas sample in a movable piston.", purpose: "The piston changes volume while the sample remains at approximately constant temperature." },
    { kind: "table" as const, headers: ["Volume (L)", "Pressure (kPa)", "Condition"], rows, caption: "Table 1. Measured pressure and volume for a sealed gas sample.", purpose: "The measurements are taken after the piston settles at each volume." },
    { kind: "diagram" as const, diagram: { kind: "pv" as const, points: [[0.25, 1], [0.5, 0.5], [0.75, 0.333], [1, 0.25]] as [number, number][], labels: ["A", "B", "C", "D"], note: "normalized model path" }, caption: "Figure 2. Pressure–volume relationship represented by the measured trend.", purpose: "Use the direction and shape of the path to connect the table to the ideal-gas model." },
  ], blurb: "A student slowly changes the volume of a sealed gas sample while maintaining constant temperature. The pressure is recorded after the piston settles." } };
}

export const THERMO: Archetype[] = [
  {
    id: "thermo-stimulus-model", shared: "thermo-piston-set", course: "p2", unit: 9, topic: "Thermodynamics", conceptId: "p2-ideal-gas",
    difficulty: "hard", type: "experimental",
    gen: (r): RawQ => {
      const { pressure, stimulus } = pistonStimulus(r);
      return { stimulus, prompt: "Based on the data in Table 1 and the representations in Figures 1 and 2, which graph would best test whether the measurements support the ideal-gas relationship for this isothermal process?", choices: ["P versus V, which should be linear", "P versus 1/V, which should be linear", "P versus V², which should be linear", "V versus P², which should be linear"], correct: 1, tempt: ["An isotherm is not P ∝ V; pressure decreases as volume increases.", undefined, "The model predicts an inverse relationship, not an inverse-square relationship.", "The axes and exponent do not produce the straight-line form P = constant/V."], explanation: `For constant temperature and amount of gas, PV = constant, so P = (${pressure})/V. Plotting P against 1/V should produce a straight line through the origin.`, equations: ["P = \\frac{nRT}{V}"], commonMistake: "Plotting the raw variables instead of transforming the inverse relationship.", apStrategy: "Rewrite the model in y = mx form before choosing graph axes.", category: "experimental" };
    },
  },
  {
    id: "thermo-stimulus-prediction", shared: "thermo-piston-set", course: "p2", unit: 9, topic: "Thermodynamics", conceptId: "p2-ideal-gas",
    difficulty: "hard", type: "proportional-reasoning",
    gen: (r): RawQ => {
      const { pressure, stimulus } = pistonStimulus(r);
      return { stimulus, prompt: `Using the pressure–volume relationship in Table 1 and Figure 2, if the volume is changed from 2 L to 8 L at the same temperature, the pressure should be approximately:`, choices: [`${fmt(pressure / 4)} kPa`, `${fmt(pressure * 4)} kPa`, `${fmt(pressure / 2)} kPa`, `${fmt(pressure)} kPa`], correct: 0, tempt: [undefined, "Pressure varies inversely with volume; increasing volume lowers pressure.", "The volume changes by a factor of four, not two.", "An isothermal expansion changes pressure even though temperature is fixed."], explanation: `Because PV is constant, P_2 = P_1(V_1/V_2). Moving from 2 L to 8 L divides pressure by four.`, equations: ["P_1V_1 = P_2V_2"], commonMistake: "Treating pressure as directly proportional to volume.", apStrategy: "Use a ratio form before substituting: P₂/P₁ = V₁/V₂.", category: "proportional" };
    },
  },
  {
    id: "thermo-pv-work-sign", course: "p2", unit: 9, topic: "Thermodynamics", conceptId: "p2-heat-energy",
    difficulty: "medium", type: "graph",
    gen: (r): RawQ => {
      const p = ri(2, 6, r), v1 = ri(1, 3, r), v2 = v1 + ri(1, 4, r);
      const work = p * (v2 - v1);
      return {
        prompt: `A ${pick(GAS, r)} follows a constant-pressure path from ${v1} L to ${v2} L at ${p} kPa. What is the sign and magnitude of the work done BY the gas?`,
        diagram: { kind: "pv", points: [[0.2, 0.7], [0.8, 0.7]], labels: ["A", "B"], note: "constant pressure" },
        choices: [`+${fmt(work)} J`, `−${fmt(work)} J`, "0 J", `+${fmt(p * (v2 + v1))} J`],
        correct: 0,
        tempt: [undefined, "Expansion means ΔV > 0, so the area under the P–V path is positive work by the gas.", "A nonzero area under a P–V path means nonzero work.", "Work is PΔV, not P times the sum of the endpoint volumes."],
        explanation: `Work by the gas is the signed area under the P–V path: W = PΔV = (${p} kPa)(${v2 - v1} L) = ${work} J. Since the gas expands, the sign is positive.`,
        equations: ["W = \\int P\\,dV = P\\Delta V"],
        commonMistake: "Confusing work by the gas with work on the gas, or using endpoint volume instead of ΔV.",
        apStrategy: "On a P–V diagram, identify direction first: expansion gives positive work by the gas; compression gives negative work.",
        category: "graph",
      };
    },
  },
  {
    id: "thermo-first-law-model", course: "p2", unit: 9, topic: "Thermodynamics", conceptId: "p2-heat-energy",
    difficulty: "hard", type: "equation-selection",
    gen: (r): RawQ => {
      const q = ri(20, 80, r), w = ri(10, 50, r);
      return {
        prompt: `A ${pick(GAS, r)} absorbs ${q} J of heat while ${w} J of work is done ON the gas. Which statement correctly describes the change in internal energy?`,
        choices: [`ΔU = ${q + w} J`, `ΔU = ${q - w} J`, `ΔU = ${w - q} J`, `ΔU = 0 J`],
        correct: 0,
        tempt: [undefined, "That convention treats W as work done by the gas; the prompt says work is done ON it.", "The signs are reversed: both incoming heat and work on the system add energy.", "Internal energy changes unless the incoming energy is exactly balanced by energy leaving."],
        explanation: `Using ΔU = Q + W_on, ΔU = ${q} J + ${w} J = ${q + w} J. The wording 'on the gas' fixes the sign without guessing from the motion.`,
        equations: ["\\Delta U = Q + W_{on}"],
        commonMistake: "Mixing the two work sign conventions.",
        apStrategy: "Translate the words into a convention before substituting: heat into the system is positive and work on the system is positive.",
        category: "sign",
      };
    },
  },
  {
    id: "thermo-particle-temperature", course: "p2", unit: 9, topic: "Thermodynamics", conceptId: "p2-ideal-gas",
    difficulty: "easy", type: "conceptual",
    gen: (r): RawQ => {
      const gas = pick(GAS, r);
      return {
        prompt: `Two samples of ${gas} have the same temperature, but sample A has twice the volume and twice the number of particles as sample B. Compared with B, the average kinetic energy per particle in A is:`,
        choices: ["Twice as large", "Half as large", "The same", "Four times as large"],
        correct: 2,
        tempt: ["Total internal energy may differ because there are more particles, but average energy per particle is set by temperature.", "Temperature is not inversely proportional to the number of particles at fixed stated temperature.", undefined, "The volume and particle-count factors do not square the energy per particle."],
        explanation: "For an ideal gas, average translational kinetic energy per particle depends only on absolute temperature. A has more total particles, so its total internal energy can be larger, but the per-particle average is the same.",
        equations: ["\\langle K \\rangle = \\tfrac{3}{2}k_BT"],
        commonMistake: "Confusing total internal energy with average energy per particle.",
        apStrategy: "When a prompt says 'per particle,' strip away amount of gas and volume; temperature controls the average microscopic energy.",
        category: "conceptual",
      };
    },
  },
  {
    id: "thermo-ideal-gas-prop", course: "p2", unit: 9, topic: "Thermodynamics", conceptId: "p2-ideal-gas",
    difficulty: "medium", type: "proportional-reasoning",
    gen: (r): RawQ => {
      const factor = pick([2, 3] as const, r);
      return {
        prompt: `A sealed ideal gas is heated at constant volume until its absolute temperature is ${factor} times its initial value. Its pressure becomes:`,
        choices: [`${factor} times as large`, `${factor ** 2} times as large`, `${fmt(1 / factor)} times as large`, "unchanged"],
        correct: 0,
        tempt: [undefined, "At constant volume, P is linear in T, not proportional to T².", "Heating does not reduce pressure when volume and amount are fixed.", "The ideal-gas law requires P to rise with absolute T when n and V are fixed."],
        explanation: `From PV = nRT with V and n fixed, P ∝ T. Therefore ${factor}T gives ${factor}P.`,
        equations: ["\\frac{P}{T} = \\text{constant}"],
        commonMistake: "Using Celsius instead of kelvin or inventing a squared relationship.",
        apStrategy: "Name what is held fixed, then reduce the ideal-gas law to the proportionality that remains.",
        category: "proportional",
      };
    },
  },
  {
    id: "thermo-experiment-slope", course: "p2", unit: 9, topic: "Thermodynamics", conceptId: "p2-ideal-gas",
    difficulty: "ap", type: "experimental",
    gen: (r): RawQ => {
      const n = pick([0.10, 0.20, 0.30] as const, r);
      const T = [200, 300, 400, 500];
      const V = 0.004;
      const R = 8.31;
      const rows = T.map((temp) => [String(temp), fmt(n * R * temp / V / 1000, 1)]);
      return {
        prompt: `A student holds the volume of a ${n} mol gas sample fixed and records pressure as temperature changes. The data are shown. Which graph and slope would best test the ideal-gas model?`,
        stimulus: { kind: "table", title: "Pressure–temperature calibration", caption: "Table 1. Measured pressure at constant volume for a sealed gas sample.", purpose: "Use the data to identify a linearized form of the ideal-gas relationship.", headers: ["Temperature (K)", "Pressure (kPa)"], rows, blurb: "A student holds the volume of a sealed gas sample fixed and records pressure as temperature changes." },
        choices: ["Plot P versus T; slope should be nR/V", "Plot T versus P; slope should be nR/V", "Plot P versus 1/T; slope should be nR/V", "Plot P versus V; slope should be nRT"],
        correct: 0,
        tempt: [undefined, "The relationship is P = (nR/V)T, so T is the independent horizontal variable and P is vertical.", "At fixed V, P is proportional to T, not 1/T.", "Volume is not the varied quantity in this experiment."],
        explanation: "With n and V fixed, P = (nR/V)T. A graph of P against T should be linear, and its slope is nR/V. The slope has pressure-per-temperature units, as required.",
        equations: ["P = \\frac{nR}{V}T"],
        commonMistake: "Putting the variables on the axes in the wrong order or using a reciprocal without checking the model.",
        apStrategy: "For experimental questions, derive the straight-line form y = mx + b before choosing axes; the slope must carry interpretable units.",
        category: "experimental",
      };
    },
  },
  {
    id: "thermo-efficiency-limit", course: "p2", unit: 9, topic: "Thermodynamics", conceptId: "p2-entropy",
    difficulty: "challenge", type: "conceptual",
    gen: (r): RawQ => {
      void r;
      return {
        prompt: "A cyclic heat engine absorbs energy from a hot reservoir and rejects some energy to a cold reservoir. Which claim is required for a physically possible engine?",
        choices: ["Its efficiency can equal 100%", "Its work output is less than the heat absorbed", "Its entropy change for the universe is negative", "It converts all rejected heat into additional work"],
        correct: 1,
        tempt: ["The second law forbids complete conversion of heat from one reservoir into work in a cycle.", undefined, "The entropy change of the universe cannot be negative for a real process.", "Rejected heat is precisely the part that cannot become work in that cycle."],
        explanation: "For a cycle, ΔU = 0, so Q_h = W + Q_c in magnitude. Because some heat must be rejected, W < Q_h and efficiency is below 100%.",
        equations: ["e = \\frac{W}{Q_h} < 1"],
        commonMistake: "Applying energy conservation without the second-law constraint.",
        apStrategy: "Separate first-law bookkeeping from second-law feasibility: energy conservation permits a balance, entropy limits the efficiency.",
        category: "assumption",
      };
    },
  },
];
