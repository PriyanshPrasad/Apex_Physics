import { useRef, useState } from "react";
import { useCanvasLoop, SimFrame, SimRow, Slider, Toggle, arrow, grid, ball, shade } from "./framework";

// ===================== GAS PARTICLES =====================
export function GasSim() {
  const [temp, setTemp] = useState(300);
  const [volFrac, setVolFrac] = useState(1);
  const [nParticles] = useState(60);
  const partsRef = useRef(
    Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 })),
  );
  const pressAcc = useRef({ collisions: 0, time: 0 });
  const [pressure, setPressure] = useState(0);
  const lastT = useRef(performance.now());
  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const now = performance.now();
    const dt = Math.min((now - lastT.current) / 1000, 0.05);
    lastT.current = now;
    const speedScale = Math.sqrt(temp / 300);
    const wallX = w * 0.15 + (w * 0.75) * volFrac;
    const parts = partsRef.current;
    let wallHits = 0;
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
    // container
    ctx.strokeStyle = muted; ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.15, h * 0.1, wallX - w * 0.15, h * 0.85);
    // piston
    ctx.fillStyle = "#7c6cf4";
    ctx.beginPath(); ctx.roundRect(wallX - 6, h * 0.1, 12, h * 0.85, 6); ctx.fill();
    // particles colored by speed
    parts.forEach((p) => {
      const px = w * 0.15 + p.x * (wallX - w * 0.15);
      const py = h * 0.1 + p.y * h * 0.85;
      ball(ctx, px, py, 4, temp > 450 ? "#ff8fb1" : temp > 250 ? "#ffc46b" : "#8fb8f7");
    });
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`T = ${temp} K   V = ${(volFrac * 100).toFixed(0)}%   P ≈ ${pressure} (collision rate × speed)`, 12, 20);
    ctx.fillStyle = muted;
    ctx.fillText("Temperature = average kinetic energy; pressure = drumbeat of wall collisions.", 12, h - 10);
  });
  return (
    <div>
      <SimFrame height={320}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="Temperature" value={temp} min={100} max={900} onChange={setTemp} format={(v) => `${v} K`} />
        <Slider label="Volume" value={volFrac} min={0.35} max={1} onChange={setVolFrac} format={(v) => `${(v * 100).toFixed(0)}%`} />
      </SimRow>
      <p className="mt-2 text-xs text-muted-foreground">Compress the gas and watch pressure rise; heat it and particles fly faster. PV = nRT made visible.</p>
    </div>
  );
}

// ===================== CHARGES & FIELDS =====================
interface Ch { x: number; y: number; q: number; }
export function ChargesSim() {
  const [charges, setCharges] = useState<Ch[]>([{ x: 0.3, y: 0.5, q: 1 }, { x: 0.7, y: 0.5, q: -1 }]);
  const [showLines, setShowLines] = useState(true);
  const [drag, setDrag] = useState<number | null>(null);
  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    grid(ctx, w, h);
    const k = 4000;
    // field grid
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
    // field lines
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
    charges.forEach((c, i) => {
      const cx = c.x * w, cy = c.y * h;
      ball(ctx, cx, cy, 15, c.q > 0 ? "#ff8fb1" : "#8fb8f7");
      ctx.fillStyle = "#fff"; ctx.font = "bold 14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(c.q > 0 ? "+" : "−", cx, cy + 5);
      ctx.textAlign = "left";
    });
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText("Drag charges. Pink = positive, blue = negative.", 12, 18);
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
      </SimRow>
    </div>
  );
}

// ===================== MAGNETISM =====================
export function MagnetismSim() {
  const [mode, setMode] = useState<"wire" | "loop" | "charge">("wire");
  const [I, setI] = useState(5);
  const [v, setV] = useState(0.5);
  const phaseRef = useRef(0);
  const posRef = useRef(0.3);
  const ref = useCanvasLoop(({ ctx, w, h, t, fg, muted }) => {
    grid(ctx, w, h);
    const cx = w / 2, cy = h / 2;
    if (mode === "wire") {
      // wire vertical at center, current out of page representation? Use vertical wire with current up.
      ctx.strokeStyle = "#ffc46b"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(cx, 10); ctx.lineTo(cx, h - 10); ctx.stroke();
      arrow(ctx, cx, h - 10, cx, 10, "#ffc46b", 5, 10);
      // circular field
      const rings = 5;
      for (let ring = 1; ring <= rings; ring++) {
        const r = ring * 34;
        ctx.strokeStyle = `rgba(124,108,244,${0.7 - ring * 0.12})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        // arrowheads
        const n = 8;
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * Math.PI * 2 + t * (I > 0 ? 0.6 : -0.6);
          const ax = cx + r * Math.cos(ang), ay = cy + r * Math.sin(ang);
          const ta = ang + Math.PI / 2;
          arrow(ctx, ax, ay, ax + Math.cos(ta) * 8, ay + Math.sin(ta) * 8, `rgba(124,108,244,${0.8 - ring * 0.12})`, 1.5, 5);
        }
      }
      ctx.fillStyle = fg; ctx.font = "12px system-ui";
      ctx.fillText(`I = ${I} A upward → field circles counterclockwise (right-hand grip)`, 12, 20);
      ctx.fillText(`B = μ₀I/(2πr) — stronger near the wire`, 12, 38);
    } else if (mode === "loop") {
      const R = h * 0.3;
      ctx.strokeStyle = "#ffc46b"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.35, R, 0, 0, Math.PI * 2); ctx.stroke();
      // current direction arrows on loop
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + t * 0.8;
        const lx = cx + R * 0.35 * Math.cos(ang), ly = cy + R * Math.sin(ang);
        arrow(ctx, lx, ly, lx + 8 * Math.cos(ang + Math.PI / 2), ly + 4 * Math.sin(ang + Math.PI / 2), "#ffc46b", 2, 6);
      }
      // axis field line
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
      // charge in B field (into page ⊗)
      const B = 2;
      posRef.current += v * 0.004;
      const R = (v * 220) / B;
      const om = (v * 140) / R;
      phaseRef.current += om * 0.02;
      // B into page crosses
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
      ctx.fillText("Drag speed slider to see the radius change.", 12, 38);
    }
  });
  return (
    <div>
      <SimFrame height={320}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <div className="flex gap-2">
          {(["wire", "loop", "charge"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" style={mode === m ? { background: "var(--clay-primary-tint)", color: "var(--clay-primary-deep)" } : undefined}>{m}</button>
          ))}
        </div>
        <Slider label={mode === "charge" ? "Speed v" : "Current I"} value={mode === "charge" ? v : I} min={mode === "charge" ? 0.1 : 1} max={mode === "charge" ? 1.5 : 10} step={0.1} onChange={(nv) => (mode === "charge" ? setV(nv) : setI(nv))} />
      </SimRow>
    </div>
  );
}

// ===================== RC CIRCUIT =====================
export function RCSim() {
  const [V0, setV0] = useState(12);
  const [R, setR] = useState(10);
  const [C, setC] = useState(100);
  const [charging, setCharging] = useState(true);
  const tRef = useRef(0);
  const lastRef = useRef(performance.now());
  const traceRef = useRef<number[]>([]);
  const startRef = useRef(charging);
  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const now = performance.now();
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    if (startRef.current !== charging) { startRef.current = charging; tRef.current = 0; traceRef.current = []; }
    tRef.current += dt;
    const tau = (R * 1000 * C * 1e-6);
    const t = tRef.current;
    const q = charging ? 1 - Math.exp(-t / tau) : Math.exp(-t / tau);
    const i = charging ? Math.exp(-t / tau) : -Math.exp(-t / tau);
    traceRef.current.push(q);
    if (traceRef.current.length > 300) traceRef.current.shift();
    // circuit
    const bx = w * 0.12, by = h * 0.25, cw = w * 0.7, ch = h * 0.5;
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
    ctx.fillText(`${V0} V`, bx + cw * 0.35, by - 8);
    ctx.fillText("C", bx + cw + 14, by + ch * 0.5 + 4);
    ctx.fillText(`${R} kΩ`, bx + cw * 0.42, by + ch + 18);
    // meter
    ctx.fillStyle = fg;
    ctx.fillText(`q(t) = ${charging ? "" : "−"}${(Math.abs(q) * 100).toFixed(1)}% of Q_max    i = ${(i * (V0 / R) * 10).toFixed(2)} mA    τ = RC = ${tau.toFixed(1)} s`, 12, 20);
    // q(t) graph — q is a 0..1 fraction in both modes
    const gx = w * 0.55, gy = h * 0.14, gw = w * 0.4, gh = h * 0.72;
    ctx.strokeStyle = muted; ctx.lineWidth = 1; ctx.strokeRect(gx, gy, gw, gh);
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
  });
  return (
    <div>
      <SimFrame height={320}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="EMF" value={V0} min={2} max={24} onChange={setV0} format={(v) => `${v} V`} />
        <Slider label="R" value={R} min={1} max={50} onChange={setR} format={(v) => `${v} kΩ`} />
        <Slider label="C" value={C} min={10} max={500} onChange={setC} format={(v) => `${v} μF`} />
        <div className="flex gap-2">
          <button onClick={() => setCharging(true)} className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" style={charging ? { background: "var(--clay-primary-tint)", color: "var(--clay-primary-deep)" } : undefined}>Charge</button>
          <button onClick={() => setCharging(false)} className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" style={!charging ? { background: "var(--clay-primary-tint)", color: "var(--clay-primary-deep)" } : undefined}>Discharge</button>
        </div>
      </SimRow>
      <p className="mt-2 text-xs text-muted-foreground">τ = RC. After 1τ the capacitor holds ~63%, after ~5τ it's effectively full. Bigger R or C → slower.</p>
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
  const lastTRef = useRef(performance.now());
  const totalR = comps.filter((c) => c.type === "resistor" || c.type === "bulb").reduce((s, c) => s + c.value, 0);
  const I = totalR > 0 ? comps.find((c) => c.type === "battery")?.value ?? 0 / totalR : 0;
  const batV = comps.find((c) => c.type === "battery")?.value ?? 0;
  const current = totalR > 0 ? batV / totalR : 0;
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
    // current dots animated
    if (current > 0 && pts.length > 1) {
      const speed = Math.min(0.5, current * 0.35);
      for (let d = 0; d < 10; d++) {
        const prog = ((tRef.current * speed) + d / 10) % 1;
        const seg = Math.min(Math.floor(prog * pts.length), pts.length - 2);
        const f = prog * pts.length - seg;
        const X = pts[seg].x + (pts[seg + 1].x - pts[seg].x) * f;
        const Y = pts[seg].y + (pts[seg + 1].y - pts[seg].y) * f;
        ball(ctx, X, Y, 3.5, "#8fb8f7");
      }
    }
    // components
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
        ball(ctx, x, y, 12, current > 0 ? "#ffd98a" : "#c9c3dd");
        ctx.strokeStyle = muted; ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.fillStyle = fg;
        ctx.fillRect(x - 14, y - 8, 28, 4);
        ctx.fillRect(x - 14, y + 4, 28, 4);
      }
      ctx.restore();
    });
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`Series loop: R_eq = ${totalR.toFixed(1)} Ω, I = ${current.toFixed(2)} A, P = ${(batV * current).toFixed(1)} W`, 12, 18);
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
            if (hit) { setDragId(hit.id); setSel(hit.id); }
          }}
          onPointerMove={(e) => {
            if (dragId === null) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = Math.max(0.08, Math.min(0.92, (e.clientX - rect.left) / rect.width));
            const y = Math.max(0.12, Math.min(0.88, (e.clientY - rect.top) / rect.height));
            setComps((cs) => cs.map((c) => (c.id === dragId ? { ...c, x, y } : c)));
          }}
          onPointerUp={() => setDragId(null)}
        />
      </SimFrame>
      <SimRow>
        <button className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" onClick={() => setComps((cs) => [...cs, { id: Date.now(), type: "resistor", x: 0.3 + Math.random() * 0.4, y: 0.25, value: 2 + Math.floor(Math.random() * 9) }])}>+ Resistor</button>
        <button className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" onClick={() => setComps((cs) => [...cs, { id: Date.now(), type: "bulb", x: 0.3 + Math.random() * 0.4, y: 0.25, value: 5 }])}>+ Bulb</button>
        <button className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" onClick={() => setComps((cs) => [...cs, { id: Date.now(), type: "capacitor", x: 0.3 + Math.random() * 0.4, y: 0.25, value: 100 }])}>+ Capacitor</button>
        {sel !== null && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Selected:</span>
            <input
              type="range"
              min={comps.find((c) => c.id === sel)?.type === "battery" ? 1 : 1}
              max={comps.find((c) => c.id === sel)?.type === "battery" ? 24 : 20}
              value={comps.find((c) => c.id === sel)?.value ?? 5}
              onChange={(e) => setComps((cs) => cs.map((c) => (c.id === sel ? { ...c, value: parseFloat(e.target.value) } : c)))}
              className="h-2 w-32 accent-[var(--clay-4)]"
            />
            <button className="clay-sm clay-press px-2 py-1 text-xs" onClick={() => { setComps((cs) => cs.filter((c) => c.id !== sel)); setSel(null); }}>Delete</button>
          </div>
        )}
      </SimRow>
      <p className="mt-2 text-xs text-muted-foreground">Drag components to rearrange the loop. The loop is analyzed as a series circuit — total resistance and current update live. Junction-rule extension exercise: predict branch currents before adding a second loop.</p>
    </div>
  );
}

// ===================== OPTICS =====================
export function OpticsSim() {
  const [kind, setKind] = useState<"converging" | "diverging" | "mirror">("converging");
  const [objX, setObjX] = useState(0.32);
  const [f, setF] = useState(120);
  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const axisY = h * 0.5;
    const lensX = w * 0.55;
    // axis
    ctx.strokeStyle = muted; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(0, axisY); ctx.lineTo(w, axisY); ctx.stroke();
    ctx.setLineDash([]);
    const dobj = (objX * w) - 20;
    const ox = 20 + dobj; // object position from left
    const oh = 50;
    const sign = kind === "diverging" ? -1 : 1;
    const fpx = lensX - sign * f;
    // object arrow
    ctx.strokeStyle = "#6fd6c8"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ox, axisY); ctx.lineTo(ox, axisY - oh); ctx.stroke();
    // lens / mirror
    ctx.strokeStyle = fg; ctx.lineWidth = 3;
    if (kind === "mirror") {
      ctx.beginPath(); ctx.arc(lensX + 60, axisY, 70, Math.PI * 0.6, Math.PI * 1.4); ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(lensX, axisY, 7, 70, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(124,108,244,0.25)";
      ctx.fill(); ctx.stroke();
    }
    // focal points
    [fpx, lensX + sign * f].forEach((fx) => {
      ctx.fillStyle = "#ffc46b";
      ctx.beginPath(); ctx.arc(fx, axisY, 5, 0, Math.PI * 2); ctx.fill();
    });
    // rays (thin-lens/mirror equation with signed f: converging +, diverging −)
    const topY = axisY - oh;
    const fSigned = sign * f;
    const imageDist = (fSigned * dobj) / (dobj - fSigned); // standard 1/f = 1/do + 1/di
    const magn = -imageDist / dobj;
    const ih = oh * magn;
    const imgX = lensX + imageDist;
    // ray 1: parallel to axis then through focal point
    const rays: [number, number][][] = [];
    if (kind !== "mirror") {
      rays.push([[ox, topY], [lensX, topY], [imgX, axisY - ih]]);
      rays.push([[ox, topY], [lensX, axisY - ih]]);
    } else {
      rays.push([[ox, topY], [lensX, topY], [imgX, axisY - ih]]);
      rays.push([[ox, topY], [lensX, axisY - ih]]);
    }
    ctx.lineWidth = 1.5;
    rays.forEach((r) => {
      ctx.strokeStyle = "rgba(124,108,244,0.8)";
      ctx.beginPath();
      r.forEach(([X, Y], i) => { if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); });
      if (imgX > lensX) { // real image: stop at image
        ctx.stroke();
      } else {
        ctx.stroke();
        // extend backward dashed for virtual
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(124,108,244,0.35)";
        ctx.beginPath();
        const lastPt = r[r.length - 1];
        const dx = lastPt[0] - r[r.length - 2][0], dy = lastPt[1] - r[r.length - 2][1];
        ctx.moveTo(lastPt[0], lastPt[1]);
        ctx.lineTo(lastPt[0] - dx * 3, lastPt[1] - dy * 3);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
    // image arrow
    if (Math.abs(ih) < 1e6) {
      ctx.strokeStyle = "#ff8fb1"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(imgX, axisY); ctx.lineTo(imgX, axisY - ih); ctx.stroke();
      ctx.fillStyle = fg; ctx.font = "12px system-ui";
      const type = imageDist > 0 ? "real" : "virtual";
      const orient = magn < 0 ? "inverted" : "upright";
      ctx.fillText(`d_i = ${imageDist.toFixed(0)} px (${type})  m = ${magn.toFixed(2)} (${orient})`, 12, 20);
    }
    ctx.fillStyle = muted; ctx.font = "11px system-ui";
    ctx.fillText(`f = ${f} ${kind === "mirror" ? "" : "px"}   d_o = ${dobj.toFixed(0)} px`, 12, h - 10);
  });
  return (
    <div>
      <SimFrame height={320}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <div className="flex gap-2">
          {(["converging", "diverging", "mirror"] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)} className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" style={kind === k ? { background: "var(--clay-primary-tint)", color: "var(--clay-primary-deep)" } : undefined}>{k}</button>
          ))}
        </div>
        <Slider label="Object position" value={objX} min={0.06} max={0.5} step={0.01} onChange={setObjX} />
        <Slider label="Focal length" value={f} min={50} max={200} onChange={setF} format={(v) => `${v} px`} />
      </SimRow>
    </div>
  );
}

// ===================== WAVES =====================
export function WavesSim() {
  const [amp, setAmp] = useState(30);
  const [freq, setFreq] = useState(1.5);
  const [mode, setMode] = useState<"single" | "interference" | "doppler">("single");
  const [sep, setSep] = useState(0.25);
  const [srcV, setSrcV] = useState(0.35);
  const ref = useCanvasLoop(({ ctx, w, h, t, fg, muted }) => {
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
      // wavelength marker
      const lambda = 300 / freq;
      ctx.strokeStyle = "#ffc46b";
      ctx.beginPath();
      ctx.moveTo(40, midY + amp + 16); ctx.lineTo(40 + Math.min(lambda, w - 80), midY + amp + 16);
      ctx.stroke();
      ctx.fillStyle = fg; ctx.font = "12px system-ui";
      ctx.fillText(`λ = ${(lambda).toFixed(0)} px   v = fλ   f = ${freq.toFixed(1)} Hz`, 40, midY + amp + 32);
    } else if (mode === "interference") {
      const s1x = w * (0.5 - sep), s2x = w * (0.5 + sep), sy = h * 0.25;
      // wavefront circles
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
      ctx.fillText("Where circles cross in step → constructive (bright). Cross opposing → destructive (dark).", 12, h - 12);
    } else {
      // doppler
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
      // observer
      ctx.fillStyle = "#6fd6c8";
      ctx.beginPath(); ctx.arc(w * 0.82, h * 0.45, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = fg; ctx.font = "12px system-ui";
      ctx.fillText("Wavefronts bunch ahead of the moving source (higher pitch), stretch behind.", 12, 20);
    }
  });
  return (
    <div>
      <SimFrame height={320}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <div className="flex gap-2">
          {(["single", "interference", "doppler"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" style={mode === m ? { background: "var(--clay-primary-tint)", color: "var(--clay-primary-deep)" } : undefined}>{m}</button>
          ))}
        </div>
        <Slider label="Amplitude" value={amp} min={5} max={60} onChange={setAmp} />
        <Slider label="Frequency" value={freq} min={0.5} max={4} step={0.1} onChange={setFreq} format={(v) => `${v.toFixed(1)} Hz`} />
        {mode === "interference" && <Slider label="Separation" value={sep} min={0.05} max={0.45} step={0.01} onChange={setSep} />}
        {mode === "doppler" && <Slider label="Source speed" value={srcV} min={0.05} max={0.95} step={0.05} onChange={setSrcV} />}
      </SimRow>
    </div>
  );
}

// ===================== RADIOACTIVE DECAY =====================
export function DecaySim() {
  const [halfLife, setHalfLife] = useState(2);
  const [running, setRunning] = useState(true);
  const nucleivRef = useRef<number[]>([]);
  const initRef = useRef(0);
  const accRef = useRef(0);
  const historyRef = useRef<number[]>([]);
  if (nucleivRef.current.length === 0) {
    nucleivRef.current = Array.from({ length: 120 }, () => 0);
    initRef.current = 120;
  }
  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const dt = 1 / 60;
    if (running) {
      accRef.current += dt;
      const p = 1 - Math.pow(0.5, dt / halfLife);
      nucleivRef.current = nucleivRef.current.map((state) => (state === 0 && Math.random() < p ? 1 : state));
      historyRef.current.push(nucleivRef.current.filter((s) => s === 0).length);
      if (historyRef.current.length > 400) historyRef.current.shift();
    }
    // grid of nuclei
    const cols = 15;
    nucleivRef.current.forEach((state, i) => {
      const cx = 20 + (i % cols) * ((w * 0.55) / cols) + 10;
      const cy = 30 + Math.floor(i / cols) * 26;
      ball(ctx, cx, cy, 8, state === 0 ? "#7c6cf4" : "#c9c3dd");
    });
    // decay curve
    const gx = w * 0.62, gy = h * 0.15, gw = w * 0.34, gh = h * 0.7;
    ctx.strokeStyle = muted; ctx.strokeRect(gx, gy, gw, gh);
    ctx.strokeStyle = "#ff8fb1"; ctx.lineWidth = 2;
    ctx.beginPath();
    const total = historyRef.current.length;
    historyRef.current.forEach((n, i) => {
      const X = gx + (i / Math.max(1, total - 1)) * gw;
      const Y = gy + gh - (n / initRef.current) * gh;
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    });
    ctx.stroke();
    // half-life lines
    for (let k = 1; k <= 3; k++) {
      const X = gx + ((k * halfLife) / (total * (1 / 60))) * gw;
      if (X < gx + gw) {
        ctx.strokeStyle = "rgba(255,196,107,0.5)"; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(X, gy); ctx.lineTo(X, gy + gh); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#ffc46b"; ctx.font = "10px system-ui";
        ctx.fillText(`${k}·t½`, X - 8, gy - 4);
      }
    }
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`Remaining: ${nucleivRef.current.filter((s) => s === 0).length}/${initRef.current}   t½ = ${halfLife} s`, 12, h - 8);
  });
  return (
    <div>
      <SimFrame height={300}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="Half-life" value={halfLife} min={0.5} max={6} step={0.5} onChange={setHalfLife} format={(v) => `${v} s`} />
        <button className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" onClick={() => setRunning(!running)}>{running ? "Pause" : "Play"}</button>
        <button className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" onClick={() => { nucleivRef.current = Array.from({ length: 120 }, () => 0); historyRef.current = []; }}>Reset sample</button>
      </SimRow>
      <p className="mt-2 text-xs text-muted-foreground">Each nucleus decays randomly, yet the population halves like clockwork — probability becoming law at scale.</p>
    </div>
  );
}

// ===================== PHOTOELECTRIC =====================
export function PhotoelectricSim() {
  const [wavelength, setWavelength] = useState(400);
  const [intensity, setIntensity] = useState(5);
  const workFunction = 2.3; // eV, sodium-ish
  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const c = 3e8;
    const E = 1240 / wavelength; // eV
    const ejects = E > workFunction;
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
    // electrons
    if (ejects) {
      const ke = (E - workFunction) / 3;
      for (let i = 0; i < intensity; i++) {
        const ex = w * 0.45 + 20 + ((performance.now() / 8 + i * 33) % (w * 0.4));
        const spread = Math.sin(i * 2.1 + performance.now() / 300) * 18;
        ball(ctx, ex, h * 0.4 + spread, 5, "#6fd6c8");
        if (i % 2 === 0) arrow(ctx, ex, h * 0.4 + spread, ex + 10 + ke * 26, h * 0.4 + spread, "rgba(111,214,200,0.6)", 1.5, 5);
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
  });
  return (
    <div>
      <SimFrame height={300}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="Wavelength" value={wavelength} min={200} max={750} onChange={setWavelength} format={(v) => `${v} nm`} />
        <Slider label="Intensity" value={intensity} min={1} max={10} onChange={setIntensity} />
      </SimRow>
    </div>
  );
}

// ===================== ORBITAL =====================
export function OrbitalSim() {
  const [speed, setSpeed] = useState(1);
  const [radius, setRadius] = useState(120);
  const phaseRef = useRef(0);
  const lastRef = useRef(performance.now());
  const trailRef = useRef<[number, number][]>([]);
  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const now = performance.now();
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const omega = (speed * 1.2) / Math.pow(radius / 100, 1.5); // Kepler: T² ∝ r³
    phaseRef.current += omega * dt;
    const cx = w * 0.45, cy = h * 0.5;
    trailRef.current.push([cx + radius * Math.cos(phaseRef.current), cy + radius * Math.sin(phaseRef.current)]);
    if (trailRef.current.length > 200) trailRef.current.shift();
    // planet
    ball(ctx, cx, cy, 16, "#ffc46b");
    // trail
    ctx.strokeStyle = "rgba(124,108,244,0.4)"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    trailRef.current.forEach(([X, Y], i) => { if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); });
    ctx.stroke();
    const sx = cx + radius * Math.cos(phaseRef.current), sy = cy + radius * Math.sin(phaseRef.current);
    ball(ctx, sx, sy, 8, "#7c6cf4");
    // velocity arrow
    arrow(ctx, sx, sy, sx - Math.sin(phaseRef.current) * speed * 22, sy + Math.cos(phaseRef.current) * speed * 22, "#8fb8f7", 2);
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`v = √(GM/r) → closer orbits move faster. Current r: ${(radius / 40).toFixed(1)}, ω = ${omega.toFixed(2)} rad/s`, 12, 20);
  });
  return (
    <div>
      <SimFrame height={300}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="Orbit radius" value={radius} min={50} max={170} onChange={setRadius} format={(v) => `${v}`} />
        <Slider label="Launch speed" value={speed} min={0.5} max={2} step={0.1} onChange={setSpeed} />
      </SimRow>
    </div>
  );
}

// ===================== CALCULUS EXPLORER =====================
export function CalculusSim() {
  const [func, setFunc] = useState<"quad" | "sin" | "exp">("quad");
  const [xPos, setXPos] = useState(0.4);
  const [showArea, setShowArea] = useState(true);
  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const gx = w * 0.08, gy = h * 0.18, gw = w * 0.84, gh = h * 0.62;
    const f = (x: number) => (func === "quad" ? 0.6 * x * x : func === "sin" ? Math.sin(x * 3) * 0.7 + 0.3 : Math.exp(x) / Math.exp(1.6) * 0.9);
    const df = (x: number) => (func === "quad" ? 1.2 * x : func === "sin" ? 3 * Math.cos(x * 3) * 0.7 : Math.exp(x) / Math.exp(1.6) * 0.9);
    const toX = (x: number) => gx + x * gw;
    const toY = (y: number) => gy + gh - y * gh;
    // axes
    ctx.strokeStyle = muted; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();
    // area under curve
    if (showArea) {
      ctx.fillStyle = "rgba(111,214,200,0.25)";
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(0));
      for (let i = 0; i <= 40; i++) { const x = (i / 40) * xPos; ctx.lineTo(toX(x), toY(f(x))); }
      ctx.lineTo(toX(xPos), toY(0));
      ctx.closePath(); ctx.fill();
    }
    // curve
    ctx.strokeStyle = "#7c6cf4"; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) { const x = (i / 100) * 1.6; if (i === 0) ctx.moveTo(toX(x), toY(f(x))); else ctx.lineTo(toX(x), toY(f(x))); }
    ctx.stroke();
    // tangent
    const x = xPos * 1.6;
    const slope = df(x);
    ctx.strokeStyle = "#ff8fb1"; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toX(x - 0.25), toY(f(x) - slope * 0.25));
    ctx.lineTo(toX(x + 0.25), toY(f(x) + slope * 0.25));
    ctx.stroke();
    ball(ctx, toX(x), toY(f(x)), 6, "#ff8fb1");
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`x = ${x.toFixed(2)}   f(x) = ${f(x).toFixed(2)}   slope f′(x) = ${slope.toFixed(2)}   area ∫₀^x = ${(() => { let s = 0; for (let i = 0; i < 100; i++) s += f((i / 100) * x) * (x / 100); return s.toFixed(2); })()}`, 12, 20);
    ctx.fillStyle = muted; ctx.font = "11px system-ui";
    ctx.fillText("Pink tangent = derivative (instantaneous rate). Teal area = integral (accumulation). Drag the probe.", 12, h - 10);
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
      </SimRow>
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
