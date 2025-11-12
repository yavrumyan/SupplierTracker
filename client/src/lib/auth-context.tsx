import { createContext, ReactNode } from "react";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  return children;
}

export function useAuth() {
  return { user: null, loading: false, logout: async () => {}, checkAuth: async () => {} };
}