import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api/client";
import type { BaseResponse } from "../../lib/api/contracts";

export type DashboardQueueItem={
  patientNumber:string;
  patientName:string;
  statusName:string;
  statusColor:string;
  doctorName?:string|null;
  entryAtUtc:string;
};

export type DashboardFollowUp={
  patientNumber:string;
  patientName:string;
  recommendation:string;
  recommendedDate?:string|null;
  dueCategory:string;
};

export type DashboardData={
  totalPatients:number;
  newPatientsToday:number;
  activeQueueCount:number;
  openVisitsCount:number;
  pendingDocumentationCount:number;
  followUpsToday:number;
  followUpsOverdue:number;
  queue:DashboardQueueItem[];
  followUps:DashboardFollowUp[];
};

export function useDashboard(){
  return useQuery({
    queryKey:["dashboard"],
    refetchInterval:30_000,
    queryFn:async()=>{
      const r=await api.get<BaseResponse<DashboardData>>("/dashboard");
      if(!r.data.status||!r.data.data)throw new Error("Unable to load dashboard.");
      return r.data.data;
    }
  });
}
