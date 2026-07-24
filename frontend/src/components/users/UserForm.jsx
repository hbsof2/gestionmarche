"use client";
import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";

const COLOR = "#7D3C98";

const PERMISSIONS = [
  { key: "can_manage_deals", label: "إنشاء وتعديل الصفقات" },
  { key: "can_manage_authorities", label: "إدارة المصالح المتعاقدة" },
  { key: "can_manage_contractors", label: "إدارة المتعاملين المتعاقدين" },
  { key: "can_manage_branches", label: "إدارة فروع المصالح" },
  { key: "can_manage_receipts", label: "إنشاء وتعديل الوصولات" },
  { key: "can_manage_raw_materials", label: "إدارة المواد الأولية" },
  { key: "can_manage_invoices", label: "إنشاء وتعديل الفواتير" },
];

export default function UserForm({ user, onSave, onCancel }) {
  const isEdit = Boolean(user);

  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    username: user?.username || "",
    password: "",
    role: user?.role || "secondary",
    is_active: user?.is_active ?? true,
  });
  const [permissions, setPermissions] = useState(() =>
    PERMISSIONS.reduce((acc, p) => ({ ...acc, [p.key]: user?.[p.key] || false }), {})
  );
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const togglePermission = (key) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAll = () => {
    setPermissions(PERMISSIONS.reduce((acc, p) => ({ ...acc, [p.key]: true }), {}));
  };

  const deselectAll = () => {
    setPermissions(PERMISSIONS.reduce((acc, p) => ({ ...acc, [p.key]: false }), {}));
  };

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = "الاسم واللقب الكاملين مطلوبان";
    if (!form.phone.trim()) errs.phone = "رقم الهاتف مطلوب";
    if (!isEdit) {
      if (!form.username.trim()) errs.username = "اسم المستخدم مطلوب";
      if (!form.password || form.password.length < 8) errs.password = "يجب أن تتكون كلمة السر من 8 أحرف على الأقل";
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const body = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        role: form.role,
        ...permissions,
      };
      if (isEdit) {
        body.is_active = form.is_active;
        await onSave(body, user.id);
      } else {
        body.username = form.username.trim();
        body.password = form.password;
        await onSave(body);
      }
    } catch (err) {
      setErrors({ submit: err.arabicMessage || err.response?.data?.error || "حدث خطأ أثناء الحفظ" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {isEdit ? "تعديل المستخدم" : "إضافة مستخدم جديد"}
          </h3>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* full_name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              الاسم واللقب الكاملين <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                errors.full_name
                  ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
                  : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-700 text-slate-800 dark:text-slate-100"
              }`}
            />
            {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
          </div>

          {/* phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              رقم الهاتف <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              dir="ltr"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors text-right ${
                errors.phone
                  ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
                  : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-700 text-slate-800 dark:text-slate-100"
              }`}
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          {/* email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              البريد الإلكتروني <span className="text-slate-400 dark:text-slate-500 font-normal">(اختياري)</span>
            </label>
            <input
              type="email"
              dir="ltr"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-700 transition-colors text-right"
            />
          </div>

          {/* username */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              اسم المستخدم <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              dir="ltr"
              disabled={isEdit}
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors text-right ${
                isEdit ? "border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed" :
                errors.username
                  ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
                  : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-700 text-slate-800 dark:text-slate-100"
              }`}
            />
            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
          </div>

          {/* password (create only) */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                كلمة السر <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  dir="ltr"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="8 أحرف على الأقل"
                  className={`w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm outline-none transition-colors text-right ${
                    errors.password
                      ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
                      : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-700 text-slate-800 dark:text-slate-100"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>
          )}

          {/* role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              نوع المستخدم <span className="text-red-500">*</span>
            </label>
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-700 transition-colors"
            >
              <option value="admin">المدير الرئيسي</option>
              <option value="secondary">مستخدم ثانوي</option>
            </select>
            {form.role === "admin" && (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-3 py-2 mt-2">
                المدير الرئيسي لديه جميع الصلاحيات تلقائياً
              </p>
            )}
          </div>

          {/* permissions (secondary only) */}
          {form.role === "secondary" && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">صلاحيات المستخدم</h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs font-medium text-green-600 dark:text-green-400 hover:underline"
                  >
                    تحديد الكل
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-xs font-medium text-red-500 dark:text-red-400 hover:underline"
                  >
                    إلغاء الكل
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {PERMISSIONS.map((p) => (
                  <label
                    key={p.key}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={permissions[p.key]}
                      onChange={() => togglePermission(p.key)}
                      className="w-4 h-4 rounded accent-current shrink-0"
                      style={{ accentColor: COLOR }}
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* is_active (edit only) */}
          {isEdit && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">حالة الحساب</span>
                <button
                  type="button"
                  onClick={() => set("is_active", !form.is_active)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    form.is_active ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      form.is_active ? "right-0.5" : "right-5.5"
                    }`}
                    style={{ right: form.is_active ? "2px" : "22px" }}
                  />
                </button>
              </label>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {form.is_active ? "نشط" : "معطل"}
              </p>
            </div>
          )}

          {/* Submit error */}
          {errors.submit && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2.5 border border-red-100 dark:border-red-500/30">
              {errors.submit}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-opacity disabled:opacity-60"
              style={{ backgroundColor: COLOR }}
            >
              {submitting ? "جارٍ الحفظ..." : "حفظ"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-60"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
