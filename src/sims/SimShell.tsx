import { useState, type ReactNode } from "react";
import { ChevronDown, Sigma, Lightbulb, FlaskConical } from "lucide-react";
import { SimFallback, SimButtons } from "./framework";
import { M } from "@/components/math/Math";

export interface SimPhysicsSpec {
  what: string; // "What's happening?"
  equations: { tex: string; note?: string }[]; // governing equations
  variables: { sym: string; meaning: string; unit: string }[];
  why: string; // "Why it behaves this way"
  tryThis: string; // concrete experiment suggestion
}

export interface PredictionSpec {
  question: string; // "If you double X, what happens to Y?"
  options: string[];
  correct: number;
  explain: string; // revealed after running — shown once they've picked AND observed
  runLabel?: string; // e.g. "Run it and find out" — CTA that unpauses/resets the sim
}

/**
 * Standard sim chassis:
 *   ┌ SimShell ─────────────────────────────┐
 *   │ [canvas from children]                │
 *   │ [⏸ ▶ ↻ ⏭ controls]                    │
 *   │ [Physics panel: what / eq / vars /    │
 *   │  why / try this]                      │
 *   │ [Prediction prompt → run → compare]   │
 *   └───────────────────────────────────────┘
 * Children receive running + resetKey so the sim's own state stays inside
 * the sim component; SimShell owns only the control surface.
 */
export function SimShell({
  children,
  physics,
  prediction,
  runSignal,
  running,
  onPlayPause,
  onReset,
  onStep,
  disableStep,
  showControls = true,
}: {
  children: ReactNode;
  physics: SimPhysicsSpec;
  prediction?: PredictionSpec;
  /** bump to un-pause when the student clicks "run it" on the prediction */
  runSignal?: { running: boolean; reset: boolean };
  running: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onStep?: () => void;
  disableStep?: boolean;
  /** false for parameter-driven (non-animated) sims — hides meaningless play/pause */
  showControls?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [ran, setRan] = useState(false);

  const handleRunFromPrediction = () => {
    setRan(true);
    if (runSignal) {
      if (runSignal.reset) onReset();
      if (runSignal.running && !running) onPlayPause();
    }
  };

  return (
    <div>
      <SimFallback>{children}</SimFallback>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        {showControls && (
          <SimButtons running={running} onPlayPause={onPlayPause} onReset={onReset} onStep={onStep} disabled={disableStep} />
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          className="clay-sm clay-press flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[var(--clay-primary-deep)]"
        >
          <Sigma className="size-3.5" /> Physics <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="clay-tint mt-3 space-y-3 p-4 text-sm">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">What's happening?</p>
            <p className="mt-1 leading-6">{physics.what}</p>
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">Governing equations</p>
            <div className="mt-2 space-y-1.5">
              {physics.equations.map((e, i) => (
                <div key={i} className="clay-eq flex flex-wrap items-baseline gap-x-3 px-3 py-2">
                  <M>{e.tex}</M>
                  {e.note && <span className="text-xs text-muted-foreground">{e.note}</span>}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">Variables & units</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {physics.variables.map((v, i) => (
                <span key={i} className="clay-sm px-2.5 py-1 text-[11px] font-semibold">
                  <M>{v.sym}</M> — {v.meaning} <span className="text-muted-foreground">({v.unit})</span>
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">Why?</p>
            <p className="mt-1 leading-6">{physics.why}</p>
          </div>
          <div className="clay-sm p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[var(--clay-primary-deep)]">
              <FlaskConical className="size-3.5" /> Try this
            </p>
            <p className="mt-1 leading-6">{physics.tryThis}</p>
          </div>
        </div>
      )}

      {prediction && (
        <div className="clay mt-3 p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
            <Lightbulb className="size-3.5 text-[#ffc46b]" /> Predict before you play
          </p>
          <p className="mt-1.5 text-sm font-semibold">{prediction.question}</p>
          {picked === null ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {prediction.options.map((o, i) => (
                <button key={i} onClick={() => setPicked(i)} className="clay-sm clay-press px-3.5 py-2 text-xs font-semibold">
                  {o}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-sm">
              <p className="text-xs font-bold text-muted-foreground">
                Your prediction: {prediction.options[picked]}
                {!ran && (
                  <>
                    {" · "}
                    <button onClick={handleRunFromPrediction} className="font-bold text-[var(--clay-primary-deep)] underline underline-offset-2">
                      {prediction.runLabel ?? "Run it and find out"}
                    </button>
                  </>
                )}
              </p>
              {ran && (
                <p className="clay-tint mt-2 p-3 leading-6">
                  <strong>What actually happens:</strong> {prediction.explain}
                  {picked === prediction.correct
                    ? " — you called it."
                    : " — close? Compare against the readouts above and see which variable actually moved."}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
