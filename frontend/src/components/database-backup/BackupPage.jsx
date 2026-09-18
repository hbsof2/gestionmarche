"use client";
import { useState, useEffect } from "react";
import {
  Database, Download, Mail, Info, ShieldAlert, AlertTriangle, Loader2,
} from "lucide-react";
import BackupsList from "./BackupsList";
import SendBackupEmailModal from "./SendBackupEmailModal";
import BackupDeleteModal from "./BackupDeleteModal";
import { getAll, createBackup, sendEmail, downloadBackup, remove } from "@/services/backupsService";
import { getUser } from "@/lib/auth";

const COLOR = "#1A5276";

const INFO_ITEMS = [
  "النسخ تُحذف تلقائياً بعد 5 أيام",
  "احتفظ بنسخة على جهازك أو في مكان آمن",
  "يُنصح بإنشاء نسخة احتياطية أسبوعياً على الأقل",
  "الملف من نوع SQL يحتوي على جميع بيانات المنصة",
];

export default function BackupPage({ activeService, onServiceChange }) {
  const isAdmin = getUser()?.role === "admin";

  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [creating, setCreating] = useState(false);
  const [sendingCard, setSendingCard] = useState(false);

  const [emailTarget, setEmailTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const rows = await getAll();
      setBackups(rows);
    } catch (err) {
      showToast(err.arabicMessage || "حدث خطأ أثناء تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchBackups();
  }, [isAdmin]);

  const handleCreateAndDownload = async () => {
    setCreating(true);
    try {
      const backup = await createBackup();
      await downloadBackup(backup.id, backup.filename);
      showToast("تم إنشاء النسخة الاحتياطية وبدأ التحميل");
      fetchBackups();
    } catch (err) {
      showToast(err.arabicMessage || "فشل إنشاء النسخة الاحتياطية، تحقق من إعدادات الخادم", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateAndSend = async () => {
    setSendingCard(true);
    try {
      console.log("Step 1: Creating backup...");
      const backup = await createBackup();
      console.log("Backup created:", backup);

      console.log("Step 2: Sending email for backup id:", backup.id);
      const result = await sendEmail(backup.id);
      console.log("Send result:", result);

      showToast("تم إرسال النسخة الاحتياطية بنجاح");
      fetchBackups();
    } catch (err) {
      console.error("Error in handleCreateAndSend:", err);
      console.error("Error response:", err.response?.data);
      showToast(err.arabicMessage || "فشل إرسال البريد الإلكتروني، تحقق من إعدادات SMTP", "error");
    } finally {
      setSendingCard(false);
    }
  };

  const handleDownloadRow = async (backup) => {
    try {
      await downloadBackup(backup.id, backup.filename);
    } catch (err) {
      showToast(err.arabicMessage || "فشل تحميل النسخة الاحتياطية", "error");
    }
  };

  const handleSendRowEmail = async () => {
    await sendEmail(emailTarget.id);
    showToast("تم إرسال النسخة الاحتياطية بنجاح");
    setEmailTarget(null);
    fetchBackups();
  };

  const handleDeleteConfirm = async () => {
    await remove(deleteTarget.id);
    showToast("تم حذف النسخة الاحتياطية بنجاح");
    setDeleteTarget(null);
    fetchBackups();
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
          <ShieldAlert size={24} className="text-red-500" />
        </div>
        <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">
          هذا القسم متاح للمدير الرئيسي فقط
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: COLOR + "18" }}
          >
            <Database size={18} style={{ color: COLOR }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">حفظ قاعدة المعطيات</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">متاح للمدير الرئيسي فقط</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 shrink-0 w-fit">
          <AlertTriangle size={13} />
          النسخ تُحذف تلقائياً بعد 5 أيام
        </span>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Card 1 - create + download */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5 flex flex-col">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-blue-50 dark:bg-blue-500/10">
            <Database size={18} className="text-blue-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">إنشاء نسخة احتياطية</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 flex-1">
            إنشاء نسخة من قاعدة المعطيات وتحميلها مباشرة
          </p>
          <button
            onClick={handleCreateAndDownload}
            disabled={creating}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {creating ? "جارٍ الإنشاء..." : "إنشاء وتحميل"}
          </button>
        </div>

        {/* Card 2 - create + email */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5 flex flex-col">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-green-50 dark:bg-green-500/10">
            <Mail size={18} className="text-green-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">إرسال عبر البريد الإلكتروني</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 flex-1">
            سيتم الإرسال إلى البريد الإلكتروني المحدد في إعدادات الخادم
          </p>
          <button
            onClick={handleCreateAndSend}
            disabled={sendingCard}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingCard ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
            {sendingCard ? "جارٍ الإرسال..." : "إنشاء وإرسال"}
          </button>
        </div>

        {/* Card 3 - info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-slate-100 dark:bg-slate-700">
            <Info size={18} className="text-slate-500 dark:text-slate-300" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">معلومات مهمة</h3>
          <ul className="space-y-1.5">
            {INFO_ITEMS.map((item, i) => (
              <li key={i} className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-1.5">
                <span className="text-slate-300 dark:text-slate-600 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Previous backups */}
      <div>
        <div className="flex items-baseline gap-2 mb-2 px-1">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">النسخ السابقة</h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            ({backups.length} نسخة - تُحذف تلقائياً بعد 5 أيام)
          </span>
        </div>
        <BackupsList
          backups={backups}
          loading={loading}
          onDownload={handleDownloadRow}
          onSendEmail={setEmailTarget}
          onDelete={setDeleteTarget}
        />
      </div>

      {/* Send email modal (per-row) */}
      {emailTarget && (
        <SendBackupEmailModal
          backup={emailTarget}
          onConfirm={handleSendRowEmail}
          onCancel={() => setEmailTarget(null)}
        />
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <BackupDeleteModal
          backup={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-300 whitespace-nowrap ${
            toast.type === "error" ? "bg-red-500" : "bg-green-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
