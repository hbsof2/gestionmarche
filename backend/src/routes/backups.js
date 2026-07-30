const router = require("express").Router();
const {
  createBackup,
  sendBackup,
  downloadBackup,
  getAll,
  remove,
} = require("../controllers/backupsController");
const { verifyToken, requireAdmin } = require("../middleware/auth");

router.get("/", verifyToken, requireAdmin, getAll);
router.post("/create", verifyToken, requireAdmin, createBackup);
router.post("/send-email", verifyToken, requireAdmin, sendBackup);
router.get("/:id/download", verifyToken, requireAdmin, downloadBackup);
router.delete("/:id", verifyToken, requireAdmin, remove);

module.exports = router;
