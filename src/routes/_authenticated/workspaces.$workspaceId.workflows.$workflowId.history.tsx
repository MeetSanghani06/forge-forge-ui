import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { EmptyState } from "@/components/common/StateBlocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkflow } from "@/hooks/useWorkflow";

export const Route = createFileRoute(
  "/_authenticated/workspaces/$workspaceId/workflows/$workflowId/history",
)({
  head: () => ({
    meta: [
      { title: "Execution lookup — FlowForge" },
      {
        name: "description",
        content: "Look up a FlowForge workflow run by its execution ID.",
      },
      { property: "og:title", content: "Execution lookup — FlowForge" },
      {
        property: "og:description",
        content: "Look up a FlowForge workflow run by its execution ID.",
      },
    ],
  }),
  component: HistoryPage,
});

/**
 * The backend exposes no list-executions endpoint, so history is an
 * execution-ID lookup plus the runs started from this browser.
 */
const STORAGE_PREFIX = "flowforge:recent-executions:";

interface RecentExecution {
  executionId: string;
  startedAt: string;
}

export function rememberExecution(workflowId: string, executionId: string) {
  if (typeof window === "undefined" || !executionId) return;
  const key = STORAGE_PREFIX + workflowId;
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: RecentExecution[] = raw ? (JSON.parse(raw) as RecentExecution[]) : [];
    const next = [
      { executionId, startedAt: new Date().toISOString() },
      ...parsed.filter((item) => item.executionId !== executionId),
    ].slice(0, 20);
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    /* recent-run memory is best effort */
  }
}

function readRecent(workflowId: string): RecentExecution[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + workflowId);
    return raw ? (JSON.parse(raw) as RecentExecution[]) : [];
  } catch {
    return [];
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function HistoryPage() {
  const { workspaceId, workflowId } = Route.useParams();
  const navigate = useNavigate();
  const workflowQuery = useWorkflow(workspaceId, workflowId);

  const [executionId, setExecutionId] = useState("");
  const [recent, setRecent] = useState<RecentExecution[]>([]);

  useEffect(() => {
    setRecent(readRecent(workflowId));
  }, [workflowId]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const id = executionId.trim();
    if (!id) return;
    void navigate({
      to: "/workspaces/$workspaceId/executions/$executionId",
      params: { workspaceId, executionId: id },
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <nav className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
        <Link
          to="/workspaces/$workspaceId/workflows"
          params={{ workspaceId }}
          className="hover:text-foreground"
        >
          Workspace
        </Link>
        <span>/</span>
        <Link
          to="/workspaces/$workspaceId/workflows/$workflowId"
          params={{ workspaceId, workflowId }}
          className="hover:text-foreground"
        >
          {workflowQuery.data?.name ?? "Workflow"}
        </Link>
        <span>/</span>
        <span className="text-foreground">History</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Execution lookup</h1>
          <p className="text-sm text-muted-foreground">
            FlowForge reads a run by its execution ID — paste one below to open its live detail
            view.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link
            to="/workspaces/$workspaceId/workflows/$workflowId"
            params={{ workspaceId, workflowId }}
          >
            <ArrowLeft className="size-3.5" />
            Back to builder
          </Link>
        </Button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-lg border border-border bg-surface p-4"
      >
        <Label htmlFor="execution-id">Execution ID</Label>
        <div className="flex gap-2">
          <Input
            id="execution-id"
            className="font-mono text-xs"
            value={executionId}
            onChange={(event) => setExecutionId(event.target.value)}
            placeholder="0f2c9a1e-7f3d-4c65-9d1c-2b0e5a7c9f11"
          />
          <Button type="submit" className="gap-1.5" disabled={!executionId.trim()}>
            <Search className="size-3.5" />
            Open
          </Button>
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Runs started from this browser
        </h2>
        {recent.length === 0 ? (
          <EmptyState title="No runs recorded on this device yet" />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {recent.map((item) => (
              <li key={item.executionId}>
                <Link
                  to="/workspaces/$workspaceId/executions/$executionId"
                  params={{ workspaceId, executionId: item.executionId }}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent"
                >
                  <span className="truncate font-mono text-xs">{item.executionId}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(item.startedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
