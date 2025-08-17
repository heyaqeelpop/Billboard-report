const express = require("express");
const {
  getReports,
  createReport,
  updateReport,
  deleteReport,
} = require("../controllers/reportController");
const { authenticateToken } = require("../middlewares/auth");

const router = express.Router();

// All report routes need authentication
router.use(authenticateToken);

router.get("/", getReports);
router.post("/", createReport);
router.put("/:id", updateReport);
router.delete("/:id", deleteReport);

module.exports = router;
