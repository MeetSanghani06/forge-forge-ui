import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import { JsonViewer } from "@/components/common/JsonViewer";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateBlocks";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { NodeExecution } from "@/types/api";

function formatTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleTimeString();
}

function duration(node: NodeExecution) {
  if (!node.startedAt || !node.completedAt) return null;
  const ms = new Date(node.completedAt).getTime() - new Date(node.startedAt).getTime();
  if (Number.isNaN(ms) || ms < 0) return null;
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function NodeRow({ node, index }: { node: NodeExecution; index: number }) {
  const [open, setOpen] = useState(false);
  const label = node.nodeKey ?? node.nodeName ?? node.name ?? node.workflowNodeId ?? `Node ${index + 1}`;
  const took = duration(node);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent"
      >
        {open ? (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="font-mono text-[11px] text-muted-foreground">{index + 1}</span>
        <span className="truncate font-mono text-xs text-foreground">{label}</span>
        <span className="ml-auto flex shrink-0 items-center gap-3">
          {took ? <span className="font-mono text-[11px] text-muted-foreground">{took}</span> : null}
          <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
            {formatTime(node.startedAt)}
          </span>
          <StatusBadge status={node.status} />
        </span>
      </button>

      {open ? (
        <div className="space-y-4 border-t border-border bg-background/40 px-4 py-4">
          <dl className="grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Node ID
              </dt>
              <dd className="mt-1 break-all font-mono text-[11px]">
                {node.workflowNodeId ?? node.nodeId ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Started
              </dt>
              <dd className="mt-1 font-mono text-[11px]">{formatTime(node.startedAt)}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Completed
              </dt>
              <dd className="mt-1 font-mono text-[11px]">{formatTime(node.completedAt)}</dd>
            </div>
          </dl>

          {node.errorMessage ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
              <p className="font-mono text-xs text-destructive">{node.errorMessage}</p>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Input
              </h4>
              <JsonViewer value={node.input} />
            </div>
            <div className="space-y-2">
              <h4 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Output
              </h4>
              <JsonViewer value={node.output} empty="No output" />
            </div>
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function NodeExecutionTimeline({
  nodes,
  isLoading,
  error,
}: {
  nodes?: NodeExecution[];
  isLoading?: boolean;
  error?: unknown;
}) {
  if (isLoading) return <LoadingState label="Loading node executions..." />;
  if (error) return <ErrorState error={error} />;
  if (!nodes || nodes.length === 0) {
    return <EmptyState title="No node executions reported yet" />;
  }

  const ordered = [...nodes].sort((a, b) => {
    const at = a.startedAt ? new Date(a.startedAt).getTime() : 0;
    const bt = b.startedAt ? new Date(b.startedAt).getTime() : 0;
    return at - bt;
  });

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {ordered.map((node, index) => (
        <NodeRow key={node.id ?? `${node.nodeKey ?? "node"}-${index}`} node={node} index={index} />
      ))}
    </ul>
  );
}
