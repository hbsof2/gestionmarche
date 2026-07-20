const router = require("express").Router();
const {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
} = require("../controllers/authorityBranchesController");

router.get("/", getAllBranches);
router.get("/:id", getBranchById);
router.post("/", createBranch);
router.put("/:id", updateBranch);
router.delete("/:id", deleteBranch);

module.exports = router;
