import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateBlocks";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useExecutions } from "@/hooks/useExecutions";
import {
  resolveActiveVersion,
  useWorkflow,
  useWorkflowVersions,
  versionNumberOf,
} from "@/hooks/useWorkflow";

export const Route = createFileRoute(
  "/_authenticated/workspaces/$workspaceId/workflows/$workflowId/history",
)({
  head: () => ({
    meta: [
      { title: "Execution history — FlowForge" },
      { name: "description", content: "Past executions for this FlowForge workflow version." },
      { property: "og:title", content: "Execution history — FlowForge" },
      {
        property: "og:description",
        content: "Past executions for this FlowForge workflow version.",
      },
    ],
  }),
  component: HistoryPage,
});

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function duration(start?: string | null, end?: string | null) {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(ms) || ms < 0) return "—";
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

function HistoryPage() {
  const { workspaceId, workflowId } = Route.useParams();
  const navigate = useNavigate();

  const workflowQuery = useWorkflow(workspaceId, workflowId);
  const versionsQuery = useWorkflowVersions(workspaceId, workflowId);
  const activeVersion = useMemo(
    () => resolveActiveVersion(workflowQuery.data, versionsQuery.data),
    [workflowQuery.data, versionsQuery.data],
  );
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>(undefined);
  const versionId = selectedVersionId ?? activeVersion?.id;

  const executionsQuery = useExecutions(versionId);
  const executions = executionsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="space-y-3">
        <nav className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <Link to="/workspaces/$workspaceId/workflows" params={{ workspaceId }} className="hover:text-foreground">
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
          <h1 className="text-2xl font-semibold tracking-tight">Execution history</h1>
          <div className="flex items-center gap-2">
            {versionsQuery.data && versionsQuery.data.length > 0 ? (
              <Select value={versionId ?? ""} onValueChange={setSelectedVersionId}>
                <SelectTrigger className="h-9 w-40 font-mono text-xs">
                  <SelectValue placeholder="Version" />
                </SelectTrigger>
                <SelectContent>
                  {versionsQuery.data.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      v{versionNumberOf(version) ?? "?"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
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
        </div>
      </div>

      {executionsQuery.isLoading ? <LoadingState label="Loading executions..." /> : null}
      {executionsQuery.error ? <ErrorState error={executionsQuery.error} /> : null}
      {!versionId && !versionsQuery.isLoading ? (
        <EmptyState title="This workflow has no version yet" />
      ) : null}

      {versionId && !executionsQuery.isLoading && !executionsQuery.error ? (
        executions.length === 0 ? (
          <EmptyState title="No executions yet" />
        ) : (
          <div className="rounded-lg border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Execution ID</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((execution) => {
                  const executionId = execution.id ?? execution.executionId ?? "";
                  return (
                    <TableRow
                      key={executionId}
                      className="cursor-pointer"
                      onClick={() =>
                        void navigate({
                          to: "/workspaces/$workspaceId/executions/$executionId",
                          params: { workspaceId, executionId },
                        })
                      }
                    >
                      <TableCell className="font-mono text-xs">{executionId}</TableCell>
                      <TableCell className="font-mono text-xs">
                        v{execution.version ?? versionNumberOf(activeVersion) ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={execution.status} />
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(execution.startedAt)}</TableCell>
                      <TableCell className="text-xs">{formatDate(execution.completedAt)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {duration(execution.startedAt, execution.completedAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )
      ) : null}
    </div>
  );
}
