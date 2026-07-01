"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; password: string; confirmPassword: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "ibplus_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem("ibplus_users") || "[]");
    const found = users.find((u: User & { password: string }) => u.email === email && u.password === password);

    if (!found) {
      return { success: false, error: "Email ou senha inválidos." };
    }

    const userData: User = {
      id: found.id,
      name: found.name,
      email: found.email,
      company: found.company,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    document.cookie = "ibplus_session=" + userData.id + ";path=/;max-age=86400";
    setUser(userData);
    return { success: true };
  };

  const register = async (data: { name: string; email: string; password: string; confirmPassword: string }) => {
    if (data.password !== data.confirmPassword) {
      return { success: false, error: "As senhas não coincidem." };
    }

    if (data.password.length < 6) {
      return { success: false, error: "A senha deve ter pelo menos 6 caracteres." };
    }

    const users = JSON.parse(localStorage.getItem("ibplus_users") || "[]");

    if (users.some((u: User) => u.email === data.email)) {
      return { success: false, error: "Este email já está registado." };
    }

    const newUser = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      password: data.password,
      company: "",
    };

    users.push(newUser);
    localStorage.setItem("ibplus_users", JSON.stringify(users));

    const userData: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    document.cookie = "ibplus_session=" + userData.id + ";path=/;max-age=86400";
    setUser(userData);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    document.cookie = "ibplus_session=;path=/;max-age=0";
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
