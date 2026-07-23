"use client";
import { useState, useMemo } from "react";
import { X } from "lucide-react";
import WILAYAS from "@/data/algeria-wilayas";

const COLOR = "#6C3483";

const MONTHS = [
  "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
  "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1990 + 1 }, (_, i) => CURRENT_YEAR - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function pad(n) {
  return String(n).padStart(2, "0");
}

function parseDate(isoDate) {
  if (!isoDate) return { day: "", month: "", year: "" };
  const [year, month, day] = isoDate.split("T")[0].split("-");
  return { day: parseInt(day, 10), month: parseInt(month, 10), year: parseInt(year, 10) };
}

export default function AuthorityBranchForm({ branch, onSave, onCancel }) {
  const isEdit = Boolean(branch);
  const initialDate = parseDate(branch?.rc_date);

  const [form, setForm] = useState({
    name: branch?.name || "",
    wilaya: branch?.wilaya || "غرداية",
    commune: branch?.commune || "",
    nis: branch?.nis || "",
    nif: branch?.nif || "",
    rc_number: branch?.rc_number || "",
    address: branch?.address || "",
    phone: branch?.phone || "",
    fax: branch?.fax || "",
  });
  const [rcDay, setRcDay] = useState(initialDate.day);
  const [rcMonth, setRcMonth] = useState(initialDate.month);
  const [rcYear, setRcYear] = useState(initialDate.year);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const communes = useMemo(() => {
    const w = WILAYAS.find((w) => w.name === form.wilaya);
    return w?.communes || [];
  }, [form.wilaya]);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleWilayaChange = (value) => {
    setForm((prev) => ({ ...prev, wilaya: value, commune: "" }));
    setErrors((prev) => ({ ...prev, wilaya: "", commune: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "اسم فرع المصلحة المتعاقدة مطلوب";
    if (!form.wilaya) errs.wilaya = "الولاية مطلوبة";
    if (!form.commune) errs.commune = "البلدية مطلوبة";
    if (!form.address.trim()) errs.address = "العنوان الكامل مطلوب";
    if (!form.phone.trim()) errs.phone = "رقم الهاتف مطلوب";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const rc_date = rcDay && rcMonth && rcYear ? `${rcYear}-${pad(rcMonth)}-${pad(rcDay)}` : null;
      await onSave({ ...form, rc_date }, branch?.id);
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
            {isEdit ? "تعديل فرع المصلحة المتعاقدة" : "إضافة فرع جديد"}
          </h3>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              اسم فرع المصلحة المتعاقدة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="مثال: فرع مديرية التربية لولاية الجزائر"
              className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors text-slate-800 dark:text-slate-100 ${
                errors.name
                  ? "border-red-300 bg-red-50 focus:border-red-400"
                  : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-700"
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* wilaya / commune */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                الولاية <span className="text-red-500">*</span>
              </label>
              <select
                value={form.wilaya}
                onChange={(e) => handleWilayaChange(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors text-slate-800 dark:text-slate-100 ${
                  errors.wilaya
                    ? "border-red-300 bg-red-50 focus:border-red-400"
                    : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-700"
                }`}
              >
                <option value="">-- اختر الولاية --</option>
                {WILAYAS.map((w) => (
                  <option key={w.code} value={w.name}>{w.code} - {w.name}</option>
                ))}
              </select>
              {errors.wilaya && <p className="text-xs text-red-500 mt-1">{errors.wilaya}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                البلدية <span className="text-red-500">*</span>
              </label>
              <select
                value={form.commune}
                onChange={(e) => set("commune", e.target.value)}
                disabled={!form.wilaya}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors text-slate-800 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.commune
                    ? "border-red-300 bg-red-50 focus:border-red-400"
                    : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-700"
                }`}
              >
                <option value="">-- اختر البلدية --</option>
                {communes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.commune && <p className="text-xs text-red-500 mt-1">{errors.commune}</p>}
            </div>
          </div>

          {/* nis / nif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                الرقم الإحصائي (NIS) <span className="text-slate-400 dark:text-slate-500 font-normal">(اختياري)</span>
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.nis}
                onChange={(e) => set("nis", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm outline-none focus:bg-white dark:focus:bg-slate-700 transition-colors text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                الرقم الجبائي (NIF) <span className="text-slate-400 dark:text-slate-500 font-normal">(اختياري)</span>
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.nif}
                onChange={(e) => set("nif", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm outline-none focus:bg-white dark:focus:bg-slate-700 transition-colors text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* rc_number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              رقم السجل التجاري (RC) <span className="text-slate-400 dark:text-slate-500 font-normal">(اختياري)</span>
            </label>
            <input
              type="text"
              dir="ltr"
              value={form.rc_number}
              onChange={(e) => set("rc_number", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm outline-none focus:bg-white dark:focus:bg-slate-700 transition-colors text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* rc_date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              تاريخ السجل التجاري <span className="text-slate-400 dark:text-slate-500 font-normal">(اختياري)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={rcDay}
                onChange={(e) => setRcDay(parseInt(e.target.value, 10))}
                className="w-full px-2 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm outline-none focus:bg-white dark:focus:bg-slate-700 transition-colors text-slate-800 dark:text-slate-100"
              >
                <option value="">اليوم</option>
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                value={rcMonth}
                onChange={(e) => setRcMonth(parseInt(e.target.value, 10))}
                className="w-full px-2 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm outline-none focus:bg-white dark:focus:bg-slate-700 transition-colors text-slate-800 dark:text-slate-100"
              >
                <option value="">الشهر</option>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select
                value={rcYear}
                onChange={(e) => setRcYear(parseInt(e.target.value, 10))}
                className="w-full px-2 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm outline-none focus:bg-white dark:focus:bg-slate-700 transition-colors text-slate-800 dark:text-slate-100"
              >
                <option value="">السنة</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              العنوان الكامل <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              rows={3}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors text-slate-800 dark:text-slate-100 resize-none ${
                errors.address
                  ? "border-red-300 bg-red-50 focus:border-red-400"
                  : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-700"
              }`}
            />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
          </div>

          {/* phone / fax */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors text-slate-800 dark:text-slate-100 ${
                  errors.phone
                    ? "border-red-300 bg-red-50 focus:border-red-400"
                    : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-700"
                }`}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                رقم الفاكس
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.fax}
                onChange={(e) => set("fax", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm outline-none focus:bg-white dark:focus:bg-slate-700 transition-colors text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Submit error */}
          {errors.submit && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2.5 border border-red-100 dark:border-red-500/20">
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
