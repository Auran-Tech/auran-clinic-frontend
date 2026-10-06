import { useSyncExternalStore } from "react";
import axios from "axios";
import type { BaseResponse } from "../../lib/api/contracts";

export type CurrentUser = {
  userId: string;
  clinicId: string;
  fullName: string;
  email?: string | null;
  isSuperUser: boolean;
  roles: string[];
  permissions: string[];
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresDate: string;
  user: CurrentUser;
};

const key = "auran.clinic.session";
const listeners = new Set<() => void>();

function read(): AuthResponse | null {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) as AuthResponse : null;
  } catch {
    return null;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const authSession = {
  get: read,
  set(value: AuthResponse | null) {
    if (value) sessionStorage.setItem(key, JSON.stringify(value));
    else sessionStorage.removeItem(key);
    emit();
  },
  subscribe,
  hasPermission(permission: string) {
    const session = read();
    return Boolean(session?.user.isSuperUser || session?.user.permissions.includes(permission));
  },
  async refreshAccessToken(): Promise<string | null> {
    const current = read();
    if (!current?.refreshToken) {
      authSession.set(null);
      return null;
    }

    try {
      const response = await axios.post<BaseResponse<AuthResponse>>(
        `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api"}/auth/refresh`,
        { refreshToken: current.refreshToken }
      );
      if (!response.data.status || !response.data.data) {
        authSession.set(null);
        return null;
      }
      authSession.set(response.data.data);
      return response.data.data.accessToken;
    } catch {
      authSession.set(null);
      return null;
    }
  }
};

export function useAuthSession() {
  return useSyncExternalStore(authSession.subscribe, authSession.get, () => null);
}
