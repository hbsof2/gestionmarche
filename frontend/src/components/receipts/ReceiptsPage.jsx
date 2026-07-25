"use client";
import { useState, useEffect } from "react";
import { Plus, FileText, Filter } from "lucide-react";
import ReceiptsList from "./ReceiptsList";
import ReceiptsFilter from "./ReceiptsFilter";
import ReceiptForm from "./ReceiptForm";
import ReceiptDeleteModal from "./ReceiptDeleteModal";
import ReceiptDetail from "./ReceiptDetail";
import { getAll, create, update, remove } from "@/services/receiptsService";

const COLOR = "#2471A3";

export default function ReceiptsPage({ activeService, onServiceChange }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [isFiltered, setIsFiltered] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editReceipt, setEditReceipt] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchReceipts = async (filters = activeFilters, q = search) => {
    setLoading(true);
    try {
      const result = await getAll({ search: q, ...filters });
      setReceipts(result.data);
      setIsFiltered(result.filtered);
    } catch {
      showToast("حدث خطأ أثناء تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReceipts({}, ""); }, []);

  useEffect(() => {
    if (activeService === "add") {
      setEditReceipt(null);
      setFormOpen(true);
    }
  }, [activeService]);

  const handleSearch = (q) => {
    setSearch(q);
    fetchReceipts(activeFilters, q);
  };

  const handleFilterApply = (filters) => {
    setActiveFilters(filters);
    fetchReceipts(filters, search);
  };

  const handleFilterClear = () => {
    setActiveFilters({});
    fetchReceipts({}, search);
  };

  const handleEdit = (receipt) => {
    setEditReceipt(receipt);
    setFormOpen(true);
  };

  const handleDeleteClick = (receipt) => setDeleteTarget(receipt);

  const handleView = (receipt) => setSelectedReceipt(receipt);

  const handleFormSave = async (data, id) => {
    try {
      if (id) {
        await update(id, data);
        showToast("تم تحديث الوصل بنجاح");
      } else {
        await create(data);
        showToast("تم إنشاء الوصل بنجاح");
      }
      setFormOpen(false);
      setEditReceipt(null);
      onServiceChange?.("list");
      fetchReceipts();
    } catch (err) {
      throw err;
    }
  };

  const handleFormCancel = () => {
    setFormOpen(false);
    setEditReceipt(null);
    onServiceChange?.("list");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    showToast("تم حذف الوصل بنجاح");
    setDeleteTarget(null);
    fetchReceipts();
  };

  if (selectedReceipt) {
    return (
      <div className="space-y-4">
        <ReceiptDetail receipt={selectedReceipt} onBack={() => setSelectedReceipt(null)} />

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

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: COLOR + "18" }}
          >
            <FileText size={18} style={{ color: COLOR }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">الوصولات</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">
              {receipts.length > 0 ? `${receipts.length} وصل معروض` : "إدارة الوصولات"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilter((prev) => !prev)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors shrink-0 ${
              isFiltered
                ? "border-blue-300 text-blue-600 dark:border-blue-500/40 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10"
                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            <Filter size={16} />
            فلترة
            {isFiltered && (
              <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => { setEditReceipt(null); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity shrink-0"
            style={{ backgroundColor: COLOR }}
          >
            <Plus size={16} />
            إنشاء وصل جديد
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <ReceiptsFilter
          isFiltered={isFiltered}
          resultCount={receipts.length}
          onFilter={handleFilterApply}
          onClearFilter={handleFilterClear}
        />
      )}

      {/* List */}
      <ReceiptsList
        receipts={receipts}
        loading={loading}
        search={search}
        onSearch={handleSearch}
        isFiltered={isFiltered}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        activeService={activeService}
      />

      {/* Form Modal */}
      {formOpen && (
        <ReceiptForm
          receipt={editReceipt}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <ReceiptDeleteModal
          receipt={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
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
