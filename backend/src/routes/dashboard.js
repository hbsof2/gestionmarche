const router = require("express").Router();
const {
  getOverallStats,
  getMonthlyActivity,
  getRecentActivity,
  getAlerts,
  getMaterialsDistribution,
} = require("../controllers/dashboardController");
const { verifyToken } = require("../middleware/auth");

router.get("/stats", verifyToken, getOverallStats);
router.get("/monthly-activity", verifyToken, getMonthlyActivity);
router.get("/recent-activity", verifyToken, getRecentActivity);
router.get("/alerts", verifyToken, getAlerts);
router.get("/materials-distribution", verifyToken, getMaterialsDistribution);

module.exports = router;
