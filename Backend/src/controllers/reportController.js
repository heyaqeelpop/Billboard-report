const Report = require("../models/Report");

const getReports = async (req, res) => {
  try {
    console.log("📥 Fetching reports for user:", req.user.email, req.user.role);

    let query = {};

    // Public users can only see their own reports
    if (req.user.role === "public") {
      query.reporterId = req.user._id;
    }
    // Organization users can see all reports

    const reports = await Report.find(query)
      .populate("reporterId", "name email _id")
      .populate("verifiedBy", "name _id")
      .sort({ dateReported: -1 });

    console.log(`📋 Retrieved ${reports.length} reports`);

    res.json({ success: true, reports });
  } catch (error) {
    console.error("❌ Fetch reports error:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

const createReport = async (req, res) => {
  try {
    console.log("📥 Incoming report request:");
    console.log("- User:", req.user?.name, req.user?.email);
    console.log("- Request body:", JSON.stringify(req.body, null, 2));

    const { location, billboardDetails, dateObserved } = req.body;

    // Validate input
    if (!location?.address) {
      console.log("❌ Missing location address");
      return res.status(400).json({ error: "Location address is required" });
    }

    if (!billboardDetails?.content) {
      console.log("❌ Missing billboard content");
      return res.status(400).json({ error: "Billboard content is required" });
    }

    const reportData = {
      reporterId: req.user._id,
      location,
      billboardDetails,
      dateObserved: dateObserved || new Date(),
    };

    console.log("💾 Saving report data:", JSON.stringify(reportData, null, 2));

    const report = new Report(reportData);
    await report.save();
    await report.populate("reporterId", "name email");

    console.log("✅ Report created successfully:", report._id);

    res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      report,
    });
  } catch (error) {
    console.error("❌ Create report error details:");
    console.error("- Error message:", error.message);
    console.error("- Error stack:", error.stack);

    res.status(500).json({
      error: "Failed to create report",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ✅ FIXED: Update status but DON'T delete reports
const updateReport = async (req, res) => {
  try {
    console.log(
      "📝 Updating report:",
      req.params.id,
      "by user:",
      req.user.email
    );

    // Only organization users can update reports
    if (req.user.role !== "organization") {
      return res.status(403).json({
        error: "Access denied. Only organizations can update reports.",
      });
    }

    const { status, verificationNotes } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status,
        verificationNotes: verificationNotes || `Status changed to ${status}`,
        verifiedBy: req.user._id,
      },
      { new: true }
    )
      .populate("reporterId", "name email")
      .populate("verifiedBy", "name");

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    console.log("✅ Report updated successfully. New status:", status);

    // ✅ FIXED: Just return the updated report - NO DELETION
    res.json({ success: true, report });

    // ✅ REMOVED: cleanVerifiedRejected() call - reports stay in database
  } catch (error) {
    console.error("❌ Update report error:", error);
    res.status(500).json({ error: "Failed to update report" });
  }
};

// DELETE /api/reports/:id - Only for pending reports by original user
const deleteReport = async (req, res) => {
  try {
    console.log(
      "🗑️ Delete request for report:",
      req.params.id,
      "by user:",
      req.user.email
    );

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Allow only the original reporter to delete, and only pending reports
    if (
      report.reporterId.toString() !== req.user._id.toString() ||
      report.status !== "pending"
    ) {
      return res.status(403).json({
        error:
          "Not allowed to delete. Only pending reports by the original reporter can be deleted.",
      });
    }

    await Report.findByIdAndDelete(req.params.id);

    console.log("✅ Report deleted successfully:", req.params.id);

    res.json({ success: true, message: "Report deleted successfully" });
  } catch (error) {
    console.error("❌ Delete report error:", error);
    res.status(500).json({ error: "Failed to delete report" });
  }
};

// ✅ REMOVED: cleanVerifiedRejected function - we don't want to auto-delete reports

module.exports = { getReports, createReport, updateReport, deleteReport };
