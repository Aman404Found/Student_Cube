import { createContext, useCallback, useContext, useEffect, useState, useMemo } from "react";
import type { ReactNode } from "react"; 
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import api from "../utils/api";

interface User {
  id?: string;
  _id?: string;
  username?: string;
  name: string;
  email: string;
  mobileNumber?: string;
  college?: string;
  collegeName?: string;
  role?: 'user' | 'ambassador' | 'admin';
  hasUsedReferCode?: boolean;
  referCodeUsed?: {
    code?: string;
    referCode?: string;
    owner?: string;
    usedAt?: string;
  };
  profilePic?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, authToken: string) => void;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });

  const queryClient = useQueryClient();

  const login = useCallback((userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    queryClient.clear();
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    if (!token) return null;

    try {
      const response = await api.get("/auth/me");
      const freshUser = response.data.user || null;

      if (freshUser) {
        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
      }

      return freshUser;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        logout();
      }

      return null;
    }
  }, [logout, token]);

  useEffect(() => {
    if (!token) return;

    const timeoutId = setTimeout(() => {
      refreshUser();
    }, 0);

    window.addEventListener("focus", refreshUser);

    return () => {
      clearTimeout(timeoutId); 
      window.removeEventListener("focus", refreshUser);
    };
  }, [refreshUser, token]);

  const value = useMemo(
    () => ({ user, token, login, logout, refreshUser }),
    [user, token, login, logout, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
