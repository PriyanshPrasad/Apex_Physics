import { useMemo, useState } from "react";
import { FlaskConical, Play, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LabSpec {
  id: string;
  title: string;
  question: string;
  iv: string;
  dv: string;
  controls: string;
  method: string[];
  analysis: string;
  claim: string;
  sim?: "pendulum" | "gas" | "rc";
}

const LABS: LabSpec[] = [
  {
    id: "g-pendulum",
    title: "Determine g with a pendulum",
    question: "How does pendulum period depend on length, and what value of g follows?",
    iv: "Pendulum length L (cm)",
    dv: "Period T (s)",
    controls: "Amplitude (keep small, <15°)",
    method: [
      "Set an amplitude under 15° — small-angle approximation must hold.",
      "For each length, time 10 full swings and divide by 10 for the period.",
      "Record at least 5 lengths spread from 30 to 150 cm.",
    ],
    analysis: "Square your lengths, plot T² vs L²... or better: plot T² vs L directly. The slope of T² vs L equals 4π²/g, so g = 4π²/slope.",
    claim: "State your measured g with a comparison to 9.8 m/s². Where does the discrepancy come from? (Reaction time, amplitude too large, string mass.)",
    sim: "pendulum",
  },
  {
    id: "gas-laws",
    title: "Verify the ideal gas law",
    question: "How do pressure and volume trade off at fixed temperature?",
    iv: "Volume (fraction of cylinder)",
    dv: "Pressure (arbitrary units from collision rate)",
    controls: "Temperature (hold constant)",
    method: [
      "Fix the temperature slider — this is your control variable.",
      "Step the volume through 6 values from 100% down to 40%.",
      "At each volume, wait for the pressure readout to settle, then record.",
    ],
    analysis: "Compute P·V for each row. If the ideal gas model holds at fixed T, the products should be roughly constant.",
    claim: "Claim: P·V is constant at fixed T. Support or refute with your spread of P·V values, and explain the microscopic reason (collision frequency × wall force).",
    sim: "gas",
  },
  {
    id: "rc-tau",
    title: "Measure an RC time constant",
    question: "How does the capacitor charging time constant respond to resistance?",
    iv: "Resistance R (kΩ)",
    dv: "Time to reach 63% charge, τ (s)",
    controls: "Capacitance C, EMF",
    method: [
      "Fix C; set R to its smallest value and press Charge.",
      "Watch the charge graph; record the time when the trace crosses ~63%.",
      "Reset, increase R, repeat for at least 5 values.",
    ],
    analysis: "Plot τ vs R. The slope should equal C (τ = RC). Compare your slope to the capacitor's stated value.",
    claim: "Claim: τ = RC. Does your data support it within reading uncertainty? What limits your timing precision?",
    sim: "rc",
  },
  {
    id: "collision-p",
    title: "Momentum conservation in collisions",
    question: "Is momentum conserved in both elastic and inelastic collisions?",
    iv: "Collision type (elastic toggle)",
    dv: "Total momentum before and after",
    controls: "Masses, initial velocity",
    method: [
      "Choose masses and v₁; run a perfectly inelastic collision; record p before and after.",
      "Toggle elastic and repeat with the same starting values.",
      "Also record kinetic energy before/after for both runs.",
    ],
    analysis: "Compare Δp across both collision types. Then compare ΔK — which one stayed put, and which shrank?",
    claim: "Claim: momentum is conserved regardless of elasticity; kinetic energy is conserved only elastically. Support with your numbers.",
  },
];

function PendulumLabTool() {
  const [L, setL] = useState(100);
  const T = useMemo(() => 2 * Math.PI * Math.sqrt(L / 100 / 9.8), [L]);
  return (
    <div className="clay-inset p-4">
      <label className="text-xs font-bold">
        <span className="text-muted-foreground">Pendulum length: {L} cm</span>
        <input type="range" min={30} max={150} value={L} onChange={(e) => setL(+e.target.value)} className="mt-1 h-2 w-full accent-[var(--clay-4)]" />
      </label>
      <p className="mt-2 text-sm font-extrabold">T = {T.toFixed(2)} s for 1 swing → {((T * 10)).toFixed(1)} s for 10 swings</p>
      <p className="text-[11px] text-muted-foreground">Record (L, T²) pairs in your table — slope of T² vs L gives 4π²/g.</p>
    </div>
  );
}

function GasLabTool() {
  const [V, setV] = useState(100);
  const P = useMemo(() => Math.round((1000 * 100) / V), [V]);
  return (
    <div className="clay-inset p-4">
      <label className="text-xs font-bold">
        <span className="text-muted-foreground">Volume: {V}%</span>
        <input type="range" min={40} max={100} value={V} onChange={(e) => setV(+e.target.value)} className="mt-1 h-2 w-full accent-[var(--clay-4)]" />
      </label>
      <p className="mt-2 text-sm font-extrabold">P ≈ {P} (collision-rate units) → P·V = {P * V}</p>
      <p className="text-[11px] text-muted-foreground">Check: does P·V hold steady across your volumes?</p>
    </div>
  );
}

function RcLabTool() {
  const [R, setR] = useState(10);
  const [C] = useState(100);
  const tau = useMemo(() => (R * 1000 * C * 1e-6), [R, C]);
  return (
    <div className="clay-inset p-4">
      <label className="text-xs font-bold">
        <span className="text-muted-foreground">R: {R} kΩ</span>
        <input type="range" min={1} max={50} value={R} onChange={(e) => setR(+e.target.value)} className="mt-1 h-2 w-full accent-[var(--clay-4)]" />
      </label>
      <p className="mt-2 text-sm font-extrabold">τ = RC = {tau.toFixed(1)} s → 63% at t = {tau.toFixed(1)} s</p>
      <p className="text-[11px] text-muted-foreground">Plot τ vs R across trials; slope ≈ C.</p>
    </div>
  );
}

function DataTable({ rows, cols, onChange, onAdd, onRemove }: {
  rows: string[][];
  cols: string[];
  onChange: (r: number, c: number, v: string) => void;
  onAdd: () => void;
  onRemove: (r: number) => void;
}) {
  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            {cols.map((c) => <th key={c} className="pb-1 text-left text-[11px] font-extrabold text-muted-foreground">{c}</th>)}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className="pr-2 py-1">
                  <input
                    value={cell}
                    onChange={(e) => onChange(r, c, e.target.value)}
                    className="clay-inset w-20 px-2 py-1.5 text-sm outline-none"
                  />
                </td>
              ))}
              <td>
                <button onClick={() => onRemove(r)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={onAdd} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[var(--clay-primary-deep)]">
        <Plus className="size-3.5" /> Add row
      </button>
    </div>
  );
}

function LabCard({ lab }: { lab: LabSpec }) {
  const [open, setOpen] = useState(false);
  const [prediction, setPrediction] = useState("");
  const [claim, setClaim] = useState("");
  const [rows, setRows] = useState<string[][]>([["", "", ""]]);
  const cols = [lab.iv, lab.dv, "Notes"];

  return (
    <div className="clay p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">{lab.title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{lab.question}</p>
        </div>
        <Button onClick={() => setOpen(!open)} className="clay-btn clay-press shrink-0 border-0 font-bold">
          <Play className="mr-1 size-3.5" /> {open ? "Close" : "Run lab"}
        </Button>
      </div>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[["Independent variable", lab.iv], ["Dependent variable", lab.dv], ["Controls", lab.controls]].map(([k, v]) => (
              <div key={k} className="clay-sm p-3">
                <p className="text-[10px] font-extrabold uppercase text-muted-foreground">{k}</p>
                <p className="mt-0.5 text-xs font-bold">{v}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-extrabold uppercase text-muted-foreground">1 · Predict before you measure</p>
            <textarea value={prediction} onChange={(e) => setPrediction(e.target.value)} rows={2}
              placeholder="Sketch or describe the relationship you expect between IV and DV…"
              className="clay-inset mt-1 w-full px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/70" />
          </div>

          <div>
            <p className="text-xs font-extrabold uppercase text-muted-foreground">2 · Procedure</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              {lab.method.map((m, i) => <li key={i}>{m}</li>)}
            </ol>
          </div>

          {lab.sim === "pendulum" && <PendulumLabTool />}
          {lab.sim === "gas" && <GasLabTool />}
          {lab.sim === "rc" && <RcLabTool />}

          <div>
            <p className="text-xs font-extrabold uppercase text-muted-foreground">3 · Data</p>
            <div className="mt-1">
              <DataTable
                rows={rows}
                cols={cols}
                onChange={(r, c, v) => setRows((rs) => rs.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row)))}
                onAdd={() => setRows((rs) => [...rs, ["", "", ""]])}
                onRemove={(r) => setRows((rs) => rs.filter((_, ri) => ri !== r))}
              />
            </div>
          </div>

          <div className="clay-tint p-4">
            <p className="text-xs font-extrabold uppercase">4 · Analysis</p>
            <p className="mt-1 text-sm">{lab.analysis}</p>
          </div>

          <div>
            <p className="text-xs font-extrabold uppercase text-muted-foreground">5 · Claim & evidence</p>
            <textarea value={claim} onChange={(e) => setClaim(e.target.value)} rows={2}
              placeholder={lab.claim}
              className="clay-inset mt-1 w-full px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/70" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Labs() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight"><FlaskConical className="size-7 text-[var(--clay-4)]" /> Virtual labs</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Real lab practice: question → prediction → variables → data → analysis → claim. The AP exam grades this reasoning chain explicitly.
      </p>
      <div className="mt-5 space-y-4">
        {LABS.map((l) => <LabCard key={l.id} lab={l} />)}
      </div>
    </div>
  );
}
