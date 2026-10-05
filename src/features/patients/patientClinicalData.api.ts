import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api/client";
import type { BaseResponse } from "../../lib/api/contracts";

export type DynamicFieldType =
  | "Text" | "LongText" | "Number" | "Boolean" | "Date"
  | "Image" | "File" | "SingleSelect" | "MultiSelect";

export type DynamicFieldOption = {
  id: string;
  label: string;
  value: string;
  sortOrder: number;
};

export type PatientDynamicField = {
  fieldId: string;
  label: string;
  fieldType: DynamicFieldType;
  isRequired: boolean;
  sortOrder: number;
  textValue?: string | null;
  numberValue?: number | null;
  booleanValue?: boolean | null;
  dateValue?: string | null;
  jsonValue?: string | null;
  options: DynamicFieldOption[];
};

export type PatientDynamicSection = {
  sectionId: string;
  name: string;
  sortOrder: number;
  fields: PatientDynamicField[];
};

export type PatientDynamicProfile = {
  patientId: string;
  sections: PatientDynamicSection[];
};

export type ClinicalField = {
  id: string;
  name: string;
  fieldType: DynamicFieldType;
  unit?: string | null;
  sortOrder: number;
  options: DynamicFieldOption[];
};

export type ClinicalMeasurement = {
  id: string;
  clinicalFieldId: string;
  fieldName: string;
  unit?: string | null;
  textValue?: string | null;
  numberValue?: number | null;
  booleanValue?: boolean | null;
  dateValue?: string | null;
  jsonValue?: string | null;
  recordedAtUtc: string;
};

export type PatientMeasurements = {
  patientId: string;
  fields: ClinicalField[];
  measurements: ClinicalMeasurement[];
};

export function usePatientDynamicProfile(patientId: string) {
  return useQuery({
    queryKey: ["patient-dynamic-profile", patientId],
    enabled: Boolean(patientId),
    queryFn: async () => {
      const response = await api.post<BaseResponse<PatientDynamicProfile>>(
        "/patient-clinical-data/dynamic-profile/details",
        { patientId }
      );
      if (!response.data.status || !response.data.data) throw new Error("Unable to load dynamic profile.");
      return response.data.data;
    }
  });
}

export function useSaveDynamicValue(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await api.put<BaseResponse<unknown>>(
        "/patient-clinical-data/dynamic-profile/value",
        { patientId, ...payload }
      );
      if (!response.data.status) throw new Error(response.data.message || "Unable to save profile value.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patient-dynamic-profile", patientId] })
  });
}

export function usePatientMeasurements(patientId: string) {
  return useQuery({
    queryKey: ["patient-measurements", patientId],
    enabled: Boolean(patientId),
    queryFn: async () => {
      const response = await api.post<BaseResponse<PatientMeasurements>>(
        "/patient-clinical-data/measurements/details",
        { patientId }
      );
      if (!response.data.status || !response.data.data) throw new Error("Unable to load measurements.");
      return response.data.data;
    }
  });
}

export function useAddMeasurement(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await api.post<BaseResponse<ClinicalMeasurement>>(
        "/patient-clinical-data/measurements",
        { patientId, ...payload }
      );
      if (!response.data.status || !response.data.data) throw new Error("Unable to add measurement.");
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patient-measurements", patientId] })
  });
}
