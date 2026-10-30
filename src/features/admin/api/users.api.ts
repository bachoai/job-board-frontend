import { api } from "../../../lib/api";
import type { User } from "../../employer/types";
export const usersApi = {
  users: (signal?: AbortSignal) => api<User[]>("/users", { signal }),
  lockUser: (id: number) => api<User>(`/users/lock/${id}`, { method: "PATCH" }),
  deleteUser: (id: number) => api(`/users/${id}`, { method: "DELETE" }),
};
