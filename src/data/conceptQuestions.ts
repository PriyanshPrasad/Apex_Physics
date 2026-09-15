// Conceptual check questions (lesson step 10).
export interface ConceptQuestion {
  prompt: string;
  choices: string[];
  correct: number;
  explains: string;
}

const QUESTIONS: Record<string, ConceptQuestion> = {
  "p1-vectors": {
    prompt: "A 10 N force points east and another 10 N force points north act on a crate. The net force magnitude is:",
    choices: ["0 N", "10 N", "14 N", "20 N"],
    correct: 2,
    explains: "Perpendicular vectors combine by the Pythagorean theorem: √(10² + 10²) = 14 N. Direction matters — never add magnitudes blindly.",
  },
  "p1-kinematics": {
    prompt: "A ball is thrown straight up. At the very top of its flight:",
    choices: [
      "Velocity and acceleration are both zero",
      "Velocity is zero, acceleration is g downward",
      "Velocity is maximum, acceleration is zero",
      "Acceleration reverses direction",
    ],
    correct: 1,
    explains: "Velocity passes through zero at the top, but gravity never pauses: acceleration is 9.8 m/s² downward throughout the flight.",
  },
  "p1-motion-graphs": {
    prompt: "On a velocity–time graph, a straight horizontal line at v = 4 m/s means the object:",
    choices: ["Is at position 4 m", "Moves at constant velocity", "Accelerates at 4 m/s²", "Is slowing down"],
    correct: 1,
    explains: "Height is velocity. A flat v–t line = steady motion. Its AREA gives position change, not its height.",
  },
  "p1-projectiles": {
    prompt: "Two balls are released from the same height at the same instant: one dropped, one thrown horizontally. Which lands first?",
    choices: ["The dropped one", "The thrown one", "They land together", "Depends on the masses"],
    correct: 2,
    explains: "Vertical motion is identical for both: same initial vertical velocity (0), same g. Horizontal speed doesn't affect fall time.",
  },
  "p1-fbd": {
    prompt: "A book sits at rest on a table. Which pair of forces forms a Newton's-third-law pair?",
    choices: [
      "Weight (on book) and normal force (on book)",
      "Normal force on book and force of book on table",
      "Weight of book and weight of Earth",
      "Normal force and friction",
    ],
    correct: 1,
    explains: "Third-law pairs act on different objects: table pushes book up; book pushes table down. Weight and normal both act on the book — they balance but are NOT a third-law pair.",
  },
  "p1-newton2": {
    prompt: "A constant net force acts on an object. If the mass doubles, the acceleration:",
    choices: ["Doubles", "Halves", "Stays the same", "Quadruples"],
    correct: 1,
    explains: "a = F/m. Fixed F: acceleration and mass are inversely proportional.",
  },
  "p1-friction": {
    prompt: "A box sits still on a rough ramp. The friction force on it equals:",
    choices: [
      "μ_s·mg always",
      "Whatever it needs to be (up to μ_s·mg cosθ) to keep equilibrium",
      "Zero because nothing moves",
      "μ_k·mg cosθ",
    ],
    correct: 1,
    explains: "Static friction is a response force, not a fixed value. It equals mg·sinθ exactly, as long as that doesn't exceed the ceiling μ_s·mg·cosθ.",
  },
  "p1-circular-force": {
    prompt: "A car rounds a curve at constant speed. Its acceleration is:",
    choices: ["Zero", "Tangent to the curve", "Toward the center", "Away from the center"],
    correct: 2,
    explains: "Constant speed ≠ zero acceleration: the direction change requires inward (centripetal) acceleration.",
  },
  "p1-work": {
    prompt: "You carry a heavy box levelly across a room at constant speed. The work you do on the box (gravity aside) is:",
    choices: ["Large and positive", "Zero (ideally, holding force ⊥ motion)", "Large and negative", "Equal to mgh"],
    correct: 1,
    explains: "Your holding force is vertical; displacement is horizontal: cos 90° = 0. No work transfers to kinetic energy. (Your muscles burn energy internally — biology, not work on the box.)",
  },
  "p1-energy-conservation": {
    prompt: "A sled slides down a frictionless hill. Which quantity stays constant?",
    choices: ["Kinetic energy", "Potential energy", "Total mechanical energy", "Momentum"],
    correct: 2,
    explains: "K and U trade, but K + U is fixed when nothing dissipative acts. Momentum changes because gravity (an external force to the sled) acts.",
  },
  "p1-power": {
    prompt: "Two identical crates are lifted to the same height — one slowly, one quickly. Compare:",
    choices: [
      "Same work, different power",
      "Same power, different work",
      "Different work, same power",
      "Same work and power",
    ],
    correct: 0,
    explains: "Work = mgh is path-independent; power = work/time differs. The fast lift delivers energy at a higher rate.",
  },
  "p1-momentum": {
    prompt: "Why do airbags reduce injury? They:",
    choices: [
      "Reduce the impulse your head experiences",
      "Extend the stopping time, cutting the average force",
      "Reduce your momentum change",
      "Absorb the momentum so it disappears",
    ],
    correct: 1,
    explains: "Your Δp is fixed by the crash; J = FΔt. Stretching Δt shrinks F. Momentum change cannot be reduced — only its force can be spread out.",
  },
  "p1-collisions": {
    prompt: "Two carts collide and stick together. Which is definitely true?",
    choices: [
      "KE is conserved",
      "Momentum is conserved, KE decreases",
      "Momentum decreases, KE conserved",
      "Both are conserved",
    ],
    correct: 1,
    explains: "Sticking = perfectly inelastic: momentum always survives in an isolated collision; KE converts to heat/deformation.",
  },
  "p1-angular-kin": {
    prompt: "A point on a spinning disk at twice the radius, compared to a point at r, has:",
    choices: [
      "Same ω, twice the v",
      "Same v, twice the ω",
      "Twice ω and v",
      "Half ω, same v",
    ],
    correct: 0,
    explains: "Every point of a rigid body shares ω. Linear speed v = rω grows with radius.",
  },
  "p1-torque": {
    prompt: "You push a door at its free edge, perpendicular to the door. If you push halfway to the hinges with the same force, torque:",
    choices: ["Doubles", "Halves", "Unchanged", "Zero"],
    correct: 1,
    explains: "τ = rF sinθ. Halving r with the same perpendicular force halves the torque.",
  },
  "p1-rot-dynamics": {
    prompt: "A hoop and a disk of equal mass and radius roll down the same hill. The disk arrives first because:",
    choices: [
      "It weighs less",
      "Its smaller I means less energy goes into rotation",
      "Friction is smaller for disks",
      "The hoop slips",
    ],
    correct: 1,
    explains: "Disk: I = ½mR² vs hoop: I = mR². Less rotational KE share → more translational KE at the bottom → higher v for the same height drop.",
  },
  "p1-rot-energy": {
    prompt: "A rolling object's total kinetic energy is:",
    choices: ["½mv² only", "½Iω² only", "½mv² + ½Iω²", "mgh"],
    correct: 2,
    explains: "Rolling = translating + spinning, so both terms contribute; the split depends on I.",
  },
  "p1-angular-momentum": {
    prompt: "A skater pulls her arms in. What happens?",
    choices: [
      "L decreases, ω increases",
      "L conserved, ω increases",
      "Both L and ω conserved",
      "ω decreases",
    ],
    correct: 1,
    explains: "No external torque → L = Iω constant. Shrinking I forces ω up.",
  },
  "p1-rolling": {
    prompt: "For a wheel rolling without slipping, the contact point's instantaneous velocity relative to the ground is:",
    choices: ["v forward", "2v forward", "Zero", "v backward"],
    correct: 2,
    explains: "Translation (+v) and rotation (−v at the bottom) cancel exactly at the contact point — that's why static friction does no work.",
  },
  "p1-shm": {
    prompt: "A mass on a spring oscillates with amplitude A. If you double A, the period:",
    choices: ["Doubles", "Halves", "Stays the same", "Increases by √2"],
    correct: 2,
    explains: "T = 2π√(m/k) — amplitude-independent. Bigger amplitude = faster at center, same tempo.",
  },
  "p1-pressure": {
    prompt: "Pressure 5 m deep in a lake compared to 1 m deep is:",
    choices: ["5× as much total pressure", "ρg·4 more (the ρgh part grows with depth)", "The same", "Half"],
    correct: 1,
    explains: "P = P₀ + ρgh: only the fluid contribution grows linearly with depth; atmospheric pressure is the same at both depths.",
  },
  "p1-buoyancy": {
    prompt: "A boat carrying stones floats in a pond. The stones are dropped overboard and sink. The pond's water level:",
    choices: ["Rises", "Falls", "Stays the same", "Depends on stone density"],
    correct: 1,
    explains: "In the boat, stones displace their weight of water; sunken, they displace only their volume — less water moved, so the level falls.",
  },
  "p1-continuity": {
    prompt: "Water flows through a pipe that narrows to half its diameter. The speed becomes:",
    choices: ["Half", "Same", "Double", "4× (area ∝ d²)"],
    correct: 3,
    explains: "Continuity: A₁v₁ = A₂v₂. Halving diameter quarters the area, so v quadruples.",
  },
  "p2-ideal-gas": {
    prompt: "A sealed gas is heated at constant volume. What happens?",
    choices: ["P decreases", "P increases proportionally to T (in K)", "P unchanged", "V increases"],
    correct: 1,
    explains: "Fixed V and n: P ∝ T. Faster particles hit the walls harder and more often.",
  },
  "p2-heat-energy": {
    prompt: "In an isothermal compression of an ideal gas, the work done BY the gas is:",
    choices: ["Positive", "Negative (energy leaves as work in, heat flows out)", "Zero", "Infinite"],
    correct: 1,
    explains: "Compression: volume shrinks, so W by gas < 0; to hold T constant the gas must expel heat: Q = W < 0 too.",
  },
  "p2-entropy": {
    prompt: "Why don't broken eggs un-break?",
    choices: [
      "Energy isn't conserved",
      "The un-broken state has overwhelmingly fewer microstates — probability forbids it",
      "Entropy decreases locally is impossible",
      "Gravity prevents it",
    ],
    correct: 1,
    explains: "The second law is statistical: systems evolve toward the overwhelming majority of arrangements (higher entropy).",
  },
  "p2-charge-force": {
    prompt: "Two charged spheres attract. If one charge doubles and separation halves, the force:",
    choices: ["Halves", "Doubles", "8× larger", "4× larger"],
    correct: 2,
    explains: "F ∝ q₁q₂/r²: doubling q doubles it; halving r multiplies by 4. Total 8×.",
  },
  "p2-e-field": {
    prompt: "Electric field lines never cross because:",
    choices: [
      "The field would be infinite",
      "The field has one direction at each point",
      "Lines repel each other",
      "Charges block them",
    ],
    correct: 1,
    explains: "Superposition guarantees a single net E vector at every point — crossing lines would mean two directions at once.",
  },
  "p2-potential": {
    prompt: "A proton is released in an electric field. It moves toward:",
    choices: ["Higher potential", "Lower potential", "Constant V", "Perpendicular to V"],
    correct: 1,
    explains: "Positive charges 'fall' to lower potential (U = qV: lower V, lower U for q > 0).",
  },
  "p2-current-ohm": {
    prompt: "Double the voltage across an ohmic resistor. The current:",
    choices: ["Halves", "Doubles", "Quadruples", "Unchanged"],
    correct: 1,
    explains: "V = IR: I ∝ V for fixed R.",
  },
  "p2-series-parallel": {
    prompt: "Adding a resistor in parallel to a circuit always:",
    choices: [
      "Increases R_eq",
      "Decreases R_eq",
      "Leaves R_eq unchanged",
      "Increases total current from the battery",
    ],
    correct: 1,
    explains: "Parallel adds a path: R_eq drops (and total current rises). The 'always decreases' statement is the safe one; battery current then rises as a consequence.",
  },
  "p2-kirchhoff": {
    prompt: "Kirchhoff's junction rule expresses conservation of:",
    choices: ["Energy", "Charge", "Momentum", "Mass"],
    correct: 1,
    explains: "Charge in = charge out at any node. The loop rule is energy conservation.",
  },
  "p2-magnetic-force": {
    prompt: "A proton moves parallel to a magnetic field. The magnetic force on it is:",
    choices: ["Maximum", "Zero", "qvB", "Perpendicular to B"],
    correct: 1,
    explains: "F = qvB sinθ: θ = 0 → no force. Only the perpendicular velocity component matters.",
  },
  "p2-wire-fields": {
    prompt: "Two parallel wires carry current in the same direction. They:",
    choices: ["Repel", "Attract", "No interaction", "Torque but no force"],
    correct: 1,
    explains: "Wire 1's field circles into wire 2's position; F = IL×B pulls wire 2 toward wire 1. Same direction → attract.",
  },
  "p2-refraction": {
    prompt: "Light travels from air into glass (higher n). It bends:",
    choices: ["Away from the normal", "Toward the normal", "Not at all", "Backwards"],
    correct: 1,
    explains: "Slower medium → wavefronts pivot → beam bends toward the normal (n₁sinθ₁ = n₂sinθ₂).",
  },
  "p2-lenses-mirrors": {
    prompt: "An object sits inside the focal length of a converging lens. The image is:",
    choices: ["Real, inverted", "Virtual, upright, magnified", "Real, upright", "No image forms"],
    correct: 1,
    explains: "d_o < f gives the magnifying-glass case: virtual, upright, enlarged — rays diverge but appear to come from behind the object.",
  },
  "p2-waves": {
    prompt: "A wave passes from a light string to a heavy rope. Its speed:",
    choices: ["Increases", "Decreases", "Same", "Depends on frequency"],
    correct: 1,
    explains: "Heavier medium (higher mass density) → slower wave. Frequency stays source-fixed; λ shrinks.",
  },
  "p2-interference": {
    prompt: "Two speakers emit in-phase coherent sound. At a point where the path difference is λ/2, you hear:",
    choices: ["A loud spot", "A quiet spot (destructive)", "Normal loudness", "Echoes"],
    correct: 1,
    explains: "Half-wavelength offset = crest meets trough → cancellation.",
  } as ConceptQuestion,
  "p2-doppler": {
    prompt: "As an ambulance approaches then passes you, the observed pitch:",
    choices: ["Stays high", "Drops as it passes", "Rises as it passes", "Doubles"],
    correct: 1,
    explains: "Approaching: wavefronts bunch (higher f). Receding: stretched (lower f). The drop at passage is the Doppler signature.",
  },
  "p2-photoelectric": {
    prompt: "Dim violet light ejects electrons from a metal; bright red light does not. This shows:",
    choices: [
      "Intensity doesn't matter at all",
      "Each photon's energy depends on frequency, not total beam energy",
      "Red photons are too big",
      "The metal is colored",
    ],
    correct: 1,
    explains: "E = hf per photon. Violet photons individually exceed φ; red ones never do, however many arrive.",
  },
  "p2-nuclear": {
    prompt: "In nuclear reactions, the energy released comes from:",
    choices: ["Electron rearrangement", "Mass converted by E = Δmc²", "Chemical bonds", "Friction"],
    correct: 1,
    explains: "Products weigh slightly less than reactants; the mass defect appears as energy at the colossal rate c².",
  },
  "cm-calculus-kin": {
    prompt: "If v(t) = 3t² m/s, the displacement from 0 to 2 s is:",
    choices: ["6 m", "8 m", "12 m", "4 m"],
    correct: 1,
    explains: "Δx = ∫₀² 3t² dt = t³ |₀² = 8 m. Integrals accumulate velocity into position.",
  },
  "cm-diff-dynamics": {
    prompt: "A force depends on velocity (F = −bv). The motion is found by:",
    choices: [
      "Constant-a kinematics",
      "Solving a differential equation for v(t)",
      "Assuming a = 0",
      "Energy conservation only",
    ],
    correct: 1,
    explains: "m dv/dt = −bv separates and integrates to exponential decay — a differential-equation problem from the start.",
  },
  "cm-gravitation": {
    prompt: "A satellite in a circular orbit: if r doubles, the speed:",
    choices: ["Halves", "Drops by √2", "Doubles", "Unchanged"],
    correct: 1,
    explains: "v = √(GM/r): doubling r divides v by √2.",
  },
  "cm-work-integral": {
    prompt: "The U(x) curve has a local minimum at x₀. At that point:",
    choices: ["F = 0 and equilibrium is stable", "F is maximum", "Kinetic energy is maximum", "The object must be moving"],
    correct: 0,
    explains: "F = −dU/dx = 0 at extrema; a minimum is stable (small pushes roll back), a maximum unstable.",
  },
  "cm-momentum": {
    prompt: "A projectile explodes mid-flight. Its center of mass:",
    choices: [
      "Stops",
      "Continues on the original parabolic path",
      "Deflects toward the heavier fragment",
      "Falls straight down",
    ],
    correct: 1,
    explains: "Explosion forces are internal; the COM obeys external forces only (gravity), so it keeps the original trajectory.",
  },
  "cm-rot-dynamics": {
    prompt: "Why does I for a rod about its END equal four times I about its center?",
    choices: [
      "Mass doubles",
      "Every mass element is farther from the axis — ∫r²dm weights radius squared",
      "Torque is bigger",
      "It isn't — the ratio is 2",
    ],
    correct: 1,
    explains: "I = ∫r²dm: shifting the axis outward doubles typical r, and r² quadruples each contribution.",
  },
  "cm-angular-momentum": {
    prompt: "A comet swings close to the Sun. As r shrinks, its speed:",
    choices: ["Drops", "Rises (mrv conserved)", "Unchanged", "Reverses"],
    correct: 1,
    explains: "No torque about the Sun → L = mrv constant → smaller r demands larger v.",
  },
  "cm-shm-ode": {
    prompt: "Solving m x″ = −kx shows SHM's frequency is set by:",
    choices: ["Amplitude", "√(k/m) — the equation itself", "Initial displacement", "Phase"],
    correct: 1,
    explains: "The ODE fixes ω = √(k/m); initial conditions set amplitude and phase, never frequency.",
  },
  "cem-gauss": {
    prompt: "Gauss's law finds E easily when:",
    choices: [
      "Any closed surface is chosen",
      "Symmetry makes E constant and perpendicular to a chosen surface",
      "Charge is negative",
      "The field is zero",
    ],
    correct: 1,
    explains: "The law is always true; it's only USEFUL when symmetry makes ∮E·dA = E·A solvable.",
  },
  "cem-potential": {
    prompt: "Given V(x) = 5x² (SI), the field E_x at x = 2 m is:",
    choices: ["20 V/m", "−20 V/m", "10 V/m", "−10 V/m"],
    correct: 1,
    explains: "E = −dV/dx = −10x = −20 V/m at x = 2. The minus sign: field points downhill on the V map.",
  },
  "cem-capacitors": {
    prompt: "A charged capacitor is disconnected from its battery; then a dielectric is inserted. What happens?",
    choices: ["Q constant, V drops, C rises", "V constant, Q rises", "C drops", "U increases"],
    correct: 0,
    explains: "Isolated: charge has nowhere to go. C↑ = κC, so V = Q/C falls; stored energy drops (the slab gets pulled in).",
  },
  "cem-rc-circuits": {
    prompt: "In RC charging, the time constant τ equals:",
    choices: ["RC", "R/C", "1/(RC)", "C/R"],
    correct: 0,
    explains: "τ = RC emerges from the loop-equation exponent; after 1τ, q ≈ 63% of final.",
  },
  "cem-magnetism": {
    prompt: "To find B of a long straight wire, prefer:",
    choices: ["Biot–Savart integration", "Ampère's law with a circular loop", "Gauss's law", "Faraday's law"],
    correct: 1,
    explains: "Cylindrical symmetry makes B constant on a circle → Ampère gives B = μ₀I/2πr in one line.",
  },
  "cem-induction": {
    prompt: "A loop's flux increases into the page. The induced current is:",
    choices: [
      "Clockwise (opposing the increase with out-of-page field)",
      "Counterclockwise (creating into-page field)",
      "Zero",
      "Random",
    ],
    correct: 0,
    explains: "Lenz: the induced current opposes the CHANGE. Increasing into-page flux requires an induced field pointing out of the page, which by the right-hand rule is counterclockwise (viewed from the side the flux enters).",
  } as ConceptQuestion,
};

export const CONCEPT_QUESTIONS = QUESTIONS;

export function checkAnswer(conceptId: string, correct: boolean) {
  import("@/lib/progress").then(({ progress }) =>
    progress.recordAnswer(conceptId, correct, correct ? 1 : 0, undefined),
  );
}
