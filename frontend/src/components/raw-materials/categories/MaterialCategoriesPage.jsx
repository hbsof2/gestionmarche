"use client";
import { useState, useEffect } from "react";
import { Plus, Tag } from "lucide-react";
import MaterialCategoriesList from "./MaterialCategoriesList";
import MaterialCategoryForm from "./MaterialCategoryForm";
import MaterialCategoryDeleteModal from "./MaterialCategoryDeleteModal";
import { getAll, create, update, remove } from "@/services/materialCategoriesService";

export default function MaterialCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchCategories = async (q = search) => {
    setLoading(true);
    try {
      const data = await getAll(q);
      setCategories(data);
    } catch {
      showToast("حدث خطأ أثناء تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(""); }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSearch = (q) => {
    setSearch(q);
    fetchCategories(q);
  };

  const handleEdit = (category) => {
    setEditCategory(category);
    setFormOpen(true);
  };

  const handleFormSave = async (data, id) => {
    try {
      if (id) {
        await update(id, data);
        showToast("تم تحديث الصنف بنجاح");
      } else {
        await create(data);
        showToast("تمت إضافة الصنف بنجاح");
      }
      setFormOpen(false);
      setEditCategory(null);
      fetchCategories(search);
    } catch (err) {
      throw err;
    }
  };

  const handleFormCancel = () => {
    setFormOpen(false);
    setEditCategory(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      showToast("تم حذف الصنف بنجاح");
      setDeleteTarget(null);
      fetchCategories(search);
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
            <Tag size={17} style={{ color: "#2D7A4F" }} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 leading-tight">أصناف المواد الأولية</h3>
            <p className="text-xs text-slate-400 leading-tight">
              {categories.length > 0 ? `${categories.length} صنف مسجل` : "إدارة أصناف المواد"}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditCategory(null); setFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity shrink-0"
          style={{ backgroundColor: "#2D7A4F" }}
        >
          <Plus size={16} />
          إضافة صنف جديد
        </button>
      </div>

      {/* List */}
      <MaterialCategoriesList
        categories={categories}
        loading={loading}
        search={search}
        onSearch={handleSearch}
        onEdit={handleEdit}
        onDelete={(c) => setDeleteTarget(c)}
      />

      {/* Form Modal */}
      {formOpen && (
        <MaterialCategoryForm
          category={editCategory}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <MaterialCategoryDeleteModal
          category={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium whitespace-nowrap ${
            toast.type === "error" ? "bg-red-500" : "bg-green-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
