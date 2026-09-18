"use client";
import { useState, useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  Clock,
  Info,
  Database,
  CheckCheck,
  Trash2,
  X,
} from "lucide-react";
import {
  getAll,
  markAsRead,
  markAllAsRead,
  remove,
  removeAll,
} from "@/services/notificationsService";

const COLOR = "#E67E22";

const TYPE_COLORS = {
  warning: "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  alert: "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  info: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  backup: "bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
};

const TYPE_ICONS = { warning: AlertTriangle, alert: Clock, info: Info, backup: Database };

const TABS = [
  { id: "all", label: "الكل" },
  { id: "unread", label: "غير المقروءة" },
  { id: "warning", label: "التحذيرات" },
  { id: "alert", label: "التنبيهات" },
  { id: "backup", label: "النسخ الاحتياطية" },
];

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// Notification links are plain section paths (e.g. "/deals/5", "/database-backup") —
// this app has no router, so we only use the first segment to switch sections.
function sectionFromLink(link) {
  if (!link) return null;
  return link.split("/").filter(Boolean)[0] || null;
}

export default function NotificationsPage({ activeService, onServiceChange, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await getAll();
      setNotifications(data);
    } catch (err) {
      showToast(err.arabicMessage || "حدث خطأ أثناء تحميل الإشعارات", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (activeService === "unread") setFilter("unread");
    else if (activeService === "all") setFilter("all");
  }, [activeService]);

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.is_read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleClick = (notification) => {
    if (!notification.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      markAsRead(notification.id).catch(() => {});
    }
    const sectionId = sectionFromLink(notification.link);
    if (sectionId) onNavigate?.(sectionId);
  };

  const handleDelete = async (e, notification) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    try {
      await remove(notification.id);
    } catch (err) {
      showToast(err.arabicMessage || "فشل حذف الإشعار", "error");
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await markAllAsRead();
      showToast("تم تعليم جميع الإشعارات كمقروءة");
    } catch (err) {
      showToast(err.arabicMessage || "فشل تعليم الإشعارات كمقروءة", "error");
      fetchNotifications();
    }
  };

  const handleClearRead = async () => {
    setNotifications((prev) => prev.filter((n) => !n.is_read));
    try {
      await removeAll();
      showToast("تم مسح الإشعارات المقروءة");
    } catch (err) {
      showToast(err.arabicMessage || "فشل مسح الإشعارات", "error");
      fetchNotifications();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: COLOR + "18" }}
          >
            <Bell size={18} style={{ color: COLOR }} />
          </div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            الإشعارات
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-medium bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <CheckCheck size={14} />
              تعليم الكل كمقروء
            </button>
          )}
          <button
            onClick={handleClearRead}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Trash2 size={14} />
            مسح المقروءة
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === tab.id
                ? "text-white"
                : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
            }`}
            style={filter === tab.id ? { backgroundColor: COLOR } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-[3px] border-slate-100 dark:border-slate-700 border-t-slate-400 dark:border-t-slate-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Bell size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 dark:text-slate-500">
              لا توجد إشعارات في هذا القسم
            </p>
          </div>
        ) : (
          filtered.map((notification) => {
            const TypeIcon = TYPE_ICONS[notification.type] || Info;
            return (
              <div
                key={notification.id}
                onClick={() => handleClick(notification)}
                className={`group flex gap-3 p-4 border-b border-slate-100 dark:border-slate-700 last:border-b-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                  !notification.is_read ? "bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    TYPE_COLORS[notification.type] || TYPE_COLORS.info
                  }`}
                >
                  <TypeIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {notification.title}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                    {formatDateTime(notification.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  )}
                  <button
                    onClick={(e) => handleDelete(e, notification)}
                    className="p-1.5 rounded-md text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

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
