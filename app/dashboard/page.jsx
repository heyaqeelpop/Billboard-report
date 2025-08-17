"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { reportsAPI } from "../../lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); // ✨ Success popup state
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
  });
  const [newReport, setNewReport] = useState({
    location: { address: "" },
    billboardDetails: { size: "", type: "", content: "" },
    dateObserved: "",
    imageFile: null,
  });

  // ✅ Drag and drop setup for image upload
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setNewReport((prev) => ({ ...prev, imageFile: file }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
    },
    multiple: false,
    maxSize: 5 * 1024 * 1024, // 5MB limit
  });

  const loadReports = useCallback(async () => {
    try {
      const response = await reportsAPI.getReports();
      const fetchedReports = response.data.reports || [];
      setReports(fetchedReports);
      setStats({
        total: fetchedReports.length,
        pending: fetchedReports.filter((r) => r.status === "pending").length,
        verified: fetchedReports.filter((r) => r.status === "verified").length,
        rejected: fetchedReports.filter((r) => r.status === "rejected").length,
      });
    } catch (error) {
      console.error("Failed to load reports:", error);
      if (error.response?.status === 401) {
        router.push("/auth");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      router.push("/auth");
      return;
    }

    const userData = JSON.parse(currentUser);
    setUser(userData);
    loadReports();
  }, [loadReports, router]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      await reportsAPI.deleteReport(id);
      setReports((reports) => reports.filter((r) => r._id !== id));
      setStats((prev) => ({
        ...prev,
        total: prev.total - 1,
        pending: prev.pending - 1,
      }));
      // ✨ Show success popup for deletion
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } catch (error) {
      alert("Failed to delete. Only pending reports can be deleted by you.");
    }
  };

  // ✅ Updated validation: Image REQUIRED, Description OPTIONAL
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitLoading) return;

    // Validation
    if (!newReport.location.address) {
      alert("Please enter the location/address");
      return;
    }

    if (user.role === "public" && !newReport.imageFile) {
      alert("Please upload an image file (JPG or PNG)");
      return;
    }

    setSubmitLoading(true);

    try {
      const authToken = localStorage.getItem("authToken");

      if (!authToken) {
        alert("Please login again");
        router.push("/auth");
        return;
      }

      const formData = new FormData();
      formData.append("location", JSON.stringify(newReport.location));
      formData.append(
        "billboardDetails",
        JSON.stringify(newReport.billboardDetails)
      );
      formData.append(
        "dateObserved",
        newReport.dateObserved || new Date().toISOString()
      );

      if (newReport.imageFile) {
        formData.append("image", newReport.imageFile);
      }

      console.log("📤 Submitting report...");

      const response = await fetch("http://localhost:5001/api/reports", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      console.log("📥 Response received:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      console.log("✅ Report created:", data);

      // Update state
      if (data.report) {
        setReports((prevReports) => [data.report, ...prevReports]);
        setStats((prev) => ({
          ...prev,
          total: prev.total + 1,
          pending: prev.pending + 1,
        }));
      }

      // Reset form
      setNewReport({
        location: { address: "" },
        billboardDetails: { size: "", type: "", content: "" },
        dateObserved: "",
        imageFile: null,
      });
      setShowForm(false);

      // ✨ Show interactive success popup
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      console.log("✅ Form reset complete");
    } catch (error) {
      console.error("❌ Submit failed:", error);

      if (error.message === "Failed to fetch") {
        alert(
          "❌ Cannot connect to server. Please check if the backend is running."
        );
      } else {
        alert(`❌ Submit failed: ${error.message}`);
      }
    } finally {
      console.log("🔄 Resetting loading state...");
      setSubmitLoading(false);
    }
  };

  const updateReportStatus = async (id, newStatus) => {
    if (user?.role !== "organization") return;

    try {
      await reportsAPI.updateReport(id, {
        status: newStatus,
        verificationNotes: `Status changed to ${newStatus}`,
      });

      setReports((prevReports) =>
        prevReports.map((report) =>
          report._id === id ? { ...report, status: newStatus } : report
        )
      );

      await loadReports();
    } catch (error) {
      console.error("Failed to update report:", error);
      alert("Failed to update report status");
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    router.push("/auth");
  };

  const removeImage = () => {
    setNewReport((prev) => ({ ...prev, imageFile: null }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">Please log in...</div>
      </div>
    );
  }

  const getStatusStyle = (status) => {
    const styles = {
      pending: "bg-yellow-200 text-yellow-800",
      verified: "bg-green-200 text-green-800",
      rejected: "bg-red-200 text-red-800",
    };
    return styles[status] || "bg-gray-200 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* ✨ Interactive Success Popup */}
        {showSuccess && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 animate-pulse">
            <div className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 text-white font-semibold px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 transition-all duration-700 animate-bounce border-2 border-white">
              <div className="relative">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="11"
                    className="stroke-white"
                    strokeWidth="2"
                    fill="#34D399"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M9 12l2 2 4-4"
                    className="stroke-white"
                  />
                </svg>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
              </div>
              <div>
                <div className="text-lg font-bold">🎉 Success!</div>
                <div className="text-sm opacity-90">
                  Report submitted successfully
                </div>
                <div className="text-xs opacity-75 mt-1">
                  Government will review it soon ✨
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              📊 Billboard Reports System
            </h1>
            <p className="text-gray-600">
              Welcome, <strong>{user.name}</strong> (
              {user.role === "public"
                ? "👤 Public User"
                : "🏢 Government Official"}
              )
            </p>
          </div>

          <div className="flex gap-4">
            {user.role === "public" && (
              <button
                onClick={() => setShowForm(!showForm)}
                disabled={submitLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg shadow-lg transition duration-200"
              >
                {showForm ? "Cancel" : "📢 Report Billboard"}
              </button>
            )}
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700">Total</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.pending}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700">Verified</h3>
            <p className="text-3xl font-bold text-green-600">
              {stats.verified}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700">Rejected</h3>
            <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </div>

        {/* Form for Public Users */}
        {user.role === "public" && showForm && (
          <div className="bg-white shadow-xl rounded-lg p-6 mb-8 border-l-4 border-blue-500">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              🎯 Report Billboard Violation
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📍 Location/Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newReport.location.address}
                    onChange={(e) =>
                      setNewReport({
                        ...newReport,
                        location: { address: e.target.value },
                      })
                    }
                    placeholder="Enter full address"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    required
                    disabled={submitLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📏 Billboard Size <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newReport.billboardDetails.size}
                    onChange={(e) =>
                      setNewReport({
                        ...newReport,
                        billboardDetails: {
                          ...newReport.billboardDetails,
                          size: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    required
                    disabled={submitLoading}
                  >
                    <option value="">Select size</option>
                    <option value="Small">Small (up to 6x4 ft)</option>
                    <option value="Medium">Medium (6x4 to 12x8 ft)</option>
                    <option value="Large">Large (12x8 to 20x12 ft)</option>
                    <option value="Extra Large">
                      Extra Large (above 20x12 ft)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏷️ Billboard Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newReport.billboardDetails.type}
                    onChange={(e) =>
                      setNewReport({
                        ...newReport,
                        billboardDetails: {
                          ...newReport.billboardDetails,
                          type: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    required
                    disabled={submitLoading}
                  >
                    <option value="">Select type</option>
                    <option value="Commercial">Commercial Advertisement</option>
                    <option value="Political">Political Campaign</option>
                    <option value="Event">Event Promotion</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📅 When did you observe this?{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={newReport.dateObserved}
                    onChange={(e) =>
                      setNewReport({
                        ...newReport,
                        dateObserved: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    required
                    disabled={submitLoading}
                  />
                </div>
              </div>

              {/* Billboard Description - NOW OPTIONAL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Billboard Description (Optional)
                </label>
                <textarea
                  value={newReport.billboardDetails.content}
                  onChange={(e) =>
                    setNewReport({
                      ...newReport,
                      billboardDetails: {
                        ...newReport.billboardDetails,
                        content: e.target.value,
                      },
                    })
                  }
                  placeholder="Describe the billboard and any violations (optional)"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  disabled={submitLoading}
                />
              </div>

              {/* Image Upload - NOW REQUIRED */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📸 Billboard Image{" "}
                  <span className="text-red-500">* Required</span>
                </label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                  } ${submitLoading ? "pointer-events-none opacity-50" : ""}`}
                >
                  <input {...getInputProps()} disabled={submitLoading} />

                  {newReport.imageFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center text-green-600">
                        <svg
                          className="w-8 h-8 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="font-medium">Image selected:</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {newReport.imageFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(newReport.imageFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                        disabled={submitLoading}
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center text-gray-400">
                        <svg
                          className="w-10 h-10 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <div className="text-gray-600">
                        <p className="text-lg font-medium text-red-600">
                          {isDragActive
                            ? "Drop the image here..."
                            : "⚠️ Image Required - Drag & drop here"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          or click to select • JPG, PNG • Max 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className={`px-8 py-3 rounded-lg shadow-lg transition duration-200 flex items-center gap-2 ${
                    submitLoading
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {submitLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    "✅ Submit Report"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={submitLoading}
                  className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg shadow-lg transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reports Table */}
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white">
              📋 {user.role === "public" ? "My Reports" : "All Reports"}
            </h2>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {user.role === "public"
                  ? "No reports submitted yet."
                  : "No reports found."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Image</th>
                    {user.role === "organization" && (
                      <th className="px-4 py-3">Reporter</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{report.location?.address}</td>
                      <td className="px-4 py-3">
                        {report.billboardDetails?.type}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(report.dateReported).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {user.role === "organization" ? (
                          <select
                            value={report.status}
                            onChange={(e) =>
                              updateReportStatus(report._id, e.target.value)
                            }
                            className={`px-2 py-1 rounded text-xs font-medium border-none ${getStatusStyle(
                              report.status
                            )}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusStyle(
                              report.status
                            )}`}
                          >
                            {report.status.toUpperCase()}
                          </span>
                        )}
                      </td>
                      {/* Different image display for government vs public */}
                      <td className="px-4 py-3">
                        {report.imageUrl ? (
                          <img
                            src={report.imageUrl} // ✅ Direct Cloudinary URL - no localhost needed!
                            alt="Billboard"
                            className="w-12 h-12 object-cover rounded cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => {
                              // ✅ Open Cloudinary image in new tab - works for everyone!
                              window.open(report.imageUrl, "_blank");
                            }}
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">
                            No image
                          </span>
                        )}
                      </td>
                      {user.role === "organization" && (
                        <td className="px-4 py-3">
                          {report.reporterId?.name || "Unknown"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
