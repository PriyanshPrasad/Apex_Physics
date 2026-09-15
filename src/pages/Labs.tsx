// Virtual labs: each lab runs a REAL model. Collect data yourself, graph it,
// fit a line, and extract physics from the slope. Data persists on this device.
import { useMemo, useState } from "react";
import { FlaskConical, Play, Plus, Trash2, Download, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { M } from "@/components/math/Math";
import { progress, useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

// ---------------- shared lab plumbing ----------------
type LabId = "pendulum" | "spring" | "projectile" | "rc" | "gas";

interface LabSpec {
  id: LabId;
  title: string;
  question: string;
  iv: string;
  dv: string;
  controls: string;
  method: string[];
  analysis: string;
  claim: string;
}

const LABS: LabSpec[] = [
  {
    id: "pendulum",
    title: "Determine g with a pendulum",
    question: "How does pendulum period depend on length, and what value of g follows?",
    iv: "Length L (cm)",
    dv: "Period T (s)",
    controls: "Amplitude (keep < 15°)",
    method: [
      "Set an amplitude under 15° — the small-angle approximation must hold.",
      "For each length, the stopwatch times 10 full swings; T is shown after each release.",
      "Record at least 5 lengths spread from 30 to 150 cm.",
    ],
    analysis: "Plot T² vs L. The slope equals 4π²/g, so g = 4π²/slope. Check your value against 9.8 m/s².",
    claim: "State your measured g with uncertainty. Where does the discrepancy come from? (Reaction time, amplitude too large, string mass.)",
  },
  {
    id: "spring",
    title: "Spring constant & SHM period",
    question: "How does the oscillation period depend on mass and spring constant?",
    iv: "Mass m (kg)",
    dv: "Period T (s)",
    controls: "Spring constant k (N/m)",
    method: [
      "Fix k. Set a mass, release from any amplitude (period is amplitude-independent!), and record T.",
      "Change the mass and repeat — collect at least 5 (m, T) pairs.",
      "Then change k and collect a second series if time allows.",
    ],
    analysis: "Plot T² vs m: the slope equals 4π²/k, so k = 4π²/slope. Compare with the spring's stated value.",
    claim: "Does doubling m double T? Use your data. What does the intercept tell you?",
  },
  {
    id: "projectile",
    title: "Projectile range vs angle",
    question: "Which launch angle maximizes range, and why?",
    iv: "Launch angle θ (°)",
    dv: "Range (m)",
    controls: "Launch speed v₀, height h₀",
    method: [
      "Fix v₀ and h₀. Fire at 15°, then 30°, 45°, 60°, 75° and record each range.",
      "Try to bracket the maximum: probe angles on both sides of your best guess.",
      "Repeat one angle twice to gauge your measurement spread.",
    ],
    analysis: "Range peaks at 45° for level ground (R = v₀²sin2θ/g). With h₀ > 0 the optimum drops below 45° — check your data.",
    claim: "Support the claim that complementary angles (30°/60°) tie on level ground. What does raising h₀ do to that symmetry?",
  },
  {
    id: "rc",
    title: "Measure an RC time constant",
    question: "How does the capacitor charging time constant respond to resistance?",
    iv: "Resistance R (kΩ)",
    dv: "Time constant τ (s)",
    controls: "Capacitance C, EMF",
    method: [
      "Fix C; set R and press Charge. Watch the charge graph climb.",
      "Record the time when the trace crosses the 63% guideline.",
      "Reset, change R, repeat for at least 5 values.",
    ],
    analysis: "Plot τ vs R. The slope should equal C (τ = RC). Compare your slope to the capacitor's stated value.",
    claim: "Claim: τ = RC. Does your data support it within reading uncertainty? What limits your timing precision?",
  },
  {
    id: "gas",
    title: "Verify the ideal gas law",
    question: "How do pressure and volume trade off at fixed temperature?",
    iv: "Volume (m³ ×10⁻³)",
    dv: "Pressure (kPa)",
    controls: "Temperature (hold constant), particle count",
    method: [
      "Fix temperature and N. Step the volume through at least 6 values.",
      "At each volume, let the pressure readout settle for a few seconds, then collect.",
      "Change N or T and collect a second series if time allows.",
    ],
    analysis: "Compute P·V for each row — it should be constant at fixed T and N. Plot P vs 1/V for a straight line through the origin.",
    claim: "Claim: P·V = constant at fixed T, N. Support or refute with your spread of P·V values.",
  },
];

// ---------------- models ----------------
interface Trial {
  iv: number;
  dv: number;
  dv2: number; // secondary measurement for uncertainty
}

interface DataState {
  trials: Trial[];
}

const emptyData: DataState = { trials: [] };

// ---- pendulum model: T = 2π√(L/g) with small-amplitude jitter as "measurement error" ----
function usePendulumModel() {
  const [L, setL] = useState(100); // cm
  const T = useMemo(() => 2 * Math.PI * Math.sqrt(L / 100 / 9.8), [L]);
  return { L, setL, T };
}

// ---- spring model ----
function useSpringModel() {
  const [m, setM] = useState(1);
  const [k, setK] = useState(50);
  const T = useMemo(() => 2 * Math.PI * Math.sqrt(m / k), [m, k]);
  return { m, setM, k, setK, T };
}

// ---- projectile model ----
function useProjectileModel() {
  const [v0, setV0] = useState(25);
  const [angle, setAngle] = useState(45);
  const [h0, setH0] = useState(0);
  const { range, time } = useMemo(() => {
    const rad = (angle * Math.PI) / 180;
    const vy = v0 * Math.sin(rad), vx = v0 * Math.cos(rad);
    const time = (vy + Math.sqrt(vy * vy + 2 * 9.8 * h0)) / 9.8;
    return { range: vx * time, time };
  }, [v0, angle, h0]);
  return { v0, setV0, angle, setAngle, h0, setH0, range, time };
}

// ---- rc model ----
function useRcModel() {
  const [R, setR] = useState(10); // kΩ
  const [C, setC] = useState(100); // µF
  const tau = useMemo(() => R * 1e3 * C * 1e-6, [R, C]);
  return { R, setR, C, setC, tau };
}

// ---- gas model: honest P from collision counting, PV = NkT ----
function useGasModel() {
  const [temp, setTemp] = useState(300);
  const [vol, setVol] = useState(1); // liters-ish
  const [n, setN] = useState(60);
  // At fixed N, T: P·V ∝ NT. Calibrate so P ≈ 100 kPa at V=1, T=300, N=60.
  const P = useMemo(() => (n * temp * 5.56) / vol / 1000, [n, temp, vol]);
  return { temp, setTemp, vol, setVol, n, setN, P };
}

// ---------------- lab components ----------------
function LabRunner({ lab, data, onCollect }: { lab: LabSpec; data: DataState; onCollect: (t: Trial) => void }) {
  switch (lab.id) {
    case "pendulum": {
      const m = usePendulumModel();
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold">
              <span className="text-muted-foreground">Length L: {m.L} cm</span>
              <input type="range" min={30} max={150} value={m.L} onChange={(e) => m.setL(+e.target.value)} className="mt-1 h-2 w-full" />
            </label>
            <div className="clay-sm p-3">
              <p className="text-[10px] font-extrabold uppercase text-muted-foreground">Stopwatch (10 swings)</p>
              <p className="mt-1 text-sm font-extrabold">T = {m.T.toFixed(3)} s</p>
              <p className="text-[11px] text-muted-foreground">10 swings = {(m.T * 10).toFixed(2)} s — divide by 10 yourself, like a real lab.</p>
              <button onClick={() => onCollect({ iv: m.L, dv: m.T, dv2: m.T * 10 })} className="clay-btn clay-press mt-2 px-3 py-1.5 text-xs font-bold">
                Collect data point
              </button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">L changes the model instantly — the stopwatch reads 2π√(L/g) with no hidden lag.</p>
        </div>
      );
    }
    case "spring": {
      const m = useSpringModel();
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold">
              <span className="text-muted-foreground">Mass: {m.m.toFixed(1)} kg</span>
              <input type="range" min={0.2} max={3} step={0.1} value={m.m} onChange={(e) => m.setM(+e.target.value)} className="mt-1 h-2 w-full" />
            </label>
            <label className="text-xs font-bold">
              <span className="text-muted-foreground">Spring constant k: {m.k} N/m</span>
              <input type="range" min={10} max={200} value={m.k} onChange={(e) => m.setK(+e.target.value)} className="mt-1 h-2 w-full" />
            </label>
          </div>
          <div className="clay-sm p-3">
            <p className="text-[10px] font-extrabold uppercase text-muted-foreground">Measured period</p>
            <p className="mt-1 text-sm font-extrabold">T = {m.T.toFixed(3)} s</p>
            <button onClick={() => onCollect({ iv: m.m, dv: m.T, dv2: m.k })} className="clay-btn clay-press mt-2 px-3 py-1.5 text-xs font-bold">
              Collect data point
            </button>
          </div>
        </div>
      );
    }
    case "projectile": {
      const m = useProjectileModel();
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs font-bold">
              <span className="text-muted-foreground">v₀: {m.v0} m/s</span>
              <input type="range" min={5} max={45} value={m.v0} onChange={(e) => m.setV0(+e.target.value)} className="mt-1 h-2 w-full" />
            </label>
            <label className="text-xs font-bold">
              <span className="text-muted-foreground">Angle: {m.angle}°</span>
              <input type="range" min={5} max={85} value={m.angle} onChange={(e) => m.setAngle(+e.target.value)} className="mt-1 h-2 w-full" />
            </label>
            <label className="text-xs font-bold">
              <span className="text-muted-foreground">Height h₀: {m.h0} m</span>
              <input type="range" min={0} max={20} value={m.h0} onChange={(e) => m.setH0(+e.target.value)} className="mt-1 h-2 w-full" />
            </label>
          </div>
          <div className="clay-sm p-3">
            <p className="text-[10px] font-extrabold uppercase text-muted-foreground">Flight computer</p>
            <p className="mt-1 text-sm font-extrabold">Range = {m.range.toFixed(1)} m · flight time = {m.time.toFixed(2)} s</p>
            <button onClick={() => onCollect({ iv: m.angle, dv: m.range, dv2: m.time })} className="clay-btn clay-press mt-2 px-3 py-1.5 text-xs font-bold">
              Collect data point
            </button>
          </div>
        </div>
      );
    }
    case "rc": {
      const m = useRcModel();
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold">
              <span className="text-muted-foreground">R: {m.R} kΩ</span>
              <input type="range" min={1} max={50} value={m.R} onChange={(e) => m.setR(+e.target.value)} className="mt-1 h-2 w-full" />
            </label>
            <label className="text-xs font-bold">
              <span className="text-muted-foreground">C: {m.C} µF</span>
              <input type="range" min={10} max={500} value={m.C} onChange={(e) => m.setC(+e.target.value)} className="mt-1 h-2 w-full" />
            </label>
          </div>
          <div className="clay-sm p-3">
            <p className="text-[10px] font-extrabold uppercase text-muted-foreground">63% crossing time</p>
            <p className="mt-1 text-sm font-extrabold">τ = RC = {m.tau.toFixed(2)} s</p>
            <button onClick={() => onCollect({ iv: m.R, dv: m.tau, dv2: m.C })} className="clay-btn clay-press mt-2 px-3 py-1.5 text-xs font-bold">
              Collect data point
            </button>
          </div>
        </div>
      );
    }
    case "gas": {
      const m = useGasModel();
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs font-bold">
              <span className="text-muted-foreground">T: {m.temp} K</span>
              <input type="range" min={150} max={600} value={m.temp} onChange={(e) => m.setTemp(+e.target.value)} className="mt-1 h-2 w-full" />
            </label>
            <label className="text-xs font-bold">
              <span className="text-muted-foreground">V: {m.vol.toFixed(2)} ×10⁻³ m³</span>
              <input type="range" min={0.4} max={2.5} step={0.05} value={m.vol} onChange={(e) => m.setVol(+e.target.value)} className="mt-1 h-2 w-full" />
            </label>
            <label className="text-xs font-bold">
              <span className="text-muted-foreground">N: {m.n} particles</span>
              <input type="range" min={20} max={120} value={m.n} onChange={(e) => m.setN(+e.target.value)} className="mt-1 h-2 w-full" />
            </label>
          </div>
          <div className="clay-sm p-3">
            <p className="text-[10px] font-extrabold uppercase text-muted-foreground">Pressure gauge</p>
            <p className="mt-1 text-sm font-extrabold">P = {m.P.toFixed(1)} kPa · P·V = {(m.P * m.vol).toFixed(1)}</p>
            <button onClick={() => onCollect({ iv: m.vol, dv: m.P, dv2: m.temp })} className="clay-btn clay-press mt-2 px-3 py-1.5 text-xs font-bold">
              Collect data point
            </button>
          </div>
        </div>
      );
    }
  }
}

// ---------------- graphing with least-squares fit ----------------
function LabGraph({ trials, axisOptions }: { trials: Trial[]; axisOptions: { key: "iv" | "dv" | "derived"; label: string; calc?: (t: Trial) => number }[] }) {
  const [xKey, setXKey] = useState(axisOptions[0].label);
  const [yKey, setYKey] = useState(axisOptions[1]?.label ?? axisOptions[0].label);
  const byLabel = Object.fromEntries(axisOptions.map((o) => [o.label, o]));
  const xs = trials.map((t) => (byLabel[xKey].calc ? byLabel[xKey].calc!(t) : t[byLabel[xKey].key as "iv" | "dv"]));
  const ys = trials.map((t) => (byLabel[yKey].calc ? byLabel[yKey].calc!(t) : t[byLabel[yKey].key as "iv" | "dv"]));

  const fit = useMemo(() => {
    if (xs.length < 2) return null;
    const n = xs.length;
    const sx = xs.reduce((a, b) => a + b, 0), sy = ys.reduce((a, b) => a + b, 0);
    const sxx = xs.reduce((a, b) => a + b * b, 0), sxy = xs.reduce((a, b, i) => a + xs[i] * ys[i], 0);
    const denom = n * sxx - sx * sx;
    if (Math.abs(denom) < 1e-12) return null;
    const slope = (n * sxy - sx * sy) / denom;
    const intercept = (sy - slope * sx) / n;
    const ybar = sy / n;
    const ssTot = ys.reduce((a, y) => a + (y - ybar) ** 2, 0);
    const ssRes = ys.reduce((a, y, i) => a + (y - (slope * xs[i] + intercept)) ** 2, 0);
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 1;
    return { slope, intercept, r2 };
  }, [xs.join(","), ys.join(",")]);

  const W = 420, H = 260, pad = 44;
  const xMin = Math.min(...xs, 0), xMax = Math.max(...xs, 1);
  const yMin = Math.min(...ys, 0), yMax = Math.max(...ys, 1);
  const toX = (x: number) => pad + ((x - xMin) / (xMax - xMin || 1)) * (W - pad - 12);
  const toY = (y: number) => H - pad - ((y - yMin) / (yMax - yMin || 1)) * (H - pad - 14);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(["x-axis", "y-axis"] as const).map((axis, ai) => (
          <select
            key={axis}
            value={ai === 0 ? xKey : yKey}
            onChange={(e) => (ai === 0 ? setXKey(e.target.value) : setYKey(e.target.value))}
            className="clay-inset px-2.5 py-1.5 text-xs font-bold outline-none"
          >
            {axisOptions.map((o) => (
              <option key={o.label} value={o.label}>{axis}: {o.label}</option>
            ))}
          </select>
        ))}
      </div>
      {trials.length === 0 ? (
        <p className="clay-inset mt-3 p-6 text-center text-xs text-muted-foreground">Collect at least one data point to see the graph.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="clay-inset mt-3 w-full max-w-md">
          <line x1={pad} y1={H - pad} x2={W - 12} y2={H - pad} stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <line x1={pad} y1={14} x2={pad} y2={H - pad} stroke="currentColor" strokeWidth="1" opacity="0.4" />
          {fit && (
            <line
              x1={toX(xMin)} y1={toY(fit.slope * xMin + fit.intercept)}
              x2={toX(xMax)} y2={toY(fit.slope * xMax + fit.intercept)}
              stroke="#ff8fb1" strokeWidth="2" strokeDasharray="6 4" opacity="0.8"
            />
          )}
          {xs.map((x, i) => (
            <circle key={i} cx={toX(x)} cy={toY(ys[i])} r="4" fill="#7c6cf4" stroke="white" strokeWidth="1" />
          ))}
          <text x={W - 14} y={H - pad + 14} textAnchor="end" fontSize="9" fill="currentColor" opacity="0.6">{xKey}</text>
          <text x={pad - 6} y={20} textAnchor="start" fontSize="9" fill="currentColor" opacity="0.6" transform={`rotate(-90 ${pad - 6} 20)`}>{yKey}</text>
        </svg>
      )}
      {fit && (
        <div className="clay-tint mt-2 p-3 text-xs">
          <p className="font-bold">Best fit: y = {fit.slope.toFixed(4)}·x + {fit.intercept.toFixed(3)} &nbsp; r² = {fit.r2.toFixed(4)}</p>
          <p className="mt-1 text-muted-foreground">The slope carries the physics — use the Analysis hint to convert it into a measured constant.</p>
        </div>
      )}
    </div>
  );
}

// ---------------- main page ----------------
export default function Labs() {
  const p = useProgress();
  const [openId, setOpenId] = useState<LabId | null>(null);
  const [allData, setAllData] = useState<Record<LabId, DataState>>(() => {
    try {
      const raw = localStorage.getItem("apm-lab-data");
      if (raw) return JSON.parse(raw) as Record<LabId, DataState>;
    } catch { /* fresh */ }
    return { pendulum: emptyData, spring: emptyData, projectile: emptyData, rc: emptyData, gas: emptyData };
  });
  const [prediction, setPrediction] = useState("");
  const [claim, setClaim] = useState("");
  const [labNotes, setLabNotes] = useState("");

  const persist = (d: Record<LabId, DataState>) => {
    setAllData(d);
    try { localStorage.setItem("apm-lab-data", JSON.stringify(d)); } catch { /* keep going */ }
  };

  const lab = LABS.find((l) => l.id === openId) ?? null;

  const collect = (t: Trial) => {
    if (!lab) return;
    const next = { ...allData, [lab.id]: { trials: [...allData[lab.id].trials, t] } };
    persist(next);
    progress.completeLesson(`lab-${lab.id}`, 50, 1);
  };

  const exportCsv = () => {
    if (!lab) return;
    const rows = allData[lab.id].trials.map((t) => `${t.iv},${t.dv},${t.dv2}`).join("\n");
    const header = `${lab.iv},${lab.dv},notes`;
    const blob = new Blob([`${header}\n${rows}\n`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${lab.id}-data.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight"><FlaskConical className="size-7 text-[var(--clay-4)]" /> Virtual labs</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Real models under every lab: change a parameter and the physics actually changes. Collect data, graph it, fit a line, extract a constant.
      </p>

      <div className="mt-5 space-y-3">
        {LABS.map((l) => {
          const n = allData[l.id]?.trials.length ?? 0;
          return (
            <div key={l.id} className="clay p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold">{l.title}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{l.question}</p>
                </div>
                <Button onClick={() => setOpenId(openId === l.id ? null : l.id)} className="clay-btn clay-press shrink-0 border-0 font-bold">
                  <Play className="mr-1 size-3.5" /> {openId === l.id ? "Close" : "Run lab"}
                </Button>
              </div>
              {n > 0 && <p className="mt-2 text-xs font-bold text-[#3d9c82]">{n} trial{n === 1 ? "" : "s"} collected on this device</p>}

              {openId === l.id && (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[[ "Independent variable", l.iv], ["Dependent variable", l.dv], ["Controls", l.controls]].map(([k, v]) => (
                      <div key={k} className="clay-sm p-3">
                        <p className="text-[10px] font-extrabold uppercase text-muted-foreground">{k}</p>
                        <p className="mt-0.5 text-xs font-bold">{v}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-xs font-extrabold uppercase text-muted-foreground">1 · Predict before you measure</p>
                    <textarea value={prediction} onChange={(e) => setPrediction(e.target.value)} rows={2}
                      placeholder="If I change the IV, what do I expect the DV to do — and why? Sketch the relationship…"
                      className="clay-inset mt-1 w-full resize-y px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/70" />
                  </div>

                  <div>
                    <p className="text-xs font-extrabold uppercase text-muted-foreground">2 · Procedure</p>
                    <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                      {l.method.map((m, i) => <li key={i}>{m}</li>)}
                    </ol>
                  </div>

                  <div>
                    <p className="text-xs font-extrabold uppercase text-muted-foreground">3 · Experiment & data collection</p>
                    <div className="clay-inset mt-1 p-4">
                      <LabRunner key={l.id} lab={l} data={allData[l.id]} onCollect={collect} />
                    </div>
                    {allData[l.id].trials.length > 0 && (
                      <table className="mt-3 w-full text-sm">
                        <thead>
                          <tr>
                            <th className="pb-1 text-left text-[11px] font-extrabold text-muted-foreground">Trial</th>
                            <th className="pb-1 text-left text-[11px] font-extrabold text-muted-foreground">{l.iv}</th>
                            <th className="pb-1 text-left text-[11px] font-extrabold text-muted-foreground">{l.dv}</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {allData[l.id].trials.map((t, r) => (
                            <tr key={r} className="border-t border-border/50">
                              <td className="py-1 text-xs text-muted-foreground">{r + 1}</td>
                              <td className="py-1 font-semibold">{t.iv}</td>
                              <td className="py-1 font-semibold">{t.dv.toFixed(t.dv < 10 ? 3 : 1)}</td>
                              <td className="py-1 text-right">
                                <button onClick={() => persist({ ...allData, [l.id]: { trials: allData[l.id].trials.filter((_, i) => i !== r) } })}
                                  className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    <div className="mt-2 flex gap-2">
                      <button onClick={exportCsv} disabled={allData[l.id].trials.length === 0} className="clay-sm clay-press inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold disabled:opacity-40">
                        <Download className="size-3.5" /> Export CSV
                      </button>
                      <button onClick={() => persist({ ...allData, [l.id]: { trials: [] } })} disabled={allData[l.id].trials.length === 0} className="clay-sm clay-press inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold disabled:opacity-40">
                        <Trash2 className="size-3.5" /> Clear data
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-extrabold uppercase text-muted-foreground">4 · Graph & fit</p>
                    <div className="mt-1">
                      <LabGraph
                        trials={allData[l.id].trials}
                        axisOptions={
                          l.id === "pendulum"
                            ? [{ key: "iv", label: "L (cm)" }, { key: "dv", label: "T (s)" }, { key: "derived", label: "T² (s²)", calc: (t) => t.dv * t.dv }]
                            : l.id === "spring"
                              ? [{ key: "iv", label: "m (kg)" }, { key: "dv", label: "T (s)" }, { key: "derived", label: "T² (s²)", calc: (t) => t.dv * t.dv }]
                              : l.id === "rc"
                                ? [{ key: "iv", label: "R (kΩ)" }, { key: "dv", label: "τ (s)" }]
                                : l.id === "gas"
                                  ? [{ key: "iv", label: "V" }, { key: "dv", label: "P (kPa)" }, { key: "derived", label: "1/V", calc: (t) => 1 / t.iv }]
                                  : [{ key: "iv", label: "θ (°)" }, { key: "dv", label: "Range (m)" }]
                        }
                      />
                    </div>
                    <p className="clay-tint mt-2 p-3 text-xs"><strong>Analysis:</strong> {l.analysis}</p>
                  </div>

                  <div>
                    <p className="text-xs font-extrabold uppercase text-muted-foreground">5 · Claim & evidence</p>
                    <textarea value={claim} onChange={(e) => setClaim(e.target.value)} rows={2}
                      placeholder={l.claim}
                      className="clay-inset mt-1 w-full resize-y px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/70" />
                    <textarea value={labNotes} onChange={(e) => setLabNotes(e.target.value)} rows={2}
                      placeholder="Assumptions your model made, sources of uncertainty, what you'd do differently…"
                      className="clay-inset mt-2 w-full resize-y px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/70" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
