import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api/client";
import type { BaseResponse } from "../../lib/api/contracts";

export type VisitSummary = {
  id: string;
  patientId: string;
  patientNumber: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  status: "Open" | "Completed" | "Cancelled";
  documentationStatus: "NotStarted" | "Draft" | "Pending" | "Completed";
  entryAtUtc: string;
  completedAtUtc?: string | null;
  rowVersion: string;
};

export type VisitSession = {
  id: string;
  doctorId: string;
  doctorName: string;
  startedAtUtc: string;
  endedAtUtc?: string | null;
};

export type VisitDoctor = {
  id: string;
  fullName: string;
};

export type VisitDetails = {
  visit: VisitSummary;
  chiefComplaint?: string | null;
  examination?: string | null;
  diagnosis?: string | null;
  notes?: string | null;
  treatmentPlan?: string | null;
  sessions: VisitSession[];
  availableDoctors: VisitDoctor[];
};

export function useVisits() {
  return useQuery({
    queryKey: ["visits"],
    queryFn: async () => {
      const response = await api.get<BaseResponse<VisitSummary[]>>("/visits");
      if (!response.data.status || !response.data.data) throw new Error("Unable to load visits.");
      return response.data.data;
    }
  });
}

export function useVisitDetails(visitId: string) {
  return useQuery({
    queryKey: ["visit-details", visitId],
    enabled: Boolean(visitId),
    queryFn: async () => {
      const response = await api.post<BaseResponse<VisitDetails>>("/visits/details", { visitId });
      if (!response.data.status || !response.data.data) throw new Error("Unable to load visit.");
      return response.data.data;
    }
  });
}

export function useStartVisitSession(visitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (doctorId: string) => {
      const response = await api.post<BaseResponse<VisitDetails>>("/visits/sessions/start", { visitId, doctorId });
      if (!response.data.status || !response.data.data) throw new Error("Unable to start session.");
      return response.data.data;
    },
    onSuccess: data => queryClient.setQueryData(["visit-details", visitId], data)
  });
}

export function useEndVisitSession(visitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await api.put<BaseResponse<VisitDetails>>("/visits/sessions/end", { visitId, sessionId });
      if (!response.data.status || !response.data.data) throw new Error("Unable to end session.");
      return response.data.data;
    },
    onSuccess: data => queryClient.setQueryData(["visit-details", visitId], data)
  });
}

export function useSaveVisitDraft(visitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      rowVersion: string;
      chiefComplaint?: string | null;
      examination?: string | null;
      diagnosis?: string | null;
      notes?: string | null;
      treatmentPlan?: string | null;
    }) => {
      const response = await api.put<BaseResponse<VisitDetails>>("/visits/draft", { visitId, ...payload });
      if (!response.data.status || !response.data.data) throw new Error("Unable to save visit draft.");
      return response.data.data;
    },
    onSuccess: data => {
      queryClient.setQueryData(["visit-details", visitId], data);
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    }
  });
}


export function useCompleteVisit(visitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rowVersion: string) => {
      const response = await api.put<BaseResponse<VisitDetails>>("/visits/complete", { visitId, rowVersion });
      if (!response.data.status || !response.data.data) throw new Error("Unable to complete visit.");
      return response.data.data;
    },
    onSuccess: data => {
      queryClient.setQueryData(["visit-details", visitId], data);
      queryClient.invalidateQueries({ queryKey: ["visits"] });
      queryClient.invalidateQueries({ queryKey: ["queue-board"] });
    }
  });
}

export function useFinalizeVisitDocumentation(visitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rowVersion: string) => {
      const response = await api.put<BaseResponse<VisitDetails>>("/visits/documentation/finalize", { visitId, rowVersion });
      if (!response.data.status || !response.data.data) throw new Error("Unable to finalize documentation.");
      return response.data.data;
    },
    onSuccess: data => {
      queryClient.setQueryData(["visit-details", visitId], data);
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    }
  });
}
