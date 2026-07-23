"use client";
import { useState, useEffect } from "react";
import { Plus, UserCheck } from "lucide-react";
import ContractorsList from "./ContractorsList";
import ContractorForm from "./ContractorForm";
import ContractorDeleteModal from "./ContractorDeleteModal";
import { getAll, create, update, remove } from "@/services/contractorsService";

const COLOR = "#B9770E";

export default function ContractorPage({ activeService, onServiceChange }) {
  const [contractors, setContractors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editContractor, setEditContractor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchContractors = async (page = 1, q = search) => {
    setLoading(true);
    try {
      const result = await getAll(page, q);
      setContractors(result.data);
      setPagination(result.pagination);
    } catch {
      showToast("حدث خطأ أثناء تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContractors(1, ""); }, []);

  useEffect(() => {
    if (activeService === "add") {
      setEditContractor(null);
      setFormOpen(true);
    }
  }, [activeService]);

  const handleSearch = (q) => {
    setSearch(q);
    fetchContractors(1, q);
  };

  const handlePageChange = (page) => fetchContractors(page, search);

  const handleEdit = (contractor) => {
    setEditContractor(contractor);
    setFormOpen(true);
  };

  const handleDeleteClick = (contractor) => setDeleteTarget(contractor);

  const handleFormSave = async (data, id) => {
    try {
      if (id) {
        await update(id, data);
        showToast("تم تحديث المتعامل المتعاقد بنجاح");
      } else {
        await create(data);
        showToast("تمت إضافة المتعامل المتعاقد بنجاح");
      }
      setFormOpen(false);
      setEditContractor(null);
      onServiceChange?.("list");
      fetchContractors(pagination.page, search);
    } catch (err) {
      throw err;
    }
  };

  const handleFormCancel = () => {
    setFormOpen(false);
    setEditContractor(null);
    onServiceChange?.("list");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    showToast("تم حذف المتعامل المتعاقد بنجاح");
    setDeleteTarget(null);
    const newPage = contractors.length === 1 && pagination.page > 1
      ? pagination.page - 1
      : pagination.page;
    fetchContractors(newPage, search);
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
            <UserCheck size={18} style={{ color: COLOR }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">المتعامل المتعاقد</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">
              {(pagination?.total ?? 0) > 0 ? `${pagination.total} متعامل مسجل` : "إدارة المتعاملين المتعاقدين"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setEditContractor(null); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity shrink-0"
            style={{ backgroundColor: COLOR }}
          >
            <Plus size={16} />
            إضافة متعامل جديد
          </button>
        </div>
      </div>

      {/* List */}
      <ContractorsList
        contractors={contractors}
        loading={loading}
        pagination={pagination}
        search={search}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        activeService={activeService}
      />

      {/* Form Modal */}
      {formOpen && (
        <ContractorForm
          contractor={editContractor}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <ContractorDeleteModal
          contractor={deleteTarget}
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
