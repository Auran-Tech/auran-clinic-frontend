import { useQuery } from "@tanstack/react-query";
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
