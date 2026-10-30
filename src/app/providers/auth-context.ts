import { createContext } from "react";
import type { Session } from "../../lib/api";
export interface AuthContextValue {
  session: Session | null;
  error: string;
  busy: boolean;
  submittingJob: boolean;
  setSubmittingJob: (busy: boolean) => void;
  login: (email: string, password: string) => Promise<Session>;
  logout: () => Promise<void>;
}
export const AuthContext = createContext<AuthContextValue | null>(null);
