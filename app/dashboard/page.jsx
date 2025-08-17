"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { reportsAPI } from "../../lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
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
      alert("Report deleted successfully!");
      await loadReports();
    } catch (error) {
      alert("Failed to delete. Only pending reports can be deleted by you.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitLoading) return;

    if (!newReport.location.address || !newReport.billboardDetails.content) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitLoading(true);

    try {
      const response = await reportsAPI.createReport(newReport);
      setReports((prevReports) => [response.data.report, ...prevReports]);
      setNewReport({
        location: { address: "" },
        billboardDetails: { size: "", type: "", content: "" },
        dateObserved: "",
      });
      setShowForm(false);
      alert("✅ Report submitted successfully!");
      loadReports();
    } catch (error) {
      console.error("Submit failed:", error);
      alert(error.response?.data?.error || "Failed to submit report");
    } finally {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
                    📍 Location/Address
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
                    📏 Billboard Size
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
                    🏷️ Billboard Type
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
                    📅 When did you observe this?
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Billboard Description
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
                  placeholder="Describe the billboard and any violations"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  required
                  disabled={submitLoading}
                />
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
                      {user.role === "organization" && (
                        <td className="px-4 py-3">
                          {report.reporterId?.name || "Unknown"}
                        </td>
                      )}
                      {/* ✅ FIXED: Separate conditions for organization and public */}
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
