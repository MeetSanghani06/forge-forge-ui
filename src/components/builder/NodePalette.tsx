import { Braces, Clock, GitBranch, Globe, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { NODE_TYPES } from "@/lib/mappers/workflowGraphMapper";

export const NODE_ICONS: Record<string, ReactNode> = {
  HTTP: <Globe className="size-4" />,
  AI_PROMPT: <Sparkles className="size-4" />,
  CONDITION: <GitBranch className="size-4" />,
  TRANSFORM: <Braces className="size-4" />,
  DELAY: <Clock className="size-4" />,
};

export function NodePalette({ onAdd }: { onAdd: (type: string) => void }) {
  return (
    <div className="w-56 shrink-0 border-r border-border bg-surface p-4">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        Node palette
      </p>
      <div className="mt-3 space-y-2">
        {NODE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type)}
            className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-left font-mono text-xs text-foreground transition-colors hover:border-primary/60 hover:bg-accent"
          >
            <span className="text-primary">{NODE_ICONS[type]}</span>
            {type}
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Click a node type to add it to the canvas, then configure it on the right.
      </p>
    </div>
  );
}
