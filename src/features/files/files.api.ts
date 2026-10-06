import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api/client";
import type { BaseResponse } from "../../lib/api/contracts";

export type FileAttachment={
  fileId:string;
  originalName:string;
  contentType:string;
  size:number;
  uploadedAtUtc:string;
  category?:string|null;
  notes?:string|null;
};

export function usePatientFiles(patientId:string){
  return useQuery({
    queryKey:["patient-files",patientId],
    enabled:Boolean(patientId),
    queryFn:async()=>{
      const r=await api.post<BaseResponse<FileAttachment[]>>("/files/patient/list",{patientId});
      if(!r.data.status||!r.data.data)throw new Error("Unable to load patient files.");
      return r.data.data;
    }
  });
}

export function useUploadPatientFile(patientId:string){
  const qc=useQueryClient();
  return useMutation({
    mutationFn:async(payload:{file:File;category?:string;notes?:string})=>{
      const form=new FormData();
      form.append("patientId",patientId);
      form.append("file",payload.file);
      if(payload.category)form.append("category",payload.category);
      if(payload.notes)form.append("notes",payload.notes);
      const r=await api.post<BaseResponse<FileAttachment>>("/files/patient/upload",form,{
        headers:{"Content-Type":"multipart/form-data"}
      });
      if(!r.data.status||!r.data.data)throw new Error(r.data.message||"Unable to upload file.");
      return r.data.data;
    },
    onSuccess:()=>qc.invalidateQueries({queryKey:["patient-files",patientId]})
  });
}

export function useClinicalOrderFiles(visitId:string){
  return useQuery({
    queryKey:["clinical-order-files",visitId],
    enabled:Boolean(visitId),
    queryFn:async()=>{
      const r=await api.post<BaseResponse<FileAttachment[]>>("/files/clinical-order/list",{visitId});
      if(!r.data.status||!r.data.data)throw new Error("Unable to load clinical order files.");
      return r.data.data;
    }
  });
}

export function useUploadClinicalOrderFile(visitId:string){
  const qc=useQueryClient();
  return useMutation({
    mutationFn:async(payload:{file:File;definitionCode?:string|null})=>{
      const form=new FormData();
      form.append("visitId",visitId);
      form.append("file",payload.file);
      if(payload.definitionCode)form.append("definitionCode",payload.definitionCode);
      const r=await api.post<BaseResponse<FileAttachment>>("/files/clinical-order/upload",form,{
        headers:{"Content-Type":"multipart/form-data"}
      });
      if(!r.data.status||!r.data.data)throw new Error(r.data.message||"Unable to upload file.");
      return r.data.data;
    },
    onSuccess:()=>qc.invalidateQueries({queryKey:["clinical-order-files",visitId]})
  });
}

export async function downloadFile(file:FileAttachment){
  const r=await api.post("/files/download",{fileId:file.fileId},{responseType:"blob"});
  const href=URL.createObjectURL(r.data as Blob);
  const anchor=document.createElement("a");
  anchor.href=href;
  anchor.download=file.originalName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}
