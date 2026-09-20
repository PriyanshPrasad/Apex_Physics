import { useState } from "react";
import { Atom, Bolt, CircleDot, Gauge, Orbit, Waves } from "lucide-react";
import { SIMS } from "@/sims/registry";
import { SimFallback } from "@/sims/framework";

const TOPICS = [
  ["Kinematics", "projectile", Orbit, "Projectile motion"],
  ["Forces", "fbd", Gauge, "Free-body diagram"],
  ["Energy", "energy", Bolt, "Energy conservation"],
  ["Momentum", "collision", CircleDot, "Collision carts"],
  ["Rotation", "rotation", Orbit, "Rotational dynamics"],
  ["Electric Fields", "charges", Atom, "Charge fields"],
  ["Circuits", "circuits", Bolt, "Circuit builder"],
  ["Waves", "waves", Waves, "Traveling waves"],
  ["Thermodynamics", "gas", Atom, "Particle gas"],
] as const;

export function EmbeddedPhysicsShowcase() {
  const [active, setActive] = useState(0);
  const [topic, simKey, Icon, description] = TOPICS[active];
  const Sim = SIMS[simKey];
  return <div className="embedded-showcase">
    <div className="embedded-topic-rail" role="tablist" aria-label="Physics simulations">
      {TOPICS.map(([label, key, TopicIcon], index) => <button key={key} role="tab" aria-selected={active === index} onClick={() => setActive(index)} className={active === index ? "active" : ""}>
        <TopicIcon className="size-3.5" /><span>{label}</span>
      </button>)}
    </div>
    <div className="embedded-sim-card">
      <div className="embedded-sim-heading"><span><Icon className="mr-2 inline size-4" />{topic}</span><small>{description} · production simulation</small></div>
      <div className="embedded-sim-body">
        {Sim ? (
          <SimFallback name={`homepage ${topic}`}>
            <Sim key={simKey} />
          </SimFallback>
        ) : (
          <p className="p-6 text-sm text-muted-foreground">Simulation unavailable.</p>
        )}
      </div>
    </div>
  </div>;
}
