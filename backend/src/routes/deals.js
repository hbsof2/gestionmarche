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
} = require("../controllers/dealsController");

router.get("/:id/branches", getDealBranches);
router.post("/:id/branches", addBranchToDeal);
router.delete("/:id/branches/:branchId", removeBranchFromDeal);

router.get("/:id/items", getDealItems);
router.post("/:id/items", addDealItem);
router.put("/:id/items/:itemId", updateDealItem);
router.delete("/:id/items/:itemId", removeDealItem);

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

module.exports = router;
