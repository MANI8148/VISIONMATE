import React, { createContext, useState, useEffect } from "react";
import { User, AuthContextType } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api/v1";

export const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("visionMateUser");
    const storedToken = localStorage.getItem("visionMateToken");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  /** ✅ Register new user */
  const register = async (name: string, email: string, password: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");

    localStorage.setItem("visionMateUser", JSON.stringify(data.user));
    localStorage.setItem("visionMateToken", data.token);
    setUser(data.user);
    setToken(data.token);
  };

  /** ✅ Login with backend */
  const login = async (email: string, password: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    localStorage.setItem("visionMateUser", JSON.stringify(data.user));
    localStorage.setItem("visionMateToken", data.token);
    setUser(data.user);
    setToken(data.token);
  };

  /** ✅ Update profile via backend or local update */
  const updateProfile = async (name: string, email: string): Promise<void> => {
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`${API_BASE}/profile/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Profile update failed");

    localStorage.setItem("visionMateUser", JSON.stringify(data.user));
    setUser(data.user);
  };

  /** ✅ Logout */
  const logout = () => {
    localStorage.removeItem("visionMateUser");
    localStorage.removeItem("visionMateToken");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};