import { useRef, useState } from "react";
import { useCanvasLoop, SimFrame, SimRow, Slider, Toggle, arrow, grid, ball, shade } from "./framework";

// ===================== VECTORS =====================
export function VectorsSim() {
  const [angle, setAngle] = useState(35);
  const [mag, setMag] = useState(80);
  const [showComp, setShowComp] = useState(true);
  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    grid(ctx, w, h);
    const cx = w * 0.28, cy = h * 0.75;
    const rad = (angle * Math.PI) / 180;
    const ex = cx + mag * Math.cos(rad);
    const ey = cy - mag * Math.sin(rad);
    // axes
    ctx.strokeStyle = muted; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, 20); ctx.lineTo(cx, h - 20); ctx.moveTo(20, cy); ctx.lineTo(w - 20, cy); ctx.stroke();
    if (showComp) {
      ctx.setLineDash([5, 5]); ctx.strokeStyle = "#8fb8f7";
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex, cy); ctx.moveTo(ex, ey); ctx.lineTo(cx, ey); ctx.stroke();
      ctx.setLineDash([]);
    }
    arrow(ctx, cx, cy, ex, ey, "#7c6cf4", 3.5, 10);
    if (showComp) {
      arrow(ctx, cx, cy, ex, cy, "#8fb8f7", 2.5);
      arrow(ctx, cx, cy, cx, ey, "#ff8fb1", 2.5);
      ctx.fillStyle = fg; ctx.font = "12px system-ui";
      ctx.fillText(`Ax = ${Math.round(mag * Math.cos(rad))}`, (cx + ex) / 2, cy + 16);
      ctx.fillText(`Ay = ${Math.round(mag * Math.sin(rad))}`, cx + 6, (cy + ey) / 2);
    }
    // angle arc
    ctx.strokeStyle = muted;
    ctx.beginPath(); ctx.arc(cx, cy, 26, -rad, 0); ctx.stroke();
    ctx.fillStyle = fg;
    ctx.font = "12px system-ui";
    ctx.fillText(`θ = ${angle}°`, cx + 32, cy - 8);
    ctx.fillText(`|A| = ${mag}`, (cx + ex) / 2 - 20, (cy + ey) / 2 - 8);
  });
  return (
    <div>
      <SimFrame height={260}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="Magnitude" value={mag} min={20} max={140} onChange={setMag} />
        <Slider label="Angle θ" value={angle} min={0} max={90} onChange={setAngle} format={(v) => `${v}°`} />
        <Toggle label="Components" on={showComp} onChange={setShowComp} />
      </SimRow>
      <p className="mt-2 text-xs text-muted-foreground">A<sub>x</sub> = A cos θ = {Math.round(mag * Math.cos((angle * Math.PI) / 180))} · A<sub>y</sub> = A sin θ = {Math.round(mag * Math.sin((angle * Math.PI) / 180))}</p>
    </div>
  );
}

// ===================== KINEMATICS =====================
export function KinematicsSim() {
  const [a, setA] = useState(2);
  const [v0, setV0] = useState(0);
  const [running, setRunning] = useState(true);
  const [reset, setReset] = useState(0);
  const tRef = useRef(0);
  const lastRef = useRef(performance.now());
  const samplesRef = useRef<{ t: number; x: number; v: number }[]>([]);
  if ((tRef as unknown as { currentReset?: number }).currentReset !== reset) { (tRef as unknown as { currentReset?: number }).currentReset = reset; tRef.current = 0; samplesRef.current = []; }
  const ref = useCanvasLoop(({ ctx, w, h, t, fg, muted }) => {
    const now = performance.now();
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    if (running) tRef.current += dt;
    const time = tRef.current;
    const x = v0 * time + 0.5 * a * time * time;
    const v = v0 + a * time;
    samplesRef.current.push({ t: time, x, v });
    if (samplesRef.current.length > 900) samplesRef.current.shift();

    // track
    const trackY = h * 0.3;
    ctx.fillStyle = "rgba(124,108,244,0.10)";
    ctx.fillRect(0, trackY + 14, w, 4);
    const px = 40 + (x * 3) % (w - 80);
    ball(ctx, px, trackY, 12, "#7c6cf4");
    arrow(ctx, px, trackY - 18, px + v * 6, trackY - 18, "#ff8fb1", 2.5);
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`t = ${time.toFixed(1)} s   x = ${x.toFixed(1)} m   v = ${v.toFixed(1)} m/s`, 12, 18);

    // graphs: x (top) v (bottom)
    const gx = w * 0.62, gw = w * 0.34, gh = h * 0.3, gy1 = h * 0.16, gy2 = h * 0.6;
    const drawGraph = (gy: number, getter: (s: { t: number; x: number; v: number }) => number, label: string, color: string) => {
      ctx.strokeStyle = muted; ctx.lineWidth = 1;
      ctx.strokeRect(gx, gy, gw, gh);
      const s = samplesRef.current;
      if (s.length > 1) {
        const tMax = Math.max(6, s[s.length - 1].t);
        const vMax = Math.max(4, ...s.map(getter), Math.abs(getter(s[s.length - 1])) * 1.2);
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.beginPath();
        s.forEach((pt, i) => {
          const X = gx + (pt.t / tMax) * gw;
          const Y = gy + gh - ((getter(pt) + vMax) / (2 * vMax)) * gh;
          if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        });
        ctx.stroke();
      }
      ctx.fillStyle = muted; ctx.font = "10px system-ui";
      ctx.fillText(label, gx + 4, gy - 4);
    };
    drawGraph(gy1, (s) => s.x, "x(t)", "#8fb8f7");
    drawGraph(gy2, (s) => s.v, "v(t)", "#ff8fb1");
  });
  return (
    <div>
      <SimFrame height={300}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="v₀" value={v0} min={-10} max={10} onChange={setV0} format={(v) => `${v} m/s`} />
        <Slider label="a" value={a} min={-6} max={6} step={0.5} onChange={setA} format={(v) => `${v} m/s²`} />
        <button className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" onClick={() => { setRunning(!running); }} >{running ? "Pause" : "Play"}</button>
        <button className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" onClick={() => { tRef.current = 0; samplesRef.current = []; }}>Reset</button>
      </SimRow>
    </div>
  );
}

// ===================== PROJECTILE =====================
export function ProjectileSim() {
  const [v0, setV0] = useState(24);
  const [angle, setAngle] = useState(50);
  const [shots, setShots] = useState<{ pts: [number, number][]; v0: number; angle: number }[]>([]);
  const firedRef = useRef(false);
  const [fired, setFired] = useState(0);

  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    grid(ctx, w, h, 40);
    const groundY = h - 30;
    const scale = w / 70; // 70 m wide view
    // previous trails
    shots.forEach((s) => {
      ctx.strokeStyle = "rgba(124,108,244,0.35)"; ctx.lineWidth = 1.5;
      ctx.beginPath();
      s.pts.forEach((p, i) => { const X = 20 + p[0] * scale, Y = groundY - p[1] * scale; if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); });
      ctx.stroke();
    });
    // current flight
    const rad = (angle * Math.PI) / 180;
    const vx = v0 * Math.cos(rad), vy0 = v0 * Math.sin(rad);
    const tFlight = (2 * vy0) / 9.8;
    const R = vx * tFlight;
    const H = (vy0 * vy0) / (2 * 9.8);
    ctx.strokeStyle = "#7c6cf4"; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const tt = (tFlight * i) / 60;
      const X = 20 + vx * tt * scale, Y = groundY - (vy0 * tt - 4.9 * tt * tt) * scale;
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.stroke();
    const tNow = fired ? ((performance.now() / 1000) % tFlight) : 0;
    const bx = 20 + vx * tNow * scale, by = groundY - (vy0 * tNow - 4.9 * tNow * tNow) * scale;
    ball(ctx, bx, by, 9, "#ff8fb1");
    // components
    const vy = vy0 - 9.8 * tNow;
    arrow(ctx, bx, by, bx + vx * 1.6, by, "#8fb8f7", 2);
    arrow(ctx, bx, by, bx, by - vy * 1.6, "#6fd6c8", 2);
    // ground + annotations
    ctx.strokeStyle = muted; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke();
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`Range = ${R.toFixed(1)} m   Max height = ${H.toFixed(1)} m   Flight = ${tFlight.toFixed(2)} s`, 12, 20);
    // launcher
    ctx.strokeStyle = fg; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(20, groundY); ctx.lineTo(20 + 26 * Math.cos(rad), groundY - 26 * Math.sin(rad)); ctx.stroke();
  });
  return (
    <div>
      <SimFrame height={300}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="v₀" value={v0} min={5} max={45} onChange={setV0} format={(v) => `${v} m/s`} />
        <Slider label="Angle" value={angle} min={5} max={85} onChange={setAngle} format={(v) => `${v}°`} />
        <button className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" onClick={() => { setFired((n) => n + 1); }}>Launch</button>
        <button className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" onClick={() => setShots([])}>Clear trails</button>
      </SimRow>
      <p className="mt-2 text-xs text-muted-foreground">Watch the green (v<sub>x</sub>, constant) and teal (v<sub>y</sub>, shrinking then growing) component arrows.</p>
    </div>
  );
}

// ===================== FREE-BODY DIAGRAM =====================
export function FBDSim() {
  const [theta, setTheta] = useState(0);
  const [mass, setMass] = useState(10);
  const [withFriction, setWithFriction] = useState(true);
  const [mu, setMu] = useState(0.3);
  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    grid(ctx, w, h);
    const cx = w * 0.5, cy = h * 0.55;
    const rad = (theta * Math.PI) / 180;
    // ramp
    ctx.strokeStyle = muted; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 150, cy + 150 * Math.tan(rad));
    ctx.lineTo(cx + 150, cy - 150 * Math.tan(rad));
    ctx.stroke();
    const bx = cx, by = cy - 0 * Math.sin(rad);
    const blockS = 26;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(-rad);
    ctx.fillStyle = "#7c6cf4";
    ctx.beginPath(); ctx.roundRect(-blockS, -blockS, blockS * 2, blockS * 2, 8); ctx.fill();
    ctx.restore();
    const g = 9.8 * 4; // px per m/s² scale
    const Wv = mass * g;
    // weight
    arrow(ctx, bx, by, bx, by + Wv * 0.5, "#ff8fb1", 3, 9);
    // normal
    const nx = Math.sin(rad) * Wv * 0.5, ny = -Math.cos(rad) * Wv * 0.5;
    arrow(ctx, bx, by, bx + nx, by + ny, "#6fd6c8", 3, 9);
    // friction
    if (withFriction) {
      const fx = -Math.cos(rad) * mu * Wv * Math.cos(rad) * 0.9, fy = Math.sin(rad) * mu * Wv * Math.cos(rad) * 0.9;
      arrow(ctx, bx, by, bx + fx, by + fy, "#ffc46b", 3, 9);
    }
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`F_N = ${withFriction ? (mass * 9.8 * Math.cos(rad)).toFixed(0) : (mass * 9.8 * Math.cos(rad)).toFixed(0)} N`, 12, 20);
    ctx.fillText(`F_g = ${(mass * 9.8).toFixed(0)} N`, 12, 38);
    ctx.fillText(`a along ramp = ${withFriction ? Math.max(0, 9.8 * (Math.sin(rad) - mu * Math.cos(rad))).toFixed(1) : (9.8 * Math.sin(rad)).toFixed(1)} m/s²`, 12, 56);
  });
  return (
    <div>
      <SimFrame height={300}><canvas ref={ref} className="h-full w-full" /></SimFrame>
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
  const [runKey, setRunKey] = useState(0);
  const posRef = useRef({ x1: 0.15, x2: 0.75, v1x: 0, v2x: 0, hit: false });
  const lastKeyRef = useRef(-1);
  const pBeforeRef = useRef(0);
  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const groundY = h * 0.52;
    if (lastKeyRef.current !== runKey) {
      lastKeyRef.current = runKey;
      posRef.current = { x1: 0.12, x2: 0.72, v1x: v1 / 40, v2x: 0, hit: false };
      pBeforeRef.current = m1 * (v1 / 40) + m2 * 0;
    }
    const p = posRef.current;
    if (p.v1x !== 0 || p.v2x !== 0) {
      p.x1 += p.v1x / 60; p.x2 += p.v2x / 60;
      if (!p.hit && p.x1 + 0.04 >= p.x2 - 0.05) {
        p.hit = true;
        const M = m1 + m2;
        if (elastic) {
          const u1 = p.v1x, u2 = p.v2x;
          p.v1x = ((m1 - m2) * u1 + 2 * m2 * u2) / M;
          p.v2x = ((m2 - m1) * u2 + 2 * m1 * u1) / M;
        } else {
          const vf = (m1 * p.v1x + m2 * p.v2x) / M;
          p.v1x = vf; p.v2x = vf;
        }
      }
      if (p.x1 > 1.15 || p.x2 > 1.15 || (p.x1 < -0.1 && p.v1x < 0)) { p.v1x = 0; p.v2x = 0; }
    }
    const r1 = 14 + m1 * 2.2, r2 = 14 + m2 * 2.2;
    const x1 = p.x1 * w, x2 = p.x2 * w;
    ctx.strokeStyle = muted; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke();
    ball(ctx, x1, groundY - r1, r1, "#7c6cf4");
    ball(ctx, x2, groundY - r2, r2, "#ff8fb1");
    arrow(ctx, x1, groundY - 2 * r1 - 10, x1 + p.v1x * 120, groundY - 2 * r1 - 10, "#8fb8f7", 2);
    arrow(ctx, x2, groundY - 2 * r2 - 10, x2 + p.v2x * 120, groundY - 2 * r2 - 10, "#8fb8f7", 2);
    // momentum readout
    const pTot = (m1 * p.v1x + m2 * p.v2x) * 40;
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`Total p = ${pTot.toFixed(1)} kg·m/s ${p.hit ? "— conserved through the collision ✓" : ""}`, 12, 22);
    ctx.fillStyle = muted; ctx.font = "11px system-ui";
    ctx.fillText(p.hit && !elastic ? "KE after < KE before: the difference went into crumpling/heat." : p.hit && elastic ? "KE conserved: elastic collision." : "Momentum: m₁v₁ + m₂v₂ — watch it stay level.", 12, 40);
    // momentum bars
    const scale = 6;
    const bw1 = (m1 * p.v1x * 40) / scale;
    const bw2 = (m2 * p.v2x * 40) / scale;
    ctx.fillStyle = "#7c6cf4"; ctx.fillRect(12, h - 44, Math.max(1, bw1 * 3), 12);
    ctx.fillStyle = "#ff8fb1"; ctx.fillRect(12, h - 26, Math.max(1, bw2 * 3), 12);
    ctx.fillStyle = muted; ctx.font = "10px system-ui";
    ctx.fillText(`m₁ p = ${(m1 * p.v1x * 40).toFixed(1)}`, 16 + bw1 * 3, h - 34);
    ctx.fillText(`m₂ p = ${(m2 * p.v2x * 40).toFixed(1)}`, 16 + bw2 * 3, h - 16);
  });
  return (
    <div>
      <SimFrame height={280}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="m₁" value={m1} min={1} max={10} onChange={setM1} format={(v) => `${v} kg`} />
        <Slider label="v₁" value={v1} min={1} max={12} onChange={setV1} format={(v) => `${v} m/s`} />
        <Slider label="m₂" value={m2} min={1} max={10} onChange={setM2} format={(v) => `${v} kg`} />
        <Toggle label="Elastic" on={elastic} onChange={setElastic} />
        <button className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" onClick={() => setRunKey((k) => k + 1)}>↻ Run</button>
      </SimRow>
    </div>
  );
}

// ===================== ENERGY COASTER =====================
export function EnergySim() {
  const [frictionless, setFrictionless] = useState(true);
  const [hill2, setHill2] = useState(45);
  const posT = useRef(0);
  const energyRef = useRef({ K: 0, U: 0, loss: 0 });
  const ref = useCanvasLoop(({ ctx, w, h, t, fg, muted }) => {
    const groundY = h - 26;
    // two-hill track: big first hill + adjustable second hill
    const g = (x: number, c: number, wd: number) => Math.exp(-((x - c) ** 2) / (2 * wd * wd));
    const trackH = (s: number) => 0.95 * g(s, 0.06, 0.2) + (hill2 / 100) * 0.95 * g(s, 0.62, 0.16) + 0.06;
    const H0 = trackH(0.06);
    let s = posT.current;
    const U = trackH(s);
    const loss = frictionless ? 0 : Math.min(0.8, s * 1.2);
    const K = Math.max(0, H0 - U - loss);
    // speed follows sqrt(K): slows uphill, stalls if hill2 too tall
    posT.current += 0.006 * (0.18 + Math.sqrt(K));
    if (posT.current > 1) posT.current = 0.02;
    s = posT.current;
    const yNorm = trackH(s);
    energyRef.current = { K: Math.max(0, H0 - trackH(s) - loss), U: trackH(s) / H0, loss };
    // track (same vertical scale as the car)
    const scaleY = h - 90;
    ctx.strokeStyle = muted; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const xx = (i / 100) * w;
      const yy = groundY - trackH(i / 100) * scaleY;
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    const cx = s * w;
    ball(ctx, cx, groundY - yNorm * scaleY - 8, 10, "#7c6cf4");
    // energy bars (normalized to the starting height's energy)
    const bx = w - 130;
    const bars: [string, number, string][] = [["K", K / H0, "#ff8fb1"], ["U", U / H0, "#6fd6c8"], ["lost", loss / H0, "#a49dbf"]];
    ctx.font = "11px system-ui";
    bars.forEach(([label, val, color], i) => {
      const by = 20 + i * 34;
      ctx.fillStyle = muted; ctx.fillText(label, bx - 22, by + 10);
      ctx.fillStyle = "rgba(128,120,160,0.15)"; ctx.fillRect(bx, by, 100, 14);
      ctx.fillStyle = color; ctx.fillRect(bx, by, Math.max(0, val * 100), 14);
    });
    ctx.fillStyle = fg;
    ctx.fillText(`v = ${Math.sqrt(2 * 9.8 * energyRef.current.K * 2).toFixed(1)} m/s (scaled)`, 12, 20);
  });
  return (
    <div>
      <SimFrame height={300}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="Second hill height" value={hill2} min={20} max={100} onChange={setHill2} format={(v) => `${v}%`} />
        <Toggle label="No friction" on={frictionless} onChange={setFrictionless} />
      </SimRow>
      <p className="mt-2 text-xs text-muted-foreground">Energy trades between K (pink) and U (teal). Set the second hill at 100% and watch the car barely crest it — then add friction and see it fail to make it. The total only shrinks.</p>
    </div>
  );
}

// ===================== ROTATION =====================
export function RotationSim() {
  const [Ikind, setIkind] = useState<"hoop" | "disk" | "sphere">("disk");
  const [alpha, setAlpha] = useState(1.5);
  const thetaRef = useRef(0);
  const omegaRef = useRef(0);
  const lastRef = useRef(performance.now());
  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const now = performance.now();
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    omegaRef.current += alpha * dt;
    thetaRef.current += omegaRef.current * dt;
    const cx = w * 0.38, cy = h * 0.55, R = Math.min(w, h) * 0.26;
    ctx.strokeStyle = muted; ctx.lineWidth = 2;
    // draw shape
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(thetaRef.current);
    if (Ikind === "hoop") {
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 6; ctx.strokeStyle = "#7c6cf4"; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 8; i++) { const ang = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R * Math.cos(ang), R * Math.sin(ang)); ctx.strokeStyle = "rgba(124,108,244,0.4)"; ctx.lineWidth = 2; ctx.stroke(); }
    } else if (Ikind === "disk") {
      ctx.fillStyle = "rgba(124,108,244,0.25)"; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = "#7c6cf4"; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-R, 0); ctx.lineTo(R, 0); ctx.moveTo(0, -R); ctx.lineTo(0, R); ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(124,108,244,0.25)"; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#7c6cf4"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, R * 0.6, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
    // marker
    const mx = cx + R * Math.cos(thetaRef.current), my = cy + R * Math.sin(thetaRef.current);
    ball(ctx, mx, my, 6, "#ff8fb1");
    // velocity arrow
    arrow(ctx, mx, my, mx - Math.sin(thetaRef.current) * omegaRef.current * 14, my + Math.cos(thetaRef.current) * omegaRef.current * 14, "#6fd6c8", 2);
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    const If = Ikind === "hoop" ? 1 : Ikind === "disk" ? 0.5 : 0.4;
    ctx.fillText(`ω = ${omegaRef.current.toFixed(1)} rad/s   α = ${alpha.toFixed(1)} rad/s²   I ∝ ${If}mR²`, 12, 20);
    // ω graph
    const gx = w * 0.72, gw = w * 0.24, gy = h * 0.3, gh = h * 0.4;
    ctx.strokeStyle = muted; ctx.strokeRect(gx, gy, gw, gh);
    ctx.strokeStyle = "#ff8fb1"; ctx.lineWidth = 2;
    ctx.beginPath();
    const tMax = 8;
    const tNow = thetaRef.current; // placeholder
    for (let i = 0; i < 60; i++) {
      const tt = (i / 59) * tMax;
      const wv = Math.min(20, omegaRef.current * (tt / Math.max(tNow, 0.001)));
      const X = gx + (tt / tMax) * gw, Y = gy + gh - (wv / 20) * gh;
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  });
  return (
    <div>
      <SimFrame height={300}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <div className="flex gap-2">
          {(["hoop", "disk", "sphere"] as const).map((k) => (
            <button key={k} onClick={() => setIkind(k)} className={`clay-sm clay-press px-3 py-1.5 text-xs font-semibold ${Ikind === k ? "text-[var(--clay-primary-deep)]" : ""}`} style={Ikind === k ? { background: "var(--clay-primary-tint)" } : undefined}>{k}</button>
          ))}
        </div>
        <Slider label="α" value={alpha} min={0} max={4} step={0.1} onChange={setAlpha} format={(v) => `${v} rad/s²`} />
      </SimRow>
      <p className="mt-2 text-xs text-muted-foreground">Same torque, different I → different α. Hoop (I = mR²) spins up slowest; sphere (I = 0.4mR²) fastest.</p>
    </div>
  );
}

// ===================== TORQUE SEESAW =====================
export function TorqueSim() {
  const [m1, setM1] = useState(3);
  const [d1, setD1] = useState(1.5);
  const [m2, setM2] = useState(4);
  const tiltRef = useRef(0);
  const omegaRef = useRef(0);
  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const cx = w * 0.5, cy = h * 0.5;
    const D2 = 1.5; // m2 sits at a fixed 1.5 m on the right
    const netTau = m1 * d1 - m2 * D2;
    const targetTilt = Math.max(-0.3, Math.min(0.3, netTau * 0.08));
    omegaRef.current += (targetTilt - tiltRef.current) * 0.06;
    tiltRef.current += omegaRef.current * 0.9;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tiltRef.current);
    ctx.fillStyle = "#7c6cf4";
    ctx.beginPath(); ctx.roundRect(-w * 0.42, -8, w * 0.84, 16, 8); ctx.fill();
    const px1 = -d1 * 80;
    const px2 = D2 * 80;
    ball(ctx, px1, -22, 10 + m1 * 2, "#ff8fb1");
    ball(ctx, px2, -22, 10 + m2 * 2, "#6fd6c8");
    ctx.restore();
    // fulcrum triangle
    ctx.fillStyle = muted;
    ctx.beginPath(); ctx.moveTo(cx - 16, cy + 8); ctx.lineTo(cx + 16, cy + 8); ctx.lineTo(cx, cy + 44); ctx.closePath(); ctx.fill();
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    const tau1 = m1 * d1, tau2 = m2 * D2;
    ctx.fillText(`τ₁ = m₁d₁ = ${tau1.toFixed(2)} N·m (CCW)    τ₂ = m₂d₂ = ${tau2.toFixed(2)} N·m (CW)`, 12, 20);
    ctx.fillText(Math.abs(netTau) < 0.05 ? "⚖ Balanced — Στ = 0!" : netTau > 0 ? "Tips left (CCW wins)" : "Tips right (CW wins)", 12, 40);
    ctx.fillText(`m₁ = ${m1} kg at ${d1.toFixed(1)} m (left) · m₂ = ${m2} kg at ${D2} m (right)`, 12, h - 22);
  });
  return (
    <div>
      <SimFrame height={280}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="m₁" value={m1} min={1} max={8} onChange={setM1} format={(v) => `${v} kg`} />
        <Slider label="d₁ (left arm)" value={d1} min={0.2} max={3} step={0.1} onChange={setD1} format={(v) => `${v} m`} />
        <Slider label="m₂ (right)" value={m2} min={1} max={8} onChange={setM2} format={(v) => `${v} kg`} />
      </SimRow>
      <p className="mt-2 text-xs text-muted-foreground">m₂ sits 1.5 m right of the pivot. Balance needs m₁·d₁ = m₂·1.5 — try m₁ = 3 kg: where must it sit? (Hint: heavier side sits closer.)</p>
    </div>
  );
}

// ===================== SHM =====================
export function SHMSim() {
  const [mode, setMode] = useState<"spring" | "pendulum">("spring");
  const [amp, setAmp] = useState(60);
  const [kOrL, setKOrL] = useState(50);
  const phaseRef = useRef(0);
  const lastRef = useRef(performance.now());
  const trailRef = useRef<number[]>([]);
  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const now = performance.now();
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const omega = mode === "spring" ? Math.sqrt(kOrL * 2) : Math.sqrt(9.8 / (kOrL / 12));
    phaseRef.current += omega * dt;
    const phase = phaseRef.current;
    const cx = w * 0.4, topY = 40;
    trailRef.current.push(phase);
    if (trailRef.current.length > 140) trailRef.current.shift();
    if (mode === "spring") {
      const y = topY + 60 + amp * Math.cos(phase);
      // spring zigzag
      ctx.strokeStyle = muted; ctx.lineWidth = 2;
      ctx.beginPath();
      const coils = 12;
      const start = topY, end = y - 12;
      ctx.moveTo(cx, start);
      for (let i = 0; i <= coils; i++) {
        const yy = start + ((end - start) * i) / coils;
        ctx.lineTo(cx + (i % 2 === 0 ? -14 : 14), yy);
      }
      ctx.lineTo(cx, end);
      ctx.stroke();
      ball(ctx, cx, y, 14, "#7c6cf4");
      // energy bars
      const Kfrac = Math.sin(phase) ** 2;
      const bx = w - 120;
      ([["K", Kfrac, "#ff8fb1"], ["U", 1 - Kfrac, "#6fd6c8"]] as [string, number, string][]).forEach(([label, val, color], i) => {
        const by = 20 + i * 30;
        ctx.fillStyle = muted; ctx.fillText(String(label), bx - 18, by + 10);
        ctx.fillStyle = "rgba(128,120,160,0.15)"; ctx.fillRect(bx, by, 90, 14);
        ctx.fillStyle = String(color); ctx.fillRect(bx, by, val * 90, 14);
      });
      // x(t) trace
      const gx = w * 0.55, gw = w * 0.3, gy = h * 0.55, gh = h * 0.3;
      ctx.strokeStyle = muted; ctx.strokeRect(gx, gy, gw, gh);
      ctx.strokeStyle = "#7c6cf4"; ctx.lineWidth = 2; ctx.beginPath();
      trailRef.current.forEach((ph, i) => {
        const X = gx + (i / 139) * gw;
        const Y = gy + gh / 2 - Math.cos(ph) * (gh / 2 - 6) * (amp / 80);
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      });
      ctx.stroke();
    } else {
      const L = 90 + kOrL;
      const ang = (amp / 220) * Math.cos(phase);
      const bx = cx + L * Math.sin(ang), by = topY + L * Math.cos(ang);
      ctx.strokeStyle = muted; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, topY); ctx.lineTo(bx, by); ctx.stroke();
      ball(ctx, bx, by, 14, "#6fd6c8");
      ctx.fillStyle = fg; ctx.font = "11px system-ui";
      ctx.fillText(`θ = ${(ang * 57.3).toFixed(1)}°`, cx + 20, topY + 24);
    }
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    const T = (2 * Math.PI) / omega;
    ctx.fillText(`T = ${T.toFixed(2)} s`, 12, 20);
  });
  return (
    <div>
      <SimFrame height={300}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <div className="flex gap-2">
          <button onClick={() => setMode("spring")} className={`clay-sm clay-press px-3 py-1.5 text-xs font-semibold ${mode === "spring" ? "text-[var(--clay-primary-deep)]" : ""}`} style={mode === "spring" ? { background: "var(--clay-primary-tint)" } : undefined}>Spring</button>
          <button onClick={() => setMode("pendulum")} className={`clay-sm clay-press px-3 py-1.5 text-xs font-semibold ${mode === "pendulum" ? "text-[var(--clay-primary-deep)]" : ""}`} style={mode === "pendulum" ? { background: "var(--clay-primary-tint)" } : undefined}>Pendulum</button>
        </div>
        <Slider label={mode === "spring" ? "k" : "L"} value={kOrL} min={10} max={100} onChange={setKOrL} />
        <Slider label="Amplitude" value={amp} min={10} max={80} onChange={setAmp} format={(v) => `${v} px`} />
      </SimRow>
      <p className="mt-2 text-xs text-muted-foreground">Try changing amplitude: the period doesn't budge — that's the signature of simple harmonic motion.</p>
    </div>
  );
}

// ===================== CIRCULAR =====================
export function CircularSim() {
  const [speed, setSpeed] = useState(3);
  const [radius, setRadius] = useState(90);
  const phaseRef = useRef(0);
  const lastRef = useRef(performance.now());
  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const now = performance.now();
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const omega = (speed * 40) / radius;
    phaseRef.current += omega * dt;
    const cx = w * 0.45, cy = h * 0.52, R = radius;
    ctx.strokeStyle = muted; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    const x = cx + R * Math.cos(phaseRef.current), y = cy + R * Math.sin(phaseRef.current);
    // string
    ctx.strokeStyle = muted; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
    ball(ctx, x, y, 11, "#7c6cf4");
    // velocity (tangent)
    const vt = speed * 3;
    arrow(ctx, x, y, x - Math.sin(phaseRef.current) * vt, y + Math.cos(phaseRef.current) * vt, "#8fb8f7", 2.5);
    // centripetal
    arrow(ctx, x, y, x - (x - cx) * 0.25, y - (y - cy) * 0.25, "#ff8fb1", 2.5);
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`v = ${speed} m/s   r = ${(radius / 40).toFixed(1)} m   a_c = v²/r = ${((speed * speed) / (radius / 40)).toFixed(1)} m/s²`, 12, 20);
  });
  return (
    <div>
      <SimFrame height={280}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="Speed" value={speed} min={1} max={8} onChange={setSpeed} format={(v) => `${v} m/s`} />
        <Slider label="Radius" value={radius} min={40} max={150} onChange={setRadius} format={(v) => `${(v / 40).toFixed(1)} m`} />
      </SimRow>
      <p className="mt-2 text-xs text-muted-foreground">Blue = velocity (tangent). Pink = centripetal acceleration (inward, a_c = v²/r). Cut the string and the ball flies off along the tangent — not outward.</p>
    </div>
  );
}
