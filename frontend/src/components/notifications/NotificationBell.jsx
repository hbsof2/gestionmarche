"use client";
import { useState, useEffect, useRef } from "react";
import {
  Bell,
  AlertTriangle,
  Clock,
  Info,
  Database,
  Loader2,
} from "lucide-react";
import {
  getAll,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  removeAll,
} from "@/services/notificationsService";

const TYPE_COLORS = {
  warning: "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  alert: "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  info: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  backup: "bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
};

const TYPE_ICONS = { warning: AlertTriangle, alert: Clock, info: Info, backup: Database };

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  return `منذ ${days} يوم`;
}

// Notification links are plain section paths (e.g. "/deals/5", "/database-backup") —
// this app has no router, so we only use the first segment to switch sections.
function sectionFromLink(link) {
  if (!link) return null;
  return link.split("/").filter(Boolean)[0] || null;
}

export default function NotificationBell({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // badge just keeps its last known value
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = async () => {
    const next = !open;
    setOpen(next);
    if (!next) return;

    setLoading(true);
    try {
      const { data, unread_count } = await getAll();
      setNotifications(data.slice(0, 5));
      setUnreadCount(unread_count);
    } catch {
      // keep whatever was already shown
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      markAsRead(notification.id).catch(() => {});
    }
    setOpen(false);
    const sectionId = sectionFromLink(notification.link);
    if (sectionId) onNavigate?.(sectionId);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    markAllAsRead().catch(() => {});
  };

  const handleClearRead = async () => {
    setNotifications((prev) => prev.filter((n) => !n.is_read));
    removeAll().catch(() => {});
  };

  const handleViewAll = () => {
    setOpen(false);
    onNavigate?.("notifications");
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={toggleDropdown}
        title="الإشعارات"
        className="relative p-1.5 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -left-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-[calc(100vw-2rem)] max-w-[380px] sm:w-[380px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                الإشعارات
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  تعليم الكل كمقروء
                </button>
              )}
              <button
                onClick={handleClearRead}
                className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:underline"
              >
                مسح المقروءة
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-slate-300 dark:text-slate-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400 dark:text-slate-500">لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const TypeIcon = TYPE_ICONS[notification.type] || Info;
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex gap-3 p-3 border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                      !notification.is_read ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        TYPE_COLORS[notification.type] || TYPE_COLORS.info
                      }`}
                    >
                      <TypeIcon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {timeAgo(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <button
            onClick={handleViewAll}
            className="w-full py-2.5 text-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-t border-slate-100 dark:border-slate-700"
          >
            عرض كل الإشعارات ←
          </button>
        </div>
      )}
    </div>
  );
}
