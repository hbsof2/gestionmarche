const router = require("express").Router();
const {
  getAll,
  getById,
  getDealsByContractorAndAuthority,
  getDealBranchesForReceipt,
  getNextCounter,
  create,
  update,
  remove,
} = require("../controllers/receiptsController");
const { verifyToken, requirePermission } = require("../middleware/auth");

const canManage = requirePermission("can_manage_receipts");

router.get("/deals", verifyToken, getDealsByContractorAndAuthority);
router.get("/deal-branches/:dealId", verifyToken, getDealBranchesForReceipt);
router.get("/next-counter/:dealId", verifyToken, getNextCounter);

router.get("/", verifyToken, getAll);
router.get("/:id", verifyToken, getById);
router.post("/", verifyToken, canManage, create);
router.put("/:id", verifyToken, canManage, update);
router.delete("/:id", verifyToken, canManage, remove);

module.exports = router;
