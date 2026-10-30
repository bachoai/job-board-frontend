import { createContext } from "react";
import type { Session } from "../../lib/api";
export interface AuthContextValue {
  session: Session | null;
  error: string;
  busy: boolean;
  submittingJob: boolean;
  setSubmittingJob: (busy: boolean) => void;
  login: (email: string, password: string) => Promise<Session>;
  register: (data: { email: string; password: string; confirmPassword: string; fullName: string; role: "candidate" | "employer" }) => Promise<Session>;
  logout: () => Promise<void>;
}
export const AuthContext = createContext<AuthContextValue | null>(null);
