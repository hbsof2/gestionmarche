"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Handshake, FileText, Receipt, UserCheck, Building2, GitBranch,
  Package, Users, BarChart3, Clock, PieChart as PieChartIcon,
  AlertTriangle, Loader2, CalendarClock,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  getStats, getMonthlyActivity, getRecentActivity, getAlerts,
  getMaterialsDistribution,
} from "@/services/dashboardService";
import { getUser } from "@/lib/auth";

const MONTHS = [
  "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
  "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const WEEKDAYS = [
  "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت",
];

const PIE_COLORS = [
  "#2563EB", "#16A34A", "#9333EA", "#EA580C",
  "#0891B2", "#DC2626", "#CA8A04", "#DB2777",
];

function formatDate(isoDate) {
  if (!isoDate) return "-";
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function formatAmount(amount) {
  if (amount === null || amount === undefined || amount === "") return "-";
  return Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatMonthArabic(yyyyMm) {
  const [year, month] = yyyyMm.split("-");
  return `${MONTHS[parseInt(month, 10) - 1]} ${year}`;
}

function formatTodayArabic() {
  const now = new Date();
  const weekday = WEEKDAYS[now.getDay()];
  const day = now.getDate();
  const month = MONTHS[now.getMonth()];
  const year = now.getFullYear();
  return `${weekday}، ${day} ${month} ${year}`;
}

function processMonthlyData(activity) {
  const map = {};
  activity.forEach((row) => {
    if (!map[row.month]) {
      map[row.month] = { month: row.month, deals: 0, receipts: 0, invoices: 0 };
    }
    map[row.month][`${row.type}s`] = row.count;
  });
  return Object.values(map)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((row) => ({ ...row, month: formatMonthArabic(row.month) }));
}

const CARD_COLORS = {
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: "text-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
  blue: { bg: "bg-blue-50 dark:bg-blue-500/10", icon: "text-blue-500", text: "text-blue-700 dark:text-blue-400" },
  purple: { bg: "bg-purple-50 dark:bg-purple-500/10", icon: "text-purple-500", text: "text-purple-700 dark:text-purple-400" },
  orange: { bg: "bg-orange-50 dark:bg-orange-500/10", icon: "text-orange-500", text: "text-orange-700 dark:text-orange-400" },
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-500/10", icon: "text-indigo-500", text: "text-indigo-700 dark:text-indigo-400" },
  cyan: { bg: "bg-cyan-50 dark:bg-cyan-500/10", icon: "text-cyan-500", text: "text-cyan-700 dark:text-cyan-400" },
  yellow: { bg: "bg-yellow-50 dark:bg-yellow-500/10", icon: "text-yellow-600 dark:text-yellow-500", text: "text-yellow-700 dark:text-yellow-400" },
  rose: { bg: "bg-rose-50 dark:bg-rose-500/10", icon: "text-rose-500", text: "text-rose-700 dark:text-rose-400" },
};

function StatCard({ color, Icon, label, value }) {
  const c = CARD_COLORS[color];
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.bg}`}>
        <Icon size={18} className={c.icon} />
      </div>
      <p className={`text-xl sm:text-2xl font-bold mb-1 ${c.text}`}>{value ?? 0}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{label}</p>
    </div>
  );
}

const STAT_CARDS = [
  { key: "total_deals", label: "الصفقات", icon: Handshake, color: "emerald" },
  { key: "total_receipts", label: "الوصولات", icon: FileText, color: "blue" },
  { key: "total_invoices", label: "الفواتير", icon: Receipt, color: "purple" },
  { key: "total_contractors", label: "المتعاملون", icon: UserCheck, color: "orange" },
  { key: "total_authorities", label: "المصالح المتعاقدة", icon: Building2, color: "indigo" },
  { key: "total_branches", label: "الفروع", icon: GitBranch, color: "cyan" },
  { key: "total_materials", label: "المواد الأولية", icon: Package, color: "yellow" },
  { key: "total_users", label: "المستخدمون النشطون", icon: Users, color: "rose" },
];

const NAV_BUTTONS = [
  { id: "monthly", label: "النشاط الشهري", icon: BarChart3 },
  { id: "recent", label: "آخر النشاطات", icon: Clock },
  { id: "materials", label: "توزيع المواد", icon: PieChartIcon },
  { id: "alerts", label: "التنبيهات", icon: AlertTriangle },
];

function MiniTable({ columns, rows, emptyMessage, renderRow }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="overflow-x-auto w-full">
        <table className="table-fixed w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700">
              {columns.map((col) => (
                <th
                  key={col}
                  className="font-bold text-sm tracking-wide px-3 py-2.5 text-right whitespace-nowrap text-slate-700 dark:text-slate-200"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-6 text-center text-sm text-slate-400 dark:text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map(renderRow)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function alertColor(daysLeft) {
  if (daysLeft <= 7) return "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400";
  if (daysLeft <= 15) return "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400";
  return "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30 text-yellow-700 dark:text-yellow-400";
}

function quantityColor(percentage) {
  if (percentage <= 5) return { bar: "bg-red-500", text: "text-red-700 dark:text-red-400", box: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30" };
  return { bar: "bg-orange-500", text: "text-orange-700 dark:text-orange-400", box: "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30" };
}

export default function DashboardPage() {
  const user = getUser();
  const [activeChart, setActiveChart] = useState("monthly");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [monthlyActivity, setMonthlyActivity] = useState([]);
  const [recentActivity, setRecentActivity] = useState({ receipts: [], invoices: [], deals: [] });
  const [alerts, setAlerts] = useState({ expiring_deals: [], low_quantity_materials: [] });
  const [materialsDistribution, setMaterialsDistribution] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [statsRes, monthlyRes, recentRes, alertsRes, materialsRes] = await Promise.all([
          getStats(),
          getMonthlyActivity(),
          getRecentActivity(),
          getAlerts(),
          getMaterialsDistribution(),
        ]);
        setStats(statsRes);
        setMonthlyActivity(monthlyRes);
        setRecentActivity(recentRes);
        setAlerts(alertsRes);
        setMaterialsDistribution(materialsRes);
      } catch (err) {
        setError(err.arabicMessage || "حدث خطأ أثناء تحميل الإحصائيات");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const monthlyData = useMemo(() => processMonthlyData(monthlyActivity), [monthlyActivity]);

  const materialsData = useMemo(
    () => materialsDistribution.filter((m) => m.count > 0),
    [materialsDistribution]
  );

  const alertsCount = alerts.expiring_deals.length + alerts.low_quantity_materials.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#1A5276" + "18" }}
          >
            <BarChart3 size={18} style={{ color: "#1A5276" }} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
              لوحة الإحصائيات
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 leading-tight">
              مرحباً {user?.full_name || ""} 👋
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
          <CalendarClock size={14} />
          {formatTodayArabic()}
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
            {/* Section 1: Overall stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {STAT_CARDS.map((c) => (
                <StatCard key={c.key} color={c.color} Icon={c.icon} label={c.label} value={stats?.[c.key]} />
              ))}
            </div>

            {/* Section 2: Navigation buttons */}
            <div className="flex flex-wrap gap-3">
              {NAV_BUTTONS.map((btn) => {
                const isActive = activeChart === btn.id;
                return (
                  <button
                    key={btn.id}
                    onClick={() => setActiveChart(btn.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <btn.icon size={16} />
                    {btn.label}
                    {btn.id === "alerts" && alertsCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">
                        {alertsCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Section 3: Dynamic content */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5">
              {activeChart === "monthly" && (
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">
                    النشاط الشهري - آخر 6 أشهر
                  </h3>
                  {monthlyData.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-16">
                      لا توجد بيانات نشاط لعرضها
                    </p>
                  ) : (
                    <div className="text-slate-800 dark:text-slate-100">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="deals" name="صفقات" fill="#16A34A" />
                          <Bar dataKey="receipts" name="وصولات" fill="#2563EB" />
                          <Bar dataKey="invoices" name="فواتير" fill="#9333EA" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {activeChart === "recent" && (
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">
                    آخر النشاطات
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">آخر الصفقات</h4>
                      <MiniTable
                        columns={["المرجع", "المتعامل", "البداية", "النهاية"]}
                        rows={recentActivity.deals}
                        emptyMessage="لا توجد صفقات بعد"
                        renderRow={(d) => (
                          <tr key={d.id} className="border-b border-slate-100 dark:border-slate-700">
                            <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-2.5 text-right whitespace-nowrap overflow-hidden text-ellipsis">{d.reference}</td>
                            <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-2.5 text-right whitespace-nowrap overflow-hidden text-ellipsis">{d.contractor_name}</td>
                            <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-2.5 text-right whitespace-nowrap">{formatDate(d.start_date)}</td>
                            <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-2.5 text-right whitespace-nowrap">{formatDate(d.end_date)}</td>
                          </tr>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">آخر الوصولات</h4>
                      <MiniTable
                        columns={["المرجع", "المتعامل", "الفرع", "التاريخ"]}
                        rows={recentActivity.receipts}
                        emptyMessage="لا توجد وصولات بعد"
                        renderRow={(r) => (
                          <tr key={r.id} className="border-b border-slate-100 dark:border-slate-700">
                            <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-2.5 text-right whitespace-nowrap overflow-hidden text-ellipsis">{r.reference}</td>
                            <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-2.5 text-right whitespace-nowrap overflow-hidden text-ellipsis">{r.contractor_name}</td>
                            <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-2.5 text-right whitespace-nowrap overflow-hidden text-ellipsis">{r.branch_name}</td>
                            <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-2.5 text-right whitespace-nowrap">{formatDate(r.receipt_date)}</td>
                          </tr>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">آخر الفواتير</h4>
                      <MiniTable
                        columns={["المرجع", "المتعامل", "التاريخ", "TTC"]}
                        rows={recentActivity.invoices}
                        emptyMessage="لا توجد فواتير بعد"
                        renderRow={(i) => (
                          <tr key={i.id} className="border-b border-slate-100 dark:border-slate-700">
                            <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-2.5 text-right whitespace-nowrap overflow-hidden text-ellipsis">{i.reference}</td>
                            <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-2.5 text-right whitespace-nowrap overflow-hidden text-ellipsis">{i.contractor_name}</td>
                            <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-2.5 text-right whitespace-nowrap">{formatDate(i.invoice_date)}</td>
                            <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-2.5 text-right whitespace-nowrap">{formatAmount(i.total_ttc)}</td>
                          </tr>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeChart === "materials" && (
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">
                    توزيع المواد الأولية حسب الصنف
                  </h3>
                  {materialsData.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-16">
                      لا توجد بيانات لعرضها
                    </p>
                  ) : (
                    <div className="text-slate-800 dark:text-slate-100">
                      <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie
                            data={materialsData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={140}
                            paddingAngle={2}
                            dataKey="count"
                            nameKey="category"
                          >
                            {materialsData.map((entry, index) => (
                              <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {activeChart === "alerts" && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    التنبيهات والتحذيرات
                  </h3>

                  <div>
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">
                      صفقات تنتهي قريباً
                    </h4>
                    {alerts.expiring_deals.length === 0 ? (
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg px-4 py-3">
                        لا توجد صفقات تنتهي قريباً
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {alerts.expiring_deals.map((d) => (
                          <div
                            key={d.id}
                            className={`rounded-lg border p-3.5 ${alertColor(d.days_left)}`}
                          >
                            <p className="font-bold text-sm mb-1">{d.reference}</p>
                            <p className="text-xs">ينتهي في: {formatDate(d.end_date)}</p>
                            <p className="text-xs font-medium mt-1">
                              متبقي {d.days_left} {d.days_left === 1 ? "يوم" : "أيام"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">
                      مواد بكميات منخفضة
                    </h4>
                    {alerts.low_quantity_materials.length === 0 ? (
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg px-4 py-3">
                        لا توجد مواد بكميات منخفضة
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {alerts.low_quantity_materials.map((m, idx) => {
                          const c = quantityColor(m.percentage);
                          return (
                            <div key={idx} className={`rounded-lg border p-3.5 ${c.box}`}>
                              <p className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">{m.name_ar}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                صفقة: {m.deal_reference}
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${c.bar}`}
                                    style={{ width: `${m.percentage}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-bold shrink-0 ${c.text}`}>{m.percentage}%</span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                                المتبقي: {formatAmount(m.remaining_qty)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
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
