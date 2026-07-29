"use client";
import { useEffect, useRef } from "react";
import { Search, Eye, Trash2, Lightbulb, Lock } from "lucide-react";
import { getUser } from "@/lib/auth";

const COLOR = "#A93226";

function formatDate(isoDate) {
  if (!isoDate) return "-";
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function formatAmount(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "-";
  return `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} دج`;
}

export default function InvoicesList({
  invoices,
  loading,
  search,
  onSearch,
  isFiltered,
  onView,
  onDelete,
  activeService,
}) {
  const searchRef = useRef(null);
  const currentUser = getUser();

  useEffect(() => {
    if (activeService === "search") {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [activeService]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">

      {/* Search */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-2.5 w-full sm:max-w-xs">
          <Search size={15} className="text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="ابحث بالمرجع..."
            className="bg-transparent text-sm w-full outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div
            className="w-8 h-8 rounded-full border-2 border-slate-100 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: COLOR, borderWidth: "3px" }}
          />
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center mb-4">
            <Search size={22} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            {isFiltered ? "لا توجد فواتير تطابق معايير الفلترة المحددة" : "لا توجد فواتير بعد، قم بإنشاء فاتورة جديدة"}
          </p>
          {search && (
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">لا توجد نتائج لهذا البحث</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="table-fixed w-full min-w-[1220px] text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-700">
                <th className="w-12 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">#</th>
                <th className="w-44 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">المرجع</th>
                <th className="w-40 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400 hidden sm:table-cell">المتعامل المتعاقد</th>
                <th className="w-36 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400 hidden md:table-cell">المصلحة المتعاقدة</th>
                <th className="w-24 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400 hidden lg:table-cell">تاريخ البداية</th>
                <th className="w-24 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400 hidden lg:table-cell">تاريخ النهاية</th>
                <th className="w-24 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">تاريخ الفاتورة</th>
                <th className="w-32 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">المجموع HT</th>
                <th className="w-32 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">المجموع TTC</th>
                <th className="w-32 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400 hidden md:table-cell">أنشئ بواسطة</th>
                <th className="w-20 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const isOwner = inv.created_by === currentUser?.id || currentUser?.role === "admin";
                return (
                  <tr
                    key={inv.id}
                    onDoubleClick={() => onView(inv)}
                    title="انقر مرتين للاطلاع على الفاتورة"
                    className="cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-700"
                  >
                    <td className="w-12 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 font-mono">{inv.id}</td>
                    <td className="w-44 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100">{inv.reference}</td>
                    <td className="w-40 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 hidden sm:table-cell">{inv.contractor_name}</td>
                    <td className="w-36 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 hidden md:table-cell">{inv.authority_name}</td>
                    <td className="w-24 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 hidden lg:table-cell">{formatDate(inv.start_date)}</td>
                    <td className="w-24 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 hidden lg:table-cell">{formatDate(inv.end_date)}</td>
                    <td className="w-24 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100">{formatDate(inv.invoice_date)}</td>
                    <td className="w-32 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100">{formatAmount(inv.total_ht)}</td>
                    <td className="w-32 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100">{formatAmount(inv.total_ttc)}</td>
                    <td className="w-32 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 hidden md:table-cell">{inv.created_by_name || "-"}</td>
                    <td className="w-20 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); onView(inv); }}
                          className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors"
                          title="عرض"
                        >
                          <Eye size={15} />
                        </button>
                        {isOwner ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); onDelete(inv); }}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            title="حذف"
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : (
                          <span className="p-1.5">
                            <Lock size={15} className="text-slate-300 dark:text-slate-600" title="أنشئت بواسطة مستخدم آخر" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Keyboard navigation hint */}
      {!loading && invoices.length > 0 && (
        <div className="flex items-center justify-end gap-2 mt-2 px-4">
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
            نصيحة: انقر مرتين على الفاتورة للاطلاع عليها
          </span>
          <Lightbulb size={16} className="text-yellow-500 shrink-0" />
        </div>
      )}

      {/* Default (unfiltered) view note */}
      {!loading && !isFiltered && invoices.length > 0 && (
        <div className="flex items-center justify-end gap-2 mt-2 px-4 pb-4">
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
            يتم عرض آخر 10 فواتير فقط، استخدم الفلترة لعرض فواتير محددة
          </span>
          <Lightbulb size={16} className="text-yellow-500 shrink-0" />
        </div>
      )}
    </div>
  );
}
