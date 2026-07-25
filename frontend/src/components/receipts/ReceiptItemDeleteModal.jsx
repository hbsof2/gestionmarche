"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export default function ReceiptItemDeleteModal({ item, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(err.arabicMessage || err?.response?.data?.error || "حدث خطأ أثناء الحذف");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">تأكيد الحذف</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">هل أنت متأكد من حذف المادة:</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">&quot;{item.name_ar}&quot;</p>
          <p className="text-xs text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 rounded-lg px-3 py-2 mb-2">
            سيتم استعادة الكمية للصفقة تلقائياً
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">لا يمكن التراجع عن هذا الإجراء</p>

          {error && (
            <div className="mt-3 mb-3 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm font-medium text-right">
                {error}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "جارٍ الحذف..." : "حذف"}
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
