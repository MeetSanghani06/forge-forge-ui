import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getGraph, publishVersion, saveGraph, createVersion } from "@/api/workflowVersionApi";
import type { WorkflowGraphDto } from "@/types/api";

export function useWorkflowGraph(
  workspaceId: string,
  workflowId: string,
  workflowVersionId: string | undefined,
) {
  return useQuery<WorkflowGraphDto>({
    queryKey: ["workflowGraph", workspaceId, workflowId, workflowVersionId],
    queryFn: () => getGraph(workspaceId, workflowId, workflowVersionId as string),
    // Never request /versions/undefined/graph.
    enabled: Boolean(workspaceId && workflowId && workflowVersionId),
    retry: false,
  });
}

export function useSaveGraph(
  workspaceId: string,
  workflowId: string,
  workflowVersionId: string | undefined,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (graph: WorkflowGraphDto) =>
      saveGraph(workspaceId, workflowId, workflowVersionId as string, graph),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["workflowGraph", workspaceId, workflowId, workflowVersionId],
      });
      void queryClient.invalidateQueries({ queryKey: ["workflow", workspaceId, workflowId] });
    },
  });
}

export function usePublishVersion(
  workspaceId: string,
  workflowId: string,
  workflowVersionId: string | undefined,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => publishVersion(workspaceId, workflowId, workflowVersionId as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workflow", workspaceId, workflowId] });
      void queryClient.invalidateQueries({
        queryKey: ["workflowVersions", workspaceId, workflowId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["workflowGraph", workspaceId, workflowId, workflowVersionId],
      });
    },
  });
}

export function useCreateVersion(workspaceId: string, workflowId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => createVersion(workspaceId, workflowId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["workflowVersions", workspaceId, workflowId],
      });
      void queryClient.invalidateQueries({ queryKey: ["workflow", workspaceId, workflowId] });
    },
  });
}
