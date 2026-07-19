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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">

      {/* Search */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2.5 w-full sm:max-w-xs">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="ابحث باسم المادة..."
            className="bg-transparent text-sm w-full outline-none text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div
            className="w-8 h-8 rounded-full border-2 border-slate-100 animate-spin"
            style={{ borderTopColor: "#2D7A4F", borderWidth: "3px" }}
          />
        </div>
      ) : materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <Search size={22} className="text-slate-300" />
          </div>
          <p className="text-slate-500 text-sm font-medium">لا توجد مواد أولية</p>
          <p className="text-slate-400 text-xs mt-1">
            {search ? "لا توجد نتائج لهذا البحث" : "ابدأ بإضافة مادة جديدة"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 w-12">#</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">الاسم بالعربي</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 hidden md:table-cell">الاسم باللاتيني</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">الوحدة</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 hidden lg:table-cell">الوصف</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 hidden sm:table-cell">الصورة</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {materials.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{m.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{m.name_ar}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                    {m.name_lat || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                      {m.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell max-w-[200px]">
                    <span className="line-clamp-1">
                      {m.description || <span className="text-slate-300">—</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {m.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.image_url}
                        alt={m.name_ar}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <span className="text-[9px] text-slate-400">لا صورة</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
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
        <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 order-2 sm:order-1">
            {pagination.total} مادة — صفحة {pagination.page} من {pagination.totalPages}
          </span>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            {/* In RTL flex, first item appears on RIGHT */}
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                    : "text-slate-500 hover:bg-slate-100"
                }`}
                style={p === pagination.page ? { backgroundColor: "#2D7A4F" } : {}}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
