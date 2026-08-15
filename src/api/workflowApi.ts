import { apiClient, asArray, unwrap } from "@/lib/apiClient";
import type { Workflow } from "@/types/api";

export async function listWorkflows(workspaceId: string): Promise<Workflow[]> {
  const response = await apiClient.get(`/api/v1/workspaces/${workspaceId}/workflows`);
  return asArray<Workflow>(unwrap<unknown>(response));
}

export async function getWorkflow(workspaceId: string, workflowId: string): Promise<Workflow> {
  const response = await apiClient.get(`/api/v1/workspaces/${workspaceId}/workflows/${workflowId}`);
  return unwrap<Workflow>(response);
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
}

export async function createWorkflow(
  workspaceId: string,
  payload: CreateWorkflowRequest,
): Promise<Workflow> {
  // workspaceId belongs in the URL, not the body.
  const response = await apiClient.post(`/api/v1/workspaces/${workspaceId}/workflows`, payload);
  return unwrap<Workflow>(response);
}
