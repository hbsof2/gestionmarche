"use client";
import { useEffect, useRef } from "react";
import { Search, Edit, Trash2, Tag } from "lucide-react";

export default function MaterialCategoriesList({
  categories,
  loading,
  search,
  onSearch,
  onEdit,
  onDelete,
}) {
  const searchRef = useRef(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("ar-DZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

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
            placeholder="ابحث باسم الصنف..."
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
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <Tag size={22} className="text-slate-300" />
          </div>
          <p className="text-slate-500 text-sm font-medium">لا توجد أصناف مسجلة</p>
          <p className="text-slate-400 text-xs mt-1">
            {search ? "لا توجد نتائج لهذا البحث" : "ابدأ بإضافة صنف جديد"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="table-fixed w-full text-sm min-w-[420px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="w-12 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500">#</th>
                <th className="w-56 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500">الاسم بالعربي</th>
                <th className="w-56 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 hidden md:table-cell">الاسم باللاتيني</th>
                <th className="w-40 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 hidden sm:table-cell">تاريخ الإضافة</th>
                <th className="w-24 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                  <td className="w-12 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 font-mono">{c.id}</td>
                  <td className="w-56 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800">{c.name_ar}</td>
                  <td className="w-56 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 hidden md:table-cell">
                    {c.name_lat || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="w-40 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 hidden sm:table-cell">
                    {formatDate(c.created_at)}
                  </td>
                  <td className="w-24 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800">
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

      {/* Row count */}
      {!loading && categories.length > 0 && (
        <div className="px-4 py-2.5 border-t border-slate-100">
          <span className="text-xs text-slate-400">{categories.length} صنف مسجل</span>
        </div>
      )}
    </div>
  );
}
