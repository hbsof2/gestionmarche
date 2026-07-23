"use client";
import { useState } from "react";
import { X } from "lucide-react";

export default function MaterialCategoryForm({ category, onSave, onCancel }) {
  const isEdit = Boolean(category);
  const [form, setForm] = useState({
    name_ar: category?.name_ar || "",
    name_lat: category?.name_lat || "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name_ar.trim()) {
      setErrors({ name_ar: "اسم الصنف بالعربي مطلوب" });
      return;
    }
    setSubmitting(true);
    try {
      await onSave(form, category?.id);
    } catch (err) {
      setErrors({ submit: err.arabicMessage || err.response?.data?.error || "حدث خطأ أثناء الحفظ" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {isEdit ? "تعديل الصنف" : "إضافة صنف جديد"}
          </h3>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* name_ar */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              اسم الصنف بالعربي <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name_ar}
              onChange={(e) => set("name_ar", e.target.value)}
              placeholder="مثال: مواد غذائية"
              autoFocus
              className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors text-slate-800 dark:text-slate-100 ${
                errors.name_ar
                  ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:border-red-400"
                  : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:border-green-500 focus:bg-white dark:focus:bg-slate-700"
              }`}
            />
            {errors.name_ar && (
              <p className="text-xs text-red-500 mt-1">{errors.name_ar}</p>
            )}
          </div>

          {/* name_lat */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              اسم الصنف باللاتيني
            </label>
            <input
              type="text"
              value={form.name_lat}
              onChange={(e) => set("name_lat", e.target.value)}
              placeholder="مثال: Produits alimentaires"
              dir="ltr"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm outline-none text-slate-800 dark:text-slate-100 focus:border-green-500 focus:bg-white dark:focus:bg-slate-700 transition-colors"
            />
          </div>

          {/* Submit error */}
          {errors.submit && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2.5 border border-red-100 dark:border-red-800">
              {errors.submit}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-opacity disabled:opacity-60"
              style={{ backgroundColor: "#2D7A4F" }}
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
