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
}));
