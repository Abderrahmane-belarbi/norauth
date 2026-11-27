export type UserRole = "USER" | "ADMIN" 

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  picture?: string | null;
  role: UserRole;
  emailVerified: boolean;
}

export type SessionState =
  | { status: 'authenticating'; user: null }
  | { status: 'authenticated'; user: SessionUser }
  | { status: 'unauthenticated'; user: null }
  | { status: 'error', user: null | SessionUser }

type AuthData = {
  message?: string | undefined;
  error?: string | undefined
  retryAfter?: number | undefined
}

export type VerificationEmailResult = {
  message: string;
  retryAfterSeconds?: number;
};

export type AuthStore = {
  session: SessionState;
  isLoading: boolean;
  data?: AuthData;
  register: (name: string, email: string, password: string) => Promise<string>;
  verifyEmail: (token: string) => Promise<string>;
  resendVerificationEmail: (email: string) => Promise<VerificationEmailResult>;
}
