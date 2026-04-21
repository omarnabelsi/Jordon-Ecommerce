import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
}

interface AuthState {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  clearUser: () => void;
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null })
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : noopStorage))
    }
  )
);
