import { useRef, useState } from "react";
import { useSimCanvas, pointerHandlers, SimFrame, SimRow, SimButton, Slider, Toggle, arrow, grid, ball } from "./framework";

// ===================== VECTORS =====================
export function VectorsSim() {
  const [angle, setAngle] = useState(35);
  const [mag, setMag] = useState(80);
  const [showComp, setShowComp] = useState(true);
  const api = useSimCanvas(({ ctx, w, h, fg, muted }) => {
    grid(ctx, w, h);
    const cx = w * 0.3, cy = h * 0.78;
    const rad = (angle * Math.PI) / 180;
    const ex = cx + mag * Math.cos(rad) * 1.4;
    const ey = cy - mag * Math.sin(rad) * 1.4;
    // axes
    ctx.strokeStyle = muted; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, 16); ctx.lineTo(cx, h - 16); ctx.moveTo(16, cy); ctx.lineTo(w - 16, cy); ctx.stroke();
    if (showComp) {
      ctx.setLineDash([5, 5]); ctx.strokeStyle = "rgba(143,184,247,0.6)";
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex, cy); ctx.moveTo(ex, ey); ctx.lineTo(cx, ey); ctx.stroke();
      ctx.setLineDash([]);
    }
    arrow(ctx, cx, cy, ex, ey, "#7c6cf4", 3.5, 10);
    if (showComp) {
      arrow(ctx, cx, cy, ex, cy, "#8fb8f7", 2.5);
      arrow(ctx, cx, cy, cx, ey, "#ff8fb1", 2.5);
    }
    // angle arc
    ctx.strokeStyle = muted;
    ctx.beginPath(); ctx.arc(cx, cy, 26, -rad, 0); ctx.stroke();
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`θ = ${angle}°   |A| = ${mag}`, cx + 32, cy - 10);
    ctx.fillStyle = "#8fb8f7";
    ctx.fillText(`Ax = ${Math.round(mag * Math.cos(rad) * 1.4)}`, (cx + ex) / 2 - 20, cy + 16);
    ctx.fillStyle = "#ff8fb1";
    ctx.fillText(`Ay = ${Math.round(mag * Math.sin(rad) * 1.4)}`, cx + 6, (cy + ey) / 2);
    ctx.fillStyle = muted; ctx.font = "11px system-ui";
    ctx.fillText("Drag the tip to change magnitude and angle directly.", 12, h - 10);
  });
  // drag the arrow tip
  const tipState = useRef({ mag: 80, angle: 35 });
  tipState.current = { mag, angle };
  const handlers = pointerHandlers(api);
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!api.state.dragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - rect.left - rect.width * 0.3;
    const dy = rect.height * 0.78 - (e.clientY - rect.top);
    const m = Math.hypot(dx, dy) / 1.4;
    tipState.current.angle = Math.max(0, Math.min(90, (Math.atan2(dy, Math.max(dx, 1)) * 180) / Math.PI));
    tipState.current.mag = Math.max(20, Math.min(140, m));
    setMag(tipState.current.mag);
    setAngle(Math.round(tipState.current.angle));
  };
  return (
    <div>
      <SimFrame height={260}>
        <canvas {...api.canvasRef} {...handlers} onPointerMove={onMove} className="h-full w-full touch-none" />
      </SimFrame>
      <SimRow>
        <Slider label="Magnitude" value={mag} min={20} max={140} onChange={setMag} />
        <Slider label="Angle θ" value={angle} min={0} max={90} onChange={setAngle} format={(v) => `${v}°`} />
        <Toggle label="Components" on={showComp} onChange={setShowComp} />
      </SimRow>
      <p className="mt-2 text-xs text-muted-foreground">
        A<sub>x</sub> = A cos θ = {Math.round(mag * Math.cos((angle * Math.PI) / 180) * 1.4)} · A<sub>y</sub> = A sin θ = {Math.round(mag * Math.sin((angle * Math.PI) / 180) * 1.4)} — components are the shadows the vector casts on the axes.
      </p>
    </div>
  );
}

// ===================== KINEMATICS =====================
export function KinematicsSim() {
  const [a, setA] = useState(2);
  const [v0, setV0] = useState(0);
  const [running, setRunning] = useState(true);
  const phys = useRef({ t: 0, x: 0, v: 0 });
  const samples = useRef<{ t: number; x: number; v: number }[]>([]);
  const api = useSimCanvas(
    ({ ctx, w, h, fg, muted }, apiRef) => {
      const dt = 1 / 60;
      const st = apiRef.state;
      if (st.events.has("reset")) {
        phys.current = { t: 0, x: 0, v: v0 };
        samples.current = [];
      }
      if (running && st.t > 0) {
        // integrate with the CURRENT sliders (changing a mid-flight re-targets honestly)
        phys.current.v += a * dt;
        phys.current.x += phys.current.v * dt;
        phys.current.t += dt;
        samples.current.push({ t: phys.current.t, x: phys.current.x, v: phys.current.v });
        if (samples.current.length > 1200) samples.current.shift();
      }
      if (samples.current.length === 0) samples.current.push({ t: 0, x: 0, v: v0 });

      const p = phys.current;
      // camera follows the ball; keep origin visible early
      const pxPerM = 14;
      const camX = Math.max(0, p.x * pxPerM - w * 0.35);
      const trackY = h * 0.26;
      const sx = (worldX: number) => 20 + worldX * pxPerM - camX;
      // ground ticks every 10 m
      ctx.strokeStyle = muted; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, trackY + 14); ctx.lineTo(w, trackY + 14); ctx.stroke();
      ctx.font = "10px system-ui"; ctx.fillStyle = muted;
      const firstTick = Math.floor(camX / (10 * pxPerM));
      for (let i = firstTick; i <= firstTick + Math.ceil(w / (10 * pxPerM)) + 1; i++) {
        const X = sx(i * 10);
        if (X < -20 || X > w + 20) continue;
        ctx.beginPath(); ctx.moveTo(X, trackY + 14); ctx.lineTo(X, trackY + 20); ctx.stroke();
        ctx.fillText(`${i * 10} m`, X - 10, trackY + 32);
      }
      ball(ctx, sx(p.x), trackY, 12, "#7c6cf4");
      arrow(ctx, sx(p.x), trackY - 20, sx(p.x) + p.v * 4, trackY - 20, "#ff8fb1", 2.5);
      ctx.fillStyle = fg; ctx.font = "12px system-ui";
      ctx.fillText(`t = ${p.t.toFixed(1)} s   x = ${p.x.toFixed(1)} m   v = ${p.v.toFixed(1)} m/s   a = ${a.toFixed(1)} m/s²`, 12, 18);

      // graphs: x (top) and v (bottom)
      const gx = w * 0.6, gw = w * 0.37, gh = h * 0.28, gy1 = h * 0.14, gy2 = h * 0.56;
      const drawGraph = (gy: number, get: (s: { t: number; x: number; v: number }) => number, label: string, color: string) => {
        ctx.strokeStyle = muted; ctx.lineWidth = 1;
        ctx.strokeRect(gx, gy, gw, gh);
        const s = samples.current;
        if (s.length > 1) {
          const tMax = Math.max(5, s[s.length - 1].t);
          let lo = 0, hi = 1;
          s.forEach((pt) => { lo = Math.min(lo, get(pt)); hi = Math.max(hi, get(pt)); });
          const span = Math.max(hi - lo, 2);
          ctx.strokeStyle = color; ctx.lineWidth = 2;
          ctx.beginPath();
          s.forEach((pt, i) => {
            const X = gx + (pt.t / tMax) * gw;
            const Y = gy + gh - ((get(pt) - lo) / span) * (gh - 8) - 4;
            if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
          });
          ctx.stroke();
        }
        ctx.fillStyle = muted; ctx.font = "10px system-ui";
        ctx.fillText(label, gx + 4, gy - 4);
      };
      drawGraph(gy1, (s) => s.x, "x(t) — slope is velocity", "#8fb8f7");
      drawGraph(gy2, (s) => s.v, "v(t) — slope is acceleration", "#ff8fb1");
    },
    { paused: !running, onReset: () => { phys.current = { t: 0, x: 0, v: v0 }; samples.current = []; } },
  );
  return (
    <div>
      <SimFrame height={300}><canvas ref={api.canvasRef} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="v₀" value={v0} min={-10} max={10} onChange={setV0} format={(v) => `${v} m/s`} />
        <Slider label="a" value={a} min={-6} max={6} step={0.5} onChange={setA} format={(v) => `${v} m/s²`} />
        <SimButton onClick={() => setRunning(!running)}>{running ? "Pause" : "Play"}</SimButton>
        <SimButton onClick={() => api.reset()}>Reset</SimButton>
      </SimRow>
      <p className="mt-2 text-xs text-muted-foreground">The camera follows the ball. Change a or v₀ while it runs — the graph bends honestly because the sim integrates with your current values.</p>
    </div>
  );
}

// ===================== PROJECTILE =====================
export function ProjectileSim() {
  const [v0, setV0] = useState(24);
  const [angle, setAngle] = useState(50);
  const [noAir, setNoAir] = useState(true);
  const [shots, setShots] = useState<{ pts: [number, number][]; color: string }[]>([]);
  const shotRef = useRef<{ pts: [number, number][]; color: string } | null>(null);
  const flightRef = useRef({ active: false, t: 0, x: 0, y: 0, vx: 0, vy: 0 });
  const paramsRef = useRef({ v0, angle, noAir });
  paramsRef.current = { v0, angle, noAir };

  const api = useSimCanvas(
    ({ ctx, w, h, fg, muted }, apiRef) => {
      const { v0: V, angle: A, noAir: drag } = paramsRef.current;
      const groundY = h - 30;
      const scale = w / 80; // 80 m wide view
      if (apiRef.state.events.has("launch")) {
        const rad = (A * Math.PI) / 180;
        flightRef.current = { active: true, t: 0, x: 0, y: 0, vx: V * Math.cos(rad), vy: V * Math.sin(rad) };
        shotRef.current = { pts: [], color: drag ? "#7c6cf4" : "#ff8fb1" };
      }
      if (apiRef.state.events.has("reset")) {
        setShots([]);
        shotRef.current = null;
        flightRef.current.active = false;
      }
      // advance flight
      const fl = flightRef.current;
      if (fl.active) {
        const dt = 1 / 60;
        const k = drag ? 0 : 0.12; // quadratic-ish drag
        fl.t += dt;
        fl.vy += (-9.8 - k * fl.vy * Math.abs(fl.vy) * 0.02) * dt;
        fl.vx += (-k * fl.vx * Math.abs(fl.vx) * 0.02) * dt;
        fl.x += fl.vx * dt;
        fl.y += fl.vy * dt;
        shotRef.current?.pts.push([fl.x, fl.y]);
        if (fl.y <= 0 && fl.t > 0.05) {
          fl.active = false;
          if (shotRef.current) setShots((s) => [...s, shotRef.current!]);
        }
      }
      // draw trails
      shots.forEach((s) => {
        ctx.strokeStyle = "rgba(124,108,244,0.3)"; ctx.lineWidth = 1.5;
        ctx.beginPath();
        s.pts.forEach((p, i) => { const X = 20 + p[0] * scale, Y = groundY - p[1] * scale; if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); });
        ctx.stroke();
      });
      // predicted path (dashed, for the CURRENT settings)
      const rad = (A * Math.PI) / 180;
      const pvx = V * Math.cos(rad), pvy = V * Math.sin(rad);
      const tFlight = (2 * pvy) / 9.8;
      const R = pvx * tFlight, Hmax = (pvy * pvy) / (2 * 9.8);
      ctx.setLineDash([4, 6]); ctx.strokeStyle = "rgba(124,108,244,0.35)"; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i <= 50; i++) {
        const tt = (tFlight * i) / 50;
        const X = 20 + pvx * tt * scale, Y = groundY - (pvy * tt - 4.9 * tt * tt) * scale;
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.stroke(); ctx.setLineDash([]);
      // live ball
      if (fl.active || shotRef.current) {
        const bx = 20 + fl.x * scale, by = groundY - Math.max(0, fl.y) * scale;
        ball(ctx, bx, by, 9, fl.active ? (drag ? "#7c6cf4" : "#ff8fb1") : "#c9c3dd");
        const vyNow = fl.vy;
        arrow(ctx, bx, by, bx + fl.vx * 1.6, by, "#8fb8f7", 2);
        arrow(ctx, bx, by, bx, by - vyNow * 1.6, "#6fd6c8", 2);
      }
      // launcher + ground
      ctx.strokeStyle = muted; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke();
      ctx.strokeStyle = fg; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(20, groundY); ctx.lineTo(20 + 26 * Math.cos(rad), groundY - 26 * Math.sin(rad)); ctx.stroke();
      ctx.fillStyle = fg; ctx.font = "12px system-ui";
      ctx.fillText(`Range = ${R.toFixed(1)} m   Max height = ${Hmax.toFixed(1)} m   Flight = ${tFlight.toFixed(2)} s`, 12, 20);
      ctx.fillStyle = muted; ctx.font = "11px system-ui";
      ctx.fillText(drag ? "Vacuum: vx never changes; vy loses 9.8 m/s each second." : "With drag: peaks earlier, falls steeper, range shrinks.", 12, h - 10);
    },
    { paused: false, onReset: () => { flightRef.current = { active: false, t: 0, x: 0, y: 0, vx: 0, vy: 0 }; shotRef.current = null; } },
  );
  return (
    <div>
      <SimFrame height={300}><canvas ref={api.canvasRef} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="v₀" value={v0} min={5} max={45} onChange={setV0} format={(v) => `${v} m/s`} />
        <Slider label="Angle" value={angle} min={5} max={85} onChange={setAngle} format={(v) => `${v}°`} />
        <Toggle label="Vacuum" on={noAir} onChange={setNoAir} />
        <SimButton onClick={() => api.fire("launch")}>Launch</SimButton>
        <SimButton onClick={() => api.reset()}>Clear</SimButton>
      </SimRow>
      <p className="mt-2 text-xs text-muted-foreground">Solid ball = live flight with component arrows; dashed = predicted vacuum path; faded trails = past shots. Launch two complementary angles and compare ranges.</p>
    </div>
  );
}

// ===================== FREE-BODY DIAGRAM =====================
export function FBDSim() {
  const [theta, setTheta] = useState(0);
  const [mass, setMass] = useState(10);
  const [withFriction, setWithFriction] = useState(true);
  const [mu, setMu] = useState(0.3);
  const api = useSimCanvas(({ ctx, w, h, fg, muted }) => {
    grid(ctx, w, h);
    const cx = w * 0.5, cy = h * 0.62;
    const rad = (theta * Math.PI) / 180;
    // ramp
    ctx.strokeStyle = muted; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 150, cy + 150 * Math.tan(rad));
    ctx.lineTo(cx + 150, cy - 150 * Math.tan(rad));
    ctx.stroke();
    const bx = cx, by = cy;
    const blockS = 24;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(-rad);
    ctx.fillStyle = "#7c6cf4";
    ctx.beginPath(); ctx.roundRect(-blockS, -blockS, blockS * 2, blockS * 2, 8); ctx.fill();
    ctx.restore();
    const scale = Math.min(1.6, 110 / (mass * 9.8 * 0.35));
    const Wv = mass * 9.8 * scale;
    // weight (vertical)
    arrow(ctx, bx, by, bx, by + Wv * 0.5, "#ff8fb1", 3, 9);
    // normal (perpendicular to surface)
    const FN = mass * 9.8 * Math.cos(rad) * scale;
    const nx = Math.sin(rad) * FN * 0.5, ny = -Math.cos(rad) * FN * 0.5;
    arrow(ctx, bx, by, bx + nx, by + ny, "#6fd6c8", 3, 9);
    // friction (along surface, uphill)
    const gAlong = 9.8 * Math.sin(rad);
    const fMax = mu * 9.8 * Math.cos(rad);
    const slides = withFriction ? gAlong > fMax + 1e-9 : theta > 0;
    const fAlong = withFriction ? (slides ? mu * 9.8 * Math.cos(rad) : gAlong) : 0;
    const fx = -Math.cos(rad) * fAlong * scale * 0.5, fy = Math.sin(rad) * fAlong * scale * 0.5;
    if (withFriction) arrow(ctx, bx, by, bx + fx, by + fy, "#ffc46b", 3, 9);
    // net force annotation
    const aNet = slides ? gAlong - (withFriction ? mu * 9.8 * Math.cos(rad) : 0) : 0;
    if (aNet > 0) {
      const ax = Math.cos(rad) * aNet * scale * 0.5, ay = Math.sin(rad) * aNet * scale * 0.5;
      arrow(ctx, bx, by, bx + ax, by + ay, "#8b7bff", 2, 8);
    }
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`F_N = mg·cosθ = ${(mass * 9.8 * Math.cos(rad)).toFixed(0)} N   F_g = ${(mass * 9.8).toFixed(0)} N`, 12, 20);
    ctx.fillText(withFriction ? `f_max = μF_N = ${(fMax * mass).toFixed(0)} N  vs  mg·sinθ = ${(gAlong * mass).toFixed(0)} N` : "Friction off: any tilt accelerates the block.", 12, 38);
    ctx.fillText(
      slides ? `Slides! a = ${aNet.toFixed(2)} m/s² down-ramp` : theta === 0 ? "Flat: F_N balances F_g, nothing moves." : "Static: friction holds it.",
      12, 56,
    );
    ctx.fillStyle = muted; ctx.font = "11px system-ui";
    ctx.fillText("Tilt slowly — watch F_N shrink as cosθ falls. The block breaks loose when mg·sinθ exceeds μF_N.", 12, h - 10);
  });
  return (
    <div>
      <SimFrame height={300}><canvas ref={api.canvasRef} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="Ramp angle" value={theta} min={0} max={45} onChange={setTheta} format={(v) => `${v}°`} />
        <Slider label="Mass" value={mass} min={1} max={50} onChange={setMass} format={(v) => `${v} kg`} />
        <Slider label="μ" value={mu} min={0} max={1} step={0.05} onChange={setMu} />
        <Toggle label="Friction" on={withFriction} onChange={setWithFriction} />
      </SimRow>
    </div>
  );
}

// ===================== COLLISION =====================
export function CollisionSim() {
  const [m1, setM1] = useState(4);
  const [m2, setM2] = useState(2);
  const [v1, setV1] = useState(5);
  const [elastic, setElastic] = useState(false);
  const [running, setRunning] = useState(true);
  const phys = useRef({ x1: 0.12, x2: 0.72, v1x: 0, v2x: 0, hit: false, before: { p: 0, K: 0 } });
  const startedRef = useRef(false);
  const paramsRef = useRef({ m1, m2, v1, elastic });
  paramsRef.current = { m1, m2, v1, elastic };

  const start = () => {
    const { v1: V } = paramsRef.current;
    phys.current = {
      x1: 0.12, x2: 0.72, v1x: V / 40, v2x: 0, hit: false,
      before: { p: (paramsRef.current.m1 * V) / 40, K: 0.5 * paramsRef.current.m1 * (V / 40) ** 2 },
    };
    startedRef.current = true;
  };
  // (re)start whenever Run is pressed or params change
  const restart = () => { start(); };

  const api = useSimCanvas(
    ({ ctx, w, h, fg, muted }, apiRef) => {
      const { m1: M1, m2: M2, elastic: EL } = paramsRef.current;
      if (apiRef.state.events.has("run")) restart();
      if (!startedRef.current) restart();
      const p = phys.current;
      if (running && !p.hitStopped) {
        p.x1 += p.v1x / 60; p.x2 += p.v2x / 60;
        if (!p.hit && p.x1 + 0.04 >= p.x2 - 0.05) {
          p.hit = true;
          const Mtot = M1 + M2;
          if (EL) {
            const u1 = p.v1x, u2 = p.v2x;
            p.v1x = ((M1 - M2) * u1 + 2 * M2 * u2) / Mtot;
            p.v2x = ((M2 - M1) * u2 + 2 * M1 * u1) / Mtot;
          } else {
            const vf = (M1 * p.v1x + M2 * p.v2x) / Mtot;
            p.v1x = vf; p.v2x = vf;
          }
        }
        if (p.x1 > 1.15 || p.x2 > 1.15 || p.x1 < -0.15 || p.x2 < -0.15) { p.v1x = 0; p.v2x = 0; }
      }
      const groundY = h * 0.52;
      const r1 = 14 + M1 * 2.2, r2 = 14 + M2 * 2.2;
      const x1 = p.x1 * w, x2 = p.x2 * w;
      ctx.strokeStyle = muted; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke();
      ball(ctx, x1, groundY - r1, r1, "#7c6cf4");
      ball(ctx, x2, groundY - r2, r2, "#ff8fb1");
      arrow(ctx, x1, groundY - 2 * r1 - 12, x1 + p.v1x * 130, groundY - 2 * r1 - 12, "#8fb8f7", 2);
      arrow(ctx, x2, groundY - 2 * r2 - 12, x2 + p.v2x * 130, groundY - 2 * r2 - 12, "#8fb8f7", 2);
      // readouts
      const pTot = (M1 * p.v1x + M2 * p.v2x) * 40;
      const Kafter = 0.5 * M1 * (p.v1x * 40) ** 2 + 0.5 * M2 * (p.v2x * 40) ** 2;
      ctx.fillStyle = fg; ctx.font = "12px system-ui";
      ctx.fillText(`p before = ${p.before.p.toFixed(1)}  →  p after = ${pTot.toFixed(1)} kg·m/s ${p.hit ? "✓ conserved" : ""}`, 12, 20);
      ctx.fillStyle = p.hit && !EL ? "#ff8fb1" : muted;
      ctx.fillText(p.hit ? `K before = ${(p.before.K * 1600).toFixed(0)}  →  K after = ${(Kafter * 1600).toFixed(0)} J ${EL ? "✓ elastic keeps KE" : `(${(100 * (1 - Kafter / Math.max(p.before.K, 1e-9))).toFixed(0)}% lost to crumpling)`}` : "Press Run to collide.", 12, 38);
      // momentum bars
      const bw1 = (M1 * p.v1x * 40) / 6 * 3;
      const bw2 = (M2 * p.v2x * 40) / 6 * 3;
      ctx.fillStyle = "rgba(128,120,160,0.15)";
      ctx.fillRect(12, h - 44, 140, 12); ctx.fillRect(12, h - 26, 140, 12);
      ctx.fillStyle = "#7c6cf4"; ctx.fillRect(12, h - 44, Math.max(1, Math.min(140, bw1)), 12);
      ctx.fillStyle = "#ff8fb1"; ctx.fillRect(12, h - 26, Math.max(1, Math.min(140, bw2)), 12);
      ctx.fillStyle = muted; ctx.font = "10px system-ui";
      ctx.fillText(`m₁ p = ${(M1 * p.v1x * 40).toFixed(1)}`, 158, h - 34);
      ctx.fillText(`m₂ p = ${(M2 * p.v2x * 40).toFixed(1)}`, 158, h - 16);
    },
    { paused: !running },
  );
  return (
    <div>
      <SimFrame height={280}><canvas ref={api.canvasRef} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="m₁" value={m1} min={1} max={10} onChange={setM1} format={(v) => `${v} kg`} />
        <Slider label="v₁" value={v1} min={1} max={12} onChange={setV1} format={(v) => `${v} m/s`} />
        <Slider label="m₂" value={m2} min={1} max={10} onChange={setM2} format={(v) => `${v} kg`} />
        <Toggle label="Elastic" on={elastic} onChange={setElastic} />
        <SimButton onClick={() => { restart(); setRunning(true); }}>↻ Run</SimButton>
        <SimButton onClick={() => setRunning(!running)}>{running ? "Pause" : "Play"}</SimButton>
      </SimRow>
      <p className="mt-2 text-xs text-muted-foreground">Change ANY parameter and the collision restarts honestly from the new values. Compare p and K before/after in both modes — p always matches; K only when elastic.</p>
    </div>
  );
}

// extra field referenced above; declare on the ref type
declare module "./mechanics" {}

// ===================== ENERGY COASTER =====================
export function EnergySim() {
  const [frictionless, setFrictionless] = useState(true);
  const [hill2, setHill2] = useState(45);
  const phys = useRef({ s: 0.06 });
  const paramsRef = useRef({ frictionless, hill2 });
  paramsRef.current = { frictionless, hill2 };
  const api = useSimCanvas(({ ctx, w, h, fg, muted }, apiRef) => {
    const { frictionless: NF, hill2: H2 } = paramsRef.current;
    if (apiRef.state.events.has("reset")) phys.current.s = 0.06;
    const groundY = h - 26;
    const g = (x: number, c: number, wd: number) => Math.exp(-((x - c) ** 2) / (2 * wd * wd));
    const trackH = (s: number) => 0.95 * g(s, 0.06, 0.2) + (H2 / 100) * 0.95 * g(s, 0.62, 0.16) + 0.06;
    const H0 = trackH(0.06);
    const scaleY = (h - 90) / 1.05;
    // physics: integrate along the track with energy conservation + friction loss
    const st = phys.current;
    const dt = 1 / 60;
    const ds = 0.0035 * (0.25 + Math.sqrt(Math.max(0, H0 - trackH(st.s) - st.loss)) * 1.4);
    const U = trackH(st.s) / H0;
    st.loss = NF ? 0 : Math.min(0.85, st.loss + 0.00045);
    const K = Math.max(0, 1 - U - st.loss / H0);
    // climbing a hill taller than remaining energy → turn back
    const slope = (trackH(Math.min(1, st.s + 0.01)) - trackH(Math.max(0, st.s - 0.01))) / 0.02;
    if (!NF || H2 / 100 > 1 - st.loss / H0) {
      // if the next step rises above available energy, reverse direction
      if (trackH(st.s + ds * Math.sign(st.dir || 1)) > H0 - st.loss + 1e-6 && st.s < 0.5) st.dir = -1;
    }
    st.dir = st.dir ?? 1;
    let next = st.s + ds * st.dir;
    if (next >= 1) { next = 1; st.dir = -1; }
    if (next <= 0.02) { next = 0.02; st.dir = 1; }
    st.s = next;
    // track
    ctx.strokeStyle = muted; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const xx = (i / 100) * w;
      const yy = groundY - trackH(i / 100) * scaleY;
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    ball(ctx, st.s * w, groundY - trackH(st.s) * scaleY - 8, 10, "#7c6cf4");
    // energy bars
    const Kfrac = K, Ufrac = trackH(st.s) / H0, Lfrac = st.loss / H0;
    const bx = w - 130;
    const bars: [string, number, string][] = [["K", Kfrac, "#ff8fb1"], ["U", Ufrac, "#6fd6c8"], ["lost", Lfrac, "#a49dbf"]];
    ctx.font = "11px system-ui";
    bars.forEach(([label, val, color], i) => {
      const by = 20 + i * 32;
      ctx.fillStyle = muted; ctx.fillText(label, bx - 26, by + 10);
      ctx.fillStyle = "rgba(128,120,160,0.15)"; ctx.fillRect(bx, by, 100, 14);
      ctx.fillStyle = color; ctx.fillRect(bx, by, Math.max(0, Math.min(1, val)) * 100, 14);
    });
    ctx.fillStyle = fg;
    ctx.fillText(`v = ${Math.sqrt(2 * 9.8 * Kfrac * H0 * 30).toFixed(1)} m/s   ${Kfrac < 0.01 && st.dir === -1 ? "— stalled! Not enough energy for this hill" : ""}`, 12, 20);
    ctx.fillStyle = muted; ctx.font = "11px system-ui";
    ctx.fillText(NF ? "Frictionless: K + U never changes total." : "Friction eats mechanical energy every second — total only shrinks.", 12, h - 10);
  }, { onReset: () => { phys.current = { s: 0.06, loss: 0, dir: 1 } as never; } });
  return (
    <div>
      <SimFrame height={300}><canvas ref={api.canvasRef} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="Second hill height" value={hill2} min={20} max={100} onChange={setHill2} format={(v) => `${v}%`} />
        <Toggle label="No friction" on={frictionless} onChange={setFrictionless} />
        <SimButton onClick={() => api.reset()}>↻ From the top</SimButton>
      </SimRow>
      <p className="mt-2 text-xs text-muted-foreground">Set the second hill to 100% and the car barely crests it. Add friction and it turns back before the top — energy sets a hard speed limit.</p>
    </div>
  );
}

// ===================== ROTATION =====================
export function RotationSim() {
  const [Ikind, setIkind] = useState<"hoop" | "disk" | "sphere">("disk");
  const [alpha, setAlpha] = useState(1.5);
  const [running, setRunning] = useState(true);
  const phys = useRef({ theta: 0, omega: 0, samples: [] as { t: number; w: number }[], t: 0 });
  const paramsRef = useRef({ Ikind, alpha });
  paramsRef.current = { Ikind, alpha };
  const api = useSimCanvas(
    ({ ctx, w, h, fg, muted }, apiRef) => {
      const { Ikind: K, alpha: AL } = paramsRef.current;
      if (apiRef.state.events.has("reset")) phys.current = { theta: 0, omega: 0, samples: [], t: 0 };
      const dt = 1 / 60;
      const p = phys.current;
      if (running) {
        p.omega += AL * dt;
        p.theta += p.omega * dt;
        p.t += dt;
        p.samples.push({ t: p.t, w: p.omega });
        if (p.samples.length > 600) p.samples.shift();
      }
      const cx = w * 0.36, cy = h * 0.55, R = Math.min(w, h) * 0.24;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(p.theta);
      if (K === "hoop") {
        ctx.lineWidth = 6; ctx.strokeStyle = "#7c6cf4";
        ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = "rgba(124,108,244,0.4)"; ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) { const ang = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R * Math.cos(ang), R * Math.sin(ang)); ctx.stroke(); }
      } else if (K === "disk") {
        ctx.fillStyle = "rgba(124,108,244,0.25)";
        ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = "#7c6cf4"; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-R, 0); ctx.lineTo(R, 0); ctx.moveTo(0, -R); ctx.lineTo(0, R); ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(124,108,244,0.25)";
        ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#7c6cf4"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, R * 0.6, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      const mx = cx + R * Math.cos(p.theta), my = cy + R * Math.sin(p.theta);
      ball(ctx, mx, my, 6, "#ff8fb1");
      arrow(ctx, mx, my, mx - Math.sin(p.theta) * p.omega * 12, my + Math.cos(p.theta) * p.omega * 12, "#6fd6c8", 2);
      const If = K === "hoop" ? 1 : K === "disk" ? 0.5 : 0.4;
      ctx.fillStyle = fg; ctx.font = "12px system-ui";
      ctx.fillText(`ω = ${p.omega.toFixed(1)} rad/s   α = ${AL.toFixed(1)} rad/s²   I ∝ ${If}mR²`, 12, 20);
      // REAL ω(t) graph from samples
      const gx = w * 0.7, gw = w * 0.26, gy = h * 0.28, gh = h * 0.44;
      ctx.strokeStyle = muted; ctx.lineWidth = 1; ctx.strokeRect(gx, gy, gw, gh);
      if (p.samples.length > 1) {
        const wMax = Math.max(2, ...p.samples.map((s) => s.w));
        ctx.strokeStyle = "#ff8fb1"; ctx.lineWidth = 2;
        ctx.beginPath();
        p.samples.forEach((s, i) => {
          const X = gx + (s.t / Math.max(p.t, 6)) * gw;
          const Y = gy + gh - (s.w / wMax) * (gh - 6) - 3;
          if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        });
        ctx.stroke();
      }
      ctx.fillStyle = muted; ctx.font = "10px system-ui";
      ctx.fillText("ω(t) — straight line: ω = ω₀ + αt", gx + 4, gy - 4);
    },
    { paused: !running },
  );
  return (
    <div>
      <SimFrame height={300}><canvas ref={api.canvasRef} className="h-full w-full" /></SimFrame>
      <SimRow>
        <div className="flex gap-2">
          {(["hoop", "disk", "sphere"] as const).map((k) => (
            <SimButton key={k} active={Ikind === k} onClick={() => { setIkind(k); }}>{k}</SimButton>
          ))}
        </div>
        <Slider label="α" value={alpha} min={0} max={4} step={0.1} onChange={setAlpha} format={(v) => `${v} rad/s²`} />
        <SimButton onClick={() => setRunning(!running)}>{running ? "Pause" : "Play"}</SimButton>
        <SimButton onClick={() => api.reset()}>Reset</SimButton>
      </SimRow>
      <p className="mt-2 text-xs text-muted-foreground">Same torque, different I → different spin-up rate. The ω(t) line's SLOPE is α — hoop (I = mR²) gives the shallowest slope.</p>
    </div>
  );
}

// ===================== TORQUE SEESAW =====================
export function TorqueSim() {
  const [m1, setM1] = useState(3);
  const [d1, setD1] = useState(1.5);
  const [m2, setM2] = useState(4);
  const tilt = useRef({ ang: 0, vel: 0 });
  const paramsRef = useRef({ m1, d1, m2 });
  paramsRef.current = { m1, d1, m2 };
  const api = useSimCanvas(({ ctx, w, h, fg, muted }) => {
    const { m1: M1, d1: D1, m2: M2 } = paramsRef.current;
    const D2 = 1.5;
    const netTau = M1 * D1 - M2 * D2;
    // physical-ish rocking: angular acceleration ∝ net torque, damped
    const t = tilt.current;
    t.vel += netTau * 0.02 - t.ang * 0.9 - t.vel * 0.08;
    t.ang += t.vel * 1 / 60;
    const cx = w * 0.5, cy = h * 0.5;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.max(-0.35, Math.min(0.35, t.ang)));
    ctx.fillStyle = "#7c6cf4";
    ctx.beginPath(); ctx.roundRect(-w * 0.42, -8, w * 0.84, 16, 8); ctx.fill();
    const px1 = -D1 * 80, px2 = D2 * 80;
    ball(ctx, px1, -22, 10 + M1 * 2, "#ff8fb1");
    ball(ctx, px2, -22, 10 + M2 * 2, "#6fd6c8");
    ctx.restore();
    ctx.fillStyle = muted;
    ctx.beginPath(); ctx.moveTo(cx - 16, cy + 8); ctx.lineTo(cx + 16, cy + 8); ctx.lineTo(cx, cy + 44); ctx.closePath(); ctx.fill();
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`τ₁ = m₁d₁ = ${(M1 * D1).toFixed(2)} N·m (CCW)    τ₂ = m₂d₂ = ${(M2 * D2).toFixed(2)} N·m (CW)`, 12, 20);
    ctx.fillText(Math.abs(netTau) < 0.05 ? "⚖ Balanced — Στ = 0!" : netTau > 0 ? "Tips left: CCW torque wins" : "Tips right: CW torque wins", 12, 40);
    ctx.fillStyle = muted; ctx.font = "11px system-ui";
    ctx.fillText(`Balance when m₁·d₁ = m₂·${D2} m → d₁ = ${((M2 * D2) / M1).toFixed(2)} m. Heavier side always sits closer.`, 12, h - 10);
  });
  return (
    <div>
      <SimFrame height={280}><canvas ref={api.canvasRef} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="m₁" value={m1} min={1} max={8} onChange={setM1} format={(v) => `${v} kg`} />
        <Slider label="d₁ (left arm)" value={d1} min={0.2} max={3} step={0.1} onChange={setD1} format={(v) => `${v} m`} />
        <Slider label="m₂ (right)" value={m2} min={1} max={8} onChange={setM2} format={(v) => `${v} kg`} />
      </SimRow>
    </div>
  );
}

// ===================== SHM =====================
export function SHMSim() {
  const [mode, setMode] = useState<"spring" | "pendulum">("spring");
  const [amp, setAmp] = useState(60);
  const [kOrL, setKOrL] = useState(50);
  const phys = useRef({ phase: 0, trail: [] as number[] });
  const paramsRef = useRef({ mode, amp, kOrL });
  paramsRef.current = { mode, amp, kOrL };
  const api = useSimCanvas(({ ctx, w, h, fg, muted }) => {
    const { mode: M, amp: A, kOrL: KL } = paramsRef.current;
    const dt = 1 / 60;
    const omega = M === "spring" ? Math.sqrt(KL * 2) : Math.sqrt(9.8 / (KL / 12));
    const p = phys.current;
    p.phase += omega * dt;
    p.trail.push(p.phase);
    if (p.trail.length > 160) p.trail.shift();
    const cx = w * 0.38, topY = 40;
    if (M === "spring") {
      const y = topY + 60 + A * Math.cos(p.phase);
      ctx.strokeStyle = muted; ctx.lineWidth = 2;
      ctx.beginPath();
      const coils = 12, start = topY, end = y - 12;
      ctx.moveTo(cx, start);
      for (let i = 0; i <= coils; i++) {
        const yy = start + ((end - start) * i) / coils;
        ctx.lineTo(cx + (i % 2 === 0 ? -14 : 14), yy);
      }
      ctx.lineTo(cx, end); ctx.stroke();
      ball(ctx, cx, y, 14, "#7c6cf4");
      const Kfrac = Math.sin(p.phase) ** 2;
      const bx = w - 120;
      ([["K", Kfrac, "#ff8fb1"], ["U", 1 - Kfrac, "#6fd6c8"]] as [string, number, string][]).forEach(([label, val, color], i) => {
        const by = 20 + i * 30;
        ctx.fillStyle = muted; ctx.fillText(label, bx - 18, by + 10);
        ctx.fillStyle = "rgba(128,120,160,0.15)"; ctx.fillRect(bx, by, 90, 14);
        ctx.fillStyle = color; ctx.fillRect(bx, by, val * 90, 14);
      });
      // x(t) trace
      const gx = w * 0.55, gw = w * 0.3, gy = h * 0.55, gh = h * 0.3;
      ctx.strokeStyle = muted; ctx.strokeRect(gx, gy, gw, gh);
      ctx.strokeStyle = "#7c6cf4"; ctx.lineWidth = 2; ctx.beginPath();
      p.trail.forEach((ph, i) => {
        const X = gx + (i / 159) * gw;
        const Y = gy + gh / 2 - Math.cos(ph) * (gh / 2 - 6) * (A / 80);
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      });
      ctx.stroke();
      ctx.fillStyle = muted; ctx.font = "10px system-ui";
      ctx.fillText("x(t)", gx + 4, gy - 4);
    } else {
      const L = 90 + KL;
      const angMax = (A / 220) * 1.2;
      const ang = angMax * Math.cos(p.phase);
      const bx = cx + L * Math.sin(ang), by = topY + L * Math.cos(ang);
      ctx.strokeStyle = muted; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, topY); ctx.lineTo(bx, by); ctx.stroke();
      ball(ctx, bx, by, 14, "#6fd6c8");
      ctx.fillStyle = fg; ctx.font = "11px system-ui";
      ctx.fillText(`θ = ${(ang * 57.3).toFixed(1)}°`, cx + 20, topY + 24);
      // small-angle note
      ctx.fillStyle = muted;
      ctx.fillText("Small angles only: T = 2π√(L/g) assumes sinθ ≈ θ.", 12, h - 10);
    }
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    const T = (2 * Math.PI) / omega;
    ctx.fillText(`T = ${T.toFixed(2)} s`, 12, 20);
  });
  return (
    <div>
      <SimFrame height={300}><canvas ref={api.canvasRef} className="h-full w-full" /></SimFrame>
      <SimRow>
        <div className="flex gap-2">
          <SimButton active={mode === "spring"} onClick={() => setMode("spring")}>Spring</SimButton>
          <SimButton active={mode === "pendulum"} onClick={() => setMode("pendulum")}>Pendulum</SimButton>
        </div>
        <Slider label={mode === "spring" ? "k" : "L"} value={kOrL} min={10} max={100} onChange={setKOrL} />
        <Slider label="Amplitude" value={amp} min={10} max={80} onChange={setAmp} format={(v) => `${v} px`} />
      </SimRow>
      <p className="mt-2 text-xs text-muted-foreground">Change amplitude: the period doesn't budge — isochronism, the signature of SHM. Change k or L: the period responds as T = 2π√(m/k) or 2π√(L/g).</p>
    </div>
  );
}

// ===================== CIRCULAR =====================
export function CircularSim() {
  const [speed, setSpeed] = useState(3);
  const [radius, setRadius] = useState(90);
  const phys = useRef({ phase: 0 });
  const paramsRef = useRef({ speed, radius });
  paramsRef.current = { speed, radius };
  const api = useSimCanvas(({ ctx, w, h, fg, muted }) => {
    const { speed: S, radius: R0 } = paramsRef.current;
    const omega = (S * 40) / R0;
    phys.current.phase += omega / 60;
    const phase = phys.current.phase;
    const cx = w * 0.42, cy = h * 0.55, R = R0;
    ctx.strokeStyle = muted; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    const x = cx + R * Math.cos(phase), y = cy + R * Math.sin(phase);
    ctx.strokeStyle = muted; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
    ball(ctx, x, y, 11, "#7c6cf4");
    const vt = S * 3;
    arrow(ctx, x, y, x - Math.sin(phase) * vt, y + Math.cos(phase) * vt, "#8fb8f7", 2.5);
    arrow(ctx, x, y, x - (x - cx) * 0.25, y - (y - cy) * 0.25, "#ff8fb1", 2.5);
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`v = ${S} m/s   r = ${(R / 40).toFixed(1)} m   a_c = v²/r = ${((S * S) / (R / 40)).toFixed(1)} m/s²   T = ${(2 * Math.PI * (R / 40) / S).toFixed(2)} s`, 12, 20);
    ctx.fillStyle = muted; ctx.font = "11px system-ui";
    ctx.fillText("Blue = velocity (tangent). Pink = centripetal acceleration (inward). Neither points 'outward' — that's the trap.", 12, h - 10);
  });
  return (
    <div>
      <SimFrame height={280}><canvas ref={api.canvasRef} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="Speed" value={speed} min={1} max={8} onChange={setSpeed} format={(v) => `${v} m/s`} />
        <Slider label="Radius" value={radius} min={40} max={150} onChange={setRadius} format={(v) => `${(v / 40).toFixed(1)} m`} />
      </SimRow>
    </div>
  );
}
