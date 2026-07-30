const router = require("express").Router();
const { getUsers, getUserLogs, getAllLogs } = require("../controllers/activityLogsController");
const { verifyToken, requireAdmin } = require("../middleware/auth");

router.get("/", verifyToken, requireAdmin, getAllLogs);
router.get("/users", verifyToken, requireAdmin, getUsers);
router.get("/:userId", verifyToken, requireAdmin, getUserLogs);

module.exports = router;
