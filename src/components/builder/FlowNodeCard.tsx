import { Handle, Position, type NodeProps } from "@xyflow/react";

import { NODE_ICONS } from "@/components/builder/NodePalette";
import { cn } from "@/lib/utils";

export function FlowNodeCard({ data, selected }: NodeProps) {
  const nodeData = data as { label: string; nodeType: string };
  return (
    <div
      className={cn(
        "min-w-44 rounded-md border bg-surface px-3 py-2 shadow-sm transition-colors",
        selected ? "border-primary" : "border-border",
      )}
    >
      <Handle type="target" position={Position.Left} className="!size-2 !bg-primary" />
      <div className="flex items-center gap-2">
        <span className="text-primary">{NODE_ICONS[nodeData.nodeType] ?? null}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{nodeData.label}</p>
          <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            {nodeData.nodeType}
          </p>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!size-2 !bg-primary" />
    </div>
  );
}
