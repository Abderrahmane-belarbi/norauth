import { create } from "zustand";
import type { AuthStore } from "../types";
import { AuthRequestError, postAuth } from "../lib/auth-api";

const API_URL = import.meta.env.VITE_API_URL;
// Share only in-flight requests: React Strict Mode must not consume a token twice.
const verificationRequests = new Map<string, Promise<string>>();
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
      const errMessage =
        error instanceof Error ? error.message : "Error Register";
      throw new Error(errMessage);
    } finally {
      set({ isLoading: false });
    }
  },
  verifyEmail: (token: string) => {
    const pendingRequest = verificationRequests.get(token);
    if (pendingRequest) return pendingRequest;

    set({ isLoading: true, data: undefined });
    const request = postAuth(
      "verify-email",
      { token },
      "Could not verify your email. Please try again.",
    )
      .then(({ message }) => {
        set({ data: { message } });
        return message;
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Could not verify your email.";
        set({ data: { error: message } });
        throw error;
      })
      .finally(() => {
        verificationRequests.delete(token);
        set({ isLoading: false });
      });

    verificationRequests.set(token, request);
    return request;
  },
  resendVerificationEmail: async (email: string) => {
    set({ isLoading: true, data: undefined });
    try {
      const result = await postAuth(
        "resend-verification-email",
        { email: email.trim() },
        "Resend verification email failed. Please try again.",
      );
      set({ data: { message: result.message, retryAfter: result.retryAfterSeconds } });
      return result;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Resend verification email failed";
      set({
        data: {
          error: message,
          retryAfter:
            error instanceof AuthRequestError ? error.retryAfterSeconds : undefined,
        },
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
