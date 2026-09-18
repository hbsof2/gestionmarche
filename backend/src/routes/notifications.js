const router = require("express").Router();
const {
  getAll,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  remove,
  removeAll,
} = require("../controllers/notificationsController");
const { verifyToken } = require("../middleware/auth");

router.get("/", verifyToken, getAll);
router.get("/unread-count", verifyToken, getUnreadCount);
router.put("/read-all", verifyToken, markAllAsRead);
router.put("/:id/read", verifyToken, markAsRead);
router.delete("/clear-all", verifyToken, removeAll);
router.delete("/:id", verifyToken, remove);

module.exports = router;
