const Report = require("../models/Report");
const { cloudinary } = require("../middlewares/imageUpload"); // ✅ Import Cloudinary for deletions

const getReports = async (req, res) => {
  try {
    console.log("📥 Fetching reports for user:", req.user.email, req.user.role);

    let query = {};

    // Public users can only see their own reports
    if (req.user.role === "public") {
      query.reporterId = req.user._id;
    }

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

// ✅ UPDATED createReport for Cloudinary
const createReport = async (req, res) => {
  try {
    console.log("📥 Incoming report request:");
    console.log("- User:", req.user?.name, req.user?.email);
    console.log("- Form data:", req.body);
    console.log("- File uploaded:", req.file ? "YES" : "NO");

    // ✅ Parse JSON fields from FormData
    let location, billboardDetails;

    try {
      location = JSON.parse(req.body.location);
      billboardDetails = JSON.parse(req.body.billboardDetails);
    } catch (parseError) {
      console.log("❌ JSON parsing error:", parseError);
      return res.status(400).json({ error: "Invalid form data format" });
    }

    // ✅ Validate required fields
    if (!location?.address) {
      return res.status(400).json({ error: "Location address is required" });
    }

    // ✅ For public users, image is required
    if (req.user.role === "public" && !req.file) {
      return res
        .status(400)
        .json({ error: "Image is required for public reports" });
    }

    // ✅ Prepare report data
    const reportData = {
      reporterId: req.user._id,
      location,
      billboardDetails,
      dateObserved: req.body.dateObserved || new Date(),
      status: "pending",
      dateReported: new Date(),
    };

    // ✅ Add Cloudinary image data if file was uploaded
    if (req.file) {
      console.log("🌤️ Cloudinary upload successful:");
      console.log("- Public URL:", req.file.path);
      console.log("- Public ID:", req.file.filename);

      reportData.imageUrl = req.file.path; // ✅ Full Cloudinary URL
      reportData.imageFileName =
        req.file.original_filename || req.file.originalname;
      reportData.cloudinaryPublicId = req.file.filename; // ✅ Store for deletion later
    }

    console.log("💾 Saving report data:", JSON.stringify(reportData, null, 2));

    const report = new Report(reportData);
    await report.save();
    await report.populate("reporterId", "name email");

    console.log("✅ Report created successfully:", report._id);
    console.log("🌍 Image accessible globally at:", reportData.imageUrl);

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

// ✅ Updated updateReport (unchanged - works with Cloudinary URLs)
const updateReport = async (req, res) => {
  try {
    console.log(
      "📝 Updating report:",
      req.params.id,
      "by user:",
      req.user.email
    );

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

    res.json({ success: true, report });
  } catch (error) {
    console.error("❌ Update report error:", error);
    res.status(500).json({ error: "Failed to update report" });
  }
};

// ✅ UPDATED deleteReport for Cloudinary image cleanup
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

    // ✅ Check permissions
    let canDelete = false;

    if (req.user.role === "organization") {
      // Organizations can delete any pending report
      canDelete = report.status === "pending";
    } else if (req.user.role === "public") {
      // Public users can only delete their own pending reports
      canDelete =
        report.reporterId.toString() === req.user._id.toString() &&
        report.status === "pending";
    }

    if (!canDelete) {
      return res.status(403).json({
        error: "Not allowed to delete. Only pending reports can be deleted.",
      });
    }

    // ✅ Delete image from Cloudinary if it exists
    if (report.cloudinaryPublicId) {
      try {
        console.log(
          "🌤️ Deleting image from Cloudinary:",
          report.cloudinaryPublicId
        );
        const result = await cloudinary.uploader.destroy(
          report.cloudinaryPublicId
        );
        console.log("🗑️ Cloudinary deletion result:", result);
      } catch (cloudinaryError) {
        console.error(
          "⚠️ Failed to delete image from Cloudinary:",
          cloudinaryError
        );
        // Continue with report deletion even if image deletion fails
      }
    }

    // ✅ Delete the report from database
    await Report.findByIdAndDelete(req.params.id);

    console.log("✅ Report deleted successfully:", req.params.id);

    res.json({ success: true, message: "Report deleted successfully" });
  } catch (error) {
    console.error("❌ Delete report error:", error);
    res.status(500).json({ error: "Failed to delete report" });
  }
};

module.exports = { getReports, createReport, updateReport, deleteReport };
