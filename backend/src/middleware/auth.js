const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { JWT_SECRET } = require("../config/auth");

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "الرجاء تسجيل الدخول للمتابعة" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const { rows } = await pool.query(
      "SELECT id, full_name, phone, email, username, role, is_active, can_manage_deals, can_manage_authorities, can_manage_contractors, can_manage_branches, can_manage_receipts, can_manage_raw_materials, can_manage_invoices FROM users WHERE id = $1",
      [payload.id]
    );
    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ error: "جلسة الدخول غير صالحة أو منتهية" });
    }
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: "جلسة الدخول غير صالحة أو منتهية" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "هذه العملية تتطلب صلاحيات المدير الرئيسي" });
  }
  next();
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (req.user?.role === "admin" || req.user?.[permission] === true) {
      return next();
    }
    return res.status(403).json({ error: "ليس لديك صلاحية للقيام بهذه العملية" });
  };
}

module.exports = { verifyToken, requireAdmin, requirePermission };
