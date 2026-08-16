import { Braces, Clock, GitBranch, Globe, Sparkles, Zap } from "lucide-react";
import type { ReactNode } from "react";

import { NODE_LABELS, NODE_TYPES, TRIGGER_NODE_TYPE } from "@/lib/mappers/workflowGraphMapper";
import { cn } from "@/lib/utils";

export const NODE_ICONS: Record<string, ReactNode> = {
  TRIGGER: <Zap className="size-4" />,
  HTTP: <Globe className="size-4" />,
  AI_PROMPT: <Sparkles className="size-4" />,
  CONDITION: <GitBranch className="size-4" />,
  TRANSFORM: <Braces className="size-4" />,
  DELAY: <Clock className="size-4" />,
};

export function NodePalette({
  onAdd,
  hasTrigger = false,
  disabled = false,
}: {
  onAdd: (type: string) => void;
  hasTrigger?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="w-56 shrink-0 border-r border-border bg-surface p-4">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        Node palette
      </p>
      <div className="mt-3 space-y-2">
        {NODE_TYPES.map((type) => {
          const isTrigger = type === TRIGGER_NODE_TYPE;
          const blocked = disabled || (isTrigger && hasTrigger);
          return (
            <button
              key={type}
              type="button"
              disabled={blocked}
              title={
                isTrigger && hasTrigger ? "A workflow can have only one trigger." : undefined
              }
              onClick={() => onAdd(type)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left font-mono text-xs transition-colors",
                isTrigger
                  ? "border-warning/50 bg-warning/10 text-foreground"
                  : "border-border bg-background text-foreground",
                blocked
                  ? "cursor-not-allowed opacity-50"
                  : "hover:border-primary/60 hover:bg-accent",
              )}
            >
              <span className={isTrigger ? "text-warning" : "text-primary"}>
                {NODE_ICONS[type]}
              </span>
              {NODE_LABELS[type] ?? type}
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Click a node type to add it to the canvas, then configure it on the right. Every workflow
        needs exactly one Trigger.
      </p>
    </div>
  );
}
