// ============================================================================
// EXECUTION CONTRACT — adjust endpoints/headers here only.
// ============================================================================
import { apiClient, asArray, unwrap } from "@/lib/apiClient";
import type { WorkflowExecution } from "@/types/api";

export interface ExecuteWorkflowArgs {
  workflowVersionId: string;
  input: unknown;
  /** Generated once per user-intent execution, reused across automatic retries. */
  idempotencyKey: string;
}

export async function executeWorkflowVersion({
  workflowVersionId,
  input,
  idempotencyKey,
}: ExecuteWorkflowArgs): Promise<WorkflowExecution> {
  const response = await apiClient.post(
    `/api/v1/workflows/versions/${workflowVersionId}/execute`,
    { input },
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
  return unwrap<WorkflowExecution>(response);
}

export async function getExecution(executionId: string): Promise<WorkflowExecution> {
  const response = await apiClient.get(`/api/v1/workflow-executions/${executionId}`);
  return unwrap<WorkflowExecution>(response);
}

export async function listExecutionsForVersion(
  workflowVersionId: string,
): Promise<WorkflowExecution[]> {
  const response = await apiClient.get(
    `/api/v1/workflows/versions/${workflowVersionId}/executions`,
  );
  return asArray<WorkflowExecution>(unwrap<unknown>(response));
}
