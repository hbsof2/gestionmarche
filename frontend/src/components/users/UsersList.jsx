"use client";
import { useEffect, useRef } from "react";
import { Search, Edit, KeyRound, Trash2 } from "lucide-react";

const COLOR = "#7D3C98";

const ROLE_BADGE = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  secondary: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
};

const ROLE_LABEL = {
  admin: "مدير رئيسي",
  secondary: "مستخدم ثانوي",
};

export default function UsersList({
  users,
  loading,
  search,
  onSearch,
  onEdit,
  onResetPassword,
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
            placeholder="ابحث بالاسم أو اسم المستخدم..."
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
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center mb-4">
            <Search size={22} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">لا يوجد مستخدمون</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            {search ? "لا توجد نتائج لهذا البحث" : "ابدأ بإضافة مستخدم جديد"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="table-fixed w-full min-w-[900px] text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-700">
                <th className="w-12 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">#</th>
                <th className="w-44 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">الاسم واللقب</th>
                <th className="w-32 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">اسم المستخدم</th>
                <th className="w-32 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400 hidden sm:table-cell">الهاتف</th>
                <th className="w-28 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">النوع</th>
                <th className="w-24 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">الحالة</th>
                <th className="w-36 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400 hidden lg:table-cell">أضيف بواسطة</th>
                <th className="w-32 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-700 transition-colors">
                  <td className="w-12 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 font-mono">{u.id}</td>
                  <td className="w-44 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100">{u.full_name}</td>
                  <td className="w-32 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100" dir="ltr">{u.username}</td>
                  <td className="w-32 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 hidden sm:table-cell" dir="ltr">{u.phone}</td>
                  <td className="w-28 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_BADGE[u.role]}`}>
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td className="w-24 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                      }`}
                    >
                      {u.is_active ? "نشط" : "معطل"}
                    </span>
                  </td>
                  <td className="w-36 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 hidden lg:table-cell">{u.created_by_name || "-"}</td>
                  <td className="w-32 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(u)}
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                        title="تعديل"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => onResetPassword(u)}
                        className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
                        title="إعادة تعيين كلمة السر"
                      >
                        <KeyRound size={15} />
                      </button>
                      <button
                        onClick={() => onDelete(u)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
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
    </div>
  );
}
