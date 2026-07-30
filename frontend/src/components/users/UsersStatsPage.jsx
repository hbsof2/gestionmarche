"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  ArrowRight, BarChart3, Handshake, FileText, Receipt, Package,
  Loader2, ChevronDown, Search, LogIn,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { getUsersStats, getSingleUserStats } from "@/services/usersService";

const COLOR = "#7D3C98";

const MONTHS = [
  "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
  "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const PIE_COLORS = [
  "#2563EB", "#16A34A", "#9333EA", "#EA580C",
  "#0891B2", "#DC2626", "#CA8A04", "#DB2777",
  "#65A30D", "#7C3AED", "#0369A1", "#B45309",
];

function formatDateArabic(isoDate) {
  if (!isoDate) return "—";
  const datePart = String(isoDate).split("T")[0];
  const [year, month, day] = datePart.split("-");
  return `${parseInt(day, 10)} ${MONTHS[parseInt(month, 10) - 1]} ${year}`;
}

function formatMonthArabic(yyyyMm) {
  const [year, month] = yyyyMm.split("-");
  return `${MONTHS[parseInt(month, 10) - 1]} ${year}`;
}

const CARD_COLORS = {
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: "text-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
  blue: { bg: "bg-blue-50 dark:bg-blue-500/10", icon: "text-blue-500", text: "text-blue-700 dark:text-blue-400" },
  purple: { bg: "bg-purple-50 dark:bg-purple-500/10", icon: "text-purple-500", text: "text-purple-700 dark:text-purple-400" },
  orange: { bg: "bg-orange-50 dark:bg-orange-500/10", icon: "text-orange-500", text: "text-orange-700 dark:text-orange-400" },
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

function RoleBadge({ role }) {
  return role === "admin" ? (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
      مدير
    </span>
  ) : (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
      مستخدم
    </span>
  );
}

function StatusBadge({ isActive }) {
  return isActive ? (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
      نشط
    </span>
  ) : (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
      معطل
    </span>
  );
}

function UserPickerSelect({ value, options, onChange }) {
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
          {selected ? getLabel(selected) : "اختر مستخدماً لعرض إحصائياته"}
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
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full text-right px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                    String(o.id) === String(value) ? "bg-slate-50 dark:bg-slate-700 font-medium" : "text-slate-700 dark:text-slate-300"
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

function CenterLabel({ total }) {
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
      <tspan x="50%" dy="-10" fontSize="24" fontWeight="bold" fill="currentColor">
        {total}
      </tspan>
      <tspan x="50%" dy="25" fontSize="12" fill="currentColor">
        إجمالي العمليات
      </tspan>
    </text>
  );
}

export default function UsersStatsPage({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [totals, setTotals] = useState(null);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [userStats, setUserStats] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getUsersStats();
        setUsers(result.users);
        setTotals(result.totals);
      } catch (err) {
        setError(err.arabicMessage || "حدث خطأ أثناء تحميل الإحصائيات");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    (async () => {
      setUserLoading(true);
      setUserError("");
      try {
        const result = await getSingleUserStats(selectedUserId);
        setUserStats(result);
      } catch (err) {
        setUserError(err.arabicMessage || "حدث خطأ أثناء تحميل إحصائيات المستخدم");
        setUserStats(null);
      } finally {
        setUserLoading(false);
      }
    })();
  }, [selectedUserId]);

  const totalActions = useMemo(
    () => users.reduce((sum, u) => sum + u.deals_count + u.receipts_count + u.invoices_count + u.materials_count, 0),
    [users]
  );

  const rowsWithTotal = useMemo(
    () =>
      users.map((u) => {
        const total = u.deals_count + u.receipts_count + u.invoices_count + u.materials_count;
        const percentage = totalActions > 0 ? ((total / totalActions) * 100).toFixed(1) : "0.0";
        return { ...u, total, percentage };
      }),
    [users, totalActions]
  );

  const pieData = useMemo(
    () =>
      rowsWithTotal
        .filter((u) => u.total > 0)
        .map((u) => ({ name: u.full_name, value: u.total, percentage: u.percentage })),
    [rowsWithTotal]
  );

  const monthlyData = useMemo(() => {
    if (!userStats) return [];
    return userStats.monthly_activity.map((m) => ({
      month: formatMonthArabic(m.month),
      deals: m.deals,
      receipts: m.receipts,
      invoices: m.invoices,
    }));
  }, [userStats]);

  return (
    <div className="space-y-4">

      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowRight size={16} />
        العودة
      </button>

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: COLOR + "18" }}
        >
          <BarChart3 size={18} style={{ color: COLOR }} />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">إحصائيات المستخدمين</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">منذ بداية استخدام المنصة</p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2.5 border border-red-100 dark:border-red-500/30">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-slate-400 dark:text-slate-500" />
        </div>
      ) : (
        !error && (
          <>
            {/* Section 1: Global stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard color="emerald" Icon={Handshake} value={totals.total_deals} label="إجمالي الصفقات المنشأة" />
              <SummaryCard color="blue" Icon={FileText} value={totals.total_receipts} label="إجمالي الوصولات المنشأة" />
              <SummaryCard color="purple" Icon={Receipt} value={totals.total_invoices} label="إجمالي الفواتير المنشأة" />
              <SummaryCard color="orange" Icon={Package} value={totals.total_materials} label="إجمالي المواد المضافة" />
            </div>

            {/* Section 2: Pie chart + users table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">نسبة مساهمة كل مستخدم</h3>
                {pieData.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-16">لا توجد بيانات لعرضها</p>
                ) : (
                  <div className="text-slate-800 dark:text-slate-100">
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={140}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => [
                          `${props.payload.percentage}% (${value} عملية)`,
                          name,
                        ]}
                      />
                      <Legend
                        formatter={(value, entry) => `${value} - ${entry.payload.percentage}%`}
                      />
                      <CenterLabel total={totalActions} />
                    </PieChart>
                  </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <table className="table-fixed w-full">
                    <thead>
                      <tr style={{ backgroundColor: COLOR + "18" }}>
                        <th className="font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap w-36 text-slate-800 dark:text-slate-100">المستخدم</th>
                        <th className="font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap w-20 text-slate-800 dark:text-slate-100">الصفقات</th>
                        <th className="font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap w-20 text-slate-800 dark:text-slate-100">الوصولات</th>
                        <th className="font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap w-20 text-slate-800 dark:text-slate-100">الفواتير</th>
                        <th className="font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap w-20 text-slate-800 dark:text-slate-100">المواد</th>
                        <th className="font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap w-24 text-slate-800 dark:text-slate-100">المجموع</th>
                        <th className="font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap w-24 text-slate-800 dark:text-slate-100">النسبة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rowsWithTotal.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-3 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                            لا يوجد مستخدمون
                          </td>
                        </tr>
                      ) : (
                        rowsWithTotal.map((u, index) => (
                          <tr key={u.id} className="border-b border-slate-100 dark:border-slate-700">
                            <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                              <div className="flex items-center gap-2">
                                <span className="truncate">{u.full_name}</span>
                                <RoleBadge role={u.role} />
                              </div>
                            </td>
                            <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap">{u.deals_count}</td>
                            <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap">{u.receipts_count}</td>
                            <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap">{u.invoices_count}</td>
                            <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap">{u.materials_count}</td>
                            <td className="font-bold text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap">{u.total}</td>
                            <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                                  <div
                                    className="h-1.5 rounded-full"
                                    style={{ width: `${u.percentage}%`, backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                  />
                                </div>
                                <span className="text-xs font-bold w-10 text-right shrink-0">{u.percentage}%</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Section 3: Individual user stats */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">إحصائيات مستخدم محدد</h3>

              <div className="max-w-md">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">اختر مستخدماً</label>
                <UserPickerSelect value={selectedUserId} options={users} onChange={setSelectedUserId} />
              </div>

              {userError && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2.5 border border-red-100 dark:border-red-500/30">
                  {userError}
                </p>
              )}

              {userLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={22} className="animate-spin text-slate-400 dark:text-slate-500" />
                </div>
              )}

              {!userLoading && userStats && (
                <div className="space-y-4">
                  {/* User info card */}
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
                      style={{ backgroundColor: COLOR }}
                    >
                      {userStats.user.full_name?.charAt(0) || "؟"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-bold text-slate-800 dark:text-slate-100">{userStats.user.full_name}</p>
                        <RoleBadge role={userStats.user.role} />
                        <StatusBadge isActive={userStats.user.is_active} />
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">@{userStats.user.username}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>تاريخ أول استخدام: {formatDateArabic(userStats.stats.first_use_date)}</span>
                        <span className="flex items-center gap-1">
                          <LogIn size={12} />
                          عدد مرات الدخول: {userStats.stats.total_logins}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Individual stats cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard color="emerald" Icon={Handshake} value={userStats.stats.deals_count} label="صفقاته" />
                    <SummaryCard color="blue" Icon={FileText} value={userStats.stats.receipts_count} label="وصولاته" />
                    <SummaryCard color="purple" Icon={Receipt} value={userStats.stats.invoices_count} label="فواتيره" />
                    <SummaryCard color="orange" Icon={Package} value={userStats.stats.materials_count} label="موادّه" />
                  </div>

                  {/* Monthly activity chart */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">النشاط الشهري (آخر 6 أشهر)</h4>
                    {monthlyData.length === 0 ? (
                      <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">لا توجد بيانات نشاط لعرضها</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="deals" name="صفقات" fill="#16A34A" />
                          <Bar dataKey="receipts" name="وصولات" fill="#2563EB" />
                          <Bar dataKey="invoices" name="فواتير" fill="#9333EA" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )
      )}
    </div>
  );
}
