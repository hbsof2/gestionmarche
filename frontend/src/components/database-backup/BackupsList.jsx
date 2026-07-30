"use client";
import { Database, Download, Mail, Trash2 } from "lucide-react";

const COLOR = "#1A5276";

function formatDateTime(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function BackupsList({ backups, loading, onDownload, onSendEmail, onDelete }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div
            className="w-8 h-8 rounded-full border-2 border-slate-100 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: COLOR, borderWidth: "3px" }}
          />
        </div>
      ) : backups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center mb-4">
            <Database size={22} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">لا توجد نسخ احتياطية سابقة</p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="table-fixed w-full min-w-[900px] text-sm">
            <thead>
              <tr style={{ backgroundColor: COLOR + "12" }} className="border-b border-slate-100 dark:border-slate-700">
                <th className="w-12 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide" style={{ color: COLOR }}>رقم</th>
                <th className="w-56 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide" style={{ color: COLOR }}>اسم الملف</th>
                <th className="w-24 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide" style={{ color: COLOR }}>الحجم</th>
                <th className="w-40 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide hidden md:table-cell" style={{ color: COLOR }}>أُرسل إلى</th>
                <th className="w-32 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide hidden lg:table-cell" style={{ color: COLOR }}>أنشئ بواسطة</th>
                <th className="w-40 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide hidden sm:table-cell" style={{ color: COLOR }}>تاريخ الإنشاء</th>
                <th className="w-28 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide" style={{ color: COLOR }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-700 transition-colors">
                  <td className="w-12 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 font-mono">{b.id}</td>
                  <td className="w-56 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100" dir="ltr">{b.filename}</td>
                  <td className="w-24 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100" dir="ltr">{b.file_size_formatted}</td>
                  <td className="w-40 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 hidden md:table-cell" dir="ltr">
                    {b.email_sent_to || <span className="text-slate-300 dark:text-slate-600">—</span>}
                  </td>
                  <td className="w-32 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 hidden lg:table-cell">{b.created_by_name || "-"}</td>
                  <td className="w-40 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 hidden sm:table-cell" dir="ltr">{formatDateTime(b.created_at)}</td>
                  <td className="w-28 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onDownload(b)}
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                        title="تحميل"
                      >
                        <Download size={15} />
                      </button>
                      <button
                        onClick={() => onSendEmail(b)}
                        className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors"
                        title="إرسال عبر البريد الإلكتروني"
                      >
                        <Mail size={15} />
                      </button>
                      <button
                        onClick={() => onDelete(b)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
