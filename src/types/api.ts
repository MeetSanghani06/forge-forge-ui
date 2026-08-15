// Shared backend DTO types for the FlowForge API.

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  timestamp?: string;
}

export interface ApiErrorItem {
  code?: string;
  message?: string;
  field?: string;
}

export interface ApiErrorResponse {
  success: false;
  timestamp?: string;
  errors?: ApiErrorItem[];
  message?: string;
  error?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type WorkflowStatus = string;

export interface Workflow {
  id: string;
  name: string;
  description?: string | null;
  status?: WorkflowStatus;
  workspaceId?: string;
  currentVersionId?: string | null;
  latestVersionId?: string | null;
  currentVersion?: number | null;
  version?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowVersion {
  id: string;
  workflowId?: string;
  version?: number;
  versionNumber?: number;
  status?: string;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowNodeDto {
  id?: string;
  nodeKey?: string;
  name?: string;
  type?: string;
  nodeType?: string;
  config?: Record<string, unknown> | null;
  positionX?: number | null;
  positionY?: number | null;
  position?: { x: number; y: number } | null;
}

export interface WorkflowEdgeDto {
  id?: string;
  sourceNodeId?: string;
  targetNodeId?: string;
  source?: string;
  target?: string;
  condition?: string | null;
  label?: string | null;
}

export interface WorkflowGraphDto {
  nodes?: WorkflowNodeDto[];
  edges?: WorkflowEdgeDto[];
  workflowVersionId?: string;
}

export type WorkflowExecutionStatus = "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED" | string;

export interface WorkflowExecution {
  id: string;
  executionId?: string;
  workflowId?: string;
  workflowVersionId?: string;
  version?: number;
  status: WorkflowExecutionStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  input?: unknown;
  output?: unknown;
  errorMessage?: string | null;
}
