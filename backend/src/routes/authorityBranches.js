const router = require("express").Router();
const {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
} = require("../controllers/authorityBranchesController");
const { verifyToken, requirePermission } = require("../middleware/auth");

const canManage = requirePermission("can_manage_branches");

router.get("/", verifyToken, getAllBranches);
router.get("/:id", verifyToken, getBranchById);
router.post("/", verifyToken, canManage, createBranch);
router.put("/:id", verifyToken, canManage, updateBranch);
router.delete("/:id", verifyToken, canManage, deleteBranch);

module.exports = router;
