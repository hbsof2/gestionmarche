"use client";
import { useState, useEffect } from "react";
import { Plus, GitBranch } from "lucide-react";
import AuthorityBranchesList from "./AuthorityBranchesList";
import AuthorityBranchForm from "./AuthorityBranchForm";
import AuthorityBranchDeleteModal from "./AuthorityBranchDeleteModal";
import { getAll, create, update, remove } from "@/services/authorityBranchesService";

const COLOR = "#6C3483";

export default function AuthorityBranchesPage({ activeService, onServiceChange }) {
  const [branches, setBranches] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBranches = async (page = 1, q = search) => {
    setLoading(true);
    try {
      const result = await getAll(page, q);
      setBranches(result.data);
      setPagination(result.pagination);
    } catch {
      showToast("حدث خطأ أثناء تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBranches(1, ""); }, []);

  useEffect(() => {
    if (activeService === "add") {
      setEditBranch(null);
      setFormOpen(true);
    }
  }, [activeService]);

  const handleSearch = (q) => {
    setSearch(q);
    fetchBranches(1, q);
  };

  const handlePageChange = (page) => fetchBranches(page, search);

  const handleEdit = (branch) => {
    setEditBranch(branch);
    setFormOpen(true);
  };

  const handleDeleteClick = (branch) => setDeleteTarget(branch);

  const handleFormSave = async (data, id) => {
    try {
      if (id) {
        await update(id, data);
        showToast("تم تحديث فرع المصلحة المتعاقدة بنجاح");
      } else {
        await create(data);
        showToast("تمت إضافة فرع المصلحة المتعاقدة بنجاح");
      }
      setFormOpen(false);
      setEditBranch(null);
      onServiceChange?.("list");
      fetchBranches(pagination.page, search);
    } catch (err) {
      throw err;
    }
  };

  const handleFormCancel = () => {
    setFormOpen(false);
    setEditBranch(null);
    onServiceChange?.("list");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    showToast("تم حذف فرع المصلحة المتعاقدة بنجاح");
    setDeleteTarget(null);
    const newPage = branches.length === 1 && pagination.page > 1
      ? pagination.page - 1
      : pagination.page;
    fetchBranches(newPage, search);
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
            <GitBranch size={18} style={{ color: COLOR }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 leading-tight">فروع المصلحة المتعاقدة</h2>
            <p className="text-xs text-slate-400 leading-tight">
              {(pagination?.total ?? 0) > 0 ? `${pagination.total} فرع مسجل` : "إدارة فروع المصلحة المتعاقدة"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setEditBranch(null); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity shrink-0"
            style={{ backgroundColor: COLOR }}
          >
            <Plus size={16} />
            إضافة فرع جديد
          </button>
        </div>
      </div>

      {/* List */}
      <AuthorityBranchesList
        branches={branches}
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
        <AuthorityBranchForm
          branch={editBranch}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <AuthorityBranchDeleteModal
          branch={deleteTarget}
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
