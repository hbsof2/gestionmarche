"use client";
import { useEffect, useRef } from "react";
import { Search, Edit, Trash2, ChevronRight, ChevronLeft } from "lucide-react";

export default function RawMaterialsList({
  materials,
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
            placeholder="ابحث باسم المادة..."
            className="bg-transparent text-sm w-full outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div
            className="w-8 h-8 rounded-full border-2 border-slate-100 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: "#2D7A4F", borderWidth: "3px" }}
          />
        </div>
      ) : materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center mb-4">
            <Search size={22} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">لا توجد مواد أولية</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            {search ? "لا توجد نتائج لهذا البحث" : "ابدأ بإضافة مادة جديدة"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="table-fixed w-full text-sm min-w-[520px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-700">
                <th className="w-12 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">#</th>
                <th className="w-40 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">الاسم بالعربي</th>
                <th className="w-40 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400 hidden md:table-cell">الاسم باللاتيني</th>
                <th className="w-24 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">الوحدة</th>
                <th className="w-48 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400 hidden lg:table-cell">الوصف</th>
                <th className="w-20 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400 hidden sm:table-cell">الصورة</th>
                <th className="w-24 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {materials.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700">
                  <td className="w-12 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 font-mono">{m.id}</td>
                  <td className="w-40 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100">{m.name_ar}</td>
                  <td className="w-40 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 hidden md:table-cell">
                    {m.name_lat || <span className="text-slate-300 dark:text-slate-600">—</span>}
                  </td>
                  <td className="w-24 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800">
                      {m.unit}
                    </span>
                  </td>
                  <td className="w-48 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 hidden lg:table-cell">
                    <span className="line-clamp-1">
                      {m.description || <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </span>
                  </td>
                  <td className="w-20 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis hidden sm:table-cell">
                    {m.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.image_url}
                        alt={m.name_ar}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-100 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <span className="text-[9px] text-slate-400 dark:text-slate-500">لا صورة</span>
                      </div>
                    )}
                  </td>
                  <td className="w-24 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(m)}
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                        title="تعديل"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => onDelete(m)}
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
            {pagination.total} مادة — صفحة {pagination.page} من {pagination.totalPages}
          </span>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            {/* In RTL flex, first item appears on RIGHT */}
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
                style={p === pagination.page ? { backgroundColor: "#2D7A4F" } : {}}
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
