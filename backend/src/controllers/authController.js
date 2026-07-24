const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { comparePassword, hashPassword } = require("../utils/password");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/auth");

const PERMISSION_FIELDS = [
  "can_manage_deals",
  "can_manage_authorities",
  "can_manage_contractors",
  "can_manage_branches",
  "can_manage_receipts",
  "can_manage_raw_materials",
  "can_manage_invoices",
];

function buildPermissions(user) {
  return PERMISSION_FIELDS.reduce((acc, field) => {
    acc[field] = user.role === "admin" ? true : user[field];
    return acc;
  }, {});
}

async function login(req, res) {
  const { username, password } = req.body;
  if (!username?.trim() || !password) {
    return res.status(400).json({ error: "اسم المستخدم وكلمة السر مطلوبان" });
  }
  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username.trim()]
    );
    if (!rows.length) {
      return res.status(401).json({ error: "اسم المستخدم أو كلمة السر غير صحيحة" });
    }
    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: "تم تعطيل حسابك، تواصل مع المدير الرئيسي" });
    }
    const match = await comparePassword(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "اسم المستخدم أو كلمة السر غير صحيحة" });
    }

    const permissions = buildPermissions(user);
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, full_name: user.full_name, permissions },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        role: user.role,
        permissions,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getMe(req, res) {
  const permissions = buildPermissions(req.user);
  const { id, full_name, phone, email, username, role, is_active } = req.user;
  res.json({ id, full_name, phone, email, username, role, is_active, permissions });
}

async function changePassword(req, res) {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: "كلمة السر الحالية والجديدة مطلوبتان" });
  }
  if (new_password.length < 8) {
    return res.status(400).json({ error: "يجب أن تتكون كلمة السر من 8 أحرف على الأقل" });
  }
  try {
    const { rows } = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "المستخدم غير موجود" });

    const match = await comparePassword(current_password, rows[0].password_hash);
    if (!match) return res.status(400).json({ error: "كلمة السر الحالية غير صحيحة" });

    const newHash = await hashPassword(new_password);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, req.user.id]);
    res.json({ message: "تم تغيير كلمة السر بنجاح" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { login, getMe, changePassword };
