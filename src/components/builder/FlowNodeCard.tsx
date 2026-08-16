import { Handle, Position, type NodeProps } from "@xyflow/react";

import { NODE_ICONS } from "@/components/builder/NodePalette";
import { NODE_LABELS, TRIGGER_NODE_TYPE } from "@/lib/mappers/workflowGraphMapper";
import { cn } from "@/lib/utils";

export function FlowNodeCard({ data, selected }: NodeProps) {
  const nodeData = data as { label: string; nodeType: string; nodeKey?: string };
  const isTrigger = nodeData.nodeType === TRIGGER_NODE_TYPE;

  return (
    <div
      className={cn(
        "min-w-44 border px-3 py-2 shadow-sm transition-colors",
        isTrigger ? "rounded-full bg-warning/10" : "rounded-md bg-surface",
        selected
          ? "border-primary"
          : isTrigger
            ? "border-warning/60"
            : "border-border",
      )}
    >
      {isTrigger ? null : (
        <Handle type="target" position={Position.Left} className="!size-2 !bg-primary" />
      )}
      <div className="flex items-center gap-2">
        <span className={isTrigger ? "text-warning" : "text-primary"}>
          {NODE_ICONS[nodeData.nodeType] ?? null}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{nodeData.label}</p>
          <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            {NODE_LABELS[nodeData.nodeType] ?? nodeData.nodeType}
          </p>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!size-2 !bg-primary" />
    </div>
  );
}
