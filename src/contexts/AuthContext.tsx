import React, { createContext, useContext, useState, ReactNode } from "react";
import { User } from "@/lib/types";
import { MOCK_USERS } from "@/lib/mock-data";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (email: string, password: string, name: string, company: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, _password: string): boolean => {
    const found = MOCK_USERS.find((u) => u.email === email);
    if (found) {
      setUser(found);
      return true;
    }
    // Allow any email to login as a new user
    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      name: email.split("@")[0],
      company: "New Company",
      role: "user",
      onboardingStatus: "not_started",
      completionPercent: 0,
      currentStep: 0,
      lastActivity: new Date().toISOString(),
      documentsUploaded: [],
    };
    setUser(newUser);
    return true;
  };

  const register = (email: string, _password: string, name: string, company: string): boolean => {
    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      name,
      company,
      role: email === "admin@demo.com" ? "admin" : "user",
      onboardingStatus: "not_started",
      completionPercent: 0,
      currentStep: 0,
      lastActivity: new Date().toISOString(),
      documentsUploaded: [],
    };
    setUser(newUser);
    return true;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
