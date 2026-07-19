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
router.post("/upload-image", upload.single("image"), uploadImage);

router.get("/", getAllMaterials);
router.get("/:id", getMaterialById);
router.post("/", createMaterial);
router.put("/:id", updateMaterial);
router.delete("/:id", deleteMaterial);

module.exports = router;
