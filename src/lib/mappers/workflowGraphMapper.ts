import type { Edge, Node } from "@xyflow/react";

import type { WorkflowEdgeDto, WorkflowGraphDto, WorkflowNodeDto } from "@/types/api";

export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  /** Stable backend key for the node; also used as the React Flow node id fallback. */
  nodeKey: string;
  nodeType: string;
  config: Record<string, unknown>;
  connectorId?: string | null;
  /** Backend node id, when this node was loaded from a persisted graph. */
  backendId?: string | undefined;
}

export type FlowNode = Node<FlowNodeData>;
export type FlowEdgeData = { condition?: string | null };
export type FlowEdge = Edge;

export const TRIGGER_NODE_TYPE = "TRIGGER";

export const NODE_TYPES = [
  TRIGGER_NODE_TYPE,
  "HTTP",
  "AI_PROMPT",
  "CONDITION",
  "TRANSFORM",
  "DELAY",
] as const;
export type KnownNodeType = (typeof NODE_TYPES)[number];

export const NODE_LABELS: Record<string, string> = {
  TRIGGER: "Trigger",
  HTTP: "HTTP Request",
  AI_PROMPT: "AI Prompt",
  CONDITION: "Condition",
  TRANSFORM: "Transform",
  DELAY: "Delay",
};

export const TRIGGER_TYPES = ["MANUAL", "SCHEDULE", "WEBHOOK", "EVENT"] as const;

/** Backend configuration may arrive as an object or as a JSON string. */
function normalizeConfig(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return {};
    try {
      const parsed: unknown = JSON.parse(trimmed);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      console.warn("Node configuration is a non-JSON string; keeping it under `raw`.", value);
      return { raw: value };
    }
  }
  if (typeof value === "object") return { ...(value as Record<string, unknown>) };
  return {};
}

function slug(type: string) {
  return `${type.toLowerCase()}_${Math.random().toString(16).slice(2, 6)}`;
}

export function makeNodeKey(type: string): string {
  return slug(type);
}

function flowIdOf(dto: WorkflowNodeDto, index: number): string {
  return dto.id ?? dto.nodeKey ?? `node-${index}`;
}

/** Backend graph DTO -> React Flow graph. Nodes are always built before edges. */
export function toFlowGraph(graph: WorkflowGraphDto | undefined): {
  nodes: FlowNode[];
  edges: FlowEdge[];
} {
  const nodeDtos = graph?.nodes ?? [];
  const edgeDtos = graph?.edges ?? [];

  const nodes: FlowNode[] = nodeDtos.map((dto, index) => {
    const id = flowIdOf(dto, index);
    const type = dto.type ?? dto.nodeType ?? "HTTP";
    const nodeKey = dto.nodeKey ?? id;
    return {
      id,
      type: "flowforge",
      position: {
        x: dto.position?.x ?? dto.positionX ?? 120 + (index % 3) * 260,
        y: dto.position?.y ?? dto.positionY ?? 80 + Math.floor(index / 3) * 160,
      },
      data: {
        label: dto.name ?? nodeKey ?? type,
        nodeKey,
        nodeType: type,
        config: normalizeConfig(dto.configuration ?? dto.config),
        connectorId: dto.connectorId ?? null,
        backendId: dto.id ?? undefined,
      },
    };
  });

  // Backend edges may reference node database IDs OR node keys; resolve both.
  const byRef = new Map<string, string>();
  nodes.forEach((node) => {
    byRef.set(node.id, node.id);
    if (node.data.nodeKey) byRef.set(node.data.nodeKey, node.id);
    if (node.data.backendId) byRef.set(node.data.backendId, node.id);
  });

  const edges: FlowEdge[] = [];
  edgeDtos.forEach((dto, index) => {
    const sourceRef = dto.sourceNodeId ?? dto.sourceNodeKey ?? dto.source;
    const targetRef = dto.targetNodeId ?? dto.targetNodeKey ?? dto.target;
    const source = sourceRef ? byRef.get(sourceRef) : undefined;
    const target = targetRef ? byRef.get(targetRef) : undefined;
    if (!source || !target) {
      console.warn(
        `Skipping edge ${dto.id ?? index}: it references a node that is not in the graph.`,
        { sourceRef, targetRef },
      );
      return;
    }
    const condition = dto.condition ?? dto.label ?? null;
    edges.push({
      id: dto.id ?? `edge-${index}`,
      source,
      target,
      label: condition ?? undefined,
      animated: true,
      data: { condition },
      style: condition ? { strokeDasharray: "6 4" } : undefined,
    });
  });

  return { nodes, edges };
}

/** React Flow graph -> backend graph request. */
export function toGraphDto(nodes: FlowNode[], edges: FlowEdge[]): WorkflowGraphDto {
  const keyOf = new Map(nodes.map((node) => [node.id, node.data.nodeKey || node.id]));
  return {
    nodes: nodes.map((node) => ({
      id: node.data.backendId ?? node.id,
      nodeKey: node.data.nodeKey || node.id,
      name: node.data.label,
      type: node.data.nodeType,
      nodeType: node.data.nodeType,
      config: node.data.config,
      configuration: node.data.config,
      connectorId: node.data.connectorId ?? null,
      positionX: Math.round(node.position.x),
      positionY: Math.round(node.position.y),
    })),
    edges: edges.map((edge) => {
      const condition = (edge.data as FlowEdgeData | undefined)?.condition ?? null;
      return {
        id: edge.id,
        sourceNodeId: edge.source,
        targetNodeId: edge.target,
        sourceNodeKey: keyOf.get(edge.source) ?? edge.source,
        targetNodeKey: keyOf.get(edge.target) ?? edge.target,
        source: edge.source,
        target: edge.target,
        condition,
      };
    }),
  };
}

/** Default config scaffolding per node type (kept generic, backend owns validation). */
export function defaultConfigFor(type: string): Record<string, unknown> {
  switch (type) {
    case TRIGGER_NODE_TYPE:
      return { triggerType: "MANUAL" };
    case "HTTP":
      return { url: "", method: "GET", headers: {}, queryParams: {}, body: "" };
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

export interface GraphValidationResult {
  ok: boolean;
  message?: string;
}

/** Client-side guard so we never POST an invalid graph. */
export function validateGraph(nodes: FlowNode[], edges: FlowEdge[]): GraphValidationResult {
  const triggers = nodes.filter((node) => node.data.nodeType === TRIGGER_NODE_TYPE);
  if (triggers.length === 0) return { ok: false, message: "Workflow must contain a Trigger node." };
  if (triggers.length > 1) return { ok: false, message: "A workflow can have only one trigger." };

  const keys = new Set<string>();
  for (const node of nodes) {
    const key = node.data.nodeKey?.trim();
    if (!key) return { ok: false, message: `Node "${node.data.label}" is missing a node key.` };
    if (keys.has(key)) return { ok: false, message: `Duplicate node key "${key}".` };
    keys.add(key);
  }

  const ids = new Set(nodes.map((node) => node.id));
  for (const edge of edges) {
    if (!ids.has(edge.source) || !ids.has(edge.target)) {
      return { ok: false, message: "An edge references a node that no longer exists." };
    }
  }

  return { ok: true };
}
