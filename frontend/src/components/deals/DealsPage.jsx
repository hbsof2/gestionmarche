"use client";
import { useState, useEffect } from "react";
import { Plus, Handshake } from "lucide-react";
import DealsList from "./DealsList";
import DealForm from "./DealForm";
import DealDeleteModal from "./DealDeleteModal";
import DealDetail from "./DealDetail";
import DealStats from "./DealStats";
import { getAll, create, update, remove } from "@/services/dealsService";

const COLOR = "#1E8449";

export default function DealsPage({ activeService, onServiceChange }) {
  const [deals, setDeals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editDeal, setEditDeal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [statsDeal, setStatsDeal] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDeals = async (page = 1, q = search) => {
    setLoading(true);
    try {
      const result = await getAll(page, q);
      setDeals(result.data);
      setPagination(result.pagination);
    } catch {
      showToast("حدث خطأ أثناء تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeals(1, ""); }, []);

  useEffect(() => {
    if (activeService === "add") {
      setEditDeal(null);
      setFormOpen(true);
    }
    if (activeService === "stats") {
      if (selectedRow) {
        setStatsDeal(selectedRow);
      } else {
        showToast("الرجاء تحديد صفقة أولاً بالضغط عليها", "error");
      }
      onServiceChange?.("list");
    }
  }, [activeService]);

  const handleSearch = (q) => {
    setSearch(q);
    fetchDeals(1, q);
  };

  const handlePageChange = (page) => fetchDeals(page, search);

  const handleEdit = (deal) => {
    setEditDeal(deal);
    setFormOpen(true);
  };

  const handleDeleteClick = (deal) => setDeleteTarget(deal);

  const handleView = (deal) => setSelectedDeal(deal);

  const handleStats = (deal) => setStatsDeal(deal);

  // Ctrl+F1: open the currently selected row, only while the deals section is mounted
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "F1") {
        e.preventDefault();
        if (selectedRow) handleView(selectedRow);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRow]);

  const handleFormSave = async (data, id) => {
    try {
      if (id) {
        await update(id, data);
        showToast("تم تحديث الصفقة بنجاح");
      } else {
        await create(data);
        showToast("تمت إضافة الصفقة بنجاح");
      }
      setFormOpen(false);
      setEditDeal(null);
      onServiceChange?.("list");
      fetchDeals(pagination.page, search);
    } catch (err) {
      throw err;
    }
  };

  const handleFormCancel = () => {
    setFormOpen(false);
    setEditDeal(null);
    onServiceChange?.("list");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    showToast("تم حذف الصفقة بنجاح");
    setDeleteTarget(null);
    const newPage = deals.length === 1 && pagination.page > 1
      ? pagination.page - 1
      : pagination.page;
    fetchDeals(newPage, search);
  };

  if (statsDeal) {
    return <DealStats dealId={statsDeal.id} onBack={() => setStatsDeal(null)} />;
  }

  if (selectedDeal) {
    return <DealDetail deal={selectedDeal} onBack={() => setSelectedDeal(null)} />;
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
            <Handshake size={18} style={{ color: COLOR }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">الصفقات</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">
              {(pagination?.total ?? 0) > 0 ? `${pagination.total} صفقة مسجلة` : "إدارة الصفقات"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setEditDeal(null); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity shrink-0"
            style={{ backgroundColor: COLOR }}
          >
            <Plus size={16} />
            إضافة صفقة جديدة
          </button>
        </div>
      </div>

      {/* List */}
      <DealsList
        deals={deals}
        loading={loading}
        pagination={pagination}
        search={search}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onStats={handleStats}
        activeService={activeService}
        selectedRow={selectedRow}
        onSelectRow={setSelectedRow}
      />

      {/* Form Modal */}
      {formOpen && (
        <DealForm
          deal={editDeal}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DealDeleteModal
          deal={deleteTarget}
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
