"use client";
import { useEffect, useRef } from "react";
import { Search, Edit, Trash2, ChevronRight, ChevronLeft } from "lucide-react";

const COLOR = "#B9770E";

export default function ContractorsList({
  contractors,
  loading,
  pagination,
  search,
  onSearch,
  onPageChange,
  onEdit,
  onDelete,
  activeService,
}) {
  const searchRef = useRef(null);

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
            placeholder="ابحث بالإسم واللقب..."
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
      ) : contractors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center mb-4">
            <Search size={22} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">لا يوجد متعاملون متعاقدون</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            {search ? "لا توجد نتائج لهذا البحث" : "ابدأ بإضافة متعامل جديد"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="table-fixed w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-700">
                <th className="w-12 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">#</th>
                <th className="w-36 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">التعيين</th>
                <th className="w-44 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">الإسم واللقب</th>
                <th className="w-28 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-bold text-base tracking-wide text-slate-500 dark:text-slate-400 hidden md:table-cell">الولاية</th>
                <th className="w-28 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-bold text-base tracking-wide text-slate-500 dark:text-slate-400 hidden lg:table-cell">البلدية</th>
                <th className="w-32 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-bold text-base tracking-wide text-slate-500 dark:text-slate-400 hidden sm:table-cell">الهاتف الثابت</th>
                <th className="w-32 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-bold text-base tracking-wide text-slate-500 dark:text-slate-400 hidden lg:table-cell">الهاتف المحمول</th>
                <th className="w-24 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {contractors.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700">
                  <td className="w-12 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 font-mono">{c.id}</td>
                  <td className="w-36 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100">{c.designation}</td>
                  <td className="w-44 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100">{c.full_name}</td>
                  <td className="w-28 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 hidden md:table-cell">{c.wilaya}</td>
                  <td className="w-28 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 hidden lg:table-cell">{c.commune}</td>
                  <td className="w-32 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 hidden sm:table-cell" dir="ltr">{c.phone_fixed}</td>
                  <td className="w-32 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 hidden lg:table-cell" dir="ltr">{c.phone_mobile}</td>
                  <td className="w-24 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(c)}
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                        title="تعديل"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => onDelete(c)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
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

      {/* Pagination — in RTL: prev (higher page) on LEFT, next (lower) on RIGHT */}
      {!loading && pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 order-2 sm:order-1">
            {pagination.total} متعامل — صفحة {pagination.page} من {pagination.totalPages}
          </span>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
              return start + i;
            }).map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 text-xs rounded-lg font-medium transition-colors ${
                  p === pagination.page
                    ? "text-white"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
                style={p === pagination.page ? { backgroundColor: COLOR } : {}}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
