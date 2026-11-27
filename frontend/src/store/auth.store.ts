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
    set({ isLoading: true })
    if(email && !token) {
      try {
        
      } catch (error) {
        
      } finally {
        set({ isLoading: false })
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
        if(res.status === 429) {
          // const retryAfter = Number(res.headers.get("Retry-After"));
          const retryAfter = data.retryAfterSeconds;
          console.log('res.status === 429, retryAfter:', retryAfter);
          set({ data: {retryAfter} })
        }
        set({ data: { error: data.message } });
        throw new Error(data.message ?? "Resend verification email failed");
      }
      return data.message;
    } catch (error) {
      console.log("error:", error);
      const errMessage = error instanceof Error ? error.message : "Resend verification email failed"
      throw new Error(errMessage)
    } finally {
      set({ isLoading: false });
    }
  },
}));
