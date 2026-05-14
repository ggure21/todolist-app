import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  setAuth: (token: string, userId: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  userId: null,
  setAuth: (token, userId) => set({ accessToken: token, userId }),
  clearAuth: () => set({ accessToken: null, userId: null }),
}));
