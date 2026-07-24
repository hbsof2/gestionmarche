"use client";
import { useState, useEffect } from "react";
import { Plus, FileText, X } from "lucide-react";
import ReceiptsList from "./ReceiptsList";
import ReceiptForm from "./ReceiptForm";
import ReceiptDeleteModal from "./ReceiptDeleteModal";
import { getAll, create, update, remove } from "@/services/receiptsService";

const COLOR = "#2471A3";

function formatDate(isoDate) {
  if (!isoDate) return "-";
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function ReceiptViewModal({ receipt, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{receipt.reference}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 dark:text-slate-500">الصفقة</span>
            <span className="font-medium text-slate-800 dark:text-slate-100">{receipt.deal_reference}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 dark:text-slate-500">المتعامل المتعاقد</span>
            <span className="font-medium text-slate-800 dark:text-slate-100">{receipt.contractor_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 dark:text-slate-500">المصلحة المتعاقدة</span>
            <span className="font-medium text-slate-800 dark:text-slate-100">{receipt.authority_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 dark:text-slate-500">الفرع</span>
            <span className="font-medium text-slate-800 dark:text-slate-100">{receipt.branch_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 dark:text-slate-500">تاريخ الوصل</span>
            <span className="font-medium text-slate-800 dark:text-slate-100">{formatDate(receipt.receipt_date)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReceiptsPage({ activeService, onServiceChange }) {
  const [receipts, setReceipts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editReceipt, setEditReceipt] = useState(null);
  const [viewReceipt, setViewReceipt] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchReceipts = async (page = 1, q = search) => {
    setLoading(true);
    try {
      const result = await getAll(page, q);
      setReceipts(result.data);
      setPagination(result.pagination);
    } catch {
      showToast("حدث خطأ أثناء تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReceipts(1, ""); }, []);

  useEffect(() => {
    if (activeService === "add") {
      setEditReceipt(null);
      setFormOpen(true);
    }
  }, [activeService]);

  const handleSearch = (q) => {
    setSearch(q);
    fetchReceipts(1, q);
  };

  const handlePageChange = (page) => fetchReceipts(page, search);

  const handleEdit = (receipt) => {
    setEditReceipt(receipt);
    setFormOpen(true);
  };

  const handleDeleteClick = (receipt) => setDeleteTarget(receipt);

  const handleView = (receipt) => setViewReceipt(receipt);

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
      fetchReceipts(pagination.page, search);
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
    const newPage = receipts.length === 1 && pagination.page > 1
      ? pagination.page - 1
      : pagination.page;
    fetchReceipts(newPage, search);
  };

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
              {(pagination?.total ?? 0) > 0 ? `${pagination.total} وصل مسجل` : "إدارة الوصولات"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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

      {/* List */}
      <ReceiptsList
        receipts={receipts}
        loading={loading}
        pagination={pagination}
        search={search}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
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

      {/* View Modal */}
      {viewReceipt && (
        <ReceiptViewModal receipt={viewReceipt} onClose={() => setViewReceipt(null)} />
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
