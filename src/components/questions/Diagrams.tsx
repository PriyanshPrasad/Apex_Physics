// Programmatic diagrams for question-bank items. Every diagram is generated
// from a spec so parameters can vary — no images, pure SVG.
import { M } from "@/components/math/Math";

export type DiagramSpec =
  | { kind: "vgraph"; graph: "xt" | "vt" | "at"; shape: string; note?: string }
  | { kind: "fbd"; scene: "incline" | "table" | "hanging"; labels: string[] }
  | { kind: "circuit"; layout?: "series2" | "parallel2" | "rcMeter" | "batteryCapacitor"; labels?: string[]; note?: string }
  | { kind: "charges"; q: ("+" | "-")[]; note?: string }
  | { kind: "rayOptics"; lens: "converging" | "diverging"; objectSide: "outside-f" | "inside-f" }
  | { kind: "wave"; scene: "speakers" | "standing"; note?: string }
  | { kind: "bars"; bars: { label: string; frac: number; color?: string }[]; note?: string }
  | { kind: "collision"; m1: number; v1: number; m2: number; v2: number; note?: string }
  | { kind: "piston"; temp: number; vol: number; note?: string }
  | { kind: "orbits"; r1: number; r2: number; note?: string };

const INK = "#3c3752";
const MUTED = "#7c7697";
const VIOLET = "#7c6cf4";
const PINK = "#ff8fb1";
const TEAL = "#4fc7b8";
const GOLD = "#ffc46b";

function Frame({ children, w = 340, h = 190 }: { children: React.ReactNode; w?: number; h?: number }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mx-auto block max-w-full" style={{ height: 190 }} role="img">
      {children}
    </svg>
  );
}

function Arrow({ x1, y1, x2, y2, color, width = 2 }: { x1: number; y1: number; x2: number; y2: number; color: string; width?: number }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const head = 8;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - head * 0.7 * Math.cos(a)} y2={y2 - head * 0.7 * Math.sin(a)} stroke={color} strokeWidth={width} />
      <polygon
        points={`${x2},${y2} ${x2 - head * Math.cos(a - 0.45)},${y2 - head * Math.sin(a - 0.45)} ${x2 - head * Math.cos(a + 0.45)},${y2 - head * Math.sin(a + 0.45)}`}
        fill={color}
      />
    </g>
  );
}

// ---------- graph shapes for motion diagrams ----------
function GraphPath(shape: string, graph: string): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 30; i++) {
    const u = i / 30;
    let v = 0;
    switch (shape) {
      case "linear-up": v = 0.15 + 0.75 * u; break;
      case "linear-down": v = 0.9 - 0.75 * u; break;
      case "flat": v = 0.5; break;
      case "parabolic-up": v = 0.08 + 0.84 * u * u; break;
      case "parabolic-down": v = 0.92 - 0.84 * u * u; break;
      case "sine-up": v = 0.5 - 0.42 * Math.cos(u * Math.PI * 1.2); break;
      case "sine-down": v = 0.5 + 0.42 * Math.cos(u * Math.PI * 1.2); break;
      case "v-shape": v = u < 0.5 ? 0.9 - 1.5 * u : 0.15 + 1.5 * (u - 0.5); break;
      case "triangle": v = u < 0.5 ? 0.9 - 1.5 * u : 0.9 - 1.5 * (1 - u); break;
      default: v = 0.5;
    }
    pts.push([u, 1 - Math.max(0.04, Math.min(0.96, v))]);
  }
  void graph;
  return pts;
}

function VGraph({ graph, shape, note }: { graph: string; shape: string; note?: string }) {
  const w = 340, h = 190, px = 44, py = 24, gw = w - px - 22, gh = h - py - 34;
  const pts = GraphPath(shape, graph);
  const label = graph === "xt" ? "position x (m)" : graph === "vt" ? "velocity v (m/s)" : "acceleration a (m/s²)";
  return (
    <Frame w={w} h={h}>
      <rect x={px} y={py} width={gw} height={gh} fill="none" stroke={MUTED} strokeWidth="1" opacity="0.5" />
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={px} y1={py + gh * f} x2={px + gw} y2={py + gh * f} stroke={MUTED} strokeWidth="0.6" opacity="0.25" />
      ))}
      <polyline
        points={pts.map(([u, v]) => `${px + u * gw},${py + v * gh}`).join(" ")}
        fill="none" stroke={VIOLET} strokeWidth="2.5"
      />
      <text x={px + gw} y={py - 8} textAnchor="end" fontSize="10" fill={MUTED}>{label}</text>
      <text x={px + gw / 2} y={h - 8} textAnchor="middle" fontSize="10" fill={MUTED}>time t (s)</text>
      <text x={px - 6} y={py + 8} textAnchor="end" fontSize="9" fill={MUTED}>+</text>
      <text x={px - 6} y={py + gh} textAnchor="end" fontSize="9" fill={MUTED}>0</text>
      {note && <text x={w - 8} y={py + 12} textAnchor="end" fontSize="10" fill={GOLD} fontWeight="bold">{note}</text>}
    </Frame>
  );
}

// ---------- free-body diagrams ----------
function FBD({ scene, labels }: { scene: string; labels: string[] }) {
  if (scene === "incline") {
    const bx = 170, by = 112;
    return (
      <Frame>
        <polygon points="30,170 310,170 30,60" fill="rgba(124,108,244,0.08)" stroke={MUTED} strokeWidth="1.5" />
        <g transform={`rotate(${-32} ${bx} ${by})`}>
          <rect x={bx - 22} y={by - 22} width={44} height={44} rx={7} fill={VIOLET} opacity="0.85" />
        </g>
        <Arrow x1={bx} y1={by} x2={bx} y2={by + 52} color={PINK} />
        <text x={bx + 8} y={by + 62} fontSize="10" fill={PINK} fontWeight="bold">{labels[0] ?? "mg"}</text>
        <Arrow x1={bx} y1={by} x2={bx - 30} y2={by - 46} color={TEAL} />
        <text x={bx - 78} y={by - 48} fontSize="10" fill={TEAL} fontWeight="bold">{labels[1] ?? "F_N"}</text>
        <Arrow x1={bx} y1={by} x2={bx - 52} y2={by - 34} color={GOLD} />
        <text x={bx - 96} y={by - 22} fontSize="10" fill={GOLD} fontWeight="bold">{labels[2] ?? "f"}</text>
        <text x={252} y={158} fontSize="11" fill={INK} fontWeight="bold">θ</text>
      </Frame>
    );
  }
  if (scene === "hanging") {
    return (
      <Frame>
        <line x1={170} y1={24} x2={170} y2={92} stroke={INK} strokeWidth="2.5" />
        <rect x={160} y={16} width={20} height={8} fill={MUTED} />
        <rect x={148} y={92} width={44} height={40} rx={7} fill={VIOLET} opacity="0.85" />
        <Arrow x1={170} y1={92} x2={170} y2={48} color={TEAL} />
        <text x={180} y={58} fontSize="10" fill={TEAL} fontWeight="bold">{labels[0] ?? "T"}</text>
        <Arrow x1={170} y1={132} x2={170} y2={176} color={PINK} />
        <text x={180} y={166} fontSize="10" fill={PINK} fontWeight="bold">{labels[1] ?? "mg"}</text>
      </Frame>
    );
  }
  // table
  return (
    <Frame>
      <line x1={30} y1={140} x2={310} y2={140} stroke={INK} strokeWidth="2" />
      <line x1={60} y1={140} x2={44} y2={166} stroke={MUTED} strokeWidth="1.5" />
      <line x1={280} y1={140} x2={296} y2={166} stroke={MUTED} strokeWidth="1.5" />
      <rect x={140} y={104} width={64} height={36} rx={7} fill={VIOLET} opacity="0.85" />
      <Arrow x1={172} y1={104} x2={172} y2={58} color={TEAL} />
      <text x={182} y={70} fontSize="10" fill={TEAL} fontWeight="bold">{labels[1] ?? "F_N"}</text>
      <Arrow x1={172} y1={140} x2={172} y2={182} color={PINK} />
      <text x={182} y={172} fontSize="10" fill={PINK} fontWeight="bold">{labels[0] ?? "mg"}</text>
      {labels[2] && <Arrow x1={140} y1={122} x2={70} y2={122} color={GOLD} />}
      {labels[2] && <text x={62} y={112} fontSize="10" fill={GOLD} fontWeight="bold">{labels[2]}</text>}
      {labels[3] && <Arrow x1={204} y1={122} x2={282} y2={122} color={VIOLET} />}
      {labels[3] && <text x={250} y={112} fontSize="10" fill={VIOLET} fontWeight="bold">{labels[3]}</text>}
    </Frame>
  );
}

// ---------- circuit diagrams ----------
function Circuit({ layout, labels }: { layout: string; labels: string[] }) {
  const w = 340, h = 190;
  const batt = (
    <g>
      <line x1={100} y1={30} x2={152} y2={30} stroke={INK} strokeWidth="2" />
      <line x1={188} y1={30} x2={250} y2={30} stroke={INK} strokeWidth="2" />
      <line x1={156} y1={16} x2={156} y2={44} stroke={INK} strokeWidth="3.5" />
      <line x1={182} y1={23} x2={182} y2={37} stroke={INK} strokeWidth="2" />
      <text x={140} y={12} fontSize="11" fill={INK} fontWeight="bold">{labels[0] ?? "ε"}</text>
    </g>
  );
  if (layout === "series2") {
    return (
      <Frame w={w} h={h}>
        {batt}
        <line x1={100} y1={30} x2={100} y2={150} stroke={INK} strokeWidth="2" />
        <line x1={250} y1={30} x2={250} y2={150} stroke={INK} strokeWidth="2" />
        <line x1={100} y1={150} x2={140} y2={150} stroke={INK} strokeWidth="2" />
        <rect x={140} y={141} width={44} height={18} rx={5} fill={GOLD} />
        <text x={162} y={154} textAnchor="middle" fontSize="10" fill="#4d3a1a" fontWeight="bold">{labels[1] ?? "R₁"}</text>
        <line x1={184} y1={150} x2={210} y2={150} stroke={INK} strokeWidth="2" />
        <rect x={210} y={141} width={44} height={18} rx={5} fill={GOLD} />
        <text x={232} y={154} textAnchor="middle" fontSize="10" fill="#4d3a1a" fontWeight="bold">{labels[2] ?? "R₂"}</text>
        <line x1={254} y1={150} x2={250} y2={150} stroke={INK} strokeWidth="2" />
      </Frame>
    );
  }
  if (layout === "parallel2") {
    return (
      <Frame w={w} h={h}>
        {batt}
        <line x1={100} y1={30} x2={100} y2={160} stroke={INK} strokeWidth="2" />
        <line x1={250} y1={30} x2={250} y2={160} stroke={INK} strokeWidth="2" />
        <line x1={100} y1={70} x2={140} y2={70} stroke={INK} strokeWidth="2" />
        <line x1={100} y1={140} x2={140} y2={140} stroke={INK} strokeWidth="2" />
        <line x1={210} y1={70} x2={250} y2={70} stroke={INK} strokeWidth="2" />
        <line x1={210} y1={140} x2={250} y2={140} stroke={INK} strokeWidth="2" />
        <rect x={140} y={61} width={70} height={18} rx={5} fill={GOLD} />
        <text x={175} y={74} textAnchor="middle" fontSize="10" fill="#4d3a1a" fontWeight="bold">{labels[1] ?? "R₁"}</text>
        <rect x={140} y={131} width={70} height={18} rx={5} fill={GOLD} />
        <text x={175} y={144} textAnchor="middle" fontSize="10" fill="#4d3a1a" fontWeight="bold">{labels[2] ?? "R₂"}</text>
      </Frame>
    );
  }
  if (layout === "rcMeter") {
    return (
      <Frame w={w} h={h}>
        {batt}
        <line x1={100} y1={30} x2={100} y2={150} stroke={INK} strokeWidth="2" />
        <line x1={250} y1={30} x2={250} y2={90} stroke={INK} strokeWidth="2" />
        <circle cx={250} cy={108} r={16} fill="none" stroke={VIOLET} strokeWidth="2" />
        <text x={250} y={112} textAnchor="middle" fontSize="9" fill={VIOLET} fontWeight="bold">A</text>
        <line x1={250} y1={124} x2={250} y2={150} stroke={INK} strokeWidth="2" />
        <line x1={100} y1={150} x2={140} y2={150} stroke={INK} strokeWidth="2" />
        <rect x={140} y={141} width={44} height={18} rx={5} fill={GOLD} />
        <text x={162} y={154} textAnchor="middle" fontSize="10" fill="#4d3a1a" fontWeight="bold">{labels[1] ?? "R"}</text>
        <line x1={184} y1={150} x2={250} y2={150} stroke={INK} strokeWidth="2" />
        <text x={200} y={172} fontSize="10" fill={MUTED}>{labels[2] ?? "switch + ammeter"}</text>
      </Frame>
    );
  }
  // battery + capacitor
  return (
    <Frame w={w} h={h}>
      {batt}
      <line x1={100} y1={30} x2={100} y2={150} stroke={INK} strokeWidth="2" />
      <line x1={250} y1={30} x2={250} y2={85} stroke={INK} strokeWidth="2" />
      <line x1={232} y1={85} x2={268} y2={85} stroke={INK} strokeWidth="3.5" />
      <line x1={232} y1={97} x2={268} y2={97} stroke={INK} strokeWidth="3.5" />
      <line x1={250} y1={97} x2={250} y2={150} stroke={INK} strokeWidth="2" />
      <line x1={100} y1={150} x2={250} y2={150} stroke={INK} strokeWidth="2" />
      <text x={276} y={95} fontSize="11" fill={INK} fontWeight="bold">{labels[1] ?? "C"}</text>
    </Frame>
  );
}

// ---------- charges ----------
function Charges({ q, note }: { q: string[]; note?: string }) {
  const positions = q.map((_, i) => 90 + (i * 160) / Math.max(1, q.length - 1 || 1));
  return (
    <Frame>
      {q.map((sym, i) => {
        const x = q.length === 1 ? 170 : positions[i];
        return (
          <g key={i}>
            <circle cx={x} cy={95} r={16} fill={sym === "+" ? PINK : "#8fb8f7"} />
            <text x={x} y={100} textAnchor="middle" fontSize="15" fill="#fff" fontWeight="bold">{sym}</text>
          </g>
        );
      })}
      <line x1={30} y1={95} x2={310} y2={95} stroke={MUTED} strokeWidth="0.8" strokeDasharray="4 4" opacity="0.5" />
      {note && <text x={170} y={170} textAnchor="middle" fontSize="10" fill={MUTED}>{note}</text>}
    </Frame>
  );
}

// ---------- ray optics ----------
function RayOptics({ lens, objectSide }: { lens: string; objectSide: string }) {
  const cx = 170, ay = 95, oh = 34;
  const f = 60;
  const dobj = objectSide === "outside-f" ? 110 : 45;
  const di = (f * dobj) / (dobj - f);
  const m = -di / dobj;
  const ih = oh * m;
  const imgX = cx + di;
  return (
    <Frame>
      <line x1={20} y1={ay} x2={320} y2={ay} stroke={MUTED} strokeWidth="1" strokeDasharray="5 5" />
      <ellipse cx={cx} cy={ay} rx={6} ry={48} fill="rgba(124,108,244,0.25)" stroke={INK} strokeWidth="2" />
      {[cx - f, cx + f].map((x) => (
        <g key={x}>
          <circle cx={x} cy={ay} r={3.5} fill={GOLD} />
          <text x={x - 4} y={ay + 16} fontSize="9" fill={MUTED}>F</text>
        </g>
      ))}
      {/* object */}
      <line x1={cx - dobj} y1={ay} x2={cx - dobj} y2={ay - oh} stroke={TEAL} strokeWidth="2.5" />
      <polygon points={`${cx - dobj},${ay - oh - 5} ${cx - dobj - 4},${ay - oh + 3} ${cx - dobj + 4},${ay - oh + 3}`} fill={TEAL} />
      {/* rays */}
      <polyline points={`${cx - dobj},${ay - oh} ${cx},${ay - oh} ${imgX},${ay - ih}`} fill="none" stroke={VIOLET} strokeWidth="1.5" />
      <polyline points={`${cx - dobj},${ay - oh} ${imgX},${ay - ih}`} fill="none" stroke={VIOLET} strokeWidth="1.5" opacity="0.7" />
      {/* image */}
      <line x1={imgX} y1={ay} x2={imgX} y2={ay - ih} stroke={PINK} strokeWidth="2.5" strokeDasharray={di < 0 ? "5 4" : undefined} />
      <text x={170} y={178} textAnchor="middle" fontSize="10" fill={MUTED}>
        {lens === "converging" ? "converging lens" : "diverging lens"} · d₀ {objectSide === "outside-f" ? "> f" : "< f"}
      </text>
    </Frame>
  );
}

// ---------- waves ----------
function WaveDiag({ scene, note }: { scene: string; note?: string }) {
  if (scene === "speakers") {
    return (
      <Frame>
        <rect x={56} y={80} width={14} height={30} rx={3} fill={PINK} />
        <rect x={270} y={80} width={14} height={30} rx={3} fill="#8fb8f7" />
        {[1, 2, 3, 4].map((k) => (
          <g key={k}>
            <circle cx={63} cy={95} r={k * 17} fill="none" stroke={PINK} strokeWidth="1" opacity="0.5" />
            <circle cx={277} cy={95} r={k * 17} fill="none" stroke="#8fb8f7" strokeWidth="1" opacity="0.5" />
          </g>
        ))}
        <text x={63} y={62} textAnchor="middle" fontSize="10" fill={PINK} fontWeight="bold">S₁</text>
        <text x={277} y={62} textAnchor="middle" fontSize="10" fill="#8fb8f7" fontWeight="bold">S₂</text>
        <text x={170} y={172} textAnchor="middle" fontSize="10" fill={MUTED}>{note ?? "coherent, in-phase sources"}</text>
      </Frame>
    );
  }
  return (
    <Frame>
      <line x1={20} y1={95} x2={320} y2={95} stroke={MUTED} strokeWidth="1" />
      <path
        d={Array.from({ length: 60 }, (_, i) => {
          const x = 20 + (i / 59) * 300;
          const env = Math.sin((i / 59) * Math.PI);
          const y = 95 - 42 * env * Math.sin((i / 59) * Math.PI * 6);
          return `${i === 0 ? "M" : "L"}${x},${y}`;
        }).join(" ")}
        fill="none" stroke={VIOLET} strokeWidth="2.5"
      />
      {[0, 0.2, 0.4, 0.6, 0.8, 1].map((f, i) => (
        <circle key={i} cx={20 + f * 300} cy={95} r={3.5} fill={PINK} />
      ))}
      <text x={170} y={172} textAnchor="middle" fontSize="10" fill={MUTED}>{note ?? "standing wave — nodes marked"}</text>
    </Frame>
  );
}

// ---------- energy bars ----------
function Bars({ bars, note }: { bars: { label: string; frac: number; color?: string }[]; note?: string }) {
  return (
    <Frame>
      {bars.map((b, i) => {
        const x = 60 + i * 76;
        const hgt = Math.max(2, b.frac * 110);
        return (
          <g key={i}>
            <rect x={x} y={40} width={44} height={110} rx={8} fill="rgba(124,108,244,0.1)" />
            <rect x={x} y={150 - hgt} width={44} height={hgt} rx={8} fill={b.color ?? TEAL} />
            <text x={x + 22} y={166} textAnchor="middle" fontSize="10" fill={INK} fontWeight="bold">{b.label}</text>
          </g>
        );
      })}
      {note && <text x={170} y={184} textAnchor="middle" fontSize="10" fill={MUTED}>{note}</text>}
    </Frame>
  );
}

// ---------- collision ----------
function CollisionDiag({ m1, v1, m2, v2, note }: { m1: number; v1: number; m2: number; v2: number; note?: string }) {
  const r1 = 12 + m1 * 3.2, r2 = 12 + m2 * 3.2;
  const scale = 5;
  return (
    <Frame>
      <line x1={20} y1={130} x2={320} y2={130} stroke={INK} strokeWidth="2" />
      <circle cx={80} cy={130 - r1} r={r1} fill={VIOLET} />
      <text x={80} y={130 - r1 + 4} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="bold">{m1}kg</text>
      <circle cx={250} cy={130 - r2} r={r2} fill={PINK} />
      <text x={250} y={130 - r2 + 4} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="bold">{m2}kg</text>
      {v1 !== 0 && <Arrow x1={80} y1={130 - 2 * r1 - 12} x2={80 + v1 * scale} y2={130 - 2 * r1 - 12} color="#8fb8f7" />}
      {v2 !== 0 && <Arrow x1={250} y1={130 - 2 * r2 - 12} x2={250 + v2 * scale} y2={130 - 2 * r2 - 12} color="#8fb8f7" />}
      <text x={80} y={168} textAnchor="middle" fontSize="10" fill={MUTED}>{v1} m/s</text>
      <text x={250} y={168} textAnchor="middle" fontSize="10" fill={MUTED}>{v2} m/s</text>
      {note && <text x={170} y={184} textAnchor="middle" fontSize="10" fill={MUTED}>{note}</text>}
    </Frame>
  );
}

// ---------- piston ----------
function Piston({ temp, vol, note }: { temp: number; vol: number; note?: string }) {
  const boxX = 70, boxW = 200, boxY = 40, boxH = 110;
  const pistonX = boxX + boxW * vol;
  const color = temp > 450 ? PINK : temp > 250 ? GOLD : "#8fb8f7";
  const dots = Array.from({ length: 18 }, (_, i) => ({
    x: boxX + 8 + ((i * 37) % Math.max(20, pistonX - boxX - 16)),
    y: boxY + 10 + ((i * 53) % (boxH - 20)),
  }));
  return (
    <Frame>
      <rect x={boxX} y={boxY} width={boxW} height={boxH} fill="none" stroke={INK} strokeWidth="2" />
      <rect x={pistonX - 6} y={boxY} width={12} height={boxH} fill={VIOLET} rx={4} />
      {dots.map((d, i) => (
        <circle key={i} cx={Math.min(d.x, pistonX - 10)} cy={d.y} r={3.5} fill={color} />
      ))}
      <text x={boxX + boxW / 2} y={boxY - 8} textAnchor="middle" fontSize="11" fill={INK} fontWeight="bold">
        T = {temp} K · V = {(vol * 100).toFixed(0)}%
      </text>
      {note && <text x={170} y={176} textAnchor="middle" fontSize="10" fill={MUTED}>{note}</text>}
    </Frame>
  );
}

// ---------- orbits ----------
function OrbitsDiag({ r1, r2, note }: { r1: number; r2: number; note?: string }) {
  const cx = 170, cy = 95;
  return (
    <Frame>
      <circle cx={cx} cy={cy} r={12} fill={GOLD} />
      <circle cx={cx} cy={cy} r={r1} fill="none" stroke={VIOLET} strokeWidth="1.5" strokeDasharray="5 4" />
      <circle cx={cx} cy={cy} r={r2} fill="none" stroke={TEAL} strokeWidth="1.5" strokeDasharray="5 4" />
      <circle cx={cx + r1} cy={cy} r={6} fill={VIOLET} />
      <circle cx={cx + r2} cy={cy} r={6} fill={TEAL} />
      <text x={cx + r1 + 9} y={cy + 3} fontSize="10" fill={VIOLET} fontWeight="bold">A</text>
      <text x={cx + r2 + 9} y={cy + 3} fontSize="10" fill={TEAL} fontWeight="bold">B</text>
      {note && <text x={170} y={176} textAnchor="middle" fontSize="10" fill={MUTED}>{note}</text>}
    </Frame>
  );
}

export function QDiagram({ spec }: { spec: DiagramSpec }) {
  switch (spec.kind) {
    case "vgraph": return <VGraph graph={spec.graph} shape={spec.shape} note={spec.note} />;
    case "fbd": return <FBD scene={spec.scene} labels={spec.labels} />;
    case "circuit": return <Circuit layout={spec.layout ?? "series2"} labels={spec.labels ?? []} />;
    case "charges": return <Charges q={spec.q} note={spec.note} />;
    case "rayOptics": return <RayOptics lens={spec.lens} objectSide={spec.objectSide} />;
    case "wave": return <WaveDiag scene={spec.scene} note={spec.note} />;
    case "bars": return <Bars bars={spec.bars} note={spec.note} />;
    case "collision": return <CollisionDiag m1={spec.m1} v1={spec.v1} m2={spec.m2} v2={spec.v2} note={spec.note} />;
    case "piston": return <Piston temp={spec.temp} vol={spec.vol} note={spec.note} />;
    case "orbits": return <OrbitsDiag r1={spec.r1} r2={spec.r2} note={spec.note} />;
    default: return null;
  }
}

/** Small inline math chip used in choices. */
export function MChip({ tex }: { tex: string }) {
  return <M>{tex}</M>;
}
