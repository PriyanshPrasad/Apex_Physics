// Archetype bank 1: Kinematics. Each archetype is a distinct AP reasoning
// pattern; variants vary scenario, representation, asked quantity, numbers.
import { Archetype, RawQ, ri, rf, pick, fmt, mkNum, SCENARIOS, GRAPH_SHAPES, shapeWord, type GraphShape } from "./core";

const G = 9.8;

export const KINEMATICS: Archetype[] = [
  // ---- K1: v-t graph → predict x-t (representation translation) ----
  {
    id: "kin-vt-to-xt",
    course: "p1", unit: 1, topic: "Kinematics", conceptId: "p1-motion-graphs",
    difficulty: "medium", type: "representation",
    gen: (r) => {
      const shape = pick(["linear-up", "flat", "linear-down", "parabolic-up"] as const, r) as GraphShape;
      const obj = pick(SCENARIOS.mover, r);
      const q: RawQ = {
        prompt: `A velocity–time graph for ${obj} rolling along a straight track is shown. The v(t) graph ${shapeWord(shape, true)}. Which describes the position–time graph?`,
        diagram: { kind: "vgraph", graph: "vt", shape },
        choices: [] as string[], correct: 0,
        explanation: "",
        equations: ["v = \\text{slope of } x(t)"],
        commonMistake: "Copying the shape of the graph instead of applying the slope relationship.",
        apStrategy: "Slope-of-position = velocity. Read what v(t) DOES, then ask what slope that implies for x(t).",
        category: "graph",
      };
      if (shape === "flat") {
        q.choices = ["A horizontal line (x constant)", "A straight line with constant nonzero slope", "A parabola opening upward", "A curve that steepens with time"];
        q.correct = 1;
        q.explanation = "Constant nonzero v means position changes steadily: a straight x(t) with slope equal to that velocity.";
      } else if (shape === "linear-up") {
        q.choices = ["A horizontal line", "A straight line with constant slope", "An upward-curving (parabolic) line", "A downward-curving line"];
        q.correct = 2;
        q.explanation = "Linearly growing v means growing x-slope: x(t) curves upward, quadratic in time.";
      } else if (shape === "linear-down") {
        q.choices = ["A parabola opening upward", "A line with constant negative slope", "A curve that flattens as it climbs", "A horizontal line"];
        q.correct = 1;
        q.explanation = "Linearly decreasing (negative) v gives x(t) a constant negative slope — a straight line heading down.";
      } else {
        q.choices = ["A straight line", "A horizontal line", "A curve that steepens steadily (quadratic rise)", "A curve that flattens as time goes on"];
        q.correct = 2;
        q.explanation = "v growing linearly from zero is the signature of constant acceleration from rest — x(t) is quadratic, steepening forever.";
      }
      return q;
    },
  },
  // ---- K2: area under v-t (quantitative from graph) ----
  {
    id: "kin-vt-area",
    course: "p1", unit: 1, topic: "Kinematics", conceptId: "p1-motion-graphs",
    difficulty: "medium", type: "graph",
    gen: (r) => {
      const v0 = ri(2, 8, r);
      const a = ri(1, 4, r);
      const t = ri(2, 6, r);
      const disp = v0 * t + 0.5 * a * t * t;
      const obj = pick(SCENARIOS.mover, r);
      const num = mkNum(disp, [
        { v: v0 * t, tempt: "You read only the rectangle — the triangular area under the growing part is missing." },
        { v: 0.5 * a * t * t, tempt: "That's just the triangle; the rectangle of constant-velocity motion is missing." },
        { v: v0 + a * t, tempt: "That's the final velocity, not the displacement. Displacement is AREA, not height." },
      ], "m", r);
      return {
        prompt: `The v–t graph for ${obj} is a straight line starting at ${v0} m/s and rising to ${v0 + a * t} m/s over ${t} s. What is the displacement?`,
        diagram: { kind: "vgraph", graph: "vt", shape: "linear-up" },
        ...num,
        explanation: `Displacement = area under v(t): a rectangle (${v0}×${t}) plus a triangle (½×${t}×${a}t) = ${fmt(disp)} m.`,
        equations: ["\\Delta x = \\text{area under } v(t)"],
        commonMistake: "Reading the final velocity as displacement, or taking only part of the area.",
        apStrategy: "Area under v–t is displacement; area under a–t is velocity change. Name the area before computing it.",
        category: "graph",
      };
    },
  },
  // ---- K3: free fall / throw-up conceptual + numeric ----
  {
    id: "kin-freefall-top",
    course: "p1", unit: 1, topic: "Kinematics", conceptId: "p1-kinematics",
    difficulty: "easy", type: "conceptual",
    gen: (r) => {
      const v0 = ri(10, 25, r);
      const obj = pick(["ball", "stone", "marker", "dart"], r);
      return {
        prompt: `${obj[0].toUpperCase() + obj.slice(1)} thrown straight up at ${v0} m/s. At the highest point of its flight, the acceleration of ${obj} is:`,
        choices: ["0 m/s²", `9.8 m/s² downward`, `9.8 m/s² upward`, "Depends on the launch speed"],
        correct: 1,
        tempt: ["Velocity is zero at the top, but acceleration is about FORCES, not speed — gravity never pauses.", undefined, "Acceleration points where the velocity CHANGES toward — which is down.", "Launch speed sets how high, not the acceleration — gravity is the same for all."],
        explanation: "Only gravity acts (air resistance ignored), so a = g downward at every instant — including the top, where v = 0 for an instant. That downward acceleration is exactly why it doesn't hover.",
        equations: ["a_y = -g"],
        commonMistake: "'v = 0 so a = 0' — confuses the value of velocity with the rate of change of velocity.",
        apStrategy: "Ask 'what forces act right now?' Velocity never appears in a force inventory.",
        category: "conceptual",
      };
    },
  },
  // ---- K4: projectile range/height proportional reasoning ----
  {
    id: "kin-projectile-prop",
    course: "p1", unit: 1, topic: "Kinematics", conceptId: "p1-projectiles",
    difficulty: "medium", type: "proportional-reasoning",
    gen: (r) => {
      const factor = pick([2, 3, 4] as const, r);
      const obj = pick(SCENARIOS.mover, r);
      const askRange = r() < 0.5;
      const power = askRange ? 2 : 2;
      const answerTxt = askRange ? `${factor ** power}×` : `${factor ** power}×`;
      return {
        prompt: `${obj[0].toUpperCase() + obj.slice(1)} is launched at 45° over level ground. If the launch speed is made ${factor}× larger, the ${askRange ? "range" : "maximum height"} becomes:`,
        choices: [`${factor}×`, `${factor ** power}×`, `${factor ** 3}×`, `\\sqrt{${factor}}×`],
        correct: 1,
        tempt: [
          askRange ? "Range scales with v₀², not v₀ — scan the equation for the exponent." : "Height scales with v₀², not v₀.",
          undefined,
          "That's v₀ cubed — check the exponent in the formula again.",
          "The square root goes the wrong way — quantities scaling with v₀² grow faster than v.",
        ],
        explanation: `Both range (R = v₀²sin2θ/g) and height (H = v₀²sin²θ/2g) scale with v₀². ${factor}× the speed → ${factor ** power}× the ${askRange ? "range" : "height"}.`,
        equations: ["R = \\frac{v_0^2 \\sin 2\\theta}{g}, \\quad H = \\frac{v_0^2\\sin^2\\theta}{2g}"],
        commonMistake: "Assuming a linear relationship without checking the exponent.",
        apStrategy: "Proportional-reasoning questions are solved by finding the exponent — zero arithmetic needed.",
        category: "algebra",
      };
    },
  },
  // ---- K5: stopping-distance reasoning (two-object comparison) ----
  {
    id: "kin-stopping",
    course: "p1", unit: 1, topic: "Kinematics", conceptId: "p1-kinematics",
    difficulty: "hard", type: "proportional-reasoning",
    gen: (r) => {
      const f = pick([2, 3] as const, r);
      return {
        prompt: `Car P travels at speed v; car Q at ${f}v. Both brake with the same deceleration. The stopping distance of Q compared to P is:`,
        choices: [`${f}×`, `${f ** 2}×`, `\\sqrt{${f}}×`, "The same"],
        correct: 1,
        tempt: ["Speed enters squared: v² = 2ad.", undefined, "That's the time ratio (∝ v), not distance (∝ v²).", "Same deceleration, different initial speed — the outcome differs."],
        explanation: `From v² = 2ad: d = v²/2a ∝ v². ${f}× the speed → ${f ** 2}× the distance. This is why highway speeds are dangerous: double the speed, quadruple the stopping distance.`,
        equations: ["v^2 = v_0^2 + 2a\\Delta x"],
        commonMistake: "Linear reasoning about a quadratic relationship.",
        apStrategy: "Choose the kinematics equation whose 'knowns' exclude time — here v², then read the proportionality.",
        category: "algebra",
      };
    },
  },
  // ---- K6: x-t graph → motion description ----
  {
    id: "kin-xt-read",
    course: "p1", unit: 1, topic: "Kinematics", conceptId: "p1-motion-graphs",
    difficulty: "medium", type: "graph",
    gen: (r) => {
      const shape = pick(["linear-up", "parabolic-up", "sine-down"] as const, r) as GraphShape;
      const obj = pick(SCENARIOS.mover, r);
      let correct = ""; let choices: string[] = [];
      if (shape === "linear-up") {
        correct = "Constant velocity away from the start";
        choices = ["At rest", "Constant velocity away from the start", "Speeding up", "Turning around"];
      } else if (shape === "parabolic-up") {
        correct = "Speeding up steadily (constant acceleration)";
        choices = ["Constant velocity", "At rest", "Speeding up steadily (constant acceleration)", "Moving at constant speed then stopping"];
      } else {
        correct = "Moving away, then slowing and stopping";
        choices = ["Speeding up the whole time", "Moving away, then slowing and stopping", "Moving toward the start the whole time", "Turning around at the peak"];
      }
      return {
        prompt: `The position–time graph for ${obj} is shown. Which describes the motion?`,
        diagram: { kind: "vgraph", graph: "xt", shape },
        choices, correct: choices.indexOf(correct),
        explanation: `Read the SLOPE of x(t): flat = rest, straight = constant v, steepening = speeding up, flattening = slowing.`,
        equations: ["v = \\frac{dx}{dt} \\text{ (slope)}"],
        commonMistake: "Reading the height of the graph instead of its slope.",
        apStrategy: "For x–t graphs the slope is the story. Trace the slope with your eyes across the graph before answering.",
        category: "graph",
      };
    },
  },
  // ---- K7: relative motion (elevator / two objects) ----
  {
    id: "kin-relative",
    course: "p1", unit: 1, topic: "Kinematics", conceptId: "p1-kinematics",
    difficulty: "hard", type: "conceptual",
    gen: (r) => {
      const v = ri(2, 6, r);
      const obj = pick(["ball", "coin", "wrench"], r);
      return {
        prompt: `A ${obj} is released from rest inside an elevator moving upward at a constant ${v} m/s. Relative to the ELEVATOR, the ${obj} falls with acceleration:`,
        choices: ["9.8 m/s² downward", "9.8 m/s² downward plus the elevator's motion", "9.8 m/s² upward", "It floats — no acceleration"],
        correct: 0,
        tempt: ["The elevator's constant velocity is a reference frame — constant velocity frames agree on acceleration.", undefined, "Gravity points down in every non-accelerating frame.", "The coin was moving with the elevator, but gravity still acts on it once released."],
        explanation: "Constant-velocity reference frames share the same accelerations. Once released, gravity gives the coin 9.8 m/s² downward in the elevator frame too (it just started with zero relative velocity).",
        equations: ["a_{rel} = a - a_{frame}"],
        commonMistake: "Adding the elevator's velocity to the gravitational acceleration.",
        apStrategy: "Reference-frame questions: constant velocity frames differ only in initial velocities, never accelerations.",
        category: "conceptual",
      };
    },
  },
  // ---- K8: piecewise motion (multi-interval stimulus) ----
  {
    id: "kin-piecewise",
    course: "p1", unit: 1, topic: "Kinematics", conceptId: "p1-kinematics",
    difficulty: "hard", type: "graph",
    gen: (r) => {
      const v1 = ri(2, 5, r);
      const v2 = ri(6, 10, r);
      const t1 = 2, t2 = 3;
      const total = v1 * t1 + v2 * t2;
      return {
        prompt: `A cart moves at constant ${v1} m/s for ${t1} s, then at constant ${v2} m/s for ${t2} s. What is the AVERAGE velocity for the whole trip?`,
        choices: [fmt((v1 + v2) / 2, 2) + " m/s", fmt(total / (t1 + t2), 2) + " m/s", fmt(total, 2) + " m/s", fmt(v2, 2) + " m/s"],
        correct: 1,
        tempt: [
          "Averaging the two speeds ignores how LONG each lasted — time-weight it.",
          undefined,
          "That's total distance, not average velocity (distance ÷ time).",
          "That's just the second speed — the first interval counts too.",
        ],
        explanation: `Average velocity = total displacement / total time = (${v1}·2 + ${v2}·3)/5 = ${fmt(total / 5)} m/s. Because the second interval lasted longer, the average is pulled toward v₂.`,
        equations: ["v_{avg} = \\frac{\\Delta x_{total}}{\\Delta t_{total}}"],
        commonMistake: "Simple averaging of speeds without time weighting.",
        apStrategy: "Average velocity is always total displacement over total time — never the average of the speeds unless times are equal.",
        category: "algebra",
      };
    },
  },
  // ---- K9: equation selection ----
  {
    id: "kin-eq-select",
    course: "p1", unit: 1, topic: "Kinematics", conceptId: "p1-kinematics",
    difficulty: "medium", type: "equation-selection",
    gen: (r) => {
      const knowns = pick([
        { given: "initial velocity, acceleration, and time", want: "displacement", eq: "x = x_0 + v_0t + \\tfrac12 at^2" },
        { given: "initial and final velocity and the distance", want: "acceleration", eq: "v^2 = v_0^2 + 2a\\Delta x" },
        { given: "initial velocity, acceleration, and displacement", want: "final velocity", eq: "v^2 = v_0^2 + 2a\\Delta x" },
      ] as const, r);
      return {
        prompt: `A problem gives ${knowns.given} and asks for ${knowns.want}. Time is NOT given. The most efficient equation is:`,
        choices: [
          "x = x_0 + v_0t + \\tfrac12 at^2",
          "v = v_0 + at",
          knowns.eq,
          "\\Delta x = \\bar{v}\\,t",
        ],
        correct: 2,
        tempt: [
          "That equation needs time — which the problem doesn't provide.",
          "That solves for final velocity, not what's asked — and it needs time.",
          undefined,
          "That requires the average velocity, which you'd have to construct first — possible but not direct.",
        ],
        explanation: `Match the equation to the variables you HAVE and the one you WANT. ${knowns.eq} connects exactly the given quantities to the target without time.`,
        equations: [knowns.eq],
        commonMistake: "Choosing equations by habit rather than by inventorying knowns and unknowns.",
        apStrategy: "List knowns, unknown, and absent variables (time?). The absent variable eliminates entire equations instantly.",
        category: "wrong-equation",
      };
    },
  },
  // ---- K10: experimental data table → relationship ----
  {
    id: "kin-data-table",
    course: "p1", unit: 1, topic: "Kinematics", conceptId: "p1-motion-graphs",
    difficulty: "hard", type: "experimental",
    gen: (r) => {
      const a = ri(2, 5, r);
      const rows = [1, 2, 3, 4].map((n) => ({ t: n, x: 0.5 * a * n * n }));
      const table = `t (s): ${rows.map((x) => x.t).join(", ")}\\nΔx (m): ${rows.map((x) => fmt(x.x)).join(", ")}`;
      return {
        prompt: `A student measures the position of a cart from rest at 1 s intervals:\n\n${table}\n\nWhat is the cart's acceleration?`,
        choices: [`${a} m/s²`, `${2 * a} m/s²`, `${a / 2} m/s²`, `${a * a} m/s²`],
        correct: 0,
        tempt: [
          undefined,
          "You compared consecutive differences (Δ²x pattern) — the acceleration is twice the second-difference when using 1 s steps... check the fit again: x = ½at² gives a = 2×(second difference) — but the second differences here are 2a per... recompute carefully.",
          "That's the ½ factor leaking out — ½a is the coefficient of t².",
          "Units: acceleration can't come out in m²/s⁴ — check your algebra.",
        ],
        explanation: `x = ½at². Testing: x(1) = ${fmt(rows[0].x)} = ½a → a = ${2 * rows[0].x}; x(2) = ${fmt(rows[1].x)} = ½a(4) → a = ${fmt(rows[1].x / 2)}. Consistent: a = ${a} m/s².`,
        equations: ["x = \\tfrac12 at^2"],
        commonMistake: "Misreading the ½ factor when extracting a from the coefficient of t².",
        apStrategy: "Fit data to the model's FORM: for x ∝ t², plot x vs t² and take the slope = ½a.",
        category: "experimental",
      };
    },
  },
  // ---- K11: limiting-case reasoning ----
  {
    id: "kin-limiting",
    course: "p1", unit: 1, topic: "Kinematics", conceptId: "p1-projectiles",
    difficulty: "ap", type: "conceptual",
    gen: (r) => {
      return {
        prompt: "A projectile is launched at speed v at angle θ above level ground. Air resistance is NOT ignored — it grows with speed. Compared to the no-drag case at the same launch angle and speed, the range is:",
        choices: [
          "Shorter, and the optimal angle drops below 45°",
          "Shorter, and the optimal angle rises above 45°",
          "Unchanged — drag only affects the height",
          "Longer, because drag slows the descent",
        ],
        correct: 0,
        tempt: [
          undefined,
          "Drag steals speed; less speed wants a flatter, faster path — the optimum angle drops.",
          "Drag acts on both components all flight long.",
          "Drag always removes mechanical energy — the range can't grow.",
        ],
        explanation: "Drag removes horizontal speed throughout the flight, shortening the range. Because the slow, high-arc portion suffers most, the optimum launch angle drops below 45° (think: a golf drive or a thrown paper airplane flies flattest-fastest).",
        equations: ["F_{drag} \\propto v \\text{ or } v^2"],
        commonMistake: "Believing 45° is sacred regardless of air resistance.",
        apStrategy: "When an assumption is removed (no-drag → drag), ask which conclusion DEPENDED on it. 45° optimal came from symmetry — drag breaks the symmetry upward.",
        category: "assumption",
      };
    },
  },
  // ---- K12: v-t graph reading two carts (comparison stimulus) ----
  {
    id: "kin-two-carts",
    course: "p1", unit: 1, topic: "Kinematics", conceptId: "p1-motion-graphs",
    difficulty: "ap", type: "graph",
    gen: (r) => {
      const a1 = ri(2, 4, r);
      const v0 = ri(2, 6, r);
      return {
        prompt: `Cart X starts at rest and accelerates at ${a1} m/s². Cart Y starts at ${v0} m/s and moves at constant velocity. At the moment their v–t lines cross, the carts have the same:`,
        choices: ["Position", "Velocity", "Acceleration", "Displacement from start"],
        correct: 1,
        tempt: [
          "Crossing v-lines mean equal velocities — positions require AREA comparison, which differs here.",
          undefined,
          "Cart X's acceleration is nonzero; cart Y's is zero — their slopes differ.",
          "Displacement = area under v–t up to that time; the areas are different.",
        ],
        explanation: "Crossing graphs = equal values AT that instant: same velocity. Nothing about position (areas) or acceleration (slopes) matches — both differ.",
        equations: ["\\text{intersection: } v_X(t) = v_Y(t)"],
        commonMistake: "Reading more into a graph intersection than 'equal value at that instant'.",
        apStrategy: "For two-object graph questions, ask what's equal (values), what's not (slopes, areas), and in which quantity the asked variable lives.",
        category: "graph",
      };
    },
  },
];

// ---- helpers re-exported for other banks ----
export { G };
