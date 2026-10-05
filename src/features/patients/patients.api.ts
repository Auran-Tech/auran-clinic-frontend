import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api/client";
import type { BaseResponse, PaginatedResponse } from "../../lib/api/contracts";

export type PatientSummary = {
  id: string;
  patientNumber: string;
  fullName: string;
  phone: string;
  gender?: string | null;
  dateOfBirth?: string | null;
};

export type PatientListRequest = {
  search?: string;
  page: number;
  pageSize: number;
};

export type CreatePatientRequest = {
  fullName: string;
  phone: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  notes?: string | null;
};

export type PatientDuplicateCandidate = {
  id: string;
  patientNumber: string;
  fullName: string;
  phone: string;
  dateOfBirth?: string | null;
  matchReasons: string[];
};

export type PatientDuplicateCheckResponse = {
  hasPotentialDuplicates: boolean;
  candidates: PatientDuplicateCandidate[];
};

export function usePatients(request: PatientListRequest) {
  return useQuery({
    queryKey: ["patients", request],
    queryFn: async () => {
      const response = await api.get<BaseResponse<PaginatedResponse<PatientSummary>>>("/patients", { params: request });
      if (!response.data.status || !response.data.data) {
        throw new Error(response.data.message || "Unable to load patients.");
      }
      return response.data.data;
    }
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreatePatientRequest) => {
      const duplicateResponse = await api.post<BaseResponse<PatientDuplicateCheckResponse>>(
        "/patients/duplicates",
        request
      );

      if (duplicateResponse.data.data?.hasPotentialDuplicates) {
        const error = new Error("Potential duplicate patient found.");
        Object.assign(error, { duplicates: duplicateResponse.data.data.candidates });
        throw error;
      }

      const response = await api.post<BaseResponse<PatientSummary>>("/patients", request);
      if (!response.data.status || !response.data.data) {
        throw new Error(response.data.message || "Unable to create patient.");
      }
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patients"] })
  });
}
