"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "public",
  });

  // Create demo users when component loads
  useEffect(() => {
    const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");

    // Only create demo users if they don't exist
    if (existingUsers.length === 0) {
      const demoUsers = [
        {
          id: "1",
          name: "John Doe",
          email: "public@test.com",
          password: "123456",
          role: "public",
        },
        {
          id: "2",
          name: "City Planning Department",
          email: "gov@test.com",
          password: "123456",
          role: "organization",
        },
      ];

      localStorage.setItem("users", JSON.stringify(demoUsers));
      console.log("Demo users created!"); // For debugging
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLogin) {
      // Login logic
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      console.log("Available users:", users); // For debugging
      console.log("Trying to login with:", formData.email, formData.password); // For debugging

      const user = users.find(
        (u) => u.email === formData.email && u.password === formData.password
      );

      if (user) {
        localStorage.setItem("currentUser", JSON.stringify(user));
        console.log("Login successful!", user); // For debugging
        router.push("/dashboard");
      } else {
        alert(
          "Invalid credentials. Try:\nPublic: public@test.com / 123456\nGov: gov@test.com / 123456"
        );
      }
    } else {
      // Register logic
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const newUser = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));
      localStorage.setItem("currentUser", JSON.stringify(newUser));
      router.push("/dashboard");
    }
  };

  // Auto-fill demo credentials for testing
  const fillDemoCredentials = (type) => {
    if (type === "public") {
      setFormData({
        ...formData,
        email: "public@test.com",
        password: "123456",
      });
    } else {
      setFormData({
        ...formData,
        email: "gov@test.com",
        password: "123456",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          📊 Billboard Reporter
        </h1>

        <div className="flex mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-l-lg ${
              isLogin ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-r-lg ${
              !isLogin ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a:
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              >
                <option value="public">
                  👤 Public User (Report Billboards)
                </option>
                <option value="organization">
                  🏢 Government Official (Verify Reports)
                </option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition duration-200"
          >
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        {/* Demo Account Buttons */}
        {isLogin && (
          <div className="mt-6">
            <p className="text-center text-sm text-gray-600 mb-3">
              Quick Demo Login:
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fillDemoCredentials("public")}
                className="flex-1 bg-green-100 text-green-800 py-2 px-3 rounded text-xs hover:bg-green-200 transition duration-200"
              >
                👤 Public User
              </button>
              <button
                onClick={() => fillDemoCredentials("gov")}
                className="flex-1 bg-purple-100 text-purple-800 py-2 px-3 rounded text-xs hover:bg-purple-200 transition duration-200"
              >
                🏢 Government
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Demo Credentials:</p>
          <p>📧 public@test.com / 🔑 123456 (Public)</p>
          <p>📧 gov@test.com / 🔑 123456 (Government)</p>
        </div>
      </div>
    </div>
  );
}
