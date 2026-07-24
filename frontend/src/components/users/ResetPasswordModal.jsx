"use client";
import { useState } from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordModal({ user, onConfirm, onCancel }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!newPassword || newPassword.length < 8) errs.newPassword = "يجب أن تتكون كلمة السر من 8 أحرف على الأقل";
    if (confirmPassword !== newPassword) errs.confirmPassword = "كلمتا السر غير متطابقتين";
    return errs;
  };

  const handleConfirm = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});
    try {
      await onConfirm(newPassword);
    } catch (err) {
      setErrors({ submit: err.arabicMessage || err?.response?.data?.error || "حدث خطأ أثناء تغيير كلمة السر" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-14 h-14 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mb-4">
              <KeyRound size={24} className="text-orange-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">إعادة تعيين كلمة السر</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400" dir="ltr">{user.username}</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                كلمة السر الجديدة <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  dir="ltr"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setErrors((p) => ({ ...p, newPassword: "" })); }}
                  placeholder="8 أحرف على الأقل"
                  className={`w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm outline-none transition-colors text-right ${
                    errors.newPassword
                      ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
                      : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
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
              {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                تأكيد كلمة السر <span className="text-red-500">*</span>
              </label>
              <input
                type={showPassword ? "text" : "password"}
                dir="ltr"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: "" })); }}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors text-right ${
                  errors.confirmPassword
                    ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
                    : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                }`}
              />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>

            {errors.submit && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2.5 border border-red-100 dark:border-red-500/30">
                {errors.submit}
              </p>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium bg-orange-500 hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "جارٍ الحفظ..." : "تغيير كلمة السر"}
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
