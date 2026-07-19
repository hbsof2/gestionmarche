const router = require("express").Router();
const {
  getAllAuthorities,
  getAuthorityById,
  createAuthority,
  updateAuthority,
  deleteAuthority,
} = require("../controllers/contractingAuthorityController");

router.get("/", getAllAuthorities);
router.get("/:id", getAuthorityById);
router.post("/", createAuthority);
router.put("/:id", updateAuthority);
router.delete("/:id", deleteAuthority);

module.exports = router;
