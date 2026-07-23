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
} = require("../controllers/dealsController");

router.get("/:id/branches", getDealBranches);
router.post("/:id/branches", addBranchToDeal);
router.delete("/:id/branches/:branchId", removeBranchFromDeal);

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

module.exports = router;
