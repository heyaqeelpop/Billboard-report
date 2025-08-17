const express = require("express");
const {
  getReports,
  createReport,
  updateReport,
  deleteReport,
} = require("../controllers/reportController");
const authMiddleware = require("../middlewares/auth");
const { upload, handleMulterErrors } = require("../middlewares/imageUpload");

const router = express.Router();

// ✅ GET all reports
router.get("/", authMiddleware, getReports);

// ✅ POST create report with image upload
router.post(
  "/",
  authMiddleware, // Check authentication first
  upload, // Handle file upload
  handleMulterErrors, // Handle upload errors
  createReport // Process the report
);

// ✅ PUT update report
router.put("/:id", authMiddleware, updateReport);

// ✅ DELETE report
router.delete("/:id", authMiddleware, deleteReport);

module.exports = router;
