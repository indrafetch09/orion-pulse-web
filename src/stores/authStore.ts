import { create } from "zustand";
import type { User } from "@/types";
import { authAPI } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  setToken: (token: string) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem("orionpulse_token"),
  isAuthenticated: !!localStorage.getItem("orionpulse_token"),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data.data;
      localStorage.setItem("orionpulse_token", token);
      connectSocket(token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        (error instanceof Error ? error.message : "Login failed");
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  register: async (email: string, username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register(email, username, password);
      const { token, user } = response.data.data;
      localStorage.setItem("orionpulse_token", token);
      connectSocket(token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        (error instanceof Error ? error.message : "Registration failed");
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("orionpulse_token");
    disconnectSocket();
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    const token = get().token;
    if (!token) return;
    set({ isLoading: true });
    try {
      const response = await authAPI.getProfile();
      connectSocket(token);
      set({
        user: response.data.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem("orionpulse_token");
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setToken: (token: string) => {
    localStorage.setItem("orionpulse_token", token);
    connectSocket(token);
    set({ token, isAuthenticated: true });
  },

  clearError: () => set({ error: null }),
}));

// Initialize socket immediately on boot if token exists
const bootToken = localStorage.getItem("orionpulse_token");
if (bootToken) {
  try {
    connectSocket(bootToken);
  } catch (err) {
    console.error("Failed to auto-connect socket on boot:", err);
  }
}
