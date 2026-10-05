import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api/client";
import type { BaseResponse } from "../../lib/api/contracts";

export type ClinicalOrderSectionType="Text"|"ItemList"|"AttachmentOnly";

export type ClinicalOrderDefinition={
  code:string;
  name:string;
  sectionType:ClinicalOrderSectionType;
  sortOrder:number;
  isEnabled:boolean;
};

export type ClinicalOrderItem={
  id:string;
  name:string;
  detailsJson?:string|null;
};

export type ClinicalOrderSection={
  id:string;
  definitionCode:string;
  name:string;
  sectionType:ClinicalOrderSectionType;
  sortOrder:number;
  textValue?:string|null;
  items:ClinicalOrderItem[];
};

export type ClinicalOrder={
  id:string;
  visitId:string;
  patientId:string;
  doctorId:string;
  createdDate:string;
  sections:ClinicalOrderSection[];
};

export function useClinicalOrderDefinitions(){
  return useQuery({
    queryKey:["clinical-order-definitions"],
    queryFn:async()=>{
      const r=await api.get<BaseResponse<ClinicalOrderDefinition[]>>("/clinical-orders/definitions");
      if(!r.data.status||!r.data.data)throw new Error("Unable to load clinical order definitions.");
      return r.data.data.filter(x=>x.isEnabled).sort((a,b)=>a.sortOrder-b.sortOrder);
    }
  });
}

export function useClinicalOrder(visitId:string){
  return useQuery({
    queryKey:["clinical-order",visitId],
    enabled:Boolean(visitId),
    queryFn:async()=>{
      const r=await api.post<BaseResponse<ClinicalOrder|null>>("/clinical-orders/details",{visitId});
      if(!r.data.status)throw new Error("Unable to load clinical order.");
      return r.data.data??null;
    }
  });
}

export function useSaveClinicalOrder(visitId:string){
  const qc=useQueryClient();
  return useMutation({
    mutationFn:async(payload:{sections:Array<{definitionCode:string;textValue?:string|null;items:Array<{name:string;detailsJson?:string|null}>}>})=>{
      const r=await api.put<BaseResponse<ClinicalOrder>>("/clinical-orders",{visitId,...payload});
      if(!r.data.status||!r.data.data)throw new Error("Unable to save clinical order.");
      return r.data.data;
    },
    onSuccess:data=>qc.setQueryData(["clinical-order",visitId],data)
  });
}


export function useAllClinicalOrderDefinitions(){
  return useQuery({
    queryKey:["clinical-order-definitions","all"],
    queryFn:async()=>{
      const r=await api.get<BaseResponse<ClinicalOrderDefinition[]>>("/clinical-orders/definitions");
      if(!r.data.status||!r.data.data)throw new Error("Unable to load clinical order definitions.");
      return [...r.data.data].sort((a,b)=>a.sortOrder-b.sortOrder);
    }
  });
}

export function useSaveClinicalOrderDefinitions(){
  const qc=useQueryClient();
  return useMutation({
    mutationFn:async(sections:Array<{code:string;name:string;sectionType:ClinicalOrderSectionType;sortOrder:number;isEnabled:boolean}>)=>{
      const r=await api.put<BaseResponse<ClinicalOrderDefinition[]>>("/clinical-orders/definitions",{sections});
      if(!r.data.status||!r.data.data)throw new Error(r.data.message||"Unable to save clinical order definitions.");
      return r.data.data;
    },
    onSuccess:data=>{
      qc.setQueryData(["clinical-order-definitions","all"],data);
      qc.invalidateQueries({queryKey:["clinical-order-definitions"]});
    }
  });
}
