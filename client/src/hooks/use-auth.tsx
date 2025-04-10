import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

// Create a default context value with empty functions to avoid null checks
const defaultContextValue: AuthContextType = {
  user: null,
  isLoading: false,
  error: null,
  loginMutation: {
    mutate: () => {},
    mutateAsync: async () => ({ id: 0, username: '', fullName: '', role: '', password: '', createdAt: new Date() }),
    isPending: false,
    isSuccess: false,
    isError: false,
    failureCount: 0,
    failureReason: null,
    error: null,
    data: undefined,
    variables: undefined,
    status: 'idle',
    submittedAt: 0,
    reset: () => {},
  } as any,
  logoutMutation: {
    mutate: () => {},
    mutateAsync: async () => {},
    isPending: false,
    isSuccess: false,
    isError: false,
    failureCount: 0, 
    failureReason: null,
    error: null,
    data: undefined,
    variables: undefined,
    status: 'idle',
    submittedAt: 0,
    reset: () => {},
  } as any,
  registerMutation: {
    mutate: () => {},
    mutateAsync: async () => ({ id: 0, username: '', fullName: '', role: '', password: '', createdAt: new Date() }),
    isPending: false,
    isSuccess: false,
    isError: false,
    failureCount: 0,
    failureReason: null,
    error: null,
    data: undefined,
    variables: undefined,
    status: 'idle',
    submittedAt: 0,
    reset: () => {},
  } as any,
};

export const AuthContext = createContext<AuthContextType>(defaultContextValue);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Use query to fetch the current user
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Connexion réussie",
        description: `Bienvenue, ${user.fullName}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Échec de connexion",
        description: error.message || "Nom d'utilisateur ou mot de passe incorrect",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Inscription réussie",
        description: `Bienvenue, ${user.fullName}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Échec d'inscription",
        description: error.message || "Une erreur s'est produite lors de l'inscription",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Échec de déconnexion",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
