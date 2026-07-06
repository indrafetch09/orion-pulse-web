import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("orionpulse_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login")
    ) {
      localStorage.removeItem("orionpulse_token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (email: string, username: string, password: string) =>
    api.post("/auth/register", { email, username, password }),
  getProfile: () => api.get("/auth/profile"),
  authorizeDevice: (deviceCode: string) =>
    api.post("/auth/device/authorize", { deviceCode }),
};

// Servers API
export const serversAPI = {
  getAll: () => api.get("/servers"),
  getOne: (id: string) => api.get(`/servers/${id}`),
  create: (data: { name: string; hostname: string }) =>
    api.post("/servers", data),
  delete: (id: string) => api.delete(`/servers/${id}`),
};

// Ports API
export const portsAPI = {
  getAll: (serverId: string) => api.get(`/servers/${serverId}/ports`),
  add: (
    serverId: string,
    data: { portNumber: number; protocol: string; label: string },
  ) => api.post(`/servers/${serverId}/ports`, data),
  remove: (id: string) => api.delete(`/ports/${id}`),
  scan: (id: string) => api.post(`/ports/${id}/scan`),
};

// Logs API
export const logsAPI = {
  getAll: (
    portId: string,
    params?: { page?: number; limit?: number; status?: string },
  ) => api.get(`/ports/${portId}/logs`, { params }),
  clear: (portId: string) => api.delete(`/ports/${portId}/logs`),
};

// AI API
export const aiAPI = {
  getSolutions: (params?: { portId?: string; page?: number; limit?: number }) =>
    api.get("/ai/solutions", { params }),
  getSolution: (id: string) => api.get(`/ai/solutions/${id}`),
};

export default api;
