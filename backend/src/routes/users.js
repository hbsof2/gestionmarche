const router = require("express").Router();
const { getAll, getById, create, update, resetPassword, remove } = require("../controllers/usersController");
const { verifyToken, requireAdmin } = require("../middleware/auth");

router.get("/", verifyToken, requireAdmin, getAll);
router.get("/:id", verifyToken, requireAdmin, getById);
router.post("/", verifyToken, requireAdmin, create);
router.put("/:id", verifyToken, requireAdmin, update);
router.put("/:id/reset-password", verifyToken, requireAdmin, resetPassword);
router.delete("/:id", verifyToken, requireAdmin, remove);

module.exports = router;
