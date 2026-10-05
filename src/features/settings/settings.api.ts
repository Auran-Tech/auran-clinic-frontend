import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api/client";
import type { BaseResponse } from "../../lib/api/contracts";

export type ClinicSettings = {
  clinicName:string; clinicCode:string; logoUrl?:string|null; primaryColor?:string|null; secondaryColor?:string|null;
  fontFamily?:string|null; welcomeTitle?:string|null; welcomeMessage?:string|null; timeZoneId?:string|null;
  patientNumberPrefix?:string|null; phone?:string|null; email?:string|null; address?:string|null; website?:string|null;
  locale?:string|null; dateFormat?:string|null; timeFormat?:string|null; documentationReminderHours:number;
  prescriptionHeader?:string|null; prescriptionFooter?:string|null; welcomeButtonText?:string|null;
};

export type WorkflowStatusSetting={code:string;name:string;color:string;sortOrder:number;isFinal:boolean};
export type WorkflowTransitionSetting={fromCode:string;toCode:string};
export type WorkflowSettings={statuses:WorkflowStatusSetting[];transitions:WorkflowTransitionSetting[]};

export function useClinicSettings(){
  return useQuery({queryKey:["clinic-settings"],queryFn:async()=>{
    const r=await api.get<BaseResponse<ClinicSettings>>("/settings/clinic");
    if(!r.data.status||!r.data.data)throw new Error("Unable to load clinic settings.");
    return r.data.data;
  }});
}
export function useSaveClinicSettings(){
  const qc=useQueryClient();
  return useMutation({mutationFn:async(payload:Omit<ClinicSettings,"clinicCode">)=>{
    const r=await api.put<BaseResponse<ClinicSettings>>("/settings/clinic",payload);
    if(!r.data.status||!r.data.data)throw new Error("Unable to save clinic settings.");
    return r.data.data;
  },onSuccess:data=>qc.setQueryData(["clinic-settings"],data)});
}
export function useWorkflowSettings(){
  return useQuery({queryKey:["workflow-settings"],queryFn:async()=>{
    const r=await api.get<BaseResponse<WorkflowSettings>>("/settings/workflow");
    if(!r.data.status||!r.data.data)throw new Error("Unable to load workflow settings.");
    return r.data.data;
  }});
}
export function useSaveWorkflowSettings(){
  const qc=useQueryClient();
  return useMutation({mutationFn:async(payload:WorkflowSettings)=>{
    const r=await api.put<BaseResponse<WorkflowSettings>>("/settings/workflow",payload);
    if(!r.data.status||!r.data.data)throw new Error(r.data.message||"Unable to save workflow settings.");
    return r.data.data;
  },onSuccess:data=>{
    qc.setQueryData(["workflow-settings"],data);
    qc.invalidateQueries({queryKey:["queue-board"]});
  }});
}
