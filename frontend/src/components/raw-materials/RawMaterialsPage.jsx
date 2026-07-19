"use client";
import { useState, useEffect } from "react";
import { Plus, Package } from "lucide-react";
import RawMaterialsList from "./RawMaterialsList";
import RawMaterialForm from "./RawMaterialForm";
import RawMaterialDeleteModal from "./RawMaterialDeleteModal";
import { getAll, create, update, remove } from "@/services/rawMaterialsService";

export default function RawMaterialsPage({ activeService, onServiceChange }) {
  const [materials, setMaterials] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editMaterial, setEditMaterial] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchMaterials = async (page = 1, q = search) => {
    setLoading(true);
    try {
      const result = await getAll(page, q);
      setMaterials(result.data);
      setPagination(result.pagination);
    } catch {
      showToast("حدث خطأ أثناء تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMaterials(1, ""); }, []);

  // Respond to top-bar service clicks from parent
  useEffect(() => {
    if (activeService === "add") {
      setEditMaterial(null);
      setFormOpen(true);
    }
  }, [activeService]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSearch = (q) => {
    setSearch(q);
    fetchMaterials(1, q);
  };

  const handlePageChange = (page) => fetchMaterials(page, search);

  const handleEdit = (material) => {
    setEditMaterial(material);
    setFormOpen(true);
  };

  const handleDeleteClick = (material) => setDeleteTarget(material);

  const handleFormSave = async (data, id) => {
    try {
      if (id) {
        await update(id, data);
        showToast("تم تحديث المادة بنجاح");
      } else {
        await create(data);
        showToast("تمت إضافة المادة بنجاح");
      }
      setFormOpen(false);
      setEditMaterial(null);
      onServiceChange?.("list");
      fetchMaterials(pagination.page, search);
    } catch (err) {
      throw err;
    }
  };

  const handleFormCancel = () => {
    setFormOpen(false);
    setEditMaterial(null);
    onServiceChange?.("list");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      showToast("تم حذف المادة بنجاح");
      setDeleteTarget(null);
      const newPage = materials.length === 1 && pagination.page > 1
        ? pagination.page - 1
        : pagination.page;
      fetchMaterials(newPage, search);
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
            style={{ backgroundColor: "#2D7A4F18" }}
          >
            <Package size={18} style={{ color: "#2D7A4F" }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 leading-tight">المواد الأولية</h2>
            <p className="text-xs text-slate-400 leading-tight">
              {(pagination?.total ?? 0) > 0 ? `${pagination.total} مادة مسجلة` : "إدارة المواد الأولية"}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditMaterial(null); setFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity shrink-0"
          style={{ backgroundColor: "#2D7A4F" }}
        >
          <Plus size={16} />
          إضافة مادة جديدة
        </button>
      </div>

      {/* List */}
      <RawMaterialsList
        materials={materials}
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
        <RawMaterialForm
          material={editMaterial}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <RawMaterialDeleteModal
          material={deleteTarget}
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
