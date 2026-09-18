"use client";
import { useState } from "react";
import { Mail } from "lucide-react";

export default function SendBackupEmailModal({ backup, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(err.arabicMessage || err?.response?.data?.error || "حدث خطأ أثناء إرسال البريد الإلكتروني");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Mail size={24} className="text-green-600" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">
            هل تريد إرسال هذه النسخة عبر البريد الإلكتروني؟
          </h3>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100" dir="ltr">
            &quot;{backup.filename}&quot;
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm font-medium text-right">
                {error}
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-medium bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Mail size={16} />
              {loading ? "جارٍ الإرسال..." : "إرسال"}
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
