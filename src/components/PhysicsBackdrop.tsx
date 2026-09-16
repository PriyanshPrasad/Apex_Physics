import { useEffect, useRef, useState } from "react";

type PhysicsBackdropProps = { className?: string; dense?: boolean };

export function PhysicsBackdrop({ className = "", dense = false }: PhysicsBackdropProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const node = ref.current;
    if (!node) return;
    const move = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      setOffset({ x: ((event.clientX - rect.left) / rect.width - .5) * 14, y: ((event.clientY - rect.top) / rect.height - .5) * 10 });
    };
    node.addEventListener("pointermove", move);
    return () => node.removeEventListener("pointermove", move);
  }, []);
  return <div ref={ref} aria-hidden="true" className={`physics-backdrop pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
    <div className="physics-glow physics-glow-a" />
    <div className="physics-glow physics-glow-b" />
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 620" preserveAspectRatio="none" style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}>
      <defs>
        <linearGradient id="field-line" x1="0" x2="1"><stop stopColor="#9a8bff" stopOpacity="0" /><stop offset=".45" stopColor="#9a8bff" stopOpacity=".45" /><stop offset="1" stopColor="#6fd6c8" stopOpacity="0" /></linearGradient>
        <radialGradient id="core"><stop stopColor="#ffffff" stopOpacity=".8" /><stop offset=".28" stopColor="#9a8bff" stopOpacity=".5" /><stop offset="1" stopColor="#9a8bff" stopOpacity="0" /></radialGradient>
      </defs>
      <g className="physics-grid" opacity={dense ? ".18" : ".1"}>{Array.from({ length: 12 }, (_, i) => <path key={`h-${i}`} d={`M0 ${70 + i * 44} C 260 ${20 + i * 32}, 740 ${120 + i * 25}, 1000 ${55 + i * 42}`} fill="none" stroke="url(#field-line)" strokeWidth="1" />)}{Array.from({ length: 10 }, (_, i) => <path key={`v-${i}`} d={`M${80 + i * 100} 0 C ${20 + i * 110} 180, ${150 + i * 75} 390, ${70 + i * 110} 620`} fill="none" stroke="url(#field-line)" strokeWidth="1" />)}</g>
      <g transform={`translate(${offset.x * .7} ${offset.y * .7})`}>
        <circle cx="760" cy="205" r="135" fill="none" stroke="#9a8bff" strokeOpacity=".16" strokeWidth="1" strokeDasharray="5 9" />
        <circle cx="760" cy="205" r="92" fill="none" stroke="#6fd6c8" strokeOpacity=".24" strokeWidth="1" />
        <circle cx="760" cy="205" r="42" fill="url(#core)" />
        <circle cx="760" cy="205" r="7" fill="#fff" opacity=".9" />
        <circle cx="760" cy="70" r="5" fill="#ffc46b" className="physics-orbit" />
        <circle cx="668" cy="205" r="5" fill="#ff8fb1" className="physics-orbit physics-orbit-delay" />
        <path d="M560 450 C 660 330 790 530 920 395" fill="none" stroke="#6fd6c8" strokeOpacity=".35" strokeWidth="2" strokeDasharray="3 10" />
        <path d="M570 450 L700 385" stroke="#ffc46b" strokeWidth="2" strokeOpacity=".65" />
        <path d="M700 385 l-12 3 7 9" fill="#ffc46b" />
        <text x="710" y="370" fill="#ffc46b" fontSize="14" opacity=".8">v</text>
      </g>
    </svg>
  </div>;
}
