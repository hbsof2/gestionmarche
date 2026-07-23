"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { X, ChevronDown, Search } from "lucide-react";
import { getAll as getContractors } from "@/services/contractorsService";
import { getAll as getAuthorities } from "@/services/contractingAuthorityService";

const COLOR = "#1E8449";

const MONTHS = [
  "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
  "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR + 5 - 2000 + 1 }, (_, i) => 2000 + i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function pad(n) {
  return String(n).padStart(2, "0");
}

function parseDate(isoDate) {
  if (!isoDate) return { day: "", month: "", year: "" };
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return { day: parseInt(day, 10), month: parseInt(month, 10), year: parseInt(year, 10) };
}

function SearchableSelect({ value, options, getLabel, placeholder, error, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => String(o.id) === String(value));

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => getLabel(o).toLowerCase().includes(q));
  }, [query, options, getLabel]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors flex items-center justify-between gap-2 ${
          error
            ? "border-red-300 bg-red-50"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <span className={selected ? "text-slate-800" : "text-slate-400"}>
          {selected ? getLabel(selected) : placeholder}
        </span>
        <ChevronDown size={16} className="text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اكتب للبحث..."
              className="bg-transparent text-sm w-full outline-none text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-slate-400 text-center">لا توجد نتائج</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full text-right px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                    String(o.id) === String(value) ? "bg-slate-50 font-medium" : "text-slate-700"
                  }`}
                >
                  {getLabel(o)}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DealForm({ deal, onSave, onCancel }) {
  const isEdit = Boolean(deal);
  const initialStartDate = parseDate(deal?.start_date);
  const initialEndDate = parseDate(deal?.end_date);

  const [form, setForm] = useState({
    reference: deal?.reference || "",
    contractor_id: deal?.contractor_id || "",
    authority_id: deal?.authority_id || "",
    total_amount: deal?.total_amount ?? "",
  });
  const [startDay, setStartDay] = useState(initialStartDate.day);
  const [startMonth, setStartMonth] = useState(initialStartDate.month);
  const [startYear, setStartYear] = useState(initialStartDate.year);
  const [endDay, setEndDay] = useState(initialEndDate.day);
  const [endMonth, setEndMonth] = useState(initialEndDate.month);
  const [endYear, setEndYear] = useState(initialEndDate.year);

  const [contractors, setContractors] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getContractors(1, "", 1000).then((res) => setContractors(res.data || []));
    getAuthorities(1, "", 1000).then((res) => setAuthorities(res.data || []));
  }, []);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.reference.trim()) errs.reference = "مرجع الصفقة مطلوب";
    if (!form.contractor_id) errs.contractor_id = "المتعامل المتعاقد مطلوب";
    if (!form.authority_id) errs.authority_id = "المصلحة المتعاقدة مطلوبة";
    if (!(startDay && startMonth && startYear)) errs.start_date = "تاريخ بداية الصفقة مطلوب";
    if (!(endDay && endMonth && endYear)) errs.end_date = "تاريخ نهاية الصفقة مطلوب";
    if (startDay && startMonth && startYear && endDay && endMonth && endYear) {
      const start = new Date(startYear, startMonth - 1, startDay);
      const end = new Date(endYear, endMonth - 1, endDay);
      if (end <= start) errs.end_date = "يجب أن يكون تاريخ النهاية بعد تاريخ البداية";
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const start_date = `${startYear}-${pad(startMonth)}-${pad(startDay)}`;
      const end_date = `${endYear}-${pad(endMonth)}-${pad(endDay)}`;
      await onSave(
        {
          reference: form.reference.trim(),
          contractor_id: form.contractor_id,
          authority_id: form.authority_id,
          start_date,
          end_date,
          total_amount: form.total_amount === "" ? null : form.total_amount,
        },
        deal?.id
      );
    } catch (err) {
      setErrors({ submit: err.arabicMessage || err.response?.data?.error || "حدث خطأ أثناء الحفظ" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-base font-bold text-slate-800">
            {isEdit ? "تعديل الصفقة" : "إضافة صفقة جديدة"}
          </h3>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* reference */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              تعيين الصفقة / المرجع <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              dir="ltr"
              value={form.reference}
              onChange={(e) => set("reference", e.target.value)}
              placeholder="مثال: صفقة-2024-001"
              className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors text-right ${
                errors.reference
                  ? "border-red-300 bg-red-50 focus:border-red-400"
                  : "border-slate-200 bg-slate-50 focus:bg-white"
              }`}
            />
            {errors.reference && <p className="text-xs text-red-500 mt-1">{errors.reference}</p>}
          </div>

          {/* contractor */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              المتعامل المتعاقد <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              value={form.contractor_id}
              options={contractors}
              getLabel={(c) => `${c.designation} - ${c.full_name}`}
              placeholder="-- اختر المتعامل المتعاقد --"
              error={errors.contractor_id}
              onChange={(id) => set("contractor_id", id)}
            />
            {errors.contractor_id && <p className="text-xs text-red-500 mt-1">{errors.contractor_id}</p>}
          </div>

          {/* authority */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              المصلحة المتعاقدة <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              value={form.authority_id}
              options={authorities}
              getLabel={(a) => a.name}
              placeholder="-- اختر المصلحة المتعاقدة --"
              error={errors.authority_id}
              onChange={(id) => set("authority_id", id)}
            />
            {errors.authority_id && <p className="text-xs text-red-500 mt-1">{errors.authority_id}</p>}
          </div>

          {/* start_date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              تاريخ بداية الصفقة <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={startDay}
                onChange={(e) => setStartDay(parseInt(e.target.value, 10))}
                className={`w-full px-2 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                  errors.start_date
                    ? "border-red-300 bg-red-50 focus:border-red-400"
                    : "border-slate-200 bg-slate-50 focus:bg-white"
                }`}
              >
                <option value="">اليوم</option>
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                value={startMonth}
                onChange={(e) => setStartMonth(parseInt(e.target.value, 10))}
                className={`w-full px-2 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                  errors.start_date
                    ? "border-red-300 bg-red-50 focus:border-red-400"
                    : "border-slate-200 bg-slate-50 focus:bg-white"
                }`}
              >
                <option value="">الشهر</option>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select
                value={startYear}
                onChange={(e) => setStartYear(parseInt(e.target.value, 10))}
                className={`w-full px-2 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                  errors.start_date
                    ? "border-red-300 bg-red-50 focus:border-red-400"
                    : "border-slate-200 bg-slate-50 focus:bg-white"
                }`}
              >
                <option value="">السنة</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {errors.start_date && <p className="text-xs text-red-500 mt-1">{errors.start_date}</p>}
          </div>

          {/* end_date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              تاريخ نهاية الصفقة <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={endDay}
                onChange={(e) => setEndDay(parseInt(e.target.value, 10))}
                className={`w-full px-2 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                  errors.end_date
                    ? "border-red-300 bg-red-50 focus:border-red-400"
                    : "border-slate-200 bg-slate-50 focus:bg-white"
                }`}
              >
                <option value="">اليوم</option>
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                value={endMonth}
                onChange={(e) => setEndMonth(parseInt(e.target.value, 10))}
                className={`w-full px-2 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                  errors.end_date
                    ? "border-red-300 bg-red-50 focus:border-red-400"
                    : "border-slate-200 bg-slate-50 focus:bg-white"
                }`}
              >
                <option value="">الشهر</option>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select
                value={endYear}
                onChange={(e) => setEndYear(parseInt(e.target.value, 10))}
                className={`w-full px-2 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                  errors.end_date
                    ? "border-red-300 bg-red-50 focus:border-red-400"
                    : "border-slate-200 bg-slate-50 focus:bg-white"
                }`}
              >
                <option value="">السنة</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {errors.end_date && <p className="text-xs text-red-500 mt-1">{errors.end_date}</p>}
          </div>

          {/* total_amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              المبلغ الإجمالي للصفقة بالدينار الجزائري <span className="text-slate-400 font-normal">(اختياري)</span>
            </label>
            <input
              type="number"
              dir="ltr"
              step="0.01"
              min="0"
              value={form.total_amount}
              onChange={(e) => set("total_amount", e.target.value)}
              placeholder="مثال: 1500000.00"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white transition-colors text-right"
            />
          </div>

          {/* Submit error */}
          {errors.submit && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2.5 border border-red-100">
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
              className="flex-1 py-2.5 rounded-xl text-slate-600 text-sm font-medium bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-60"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
