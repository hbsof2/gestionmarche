const router = require("express").Router();
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/materialCategoriesController");
const { verifyToken, requirePermission } = require("../middleware/auth");

const canManage = requirePermission("can_manage_raw_materials");

router.get("/", verifyToken, getAllCategories);
router.get("/:id", verifyToken, getCategoryById);
router.post("/", verifyToken, canManage, createCategory);
router.put("/:id", verifyToken, canManage, updateCategory);
router.delete("/:id", verifyToken, canManage, deleteCategory);

module.exports = router;
