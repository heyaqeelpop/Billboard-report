import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests automatically
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors automatically
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", response.status, response.data);
    return response;
  },
  (error) => {
    console.error("❌ API Error:", {
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
      url: error.config?.url,
    });

    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

// ✅ NAMED EXPORTS - This is what was missing!
export const authAPI = {
  register: (userData) => {
    console.log("📝 Registering user with data:", userData);
    return api.post("/auth/register", userData);
  },
  login: (credentials) => {
    console.log("🔐 Logging in user:", credentials.email);
    return api.post("/auth/login", credentials);
  },
  getProfile: () => api.get("/auth/me"),
};

export const reportsAPI = {
  getReports: () => api.get("/reports"),
  createReport: (reportData) => {
    console.log("📝 Creating report with data:", reportData);
    return api.post("/reports", reportData);
  },
  updateReport: (id, updateData) => api.put(`/reports/${id}`, updateData),
  deleteReport: (id) => api.delete(`/reports/${id}`),
};

// Default export (optional)
export default api;
