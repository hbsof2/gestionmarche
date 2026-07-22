require("dotenv").config();
const express = require("express");
const cors = require("cors");

const rawMaterialsRouter          = require("./routes/rawMaterials");
const materialCategoriesRouter    = require("./routes/materialCategories");
const contractingAuthorityRouter = require("./routes/contractingAuthority");
const authorityBranchesRouter = require("./routes/authorityBranches");
const contractorsRouter       = require("./routes/contractors");
const dealsRouter             = require("./routes/deals");
const receiptsRouter          = require("./routes/receipts");
const invoicesRouter          = require("./routes/invoices");
const usersRouter             = require("./routes/users");
const backupRouter            = require("./routes/backup");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/raw-materials",         rawMaterialsRouter);
app.use("/api/material-categories",   materialCategoriesRouter);
app.use("/api/contracting-authority", contractingAuthorityRouter);
app.use("/api/authority-branches",    authorityBranchesRouter);
app.use("/api/contractors",           contractorsRouter);
app.use("/api/deals",                 dealsRouter);
app.use("/api/receipts",              receiptsRouter);
app.use("/api/invoices",              invoicesRouter);
app.use("/api/users",                 usersRouter);
app.use("/api/backup",                backupRouter);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
