import katex from "katex";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

function render(tex: string, display: boolean): string | null {
  try {
    return katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      strict: false,
      output: "html",
    });
  } catch {
    return null;
  }
}

export function M({ children, className }: { children: string; className?: string }) {
  const html = useMemo(() => render(children, false), [children]);
  if (html === null) {
    return <code className={cn("rounded bg-clay-2 px-1.5 py-0.5 text-[0.85em]", className)}>{children}</code>;
  }
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Eq({ tex, className, label }: { tex: string; className?: string; label?: string }) {
  const html = useMemo(() => render(tex, true), [tex]);
  return (
    <div className={cn("clay-eq px-5 py-3 text-center", className)}>
      {html === null ? (
        <code className="text-sm">{tex}</code>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      )}
      {label && <p className="mt-1 text-xs text-muted-foreground">{label}</p>}
    </div>
  );
}
