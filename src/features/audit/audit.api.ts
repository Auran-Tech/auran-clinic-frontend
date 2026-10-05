import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api/client";
import type { BaseResponse } from "../../lib/api/contracts";

export type AuditLog={
  id:string;
  actorUserId:string;
  actorName:string;
  action:string;
  entityType:string;
  entityId?:string|null;
  occurredAtUtc:string;
  metadataJson?:string|null;
  ipAddress?:string|null;
};

export function useAuditLogs(take=200){
  return useQuery({
    queryKey:["audit-logs",take],
    queryFn:async()=>{
      const r=await api.get<BaseResponse<AuditLog[]>>("/audit-logs",{params:{take}});
      if(!r.data.status||!r.data.data)throw new Error("Unable to load audit logs.");
      return r.data.data;
    }
  });
}
