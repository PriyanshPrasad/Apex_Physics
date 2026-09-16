import { useRef } from "react";
import type { PointerEvent, ReactNode } from "react";

type DepthCardProps = { children: ReactNode; className?: string; as?: "div" | "article" };

export function DepthCard({ children, className = "", as = "div" }: DepthCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const Tag = as;
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    ref.current.style.setProperty("--tilt-x", `${(-y * 3).toFixed(2)}deg`);
    ref.current.style.setProperty("--tilt-y", `${(x * 4).toFixed(2)}deg`);
    ref.current.style.setProperty("--spot-x", `${(x + .5) * 100}%`);
    ref.current.style.setProperty("--spot-y", `${(y + .5) * 100}%`);
  };
  const leave = () => { if (ref.current) { ref.current.style.setProperty("--tilt-x", "0deg"); ref.current.style.setProperty("--tilt-y", "0deg"); } };
  return <Tag ref={ref} onPointerMove={move} onPointerLeave={leave} className={`depth-card ${className}`}>{children}</Tag>;
}
