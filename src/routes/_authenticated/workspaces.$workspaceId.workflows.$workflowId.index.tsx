import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Link, createFileRoute } from "@tanstack/react-router";
import { History, Loader2, Save, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ExecuteDialog } from "@/components/builder/ExecuteDialog";
import { FlowNodeCard } from "@/components/builder/FlowNodeCard";
import { NodeInspector } from "@/components/builder/NodeInspector";
import { NodePalette } from "@/components/builder/NodePalette";
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
  useCreateVersion,
  usePublishVersion,
  useSaveGraph,
  useWorkflowGraph,
} from "@/hooks/useWorkflowGraph";
import { resolveActiveVersion, useWorkflow, useWorkflowVersions, versionNumberOf } from "@/hooks/useWorkflow";
import { getErrorMessage } from "@/lib/errorHandler";
import {
  defaultConfigFor,
  toFlowGraph,
  toGraphDto,
  type FlowEdge,
  type FlowNode,
} from "@/lib/mappers/workflowGraphMapper";

export const Route = createFileRoute(
  "/_authenticated/workspaces/$workspaceId/workflows/$workflowId/",
)({
  head: () => ({
    meta: [
      { title: "Workflow builder — FlowForge" },
      { name: "description", content: "Design, version and run a FlowForge workflow graph." },
      { property: "og:title", content: "Workflow builder — FlowForge" },
      {
        property: "og:description",
        content: "Design, version and run a FlowForge workflow graph.",
      },
    ],
  }),
  component: WorkflowBuilderPage,
});

const nodeTypes = { flowforge: FlowNodeCard };

function WorkflowBuilderPage() {
  const { workspaceId, workflowId } = Route.useParams();

  const workflowQuery = useWorkflow(workspaceId, workflowId);
  const versionsQuery = useWorkflowVersions(workspaceId, workflowId);

  const activeVersion = useMemo(
    () => resolveActiveVersion(workflowQuery.data, versionsQuery.data),
    [workflowQuery.data, versionsQuery.data],
  );
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>(undefined);
  const versionId = selectedVersionId ?? activeVersion?.id;

  const graphQuery = useWorkflowGraph(workspaceId, workflowId, versionId);
  const saveGraph = useSaveGraph(workspaceId, workflowId, versionId);
  const publish = usePublishVersion(workspaceId, workflowId, versionId);
  const createVersion = useCreateVersion(workspaceId, workflowId);

  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!graphQuery.data) return;
    const mapped = toFlowGraph(graphQuery.data);
    setNodes(mapped.nodes);
    setEdges(mapped.edges);
  }, [graphQuery.data]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((current) => applyNodeChanges(changes, current) as FlowNode[]),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((current) => applyEdgeChanges(changes, current)),
    [],
  );
  const onConnect = useCallback(
    (connection: Connection) => setEdges((current) => addEdge({ ...connection, animated: true }, current)),
    [],
  );

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  function addNode(type: string) {
    const id = crypto.randomUUID();
    setNodes((current) => [
      ...current,
      {
        id,
        type: "flowforge",
        position: { x: 160 + current.length * 40, y: 120 + current.length * 30 },
        data: { label: type, nodeType: type, config: defaultConfigFor(type) },
      },
    ]);
    setSelectedNodeId(id);
  }

  function updateSelected(update: Partial<FlowNode["data"]>) {
    setNodes((current) =>
      current.map((node) =>
        node.id === selectedNodeId ? { ...node, data: { ...node.data, ...update } } : node,
      ),
    );
  }

  function deleteSelected() {
    setNodes((current) => current.filter((node) => node.id !== selectedNodeId));
    setEdges((current) =>
      current.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId),
    );
    setSelectedNodeId(null);
  }

  async function handleSave() {
    if (!versionId) return;
    try {
      await saveGraph.mutateAsync(toGraphDto(nodes, edges));
      toast.success("Workflow graph saved");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handlePublish() {
    if (!versionId) return;
    try {
      const published = await publish.mutateAsync();
      toast.success(`Published v${versionNumberOf(published) ?? ""}`.trim());
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleCreateVersion() {
    try {
      const version = await createVersion.mutateAsync();
      if (version?.id) setSelectedVersionId(version.id);
      toast.success("New version created");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const isLoadingMeta = workflowQuery.isLoading || versionsQuery.isLoading;

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-border bg-surface px-6 py-4">
        <nav className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <Link to="/workspaces/$workspaceId/workflows" params={{ workspaceId }} className="hover:text-foreground">
            Workspace
          </Link>
          <span>/</span>
          <span className="text-foreground">{workflowQuery.data?.name ?? "Workflow"}</span>
          <span>/</span>
          <span>v{versionNumberOf(activeVersion) ?? "—"}</span>
        </nav>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">
              {workflowQuery.data?.name ?? "Workflow builder"}
            </h1>
            <StatusBadge status={workflowQuery.data?.status ?? "DRAFT"} />
            {versionsQuery.data && versionsQuery.data.length > 0 ? (
              <Select value={versionId ?? ""} onValueChange={setSelectedVersionId}>
                <SelectTrigger className="h-8 w-36 font-mono text-xs">
                  <SelectValue placeholder="Version" />
                </SelectTrigger>
                <SelectContent>
                  {versionsQuery.data.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      v{versionNumberOf(version) ?? "?"} {version.status ? `· ${version.status}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link
                to="/workspaces/$workspaceId/workflows/$workflowId/history"
                params={{ workspaceId, workflowId }}
              >
                <History className="size-3.5" />
                History
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => void handleSave()}
              disabled={!versionId || saveGraph.isPending}
            >
              {saveGraph.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => void handlePublish()}
              disabled={!versionId || publish.isPending}
            >
              {publish.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              Publish
            </Button>
            <ExecuteDialog workspaceId={workspaceId} workflowVersionId={versionId} />
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        {isLoadingMeta ? (
          <div className="p-6">
            <LoadingState label="Loading workflow..." />
          </div>
        ) : workflowQuery.error ? (
          <div className="p-6">
            <ErrorState error={workflowQuery.error} />
          </div>
        ) : !versionId ? (
          <div className="p-6">
            <EmptyState title="This workflow has no version yet">
              <Button onClick={() => void handleCreateVersion()} disabled={createVersion.isPending}>
                {createVersion.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Create first version
              </Button>
            </EmptyState>
          </div>
        ) : (
          <div className="flex h-full min-h-0">
            <NodePalette onAdd={addNode} />
            <div className="relative min-w-0 flex-1">
              {graphQuery.isLoading ? (
                <div className="p-6">
                  <LoadingState label="Loading workflow graph..." />
                </div>
              ) : graphQuery.error ? (
                <div className="p-6">
                  <ErrorState error={graphQuery.error} />
                </div>
              ) : (
                <>
                  {nodes.length === 0 ? (
                    <div className="pointer-events-none absolute inset-x-0 top-8 z-10 flex justify-center">
                      <span className="rounded-md border border-dashed border-border bg-surface px-4 py-2 text-sm text-muted-foreground">
                        No workflow nodes yet — add one from the palette
                      </span>
                    </div>
                  ) : null}
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                    onPaneClick={() => setSelectedNodeId(null)}
                    fitView
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
                    <Controls />
                  </ReactFlow>
                </>
              )}
            </div>
            <NodeInspector
              node={selectedNode}
              onChangeLabel={(label) => updateSelected({ label })}
              onChangeConfig={(config) => updateSelected({ config })}
              onDelete={deleteSelected}
            />
          </div>
        )}
      </div>
    </div>
  );
}
