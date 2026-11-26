import { create } from "zustand";
import type { AuthStore } from "../types";
const API_URL = import.meta.env.VITE_API_URL;
export const useAuth = create<AuthStore>((set) => ({
  session: { status: "authenticating", user: null },
  isLoading: false,
  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? "Registration failed");
      }
      return data.message;
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : "Error Register"
      throw new Error(errMessage)
    } finally {
      set({ isLoading: false });
    }
  },
  verifyEmail: async (token?: string, email?: string) => {
    if(email && !token) {
      set({ isLoading: true })
      try {
      
      } catch (error) {
        
      } finally {

      }
    }
  },
  resendVerificationEmail: async (email: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/auth/resend-verification-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? "Resend verification email failed");
      }
      return data.message;
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : "Resend verification email failed"
      throw new Error(errMessage)
    } finally {
      set({ isLoading: false });
    }
  },
}));
