import { useRef, useState } from "react";
import { useCanvasLoop, SimFrame, SimRow, Slider, Toggle, arrow, grid, ball } from "./framework";
import { SimShell } from "./SimShell";

// ---------------------------------------------------------------------------
// Shared clock: real dt with pause support. Each sim integrates its own state;
// pausing stops the physics but the canvas keeps rendering the frozen state.
// ---------------------------------------------------------------------------
function useClock() {
  const t = useRef(0);
  const last = useRef(0);
  return (now: number, running: boolean) => {
    if (!last.current) last.current = now;
    const dt = Math.min((now - last.current) / 1000, 0.05);
    last.current = now;
    if (running) t.current += dt;
    return { t: t.current, dt: running ? dt : 0 };
  };
}

// ===================== GAS PARTICLES =====================
export function GasSim() {
  const [temp, setTemp] = useState(300);
  const [volFrac, setVolFrac] = useState(1);
  const [nParticles, setNParticles] = useState(60);
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const partsRef = useRef(
    Array.from({ length: 120 }, () => ({ x: Math.random() * 0.9, y: Math.random(), vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 })),
  );
  const pressAcc = useRef({ collisions: 0, time: 0 });
  const [pressure, setPressure] = useState(0);
  const clock = useClock();
  const reset = () => {
    partsRef.current = Array.from({ length: 120 }, () => ({ x: Math.random() * 0.9, y: Math.random(), vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 }));
    pressAcc.current = { collisions: 0, time: 0 };
    setPressure(0);
    setTick((n) => n + 1);
  };

  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const { dt } = clock(performance.now(), running);
    // keep the population in sync with the N slider (adds/removes at edges)
    const parts = partsRef.current;
    while (parts.length > nParticles) parts.pop();
    while (parts.length < nParticles) parts.push({ x: Math.random() * 0.5, y: Math.random(), vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 });

    const speedScale = Math.sqrt(temp / 300);
    const wallX = w * 0.15 + (w * 0.75) * volFrac;
    let wallHits = 0;
    if (dt > 0) {
      parts.forEach((p) => {
        const speed = 1.4 * speedScale;
        const mag = Math.hypot(p.vx, p.vy) || 1;
        p.vx = (p.vx / mag) * speed; p.vy = (p.vy / mag) * speed;
        p.x += (p.vx * dt) / (w * 0.01);
        p.y += (p.vy * dt) / (h * 0.01);
        if (p.x < 0.02) { p.x = 0.02; p.vx = Math.abs(p.vx); wallHits++; }
        if (p.x > wallX / w - 0.02) { p.x = wallX / w - 0.02; p.vx = -Math.abs(p.vx); wallHits++; }
        if (p.y < 0.04) { p.y = 0.04; p.vy = Math.abs(p.vy); wallHits++; }
        if (p.y > 0.94) { p.y = 0.94; p.vy = -Math.abs(p.vy); wallHits++; }
      });
      pressAcc.current.collisions += wallHits;
      pressAcc.current.time += dt;
      if (pressAcc.current.time > 0.5) {
        // Normalize by wall area so compressing the gas honestly raises P
        const wallArea = ((wallX - w * 0.15) / w) * 0.85;
        const rate = pressAcc.current.collisions / pressAcc.current.time;
        const p = (rate / Math.max(0.15, wallArea)) * 0.12;
        setPressure(Math.round(p * 10) / 10);
        pressAcc.current = { collisions: 0, time: 0 };
      }
    }
    // container + piston
    ctx.strokeStyle = muted; ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.15, h * 0.1, wallX - w * 0.15, h * 0.85);
    ctx.fillStyle = "#7c6cf4";
    ctx.beginPath(); ctx.roundRect(wallX - 6, h * 0.1, 12, h * 0.85, 6); ctx.fill();
    // particles colored by temperature
    parts.forEach((p) => {
      const px = w * 0.15 + p.x * (wallX - w * 0.15);
      const py = h * 0.1 + p.y * h * 0.85;
      ball(ctx, px, py, 4, temp > 450 ? "#ff8fb1" : temp > 250 ? "#ffc46b" : "#8fb8f7");
    });
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`T = ${temp} K   V = ${(volFrac * 100).toFixed(0)}%   N = ${nParticles}   P ≈ ${pressure} (collision rate ÷ wall area)`, 12, 20);
    ctx.fillStyle = muted; ctx.font = "11px system-ui";
    ctx.fillText("Temperature = average kinetic energy; pressure = drumbeat of wall collisions.", 12, h - 10);
  }, { running, resetKey: tick });

  return (
    <div>
      <SimFrame height={320}><canvas ref={ref} className="h-full w-full touch-none" /></SimFrame>
      <SimRow>
        <Slider label="Temperature" value={temp} min={100} max={900} onChange={setTemp} format={(v) => `${v} K`} />
        <Slider label="Volume" value={volFrac} min={0.35} max={1} onChange={setVolFrac} format={(v) => `${(v * 100).toFixed(0)}%`} />
        <Slider label="Particles N" value={nParticles} min={20} max={120} onChange={setNParticles} />
      </SimRow>
      <SimShell
        running={running}
        onPlayPause={() => setRunning((r) => !r)}
        onReset={reset}
        physics={{
          what: "A particle box with a movable piston. Each particle bounces elastically; pressure is measured from actual wall collisions per second per unit wall area — not scripted.",
          equations: [
            { tex: "P V = N k_B T" },
            { tex: "\\bar{K} = \\tfrac{3}{2} k_B T", note: "temperature IS average kinetic energy" },
            { tex: "P = \\frac{F_{\\text{avg}}}{A} \\;\\propto\\; \\frac{\\text{collision rate} \\times p}{\\text{wall area}}" },
          ],
          variables: [
            { sym: "T", meaning: "temperature", unit: "K" },
            { sym: "V", meaning: "volume (piston position)", unit: "% of box" },
            { sym: "N", meaning: "number of particles", unit: "—" },
            { sym: "P", meaning: "pressure", unit: "collision-rate units" },
          ],
          why: "Faster particles hit the wall harder AND more often (two effects, both scaling with √T). Squeezing the box shortens each particle's trip between walls, raising the collision rate — the microscopic meaning of Boyle's law.",
          tryThis: "Hold T fixed and cut the volume to 50%: pressure roughly doubles. Then restore volume and double the temperature instead — pressure also doubles, by a different mechanism (harder hits + more frequent hits).",
        }}
        prediction={{
          question: "Hold V fixed and double T from 300 K to 600 K. The pressure will…",
          options: ["Stay the same", "Double", "Quadruple", "Drop"],
          correct: 1,
          explain: "Particle speed scales with √T, so each hit is √2 harder and particles return to the wall √2 sooner — the product is 2× the collision momentum rate. Watch the readout settle near 2× its old value.",
          runLabel: "Run and watch the gauge",
        }}
      />
    </div>
  );
}

// ===================== CHARGES & FIELDS =====================
interface Ch { x: number; y: number; q: number; }
export function ChargesSim() {
  const [charges, setCharges] = useState<Ch[]>([{ x: 0.3, y: 0.5, q: 1 }, { x: 0.7, y: 0.5, q: -1 }]);
  const [showLines, setShowLines] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [drag, setDrag] = useState<number | null>(null);
  const reset = () => setCharges([{ x: 0.3, y: 0.5, q: 1 }, { x: 0.7, y: 0.5, q: -1 }]);

  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    grid(ctx, w, h);
    const k = 4000;
    // vector field grid
    if (showVectors) {
      const step = 26;
      for (let gx = step / 2; gx < w; gx += step) {
        for (let gy = step / 2; gy < h; gy += step) {
          let ex = 0, ey = 0;
          charges.forEach((c) => {
            const dx = gx - c.x * w, dy = gy - c.y * h;
            const r2 = dx * dx + dy * dy + 200;
            const e = (k * c.q) / r2;
            ex += e * (dx / Math.sqrt(r2)); ey += e * (dy / Math.sqrt(r2));
          });
          const m = Math.hypot(ex, ey);
          if (m < 2) continue;
          const L = Math.min(step * 0.9, 8 + Math.log(m) * 2.4);
          arrow(ctx, gx, gy, gx + (ex / m) * L, gy + (ey / m) * L, "rgba(124,108,244,0.5)", 1.5, 4);
        }
      }
    }
    // field lines seeded from positive charges
    if (showLines) {
      charges.filter((c) => c.q > 0).forEach((c) => {
        for (let s = 0; s < 16; s++) {
          const ang = (s / 16) * Math.PI * 2;
          let px = c.x * w + Math.cos(ang) * 12, py = c.y * h + Math.sin(ang) * 12;
          ctx.strokeStyle = "rgba(255,143,177,0.6)"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(px, py);
          for (let i = 0; i < 140; i++) {
            let ex = 0, ey = 0;
            charges.forEach((c2) => {
              const dx = px - c2.x * w, dy = py - c2.y * h;
              const r2 = dx * dx + dy * dy + 100;
              const e = (k * c2.q) / r2;
              ex += e * (dx / Math.sqrt(r2)); ey += e * (dy / Math.sqrt(r2));
            });
            const m = Math.hypot(ex, ey);
            if (m < 1e-6) break;
            px += (ex / m) * 4; py += (ey / m) * 4;
            if (px < 0 || px > w || py < 0 || py > h) break;
            if (i % 5 === 0) ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
      });
    }
    // charges
    charges.forEach((c) => {
      const cx = c.x * w, cy = c.y * h;
      ball(ctx, cx, cy, 15, c.q > 0 ? "#ff8fb1" : "#8fb8f7");
      ctx.fillStyle = "#fff"; ctx.font = "bold 14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(c.q > 0 ? "+" : "−", cx, cy + 5);
      ctx.textAlign = "left";
    });
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText("Drag charges. Pink = positive, blue = negative. Field updates instantly — superposition, computed live.", 12, 18);
  });
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width, y = (e.clientY - rect.top) / rect.height;
    const idx = charges.findIndex((c) => Math.hypot((c.x - x) * rect.width, (c.y - y) * rect.height) < 24);
    if (idx >= 0) {
      setDrag(idx);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drag === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / rect.height));
    setCharges((cs) => cs.map((c, i) => (i === drag ? { ...c, x, y } : c)));
  };
  return (
    <div>
      <SimFrame height={340}>
        <canvas ref={ref} className="h-full w-full touch-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)} />
      </SimFrame>
      <SimRow>
        <button className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" onClick={() => setCharges((cs) => [...cs, { x: 0.5, y: 0.3, q: cs.length % 2 === 0 ? 1 : -1 }])}>+ Add charge</button>
        <button className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" onClick={() => setCharges((cs) => (cs.length > 1 ? cs.slice(0, -1) : cs))}>− Remove</button>
        <Toggle label="Field lines" on={showLines} onChange={setShowLines} />
        <Toggle label="Field vectors" on={showVectors} onChange={setShowVectors} />
      </SimRow>
      <SimShell
        showControls={false}
        running
        onPlayPause={() => {}}
        onReset={reset}
        physics={{
          what: "A live vector field: at every point, the field is the vector sum of each charge's contribution (superposition). Field lines trace the direction a positive test charge would drift.",
          equations: [
            { tex: "\\vec{E} = \\sum_i \\frac{k q_i}{r_i^2}\\,\\hat{r}_i" },
            { tex: "\\vec{F} = q\\vec{E}", note: "force on a test charge" },
          ],
          variables: [
            { sym: "q", meaning: "source charge", unit: "C" },
            { sym: "r", meaning: "distance from charge", unit: "m" },
            { sym: "E", meaning: "field strength (arrow length)", unit: "N/C" },
          ],
          why: "Fields let charges push without touching: each charge fills space with E, and any charge placed in that space feels F = qE. Superposition means you never solve 'interactions' — you just add vectors.",
          tryThis: "Put a + and a − close together (a dipole) and watch lines arc from + to −. Then drop two +'s near each other: the midpoint field cancels — vectors, not scalars.",
        }}
        prediction={{
          question: "Two equal positive charges sit apart. At the exact midpoint, the field is…",
          options: ["Twice one charge's field", "Zero", "Half", "Infinite"],
          correct: 1,
          explain: "Each charge pushes a test charge in opposite directions with equal strength — the vector sum is zero. But the POTENTIAL is nonzero there (potentials add as scalars). Drag the charges and watch the arrows cancel at center.",
          runLabel: "Watch the midpoint",
        }}
      />
    </div>
  );
}

// ===================== MAGNETISM =====================
export function MagnetismSim() {
  const [mode, setMode] = useState<"wire" | "loop" | "charge">("wire");
  const [I, setI] = useState(5);
  const [v, setV] = useState(0.5);
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const phaseRef = useRef(0);
  const posRef = useRef(0.3);
  const clock = useClock();
  const reset = () => { phaseRef.current = 0; posRef.current = 0.3; setTick((n) => n + 1); };

  const ref = useCanvasLoop(({ ctx, w, h, t, fg, muted }) => {
    grid(ctx, w, h);
    const cx = w / 2, cy = h / 2;
    if (mode === "wire") {
      ctx.strokeStyle = "#ffc46b"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(cx, 10); ctx.lineTo(cx, h - 10); ctx.stroke();
      arrow(ctx, cx, h - 10, cx, 10, "#ffc46b", 5, 10);
      const rings = 5;
      for (let ring = 1; ring <= rings; ring++) {
        const r = ring * 34;
        ctx.strokeStyle = `rgba(124,108,244,${0.7 - ring * 0.12})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        const n = 8;
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * Math.PI * 2 + t * (I > 0 ? 0.6 : -0.6) * Math.min(2, Math.abs(I) / 3);
          const ax = cx + r * Math.cos(ang), ay = cy + r * Math.sin(ang);
          const ta = ang + Math.PI / 2;
          arrow(ctx, ax, ay, ax + Math.cos(ta) * 8, ay + Math.sin(ta) * 8, `rgba(124,108,244,${0.8 - ring * 0.12})`, 1.5, 5);
        }
      }
      ctx.fillStyle = fg; ctx.font = "12px system-ui";
      ctx.fillText(`I = ${I} A upward → field circles CCW (right-hand grip rule)`, 12, 20);
      ctx.fillText("B = μ₀I/(2πr) — ring spacing grows with r: the field weakens as 1/r", 12, 38);
    } else if (mode === "loop") {
      const R = h * 0.3;
      ctx.strokeStyle = "#ffc46b"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.35, R, 0, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + t * 0.8;
        const lx = cx + R * 0.35 * Math.cos(ang), ly = cy + R * Math.sin(ang);
        arrow(ctx, lx, ly, lx + 8 * Math.cos(ang + Math.PI / 2), ly + 4 * Math.sin(ang + Math.PI / 2), "#ffc46b", 2, 6);
      }
      ctx.strokeStyle = "rgba(124,108,244,0.7)"; ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(cx - w * 0.4, cy); ctx.lineTo(cx + w * 0.4, cy); ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < 3; i++) {
        const x = cx - w * 0.3 + (i * w * 0.3);
        arrow(ctx, x, cy, x + 12, cy, "#8b7bff", 2, 6);
      }
      ctx.fillStyle = fg; ctx.font = "12px system-ui";
      ctx.fillText("Current loop = magnetic dipole. Field goes through the loop and wraps around.", 12, 20);
    } else {
      // charge circling in B (into page ⊗) — radius follows r = mv/(qB)
      const B = 2;
      posRef.current += v * 0.004;
      const R = Math.max(20, (v * 220) / B);
      const om = (v * 140) / R;
      phaseRef.current += om * 0.02;
      ctx.fillStyle = "rgba(128,120,160,0.5)";
      ctx.font = "12px system-ui";
      for (let gx = 20; gx < w; gx += 46) for (let gy = 24; gy < h; gy += 46) ctx.fillText("✕", gx, gy);
      const cxx = w * 0.4, cyy = h * 0.5;
      ctx.strokeStyle = "rgba(124,108,244,0.5)"; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(cxx, cyy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      const px = cxx + R * Math.cos(phaseRef.current), py = cyy + R * Math.sin(phaseRef.current);
      ball(ctx, px, py, 9, "#ff8fb1");
      const vt = 40;
      arrow(ctx, px, py, px - Math.sin(phaseRef.current) * vt, py + Math.cos(phaseRef.current) * vt, "#8fb8f7", 2);
      ctx.fillStyle = fg;
      ctx.fillText("B into page (✕). Positive charge circles with r = mv/(qB).", 12, 20);
      ctx.fillText(`v = ${v.toFixed(1)} → r = mv/(qB) grows linearly with v`, 12, 38);
    }
  }, { running, resetKey: tick });

  return (
    <div>
      <SimFrame height={320}><canvas ref={ref} className="h-full w-full touch-none" /></SimFrame>
      <SimRow>
        <div className="flex gap-2">
          {(["wire", "loop", "charge"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" style={mode === m ? { background: "var(--clay-primary-tint)", color: "var(--clay-primary-deep)" } : undefined}>{m}</button>
          ))}
        </div>
        <Slider label={mode === "charge" ? "Speed v" : "Current I"} value={mode === "charge" ? v : I} min={mode === "charge" ? 0.1 : 1} max={mode === "charge" ? 1.5 : 10} step={0.1} onChange={(nv) => (mode === "charge" ? setV(nv) : setI(nv))} />
      </SimRow>
      <SimShell
        running={running}
        onPlayPause={() => setRunning((r) => !r)}
        onReset={reset}
        physics={{
          what: "Three magnetic-field sources. A current makes circles of field around itself (grip rule); a loop concentrates that field through its center; a charge crossing a field is bent into a circle by F = qv×B.",
          equations: [
            { tex: "B_{\\text{wire}} = \\frac{\\mu_0 I}{2\\pi r}" },
            { tex: "F = qvB\\sin\\theta", note: "force on a moving charge" },
            { tex: "r = \\frac{mv}{qB}", note: "circling charge radius" },
          ],
          variables: [
            { sym: "I", meaning: "current", unit: "A" },
            { sym: "B", meaning: "magnetic field", unit: "T" },
            { sym: "r", meaning: "orbit radius / distance from wire", unit: "m" },
          ],
          why: "Magnetic forces are always perpendicular to velocity — they steer but never speed up a charge. Perpendicular force with constant speed is exactly uniform circular motion, which is why the charge orbits instead of flying off.",
          tryThis: "In charge mode, double v: the radius doubles (r ∝ v) but the time per lap ALSO doubles — the circle period is independent of speed: T = 2πm/(qB). That's how cyclotrons and mass spectrometers work.",
        }}
        prediction={{
          question: "If the charge's speed doubles (same B), its orbit radius…",
          options: ["Halves", "Doubles", "Quadruples", "Is unchanged"],
          correct: 1,
          explain: "r = mv/(qB) is proportional to v. Slide the speed slider and watch the dashed circle expand in exact proportion.",
          runLabel: "Run and slide v",
        }}
      />
    </div>
  );
}

// ===================== RC CIRCUIT =====================
export function RCSim() {
  const [V0, setV0] = useState(12);
  const [R, setR] = useState(10); // kΩ
  const [C, setC] = useState(100); // µF
  const [charging, setCharging] = useState(true);
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const tRef = useRef(0);
  const traceRef = useRef<number[]>([]);
  const startRef = useRef(charging);
  const paramsRef = useRef({ V0, R, C });
  // changing components mid-flight changes τ going forward — keep the trace honest
  if (paramsRef.current.V0 !== V0 || paramsRef.current.R !== R || paramsRef.current.C !== C) {
    paramsRef.current = { V0, R, C };
    traceRef.current = [];
    tRef.current = 0;
    startRef.current = charging;
  }
  const clock = useClock();
  const reset = () => { tRef.current = 0; traceRef.current = []; startRef.current = charging; setTick((n) => n + 1); };

  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const { dt } = clock(performance.now(), running);
    if (startRef.current !== charging) { startRef.current = charging; tRef.current = 0; traceRef.current = []; }
    tRef.current += dt;
    const tau = R * 1e3 * C * 1e-6; // seconds
    const t = tRef.current;
    // exact exponential solution of the RC differential equation
    const qFrac = charging ? 1 - Math.exp(-t / tau) : Math.exp(-t / tau);
    const iA = ((V0 / (R * 1e3)) * Math.exp(-t / tau)) * 1e6; // µA
    if (dt > 0) {
      traceRef.current.push(qFrac);
      if (traceRef.current.length > 300) traceRef.current.shift();
    }
    // circuit drawing
    const bx = w * 0.1, by = h * 0.25, cw = w * 0.4, ch = h * 0.5;
    ctx.strokeStyle = muted; ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, cw, ch);
    // battery gap on top
    ctx.clearRect(bx + cw * 0.42, by - 6, cw * 0.16, 12);
    ctx.strokeStyle = muted;
    ctx.beginPath(); ctx.moveTo(bx + cw * 0.42, by); ctx.lineTo(bx + cw * 0.58, by); ctx.stroke();
    ctx.fillStyle = fg;
    ctx.fillRect(bx + cw * 0.47 - 2, by - 12, 4, 24);
    ctx.fillRect(bx + cw * 0.53 - 1, by - 7, 2, 14);
    // capacitor on right
    ctx.clearRect(bx + cw - 8, by + ch * 0.42, 16, ch * 0.16);
    ctx.strokeStyle = muted;
    ctx.beginPath();
    ctx.moveTo(bx + cw, by + ch * 0.42); ctx.lineTo(bx + cw, by + ch * 0.48);
    ctx.moveTo(bx + cw, by + ch * 0.52); ctx.lineTo(bx + cw, by + ch * 0.58);
    ctx.stroke();
    ctx.fillStyle = fg;
    ctx.fillRect(bx + cw - 9, by + ch * 0.46, 18, 3);
    ctx.fillRect(bx + cw - 9, by + ch * 0.54, 18, 3);
    // resistor bottom
    ctx.strokeStyle = "#ffc46b"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(bx + cw * 0.4, by + ch); ctx.lineTo(bx + cw * 0.6, by + ch); ctx.stroke();
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`${V0} V`, bx + cw * 0.3, by - 8);
    ctx.fillText("C", bx + cw + 14, by + ch * 0.5 + 4);
    ctx.fillText(`${R} kΩ`, bx + cw * 0.42, by + ch + 18);
    // meter readouts — honest units
    const vCap = V0 * qFrac;
    const vRes = charging ? V0 * Math.exp(-t / tau) : -V0 * Math.exp(-t / tau);
    ctx.fillText(`q = ${(qFrac * 100).toFixed(1)}% · V_C = ${vCap.toFixed(2)} V · V_R = ${(charging ? vRes : vRes).toFixed(2)} V`, 12, 20);
    ctx.fillText(`i = ${iA.toFixed(1)} µA   τ = RC = ${tau.toFixed(2)} s   t = ${t.toFixed(2)} s`, 12, 38);
    // q(t) graph
    const gx = w * 0.55, gy = h * 0.14, gw = w * 0.4, gh = h * 0.72;
    ctx.strokeStyle = muted; ctx.lineWidth = 1; ctx.strokeRect(gx, gy, gw, gh);
    // 63% guideline
    ctx.strokeStyle = "rgba(255,196,107,0.5)"; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(gx, gy + gh * 0.37); ctx.lineTo(gx + gw, gy + gh * 0.37); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffc46b"; ctx.font = "10px system-ui";
    ctx.fillText("63%", gx + 4, gy + gh * 0.37 - 3);
    ctx.strokeStyle = "#7c6cf4"; ctx.lineWidth = 2; ctx.beginPath();
    traceRef.current.forEach((v2, idx) => {
      const X = gx + (idx / 299) * gw;
      const Y = gy + gh - v2 * gh;
      if (idx === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    });
    ctx.stroke();
    ctx.fillStyle = muted; ctx.font = "10px system-ui";
    ctx.fillText("q(t)", gx + 4, gy + 12);
    ctx.fillText("t", gx + gw - 8, gy + gh + 12);
  }, { running, resetKey: tick });

  return (
    <div>
      <SimFrame height={320}><canvas ref={ref} className="h-full w-full touch-none" /></SimFrame>
      <SimRow>
        <Slider label="EMF" value={V0} min={2} max={24} onChange={setV0} format={(v) => `${v} V`} />
        <Slider label="R" value={R} min={1} max={50} onChange={setR} format={(v) => `${v} kΩ`} />
        <Slider label="C" value={C} min={10} max={500} onChange={setC} format={(v) => `${v} µF`} />
        <div className="flex gap-2">
          <button onClick={() => setCharging(true)} className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" style={charging ? { background: "var(--clay-primary-tint)", color: "var(--clay-primary-deep)" } : undefined}>Charge</button>
          <button onClick={() => setCharging(false)} className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" style={!charging ? { background: "var(--clay-primary-tint)", color: "var(--clay-primary-deep)" } : undefined}>Discharge</button>
        </div>
      </SimRow>
      <SimShell
        running={running}
        onPlayPause={() => setRunning((r) => !r)}
        onReset={reset}
        physics={{
          what: "A capacitor charging through a resistor. The capacitor voltage opposes the battery, so as V_C climbs, the resistor voltage — and the current — decay exponentially.",
          equations: [
            { tex: "q(t) = Q_{\\max}\\left(1 - e^{-t/\\tau}\\right)", note: "charging" },
            { tex: "i(t) = \\frac{\\mathcal{E}}{R} e^{-t/\\tau}", note: "current decays from I₀ = ε/R" },
            { tex: "\\tau = RC" },
          ],
          variables: [
            { sym: "\\tau", meaning: "time constant", unit: "s" },
            { sym: "V_C", meaning: "capacitor voltage", unit: "V" },
            { sym: "i", meaning: "circuit current", unit: "µA" },
          ],
          why: "Kirchhoff's loop rule gives ε = iR + q/C — a differential equation whose solution is exponential. At t = τ the capacitor holds 63%; after 5τ it's effectively full and current stops.",
          tryThis: "At t = 0 the full battery voltage appears across R: check i₀ = ε/R. Then set R = 50 kΩ: the curve stretches by exactly 5×. R and C enter only through their product — τ doesn't care which one you change.",
        }}
        prediction={{
          question: "The capacitor is fully charged. You now increase R. The current at that instant…",
          options: ["Increases", "Stays at zero (capacitor is full)", "Drops", "Reverses"],
          correct: 1,
          explain: "A full capacitor blocks steady current no matter what R is — V_C = ε means V_R = 0. R only controls how FAST things change (τ), not the final state. Discharge to see current flow again.",
          runLabel: "Verify it",
        }}
      />
    </div>
  );
}

// ===================== CIRCUIT BUILDER =====================
interface Comp { id: number; type: "battery" | "resistor" | "bulb" | "capacitor"; x: number; y: number; value: number; }
export function CircuitBuilderSim() {
  const [comps, setComps] = useState<Comp[]>([
    { id: 1, type: "battery", x: 0.25, y: 0.75, value: 10 },
    { id: 2, type: "resistor", x: 0.55, y: 0.3, value: 5 },
    { id: 3, type: "bulb", x: 0.55, y: 0.75, value: 5 },
  ]);
  const [dragId, setDragId] = useState<number | null>(null);
  const [sel, setSel] = useState<number | null>(2);
  const tRef = useRef(0);
  const rcStart = useRef(0);
  const lastTRef = useRef(performance.now());
  const capRef = useRef<Comp | null>(null);
  const circuitKey = comps.map((c) => `${c.id}:${c.value}`).join("|");
  const paramsRef = useRef(circuitKey);
  if (paramsRef.current !== circuitKey) {
    paramsRef.current = circuitKey;
    rcStart.current = tRef.current; // any circuit change restarts the RC transient
  }

  const totalR = comps.filter((c) => c.type === "resistor" || c.type === "bulb").reduce((s, c) => s + c.value, 0);
  const batV = comps.find((c) => c.type === "battery")?.value ?? 0;
  const cap = comps.find((c) => c.type === "capacitor") ?? null;
  capRef.current = cap;
  const tau = cap ? Math.max(0.05, totalR * cap.value * 1e-6 * 1000) : 0; // visual time constant (s)
  // steady state: a capacitor in series fully charges → current stops
  const i0 = totalR > 0 ? batV / totalR : 0;
  const iNow = cap ? i0 * Math.exp(-(tRef.current - rcStart.current) / tau) : i0;
  const vc = cap ? batV * (1 - Math.exp(-(tRef.current - rcStart.current) / tau)) : 0;

  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const now = performance.now();
    tRef.current += Math.min((now - lastTRef.current) / 1000, 0.05);
    lastTRef.current = now;
    // wires: series loop connecting all comps in order
    ctx.strokeStyle = muted; ctx.lineWidth = 2.5;
    const pts = comps.map((c) => ({ x: c.x * w, y: c.y * h }));
    if (pts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[0].x, pts[0].y);
      ctx.stroke();
    }
    // current dots — speed and brightness track the REAL computed current
    if (iNow > 1e-4 && pts.length > 1) {
      const speed = Math.min(0.5, (iNow / Math.max(0.5, i0)) * 0.4);
      for (let d = 0; d < 10; d++) {
        const prog = ((tRef.current * speed) + d / 10) % 1;
        const seg = Math.min(Math.floor(prog * pts.length), pts.length - 2);
        const f = prog * pts.length - seg;
        const X = pts[seg].x + (pts[seg + 1].x - pts[seg].x) * f;
        const Y = pts[seg].y + (pts[seg + 1].y - pts[seg].y) * f;
        ball(ctx, X, Y, 3.5, iNow > i0 * 0.6 ? "#8fb8f7" : "#b9b3d4");
      }
    }
    // components with live meters
    comps.forEach((c) => {
      const x = c.x * w, y = c.y * h;
      const isSel = sel === c.id;
      ctx.save();
      if (isSel) { ctx.shadowColor = "#7c6cf4"; ctx.shadowBlur = 14; }
      if (c.type === "battery") {
        ctx.fillStyle = fg;
        ctx.fillRect(x - 12, y - 3, 24, 6);
        ctx.fillRect(x - 4, y - 12, 8, 24);
        ctx.fillStyle = muted; ctx.font = "11px system-ui"; ctx.textAlign = "center";
        ctx.fillText(`${c.value} V`, x, y - 20); ctx.textAlign = "left";
      } else if (c.type === "resistor") {
        ctx.fillStyle = "#ffc46b";
        ctx.beginPath(); ctx.roundRect(x - 18, y - 9, 36, 18, 6); ctx.fill();
        ctx.fillStyle = "#4d3a1a"; ctx.font = "bold 10px system-ui"; ctx.textAlign = "center";
        ctx.fillText(`${c.value}Ω`, x, y + 4); ctx.textAlign = "left";
      } else if (c.type === "bulb") {
        // brightness follows P = I²R
        const p = iNow * iNow * c.value;
        const bright = Math.min(1, p / 4);
        ball(ctx, x, y, 12, bright > 0.05 ? `rgba(255,${Math.round(180 + 60 * bright)},${Math.round(120 + 40 * bright)},1)` : "#c9c3dd");
        ctx.strokeStyle = muted; ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = muted; ctx.font = "10px system-ui"; ctx.textAlign = "center";
        ctx.fillText(`${(iNow * c.value).toFixed(1)} V`, x, y + 30); ctx.textAlign = "left";
      } else {
        ctx.fillStyle = fg;
        ctx.fillRect(x - 14, y - 8, 28, 4);
        ctx.fillRect(x - 14, y + 4, 28, 4);
        ctx.fillStyle = muted; ctx.font = "10px system-ui"; ctx.textAlign = "center";
        ctx.fillText(`V_C = ${vc.toFixed(1)} V`, x, y + 26); ctx.textAlign = "left";
      }
      ctx.restore();
    });
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    const summary = cap
      ? `RC transient: I = ${((iNow * 1000) || 0).toFixed(1)} mA → 0, τ = R_eqC = ${tau.toFixed(1)} s`
      : `Series loop: R_eq = ${totalR.toFixed(1)} Ω, I = ${iNow.toFixed(2)} A, P = ${(batV * iNow).toFixed(1)} W`;
    ctx.fillText(summary, 12, 18);
    ctx.fillStyle = muted; ctx.font = "11px system-ui";
    ctx.fillText(`Kirchhoff loop: ${batV.toFixed(0)} V − ${totalR > 0 ? (iNow * totalR).toFixed(1) : "0"} V (resistors)${cap ? ` − ${vc.toFixed(1)} V (capacitor)` : ""} = 0 ✓`, 12, 36);
  });
  return (
    <div>
      <SimFrame height={340}>
        <canvas
          ref={ref}
          className="h-full w-full touch-none"
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width, y = (e.clientY - rect.top) / rect.height;
            const hit = comps.find((c) => Math.hypot((c.x - x) * rect.width, (c.y - y) * rect.height) < 30);
            if (hit) { setDragId(hit.id); setSel(hit.id); e.currentTarget.setPointerCapture(e.pointerId); }
          }}
          onPointerMove={(e) => {
            if (dragId === null) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = Math.max(0.08, Math.min(0.92, (e.clientX - rect.left) / rect.width));
            const y = Math.max(0.12, Math.min(0.88, (e.clientY - rect.top) / rect.height));
            setComps((cs) => cs.map((c) => (c.id === dragId ? { ...c, x, y } : c)));
          }}
          onPointerUp={() => setDragId(null)}
          onPointerCancel={() => setDragId(null)}
        />
      </SimFrame>
      <SimRow>
        <button className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" onClick={() => setComps((cs) => [...cs, { id: Date.now(), type: "resistor", x: 0.3 + Math.random() * 0.4, y: 0.25, value: 2 + Math.floor(Math.random() * 9) }])}>+ Resistor</button>
        <button className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" onClick={() => setComps((cs) => [...cs, { id: Date.now(), type: "bulb", x: 0.3 + Math.random() * 0.4, y: 0.25, value: 5 }])}>+ Bulb</button>
        <button className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" onClick={() => setComps((cs) => (capRef.current ? cs : [...cs, { id: Date.now(), type: "capacitor", x: 0.3 + Math.random() * 0.4, y: 0.25, value: 100 }]))}>+ Capacitor</button>
        {sel !== null && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Selected:</span>
            <input
              type="range"
              min={1}
              max={comps.find((c) => c.id === sel)?.type === "battery" ? 24 : 20}
              value={comps.find((c) => c.id === sel)?.value ?? 5}
              onChange={(e) => setComps((cs) => cs.map((c) => (c.id === sel ? { ...c, value: parseFloat(e.target.value) } : c)))}
              className="h-2 w-32 accent-[var(--clay-4)]"
            />
            <button className="clay-sm clay-press px-2 py-1 text-xs" onClick={() => { setComps((cs) => cs.filter((c) => c.id !== sel)); setSel(null); }}>Delete</button>
          </div>
        )}
      </SimRow>
      <SimShell
        showControls={false}
        running
        onPlayPause={() => {}}
        onReset={() => { setComps([{ id: 1, type: "battery", x: 0.25, y: 0.75, value: 10 }, { id: 2, type: "resistor", x: 0.55, y: 0.3, value: 5 }, { id: 3, type: "bulb", x: 0.55, y: 0.75, value: 5 }]); setSel(2); }}
        physics={{
          what: "A series loop you can rebuild live. Kirchhoff's loop rule is verified at the bottom: battery EMF minus every voltage drop sums to zero. Add a capacitor and watch the current die away exponentially as it charges.",
          equations: [
            { tex: "\\sum \\mathcal{E} = \\sum IR", note: "loop rule" },
            { tex: "I = \\frac{\\mathcal{E}}{R_{\\text{eq}}}", note: "series: R_eq = R₁ + R₂ + …" },
            { tex: "q(t) = C\\mathcal{E}\\left(1 - e^{-t/RC}\\right)", note: "with a capacitor" },
          ],
          variables: [
            { sym: "R_{eq}", meaning: "equivalent resistance", unit: "Ω" },
            { sym: "I", meaning: "loop current", unit: "A" },
            { sym: "V_C", meaning: "capacitor voltage", unit: "V" },
          ],
          why: "Charge is conserved (junction rule) and energy is conserved (loop rule) — those two statements generate ALL circuit analysis. Every bulb's brightness is its own power P = I²R; every drop is I·R_i.",
          tryThis: "Set the bulb to 10 Ω with the 10 V battery: I = 0.5 A. Now add a 5 Ω resistor: current drops to 10/15 A and BOTH components dim proportionally. Then add a capacitor and watch the loop rule gain a third term.",
        }}
        prediction={{
          question: "You add a second identical bulb in series. The first bulb's brightness…",
          options: ["Stays the same", "Drops (less current)", "Increases", "Goes out entirely"],
          correct: 1,
          explain: "Doubling R_eq halves the current, and brightness follows P = I²R — one quarter the power per bulb. Add the second bulb and watch both glow dimmer than one alone.",
          runLabel: "Add a bulb and see",
        }}
      />
    </div>
  );
}

// ===================== OPTICS (real ray tracing) =====================
export function OpticsSim() {
  const [kind, setKind] = useState<"converging" | "diverging" | "concave" | "convex">("converging");
  const [objDist, setObjDist] = useState(200); // px from lens/mirror
  const [f, setF] = useState(120);
  const reset = () => { setObjDist(200); setF(120); setKind("converging"); };

  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const axisY = h * 0.5;
    const isMirror = kind === "concave" || kind === "convex";
    const deviceX = isMirror ? w * 0.72 : w * 0.55;
    const oh = 46;
    const dobj = objDist;
    const objX = isMirror ? deviceX - dobj : deviceX - dobj;
    const fSigned = kind === "diverging" || kind === "convex" ? -f : f;
    // thin lens / mirror equation with signed f
    const di = (fSigned * dobj) / (dobj - fSigned);
    const m = -di / dobj;
    const ih = oh * m;
    // image x: lenses put real images on the far side (+), mirrors on the near side (−)
    const imgX = isMirror ? deviceX - di : deviceX + di;
    const imgTopY = axisY - ih;
    const real = di > 0;

    // axis
    ctx.strokeStyle = muted; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(0, axisY); ctx.lineTo(w, axisY); ctx.stroke();
    ctx.setLineDash([]);

    // device
    if (isMirror) {
      // arc bulging toward the object side
      const bulge = kind === "concave" ? -18 : 18;
      ctx.strokeStyle = fg; ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(deviceX, axisY - 90);
      ctx.quadraticCurveTo(deviceX + bulge, axisY, deviceX, axisY + 90);
      ctx.stroke();
      // hatching behind mirror
      ctx.strokeStyle = muted; ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const y = axisY - 80 + i * 32;
        ctx.beginPath(); ctx.moveTo(deviceX + bulge + 2, y); ctx.lineTo(deviceX + bulge + 12, y + 8); ctx.stroke();
      }
    } else {
      ctx.strokeStyle = fg; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(deviceX, axisY, 7, 90, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(124,108,244,0.25)";
      ctx.fill(); ctx.stroke();
    }

    // focal points (and 2F/C markers)
    const f1 = isMirror ? deviceX - fSigned : deviceX - fSigned;
    const f2 = isMirror ? deviceX - fSigned : deviceX + fSigned;
    [[f1, "F"], [f2, "F"], [isMirror ? deviceX - 2 * fSigned : deviceX - 2 * fSigned, "2F"]].forEach(([fx, label]) => {
      ctx.fillStyle = "#ffc46b";
      ctx.beginPath(); ctx.arc(fx as number, axisY, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = muted; ctx.font = "10px system-ui";
      ctx.fillText(label as string, (fx as number) - 6, axisY + 16);
    });

    // object arrow (teal)
    const topY = axisY - oh;
    ctx.strokeStyle = "#6fd6c8"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(objX, axisY); ctx.lineTo(objX, topY); ctx.stroke();
    ctx.fillStyle = "#6fd6c8";
    ctx.beginPath(); ctx.moveTo(objX, topY - 6); ctx.lineTo(objX - 5, topY + 3); ctx.lineTo(objX + 5, topY + 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = muted; ctx.font = "10px system-ui";
    ctx.fillText(`d₀ = ${dobj}`, objX - 14, axisY + 16);

    const ray = (pts: [number, number][], dashed = false) => {
      ctx.setLineDash(dashed ? [4, 4] : []);
      ctx.strokeStyle = dashed ? "rgba(124,108,244,0.4)" : "rgba(124,108,244,0.85)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      pts.forEach(([X, Y], i) => { if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); });
      ctx.stroke();
      ctx.setLineDash([]);
    };
    const edge = w - 8;

    if (!isMirror) {
      // ray 1: parallel to axis → refracts through F (converging) or away from F (diverging)
      ray([[objX, topY], [deviceX, topY]]);
      if (kind === "converging") {
        ray([[deviceX, topY], [imgX, imgTopY]]);
        if (real) ray([[imgX, imgTopY], [Math.min(edge, imgX + 120), imgTopY + ((imgTopY - topY) / Math.max(1, imgX - deviceX)) * Math.min(120, edge - imgX) * 0 + 0]], false);
      } else {
        // diverging: refracted ray leaves as if from the NEAR focal point (deviceX - f, axisY)
        const nearF = deviceX - f;
        const dirX = deviceX - nearF, dirY = topY - axisY;
        const len = Math.hypot(dirX, dirY);
        ray([[deviceX, topY], [deviceX - (dirX / len) * 240, topY - (dirY / len) * 240]]);
        // virtual extension back through the image top
        ray([[deviceX, topY], [imgX, imgTopY]], true);
      }
      // ray 2: through the lens center — undeviated
      ray([[objX, topY], [deviceX + (dobj > 0 ? 260 : -260), topY + ((axisY - topY) / dobj) * 260]]);
      // its backward extension for virtual images
      if (!real) ray([[deviceX, imgTopY + 0]], true);
    } else {
      // MIRROR ray tracing
      // ray 1: parallel to axis, reflects through F (concave) or away from F (convex)
      ray([[objX, topY], [deviceX, topY]]);
      if (real) {
        ray([[deviceX, topY], [imgX, imgTopY]]);
      } else {
        // diverging reflection: away from virtual image
        const dx = deviceX - imgX, dy = topY - imgTopY;
        const len = Math.hypot(dx, dy) || 1;
        ray([[deviceX, topY], [deviceX - (dx / len) * 260, topY - (dy / len) * 260]]);
        ray([[deviceX, topY], [imgX, imgTopY]], true);
      }
      // ray 2: aimed at F (concave) → reflects parallel to axis at image-top height
      // the reflected horizontal ray is AT height imgTopY by construction
      // incident path: from object top toward F (or away from F for convex), extended to the mirror
      const Fx = deviceX - fSigned;
      const slope = (axisY - topY) / (Fx - objX);
      const yAtMirror = topY + slope * (deviceX - objX);
      ray([[objX, topY], [deviceX, yAtMirror]]);
      if (real) {
        ray([[deviceX, yAtMirror], [imgX, imgTopY]]);
      } else {
        ray([[deviceX, yAtMirror], [deviceX - 260, yAtMirror]]);
        ray([[deviceX, yAtMirror], [imgX, imgTopY]], true);
      }
    }

    // image arrow (pink; dashed outline if virtual)
    if (Math.abs(ih) < 5000 && Math.abs(imgX) < 4000) {
      ctx.strokeStyle = real ? "#ff8fb1" : "rgba(255,143,177,0.7)";
      if (!real) ctx.setLineDash([5, 4]);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(imgX, axisY); ctx.lineTo(imgX, imgTopY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = fg; ctx.font = "12px system-ui";
      const orient = m < 0 ? "inverted" : "upright";
      ctx.fillText(`dᵢ = ${di.toFixed(0)} px  ·  m = ${m.toFixed(2)}  ·  ${real ? "REAL" : "virtual"}, ${orient}`, 12, 20);
      ctx.fillStyle = muted; ctx.font = "11px system-ui";
      ctx.fillText(`1/f = 1/d₀ + 1/dᵢ   with f = ${fSigned} px, d₀ = ${dobj} px`, 12, h - 10);
    } else {
      ctx.fillStyle = fg; ctx.font = "12px system-ui";
      ctx.fillText("d₀ ≈ f: the image forms at infinity — rays leave parallel. Move the object.", 12, 20);
    }
  });
  return (
    <div>
      <SimFrame height={340}><canvas ref={ref} className="h-full w-full touch-none" /></SimFrame>
      <SimRow>
        <div className="flex flex-wrap gap-2">
          {(["converging", "diverging", "concave", "convex"] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)} className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold capitalize" style={kind === k ? { background: "var(--clay-primary-tint)", color: "var(--clay-primary-deep)" } : undefined}>{k}</button>
          ))}
        </div>
        <Slider label="Object distance d₀" value={objDist} min={30} max={360} onChange={setObjDist} format={(v) => `${v} px`} />
        <Slider label="Focal length |f|" value={f} min={50} max={200} onChange={setF} format={(v) => `${v} px`} />
      </SimRow>
      <SimShell
        showControls={false}
        running
        onPlayPause={() => {}}
        onReset={reset}
        physics={{
          what: "A true ray tracer: two principal rays are drawn with the law of the device, and the image appears where they intersect. Dashed extensions mean your eye extrapolates the diverging rays backward — a virtual image you can see but not project.",
          equations: [
            { tex: "\\frac{1}{f} = \\frac{1}{d_0} + \\frac{1}{d_i}" },
            { tex: "m = -\\frac{d_i}{d_0}", note: "negative m → inverted" },
          ],
          variables: [
            { sym: "f", meaning: "focal length (+ converging, − diverging)", unit: "px" },
            { sym: "d_0", meaning: "object distance", unit: "px" },
            { sym: "m", meaning: "magnification", unit: "—" },
          ],
          why: "The same equation governs lenses and mirrors; only the sign conventions differ. Real images form where rays actually cross (projectable on a screen); virtual images form where rays only APPEAR to cross.",
          tryThis: "Converging: slide d₀ through f — watch the image explode to infinity and reappear on the same side as the object, upright and virtual. Concave mirror does the same inside f. Diverging and convex NEVER make real images of real objects.",
        }}
        prediction={{
          question: "Converging lens, object placed just inside f. The image is…",
          options: ["Real and inverted", "Virtual and upright", "Real and upright", "No image forms"],
          correct: 1,
          explain: "Inside the focal length a converging lens acts like a magnifying glass: dᵢ < 0, m > 1 — virtual, upright, enlarged. That's the entire operating principle of a jeweler's loupe.",
          runLabel: "Trace the rays",
        }}
      />
    </div>
  );
}

// ===================== WAVES =====================
export function WavesSim() {
  const [amp, setAmp] = useState(30);
  const [freq, setFreq] = useState(1.5);
  const [mode, setMode] = useState<"single" | "standing" | "interference" | "doppler">("single");
  const [sep, setSep] = useState(0.25);
  const [srcV, setSrcV] = useState(0.35);
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const clock = useClock();
  const reset = () => setTick((n) => n + 1);

  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const { t } = clock(performance.now(), running);
    if (mode === "single") {
      const midY = h * 0.45;
      ctx.strokeStyle = muted;
      ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(w, midY); ctx.stroke();
      ctx.strokeStyle = "#7c6cf4"; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = midY - amp * Math.sin(2 * Math.PI * (freq * (t - x / 300)));
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      const lambda = 300 / freq;
      ctx.strokeStyle = "#ffc46b";
      ctx.beginPath();
      ctx.moveTo(40, midY + amp + 16); ctx.lineTo(40 + Math.min(lambda, w - 80), midY + amp + 16);
      ctx.stroke();
      ctx.fillStyle = fg; ctx.font = "12px system-ui";
      ctx.fillText(`λ = ${lambda.toFixed(0)} px   v = fλ   f = ${freq.toFixed(1)} Hz`, 40, midY + amp + 32);
    } else if (mode === "standing") {
      const midY = h * 0.5;
      const k = (2 * Math.PI * freq) / 300;
      const omega = 2 * Math.PI * freq;
      // two counter-propagating waves: 2A sin(kx) cos(ωt)
      ctx.strokeStyle = muted;
      ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(w, midY); ctx.stroke();
      // envelope
      ctx.strokeStyle = "rgba(255,196,107,0.5)"; ctx.setLineDash([3, 4]);
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const env = 2 * amp * Math.abs(Math.sin(k * x));
        if (x === 0) ctx.moveTo(x, midY - env); else ctx.lineTo(x, midY - env);
      }
      for (let x = w; x >= 0; x -= 2) {
        const env = 2 * amp * Math.abs(Math.sin(k * x));
        ctx.lineTo(x, midY + env);
      }
      ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = "#7c6cf4"; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = midY - 2 * amp * Math.sin(k * x) * Math.cos(omega * t);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // nodes where sin(kx) = 0
      ctx.fillStyle = "#ff8fb1";
      for (let x = 0; x <= w; x += 2) {
        if (Math.abs(Math.sin(k * x)) < 0.02) { ctx.beginPath(); ctx.arc(x, midY, 4, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.fillStyle = fg; ctx.font = "12px system-ui";
      ctx.fillText(`Standing wave: nodes (pink) never move — energy sloshes between K and U instead of traveling.`, 12, 20);
      ctx.fillText(`L_n = n·λ/2 → λ = ${((300 / freq) ).toFixed(0)} px`, 12, 38);
    } else if (mode === "interference") {
      const s1x = w * (0.5 - sep), s2x = w * (0.5 + sep), sy = h * 0.25;
      for (let ring = 1; ring < 9; ring++) {
        const r = ((t * 60) + ring * (300 / freq)) % (300 / freq * 9);
        [s1x, s2x].forEach((sx) => {
          ctx.strokeStyle = "rgba(124,108,244,0.35)";
          ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
        });
      }
      ball(ctx, s1x, sy, 6, "#ff8fb1");
      ball(ctx, s2x, sy, 6, "#8fb8f7");
      ctx.fillStyle = fg; ctx.font = "12px system-ui";
      ctx.fillText("Where circles cross in step → constructive (loud). Cross opposing → destructive (silent).", 12, h - 12);
    } else {
      const srcX = (((t * srcV * 100) % (w + 160)) - 80);
      const cSpeed = 90;
      for (let ring = 0; ring < 10; ring++) {
        const age = ring * 0.22;
        const r = age * cSpeed;
        const bornX = srcX - srcV * 100 * age;
        ctx.strokeStyle = `rgba(124,108,244,${0.55 - ring * 0.05})`;
        ctx.beginPath(); ctx.arc(bornX, h * 0.45, r, 0, Math.PI * 2); ctx.stroke();
      }
      ball(ctx, srcX, h * 0.45, 10, "#ff8fb1");
      ctx.fillStyle = "#6fd6c8";
      ctx.beginPath(); ctx.arc(w * 0.82, h * 0.45, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = fg; ctx.font = "12px system-ui";
      ctx.fillText("Wavefronts bunch ahead of the moving source (higher pitch), stretch behind.", 12, 20);
    }
  }, { running, resetKey: tick });

  return (
    <div>
      <SimFrame height={320}><canvas ref={ref} className="h-full w-full touch-none" /></SimFrame>
      <SimRow>
        <div className="flex flex-wrap gap-2">
          {(["single", "standing", "interference", "doppler"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold capitalize" style={mode === m ? { background: "var(--clay-primary-tint)", color: "var(--clay-primary-deep)" } : undefined}>{m}</button>
          ))}
        </div>
        <Slider label="Amplitude" value={amp} min={5} max={60} onChange={setAmp} />
        <Slider label="Frequency" value={freq} min={0.5} max={4} step={0.1} onChange={setFreq} format={(v) => `${v.toFixed(1)} Hz`} />
        {mode === "interference" && <Slider label="Separation" value={sep} min={0.05} max={0.45} step={0.01} onChange={setSep} />}
        {mode === "doppler" && <Slider label="Source speed" value={srcV} min={0.05} max={0.95} step={0.05} onChange={setSrcV} />}
      </SimRow>
      <SimShell
        running={running}
        onPlayPause={() => setRunning((r) => !r)}
        onReset={reset}
        physics={{
          what: "Four wave behaviors from one equation. A traveling wave carries energy without carrying material; standing waves are two travelers passing through each other; interference is addition of displacements; the Doppler effect compresses wavefronts in the direction of motion.",
          equations: [
            { tex: "v = f\\lambda" },
            { tex: "y = 2A\\sin(kx)\\cos(\\omega t)", note: "standing wave" },
            { tex: "f' = f\\frac{v \\pm v_o}{v \\mp v_s}", note: "Doppler" },
          ],
          variables: [
            { sym: "A", meaning: "amplitude", unit: "px" },
            { sym: "f", meaning: "frequency", unit: "Hz" },
            { sym: "\\lambda", meaning: "wavelength", unit: "px" },
          ],
          why: "Superposition is the master rule: waves pass through each other and ADD. Nothing is 'blocked' — destructive interference is genuine cancellation, which is why noise-canceling headphones can silence a sound without a wall.",
          tryThis: "In standing mode, raise the frequency: nodes crowd together as λ shrinks (fixed wave speed!). In interference, slide the separation and watch the angle between loud directions change — the geometry behind every diffraction pattern.",
        }}
        prediction={{
          question: "You double the frequency at fixed wave speed. The wavelength…",
          options: ["Doubles", "Halves", "Is unchanged", "Quadruples"],
          correct: 1,
          explain: "v = fλ with v fixed means f and λ trade off inversely. Watch the λ marker shrink by exactly half as you slide frequency up — wave speed is set by the MEDIUM, not the source.",
          runLabel: "Run and check λ",
        }}
      />
    </div>
  );
}

// ===================== RADIOACTIVE DECAY =====================
export function DecaySim() {
  const [halfLife, setHalfLife] = useState(2);
  const [running, setRunning] = useState(true);
  const nucleiRef = useRef<number[]>(Array(120).fill(0));
  const initRef = useRef(120);
  const accRef = useRef(0);
  const elapsedRef = useRef(0);
  const historyRef = useRef<number[]>([]);
  const clock = useClock();
  const reset = () => {
    nucleiRef.current = Array(120).fill(0);
    historyRef.current = [];
    elapsedRef.current = 0;
    accRef.current = 0;
    initRef.current = 120;
  };

  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const { dt } = clock(performance.now(), running);
    if (dt > 0) {
      accRef.current += dt;
      elapsedRef.current += dt;
      // per-nucleus decay probability for this dt: 1 - 2^(-dt/t½)
      const p = 1 - Math.pow(0.5, dt / halfLife);
      nucleiRef.current = nucleiRef.current.map((state) => (state === 0 && Math.random() < p ? 1 : state));
      historyRef.current.push(nucleiRef.current.filter((s) => s === 0).length);
      if (historyRef.current.length > 600) historyRef.current.shift();
    }
    const remaining = nucleiRef.current.filter((s) => s === 0).length;
    // grid of nuclei
    const cols = 15;
    nucleiRef.current.forEach((state, i) => {
      const cx = 20 + (i % cols) * ((w * 0.55) / cols) + 10;
      const cy = 30 + Math.floor(i / cols) * 26;
      ball(ctx, cx, cy, 8, state === 0 ? "#7c6cf4" : "#c9c3dd");
    });
    // decay curve on a TRUE time axis
    const gx = w * 0.62, gy = h * 0.15, gw = w * 0.34, gh = h * 0.66;
    const tWindow = Math.max(3 * halfLife, elapsedRef.current);
    ctx.strokeStyle = muted; ctx.strokeRect(gx, gy, gw, gh);
    // theoretical curve N = N₀·2^(-t/t½)
    ctx.strokeStyle = "rgba(124,108,244,0.35)"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const tt = (i / 60) * tWindow;
      const n = initRef.current * Math.pow(0.5, tt / halfLife);
      const X = gx + (tt / tWindow) * gw;
      const Y = gy + gh - (n / initRef.current) * gh;
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.stroke(); ctx.setLineDash([]);
    // measured data
    ctx.strokeStyle = "#ff8fb1"; ctx.lineWidth = 2;
    ctx.beginPath();
    historyRef.current.forEach((n, i) => {
      const tt = (i + 1) / 60;
      const X = gx + (tt / tWindow) * gw;
      const Y = gy + gh - (n / initRef.current) * gh;
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    });
    ctx.stroke();
    // half-life markers on the time axis
    ctx.font = "10px system-ui";
    for (let k = 1; k <= 3; k++) {
      const X = gx + ((k * halfLife) / tWindow) * gw;
      ctx.strokeStyle = "rgba(255,196,107,0.5)"; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(X, gy); ctx.lineTo(X, gy + gh); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#ffc46b";
      ctx.fillText(`${k}t½`, X - 8, gy - 4);
    }
    ctx.fillStyle = muted;
    ctx.fillText("N(t) measured (pink) vs theory (dashed)", gx + 4, gy + gh + 14);
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`Remaining: ${remaining}/${initRef.current}   t = ${elapsedRef.current.toFixed(1)} s   t½ = ${halfLife.toFixed(1)} s`, 12, h - 8);
  }, { running });

  return (
    <div>
      <SimFrame height={300}><canvas ref={ref} className="h-full w-full touch-none" /></SimFrame>
      <SimRow>
        <Slider label="Half-life" value={halfLife} min={0.5} max={6} step={0.5} onChange={setHalfLife} format={(v) => `${v.toFixed(1)} s`} />
      </SimRow>
      <SimShell
        running={running}
        onPlayPause={() => setRunning((r) => !r)}
        onReset={reset}
        physics={{
          what: "120 unstable nuclei, each decaying completely at random. No nucleus 'knows' the half-life — yet the population falls by exactly half every t½, hugging the dashed exponential theory curve.",
          equations: [
            { tex: "N = N_0 \\left(\\tfrac{1}{2}\\right)^{t/t_{1/2}}" },
            { tex: "\\frac{dN}{dt} = -\\lambda N, \\quad \\lambda = \\frac{\\ln 2}{t_{1/2}}" },
          ],
          variables: [
            { sym: "t_{1/2}", meaning: "half-life", unit: "s" },
            { sym: "\\lambda", meaning: "decay constant", unit: "s⁻¹" },
            { sym: "N", meaning: "undecayed nuclei", unit: "count" },
          ],
          why: "Each nucleus has a constant probability per second of decaying. Halving follows mathematically from 'constant fractional rate', the same law that governs RC discharge and radioactive carbon dating.",
          tryThis: "Reset, then read the pink curve at 1t½, 2t½, 3t½: 60 → 30 → 15, give or take statistical noise. The noise IS the lesson — small samples are lumpy, but the law emerges from the randomness.",
        }}
        prediction={{
          question: "After 3 half-lives, roughly what fraction of the sample remains?",
          options: ["1/3", "1/6", "1/8", "1/9"],
          correct: 2,
          explain: "½ × ½ × ½ = 1/8. Set t½ = 1 s and read the pink curve at t = 3 s: it sits near 15 of 120 = 1/8. Exponents, not division by three.",
          runLabel: "Run for 3 half-lives",
        }}
      />
    </div>
  );
}

// ===================== PHOTOELECTRIC =====================
export function PhotoelectricSim() {
  const [wavelength, setWavelength] = useState(400);
  const [intensity, setIntensity] = useState(5);
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const workFunction = 2.3; // eV, sodium-ish
  const clock = useClock();
  const reset = () => setTick((n) => n + 1);

  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const { t } = clock(performance.now(), running);
    const E = 1240 / wavelength; // eV
    const ejects = E > workFunction;
    const ke = ejects ? E - workFunction : 0;
    // light beam
    const color = wavelength < 450 ? "#8fb8f7" : wavelength < 580 ? "#6fd6c8" : wavelength < 620 ? "#ffc46b" : "#ff8fb1";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 + intensity * 1.4;
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, h * 0.3 + i * 10);
      ctx.lineTo(w * 0.45, h * 0.3 + i * 10);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // plate
    ctx.fillStyle = "#7c6cf4";
    ctx.beginPath(); ctx.roundRect(w * 0.45, h * 0.2, 14, h * 0.4, 4); ctx.fill();
    // electrons: speed on canvas follows K_max; count follows intensity
    if (ejects) {
      const nEject = intensity;
      const speed = 1.5 + ke * 2.2;
      for (let i = 0; i < nEject; i++) {
        const phase = (t * speed + i * 0.37) % 1;
        const ex = w * 0.45 + 20 + phase * (w * 0.4);
        const spread = Math.sin(i * 2.1 + Math.floor(t * speed + i * 0.37) * 1.7) * 18;
        ball(ctx, ex, h * 0.4 + spread, 5, "#6fd6c8");
        if (i % 2 === 0) arrow(ctx, ex, h * 0.4 + spread, ex + 8 + ke * 6, h * 0.4 + spread, "rgba(111,214,200,0.6)", 1.5, 5);
      }
    }
    // collector
    ctx.strokeStyle = muted; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(w * 0.92, h * 0.2); ctx.lineTo(w * 0.92, h * 0.6); ctx.stroke();
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`λ = ${wavelength} nm → photon E = ${E.toFixed(2)} eV`, 12, 20);
    ctx.fillStyle = ejects ? "#6fd6c8" : "#ff8fb1";
    ctx.fillText(ejects ? `Ejected! K_max = ${(E - workFunction).toFixed(2)} eV` : `No ejection — below threshold (φ = ${workFunction} eV)`, 12, 40);
    ctx.fillStyle = muted;
    ctx.fillText("Brightness (intensity) changes the NUMBER of photons. Color (frequency) changes each photon's ENERGY.", 12, h - 10);
  }, { running, resetKey: tick });

  return (
    <div>
      <SimFrame height={300}><canvas ref={ref} className="h-full w-full touch-none" /></SimFrame>
      <SimRow>
        <Slider label="Wavelength" value={wavelength} min={200} max={750} onChange={setWavelength} format={(v) => `${v} nm`} />
        <Slider label="Intensity" value={intensity} min={1} max={10} onChange={setIntensity} />
      </SimRow>
      <SimShell
        running={running}
        onPlayPause={() => setRunning((r) => !r)}
        onReset={reset}
        physics={{
          what: "Light delivers energy in photons of E = hf. One photon frees at most one electron; anything the photon has above the work function φ becomes the electron's kinetic energy.",
          equations: [
            { tex: "K_{\\max} = hf - \\phi = \\frac{hc}{\\lambda} - \\phi" },
            { tex: "f_0 = \\frac{\\phi}{h}", note: "threshold frequency" },
          ],
          variables: [
            { sym: "\\phi", meaning: "work function (2.3 eV here)", unit: "eV" },
            { sym: "K_{max}", meaning: "max electron kinetic energy", unit: "eV" },
            { sym: "I", meaning: "intensity (photons/second)", unit: "—" },
          ],
          why: "Classical waves predicted that ANY color, given enough intensity, should eventually free electrons — and dim light should need a warm-up. Neither happens: ejection is all-or-nothing per photon. This experiment launched quantum physics.",
          tryThis: "Crank intensity to 10 at 600 nm: nothing. One photon below threshold can never eject — brightness is irrelevant. Now slide to 400 nm and watch both ejection AND electron speed (arrow length) respond.",
        }}
        prediction={{
          question: "Halve the wavelength (keep ejection happening). K_max…",
          options: ["Halves", "Doubles", "Increases by more than double", "Is unchanged"],
          correct: 2,
          explain: "K_max = hc/λ − φ. Halving λ doubles hc/λ but φ stays fixed — so K_max more than doubles. Only the ABOVE-threshold part scales; the threshold is a constant tax.",
          runLabel: "Slide λ and watch",
        }}
      />
    </div>
  );
}

// ===================== ORBITAL (real gravity integration) =====================
export function OrbitalSim() {
  const [speedRatio, setSpeedRatio] = useState(1);
  const [r0, setR0] = useState(120);
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const posRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const trailRef = useRef<[number, number][]>([]);
  const clock = useClock();
  const init = () => {
    posRef.current = { x: r0, y: 0, vx: 0, vy: -speedRatio * Math.sqrt(5000 / r0) };
    trailRef.current = [];
  };
  // re-launch when parameters change or on reset
  const paramsRef = useRef({ speedRatio, r0 });
  if (paramsRef.current.speedRatio !== speedRatio || paramsRef.current.r0 !== r0) {
    paramsRef.current = { speedRatio, r0 };
    init();
  }
  const reset = () => { init(); setTick((n) => n + 1); };

  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const { dt } = clock(performance.now(), running);
    const GM = 5000; // scaled gravity
    const p = posRef.current;
    let escaped = false;
    if (dt > 0) {
      // semi-implicit Euler with substeps — stable orbits
      for (let i = 0; i < 4; i++) {
        const r = Math.hypot(p.x, p.y) || 1;
        const a = -GM / (r * r * r);
        p.vx += a * p.x * (dt / 4);
        p.vy += a * p.y * (dt / 4);
        p.x += p.vx * (dt / 4);
        p.y += p.vy * (dt / 4);
      }
      const r = Math.hypot(p.x, p.y);
      if (r > 600) escaped = true;
      trailRef.current.push([p.x, p.y]);
      if (trailRef.current.length > 900) trailRef.current.pop();
    }
    const cx = w * 0.45, cy = h * 0.5;
    // star
    ball(ctx, cx, cy, 16, "#ffc46b");
    // trail
    ctx.strokeStyle = "rgba(124,108,244,0.4)"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    trailRef.current.forEach(([X, Y], i) => {
      const px = cx + X, py = cy + Y;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();
    const sx = cx + p.x, sy = cy + p.y;
    ball(ctx, sx, sy, 8, "#7c6cf4");
    // velocity arrow + gravity arrow
    const vmag = Math.hypot(p.vx, p.vy) || 1;
    arrow(ctx, sx, sy, sx + (p.vx / vmag) * 34, sy + (p.vy / vmag) * 34, "#8fb8f7", 2);
    const r = Math.hypot(p.x, p.y) || 1;
    arrow(ctx, sx, sy, sx - (p.x / r) * 26, sy - (p.y / r) * 26, "#ff8fb1", 2);
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    const vCirc = Math.sqrt(GM / r);
    const ratio = vmag / vCirc;
    ctx.fillText(
      escaped
        ? "Escaped! v ≥ v_escape — raise speed to ≥ √2 × circular and gravity can't hold it. Reset to relaunch."
        : `r = ${(r / 40).toFixed(1)}   v/v_circ = ${ratio.toFixed(2)}   ${ratio < 0.95 ? "elliptical — closer = faster (Kepler II)" : ratio <= 1.05 ? "≈ circular" : "elliptical — this point is the slowest (aphelion side)"}`,
      12, 20,
    );
    ctx.fillStyle = muted; ctx.font = "11px system-ui";
    ctx.fillText("Blue = velocity (tangent), pink = gravity (inward). T² ∝ a³: bigger orbits take longer.", 12, h - 10);
  }, { running, resetKey: tick });

  return (
    <div>
      <SimFrame height={320}><canvas ref={ref} className="h-full w-full touch-none" /></SimFrame>
      <SimRow>
        <Slider label="Starting radius" value={r0} min={60} max={200} onChange={setR0} format={(v) => `${(v / 40).toFixed(1)} units`} />
        <Slider label="Launch speed (× circular)" value={speedRatio} min={0.4} max={1.5} step={0.05} onChange={setSpeedRatio} format={(v) => `${v.toFixed(2)}×`} />
      </SimRow>
      <SimShell
        running={running}
        onPlayPause={() => setRunning((r) => !r)}
        onReset={reset}
        physics={{
          what: "Real gravity, integrated live: acceleration always points at the star with magnitude GM/r². Circular orbits are the special case v = √(GM/r); anything else traces an ellipse, a dive, or an escape.",
          equations: [
            { tex: "F = \\frac{GMm}{r^2}", note: "inverse-square gravity" },
            { tex: "v_{\\text{circ}} = \\sqrt{\\frac{GM}{r}}" },
            { tex: "T^2 = \\frac{4\\pi^2}{GM} a^3", note: "Kepler III" },
          ],
          variables: [
            { sym: "v", meaning: "orbital speed", unit: "scaled" },
            { sym: "r", meaning: "distance from star", unit: "scaled" },
            { sym: "a", meaning: "semi-major axis", unit: "scaled" },
          ],
          why: "A circular orbit is just free fall that keeps missing. Launch slower than circular and gravity wins — the planet falls inward and speeds up (Kepler II). Launch at √2× circular and it reaches escape velocity exactly.",
          tryThis: "Set launch speed to 1.00 for a circle. Then 0.7: an ellipse whose closest approach is fast and whose far side crawls. Then 1.42: the planet leaves forever. Every trajectory is determined by one number — energy.",
        }}
        prediction={{
          question: "Launch at exactly √2 × the circular speed. The orbit…",
          options: ["Is a bigger circle", "Escapes (parabola)", "Is a tight ellipse", "Crashes into the star"],
          correct: 1,
          explain: "Escape speed is √2 × circular speed at any radius — total energy hits exactly zero. Set the slider to 1.41 and watch the trail never close.",
          runLabel: "Launch at escape speed",
        }}
      />
    </div>
  );
}

// ===================== CALCULUS EXPLORER =====================
export function CalculusSim() {
  const [func, setFunc] = useState<"quad" | "sin" | "exp">("quad");
  const [xPos, setXPos] = useState(0.4);
  const [showArea, setShowArea] = useState(true);
  const [showRiemann, setShowRiemann] = useState(false);
  const reset = () => { setXPos(0.4); setFunc("quad"); setShowArea(true); setShowRiemann(false); };

  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const gx = w * 0.08, gy = h * 0.18, gw = w * 0.84, gh = h * 0.62;
    const f = (x: number) => (func === "quad" ? 0.6 * x * x : func === "sin" ? Math.sin(x * 3) * 0.7 + 0.3 : (Math.exp(x) / Math.exp(1.6)) * 0.9);
    const df = (x: number) => (func === "quad" ? 1.2 * x : func === "sin" ? 3 * Math.cos(x * 3) * 0.7 : (Math.exp(x) / Math.exp(1.6)) * 0.9);
    const toX = (x: number) => gx + x * gw;
    const toY = (y: number) => gy + gh - y * gh;
    // axes
    ctx.strokeStyle = muted; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();
    const x = xPos * 1.6;
    // Riemann bars or smooth area under curve
    if (showArea) {
      if (showRiemann) {
        const n = 14;
        const dx = x / n;
        for (let i = 0; i < n; i++) {
          const xm = (i + 0.5) * dx;
          const hgt = f(xm);
          ctx.fillStyle = i % 2 === 0 ? "rgba(111,214,200,0.35)" : "rgba(111,214,200,0.5)";
          ctx.fillRect(toX(i * dx), toY(hgt), (gw / 1.6) * dx, toY(0) - toY(hgt));
          ctx.strokeStyle = "rgba(111,214,200,0.9)";
          ctx.strokeRect(toX(i * dx), toY(hgt), (gw / 1.6) * dx, toY(0) - toY(hgt));
        }
      } else {
        ctx.fillStyle = "rgba(111,214,200,0.25)";
        ctx.beginPath();
        ctx.moveTo(toX(0), toY(0));
        for (let i = 0; i <= 40; i++) { const xx = (i / 40) * x; ctx.lineTo(toX(xx), toY(f(xx))); }
        ctx.lineTo(toX(x), toY(0));
        ctx.closePath(); ctx.fill();
      }
    }
    // curve
    ctx.strokeStyle = "#7c6cf4"; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) { const xx = (i / 100) * 1.6; if (i === 0) ctx.moveTo(toX(xx), toY(f(xx))); else ctx.lineTo(toX(xx), toY(f(xx))); }
    ctx.stroke();
    // tangent
    const slope = df(x);
    ctx.strokeStyle = "#ff8fb1"; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toX(x - 0.25), toY(f(x) - slope * 0.25));
    ctx.lineTo(toX(x + 0.25), toY(f(x) + slope * 0.25));
    ctx.stroke();
    ball(ctx, toX(x), toY(f(x)), 6, "#ff8fb1");
    let area = 0;
    for (let i = 0; i < 200; i++) area += f((i / 200) * x) * (x / 200);
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`x = ${x.toFixed(2)}   f(x) = ${f(x).toFixed(2)}   slope f′(x) = ${slope.toFixed(2)}   ∫₀ˣ f = ${area.toFixed(2)}`, 12, 20);
    ctx.fillStyle = muted; ctx.font = "11px system-ui";
    ctx.fillText("Pink tangent = derivative (instantaneous rate). Teal area = integral (accumulation). Drag the probe or the slider.", 12, h - 10);
  });
  return (
    <div>
      <SimFrame height={300}>
        <canvas
          ref={ref}
          className="h-full w-full touch-none"
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setXPos(Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / rect.width)));
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1) {
              const rect = e.currentTarget.getBoundingClientRect();
              setXPos(Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / rect.width)));
            }
          }}
        />
      </SimFrame>
      <SimRow>
        <div className="flex gap-2">
          {(["quad", "sin", "exp"] as const).map((k) => (
            <button key={k} onClick={() => setFunc(k)} className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" style={func === k ? { background: "var(--clay-primary-tint)", color: "var(--clay-primary-deep)" } : undefined}>{k}</button>
          ))}
        </div>
        <Slider label="Probe x" value={xPos} min={0.02} max={0.98} step={0.01} onChange={setXPos} />
        <Toggle label="Show area" on={showArea} onChange={setShowArea} />
        <Toggle label="Riemann bars" on={showRiemann} onChange={setShowRiemann} />
      </SimRow>
      <SimShell
        showControls={false}
        running
        onPlayPause={() => {}}
        onReset={reset}
        physics={{
          what: "The two operations of calculus on one graph. The tangent's slope is the derivative — an instantaneous rate, like velocity from position. The shaded area is the integral — accumulated change, like displacement from velocity.",
          equations: [
            { tex: "v = \\frac{dx}{dt}", note: "derivative: slope of x(t)" },
            { tex: "\\Delta x = \\int v\\,dt", note: "integral: area under v(t)" },
            { tex: "W = \\int F\\,dx", note: "same machinery: work" },
          ],
          variables: [
            { sym: "f'(x)", meaning: "derivative at the probe", unit: "slope" },
            { sym: "\\int_0^x f", meaning: "accumulated area", unit: "depends on f" },
          ],
          why: "Derivatives and integrals are inverse operations (Fundamental Theorem). Physics runs on this loop: differentiate position → velocity; integrate velocity → position. Work, charge flow, and impulse are all integrals in disguise.",
          tryThis: "Toggle Riemann bars and count them: the bar total under-estimates the true area where the curve climbs — that error is exactly why we take the limit. Slide the probe and watch area grow even when f′ dips negative.",
        }}
        prediction={{
          question: "For the quad curve, the slope f′(x) at x = 0 compared to x = 1.5 is…",
          options: ["The same", "Smaller", "Larger", "Negative"],
          correct: 1,
          explain: "f′(x) = 1.2x — the parabola starts flat and steepens. Slope 0 at the origin vs 1.8 at x = 1.5: drag the probe from far left to right and watch the pink tangent tilt.",
          runLabel: "Drag the probe",
        }}
      />
    </div>
  );
}

// ---- all together ----
export const FIELD_SIMS: Record<string, React.ComponentType> = {
  gas: GasSim,
  charges: ChargesSim,
  magnetism: MagnetismSim,
  rc: RCSim,
  circuits: CircuitBuilderSim,
  optics: OpticsSim,
  waves: WavesSim,
  decay: DecaySim,
  photoelectric: PhotoelectricSim,
  orbital: OrbitalSim,
  calculus: CalculusSim,
};
