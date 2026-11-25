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

export type AuthStore = {
  session: SessionState,
  isLoading: boolean,
  register: (name: string, email: string, password: string) => Promise<string>
}