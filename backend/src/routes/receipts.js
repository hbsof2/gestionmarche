const router = require("express").Router();
const {
  getAll,
  getFilterOptions,
  getById,
  getDealsByContractorAndAuthority,
  getDealBranchesForReceipt,
  getNextCounter,
  getCumulativeItems,
  create,
  update,
  remove,
  getReceiptItems,
  getDealMaterialsForReceipt,
  addReceiptItem,
  updateReceiptItem,
  removeReceiptItem,
} = require("../controllers/receiptsController");
const { verifyToken, requirePermission } = require("../middleware/auth");

const canManage = requirePermission("can_manage_receipts");

router.get("/filter-options", verifyToken, getFilterOptions);
router.get("/deals", verifyToken, getDealsByContractorAndAuthority);
router.get("/deal-branches/:dealId", verifyToken, getDealBranchesForReceipt);
router.get("/next-counter/:dealId", verifyToken, getNextCounter);
router.get("/cumulative-items", verifyToken, getCumulativeItems);

router.get("/:id/items", verifyToken, getReceiptItems);
router.get("/:id/available-materials", verifyToken, getDealMaterialsForReceipt);
router.post("/:id/items", verifyToken, canManage, addReceiptItem);
router.put("/:id/items/:itemId", verifyToken, canManage, updateReceiptItem);
router.delete("/:id/items/:itemId", verifyToken, canManage, removeReceiptItem);

router.get("/", verifyToken, getAll);
router.get("/:id", verifyToken, getById);
router.post("/", verifyToken, canManage, create);
router.put("/:id", verifyToken, canManage, update);
router.delete("/:id", verifyToken, canManage, remove);

module.exports = router;
