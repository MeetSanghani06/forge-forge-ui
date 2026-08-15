import { useMutation, useQuery } from "@tanstack/react-query";

import {
  executeWorkflowVersion,
  getExecution,
  listExecutionsForVersion,
  type ExecuteWorkflowArgs,
} from "@/api/executionApi";
import type { WorkflowExecution } from "@/types/api";

export const TERMINAL_STATUSES = ["SUCCESS", "FAILED", "CANCELLED", "TIMED_OUT"];

export function isTerminal(status: string | undefined): boolean {
  return Boolean(status && TERMINAL_STATUSES.includes(status.toUpperCase()));
}

export function useExecution(executionId: string) {
  return useQuery<WorkflowExecution>({
    queryKey: ["execution", executionId],
    queryFn: () => getExecution(executionId),
    enabled: Boolean(executionId),
    retry: false,
    // Poll only while QUEUED / RUNNING.
    refetchInterval: (query) => (isTerminal(query.state.data?.status) ? false : 2000),
  });
}

export function useExecutions(workflowVersionId: string | undefined) {
  return useQuery<WorkflowExecution[]>({
    queryKey: ["executions", workflowVersionId],
    queryFn: () => listExecutionsForVersion(workflowVersionId as string),
    enabled: Boolean(workflowVersionId),
    retry: false,
  });
}

export function useExecuteWorkflow() {
  return useMutation({
    mutationFn: (args: ExecuteWorkflowArgs) => executeWorkflowVersion(args),
  });
}
