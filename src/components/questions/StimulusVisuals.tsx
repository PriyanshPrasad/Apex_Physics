import { QDiagram } from "@/components/questions/Diagrams";
import type { StimulusVisual } from "@/data/qgen/core";

export function StimulusVisuals({ visuals }: { visuals: StimulusVisual[] }) {
  return (
    <div className="mt-4 space-y-4">
      {visuals.map((visual, index) => {
        const priorFigures = visuals.slice(0, index).filter((item) => item.kind === "diagram").length;
        const priorTables = visuals.slice(0, index).filter((item) => item.kind === "table").length;
        const label = visual.kind === "table" ? `TABLE ${priorTables + 1}` : `FIGURE ${priorFigures + 1}`;
        return visual.kind === "diagram" ? (
          <figure key={`${visual.kind}-${index}`} className="clay-sm overflow-hidden p-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">{label}</p>
            <div className="mt-1 overflow-x-auto"><QDiagram spec={visual.diagram} /></div>
            <figcaption className="mt-1 text-center text-xs text-muted-foreground">{visual.caption}</figcaption>
            {visual.purpose && <p className="mt-1 text-center text-[11px] text-muted-foreground">Purpose: {visual.purpose}</p>}
          </figure>
        ) : (
          <figure key={`${visual.kind}-${index}`} className="clay-sm overflow-x-auto p-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">{label}</p>
            <table className="mt-1 w-full min-w-[320px] text-left text-xs">
              <thead><tr>{visual.headers.map((header) => <th key={header} className="border-b border-border/60 px-2 py-2 font-extrabold">{header}</th>)}</tr></thead>
              <tbody>{visual.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border-b border-border/40 px-2 py-2">{cell}</td>)}</tr>)}</tbody>
            </table>
            <figcaption className="mt-1 text-xs text-muted-foreground">{visual.caption}</figcaption>
            {visual.purpose && <p className="mt-1 text-[11px] text-muted-foreground">Purpose: {visual.purpose}</p>}
          </figure>
        );
      })}
    </div>
  );
}
