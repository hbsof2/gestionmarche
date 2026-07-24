const router = require("express").Router();
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require("../controllers/contractorsController");
const { verifyToken, requirePermission } = require("../middleware/auth");

const canManage = requirePermission("can_manage_contractors");

router.get("/", verifyToken, getAll);
router.get("/:id", verifyToken, getById);
router.post("/", verifyToken, canManage, create);
router.put("/:id", verifyToken, canManage, update);
router.delete("/:id", verifyToken, canManage, remove);

module.exports = router;
