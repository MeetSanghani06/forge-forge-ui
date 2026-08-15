import type { Edge, Node } from "@xyflow/react";

import type { WorkflowEdgeDto, WorkflowGraphDto, WorkflowNodeDto } from "@/types/api";

export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  nodeType: string;
  config: Record<string, unknown>;
}

export type FlowNode = Node<FlowNodeData>;
export type FlowEdge = Edge;

export const NODE_TYPES = ["HTTP", "AI_PROMPT", "CONDITION", "TRANSFORM", "DELAY"] as const;
export type KnownNodeType = (typeof NODE_TYPES)[number];

function nodeId(dto: WorkflowNodeDto, index: number): string {
  return dto.id ?? dto.nodeKey ?? `node-${index}`;
}

/** Backend graph DTO -> React Flow graph. */
export function toFlowGraph(graph: WorkflowGraphDto | undefined): {
  nodes: FlowNode[];
  edges: FlowEdge[];
} {
  const nodeDtos = graph?.nodes ?? [];
  const edgeDtos = graph?.edges ?? [];

  const nodes: FlowNode[] = nodeDtos.map((dto, index) => {
    const id = nodeId(dto, index);
    const type = dto.type ?? dto.nodeType ?? "HTTP";
    return {
      id,
      type: "flowforge",
      position: {
        x: dto.position?.x ?? dto.positionX ?? 120 + (index % 3) * 260,
        y: dto.position?.y ?? dto.positionY ?? 80 + Math.floor(index / 3) * 160,
      },
      data: {
        label: dto.name ?? dto.nodeKey ?? type,
        nodeType: type,
        config: (dto.config ?? {}) as Record<string, unknown>,
      },
    };
  });

  const edges: FlowEdge[] = edgeDtos.map((dto, index) => ({
    id: dto.id ?? `edge-${index}`,
    source: dto.sourceNodeId ?? dto.source ?? "",
    target: dto.targetNodeId ?? dto.target ?? "",
    label: dto.label ?? dto.condition ?? undefined,
    animated: true,
  }));

  return { nodes, edges };
}

/** React Flow graph -> backend graph request. */
export function toGraphDto(nodes: FlowNode[], edges: FlowEdge[]): WorkflowGraphDto {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      nodeKey: node.id,
      name: node.data.label,
      type: node.data.nodeType,
      nodeType: node.data.nodeType,
      config: node.data.config,
      positionX: Math.round(node.position.x),
      positionY: Math.round(node.position.y),
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sourceNodeId: edge.source,
      targetNodeId: edge.target,
      source: edge.source,
      target: edge.target,
    })),
  };
}

/** Default config scaffolding per node type (kept generic, backend owns validation). */
export function defaultConfigFor(type: string): Record<string, unknown> {
  switch (type) {
    case "HTTP":
      return { url: "", method: "GET", headers: {}, body: "" };
    case "AI_PROMPT":
      return { prompt: "" };
    case "CONDITION":
      return { expression: "" };
    case "TRANSFORM":
      return { expression: "" };
    case "DELAY":
      return { durationMs: 1000 };
    default:
      return {};
  }
}
