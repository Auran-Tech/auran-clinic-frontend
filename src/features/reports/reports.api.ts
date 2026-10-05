import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api/client";
import type { BaseResponse } from "../../lib/api/contracts";

export type DoctorActivity={
  doctorName:string;
  visitCount:number;
  completedVisitCount:number;
  pendingDocumentationCount:number;
};

export type OperationalReport={
  fromDate:string;
  toDate:string;
  patientCount:number;
  newPatientCount:number;
  visitCount:number;
  openVisitCount:number;
  completedVisitCount:number;
  activeQueueCount:number;
  pendingDocumentationCount:number;
  followUpsToday:number;
  followUpsOverdue:number;
  doctorActivity:DoctorActivity[];
};

export function useOperationalReport(fromDate:string,toDate:string){
  return useQuery({
    queryKey:["operational-report",fromDate,toDate],
    queryFn:async()=>{
      const r=await api.get<BaseResponse<OperationalReport>>("/reports/operational",{params:{fromDate:fromDate||undefined,toDate:toDate||undefined}});
      if(!r.data.status||!r.data.data)throw new Error("Unable to load report.");
      return r.data.data;
    }
  });
}
