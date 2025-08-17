import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

// Create axios instance with better error handling
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
});

// Enhanced request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(
      `🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`
    );
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(
      `✅ API Success: ${response.config.method?.toUpperCase()} ${
        response.config.url
      }`
    );
    return response;
  },
  (error) => {
    console.error("❌ API Error Details:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });

    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const errorMessage =
        error.response.data?.error ||
        error.response.data?.message ||
        "Server error";
      console.error(
        `❌ Server Error (${error.response.status}):`,
        errorMessage
      );
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // Request made but no response received
      console.error("❌ Network Error: No response from server");
      return Promise.reject(
        new Error(
          "Cannot connect to server. Please check if the server is running."
        )
      );
    } else {
      // Something else happened
      console.error("❌ Request Setup Error:", error.message);
      return Promise.reject(new Error(error.message));
    }
  }
);

export const authAPI = {
  register: (userData) => apiClient.post("/auth/register", userData),
  login: (credentials) => apiClient.post("/auth/login", credentials),
};

export const reportsAPI = {
  getReports: () => apiClient.get("/reports"),
  createReport: (reportData) => apiClient.post("/reports", reportData),
  updateReport: (id, data) => apiClient.put(`/reports/${id}`, data),
  deleteReport: (id) => apiClient.delete(`/reports/${id}`),
};
