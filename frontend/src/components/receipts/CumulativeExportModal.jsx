"use client";
import { useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { getCumulativeItems } from "@/services/receiptsService";
import exportCumulativeExcel from "@/lib/exportCumulativeExcel";

const MONTHS = [
  "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
  "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR + 1 - 2020 + 1 }, (_, i) => 2020 + i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function pad(n) {
  return String(n).padStart(2, "0");
}

const today = new Date();
const firstDayOfMonth = { day: 1, month: today.getMonth() + 1, year: today.getFullYear() };
const todayDate = { day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() };

function DateSelectGroup({ label, day, month, year, onDayChange, onMonthChange, onYearChange, error }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={day}
          onChange={(e) => onDayChange(parseInt(e.target.value, 10))}
          className={`w-full px-2 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
            error
              ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
              : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
          }`}
        >
          <option value="">اليوم</option>
          {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={month}
          onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
          className={`w-full px-2 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
            error
              ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
              : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
          }`}
        >
          <option value="">الشهر</option>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select
          value={year}
          onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
          className={`w-full px-2 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
            error
              ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
              : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
          }`}
        >
          <option value="">السنة</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  );
}

export default function CumulativeExportModal({ dealId, branchId, onClose, onSuccess }) {
  const [startDay, setStartDay] = useState(firstDayOfMonth.day);
  const [startMonth, setStartMonth] = useState(firstDayOfMonth.month);
  const [startYear, setStartYear] = useState(firstDayOfMonth.year);

  const [endDay, setEndDay] = useState(todayDate.day);
  const [endMonth, setEndMonth] = useState(todayDate.month);
  const [endYear, setEndYear] = useState(todayDate.year);

  const [exportLanguage, setExportLanguage] = useState("AR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async () => {
    setError("");

    if (!(startDay && startMonth && startYear) || !(endDay && endMonth && endYear)) {
      setError("يرجى تحديد الصفقة والفرع وتاريخ البداية وتاريخ النهاية");
      return;
    }

    const startDate = `${startYear}-${pad(startMonth)}-${pad(startDay)}`;
    const endDate = `${endYear}-${pad(endMonth)}-${pad(endDay)}`;

    if (startDate > endDate) {
      setError("يجب أن يكون تاريخ البداية قبل تاريخ النهاية");
      return;
    }

    setLoading(true);
    try {
      const data = await getCumulativeItems(dealId, branchId, startDate, endDate);
      if (!data.items || data.items.length === 0) {
        setError("لا توجد مواد موزعة في هذه الفترة");
        return;
      }
      await exportCumulativeExcel(data, exportLanguage);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      const message = err.arabicMessage || err?.response?.data?.error || "حدث خطأ أثناء تصدير الملف";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">تحميل ملف Excel التراكمي</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 text-right mb-1">
            سيتم تحميل جميع المواد الموزعة للفرع المحدد خلال الفترة المحددة
          </p>

          <DateSelectGroup
            label="تاريخ البداية"
            day={startDay}
            month={startMonth}
            year={startYear}
            onDayChange={setStartDay}
            onMonthChange={setStartMonth}
            onYearChange={setStartYear}
            error={Boolean(error)}
          />

          <DateSelectGroup
            label="تاريخ النهاية"
            day={endDay}
            month={endMonth}
            year={endYear}
            onDayChange={setEndDay}
            onMonthChange={setEndMonth}
            onYearChange={setEndYear}
            error={Boolean(error)}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">لغة الملف</label>
            <div className="flex items-center gap-2">
              <select
                value={exportLanguage}
                onChange={(e) => setExportLanguage(e.target.value)}
                className="px-3 py-2 text-sm font-medium rounded-lg border
                           border-slate-200 dark:border-slate-600
                           bg-white dark:bg-slate-800
                           text-slate-700 dark:text-slate-200
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="AR">عربي AR</option>
                <option value="FR">فرنسي FR</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2.5 border border-red-100 dark:border-red-500/30">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 flex flex-col sm:flex-row-reverse gap-3">
          <button
            onClick={handleDownload}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-medium bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {loading ? "جارٍ التحميل..." : "تحميل"}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
