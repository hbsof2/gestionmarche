const router = require("express").Router();
const multer = require("multer");
const {
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  uploadImage,
} = require("../controllers/rawMaterialsController");
const { verifyToken, requirePermission } = require("../middleware/auth");

const canManage = requirePermission("can_manage_raw_materials");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("يجب أن يكون الملف صورة"), false);
    }
    cb(null, true);
  },
});

// /upload-image must be declared before /:id to avoid route conflict
router.post("/upload-image", verifyToken, canManage, upload.single("image"), uploadImage);

router.get("/", verifyToken, getAllMaterials);
router.get("/:id", verifyToken, getMaterialById);
router.post("/", verifyToken, canManage, createMaterial);
router.put("/:id", verifyToken, canManage, updateMaterial);
router.delete("/:id", verifyToken, canManage, deleteMaterial);

module.exports = router;
