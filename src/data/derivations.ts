// ============================================================
// Derivation library — shown in the lesson "Math meaning" step.
// Each entry walks from a physical principle to the working
// equation, so students see WHY the formula exists, not just
// what it says. Keyed by concept id; concepts without an entry
// here get no derivation panel (that's deliberate — not every
// concept benefits from a derivation at this level).
// ============================================================

export interface Derivation {
  tex: string; // the final result
  steps: string[]; // each step explains itself in words
}

export const DERIVATIONS: Record<string, Derivation> = {
  // ---------------- Physics 1 ----------------
  "p1-kinematics": {
    tex: "v = v_0 + a t, \\quad x = x_0 + v_0 t + \\tfrac{1}{2} a t^2",
    steps: [
      "Definition first: constant acceleration means a = Δv/Δt. Solve for v and you get v = v₀ + at — the velocity grows linearly.",
      "Average velocity under linear change is (v₀ + v)/2 = (v₀ + v₀ + at)/2 = v₀ + ½at.",
      "Position changes by average velocity times time: x = x₀ + (v₀ + ½at)t = x₀ + v₀t + ½at².",
      "The ½ is the signature of uniform acceleration: the object spends the interval averaging its starting and ending speeds.",
    ],
  },
  "p1-projectiles": {
    tex: "R = \\frac{v_0^2 \\sin 2\\theta}{g}",
    steps: [
      "Split the launch: vₓ = v₀cosθ (never changes — nothing pushes horizontally), v_y = v₀sinθ (gravity eats 9.8 m/s of it every second).",
      "Time in the air: the projectile lands when y returns to 0. Solve 0 = v_y t − ½gt² → t = 2v₀sinθ/g.",
      "Range is horizontal speed × time: R = (v₀cosθ)(2v₀sinθ/g).",
      "Use the identity 2sinθcosθ = sin2θ: R = v₀²sin2θ/g. Complementary angles (30° and 60°) give the same range — sin2θ is symmetric about 45°.",
    ],
  },
  "p1-newton2": {
    tex: "\\sum \\vec{F} = m\\vec{a}",
    steps: [
      "Experiment: push a cart twice as hard → it speeds up twice as fast. Push a twice-as-heavy cart equally hard → half the acceleration.",
      "So a ∝ F and a ∝ 1/m. Combine: a = F/m for a single applied force.",
      "Real objects feel several forces at once. The mass can't respond to each separately — it responds to the vector sum.",
      "That's ΣF = ma: acceleration points along the NET force, not along any one force. The normal force on a table is real, but it doesn't accelerate anything — it cancels gravity.",
    ],
  },
  "p1-friction": {
    tex: "f_s \\le \\mu_s F_N, \\qquad f_k = \\mu_k F_N",
    steps: [
      "Friction's job is to resist relative sliding. Static friction adjusts itself to whatever the situation needs — up to a limit.",
      "Experiment: the limit turns out to be proportional to how hard the surfaces press together. Press a box down while pushing it → it's harder to slide. That proportionality constant is μ_s.",
      "So static friction obeys f_s ≤ μ_sF_N: an inequality, because friction only supplies what's needed. Only at the breaking point does equality hold.",
      "Once sliding, the surfaces no longer 'negotiate' — kinetic friction is a fixed value f_k = μ_kF_N opposing the relative motion, and μ_k < μ_s, which is why breaking static friction makes the object lurch.",
    ],
  },
  "p1-work": {
    tex: "W = F d \\cos\\theta",
    steps: [
      "Work should measure energy delivered by a force. A force perpendicular to motion (like the normal force on a level floor) delivers none — so only the along-motion component counts.",
      "Component of F along the displacement: F cosθ. Multiply by how far the object moves while the force acts: W = (F cosθ)d.",
      "θ > 90° → cosθ < 0 → the force removes energy (friction braking a box). θ = 180° → W = −Fd.",
      "This is the constant-force case. When F varies, you must add up F·d piece by piece — which is exactly the integral ∫F·dx used in Physics C.",
    ],
  },
  "p1-energy-conservation": {
    tex: "K_i + U_i = K_f + U_f",
    steps: [
      "The work–energy theorem says net work changes kinetic energy: ΔK = W_net.",
      "Split the forces: gravity and springs are conservative — work done by them depends only on endpoints. Define U so that W_conservative = −ΔU.",
      "Substitute: ΔK = W_other + W_conservative = W_other − ΔU.",
      "Rearrange: K_i + U_i = K_f + U_f − W_other. If W_other = 0 (only gravity/springs act), mechanical energy is conserved — the sum is a constant being passed back and forth between K and U.",
    ],
  },
  "p1-momentum": {
    tex: "\\vec{J} = \\Delta \\vec{p} = \\vec{F}_{net}\\,\\Delta t",
    steps: [
      "Newton's second law, rewritten: ΣF = ma = m(dv/dt) = d(mv)/dt for constant mass.",
      "Define momentum p = mv — the quantity of motion. Then ΣF = dp/dt: force is the rate of change of momentum.",
      "Integrate both sides over a collision's short duration: ∫F dt = Δp. The integral is the impulse J.",
      "Impulse view: FΔt = Δp. Same momentum change can come from big-force-short-time (a bat) or small-force-long-time (an airbag) — which is exactly why airbags save lives.",
    ],
  },
  "p1-collisions": {
    tex: "m_1 v_{1i} + m_2 v_{2i} = m_1 v_{1f} + m_2 v_{2f}",
    steps: [
      "During a collision the contact forces are internal to the two-body system — Newton's third law makes them equal and opposite, so they cancel in the net.",
      "If external forces (friction, gravity along the motion) are negligible during the brief collision, ΣF_ext ≈ 0 and total dp/dt = 0.",
      "Constant total momentum: p_before = p_after. Write it out: m₁v₁ᵢ + m₂v₂ᵢ = m₁v₁f + m₂v₂f.",
      "Momentum is conserved in EVERY collision; kinetic energy only in elastic ones. That's why one equation (p) always works and the KE equation is conditional.",
    ],
  },
  "p1-torque": {
    tex: "\\tau = r F \\sin\\theta",
    steps: [
      "Experience says a doorknob far from the hinge is easier than one near it — the effectiveness of a force grows with lever arm r.",
      "Experience also says pushing along the door (through the hinge line) does nothing — only the perpendicular component turns it.",
      "Both effects multiply: τ = (r)(F sinθ) = (r sinθ)(F) — you may take the lever arm of the full force or the full arm of the perpendicular component. Same number.",
      "Equilibrium of a rigid body then requires BOTH ΣF = 0 (no translation) and Στ = 0 (no rotation) — torque balance is a separate condition from force balance.",
    ],
  },
  "p1-rot-energy": {
    tex: "K_{rot} = \\tfrac{1}{2} I \\omega^2",
    steps: [
      "A rotating body is many particles moving at once. Particle i at radius rᵢ moves with speed vᵢ = ωrᵢ (all share the same ω).",
      "Add up kinetic energies: K = Σ½mᵢvᵢ² = Σ½mᵢ(ωrᵢ)² = ½ω²Σmᵢrᵢ².",
      "The sum Σmᵢrᵢ² depends only on the mass distribution, not the speed — name it the moment of inertia I.",
      "So K_rot = ½Iω², the rotational twin of ½mv². For a solid body, replace the sum with an integral I = ∫r²dm — that's why a hoop (all mass at r = R, I = mR²) beats a disk (I = ½mR²) in a spin-up race.",
    ],
  },
  "p1-shm": {
    tex: "x(t) = A\\cos(\\omega t), \\quad \\omega = \\sqrt{k/m}",
    steps: [
      "Hooke's law F = −kx: the restoring force points opposite displacement and grows linearly with it.",
      "Newton's second law: ma = −kx → a = −(k/m)x. Acceleration is proportional to displacement and opposite to it.",
      "What function has its second derivative equal to negative itself times a constant? Sine and cosine. Try x = A cos(ωt): then a = d²x/dt² = −ω²x.",
      "Match the coefficients: ω² = k/m. The mass oscillates sinusoidally at ω = √(k/m) — stiffer springs and lighter masses oscillate faster, and amplitude appears nowhere in the period.",
    ],
  },
  "p1-buoyancy": {
    tex: "F_b = \\rho_{fluid}\\, g\\, V_{disp}",
    steps: [
      "Consider a submerged blob of fluid itself. It isn't sinking or rising — it's in equilibrium.",
      "The surrounding fluid pushes on it from all sides; pressure is larger at the bottom, so the net push is upward. This net push must exactly equal the blob's weight: F_b = m_blob g = ρ_f V g.",
      "Now swap the blob for a solid of the same shape and size. The surrounding fluid doesn't know or care — it exerts the same upward force.",
      "That's Archimedes' principle: buoyant force equals the weight of displaced fluid. Compare ρ_object to ρ_fluid to decide float, hover, or sink.",
    ],
  },
  "p1-continuity": {
    tex: "A_1 v_1 = A_2 v_2",
    steps: [
      "In an incompressible fluid, mass (and volume) can't pile up or vanish anywhere.",
      "Watch a slice of pipe for time Δt: the volume entering is A₁v₁Δt — area × how far the fluid front travels.",
      "The volume leaving the far end must be identical: A₂v₂Δt.",
      "Divide by Δt: A₁v₁ = A₂v₂. Narrow pipe → faster flow. That's why putting your thumb over a hose speeds the water up — same flow rate, smaller area.",
    ],
  },
  "p1-gravitation-orbits": {
    tex: "T^2 = \\frac{4\\pi^2}{GM} r^3",
    steps: [
      "For a circular orbit, gravity is the centripetal force: GMm/r² = mv²/r.",
      "Cancel m and solve for speed: v = √(GM/r) — closer orbits are faster.",
      "Period is circumference over speed: T = 2πr/v = 2πr/√(GM/r) = 2π√(r³/GM).",
      "Square it: T² = (4π²/GM)·r³ — Kepler's third law, derived from Newton. The constant depends only on the central body's mass, which is how astronomers weigh planets.",
    ],
  },
  // ---------------- Physics 2 ----------------
  "p2-ideal-gas": {
    tex: "PV = Nk_BT",
    steps: [
      "Model: a gas is N point molecules in a box, bouncing elastically off walls. Temperature measures average kinetic energy: ½m⟨v²⟩ = (3/2)k_BT.",
      "One molecule hitting a wall reverses its perpendicular momentum, delivering impulse 2mvₓ. Count hits per second across the wall: each contributes to an average outward force.",
      "Summing all molecules: pressure P = Nm⟨vₓ²⟩/V. With ⟨vₓ²⟩ = ⅓⟨v²⟩ (three symmetric axes), P = Nm⟨v²⟩/(3V).",
      "Substitute the temperature relation m⟨v²⟩ = 3k_BT: P = Nk_BT/V → PV = Nk_BT. Every symbol in the gas law is a story about collisions and energy.",
    ],
  },
  "p2-charge-force": {
    tex: "F = k \\frac{|q_1 q_2|}{r^2}",
    steps: [
      "Coulomb's torsion-balance experiment: the force between charges grows with each charge and falls with separation.",
      "Doubling either charge doubles the force — the dependence is proportional, F ∝ q₁q₂.",
      "Doubling the distance cuts the force to a quarter — the inverse-square pattern, same as gravity, because field lines spread over the surface of an ever-larger sphere (area ∝ r²).",
      "Insert the proportionality constant k = 1/(4πε₀) ≈ 8.99×10⁹ N·m²/C². The similarity to Newton's law F = Gm₁m₂/r² is no accident — both are inverse-square central forces; only the sign of 'like charges repel' differs from 'masses attract'.",
    ],
  },
  "p2-e-field": {
    tex: "\\vec{E} = \\frac{\\vec{F}}{q_0}",
    steps: [
      "A charge alters the space around it: any test charge placed nearby feels a force. But the force depends on the test charge's size — so it can't be the property of the location alone.",
      "Divide the force by the test charge: F/q₀. The result is independent of which test charge you brought — a property of the point itself.",
      "Define that ratio as the electric field E. Units N/C (equivalently V/m).",
      "For a point charge: E = F/q₀ = k(qq₀/r²)/q₀ = kq/r² — the field of one charge, ready to be added vectorially for collections (superposition).",
    ],
  },
  "p2-current-ohm": {
    tex: "I = \\frac{\\Delta V}{R}",
    steps: [
      "Charge drifts through a conductor because an electric field pushes it. Push harder (bigger potential difference) → more flow, linearly, in ordinary metals.",
      "Define current I = ΔQ/Δt, the rate of charge passing a cut.",
      "The material resists flow in proportion: I ∝ ΔV. The proportionality is written R = ΔV/I, giving Ohm's law I = ΔV/R.",
      "R itself comes from geometry and material: R = ρL/A — longer wire, more resistance; fatter wire, less. Ohm's law is a material behavior (ohmic), not a law of nature: light bulbs and diodes don't obey it.",
    ],
  },
  "p2-series-parallel": {
    tex: "R_{series} = \\sum R_i, \\qquad \\frac{1}{R_{parallel}} = \\sum \\frac{1}{R_i}",
    steps: [
      "Series: the same current must pass through each resistor one after another. The voltage drops add: ΔV_total = ΔV₁ + ΔV₂.",
      "Divide by the shared current I: ΔV_total/I = ΔV₁/I + ΔV₂/I → R_eq = R₁ + R₂. Series adds resistances.",
      "Parallel: every branch sees the same ΔV, and currents add: I_total = I₁ + I₂.",
      "Divide by the shared ΔV: I_total/ΔV = I₁/ΔV + I₂/ΔV → 1/R_eq = 1/R₁ + 1/R₂. Parallel resistors always make resistance SMALLER — you've opened a second lane on the highway.",
    ],
  },
  "p2-kirchhoff": {
    tex: "\\sum I_{in} = \\sum I_{out}, \\qquad \\sum \\Delta V_{loop} = 0",
    steps: [
      "Junction rule: charge cannot accumulate at a junction. Whatever flows in per second must flow out — it's charge conservation dressed as a circuit rule.",
      "Loop rule: walk any closed loop and return to the same potential. Going through a battery from − to + raises potential by EMF; crossing a resistor along the current drops it by IR.",
      "Net change must be zero, because potential is a state function — like ending a hike at your starting elevation.",
      "These two rules + Ohm's law solve ANY circuit: unknowns become variables, each junction gives an equation, each loop gives an equation.",
    ],
  },
  "p2-magnetic-force": {
    tex: "\\vec{F} = q\\vec{v} \\times \\vec{B}",
    steps: [
      "Experiment: a moving charge near a magnet feels a sideways force. Stationary charges feel nothing — the force depends on velocity.",
      "The force is zero when v is parallel to B and maximal when perpendicular — the signature of a cross product.",
      "Direction check: F = qv×B is perpendicular to BOTH v and B (right-hand rule; flip for negative charge). It can never speed the charge up or slow it down — only steer.",
      "Because F ⊥ v always, magnetic force does no work: it changes direction, not speed. Free charges in uniform B fields therefore circle with radius r = mv/(qB).",
    ],
  },
  "p2-refraction": {
    tex: "n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2",
    steps: [
      "Light slows in a medium by factor n = c/v (more optically dense → slower).",
      "A wavefront crossing the boundary at an angle has one edge entering the slow medium first — that edge lags while the other edge keeps speed, like a marching band pivoting.",
      "Geometrically, the wavefront must be continuous across the boundary. Draw the right triangles sharing the boundary: sinθ₁ = v₁Δt/λ-width and sinθ₂ = v₂Δt/λ-width.",
      "Divide and substitute v = c/n: sinθ₁/sinθ₂ = v₁/v₂ = n₂/n₁ → n₁sinθ₁ = n₂sinθ₂ (Snell's law). Light bends toward the normal when entering a slower medium.",
    ],
  },
  "p2-lenses-mirrors": {
    tex: "\\frac{1}{d_o} + \\frac{1}{d_i} = \\frac{1}{f}, \\quad m = -\\frac{d_i}{d_o}",
    steps: [
      "Take two easy object positions: at infinity, rays arrive parallel and converge at the focal point → dᵢ = f. At 2f, image forms at 2f, same size, inverted.",
      "Similar triangles through the lens give magnification m = hᵢ/hₒ = −dᵢ/dₒ (the minus sign tracks inversion).",
      "Also from similar triangles: hₒ/dₒ = −hᵢ/dᵢ + hₒ/f. Substitute hᵢ = −hₒ dᵢ/dₒ and simplify.",
      "The dₒ and dᵢ terms combine to (hₒ/f)(dₒ + dᵢ)/dₒ… canceling yields 1/dₒ + 1/dᵢ = 1/f. One equation predicts every image: real/inverted when dᵢ > 0, virtual/upright when dᵢ < 0.",
    ],
  },
  "p2-waves": {
    tex: "v = f\\lambda",
    steps: [
      "A wave repeats every wavelength λ and the pattern travels one λ per period T.",
      "Speed = distance/time = λ/T.",
      "Frequency f = 1/T, so v = fλ — the only wave equation you need, and it's just 'speed = distance per cycle × cycles per second'.",
      "When a wave crosses into a new medium, f stays fixed (the source dictates it) while v and λ change together — that's why light bends but keeps its color.",
    ],
  },
  "p2-photoelectric": {
    tex: "K_{max} = hf - \\phi",
    steps: [
      "Classical prediction: brighter light shakes electrons harder, eventually ejecting faster ones — regardless of color. Experiment says otherwise.",
      "Einstein's model: light arrives in quanta of energy E = hf. One photon interacts with one electron — an all-or-nothing transaction.",
      "The electron must first pay the material's escape cost φ (work function); whatever energy remains becomes kinetic energy.",
      "Energy ledger per electron: K_max = hf − φ. Intensity adds MORE photons (more electrons, same K_max); only frequency adds ENERGY per electron. The cutoff frequency f₀ = φ/h exists where the ledger first breaks even.",
    ],
  },
  "p2-nuclear": {
    tex: "N(t) = N_0 \\left(\\tfrac{1}{2}\\right)^{t/t_{1/2}}",
    steps: [
      "Radioactive decay is probabilistic: each nucleus has the same chance of decaying per unit time, independent of its age.",
      "Probability per time λ means the decay rate is proportional to the population still present: dN/dt = −λN.",
      "This differential equation integrates to N = N₀e^(−λt) — exponential because the rate shrinks as the population shrinks.",
      "Set N = N₀/2 and solve for t: t₁/₂ = ln2/λ. Every half-life halves whatever remains — after 3 half-lives, 1/8 is left, not zero.",
    ],
  },
  // ---------------- Physics C: Mechanics ----------------
  "cm-calculus-kin": {
    tex: "v = \\frac{dx}{dt}, \\quad a = \\frac{dv}{dt}, \\quad \\Delta x = \\int v\\,dt",
    steps: [
      "Average velocity over an interval is Δx/Δt. Shrink the interval toward zero and the average becomes the instantaneous rate: v = dx/dt — the derivative.",
      "Velocity is itself changing: a = dv/dt. Chained together, a = d²x/dt².",
      "Run it backwards: from acceleration, velocity is the accumulation of a over time — v(t) = ∫a dt + v₀. Displacement likewise accumulates velocity.",
      "Graph language: position is the SIGNED AREA under v(t); velocity is the SLOPE of x(t). Every kinematics equation for constant a is just these definitions integrated — the formulas are consequences, not starting points.",
    ],
  },
  "cm-diff-dynamics": {
    tex: "m\\frac{d^2 x}{dt^2} = F(x, v, t)",
    steps: [
      "Newton's second law with a force that varies: if F depends on position, velocity, or time, ma = F is no longer an algebra equation — it's a differential equation.",
      "Write a = d²x/dt²: m x″ = F(x, v, t). The solution isn't a number, it's a function x(t) whose second derivative matches F at every instant.",
      "Example — drag: m dv/dt = −bv. Separate variables: dv/v = −(b/m)dt. Integrate: ln v = −(b/m)t + C → v = v₀e^(−bt/m).",
      "The exponential appears whenever 'rate of change ∝ current amount' — the same mathematics as decay, RC circuits, and cooling.",
    ],
  },
  "cm-work-integral": {
    tex: "W = \\int_{x_i}^{x_f} F_x\\,dx",
    steps: [
      "For constant force, W = FΔx. For varying force, that's wrong — F changes along the way.",
      "Chop the path into small segments dx. Over each segment the force is nearly constant, so the piece of work is dW = F·dx.",
      "Sum the pieces: W = ΣF·dx → in the limit, W = ∫F dx — a definite integral, the area under the F-vs-x graph.",
      "For a spring, F = −kx, so W_by_spring = ∫₀^x (−kx')dx' = −½kx². The area under a straight line is a triangle — the integral just formalizes it.",
    ],
  },
  "cm-momentum": {
    tex: "\\vec{J} = \\int \\vec{F}\\,dt = \\Delta\\vec{p}",
    steps: [
      "With a time-varying force (every real collision), impulse FΔt is not usable — F isn't constant.",
      "Chop the collision into instants dt. Each contributes momentum change dp = F dt.",
      "Sum: Δp = ∫F dt. That integral is the impulse — the area under the F-vs-t graph.",
      "For a ball struck by a bat, you don't need to know the force's exact shape — only its area. That's why impulse questions on the exam are graph-area questions.",
    ],
  },
  "cm-rot-dynamics": {
    tex: "\\tau = I\\alpha",
    steps: [
      "Start from the translational law applied to each mass element: Fᵢ = mᵢaᵢ.",
      "Multiply both sides by rᵢ (the lever arm) to convert to rotation: τᵢ = rᵢFᵢ = mᵢrᵢaᵢ.",
      "Tangential acceleration relates to angular by aᵢ = αrᵢ (same α for the whole rigid body): τᵢ = mᵢrᵢ²α.",
      "Sum over the body: Στ = (Σmᵢrᵢ²)α = Iα. Internal torques cancel by Newton's third law, leaving the net external torque — the rotational twin of ΣF = ma.",
    ],
  },
  "cm-angular-momentum": {
    tex: "\\vec{L} = I\\vec{\\omega}, \\quad \\tau_{net} = \\frac{dL}{dt}",
    steps: [
      "By analogy with p = mv, define angular momentum L = Iω for rigid rotation.",
      "Differentiate: dL/dt = I dω/dt = Iα = τ_net (using τ = Iα from rotational dynamics).",
      "So τ_net = dL/dt — torque is the rate of change of angular momentum, exactly as force is for linear momentum.",
      "When τ_net = 0, L is constant. That's the figure skater: pulling arms in reduces I, so ω must rise to keep Iω fixed — conservation, not magic.",
    ],
  },
  // ---------------- Physics C: E&M ----------------
  "cem-gauss": {
    tex: "\\oint \\vec{E} \\cdot d\\vec{A} = \\frac{q_{enc}}{\\varepsilon_0}",
    steps: [
      "Field lines begin on positive charge and end on negative. Count lines crossing a closed surface outward: each charge inside sends lines through; charges outside send lines in one side and out the other — net zero.",
      "The count of lines per unit area is proportional to |E|, so the surface integral of E·dA — the flux — counts the enclosed charge (divided by a constant).",
      "That's Gauss's law. Its power comes from symmetry: when E is constant over a chosen surface and parallel to dA, the integral collapses to E·A.",
      "Sphere around a point charge: E(4πr²) = q/ε₀ → E = kq/r². Coulomb's law falls OUT of Gauss's law — symmetry + flux is often faster than integration.",
    ],
  },
  "cem-potential": {
    tex: "\\Delta V = -\\int \\vec{E} \\cdot d\\vec{r}",
    steps: [
      "Electric force is conservative, so it has a potential energy; per unit charge, that's potential V.",
      "Potential difference is work per charge to move a test charge from a to b: ΔV = W/q₀ with W = ∫F·dr.",
      "Substitute F = q₀E: ΔV = ∫E·dr. The minus sign appears because potential decreases along the field's direction — positive charges 'fall' from high V to low V.",
      "For a point charge, integrate E = kq/r² from ∞ to r: V = kq/r. Equipotential surfaces ⊥ E everywhere — no work is done moving along one.",
    ],
  },
  "cem-capacitors": {
    tex: "C = \\frac{Q}{\\Delta V}, \\quad C = \\frac{\\kappa\\varepsilon_0 A}{d}",
    steps: [
      "Put charge Q on two plates: +Q and −Q. The charge creates a field between the plates, and the field integrates to a potential difference.",
      "Doubling Q doubles E (linear superposition) and therefore doubles ΔV. The ratio Q/ΔV is a constant — name it capacitance, a purely geometric/material property.",
      "Parallel plates: each plate makes E = σ/(2ε₀); between plates they add: E = σ/ε₀ = Q/(ε₀A).",
      "Constant E over gap d gives ΔV = Ed = Qd/(ε₀A). So C = Q/ΔV = ε₀A/d — bigger plates and smaller gaps store more charge per volt. Insert a dielectric (κ) and every E and ΔV shrink by κ, so C grows by κ.",
    ],
  },
  "cem-rc": {
    tex: "q(t) = Q_f\\left(1 - e^{-t/RC}\\right)",
    steps: [
      "Kirchhoff's loop while charging: EMF − iR − q/C = 0, with i = dq/dt.",
      "Rearrange into a differential equation: R dq/dt = EMF − q/C. The rate of charging shrinks as q grows — 'rate ∝ amount remaining' again.",
      "The steady state is q_f = C·EMF. Measure deviation from it: let u = q_f − q, then du/dt = −u/(RC).",
      "Solve: u = u₀e^(−t/RC) → q(t) = Q_f(1 − e^(−t/RC)). The capacitor approaches full charge asymptotically; the time constant τ = RC sets the clock.",
    ],
  },
  "cem-induction": {
    tex: "\\varepsilon = -\\frac{d\\Phi_B}{dt}",
    steps: [
      "Faraday's experiment: a changing magnetic field through a coil drives a current — even with no battery. Something must be pushing: an induced EMF.",
      "Define magnetic flux Φ_B = ∫B·dA — the amount of field threading the loop. EMF turns out to depend on the RATE of change of flux: ε = −dΦ_B/dt.",
      "Flux can change three ways: B changes, area changes (sliding rail), or orientation changes (rotating generator). All three give EMF — same law, three mechanisms.",
      "Lenz's minus sign: the induced current opposes the change making it, because otherwise energy would be created from nothing. Push a magnet toward a coil and the coil pushes back.",
    ],
  },
};
