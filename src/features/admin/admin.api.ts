import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api/client";
import type { BaseResponse } from "../../lib/api/contracts";

export type ClinicUser = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  isSuperUser: boolean;
  roles: string[];
};

export type RoleCatalog = {
  code: string;
  name: string;
  permissions: string[];
};

export type PermissionCatalog = {
  key: string;
  group: string;
  descriptions: Record<string,string>;
};

export function useUsers() {
  return useQuery({
    queryKey:["users"],
    queryFn:async()=>{
      const r=await api.get<BaseResponse<ClinicUser[]>>("/users");
      if(!r.data.status||!r.data.data) throw new Error("Unable to load users.");
      return r.data.data;
    }
  });
}

export function useRoles() {
  return useQuery({
    queryKey:["roles"],
    queryFn:async()=>{
      const r=await api.get<BaseResponse<RoleCatalog[]>>("/roles");
      if(!r.data.status||!r.data.data) throw new Error("Unable to load roles.");
      return r.data.data;
    }
  });
}

export function usePermissions() {
  return useQuery({
    queryKey:["permissions"],
    queryFn:async()=>{
      const r=await api.get<BaseResponse<PermissionCatalog[]>>("/permissions/list");
      if(!r.data.status||!r.data.data) throw new Error("Unable to load permissions.");
      return r.data.data;
    }
  });
}

export function useCreateUser() {
  const qc=useQueryClient();
  return useMutation({
    mutationFn:async(payload:{fullName:string;email:string;password:string;phone?:string|null;isSuperUser:boolean;roles:string[]})=>{
      const r=await api.post<BaseResponse<ClinicUser>>("/users",payload);
      if(!r.data.status||!r.data.data) throw new Error("Unable to create user.");
      return r.data.data;
    },
    onSuccess:()=>qc.invalidateQueries({queryKey:["users"]})
  });
}

export function useSetUserRoles() {
  const qc=useQueryClient();
  return useMutation({
    mutationFn:async(payload:{userId:string;roles:string[]})=>{
      const r=await api.put<BaseResponse<ClinicUser>>("/users/roles",payload);
      if(!r.data.status||!r.data.data) throw new Error("Unable to update roles.");
      return r.data.data;
    },
    onSuccess:()=>qc.invalidateQueries({queryKey:["users"]})
  });
}

export function useSetUserStatus() {
  const qc=useQueryClient();
  return useMutation({
    mutationFn:async(payload:{userId:string;isActive:boolean})=>{
      const r=await api.put<BaseResponse<unknown>>("/users/status",payload);
      if(!r.data.status) throw new Error("Unable to update user status.");
    },
    onSuccess:()=>qc.invalidateQueries({queryKey:["users"]})
  });
}
