// test: verify dev branch ignored by Vercel
// test: verify dev branch ignored by Vercel 2
// Polyfill for @supabase/supabase-js realtime-js, which probes for a global
// WebSocket at createClient() time. Native WebSocket exists on Node 22+, so this
// guard is a no-op there and only kicks in on older runtimes.
if (!globalThis.WebSocket) {
  globalThis.WebSocket = require("ws");
}

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRouter              = require("./routes/auth");
const rawMaterialsRouter          = require("./routes/rawMaterials");
const materialCategoriesRouter    = require("./routes/materialCategories");
const contractingAuthorityRouter = require("./routes/contractingAuthority");
const authorityBranchesRouter = require("./routes/authorityBranches");
const contractorsRouter       = require("./routes/contractors");
const dealsRouter             = require("./routes/deals");
const receiptsRouter          = require("./routes/receipts");
const invoicesRouter          = require("./routes/invoices");
const usersRouter             = require("./routes/users");
const backupsRouter           = require("./routes/backups");
const activityLogsRouter      = require("./routes/activityLogs");
const notificationsRouter     = require("./routes/notifications");

const pool = require("./config/db");
const cleanupOldLogs = require("./utils/cleanupLogs");
const cleanupOldBackups = require("./utils/cleanupBackups");
const generateNotifications = require("./utils/notificationGenerator");

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://gestionmarche.netlify.app",
    "https://hbsoftsalesmanager.netlify.app",
    "https://gestionmarche.vercel.app",
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Branch"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth",                  authRouter);
app.use("/api/raw-materials",         rawMaterialsRouter);
app.use("/api/material-categories",   materialCategoriesRouter);
app.use("/api/contracting-authority", contractingAuthorityRouter);
app.use("/api/authority-branches",    authorityBranchesRouter);
app.use("/api/contractors",           contractorsRouter);
app.use("/api/deals",                 dealsRouter);
app.use("/api/receipts",              receiptsRouter);
app.use("/api/invoices",              invoicesRouter);
app.use("/api/users",                 usersRouter);
app.use("/api/backups",               backupsRouter);
app.use("/api/activity-logs",         activityLogsRouter);
app.use("/api/notifications",         notificationsRouter);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Auto-delete activity logs older than 3 days
pool.connect().then((client) => {
  cleanupOldLogs(client).finally(() => client.release());
});
setInterval(async () => {
  const client = await pool.connect();
  try {
    await cleanupOldLogs(client);
    console.log("Old activity logs cleaned up");
  } finally {
    client.release();
  }
}, 24 * 60 * 60 * 1000);

// Auto-delete backup files/records older than 5 days
cleanupOldBackups(pool);
setInterval(() => {
  cleanupOldBackups(pool);
}, 24 * 60 * 60 * 1000);

// Generate notifications (low stock, expiring deals, backup reminders)
generateNotifications(pool).catch((err) =>
  console.error("Notification generation error:", err)
);
setInterval(() => {
  generateNotifications(pool).catch((err) =>
    console.error("Notification generation error:", err)
  );
}, 60 * 60 * 1000);
