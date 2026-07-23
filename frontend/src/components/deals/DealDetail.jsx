"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { ArrowRight, Plus, Trash2, GitBranch, Search, ChevronDown } from "lucide-react";
import { getAll as getBranches } from "@/services/authorityBranchesService";
import {
  getDealBranches,
  addBranchToDeal,
  removeBranchFromDeal,
} from "@/services/dealsService";
import DealItems from "./DealItems";

const COLOR = "#1E8449";

function formatDate(isoDate) {
  if (!isoDate) return "-";
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function formatAmount(amount) {
  if (amount === null || amount === undefined || amount === "") return "غير محدد";
  const formatted = Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} دج`;
}

function BranchSearchableSelect({ options, onChange }) {
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

  const getLabel = (b) => `${b.name} - ${b.wilaya} - ${b.commune}`;

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => getLabel(o).toLowerCase().includes(q));
  }, [query, options]);

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm outline-none transition-colors flex items-center justify-between gap-2"
      >
        <span className="text-slate-400 dark:text-slate-500">-- اختر فرعاً لإضافته --</span>
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
                  className="w-full text-right px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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

export default function DealDetail({ deal, onBack }) {
  const [allBranches, setAllBranches] = useState([]);
  const [dealBranches, setDealBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDealBranches = async () => {
    setLoading(true);
    try {
      const rows = await getDealBranches(deal.id);
      setDealBranches(rows);
    } catch {
      showToast("حدث خطأ أثناء تحميل الفروع", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealBranches();
    getBranches(1, "", 1000).then((res) => setAllBranches(res.data || []));
  }, [deal.id]);

  const availableBranches = useMemo(() => {
    const addedIds = new Set(dealBranches.map((b) => b.branch_id));
    return allBranches.filter((b) => !addedIds.has(b.id));
  }, [allBranches, dealBranches]);

  const handleAddBranch = async () => {
    if (!selectedBranchId) return;
    setAdding(true);
    try {
      await addBranchToDeal(deal.id, selectedBranchId);
      showToast("تمت إضافة الفرع بنجاح");
      setSelectedBranchId(null);
      fetchDealBranches();
    } catch (err) {
      showToast(err.arabicMessage || "حدث خطأ أثناء إضافة الفرع", "error");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await removeBranchFromDeal(deal.id, deleteTarget.branch_id);
      showToast("تم حذف الفرع بنجاح");
      setDeleteTarget(null);
      fetchDealBranches();
    } catch (err) {
      showToast(err.arabicMessage || "حدث خطأ أثناء الحذف", "error");
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">

      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowRight size={16} />
        العودة إلى قائمة الصفقات
      </button>

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: COLOR + "18" }}
        >
          <GitBranch size={18} style={{ color: COLOR }} />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">{deal.reference}</h2>
      </div>

      {/* Info Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">المتعامل المتعاقد</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{deal.contractor_name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">المصلحة المتعاقدة</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{deal.authority_name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">تاريخ البداية</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatDate(deal.start_date)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">تاريخ النهاية</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatDate(deal.end_date)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">المبلغ الإجمالي</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatAmount(deal.total_amount)}</p>
          </div>
        </div>
      </div>

      {/* Branches Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3">فروع المصلحة المستفيدة</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <BranchSearchableSelect options={availableBranches} onChange={setSelectedBranchId} />
            <button
              onClick={handleAddBranch}
              disabled={!selectedBranchId || adding}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shrink-0 bg-green-600"
            >
              <Plus size={16} />
              إضافة الفرع
            </button>
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
        ) : dealBranches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center mb-4">
              <GitBranch size={22} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">لم يتم إضافة أي فرع لهذه الصفقة بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="table-fixed w-full min-w-[600px] text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-700">
                  <th className="w-12 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">#</th>
                  <th className="w-48 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">اسم الفرع</th>
                  <th className="w-28 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400 hidden sm:table-cell">الولاية</th>
                  <th className="w-28 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400 hidden md:table-cell">البلدية</th>
                  <th className="w-32 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400 hidden lg:table-cell">رقم الهاتف</th>
                  <th className="w-20 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-500 dark:text-slate-400">حذف</th>
                </tr>
              </thead>
              <tbody>
                {dealBranches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700">
                    <td className="w-12 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 font-mono">{b.id}</td>
                    <td className="w-48 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100">{b.name}</td>
                    <td className="w-28 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 hidden sm:table-cell">{b.wilaya}</td>
                    <td className="w-28 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 hidden md:table-cell">{b.commune}</td>
                    <td className="w-32 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100 hidden lg:table-cell" dir="ltr">{b.phone}</td>
                    <td className="w-20 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm text-slate-800 dark:text-slate-100">
                      <button
                        onClick={() => setDeleteTarget(b)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200 dark:border-slate-700" />

      {/* Deal Items Section */}
      <DealItems dealId={deal.id} dealReference={deal.reference} />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">تأكيد الحذف</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">هل أنت متأكد من حذف الفرع:</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">&quot;{deleteTarget.name}&quot;</p>
              {dealBranches.length <= 1 && (
                <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2 mb-4">
                  يجب أن تحتوي الصفقة على فرع واحد على الأقل
                </p>
              )}
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">لا يمكن التراجع عن هذا الإجراء</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={dealBranches.length <= 1}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  حذف
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-300 whitespace-nowrap ${
            toast.type === "error" ? "bg-red-500" : "bg-green-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
