import { createContext, useContext, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserProfile } from "@smoke-tracker/shared";
import { api, ApiError } from "./api";
import { queryKeys } from "./queryKeys";

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { email: string; password: string; displayName?: string; timezone?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const session = useQuery({
    queryKey: queryKeys.me,
    queryFn: api.me,
    retry: false,
  });
  const loginMutation = useMutation({
    mutationFn: api.login,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.me, data);
    },
  });
  const registerMutation = useMutation({
    mutationFn: api.register,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.me, data);
    },
  });
  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSettled: () => {
      queryClient.clear();
    },
  });
  const authError = session.error instanceof ApiError && session.error.status === 401 ? null : session.error;

  return (
    <AuthContext.Provider
      value={{
        user: session.data?.user ?? null,
        isLoading: session.isLoading,
        error: authError,
        login: async (input) => {
          await loginMutation.mutateAsync(input);
        },
        register: async (input) => {
          await registerMutation.mutateAsync(input);
        },
        logout: async () => {
          await logoutMutation.mutateAsync();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}
