import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api/client";
import type { BaseResponse } from "../../lib/api/contracts";

export type QueueStatus = {
  id: string;
  code: string;
  name: string;
  color: string;
  sortOrder: number;
  isFinal: boolean;
};

export type QueueStaff = {
  id: string;
  fullName: string;
};

export type QueueTransition = {
  fromStatusId: string;
  toStatusId: string;
};

export type QueueEntry = {
  id: string;
  patientId: string;
  visitId: string;
  doctorId?: string | null;
  patientNumber: string;
  patientName: string;
  doctorName?: string | null;
  workflowStatusId: string;
  workflowStatusCode: string;
  workflowStatusName: string;
  workflowStatusColor: string;
  entryAtUtc: string;
  exitAtUtc?: string | null;
  rowVersion: string;
};

export type QueueBoard = {
  statuses: QueueStatus[];
  entries: QueueEntry[];
  staff: QueueStaff[];
  transitions: QueueTransition[];
};

export function useQueueBoard() {
  return useQuery({
    queryKey: ["queue-board"],
    refetchInterval: 15_000,
    queryFn: async () => {
      const response = await api.get<BaseResponse<QueueBoard>>("/queue");
      if (!response.data.status || !response.data.data) {
        throw new Error(response.data.message || "Unable to load live queue.");
      }
      return response.data.data;
    }
  });
}

export function useQueueCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { patientId: string; doctorId: string }) => {
      const response = await api.post<BaseResponse<QueueEntry>>("/queue/check-in", payload);
      if (!response.data.status || !response.data.data) {
        throw new Error(response.data.message || "Unable to check in patient.");
      }
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["queue-board"] })
  });
}

export function useMoveQueueEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      queueEntryId: string;
      toStatusId: string;
      rowVersion: string;
      notes?: string | null;
    }) => {
      const response = await api.put<BaseResponse<QueueEntry>>("/queue/move", payload);
      if (!response.data.status || !response.data.data) {
        throw new Error(response.data.message || "Unable to move queue entry.");
      }
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["queue-board"] }),
    onError: () => queryClient.invalidateQueries({ queryKey: ["queue-board"] })
  });
}
