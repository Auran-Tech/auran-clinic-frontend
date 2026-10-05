import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api/client";
import type { BaseResponse } from "../../lib/api/contracts";
import type { PatientSummary } from "./patients.api";

export type PatientAllergy = {
  id: string;
  name: string;
  reaction?: string | null;
  notes?: string | null;
  recordedAtUtc: string;
};

export type PatientCondition = {
  id: string;
  name: string;
  notes?: string | null;
  recordedAtUtc: string;
};

export type PatientMedication = {
  id: string;
  name: string;
  dosage?: string | null;
  notes?: string | null;
  recordedAtUtc: string;
};

export type PatientClinicalProfile = {
  patient: PatientSummary & {
    notes?: string | null;
    createdDate: string;
    updatedDate?: string | null;
  };
  allergies: PatientAllergy[];
  conditions: PatientCondition[];
  medications: PatientMedication[];
};

export function usePatientProfile(patientId: string) {
  return useQuery({
    queryKey: ["patient-profile", patientId],
    enabled: Boolean(patientId),
    queryFn: async () => {
      const response = await api.get<BaseResponse<PatientClinicalProfile>>("/patient-profile", {
        params: { patientId }
      });
      if (!response.data.status || !response.data.data) {
        throw new Error(response.data.message || "Unable to load patient profile.");
      }
      return response.data.data;
    }
  });
}

type ProfileItemKind = "allergies" | "conditions" | "medications";

export function useAddProfileItem(patientId: string, kind: ProfileItemKind) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, string | null>) => {
      const response = await api.post<BaseResponse<unknown>>(`/patient-profile/${kind}`, {
        patientId,
        ...payload
      });
      if (!response.data.status) throw new Error(response.data.message || "Unable to save profile item.");
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patient-profile", patientId] })
  });
}
