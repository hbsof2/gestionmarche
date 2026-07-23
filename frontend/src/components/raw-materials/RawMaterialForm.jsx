"use client";
import { useState, useRef } from "react";
import { X, ImagePlus } from "lucide-react";
import { uploadImage } from "@/services/rawMaterialsService";

const UNITS = ["كغ", "لتر", "و", "علبة", "ربطة", "حبة"];

export default function RawMaterialForm({ material, onSave, onCancel }) {
  const isEdit = Boolean(material);
  const [form, setForm] = useState({
    name_ar: material?.name_ar || "",
    name_lat: material?.name_lat || "",
    description: material?.description || "",
    unit: material?.unit || "",
    image_url: material?.image_url || "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(material?.image_url || null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name_ar.trim()) errs.name_ar = "اسم المادة بالعربي مطلوب";
    if (!form.unit) errs.unit = "الوحدة مطلوبة";
    return errs;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm((prev) => ({ ...prev, image_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      let image_url = form.image_url;
      if (imageFile) {
        const result = await uploadImage(imageFile);
        image_url = result.url;
      }
      await onSave({ ...form, image_url }, material?.id);
    } catch (err) {
      setErrors({ submit: err.arabicMessage || err.response?.data?.error || "حدث خطأ أثناء الحفظ" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {isEdit ? "تعديل المادة" : "إضافة مادة جديدة"}
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
              اسم المادة بالعربي <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name_ar}
              onChange={(e) => set("name_ar", e.target.value)}
              placeholder="مثال: طحين"
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
              اسم المادة باللاتيني
            </label>
            <input
              type="text"
              value={form.name_lat}
              onChange={(e) => set("name_lat", e.target.value)}
              placeholder="مثال: Farine"
              dir="ltr"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm outline-none text-slate-800 dark:text-slate-100 focus:border-green-500 focus:bg-white dark:focus:bg-slate-700 transition-colors"
            />
          </div>

          {/* unit */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              الوحدة <span className="text-red-500">*</span>
            </label>
            <select
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors text-slate-800 dark:text-slate-100 ${
                errors.unit
                  ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:border-red-400"
                  : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:border-green-500 focus:bg-white dark:focus:bg-slate-700"
              }`}
            >
              <option value="">-- اختر الوحدة --</option>
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            {errors.unit && (
              <p className="text-xs text-red-500 mt-1">{errors.unit}</p>
            )}
          </div>

          {/* description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              الوصف
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="وصف اختياري للمادة..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm outline-none text-slate-800 dark:text-slate-100 focus:border-green-500 focus:bg-white dark:focus:bg-slate-700 transition-colors resize-none"
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              الصورة
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="معاينة"
                  className="w-full h-40 object-cover"
                />
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                  >
                    تغيير
                  </button>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="p-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500 hover:border-green-400 hover:text-green-600 transition-colors"
              >
                <ImagePlus size={22} />
                <span className="text-sm">انقر لرفع صورة</span>
                <span className="text-xs text-slate-300 dark:text-slate-600">PNG, JPG حتى 5MB</span>
              </button>
            )}
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
