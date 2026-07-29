const router = require("express").Router();
const {
  getAll,
  getFilterOptions,
  getById,
  getDealsByContractorAndAuthority,
  getDealCategories,
  getCumulativeItemsForInvoice,
  create,
  remove,
} = require("../controllers/invoicesController");
const { verifyToken, requirePermission } = require("../middleware/auth");

const canManage = requirePermission("can_manage_invoices");

router.get("/filter-options", verifyToken, getFilterOptions);
router.get("/deals", verifyToken, getDealsByContractorAndAuthority);
router.get("/deal-categories/:dealId", verifyToken, getDealCategories);
router.get("/cumulative-items", verifyToken, getCumulativeItemsForInvoice);

router.get("/", verifyToken, getAll);
router.get("/:id", verifyToken, getById);
router.post("/", verifyToken, canManage, create);
router.delete("/:id", verifyToken, canManage, remove);

module.exports = router;
