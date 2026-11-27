import type { VerificationEmailResult } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

export class AuthRequestError extends Error {
  readonly status: number;
  readonly retryAfterSeconds: number | undefined;

  constructor(message: string, status: number, retryAfterSeconds?: number) {
    super(message);
    this.name = "AuthRequestError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function postAuth(
  path: string,
  body: Record<string, string>,
  fallbackMessage: string,
): Promise<VerificationEmailResult> {
  const response = await fetch(`${API_URL}/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const bodyData: unknown = await response.json().catch(() => null);
  const data =
    typeof bodyData === "object" && bodyData !== null
      ? (bodyData as Record<string, unknown>)
      : {};
  const message =
    typeof data.message === "string" && data.message.trim()
      ? data.message
      : fallbackMessage;
  const retryAfterSeconds =
    typeof data.retryAfterSeconds === "number" &&
    Number.isFinite(data.retryAfterSeconds) &&
    data.retryAfterSeconds >= 0
      ? Math.ceil(data.retryAfterSeconds)
      : undefined;

  if (!response.ok || typeof data.message !== "string") {
    throw new AuthRequestError(message, response.status, retryAfterSeconds);
  }

  return { message, retryAfterSeconds };
}
