const pool = require("../config/db");
const { hashPassword } = require("../utils/password");
const logActivity = require("../utils/activityLogger");

const PERMISSION_FIELDS = [
  "can_manage_deals",
  "can_manage_authorities",
  "can_manage_contractors",
  "can_manage_branches",
  "can_manage_receipts",
  "can_manage_raw_materials",
  "can_manage_invoices",
];

const SAFE_COLUMNS = `
  u.id, u.full_name, u.phone, u.email, u.username, u.role, u.is_active,
  u.can_manage_deals, u.can_manage_authorities, u.can_manage_contractors,
  u.can_manage_branches, u.can_manage_receipts, u.can_manage_raw_materials,
  u.can_manage_invoices, u.created_by, u.created_at, u.updated_at,
  creator.full_name AS created_by_name
`;

async function getAll(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT ${SAFE_COLUMNS}
       FROM users u
       LEFT JOIN users creator ON creator.id = u.created_by
       ORDER BY u.id ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getById(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT ${SAFE_COLUMNS}
       FROM users u
       LEFT JOIN users creator ON creator.id = u.created_by
       WHERE u.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "المستخدم غير موجود" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function validate(body, { isCreate }) {
  const { full_name, phone, username, password, role } = body;
  if (!full_name?.trim()) return "الاسم واللقب الكاملين مطلوبان";
  if (!phone?.trim()) return "رقم الهاتف مطلوب";
  if (isCreate && !username?.trim()) return "اسم المستخدم مطلوب";
  if (isCreate && (!password || password.length < 8)) return "يجب أن تتكون كلمة السر من 8 أحرف على الأقل";
  if (!role || !["admin", "secondary"].includes(role)) return "نوع المستخدم مطلوب";
  return null;
}

function extractPermissions(body, role) {
  if (role === "admin") {
    return PERMISSION_FIELDS.reduce((acc, f) => ({ ...acc, [f]: true }), {});
  }
  return PERMISSION_FIELDS.reduce((acc, f) => ({ ...acc, [f]: Boolean(body[f]) }), {});
}

async function create(req, res) {
  const error = validate(req.body, { isCreate: true });
  if (error) return res.status(400).json({ error });

  const { full_name, phone, email, username, password, role } = req.body;
  try {
    const { rows: existing } = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username.trim()]
    );
    if (existing.length) return res.status(400).json({ error: "اسم المستخدم مستخدم مسبقاً" });

    const password_hash = await hashPassword(password);
    const permissions = extractPermissions(req.body, role);

    const { rows } = await pool.query(
      `INSERT INTO users
        (full_name, phone, email, username, password_hash, role,
         can_manage_deals, can_manage_authorities, can_manage_contractors,
         can_manage_branches, can_manage_receipts, can_manage_raw_materials,
         can_manage_invoices, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [
        full_name.trim(), phone.trim(), email?.trim() || null, username.trim(), password_hash, role,
        permissions.can_manage_deals, permissions.can_manage_authorities, permissions.can_manage_contractors,
        permissions.can_manage_branches, permissions.can_manage_receipts, permissions.can_manage_raw_materials,
        permissions.can_manage_invoices, req.user.id,
      ]
    );

    const { rows: fullRows } = await pool.query(
      `SELECT ${SAFE_COLUMNS} FROM users u LEFT JOIN users creator ON creator.id = u.created_by WHERE u.id = $1`,
      [rows[0].id]
    );
    res.status(201).json(fullRows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ error: "اسم المستخدم مستخدم مسبقاً" });
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  const error = validate(req.body, { isCreate: false });
  if (error) return res.status(400).json({ error });

  const { full_name, phone, email, role, is_active } = req.body;
  try {
    const permissions = extractPermissions(req.body, role);

    const { rows } = await pool.query(
      `UPDATE users
       SET full_name=$1, phone=$2, email=$3, role=$4, is_active=$5,
           can_manage_deals=$6, can_manage_authorities=$7, can_manage_contractors=$8,
           can_manage_branches=$9, can_manage_receipts=$10, can_manage_raw_materials=$11,
           can_manage_invoices=$12
       WHERE id=$13 RETURNING id`,
      [
        full_name.trim(), phone.trim(), email?.trim() || null, role, is_active !== false,
        permissions.can_manage_deals, permissions.can_manage_authorities, permissions.can_manage_contractors,
        permissions.can_manage_branches, permissions.can_manage_receipts, permissions.can_manage_raw_materials,
        permissions.can_manage_invoices, req.params.id,
      ]
    );
    if (!rows.length) return res.status(404).json({ error: "المستخدم غير موجود" });

    const { rows: fullRows } = await pool.query(
      `SELECT ${SAFE_COLUMNS} FROM users u LEFT JOIN users creator ON creator.id = u.created_by WHERE u.id = $1`,
      [rows[0].id]
    );
    await logActivity(pool, {
      userId: req.user.id,
      username: req.user.username,
      fullName: req.user.full_name,
      actionType: "update",
      action: `تعديل بيانات مستخدم: ${fullRows[0].username}`,
      section: "users",
      ipAddress: req.ip,
    });
    res.json(fullRows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function resetPassword(req, res) {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 8) {
    return res.status(400).json({ error: "يجب أن تتكون كلمة السر من 8 أحرف على الأقل" });
  }
  try {
    const password_hash = await hashPassword(new_password);
    const { rows } = await pool.query(
      "UPDATE users SET password_hash=$1 WHERE id=$2 RETURNING id, username",
      [password_hash, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "المستخدم غير موجود" });
    await logActivity(pool, {
      userId: req.user.id,
      username: req.user.username,
      fullName: req.user.full_name,
      actionType: "update",
      action: `إعادة تعيين كلمة سر: ${rows[0].username}`,
      section: "users",
      ipAddress: req.ip,
    });
    res.json({ message: "تم تغيير كلمة السر بنجاح" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  if (String(req.user.id) === String(req.params.id)) {
    return res.status(400).json({ error: "لا يمكنك حذف حسابك الخاص" });
  }
  try {
    const tables = ["deals", "contracting_authorities", "contractors", "authority_branches", "receipts", "raw_materials", "users"];
    for (const table of tables) {
      const { rows } = await pool.query(
        `SELECT COUNT(*) FROM ${table} WHERE created_by = $1`,
        [req.params.id]
      );
      if (parseInt(rows[0].count) > 0) {
        return res.status(400).json({ error: "لا يمكن حذف هذا المستخدم لأنه مرتبط بعمليات في النظام" });
      }
    }

    const { rows } = await pool.query(
      "DELETE FROM users WHERE id=$1 RETURNING id, full_name, username",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "المستخدم غير موجود" });
    await logActivity(pool, {
      userId: req.user.id,
      username: req.user.username,
      fullName: req.user.full_name,
      actionType: "delete",
      action: `حذف مستخدم: ${rows[0].username}`,
      section: "users",
      ipAddress: req.ip,
    });
    res.json({ deleted: rows[0].id, full_name: rows[0].full_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, getById, create, update, resetPassword, remove };
