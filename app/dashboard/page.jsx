"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newReport, setNewReport] = useState({
    location: { address: "" },
    billboardDetails: { size: "", type: "", content: "" },
    dateObserved: "",
  });

  // Check if user is logged in
  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      router.push("/auth");
      return;
    }

    const userData = JSON.parse(currentUser);
    setUser(userData);

    // Load reports from localStorage
    const savedReports = JSON.parse(localStorage.getItem("reports") || "[]");
    setReports(savedReports);
  }, [router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newReport.location.address || !newReport.billboardDetails.content)
      return;

    const report = {
      id: Date.now(),
      reporterId: user.id,
      reporterName: user.name,
      ...newReport,
      dateReported: new Date().toISOString(),
      status: "pending",
      verificationNotes: "",
      priority: "medium",
    };

    const updatedReports = [report, ...reports];
    setReports(updatedReports);
    localStorage.setItem("reports", JSON.stringify(updatedReports));

    setNewReport({
      location: { address: "" },
      billboardDetails: { size: "", type: "", content: "" },
      dateObserved: "",
    });
    setShowForm(false);
  };

  const updateReportStatus = (id, newStatus, notes = "") => {
    if (user.role !== "organization") return;

    const updatedReports = reports.map((report) =>
      report.id === id
        ? {
            ...report,
            status: newStatus,
            verificationNotes: notes,
            verifiedBy: user.name,
          }
        : report
    );
    setReports(updatedReports);
    localStorage.setItem("reports", JSON.stringify(updatedReports));
  };

  const logout = () => {
    localStorage.removeItem("currentUser");
    router.push("/auth");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">Loading...</div>
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

  // Filter reports based on user role
  const filteredReports =
    user.role === "public"
      ? reports.filter((report) => report.reporterId === user.id)
      : reports;

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
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-lg transition duration-200"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700">
              Total Reports
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {filteredReports.length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {filteredReports.filter((r) => r.status === "pending").length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700">Verified</h3>
            <p className="text-3xl font-bold text-green-600">
              {filteredReports.filter((r) => r.status === "verified").length}
            </p>
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
                  >
                    <option value="">Select type</option>
                    <option value="Commercial">Commercial Advertisement</option>
                    <option value="Political">Political Campaign</option>
                    <option value="Public Service">Public Service</option>
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
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg shadow-lg transition duration-200"
                >
                  ✅ Submit Report
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg shadow-lg transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reports Display */}
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white">
              📋 {user.role === "public" ? "My Reports" : "All Reports"}
            </h2>
          </div>

          {filteredReports.length === 0 ? (
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
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    {user.role === "organization" && (
                      <th className="px-4 py-3">Reporter</th>
                    )}
                    {user.role === "organization" && (
                      <th className="px-4 py-3">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{report.id}</td>
                      <td className="px-4 py-3">{report.location.address}</td>
                      <td className="px-4 py-3">
                        {report.billboardDetails.type}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(report.dateReported).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {user.role === "organization" ? (
                          <select
                            value={report.status}
                            onChange={(e) =>
                              updateReportStatus(report.id, e.target.value)
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
                        <>
                          <td className="px-4 py-3">{report.reporterName}</td>
                          <td className="px-4 py-3">
                            <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
                              View Details
                            </button>
                          </td>
                        </>
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
