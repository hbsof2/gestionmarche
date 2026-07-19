"use client";
import { useState, useEffect } from "react";
import { Plus, Building2 } from "lucide-react";
import ContractingAuthoritiesList from "./ContractingAuthoritiesList";
import ContractingAuthorityForm from "./ContractingAuthorityForm";
import ContractingAuthorityDeleteModal from "./ContractingAuthorityDeleteModal";
import { getAll, create, update, remove } from "@/services/contractingAuthorityService";

const COLOR = "#1A5276";

export default function ContractingAuthorityPage({ activeService, onServiceChange }) {
  const [authorities, setAuthorities] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editAuthority, setEditAuthority] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAuthorities = async (page = 1, q = search) => {
    setLoading(true);
    try {
      const result = await getAll(page, q);
      setAuthorities(result.data);
      setPagination(result.pagination);
    } catch {
      showToast("حدث خطأ أثناء تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAuthorities(1, ""); }, []);

  useEffect(() => {
    if (activeService === "add") {
      setEditAuthority(null);
      setFormOpen(true);
    }
  }, [activeService]);

  const handleSearch = (q) => {
    setSearch(q);
    fetchAuthorities(1, q);
  };

  const handlePageChange = (page) => fetchAuthorities(page, search);

  const handleEdit = (authority) => {
    setEditAuthority(authority);
    setFormOpen(true);
  };

  const handleDeleteClick = (authority) => setDeleteTarget(authority);

  const handleFormSave = async (data, id) => {
    try {
      if (id) {
        await update(id, data);
        showToast("تم تحديث المصلحة المتعاقدة بنجاح");
      } else {
        await create(data);
        showToast("تمت إضافة المصلحة المتعاقدة بنجاح");
      }
      setFormOpen(false);
      setEditAuthority(null);
      onServiceChange?.("list");
      fetchAuthorities(pagination.page, search);
    } catch (err) {
      throw err;
    }
  };

  const handleFormCancel = () => {
    setFormOpen(false);
    setEditAuthority(null);
    onServiceChange?.("list");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      showToast("تم حذف المصلحة المتعاقدة بنجاح");
      setDeleteTarget(null);
      const newPage = authorities.length === 1 && pagination.page > 1
        ? pagination.page - 1
        : pagination.page;
      fetchAuthorities(newPage, search);
    } catch (err) {
      showToast(err.arabicMessage || "حدث خطأ أثناء الحذف", "error");
      setDeleteTarget(null);
    }
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
            <Building2 size={18} style={{ color: COLOR }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 leading-tight">المصلحة المتعاقدة</h2>
            <p className="text-xs text-slate-400 leading-tight">
              {(pagination?.total ?? 0) > 0 ? `${pagination.total} مصلحة مسجلة` : "إدارة المصلحة المتعاقدة"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setEditAuthority(null); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity shrink-0"
            style={{ backgroundColor: COLOR }}
          >
            <Plus size={16} />
            إضافة مصلحة جديدة
          </button>
        </div>
      </div>

      {/* List */}
      <ContractingAuthoritiesList
        authorities={authorities}
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
        <ContractingAuthorityForm
          authority={editAuthority}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <ContractingAuthorityDeleteModal
          authority={deleteTarget}
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
