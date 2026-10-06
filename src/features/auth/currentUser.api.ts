import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api/client";
import type { BaseResponse } from "../../lib/api/contracts";
import type { CurrentUser } from "./authSession";

export function useCurrentUserState(enabled: boolean) {
  return useQuery({
    queryKey: ["auth-current-user"],
    enabled,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const response = await api.get<BaseResponse<CurrentUser>>("/auth/current");
      if (!response.data.status || !response.data.data) {
        throw new Error("Unable to load the current user.");
      }
      return response.data.data;
    }
  });
}
