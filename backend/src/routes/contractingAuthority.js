const router = require("express").Router();
const {
  getAllAuthorities,
  getAuthorityById,
  createAuthority,
  updateAuthority,
  deleteAuthority,
} = require("../controllers/contractingAuthorityController");
const { verifyToken, requirePermission } = require("../middleware/auth");

const canManage = requirePermission("can_manage_authorities");

router.get("/", verifyToken, getAllAuthorities);
router.get("/:id", verifyToken, getAuthorityById);
router.post("/", verifyToken, canManage, createAuthority);
router.put("/:id", verifyToken, canManage, updateAuthority);
router.delete("/:id", verifyToken, canManage, deleteAuthority);

module.exports = router;
