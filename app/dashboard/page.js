export default function DashboardPage() {
  const reports = [
    { id: 1, location: "Main Street", status: "Pending", violation: "Size Exceeded" },
    { id: 2, location: "Highway 22", status: "Verified", violation: "No License" },
    { id: 3, location: "City Square", status: "Rejected", violation: "Obscene Content" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">📊 Billboard Reports Dashboard</h1>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="min-w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Location</th>
              <th className="px-6 py-3">Violation</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3">{report.id}</td>
                <td className="px-6 py-3">{report.location}</td>
                <td className="px-6 py-3">{report.violation}</td>
                <td className="px-6 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      report.status === "Pending"
                        ? "bg-yellow-200 text-yellow-800"
                        : report.status === "Verified"
                        ? "bg-green-200 text-green-800"
                        : "bg-red-200 text-red-800"
                    }`}
                  >
                    {report.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
