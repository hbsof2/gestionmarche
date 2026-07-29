"use client";
import { useState } from "react";
import { Trash2, Lock } from "lucide-react";
import { getUser } from "@/lib/auth";

export default function InvoiceDeleteModal({ invoice, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentUser = getUser();
  const isOwner = invoice.created_by === currentUser?.id || currentUser?.role === "admin";

  const handleConfirm = async () => {
    if (!isOwner) return;
    setLoading(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      const message =
        err?.response?.status === 403
          ? err.arabicMessage || err?.response?.data?.error || "لا يمكنك حذف هذه الفاتورة لأنها أنشئت بواسطة مستخدم آخر"
          : err.arabicMessage || err?.response?.data?.error || "حدث خطأ أثناء الحذف";
      setError(message);
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
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">هل أنت متأكد من حذف الفاتورة:</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">&quot;{invoice.reference}&quot;</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">لا يمكن التراجع عن هذا الإجراء</p>

          {!isOwner && (
            <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
              <Lock size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-amber-700 dark:text-amber-400 text-sm font-bold text-right">
                لا يمكنك حذف هذه الفاتورة لأنها أنشئت بواسطة مستخدم آخر
              </p>
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm font-medium text-right">
                {error}
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleConfirm}
              disabled={loading || !isOwner}
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
