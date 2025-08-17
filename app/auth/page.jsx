"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "../../lib/api";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "public",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ CRITICAL: Set loading state first
    setLoading(true);
    setError("");

    try {
      console.log("🔄 Attempting authentication...");

      let response;
      if (isLogin) {
        response = await authAPI.login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        response = await authAPI.register(formData);
      }

      console.log("✅ Auth response received:", response.status);

      // ✅ Check if we have valid response data
      if (response.data && response.data.token && response.data.user) {
        const { token, user } = response.data;

        // Store auth data
        localStorage.setItem("authToken", token);
        localStorage.setItem("currentUser", JSON.stringify(user));

        console.log("✅ Auth data stored, redirecting...");

        // ✅ Redirect immediately after successful auth
        router.push("/dashboard");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Auth failed:", error);

      const errorMessage =
        error.response?.data?.error || error.message || "Authentication failed";
      setError(errorMessage);
    } finally {
      // ✅ CRITICAL: Always reset loading state
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📊 Billboard Reports
          </h1>
          <p className="text-gray-600">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Enter your full name"
                required={!isLogin}
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required={!isLogin}
                disabled={loading}
              >
                <option value="public">👤 Public User</option>
                <option value="organization">🏢 Government Official</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition duration-200 flex items-center justify-center gap-2 ${
              loading
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {isLogin ? "Signing In..." : "Creating Account..."}
              </>
            ) : (
              <>{isLogin ? "🔓 Sign In" : "✨ Create Account"}</>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setFormData({
                name: "",
                email: "",
                password: "",
                role: "public",
              });
            }}
            className="text-blue-600 hover:text-blue-800 font-medium transition duration-200"
            disabled={loading}
          >
            {isLogin
              ? "Don't have an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
