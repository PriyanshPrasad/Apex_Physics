// Visual-first archetypes: each question is built around a representation that
// carries information needed for the reasoning, not decorative artwork.
import type { Archetype, RawQ } from "./core";
import { fmt, pick, ri } from "./core";

export const VISUALS: Archetype[] = [
  {
    id: "visual-kin-vt-slope", course: "p1", unit: 1, topic: "Kinematics", subtopic: "Motion graphs", conceptId: "p1-motion-graphs", difficulty: "hard", type: "graph",
    gen: (r): RawQ => {
      const descending = r() > 0.5;
      const start = ri(2, 8, r), end = descending ? start - ri(3, 7, r) : start + ri(3, 7, r);
      const acceleration = end - start;
      return { diagram: { kind: "vgraph", graph: "vt", shape: descending ? "linear-down" : "linear-up", note: "0–4 s" }, prompt: "The velocity–time graph represents an object during a 4 s interval. Which statement correctly describes the object's acceleration?", choices: [acceleration > 0 ? "Positive and constant" : "Negative and constant", "Zero because the graph is not horizontal", "Positive and increasing", "It cannot be determined from a velocity graph"], correct: 0, tempt: [undefined, "The slope of a nonhorizontal v–t graph is acceleration; a straight line has constant slope.", "The graph's straight slope is constant, not increasing.", "Acceleration is exactly what the slope of v(t) represents."], explanation: `Acceleration is the slope of the v–t graph. The line is straight, so acceleration is constant; its sign follows whether velocity rises or falls.`, equations: ["a = \\Delta v/\\Delta t"], commonMistake: "Reading graph height instead of slope.", apStrategy: "For a velocity graph, ignore height until you identify the slope and its sign.", category: "graph" };
    },
  },
  {
    id: "visual-fbd-incline", course: "p1", unit: 2, topic: "Dynamics", subtopic: "Forces and models", conceptId: "p1-fbd", difficulty: "medium", type: "diagram",
    gen: (r): RawQ => {
      const pulled = r() > 0.5;
      return { diagram: { kind: "fbd", scene: "incline", labels: ["mg", "F_N", pulled ? "T" : "f"] }, prompt: `A block is shown on a ramp. ${pulled ? "A rope pulls it up the ramp." : "It slides down a rough ramp."} Which force is parallel to the ramp in the direction shown by the highlighted arrow?`, choices: [pulled ? "Tension" : "Kinetic friction", "Normal force", "Weight only, with no component", "The net force ma as an additional force"], correct: 0, tempt: [undefined, "The normal force is perpendicular to the ramp, not parallel.", "Weight has a parallel component, but the highlighted interaction in the diagram is the rope/friction arrow.", "ma is a result of the net force, not a separate interaction."], explanation: pulled ? "The rope exerts tension along its length, which is parallel to the ramp in this setup." : "Kinetic friction acts along the contact surface and opposes the direction of relative sliding.", equations: ["\\sum F_{\\parallel} = ma_{\\parallel}"], commonMistake: "Adding ma to a free-body diagram or confusing normal and tangential directions.", apStrategy: "Use the geometry of the arrows before writing components: perpendicular and parallel forces play different roles.", category: "conceptual" };
    },
  },
  {
    id: "visual-energy-bars", course: "p1", unit: 3, topic: "Energy", subtopic: "Energy representations", conceptId: "p1-energy-conservation", difficulty: "medium", type: "representation",
    gen: (r): RawQ => {
      const friction = r() > 0.45;
      return { diagram: { kind: "bars", bars: friction ? [{ label: "U_g", frac: 0.8, color: "#7c6cf4" }, { label: "K", frac: 0.45, color: "#6fd6c8" }, { label: "E_th", frac: 0.35, color: "#ff8fb1" }] : [{ label: "U_g", frac: 0.8, color: "#7c6cf4" }, { label: "K", frac: 0.8, color: "#6fd6c8" }, { label: "E_th", frac: 0, color: "#ff8fb1" }] }, prompt: "The energy bars compare the initial and final states of a system. Which statement is consistent with the representation?", choices: [friction ? "Mechanical energy decreased while total energy remained accounted for" : "Mechanical energy was conserved because no thermal transfer is shown", "Kinetic energy is negative", "The object gained energy from nowhere", "Potential energy and kinetic energy must always be equal"], correct: 0, tempt: [undefined, "Energy bars represent amounts; kinetic energy is nonnegative.", "The bars show where energy was transferred, not energy appearing without a source.", "Conservation does not require K and U to be equal; their sum is the relevant quantity."], explanation: friction ? "The thermal-energy bar records energy transferred out of mechanical energy by friction. The complete system still accounts for the energy." : "With no thermal transfer shown, the gravitational and kinetic bars exchange energy while their total remains constant.", equations: ["E_{mech}=K+U"], commonMistake: "Treating mechanical-energy conservation as total-energy conservation or ignoring the system boundary.", apStrategy: "Read energy bars as bookkeeping: compare categories before choosing an equation.", category: "conceptual" };
    },
  },
  {
    id: "visual-collision-vectors", course: "p1", unit: 4, topic: "Momentum", subtopic: "Collision representations", conceptId: "p1-collisions", difficulty: "hard", type: "diagram",
    gen: (r): RawQ => {
      const v1 = ri(2, 6, r), v2 = ri(1, 4, r);
      return { diagram: { kind: "collision", m1: 2, v1, m2: 1, v2: -v2, note: "before impact" }, prompt: "The carts move toward one another as shown. Which equation correctly represents momentum conservation for the two-cart system?", choices: [`2m(${v1}) + m(-${v2}) = p_{final}`, `2m(${v1}) + m(${v2}) = 0`, `2m(${v1}) - m(${v2}) = K_{final}`, `m(${v1}) + 2m(-${v2}) = p_{final}`], correct: 0, tempt: [undefined, "The velocities have opposite signs, but their momenta do not generally cancel.", "Momentum and kinetic energy are different quantities.", "The masses are attached to the wrong velocities."], explanation: "Momentum is the signed sum p_total = m₁v₁ + m₂v₂. The diagram establishes the signs; conservation equates this initial value to the final system momentum.", equations: ["\\sum p_i = \\sum p_f"], commonMistake: "Dropping the direction sign or swapping masses and velocities.", apStrategy: "Read vector direction from the visual first; then write signed momentum before selecting a formula.", category: "vector" };
    },
  },
  {
    id: "visual-rc-graph", course: "cem", unit: 11, topic: "RC Circuits", subtopic: "Charging graphs", conceptId: "cem-rc-circuits", difficulty: "hard", type: "graph",
    gen: (r): RawQ => {
      const charging = r() > 0.5;
      return { diagram: { kind: "vgraph", graph: "vt", shape: charging ? "exp-up" : "exp-down", note: charging ? "V_C(t)" : "I(t)" }, prompt: `The graph shows a quantity in an RC circuit during ${charging ? "charging" : "discharging"}. Which physical quantity could the graph represent?`, choices: [charging ? "Capacitor voltage" : "Current", charging ? "Current" : "Capacitor charge", "Time constant", "Resistance of the circuit"], correct: 0, tempt: [undefined, charging ? "Charging current starts large and decays; it does not rise toward its final value." : "Capacitor charge does not decay if the circuit is charging.", "For fixed R and C, τ is a constant, not a time-varying curve.", "A component parameter is not the transient quantity shown."], explanation: charging ? "Capacitor voltage rises from zero toward the battery voltage with an exponential shape." : "During discharge, current magnitude decays exponentially toward zero.", equations: ["V_C=V_f(1-e^{-t/\\tau})", "I=I_0e^{-t/\\tau}"], commonMistake: "Confusing rising capacitor voltage with decaying charging current.", apStrategy: "Classify the graph by initial and final behavior before using the exponential equation.", category: "graph" };
    },
  },
  {
    id: "visual-charge-field", course: "p2", unit: 10, topic: "Electric Fields", subtopic: "Field vectors", conceptId: "p2-e-field", difficulty: "hard", type: "diagram",
    gen: (r): RawQ => {
      const positive = r() > 0.5;
      return { diagram: { kind: "charges", q: positive ? ["+", "+"] : ["+", "-"] , note: "field at the midpoint" }, prompt: "Two point charges are arranged as shown. At the midpoint, which statement about the electric field direction is correct?", choices: [positive ? "The fields oppose and cancel" : "The fields point in the same direction and add", positive ? "The fields point in the same direction" : "The fields oppose and cancel", "The field must be zero because the point is between charges", "The field direction depends only on the larger charge"], correct: 0, tempt: [undefined, "Use the direction away from positive charges and toward negative charges before adding vectors.", "Being between charges does not by itself imply cancellation.", "Field direction is a vector superposition, not a rule based only on magnitude."], explanation: positive ? "Equal like charges produce equal and opposite field vectors at the midpoint." : "For unlike charges, both field vectors at the midpoint point from positive toward negative, so they add.", equations: ["\\vec E=\\sum \\vec E_i"], commonMistake: "Assuming midpoint means zero field without checking charge signs.", apStrategy: "Draw each individual field vector first; only then perform vector addition.", category: "vector" };
    },
  },
  {
    id: "visual-optics-rays", course: "p2", unit: 13, topic: "Geometric Optics", subtopic: "Ray diagrams", conceptId: "p2-lenses-mirrors", difficulty: "medium", type: "diagram",
    gen: (r): RawQ => {
      const inside = r() > 0.5;
      return { diagram: { kind: "rayOptics", lens: "converging", objectSide: inside ? "inside-f" : "outside-f" }, prompt: `The converging-lens diagram shows an object ${inside ? "inside" : "outside"} the focal length. Which image description is consistent with the rays?`, choices: [inside ? "Virtual, upright, and magnified" : "Real, inverted, and formed on the opposite side", inside ? "Real and inverted" : "Virtual and upright", "No image forms", "Always same size and upright"], correct: 0, tempt: [undefined, "A converging lens with an object inside f produces a virtual image; outside f produces a real inverted image.", "A real image forms when the object is outside the focal length.", "A lens still forms an image; its type depends on object position."], explanation: inside ? "For d_o < f, refracted rays diverge and their backward extensions meet on the object side, producing a virtual upright magnified image." : "For d_o > f, the refracted rays converge on the opposite side, producing a real inverted image.", equations: ["\\frac1f=\\frac1{d_o}+\\frac1{d_i}"], commonMistake: "Ignoring whether the object is inside or outside the focal length.", apStrategy: "Use the ray geometry before the thin-lens equation; object position determines image type.", category: "conceptual" };
    },
  },
  {
    id: "visual-pv-process", course: "p2", unit: 9, topic: "Thermodynamics", subtopic: "P–V diagrams", conceptId: "p2-heat-energy", difficulty: "hard", type: "graph",
    gen: (r): RawQ => {
      const expansion = r() > 0.5;
      return { diagram: { kind: "pv", points: expansion ? [[0.2, 0.7], [0.8, 0.7]] : [[0.8, 0.3], [0.2, 0.3]], labels: ["A", "B"], note: expansion ? "A → B" : "A → B" }, prompt: "The P–V path is shown. What is the sign of the work done by the gas?", choices: [expansion ? "Positive" : "Negative", expansion ? "Negative" : "Positive", "Zero because pressure is constant", "It cannot be inferred from a P–V diagram"], correct: 0, tempt: [undefined, "Expansion gives positive area under the path; compression gives negative work by the gas.", "Constant pressure can still produce nonzero work when volume changes.", "The signed area and direction of a P–V path directly determine work by the gas."], explanation: expansion ? "The path moves toward larger volume, so W_by = ∫P dV is positive." : "The path moves toward smaller volume, so dV is negative and work by the gas is negative.", equations: ["W_{by}=\\int P\\,dV"], commonMistake: "Using pressure alone to infer work without reading the volume direction.", apStrategy: "On a P–V graph, inspect path direction and signed area, not just the endpoint pressure.", category: "graph" };
    },
  },
];
