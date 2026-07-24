const router = require("express").Router();
const {
  getAll,
  getById,
  create,
  update,
  remove,
  getDealBranches,
  addBranchToDeal,
  removeBranchFromDeal,
  getDealItems,
  addDealItem,
  updateDealItem,
  removeDealItem,
  getDealStats,
} = require("../controllers/dealsController");
const { verifyToken, requirePermission } = require("../middleware/auth");

const canManage = requirePermission("can_manage_deals");

router.get("/:id/branches", verifyToken, getDealBranches);
router.post("/:id/branches", verifyToken, canManage, addBranchToDeal);
router.delete("/:id/branches/:branchId", verifyToken, canManage, removeBranchFromDeal);

router.get("/:id/items", verifyToken, getDealItems);
router.post("/:id/items", verifyToken, canManage, addDealItem);
router.put("/:id/items/:itemId", verifyToken, canManage, updateDealItem);
router.delete("/:id/items/:itemId", verifyToken, canManage, removeDealItem);

router.get("/:id/stats", verifyToken, getDealStats);

router.get("/", verifyToken, getAll);
router.get("/:id", verifyToken, getById);
router.post("/", verifyToken, canManage, create);
router.put("/:id", verifyToken, canManage, update);
router.delete("/:id", verifyToken, canManage, remove);

module.exports = router;
