"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  ArrowRight, Activity, LogIn, Edit, Trash2, Search, X,
  ChevronDown, Loader2, Lightbulb,
} from "lucide-react";
import { getUsers, getUserLogs } from "@/services/activityLogsService";

const COLOR = "#7D3C98";

const MONTHS = [
  "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
  "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const ARABIC_WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function todayParts() {
  const d = new Date();
  return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
}

function threeDaysAgoParts() {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
}

function formatDateArabic(isoDate) {
  const [year, month, day] = isoDate.split("-").map((v) => parseInt(v, 10));
  const dateObj = new Date(year, month - 1, day);
  const weekday = ARABIC_WEEKDAYS[dateObj.getDay()];
  return `${weekday} ${day} ${MONTHS[month - 1]} ${year}`;
}

const ACTION_TYPE_DOT = {
  login: "bg-emerald-500",
  create: "bg-blue-500",
  update: "bg-orange-500",
  delete: "bg-red-500",
};

const ACTION_TYPE_BADGE = {
  login: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  create: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  update: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  delete: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
};

const ACTION_TYPE_LABELS = {
  login: "تسجيل دخول",
  logout: "تسجيل خروج",
  create: "إنشاء",
  update: "تعديل",
  delete: "حذف",
};

const SECTION_LABELS = {
  raw_materials: "المواد الأولية",
  categories: "الأصناف",
  contracting_authority: "المصلحة المتعاقدة",
  authority_branches: "فروع المصلحة",
  contractor: "المتعامل المتعاقد",
  deals: "الصفقات",
  receipts: "الوصولات",
  invoices: "الفواتير",
  users: "المستخدمين",
  auth: "المصادقة",
};

function actionTypeLabel(type) {
  return ACTION_TYPE_LABELS[type] || type;
}

function sectionLabel(section) {
  return SECTION_LABELS[section] || section;
}

const CARD_COLORS = {
  blue: { bg: "bg-blue-50 dark:bg-blue-500/10", icon: "text-blue-500", text: "text-blue-700 dark:text-blue-400" },
  green: { bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: "text-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
  orange: { bg: "bg-orange-50 dark:bg-orange-500/10", icon: "text-orange-500", text: "text-orange-700 dark:text-orange-400" },
  red: { bg: "bg-red-50 dark:bg-red-500/10", icon: "text-red-500", text: "text-red-700 dark:text-red-400" },
};

function SummaryCard({ color, Icon, value, label }) {
  const c = CARD_COLORS[color];
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.bg}`}>
        <Icon size={18} className={c.icon} />
      </div>
      <p className={`text-lg sm:text-xl font-bold mb-1 ${c.text}`}>{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{label}</p>
    </div>
  );
}

function UserSearchableSelect({ value, options, onChange }) {
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

  const selected = options.find((o) => String(o.user_id) === String(value));
  const getLabel = (o) => `${o.full_name} (${o.username})`;

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => getLabel(o).toLowerCase().includes(q));
  }, [query, options]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none transition-colors flex items-center justify-between gap-2"
      >
        <span className={selected ? "text-slate-800 dark:text-slate-100 truncate" : "text-slate-400 dark:text-slate-500 truncate"}>
          {selected ? getLabel(selected) : "كل المستخدمين"}
        </span>
        <ChevronDown size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-700">
            <Search size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اكتب للبحث..."
              className="bg-transparent text-sm w-full outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-slate-400 dark:text-slate-500 text-center">لا توجد نتائج</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.user_id}
                  type="button"
                  onClick={() => {
                    onChange(o.user_id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full text-right px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                    String(o.user_id) === String(value) ? "bg-slate-50 dark:bg-slate-700 font-medium" : "text-slate-700 dark:text-slate-300"
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

function DateSelectGroup({ day, month, year, onDayChange, onMonthChange, onYearChange, minYear, maxYear }) {
  const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
  const YEARS = [];
  for (let y = minYear; y <= maxYear; y++) YEARS.push(y);

  return (
    <div className="grid grid-cols-3 gap-2">
      <select
        value={day}
        onChange={(e) => onDayChange(parseInt(e.target.value, 10))}
        className="w-full px-2 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-100 outline-none transition-colors"
      >
        {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      <select
        value={month}
        onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
        className="w-full px-2 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-100 outline-none transition-colors"
      >
        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
      </select>
      <select
        value={year}
        onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
        className="w-full px-2 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-100 outline-none transition-colors"
      >
        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

export default function ActivityLogsPage({ onBack }) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const today = todayParts();
  const minDate = threeDaysAgoParts();

  const [day, setDay] = useState(today.day);
  const [month, setMonth] = useState(today.month);
  const [year, setYear] = useState(today.year);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    getUsers().then(setUsers).catch(() => {});
  }, []);

  const handleView = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    setError("");
    setHasSearched(true);
    try {
      const dateStr = `${year}-${pad(month)}-${pad(day)}`;
      const result = await getUserLogs(selectedUserId, dateStr);
      setData(result);
    } catch (err) {
      setError(err.arabicMessage || "حدث خطأ أثناء تحميل السجل");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedUserId("");
    setDay(today.day);
    setMonth(today.month);
    setYear(today.year);
    setData(null);
    setError("");
    setHasSearched(false);
  };

  const dateGroups = data ? Object.keys(data.logs_by_date).sort((a, b) => (a < b ? 1 : -1)) : [];

  return (
    <div className="space-y-4">

      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowRight size={16} />
        العودة إلى المستخدمين
      </button>

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: COLOR + "18" }}
        >
          <Activity size={18} style={{ color: COLOR }} />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">سجل عمليات المستخدمين</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">آخر 3 أيام فقط</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">اختر مستخدماً</label>
            <UserSearchableSelect value={selectedUserId} options={users} onChange={setSelectedUserId} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">تاريخ محدد</label>
            <DateSelectGroup
              day={day} month={month} year={year}
              onDayChange={setDay} onMonthChange={setMonth} onYearChange={setYear}
              minYear={minDate.year} maxYear={today.year}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            type="button"
            onClick={handleView}
            disabled={!selectedUserId || loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            عرض
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <X size={16} />
            إعادة تعيين
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2.5 border border-red-100 dark:border-red-500/30">
          {error}
        </p>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-slate-400 dark:text-slate-500" />
        </div>
      )}

      {!loading && data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard color="blue" Icon={Activity} value={data.summary.total_actions} label="إجمالي العمليات" />
            <SummaryCard color="green" Icon={LogIn} value={data.summary.logins} label="عمليات تسجيل الدخول" />
            <SummaryCard color="orange" Icon={Edit} value={data.summary.updates} label="عمليات التعديل" />
            <SummaryCard color="red" Icon={Trash2} value={data.summary.deletes} label="عمليات الحذف" />
          </div>

          {/* Logs grouped by date */}
          {dateGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                لا توجد عمليات مسجلة لهذا المستخدم في الفترة المحددة
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {dateGroups.map((dateKey) => (
                <div key={dateKey}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400 px-3">
                      {formatDateArabic(dateKey)}
                    </span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  </div>

                  <div className="relative pr-6 border-r-2 border-slate-200 dark:border-slate-700 space-y-3">
                    {data.logs_by_date[dateKey].map((log, idx) => (
                      <div key={idx} className="relative">
                        <div
                          className={`absolute -right-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${ACTION_TYPE_DOT[log.action_type] || "bg-slate-400"}`}
                        />
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 p-3 mr-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {log.action}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono shrink-0">
                              {log.local_time}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_TYPE_BADGE[log.action_type] || "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
                              {actionTypeLabel(log.action_type)}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {sectionLabel(log.section)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!loading && !data && hasSearched === false && (
        <div className="flex items-center gap-2 justify-end px-1">
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
            اختر مستخدماً ثم اضغط على زر العرض لعرض سجل العمليات
          </span>
          <Lightbulb size={16} className="text-yellow-500 shrink-0" />
        </div>
      )}
    </div>
  );
}
