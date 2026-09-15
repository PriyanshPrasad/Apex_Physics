import { useRef, useState } from "react";
import { useCanvasLoop, SimFrame, SimRow, Slider, Toggle, arrow, grid, ball } from "./framework";
import { SimShell } from "./SimShell";

// ---------------------------------------------------------------------------
// Clock helper: real dt with pause support.
// ---------------------------------------------------------------------------
function useClock() {
  const t = useRef(0);
  const last = useRef(0);
  return (now: number, running: boolean, dtScale = 1) => {
    if (!last.current) last.current = now;
    const dt = Math.min((now - last.current) / 1000, 0.05);
    last.current = now;
    if (running) t.current += dt * dtScale;
    return { t: t.current, dt: running ? dt * dtScale : 0 };
  };
}

function Panel(props: Parameters<typeof SimShell>[0]) {
  return <SimShell {...props} />;
}

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
    ctx.strokeStyle = muted;
    ctx.beginPath(); ctx.arc(cx, cy, 26, -rad, 0); ctx.stroke();
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
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
      <Panel
        showControls={false}
        running
        onPlayPause={() => {}}
        onReset={() => { setMag(80); setAngle(35); }}
        physics={{
          what: "Any vector can be rebuilt from two perpendicular pieces. The dashed lines show those pieces projecting onto the axes.",
          equations: [
            { tex: "A_x = A\\cos\\theta", note: "horizontal piece" },
            { tex: "A_y = A\\sin\\theta", note: "vertical piece" },
            { tex: "|A| = \\sqrt{A_x^2 + A_y^2}" },
          ],
          variables: [
            { sym: "A", meaning: "vector magnitude", unit: "varies" },
            { sym: "\\theta", meaning: "angle from +x axis", unit: "° or rad" },
          ],
          why: "cosine and sine are the adjacent/hypotenuse and opposite/hypotenuse ratios — the projection machinery of every 2D physics problem.",
          tryThis: "Set θ = 45° and compare A_x and A_y. Then set θ = 90° and watch A_x collapse to zero — a purely vertical vector has no horizontal piece.",
        }}
        prediction={{
          question: "If you keep |A| fixed but increase θ from 30° to 60°, what happens to A_x?",
          options: ["It grows", "It shrinks", "It stays the same", "It flips sign"],
          correct: 1,
          explain: "A_x = A cos θ, and cosine falls from 0.87 to 0.5 as θ grows from 30° to 60° — the horizontal projection shrinks while the vertical one grows.",
        }}
        running={true}
        onPlayPause={() => {}}
        onReset={() => {}}
      />
    </div>
  );
}

// ===================== KINEMATICS =====================
export function KinematicsSim() {
  const [a, setA] = useState(2);
  const [v0, setV0] = useState(0);
  const [x0, setX0] = useState(0);
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const samplesRef = useRef<{ t: number; x: number; v: number }[]>([]);
  const initRef = useRef(false);
  const clock = useClock();
  const lastA = useRef({ a, v0, x0 });

  // Re-seed history whenever parameters or reset change.
  if (lastA.current.a !== a || lastA.current.v0 !== v0 || lastA.current.x0 !== x0) {
    lastA.current = { a, v0, x0 };
    initRef.current = false;
  }
  const reset = () => { initRef.current = false; setTick((n) => n + 1); };

  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const { t, dt } = clock(performance.now(), running);
    if (!initRef.current) {
      samplesRef.current = [{ t: 0, x: x0, v: v0 }];
      initRef.current = true;
    }
    if (dt > 0) {
      const prev = samplesRef.current[samplesRef.current.length - 1];
      const v = prev.v + a * dt;
      const x = prev.x + v * dt; // semi-implicit Euler — stable for constant a
      samplesRef.current.push({ t, x, v });
      if (samplesRef.current.length > 1400) samplesRef.current.shift();
    }
    const s = samplesRef.current;
    const cur = s[s.length - 1];

    // object on a track, wrapping so long runs stay visible
    const trackY = h * 0.28;
    ctx.fillStyle = "rgba(124,108,244,0.10)";
    ctx.fillRect(0, trackY + 14, w, 4);
    const px = 40 + (((cur.x * 3) % (w - 80)) + w - 80) % (w - 80);
    ball(ctx, px, trackY, 12, "#7c6cf4");
    arrow(ctx, px, trackY - 18, px + Math.max(-90, Math.min(90, cur.v * 6)), trackY - 18, "#ff8fb1", 2.5);
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`t = ${t.toFixed(1)} s   x = ${cur.x.toFixed(1)} m   v = ${cur.v.toFixed(1)} m/s`, 12, 18);

    // live x(t) and v(t) graphs
    const gx = w * 0.6, gw = w * 0.36, gh = h * 0.26, gy1 = h * 0.12, gy2 = h * 0.56;
    const drawGraph = (gy: number, getter: (p: { t: number; x: number; v: number }) => number, label: string, color: string) => {
      ctx.strokeStyle = muted; ctx.lineWidth = 1;
      ctx.strokeRect(gx, gy, gw, gh);
      if (s.length > 1) {
        const tMax = Math.max(6, s[s.length - 1].t);
        let lo = Infinity, hi = -Infinity;
        for (const p of s) { const val = getter(p); if (val < lo) lo = val; if (val > hi) hi = val; }
        const pad = Math.max(0.5, (hi - lo) * 0.15);
        lo -= pad; hi += pad;
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.beginPath();
        s.forEach((pt, i) => {
          const X = gx + (pt.t / tMax) * gw;
          const Y = gy + gh - ((getter(pt) - lo) / (hi - lo)) * gh;
          if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        });
        ctx.stroke();
      }
      ctx.fillStyle = muted; ctx.font = "10px system-ui";
      ctx.fillText(label, gx + 4, gy - 4);
    };
    drawGraph(gy1, (p) => p.x, "x(t) — slope is v", "#8fb8f7");
    drawGraph(gy2, (p) => p.v, "v(t) — slope is a", "#ff8fb1");
    void tick;
  }, { running });

  return (
    <div>
      <SimFrame height={300}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="x₀" value={x0} min={-10} max={10} onChange={setX0} format={(v) => `${v} m`} />
        <Slider label="v₀" value={v0} min={-10} max={10} onChange={setV0} format={(v) => `${v} m/s`} />
        <Slider label="a" value={a} min={-6} max={6} step={0.5} onChange={setA} format={(v) => `${v} m/s²`} />
      </SimRow>
      <Panel
        running={running}
        onPlayPause={() => setRunning((r) => !r)}
        onReset={reset}
        physics={{
          what: "An object with constant acceleration: velocity grows linearly, position curves quadratically. The graphs update live as the state integrates.",
          equations: [
            { tex: "v = v_0 + at" },
            { tex: "x = x_0 + v_0 t + \\tfrac{1}{2}at^2" },
          ],
          variables: [
            { sym: "x_0", meaning: "initial position", unit: "m" },
            { sym: "v_0", meaning: "initial velocity", unit: "m/s" },
            { sym: "a", meaning: "constant acceleration", unit: "m/s²" },
          ],
          why: "Acceleration is the slope of v(t); velocity is the slope of x(t). A straight v(t) line forces a parabolic x(t) — the two graphs are one object described twice.",
          tryThis: "Set v₀ = 10 and a = −2: the cart slows, stops (v = 0 where the pink graph crosses zero), then reverses. Watch x(t) peak exactly when v = 0.",
        }}
        prediction={{
          question: "With v₀ = 0, if you double a, how does the distance traveled in a fixed time change?",
          options: ["Doubles", "Quadruples", "Stays the same", "Halves"],
          correct: 1,
          explain: "x = ½at², so distance scales with a. Doubling a doubles the velocity gained each second AND the time it acts — distance goes as a, but compare the curves: x(2s) with a=2 is 4 m, with a=4 is 8 m… now try t = 2 s vs 4 s to see the t² side.",
          runLabel: "Run and compare graphs",
        }}
      />
    </div>
  );
}

// ===================== PROJECTILE =====================
export function ProjectileSim() {
  const [v0, setV0] = useState(24);
  const [angle, setAngle] = useState(50);
  const [h0, setH0] = useState(0);
  const [g, setG] = useState(9.8);
  const [drag, setDrag] = useState(false);
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const stateRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, t: 0, flying: false, landed: false });
  const trailsRef = useRef<{ pts: [number, number][]; label: string }[]>([]);
  const paramsRef = useRef({ v0, angle, h0, g, drag });
  if (paramsRef.current.v0 !== v0 || paramsRef.current.angle !== angle || paramsRef.current.h0 !== h0 || paramsRef.current.g !== g || paramsRef.current.drag !== drag) {
    paramsRef.current = { v0, angle, h0, g, drag };
    stateRef.current = { x: 0, y: 0, vx: 0, vy: 0, t: 0, flying: false, landed: false };
  }
  const clock = useClock();

  const launch = () => {
    const rad = (angle * Math.PI) / 180;
    stateRef.current = { x: 0, y: h0, vx: v0 * Math.cos(rad), vy: v0 * Math.sin(rad), t: 0, flying: true, landed: false };
    setRunning(true);
    setTick((n) => n + 1);
  };

  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    clock(performance.now(), running);
    const st = stateRef.current;
    // integrate only while flying (fixed substeps for a clean trajectory)
    if (st.flying && !st.landed) {
      const sub = 4, dt = 0.016 / sub;
      for (let i = 0; i < sub; i++) {
        if (drag) { st.vx *= 0.999; st.vy *= 0.999; }
        st.vy -= g * dt;
        st.x += st.vx * dt;
        st.y += st.vy * dt;
        st.t += dt;
        if (st.y <= 0) { st.y = 0; st.flying = false; st.landed = true; break; }
      }
      const last = trailsRef.current[trailsRef.current.length - 1];
      if (last && last.label === "live") last.pts.push([st.x, st.y]);
      else if (st.t > 0.03) trailsRef.current.push({ pts: [[st.x, st.y]], label: "live" });
    }

    const groundY = h - 30;
    const spanX = Math.max(30, st.x * 1.35, ...trailsRef.current.flatMap((tr) => tr.pts.map((p) => p[0])) * 1.15, 50);
    const spanY = Math.max(20, h0 * 1.3, ...trailsRef.current.flatMap((tr) => tr.pts.map((p) => p[1])) * 1.25, 30);
    const scale = Math.min((w - 60) / spanX, (groundY - 40) / spanY);

    grid(ctx, w, h, 40);
    ctx.strokeStyle = muted; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke();

    // ghost trails (previous shots)
    trailsRef.current.forEach((tr, i) => {
      if (tr.label === "live") return;
      ctx.strokeStyle = `rgba(124,108,244,${0.28 + 0.05 * i})`; ctx.lineWidth = 1.5;
      ctx.beginPath();
      tr.pts.forEach((p, j) => {
        const X = 30 + p[0] * scale, Y = groundY - p[1] * scale;
        if (j === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      });
      ctx.stroke();
    });
    // current trail
    const live = trailsRef.current.find((tr) => tr.label === "live");
    if (live) {
      ctx.strokeStyle = "#7c6cf4"; ctx.lineWidth = 2.5;
      ctx.beginPath();
      live.pts.forEach((p, j) => {
        const X = 30 + p[0] * scale, Y = groundY - p[1] * scale;
        if (j === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      });
      ctx.stroke();
    }

    const bx = 30 + st.x * scale, by = groundY - st.y * scale;
    const speed = Math.hypot(st.vx, st.vy);
    if (st.flying) {
      arrow(ctx, bx, by, bx + st.vx * 1.4, by, "#8fb8f7", 2);
      arrow(ctx, bx, by, bx, by - st.vy * 1.4, "#6fd6c8", 2);
    }
    ball(ctx, bx, by, 9, st.landed ? "#a49dbf" : "#ff8fb1");

    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(
      st.landed
        ? `Landed: range = ${st.x.toFixed(1)} m in ${st.t.toFixed(2)} s`
        : st.flying
          ? `t = ${st.t.toFixed(2)} s   x = ${st.x.toFixed(1)} m   y = ${st.y.toFixed(1)} m   |v| = ${speed.toFixed(1)} m/s`
          : "Set launch speed and angle, then Launch.",
      12, 20,
    );
    // launcher
    const rad = (angle * Math.PI) / 180;
    ctx.strokeStyle = fg; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(30, groundY - h0 * scale); ctx.lineTo(30 + 26 * Math.cos(rad), groundY - h0 * scale - 26 * Math.sin(rad)); ctx.stroke();
    if (h0 > 0) {
      ctx.fillStyle = muted;
      ctx.fillRect(30 - 8, groundY - h0 * scale, 8, h0 * scale);
    }
    ctx.fillStyle = muted; ctx.font = "11px system-ui";
    ctx.fillText(`v₀ = ${v0} m/s   θ = ${angle}°   h₀ = ${h0} m   g = ${g.toFixed(1)} m/s²${drag ? "   (air drag on)" : ""}`, 12, h - 10);
  }, { running, resetKey: tick });

  return (
    <div>
      <SimFrame height={320}><canvas ref={ref} className="h-full w-full touch-none" /></SimFrame>
      <SimRow>
        <Slider label="v₀" value={v0} min={5} max={45} onChange={setV0} format={(v) => `${v} m/s`} />
        <Slider label="Angle" value={angle} min={5} max={85} onChange={setAngle} format={(v) => `${v}°`} />
        <Slider label="Launch height h₀" value={h0} min={0} max={20} onChange={setH0} format={(v) => `${v} m`} />
        <Slider label="g" value={g} min={1.6} max={24.8} step={0.1} onChange={setG} format={(v) => `${v.toFixed(1)} m/s²`} />
        <Toggle label="Air drag" on={drag} onChange={setDrag} />
        <button onClick={launch} className="clay-btn clay-press px-4 py-2 text-xs font-bold">🚀 Launch</button>
        <button onClick={() => { trailsRef.current = []; }} className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold">Clear trails</button>
      </SimRow>
      <Panel
        running={running}
        onPlayPause={() => setRunning((r) => !r)}
        onReset={() => { stateRef.current = { x: 0, y: 0, vx: 0, vy: 0, t: 0, flying: false, landed: false }; trailsRef.current = []; setRunning(false); }}
        physics={{
          what: "A launched ball under gravity. Horizontal velocity never changes; vertical velocity changes by g every second. The trail records the true integrated path.",
          equations: [
            { tex: "a_y = -g,\\; a_x = 0" },
            { tex: "R = \\frac{v_0^2 \\sin 2\\theta}{g}", note: "level ground only" },
            { tex: "H = \\frac{(v_0\\sin\\theta)^2}{2g}" },
          ],
          variables: [
            { sym: "v_0", meaning: "launch speed", unit: "m/s" },
            { sym: "\\theta", meaning: "launch angle", unit: "°" },
            { sym: "g", meaning: "gravitational acceleration", unit: "m/s²" },
          ],
          why: "Nothing horizontal pushes the ball (drag off), so x-velocity is constant while gravity bends the path downward — two independent 1D motions sharing a clock.",
          tryThis: "Fire at 30° and 60° with the same speed: same range on level ground (sin 2θ matches), but very different apex heights. Then raise h₀ — the optimal angle drops below 45°.",
        }}
        prediction={{
          question: "At fixed speed on level ground, which angle travels farthest?",
          options: ["30°", "45°", "60°", "They're all equal"],
          correct: 1,
          explain: "R = v₀²sin(2θ)/g peaks when 2θ = 90°, i.e. θ = 45°. 30° and 60° give identical (shorter) ranges — launch at both and watch the trails agree. Turn on air drag and 45° loses the crown: drag punishes the high, slow arc differently.",
          runLabel: "Launch and check",
        }}
      />
    </div>
  );
}

// ===================== FREE-BODY DIAGRAM (ramp) =====================
export function FBDSim() {
  const [theta, setTheta] = useState(0);
  const [mass, setMass] = useState(10);
  const [withFriction, setWithFriction] = useState(true);
  const [mu, setMu] = useState(0.3);
  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    grid(ctx, w, h);
    const cx = w * 0.5, cy = h * 0.55;
    const rad = (theta * Math.PI) / 180;
    ctx.strokeStyle = muted; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 150, cy + 150 * Math.tan(rad));
    ctx.lineTo(cx + 150, cy - 150 * Math.tan(rad));
    ctx.stroke();
    const bx = cx, by = cy;
    const blockS = 26;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(-rad);
    ctx.fillStyle = "#7c6cf4";
    ctx.beginPath(); ctx.roundRect(-blockS, -blockS, blockS * 2, blockS * 2, 8); ctx.fill();
    ctx.restore();
    const g = 9.8 * 4; // px per m/s² scale
    const Wv = mass * g;
    arrow(ctx, bx, by, bx, by + Wv * 0.5, "#ff8fb1", 3, 9);
    const nx = Math.sin(rad) * Wv * Math.cos(rad) * 0.5 + Math.sin(rad) * 0; // scaled below
    const FN = mass * 9.8 * Math.cos(rad);
    const nLen = FN * 0.5 * 4 / 9.8; // px
    arrow(ctx, bx, by, bx + Math.sin(rad) * nLen, by - Math.cos(rad) * nLen, "#6fd6c8", 3, 9);
    if (withFriction) {
      const fMax = mu * FN;
      const gAlong = 9.8 * Math.sin(rad) * mass;
      const fAct = Math.min(fMax, gAlong);
      const fLen = fAct * 0.5 * 4 / 9.8;
      arrow(ctx, bx, by, bx - Math.cos(rad) * fLen, by - Math.sin(rad) * fLen, "#ffc46b", 3, 9);
    }
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    const fMax = mu * FN;
    const gAlong = 9.8 * Math.sin(rad); // m/s² along the ramp
    const slides = gAlong * mass > fMax + 1e-9;
    const aSlide = Math.max(0, gAlong - mu * 9.8 * Math.cos(rad));
    ctx.fillText(`F_N = mg·cosθ = ${FN.toFixed(0)} N   F_g = ${(mass * 9.8).toFixed(0)} N`, 12, 20);
    ctx.fillText(`f_max = μF_N = ${fMax.toFixed(0)} N  vs  mg·sinθ = ${(gAlong * mass).toFixed(0)} N`, 12, 38);
    ctx.fillText(
      slides
        ? `Slides! a = ${aSlide.toFixed(1)} m/s² down-ramp`
        : `Static: friction holds it (needs ${(gAlong * mass).toFixed(0)} N ≤ ${fMax.toFixed(0)} N)`,
      12, 56,
    );
    void nx;
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
      <Panel
        showControls={false}
        running
        onPlayPause={() => {}}
        onReset={() => { setTheta(0); setMass(10); setMu(0.3); setWithFriction(true); }}
        physics={{
          what: "A block on an adjustable incline. All forces are drawn to scale from the actual equations — tilt until the downhill pull beats friction's ceiling and the verdict flips.",
          equations: [
            { tex: "F_N = mg\\cos\\theta" },
            { tex: "f_{\\max} = \\mu F_N" },
            { tex: "a = g(\\sin\\theta - \\mu\\cos\\theta)", note: "once sliding" },
          ],
          variables: [
            { sym: "\\theta", meaning: "incline angle", unit: "°" },
            { sym: "\\mu", meaning: "friction coefficient", unit: "—" },
            { sym: "F_N", meaning: "normal force", unit: "N" },
          ],
          why: "Gravity splits into ramp-parallel (mg sinθ) and ramp-perpendicular (mg cosθ) pieces. The surface can only push perpendicular (normal) and resist along (friction, up to its ceiling).",
          tryThis: "Keep μ = 0.3 and sweep θ from 15° to 30°: the tipping angle is θ = arctan(μ) ≈ 16.7°. Doubling mass changes nothing about whether it slides — both sides scale with m.",
        }}
        prediction={{
          question: "If you double the mass (same θ, μ), does the block become more or less likely to slide?",
          options: ["More likely", "Less likely", "Exactly the same", "Depends on g"],
          correct: 2,
          explain: "Both the downhill pull (mg sinθ) and the friction ceiling (μmg cosθ) scale with m, so mass cancels. The slide condition is tanθ > μ — mass-independent. Verify: the verdict text doesn't budge when you drag mass.",
        }}
      />
    </div>
  );
}

// ===================== COLLISION =====================
export function CollisionSim() {
  const [m1, setM1] = useState(4);
  const [m2, setM2] = useState(2);
  const [v1, setV1] = useState(5);
  const [elastic, setElastic] = useState(false);
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const posRef = useRef({ x1: 0.12, x2: 0.72, v1x: 0, v2x: 0, hit: false, done: false });
  const pInRef = useRef(0);
  const kInRef = useRef(0);
  const clock = useClock();

  const reset = () => {
    posRef.current = { x1: 0.12, x2: 0.72, v1x: 0, v2x: 0, hit: false, done: false };
    pInRef.current = 0; kInRef.current = 0;
    setRunning(false);
    setTick((n) => n + 1);
  };
  const run = () => {
    const s = 1 / 40; // meters per normalized unit
    posRef.current = { x1: 0.12, x2: 0.72, v1x: v1 * s, v2x: 0, hit: false, done: false };
    pInRef.current = m1 * v1;
    kInRef.current = 0.5 * m1 * v1 * v1;
    setRunning(true);
  };

  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const { dt } = clock(performance.now(), running);
    const p = posRef.current;
    if (dt > 0 && !p.done) {
      p.x1 += p.v1x * dt * 40;
      p.x2 += p.v2x * dt * 40;
      if (!p.hit && p.x1 + 0.05 >= p.x2 - 0.05) {
        p.hit = true;
        const M = m1 + m2;
        if (elastic) {
          const u1 = p.v1x / 40, u2 = p.v2x / 40; // m/s
          p.v1x = ((m1 - m2) * u1 + 2 * m2 * u2) / M * 40;
          p.v2x = ((m2 - m1) * u2 + 2 * m1 * u1) / M * 40;
        } else {
          const vf = ((m1 * p.v1x + m2 * p.v2x) / M);
          p.v1x = vf; p.v2x = vf;
        }
      }
      if (p.x1 > 1.2 || p.x2 > 1.2 || p.x1 < -0.15 || p.x2 < -0.15) { p.done = true; setRunning(false); }
    }
    const r1 = 14 + m1 * 2.2, r2 = 14 + m2 * 2.2;
    const x1 = p.x1 * w, x2 = p.x2 * w;
    const groundY = h * 0.52;
    ctx.strokeStyle = muted; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke();
    ball(ctx, x1, groundY - r1, r1, "#7c6cf4");
    ball(ctx, x2, groundY - r2, r2, "#ff8fb1");
    arrow(ctx, x1, groundY - 2 * r1 - 10, x1 + p.v1x * 3, groundY - 2 * r1 - 10, "#8fb8f7", 2);
    arrow(ctx, x2, groundY - 2 * r2 - 10, x2 + p.v2x * 3, groundY - 2 * r2 - 10, "#8fb8f7", 2);
    const v1ms = p.v1x / 40, v2ms = p.v2x / 40;
    const pTot = m1 * v1ms + m2 * v2ms;
    const kTot = 0.5 * m1 * v1ms * v1ms + 0.5 * m2 * v2ms * v2ms;
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(
      p.hit
        ? `p = ${pTot.toFixed(1)} kg·m/s (before: ${pInRef.current.toFixed(1)})   K = ${kTot.toFixed(1)} J (before: ${kInRef.current.toFixed(1)} J)`
        : `p = ${pTot.toFixed(1)} kg·m/s   K = ${kTot.toFixed(1)} J — press Run`,
      12, 22,
    );
    ctx.fillStyle = muted; ctx.font = "11px system-ui";
    ctx.fillText(
      p.hit
        ? elastic
          ? `Δp = ${(pTot - pInRef.current).toFixed(2)}  ΔK = ${(kTot - kInRef.current).toFixed(1)} J — both ≈ 0: elastic.`
          : `Δp = ${(pTot - pInRef.current).toFixed(2)} (≈0: momentum survives)  ΔK = ${(kTot - kInRef.current).toFixed(1)} J (lost to deformation).`
        : "Momentum: m₁v₁ + m₂v₂ — watch it stay level through the hit.",
      12, 40,
    );
  }, { running, resetKey: tick });

  return (
    <div>
      <SimFrame height={280}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="m₁" value={m1} min={1} max={10} onChange={setM1} format={(v) => `${v} kg`} />
        <Slider label="v₁" value={v1} min={1} max={12} onChange={setV1} format={(v) => `${v} m/s`} />
        <Slider label="m₂" value={m2} min={1} max={10} onChange={setM2} format={(v) => `${v} kg`} />
        <Toggle label="Elastic" on={elastic} onChange={setElastic} />
        <button onClick={run} className="clay-btn clay-press px-4 py-2 text-xs font-bold">▶ Run collision</button>
      </SimRow>
      <Panel
        running={running}
        onPlayPause={() => setRunning((r) => !r)}
        onReset={reset}
        physics={{
          what: "Two carts on a frictionless track. The collision solves the exact conservation equations — momentum in every case, kinetic energy only when elastic.",
          equations: [
            { tex: "m_1u_1 + m_2u_2 = m_1v_1 + m_2v_2" },
            { tex: "\\tfrac12 m_1u_1^2 + \\tfrac12 m_2u_2^2 = \\tfrac12 m_1v_1^2 + \\tfrac12 m_2v_2^2", note: "elastic only" },
            { tex: "v_f = \\frac{m_1u_1}{m_1+m_2}", note: "perfectly inelastic" },
          ],
          variables: [
            { sym: "m", meaning: "cart mass", unit: "kg" },
            { sym: "v", meaning: "cart velocity", unit: "m/s" },
            { sym: "p", meaning: "momentum", unit: "kg·m/s" },
            { sym: "K", meaning: "kinetic energy", unit: "J" },
          ],
          why: "During contact, equal-and-opposite forces act for the same time → equal-and-opposite impulses → the momentum lost by one cart is gained by the other. Energy has no such guarantee: deformation and heat absorb some.",
          tryThis: "m₁ = 1 kg at 6 m/s into m₂ = 9 kg at rest, elastic: cart 1 bounces BACK (check: v₁' = (1−9)·6/10 = −4.8 m/s). Then run it inelastic — cart 1 keeps creeping forward at 0.6 m/s.",
        }}
        prediction={{
          question: "Equal masses, elastic collision: cart 2 starts at rest. After the hit, cart 1 is…",
          options: ["Still moving forward", "At rest", "Moving backward", "Moving faster"],
          correct: 1,
          explain: "With m₁ = m₂ the elastic solution swaps velocities: v₁' = 0, v₂' = v₁. Set m₁ = m₂ = 4 and run it — cart 1 stops dead and cart 2 departs at 5 m/s.",
          runLabel: "Run it and watch",
        }}
      />
    </div>
  );
}

// ===================== ENERGY COASTER =====================
export function EnergySim() {
  const [frictionless, setFrictionless] = useState(true);
  const [hill2, setHill2] = useState(45);
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const sRef = useRef(0.06);
  const vRef = useRef(0);
  const clock = useClock();

  const reset = () => { sRef.current = 0.06; vRef.current = 0; setTick((n) => n + 1); setRunning(true); };

  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const { dt } = clock(performance.now(), running);
    const groundY = h - 26;
    const g = (x: number, c: number, wd: number) => Math.exp(-((x - c) ** 2) / (2 * wd * wd));
    const trackH = (s: number) => 0.95 * g(s, 0.06, 0.2) + (hill2 / 100) * 0.95 * g(s, 0.62, 0.16) + 0.06;
    const scaleY = h - 90;
    // physics: energy conservation with optional friction along arc-length
    if (dt > 0) {
      const y = trackH(sRef.current);
      const y2 = trackH(sRef.current + 0.002);
      const slope = (y2 - y) / 0.002;
      const aG = -9.8 * 6 * slope / Math.sqrt(1 + slope * slope); // scaled gravity along track
      if (frictionless) {
        vRef.current += aG * dt;
      } else {
        const aFric = -0.55 * Math.sign(vRef.current) * Math.abs(vRef.current + 1e-6) * 0.02 - Math.sign(slope) * 0.35;
        vRef.current += (aG + aFric) * dt;
      }
      vRef.current = Math.max(0, Math.min(vRef.current, 9));
      sRef.current += (vRef.current * dt) / 22;
      if (sRef.current > 1) sRef.current = 1;
      if (vRef.current < 0.02 && Math.abs(aG) < 0.05) vRef.current = 0; // stalled
    }
    const s = sRef.current;
    const yNorm = trackH(s);
    const H0 = trackH(0.06);
    const U = yNorm / H0;
    const K = Math.max(0, 1 - U - (frictionless ? 0 : Math.min(0.85, sRef.current * 0.5)));
    const v = Math.sqrt(Math.max(0, K)) * vRef.current * 1.0 + Math.sqrt(2 * 9.8 * Math.max(0, K) * H0 * 14);

    // track
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
    // speed arrow
    arrow(ctx, cx, groundY - yNorm * scaleY - 26, cx + Math.min(60, v * 3), groundY - yNorm * scaleY - 26, "#8fb8f7", 2);
    // energy bars
    const bx = w - 130;
    const bars: [string, number, string][] = [["K", K, "#ff8fb1"], ["U", U, "#6fd6c8"], ["lost", frictionless ? 0 : Math.min(0.85, s * 0.5), "#a49dbf"]];
    ctx.font = "11px system-ui";
    bars.forEach(([label, val, color], i) => {
      const by = 20 + i * 34;
      ctx.fillStyle = muted; ctx.fillText(label, bx - 24, by + 10);
      ctx.fillStyle = "rgba(128,120,160,0.15)"; ctx.fillRect(bx, by, 100, 14);
      ctx.fillStyle = color; ctx.fillRect(bx, by, Math.max(0, Math.min(1, val)) * 100, 14);
    });
    ctx.fillStyle = fg;
    ctx.fillText(`v = ${v.toFixed(1)} m/s (scaled)   ${v < 0.5 && s > 0.2 && s < 0.55 ? "— climbing, nearly stalled" : ""}`, 12, 20);
  }, { running, resetKey: tick });

  return (
    <div>
      <SimFrame height={300}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="Second hill height" value={hill2} min={20} max={100} onChange={setHill2} format={(v) => `${v}%`} />
        <Toggle label="No friction" on={frictionless} onChange={setFrictionless} />
        <button onClick={() => { reset(); }} className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold">↻ From the top</button>
      </SimRow>
      <Panel
        running={running}
        onPlayPause={() => setRunning((r) => !r)}
        onReset={reset}
        physics={{
          what: "A car released from the first hill. Energy trades between kinetic and potential; with friction on, some leaks away permanently. The motion comes from energy conservation, not a script.",
          equations: [
            { tex: "K_i + U_i = K_f + U_f + E_{\\text{lost}}" },
            { tex: "v = \\sqrt{2g\\,\\Delta h}" },
          ],
          variables: [
            { sym: "K", meaning: "kinetic energy", unit: "J (normalized)" },
            { sym: "U", meaning: "gravitational PE", unit: "J (normalized)" },
            { sym: "E_{\\text{lost}}", meaning: "thermal/deformation loss", unit: "J" },
          ],
          why: "At any height h, energy conservation caps the speed: v² = 2g(h₀ − h). If a hill's top is at h₀ (or higher with friction), the car cannot crest it — it stalls, slides back, and oscillates.",
          tryThis: "Set the second hill to 100% (equal to the first): the car just barely crests in a frictionless world. Switch friction on and reset — now it can't make it and rolls back.",
        }}
        prediction={{
          question: "Second hill at 100%, friction OFF. The car…",
          options: ["Crests easily", "Just barely reaches the top and crests", "Stalls right at the top, wobbling", "Stops halfway up"],
          correct: 1,
          explain: "Energy conservation gives K = 0 exactly at equal height — the car arrives with zero speed, cresting only in principle. (Real coasters start higher than every hill for exactly this reason; with friction on, the same setting fails outright.)",
          runLabel: "Release and watch",
        }}
      />
    </div>
  );
}

// ===================== ROTATION =====================
export function RotationSim() {
  const [Ikind, setIkind] = useState<"hoop" | "disk" | "sphere">("disk");
  const [torque, setTorque] = useState(1.5);
  const [mass, setMass] = useState(2);
  const [radius, setRadius] = useState(80);
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const thetaRef = useRef(0);
  const omegaRef = useRef(0);
  const histRef = useRef<{ t: number; w: number }[]>([]);
  const clock = useClock();

  const reset = () => { thetaRef.current = 0; omegaRef.current = 0; histRef.current = []; setTick((n) => n + 1); };
  const stepOnce = () => {
    const c = Ikind === "hoop" ? 1 : Ikind === "disk" ? 0.5 : 0.4;
    const I = c * mass * (radius / 100) ** 2;
    const alpha = torque / I;
    omegaRef.current = Math.min(20, omegaRef.current + alpha * 0.05);
    thetaRef.current += omegaRef.current * 0.05;
  };

  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const { t, dt } = clock(performance.now(), running);
    const c = Ikind === "hoop" ? 1 : Ikind === "disk" ? 0.5 : 0.4;
    const I = c * mass * (radius / 100) ** 2;
    const alpha = torque / I;
    if (dt > 0) {
      omegaRef.current = Math.min(20, omegaRef.current + alpha * dt);
      thetaRef.current += omegaRef.current * dt;
      histRef.current.push({ t, w: omegaRef.current });
      if (histRef.current.length > 700) histRef.current.shift();
    }
    const cx = w * 0.38, cy = h * 0.55, R = Math.min(w, h) * 0.26;
    ctx.strokeStyle = muted; ctx.lineWidth = 2;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(thetaRef.current);
    if (Ikind === "hoop") {
      ctx.lineWidth = 6; ctx.strokeStyle = "#7c6cf4";
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = "rgba(124,108,244,0.4)";
      for (let i = 0; i < 8; i++) { const ang = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R * Math.cos(ang), R * Math.sin(ang)); ctx.stroke(); }
    } else if (Ikind === "disk") {
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
    const mx = cx + R * Math.cos(thetaRef.current), my = cy + R * Math.sin(thetaRef.current);
    ball(ctx, mx, my, 6, "#ff8fb1");
    arrow(ctx, mx, my, mx - Math.sin(thetaRef.current) * omegaRef.current * 12, my + Math.cos(thetaRef.current) * omegaRef.current * 12, "#6fd6c8", 2);
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`τ = ${torque.toFixed(1)} N·m   I = ${I.toFixed(2)} kg·m² (${c}mR²)   α = ${alpha.toFixed(1)} rad/s²   ω = ${omegaRef.current.toFixed(1)} rad/s`, 12, 20);
    // real ω(t) graph from recorded history
    const gx = w * 0.7, gw = w * 0.26, gy = h * 0.25, gh = h * 0.45;
    ctx.strokeStyle = muted; ctx.lineWidth = 1; ctx.strokeRect(gx, gy, gw, gh);
    if (histRef.current.length > 1) {
      ctx.strokeStyle = "#ff8fb1"; ctx.lineWidth = 2;
      ctx.beginPath();
      const tMax = Math.max(6, t);
      histRef.current.forEach((pt, i) => {
        const X = gx + (pt.t / tMax) * gw;
        const Y = gy + gh - (Math.min(20, pt.w) / 20) * gh;
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      });
      ctx.stroke();
    }
    ctx.fillStyle = muted; ctx.font = "10px system-ui";
    ctx.fillText("ω(t) — straight line: α = τ/I", gx + 4, gy - 4);
  }, { running, resetKey: tick });

  return (
    <div>
      <SimFrame height={300}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <div className="flex gap-2">
          {(["hoop", "disk", "sphere"] as const).map((k) => (
            <button key={k} onClick={() => setIkind(k)} className={`clay-sm clay-press px-3 py-1.5 text-xs font-semibold ${Ikind === k ? "text-[var(--clay-primary-deep)]" : ""}`} style={Ikind === k ? { background: "var(--clay-primary-tint)" } : undefined}>{k}</button>
          ))}
        </div>
        <Slider label="Torque τ" value={torque} min={0} max={4} step={0.1} onChange={setTorque} format={(v) => `${v.toFixed(1)} N·m`} />
        <Slider label="Mass" value={mass} min={0.5} max={6} step={0.5} onChange={setMass} format={(v) => `${v} kg`} />
        <Slider label="Radius" value={radius} min={40} max={120} onChange={setRadius} format={(v) => `${(v / 100).toFixed(1)} m`} />
      </SimRow>
      <Panel
        running={running}
        onPlayPause={() => setRunning((r) => !r)}
        onReset={reset}
        onStep={stepOnce}
        physics={{
          what: "A rigid body spun up by a constant torque. Angular acceleration obeys the rotational Newton's second law: α = τ/I. The ω(t) graph is a straight line whose slope IS α.",
          equations: [
            { tex: "\\tau = I\\alpha" },
            { tex: "I_{\\text{hoop}} = mR^2,\\; I_{\\text{disk}} = \\tfrac12 mR^2,\\; I_{\\text{sphere}} = 0.4\\,mR^2" },
            { tex: "K_{\\text{rot}} = \\tfrac12 I\\omega^2" },
          ],
          variables: [
            { sym: "\\tau", meaning: "net torque", unit: "N·m" },
            { sym: "I", meaning: "moment of inertia", unit: "kg·m²" },
            { sym: "\\alpha", meaning: "angular acceleration", unit: "rad/s²" },
            { sym: "\\omega", meaning: "angular velocity", unit: "rad/s" },
          ],
          why: "I measures how far mass sits from the axis (∫r²dm). Same torque on a bigger I → smaller α: mass at the rim resists spin-up more than mass at the hub.",
          tryThis: "Note α for the disk, then switch to hoop: it drops by half. Now double the radius slider — I quadruples, so α falls to a quarter. The readouts follow τ/I exactly.",
        }}
        prediction={{
          question: "Keep torque fixed and double the radius. α becomes…",
          options: ["Half", "One quarter", "Double", "Unchanged"],
          correct: 1,
          explain: "I ∝ R² for every shape, so doubling R quadruples I — and α = τ/I falls to a quarter. Watch the slope of the pink ω(t) line flatten by 4×.",
        }}
      />
    </div>
  );
}

// ===================== TORQUE SEESAW =====================
export function TorqueSim() {
  const [m1, setM1] = useState(3);
  const [d1, setD1] = useState(1.5);
  const [m2, setM2] = useState(4);
  const [d2, setD2] = useState(1.5);
  const tiltRef = useRef(0);
  const omegaRef = useRef(0);
  const lastRef = useRef(0);
  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    if (!lastRef.current) lastRef.current = performance.now();
    const now = performance.now();
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const cx = w * 0.5, cy = h * 0.5;
    const netTau = m1 * 9.8 * d1 - m2 * 9.8 * d2;
    const angAcc = netTau * 0.0006;
    omegaRef.current += angAcc * dt * 60;
    omegaRef.current *= 0.97; // soft damping so it settles instead of spinning
    tiltRef.current += omegaRef.current * dt * 60;
    tiltRef.current = Math.max(-0.32, Math.min(0.32, tiltRef.current));
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tiltRef.current);
    ctx.fillStyle = "#7c6cf4";
    ctx.beginPath(); ctx.roundRect(-w * 0.42, -8, w * 0.84, 16, 8); ctx.fill();
    const px1 = -d1 * 80, px2 = d2 * 80;
    ball(ctx, px1, -24, 10 + m1 * 2, "#ff8fb1");
    ball(ctx, px2, -24, 10 + m2 * 2, "#6fd6c8");
    ctx.restore();
    ctx.fillStyle = muted;
    ctx.beginPath(); ctx.moveTo(cx - 16, cy + 8); ctx.lineTo(cx + 16, cy + 8); ctx.lineTo(cx, cy + 44); ctx.closePath(); ctx.fill();
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`τ₁ = m₁g·d₁ = ${(m1 * 9.8 * d1).toFixed(1)} N·m (CCW)    τ₂ = m₂g·d₂ = ${(m2 * 9.8 * d2).toFixed(1)} N·m (CW)`, 12, 20);
    ctx.fillText(Math.abs(netTau) < 0.5 ? "⚖ Balanced — Στ = 0!" : netTau > 0 ? "Tips left (CCW wins)" : "Tips right (CW wins)", 12, 40);
    ctx.fillText(`m₁ = ${m1} kg at ${d1.toFixed(1)} m (left) · m₂ = ${m2} kg at ${d2.toFixed(1)} m (right)`, 12, h - 22);
  });
  return (
    <div>
      <SimFrame height={280}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="m₁ (left)" value={m1} min={1} max={8} onChange={setM1} format={(v) => `${v} kg`} />
        <Slider label="d₁ (left arm)" value={d1} min={0.2} max={3} step={0.1} onChange={setD1} format={(v) => `${v} m`} />
        <Slider label="m₂ (right)" value={m2} min={1} max={8} onChange={setM2} format={(v) => `${v} kg`} />
        <Slider label="d₂ (right arm)" value={d2} min={0.2} max={3} step={0.1} onChange={setD2} format={(v) => `${v} m`} />
      </SimRow>
      <Panel
        showControls={false}
        running
        onPlayPause={() => {}}
        onReset={() => { setM1(3); setD1(1.5); setM2(4); setD2(1.5); }}
        physics={{
          what: "A rigid plank on a pivot. Each weight exerts torque τ = rF⊥; the plank tips toward the larger torque and balances only when they cancel.",
          equations: [
            { tex: "\\tau = rF\\sin\\theta" },
            { tex: "\\text{balance}:\\; m_1 d_1 = m_2 d_2" },
          ],
          variables: [
            { sym: "r", meaning: "lever arm from pivot", unit: "m" },
            { sym: "F", meaning: "force (weight)", unit: "N" },
            { sym: "\\tau", meaning: "torque", unit: "N·m" },
          ],
          why: "Torque, not force, governs rotation. A small mass far out out-leverages a big mass close in — the whole basis of wrenches, seesaws, and crowbars.",
          tryThis: "Put m₁ = 8 kg at 1 m. Find where 2 kg balances it (4 m). Then try m₂ = 4 kg — you'll need 2 m. The products always match: m₁d₁ = m₂d₂.",
        }}
        prediction={{
          question: "m₂ = 4 kg sits at 1.5 m. Where must m₁ = 3 kg sit to balance?",
          options: ["1.5 m", "2.0 m", "2.5 m", "3.0 m"],
          correct: 1,
          explain: "Balance needs m₁d₁ = m₂d₂ = 4×1.5 = 6 kg·m, so d₁ = 6/3 = 2.0 m. Set it and watch the plank level.",
        }}
      />
    </div>
  );
}

// ===================== SHM =====================
export function SHMSim() {
  const [mode, setMode] = useState<"spring" | "pendulum">("spring");
  const [amp, setAmp] = useState(60);
  const [kOrL, setKOrL] = useState(50);
  const [mass, setMass] = useState(1);
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const phaseRef = useRef(0);
  const trailRef = useRef<{ ph: number; amp: number }[]>([]);
  const clock = useClock();
  const reset = () => { phaseRef.current = 0; trailRef.current = []; setTick((n) => n + 1); };

  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const { dt } = clock(performance.now(), running);
    const omega = mode === "spring" ? Math.sqrt(kOrL / (mass * 2)) : Math.sqrt(9.8 / (kOrL / 12));
    if (dt > 0) phaseRef.current += omega * dt;
    const phase = phaseRef.current;
    const cx = w * 0.4, topY = 40;
    if (dt > 0) {
      trailRef.current.push({ ph: phase, amp });
      if (trailRef.current.length > 160) trailRef.current.shift();
    }
    if (mode === "spring") {
      const y = topY + 60 + amp * Math.cos(phase);
      ctx.strokeStyle = muted; ctx.lineWidth = 2;
      ctx.beginPath();
      const coils = 12, start = topY, end = y - 12;
      ctx.moveTo(cx, start);
      for (let i = 0; i <= coils; i++) {
        const yy = start + ((end - start) * i) / coils;
        ctx.lineTo(cx + (i % 2 === 0 ? -14 : 14), yy);
      }
      ctx.lineTo(cx, end);
      ctx.stroke();
      ball(ctx, cx, y, 14, "#7c6cf4");
      const Kfrac = Math.sin(phase) ** 2;
      const bx = w - 120;
      ([["K", Kfrac, "#ff8fb1"], ["U", 1 - Kfrac, "#6fd6c8"]] as [string, number, string][]).forEach(([label, val, color], i) => {
        const by = 20 + i * 30;
        ctx.fillStyle = muted; ctx.fillText(label, bx - 18, by + 10);
        ctx.fillStyle = "rgba(128,120,160,0.15)"; ctx.fillRect(bx, by, 90, 14);
        ctx.fillStyle = color; ctx.fillRect(bx, by, val * 90, 14);
      });
      const gx = w * 0.55, gw = w * 0.3, gy = h * 0.55, gh = h * 0.3;
      ctx.strokeStyle = muted; ctx.strokeRect(gx, gy, gw, gh);
      ctx.strokeStyle = "#7c6cf4"; ctx.lineWidth = 2; ctx.beginPath();
      trailRef.current.forEach((pt, i) => {
        const X = gx + (i / 159) * gw;
        const Y = gy + gh / 2 - Math.cos(pt.ph) * (gh / 2 - 6) * (pt.amp / 80);
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      });
      ctx.stroke();
      ctx.fillStyle = muted; ctx.font = "10px system-ui";
      ctx.fillText("x(t) — amplitude-independent tempo", gx + 4, gy - 4);
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
    ctx.fillText(`T = ${T.toFixed(2)} s   ω = ${omega.toFixed(2)} rad/s`, 12, 20);
  }, { running, resetKey: tick });

  return (
    <div>
      <SimFrame height={300}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <div className="flex gap-2">
          <button onClick={() => setMode("spring")} className={`clay-sm clay-press px-3 py-1.5 text-xs font-semibold ${mode === "spring" ? "text-[var(--clay-primary-deep)]" : ""}`} style={mode === "spring" ? { background: "var(--clay-primary-tint)" } : undefined}>Spring</button>
          <button onClick={() => setMode("pendulum")} className={`clay-sm clay-press px-3 py-1.5 text-xs font-semibold ${mode === "pendulum" ? "text-[var(--clay-primary-deep)]" : ""}`} style={mode === "pendulum" ? { background: "var(--clay-primary-tint)" } : undefined}>Pendulum</button>
        </div>
        {mode === "spring" && <Slider label="Mass" value={mass} min={0.5} max={3} step={0.1} onChange={setMass} format={(v) => `${v} kg`} />}
        <Slider label={mode === "spring" ? "k" : "L"} value={kOrL} min={10} max={100} onChange={setKOrL} format={(v) => (mode === "spring" ? `${v} N/m` : `${(v / 12).toFixed(2)} m`)} />
        <Slider label="Amplitude" value={amp} min={10} max={80} onChange={setAmp} format={(v) => `${v} px`} />
      </SimRow>
      <Panel
        running={running}
        onPlayPause={() => setRunning((r) => !r)}
        onReset={reset}
        physics={{
          what: "Restoring force proportional to displacement (F = −kx for springs, small-angle gravity for pendulums) produces sinusoidal motion whose period ignores amplitude.",
          equations: [
            { tex: "T_{\\text{spring}} = 2\\pi\\sqrt{m/k}" },
            { tex: "T_{\\text{pend}} = 2\\pi\\sqrt{L/g}", note: "small angles" },
            { tex: "E = \\tfrac12 kA^2 = K + U" },
          ],
          variables: [
            { sym: "k", meaning: "spring constant", unit: "N/m" },
            { sym: "L", meaning: "pendulum length", unit: "m" },
            { sym: "A", meaning: "amplitude", unit: "m" },
          ],
          why: "Farther from center = stronger pull back, but also more distance to cover. The two effects cancel exactly — that's isochronism, the reason pendulum clocks work.",
          tryThis: "Drag amplitude from 20 to 80: T doesn't move. Now triple the mass on the spring: T grows by √3, not 3. Mass matters, amplitude doesn't.",
        }}
        prediction={{
          question: "Double the amplitude of the spring oscillator. The period…",
          options: ["Doubles", "Increases by √2", "Stays the same", "Halves"],
          correct: 2,
          explain: "T = 2π√(m/k) contains no A. The farther excursion is exactly compensated by higher speed at center — the signature SHM result. Verify: T readout is frozen while you drag amplitude.",
        }}
      />
    </div>
  );
}

// ===================== CIRCULAR =====================
export function CircularSim() {
  const [speed, setSpeed] = useState(3);
  const [radius, setRadius] = useState(90);
  const [mass, setMass] = useState(2);
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const phaseRef = useRef(0);
  const clock = useClock();
  const reset = () => { phaseRef.current = 0; setTick((n) => n + 1); };

  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const { dt } = clock(performance.now(), running);
    const omega = (speed * 40) / radius;
    if (dt > 0) phaseRef.current += omega * dt;
    const cx = w * 0.45, cy = h * 0.52, R = radius;
    ctx.strokeStyle = muted; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    const x = cx + R * Math.cos(phaseRef.current), y = cy + R * Math.sin(phaseRef.current);
    ctx.strokeStyle = muted; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
    ball(ctx, x, y, 11, "#7c6cf4");
    const vt = speed * 12;
    arrow(ctx, x, y, x - Math.sin(phaseRef.current) * vt, y + Math.cos(phaseRef.current) * vt, "#8fb8f7", 2.5);
    arrow(ctx, x, y, x - (x - cx) * 0.25, y - (y - cy) * 0.25, "#ff8fb1", 2.5);
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    const ac = (speed * speed) / (radius / 40);
    const Fc = mass * ac;
    ctx.fillText(`v = ${speed} m/s   r = ${(radius / 40).toFixed(1)} m   a_c = v²/r = ${ac.toFixed(1)} m/s²   F_c = ${Fc.toFixed(0)} N`, 12, 20);
  }, { running, resetKey: tick });

  return (
    <div>
      <SimFrame height={280}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <Slider label="Speed" value={speed} min={1} max={8} onChange={setSpeed} format={(v) => `${v} m/s`} />
        <Slider label="Radius" value={radius} min={40} max={150} onChange={setRadius} format={(v) => `${(v / 40).toFixed(1)} m`} />
        <Slider label="Mass" value={mass} min={0.5} max={5} step={0.5} onChange={setMass} format={(v) => `${v} kg`} />
      </SimRow>
      <Panel
        running={running}
        onPlayPause={() => setRunning((r) => !r)}
        onReset={reset}
        physics={{
          what: "Uniform circular motion: constant speed, constantly-changing direction. The inward (centripetal) acceleration v²/r is supplied by whatever holds the ball on the circle — here, the string tension.",
          equations: [
            { tex: "a_c = \\frac{v^2}{r}" },
            { tex: "F_c = m\\frac{v^2}{r}" },
          ],
          variables: [
            { sym: "v", meaning: "tangential speed", unit: "m/s" },
            { sym: "r", meaning: "circle radius", unit: "m" },
            { sym: "F_c", meaning: "net inward force", unit: "N" },
          ],
          why: "Velocity is a vector: changing its direction is acceleration even at constant speed. That acceleration must point to the center — the only direction that bends the path without changing |v|.",
          tryThis: "Double v: F_c quadruples (it's v², not v). Then halve r at fixed v: F_c doubles. Speed is the powerful variable.",
        }}
        prediction={{
          question: "If the string snaps, the ball flies off…",
          options: ["Radially outward", "Along the tangent", "Straight down", "It just stops"],
          correct: 1,
          explain: "No net force → straight-line motion at the current velocity — which points tangent to the circle. 'Centrifugal' outward flight is a myth; cut r to minimum and watch the velocity arrow for what direction it would keep.",
        }}
      />
    </div>
  );
}

// ===================== ROLLING RACE =====================
export function RollingSim() {
  const [shape, setShape] = useState<"hoop" | "disk" | "sphere">("disk");
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const distRef = useRef(0);
  const clock = useClock();
  const reset = () => { distRef.current = 0; setTick((n) => n + 1); };

  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const { dt } = clock(performance.now(), running);
    const c = shape === "hoop" ? 1 : shape === "disk" ? 0.5 : 0.4;
    const slope = 0.32;
    const a = (9.8 * Math.sin(Math.atan(slope))) / (1 + c); // rolling acceleration, exact
    if (dt > 0) distRef.current += 0.5 * a * dt * dt * 12 + 0; // demo-scaled
    if (dt > 0) distRef.current += (0.5 * a * dt) * dt * 0;
    const d = Math.min(1, distRef.current);
    const rampY = (x: number) => h * 0.25 + x * slope * (w * 0.9);
    ctx.strokeStyle = muted; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, rampY(0)); ctx.lineTo(w, rampY(1)); ctx.stroke();
    const R = 20;
    const x = d * (w - 80) + 40;
    const y = rampY(d) - R;
    // wheel with a spoke so rotation is visible
    ctx.save();
    ctx.translate(x, y);
    const rot = (distRef.current * (w - 80)) / R; // roll without slip
    ctx.rotate(rot);
    ctx.strokeStyle = "#7c6cf4"; ctx.lineWidth = shape === "hoop" ? 5 : 2.5;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
    if (shape !== "hoop") {
      ctx.fillStyle = "rgba(124,108,244,0.2)";
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = fg; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R, 0); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`a = g·sinθ/(1 + c) with c = ${c} → a = ${a.toFixed(2)} m/s²  ·  distance ∝ ${((1 / (1 + c)) / (1 / 1.4)).toFixed(2)}× sphere at same t`, 12, 20);
  }, { running, resetKey: tick });

  return (
    <div>
      <SimFrame height={260}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <div className="flex gap-2">
          {(["hoop", "disk", "sphere"] as const).map((k) => (
            <button key={k} onClick={() => setShape(k)} className={`clay-sm clay-press px-3 py-1.5 text-xs font-semibold ${shape === k ? "text-[var(--clay-primary-deep)]" : ""}`} style={shape === k ? { background: "var(--clay-primary-tint)" } : undefined}>{k}</button>
          ))}
        </div>
      </SimRow>
      <Panel
        running={running}
        onPlayPause={() => setRunning((r) => !r)}
        onReset={reset}
        physics={{
          what: "Objects rolling down the same ramp without slipping. Gravity's pull is shared between speeding the center of mass and spinning the object — the split depends on I.",
          equations: [
            { tex: "a = \\frac{g\\sin\\theta}{1 + I/mR^2}" },
            { tex: "mgh = \\tfrac12 mv^2 + \\tfrac12 I\\omega^2" },
          ],
          variables: [
            { sym: "I/mR^2", meaning: "shape factor c (hoop 1, disk ½, sphere 0.4)", unit: "—" },
          ],
          why: "Static friction provides the torque that spins the object. The more energy rotation eats, the less is left for translation — so fat-I objects lose the race regardless of mass or radius.",
          tryThis: "Race them mentally, then check: sphere beats disk beats hoop, every time. Mass and radius cancel out entirely — try to find a value that changes the outcome. You can't.",
        }}
        prediction={{
          question: "A hoop and a sphere of equal mass and radius roll down. Which lands first?",
          options: ["Hoop — bigger I helps", "Sphere — smaller I", "Tie — mass is equal", "Depends on the ramp angle"],
          correct: 1,
          explain: "a = g sinθ/(1+c): sphere (c = 0.4) accelerates 1.4/2 = 1.43× faster than the hoop (c = 1). Both mass and radius cancel — it's pure shape.",
        }}
      />
    </div>
  );
}

// ===================== FLUIDS =====================
export function FluidsSim() {
  const [fluid, setFluid] = useState<"water" | "oil" | "mercury">("water");
  const [depthM, setDepthM] = useState(3);
  const [rhoObj, setRhoObj] = useState(600);
  const ref = useCanvasLoop(({ ctx, w, h, fg, muted }) => {
    const rhoF = fluid === "water" ? 1000 : fluid === "oil" ? 900 : 13600;
    const surfY = h * 0.18;
    ctx.fillStyle = fluid === "water" ? "rgba(111,214,200,0.25)" : fluid === "oil" ? "rgba(255,196,107,0.25)" : "rgba(143,184,247,0.3)";
    ctx.fillRect(0, surfY, w, h - surfY);
    ctx.strokeStyle = muted; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, surfY); ctx.lineTo(w, surfY); ctx.stroke();
    ctx.font = "10px system-ui";
    for (let d = 1; d <= 4; d++) {
      const y = surfY + (d / 4) * (h - surfY - 10);
      ctx.fillStyle = muted;
      ctx.fillText(`${d} m`, w - 34, y);
      ctx.strokeStyle = "rgba(128,120,160,0.2)";
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    // buoyancy physics: floating fraction
    const objR = 22;
    const floats = rhoObj < rhoF;
    const frac = floats ? rhoObj / rhoF : 1; // submerged volume fraction
    // vertical position: floating objects bob AT the surface with `frac` below it
    const waterDepthPx = h - surfY - 10;
    const objH = objR * 2;
    const objY = floats
      ? surfY + (frac - 0.5) * objH // centered so submerged fraction = frac
      : Math.min(h - objR - 6, surfY + waterDepthPx * Math.min(1, 0.25 + (rhoObj / rhoF - 1) * 0.4));
    ctx.fillStyle = "#7c6cf4";
    ctx.beginPath(); ctx.roundRect(w * 0.4 - objR, objY - objR, objR * 2, objR * 2, 8); ctx.fill();
    if (floats) {
      // waterline
      ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(w * 0.4 - objR, surfY); ctx.lineTo(w * 0.4 + objR, surfY); ctx.stroke();
      ctx.fillStyle = muted;
      ctx.fillText(`${Math.round(frac * 100)}% submerged`, w * 0.4 + objR + 10, surfY + 4);
    }
    const Fb = frac * rhoF * 9.8;
    const W = rhoObj * 9.8;
    arrow(ctx, w * 0.4, objY, w * 0.4, objY - 50 * Math.min(1.4, Fb / W), "#6fd6c8", 2.5);
    arrow(ctx, w * 0.4, objY, w * 0.4, objY + 50, "#ff8fb1", 2.5);
    const P = 101325 + rhoF * 9.8 * depthM;
    ctx.fillStyle = fg; ctx.font = "12px system-ui";
    ctx.fillText(`Fluid: ${fluid} (ρ = ${rhoF} kg/m³)`, 12, 20);
    ctx.fillText(`P at ${depthM} m = ${(P / 1000).toFixed(0)} kPa (abs)`, 12, 38);
    ctx.fillText(floats ? `F_b = ${Fb.toFixed(0)} = W (${W.toFixed(0)}) → equilibrium` : `Sinking: F_b < W (${Fb.toFixed(0)} < ${W.toFixed(0)})`, 12, 56);
    ctx.fillStyle = muted;
    ctx.fillText(`F_b = ρ_f · g · V_disp`, w * 0.4 + 40, objY + 4);
  });
  return (
    <div>
      <SimFrame height={320}><canvas ref={ref} className="h-full w-full" /></SimFrame>
      <SimRow>
        <div className="flex gap-2">
          {(["water", "oil", "mercury"] as const).map((f) => (
            <button key={f} onClick={() => setFluid(f)} className="clay-sm clay-press px-3 py-1.5 text-xs font-semibold" style={fluid === f ? { background: "var(--clay-primary-tint)", color: "var(--clay-primary-deep)" } : undefined}>{f}</button>
          ))}
        </div>
        <Slider label="Probe depth" value={depthM} min={0} max={10} step={0.5} onChange={setDepthM} format={(v) => `${v} m`} />
        <Slider label="ρ object" value={rhoObj} min={100} max={3000} step={50} onChange={setRhoObj} format={(v) => `${v} kg/m³`} />
      </SimRow>
      <Panel
        showControls={false}
        running
        onPlayPause={() => {}}
        onReset={() => { setFluid("water"); setRhoObj(600); setDepthM(3); }}
        physics={{
          what: "Hydrostatic pressure grows with depth; buoyancy equals the weight of displaced fluid. Objects less dense than the fluid float with exactly the submerged fraction that balances their weight.",
          equations: [
            { tex: "P = P_0 + \\rho g h" },
            { tex: "F_b = \\rho_f g V_{\\text{disp}}" },
            { tex: "\\text{floating}:\\; \\frac{V_{\\text{sub}}}{V} = \\frac{\\rho_{\\text{obj}}}{\\rho_f}" },
          ],
          variables: [
            { sym: "\\rho", meaning: "density", unit: "kg/m³" },
            { sym: "h", meaning: "depth", unit: "m" },
            { sym: "F_b", meaning: "buoyant force", unit: "N" },
          ],
          why: "Pressure differences between top and bottom of a submerged object integrate to an upward force equal to the fluid's weight displaced (Archimedes). Floating is that force matching weight exactly.",
          tryThis: "Set ρ_obj = 500 in water: 50% submerged, arrows equal. Switch to oil (ρ = 900): now 56% submerges. In mercury everything except lead floats high.",
        }}
        prediction={{
          question: "Ice (ρ ≈ 917) floats in water (1000). About how much sits above the surface?",
          options: ["~8%", "~50%", "~92%", "All of it"],
          correct: 0,
          explain: "Submerged fraction = 917/1000 ≈ 92% — only ~8% shows. That's the tip of the iceberg, literally. Slide ρ_obj to 900 and check the readout.",
        }}
      />
    </div>
  );
}
