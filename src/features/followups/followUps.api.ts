import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api/client";
import type { BaseResponse } from "../../lib/api/contracts";

export type FollowUpStatus = "Open" | "Completed" | "Cancelled";

export type FollowUp = {
  id: string;
  patientId: string;
  visitId: string;
  doctorId: string;
  patientNumber: string;
  patientName: string;
  doctorName: string;
  recommendation: string;
  recommendedAfterDays?: number | null;
  recommendedDate?: string | null;
  status: FollowUpStatus;
  dueCategory: "Open" | "Today" | "Upcoming" | "Overdue" | "Completed" | "Cancelled";
  createdDate: string;
  updatedDate?: string | null;
};

export function useFollowUps(search: string, dueCategory: string) {
  return useQuery({
    queryKey: ["follow-ups", search, dueCategory],
    queryFn: async () => {
      const response = await api.get<BaseResponse<FollowUp[]>>("/follow-ups", {
        params: {
          search: search || undefined,
          dueCategory: dueCategory === "All" ? undefined : dueCategory
        }
      });
      if (!response.data.status || !response.data.data) throw new Error("Unable to load follow-ups.");
      return response.data.data;
    }
  });
}

export function useCreateFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      patientId: string;
      visitId: string;
      doctorId: string;
      recommendation: string;
      recommendedDate?: string | null;
      recommendedAfterDays?: number | null;
    }) => {
      const response = await api.post<BaseResponse<FollowUp>>("/follow-ups", payload);
      if (!response.data.status || !response.data.data) throw new Error("Unable to create follow-up.");
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["follow-ups"] })
  });
}

export function useSetFollowUpStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { followUpId: string; status: "Completed" | "Cancelled" }) => {
      const response = await api.put<BaseResponse<FollowUp>>("/follow-ups/status", payload);
      if (!response.data.status || !response.data.data) throw new Error("Unable to update follow-up.");
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["follow-ups"] })
  });
}
